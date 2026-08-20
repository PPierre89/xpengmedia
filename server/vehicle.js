/**
 * Données du véhicule — batterie, autonomie, charge, position.
 *
 * ⚠️ État réel de l'API XPENG (vérifié en août 2026)
 * ──────────────────────────────────────────────────
 * XPENG ne publie AUCUNE API publique. Son portail open.xiaopeng.com est
 * géo-restreint et fermé par compte, et aucune documentation, spécification ni
 * SDK n'est disponible. Toutes les intégrations qui fonctionnent aujourd'hui
 * (Home Assistant, Homey, ABRP, evcc) passent par Enode, un agrégateur avec
 * qui XPENG a monté une API officielle soumise au consentement du
 * propriétaire. XPENG répond depuis des mois qu'une API directe temps réel est
 * « en développement ».
 *
 * Conséquence pour ce module : les endpoints, le format d'authentification et
 * l'éventuelle signature de requêtes du compte XPENG ne sont pas connus
 * publiquement. Les inventer produirait du code qui RESSEMBLE à une
 * intégration sans en être une.
 *
 * Le provider `xpeng` est donc un client HTTP complet mais **piloté par la
 * configuration** : vous renseignez les endpoints et le mappage des champs
 * dans les variables d'environnement, à partir d'une capture du trafic de
 * VOTRE application XPENG avec VOTRE compte — ou le jour où XPENG publie son
 * API. Toute la chaîne (coffre à identifiants, connexion, jeton,
 * rafraîchissement, cache, interface) est déjà là ; il ne manque que quatre
 * variables. Voir docs/VEHICULE.md.
 *
 * Le provider `demo` fournit un état simulé cohérent pour développer et tester
 * l'interface sans voiture ni compte.
 *
 * Modèle de sécurité :
 *   - les identifiants ne sont JAMAIS renvoyés par l'API, ni écrits dans les
 *     journaux : l'API est en écriture seule (on peut les poser, les
 *     remplacer, les effacer, jamais les relire) ;
 *   - ils sont stockés côté serveur en 0600, dans le volume de données, et ne
 *     touchent donc jamais le navigateur ni le localStorage ;
 *   - le jeton obtenu reste en mémoire du serveur ;
 *   - les réponses amont sont plafonnées en taille et en durée.
 *
 * Variables d'environnement :
 *   VEHICLE_PROVIDER     'demo' | 'xpeng' | 'off'      (défaut: off)
 *   VEHICLE_POLL_MS      Fraîcheur du cache            (défaut: 60000)
 *   XPENG_API_BASE       Racine de l'API               (ex. https://.../api)
 *   XPENG_LOGIN_PATH     Chemin de connexion           (défaut: /auth/login)
 *   XPENG_LOGIN_BODY     Corps JSON, avec {{account}} et {{password}}
 *   XPENG_TOKEN_FIELD    Chemin pointé du jeton        (défaut: data.token)
 *   XPENG_STATUS_PATH    Chemin de l'état du véhicule  (défaut: /vehicle/status)
 *   XPENG_AUTH_HEADER    En-tête d'auth, {{token}}     (défaut: Authorization: Bearer {{token}})
 *   XPENG_FIELD_MAP      JSON : champ → chemin pointé dans la réponse
 */

const CREDENTIALS_DOCUMENT = 'vehicle-credentials';
const UPSTREAM_TIMEOUT_MS = 15000;
const MAX_UPSTREAM_BYTES = 512 * 1024;

/** Forme normalisée renvoyée à l'application, quel que soit le provider. */
export function emptyState() {
  return {
    batteryPercent: null,
    rangeKm: null,
    charging: null,
    plugged: null,
    odometerKm: null,
    location: null,
    updatedAt: null,
    source: null,
  };
}

/** Lit `a.b.c` dans un objet, sans lever si un maillon manque. */
export function pick(object, dottedPath) {
  if (!dottedPath) return undefined;
  return dottedPath
    .split('.')
    .reduce((current, key) => (current == null ? undefined : current[key]), object);
}

const asNumber = (value) => {
  const parsed = typeof value === 'string' ? Number(value) : value;
  return typeof parsed === 'number' && Number.isFinite(parsed) ? parsed : null;
};

const asBoolean = (value) => {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') return value !== 0;
  if (typeof value === 'string') return /^(1|true|yes|on|charging)$/i.test(value);
  return null;
};

/**
 * Projette une réponse amont quelconque sur la forme normalisée, via un
 * mappage « champ → chemin pointé ».
 */
export function mapVehicleState(raw, fieldMap, source) {
  const state = emptyState();
  state.source = source;

  state.batteryPercent = asNumber(pick(raw, fieldMap.batteryPercent));
  state.rangeKm = asNumber(pick(raw, fieldMap.rangeKm));
  state.odometerKm = asNumber(pick(raw, fieldMap.odometerKm));
  state.charging = asBoolean(pick(raw, fieldMap.charging));
  state.plugged = asBoolean(pick(raw, fieldMap.plugged));

  const latitude = asNumber(pick(raw, fieldMap.latitude));
  const longitude = asNumber(pick(raw, fieldMap.longitude));
  if (latitude !== null && longitude !== null) {
    state.location = { latitude, longitude };
  }

  // Un pourcentage hors bornes signale un mauvais mappage : mieux vaut ne rien
  // afficher qu'une batterie à 4300 %.
  if (state.batteryPercent !== null && (state.batteryPercent < 0 || state.batteryPercent > 100)) {
    state.batteryPercent = null;
  }

  state.updatedAt = new Date().toISOString();
  return state;
}

/* ------------------------------------------------------------------ */
/* Provider de démonstration                                           */
/* ------------------------------------------------------------------ */

/**
 * État simulé mais cohérent : la batterie descend doucement, remonte quand la
 * voiture est branchée. Permet de développer l'interface sans voiture.
 */
export function createDemoProvider({ clock = Date.now } = {}) {
  return {
    id: 'demo',
    label: 'Démonstration',
    needsCredentials: false,
    isConfigured: () => true,
    async fetchState() {
      const minutes = Math.floor(clock() / 60000);
      const charging = minutes % 120 < 30;
      const cycle = minutes % 120;
      const batteryPercent = charging
        ? Math.round(40 + (cycle / 30) * 55)
        : Math.round(95 - ((cycle - 30) / 90) * 55);

      return {
        ...emptyState(),
        batteryPercent,
        rangeKm: Math.round(batteryPercent * 5.2),
        charging,
        plugged: charging,
        // Borné par le modulo : dérivé directement de l'epoch, le compteur
        // afficherait un demi-million de kilomètres.
        odometerKm: 12480 + (minutes % 720),
        location: { latitude: 48.8584, longitude: 2.2945 },
        updatedAt: new Date(clock()).toISOString(),
        source: 'demo',
      };
    },
  };
}

/* ------------------------------------------------------------------ */
/* Provider compte XPENG (piloté par la configuration)                 */
/* ------------------------------------------------------------------ */

const DEFAULT_FIELD_MAP = {
  batteryPercent: 'data.batteryPercent',
  rangeKm: 'data.rangeKm',
  charging: 'data.charging',
  plugged: 'data.plugged',
  odometerKm: 'data.odometerKm',
  latitude: 'data.location.latitude',
  longitude: 'data.location.longitude',
};

function renderTemplate(template, values) {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) =>
    key in values ? String(values[key]) : ''
  );
}

async function readJson(response) {
  const raw = await response.text();
  if (raw.length > MAX_UPSTREAM_BYTES) {
    throw new Error('réponse amont trop volumineuse');
  }
  try {
    return JSON.parse(raw);
  } catch {
    throw new Error('réponse amont illisible (JSON attendu)');
  }
}

/**
 * @param {object} config lu depuis l'environnement
 * @param {() => Promise<{account: string, password: string} | null>} readCredentials
 */
export function createXpengProvider(config, readCredentials, { fetchImpl = fetch } = {}) {
  let token = null;
  let tokenObtainedAt = 0;

  const fieldMap = { ...DEFAULT_FIELD_MAP, ...(config.fieldMap ?? {}) };

  const isConfigured = () => Boolean(config.apiBase);

  const request = async (path, { method = 'GET', body, headers = {} } = {}) => {
    const url = new URL(path, config.apiBase).toString();
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), UPSTREAM_TIMEOUT_MS);
    try {
      const response = await fetchImpl(url, {
        method,
        headers: { Accept: 'application/json', ...headers },
        body,
        signal: controller.signal,
      });
      if (!response.ok) {
        // Le corps peut contenir l'identifiant : on ne remonte que le statut.
        throw Object.assign(new Error(`l'API véhicule a répondu ${response.status}`), {
          statusCode: response.status === 401 || response.status === 403 ? 401 : 502,
        });
      }
      return await readJson(response);
    } finally {
      clearTimeout(timer);
    }
  };

  const login = async () => {
    const credentials = await readCredentials();
    if (!credentials) {
      throw Object.assign(new Error('aucun identifiant enregistré'), { statusCode: 428 });
    }

    const payload = renderTemplate(config.loginBody, {
      account: credentials.account,
      password: credentials.password,
    });

    const response = await request(config.loginPath, {
      method: 'POST',
      body: payload,
      headers: { 'Content-Type': 'application/json' },
    });

    const obtained = pick(response, config.tokenField);
    if (typeof obtained !== 'string' || obtained.length === 0) {
      throw Object.assign(
        new Error(
          `jeton introuvable dans la réponse de connexion (XPENG_TOKEN_FIELD="${config.tokenField}")`
        ),
        { statusCode: 502 }
      );
    }

    token = obtained;
    tokenObtainedAt = Date.now();
    return token;
  };

  return {
    id: 'xpeng',
    label: 'Compte XPENG',
    needsCredentials: true,
    isConfigured,

    /** Oublie le jeton en mémoire (changement d'identifiants, déconnexion). */
    forgetToken() {
      token = null;
      tokenObtainedAt = 0;
    },

    async fetchState() {
      if (!isConfigured()) {
        throw Object.assign(
          new Error(
            'provider XPENG non configuré : renseignez XPENG_API_BASE (voir docs/VEHICULE.md)'
          ),
          { statusCode: 501 }
        );
      }

      const call = async () => {
        const [headerName, headerTemplate] = config.authHeader;
        return request(config.statusPath, {
          headers: { [headerName]: renderTemplate(headerTemplate, { token }) },
        });
      };

      if (!token || Date.now() - tokenObtainedAt > config.tokenTtlMs) await login();

      let raw;
      try {
        raw = await call();
      } catch (error) {
        // Un jeton peut expirer plus tôt que prévu : on retente une fois après
        // reconnexion, puis on abandonne.
        if (error.statusCode !== 401) throw error;
        await login();
        raw = await call();
      }

      return mapVehicleState(raw, fieldMap, 'xpeng');
    },
  };
}

/* ------------------------------------------------------------------ */
/* Configuration + gestionnaires HTTP                                  */
/* ------------------------------------------------------------------ */

export function readVehicleConfig(env = process.env) {
  let fieldMap = {};
  if (env.XPENG_FIELD_MAP) {
    try {
      fieldMap = JSON.parse(env.XPENG_FIELD_MAP);
    } catch {
      console.warn('[vehicle] XPENG_FIELD_MAP illisible (JSON attendu), mappage par défaut utilisé');
    }
  }

  const rawAuthHeader = env.XPENG_AUTH_HEADER || 'Authorization: Bearer {{token}}';
  const separator = rawAuthHeader.indexOf(':');
  const authHeader =
    separator > 0
      ? [rawAuthHeader.slice(0, separator).trim(), rawAuthHeader.slice(separator + 1).trim()]
      : ['Authorization', rawAuthHeader.trim()];

  return {
    provider: (env.VEHICLE_PROVIDER || 'off').toLowerCase(),
    pollMs: Number(env.VEHICLE_POLL_MS || 60000),
    apiBase: env.XPENG_API_BASE || '',
    loginPath: env.XPENG_LOGIN_PATH || '/auth/login',
    loginBody: env.XPENG_LOGIN_BODY || '{"account":"{{account}}","password":"{{password}}"}',
    tokenField: env.XPENG_TOKEN_FIELD || 'data.token',
    statusPath: env.XPENG_STATUS_PATH || '/vehicle/status',
    authHeader,
    tokenTtlMs: Number(env.XPENG_TOKEN_TTL_MS || 30 * 60 * 1000),
    fieldMap,
  };
}

/**
 * Fabrique les gestionnaires HTTP de l'intégration véhicule.
 *
 * @param {object} options
 * @param {import('./store.js').JsonStore} options.store
 * @param {object} options.config
 */
export function createVehicleHandlers({ store, config, fetchImpl = fetch, clock = Date.now }) {
  const readCredentials = () => store.read(CREDENTIALS_DOCUMENT, null);

  const provider =
    config.provider === 'demo'
      ? createDemoProvider({ clock })
      : config.provider === 'xpeng'
        ? createXpengProvider(config, readCredentials, { fetchImpl })
        : null;

  /** Cache : l'app interroge souvent, l'API amont ne doit pas être matraquée. */
  let cache = { state: null, at: 0 };
  let inFlight = null;

  return {
    enabled: Boolean(provider),
    providerId: provider?.id ?? null,

    /** Ne révèle jamais les identifiants, seulement leur présence. */
    async status() {
      if (!provider) {
        return { enabled: false, provider: null, configured: false, hasCredentials: false };
      }
      const credentials = provider.needsCredentials ? await readCredentials() : null;
      return {
        enabled: true,
        provider: provider.id,
        label: provider.label,
        configured: provider.isConfigured(),
        needsCredentials: provider.needsCredentials,
        hasCredentials: Boolean(credentials),
        pollMs: config.pollMs,
        cachedAt: cache.at ? new Date(cache.at).toISOString() : null,
      };
    },

    async state({ force = false } = {}) {
      if (!provider) {
        throw Object.assign(new Error('intégration véhicule désactivée (VEHICLE_PROVIDER)'), {
          statusCode: 503,
        });
      }
      const now = clock();
      if (!force && cache.state && now - cache.at < config.pollMs) {
        return { ...cache.state, cached: true };
      }
      // Dix onglets ouverts ne doivent déclencher qu'un seul appel amont.
      if (!inFlight) {
        inFlight = provider
          .fetchState()
          .then((state) => {
            cache = { state, at: clock() };
            return state;
          })
          .finally(() => {
            inFlight = null;
          });
      }
      const state = await inFlight;
      return { ...state, cached: false };
    },

    /** Enregistre les identifiants (écriture seule). */
    async setCredentials(payload) {
      if (!provider?.needsCredentials) {
        throw Object.assign(new Error('ce provider ne demande pas d’identifiants'), {
          statusCode: 400,
        });
      }
      const account = typeof payload?.account === 'string' ? payload.account.trim() : '';
      const password = typeof payload?.password === 'string' ? payload.password : '';
      if (!account || !password) {
        throw Object.assign(new Error('« account » et « password » sont requis'), {
          statusCode: 400,
        });
      }
      await store.write(CREDENTIALS_DOCUMENT, { account, password }, { secret: true });
      provider.forgetToken?.();
      cache = { state: null, at: 0 };
      return { hasCredentials: true };
    },

    async clearCredentials() {
      const removed = await store.remove(CREDENTIALS_DOCUMENT);
      provider?.forgetToken?.();
      cache = { state: null, at: 0 };
      return { hasCredentials: false, removed };
    },
  };
}

/**
 * Synchronisation des préférences entre appareils — sur VOTRE serveur.
 *
 * L'application n'a plus de backend tiers depuis la v2.2 : le « cloud » ici,
 * c'est le conteneur qui tourne déjà sur le NAS. Les favoris, la région, le
 * thème et les statistiques d'usage passent de l'écran de la voiture au
 * téléphone et au navigateur du salon sans qu'aucune donnée ne transite par
 * Vercel, Firebase ou qui que ce soit d'autre.
 *
 * Protocole : un seul aller-retour. Le client envoie ce qu'il a, le serveur
 * fusionne et renvoie l'état complet. Pas de session, pas de WebSocket, pas de
 * numéro de version à suivre côté client.
 *
 * Résolution des conflits : dernier écrit gagnant, clé par clé, sur
 * l'horodatage `updatedAt` fourni par le client. Deux appareils qui modifient
 * des clés différentes ne se marchent jamais dessus ; deux appareils qui
 * modifient LA MÊME clé hors ligne, c'est le plus récent qui l'emporte — et
 * l'autre version est perdue. C'est le compromis assumé : pas de fusion à
 * trois voies pour des préférences.
 *
 * Suppressions : conservées en pierre tombale (`deleted: true`) pendant
 * TOMBSTONE_TTL_MS. Sans cela, un appareil resté hors ligne recréerait à la
 * synchronisation suivante un favori supprimé ailleurs.
 *
 * Variables d'environnement :
 *   API_TOKEN           Jeton partagé. Non défini = synchronisation désactivée.
 *   DATA_DIR            Dossier de données          (défaut: ./data)
 *   SYNC_ALLOW_SECRETS  'true' pour synchroniser aussi la configuration IPTV,
 *                       qui contient identifiant et mot de passe en clair
 *                       (défaut: false — voir README)
 */
import { safeEqual } from './store.js';

/** 30 jours : au-delà, un appareil resté éteint aussi longtemps repart du serveur. */
export const TOMBSTONE_TTL_MS = 30 * 24 * 60 * 60 * 1000;

export const MAX_BODY_BYTES = 1024 * 1024;
export const MAX_VALUE_BYTES = 256 * 1024;
export const MAX_KEYS = 64;

const DOCUMENT = 'sync';

/**
 * Clés autorisées. Une liste blanche plutôt qu'une liste noire : un client
 * bogué ou hostile ne peut pas remplir le disque du NAS avec des clés
 * arbitraires, et aucun secret ne peut être synchronisé par accident.
 */
export const SYNCABLE_KEYS = Object.freeze([
  'favorites',
  'favoriteCategories',
  'favoriteTags',
  'hiddenPlatforms',
  'xpeng_locale',
  'theme',
  'xpeng_usage_stats',
  'xpeng_web_notes_v2',
]);

/**
 * Clés contenant des identifiants. Hors synchronisation par défaut :
 * `iptvConfig` stocke l'URL, le nom d'utilisateur et le mot de passe de
 * l'abonnement IPTV en clair.
 */
export const SECRET_KEYS = Object.freeze(['iptvConfig']);

export function allowedKeys({ allowSecrets = false } = {}) {
  return allowSecrets ? [...SYNCABLE_KEYS, ...SECRET_KEYS] : [...SYNCABLE_KEYS];
}

const emptyDocument = () => ({ revision: 0, updatedAt: null, entries: {} });

/** Un horodatage client peut être absent, farfelu ou dans le futur. */
function normalizeTimestamp(value, now) {
  const parsed = typeof value === 'number' ? value : Date.parse(value ?? '');
  if (!Number.isFinite(parsed)) return now;
  // Une horloge d'avance ferait gagner cet appareil indéfiniment.
  return Math.min(parsed, now);
}

/**
 * Fusionne les entrées d'un client dans le document du serveur.
 *
 * Fonction pure : c'est elle que testent `server/sync.test.mjs`, sans disque
 * ni serveur HTTP.
 *
 * @returns {{ document: object, applied: number, rejected: string[] }}
 */
export function mergeEntries(document, incoming, { now = Date.now(), keys = SYNCABLE_KEYS } = {}) {
  const merged = {
    revision: document?.revision ?? 0,
    updatedAt: document?.updatedAt ?? null,
    entries: { ...(document?.entries ?? {}) },
  };
  const permitted = new Set(keys);
  const rejected = [];
  let applied = 0;

  for (const [key, entry] of Object.entries(incoming ?? {})) {
    if (!permitted.has(key)) {
      rejected.push(key);
      continue;
    }
    if (!entry || typeof entry !== 'object') {
      rejected.push(key);
      continue;
    }

    const deleted = entry.deleted === true;
    const updatedAt = normalizeTimestamp(entry.updatedAt, now);

    if (!deleted) {
      const size = Buffer.byteLength(JSON.stringify(entry.value ?? null));
      if (size > MAX_VALUE_BYTES) {
        rejected.push(key);
        continue;
      }
    }

    const current = merged.entries[key];
    // À horodatage égal, on garde le serveur : la fusion reste déterministe
    // quel que soit l'ordre d'arrivée de deux clients.
    if (current && current.updatedAt >= updatedAt) continue;

    merged.entries[key] = deleted
      ? { deleted: true, updatedAt }
      : { value: entry.value ?? null, updatedAt };
    applied += 1;
  }

  // Purge des pierres tombales expirées.
  for (const [key, entry] of Object.entries(merged.entries)) {
    if (entry.deleted && now - entry.updatedAt > TOMBSTONE_TTL_MS) {
      delete merged.entries[key];
    }
  }

  if (Object.keys(merged.entries).length > MAX_KEYS) {
    // Impossible avec la liste blanche actuelle, mais la garde survit à son
    // élargissement.
    throw Object.assign(new Error('trop de clés synchronisées'), { statusCode: 413 });
  }

  if (applied > 0) {
    merged.revision += 1;
    merged.updatedAt = new Date(now).toISOString();
  }

  return { document: merged, applied, rejected };
}

/** Retire les pierres tombales expirées d'un document lu sur disque. */
function withoutExpiredTombstones(document, now) {
  const entries = Object.fromEntries(
    Object.entries(document.entries ?? {}).filter(
      ([, entry]) => !entry.deleted || now - entry.updatedAt <= TOMBSTONE_TTL_MS
    )
  );
  return { ...document, entries };
}

/**
 * Fabrique les gestionnaires HTTP de la synchronisation.
 *
 * @param {object} options
 * @param {import('./store.js').JsonStore} options.store
 * @param {string} [options.token]        API_TOKEN
 * @param {boolean} [options.allowSecrets]
 */
export function createSyncHandlers({ store, token, allowSecrets = false }) {
  const enabled = Boolean(token);
  const keys = allowedKeys({ allowSecrets });

  const authorize = (req) => {
    const header = req.headers.authorization ?? '';
    const presented = header.startsWith('Bearer ') ? header.slice(7).trim() : '';
    return safeEqual(presented, token ?? '');
  };

  return {
    enabled,
    keys,

    /** État de la synchronisation — ne révèle jamais le jeton. */
    async status() {
      if (!enabled) return { enabled: false, keys };
      const document = (await store.read(DOCUMENT, emptyDocument())) ?? emptyDocument();
      return {
        enabled: true,
        keys,
        revision: document.revision ?? 0,
        updatedAt: document.updatedAt ?? null,
        storedKeys: Object.keys(document.entries ?? {}).length,
      };
    },

    /**
     * Pousse et récupère en un seul appel.
     * @param {object} payload corps déjà analysé de la requête
     */
    async sync(payload) {
      const now = Date.now();
      const incoming = payload?.entries ?? {};

      const result = await store.update(DOCUMENT, emptyDocument(), (current) => {
        const { document } = mergeEntries(current ?? emptyDocument(), incoming, { now, keys });
        return document;
      });

      const rejected = Object.keys(incoming).filter((key) => !keys.includes(key));

      return {
        revision: result.revision,
        updatedAt: result.updatedAt,
        serverTime: new Date(now).toISOString(),
        entries: result.entries,
        ...(rejected.length ? { rejected } : {}),
      };
    },

    /** Récupération seule. */
    async pull() {
      const now = Date.now();
      const document = (await store.read(DOCUMENT, emptyDocument())) ?? emptyDocument();
      const clean = withoutExpiredTombstones(document, now);
      return {
        revision: clean.revision ?? 0,
        updatedAt: clean.updatedAt ?? null,
        serverTime: new Date(now).toISOString(),
        entries: clean.entries ?? {},
      };
    },

    /** Efface l'état synchronisé côté serveur. */
    async reset() {
      await store.write(DOCUMENT, emptyDocument());
      return { revision: 0, entries: {} };
    },

    authorize,
  };
}

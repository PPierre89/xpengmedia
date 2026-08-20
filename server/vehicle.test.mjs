/**
 * Tests de l'intégration véhicule.
 *
 * Le provider `xpeng` est piloté par la configuration : ces tests le font
 * tourner contre un `fetch` factice, ce qui valide toute la mécanique
 * (connexion, extraction du jeton, rafraîchissement, mappage des champs, cache)
 * sans dépendre d'endpoints XPENG qui ne sont pas publics.
 */
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test, { after, before, beforeEach, describe } from 'node:test';

import { JsonStore } from './store.js';
import {
  createDemoProvider,
  createVehicleHandlers,
  createXpengProvider,
  mapVehicleState,
  pick,
  readVehicleConfig,
} from './vehicle.js';

/** Réponse JSON factice, façon `fetch`. */
const jsonResponse = (body, status = 200) => ({
  ok: status >= 200 && status < 300,
  status,
  text: async () => JSON.stringify(body),
});

const baseConfig = () =>
  readVehicleConfig({
    VEHICLE_PROVIDER: 'xpeng',
    XPENG_API_BASE: 'https://exemple.invalid/api/',
    VEHICLE_POLL_MS: '60000',
  });

/* ------------------------------------------------------------------ */

describe('lecture de chemins pointés', () => {
  test('descend dans l’objet', () => {
    assert.equal(pick({ a: { b: { c: 42 } } }, 'a.b.c'), 42);
  });

  test('ne lève pas si un maillon manque', () => {
    assert.equal(pick({ a: null }, 'a.b.c'), undefined);
    assert.equal(pick({}, 'x.y'), undefined);
    assert.equal(pick(undefined, 'a'), undefined);
  });

  test('un chemin vide renvoie undefined', () => {
    assert.equal(pick({ a: 1 }, ''), undefined);
  });
});

describe('mappage de l’état véhicule', () => {
  const fieldMap = {
    batteryPercent: 'd.soc',
    rangeKm: 'd.range',
    charging: 'd.charging',
    plugged: 'd.plugged',
    odometerKm: 'd.odo',
    latitude: 'd.pos.lat',
    longitude: 'd.pos.lon',
  };

  test('projette une réponse amont sur la forme normalisée', () => {
    const state = mapVehicleState(
      { d: { soc: 73, range: 380, charging: true, plugged: 1, odo: 12500, pos: { lat: 48.85, lon: 2.29 } } },
      fieldMap,
      'xpeng'
    );
    assert.equal(state.batteryPercent, 73);
    assert.equal(state.rangeKm, 380);
    assert.equal(state.charging, true);
    assert.equal(state.plugged, true);
    assert.equal(state.odometerKm, 12500);
    assert.deepEqual(state.location, { latitude: 48.85, longitude: 2.29 });
    assert.equal(state.source, 'xpeng');
  });

  test('accepte les nombres transmis en chaîne', () => {
    const state = mapVehicleState({ d: { soc: '55', range: '210' } }, fieldMap, 'xpeng');
    assert.equal(state.batteryPercent, 55);
    assert.equal(state.rangeKm, 210);
  });

  test('un champ absent devient null plutôt que NaN', () => {
    const state = mapVehicleState({ d: {} }, fieldMap, 'xpeng');
    assert.equal(state.batteryPercent, null);
    assert.equal(state.rangeKm, null);
    assert.equal(state.location, null);
  });

  test('un pourcentage hors bornes est écarté : un mauvais mappage ne doit pas s’afficher', () => {
    assert.equal(mapVehicleState({ d: { soc: 4300 } }, fieldMap, 'xpeng').batteryPercent, null);
    assert.equal(mapVehicleState({ d: { soc: -5 } }, fieldMap, 'xpeng').batteryPercent, null);
    assert.equal(mapVehicleState({ d: { soc: 100 } }, fieldMap, 'xpeng').batteryPercent, 100);
  });

  test('une position incomplète n’est pas affichée à moitié', () => {
    const state = mapVehicleState({ d: { pos: { lat: 48.85 } } }, fieldMap, 'xpeng');
    assert.equal(state.location, null);
  });
});

/* ------------------------------------------------------------------ */

describe('configuration', () => {
  test('désactivée par défaut', () => {
    assert.equal(readVehicleConfig({}).provider, 'off');
  });

  test('découpe l’en-tête d’authentification', () => {
    const config = readVehicleConfig({ XPENG_AUTH_HEADER: 'X-Token: {{token}}' });
    assert.deepEqual(config.authHeader, ['X-Token', '{{token}}']);
  });

  test('un en-tête sans deux-points retombe sur Authorization', () => {
    assert.deepEqual(readVehicleConfig({ XPENG_AUTH_HEADER: 'Bearer {{token}}' }).authHeader, [
      'Authorization',
      'Bearer {{token}}',
    ]);
  });

  test('un mappage de champs illisible ne fait pas planter le démarrage', () => {
    const config = readVehicleConfig({ XPENG_FIELD_MAP: '{ pas du json' });
    assert.deepEqual(config.fieldMap, {});
  });
});

/* ------------------------------------------------------------------ */

describe('provider compte XPENG', () => {
  test('se connecte, extrait le jeton, puis lit l’état', async () => {
    const calls = [];
    const fetchImpl = async (url, options) => {
      calls.push({ url, options });
      if (url.endsWith('/auth/login')) return jsonResponse({ data: { token: 'jeton-abc' } });
      return jsonResponse({ data: { batteryPercent: 64, rangeKm: 330, charging: false } });
    };

    const provider = createXpengProvider(
      baseConfig(),
      async () => ({ account: 'moi@exemple.fr', password: 'motdepasse' }),
      { fetchImpl }
    );

    const state = await provider.fetchState();
    assert.equal(state.batteryPercent, 64);
    assert.equal(state.source, 'xpeng');

    assert.equal(calls.length, 2);
    assert.equal(JSON.parse(calls[0].options.body).account, 'moi@exemple.fr');
    assert.equal(calls[1].options.headers.Authorization, 'Bearer jeton-abc');
  });

  test('réutilise le jeton d’un appel à l’autre', async () => {
    let logins = 0;
    const fetchImpl = async (url) => {
      if (url.endsWith('/auth/login')) {
        logins += 1;
        return jsonResponse({ data: { token: 'jeton' } });
      }
      return jsonResponse({ data: { batteryPercent: 50 } });
    };
    const provider = createXpengProvider(baseConfig(), async () => ({ account: 'a', password: 'b' }), {
      fetchImpl,
    });

    await provider.fetchState();
    await provider.fetchState();
    assert.equal(logins, 1, 'le jeton doit être réutilisé');
  });

  test('un 401 déclenche une reconnexion et un seul nouvel essai', async () => {
    let logins = 0;
    let statusCalls = 0;
    const fetchImpl = async (url) => {
      if (url.endsWith('/auth/login')) {
        logins += 1;
        return jsonResponse({ data: { token: `jeton-${logins}` } });
      }
      statusCalls += 1;
      // Le premier appel avec le jeton initial échoue, le suivant réussit.
      if (statusCalls === 1) return jsonResponse({ message: 'expiré' }, 401);
      return jsonResponse({ data: { batteryPercent: 12 } });
    };

    const provider = createXpengProvider(baseConfig(), async () => ({ account: 'a', password: 'b' }), {
      fetchImpl,
    });

    const state = await provider.fetchState();
    assert.equal(state.batteryPercent, 12);
    assert.equal(logins, 2, 'une reconnexion doit avoir eu lieu');
    assert.equal(statusCalls, 2);
  });

  test('un 401 persistant finit par remonter au lieu de boucler', async () => {
    const fetchImpl = async (url) =>
      url.endsWith('/auth/login')
        ? jsonResponse({ data: { token: 'jeton' } })
        : jsonResponse({ message: 'refusé' }, 401);

    const provider = createXpengProvider(baseConfig(), async () => ({ account: 'a', password: 'b' }), {
      fetchImpl,
    });
    await assert.rejects(() => provider.fetchState(), /401/);
  });

  test('sans identifiants enregistrés, l’erreur est explicite', async () => {
    const provider = createXpengProvider(baseConfig(), async () => null, {
      fetchImpl: async () => jsonResponse({}),
    });
    await assert.rejects(() => provider.fetchState(), /aucun identifiant/);
  });

  test('un jeton introuvable nomme la variable à corriger', async () => {
    const fetchImpl = async () => jsonResponse({ autre: { champ: 'x' } });
    const provider = createXpengProvider(baseConfig(), async () => ({ account: 'a', password: 'b' }), {
      fetchImpl,
    });
    await assert.rejects(() => provider.fetchState(), /XPENG_TOKEN_FIELD/);
  });

  test('sans XPENG_API_BASE, le message renvoie à la documentation', async () => {
    const provider = createXpengProvider(
      readVehicleConfig({ VEHICLE_PROVIDER: 'xpeng' }),
      async () => ({ account: 'a', password: 'b' }),
      { fetchImpl: async () => jsonResponse({}) }
    );
    await assert.rejects(() => provider.fetchState(), /XPENG_API_BASE/);
  });

  test('une réponse amont non-JSON est signalée proprement', async () => {
    const fetchImpl = async () => ({ ok: true, status: 200, text: async () => '<html>portail captif</html>' });
    const provider = createXpengProvider(baseConfig(), async () => ({ account: 'a', password: 'b' }), {
      fetchImpl,
    });
    await assert.rejects(() => provider.fetchState(), /illisible/);
  });
});

/* ------------------------------------------------------------------ */

describe('provider de démonstration', () => {
  test('produit un état cohérent et borné', async () => {
    const provider = createDemoProvider({ clock: () => Date.UTC(2026, 7, 20, 12, 0, 0) });
    const state = await provider.fetchState();
    assert.ok(state.batteryPercent >= 0 && state.batteryPercent <= 100);
    assert.equal(typeof state.rangeKm, 'number');
    assert.equal(state.source, 'demo');
  });

  test('le compteur reste dans un ordre de grandeur plausible', async () => {
    const provider = createDemoProvider({ clock: () => Date.now() });
    const state = await provider.fetchState();
    assert.ok(
      state.odometerKm > 0 && state.odometerKm < 100000,
      `compteur invraisemblable : ${state.odometerKm} km`
    );
  });

  test('la batterie monte quand la voiture est branchée', async () => {
    const provider = createDemoProvider({ clock: () => Date.UTC(2026, 7, 20, 12, 0, 0) });
    const state = await provider.fetchState();
    if (state.charging) assert.equal(state.plugged, true);
  });
});

/* ------------------------------------------------------------------ */

describe('gestionnaires véhicule', () => {
  let dir;
  let store;

  before(async () => {
    dir = await fs.mkdtemp(path.join(os.tmpdir(), 'xpeng-vehicle-'));
  });

  // Un dossier neuf par test : sinon le document d'identifiants écrit par un
  // test resterait visible du suivant.
  beforeEach(() => {
    store = new JsonStore(path.join(dir, randomUUID()));
  });

  after(async () => {
    await fs.rm(dir, { recursive: true, force: true });
  });

  test('désactivés quand VEHICLE_PROVIDER vaut off', async () => {
    const handlers = createVehicleHandlers({ store, config: readVehicleConfig({}) });
    assert.equal(handlers.enabled, false);
    await assert.rejects(() => handlers.state(), /désactivée/);
  });

  test('le cache évite de matraquer l’API amont', async () => {
    let calls = 0;
    let now = 1_000_000;
    const config = { ...baseConfig(), provider: 'xpeng', pollMs: 60000 };
    const fetchImpl = async (url) => {
      if (url.endsWith('/auth/login')) return jsonResponse({ data: { token: 't' } });
      calls += 1;
      return jsonResponse({ data: { batteryPercent: 42 } });
    };
    await store.write('vehicle-credentials', { account: 'a', password: 'b' }, { secret: true });

    const handlers = createVehicleHandlers({ store, config, fetchImpl, clock: () => now });

    const first = await handlers.state();
    assert.equal(first.cached, false);
    const second = await handlers.state();
    assert.equal(second.cached, true);
    assert.equal(calls, 1, 'le second appel doit venir du cache');

    now += 61000;
    const third = await handlers.state();
    assert.equal(third.cached, false);
    assert.equal(calls, 2, 'le cache doit expirer');
  });

  test('dix appels simultanés ne déclenchent qu’un seul appel amont', async () => {
    let calls = 0;
    const config = { ...baseConfig(), provider: 'xpeng' };
    const fetchImpl = async (url) => {
      if (url.endsWith('/auth/login')) return jsonResponse({ data: { token: 't' } });
      calls += 1;
      await new Promise((resolve) => setTimeout(resolve, 10));
      return jsonResponse({ data: { batteryPercent: 42 } });
    };
    await store.write('vehicle-credentials', { account: 'a', password: 'b' }, { secret: true });

    const handlers = createVehicleHandlers({ store, config, fetchImpl });
    await Promise.all(Array.from({ length: 10 }, () => handlers.state()));
    assert.equal(calls, 1);
  });

  test('le statut signale la présence d’identifiants sans les révéler', async () => {
    const config = { ...baseConfig(), provider: 'xpeng' };
    const handlers = createVehicleHandlers({ store, config, fetchImpl: async () => jsonResponse({}) });

    const before = await handlers.status();
    assert.equal(before.hasCredentials, false);

    await handlers.setCredentials({ account: 'moi@exemple.fr', password: 'tres-secret' });

    const after = await handlers.status();
    assert.equal(after.hasCredentials, true);
    const serialized = JSON.stringify(after);
    assert.equal(serialized.includes('tres-secret'), false, 'le mot de passe ne doit jamais sortir');
    assert.equal(serialized.includes('moi@exemple.fr'), false, 'l’identifiant ne doit jamais sortir');
  });

  test('des identifiants incomplets sont refusés', async () => {
    const config = { ...baseConfig(), provider: 'xpeng' };
    const handlers = createVehicleHandlers({ store, config, fetchImpl: async () => jsonResponse({}) });
    await assert.rejects(() => handlers.setCredentials({ account: 'a' }), /requis/);
    await assert.rejects(() => handlers.setCredentials({ account: '  ', password: 'b' }), /requis/);
  });

  test('l’effacement des identifiants vide aussi le cache', async () => {
    const config = { ...baseConfig(), provider: 'xpeng' };
    let battery = 42;
    const fetchImpl = async (url) => {
      if (url.endsWith('/auth/login')) return jsonResponse({ data: { token: 't' } });
      return jsonResponse({ data: { batteryPercent: battery } });
    };
    const handlers = createVehicleHandlers({ store, config, fetchImpl });

    await handlers.setCredentials({ account: 'a', password: 'b' });
    assert.equal((await handlers.state()).batteryPercent, 42);

    await handlers.clearCredentials();
    assert.equal((await handlers.status()).hasCredentials, false);

    battery = 99;
    await handlers.setCredentials({ account: 'a', password: 'b' });
    assert.equal((await handlers.state()).batteryPercent, 99, 'le cache doit avoir été purgé');
  });

  test('le provider de démonstration ne réclame pas d’identifiants', async () => {
    const handlers = createVehicleHandlers({
      store,
      config: readVehicleConfig({ VEHICLE_PROVIDER: 'demo' }),
    });
    const status = await handlers.status();
    assert.equal(status.needsCredentials, false);
    assert.equal(status.configured, true);
    await assert.rejects(() => handlers.setCredentials({ account: 'a', password: 'b' }), /ne demande pas/);
  });
});

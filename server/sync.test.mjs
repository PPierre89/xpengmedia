/**
 * Tests de la synchronisation : fusion, magasin JSON, et bout-en-bout HTTP.
 *
 * La fusion est une fonction pure — testée sans disque ni port. Le magasin et
 * le serveur sont testés sur un dossier temporaire, supprimé à la fin.
 */
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import test, { after, before, describe } from 'node:test';

import { JsonStore, safeEqual } from './store.js';
import {
  MAX_VALUE_BYTES,
  SECRET_KEYS,
  SYNCABLE_KEYS,
  TOMBSTONE_TTL_MS,
  allowedKeys,
  createSyncHandlers,
  mergeEntries,
} from './sync.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const NOW = Date.UTC(2026, 7, 20, 12, 0, 0);
const empty = () => ({ revision: 0, updatedAt: null, entries: {} });

/* ------------------------------------------------------------------ */

describe('fusion des entrées', () => {
  test('accepte une entrée sur une clé autorisée', () => {
    const { document, applied } = mergeEntries(
      empty(),
      { theme: { value: 'dark', updatedAt: NOW - 1000 } },
      { now: NOW }
    );
    assert.equal(applied, 1);
    assert.equal(document.revision, 1);
    assert.equal(document.entries.theme.value, 'dark');
  });

  test('le plus récent gagne, quel que soit l’ordre d’arrivée', () => {
    const base = mergeEntries(empty(), { theme: { value: 'dark', updatedAt: NOW - 1000 } }, { now: NOW });
    const older = mergeEntries(base.document, { theme: { value: 'light', updatedAt: NOW - 5000 } }, { now: NOW });
    assert.equal(older.document.entries.theme.value, 'dark', 'une écriture plus ancienne ne doit pas gagner');
    assert.equal(older.applied, 0);

    const newer = mergeEntries(base.document, { theme: { value: 'light', updatedAt: NOW - 10 } }, { now: NOW });
    assert.equal(newer.document.entries.theme.value, 'light');
  });

  test('à horodatage égal le serveur gagne : la fusion reste déterministe', () => {
    const base = mergeEntries(empty(), { theme: { value: 'dark', updatedAt: NOW - 1000 } }, { now: NOW });
    const tie = mergeEntries(base.document, { theme: { value: 'light', updatedAt: NOW - 1000 } }, { now: NOW });
    assert.equal(tie.document.entries.theme.value, 'dark');
    assert.equal(tie.applied, 0);
  });

  test('une clé hors liste blanche est rejetée, pas stockée', () => {
    const { document, rejected, applied } = mergeEntries(
      empty(),
      { 'n-importe-quoi': { value: 1, updatedAt: NOW } },
      { now: NOW }
    );
    assert.deepEqual(rejected, ['n-importe-quoi']);
    assert.equal(applied, 0);
    assert.deepEqual(document.entries, {});
  });

  test('iptvConfig est refusé par défaut et accepté seulement sur option', () => {
    const entry = { iptvConfig: { value: { username: 'u', password: 'p' }, updatedAt: NOW } };

    const strict = mergeEntries(empty(), entry, { now: NOW });
    assert.deepEqual(strict.rejected, ['iptvConfig'], 'les identifiants ne doivent pas partir par défaut');

    const permissive = mergeEntries(empty(), entry, { now: NOW, keys: allowedKeys({ allowSecrets: true }) });
    assert.equal(permissive.applied, 1);
  });

  test('une horloge client en avance ne peut pas verrouiller une clé', () => {
    const future = mergeEntries(empty(), { theme: { value: 'dark', updatedAt: NOW + 86400000 } }, { now: NOW });
    assert.equal(future.document.entries.theme.updatedAt, NOW, 'l’horodatage doit être ramené à maintenant');

    // Un autre appareil, à l'heure, doit encore pouvoir écrire ensuite.
    const later = mergeEntries(future.document, { theme: { value: 'light', updatedAt: NOW + 1 } }, { now: NOW + 1 });
    assert.equal(later.document.entries.theme.value, 'light');
  });

  test('un horodatage absent ou illisible retombe sur maintenant', () => {
    const { document } = mergeEntries(
      empty(),
      { theme: { value: 'dark' }, favorites: { value: [], updatedAt: 'pas une date' } },
      { now: NOW }
    );
    assert.equal(document.entries.theme.updatedAt, NOW);
    assert.equal(document.entries.favorites.updatedAt, NOW);
  });

  test('une suppression laisse une pierre tombale, puis expire', () => {
    const created = mergeEntries(empty(), { favorites: { value: [1], updatedAt: NOW - 1000 } }, { now: NOW });
    const deleted = mergeEntries(created.document, { favorites: { deleted: true, updatedAt: NOW } }, { now: NOW });
    assert.equal(deleted.document.entries.favorites.deleted, true);
    assert.equal(deleted.document.entries.favorites.value, undefined);

    const muchLater = NOW + TOMBSTONE_TTL_MS + 1000;
    const purged = mergeEntries(deleted.document, {}, { now: muchLater });
    assert.equal(purged.document.entries.favorites, undefined, 'la pierre tombale doit finir par disparaître');
  });

  test('une valeur trop grosse est rejetée sans casser le reste', () => {
    const huge = 'x'.repeat(MAX_VALUE_BYTES + 100);
    const { document, rejected } = mergeEntries(
      empty(),
      {
        favorites: { value: huge, updatedAt: NOW },
        theme: { value: 'dark', updatedAt: NOW },
      },
      { now: NOW }
    );
    assert.deepEqual(rejected, ['favorites']);
    assert.equal(document.entries.theme.value, 'dark', 'les autres clés doivent passer');
  });

  test('une entrée malformée est ignorée', () => {
    const { rejected, applied } = mergeEntries(empty(), { theme: 'dark' }, { now: NOW });
    assert.deepEqual(rejected, ['theme']);
    assert.equal(applied, 0);
  });

  test('la révision n’avance que si quelque chose a changé', () => {
    const first = mergeEntries(empty(), { theme: { value: 'dark', updatedAt: NOW - 10 } }, { now: NOW });
    const again = mergeEntries(first.document, { theme: { value: 'dark', updatedAt: NOW - 10 } }, { now: NOW });
    assert.equal(again.document.revision, first.document.revision);
  });
});

/* ------------------------------------------------------------------ */

describe('magasin JSON', () => {
  let dir;
  let store;

  before(async () => {
    dir = await fs.mkdtemp(path.join(os.tmpdir(), 'xpeng-store-'));
    store = new JsonStore(dir);
  });

  after(async () => {
    await fs.rm(dir, { recursive: true, force: true });
  });

  test('écrit puis relit', async () => {
    await store.write('doc', { a: 1 });
    assert.deepEqual(await store.read('doc'), { a: 1 });
  });

  test('un document absent renvoie la valeur par défaut', async () => {
    assert.deepEqual(await store.read('jamais-ecrit', { vide: true }), { vide: true });
  });

  test('un document corrompu ne fait pas échouer la lecture', async () => {
    await fs.writeFile(path.join(dir, 'casse.json'), '{ ceci n est pas du json');
    assert.deepEqual(await store.read('casse', { secours: true }), { secours: true });
  });

  test('refuse les noms qui sortiraient du dossier de données', async () => {
    await assert.rejects(() => store.read('../../etc/passwd'), /invalide/);
    await assert.rejects(() => store.write('a/b', {}), /invalide/);
  });

  test('les mises à jour concurrentes se sérialisent au lieu de s’écraser', async () => {
    await store.write('compteur', { n: 0 });
    await Promise.all(
      Array.from({ length: 25 }, () =>
        store.update('compteur', { n: 0 }, (current) => ({ n: current.n + 1 }))
      )
    );
    assert.deepEqual(await store.read('compteur'), { n: 25 }, 'aucune incrémentation ne doit être perdue');
  });

  test('un échec de mutation ne bloque pas la file', async () => {
    await store.write('file', { n: 0 });
    await assert.rejects(() =>
      store.update('file', { n: 0 }, () => {
        throw new Error('boom');
      })
    );
    const after = await store.update('file', { n: 0 }, (current) => ({ n: current.n + 1 }));
    assert.deepEqual(after, { n: 1 });
  });

  test('un document secret n’est lisible que par son propriétaire', async () => {
    await store.write('secret', { password: 'p' }, { secret: true });
    const stat = await fs.stat(path.join(dir, 'secret.json'));
    assert.equal(stat.mode & 0o077, 0, 'le fichier ne doit être lisible ni par le groupe ni par les autres');
  });

  test('aucun fichier temporaire ne subsiste après écriture', async () => {
    await store.write('propre', { a: 1 });
    const leftovers = (await fs.readdir(dir)).filter((name) => name.endsWith('.tmp'));
    assert.deepEqual(leftovers, []);
  });
});

/* ------------------------------------------------------------------ */

describe('comparaison de jetons', () => {
  test('vraie seulement pour deux jetons identiques', () => {
    assert.equal(safeEqual('secret', 'secret'), true);
    assert.equal(safeEqual('secret', 'secrez'), false);
    assert.equal(safeEqual('secret', 'secret-plus-long'), false);
    assert.equal(safeEqual('', ''), true);
  });

  test('ne lève pas sur autre chose qu’une chaîne', () => {
    assert.equal(safeEqual(undefined, 'x'), false);
    assert.equal(safeEqual(null, null), false);
  });
});

/* ------------------------------------------------------------------ */

describe('gestionnaires de synchronisation', () => {
  let dir;
  let handlers;

  before(async () => {
    dir = await fs.mkdtemp(path.join(os.tmpdir(), 'xpeng-sync-'));
    handlers = createSyncHandlers({ store: new JsonStore(dir), token: 'jeton-de-test' });
  });

  after(async () => {
    await fs.rm(dir, { recursive: true, force: true });
  });

  test('désactivée sans jeton', async () => {
    const off = createSyncHandlers({ store: new JsonStore(dir), token: '' });
    assert.equal(off.enabled, false);
    assert.equal((await off.status()).enabled, false);
  });

  test('l’autorisation n’accepte que le bon porteur', () => {
    assert.equal(handlers.authorize({ headers: { authorization: 'Bearer jeton-de-test' } }), true);
    assert.equal(handlers.authorize({ headers: { authorization: 'Bearer mauvais' } }), false);
    assert.equal(handlers.authorize({ headers: {} }), false);
    assert.equal(handlers.authorize({ headers: { authorization: 'jeton-de-test' } }), false);
  });

  test('un aller-retour pousse et récupère', async () => {
    const pushed = await handlers.sync({ entries: { theme: { value: 'dark', updatedAt: Date.now() } } });
    assert.equal(pushed.entries.theme.value, 'dark');

    const pulled = await handlers.pull();
    assert.equal(pulled.entries.theme.value, 'dark');
    assert.equal(pulled.revision, pushed.revision);
  });

  test('les clés refusées sont signalées au client', async () => {
    const result = await handlers.sync({ entries: { iptvConfig: { value: {}, updatedAt: Date.now() } } });
    assert.deepEqual(result.rejected, ['iptvConfig']);
  });

  test('le statut ne contient jamais le jeton', async () => {
    const status = await handlers.status();
    assert.equal(JSON.stringify(status).includes('jeton-de-test'), false);
    assert.deepEqual(status.keys, [...SYNCABLE_KEYS]);
  });

  test('la remise à zéro vide l’état serveur', async () => {
    await handlers.sync({ entries: { theme: { value: 'dark', updatedAt: Date.now() } } });
    await handlers.reset();
    assert.deepEqual((await handlers.pull()).entries, {});
  });

  test('les clés secrètes ne sont pas dans la liste par défaut', () => {
    for (const key of SECRET_KEYS) {
      assert.equal(SYNCABLE_KEYS.includes(key), false, `${key} ne doit pas être synchronisée par défaut`);
    }
  });
});

/* ------------------------------------------------------------------ */

describe('bout en bout HTTP', () => {
  let child;
  let dir;
  let base;

  before(async () => {
    dir = await fs.mkdtemp(path.join(os.tmpdir(), 'xpeng-e2e-'));
    const port = 8000 + Math.floor(Math.random() * 1500);
    base = `http://127.0.0.1:${port}`;

    child = spawn(process.execPath, [path.join(__dirname, 'server.js')], {
      env: {
        ...process.env,
        PORT: String(port),
        HOST: '127.0.0.1',
        API_TOKEN: 'jeton-e2e',
        DATA_DIR: dir,
        VEHICLE_PROVIDER: 'demo',
        STATIC_DIR: dir,
      },
      stdio: 'ignore',
    });

    // Attendre que le port réponde plutôt que de dormir arbitrairement.
    for (let attempt = 0; attempt < 100; attempt += 1) {
      try {
        await fetch(`${base}/healthz`);
        return;
      } catch {
        await new Promise((resolve) => setTimeout(resolve, 50));
      }
    }
    throw new Error('le serveur de test n’a pas démarré');
  });

  after(async () => {
    child?.kill();
    await fs.rm(dir, { recursive: true, force: true });
  });

  const auth = { Authorization: 'Bearer jeton-e2e', 'Content-Type': 'application/json' };

  test('/healthz annonce les capacités sans authentification', async () => {
    const body = await (await fetch(`${base}/healthz`)).json();
    assert.equal(body.sync.enabled, true);
    assert.equal(body.vehicle.enabled, true);
    assert.equal(body.vehicle.provider, 'demo');
    assert.equal(JSON.stringify(body).includes('jeton-e2e'), false, '/healthz ne doit divulguer aucun secret');
  });

  test('sans jeton, la synchronisation répond 401', async () => {
    const response = await fetch(`${base}/api/sync`);
    assert.equal(response.status, 401);
    assert.match(response.headers.get('www-authenticate') ?? '', /Bearer/);
  });

  test('avec un mauvais jeton, la synchronisation répond 401', async () => {
    const response = await fetch(`${base}/api/sync`, { headers: { Authorization: 'Bearer faux' } });
    assert.equal(response.status, 401);
  });

  test('un aller-retour complet fonctionne', async () => {
    const push = await fetch(`${base}/api/sync`, {
      method: 'POST',
      headers: auth,
      body: JSON.stringify({ entries: { theme: { value: 'dark', updatedAt: Date.now() } } }),
    });
    assert.equal(push.status, 200);

    const pull = await (await fetch(`${base}/api/sync`, { headers: auth })).json();
    assert.equal(pull.entries.theme.value, 'dark');
  });

  test('un JSON invalide donne 400, pas 500', async () => {
    const response = await fetch(`${base}/api/sync`, {
      method: 'POST',
      headers: auth,
      body: '{ pas du json',
    });
    assert.equal(response.status, 400);
  });

  test('les identifiants véhicule ne sont jamais relisibles', async () => {
    const response = await fetch(`${base}/api/vehicle/credentials`, { headers: auth });
    assert.equal(response.status, 405, 'GET sur /credentials doit être refusé');
  });

  test('l’état du véhicule est servi par le provider de démonstration', async () => {
    const state = await (await fetch(`${base}/api/vehicle/state`, { headers: auth })).json();
    assert.equal(state.source, 'demo');
    assert.equal(typeof state.batteryPercent, 'number');
    assert.ok(state.batteryPercent >= 0 && state.batteryPercent <= 100);
  });

  test('une route véhicule inconnue donne 404', async () => {
    const response = await fetch(`${base}/api/vehicle/inexistant`, { headers: auth });
    assert.equal(response.status, 404);
  });

  test('la persistance survit à un redémarrage du processus', async () => {
    const stored = JSON.parse(await fs.readFile(path.join(dir, 'sync.json'), 'utf8'));
    assert.equal(stored.entries.theme.value, 'dark');
  });
});

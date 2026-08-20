/**
 * Tests du moteur de synchronisation côté navigateur.
 *
 * Le moteur travaille sur une interface `KeyValueStorage` minimale : ces tests
 * lui donnent une fausse implémentation en mémoire, sans navigateur ni DOM.
 */
import assert from 'node:assert/strict';
import test, { describe } from 'node:test';

import {
  applyServerEntries,
  collectLocalEntries,
  DEFAULT_SYNC_KEYS,
  fingerprint,
  readConfig,
  refreshMetaFromStorage,
} from './syncEngine.ts';

/** `localStorage` en mémoire. */
function fakeStorage(initial = {}) {
  const map = new Map(Object.entries(initial));
  return {
    getItem: (key) => (map.has(key) ? map.get(key) : null),
    setItem: (key, value) => map.set(key, String(value)),
    removeItem: (key) => map.delete(key),
    snapshot: () => Object.fromEntries(map),
  };
}

const KEYS = ['favorites', 'theme'];
const NOW = 1_760_000_000_000;

/* ------------------------------------------------------------------ */

describe('empreinte', () => {
  test('stable pour une même valeur', () => {
    assert.equal(fingerprint('{"a":1}'), fingerprint('{"a":1}'));
  });

  test('différente dès que la valeur change', () => {
    assert.notEqual(fingerprint('{"a":1}'), fingerprint('{"a":2}'));
    assert.notEqual(fingerprint('abc'), fingerprint('abcd'));
  });

  test('distingue « absente » de « chaîne vide »', () => {
    assert.equal(fingerprint(null), 'absent');
    assert.notEqual(fingerprint(''), 'absent');
  });
});

/* ------------------------------------------------------------------ */

describe('lecture de la configuration', () => {
  test('valeurs par défaut sûres quand rien n’est stocké', () => {
    assert.deepEqual(readConfig(fakeStorage()), { enabled: false, token: '', serverUrl: '' });
  });

  test('une configuration corrompue ne fait pas planter le démarrage', () => {
    const storage = fakeStorage({ xpeng_sync_config: '{ pas du json' });
    assert.equal(readConfig(storage).enabled, false);
  });

  test('un champ de mauvais type est ignoré', () => {
    const storage = fakeStorage({ xpeng_sync_config: JSON.stringify({ enabled: 'oui', token: 42 }) });
    const config = readConfig(storage);
    assert.equal(config.enabled, false, 'seul le booléen true active la synchronisation');
    assert.equal(config.token, '');
  });
});

/* ------------------------------------------------------------------ */

describe('collecte des entrées locales', () => {
  test('une clé jamais synchronisée part avec l’horodatage 0 : le serveur gagne', () => {
    const storage = fakeStorage({ favorites: '[1,2]' });
    const entries = collectLocalEntries(storage, KEYS, {}, NOW);
    assert.deepEqual(entries.favorites.value, [1, 2]);
    assert.equal(entries.favorites.updatedAt, 0, 'un appareil neuf ne doit pas écraser les autres');
  });

  test('une valeur inchangée conserve son horodatage', () => {
    const storage = fakeStorage({ favorites: '[1]' });
    const meta = { favorites: { updatedAt: NOW - 5000, hash: fingerprint('[1]') } };
    const entries = collectLocalEntries(storage, KEYS, meta, NOW);
    assert.equal(entries.favorites.updatedAt, NOW - 5000);
  });

  test('une valeur modifiée localement passe à maintenant', () => {
    const storage = fakeStorage({ favorites: '[1,2,3]' });
    const meta = { favorites: { updatedAt: NOW - 5000, hash: fingerprint('[1]') } };
    const entries = collectLocalEntries(storage, KEYS, meta, NOW);
    assert.equal(entries.favorites.updatedAt, NOW, 'la modification doit être détectée sans instrumentation');
  });

  test('une clé supprimée localement part en pierre tombale', () => {
    const storage = fakeStorage({});
    const meta = { favorites: { updatedAt: NOW - 5000, hash: fingerprint('[1]') } };
    const entries = collectLocalEntries(storage, KEYS, meta, NOW);
    assert.deepEqual(entries.favorites, { deleted: true, updatedAt: NOW });
  });

  test('une clé absente et jamais connue n’est pas envoyée', () => {
    const entries = collectLocalEntries(fakeStorage({}), KEYS, {}, NOW);
    assert.equal('favorites' in entries, false);
    assert.equal('theme' in entries, false);
  });

  test('une valeur non-JSON est transmise telle quelle', () => {
    const storage = fakeStorage({ theme: 'dark' });
    const entries = collectLocalEntries(storage, KEYS, {}, NOW);
    assert.equal(entries.theme.value, 'dark');
  });
});

/* ------------------------------------------------------------------ */

describe('application des entrées du serveur', () => {
  test('écrit la valeur et signale le changement', () => {
    const storage = fakeStorage({ favorites: '[1]' });
    const { changed, meta } = applyServerEntries(
      storage,
      { favorites: { value: [1, 2, 3], updatedAt: NOW } },
      {},
      KEYS
    );
    assert.deepEqual(changed, ['favorites']);
    assert.equal(storage.getItem('favorites'), '[1,2,3]');
    assert.equal(meta.favorites.updatedAt, NOW);
  });

  test('une valeur identique n’est pas signalée comme changée', () => {
    const storage = fakeStorage({ favorites: '[1]' });
    const { changed } = applyServerEntries(storage, { favorites: { value: [1], updatedAt: NOW } }, {}, KEYS);
    assert.deepEqual(changed, [], 'ne pas proposer un rechargement pour rien');
  });

  test('une chaîne simple est réécrite sans guillemets JSON', () => {
    const storage = fakeStorage({ theme: 'light' });
    applyServerEntries(storage, { theme: { value: 'dark', updatedAt: NOW } }, {}, KEYS);
    assert.equal(storage.getItem('theme'), 'dark');
  });

  test('une pierre tombale supprime la clé locale', () => {
    const storage = fakeStorage({ favorites: '[1]' });
    const { changed, meta } = applyServerEntries(
      storage,
      { favorites: { deleted: true, updatedAt: NOW } },
      {},
      KEYS
    );
    assert.deepEqual(changed, ['favorites']);
    assert.equal(storage.getItem('favorites'), null);
    assert.equal(meta.favorites.hash, 'absent');
  });

  test('une clé hors liste blanche est ignorée', () => {
    const storage = fakeStorage({});
    const { changed, meta } = applyServerEntries(
      storage,
      { iptvConfig: { value: { password: 'p' }, updatedAt: NOW } },
      {},
      KEYS
    );
    assert.deepEqual(changed, []);
    assert.equal(storage.getItem('iptvConfig'), null, 'aucune clé non autorisée ne doit être écrite');
    assert.equal('iptvConfig' in meta, false);
  });

  test('après application, la valeur n’est plus vue comme modifiée localement', () => {
    const storage = fakeStorage({ favorites: '[1]' });
    const { meta } = applyServerEntries(storage, { favorites: { value: [9], updatedAt: NOW } }, {}, KEYS);
    const entries = collectLocalEntries(storage, KEYS, meta, NOW + 60000);
    assert.equal(
      entries.favorites.updatedAt,
      NOW,
      'une valeur reçue du serveur ne doit pas repartir comme une modification locale'
    );
  });
});

/* ------------------------------------------------------------------ */

describe('recalage des métadonnées après envoi', () => {
  test('mémorise l’empreinte de ce qui vient d’être poussé', () => {
    const storage = fakeStorage({ favorites: '[1,2]' });
    const sent = { favorites: { value: [1, 2], updatedAt: NOW } };
    const meta = refreshMetaFromStorage(storage, KEYS, {}, sent);
    assert.equal(meta.favorites.hash, fingerprint('[1,2]'));

    const entries = collectLocalEntries(storage, KEYS, meta, NOW + 1000);
    assert.equal(entries.favorites.updatedAt, NOW, 'rien n’a changé depuis l’envoi');
  });

  test('ne rétrograde pas un horodatage plus récent', () => {
    const storage = fakeStorage({ favorites: '[1]' });
    const meta = refreshMetaFromStorage(
      storage,
      KEYS,
      { favorites: { updatedAt: NOW + 5000, hash: 'x' } },
      { favorites: { value: [1], updatedAt: NOW } }
    );
    assert.equal(meta.favorites.updatedAt, NOW + 5000);
  });
});

/* ------------------------------------------------------------------ */

describe('cycle complet entre deux appareils', () => {
  test('une modification sur A arrive sur B sans écraser les clés de B', () => {
    const serverEntries = {};
    const mergeOnServer = (incoming, now) => {
      for (const [key, entry] of Object.entries(incoming)) {
        const current = serverEntries[key];
        if (current && current.updatedAt >= entry.updatedAt) continue;
        serverEntries[key] = entry;
      }
      return { ...serverEntries };
    };

    // A possède des favoris, B un thème. Aucun des deux n'a encore synchronisé.
    const deviceA = fakeStorage({ favorites: '[1,2]' });
    const deviceB = fakeStorage({ theme: 'dark' });
    let metaA = {};
    let metaB = {};

    // A synchronise : le serveur était vide, il adopte ses favoris.
    const sentA = collectLocalEntries(deviceA, DEFAULT_SYNC_KEYS, metaA, NOW);
    let response = mergeOnServer(sentA, NOW);
    metaA = refreshMetaFromStorage(deviceA, DEFAULT_SYNC_KEYS, metaA, sentA);
    metaA = applyServerEntries(deviceA, response, metaA, DEFAULT_SYNC_KEYS).meta;

    // B synchronise : il reçoit les favoris de A et pousse son thème.
    const sentB = collectLocalEntries(deviceB, DEFAULT_SYNC_KEYS, metaB, NOW + 1000);
    response = mergeOnServer(sentB, NOW + 1000);
    metaB = refreshMetaFromStorage(deviceB, DEFAULT_SYNC_KEYS, metaB, sentB);
    const appliedB = applyServerEntries(deviceB, response, metaB, DEFAULT_SYNC_KEYS);
    metaB = appliedB.meta;

    assert.equal(deviceB.getItem('favorites'), '[1,2]', 'B doit recevoir les favoris de A');
    assert.equal(deviceB.getItem('theme'), 'dark', 'B ne doit pas perdre son thème');
    assert.ok(appliedB.changed.includes('favorites'));

    // A resynchronise : il récupère le thème de B, ses favoris sont intacts.
    const sentA2 = collectLocalEntries(deviceA, DEFAULT_SYNC_KEYS, metaA, NOW + 2000);
    response = mergeOnServer(sentA2, NOW + 2000);
    applyServerEntries(deviceA, response, metaA, DEFAULT_SYNC_KEYS);

    assert.equal(deviceA.getItem('theme'), 'dark', 'A doit recevoir le thème de B');
    assert.equal(deviceA.getItem('favorites'), '[1,2]');
  });
});

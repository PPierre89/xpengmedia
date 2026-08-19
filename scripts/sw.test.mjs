/**
 * Tests du service worker (public/sw.js).
 *
 * Le risque principal d'un SW sur cette application est qu'il intercepte les
 * flux IPTV : segments vidéo mis en cache (saturation du stockage, lecture de
 * segments périmés) ou réponse /healthz figée (le player croirait le proxy
 * local disponible alors qu'il ne l'est pas). Ces tests vérifient que ces
 * routes ne sont jamais prises en charge, et que les autres le sont.
 */
import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';

const ORIGIN = 'http://nas.local:2789';

/** Charge sw.js dans un faux ServiceWorkerGlobalScope et renvoie ses handlers. */
function loadServiceWorker() {
  const source = readFileSync(new URL('../public/sw.js', import.meta.url), 'utf8');
  const handlers = {};
  const self = {
    addEventListener: (type, fn) => { handlers[type] = fn; },
    location: new URL(ORIGIN + '/sw.js'),
    skipWaiting: async () => {},
    clients: { claim: async () => {} },
  };
  const caches = {
    open: async () => ({ match: async () => undefined, put: async () => {}, add: async () => {} }),
    keys: async () => [],
    delete: async () => {},
  };
  new Function('self', 'caches', 'fetch', source)(self, caches, async () => new Response('ok'));
  return handlers;
}

/** Simule une requête et indique si le SW la prend en charge. */
function isHandled(fetchHandler, url, { mode = 'no-cors', method = 'GET', headers = {} } = {}) {
  let handled = false;
  const request = new Request(new URL(url, ORIGIN), { method, headers });
  Object.defineProperty(request, 'mode', { value: mode });
  fetchHandler({ request, respondWith: () => { handled = true; } });
  return handled;
}

test('les flux IPTV ne sont jamais interceptés', () => {
  const { fetch: onFetch } = loadServiceWorker();
  for (const url of [
    '/api/proxy?url=http%3A%2F%2Fserveur%2Flive.m3u8',
    '/api/proxy?url=http%3A%2F%2Fserveur%2Fsegment.ts',
    '/api/proxy',
  ]) {
    assert.equal(isHandled(onFetch, url), false, `${url} ne doit pas être pris en charge`);
  }
});

test('/healthz reste toujours servi par le réseau', () => {
  const { fetch: onFetch } = loadServiceWorker();
  assert.equal(isHandled(onFetch, '/healthz'), false);
});

test('les requêtes à portée (vidéo) passent directement', () => {
  const { fetch: onFetch } = loadServiceWorker();
  assert.equal(isHandled(onFetch, '/media.mp4', { headers: { range: 'bytes=0-100' } }), false);
});

test('les origines tierces et les non-GET sont ignorées', () => {
  const { fetch: onFetch } = loadServiceWorker();
  assert.equal(isHandled(onFetch, 'https://exemple.com/x.js'), false);
  assert.equal(isHandled(onFetch, '/index.html', { method: 'POST' }), false);
});

test("la coquille de l'application est bien prise en charge", () => {
  const { fetch: onFetch } = loadServiceWorker();
  assert.equal(isHandled(onFetch, '/', { mode: 'navigate' }), true);
  assert.equal(isHandled(onFetch, '/iptv-player.html', { mode: 'navigate' }), true);
  assert.equal(isHandled(onFetch, '/assets/index-abc123.js'), true);
  assert.equal(isHandled(onFetch, '/icons/netflix.svg'), true);
  assert.equal(isHandled(onFetch, '/manifest.webmanifest'), true);
});

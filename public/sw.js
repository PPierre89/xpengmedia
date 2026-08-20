/**
 * Service worker — XPENG Media Hub
 *
 * Objectif : démarrage instantané dans la voiture, même quand le réseau
 * mobile est mauvais, et interface toujours affichée si le NAS est
 * momentanément injoignable.
 *
 * Ce qui n'est JAMAIS mis en cache ni intercepté :
 *   - /api/proxy  : flux vidéo et API IPTV. Les mettre en cache saturerait le
 *                   stockage du navigateur et servirait des segments périmés.
 *                   Ces réponses contiennent aussi des données d'abonnement.
 *   - /healthz    : sert à détecter le proxy local au démarrage du player.
 *                   Une réponse en cache ferait croire au player que le proxy
 *                   est disponible alors qu'il ne l'est pas.
 *
 * Stratégies :
 *   - navigations (HTML)   : réseau d'abord, cache en secours (hors ligne)
 *   - /assets/* (hachés)   : cache d'abord, immuables par construction
 *   - autres GET same-origin : cache d'abord puis rafraîchissement en tâche de fond
 */

// Remplacé à chaque build par scripts/postbuild.mjs — garantit que les
// utilisateurs reçoivent bien la nouvelle version après un déploiement.
const VERSION = '__BUILD_VERSION__';
const CACHE = `xpengmedia-${VERSION}`;

// Coquille minimale permettant d'afficher l'app hors ligne.
const PRECACHE = [
  '/',
  '/index.html',
  '/iptv-player.html',
  '/manifest.webmanifest',
  '/icons/pwa/icon-192.png',
  '/icons/pwa/icon-512.png',
  // La police est servie localement (voir src/index.css) : sans elle en cache,
  // le premier démarrage hors ligne bascule sur la pile système.
  '/fonts/urbanist-latin.woff2',
  '/fonts/urbanist-latin-ext.woff2',
];

const BYPASS = ['/api/proxy', '/healthz'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE);
      // addAll échoue en bloc si une seule URL manque : on tolère les absences.
      await Promise.all(
        PRECACHE.map((url) =>
          cache.add(new Request(url, { cache: 'reload' })).catch(() => {})
        )
      );
      await self.skipWaiting();
    })()
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const names = await caches.keys();
      await Promise.all(
        names.filter((n) => n.startsWith('xpengmedia-') && n !== CACHE).map((n) => caches.delete(n))
      );
      await self.clients.claim();
    })()
  );
});

self.addEventListener('message', (event) => {
  if (event.data === 'SKIP_WAITING') self.skipWaiting();
});

async function networkFirst(request) {
  const cache = await caches.open(CACHE);
  try {
    const fresh = await fetch(request);
    if (fresh.ok) cache.put(request, fresh.clone());
    return fresh;
  } catch {
    const cached = (await cache.match(request)) || (await cache.match('/index.html'));
    if (cached) return cached;
    throw new Error('hors ligne et absent du cache');
  }
}

async function cacheFirst(request) {
  const cache = await caches.open(CACHE);
  const cached = await cache.match(request);
  if (cached) return cached;
  const fresh = await fetch(request);
  if (fresh.ok) cache.put(request, fresh.clone());
  return fresh;
}

async function staleWhileRevalidate(request) {
  const cache = await caches.open(CACHE);
  const cached = await cache.match(request);
  const network = fetch(request)
    .then((fresh) => {
      if (fresh.ok) cache.put(request, fresh.clone());
      return fresh;
    })
    .catch(() => null);
  return cached || (await network) || Promise.reject(new Error('indisponible'));
}

self.addEventListener('fetch', (event) => {
  const { request } = event;

  // On ne gère que les GET de notre propre origine.
  if (request.method !== 'GET') return;

  let url;
  try {
    url = new URL(request.url);
  } catch {
    return;
  }
  if (url.origin !== self.location.origin) return;

  // Flux IPTV et détection du proxy : jamais interceptés.
  if (BYPASS.some((p) => url.pathname === p || url.pathname.startsWith(p + '/'))) return;

  // Requêtes à portée (Range) : vidéo/audio, on laisse passer.
  if (request.headers.has('range')) return;

  if (request.mode === 'navigate') {
    event.respondWith(networkFirst(request));
    return;
  }

  if (url.pathname.startsWith('/assets/')) {
    event.respondWith(cacheFirst(request));
    return;
  }

  event.respondWith(staleWhileRevalidate(request));
});

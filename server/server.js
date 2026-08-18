#!/usr/bin/env node
/**
 * XPENG Media Hub — serveur tout-en-un pour auto-hébergement (NAS UGREEN, Docker, Raspberry Pi...)
 *
 * Sert deux choses sur un seul port :
 *   1. L'application React compilée (dossier dist/)
 *   2. Un proxy CORS local sur /api/proxy?url=... (IPTV / Xtream / M3U / HLS)
 *
 * Comme le proxy est servi par la même origine que la page, il n'y a plus AUCUN
 * problème CORS et plus besoin des proxies publics (corsproxy.io, codetabs...).
 *
 * Zéro dépendance : uniquement les modules natifs de Node.js (>= 18).
 *
 * Variables d'environnement :
 *   PORT                 Port d'écoute                       (défaut: 8080)
 *   HOST                 Interface d'écoute                  (défaut: 0.0.0.0)
 *   STATIC_DIR           Dossier des fichiers statiques      (défaut: ./dist)
 *   PROXY_USER_AGENT     User-Agent envoyé au serveur IPTV   (défaut: VLC/3.0.20 LibVLC/3.0.20)
 *   PROXY_TIMEOUT_MS     Timeout d'une requête proxy         (défaut: 20000)
 *   PROXY_ALLOW_PRIVATE  'true' pour autoriser le proxy vers le réseau local (défaut: false)
 */

import http from 'node:http';
import fs from 'node:fs';
import fsp from 'node:fs/promises';
import path from 'node:path';
import net from 'node:net';
import dns from 'node:dns/promises';
import { Readable } from 'node:stream';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const PORT = Number(process.env.PORT || 8080);
const HOST = process.env.HOST || '0.0.0.0';
const STATIC_DIR = path.resolve(process.env.STATIC_DIR || path.join(__dirname, '..', 'dist'));
const USER_AGENT = process.env.PROXY_USER_AGENT || 'VLC/3.0.20 LibVLC/3.0.20';
const PROXY_TIMEOUT_MS = Number(process.env.PROXY_TIMEOUT_MS || 20000);
const ALLOW_PRIVATE = /^(1|true|yes|on)$/i.test(process.env.PROXY_ALLOW_PRIVATE || '');

const PROXY_PATH = '/api/proxy';

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.avif': 'image/avif',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.map': 'application/json; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.webmanifest': 'application/manifest+json',
  '.m3u8': 'application/vnd.apple.mpegurl',
  '.mp4': 'video/mp4',
  '.ts': 'video/mp2t',
};

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, HEAD, POST, OPTIONS',
  'Access-Control-Allow-Headers': '*',
  'Access-Control-Expose-Headers': 'Content-Length, Content-Range, Content-Type',
  'Access-Control-Max-Age': '86400',
};

/* ------------------------------------------------------------------ */
/* Protection SSRF : on refuse par défaut de proxifier le réseau privé */
/* ------------------------------------------------------------------ */

function isPrivateIp(ip) {
  const kind = net.isIP(ip);
  if (kind === 4) {
    const [a, b] = ip.split('.').map(Number);
    return (
      a === 0 || a === 10 || a === 127 ||
      (a === 169 && b === 254) ||
      (a === 172 && b >= 16 && b <= 31) ||
      (a === 192 && b === 168) ||
      (a === 100 && b >= 64 && b <= 127) ||
      a >= 224
    );
  }
  if (kind === 6) {
    const v = ip.toLowerCase();
    if (v === '::1' || v === '::') return true;
    if (v.startsWith('fe80') || v.startsWith('fc') || v.startsWith('fd')) return true;
    // IPv4 mappée : ::ffff:192.168.0.1
    const mapped = v.match(/::ffff:(\d+\.\d+\.\d+\.\d+)$/);
    if (mapped) return isPrivateIp(mapped[1]);
    return false;
  }
  return false;
}

async function assertTargetAllowed(target) {
  if (target.protocol !== 'http:' && target.protocol !== 'https:') {
    throw new Error(`Protocole non supporté: ${target.protocol}`);
  }
  if (ALLOW_PRIVATE) return;

  const host = target.hostname.replace(/^\[|\]$/g, '');
  let addresses;
  if (net.isIP(host)) {
    addresses = [{ address: host }];
  } else {
    addresses = await dns.lookup(host, { all: true });
  }
  if (addresses.some((a) => isPrivateIp(a.address))) {
    throw new Error(
      `Cible sur le réseau privé refusée (${host}). ` +
        `Définis PROXY_ALLOW_PRIVATE=true si ton serveur IPTV est sur ton LAN.`
    );
  }
}

/* ------------------------------------------------------------------ */
/* Réécriture des playlists HLS pour que les segments passent aussi    */
/* par le proxy local (sinon hls.js retombe sur des erreurs CORS)      */
/* ------------------------------------------------------------------ */

function proxify(absoluteUrl) {
  return `${PROXY_PATH}?url=${encodeURIComponent(absoluteUrl)}`;
}

function rewriteM3u8(body, baseUrl) {
  const resolve = (u) => {
    try {
      return proxify(new URL(u, baseUrl).href);
    } catch {
      return u;
    }
  };

  return body
    .split('\n')
    .map((rawLine) => {
      const line = rawLine.trim();
      if (!line) return rawLine;

      if (line.startsWith('#')) {
        // #EXT-X-KEY:...URI="https://..." / #EXT-X-MAP:URI="..." / #EXT-X-MEDIA:...URI="..."
        return rawLine.replace(/URI="([^"]+)"/g, (_m, uri) => `URI="${resolve(uri)}"`);
      }
      return resolve(line);
    })
    .join('\n');
}

function looksLikePlaylist(contentType, url) {
  const ct = (contentType || '').toLowerCase();
  return (
    ct.includes('mpegurl') ||
    ct.includes('m3u') ||
    /\.m3u8?(\?|$)/i.test(url)
  );
}

/**
 * Une playlist HLS (à réécrire) contient toujours des tags #EXT-X-*.
 * Une liste de chaînes IPTV classique n'a que #EXTM3U / #EXTINF : il ne faut
 * SURTOUT pas la réécrire, le player doit récupérer les URLs d'origine.
 */
function isHlsManifest(body) {
  return /^#EXT-X-/m.test(body);
}

/* ------------------------------------------------------------------ */
/* Proxy                                                               */
/* ------------------------------------------------------------------ */

function sendJson(res, status, payload) {
  const body = JSON.stringify(payload, null, 2);
  res.writeHead(status, {
    ...CORS_HEADERS,
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(body),
  });
  res.end(body);
}

async function handleProxy(req, res, requestUrl) {
  const rawTarget = requestUrl.searchParams.get('url');

  if (!rawTarget) {
    return sendJson(res, 400, {
      error: 'Paramètre "url" manquant',
      usage: `${PROXY_PATH}?url=http://mon-serveur-iptv.com/...`,
    });
  }

  let target;
  try {
    target = new URL(rawTarget);
    await assertTargetAllowed(target);
  } catch (err) {
    return sendJson(res, 400, { error: 'URL cible invalide', message: err.message });
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), PROXY_TIMEOUT_MS);
  req.on('close', () => controller.abort());

  const headers = {
    'User-Agent': requestUrl.searchParams.get('ua') || USER_AGENT,
    Accept: req.headers.accept || '*/*',
  };
  // Indispensable pour le seek vidéo et les segments partiels
  if (req.headers.range) headers.Range = req.headers.range;
  const referer = requestUrl.searchParams.get('referer');
  if (referer) headers.Referer = referer;

  try {
    const upstream = await fetch(target.href, {
      method: req.method === 'HEAD' ? 'HEAD' : 'GET',
      headers,
      redirect: 'follow',
      signal: controller.signal,
    });

    const contentType = upstream.headers.get('content-type') || 'application/octet-stream';

    // Playlists HLS : on réécrit les URLs internes pour que les segments passent
    // eux aussi par le proxy local. (?raw=1 permet de désactiver la réécriture.)
    const rawMode = requestUrl.searchParams.get('raw') === '1';
    if (!rawMode && req.method !== 'HEAD' && looksLikePlaylist(contentType, target.href)) {
      const text = await upstream.text();
      const body = isHlsManifest(text) ? rewriteM3u8(text, upstream.url || target.href) : text;
      clearTimeout(timer);
      res.writeHead(upstream.status, {
        ...CORS_HEADERS,
        'Content-Type': contentType,
        'Content-Length': Buffer.byteLength(body),
        'Cache-Control': 'no-store',
      });
      return res.end(body);
    }

    const outHeaders = { ...CORS_HEADERS, 'Content-Type': contentType };
    for (const h of ['content-length', 'content-range', 'accept-ranges', 'cache-control']) {
      const v = upstream.headers.get(h);
      if (v) outHeaders[h] = v;
    }

    res.writeHead(upstream.status, outHeaders);

    if (req.method === 'HEAD' || !upstream.body) {
      clearTimeout(timer);
      return res.end();
    }

    // Streaming : on relaie le flux tel quel (vidéo, segments .ts, gros catalogues JSON)
    const stream = Readable.fromWeb(upstream.body);
    stream.on('error', () => res.destroy());
    res.on('close', () => stream.destroy());
    stream.pipe(res);
    stream.on('end', () => clearTimeout(timer));
  } catch (err) {
    clearTimeout(timer);
    if (res.headersSent) return res.destroy();
    const aborted = err.name === 'AbortError';
    sendJson(res, aborted ? 504 : 502, {
      error: aborted ? 'Timeout du serveur distant' : 'Impossible de joindre le serveur distant',
      message: err.message,
      target: target.href,
    });
  }
}

/* ------------------------------------------------------------------ */
/* Fichiers statiques                                                  */
/* ------------------------------------------------------------------ */

async function serveStatic(req, res, pathname) {
  let relative = decodeURIComponent(pathname);
  if (relative.endsWith('/')) relative += 'index.html';

  let filePath = path.join(STATIC_DIR, relative);
  // Anti path-traversal
  if (!filePath.startsWith(STATIC_DIR)) {
    res.writeHead(403).end('Forbidden');
    return;
  }

  let stat = await fsp.stat(filePath).catch(() => null);
  if (stat?.isDirectory()) {
    filePath = path.join(filePath, 'index.html');
    stat = await fsp.stat(filePath).catch(() => null);
  }
  if (!stat?.isFile()) {
    // L'app utilise HashRouter : tout ce qui est inconnu retombe sur index.html
    filePath = path.join(STATIC_DIR, 'index.html');
    stat = await fsp.stat(filePath).catch(() => null);
    if (!stat?.isFile()) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end(
        'Application non compilée : le dossier dist/ est introuvable.\n' +
          'Lance `npm run build` avant `npm start`.\n'
      );
      return;
    }
  }

  const ext = path.extname(filePath).toLowerCase();
  const isHtml = ext === '.html';
  const headers = {
    'Content-Type': MIME_TYPES[ext] || 'application/octet-stream',
    'Content-Length': stat.size,
    'Cache-Control': isHtml
      ? 'no-cache'
      : filePath.includes(`${path.sep}assets${path.sep}`)
        ? 'public, max-age=31536000, immutable'
        : 'public, max-age=3600',
    'Last-Modified': stat.mtime.toUTCString(),
  };

  res.writeHead(200, headers);
  if (req.method === 'HEAD') return res.end();
  fs.createReadStream(filePath).on('error', () => res.destroy()).pipe(res);
}

/* ------------------------------------------------------------------ */

const server = http.createServer((req, res) => {
  const requestUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const pathname = requestUrl.pathname;

  if (req.method === 'OPTIONS') {
    res.writeHead(204, CORS_HEADERS);
    return res.end();
  }

  if (pathname === '/healthz') {
    return sendJson(res, 200, {
      status: 'ok',
      app: 'xpengmedia',
      proxy: PROXY_PATH,
      uptime: Math.round(process.uptime()),
    });
  }

  if (pathname === PROXY_PATH) {
    return handleProxy(req, res, requestUrl);
  }

  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.writeHead(405, { Allow: 'GET, HEAD, OPTIONS' }).end();
    return;
  }

  serveStatic(req, res, pathname).catch(() => {
    if (!res.headersSent) res.writeHead(500, { 'Content-Type': 'text/plain' });
    res.end('Internal error');
  });
});

server.listen(PORT, HOST, () => {
  console.log('╔════════════════════════════════════════════════════╗');
  console.log('║           🚗 XPENG Media Hub — self-hosted         ║');
  console.log('╚════════════════════════════════════════════════════╝');
  console.log(`  ▸ App           : http://${HOST}:${PORT}/`);
  console.log(`  ▸ Player IPTV   : http://${HOST}:${PORT}/iptv-player.html`);
  console.log(`  ▸ Proxy CORS    : http://${HOST}:${PORT}${PROXY_PATH}?url=...`);
  console.log(`  ▸ Health check  : http://${HOST}:${PORT}/healthz`);
  console.log(`  ▸ Fichiers      : ${STATIC_DIR}`);
  console.log(`  ▸ Réseau privé  : ${ALLOW_PRIVATE ? 'autorisé' : 'bloqué (PROXY_ALLOW_PRIVATE=true pour autoriser)'}`);
});

for (const sig of ['SIGINT', 'SIGTERM']) {
  process.on(sig, () => {
    console.log(`\n${sig} reçu, arrêt du serveur...`);
    server.close(() => process.exit(0));
    setTimeout(() => process.exit(0), 3000).unref();
  });
}

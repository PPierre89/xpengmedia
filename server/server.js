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
 * Modèle de sécurité du proxy (/api/proxy) :
 *   - le protocole ET l'adresse de destination sont validés à CHAQUE saut de
 *     redirection, jamais une seule fois au départ ;
 *   - la connexion est épinglée à l'adresse IP validée (lookup personnalisé),
 *     ce qui supprime la fenêtre de DNS rebinding entre la vérification et la
 *     connexion réelle ;
 *   - les adresses privées sont refusées par défaut, y compris sous leurs
 *     formes IPv6 encapsulées (::ffff:, ::a.b.c.d, NAT64, 6to4) ;
 *   - le corps distant n'est jamais renvoyé avec un type de contenu actif :
 *     type MIME sur liste blanche, nosniff, attachment et CSP sandbox, pour
 *     qu'aucun HTML/SVG distant ne puisse s'exécuter sur l'origine de l'app ;
 *   - aucun en-tête CORS n'est émis par défaut (l'app est sur la même origine).
 *
 * Variables d'environnement :
 *   PORT                 Port d'écoute                       (défaut: 8080)
 *   HOST                 Interface d'écoute                  (défaut: 0.0.0.0)
 *   STATIC_DIR           Dossier des fichiers statiques      (défaut: ./dist)
 *   PROXY_USER_AGENT     User-Agent envoyé au serveur IPTV   (défaut: VLC/3.0.20 LibVLC/3.0.20)
 *   PROXY_TIMEOUT_MS     Inactivité max d'une requête proxy  (défaut: 20000)
 *   PROXY_MAX_REDIRECTS  Redirections suivies au maximum     (défaut: 5)
 *   PROXY_ALLOW_PRIVATE  'true' pour autoriser le proxy vers le réseau local (défaut: false)
 *   ALLOWED_ORIGINS      Origines autorisées en CORS, séparées par des virgules
 *                        (défaut: aucune — l'app étant servie par ce serveur,
 *                         elle n'a besoin d'aucun en-tête CORS)
 */

import http from 'node:http';
import https from 'node:https';
import fs from 'node:fs';
import fsp from 'node:fs/promises';
import path from 'node:path';
import net from 'node:net';
import dns from 'node:dns';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT || 8080);
const HOST = process.env.HOST || '0.0.0.0';
const STATIC_DIR = path.resolve(process.env.STATIC_DIR || path.join(__dirname, '..', 'dist'));
const USER_AGENT = process.env.PROXY_USER_AGENT || 'VLC/3.0.20 LibVLC/3.0.20';
const PROXY_TIMEOUT_MS = Number(process.env.PROXY_TIMEOUT_MS || 20000);
const MAX_REDIRECTS = Number(process.env.PROXY_MAX_REDIRECTS || 5);
const ALLOW_PRIVATE = /^(1|true|yes|on)$/i.test(process.env.PROXY_ALLOW_PRIVATE || '');
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || '')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean);

const PROXY_PATH = '/api/proxy';
const MAX_PLAYLIST_BYTES = 32 * 1024 * 1024; // les playlists sont réécrites, donc bufferisées

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

/**
 * En-têtes CORS : aucun par défaut. L'application est servie par ce même
 * serveur, donc same-origin — un `Access-Control-Allow-Origin: *` ne servirait
 * qu'à laisser n'importe quel site lire les réponses du proxy.
 */
function corsHeadersFor(req) {
  if (!ALLOWED_ORIGINS.length) return {};
  const origin = req.headers.origin;
  const allowed =
    ALLOWED_ORIGINS.includes('*') ? '*' : ALLOWED_ORIGINS.includes(origin) ? origin : null;
  if (!allowed) return {};
  return {
    'Access-Control-Allow-Origin': allowed,
    'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
    'Access-Control-Allow-Headers': 'Range, Content-Type',
    'Access-Control-Expose-Headers': 'Content-Length, Content-Range, Content-Type',
    'Access-Control-Max-Age': '86400',
    ...(allowed === '*' ? {} : { Vary: 'Origin' }),
  };
}

/**
 * Le corps distant est arbitraire : il ne doit JAMAIS pouvoir s'exécuter sur
 * l'origine de l'application (où sont stockés les identifiants IPTV).
 * `nosniff` + type MIME sur liste blanche suffisent à rendre tout HTML/SVG
 * distant inerte ; la CSP sandbox et X-Frame-Options ferment le reste.
 */
const PROXY_SAFETY_HEADERS = {
  'X-Content-Type-Options': 'nosniff',
  'Content-Security-Policy': "sandbox; default-src 'none'",
  'X-Frame-Options': 'DENY',
  'Referrer-Policy': 'no-referrer',
};

/* ------------------------------------------------------------------ */
/* Classification des adresses (protection SSRF)                       */
/* ------------------------------------------------------------------ */

function isPrivateIpv4(ip) {
  const [a, b] = ip.split('.').map(Number);
  return (
    a === 0 ||                          // 0.0.0.0/8
    a === 10 ||                         // 10.0.0.0/8
    a === 127 ||                        // 127.0.0.0/8
    (a === 169 && b === 254) ||         // 169.254.0.0/16 link-local (métadonnées cloud)
    (a === 172 && b >= 16 && b <= 31) ||// 172.16.0.0/12
    (a === 192 && b === 168) ||         // 192.168.0.0/16
    (a === 192 && b === 0) ||           // 192.0.0.0/24 + 192.0.2.0/24
    (a === 198 && (b === 18 || b === 19)) || // 198.18.0.0/15 (bancs de test)
    (a === 100 && b >= 64 && b <= 127) ||    // 100.64.0.0/10 CGNAT
    a >= 224                            // multicast 224/4 + réservé 240/4
  );
}

/**
 * Développe une adresse IPv6 (déjà validée par net.isIP) en 16 octets.
 * Indispensable : le parseur d'URL WHATWG normalise `::ffff:192.168.1.1` en
 * `::ffff:c0a8:101`, donc toute comparaison textuelle passe à côté.
 */
function ipv6ToBytes(ip) {
  const zone = ip.indexOf('%');
  const clean = (zone === -1 ? ip : ip.slice(0, zone)).toLowerCase();
  const [head, tail] = clean.split('::');

  const parseGroups = (str) => {
    if (!str) return [];
    const bytes = [];
    for (const group of str.split(':')) {
      if (!group) continue;
      if (group.includes('.')) {
        const quad = group.split('.').map(Number);
        if (quad.length !== 4 || quad.some((n) => !Number.isInteger(n) || n < 0 || n > 255)) {
          return null;
        }
        bytes.push(...quad);
      } else {
        const value = parseInt(group, 16);
        if (!Number.isFinite(value)) return null;
        bytes.push((value >> 8) & 0xff, value & 0xff);
      }
    }
    return bytes;
  };

  const headBytes = parseGroups(head);
  if (headBytes === null) return null;

  if (tail === undefined) return headBytes.length === 16 ? headBytes : null;

  const tailBytes = parseGroups(tail);
  if (tailBytes === null) return null;

  const padding = 16 - headBytes.length - tailBytes.length;
  if (padding < 0) return null;
  return [...headBytes, ...new Array(padding).fill(0), ...tailBytes];
}

function bytesToIpv4(bytes) {
  return bytes.join('.');
}

function isPrivateIpv6(ip) {
  const b = ipv6ToBytes(ip);
  if (!b) return true; // adresse incompréhensible => on refuse

  const allZero = b.every((byte) => byte === 0);
  if (allZero) return true;                                   // ::
  if (b.slice(0, 15).every((x) => x === 0) && b[15] === 1) return true; // ::1

  if (b[0] === 0xfe && (b[1] & 0xc0) === 0x80) return true;   // fe80::/10 link-local
  if ((b[0] & 0xfe) === 0xfc) return true;                    // fc00::/7  ULA
  if (b[0] === 0xff) return true;                             // ff00::/8  multicast

  // IPv4 encapsulée : on reclasse l'IPv4 réellement jointe par la pile réseau.
  const firstTenZero = b.slice(0, 10).every((x) => x === 0);
  if (firstTenZero && b[10] === 0xff && b[11] === 0xff) {
    return isPrivateIpv4(bytesToIpv4(b.slice(12, 16)));        // ::ffff:a.b.c.d
  }
  if (b.slice(0, 12).every((x) => x === 0)) {
    return isPrivateIpv4(bytesToIpv4(b.slice(12, 16)));        // ::a.b.c.d
  }
  if (b[0] === 0x00 && b[1] === 0x64 && b[2] === 0xff && b[3] === 0x9b) {
    return isPrivateIpv4(bytesToIpv4(b.slice(12, 16)));        // 64:ff9b::/96 NAT64
  }
  if (b[0] === 0x20 && b[1] === 0x02) {
    return isPrivateIpv4(bytesToIpv4(b.slice(2, 6)));          // 2002::/16 6to4
  }

  return false;
}

export function isPrivateIp(ip) {
  const kind = net.isIP(ip);
  if (kind === 4) return isPrivateIpv4(ip);
  if (kind === 6) return isPrivateIpv6(ip);
  return true; // ce n'est pas une IP : on ne laisse pas passer sans vérification
}

class BlockedTargetError extends Error {
  constructor(message) {
    super(message);
    this.name = 'BlockedTargetError';
    this.code = 'EBLOCKED';
  }
}

/**
 * Vérifie protocole + adresse littérale. Appelée pour l'URL initiale ET pour
 * chaque redirection. Les noms de domaine, eux, sont contrôlés au moment de la
 * résolution par guardedLookup (pas de fenêtre TOCTOU).
 */
export function assertTargetAllowed(target) {
  if (target.protocol !== 'http:' && target.protocol !== 'https:') {
    throw new BlockedTargetError(`Protocole non supporté: ${target.protocol}`);
  }
  if (ALLOW_PRIVATE) return;

  const host = target.hostname.replace(/^\[|\]$/g, '');
  if (net.isIP(host) && isPrivateIp(host)) {
    throw new BlockedTargetError(
      `Cible sur le réseau privé refusée (${host}). ` +
        `Définis PROXY_ALLOW_PRIVATE=true si ton serveur IPTV est sur ton LAN.`
    );
  }
}

/**
 * Résolution DNS filtrante, utilisée comme `lookup` de la connexion : l'adresse
 * validée ici est exactement celle à laquelle le socket se connecte, donc un
 * enregistrement DNS à TTL court ne peut pas basculer vers le LAN entre la
 * vérification et la connexion.
 */
function guardedLookup(hostname, options, callback) {
  dns.lookup(hostname, { ...options, all: true }, (err, addresses) => {
    if (err) return callback(err);
    const list = Array.isArray(addresses) ? addresses : [addresses];
    const safe = ALLOW_PRIVATE ? list : list.filter((a) => !isPrivateIp(a.address));
    if (!safe.length) {
      return callback(
        new BlockedTargetError(
          `Cible sur le réseau privé refusée (${hostname}). ` +
            `Définis PROXY_ALLOW_PRIVATE=true si ton serveur IPTV est sur ton LAN.`
        )
      );
    }
    if (options.all) return callback(null, safe);
    return callback(null, safe[0].address, safe[0].family);
  });
}

/* ------------------------------------------------------------------ */
/* Type de contenu : jamais de contenu actif sur notre origine          */
/* ------------------------------------------------------------------ */

const SAFE_CONTENT_TYPES = new Set([
  'application/json',
  'application/octet-stream',
  'application/vnd.apple.mpegurl',
  'application/x-mpegurl',
  'audio/x-mpegurl',
  'audio/mpegurl',
  'text/plain',
]);

const SAFE_CONTENT_PREFIXES = ['audio/', 'video/', 'image/'];

/**
 * Renvoie le type à servir et si l'original a dû être déclassé.
 * Le déclassement identifie exactement le contenu potentiellement actif : on y
 * ajoute `Content-Disposition: attachment` pour neutraliser aussi le vecteur
 * « navigation directe vers /api/proxy?url=... », sans jamais l'appliquer aux
 * flux légitimes (une vidéo lue via <video src> doit rester lisible).
 */
export function resolveContentType(rawContentType) {
  const raw = (rawContentType || '').toLowerCase();
  const mime = raw.split(';')[0].trim();

  const allowed =
    // SVG = document actif (scripts inline) : jamais renvoyé tel quel.
    mime && mime !== 'image/svg+xml' && mime !== 'image/svg' &&
    (SAFE_CONTENT_TYPES.has(mime) || SAFE_CONTENT_PREFIXES.some((p) => mime.startsWith(p)));

  return allowed
    ? { contentType: raw, downgraded: false }
    : { contentType: 'application/octet-stream', downgraded: true };
}

export function safeContentType(rawContentType) {
  return resolveContentType(rawContentType).contentType;
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
  return ct.includes('mpegurl') || ct.includes('m3u') || /\.m3u8?(\?|$)/i.test(url);
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
/* Requête amont : validation à chaque saut de redirection             */
/* ------------------------------------------------------------------ */

function isRedirect(status) {
  return status === 301 || status === 302 || status === 303 || status === 307 || status === 308;
}

function sanitizeHeaderValue(value) {
  // Ceinture et bretelles : node rejette déjà CR/LF dans les valeurs d'en-tête.
  return String(value).replace(/[\r\n]/g, '').trim();
}

/**
 * Suit les redirections À LA MAIN pour re-valider chaque destination.
 * `redirect: 'follow'` laisserait un hôte public rediriger vers 127.0.0.1
 * ou le LAN sans repasser par le moindre contrôle.
 */
async function fetchUpstream(target, { method, headers, onRequest, hops = 0 }) {
  // `async` : la validation ci-dessous est appelée aussi depuis le callback de
  // réponse (suivi de redirection). Un throw synchrone y serait une exception
  // non capturée qui tuerait le process ; ici il devient un rejet de promesse.
  assertTargetAllowed(target);

  return new Promise((resolve, reject) => {
    const transport = target.protocol === 'https:' ? https : http;
    const req = transport.request(
      target,
      { method, headers, lookup: guardedLookup },
      (res) => {
        if (isRedirect(res.statusCode) && res.headers.location) {
          res.resume(); // on vide le corps de la redirection
          if (hops >= MAX_REDIRECTS) {
            return reject(new Error(`Trop de redirections (> ${MAX_REDIRECTS})`));
          }
          let next;
          try {
            next = new URL(res.headers.location, target);
          } catch {
            return reject(new Error(`Redirection invalide: ${res.headers.location}`));
          }
          return resolve(fetchUpstream(next, { method, headers, onRequest, hops: hops + 1 }));
        }
        resolve({ res, finalUrl: target.href });
      }
    );

    req.setTimeout(PROXY_TIMEOUT_MS, () => {
      req.destroy(Object.assign(new Error('Timeout du serveur distant'), { code: 'ETIMEDOUT' }));
    });
    req.on('error', reject);
    if (onRequest) onRequest(req);
    req.end();
  });
}

function readBody(res, limit) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;
    res.on('data', (chunk) => {
      size += chunk.length;
      if (size > limit) {
        res.destroy();
        reject(new Error('Playlist trop volumineuse'));
        return;
      }
      chunks.push(chunk);
    });
    res.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    res.on('error', reject);
  });
}

/* ------------------------------------------------------------------ */
/* Proxy                                                               */
/* ------------------------------------------------------------------ */

function sendJson(req, res, status, payload) {
  const body = JSON.stringify(payload, null, 2);
  res.writeHead(status, {
    ...corsHeadersFor(req),
    'Content-Type': 'application/json; charset=utf-8',
    'X-Content-Type-Options': 'nosniff',
    'Content-Length': Buffer.byteLength(body),
  });
  res.end(body);
}

async function handleProxy(req, res, requestUrl) {
  const rawTarget = requestUrl.searchParams.get('url');

  if (!rawTarget) {
    return sendJson(req, res, 400, {
      error: 'Paramètre "url" manquant',
      usage: `${PROXY_PATH}?url=http://mon-serveur-iptv.com/...`,
    });
  }

  let target;
  try {
    target = new URL(rawTarget);
  } catch {
    return sendJson(req, res, 400, { error: 'URL cible invalide' });
  }

  const headers = {
    'User-Agent': sanitizeHeaderValue(requestUrl.searchParams.get('ua') || USER_AGENT),
    Accept: sanitizeHeaderValue(req.headers.accept || '*/*'),
  };
  // Indispensable pour le seek vidéo et les segments partiels
  if (req.headers.range) headers.Range = sanitizeHeaderValue(req.headers.range);
  const referer = requestUrl.searchParams.get('referer');
  if (referer) headers.Referer = sanitizeHeaderValue(referer);

  let upstreamRequest = null;
  const abortUpstream = () => upstreamRequest?.destroy();
  req.on('close', abortUpstream);

  try {
    const { res: upstream, finalUrl } = await fetchUpstream(target, {
      method: req.method === 'HEAD' ? 'HEAD' : 'GET',
      headers,
      onRequest: (r) => {
        upstreamRequest = r;
      },
    });

    const rawContentType = upstream.headers['content-type'] || '';
    const { contentType, downgraded } = resolveContentType(rawContentType);
    const safetyHeaders = downgraded
      ? { ...PROXY_SAFETY_HEADERS, 'Content-Disposition': 'attachment' }
      : PROXY_SAFETY_HEADERS;

    // Playlists HLS : on réécrit les URLs internes pour que les segments passent
    // eux aussi par le proxy local. (?raw=1 permet de désactiver la réécriture.)
    const rawMode = requestUrl.searchParams.get('raw') === '1';
    if (!rawMode && req.method !== 'HEAD' && looksLikePlaylist(rawContentType, finalUrl)) {
      const text = await readBody(upstream, MAX_PLAYLIST_BYTES);
      const body = isHlsManifest(text) ? rewriteM3u8(text, finalUrl) : text;
      res.writeHead(upstream.statusCode, {
        ...corsHeadersFor(req),
        ...safetyHeaders,
        'Content-Type': contentType,
        'Content-Length': Buffer.byteLength(body),
        'Cache-Control': 'no-store',
      });
      return res.end(body);
    }

    const outHeaders = {
      ...corsHeadersFor(req),
      ...safetyHeaders,
      'Content-Type': contentType,
    };
    for (const h of ['content-length', 'content-range', 'accept-ranges', 'cache-control']) {
      const v = upstream.headers[h];
      if (v) outHeaders[h] = v;
    }

    res.writeHead(upstream.statusCode, outHeaders);

    if (req.method === 'HEAD') {
      upstream.resume();
      return res.end();
    }

    // Streaming : on relaie le flux tel quel (vidéo, segments .ts, gros catalogues JSON)
    upstream.on('error', () => res.destroy());
    res.on('close', () => upstream.destroy());
    upstream.pipe(res);
  } catch (err) {
    req.off('close', abortUpstream);
    if (res.headersSent) return res.destroy();

    if (err.code === 'EBLOCKED') {
      return sendJson(req, res, 400, { error: 'Cible refusée', message: err.message });
    }
    const timedOut = err.code === 'ETIMEDOUT';
    sendJson(req, res, timedOut ? 504 : 502, {
      error: timedOut ? 'Timeout du serveur distant' : 'Impossible de joindre le serveur distant',
      message: err.message,
      target: target.href,
    });
  }
}

/* ------------------------------------------------------------------ */
/* Fichiers statiques                                                  */
/* ------------------------------------------------------------------ */

function isInsideStaticDir(filePath) {
  const relative = path.relative(STATIC_DIR, filePath);
  return relative === '' || (!relative.startsWith('..') && !path.isAbsolute(relative));
}

async function serveStatic(req, res, pathname) {
  let relative;
  try {
    relative = decodeURIComponent(pathname);
  } catch {
    res.writeHead(400, { 'Content-Type': 'text/plain; charset=utf-8' }).end('Bad request');
    return;
  }
  if (relative.endsWith('/')) relative += 'index.html';

  let filePath = path.join(STATIC_DIR, relative);
  // Anti path-traversal (path.relative : pas de faux positif sur un dossier
  // frère dont le nom commence par celui de STATIC_DIR)
  if (!isInsideStaticDir(filePath)) {
    res.writeHead(403, { 'Content-Type': 'text/plain; charset=utf-8' }).end('Forbidden');
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
  const base = path.basename(filePath);

  // Le service worker et le manifeste pilotent les mises à jour de la PWA :
  // les mettre en cache retarderait d'autant la prise en compte d'un
  // redéploiement. Les assets hachés, eux, sont immuables par construction.
  const isPwaControlFile = base === 'sw.js' || ext === '.webmanifest';
  const isHashedAsset = filePath.includes(`${path.sep}assets${path.sep}`);

  const headers = {
    'Content-Type': MIME_TYPES[ext] || 'application/octet-stream',
    'Content-Length': stat.size,
    'X-Content-Type-Options': 'nosniff',
    'Cache-Control':
      ext === '.html' || isPwaControlFile
        ? 'no-cache'
        : isHashedAsset
          ? 'public, max-age=31536000, immutable'
          : 'public, max-age=3600',
    'Last-Modified': stat.mtime.toUTCString(),
  };
  // Autorise explicitement le SW à contrôler toute l'origine.
  if (base === 'sw.js') headers['Service-Worker-Allowed'] = '/';

  res.writeHead(200, headers);
  if (req.method === 'HEAD') return res.end();
  fs.createReadStream(filePath)
    .on('error', () => res.destroy())
    .pipe(res);
}

/* ------------------------------------------------------------------ */

const server = http.createServer((req, res) => {
  let requestUrl;
  try {
    requestUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  } catch {
    res.writeHead(400).end();
    return;
  }
  const pathname = requestUrl.pathname;

  if (req.method === 'OPTIONS') {
    res.writeHead(204, corsHeadersFor(req));
    return res.end();
  }

  if (pathname === '/healthz') {
    return sendJson(req, res, 200, {
      status: 'ok',
      app: 'xpengmedia',
      proxy: PROXY_PATH,
      uptime: Math.round(process.uptime()),
    });
  }

  if (pathname === PROXY_PATH) {
    if (req.method !== 'GET' && req.method !== 'HEAD') {
      res.writeHead(405, { Allow: 'GET, HEAD, OPTIONS' }).end();
      return;
    }
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

// Démarrage uniquement en exécution directe (permet d'importer les fonctions
// de sécurité dans des tests sans ouvrir de port).
if (process.argv[1] && path.resolve(process.argv[1]) === __filename) {
  server.listen(PORT, HOST, () => {
    console.log('╔════════════════════════════════════════════════════╗');
    console.log('║           🚗 XPENG Media Hub — self-hosted         ║');
    console.log('╚════════════════════════════════════════════════════╝');
    console.log(`  ▸ App           : http://${HOST}:${PORT}/`);
    console.log(`  ▸ Player IPTV   : http://${HOST}:${PORT}/iptv-player.html`);
    console.log(`  ▸ Proxy CORS    : http://${HOST}:${PORT}${PROXY_PATH}?url=...`);
    console.log(`  ▸ Health check  : http://${HOST}:${PORT}/healthz`);
    console.log(`  ▸ Fichiers      : ${STATIC_DIR}`);
    console.log(
      `  ▸ Réseau privé  : ${ALLOW_PRIVATE ? 'autorisé' : 'bloqué (PROXY_ALLOW_PRIVATE=true pour autoriser)'}`
    );
    console.log(
      `  ▸ CORS          : ${ALLOWED_ORIGINS.length ? ALLOWED_ORIGINS.join(', ') : 'désactivé (same-origin)'}`
    );
  });

  for (const sig of ['SIGINT', 'SIGTERM']) {
    process.on(sig, () => {
      console.log(`\n${sig} reçu, arrêt du serveur...`);
      server.close(() => process.exit(0));
      setTimeout(() => process.exit(0), 3000).unref();
    });
  }
}

export { server };

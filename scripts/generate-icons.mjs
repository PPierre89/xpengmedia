/**
 * Génère les icônes PNG de la PWA sans dépendance externe.
 *
 * Motif : un « X » (logo XPENG) cyan sur fond ardoise, dessiné
 * mathématiquement puis encodé en PNG à la main (zlib est natif à Node).
 * Évite d'ajouter une chaîne d'outils graphique juste pour 4 fichiers.
 */
import { deflateSync } from 'node:zlib';
import { writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const OUT = join(dirname(fileURLToPath(import.meta.url)), '..', 'public', 'icons', 'pwa');

const BG = [15, 23, 42];      // slate-950, fond de l'app
const FG = [0, 217, 255];     // cyan XPENG

function crc32(buf) {
  let c, crc = 0xffffffff;
  for (let n = 0; n < buf.length; n++) {
    c = (crc ^ buf[n]) & 0xff;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    crc = c ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([len, body, crc]);
}

function encodePng(width, height, rgba) {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;   // profondeur 8 bits
  ihdr[9] = 6;   // RGBA
  // 10..12 : compression / filtre / entrelacement = 0
  const raw = Buffer.alloc(height * (width * 4 + 1));
  for (let y = 0; y < height; y++) {
    raw[y * (width * 4 + 1)] = 0; // filtre None
    rgba.copy(raw, y * (width * 4 + 1) + 1, y * width * 4, (y + 1) * width * 4);
  }
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

/** Distance d'un point au segment [a,b] */
function distToSegment(px, py, ax, ay, bx, by) {
  const dx = bx - ax, dy = by - ay;
  const t = Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / (dx * dx + dy * dy)));
  return Math.hypot(px - (ax + t * dx), py - (ay + t * dy));
}

/**
 * @param size      côté en pixels
 * @param inset     marge autour du X, en fraction (0.28 = zone de sécurité maskable)
 * @param rounded   coins arrondis (icônes classiques) ou fond pleine page (maskable)
 */
function drawIcon(size, inset, rounded) {
  const rgba = Buffer.alloc(size * size * 4);
  const SS = 3; // supersampling pour l'anti-aliasing
  const thickness = size * 0.13;
  const a = size * inset, b = size * (1 - inset);
  const radius = size * 0.22;

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      let inX = 0, inBg = 0;
      for (let sy = 0; sy < SS; sy++) {
        for (let sx = 0; sx < SS; sx++) {
          const px = x + (sx + 0.5) / SS;
          const py = y + (sy + 0.5) / SS;

          if (rounded) {
            // test du rectangle à coins arrondis
            const cx = Math.max(radius, Math.min(size - radius, px));
            const cy = Math.max(radius, Math.min(size - radius, py));
            if (Math.hypot(px - cx, py - cy) <= radius) inBg++;
          } else {
            inBg++;
          }

          const d = Math.min(
            distToSegment(px, py, a, a, b, b),
            distToSegment(px, py, a, b, b, a)
          );
          if (d <= thickness / 2) inX++;
        }
      }
      const total = SS * SS;
      const alphaBg = inBg / total;
      const alphaX = inX / total;
      const i = (y * size + x) * 4;
      // le X est composé par-dessus le fond
      const mix = (c1, c2) => Math.round(c1 * (1 - alphaX) + c2 * alphaX);
      rgba[i] = mix(BG[0], FG[0]);
      rgba[i + 1] = mix(BG[1], FG[1]);
      rgba[i + 2] = mix(BG[2], FG[2]);
      rgba[i + 3] = Math.round(255 * Math.max(alphaBg, alphaX * alphaBg));
    }
  }
  return encodePng(size, size, rgba);
}

mkdirSync(OUT, { recursive: true });
const files = [
  ['icon-192.png', drawIcon(192, 0.20, true)],
  ['icon-512.png', drawIcon(512, 0.20, true)],
  ['icon-maskable-512.png', drawIcon(512, 0.30, false)], // zone de sécurité élargie
  ['apple-touch-icon.png', drawIcon(180, 0.20, false)],  // iOS n'arrondit pas lui-même
];
for (const [name, buf] of files) {
  writeFileSync(join(OUT, name), buf);
  console.log(`  ${name.padEnd(24)} ${(buf.length / 1024).toFixed(1)} Ko`);
}

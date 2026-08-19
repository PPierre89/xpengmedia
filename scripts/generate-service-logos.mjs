#!/usr/bin/env node
/**
 * Génère un logo local pour CHAQUE service du catalogue.
 *
 * Pourquoi : les logos étaient chargés depuis quatre CDN tiers
 * (cdn.simpleicons.org, logo.clearbit.com, cdn-icons-png.flaticon.com,
 * upload.wikimedia.org). Résultat : des vignettes cassées dès que le réseau
 * mobile de la voiture est mauvais, et 35 slugs simple-icons qui n'existent
 * même plus côté CDN. Ici tout est embarqué dans /public, donc disponible hors
 * ligne et jamais cassé.
 *
 * Sortie : public/icons/services/<id>.svg (tuile 64×64, style XPENG).
 *
 *   node scripts/generate-service-logos.mjs           génère + met à jour platforms.ts
 *   node scripts/generate-service-logos.mjs --check    échoue si un fichier manque
 *                                                      ou n'est plus à jour
 */
import { mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import * as simpleIcons from 'simple-icons';

import { glyphs } from './logos/glyphs.mjs';
import { logoMap } from './logos/logo-map.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const outDir = join(root, 'public', 'icons', 'services');
const platformsFile = join(root, 'src', 'data', 'platforms.ts');

const checkOnly = process.argv.includes('--check');

const FONT_STACK =
  "system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif";

// -------------------------------------------------------------------- outils

const bySlug = new Map();
for (const icon of Object.values(simpleIcons)) {
  if (icon && typeof icon === 'object' && icon.slug) bySlug.set(icon.slug, icon);
}

/** Luminance relative (WCAG) d'une couleur hexadécimale. */
function luminance(hex) {
  const channels = [0, 2, 4].map((i) => {
    const c = parseInt(hex.slice(i, i + 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
}

/** Éclaircit une couleur vers le blanc, pour le haut du dégradé de la tuile. */
function lighten(hex, amount) {
  const mixed = [0, 2, 4].map((i) => {
    const c = parseInt(hex.slice(i, i + 2), 16);
    return Math.round(c + (255 - c) * amount);
  });
  return mixed.map((c) => c.toString(16).padStart(2, '0')).join('');
}

/** Tracé blanc sur les marques foncées, ardoise sur les marques claires. */
function foreground(hex) {
  return luminance(hex) > 0.5 ? '#0f172a' : '#ffffff';
}

function escapeXml(value) {
  return value.replace(/[&<>"']/g, (c) => `&${{ '&': 'amp', '<': 'lt', '>': 'gt', '"': 'quot', "'": 'apos' }[c]};`);
}

/** Retire les drapeaux emoji des noms de service pour l'attribut aria-label. */
function cleanName(name) {
  return name.replace(/[\u{1F1E6}-\u{1F1FF}]/gu, '').replace(/\s+/g, ' ').trim();
}

// ------------------------------------------------------------------- rendus

function renderPaths(paths, viewBoxSize, drawSize, fill) {
  const scale = drawSize / viewBoxSize;
  const offset = (64 - drawSize) / 2;
  const body = paths
    .map((d) => `<path d="${d}" fill="${fill}" fill-rule="evenodd" clip-rule="evenodd"/>`)
    .join('');
  return `<g transform="translate(${round(offset)} ${round(offset)}) scale(${round(scale)})">${body}</g>`;
}

function renderText(text, fill) {
  const usable = 52;
  const widthRatio = 0.62; // largeur moyenne d'un caractère gras, en em
  const fontSize = clamp(usable / (widthRatio * text.length), 10, 32);
  const textLength = Math.min(usable, text.length * fontSize * widthRatio);
  // Ligne de base calculée à la main : `dominant-baseline` n'est pas rendu de
  // façon identique par tous les moteurs embarqués.
  const baseline = 32 + fontSize * 0.35;
  return (
    `<text x="32" y="${round(baseline)}" text-anchor="middle" fill="${fill}"` +
    ` font-family="${FONT_STACK}" font-size="${round(fontSize)}" font-weight="700"` +
    ` textLength="${round(textLength)}" lengthAdjust="spacingAndGlyphs">${escapeXml(text)}</text>`
  );
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function round(value) {
  return Math.round(value * 100) / 100;
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** Construit le SVG complet d'un service. */
function renderLogo(id, name, source) {
  let hex = source.hex;
  let inner;

  if (source.si) {
    const icon = bySlug.get(source.si);
    if (!icon) throw new Error(`${id}: slug simple-icons inconnu « ${source.si} »`);
    hex = hex || icon.hex;
    inner = renderPaths([icon.path], 24, 34, foreground(hex));
  } else if (source.glyph) {
    const paths = glyphs[source.glyph];
    if (!paths) throw new Error(`${id}: pictogramme inconnu « ${source.glyph} »`);
    if (!hex) throw new Error(`${id}: « hex » est obligatoire pour un pictogramme`);
    inner = renderPaths(paths, 24, 32, foreground(hex));
  } else if (source.text) {
    if (!hex) throw new Error(`${id}: « hex » est obligatoire pour un logotype`);
    inner = renderText(source.text, foreground(hex));
  } else {
    throw new Error(`${id}: la source doit contenir « si », « glyph » ou « text »`);
  }

  const label = escapeXml(cleanName(name));
  const gradientId = `g-${id}`;
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" role="img" aria-label="${label}">` +
    `<title>${label}</title>` +
    `<defs><linearGradient id="${gradientId}" x1="0" y1="0" x2="1" y2="1">` +
    `<stop offset="0" stop-color="#${lighten(hex, 0.22)}"/>` +
    `<stop offset="1" stop-color="#${hex}"/>` +
    `</linearGradient></defs>` +
    `<rect x="2" y="2" width="60" height="60" rx="14" fill="url(#${gradientId})"/>` +
    inner +
    `</svg>\n`
  );
}

// -------------------------------------------------------------------- script

const { videoCategories, musicCategories, gamesCategories, chargingCategories, otherServicesCategories } =
  await import(join(root, 'src', 'data', 'platforms.ts'));

const services = [videoCategories, musicCategories, gamesCategories, chargingCategories, otherServicesCategories]
  .flat()
  .flatMap((category) => category.platforms);

const missing = services.filter((service) => !logoMap[service.id]);
if (missing.length > 0) {
  console.error(`❌ ${missing.length} service(s) sans logo déclaré dans scripts/logos/logo-map.mjs :`);
  missing.forEach((service) => console.error(`   - ${service.id} (${service.name})`));
  process.exit(1);
}

const knownIds = new Set(services.map((service) => service.id));
const orphans = Object.keys(logoMap).filter((id) => !knownIds.has(id));
if (orphans.length > 0) {
  console.error(`❌ ${orphans.length} entrée(s) de logo-map.mjs ne correspondent à aucun service : ${orphans.join(', ')}`);
  process.exit(1);
}

mkdirSync(outDir, { recursive: true });

const stale = [];
const expectedFiles = new Set();

for (const service of services) {
  const svg = renderLogo(service.id, service.name, logoMap[service.id]);
  const file = join(outDir, `${service.id}.svg`);
  expectedFiles.add(`${service.id}.svg`);

  let current = null;
  try {
    current = readFileSync(file, 'utf8');
  } catch {
    /* fichier absent */
  }

  if (current === svg) continue;
  if (checkOnly) stale.push(service.id);
  else writeFileSync(file, svg);
}

// Nettoie les logos de services supprimés du catalogue.
const obsolete = readdirSync(outDir).filter((file) => file.endsWith('.svg') && !expectedFiles.has(file));
if (obsolete.length > 0) {
  if (checkOnly) stale.push(...obsolete.map((file) => `${file} (obsolète)`));
  else obsolete.forEach((file) => rmSync(join(outDir, file)));
}

// Chaque service pointe vers son fichier local.
let platformsSource = readFileSync(platformsFile, 'utf8');
let rewritten = 0;
for (const service of services) {
  const pattern = new RegExp(`(id: '${escapeRegExp(service.id)}',[\\s\\S]{0,600}?icon: ')([^']*)(')`);
  platformsSource = platformsSource.replace(pattern, (whole, before, currentIcon, after) => {
    const expected = `/icons/services/${service.id}.svg`;
    if (currentIcon === expected) return whole;
    rewritten += 1;
    return `${before}${expected}${after}`;
  });
}

if (rewritten > 0) {
  if (checkOnly) stale.push(`${rewritten} champ(s) « icon » de platforms.ts`);
  else writeFileSync(platformsFile, platformsSource);
}

if (checkOnly) {
  if (stale.length > 0) {
    console.error(`❌ ${stale.length} élément(s) à régénérer : ${stale.join(', ')}`);
    console.error('   Lancez : npm run logos');
    process.exit(1);
  }
  console.log(`✅ ${services.length} logos de services à jour.`);
} else {
  const kinds = { si: 0, text: 0, glyph: 0 };
  services.forEach((service) => {
    const source = logoMap[service.id];
    kinds[source.si ? 'si' : source.glyph ? 'glyph' : 'text'] += 1;
  });
  console.log(
    `✅ ${services.length} logos générés dans public/icons/services/ ` +
      `(${kinds.si} marques officielles, ${kinds.text} logotypes, ${kinds.glyph} pictogrammes)` +
      (rewritten > 0 ? `, ${rewritten} champ(s) « icon » mis à jour dans platforms.ts` : '')
  );
}

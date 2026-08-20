/**
 * Moteur de synchronisation côté navigateur.
 *
 * Le problème à résoudre : savoir quelles clés ont changé localement depuis la
 * dernière synchronisation, sans instrumenter les dizaines d'endroits qui
 * écrivent déjà dans `localStorage` (contextes React, outils embarqués,
 * player IPTV…).
 *
 * La solution : au lieu d'intercepter les écritures, on compare. Après chaque
 * synchronisation on retient, pour chaque clé, une empreinte de sa valeur et
 * l'horodatage correspondant. À la synchronisation suivante, une empreinte
 * différente signifie « modifiée depuis, ici » et l'horodatage passe à
 * maintenant. Aucun code existant n'a besoin d'être touché, et une écriture
 * faite par un outil qui ignore tout de la synchronisation est quand même
 * détectée.
 *
 * Première synchronisation d'un appareil : les clés inconnues partent avec
 * l'horodatage 0. Si le serveur a déjà quelque chose, c'est lui qui gagne — on
 * ne veut pas qu'un appareil fraîchement installé écrase les favoris des
 * autres. Si le serveur est vide, la valeur locale est adoptée telle quelle.
 */

import type { SyncEntry } from './serverApi';

export const SYNC_CONFIG_KEY = 'xpeng_sync_config';
export const SYNC_META_KEY = 'xpeng_sync_meta';

/** Doit rester aligné sur SYNCABLE_KEYS de server/sync.js. */
export const DEFAULT_SYNC_KEYS = [
  'favorites',
  'favoriteCategories',
  'favoriteTags',
  'hiddenPlatforms',
  'xpeng_locale',
  'theme',
  'xpeng_usage_stats',
  'xpeng_web_notes_v2',
] as const;

export interface SyncConfig {
  enabled: boolean;
  token: string;
  serverUrl: string;
}

export interface SyncMetaEntry {
  updatedAt: number;
  hash: string;
}

export type SyncMeta = Record<string, SyncMetaEntry>;

/** Sous-ensemble de `Storage` réellement utilisé — facilite les tests. */
export interface KeyValueStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export const emptyConfig = (): SyncConfig => ({ enabled: false, token: '', serverUrl: '' });

/**
 * Empreinte FNV-1a de la valeur brute.
 *
 * On ne cherche pas de résistance cryptographique : uniquement à détecter
 * qu'une valeur a changé. La longueur est concaténée pour écarter les
 * collisions triviales entre chaînes de tailles différentes.
 */
export function fingerprint(raw: string | null): string {
  if (raw === null) return 'absent';
  let hash = 0x811c9dc5;
  for (let i = 0; i < raw.length; i += 1) {
    hash ^= raw.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return `${raw.length.toString(36)}.${hash.toString(36)}`;
}

function readJson<T>(storage: KeyValueStorage, key: string, fallback: T): T {
  try {
    const raw = storage.getItem(key);
    return raw === null ? fallback : (JSON.parse(raw) as T);
  } catch {
    return fallback;
  }
}

export function readConfig(storage: KeyValueStorage): SyncConfig {
  const stored = readJson<Partial<SyncConfig>>(storage, SYNC_CONFIG_KEY, {});
  return {
    enabled: stored.enabled === true,
    token: typeof stored.token === 'string' ? stored.token : '',
    serverUrl: typeof stored.serverUrl === 'string' ? stored.serverUrl : '',
  };
}

export function writeConfig(storage: KeyValueStorage, config: SyncConfig): void {
  storage.setItem(SYNC_CONFIG_KEY, JSON.stringify(config));
}

export function readMeta(storage: KeyValueStorage): SyncMeta {
  return readJson<SyncMeta>(storage, SYNC_META_KEY, {});
}

export function writeMeta(storage: KeyValueStorage, meta: SyncMeta): void {
  storage.setItem(SYNC_META_KEY, JSON.stringify(meta));
}

/**
 * Construit ce que cet appareil a à proposer au serveur.
 *
 * Une clé présente dans les métadonnées mais absente du stockage a été
 * supprimée ici : elle part en pierre tombale, sans quoi le serveur la
 * réinstallerait au prochain aller-retour.
 */
export function collectLocalEntries(
  storage: KeyValueStorage,
  keys: readonly string[],
  meta: SyncMeta,
  now: number
): Record<string, SyncEntry> {
  const entries: Record<string, SyncEntry> = {};

  for (const key of keys) {
    const raw = storage.getItem(key);
    const known = meta[key];
    const current = fingerprint(raw);

    if (raw === null) {
      // Jamais vue ici et jamais synchronisée : rien à dire au serveur.
      if (!known || known.hash === 'absent') continue;
      entries[key] = { deleted: true, updatedAt: now };
      continue;
    }

    let value: unknown;
    try {
      value = JSON.parse(raw);
    } catch {
      // Les valeurs non-JSON (le thème est stocké en texte brut) partent
      // telles quelles ; elles seront réécrites à l'identique à l'arrivée.
      value = raw;
    }

    // Jamais synchronisée ici : horodatage 0, pour que le serveur l'emporte
    // s'il a déjà quelque chose. Un appareil fraîchement installé ne doit pas
    // écraser les favoris des autres avec ses valeurs par défaut.
    // Déjà connue mais empreinte différente : modifiée ici depuis la dernière
    // synchronisation, elle repart donc avec l'heure courante.
    const updatedAt = !known ? 0 : known.hash === current ? known.updatedAt : now;
    entries[key] = { value, updatedAt };
  }

  return entries;
}

/** Une valeur JSON se réécrit sérialisée ; une chaîne simple reste brute. */
function serialize(value: unknown): string {
  return typeof value === 'string' ? value : JSON.stringify(value);
}

/**
 * Applique la réponse du serveur au stockage local.
 *
 * @returns les clés réellement modifiées ici — l'interface s'en sert pour
 *          proposer un rechargement, les contextes React ayant déjà lu leur
 *          état au montage.
 */
export function applyServerEntries(
  storage: KeyValueStorage,
  serverEntries: Record<string, SyncEntry>,
  meta: SyncMeta,
  keys: readonly string[]
): { changed: string[]; meta: SyncMeta } {
  const permitted = new Set(keys);
  const nextMeta: SyncMeta = { ...meta };
  const changed: string[] = [];

  for (const [key, entry] of Object.entries(serverEntries)) {
    if (!permitted.has(key)) continue;

    if (entry.deleted) {
      if (storage.getItem(key) !== null) {
        storage.removeItem(key);
        changed.push(key);
      }
      nextMeta[key] = { updatedAt: entry.updatedAt, hash: 'absent' };
      continue;
    }

    const serialized = serialize(entry.value);
    if (storage.getItem(key) !== serialized) {
      storage.setItem(key, serialized);
      changed.push(key);
    }
    nextMeta[key] = { updatedAt: entry.updatedAt, hash: fingerprint(serialized) };
  }

  // Une clé qu'on vient de pousser mais que le serveur ne renvoie pas (rejetée
  // faute d'être dans sa liste blanche) ne doit pas rester marquée comme
  // synchronisée.
  for (const key of Object.keys(nextMeta)) {
    if (!permitted.has(key)) delete nextMeta[key];
  }

  return { changed, meta: nextMeta };
}

/**
 * Recale les métadonnées sur l'état local après un envoi réussi, pour les clés
 * que le serveur a acceptées sans les modifier.
 */
export function refreshMetaFromStorage(
  storage: KeyValueStorage,
  keys: readonly string[],
  meta: SyncMeta,
  sent: Record<string, SyncEntry>
): SyncMeta {
  const next: SyncMeta = { ...meta };
  for (const key of keys) {
    const entry = sent[key];
    if (!entry || entry.deleted) continue;
    if (next[key]?.updatedAt !== undefined && next[key].updatedAt > entry.updatedAt) continue;
    next[key] = { updatedAt: entry.updatedAt, hash: fingerprint(storage.getItem(key)) };
  }
  return next;
}

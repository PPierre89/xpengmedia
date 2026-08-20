/**
 * Exécution d'un cycle de synchronisation complet.
 *
 * Partagé entre le démarrage (main.tsx, avant le rendu) et la session
 * (SyncContext). Au démarrage, on veut que l'état fusionné soit déjà dans
 * `localStorage` quand les contextes React le lisent au montage : c'est ce qui
 * évite d'avoir à réhydrater tous les contextes à chaud.
 */
import {
  pushAndPull,
  ServerApiError,
  type SyncEntry,
} from './serverApi';
import {
  applyServerEntries,
  collectLocalEntries,
  DEFAULT_SYNC_KEYS,
  readConfig,
  readMeta,
  refreshMetaFromStorage,
  writeMeta,
  type KeyValueStorage,
  type SyncConfig,
} from './syncEngine';

export interface SyncOutcome {
  ok: boolean;
  /** Clés modifiées localement par le serveur — l'app doit se recharger. */
  changed: string[];
  revision?: number;
  rejected?: string[];
  error?: string;
  /** Vrai si le serveur a refusé le jeton : inutile de réessayer en boucle. */
  unauthorized?: boolean;
}

export async function runSync(
  storage: KeyValueStorage,
  config: SyncConfig,
  { keys = DEFAULT_SYNC_KEYS, now = Date.now(), signal }: {
    keys?: readonly string[];
    now?: number;
    signal?: AbortSignal;
  } = {}
): Promise<SyncOutcome> {
  if (!config.enabled || !config.token) {
    return { ok: false, changed: [], error: 'synchronisation désactivée' };
  }

  const meta = readMeta(storage);
  const sent = collectLocalEntries(storage, keys, meta, now);

  let response;
  try {
    response = await pushAndPull(sent, {
      token: config.token,
      serverUrl: config.serverUrl || undefined,
      signal,
    });
  } catch (error) {
    const apiError = error as ServerApiError;
    return {
      ok: false,
      changed: [],
      error: apiError?.message ?? 'échec de la synchronisation',
      unauthorized: apiError?.status === 401,
    };
  }

  // D'abord recaler ce qu'on vient d'envoyer, ensuite appliquer ce que le
  // serveur renvoie : dans cet ordre, une valeur poussée puis renvoyée à
  // l'identique n'est pas comptée comme un changement à recharger.
  const afterPush = refreshMetaFromStorage(storage, keys, meta, sent as Record<string, SyncEntry>);
  const applied = applyServerEntries(storage, response.entries, afterPush, keys);
  writeMeta(storage, applied.meta);

  return {
    ok: true,
    changed: applied.changed,
    revision: response.revision,
    rejected: response.rejected,
  };
}

/**
 * Synchronisation de démarrage, plafonnée en temps.
 *
 * Un NAS éteint ou un réseau capricieux ne doit jamais retarder l'affichage de
 * l'interface dans la voiture : passé le délai, on rend l'application avec
 * l'état local et la synchronisation reprendra pendant la session.
 */
export async function runBootSync(
  storage: KeyValueStorage,
  timeoutMs = 2500
): Promise<SyncOutcome> {
  const config = readConfig(storage);
  if (!config.enabled || !config.token) {
    return { ok: false, changed: [], error: 'synchronisation désactivée' };
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await runSync(storage, config, { signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

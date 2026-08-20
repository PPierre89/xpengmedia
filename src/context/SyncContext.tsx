import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';

import { fetchCapabilities, type ServerCapabilities } from '../utils/serverApi';
import { runSync } from '../utils/runSync';
import {
  emptyConfig,
  readConfig,
  writeConfig,
  type SyncConfig,
} from '../utils/syncEngine';

export type SyncStatus = 'disabled' | 'idle' | 'syncing' | 'ok' | 'error' | 'unauthorized';

interface SyncContextValue {
  config: SyncConfig;
  status: SyncStatus;
  lastSyncAt: Date | null;
  lastError: string | null;
  /** Clés que le serveur a modifiées ici : l'app doit être rechargée. */
  pendingReload: string[];
  /** Ce que le serveur déclare savoir faire (null tant qu'on n'a pas demandé). */
  capabilities: ServerCapabilities | null;
  configure: (config: SyncConfig) => Promise<void>;
  disable: () => void;
  syncNow: () => Promise<void>;
  refreshCapabilities: () => Promise<void>;
}

const SyncContext = createContext<SyncContextValue | undefined>(undefined);

/** Toutes les 5 minutes : assez pour suivre, assez peu pour ne rien coûter. */
const PERIODIC_SYNC_MS = 5 * 60 * 1000;

export const SyncProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [config, setConfig] = useState<SyncConfig>(() =>
    typeof window === 'undefined' ? emptyConfig() : readConfig(window.localStorage)
  );
  const [status, setStatus] = useState<SyncStatus>(config.enabled ? 'idle' : 'disabled');
  const [lastSyncAt, setLastSyncAt] = useState<Date | null>(null);
  const [lastError, setLastError] = useState<string | null>(null);
  const [pendingReload, setPendingReload] = useState<string[]>([]);
  const [capabilities, setCapabilities] = useState<ServerCapabilities | null>(null);

  // Une synchronisation à la fois : le minuteur, le retour d'onglet et un clic
  // manuel peuvent se déclencher en même temps.
  const running = useRef(false);

  const sync = useCallback(
    async (current: SyncConfig) => {
      if (typeof window === 'undefined') return;
      if (!current.enabled || !current.token) {
        setStatus('disabled');
        return;
      }
      if (running.current) return;

      running.current = true;
      setStatus('syncing');
      try {
        const outcome = await runSync(window.localStorage, current);
        if (outcome.ok) {
          setStatus('ok');
          setLastError(null);
          setLastSyncAt(new Date());
          if (outcome.changed.length > 0) {
            setPendingReload((previous) => [...new Set([...previous, ...outcome.changed])]);
          }
        } else {
          setStatus(outcome.unauthorized ? 'unauthorized' : 'error');
          setLastError(outcome.error ?? 'échec de la synchronisation');
        }
      } finally {
        running.current = false;
      }
    },
    []
  );

  const syncNow = useCallback(() => sync(config), [sync, config]);

  const refreshCapabilities = useCallback(async () => {
    try {
      setCapabilities(await fetchCapabilities(config.serverUrl || undefined));
    } catch {
      setCapabilities({ sync: { enabled: false, keys: [] }, vehicle: { enabled: false, provider: null } });
    }
  }, [config.serverUrl]);

  const configure = useCallback(
    async (next: SyncConfig) => {
      if (typeof window !== 'undefined') writeConfig(window.localStorage, next);
      setConfig(next);
      setPendingReload([]);
      if (next.enabled) await sync(next);
      else setStatus('disabled');
    },
    [sync]
  );

  const disable = useCallback(() => {
    const next = { ...emptyConfig(), serverUrl: config.serverUrl };
    if (typeof window !== 'undefined') writeConfig(window.localStorage, next);
    setConfig(next);
    setStatus('disabled');
    setLastError(null);
  }, [config.serverUrl]);

  // Rythme de fond + rattrapage au retour sur l'onglet. Sur l'écran de la
  // voiture, l'application reste ouverte des heures : sans le minuteur, elle ne
  // verrait jamais ce qui a été modifié depuis le téléphone.
  useEffect(() => {
    if (!config.enabled || !config.token) return undefined;

    const timer = window.setInterval(() => void sync(config), PERIODIC_SYNC_MS);
    const onVisible = () => {
      if (document.visibilityState === 'visible') void sync(config);
    };
    document.addEventListener('visibilitychange', onVisible);

    return () => {
      window.clearInterval(timer);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [config, sync]);

  const value = useMemo<SyncContextValue>(
    () => ({
      config,
      status,
      lastSyncAt,
      lastError,
      pendingReload,
      capabilities,
      configure,
      disable,
      syncNow,
      refreshCapabilities,
    }),
    [
      config,
      status,
      lastSyncAt,
      lastError,
      pendingReload,
      capabilities,
      configure,
      disable,
      syncNow,
      refreshCapabilities,
    ]
  );

  return <SyncContext.Provider value={value}>{children}</SyncContext.Provider>;
};

export const useSync = (): SyncContextValue => {
  const context = useContext(SyncContext);
  if (context === undefined) {
    throw new Error('useSync doit être utilisé dans un SyncProvider');
  }
  return context;
};

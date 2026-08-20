import { useCallback, useEffect, useRef, useState } from 'react';

import { useSync } from '../context/SyncContext';
import {
  fetchVehicleState,
  fetchVehicleStatus,
  ServerApiError,
  type VehicleState,
  type VehicleStatus,
} from '../utils/serverApi';

/** Le serveur met déjà en cache ; ce rythme ne fait que rafraîchir l'affichage. */
const REFRESH_MS = 60 * 1000;

interface UseVehicleResult {
  state: VehicleState | null;
  status: VehicleStatus | null;
  loading: boolean;
  error: string | null;
  /** Vrai quand le serveur expose l'intégration ET qu'un jeton est configuré. */
  available: boolean;
  refresh: () => Promise<void>;
}

/**
 * Données du véhicule, servies par le serveur auto-hébergé.
 *
 * Le navigateur n'appelle jamais l'API constructeur directement : il
 * interroge son propre serveur, qui détient les identifiants et le jeton. Rien
 * de sensible ne transite donc par la page.
 */
export function useVehicle(): UseVehicleResult {
  const { config, capabilities } = useSync();
  const token = config.token;
  const serverUrl = config.serverUrl || undefined;

  const [state, setState] = useState<VehicleState | null>(null);
  const [status, setStatus] = useState<VehicleStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const available = Boolean(token) && capabilities?.vehicle.enabled !== false;
  const inFlight = useRef<AbortController | null>(null);

  const refresh = useCallback(async () => {
    if (!token) return;
    inFlight.current?.abort();
    const controller = new AbortController();
    inFlight.current = controller;

    setLoading(true);
    try {
      const [nextStatus, nextState] = await Promise.all([
        fetchVehicleStatus({ token, serverUrl }),
        fetchVehicleState({ token, serverUrl, signal: controller.signal }),
      ]);
      setStatus(nextStatus);
      setState(nextState);
      setError(null);
    } catch (caught) {
      const apiError = caught as ServerApiError;
      // Un abandon volontaire (démontage, rafraîchissement plus récent) n'est
      // pas une erreur à montrer.
      if (apiError?.name === 'AbortError') return;
      setError(apiError?.message ?? 'données véhicule indisponibles');
      // Le statut reste utile pour expliquer POURQUOI l'état a échoué
      // (identifiants absents, provider non configuré).
      try {
        setStatus(await fetchVehicleStatus({ token, serverUrl }));
      } catch {
        setStatus(null);
      }
    } finally {
      setLoading(false);
    }
  }, [token, serverUrl]);

  useEffect(() => {
    if (!available) {
      setState(null);
      setStatus(null);
      return undefined;
    }

    void refresh();
    const timer = window.setInterval(() => void refresh(), REFRESH_MS);
    return () => {
      window.clearInterval(timer);
      inFlight.current?.abort();
    };
  }, [available, refresh]);

  return { state, status, loading, error, available, refresh };
}

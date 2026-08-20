/**
 * Accès aux API personnelles du serveur auto-hébergé (/api/sync, /api/vehicle).
 *
 * L'application est servie par ce même serveur : les appels sont donc
 * same-origin par défaut, sans CORS ni proxy. `serverUrl` ne sert que si vous
 * ouvrez l'interface depuis un autre appareil que celui qui héberge (le
 * navigateur du salon pointant vers le NAS, par exemple).
 */

export interface ServerCapabilities {
  sync: { enabled: boolean; keys: string[] };
  vehicle: { enabled: boolean; provider: string | null };
}

export interface SyncEntry {
  value?: unknown;
  deleted?: boolean;
  updatedAt: number;
}

export interface SyncResponse {
  revision: number;
  updatedAt: string | null;
  serverTime: string;
  entries: Record<string, SyncEntry>;
  rejected?: string[];
}

export interface VehicleStatus {
  enabled: boolean;
  provider: string | null;
  label?: string;
  configured?: boolean;
  needsCredentials?: boolean;
  hasCredentials?: boolean;
  pollMs?: number;
  cachedAt?: string | null;
}

export interface VehicleState {
  batteryPercent: number | null;
  rangeKm: number | null;
  charging: boolean | null;
  plugged: boolean | null;
  odometerKm: number | null;
  location: { latitude: number; longitude: number } | null;
  updatedAt: string | null;
  source: string | null;
  cached?: boolean;
}

/** Erreur portant le code HTTP, pour distinguer « jeton faux » de « serveur en panne ». */
export class ServerApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'ServerApiError';
    this.status = status;
  }
}

const REQUEST_TIMEOUT_MS = 10000;

function endpoint(serverUrl: string | undefined, path: string): string {
  if (!serverUrl) return path;
  return new URL(path, serverUrl.endsWith('/') ? serverUrl : `${serverUrl}/`).toString();
}

async function request<T>(
  path: string,
  { token, serverUrl, method = 'GET', body, signal }: {
    token?: string;
    serverUrl?: string;
    method?: string;
    body?: unknown;
    signal?: AbortSignal;
  } = {}
): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  // Un abandon externe (démontage du composant) doit aussi couper la requête.
  signal?.addEventListener('abort', () => controller.abort(), { once: true });

  try {
    const response = await fetch(endpoint(serverUrl, path), {
      method,
      headers: {
        Accept: 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
      },
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: controller.signal,
    });

    if (!response.ok) {
      let detail = '';
      try {
        detail = ((await response.json()) as { detail?: string }).detail ?? '';
      } catch {
        /* le corps d'erreur n'est pas toujours du JSON */
      }
      throw new ServerApiError(detail || `le serveur a répondu ${response.status}`, response.status);
    }

    return (await response.json()) as T;
  } catch (error) {
    if (error instanceof ServerApiError) throw error;
    if ((error as Error)?.name === 'AbortError') {
      throw new ServerApiError('le serveur ne répond pas', 0);
    }
    throw new ServerApiError((error as Error)?.message ?? 'serveur injoignable', 0);
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Interroge /healthz pour savoir ce que le serveur propose.
 *
 * Sans authentification : l'interface doit pouvoir dire « ce serveur ne gère
 * pas la synchronisation » avant même qu'un jeton soit saisi. Aucun secret
 * n'est exposé par cet endpoint.
 */
export async function fetchCapabilities(serverUrl?: string): Promise<ServerCapabilities> {
  const health = await request<Partial<ServerCapabilities>>('/healthz', { serverUrl });
  return {
    sync: { enabled: health.sync?.enabled ?? false, keys: health.sync?.keys ?? [] },
    vehicle: { enabled: health.vehicle?.enabled ?? false, provider: health.vehicle?.provider ?? null },
  };
}

export function pushAndPull(
  entries: Record<string, SyncEntry>,
  options: { token: string; serverUrl?: string; signal?: AbortSignal }
): Promise<SyncResponse> {
  return request<SyncResponse>('/api/sync', { ...options, method: 'POST', body: { entries } });
}

export function pullOnly(options: { token: string; serverUrl?: string }): Promise<SyncResponse> {
  return request<SyncResponse>('/api/sync', options);
}

export function resetServerState(options: { token: string; serverUrl?: string }): Promise<unknown> {
  return request('/api/sync', { ...options, method: 'DELETE' });
}

export function fetchVehicleStatus(options: {
  token: string;
  serverUrl?: string;
}): Promise<VehicleStatus> {
  return request<VehicleStatus>('/api/vehicle/status', options);
}

export function fetchVehicleState(options: {
  token: string;
  serverUrl?: string;
  signal?: AbortSignal;
}): Promise<VehicleState> {
  return request<VehicleState>('/api/vehicle/state', options);
}

/**
 * Envoie les identifiants du compte constructeur au serveur.
 *
 * Ils ne sont jamais conservés côté navigateur : ni state React persistant, ni
 * localStorage. Le serveur les range en 0600 dans son volume de données et
 * l'API ne permet pas de les relire.
 */
export function saveVehicleCredentials(
  credentials: { account: string; password: string },
  options: { token: string; serverUrl?: string }
): Promise<{ hasCredentials: boolean }> {
  return request('/api/vehicle/credentials', { ...options, method: 'POST', body: credentials });
}

export function clearVehicleCredentials(options: {
  token: string;
  serverUrl?: string;
}): Promise<{ hasCredentials: boolean }> {
  return request('/api/vehicle/credentials', { ...options, method: 'DELETE' });
}

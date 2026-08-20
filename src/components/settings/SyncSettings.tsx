import React, { useEffect, useState } from 'react';
import { ArrowPathIcon, CheckCircleIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';

import { useSync, type SyncStatus } from '../../context/SyncContext';
import { resetServerState } from '../../utils/serverApi';

const STATUS_LABEL: Record<SyncStatus, string> = {
  disabled: 'Désactivée',
  idle: 'En attente',
  syncing: 'Synchronisation…',
  ok: 'À jour',
  error: 'Erreur',
  unauthorized: 'Jeton refusé',
};

/**
 * Configuration de la synchronisation entre appareils.
 *
 * Volontairement sans compte ni mot de passe : le serveur est le vôtre, un
 * jeton partagé suffit. C'est le même jeton (`API_TOKEN`) que celui qui
 * protège les données du véhicule.
 */
export const SyncSettings: React.FC = () => {
  const { config, status, lastSyncAt, lastError, pendingReload, capabilities, configure, disable, syncNow, refreshCapabilities } =
    useSync();

  const [token, setToken] = useState(config.token);
  const [serverUrl, setServerUrl] = useState(config.serverUrl);
  const [busy, setBusy] = useState(false);
  const [resetDone, setResetDone] = useState(false);

  useEffect(() => {
    void refreshCapabilities();
  }, [refreshCapabilities]);

  useEffect(() => {
    setToken(config.token);
    setServerUrl(config.serverUrl);
  }, [config.token, config.serverUrl]);

  const serverSupportsSync = capabilities?.sync.enabled;

  const handleEnable = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    try {
      await configure({ enabled: true, token: token.trim(), serverUrl: serverUrl.trim() });
    } finally {
      setBusy(false);
    }
  };

  const handleResetServer = async () => {
    const confirmed = window.confirm(
      'Effacer les données synchronisées sur le serveur ?\n\nLes autres appareils repartiront de leur état local à leur prochaine synchronisation. Les données de CET appareil ne sont pas touchées.'
    );
    if (!confirmed) return;

    setBusy(true);
    try {
      await resetServerState({ token: config.token, serverUrl: config.serverUrl || undefined });
      setResetDone(true);
    } catch {
      setResetDone(false);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h3 className="text-lg font-semibold dark:text-white">Synchronisation entre appareils</h3>
        <span
          className={`rounded-full px-3 py-1 text-xs font-semibold ${
            status === 'ok'
              ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300'
              : status === 'error' || status === 'unauthorized'
                ? 'bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-300'
                : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300'
          }`}
        >
          {STATUS_LABEL[status]}
        </span>
      </div>

      <p className="text-gray-600 dark:text-gray-300 mb-4 text-sm">
        Vos favoris, la région, le thème et vos statistiques d’usage suivent d’un appareil à
        l’autre — via <strong>votre propre serveur</strong>, celui qui héberge déjà cette
        application. Aucune donnée ne passe par un service tiers.
      </p>

      {serverSupportsSync === false && (
        <p className="mb-4 flex items-start gap-2 rounded-md bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:bg-amber-500/10 dark:text-amber-200">
          <ExclamationTriangleIcon className="mt-0.5 h-5 w-5 shrink-0" />
          <span>
            Ce serveur n’a pas la synchronisation activée. Définissez la variable
            d’environnement <code className="font-mono">API_TOKEN</code> puis redémarrez le
            conteneur.
          </span>
        </p>
      )}

      {pendingReload.length > 0 && (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-md bg-cyan-50 px-4 py-3 text-sm text-cyan-900 dark:bg-cyan-500/10 dark:text-cyan-200">
          <span>
            Des données ont été reçues depuis un autre appareil ({pendingReload.join(', ')}).
          </span>
          <button
            onClick={() => window.location.reload()}
            className="rounded-md bg-cyan-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-cyan-700"
          >
            Recharger pour appliquer
          </button>
        </div>
      )}

      {config.enabled ? (
        <div className="space-y-4">
          <dl className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
            <div className="rounded-md bg-slate-50 px-3 py-2 dark:bg-slate-700/50">
              <dt className="text-xs text-slate-500 dark:text-slate-400">Dernière synchronisation</dt>
              <dd className="font-medium dark:text-gray-200">
                {lastSyncAt ? lastSyncAt.toLocaleString('fr-FR') : 'jamais'}
              </dd>
            </div>
            <div className="rounded-md bg-slate-50 px-3 py-2 dark:bg-slate-700/50">
              <dt className="text-xs text-slate-500 dark:text-slate-400">Serveur</dt>
              <dd className="truncate font-medium dark:text-gray-200">
                {config.serverUrl || 'cette origine'}
              </dd>
            </div>
          </dl>

          {lastError && (
            <p className="rounded-md bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-500/10 dark:text-red-300">
              {lastError}
            </p>
          )}

          {resetDone && (
            <p className="flex items-center gap-2 rounded-md bg-emerald-50 px-4 py-3 text-sm text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300">
              <CheckCircleIcon className="h-5 w-5" />
              Données serveur effacées.
            </p>
          )}

          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => void syncNow()}
              disabled={busy || status === 'syncing'}
              className="inline-flex items-center gap-2 rounded-md bg-primary-600 px-4 py-2 text-white transition-colors hover:bg-primary-700 disabled:opacity-50"
            >
              <ArrowPathIcon className={`h-4 w-4 ${status === 'syncing' ? 'animate-spin' : ''}`} />
              Synchroniser maintenant
            </button>
            <button
              onClick={disable}
              className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-700"
            >
              Désactiver
            </button>
            <button
              onClick={() => void handleResetServer()}
              disabled={busy}
              className="rounded-md border border-red-300 px-4 py-2 text-sm font-medium text-red-700 transition-colors hover:bg-red-50 disabled:opacity-50 dark:border-red-500/40 dark:text-red-300 dark:hover:bg-red-500/10"
            >
              Effacer les données du serveur
            </button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleEnable} className="space-y-4">
          <div>
            <label
              htmlFor="sync-token"
              className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Jeton du serveur <span className="text-red-500">*</span>
            </label>
            <input
              id="sync-token"
              type="password"
              value={token}
              onChange={(event) => setToken(event.target.value)}
              required
              autoComplete="off"
              placeholder="la valeur de API_TOKEN"
              className="w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            />
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Le même jeton sur tous vos appareils. Il est stocké dans ce navigateur pour
              pouvoir se reconnecter sans ressaisie.
            </p>
          </div>

          <div>
            <label
              htmlFor="sync-server"
              className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Adresse du serveur
            </label>
            <input
              id="sync-server"
              type="text"
              inputMode="url"
              value={serverUrl}
              onChange={(event) => setServerUrl(event.target.value)}
              placeholder="laisser vide si l’app est servie par ce serveur"
              className="w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            />
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              À renseigner uniquement si vous ouvrez l’interface depuis un autre appareil que
              celui qui héberge — par exemple <code className="font-mono">http://nas.local:8080</code>.
            </p>
          </div>

          <button
            type="submit"
            disabled={busy || !token.trim()}
            className="rounded-md bg-primary-600 px-4 py-2 text-white transition-colors hover:bg-primary-700 disabled:opacity-50"
          >
            {busy ? 'Connexion…' : 'Activer la synchronisation'}
          </button>
        </form>
      )}
    </div>
  );
};

export default SyncSettings;

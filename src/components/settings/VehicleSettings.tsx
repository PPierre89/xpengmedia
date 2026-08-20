import React, { useState } from 'react';
import { CheckCircleIcon, ExclamationTriangleIcon, LockClosedIcon } from '@heroicons/react/24/outline';

import { useSync } from '../../context/SyncContext';
import { useVehicle } from '../../hooks/useVehicle';
import { clearVehicleCredentials, saveVehicleCredentials } from '../../utils/serverApi';

/**
 * Identifiants du compte constructeur.
 *
 * Le formulaire n'écrit jamais dans `localStorage` et ne relit jamais ce qui a
 * été enregistré : l'API serveur est en écriture seule. Les champs sont vidés
 * dès l'envoi, seul le serveur détient les identifiants.
 */
export const VehicleSettings: React.FC = () => {
  const { config, capabilities } = useSync();
  const { status, refresh } = useVehicle();

  const [account, setAccount] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ tone: 'ok' | 'error'; text: string } | null>(null);

  const hasToken = Boolean(config.token);
  const serverSupportsVehicle = capabilities?.vehicle.enabled;

  const handleSave = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setMessage(null);
    try {
      await saveVehicleCredentials(
        { account: account.trim(), password },
        { token: config.token, serverUrl: config.serverUrl || undefined }
      );
      // Ne rien garder en mémoire du composant une fois l'envoi fait.
      setAccount('');
      setPassword('');
      setMessage({ tone: 'ok', text: 'Identifiants enregistrés sur le serveur.' });
      await refresh();
    } catch (error) {
      setMessage({ tone: 'error', text: (error as Error)?.message ?? 'échec de l’enregistrement' });
    } finally {
      setBusy(false);
    }
  };

  const handleClear = async () => {
    if (!window.confirm('Effacer les identifiants du compte constructeur enregistrés sur le serveur ?')) {
      return;
    }
    setBusy(true);
    try {
      await clearVehicleCredentials({ token: config.token, serverUrl: config.serverUrl || undefined });
      setMessage({ tone: 'ok', text: 'Identifiants effacés.' });
      await refresh();
    } catch (error) {
      setMessage({ tone: 'error', text: (error as Error)?.message ?? 'échec de l’effacement' });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
      <h3 className="text-lg font-semibold mb-4 dark:text-white">Mon véhicule</h3>

      <p className="text-gray-600 dark:text-gray-300 mb-4 text-sm">
        Affiche la batterie, l’autonomie, l’état de charge et la position sur l’accueil. Les
        identifiants sont envoyés à <strong>votre serveur</strong>, qui seul interroge l’API
        constructeur — ils ne sont jamais conservés dans ce navigateur.
      </p>

      {serverSupportsVehicle === false && (
        <p className="mb-4 flex items-start gap-2 rounded-md bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:bg-amber-500/10 dark:text-amber-200">
          <ExclamationTriangleIcon className="mt-0.5 h-5 w-5 shrink-0" />
          <span>
            L’intégration véhicule n’est pas activée sur ce serveur. Définissez
            <code className="mx-1 font-mono">VEHICLE_PROVIDER</code> (<code className="font-mono">demo</code>{' '}
            pour essayer sans voiture) puis redémarrez le conteneur — voir{' '}
            <code className="font-mono">docs/VEHICULE.md</code>.
          </span>
        </p>
      )}

      {!hasToken ? (
        <p className="rounded-md bg-slate-100 px-4 py-3 text-sm text-slate-600 dark:bg-slate-700/60 dark:text-slate-300">
          Configurez d’abord le jeton du serveur dans la section « Synchronisation entre
          appareils » ci-dessus : c’est le même pour les deux.
        </p>
      ) : (
        <div className="space-y-4">
          <dl className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
            <div className="rounded-md bg-slate-50 px-3 py-2 dark:bg-slate-700/50">
              <dt className="text-xs text-slate-500 dark:text-slate-400">Source</dt>
              <dd className="font-medium dark:text-gray-200">{status?.label ?? '—'}</dd>
            </div>
            <div className="rounded-md bg-slate-50 px-3 py-2 dark:bg-slate-700/50">
              <dt className="text-xs text-slate-500 dark:text-slate-400">Identifiants</dt>
              <dd className="font-medium dark:text-gray-200">
                {status?.needsCredentials === false
                  ? 'non requis'
                  : status?.hasCredentials
                    ? 'enregistrés'
                    : 'absents'}
              </dd>
            </div>
          </dl>

          {message && (
            <p
              className={`flex items-center gap-2 rounded-md px-4 py-3 text-sm ${
                message.tone === 'ok'
                  ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300'
                  : 'bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-300'
              }`}
            >
              {message.tone === 'ok' && <CheckCircleIcon className="h-5 w-5" />}
              {message.text}
            </p>
          )}

          {status?.needsCredentials !== false && (
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label
                  htmlFor="vehicle-account"
                  className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Identifiant du compte constructeur
                </label>
                <input
                  id="vehicle-account"
                  type="text"
                  value={account}
                  onChange={(event) => setAccount(event.target.value)}
                  required
                  autoComplete="off"
                  className="w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                />
              </div>

              <div>
                <label
                  htmlFor="vehicle-password"
                  className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Mot de passe
                </label>
                <input
                  id="vehicle-password"
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                  autoComplete="off"
                  className="w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                />
                <p className="mt-1 flex items-start gap-1.5 text-xs text-gray-500 dark:text-gray-400">
                  <LockClosedIcon className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                  Transmis à votre serveur, qui les range en lecture propriétaire seule. Ils ne
                  peuvent plus être relus ensuite, seulement remplacés ou effacés.
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                <button
                  type="submit"
                  disabled={busy || !account.trim() || !password}
                  className="rounded-md bg-primary-600 px-4 py-2 text-white transition-colors hover:bg-primary-700 disabled:opacity-50"
                >
                  {busy ? 'Enregistrement…' : 'Enregistrer'}
                </button>
                {status?.hasCredentials && (
                  <button
                    type="button"
                    onClick={() => void handleClear()}
                    disabled={busy}
                    className="rounded-md border border-red-300 px-4 py-2 text-sm font-medium text-red-700 transition-colors hover:bg-red-50 disabled:opacity-50 dark:border-red-500/40 dark:text-red-300 dark:hover:bg-red-500/10"
                  >
                    Effacer les identifiants
                  </button>
                )}
              </div>
            </form>
          )}
        </div>
      )}
    </div>
  );
};

export default VehicleSettings;

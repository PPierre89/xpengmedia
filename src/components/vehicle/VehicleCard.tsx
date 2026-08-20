import React from 'react';
import { motion } from 'framer-motion';
import { ArrowPathIcon, BoltIcon, MapPinIcon } from '@heroicons/react/24/outline';

import { useVehicle } from '../../hooks/useVehicle';

const formatKm = (value: number | null) =>
  value === null ? '—' : `${Math.round(value).toLocaleString('fr-FR')} km`;

/** Vert au-dessus de 50 %, ambre entre 20 et 50, rouge en dessous. */
function batteryTone(percent: number): { bar: string; text: string } {
  if (percent >= 50) return { bar: 'bg-emerald-500', text: 'text-emerald-600 dark:text-emerald-400' };
  if (percent >= 20) return { bar: 'bg-amber-500', text: 'text-amber-600 dark:text-amber-400' };
  return { bar: 'bg-red-500', text: 'text-red-600 dark:text-red-400' };
}

/**
 * Carte « état du véhicule » sur l'accueil.
 *
 * Ne s'affiche que si le serveur expose l'intégration et qu'un jeton est
 * configuré : sur une installation qui ne s'en sert pas, l'accueil reste tel
 * qu'avant.
 */
export const VehicleCard: React.FC = () => {
  const { state, status, loading, error, available, refresh } = useVehicle();

  if (!available) return null;

  // Le serveur tourne mais rien n'est encore configuré : on explique plutôt
  // que d'afficher une carte vide.
  const needsSetup = status?.enabled === false || status?.configured === false;
  const missingCredentials = status?.needsCredentials === true && status?.hasCredentials === false;

  const percent = state?.batteryPercent ?? null;
  const tone = percent === null ? null : batteryTone(percent);

  return (
    <motion.section
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-slate-200/70 bg-white/80 p-5 shadow-sm backdrop-blur dark:border-slate-700/60 dark:bg-slate-900/60"
      aria-label="État du véhicule"
    >
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-400">
            <BoltIcon className="h-5 w-5" />
          </span>
          <div>
            <h2 className="font-semibold text-slate-900 dark:text-white">Mon véhicule</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {status?.label ?? 'XPENG'}
              {state?.cached ? ' · en cache' : ''}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => void refresh()}
          disabled={loading}
          className="inline-flex items-center gap-1.5 rounded-full border border-slate-300/70 px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:border-cyan-400 hover:text-cyan-600 disabled:opacity-50 dark:border-slate-700 dark:text-slate-300"
        >
          <ArrowPathIcon className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Actualiser
        </button>
      </div>

      {needsSetup || missingCredentials ? (
        <p className="rounded-xl bg-slate-100 px-4 py-3 text-sm text-slate-600 dark:bg-slate-800/70 dark:text-slate-300">
          {missingCredentials
            ? 'Renseignez les identifiants de votre compte constructeur dans Paramètres → Mon véhicule.'
            : 'Intégration véhicule non configurée sur le serveur (voir docs/VEHICULE.md).'}
        </p>
      ) : error ? (
        <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-500/10 dark:text-red-300">
          {error}
        </p>
      ) : (
        <div className="space-y-4">
          <div>
            <div className="mb-1.5 flex items-baseline justify-between">
              <span className="text-sm text-slate-500 dark:text-slate-400">Batterie</span>
              <span className={`text-2xl font-bold tabular-nums ${tone?.text ?? 'text-slate-400'}`}>
                {percent === null ? '—' : `${Math.round(percent)} %`}
              </span>
            </div>
            <div
              className="h-2.5 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700"
              role="progressbar"
              aria-valuenow={percent ?? undefined}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label="Niveau de batterie"
            >
              <div
                className={`h-full rounded-full transition-[width] duration-500 ${tone?.bar ?? 'bg-slate-400'}`}
                style={{ width: `${percent ?? 0}%` }}
              />
            </div>
          </div>

          <dl className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <div className="rounded-xl bg-slate-50 px-3 py-2 dark:bg-slate-800/60">
              <dt className="text-xs text-slate-500 dark:text-slate-400">Autonomie</dt>
              <dd className="font-semibold tabular-nums text-slate-900 dark:text-white">
                {formatKm(state?.rangeKm ?? null)}
              </dd>
            </div>
            <div className="rounded-xl bg-slate-50 px-3 py-2 dark:bg-slate-800/60">
              <dt className="text-xs text-slate-500 dark:text-slate-400">Charge</dt>
              <dd className="font-semibold text-slate-900 dark:text-white">
                {state?.charging === null || state?.charging === undefined
                  ? '—'
                  : state.charging
                    ? 'En cours'
                    : state.plugged
                      ? 'Branché'
                      : 'À l’arrêt'}
              </dd>
            </div>
            <div className="rounded-xl bg-slate-50 px-3 py-2 dark:bg-slate-800/60">
              <dt className="text-xs text-slate-500 dark:text-slate-400">Compteur</dt>
              <dd className="font-semibold tabular-nums text-slate-900 dark:text-white">
                {formatKm(state?.odometerKm ?? null)}
              </dd>
            </div>
          </dl>

          {state?.location && (
            <a
              href={`https://www.google.com/maps?q=${state.location.latitude},${state.location.longitude}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-cyan-600 hover:underline dark:text-cyan-400"
            >
              <MapPinIcon className="h-4 w-4" />
              Voir la position sur la carte
            </a>
          )}
        </div>
      )}
    </motion.section>
  );
};

export default VehicleCard;

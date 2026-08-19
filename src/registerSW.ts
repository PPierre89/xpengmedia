/**
 * Enregistrement du service worker (PWA).
 *
 * Rappel important : un service worker n'est disponible que dans un contexte
 * sécurisé — HTTPS, ou localhost. Servi en HTTP simple sur le LAN
 * (http://192.168.x.x:2789), `navigator.serviceWorker` est tout simplement
 * absent : l'application continue de fonctionner normalement, mais sans
 * démarrage hors ligne ni installation. On le signale explicitement en console
 * plutôt que d'échouer en silence.
 */
export function registerServiceWorker(): void {
  if (import.meta.env.DEV) return; // pas de SW en développement

  if (!('serviceWorker' in navigator)) {
    if (!window.isSecureContext) {
      console.info(
        "[PWA] Service worker indisponible : l'application n'est pas servie depuis " +
          "une origine sécurisée. Utilise HTTPS (ou localhost) pour activer " +
          "le mode hors ligne et l'installation."
      );
    }
    return;
  }

  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js', { scope: '/' })
      .then((registration) => {
        console.info('[PWA] Service worker enregistré');

        // Une nouvelle version déployée sur le NAS prend le relais au
        // prochain chargement (le SW appelle skipWaiting à l'installation).
        registration.addEventListener('updatefound', () => {
          const installing = registration.installing;
          if (!installing) return;
          installing.addEventListener('statechange', () => {
            if (installing.state === 'installed' && navigator.serviceWorker.controller) {
              console.info('[PWA] Nouvelle version disponible, active au prochain chargement');
            }
          });
        });
      })
      .catch((error) => {
        console.warn('[PWA] Enregistrement du service worker impossible :', error.message);
      });
  });
}

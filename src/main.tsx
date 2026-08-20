import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { HashRouter } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { EnhancedFavoritesProvider } from './context/EnhancedFavoritesContext';
import { LocaleProvider } from './context/LocaleContext';
import { SyncProvider } from './context/SyncContext';
import './index.css';
import App from './App';
import { registerServiceWorker } from './registerSW';
import { runBootSync } from './utils/runSync';

function render() {
  // HashRouter : aucune réécriture d'URL à configurer côté serveur ni reverse proxy.
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <HashRouter>
        <ThemeProvider>
          <LocaleProvider>
            <SyncProvider>
              <EnhancedFavoritesProvider>
                <App />
              </EnhancedFavoritesProvider>
            </SyncProvider>
          </LocaleProvider>
        </ThemeProvider>
      </HashRouter>
    </StrictMode>
  );
}

/**
 * Synchronisation AVANT le premier rendu.
 *
 * Les contextes (thème, région, favoris) lisent `localStorage` à leur montage
 * et ne le relisent plus. En fusionnant d'abord, l'application démarre
 * directement sur l'état partagé, sans avoir à réhydrater quoi que ce soit à
 * chaud. Le délai est plafonné dans `runBootSync` : un NAS éteint ne doit
 * jamais retarder l'affichage sur l'écran de la voiture.
 */
runBootSync(window.localStorage)
  .catch(() => undefined)
  .finally(render);

// PWA : démarrage instantané et fonctionnement hors ligne de l'interface.
// Sans effet si l'app n'est pas servie depuis une origine sécurisée.
registerServiceWorker();

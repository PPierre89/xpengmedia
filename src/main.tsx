import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { HashRouter } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { EnhancedFavoritesProvider } from './context/EnhancedFavoritesContext';
import { LocaleProvider } from './context/LocaleContext';
import './index.css';
import App from './App';
import { registerServiceWorker } from './registerSW';

// HashRouter : aucune réécriture d'URL à configurer côté serveur ni reverse proxy.
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <HashRouter>
      <ThemeProvider>
        <LocaleProvider>
          <EnhancedFavoritesProvider>
            <App />
          </EnhancedFavoritesProvider>
        </LocaleProvider>
      </ThemeProvider>
    </HashRouter>
  </StrictMode>
);

// PWA : démarrage instantané et fonctionnement hors ligne de l'interface.
// Sans effet si l'app n'est pas servie depuis une origine sécurisée.
registerServiceWorker();

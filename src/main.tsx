import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { HashRouter } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { FavoritesProvider } from './context/FavoritesContext';
import { LocaleProvider } from './context/LocaleContext';
import './index.css';
import App from './App';
import { registerServiceWorker } from './registerSW';

// Utilisation de HashRouter pour une meilleure compatibilité avec GitHub Pages
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <HashRouter>
      <ThemeProvider>
        <LocaleProvider>
          <FavoritesProvider>
            <App />
          </FavoritesProvider>
        </LocaleProvider>
      </ThemeProvider>
    </HashRouter>
  </StrictMode>
);

// PWA : démarrage instantané et fonctionnement hors ligne de l'interface.
// Sans effet si l'app n'est pas servie depuis une origine sécurisée.
registerServiceWorker();

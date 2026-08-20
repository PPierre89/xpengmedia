import { readFileSync } from 'node:fs';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// Une seule source de vérité pour le numéro de version : package.json.
// L'écran « À propos » affichait auparavant une valeur écrite en dur, qui a
// fini par diverger du dépôt.
const { version } = JSON.parse(readFileSync(path.resolve(__dirname, 'package.json'), 'utf8'));

// L'application est servie à la racine du domaine par le serveur
// d'auto-hébergement (server/server.js). BASE_PATH permet de la servir depuis
// un sous-chemin si un reverse proxy l'impose.
const base = process.env.BASE_PATH || '/';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base,
  define: {
    __APP_VERSION__: JSON.stringify(version),
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    emptyOutDir: true,
    chunkSizeWarningLimit: 1000,
  },
  server: {
    port: 3000,
    open: true,
  },
});

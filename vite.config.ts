import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// L'application est servie à la racine du domaine par le serveur
// d'auto-hébergement (server/server.js). BASE_PATH permet de la servir depuis
// un sous-chemin si un reverse proxy l'impose.
const base = process.env.BASE_PATH || '/';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base,
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

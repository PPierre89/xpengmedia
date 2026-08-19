/**
 * Étapes post-build :
 *  1. copie du player IPTV dans dist/ (filet de sécurité, Vite copie déjà public/)
 *  2. estampillage de la version du service worker
 *
 * Sans le point 2, le nom du cache ne changerait jamais : les navigateurs
 * garderaient indéfiniment l'ancienne coquille applicative après un déploiement.
 */
import { copyFileSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { join } from 'node:path';

const dist = 'dist';

// 1. Player IPTV
const player = join(dist, 'iptv-player.html');
copyFileSync(join('public', 'iptv-player.html'), player);

// 2. Version du service worker, dérivée du contenu réellement livré :
//    deux builds identiques donnent la même version, un changement la fait bouger.
const swPath = join(dist, 'sw.js');
if (existsSync(swPath)) {
  const indexHtml = readFileSync(join(dist, 'index.html'));
  const playerHtml = readFileSync(player);
  const version = createHash('sha256')
    .update(indexHtml)
    .update(playerHtml)
    .digest('hex')
    .slice(0, 12);

  const sw = readFileSync(swPath, 'utf8').replace('__BUILD_VERSION__', version);
  if (sw.includes('__BUILD_VERSION__')) {
    console.error('❌ Version du service worker non remplacée');
    process.exit(1);
  }
  writeFileSync(swPath, sw);
  console.log(`✅ Service worker estampillé : version ${version}`);
} else {
  console.error('❌ dist/sw.js introuvable');
  process.exit(1);
}

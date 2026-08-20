#!/usr/bin/env node
/**
 * Régénère la table de largeurs de caractères de scripts/logos/char-widths.mjs.
 *
 * À relancer uniquement si la pile de polices des logotypes change dans
 * scripts/generate-service-logos.mjs. Les largeurs sont mesurées dans un vrai
 * moteur de rendu, pas estimées : c'est justement l'estimation qui déformait
 * les logotypes avant l'introduction de cette table.
 *
 *   npm i -D playwright-core        # non installé par défaut : outil ponctuel
 *   node scripts/measure-char-widths.mjs
 *
 * Le script écrit la table sur la sortie standard ; redirigez-la vers
 * scripts/logos/char-widths.mjs après avoir vérifié le résultat.
 */
import { logoMap } from './logos/logo-map.mjs';

const FONT_STACK =
  "system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif";

let chromium;
try {
  ({ chromium } = await import('playwright-core'));
} catch {
  console.error(
    'playwright-core est requis pour mesurer les polices :\n' +
      '  npm i -D playwright-core\n' +
      "Les largeurs doivent venir d'un moteur de rendu réel — les estimer est " +
      'précisément le défaut que cette table corrige.'
  );
  process.exit(1);
}

// On ne mesure que les caractères réellement employés par les logotypes.
const characters = [
  ...new Set(
    Object.values(logoMap)
      .filter((source) => source.text)
      .flatMap((source) => [...source.text])
  ),
].sort();

const executablePath =
  process.env.CHROMIUM_PATH || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const browser = await chromium.launch({ executablePath });
const page = await browser.newPage();
await page.setContent(
  '<svg width="600" height="200" xmlns="http://www.w3.org/2000/svg"><text id="t" x="0" y="100"></text></svg>'
);

const widths = await page.evaluate(
  ({ chars, stack }) => {
    const node = document.getElementById('t');
    node.setAttribute('font-family', stack);
    node.setAttribute('font-size', '100');
    node.setAttribute('font-weight', '700');
    const measured = {};
    for (const character of chars) {
      // Dix répétitions : l'arrondi sur un glyphe unique fausserait la mesure.
      node.textContent = character.repeat(10);
      measured[character] = Math.round((node.getComputedTextLength() / 10 / 100) * 1000) / 1000;
    }
    return measured;
  },
  { chars: characters, stack: FONT_STACK }
);

await browser.close();

const values = Object.values(widths);
const average = values.reduce((sum, value) => sum + value, 0) / values.length;

console.error(
  `${values.length} caractères mesurés — min ${Math.min(...values)}, ` +
    `max ${Math.max(...values)}, moyenne ${average.toFixed(3)}`
);
console.log(JSON.stringify(widths, null, 2));

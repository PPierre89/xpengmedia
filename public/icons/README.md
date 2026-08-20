# Icônes

## Contenu du dossier

- `services/` : logo de chaque service du catalogue, **généré** par
  `npm run logos`. Ne pas éditer à la main — voir
  [docs/LOGOS.md](../../docs/LOGOS.md) et
  [services/README.md](services/README.md).
- `pwa/` : icônes d'installation de la PWA, générées par `npm run icons`.

Tous les logos sont des SVG servis depuis `/public`, donc :

- ✅ aucune requête vers un CDN tiers ;
- ✅ disponibles hors ligne, mis en cache par le service worker ;
- ✅ nets à toutes les tailles, poids négligeable (~170 Ko pour 199 logos).

---

## Le composant `PlatformIcon`

```tsx
<PlatformIcon
  icon="/icons/services/netflix.svg"  // URL, chemin, data: … ou emoji
  name="Netflix"                      // sert d'aria-label et de repli
  size="md"                           // sm | md | lg
  className=""                        // classes Tailwind additionnelles
/>
```

`icon` accepte aussi bien un chemin qu'un **emoji** : les favoris créés par
l'utilisateur en utilisent un par défaut. La distinction est faite sur le
préfixe (`http`, `/`, `data:`, `icons/`).

### Tailles

| `size` | Conteneur | Image | Emoji |
|---|---|---|---|
| `sm` | 44 px | 32 px | 22 px |
| `md` | 52 px | 40 px | 26 px |
| `lg` | 64 px | 48 px | 30 px |

Elles sont volontairement compactes : la grille passe à 5 colonnes sur l'écran
du véhicule en mode portrait.

### Style du conteneur

Une pastille neutre, pour laisser la couleur venir du logo lui-même :
`rounded-xl`, fond `white/80` en clair et `white/10` en sombre avec
`backdrop-blur`, bordure `slate-200/70` (`slate-700/50` en sombre), `shadow-sm`.
Au survol de la carte parente : `scale-105`, ombre renforcée, bordure un cran
plus soutenue.

### Repli

Si l'image ne charge pas, le composant affiche le **monogramme** du service sur
un dégradé de l'interface — jamais une vignette cassée. La couleur est tirée
d'une palette de 8 par hachage du nom : un service garde donc toujours la même.
Les drapeaux emoji des noms régionaux sont ignorés dans le calcul des
initiales.

Ce repli ne concerne plus le catalogue, dont les 199 logos sont embarqués. Il
protège les favoris enregistrés dans le `localStorage` qui pointeraient encore
vers une ancienne URL de CDN.

---

## Accessibilité

- Le conteneur est `aria-hidden` : le nom du service est déjà porté par la
  carte, l'annoncer deux fois est du bruit pour un lecteur d'écran.
- Chaque SVG généré contient un `<title>` et un `aria-label`.
- Le bouton de suppression d'un service fait 32 × 32 px avec un anneau blanc
  (`ring-2 ring-white`, `ring-slate-900` en sombre), au-dessus du seuil de
  confort tactile.

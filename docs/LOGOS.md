# 🎨 Logos des services

Chaque service du catalogue possède un logo **embarqué dans le dépôt**, généré
par un script. Aucun logo n'est chargé depuis un CDN tiers.

---

## Pourquoi des logos locaux

Les logos étaient chargés depuis quatre CDN tiers :

| Source | Services concernés | Problème |
|---|---|---|
| `cdn.simpleicons.org` | 103 | 35 slugs ne correspondaient plus à aucune icône (marques retirées du projet Simple Icons) → **404** |
| `logo.clearbit.com` | 46 | API de logos dépréciée |
| `cdn-icons-png.flaticon.com` | 15 | Cliparts génériques, sans rapport avec la marque |
| `upload.wikimedia.org` | 14 | Hotlink, politique de referrer variable |

À quoi s'ajoutaient une URL `ui-avatars.com` et trois emojis.

Deux conséquences dans la voiture :

1. **Hors ligne / réseau mobile faible** : la PWA démarrait sans aucune vignette,
   alors que tout le reste de l'interface était en cache.
2. **Vignettes cassées** en permanence pour les ~35 services aux slugs morts.

Tout est maintenant servi depuis `/public`, donc mis en cache par le service
worker au premier affichage (stratégie *cache-first* des GET same-origin).

---

## Fonctionnement

```
scripts/logos/logo-map.mjs        ← déclaration : quelle source pour quel service
scripts/logos/glyphs.mjs          ← pictogrammes (Heroicons) pour les outils XPENG
scripts/generate-service-logos.mjs ← génère les SVG + met à jour platforms.ts
public/icons/services/<id>.svg     ← sortie, versionnée dans le dépôt
```

```bash
npm run logos          # (re)génère tous les logos
npm run logos:check    # vérifie que le dépôt est à jour, sans rien écrire
```

Le script est **idempotent** : il n'écrit que ce qui change. Il échoue si un
service n'a pas de logo déclaré, si une entrée de `logo-map.mjs` ne correspond
à aucun service, ou si un slug Simple Icons est inconnu — impossible donc
d'ajouter un service en oubliant son logo.

Le script met aussi à jour le champ `icon` de chaque service dans
`src/data/platforms.ts` pour qu'il pointe vers `/icons/services/<id>.svg`.

---

## Les trois familles de logos

`scripts/logos/logo-map.mjs` associe à chaque service l'une de ces trois formes :

### `{ si: 'slug' }` — marque officielle

Le tracé officiel vient du paquet npm [`simple-icons`](https://simpleicons.org)
(dépendance de développement : il n'est utilisé qu'à la génération, jamais à
l'exécution). La couleur de marque du paquet sert de couleur de tuile.

```js
netflix: { si: 'netflix' },
'hbo-max': { si: 'max', hex: '002BE7' },   // hex forcé si celui du paquet est neutre
```

### `{ text: 'ARD', hex: '003C78' }` — logotype

Pour les marques absentes de Simple Icons — essentiellement les diffuseurs et
opérateurs européens, dont le logo *est* justement un sigle : ARD, TF1+, RTBF,
SVT, NRK, NPO, BFM, LCI, Rai…

Le corps de la police est calculé à partir de largeurs de caractères
**mesurées** (`scripts/logos/char-widths.mjs`), et non d'une moyenne. C'est
important : les vraies largeurs vont de 0,343 em (« i », « l ») à 1,103 em
(« W »). Avec une moyenne unique, la largeur estimée se trompait jusqu'à 24 %,
et comme `textLength` fige la largeur finale, l'écart était rattrapé en
déformant les glyphes — « CANAL+ » sortait comprimé à 81 %, « xfinity » étiré à
122 %.

Avec les largeurs mesurées, `textLength` ne corrige plus qu'un résidu (0,5 % en
moyenne, 5,6 % au pire) et ne déforme plus rien. Il reste présent pour figer le
rendu quelle que soit la police réellement disponible sur l'écran embarqué.

Pour régénérer la table si la pile de polices change :
`node scripts/measure-char-widths.mjs` (nécessite `playwright-core`).

### `{ glyph: 'tv', hex: '00AEEF' }` — pictogramme

Pour les outils XPENG embarqués (calculatrice, notes, minuteur, lecteur PDF,
dashcam…) et la documentation, qui n'ont pas de marque propre. Les tracés
viennent de [Heroicons](https://heroicons.com) (MIT) et sont recopiés dans
`scripts/logos/glyphs.mjs`.

---

## Rendu

Tuile 64×64 aux couleurs de la marque : coins arrondis, dégradé de la couleur de
marque vers une version éclaircie de 22 %, cohérent avec le reste de
l'interface.

La couleur du tracé est choisie **automatiquement** : blanc sur les marques
foncées, ardoise (`#0f172a`) sur les marques claires, à partir de la luminance
relative WCAG de la couleur de marque. Les tuiles restent donc lisibles en mode
clair comme en mode sombre, sans réglage manuel.

---

## Ajouter un service

1. Ajouter l'entrée dans `src/data/platforms.ts` (le champ `icon` peut rester
   vide, il sera réécrit).
2. Ajouter la source du logo dans `scripts/logos/logo-map.mjs`.
3. `npm run logos`
4. Commiter le SVG généré avec le reste.

Sans l'étape 2, le script échoue en nommant le service manquant.

---

## Repli à l'exécution

`PlatformIcon` affiche un **monogramme** (initiales du service sur un dégradé de
l'interface) si une image ne charge pas. Cela ne concerne plus le catalogue,
mais protège les favoris enregistrés dans le `localStorage` qui pointeraient
vers une ancienne URL.

---

## Licences

- Marques officielles : [Simple Icons](https://github.com/simple-icons/simple-icons) (CC0 1.0).
  Les logos restent la propriété de leurs détenteurs respectifs et ne sont
  utilisés que pour identifier les services.
- Pictogrammes : [Heroicons](https://heroicons.com) (MIT).

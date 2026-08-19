# Logos des services

**Dossier généré — ne pas éditer à la main.**

Chaque service du catalogue (`src/data/platforms.ts`) possède ici un fichier
`<id>.svg`. Pour régénérer après avoir ajouté ou retiré un service :

```bash
npm run logos          # génère les SVG + met à jour les champs « icon »
npm run logos:check    # vérifie que tout est à jour (utile en CI)
```

La source de chaque logo est déclarée dans
[`scripts/logos/logo-map.mjs`](../../../scripts/logos/logo-map.mjs).

## Pourquoi des fichiers locaux

Les logos étaient auparavant chargés depuis quatre CDN tiers
(`cdn.simpleicons.org`, `logo.clearbit.com`, `cdn-icons-png.flaticon.com`,
`upload.wikimedia.org`). Dans une voiture, le réseau mobile est souvent mauvais
ou absent : les vignettes n'apparaissaient pas. Par ailleurs 35 des slugs
`cdn.simpleicons.org` utilisés ne correspondaient plus à aucune icône
(marques retirées du projet Simple Icons) et renvoyaient donc une 404.

Tout est désormais embarqué dans `/public` : disponible hors ligne via le
service worker, sans requête tierce, et sans logo cassé.

## Format

Tuile 64×64 aux couleurs de la marque (dégradé + coins arrondis, cohérent avec
le reste de l'interface), portant :

- la **marque officielle** quand elle existe dans [Simple Icons](https://simpleicons.org) ;
- sinon un **logotype court** aux couleurs de la marque (la plupart des
  diffuseurs européens ont justement un sigle pour logo : ARD, TF1, RTBF, SVT…) ;
- un **pictogramme** pour les outils XPENG embarqués, qui n'ont pas de marque.

La couleur du tracé (blanc ou ardoise) est choisie automatiquement selon la
luminance de la couleur de marque, pour garantir le contraste.

## Licences

- Marques officielles : [Simple Icons](https://github.com/simple-icons/simple-icons)
  (CC0 1.0). Les logos restent la propriété de leurs détenteurs respectifs et
  ne sont utilisés ici que pour identifier les services.
- Pictogrammes : [Heroicons](https://heroicons.com) (MIT).

# Police Urbanist

Deux fichiers, servis depuis ce dossier — plus depuis `fonts.googleapis.com`.

| Fichier | Sous-ensemble | Taille |
|---|---|---|
| `urbanist-latin.woff2` | latin | 27 Ko |
| `urbanist-latin-ext.woff2` | latin étendu (accents, € …) | 17 Ko |

## Pourquoi seulement deux fichiers

`Urbanist` est une **police variable** : Google sert le même fichier pour les
graisses 300, 400, 500, 600 et 700. Une seule règle `@font-face` par
sous-ensemble suffit donc, avec `font-weight: 300 700`. Les déclarations sont
dans [`src/index.css`](../../src/index.css), et les deux fichiers sont
pré-mis en cache par le service worker ([`public/sw.js`](../sw.js)).

## Pourquoi localement

L'`@import` vers `fonts.googleapis.com` était la dernière requête tierce de
l'application. Elle posait deux problèmes :

1. **Hors ligne** — sans réseau, la police ne chargeait pas et toute la
   typographie basculait sur la pile système, alors que le reste de l'interface
   était en cache. C'est le cas d'usage principal : une voiture.
2. **Vie privée** — chaque démarrage annonçait à Google l'adresse IP du
   véhicule et son User-Agent.

Les caractères arabes, hébreux et chinois des noms de région ne sont pas
couverts par Urbanist ; ils étaient déjà rendus par la pile système, et le
restent.

## Mettre à jour

```bash
curl -A "Mozilla/5.0 … Chrome/120.0" \
  "https://fonts.googleapis.com/css2?family=Urbanist:wght@300;400;500;600;700&display=swap"
```

Relever les deux URL `fonts.gstatic.com` de la réponse, les télécharger sous
les mêmes noms, et vérifier que les `unicode-range` de `src/index.css`
correspondent toujours.

## Licence

[Urbanist](https://github.com/coreyhu/Urbanist) par Corey Hu —
[SIL Open Font License 1.1](https://openfontlicense.org/), qui autorise la
redistribution embarquée dans un projet.

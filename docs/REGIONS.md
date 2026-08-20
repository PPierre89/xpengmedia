# 🌍 Régions et langues

Comment l'application choisit une région, quels services elle affiche, et dans
quelle langue.

---

## Source unique

Tout part de `src/data/regionsMetadata.ts` :

```ts
export type Region = 'global' | 'france' | … ;   // 20 codes

export interface RegionMetadata {
  code: Region;
  name: string;
  flag: string;
  languages: string[];   // la première = langue d'interface par défaut
  group: string;
  neighbors: Region[];
}
```

`LocaleContext` **dérive** sa liste de régions de ce tableau au lieu de la
redéclarer :

```ts
const regions = regionsMetadata.map(({ code, name, flag, languages }) => ({
  code, name, flag, language: languages[0] as string,
}));
```

Les deux listes existaient auparavant en double, avec les 20 noms et drapeaux
recopiés. Elles étaient identiques — mais rien ne le garantissait, et le premier
renommage les aurait fait diverger sans erreur ni test rouge.

Pour **ajouter une région**, il suffit donc d'une entrée dans
`regionsMetadata.ts`, plus une ligne dans `regionToAvailabilityMap`
(`src/utils/regionFilter.ts`) ; TypeScript signale l'oubli, la carte étant un
`Record<Region, string[]>` exhaustif.

---

## Les 20 régions

| Groupe | Régions |
|---|---|
| `global` | 🌍 Global / International |
| `western_europe` | 🇫🇷 France · 🇪🇸 España · 🇮🇹 Italia · 🇧🇪 België / Belgique |
| `northern_europe` | 🇩🇪 Deutschland · 🇦🇹 Österreich · 🇨🇭 Schweiz / Suisse · 🇳🇱 Nederland |
| `nordic` | 🇸🇪 Sverige · 🇳🇴 Norge · 🇩🇰 Danmark |
| `anglophone` | 🇬🇧 United Kingdom · 🇺🇸 United States · 🇦🇺 Australia |
| `asia` | 🇸🇬 Singapore · 🇨🇳 中国 China |
| `middle_east` | 🇦🇪 UAE · 🇶🇦 Qatar · 🇮🇱 Israel |

Le groupe et le champ `neighbors` alimentent les suggestions du sélecteur.

---

## Détection au premier lancement

`detectBrowserLocale()` croise le fuseau horaire
(`Intl.DateTimeFormat().resolvedOptions().timeZone`) et la langue du navigateur
(`navigator.language`). Le fuseau tranche en premier, car il distingue des cas
que la langue seule confond :

| Fuseau | Langue | Région retenue |
|---|---|---|
| `Europe/Vienna` | `de-AT` | 🇦🇹 Österreich |
| `Europe/Zurich` | `de-CH` | 🇨🇭 Schweiz |
| `Europe/Berlin` | `de-*` | 🇩🇪 Deutschland |
| `Europe/Brussels` | `fr-BE` | 🇧🇪 België (interface en `nl`) |
| `Asia/Qatar` | `ar-QA` | 🇶🇦 Qatar |
| `Asia/Dubai` | `ar-*` | 🇦🇪 UAE |

Sans correspondance, le repli est 🇫🇷 France.

Ce n'est qu'une valeur de départ : le choix explicite de l'utilisateur écrase
toujours la détection, et la détection ne rejoue jamais ensuite.

---

## Persistance

Le choix est écrit dans `localStorage` sous la clé `xpeng_locale`, au format
`{"region":"france","language":"fr"}`. Cette clé fait partie de la liste blanche
de synchronisation : la région suit donc d'un appareil à l'autre — voir
[SYNCHRONISATION.md](SYNCHRONISATION.md).

`normalizeLocale()` relit cette valeur en tolérant qu'elle soit ancienne,
partielle ou corrompue : région inconnue → France, langue absente des
traductions → langue par défaut de la région. Un `localStorage` bricolé à la
main ne peut donc pas mettre l'interface dans un état vide.

---

## Langues

12 langues d'interface : `en`, `fr`, `de`, `es`, `it`, `nl`, `sv`, `no`, `da`,
`zh`, `ar`, `he`.

Leur couverture n'est pas la même, et c'est volontaire :

| Langues | Clés traduites | Ce que ça couvre |
|---|---|---|
| `en`, `fr` | 68 | l'intégralité de l'interface |
| les 10 autres | 20 | navigation, titres d'accueil, favoris, recherche, sélecteur de région |

`t(key)` retombe sur l'anglais pour toute clé manquante, puis sur la clé
elle-même. Une langue partielle affiche donc une interface cohérente —
navigation traduite, textes secondaires en anglais — jamais un libellé vide.

Pour compléter une langue : ajouter les clés manquantes dans le bloc
correspondant de `src/context/LocaleContext.tsx`. La liste de référence est le
bloc `en`.

---

## Filtrage des services

Chaque service porte un tableau `availability`. `regionToAvailabilityMap`
(`src/utils/regionFilter.ts`) dit quelles valeurs une région accepte :

```ts
france:  ['global', 'europe', 'western_europe', 'france'],
usa:     ['global', 'north-america', 'anglophone'],
china:   ['asia', 'china'],   // pas de 'global' : services bloqués en Chine
```

La Chine est le seul cas qui **exclut** `global`, pour ne pas proposer des
services inaccessibles derrière le pare-feu.

Le sélecteur affiche un badge du nombre de services par région
(`countServicesForRegion`), mémoïsé : le catalogue est statique, chaque région
n'est comptée qu'une fois.

### ⚠️ Limite connue : les régions européennes sont équivalentes

Aujourd'hui, les 12 régions européennes affichent **toutes les mêmes 162
services**. La raison est dans les données, pas dans le filtre : les 14 services
marqués `france`, les 6 marqués `germany`, les 5 `uk`, les 5 `spain` et les 3
`italy` portent **aussi** le scope `europe`. Vérifié : aucun service du
catalogue n'a un scope national sans avoir également `europe` ou `global`.

Conséquence : les scopes nationaux et les scopes de groupe
(`western_europe`, `northern_europe`, `anglophone`) n'ajoutent rien au filtrage,
et le badge affiche 162 pour la France comme pour la Suède.

Répartition réelle des comptages :

| Région | Services |
|---|---|
| Toute l'Europe (12 régions) | 162 |
| 🇺🇸 United States | 134 |
| 🇦🇺 Australia | 119 |
| 🇸🇬 Singapore | 117 |
| 🇦🇪 🇶🇦 🇮🇱 Moyen-Orient | 112 |
| 🌍 Global | 111 |
| 🇨🇳 China | 28 |

**Pour rendre les régions européennes réellement distinctes**, il faudrait
retirer `europe` des services purement nationaux dans `src/data/platforms.ts`
(TF1+, Canal+, ARD, RTBF, SVT…). C'est un choix de produit, pas une correction :
un conducteur allemand en voyage en France cesserait alors de voir les chaînes
françaises. Rien n'a donc été modifié.

---

## Le sélecteur de région

`LocaleSelector` découpe la liste en trois sections, via `getRegionSections()` :

| Section | Contenu |
|---|---|
| **Global** | 🌍 Global, toujours en tête |
| **Suggérés** | la région courante, puis ses `neighbors` et son groupe |
| **Autres** | le reste, par ordre alphabétique du nom |

Une section vide n'est pas rendue, et une région ne peut apparaître que dans
une seule section. Les intitulés sont traduits (`regionSectionGlobal`,
`regionSectionSuggested`, `regionSectionOthers`).

---

## Vérifier à la main

```javascript
// région actuelle
localStorage.getItem('xpeng_locale')

// forcer une région
localStorage.setItem('xpeng_locale', JSON.stringify({ region: 'uk', language: 'en' }))
location.reload()

// effacer et relancer la détection
localStorage.removeItem('xpeng_locale')
location.reload()

// ce que le navigateur annonce
Intl.DateTimeFormat().resolvedOptions().timeZone
navigator.language
```

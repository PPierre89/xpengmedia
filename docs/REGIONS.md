# 🌍 Régions et langues

Comment l'application choisit une région, quels services elle affiche, et dans
quelle langue.

---

## Source unique

Tout part de `src/data/regionsMetadata.ts` :

```ts
export type Region = 'global' | 'france' | … ;   // 21 codes

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

Les deux listes existaient auparavant en double, avec les noms et drapeaux
recopiés. Elles étaient identiques — mais rien ne le garantissait, et le premier
renommage les aurait fait diverger sans erreur ni test rouge.

Pour **ajouter une région**, il suffit donc d'une entrée dans
`regionsMetadata.ts`, plus une ligne dans `regionToAvailabilityMap`
(`src/utils/regionFilter.ts`) ; TypeScript signale l'oubli, la carte étant un
`Record<Region, string[]>` exhaustif.

---

## Les 21 régions

| Groupe | Régions |
|---|---|
| `global` | 🌍 Global / International |
| `western_europe` | 🇫🇷 France · 🇪🇸 España · 🇮🇹 Italia · 🇧🇪 België / Belgique |
| `northern_europe` | 🇩🇪 Deutschland · 🇦🇹 Österreich · 🇨🇭 Schweiz / Suisse · 🇳🇱 Nederland |
| `nordic` | 🇸🇪 Sverige · 🇳🇴 Norge · 🇩🇰 Danmark · 🇫🇮 Suomi |
| `anglophone` | 🇬🇧 United Kingdom · 🇺🇸 United States · 🇦🇺 Australia |
| `asia` | 🇸🇬 Singapore · 🇨🇳 中国 China |
| `middle_east` | 🇦🇪 UAE · 🇶🇦 Qatar · 🇮🇱 Israel |

Le groupe et le champ `neighbors` alimentent les suggestions du sélecteur.

> 🇫🇮 **Suomi** n'a pas de traduction `fi` : l'interface y reste en anglais,
> comme le prévoit le repli de `t()`. La région existe parce que le catalogue
> contient **Yle Areena**, la télévision publique finlandaise : sans elle, ce
> service ne serait visible depuis aucune région. Un test le vérifie
> (« aucun service n'est invisible depuis toutes les régions »).

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
| `Europe/Helsinki` | `fi-*` | 🇫🇮 Suomi (interface en `en`) |

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
(`src/utils/regionFilter.ts`) dit quelles valeurs une région accepte — les
services mondiaux, les services réellement pan-européens si la région est en
Europe, et ceux de son propre pays :

```ts
france:  ['global', 'europe', 'france'],
germany: ['global', 'europe', 'germany'],
usa:     ['global', 'north-america'],
china:   ['asia', 'china'],   // pas de 'global' : services bloqués en Chine
```

La règle est simple : **un service national n'est visible que dans son pays.**
Une chaîne française n'apparaît pas quand la région est réglée sur l'Allemagne,
et réciproquement. Les voisins ne partagent rien non plus : la RTBF est belge,
pas française.

Deux nuances portées par les données elles-mêmes :

- un service **binational** porte ses deux pays — Arte est franco-allemande,
  donc `['france', 'germany']`, et n'apparaît nulle part ailleurs ;
- un service **réellement pan-européen** garde `europe` : Chargemap, Deezer,
  Radioplayer, Boosteroid, les réseaux de recharge. Ils sont visibles dans
  toutes les régions européennes et nulle part ailleurs.

La Chine est le seul cas qui **exclut** `global`, pour ne pas proposer des
services inaccessibles derrière le pare-feu.

### Les scopes

| Portée large | Sens |
|---|---|
| `global` | disponible partout (sauf Chine, qui n'accepte pas ce scope) |
| `europe` | réellement pan-européen |
| `north-america`, `asia`, `china`, `australia`, `middle-east` | continental |

| Portée nationale | |
|---|---|
| `france`, `belgium`, `switzerland`, `germany`, `austria`, `netherlands`, `spain`, `italy`, `uk`, `sweden`, `norway`, `denmark`, `finland` | un seul pays |

Chaque scope national **doit** correspondre à une région existante, sinon le
service ne serait affiché nulle part. Deux tests le garantissent, et c'est ce
qui a rendu la région Finlande nécessaire.

Les anciens scopes de groupe `western_europe`, `northern_europe` et
`anglophone` ont été **retirés** : tous les services qui les portaient
portaient aussi `europe`, ils n'avaient donc aucun effet sur le filtrage.

### Comptage par région

Le sélecteur affiche un badge du nombre de services par région
(`countServicesForRegion`), mémoïsé : le catalogue est statique, chaque région
n'est comptée qu'une fois.

| Région | Services |
|---|---|
| 🇫🇷 France | 131 |
| 🇺🇸 United States | 120 |
| 🇩🇪 Deutschland | 116 |
| 🇪🇸 España | 114 |
| 🇧🇪 België / Belgique · 🇨🇭 Schweiz / Suisse · 🇬🇧 United Kingdom | 113 |
| 🇮🇹 Italia | 111 |
| 🇳🇱 Nederland | 110 |
| 🇦🇹 Österreich · 🇸🇪 Sverige · 🇳🇴 Norge · 🇩🇰 Danmark · 🇫🇮 Suomi | 109 |
| 🇦🇺 Australia | 105 |
| 🇸🇬 Singapore | 103 |
| 🇦🇪 UAE · 🇶🇦 Qatar · 🇮🇱 Israel | 99 |
| 🌍 Global | 98 |
| 🇨🇳 中国 China | 28 |

Jusqu'en v2.5.1, **les 12 régions européennes affichaient toutes exactement 162
services** : chaque service marqué `france`, `germany`, `uk`, `spain` ou
`italy` portait aussi `europe`, et treize services nationaux — dont Canal+,
France.tv, ARD, ZDF et BBC iPlayer — portaient même `global`. Les scopes
nationaux n'avaient donc aucun effet, et la Suède affichait les chaînes
françaises. Les 65 services concernés ont été re-scopés.

---

## Ajouter un service national

1. L'ajouter dans `src/data/platforms.ts` avec le scope de **son pays**, pas
   `europe` — `europe` est réservé aux services réellement pan-européens.
2. Si son pays n'est pas encore une région, ajouter la région dans
   `regionsMetadata.ts` **et** son entrée dans `regionToAvailabilityMap` ;
   TypeScript signale l'oubli, et un test vérifie qu'aucun scope national ne
   reste orphelin.
3. Déclarer son logo (`npm run logos`, voir [LOGOS.md](LOGOS.md)).

```bash
npm run test:regions   # vérifie le filtrage et les scopes
```

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

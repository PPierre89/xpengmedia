# 🔊 Engine Sound — moteur virtuel

Page embarquée : `/engine-sound.html` (Autres services → Apps XPENG intégrées).

Elle joue le son d'un moteur thermique qui suit la vitesse de la voiture, dans
l'esprit des services « engine as a service » apparus sur les navigateurs de
Tesla. Tout est généré dans le navigateur : **aucun fichier audio embarqué,
aucune requête tierce**, rien à configurer côté serveur.

---

## Utilisation

1. Ouvrir la page **à l'arrêt**, choisir un moteur et un volume.
2. Appuyer sur **Démarrer** (le navigateur n'autorise le son qu'après un geste
   de l'utilisateur).
3. Rouler : le régime et les rapports suivent la vitesse.

Le volume, le moteur et la source de vitesse sont mémorisés dans le navigateur.

## Les 18 motorisations

| Famille | Moteurs |
|---|---|
| V8 | V8 croisé (muscle car US) · V8 compresseur (muscle car moderne) · V8 plat (supercar italienne) · V8 biturbo (GT allemande) |
| V10 · V12 · W16 | V12 atmosphérique · V10 supercar · W16 quadriturbo |
| Course | F1 V10 années 2000 · Rotatif 2 rotors |
| Sportives | Flat-6 · 6 en ligne · 5 cylindres turbo · V6 biturbo |
| Caractère | Boxer 4 à collecteurs inégaux · 4 cylindres turbo · 3 cylindres · V-twin 45° |
| Utilitaire | Diesel 6 cylindres de poids lourd (12 rapports) |

Les volumes sont égalisés à −22 LUFS (EBU R128, ±0,4 dB) : passer d'un moteur
à l'autre ne fait pas sauter le niveau sonore.

## Point d'écoute

Le modèle produit trois pistes séparées — **échappement**, **admission**,
**mécanique** — mixées selon la position du « micro », comme dans un
simulateur :

| Point d'écoute | Ce qu'on entend |
|---|---|
| **Habitacle** (défaut) | La carrosserie coupe les aigus de l'échappement (passe-bas ~1,9 kHz), le volume de l'habitacle gonfle le grave (+6 dB sous 110 Hz, bosse à 52 Hz), la mécanique passe par le tablier. C'est ce qu'on entend dans une vraie voiture. |
| **Cockpit** | Prise de son type caméra embarquée : échappement plus ouvert, admission bien présente. |
| **Extérieur** | Derrière la voiture : échappement plein spectre, admission lointaine, un peu d'espace. |

Le mix passe ensuite dans une compression douce (« colle » du mix), puis dans
un limiteur de crête à −3 dBFS.

## Les trois moteurs audio

### 1. Modèle physique (par défaut)

Inspiré de la synthèse des simulateurs « physiques » : au lieu de jouer une
forme d'onde, la page simule ce qui produit le son.

```
vilebrequin ─► allumage de chaque cylindre à son angle réel
                 │  (écarts fixes de remplissage et de longueur de collecteur)
                 ▼
  impulsion d'échappement : onde de vidange brève + refoulement,
  durée en degrés de vilebrequin (raccourcit quand le régime monte)
                 ▼
  collecteur du banc (guide d'onde) ─► silencieux (s'ouvre avec la charge)
  ─► résonance de ligne (bourdonnement) ─► tube de sortie ─► rayonnement
                                                             (passe-haut qui suit le régime)
  + admission : impulsions d'aspiration ─► résonance des conduits ─► boîte à air
  + mécanique : chocs de combustion dans le bloc, soupapes, chaîne
  + turbo (sifflement, soupape « pschitt » ou « tututu »), compresseur
    volumétrique, cliquetis diesel, détonations au lever de pied
```

Ce qui fait la différence à l'oreille :

- **l'ordre d'allumage et les bancs** : un V8 croisé (1-8-4-3-6-5-7-2) envoie
  deux allumages de suite dans le même banc ; avec les écarts entre cylindres,
  cela fait ressortir les ordres 1,5 et 2,5 du vilebrequin, le glouglou
  américain. Un V8 à vilebrequin plat alterne les bancs et hurle comme deux
  4 cylindres ;
- **la durée de l'impulsion en degrés** : le timbre s'éclaircit tout seul avec
  le régime, comme sur un vrai moteur ;
- **les intervalles irréguliers** : V10 à 90° (54°/90°), V-twin à 45°
  (315°/405°) ;
- **les collecteurs** : accordés (longueurs égales) sur la F1, le V12, le V8
  plat et le flat-6, inégaux sur le boxer 4 et le V8 croisé ;
- **la dispersion de combustion**, plus forte au ralenti, et un ralenti qui
  « chasse » légèrement : le moteur vit au lieu de bourdonner.

Dynamique de conduite : inertie du régime, coupure d'allumage brève aux
passages de rapport (avec possible détonation), coup de gaz au rétrogradage
sur les moteurs sportifs, rupteur en zone rouge.

Le modèle tourne dans un `AudioWorklet`, qui exige un **contexte sécurisé**
(HTTPS ou `localhost`). Il calcule environ 25 fois plus vite que le temps réel
sur un processeur de bureau.

#### Qualité du signal

- impulsions lues dans des tables à bande limitée (pas de repliement
  spectral à haut régime) et démarrées à la fraction d'échantillon près ;
- filtres d'état en topologie TPT, stables à toute fréquence ;
- aucune allocation mémoire dans la boucle audio ;
- garde-fou : si une valeur non finie apparaissait, le modèle repart d'un état
  propre au lieu de se taire.

### 2. Mes enregistrements

Même principe que les banques de sons des simulateurs : des boucles calées sur
un régime, accélérées ou ralenties puis fondues entre elles.

- Un fichier par régime, avec le régime dans le nom : `1000.wav`, `3500.mp3`,
  `6000.ogg`…
- Ajouter `off`, `decel`, `coast` ou `lift` pour les sons **pied levé**
  (`3500_off.wav`) : ils prennent le relais quand la charge tombe.
- Un fichier seul sans régime dans le nom est considéré enregistré à 1000 tr/min.
- 80 Mo au total. Les fichiers restent dans le navigateur (IndexedDB) et ne
  sont jamais envoyés au serveur.

Pour des boucles propres : régime stabilisé, 2 à 5 s, sans bruit de vent, et
au moins trois régimes (ralenti, mi-régime, haut).

> Utilisez vos propres prises de son ou des sons dont la licence le permet
> (CC0, CC BY…). Les sons extraits des jeux vidéo appartiennent à leurs
> éditeurs et ne doivent pas être ajoutés à ce dépôt.

### 3. Repli

Si le navigateur n'offre pas `AudioWorklet` (page servie en HTTP hors
`localhost`), un synthé à oscillateurs prend le relais et un message invite à
passer en HTTPS.

## Sources de vitesse

| Mode | Fonctionnement | Prérequis |
|---|---|---|
| **GPS** | `navigator.geolocation.watchPosition` ; `coords.speed` si fourni, sinon distance ÷ temps entre deux positions (précision < 50 m) | Media Hub en **HTTPS** + autorisation de localisation |
| **Démo** | Pédale virtuelle à maintenir, physique simplifiée | Aucun |

Sans nouvelle position pendant 8 s (tunnel, parking couvert), le moteur
redescend doucement au ralenti.

> ⚠️ Non vérifié à ce jour dans le navigateur XPENG : l'accès à la
> localisation dépend de la version de Xmart OS. Si le mode GPS reste en
> « Recherche du signal », le message d'état l'indique et le mode Démo reste
> utilisable.
>
> Les données véhicule du serveur (`/api/vehicle`, voir [VEHICULE.md](VEHICULE.md))
> ne sont **pas** utilisées : elles sont rafraîchies toutes les 60 s, bien trop
> lentement pour piloter un régime moteur.

## Ajouter une motorisation

Dans `public/engine-sound.html`, compléter `RAW_PROFILES`. Les champs absents
prennent les valeurs de `DEFAULTS`.

```js
v8nascar: {
  fam: 'Course', label: 'V8 NASCAR', sub: 'ovale',
  fire: even(8), bank: CROSS, pipes: [0.9, 0.9], tail: 0.5,
  idle: 1500, redline: 9500, launch: 4000, gears: [12, 16, 20, 24],
  imb: 0.08, hdr: 0.4, evo: 270, muffler: 6000, drone: 0, width: 0.4,
  intake: 0.9, runnerHz: 600, airbox: 4000, crackle: 0.6,
},
```

| Champ | Rôle |
|---|---|
| `fire` | angles d'allumage (° de vilebrequin sur 720°), dans l'ordre ; `even(n)` pour des intervalles réguliers |
| `bank` | ligne d'échappement (0 ou 1) de chaque allumage ; `CROSS`, `alt(n)`, `one(n)` |
| `lag` | *(facultatif)* retard en ms par allumage (collecteurs inégaux) |
| `imb` / `hdr` | écart de remplissage entre cylindres (0-0,15) / dispersion des collecteurs (ms) |
| `evo` | durée d'ouverture de la soupape d'échappement (°) |
| `rough` | dispersion de combustion d'un cycle à l'autre |
| `idle` / `redline` / `launch` | ralenti, zone rouge, patinage d'embrayage au départ |
| `gears` | km/h pour 1000 tr/min, un nombre par rapport |
| `pipes` / `tail` / `reso` | collecteurs (m), tube de sortie (m), réflexions (0-0,7) |
| `muffler` | coupure du silencieux (Hz) |
| `drone` / `droneHz` | bourdonnement de ligne |
| `width` | écart stéréo entre les deux sorties |
| `intake` / `runnerHz` / `airbox` | admission : niveau, conduits, boîte à air |
| `mech` / `diesel` | distribution et bloc / cliquetis d'injection |
| `turbo` / `bov` / `blower` | turbo (0-1), décharge `valve`, `flutter` ou `none`, compresseur volumétrique |
| `crackle` | détonations au lever de pied et aux passages |
| `level` | correction de sonie ; viser −22 LUFS en vue Habitacle |

## Sécurité

- À démarrer à l'arrêt ; l'interface n'exige aucune manipulation en roulant.
- Le son passe par les haut-parleurs de l'habitacle uniquement. Il ne remplace
  pas l'avertisseur sonore extérieur du véhicule (AVAS) et ne doit pas couvrir
  les alertes de la voiture ni les sirènes.

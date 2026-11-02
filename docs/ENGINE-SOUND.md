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

## Les 17 motorisations

| Famille | Moteurs |
|---|---|
| V8 | V8 croisé (muscle car US) · V8 plat (supercar italienne) · V8 biturbo (GT allemande) |
| V10 · V12 · W16 | V12 atmosphérique · V10 supercar · W16 quadriturbo |
| Course | F1 V10 années 2000 · Rotatif 2 rotors |
| Sportives | Flat-6 · 6 en ligne · 5 cylindres turbo · V6 biturbo |
| Caractère | Boxer 4 à collecteurs inégaux · 4 cylindres turbo · 3 cylindres · V-twin 45° |
| Utilitaire | Diesel 6 cylindres de poids lourd (12 rapports) |

Les volumes sont égalisés (mesure EBU R128) : passer d'un moteur à l'autre ne
fait pas sauter le niveau sonore.

## Les trois moteurs audio

### 1. Modèle physique (par défaut)

Inspiré de la synthèse des simulateurs « physiques » : au lieu de jouer une
forme d'onde, la page simule ce qui produit le son.

```
vilebrequin ─► allumage de chaque cylindre à son angle réel ─┐
                                                             ▼
   impulsion de pression ─► ligne d'échappement du banc (guide d'onde à retard,
                            résonance réglée par la longueur du tube)
                         ─► silencieux (passe-bas qui s'ouvre avec la charge)
   + admission, distribution, cliquetis diesel, turbo + soupape de décharge,
     retours de flamme au lever de pied
```

Ce qui fait la différence à l'oreille :

- **l'ordre d'allumage et les bancs** : un V8 croisé (1-8-4-3-6-5-7-2) envoie
  deux allumages de suite dans le même banc, d'où le glouglou américain ; un
  V8 à vilebrequin plat alterne les bancs et hurle comme un 4 cylindres ;
- **les intervalles irréguliers** : V10 à 90° (54°/90°), V-twin à 45°
  (315°/405°) ;
- **les collecteurs de longueurs inégales** du boxer 4, simulés par un retard
  propre à chaque cylindre ;
- **la dispersion de combustion**, plus forte au ralenti, qui rend le moteur
  vivant au lieu d'un bourdonnement régulier.

Le modèle tourne dans un `AudioWorklet`, qui exige un **contexte sécurisé**
(HTTPS ou `localhost`).

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

Dans `public/engine-sound.html`, compléter l'objet `PROFILES` :

```js
v8nascar: {
  fam: 'Course', label: 'V8 NASCAR', sub: 'ovale',
  fire: even(8), bank: [0, 1, 1, 0, 1, 0, 0, 1], pipes: [0.9, 0.9],
  idle: 1500, redline: 9500, launch: 4000, gears: [12, 16, 20, 24],
  sharp: 1.6, noise: 0.3, rough: 0.05, muffler: 4500, reso: 0.5,
  intake: 0.8, mech: 0.15, crackle: 0.6, turbo: 0, level: 1,
},
```

| Champ | Rôle |
|---|---|
| `fire` | angles d'allumage (° de vilebrequin sur 720°), dans l'ordre d'allumage ; `even(n)` pour des intervalles réguliers |
| `bank` | ligne d'échappement (0 ou 1) de chaque allumage |
| `pipes` | longueur des deux lignes, en mètres |
| `lag` | *(facultatif)* retard en ms par allumage, pour des collecteurs inégaux |
| `idle` / `redline` / `launch` | ralenti, zone rouge, régime de patinage d'embrayage au départ |
| `gears` | km/h pour 1000 tr/min, un nombre par rapport |
| `sharp` | durée de l'impulsion (ms) : court = aigu et nerveux |
| `noise` | part de souffle dans l'impulsion (0-1) |
| `rough` | dispersion de combustion (0-0,2) |
| `muffler` | coupure du silencieux (Hz) |
| `reso` | réflexion dans le tube (0-0,9) |
| `intake` / `mech` / `diesel` | admission, distribution, cliquetis diesel |
| `crackle` / `turbo` | pétarades, turbo (0-1) |
| `level` | correction de volume ; viser la même sonie que les autres moteurs |

## Sécurité

- À démarrer à l'arrêt ; l'interface n'exige aucune manipulation en roulant.
- Le son passe par les haut-parleurs de l'habitacle uniquement. Il ne remplace
  pas l'avertisseur sonore extérieur du véhicule (AVAS) et ne doit pas couvrir
  les alertes de la voiture ni les sirènes.

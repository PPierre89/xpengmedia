# 🔊 Engine Sound — moteur virtuel

Page embarquée : `/engine-sound.html` (Autres services → Apps XPENG intégrées).

Elle joue le son d'un moteur thermique qui suit la vitesse de la voiture, dans
l'esprit des services « engine as a service » apparus sur les navigateurs de
Tesla. Tout est généré dans le navigateur : **aucun fichier audio, aucune
requête tierce**, rien à configurer côté serveur.

---

## Utilisation

1. Ouvrir la page **à l'arrêt**, choisir un moteur et un volume.
2. Appuyer sur **Démarrer** (le navigateur n'autorise le son qu'après un geste
   de l'utilisateur).
3. Rouler : le régime et les rapports suivent la vitesse.

Le volume, le moteur et la source de vitesse sont mémorisés dans le navigateur.

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

## Comment le son est produit

```
vitesse ─► lissage ─► boîte simulée ─► régime ─┐
              └──► accélération ─► charge ─────┤
                                               ▼
   oscillateurs (forme d'onde par moteur) ─► saturation ─► passe-bas ─┐
   bruit filtré (admission / échappement) ────────────────────────────┤
   turbo (sifflement + décharge) ─────────────────────────────────────┤
   pétarades (lever de pied, passage de rapport) ─────────────────────┤
                                                                       ▼
                                        passe-haut 28 Hz ─► compresseur ─► sortie
```

- **Fréquence de base** : régime ÷ 120 (un cycle 4 temps = deux tours).
  L'énergie est concentrée sur les multiples du nombre de cylindres ; le
  paramètre `uneven` ajoute les ordres intermédiaires qui donnent le
  « glouglou » d'un V8 à vilebrequin croisé.
- **Boîte** : chaque profil liste ses rapports en km/h pour 1000 tr/min. Le
  passage monte plus haut dans les tours quand la charge est forte, avec une
  brève coupure d'allumage.

## Ajouter un moteur

Dans `public/engine-sound.html`, compléter l'objet `PROFILES` :

```js
v10: { label: 'V10', sub: 'supercar', cyl: 10, idle: 1000, redline: 8500,
       launch: 3000, gears: [8, 13, 18, 23, 29, 35, 41],
       uneven: 0.1, bright: 0.85, grit: 1.7, crackle: 0.5, turbo: 0 },
```

| Champ | Rôle |
|---|---|
| `cyl` | nombre de cylindres (ordre d'allumage dominant) |
| `idle` / `redline` / `launch` | ralenti, zone rouge, régime de patinage d'embrayage au départ |
| `gears` | km/h pour 1000 tr/min, un nombre par rapport |
| `uneven` | 0 à 1, irrégularité d'allumage |
| `bright` | 0 à 1, richesse en aigus |
| `grit` | 1 à 3, saturation |
| `crackle` | 0 à 1, probabilité de pétarades |
| `turbo` | 0 à 1, présence du turbo |

## Sécurité

- À démarrer à l'arrêt ; l'interface n'exige aucune manipulation en roulant.
- Le son passe par les haut-parleurs de l'habitacle uniquement. Il ne remplace
  pas l'avertisseur sonore extérieur du véhicule (AVAS) et ne doit pas couvrir
  les alertes de la voiture ni les sirènes.

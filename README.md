<div align="center">

# 🚗 XPENG Media Hub 💙

### *Le centre multimédia intelligent pour votre XPENG*

[![Auto-hébergement](https://img.shields.io/badge/🏠_Auto--hébergé-Docker_/_NAS-2496ED?style=for-the-badge&logo=docker&logoColor=white)](DEPLOY-NAS-UGREEN.md)
[![Image](https://img.shields.io/badge/ghcr.io-xpengmedia-181717?style=for-the-badge&logo=github&logoColor=white)](https://github.com/PPierre89/xpengmedia/pkgs/container/xpengmedia)
[![React](https://img.shields.io/badge/React-19.2-61DAFB?style=for-the-badge&logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-38B2AC?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com/)

**[🏠 Déployer sur ton NAS](DEPLOY-NAS-UGREEN.md)** • **[📖 Documentation](#-documentation)** • **[🐛 Signaler un bug](https://github.com/PPierre89/xpengmedia/issues)**

---

### 200 services • 12 langues • 20 régions • Mode clair/sombre • 100% responsive

![XPENG Media Hub](https://img.shields.io/badge/Status-Production-brightgreen?style=flat-square)
![Version](https://img.shields.io/badge/Version-2.5.1-blue?style=flat-square)
![Licence](https://img.shields.io/badge/Licence-MIT-yellow?style=flat-square)

</div>

---

## 📖 À propos

**XPENG Media Hub** est une application web moderne et élégante conçue pour centraliser l'accès à tous vos services de streaming, musique, jeux et autres contenus multimédias directement depuis le navigateur de votre véhicule XPENG.

Inspirée de l'interface **XPENG XOS**, cette application offre une expérience utilisateur fluide, intuitive et parfaitement optimisée pour les écrans tactiles automobiles (G6, G9, P7, P5).

### 🎯 Objectifs

- ✅ **Centralisation** : Tous vos services au même endroit
- ✅ **Simplicité** : Interface intuitive et rapide
- ✅ **Adaptabilité** : Contenu adapté à votre région
- ✅ **Performance** : Chargement ultra-rapide
- ✅ **Élégance** : Design moderne et cohérent XPENG

---

## ✨ Fonctionnalités principales

### 🌍 **Multi-régional et multilingue**
- **12 langues** : anglais et français complets, 10 autres sur les écrans principaux
- **Détection automatique** de la langue et de la région, par fuseau horaire + navigateur
- **Filtrage** : seuls les services disponibles dans votre région
- **Suggestions de régions** basées sur la proximité géographique et linguistique

### 📺 **200 services organisés**
- **🎬 Vidéo** : 118 services (Netflix, Disney+, Prime Video…)
- **🎵 Musique** : 20 services (Spotify, Apple Music, Deezer…)
- **🎮 Jeux** : 21 services (GeForce NOW, Xbox Cloud Gaming…)
- **🔋 Recharge** : 13 services (ABRP, Chargemap, PlugShare…)
- **🌐 Services web & outils** : 28 services (Gmail, notes, calculatrice…)

### 🎨 **Design XPENG**
- **Thème clair/sombre** avec transition fluide
- **Gradients cyan/blue** signature XPENG
- **Icônes uniformes** avec design cohérent
- **Animations fluides** avec Framer Motion
- **Mode paysage optimisé** pour écran automobile

### 📱 **PWA installable**
- Installation sur l'écran d'accueil, démarrage plein écran
- Interface disponible hors ligne, chargement instantané depuis le cache
- **Zéro requête tierce** : logos et police embarqués, servis par votre serveur
- Flux IPTV et détection du proxy local volontairement exclus du cache
- Nécessite un accès HTTPS ([détails](DEPLOY-NAS-UGREEN.md#-installer-lapp-dans-la-voiture-pwa))

### 📱 **Responsive & Optimisé**
- **Portrait** : 5 colonnes, interface compacte
- **Paysage** : 8 colonnes, aucun scroll nécessaire
- **Mobile** : Touch-friendly, gestes intuitifs
- **Desktop** : Expérience complète avec hover effects

---

## 🌍 Régions supportées

<div align="center">

### 20 régions • 6 groupes • Suggestions intelligentes

</div>

### **🌍 Global / International**
- **Langue** : Anglais (EN)
- **Services** : 111 services universels
- **Description** : Services accessibles partout dans le monde

---

### **🇪🇺 Europe de l'Ouest** (Langues latines)

| Pays | Drapeau | Langues | Voisins | Services spécifiques |
|------|---------|---------|---------|----------------------|
| **France** | 🇫🇷 | Français | 🇧🇪 🇨🇭 🇪🇸 🇮🇹 🇩🇪 | Canal+, Molotov, France TV, RTL Play |
| **Espagne** | 🇪🇸 | Espagnol | 🇫🇷 | Services ES |
| **Italie** | 🇮🇹 | Italien | 🇫🇷 🇨🇭 🇦🇹 | Services IT |
| **Belgique** | 🇧🇪 | NL + FR | 🇫🇷 🇳🇱 🇩🇪 | RTBF Auvio, RTL Play, Pickx |

---

### **🇪🇺 Europe du Nord** (Langues germaniques)

| Pays | Drapeau | Langues | Voisins | Services spécifiques |
|------|---------|---------|---------|----------------------|
| **Allemagne** | 🇩🇪 | Allemand | 🇦🇹 🇨🇭 🇳🇱 🇧🇪 🇫🇷 | ARD, ZDF, RTL+, DAZN DE |
| **Autriche** | 🇦🇹 | Allemand | 🇩🇪 🇨🇭 🇮🇹 | Services AT |
| **Suisse** | 🇨🇭 | DE + FR + IT | 🇫🇷 🇩🇪 🇦🇹 🇮🇹 | RTS Play, Play Suisse |
| **Pays-Bas** | 🇳🇱 | Néerlandais | 🇧🇪 🇩🇪 | Services NL |

---

### **🇪🇺 Europe du Nord** (Scandinavie)

| Pays | Drapeau | Langues | Voisins | Services spécifiques |
|------|---------|---------|---------|----------------------|
| **Suède** | 🇸🇪 | Suédois | 🇳🇴 🇩🇰 | Services SE |
| **Norvège** | 🇳🇴 | Norvégien | 🇸🇪 🇩🇰 | Services NO |
| **Danemark** | 🇩🇰 | Danois | 🇸🇪 🇳🇴 🇩🇪 | Services DK |

---

### **🌎 Pays anglophones**

| Pays | Drapeau | Langues | Voisins | Services spécifiques |
|------|---------|---------|---------|----------------------|
| **Royaume-Uni** | 🇬🇧 | Anglais | - | BBC iPlayer, Channel 4, ITV Hub |
| **États-Unis** | 🇺🇸 | Anglais | - | Hulu, Peacock, ESPN+, HBO Max |
| **Australie** | 🇦🇺 | Anglais | - | Stan, 9Now, 10 Play, ABC iView |
| **Singapour** | 🇸🇬 | EN + ZH | 🇨🇳 | Services SG + Asie |

---

### **🌏 Moyen-Orient**

| Pays | Drapeau | Langues | Voisins | Services spécifiques |
|------|---------|---------|---------|----------------------|
| **Émirats Arabes Unis** | 🇦🇪 | Arabe | 🇶🇦 | OSN, Shahid |
| **Qatar** | 🇶🇦 | Arabe | 🇦🇪 | Services QA |
| **Israël** | 🇮🇱 | Hébreu + AR | - | Services IL |

---

### **🇨🇳 Asie**

| Pays | Drapeau | Langues | Voisins | Services spécifiques |
|------|---------|---------|---------|----------------------|
| **Chine** | 🇨🇳 | Chinois | 🇸🇬 | Bilibili, iQIYI, Youku, WeChat, Weibo, Tencent Video, Mango TV, Douyin, DingTalk |

---

## 🗣️ Langues supportées

<div align="center">

### 12 langues • Détection automatique • Repli sur l'anglais

</div>

L'interface est traduite en 12 langues, mais **pas au même niveau** — et c'est
assumé : l'anglais et le français couvrent l'intégralité des libellés, les dix
autres couvrent la navigation et les écrans principaux.

| Langue | Code | Région(s) principale(s) | Couverture |
|--------|------|-------------------------|------------|
| **Anglais** | EN | 🌍 Global, 🇬🇧 UK, 🇺🇸 USA, 🇦🇺 AU, 🇸🇬 SG | ✅ Complète (68 clés) |
| **Français** | FR | 🇫🇷 France, 🇧🇪 Belgique | ✅ Complète (68 clés) |
| **Allemand** | DE | 🇩🇪 Allemagne, 🇦🇹 Autriche, 🇨🇭 Suisse | 🟡 Essentiel (20 clés) |
| **Espagnol** | ES | 🇪🇸 Espagne | 🟡 Essentiel (20 clés) |
| **Italien** | IT | 🇮🇹 Italie | 🟡 Essentiel (20 clés) |
| **Néerlandais** | NL | 🇳🇱 Pays-Bas, 🇧🇪 Belgique | 🟡 Essentiel (20 clés) |
| **Suédois** | SV | 🇸🇪 Suède | 🟡 Essentiel (20 clés) |
| **Norvégien** | NO | 🇳🇴 Norvège | 🟡 Essentiel (20 clés) |
| **Danois** | DA | 🇩🇰 Danemark | 🟡 Essentiel (20 clés) |
| **Chinois** | ZH | 🇨🇳 Chine | 🟡 Essentiel (20 clés) |
| **Arabe** | AR | 🇦🇪 UAE, 🇶🇦 Qatar | 🟡 Essentiel (20 clés) |
| **Hébreu** | HE | 🇮🇱 Israël | 🟡 Essentiel (20 clés) |

**Essentiel** = navigation, titres d'accueil, favoris, recherche et sélecteur de
région. Toute clé manquante retombe sur l'anglais, jamais sur un libellé vide.

👉 Détail du fonctionnement, de la détection et du filtrage : [docs/REGIONS.md](docs/REGIONS.md)

---

## 📺 Liste complète des services

<div align="center">

### 200 services • 5 catégories • Organisés par région

</div>

### 🎬 **Vidéo & Streaming** (85+ services)

#### **Streaming Global**
- **Netflix** - Leader mondial du streaming
- **Disney+** - Marvel, Star Wars, Pixar, Disney
- **Amazon Prime Video** - Films, séries, contenus originaux
- **YouTube** - Vidéos gratuites et Premium
- **Apple TV+** - Contenus originaux Apple
- **Twitch** - Streaming en direct et gaming

#### **Streaming Anime & Asie**
- **Crunchyroll** - Anime légal #1 mondial
- **Anime Digital Network (ADN)** - Anime français
- **HIDIVE** - Anime indépendant
- **Wakanim** - Anime Europe
- **Bilibili** - Plateforme chinoise anime/gaming
- **iQIYI** - Streaming chinois
- **Youku** - Vidéos chinoises
- **Tencent Video** - Streaming Tencent
- **Mango TV** - TV chinoise
- **Douyin** - TikTok chinois

#### **Streaming Europe**
- **Canal+ (MyCanal)** - Premium français
- **Molotov TV** - TV française gratuite
- **France TV** - TV publique française
- **RTBF Auvio** - TV belge francophone
- **RTL Play** - Streaming belge
- **Pickx** - TV belge
- **RTS Play** - TV suisse romande
- **Play Suisse** - Streaming suisse
- **Arte** - Culture franco-allemande
- **6play** - M6 replay
- **TF1+** - TF1 replay
- **ARD Mediathek** - TV publique allemande
- **ZDF** - TV publique allemande
- **BBC iPlayer** - TV britannique
- **ITV Hub** - TV britannique
- **Channel 4** - TV britannique

#### **Streaming Amérique du Nord**
- **Hulu** - Streaming US
- **Peacock** - NBCUniversal
- **Paramount+** - ViacomCBS
- **HBO Max** - Warner Bros
- **ESPN+** - Sport US
- **Showtime** - Premium US

#### **Streaming Australie**
- **Stan** - Streaming australien
- **9Now** - TV australienne
- **10 Play** - TV australienne
- **ABC iView** - TV publique australienne
- **SBS On Demand** - TV multiculturelle australienne

#### **Sport**
- **DAZN** - Sport en streaming
- **Eurosport Player** - Sport européen
- **beIN Sports** - Sport international
- **RMC Sport** - Sport français

#### **TV en direct & Info**
- **Free TV+** - TV gratuite Free
- **TV Mucho** - TV européenne
- **Pluto TV** - TV gratuite
- **BFM TV** - Info française
- **LCI** - Info TF1
- **CNews** - Info continue

---

### 🎵 **Musique & Audio** (45+ services)

#### **Streaming Musical**
- **Spotify** - Leader mondial
- **Apple Music** - Musique Apple
- **YouTube Music** - Google Music
- **Deezer** - Musique française
- **TIDAL** - HiFi audio
- **Amazon Music** - Music Amazon
- **Qobuz** - HiFi streaming

#### **Musique Asie**
- **QQ Music** - Musique chinoise
- **NetEase Cloud Music** - Streaming chinois

#### **Podcasts & Radio**
- **Podcast Addict** - Podcasts
- **TuneIn** - Radio mondiale
- **Radio France** - Radios françaises

---

### 🎮 **Jeux & Cloud Gaming** (35+ services)

#### **Stores & Launchers**
- **Steam** - Store PC #1
- **Epic Games Store** - Epic Games
- **GOG** - Jeux DRM-free
- **Battle.net** - Blizzard games
- **Ubisoft Connect** - Ubisoft
- **EA App** - Electronic Arts
- **Xbox** - Microsoft Gaming
- **PlayStation Store** - Sony Gaming
- **Nintendo eShop** - Nintendo

#### **Cloud Gaming**
- **GeForce NOW** - NVIDIA cloud
- **Xbox Cloud Gaming** - Microsoft
- **PlayStation Plus Cloud** - Sony
- **Amazon Luna** - Amazon cloud
- **Boosteroid** - Cloud européen
- **Shadow** - PC cloud
- **Blacknut** - Cloud familial

#### **Plateformes Mobile**
- **Google Play Games** - Android games
- **Apple Arcade** - iOS gaming

---

### 🔋 **Recharge & Navigation** (20+ services)

#### **Planification de recharge**
- **A Better Routeplanner (ABRP)** - Planification VE
- **Chargemap** - Bornes Europe
- **PlugShare** - Bornes mondiales
- **ChargePoint** - Réseau US/EU
- **Electromaps** - Bornes Europe

#### **Réseaux de recharge**
- **Tesla Supercharger** - Réseau Tesla
- **XPENG Supercharging** - Réseau XPENG
- **Ionity** - Réseau européen
- **Fastned** - Bornes rapides EU
- **Allego** - Bornes Europe

#### **Navigation**
- **Waze** - Navigation communautaire
- **Google Maps** - Maps Google
- **Apple Plans** - Maps Apple
- **HERE WeGo** - Navigation HERE

---

### 🌐 **Services Web & Productivité** (25+ services)

#### **Email & Communication**
- **Gmail** - Email Google
- **Outlook** - Email Microsoft
- **ProtonMail** - Email sécurisé
- **WeChat** - Messagerie chinoise
- **Weibo** - Social chinois
- **WhatsApp Web** - Messagerie
- **Telegram Web** - Messagerie

#### **Cloud & Stockage**
- **Google Drive** - Cloud Google
- **OneDrive** - Cloud Microsoft
- **Dropbox** - Cloud storage
- **iCloud** - Cloud Apple

#### **Productivité**
- **Google Docs** - Documents Google
- **Microsoft 365** - Suite Office
- **Notion** - Notes & organisation
- **Trello** - Gestion de projet
- **Slack** - Communication équipe
- **Zoom** - Visioconférence
- **DingTalk** - Productivité Alibaba

#### **Autres**
- **ChatGPT** - IA conversationnelle
- **GitHub** - Code & développement
- **Stack Overflow** - Q&A développeurs

---

## 📊 Statistiques

<div align="center">

| Catégorie | Nombre de services | % du total |
|-----------|-------------------|------------|
| 🎬 **Vidéo** | 118 | 59 % |
| 🎵 **Musique** | 20 | 10 % |
| 🎮 **Jeux** | 21 | 11 % |
| 🔋 **Recharge** | 13 | 7 % |
| 🌐 **Web** | 28 | 14 % |
| **TOTAL** | **200** | **100 %** |

</div>

---

## 🛠️ Technologies utilisées

### **Frontend**
- **React 19.2** — bibliothèque UI
- **TypeScript 5.9** — typage statique, mode `strict`
- **rolldown-vite 7.2** — build (remplaçant de Vite, API identique)
- **Tailwind CSS 3.4** — styling utility-first

### **Bibliothèques**
- **Framer Motion** — animations
- **React Router 7.9** — navigation SPA (`HashRouter`)
- **Heroicons** + **react-icons** — icônes SVG
- **Headless UI** — composants accessibles (modales, listes)

### **Serveur**
- **Node.js 22** — serveur d'auto-hébergement **sans aucune dépendance npm**
- **node:test** — 99 tests, aucun framework externe

### **Outils**
- **ESLint** — lint
- **PostCSS** — transformation CSS
- **simple-icons** — logos de marque, à la génération uniquement
- **Docker** — image d'auto-hébergement publiée sur GHCR

---

## 🚀 Installation et développement

### **Prérequis**
- Node.js **22+** (les tests utilisent le type-stripping natif de Node)
- npm
- Git

### **Installation locale**

```bash
# 1. Cloner le dépôt
git clone https://github.com/PPierre89/xpengmedia.git
cd xpengmedia

# 2. Installer les dépendances
npm install

# 3. Lancer le serveur de développement
npm run dev

# 4. Ouvrir dans le navigateur
# http://localhost:5173
```

### **Build production**

```bash
# Build optimisé
npm run build

# Prévisualiser le build
npm run preview

# Compiler puis servir avec le serveur d'auto-hébergement
npm run serve
```

---

## 🏠 Auto-hébergement (NAS UGREEN, Docker, Raspberry Pi)

**Le déploiement le plus simple : un seul fichier `docker-compose.yml`.**

```bash
docker compose up -d      # puis http://IP-DU-NAS:8080
```

L'image embarque l'application **et** un proxy IPTV local sur la même origine :
plus aucune erreur CORS, plus aucun proxy public à configurer — le player IPTV
le détecte automatiquement.

📖 **Guide pas à pas pour NAS UGREEN DXP4800 Plus (UGOS Pro) : [DEPLOY-NAS-UGREEN.md](DEPLOY-NAS-UGREEN.md)**

Sans Docker :

```bash
npm ci --legacy-peer-deps
npm run serve             # compile puis sert sur http://localhost:8080
```

| | Rôle |
|---|---|
| `Dockerfile` | Image tout-en-un (build React + serveur Node sans dépendance) |
| `docker-compose.yml` | Déploiement depuis l'image publiée (le plus simple) |
| `docker-compose.build.yml` | Déploiement en compilant depuis les sources |
| `server/server.js` | Serveur statique + proxy CORS `/api/proxy` |

---

## 📂 Structure du projet

```
xpengmedia/
├── server/
│   ├── server.js            # Serveur tout-en-un : app + proxy IPTV + API perso (zéro dépendance)
│   ├── store.js             # Magasin JSON persistant (écritures atomiques)
│   ├── sync.js              # Synchronisation entre appareils
│   ├── vehicle.js           # Données du véhicule (voir docs/VEHICULE.md)
│   └── *.test.mjs           # Tests : proxy, synchronisation, véhicule
├── public/                  # Fichiers statiques (dont iptv-player.html)
│   ├── sw.js                # Service worker de la PWA
│   ├── manifest.webmanifest # Manifeste PWA
│   ├── fonts/               # Police Urbanist (servie localement, pas de CDN)
│   ├── icons/pwa/           # Icônes d'installation
│   └── icons/services/      # Logos des services (générés, voir docs/LOGOS.md)
├── src/
│   ├── components/          # Composants React (favorites, locale, settings, vehicle…)
│   ├── context/             # React Context (Favorites, Locale, Theme, Sync)
│   ├── types/               # Types partagés (FavoriteItem…)
│   ├── utils/               # Filtrage par région, moteur de synchronisation, API serveur
│   ├── data/                # platforms.ts (200 services), regionsMetadata.ts (20 régions)
│   ├── hooks/               # Hooks (favoris intelligents, état du véhicule)
│   ├── pages/               # Pages de l'application
│   ├── App.tsx
│   └── main.tsx
├── scripts/                 # Génération des icônes et des logos, post-build, tests PWA
├── docs/                    # Documentation des systèmes (régions, logos, sync, véhicule)
├── Dockerfile               # Image tout-en-un pour l'auto-hébergement
├── docker-compose.yml       # Déploiement depuis l'image publiée (le plus simple)
├── docker-compose.build.yml # Déploiement en compilant depuis les sources
├── DEPLOY-NAS-UGREEN.md     # Guide de déploiement sur NAS UGREEN
├── README.md                # Ce fichier
├── package.json
├── vite.config.ts
└── tailwind.config.js
```

---

## 📖 Documentation

| Document | Contenu |
|---|---|
| **[DEPLOY-NAS-UGREEN.md](DEPLOY-NAS-UGREEN.md)** | Déploiement auto-hébergé pas à pas (NAS UGREEN, Docker), variables d'environnement, modèle de sécurité du proxy, dépannage |
| [docs/REGIONS.md](docs/REGIONS.md) | Régions et langues : détection, filtrage des services, sélecteur, limites connues |
| [docs/LOGOS.md](docs/LOGOS.md) | Logos des services : génération, sources, ajout d'un service |
| [docs/SYNCHRONISATION.md](docs/SYNCHRONISATION.md) | Synchronisation entre appareils : activation, protocole, sécurité |
| [docs/VEHICULE.md](docs/VEHICULE.md) | Données du véhicule : état réel de l'API XPENG, configuration, dépannage |
| [.env.example](.env.example) | Toutes les variables d'environnement du serveur, commentées |

> Les guides de déploiement de proxies cloud (Vercel, Netlify, Cloudflare Workers)
> ainsi que les notes de conception et de débogage antérieures ont été **supprimés
> en v2.5.1** : ils décrivaient une architecture retirée en v2.2. Ils restent
> consultables dans l'historique git.

---

## 🗺️ Roadmap

### ✅ Livré

| Version | Contenu |
|---|---|
| **2.1** | 200 services, régionalisation dynamique, groupes régionaux, suggestions par proximité, changement de langue instantané |
| **2.2** | Auto-hébergement : serveur + proxy IPTV same-origin, suppression de tous les backends cloud tiers |
| **2.3** | PWA installable, mode hors ligne |
| **2.4** | Logos embarqués pour les 200 services (plus aucun CDN tiers), sections et badges du sélecteur de région |
| **2.5** | Synchronisation entre appareils sur votre propre serveur ; données du véhicule (⚠️ XPENG ne publie aucune API publique — voir [docs/VEHICULE.md](docs/VEHICULE.md)) |
| **2.5.1** | Ménage du dépôt : documentation périmée supprimée, listes de régions dédupliquées, dépendances inutilisées retirées |

### 🚀 Pistes

- [ ] Commandes vocales
- [ ] Widgets personnalisables
- [ ] Mode multi-utilisateurs
- [ ] Compléter les 10 langues partiellement traduites ([docs/REGIONS.md](docs/REGIONS.md#langues))
- [ ] Rendre les régions européennes réellement distinctes ([limite connue](docs/REGIONS.md#️-limite-connue--les-régions-européennes-sont-équivalentes))

---

## 📝 Changelog

### **v2.5.1** — 2026-08-20 🧹 Attribution, ménage et documentation

#### ✏️ Attribution
- Pied de page et écran **À propos** : le projet est désormais crédité à **[@PPierre89](https://github.com/PPierre89)**, avec le dépôt `PPierre89/xpengmedia` comme source
- Liens **Support** (cagnotte) et **Discord FR** retirés du pied de page

#### 🧹 Ménage
- **Numéro de version unifié** : `package.json` est la seule source, injectée dans l'app à la compilation. L'écran « À propos » affichait `1.0.0`, le README `2.1.0` et `package.json` `0.0.0`
- **Liste des régions dédupliquée** : les 20 régions étaient déclarées deux fois (nom, drapeau, langue) dans `LocaleContext.tsx` **et** `regionsMetadata.ts`. `regionsMetadata.ts` devient la source unique, dont `LocaleContext` dérive sa liste. Les deux listes étaient identiques, mais rien ne le garantissait
- **4 dépendances retirées** car inutilisées : `@tailwindcss/typography` (aucune classe `prose`), `@tailwindcss/aspect-ratio` (intégré à Tailwind), `@tailwindcss/line-clamp` (intégré depuis Tailwind 3.3), `tailwindcss-animate` (aucune classe `animate-in`). `@tailwindcss/forms` est conservé : il restyle globalement les champs de saisie

#### 📖 Documentation
- **[docs/REGIONS.md](docs/REGIONS.md)** remplace `LOCALE_SYSTEM.md` et `REGIONAL_SYSTEM.md` : l'un décrivait le code par numéros de ligne devenus faux et des `console.log` supprimés, l'autre était une proposition de conception déjà implémentée
- **32 documents périmés supprimés** : `docs/archive/` (27 guides de proxies Vercel/Cloudflare, architecture retirée en v2.2), `DEBUG_LOCALE.md`, `ENRICHMENT_PLAN.md`, `S3XYTHEATER_ANALYSIS.md`. L'avertissement sur les identifiants Xtream présents dans l'historique git est conservé dans [DEPLOY-NAS-UGREEN.md](DEPLOY-NAS-UGREEN.md)
- **[DEPLOY-NAS-UGREEN.md](DEPLOY-NAS-UGREEN.md)** : la table des variables ignorait `API_TOKEN`, `DATA_DIR`, `SYNC_ALLOW_SECRETS`, `VEHICLE_PROVIDER` et le volume de données, tous introduits en v2.5
- **Chiffres du README corrigés** : « 10 langues » alors qu'il y en a 12, dont seules 2 sont complètes ; « Vidéo 85+ / Musique 45+ / Jeux 35+ » au lieu de 118 / 20 / 21 ; React 18.3 et TypeScript 5.6 au lieu de 19.2 et 5.9 ; « Lucide React » qui n'est pas une dépendance ; Node 18+ alors que les tests exigent Node 22

#### 🔒 Dernier appel à un tiers supprimé
- **La police Urbanist était chargée depuis `fonts.googleapis.com`** à chaque démarrage. C'était la dernière requête vers un CDN tiers : elle contredisait la suppression des CDN de logos (v2.4) et la promesse de fonctionnement hors ligne — sans réseau, toute la typographie basculait sur la pile système. Elle est désormais servie depuis `/public/fonts` et pré-mise en cache par le service worker. Google diffusant le même fichier pour les graisses 300 à 700 (police variable), cela ne coûte que **deux fichiers, 44 Ko au total**, et le rendu est strictement identique

#### 🔍 Limite documentée
- Les **12 régions européennes affichent les mêmes 162 services** : tout service marqué `france`, `germany`, `uk`, `spain` ou `italy` porte aussi le scope `europe`. Les scopes nationaux n'ont donc aucun effet sur le filtrage. Rien n'a été modifié — restreindre ces services serait un choix de produit, pas une correction. Voir [docs/REGIONS.md](docs/REGIONS.md#️-limite-connue--les-régions-européennes-sont-équivalentes)

---

### **v2.5.0** — 2026-08-20 🔄 Synchronisation & données véhicule

#### 🆕 Nouvelles fonctionnalités
- **Synchronisation entre appareils** : favoris, région, thème, services masqués, statistiques d'usage et notes suivent de l'écran de la voiture au téléphone — **via votre propre serveur**, sans aucun service tiers, cohérent avec la suppression des backends cloud en v2.2. Un aller-retour, fusion dernier-écrit-gagnant clé par clé, pierres tombales pour les suppressions, fusion effectuée avant le premier rendu. Voir [docs/SYNCHRONISATION.md](docs/SYNCHRONISATION.md)
- **Données du véhicule** sur l'accueil : batterie, autonomie, état de charge, compteur et position. Les identifiants du compte constructeur vivent côté serveur en écriture seule (0600) et ne touchent jamais le navigateur. Provider `demo` pour essayer sans voiture. Voir [docs/VEHICULE.md](docs/VEHICULE.md)
- **Stockage persistant** côté serveur (`server/store.js`) : écritures atomiques, mises à jour sérialisées, toujours sans aucune dépendance npm

#### ⚠️ Limite assumée : l'API XPENG
XPENG **ne publie aucune API publique** (vérifié en août 2026) : portail géo-restreint et fermé par compte, aucune documentation. Toutes les intégrations existantes (Home Assistant, Homey, ABRP, evcc) passent par Enode, et XPENG annonce une API directe « dans les prochains mois » depuis plusieurs mois.

Les endpoints ne sont donc **pas inventés dans le code**. Toute la chaîne est livrée et testée — coffre à identifiants, connexion, jeton, rafraîchissement sur 401, cache, mappage des champs, interface — et le dialogue avec XPENG tient en quatre variables d'environnement à renseigner depuis une capture de votre propre application. Le jour où l'API sort, rien à réécrire.

#### 🔒 Sécurité
- `API_TOKEN` protège `/api/sync` et `/api/vehicle` ; sans lui, les deux API sont **désactivées** — la position du véhicule et les favoris ne sont jamais en accès libre
- Comparaison du jeton à temps constant
- Liste blanche de clés synchronisables : `iptvConfig` (identifiants IPTV en clair) est **exclu par défaut**, activable par `SYNC_ALLOW_SECRETS`
- Les identifiants véhicule sont en écriture seule : posables, remplaçables, effaçables — jamais relisibles, jamais journalisés
- `/healthz` annonce les capacités sans authentification et sans divulguer de secret

#### 🐛 Corrections
- **`.env.example`** décrivait encore une configuration Firebase, backend retiré en v2.2 : remplacé par les vraies variables du serveur auto-hébergé
- **Bouton « Se connecter » mort** dans les Paramètres (« synchronisez vos préférences sur tous vos appareils ») : il ne faisait rien depuis toujours, il configure maintenant réellement la synchronisation
- **Volume de données** ajouté aux deux fichiers compose et au Dockerfile : sans lui, tout état serveur serait perdu à chaque redémarrage du conteneur


### **v2.4.0** — 2026-08-19 🎨 Logos embarqués & sélecteur de région

#### 🆕 Nouvelles fonctionnalités
- **Logos réels pour les 200 services, embarqués dans l'application** : plus aucun appel à un CDN tiers, donc des vignettes qui s'affichent hors ligne et au démarrage dans la voiture. Marques officielles issues de Simple Icons quand elles existent, logotypes aux couleurs de la marque pour les diffuseurs européens, pictogrammes pour les outils XPENG embarqués
- **Génération scriptée et vérifiable** : `npm run logos` régénère tout et met à jour `platforms.ts`, `npm run logos:check` échoue si le dépôt n'est plus à jour ou si un service n'a pas de logo déclaré
- **Sections dans le sélecteur de région** : Global, Suggérés (région courante et ses voisins), Autres
- **Badges par région** : nombre de services du catalogue réellement disponibles dans chaque pays, dans le menu et sur le bouton

#### 🐛 Corrections
- **35 logos cassés** : autant de slugs `cdn.simpleicons.org` ne correspondaient plus à aucune icône et renvoyaient une 404 (Hulu, ESPN+, Xbox Cloud, BBC iPlayer, ChargePoint, TuneIn…)
- **Repli d'icône** : un logo manquant affiche désormais le monogramme du service au lieu d'un emoji 📱 injecté en `innerHTML`
- **Journalisation** : le filtrage par région ne trace plus chaque service dans la console à chaque rendu

#### 📚 Documentation
- **docs/LOGOS.md** : nouveau document de référence ; les trois guides logos basés sur des CDN tiers partent dans `docs/archive/`

#### 🧹 Nettoyage
- **26 scripts one-shot** supprimés à la racine (`fix-ALL-*.cjs`, `replace-*.cjs`, `audit-*.cjs`…) ainsi que leurs rapports JSON : ils réécrivaient `platforms.ts` avec les anciennes URL de CDN et auraient annulé les logos embarqués si on les relançait
- **Un seul contexte de favoris** : `FavoritesContext` et `EnhancedFavoritesContext` écrivaient tous les deux la clé `localStorage` « favorites » avec des formes incompatibles, chacun avec ses propres favoris par défaut. Le contexte enrichi est désormais le seul monté, et les favoris de l'ancien format sont migrés au chargement au lieu d'être écrasés
- **Page « Mes favoris » branchée** : la page, sa grille, son formulaire et son contexte existaient mais n'étaient reliés à rien (aucune route, aucun provider monté, aucun lien) — route `/favorites` et entrées de navigation ajoutées
- **Plus aucun fichier mort dans `src/`** (38/38 atteignables depuis `main.tsx`) : suppression de `App.css`, des assets inutilisés, de `FloatingActionButton`, de l'ancien `FavoritesContext` et de l'ancienne `FavoritesGrid`
- **Exports morts retirés** : `getOrderedRegions`, `getRegionsByGroup`, `countPlatformsByCategory` et `getSuggestedRegionsForUser` (ce dernier dupliquait `getSuggestedRegions`)
- **Traces de debug** : les 7 `console.log` du contexte de langue disparaissent (les avertissements et erreurs utiles restent)
- **`npm run lint` passe** : dernier `no-explicit-any` corrigé dans `normalizeLocale`
- **Statistiques du README** corrigées : le catalogue compte 200 services, pas 214

#### 🐛 Corrections
- **Formulaire de favori** : le champ URL était en `type="url"`, donc la validation native du navigateur refusait « netflix.com » avant même que le code — qui préfixe pourtant `https://` — ne s'exécute
- **localStorage corrompu** : le chargement des favoris n'était pas protégé, un `JSON.parse` en échec empêchait toute l'application de démarrer

### **v2.3.0** — 2026-08-18 📱 PWA installable

#### 🆕 Nouvelles fonctionnalités
- **Application installable** : manifeste, icônes (dont maskable et iOS) générées sans dépendance, raccourcis vers le player IPTV et le catalogue
- **Service worker** : interface disponible hors ligne, démarrage instantané depuis le cache
- **Exclusions strictes** : `/api/proxy` et `/healthz` ne sont jamais interceptés, pour ne pas mettre en cache les flux vidéo ni figer la détection du proxy local
- **Mises à jour fiables** : service worker estampillé au build depuis une empreinte du contenu, servi en `no-cache`
- Tests dédiés (`npm run test:pwa`) sur la logique de routage du service worker

### **v2.2.0** — 2026-08-18 🏠 Auto-hébergement

#### 🆕 Nouvelles fonctionnalités
- **Serveur tout-en-un** (`server/server.js`, zéro dépendance npm) : sert l'application compilée **et** un proxy IPTV sur `/api/proxy`, depuis la même origine
- **Image Docker** publiée sur GHCR (`ghcr.io/ppierre89/xpengmedia`), déployable sur NAS UGREEN en un `docker compose up`
- **Détection automatique du proxy local** par le player IPTV : plus aucun proxy public à configurer quand l'app est auto-hébergée
- **Réécriture des playlists HLS** : les segments passent aussi par le proxy local, ce qui corrige les `manifestLoadError`
- **`BASE_PATH`** : chemin de base configurable (`/` par défaut, à changer seulement si un reverse proxy impose un sous-chemin)

#### 🔒 Sécurité
- Protection SSRF du proxy : réseau privé refusé par défaut, y compris sous les formes IPv6 encapsulant une IPv4 (`::ffff:`, `::a.b.c.d`, NAT64, 6to4)
- Chaque redirection est re-validée et la connexion est épinglée à l'adresse vérifiée (pas de DNS rebinding)
- Aucun contenu actif renvoyé par le proxy : type MIME sur liste blanche, `nosniff`, CSP `sandbox`
- Aucun en-tête CORS par défaut (l'application est same-origin)
- Identifiants IPTV réels retirés de la documentation

#### 🗑️ Retiré
- **Backends Vercel, Netlify et Cloudflare** : le proxy local les remplace intégralement
- **Proxies CORS publics** : plus aucun flux ni identifiant ne transite par un tiers
- **Déploiement GitHub Pages** : l'application n'est plus publiée en ligne, elle est auto-hébergée

#### 📚 Documentation
- **DEPLOY-NAS-UGREEN.md** : guide de déploiement complet
- Documentation réorganisée : `docs/` pour les systèmes, `docs/archive/` pour l'historique périmé

### **v2.1.0** - 2025-01-12 ✨ Régionalisation & Logos

#### 🆕 Nouvelles fonctionnalités
- **Système de régionalisation dynamique** : Métadonnées complètes pour 20 régions
- **Groupes régionaux** : 5 groupes (Europe Ouest, Nord, Scandinave, Anglophone, Asie, Moyen-Orient)
- **Suggestions intelligentes** : Basées sur voisins géographiques et linguistiques
- **Support logos réels** : PlatformIcon accepte URLs + emojis
- **RTL Play Belgique** : Ajout service belge
- **Changement langue instantané** : Plus besoin de rafraîchir

#### 🔧 Corrections
- **Uniformisation complète** : Toutes les cards même taille (Favoris, Catégories)
- **Séparation Chine** : Global exclut maintenant china et asia
- **Icônes homogènes** : Taille, padding, gap uniformes partout

#### 📚 Documentation
- **REGIONAL_SYSTEM.md** : Guide complet système régional (695 lignes)
- **LOGOS_GUIDE.md** : Guide remplacement emojis par logos
- **README mis à jour** : Listes complètes services, pays, langues

---

### **v2.0.0** - 2025-01-11 ✨ Version majeure

#### 🆕 Nouvelles fonctionnalités
- **Système d'icônes uniforme** : PlatformIcon avec gradients
- **Mode paysage optimisé** : 8 colonnes, navbar compacte
- **7 nouvelles langues** : IT, NL, SV, NO, DA, AR, HE
- **Services chinois** : Youku, Douyin, Mango TV, WeChat, Weibo, DingTalk
- **Services anime** : HIDIVE, Wakanim

#### 🔧 Corrections
- **Free TV+ remplace Oqee**
- **3 doublons supprimés**
- **9 URLs nettoyées**

---

## 🤝 Contribution

Les contributions sont les bienvenues ! 

### **Ajouter un service**
1. Modifiez `src/data/platforms.ts`
2. Suivez la structure existante
3. Créez une Pull Request

### **Signaler un bug**
- [Créer une issue](https://github.com/PPierre89/xpengmedia/issues)

---

## 📄 Licence

Ce projet est sous licence **MIT**, héritée du dépôt d'origine.

> ⚠️ Le dépôt **ne contient pas encore de fichier `LICENSE`**. La licence MIT
> impose de conserver l'avis de copyright d'origine : le fichier reste à ajouter,
> avec la ligne de copyright de [@dlnraja](https://github.com/dlnraja) puis la
> vôtre. Ajouter ce fichier est une déclaration juridique, elle vous revient.

Ressources embarquées et leurs licences :

| Ressource | Licence |
|---|---|
| Marques officielles ([Simple Icons](https://github.com/simple-icons/simple-icons)) | CC0 1.0 |
| Pictogrammes ([Heroicons](https://heroicons.com)) | MIT |
| Police [Urbanist](https://github.com/coreyhu/Urbanist) | SIL OFL 1.1 |

Les logos et marques des services cités restent la propriété de leurs
détenteurs respectifs et ne sont utilisés que pour les identifier.

---

## 👨‍💻 Auteurs

**[@PPierre89](https://github.com/PPierre89)**
- Dépôt : [PPierre89/xpengmedia](https://github.com/PPierre89/xpengmedia)
- Image : `ghcr.io/ppierre89/xpengmedia`
- Auto-hébergement Docker/NAS avec proxy IPTV local et durcissement de sécurité,
  logos embarqués, PWA, synchronisation entre appareils, données du véhicule

Le projet est parti d'un fork de [@dlnraja/xpengmedia](https://github.com/dlnraja/xpengmedia),
sous licence MIT.

---

## 🙏 Remerciements

- **XPENG Motors** pour l'inspiration du design XOS
- **React Team** pour l'excellente bibliothèque
- **Communauté open-source** pour les outils

---

<div align="center">

### ⭐ Si ce projet vous plaît, n'hésitez pas à le star ! ⭐

**Fait avec 💙 pour les conducteurs XPENG 🚗**

[![GitHub stars](https://img.shields.io/github/stars/PPierre89/xpengmedia?style=social)](https://github.com/PPierre89/xpengmedia/stargazers)

[⬆ Retour en haut](#-xpeng-media-hub-)

</div>

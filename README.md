<div align="center">

# 🚗 XPENG Media Hub 💙

### *Le centre multimédia intelligent pour votre XPENG*

[![Auto-hébergement](https://img.shields.io/badge/🏠_Auto--hébergé-Docker_/_NAS-2496ED?style=for-the-badge&logo=docker&logoColor=white)](DEPLOY-NAS-UGREEN.md)
[![Image](https://img.shields.io/badge/ghcr.io-xpengmedia-181717?style=for-the-badge&logo=github&logoColor=white)](https://github.com/PPierre89/xpengmedia/pkgs/container/xpengmedia)
[![React](https://img.shields.io/badge/React-18.3-61DAFB?style=for-the-badge&logo=react)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.6-3178C6?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-38B2AC?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com/)

**[🏠 Déployer sur ton NAS](DEPLOY-NAS-UGREEN.md)** • **[📖 Documentation](#-documentation)** • **[🐛 Signaler un bug](https://github.com/PPierre89/xpengmedia/issues)**

---

### 200 services • 10 langues • 20 régions • Mode clair/sombre • 100% responsive

![XPENG Media Hub](https://img.shields.io/badge/Status-Production-brightgreen?style=flat-square)
![Version](https://img.shields.io/badge/Version-2.1.0-blue?style=flat-square)
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
- **10 langues** complètes avec traduction automatique
- **Détection automatique** de la langue et région du navigateur
- **Filtrage intelligent** : Seuls les services disponibles dans votre région
- **Suggestions de régions** basées sur la proximité géographique

### 📺 **200 services organisés**
- **🎬 Vidéo** : 85+ services (Netflix, Disney+, Prime Video...)
- **🎵 Musique** : 45+ services (Spotify, Apple Music, Deezer...)
- **🎮 Jeux** : 35+ services (Steam, GeForce NOW, Xbox Cloud...)
- **🔋 Recharge** : 20+ services (ABRP, Chargemap, Tesla Supercharger...)
- **🌐 Services web** : 25+ services (Gmail, Drive, WeChat...)

### 🎨 **Design XPENG**
- **Thème clair/sombre** avec transition fluide
- **Gradients cyan/blue** signature XPENG
- **Icônes uniformes** avec design cohérent
- **Animations fluides** avec Framer Motion
- **Mode paysage optimisé** pour écran automobile

### 📱 **PWA installable**
- Installation sur l'écran d'accueil, démarrage plein écran
- Interface disponible hors ligne, chargement instantané depuis le cache
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
- **Services** : 150+ services universels
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

### 10 langues • Traduction complète de l'interface • Détection automatique

</div>

| Langue | Code | Région(s) principale(s) | Statut |
|--------|------|-------------------------|--------|
| **Anglais** | EN | 🌍 Global, 🇬🇧 UK, 🇺🇸 USA, 🇦🇺 AU, 🇸🇬 SG | ✅ Complète |
| **Français** | FR | 🇫🇷 France, 🇧🇪 Belgique, 🇨🇭 Suisse | ✅ Complète |
| **Allemand** | DE | 🇩🇪 Allemagne, 🇦🇹 Autriche, 🇨🇭 Suisse | ✅ Complète |
| **Espagnol** | ES | 🇪🇸 Espagne | ✅ Complète |
| **Italien** | IT | 🇮🇹 Italie, 🇨🇭 Suisse | ✅ Complète |
| **Néerlandais** | NL | 🇳🇱 Pays-Bas, 🇧🇪 Belgique | ✅ Complète |
| **Suédois** | SV | 🇸🇪 Suède | ✅ Complète |
| **Norvégien** | NO | 🇳🇴 Norvège | ✅ Complète |
| **Danois** | DA | 🇩🇰 Danemark | ✅ Complète |
| **Chinois** | ZH | 🇨🇳 Chine, 🇸🇬 Singapour | ✅ Complète |
| **Arabe** | AR | 🇦🇪 UAE, 🇶🇦 Qatar, 🇮🇱 Israël | ✅ Complète |
| **Hébreu** | HE | 🇮🇱 Israël | ✅ Complète |

### Traductions disponibles

- 🏠 Navigation : Accueil, Vidéos, Musique, Jeux
- 🔍 Interface : Recherche, Filtres, Sélection région
- ⭐ Favoris : Gestion, Ajout, Suppression
- 🎨 Thème : Mode clair/sombre
- 📝 Descriptions : Titres, sous-titres, catégories

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
- **React 18.3** - Bibliothèque UI moderne
- **TypeScript 5.6** - Typage statique
- **Vite 7.0** - Build tool ultra-rapide
- **Tailwind CSS 3.4** - Styling utility-first

### **Libraries**
- **Framer Motion** - Animations fluides
- **React Router 7.0** - Navigation SPA
- **Heroicons** - Icônes SVG
- **Lucide React** - Icônes complémentaires

### **Outils**
- **ESLint** - Linting code
- **PostCSS** - Transformation CSS
- **Docker** - Image d'auto-hébergement publiée sur GHCR

---

## 🚀 Installation et développement

### **Prérequis**
- Node.js 18+ 
- npm ou yarn
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
│   ├── server.js            # Serveur tout-en-un : app + proxy IPTV (zéro dépendance)
│   └── security.test.mjs    # Tests des protections du proxy
├── public/                  # Fichiers statiques (dont iptv-player.html)
│   ├── sw.js                # Service worker de la PWA
│   ├── manifest.webmanifest # Manifeste PWA
│   ├── icons/pwa/           # Icônes d'installation
│   └── icons/services/      # Logos des services (générés, voir docs/LOGOS.md)
├── src/
│   ├── components/          # Composants React (favorites, icons, locale, modals…)
│   ├── context/             # React Context (Favorites, Locale, Theme)
│   ├── types/               # Types partagés (FavoriteItem…)
│   ├── utils/               # Filtrage et comptage par région
│   ├── data/                # platforms.ts (200 services), regionsMetadata.ts
│   ├── hooks/               # Custom hooks
│   ├── pages/               # Pages de l'application
│   ├── App.tsx
│   └── main.tsx
├── scripts/                 # Génération des icônes et des logos, post-build, tests PWA
├── docs/                    # Documentation des systèmes (régions, langues, logos)
│   └── archive/             # Documentation historique — ne plus suivre
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
| [docs/REGIONAL_SYSTEM.md](docs/REGIONAL_SYSTEM.md) | Système de régionalisation dynamique |
| [docs/LOCALE_SYSTEM.md](docs/LOCALE_SYSTEM.md) | Système de localisation et de traduction |
| [docs/LOGOS.md](docs/LOGOS.md) | Logos des services : génération, sources, ajout d'un service |
| [docs/DEBUG_LOCALE.md](docs/DEBUG_LOCALE.md) | Notes de débogage du changement de langue |
| [docs/ENRICHMENT_PLAN.md](docs/ENRICHMENT_PLAN.md) • [docs/S3XYTHEATER_ANALYSIS.md](docs/S3XYTHEATER_ANALYSIS.md) | Analyses et pistes d'enrichissement du catalogue |
| [docs/archive/](docs/archive/) | 📦 Documentation historique (proxies cloud Vercel/Netlify/Cloudflare, anciens guides logos basés sur des CDN tiers). **Périmée** |

---

## 🗺️ Roadmap

### ✅ Version 2.1 (Actuelle)
- [x] 200 services disponibles
- [x] 10 langues complètes
- [x] Système de régionalisation dynamique
- [x] Groupes régionaux intelligents
- [x] Suggestions de régions basées sur proximité
- [x] Support logos réels (URLs + emojis)
- [x] Changement langue instantané

### ✅ Version 2.4
- [x] Intégration logos réels pour tous les services (embarqués, hors ligne)
- [x] Sections dans LocaleSelector (Global, Suggérés, Autres)
- [x] Badges nombre de services par région
- [x] PWA (Progressive Web App)
- [x] Mode hors-ligne

### 🚀 Version 3.0 (Futur)
- [ ] Intégration API XPENG
- [ ] Commandes vocales
- [ ] Widgets personnalisables
- [ ] Mode multi-utilisateurs
- [ ] Synchronisation cloud

---

## 📝 Changelog

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

Ce projet est sous licence **MIT**.

---

## 👨‍💻 Auteurs

**Projet d'origine — [@dlnraja](https://github.com/dlnraja)**
- Dépôt amont : [dlnraja/xpengmedia](https://github.com/dlnraja/xpengmedia)

**Ce fork — [@PPierre89](https://github.com/PPierre89)**
- Dépôt : [PPierre89/xpengmedia](https://github.com/PPierre89/xpengmedia)
- Ajouts : auto-hébergement Docker/NAS avec proxy IPTV local, durcissement de sécurité du proxy
- Déploiement : auto-hébergé, image `ghcr.io/ppierre89/xpengmedia`

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

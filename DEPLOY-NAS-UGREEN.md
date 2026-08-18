# 🏠 Déployer XPENG Media Hub sur un NAS UGREEN (DXP4800 Plus)

Objectif : **une seule commande / un seul copier-coller**, et l'app tourne 24h/24
sur ton NAS, avec le proxy IPTV intégré (fini les proxies publics et les erreurs CORS).

- 🌐 App : `http://IP-DE-TON-NAS:8080`
- 📺 Player IPTV : `http://IP-DE-TON-NAS:8080/iptv-player.html`
- ❤️ État du service : `http://IP-DE-TON-NAS:8080/healthz`

---

## ⚡ Méthode 1 — Interface UGOS Pro (la plus simple, ~2 minutes)

Le DXP4800 Plus tourne sous **UGOS Pro**, qui embarque Docker avec la gestion de projets Compose.

1. Ouvre **UGOS Pro** dans ton navigateur → **App Center** → installe **Docker** (si ce n'est pas déjà fait).
2. Ouvre **Docker** → onglet **Projet** (*Project*) → **Créer** (*Create*).
3. **Nom du projet** : `xpengmedia`
4. **Chemin** : choisis un dossier, par ex. `/volume1/docker/xpengmedia`
5. **Source** : choisis **Créer un fichier** (*Create docker-compose.yml*) et colle ceci :

```yaml
services:
  xpengmedia:
    image: ghcr.io/ppierre89/xpengmedia:latest
    container_name: xpengmedia
    restart: unless-stopped
    ports:
      - "8080:8080"
    environment:
      TZ: Europe/Paris
      PROXY_ALLOW_PRIVATE: "false"
      PROXY_USER_AGENT: "VLC/3.0.20 LibVLC/3.0.20"
```

6. Clique sur **Terminé / Lancer**. UGOS télécharge l'image et démarre le conteneur.
7. Ouvre `http://IP-DE-TON-NAS:8080` 🎉

> 💡 Le port `8080` est parfois déjà utilisé sur un NAS. Si le conteneur ne démarre pas,
> remplace `"8080:8080"` par `"8090:8080"` et utilise `http://IP-DE-TON-NAS:8090`.

---

## 🖥️ Méthode 2 — En SSH (une seule commande)

Active SSH dans UGOS Pro (**Paramètres → Terminal → SSH**), connecte-toi, puis :

```bash
mkdir -p /volume1/docker/xpengmedia && cd /volume1/docker/xpengmedia
curl -fsSL https://raw.githubusercontent.com/PPierre89/xpengmedia/main/docker-compose.yml -o docker-compose.yml
docker compose up -d
```

C'est tout. Pour mettre à jour plus tard :

```bash
cd /volume1/docker/xpengmedia && docker compose pull && docker compose up -d
```

---

## 🔨 Méthode 3 — Construire depuis les sources

Utile si tu as modifié le code, ou si l'image publiée n'est pas accessible.

```bash
git clone https://github.com/PPierre89/xpengmedia.git
cd xpengmedia
docker compose -f docker-compose.build.yml up -d
```

La compilation prend quelques minutes sur le processeur du NAS (Intel Pentium Gold 8505), c'est normal.

---

## ⚙️ Options de configuration

Toutes optionnelles — l'app fonctionne sans y toucher.

| Variable | Défaut | À quoi ça sert |
|---|---|---|
| `PORT` | `8080` | Port d'écoute **dans** le conteneur (ne change pas, mappe plutôt le port côté hôte) |
| `TZ` | `Europe/Paris` | Fuseau horaire |
| `PROXY_ALLOW_PRIVATE` | `false` | Mets `true` **uniquement** si ton serveur IPTV / ta playlist M3U est sur ton réseau local. Par défaut, le proxy refuse les adresses privées (protection SSRF : personne ne peut se servir du NAS pour scanner ton réseau). |
| `PROXY_USER_AGENT` | `VLC/3.0.20 LibVLC/3.0.20` | Certains serveurs Xtream ne répondent qu'aux vrais lecteurs. Change-le si ton fournisseur en impose un autre. |
| `PROXY_TIMEOUT_MS` | `20000` | Délai d'inactivité max d'une requête vers le serveur distant |
| `PROXY_MAX_REDIRECTS` | `5` | Redirections suivies au maximum (chacune est re-vérifiée) |
| `ALLOWED_ORIGINS` | *(vide)* | Origines autorisées en CORS, séparées par des virgules. Vide = aucun en-tête CORS, ce qui est le bon réglage : l'app est servie par ce même serveur, donc same-origin. |
| `STATIC_DIR` | `/app/dist` | Dossier des fichiers de l'app |

Exemple, playlist hébergée sur le NAS lui-même :

```yaml
    environment:
      PROXY_ALLOW_PRIVATE: "true"
```

---

## 📺 Pourquoi c'est mieux que la version en ligne

Le player IPTV détecte **tout seul** qu'il tourne sur ton NAS (via `/healthz`) et bascule
sur le proxy local. Concrètement :

| | GitHub Pages | Auto-hébergé sur le NAS |
|---|---|---|
| Proxy CORS | proxies publics (corsproxy.io, codetabs…) | ton NAS, même origine |
| Quotas / limites | oui, variables | aucune |
| Vie privée | tes flux transitent par des tiers | tout reste chez toi |
| Segments HLS (.ts) | souvent bloqués | réécrits et relayés automatiquement |
| Vitesse | dépend du proxy public | débit de ton NAS |
| Configuration | coller des URLs de proxy dans le code | **rien à faire** |

Aucune configuration manuelle : si `/healthz` répond, le proxy local est utilisé en
priorité 0 ; sinon le player retombe sur son comportement habituel.

---

## 🌍 Y accéder depuis la voiture (hors du domicile)

Trois options, de la plus simple à la plus robuste :

1. **Tailscale / ZeroTier** (recommandé) — installe le paquet sur le NAS, puis sur ton
   téléphone/voiture. L'app reste privée, aucune ouverture de port sur Internet.
2. **VPN du routeur** (WireGuard sur ta box) — même principe.
3. **Reverse proxy + nom de domaine** — si tu exposes le service sur Internet, mets-le
   **obligatoirement** derrière HTTPS et une authentification : le proxy `/api/proxy`
   est ouvert et pourrait sinon être utilisé par n'importe qui.

> ⚠️ N'ouvre pas le port 8080 directement sur Internet sans authentification.

---

## 🔒 Ce que le proxy protège (et ce qu'il ne protège pas)

Le proxy `/api/proxy` a été audité et durci. Ce qu'il applique :

- **Réseau privé refusé par défaut.** Les adresses locales sont bloquées, y compris sous leurs
  formes IPv6 déguisées (`::ffff:c0a8:101`, `::192.168.1.1`, NAT64, 6to4) — un site web ne peut
  donc pas se servir du NAS pour lire ton routeur. Passe `PROXY_ALLOW_PRIVATE=true` seulement si
  ton serveur IPTV est réellement sur ton LAN.
- **Chaque redirection est re-vérifiée.** Un serveur distant ne peut pas rediriger le proxy vers
  ton réseau local ou vers un autre protocole.
- **La connexion est épinglée à l'adresse vérifiée**, ce qui empêche un nom de domaine de basculer
  vers une IP locale entre la vérification et la connexion (DNS rebinding).
- **Aucun contenu actif n'est renvoyé.** Le HTML ou le SVG d'un serveur distant est déclassé en
  fichier binaire inerte : il ne peut pas s'exécuter sur l'origine de l'app, donc pas d'accès à
  tes identifiants IPTV stockés par le navigateur.
- **Aucun en-tête CORS par défaut**, donc aucun autre site ne peut lire les réponses du proxy.

Ce qu'il ne fait **pas** : il n'y a **aucune authentification**. Toute personne ayant accès au
réseau où tourne le NAS peut utiliser le proxy. C'est acceptable sur un LAN domestique, ça ne
l'est pas sur Internet — d'où l'avertissement ci-dessus.

Les protections sont couvertes par des tests :

```bash
npm run test:security
```

---

## 🩺 Dépannage

**Le conteneur ne démarre pas / port occupé**
```bash
docker compose logs -f xpengmedia
```
Change le port hôte (`"8090:8080"`) si le 8080 est déjà pris par UGOS.

**La page est blanche**
Vide le cache du navigateur (Ctrl+Maj+R). L'`index.html` est servi en `no-cache`,
mais un ancien service worker/cache navigateur peut persister.

**Le player IPTV n'utilise pas le proxy local**
Ouvre la console de debug du player : tu dois voir `🏠 Proxy local détecté`.
Sinon, vérifie que `http://IP-DE-TON-NAS:8080/healthz` renvoie bien `{"status":"ok", ...}`.

**Erreur « Cible sur le réseau privé refusée »**
Ton serveur IPTV est sur ton LAN : passe `PROXY_ALLOW_PRIVATE` à `"true"`, puis
`docker compose up -d`.

**Vérifier le proxy à la main**
```bash
curl "http://IP-DE-TON-NAS:8080/api/proxy?url=https://example.com"
```

---

## 💻 Sans Docker (test en local)

```bash
npm ci --legacy-peer-deps
npm run serve      # compile puis démarre sur http://localhost:8080
```

Le serveur (`server/server.js`) n'a **aucune dépendance npm** : Node.js 18+ suffit.

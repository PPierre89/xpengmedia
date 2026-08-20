# 🚗 Données du véhicule

Affiche la batterie, l'autonomie, l'état de charge, le compteur et la position
sur l'accueil de l'application.

---

## ⚠️ À lire avant tout : l'état réel de l'API XPENG

**XPENG ne publie aucune API publique.** Vérifié en août 2026 :

- le portail `open.xiaopeng.com` est géo-restreint et fermé par compte ; aucune
  documentation, spécification ni SDK n'est accessible ;
- **toutes** les intégrations qui fonctionnent aujourd'hui — Home Assistant,
  l'app Homey « XPENG Car Manager », ABRP, evcc — passent par **Enode**, un
  agrégateur avec qui XPENG a monté une API officielle soumise au consentement
  du propriétaire ;
- interrogé via une demande d'accès au titre du EU Data Act, XPENG répond qu'un
  « mécanisme d'API directe temps réel est en cours de développement et sera
  disponible dans les prochains mois » — la même formulation revient depuis
  plusieurs mois sans livraison.

**Conséquence directe pour ce dépôt :** les endpoints du compte XPENG, leur
format d'authentification et l'éventuelle signature des requêtes ne sont pas
connus publiquement. Ils ne sont donc **pas écrits en dur dans le code** :
inventer des URLs produirait un module qui *ressemble* à une intégration sans
en être une, et qui échouerait silencieusement chez vous.

Ce qui est livré, en revanche, est complet :

| Brique | État |
|---|---|
| Coffre à identifiants côté serveur (écriture seule, 0600) | ✅ |
| Connexion, extraction du jeton, rafraîchissement sur 401 | ✅ |
| Cache, déduplication des appels simultanés, plafond de temps et de taille | ✅ |
| Normalisation des champs, garde-fous sur les valeurs aberrantes | ✅ |
| Interface : carte d'accueil + écran de réglages | ✅ |
| **Les 4 valeurs qui décrivent le dialogue avec XPENG** | ⬜ à renseigner |

Autrement dit : il manque de la configuration, pas du code.

---

## Essayer sans voiture

```yaml
environment:
  API_TOKEN: "un-jeton-solide"    # openssl rand -base64 32
  VEHICLE_PROVIDER: "demo"
```

Le provider `demo` produit un état simulé cohérent (batterie qui descend puis
remonte à la charge). Utile pour voir l'interface et vérifier que le jeton est
bien configuré.

---

## Brancher le compte constructeur

### 1. Récupérer les endpoints

Ils décrivent le dialogue entre l'application mobile XPENG et ses serveurs. Sur
**votre** compte et **votre** véhicule, vous pouvez les observer avec un proxy
HTTPS (mitmproxy, Charles, Proxyman) : lancez la capture, ouvrez l'app XPENG,
consultez l'état du véhicule, et relevez :

- l'URL de connexion et la forme du corps envoyé ;
- où se trouve le jeton dans la réponse ;
- l'URL qui renvoie l'état du véhicule, et l'en-tête qui porte le jeton ;
- le chemin de chaque champ intéressant dans la réponse.

> Cette API n'est pas documentée : elle peut changer sans préavis du côté de
> XPENG, et son usage sort du cadre prévu par les conditions d'utilisation de
> l'application. C'est un choix qui vous appartient.

### 2. Les reporter dans l'environnement

| Variable | Rôle | Défaut |
|---|---|---|
| `VEHICLE_PROVIDER` | `xpeng` pour activer ce provider | `off` |
| `XPENG_API_BASE` | Racine de l'API | — (obligatoire) |
| `XPENG_LOGIN_PATH` | Chemin de connexion (POST) | `/auth/login` |
| `XPENG_LOGIN_BODY` | Corps JSON, avec `{{account}}` et `{{password}}` | `{"account":"{{account}}","password":"{{password}}"}` |
| `XPENG_TOKEN_FIELD` | Chemin pointé du jeton dans la réponse | `data.token` |
| `XPENG_STATUS_PATH` | Chemin de l'état du véhicule | `/vehicle/status` |
| `XPENG_AUTH_HEADER` | En-tête portant le jeton, avec `{{token}}` | `Authorization: Bearer {{token}}` |
| `XPENG_TOKEN_TTL_MS` | Durée avant reconnexion préventive | `1800000` |
| `VEHICLE_POLL_MS` | Fraîcheur du cache : en deçà, l'état est resservi sans rappeler l'API | `60000` |
| `XPENG_FIELD_MAP` | JSON : champ normalisé → chemin pointé | voir ci-dessous |

Exemple de mappage, si l'API renvoie `{"data":{"soc":73,"range":380,...}}` :

```json
{
  "batteryPercent": "data.soc",
  "rangeKm": "data.range",
  "charging": "data.chargeState",
  "plugged": "data.plugged",
  "odometerKm": "data.mileage",
  "latitude": "data.position.lat",
  "longitude": "data.position.lng"
}
```

Les champs absents du mappage s'affichent simplement en « — ». Un pourcentage
hors de 0–100 est écarté : un mauvais mappage n'affichera jamais une batterie à
4300 %.

### 3. Saisir les identifiants

Dans l'application : **Paramètres → Mon véhicule**.

Ils partent vers **votre serveur**, jamais vers le navigateur d'un tiers.

---

## Modèle de sécurité

- Les identifiants sont **en écriture seule** : l'API permet de les poser, de
  les remplacer et de les effacer — jamais de les relire. Aucune réponse du
  serveur ne les contient, et ils ne sont jamais journalisés.
- Ils sont écrits en `0600` dans le volume de données : lisibles seulement par
  l'utilisateur du conteneur.
- Ils ne touchent **jamais** le `localStorage` ni le `state` persistant du
  navigateur. Le formulaire vide ses champs dès l'envoi.
- Le jeton obtenu auprès de l'API reste en mémoire du serveur.
- `/api/vehicle` exige `API_TOKEN` : sans lui, l'intégration est désactivée.
  La position du véhicule ne doit pas être en accès libre.
- Les réponses amont sont plafonnées (512 Ko, 15 s) et un corps d'erreur n'est
  jamais relayé tel quel : seul le code HTTP remonte, car ce corps peut
  contenir l'identifiant.

---

## Le jour où XPENG publie son API

Rien à réécrire : ce sont les mêmes quatre variables. Et si vous préférez
passer par **Enode** — la voie officielle, avec consentement explicite — le
provider s'ajoute dans `server/vehicle.js` en implémentant `fetchState()` ;
tout le reste (coffre, cache, interface, réglages) est déjà branché.

---

## Dépannage

| Symptôme | Cause probable |
|---|---|
| La carte ne s'affiche pas sur l'accueil | `API_TOKEN` absent, ou jeton non saisi dans les réglages |
| « Intégration véhicule non configurée » | `VEHICLE_PROVIDER` vaut `off` |
| « Renseignez les identifiants… » | Provider `xpeng` actif mais coffre vide |
| `jeton introuvable dans la réponse de connexion` | `XPENG_TOKEN_FIELD` ne pointe pas au bon endroit |
| `l'API véhicule a répondu 401` | Identifiants refusés, ou en-tête d'auth mal formé |
| `réponse amont illisible (JSON attendu)` | `XPENG_API_BASE` renvoie du HTML — mauvaise URL, ou portail captif |
| Tout est à « — » | Le mappage `XPENG_FIELD_MAP` ne correspond pas à la réponse |

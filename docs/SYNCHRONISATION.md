# 🔄 Synchronisation entre appareils

Vos favoris, la région, le thème, les services masqués, les statistiques
d'usage et les notes suivent d'un appareil à l'autre : écran de la voiture,
téléphone, navigateur du salon.

**Sans service tiers.** Le « cloud », ici, c'est le conteneur qui héberge déjà
l'application sur votre NAS. Aucune donnée ne transite par Vercel, Firebase,
Supabase ou qui que ce soit d'autre — cohérent avec la suppression de tous les
backends cloud en v2.2.

---

## Activer

### 1. Un jeton sur le serveur

```yaml
environment:
  API_TOKEN: "collez-ici-un-jeton-solide"
volumes:
  - xpengmedia-data:/app/data
```

```bash
openssl rand -base64 32
```

Tant qu'`API_TOKEN` est vide, `/api/sync` et `/api/vehicle` restent
**désactivés** — c'est le comportement par défaut.

> Le volume n'est pas optionnel : sans lui, les données synchronisées
> disparaissent à chaque redémarrage du conteneur.

### 2. Le même jeton sur chaque appareil

**Paramètres → Synchronisation entre appareils**, coller le jeton, valider.

Si vous ouvrez l'interface depuis un autre appareil que celui qui héberge,
renseignez aussi l'adresse du serveur (`http://nas.local:8080`). Si
l'application est servie par ce serveur, laissez le champ vide.

---

## Ce qui est synchronisé

| Clé | Contenu |
|---|---|
| `favorites`, `favoriteCategories`, `favoriteTags` | Favoris, catégories, tags |
| `hiddenPlatforms` | Services masqués de l'accueil |
| `xpeng_locale` | Région et langue |
| `theme` | Clair / sombre |
| `xpeng_usage_stats` | Statistiques alimentant les recommandations |
| `xpeng_web_notes_v2` | Notes de l'outil embarqué |

C'est une **liste blanche** : une clé qui n'y figure pas n'est jamais envoyée,
ni acceptée par le serveur.

### Ce qui ne l'est pas

`iptvConfig` contient l'URL, l'identifiant et le **mot de passe** de votre
abonnement IPTV, en clair. Il reste donc hors synchronisation par défaut.

Pour l'inclure malgré tout — le fichier de données du NAS contiendra alors ces
identifiants en clair :

```yaml
environment:
  SYNC_ALLOW_SECRETS: "true"
```

---

## Comment ça marche

**Un seul aller-retour.** Le client envoie ce qu'il a, le serveur fusionne et
renvoie l'état complet. Pas de session, pas de WebSocket.

**Détection des modifications sans instrumentation.** Des dizaines d'endroits
écrivent déjà dans `localStorage` (contextes React, outils embarqués, player
IPTV). Plutôt que d'intercepter chaque écriture, le client retient une
empreinte de chaque valeur après synchronisation : une empreinte différente au
tour suivant signifie « modifiée ici ». Aucun code existant n'a eu besoin
d'être modifié, et une écriture faite par un outil qui ignore tout de la
synchronisation est quand même détectée.

**Conflits : dernier écrit gagnant, clé par clé.** Deux appareils qui modifient
des clés différentes ne se marchent jamais dessus. Deux appareils qui modifient
*la même* clé hors ligne : le plus récent l'emporte, l'autre version est
perdue. C'est le compromis assumé — pas de fusion à trois voies pour des
préférences. À horodatage égal, le serveur gagne, pour que le résultat ne
dépende pas de l'ordre d'arrivée.

**Premier démarrage d'un appareil.** Ses clés partent avec l'horodatage 0 : si
le serveur a déjà quelque chose, c'est lui qui gagne. Un appareil fraîchement
installé n'écrase donc pas les favoris des autres avec ses valeurs par défaut.
Si le serveur est vide, la valeur locale est adoptée.

**Suppressions.** Conservées en pierre tombale 30 jours, sinon un appareil
resté hors ligne recréerait un favori supprimé ailleurs.

**Horloges.** Un horodatage client dans le futur est ramené à l'heure du
serveur : une machine mal réglée ne peut pas verrouiller une clé indéfiniment.

**Au démarrage.** La fusion a lieu **avant le premier rendu**, pour que les
contextes React lisent directement l'état partagé. Le délai est plafonné à
2,5 s : un NAS éteint ne retarde jamais l'affichage dans la voiture.

**Pendant la session.** Envoi et récupération toutes les 5 minutes, et au
retour sur l'onglet. Si le serveur apporte des changements, l'interface propose
un rechargement plutôt que de réhydrater les contextes à chaud.

---

## API

Toutes les routes exigent `Authorization: Bearer <API_TOKEN>`.

| Méthode | Route | Effet |
|---|---|---|
| `POST` | `/api/sync` | Pousse et récupère en un aller-retour |
| `GET` | `/api/sync` | Récupération seule |
| `DELETE` | `/api/sync` | Efface l'état serveur |
| `GET` | `/healthz` | Capacités du serveur — **sans authentification**, aucun secret |

Limites : 1 Mo par requête, 256 Ko par valeur, 64 clés.

---

## Sécurité

- Le jeton est comparé **à temps constant** : le temps de réponse ne permet pas
  de le deviner caractère par caractère.
- Liste blanche de clés : un client bogué ou hostile ne peut ni remplir le
  disque du NAS avec des clés arbitraires, ni faire transiter un secret par
  accident.
- Écritures **atomiques** (fichier temporaire puis `rename`) : une coupure de
  courant laisse soit l'ancien document intact, soit le nouveau complet, jamais
  un JSON tronqué.
- Les mises à jour d'un même document sont **sérialisées** : deux appareils qui
  synchronisent en même temps fusionnent l'un après l'autre au lieu de se
  perdre.
- Un document corrompu ne bloque pas le démarrage : la synchronisation repart
  du contenu des clients.
- Le jeton est stocké dans le `localStorage` du navigateur pour éviter la
  ressaisie. Sur un appareil partagé, utilisez « Désactiver » plutôt que de le
  laisser en place.

---

## Dépannage

| Symptôme | Cause probable |
|---|---|
| « Ce serveur n'a pas la synchronisation activée » | `API_TOKEN` non défini côté serveur |
| « Jeton refusé » | Le jeton saisi ne correspond pas à `API_TOKEN` |
| « le serveur ne répond pas » | Mauvaise adresse, ou conteneur arrêté |
| Les données ne suivent pas | Vérifiez que la clé est dans la liste blanche |
| Tout disparaît au redémarrage | Le volume `/app/data` n'est pas monté |
| Un appareil écrase les autres | Son horloge est très en avance — vérifiez `TZ` et l'heure système |

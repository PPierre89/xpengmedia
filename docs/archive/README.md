# 📦 Archive — documentation historique

Les documents de ce dossier décrivent l'état du projet **avant** la mise en place de
l'auto-hébergement (proxy IPTV local servi par le NAS). Ils sont conservés pour
mémoire, mais **ne suis plus leurs instructions** : elles sont périmées.

## Pourquoi ces guides sont périmés

Le player IPTV se heurtait à la politique CORS des navigateurs : servi depuis
GitHub Pages en HTTPS, il ne pouvait pas contacter directement un serveur Xtream en
HTTP. Toute cette documentation tourne autour de contournements successifs :

- des proxies CORS publics (corsproxy.io, api.codetabs.com, cors-anywhere, allorigins…),
  saturés, limités en quota et régulièrement en panne ;
- puis des proxies à déployer soi-même chez un hébergeur (Vercel, Netlify,
  Cloudflare Workers), qu'il fallait déployer, puis dont il fallait recopier l'URL
  à la main dans le code du player.

Ce problème n'existe plus. Le serveur d'auto-hébergement (`server/server.js`) sert
l'application **et** le proxy `/api/proxy` sur **la même origine** : il n'y a donc plus
de requête inter-origines, donc plus de CORS à contourner, donc plus aucun proxy
tiers à déployer ni à configurer. Le player détecte le proxy local tout seul.

👉 **Documentation à jour : [`../../DEPLOY-NAS-UGREEN.md`](../../DEPLOY-NAS-UGREEN.md)**

## Correspondance ancien → nouveau

| Ancien document | Ce qui le remplace |
|---|---|
| `START-HERE.md`, `TEST-MAINTENANT.md` | `DEPLOY-NAS-UGREEN.md` |
| `DEPLOY-VERCEL-1-CLIC.md`, `GUIDE-RAPIDE-VERCEL.md` | Plus nécessaire — proxy local |
| `CLOUDFLARE-WORKER-SETUP.md`, `CLOUDFLARE-BACKUP-ADDED.md` | Plus nécessaire — proxy local |
| `3-BACKENDS-PRETS.md`, `TOUTES-SOLUTIONS-BACKEND.md`, `CONFIGURE-MAINTENANT.md` | Plus nécessaire — proxy local |
| `DEPLOIE-TON-PROXY-MAINTENANT.md`, `FIX-URGENT-PROXIES.md` | Plus nécessaire — proxy local |
| `MULTI-PROXY-INTELLIGENT.md`, `SYSTEME-INTELLIGENT-UNIVERSEL.md`, `SYSTEME-TEST-FLUX-INTELLIGENT.md`, `SOLUTION-STREAMING-PROXY.md` | Le repli multi-proxy existe toujours dans le player pour l'usage hors auto-hébergement, mais il n'est plus le chemin principal |
| `GUIDE-TEST-SECURISE.md` | Obsolète — reposait sur un script PowerShell et des identifiants en clair |
| `ETAT_ACTUEL.md`, `REFONTE_COMPLETE.md`, `REFONTE_STRUCTURE.md`, `FINALISATION_COMPLETE.md`, `OPTIMISATIONS-FINALES.md`, `README-IPTV-OPTIMISATIONS.md`, `TESTS-ET-CORRECTIONS.md` | Instantanés datés (nov. 2025), valeur purement historique |

## ⚠️ Identifiants retirés

Plusieurs de ces fichiers contenaient les identifiants Xtream réels d'un abonnement
(nom d'utilisateur et mot de passe, lisibles dans une URL de flux au format
`/live/<utilisateur>/<mot_de_passe>/<id>.m3u8`). Ils ont été remplacés par des
valeurs génériques. **Le nettoyage du contenu actuel ne les efface pas de
l'historique git** : les identifiants concernés doivent être considérés comme
compromis et changés auprès du fournisseur.

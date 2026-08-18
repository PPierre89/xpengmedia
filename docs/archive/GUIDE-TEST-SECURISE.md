# 🧪 TEST AUTOMATIQUE AVEC TES CREDENTIALS

## 🔒 SÉCURITÉ GARANTIE

Le script `test-xtream.ps1` est dans `.gitignore`.
Il **NE SERA JAMAIS** commité sur GitHub.

---

## ⚡ UTILISATION

### Donne-moi ton password Xtream

Une fois que tu me donnes ton password, lance :

```powershell
cd "C:\Users\HP\Desktop\homey app\xpengmedia"

.\test-xtream.ps1 -Server "http://mon-serveur-iptv.com" -Username "UTILISATEUR" -Password "TON_PASSWORD"
```

**Remplace `TON_PASSWORD` par ton vrai password !**

---

## 📊 CE QUE LE SCRIPT TESTE

### Test 1 : Connexion Directe
```
🔍 Tentative de connexion directe...
✅ Connexion directe réussie !
📊 Nombre de chaînes: 1247
```

### Test 2 : Proxies CORS
```
🌐 Test: cors-anywhere.herokuapp.com...
   ✅ FONCTIONNE ! (1247 chaînes)

🌐 Test: corsproxy.io...
   ✅ FONCTIONNE ! (1247 chaînes)

🌐 Test: api.codetabs.com...
   ❌ Échec: timeout

🌐 Test: api.allorigins.win...
   ⚠️ Erreur du proxy
```

### Test 3 : Flux Vidéo
```
🎬 Test avec le proxy: cors-anywhere.herokuapp.com
📺 Test de: FR| TF1 FHD
✅ Flux vidéo accessible !
```

### Résumé Final
```
📊 RÉSUMÉ DES TESTS

✅ Proxies fonctionnels: 2/4
   Proxies qui marchent:
   - cors-anywhere.herokuapp.com
   - corsproxy.io

💡 RECOMMANDATION:
   Le player utilisera automatiquement:
   1️⃣ cors-anywhere.herokuapp.com (en priorité)
   2️⃣ corsproxy.io (en fallback)

🎉 LE PLAYER DEVRAIT FONCTIONNER !
```

---

## 🎯 APRÈS LE TEST

### Si au moins 1 proxy fonctionne :
✅ Le player marchera automatiquement
✅ Teste sur ta XPENG : `https://dlnraja.github.io/xpengmedia/iptv-player.html?debug=1`

### Si aucun proxy ne fonctionne :
❌ Il faut déployer un backend (Vercel/Cloudflare)
🚀 Utilise `.\configure-backends.ps1` après déploiement

---

## 🔐 SÉCURITÉ

- ✅ `test-xtream.ps1` est dans `.gitignore`
- ✅ Jamais commité sur GitHub
- ✅ Reste uniquement sur ton PC
- ✅ Tes credentials sont en sécurité

---

## 💡 ALTERNATIVE SANS SCRIPT

Si tu préfères ne pas utiliser le script, donne-moi simplement ton password ici et je testerai manuellement pour toi !

---

**DONNE-MOI TON PASSWORD ET JE TESTE TOUT !** 🔒

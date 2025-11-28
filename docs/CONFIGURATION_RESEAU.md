# Configuration Accès Réseau API CROU

## Problèmes Résolus

### 1. Serveur API - Écoute réseau ✅
**Fichier**: `apps/api/src/main.ts` ligne 299

**Changement**:
```typescript
// AVANT (bloquait l'accès réseau)
const server = app.listen(PORT, 'localhost', () => {

// APRÈS (autorise l'accès réseau)
const server = app.listen(PORT, '0.0.0.0', () => {
```

Le serveur écoute maintenant sur toutes les interfaces réseau (0.0.0.0).

### 2. Configuration CORS ✅
**Fichier**: `apps/api/src/config/cors.config.ts`

La configuration CORS autorise automatiquement en mode développement:
- Toutes les IPs du réseau local: 192.168.x.x, 10.x.x.x, 172.16-31.x.x
- Localhost et 127.0.0.1

**Code ajouté pour debugging**:
```typescript
console.warn(`[CORS] Origin refusée: ${origin}`);
```

## Configuration pour Accès Distant

### Sur la Machine Serveur (Où l'API tourne)

#### 1. Obtenir l'adresse IP
```bash
ipconfig
```
Cherchez "Adresse IPv4" (exemple: 192.168.10.127)

#### 2. Ouvrir le port dans le pare-feu Windows
```powershell
# Ouvrir PowerShell en administrateur
netsh advfirewall firewall add rule name="CROU API 3001" dir=in action=allow protocol=TCP localport=3001

# Vérifier la règle
netsh advfirewall firewall show rule name="CROU API 3001"
```

#### 3. Vérifier que le serveur écoute
```bash
netstat -an | findstr ":3001"
```
Vous devriez voir: `TCP    0.0.0.0:3001           0.0.0.0:0              LISTENING`

#### 4. Tester localement
```bash
curl http://localhost:3001/health
```

### Sur la Machine Cliente (Machine distante)

#### 1. Configuration Frontend
Éditez `apps/web/.env`:
```env
# Remplacez 192.168.10.127 par l'IP de votre serveur
VITE_API_URL=http://192.168.10.127:3001/api
VITE_FRONTEND_URL=http://localhost:5173
```

#### 2. Redémarrer le frontend
```bash
cd apps/web
npm run dev
```

#### 3. Tester la connexion à l'API
Depuis la machine distante:
```bash
# Remplacez l'IP par celle de votre serveur
curl http://192.168.10.127:3001/health
```

## Tests de Connectivité

### Test 1: Health Check
```bash
curl http://[IP_SERVEUR]:3001/health
```
**Résultat attendu**:
```json
{
  "status": "OK",
  "timestamp": "...",
  "environment": "development",
  "version": "1.0.0"
}
```

### Test 2: API Base
```bash
curl http://[IP_SERVEUR]:3001/api
```

### Test 3: CORS (depuis navigateur)
```javascript
// Console navigateur sur machine distante
fetch('http://[IP_SERVEUR]:3001/health')
  .then(r => r.json())
  .then(console.log)
  .catch(console.error)
```

## Résolution des Problèmes

### Erreur: "Connection refused"
**Causes possibles**:
1. ❌ Serveur API non démarré → `npm run dev:api`
2. ❌ Pare-feu bloque le port → Ouvrir le port 3001
3. ❌ Mauvaise IP → Vérifier avec `ipconfig`
4. ❌ Serveur écoute sur localhost → Vérifier ligne 299 de main.ts

### Erreur: "CORS policy"
**Causes possibles**:
1. ❌ NODE_ENV pas en "development" → Vérifier .env
2. ❌ Origin non autorisée → Regarder les logs console: `[CORS] Origin refusée: ...`
3. ❌ Format IP incorrect → Doit être http://192.168.x.x:port

### Erreur: "Timeout"
**Causes possibles**:
1. ❌ Machines sur réseaux différents → Vérifier même sous-réseau
2. ❌ Antivirus/Pare-feu → Désactiver temporairement pour test
3. ❌ Serveur surchargé → Vérifier les logs serveur

## Vérification Configuration Actuelle

### Variables d'environnement
```bash
# Backend (.env ou variables système)
NODE_ENV=development
PORT=3001

# Frontend (apps/web/.env)
VITE_API_URL=http://[IP_SERVEUR]:3001/api
```

### Status du serveur
```bash
# Voir les logs serveur
# Doit afficher: "🌐 URL Réseau: http://0.0.0.0:3001 (accessible depuis le réseau)"
```

## Configuration Production (Pour plus tard)

En production, il faudra:
1. Utiliser HTTPS (certificat SSL)
2. Configurer ALLOWED_ORIGINS dans .env
3. Mettre NODE_ENV=production
4. Configurer un reverse proxy (nginx)
5. Utiliser un nom de domaine au lieu d'une IP

## Commandes Utiles

```bash
# Voir tous les ports en écoute
netstat -an | findstr "LISTENING"

# Voir les connexions actives sur le port 3001
netstat -an | findstr ":3001"

# Tester ping vers machine serveur
ping [IP_SERVEUR]

# Voir l'IP de toutes les interfaces
ipconfig /all

# Flush DNS (si problèmes cache)
ipconfig /flushdns
```

## Architecture Réseau

```
Machine Cliente (192.168.10.X)
         |
         | HTTP
         ↓
Machine Serveur (192.168.10.127)
         |
    ┌────┴────┐
    |  Port 3001  |  → API Backend (Node.js/Express)
    └────┬────┘
         |
    PostgreSQL (5432)
```

## Sécurité

### En Développement (Actuel)
- ✅ CORS permissif pour réseau local
- ✅ Rate limiting (1000 req/15min)
- ✅ Helmet (sécurité headers)
- ✅ JWT pour authentification

### Recommandations Production
- 🔒 HTTPS obligatoire
- 🔒 CORS restreint aux domaines spécifiques
- 🔒 Rate limiting strict (100 req/15min)
- 🔒 Firewall applicatif (WAF)
- 🔒 Monitoring et alertes

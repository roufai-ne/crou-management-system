# 🔧 Guide de Dépannage - Système CROU

Ce guide vous aide à résoudre les problèmes courants.

---

## ❌ Erreur: "Contexte tenant manquant" / "Tenant requis"

### Symptômes
Quand vous vous connectez, vous voyez des erreurs partout indiquant:
```json
{
  "error": "Contexte tenant manquant",
  "message": "Votre compte n'est pas associé à un tenant..."
}
```

### Cause
Les utilisateurs dans la base de données n'ont pas de `tenant_id` associé. Le système multi-tenant exige que chaque utilisateur soit lié à un tenant (CROU ou Ministère).

### Solution Rapide (Recommandée)

#### Option 1: Script de Correction Automatique
```bash
cd apps/api
npm run fix:users-tenant
```

Ce script va:
1. Trouver tous les utilisateurs sans tenant
2. Les assigner automatiquement au tenant Ministère (ou premier tenant disponible)
3. Afficher un résumé des corrections

#### Option 2: Diagnostic Puis Correction
```bash
# 1. Diagnostiquer le problème
cd apps/api
npm run diagnose:users

# 2. Appliquer le fix
npm run fix:users-tenant
```

#### Option 3: Réinitialiser la Base de Données
Si vous voulez repartir de zéro avec des données propres:
```bash
cd apps/api
npm run db:reset
```
⚠️ **ATTENTION**: Cela supprimera toutes les données existantes!

### Solution Manuelle (Avancée)

#### 1. Vérifier les Utilisateurs
```sql
-- Voir les utilisateurs sans tenant
SELECT id, email, name, tenant_id
FROM users
WHERE tenant_id IS NULL;
```

#### 2. Trouver un Tenant Valide
```sql
-- Lister les tenants disponibles
SELECT id, name, code, type FROM tenants;
```

#### 3. Assigner un Tenant
```sql
-- Assigner au tenant Ministère (remplacer l'ID)
UPDATE users
SET tenant_id = 'TENANT_ID_ICI'
WHERE tenant_id IS NULL;
```

### Prévention
Pour éviter ce problème à l'avenir:

1. **Toujours créer les users avec un tenant_id**:
```typescript
const user = userRepository.create({
  email: 'user@example.com',
  password: 'password',
  name: 'User Name',
  roleId: roleId,
  tenantId: tenantId,  // ← IMPORTANT!
  status: UserStatus.ACTIVE
});
```

2. **Valider avant de sauvegarder**:
```typescript
if (!userData.tenantId) {
  throw new Error('Un tenant_id est requis pour créer un utilisateur');
}
```

3. **Exécuter les seeders correctement**:
```bash
npm run db:seed
```

---

## ❌ Erreur: JWT_SECRET manquant

### Symptômes
Le serveur refuse de démarrer avec:
```
❌ CRITIQUE: Variable JWT_SECRET manquante (requise en production)
Configuration d'environnement invalide
```

### Solution

#### 1. Copier l'exemple de configuration
```bash
cp apps/api/.env.example apps/api/.env
```

#### 2. Générer des secrets sécurisés
```bash
# Sur Linux/Mac
openssl rand -hex 64

# Ou en Node.js
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

#### 3. Éditer `.env` et ajouter les secrets
```env
JWT_SECRET=VOTRE_SECRET_64_CARACTERES_ICI
JWT_REFRESH_SECRET=VOTRE_AUTRE_SECRET_64_CARACTERES_ICI
DATABASE_URL=postgresql://crou_user:crou_password@localhost:5432/crou_database
```

#### 4. Redémarrer le serveur
```bash
npm run dev
```

---

## ❌ Erreur: Impossible de se connecter à PostgreSQL

### Symptômes
```
❌ Erreur initialisation base de données
Connection refused / ECONNREFUSED
```

### Solution

#### 1. Vérifier que PostgreSQL est démarré
```bash
# Ubuntu/Debian
sudo systemctl status postgresql
sudo systemctl start postgresql

# Mac avec Homebrew
brew services start postgresql

# Docker
docker ps | grep postgres
docker start postgres_container_name
```

#### 2. Vérifier la configuration
```bash
# Tester la connexion
psql -h localhost -U crou_user -d crou_database

# Créer la base si elle n'existe pas
createdb crou_database
```

#### 3. Vérifier les credentials dans `.env`
```env
DATABASE_URL=postgresql://USER:PASSWORD@HOST:PORT/DATABASE
# Exemple:
DATABASE_URL=postgresql://crou_user:crou_password@localhost:5432/crou_database
```

---

## ❌ Erreur: "RBAC permission denied"

### Symptômes
Après connexion, certaines actions sont bloquées avec:
```json
{
  "error": "Permission refusée",
  "message": "Vous n'avez pas la permission d'accéder à cette ressource"
}
```

### Solution

#### 1. Vérifier les permissions de l'utilisateur
```bash
npm run diagnose:users
```

#### 2. Exécuter les seeders RBAC
```bash
cd apps/api
npm run db:seed
```

Cela créera:
- 13 rôles (4 ministère + 9 CROU)
- 50+ permissions
- 77 utilisateurs avec rôles appropriés

#### 3. Utilisateurs de test créés
```
Ministère:
- ministre@mesrit.gov.ne / password123
- directeur.finances@mesrit.gov.ne / password123
- resp.appro@mesrit.gov.ne / password123
- controleur@mesrit.gov.ne / password123

CROU (exemple Niamey):
- directeur@crou_niamey.gov.ne / password123
- secretaire@crou_niamey.gov.ne / password123
- chef.financier@crou_niamey.gov.ne / password123
... (et 6 autres par CROU)
```

---

## ❌ Erreur: "CORS not allowed"

### Symptômes
Le frontend ne peut pas contacter l'API:
```
Access to XMLHttpRequest blocked by CORS policy
```

### Solution

#### 1. Vérifier que l'origine est autorisée
Éditer `apps/api/src/config/cors.config.ts`:
```typescript
const allowedOrigins = [
  'http://localhost:3000',      // Frontend dev
  'http://localhost:5173',      // Vite dev
  'http://127.0.0.1:3000',      // Variant
  'http://127.0.0.1:5173',      // Variant
  'https://votre-domaine.com'   // Production
];
```

#### 2. Redémarrer le serveur API
```bash
cd apps/api
npm run dev
```

---

## ❌ Erreur: "Rate limit exceeded"

### Symptômes
```json
{
  "error": "Trop de requêtes depuis cette IP, réessayez plus tard."
}
```

### Solution Temporaire (Dev)
Dans `apps/api/src/main.ts`, augmenter les limites:
```typescript
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: NODE_ENV === 'development' ? 10000 : 100,  // ← Augmenté pour dev
});
```

### Solution Production
Attendre 15 minutes ou configurer Redis pour rate limiting partagé:
```bash
# Installer Redis
sudo apt install redis-server
sudo systemctl start redis

# Vérifier
redis-cli ping
# Doit retourner: PONG
```

---

## 🆘 Aide Supplémentaire

### Logs Utiles
```bash
# Logs du serveur
cd apps/api
npm run dev

# Logs PostgreSQL (Ubuntu)
sudo tail -f /var/log/postgresql/postgresql-15-main.log

# Logs Redis
sudo tail -f /var/log/redis/redis-server.log
```

### Scripts de Maintenance
```bash
# Diagnostic complet
npm run diagnose:users

# Reset complet de la BDD
npm run db:reset

# Seulement les migrations
npm run db:run

# Seulement les seeds
npm run db:seed
```

### Vérification de Santé
```bash
# API Health Check
curl http://localhost:3001/health

# API avec DB Check
curl http://localhost:3001/api/health

# Frontend
curl http://localhost:3000
```

### Support
- Consulter CODE_REVIEW.md pour l'analyse complète
- Consulter ACTION_PLAN.md pour la roadmap
- GitHub Issues: [votre-repo]/issues
- Email: support@crou.gov.ne

---

## 📋 Checklist de Démarrage

Avant de démarrer le système, vérifier:

### Backend
- [ ] PostgreSQL installé et démarré
- [ ] Redis installé et démarré (optionnel)
- [ ] `.env` configuré avec secrets
- [ ] Dependencies installées: `cd apps/api && pnpm install`
- [ ] Base de données initialisée: `npm run db:reset`
- [ ] Serveur démarre: `npm run dev`
- [ ] Health check OK: `curl http://localhost:3001/health`

### Frontend
- [ ] Dependencies installées: `cd apps/web && pnpm install`
- [ ] Variables d'env configurées (`.env`)
- [ ] Serveur démarre: `npm run dev`
- [ ] Frontend accessible: `http://localhost:3000`

### Tests de Connexion
- [ ] Connexion avec ministre@mesrit.gov.ne / password123
- [ ] Connexion avec directeur@crou_niamey.gov.ne / password123
- [ ] Dashboard accessible
- [ ] Pas d'erreurs "tenant requis"
- [ ] RBAC fonctionne (permissions)

---

**Dernière mise à jour**: 2025-11-05

# Résumé des Routes API - Système CROU

**Date:** 27 Octobre 2025
**Version API:** 1.0.0
**Base URL:** `http://localhost:3001/api`

---

## Routes Disponibles

### 1. Authentification `/api/auth`

| Méthode | Route | Description | Auth | Permissions |
|---------|-------|-------------|------|-------------|
| POST | `/api/auth/login` | Connexion utilisateur | ❌ | - |
| POST | `/api/auth/logout` | Déconnexion | ✅ | - |
| POST | `/api/auth/refresh` | Rafraîchir le token | ❌ | - |
| GET | `/api/auth/me` | Profil utilisateur | ✅ | - |

**Rate Limiting:** 5 tentatives / 15 minutes

---

### 2. Dashboard `/api/dashboard`

| Méthode | Route | Description | Auth | Permissions |
|---------|-------|-------------|------|-------------|
| GET | `/api/dashboard` | Tableau de bord principal | ✅ | `dashboard:read` |
| GET | `/api/dashboard/kpis` | KPIs consolidés | ✅ | `dashboard:read` |
| GET | `/api/dashboard/stats` | Statistiques détaillées | ✅ | `dashboard:read` |

---

### 3. Financial `/api/financial`

| Méthode | Route | Description | Auth | Permissions |
|---------|-------|-------------|------|-------------|
| GET | `/api/financial/budgets` | Liste des budgets | ✅ | `financial:read` |
| POST | `/api/financial/budgets` | Créer un budget | ✅ | `financial:create` |
| GET | `/api/financial/budgets/:id` | Détail budget | ✅ | `financial:read` |
| PUT | `/api/financial/budgets/:id` | Modifier budget | ✅ | `financial:update` |
| DELETE | `/api/financial/budgets/:id` | Supprimer budget | ✅ | `financial:delete` |
| GET | `/api/financial/transactions` | Liste transactions | ✅ | `financial:read` |
| POST | `/api/financial/transactions` | Créer transaction | ✅ | `financial:create` |

---

### 4. Stocks `/api/stocks`

| Méthode | Route | Description | Auth | Permissions |
|---------|-------|-------------|------|-------------|
| GET | `/api/stocks` | Liste des stocks | ✅ | `stocks:read` |
| POST | `/api/stocks` | Créer un stock | ✅ | `stocks:create` |
| GET | `/api/stocks/:id` | Détail stock | ✅ | `stocks:read` |
| PUT | `/api/stocks/:id` | Modifier stock | ✅ | `stocks:update` |
| DELETE | `/api/stocks/:id` | Supprimer stock | ✅ | `stocks:delete` |
| POST | `/api/stocks/movement` | Mouvement de stock | ✅ | `stocks:create` |
| GET | `/api/stocks/:id/alerts` | Alertes de stock | ✅ | `stocks:read` |

---

### 5. Housing `/api/housing` ✨ NOUVEAU

| Méthode | Route | Description | Auth | Permissions |
|---------|-------|-------------|------|-------------|
| GET | `/api/housing` | Liste des logements | ✅ | `housing:read` |
| POST | `/api/housing` | Créer un logement | ✅ | `housing:create` |
| GET | `/api/housing/:id` | Détail logement | ✅ | `housing:read` |
| PUT | `/api/housing/:id` | Modifier logement | ✅ | `housing:update` |
| DELETE | `/api/housing/:id` | Supprimer logement | ✅ | `housing:delete` |
| GET | `/api/housing/:id/stats` | Statistiques logement | ✅ | `housing:read` |

**Filtres disponibles:**
- `search` : Recherche par nom/code/adresse
- `type` : cite_universitaire, residence, foyer, logement_personnel
- `status` : actif, inactif, en_construction, en_renovation, ferme
- `category` : standard, confort, luxe, handicape
- `tenantId` : Filtrer par CROU
- `limit` : Nombre de résultats (défaut: 50)
- `offset` : Pagination

---

### 6. Reports `/api/reports`

| Méthode | Route | Description | Auth | Permissions |
|---------|-------|-------------|------|-------------|
| GET | `/api/reports` | Liste des rapports | ✅ | `reports:read` |
| POST | `/api/reports/generate` | Générer un rapport | ✅ | `reports:create` |
| GET | `/api/reports/:id` | Télécharger rapport | ✅ | `reports:read` |
| GET | `/api/reports/templates` | Templates disponibles | ✅ | `reports:read` |

**Formats:** PDF, Excel (XLSX)

---

### 7. Notifications `/api/notifications`

| Méthode | Route | Description | Auth | Permissions |
|---------|-------|-------------|------|-------------|
| GET | `/api/notifications` | Liste notifications | ✅ | - |
| POST | `/api/notifications/mark-read/:id` | Marquer comme lu | ✅ | - |
| POST | `/api/notifications/mark-all-read` | Tout marquer lu | ✅ | - |
| GET | `/api/notifications/unread-count` | Nombre non lus | ✅ | - |

**WebSocket:** `ws://localhost:3001` pour notifications temps réel

---

### 8. Workflows `/api/workflows`

| Méthode | Route | Description | Auth | Permissions |
|---------|-------|-------------|------|-------------|
| GET | `/api/workflows` | Liste workflows | ✅ | `workflows:read` |
| POST | `/api/workflows` | Créer workflow | ✅ | `workflows:create` |
| GET | `/api/workflows/:id` | Détail workflow | ✅ | `workflows:read` |
| POST | `/api/workflows/:id/approve` | Approuver étape | ✅ | `workflows:approve` |
| POST | `/api/workflows/:id/reject` | Rejeter étape | ✅ | `workflows:approve` |
| GET | `/api/workflows/pending` | Workflows en attente | ✅ | `workflows:read` |

---

### 9. Admin `/api/admin` ✨ NOUVEAU

#### Users `/api/admin/users`

| Méthode | Route | Description | Auth | Permissions |
|---------|-------|-------------|------|-------------|
| GET | `/api/admin/users` | Liste utilisateurs | ✅ | `admin:users:read` |
| POST | `/api/admin/users` | Créer utilisateur | ✅ | `admin:users:create` |
| GET | `/api/admin/users/:id` | Détail utilisateur | ✅ | `admin:users:read` |
| PUT | `/api/admin/users/:id` | Modifier utilisateur | ✅ | `admin:users:update` |
| DELETE | `/api/admin/users/:id` | Supprimer utilisateur | ✅ | `admin:users:delete` |
| POST | `/api/admin/users/:id/toggle-status` | Changer statut | ✅ | `admin:users:update` |
| POST | `/api/admin/users/:id/reset-password` | Reset password | ✅ | `admin:users:reset_password` |

#### Roles `/api/admin/roles`

| Méthode | Route | Description | Auth | Permissions |
|---------|-------|-------------|------|-------------|
| GET | `/api/admin/roles` | Liste rôles | ✅ | `admin:roles:read` |
| POST | `/api/admin/roles` | Créer rôle | ✅ | `admin:roles:create` |
| PUT | `/api/admin/roles/:id` | Modifier rôle | ✅ | `admin:roles:update` |
| DELETE | `/api/admin/roles/:id` | Supprimer rôle | ✅ | `admin:roles:delete` |

#### Tenants `/api/admin/tenants`

| Méthode | Route | Description | Auth | Permissions |
|---------|-------|-------------|------|-------------|
| GET | `/api/admin/tenants` | Liste tenants | ✅ | `admin:tenants:read` |
| POST | `/api/admin/tenants` | Créer tenant | ✅ | `admin:tenants:create` |
| PUT | `/api/admin/tenants/:id` | Modifier tenant | ✅ | `admin:tenants:update` |
| DELETE | `/api/admin/tenants/:id` | Supprimer tenant | ✅ | `admin:tenants:delete` |

#### System `/api/admin`

| Méthode | Route | Description | Auth | Permissions |
|---------|-------|-------------|------|-------------|
| GET | `/api/admin/health` | Health check admin | ✅ | `admin:access` |
| GET | `/api/admin/stats` | Stats système | ✅ | `admin:stats:read` |
| GET | `/api/admin/audit` | Logs d'audit | ✅ | `admin:audit:read` |
| GET | `/api/admin/permissions/available` | Permissions dispos | ✅ | `admin:permissions:read` |

**Sécurité Admin:**
- Permission `admin:access` requise pour toutes les routes
- Audit automatique de toutes les actions
- Isolation multi-tenant respectée

---

## Health Checks

| Route | Description | Auth |
|-------|-------------|------|
| GET `/health` | Health check simple | ❌ |
| GET `/api/health` | Health check avec DB | ❌ |
| GET `/api` | Info API | ❌ |

---

## Authentification

### JWT Token

**Headers requis:**
```
Authorization: Bearer <JWT_TOKEN>
```

**Structure du token:**
```json
{
  "userId": "uuid",
  "email": "user@example.com",
  "tenantId": "uuid",
  "roleId": "uuid",
  "permissions": ["permission1", "permission2"],
  "iat": 1234567890,
  "exp": 1234567890
}
```

---

## Multi-Tenant

Toutes les routes (sauf Admin avec permissions spéciales) sont isolées par tenant.

**Isolation automatique:**
- Les utilisateurs ne voient que les données de leur CROU
- Les utilisateurs ministériels avec `cross_tenant:access` voient tous les CROU
- Validation stricte du `tenantId` sur toutes les opérations

---

## Pagination

**Query parameters:**
```
?limit=50&offset=0
```

**Réponse:**
```json
{
  "success": true,
  "data": {
    "items": [...],
    "pagination": {
      "total": 150,
      "limit": 50,
      "offset": 0,
      "hasMore": true
    }
  }
}
```

---

## Format des Réponses

### Succès
```json
{
  "success": true,
  "data": { ... },
  "message": "Opération réussie"
}
```

### Erreur
```json
{
  "error": "Type d'erreur",
  "message": "Description de l'erreur",
  "code": "ERROR_CODE" // optionnel
}
```

---

## Codes HTTP

| Code | Signification |
|------|---------------|
| 200 | OK |
| 201 | Créé |
| 400 | Requête invalide |
| 401 | Non authentifié |
| 403 | Non autorisé |
| 404 | Non trouvé |
| 409 | Conflit (ex: email déjà utilisé) |
| 500 | Erreur serveur |
| 503 | Service indisponible |

---

## Rate Limiting

| Endpoint | Limite |
|----------|--------|
| `/api/auth/*` | 5 requêtes / 15 min |
| Autres routes | 100 requêtes / 15 min (prod) |
| Autres routes | 1000 requêtes / 15 min (dev) |

---

## Permissions Disponibles

### Modules

- `dashboard:read`
- `financial:read`, `financial:create`, `financial:update`, `financial:delete`
- `stocks:read`, `stocks:create`, `stocks:update`, `stocks:delete`
- `housing:read`, `housing:create`, `housing:update`, `housing:delete`
- `reports:read`, `reports:create`, `reports:export`
- `workflows:read`, `workflows:create`, `workflows:approve`

### Admin

- `admin:access` (requis pour toutes les routes admin)
- `admin:users:*`, `admin:roles:*`, `admin:tenants:*`
- `admin:permissions:*`, `admin:stats:*`, `admin:audit:*`
- `cross_tenant:access` (accès multi-CROU)
- `ministry:global_view` (vue ministérielle)

---

## Test des Routes

### Script automatique
```bash
node apps/api/test-routes.js
```

### cURL Examples

**Login:**
```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password"}'
```

**Get Housing (avec token):**
```bash
curl -X GET http://localhost:3001/api/housing \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Create Housing:**
```bash
curl -X POST http://localhost:3001/api/housing \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "code": "CROU-NIA-001",
    "nom": "Cité Universitaire de Niamey",
    "type": "cite_universitaire",
    "category": "standard",
    "adresse": "Boulevard de l'\''Université",
    "ville": "Niamey",
    "nombreChambres": 100,
    "capaciteTotale": 200
  }'
```

---

## Développement

**Démarrer le serveur:**
```bash
cd apps/api
npm run dev
```

**Tester la compilation TypeScript:**
```bash
npm run type-check
```

**Lancer les tests:**
```bash
npm run test
```

---

**Dernière mise à jour:** 27 Octobre 2025
**Modules actifs:** 9/9 (100%)
**Endpoints totaux:** 70+

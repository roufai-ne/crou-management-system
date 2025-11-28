# 📚 Guide de Documentation Swagger/OpenAPI

**Date**: 31 Octobre 2025
**Status**: ✅ Configuration Complète - Documentation en cours

---

## 📋 Table des Matières

1. [État Actuel](#état-actuel)
2. [Configuration Swagger](#configuration-swagger)
3. [Template de Documentation](#template-de-documentation)
4. [Modules Documentés](#modules-documentés)
5. [Modules à Documenter](#modules-à-documenter)
6. [Schémas Réutilisables](#schémas-réutilisables)
7. [Best Practices](#best-practices)

---

## 🎯 État Actuel

### ✅ Configuration Complète

- **Swagger UI**: Accessible à `http://localhost:3001/api-docs`
- **Fichier de config**: `apps/api/src/config/swagger.config.ts`
- **OpenAPI Version**: 3.0.0
- **Authentification**: JWT Bearer Token

### 📊 Progression Documentation

| Module | Fichier | Endpoints | Status | Complété |
|--------|---------|-----------|--------|----------|
| **Auth** | `auth.routes.ts` | 4/4 | ✅ Complet | 100% |
| **Dashboard** | `dashboard.routes.ts` | 0/7 | ⏳ À faire | 0% |
| **Admin** | `admin/index.ts` | 0/20+ | ⏳ À faire | 0% |
| **Financial** | `financial.routes.ts` | 0/10+ | ⏳ À faire | 0% |
| **Stocks** | `stocks.routes.ts` | 0/10+ | ⏳ À faire | 0% |
| **Housing** | `housing.routes.ts` | 0/10+ | ⏳ À faire | 0% |
| **Transport** | `transport.routes.ts` | 0/10+ | ⏳ À faire | 0% |
| **Reports** | `reports.routes.ts` | 0/5+ | ⏳ À faire | 0% |
| **Workflows** | `workflow.routes.ts` | 0/8+ | ⏳ À faire | 0% |
| **Notifications** | `notifications.routes.ts` | 0/5+ | ⏳ À faire | 0% |

**Total**: 4/90+ endpoints documentés (~5%)

---

## ⚙️ Configuration Swagger

### Accès à la Documentation

```bash
# Démarrer le serveur API
cd apps/api
pnpm dev

# Ouvrir dans le navigateur
http://localhost:3001/api-docs
```

### Authentification dans Swagger UI

1. Cliquer sur **"Authorize"** en haut à droite
2. Obtenir un token via `POST /api/auth/login`
3. Copier le `accessToken` depuis la réponse
4. Coller dans le champ "Value" (sans "Bearer")
5. Cliquer sur **"Authorize"**
6. Tous les endpoints protégés sont maintenant testables

---

## 📝 Template de Documentation

### Endpoint GET Simple

```typescript
/**
 * @swagger
 * /api/module/endpoint:
 *   get:
 *     summary: Titre court de l'endpoint
 *     description: Description détaillée de ce que fait l'endpoint
 *     tags: [NomDuModule]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/PageParam'
 *       - $ref: '#/components/parameters/LimitParam'
 *       - in: query
 *         name: customParam
 *         schema:
 *           type: string
 *         description: Description du paramètre
 *     responses:
 *       200:
 *         description: Succès
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                 pagination:
 *                   $ref: '#/components/schemas/Pagination'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get('/endpoint', authenticateJWT, Controller.method);
```

### Endpoint POST avec Body

```typescript
/**
 * @swagger
 * /api/module/resource:
 *   post:
 *     summary: Créer une nouvelle ressource
 *     description: Description détaillée
 *     tags: [NomDuModule]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - field1
 *               - field2
 *             properties:
 *               field1:
 *                 type: string
 *                 example: "Valeur exemple"
 *               field2:
 *                 type: number
 *                 example: 1000
 *               optionalField:
 *                 type: string
 *     responses:
 *       201:
 *         description: Ressource créée avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 */
router.post('/resource', authenticateJWT, checkPermissions(['module:write']), Controller.create);
```

### Endpoint PUT/PATCH avec ID

```typescript
/**
 * @swagger
 * /api/module/resource/{id}:
 *   put:
 *     summary: Mettre à jour une ressource
 *     tags: [NomDuModule]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID de la ressource
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               field1:
 *                 type: string
 *               field2:
 *                 type: number
 *     responses:
 *       200:
 *         description: Ressource mise à jour
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.put('/resource/:id', authenticateJWT, Controller.update);
```

### Endpoint DELETE

```typescript
/**
 * @swagger
 * /api/module/resource/{id}:
 *   delete:
 *     summary: Supprimer une ressource
 *     tags: [NomDuModule]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Ressource supprimée
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.delete('/resource/:id', authenticateJWT, Controller.delete);
```

---

## ✅ Modules Documentés

### 1. Auth Module (✅ Complet)

**Fichier**: `apps/api/src/modules/auth/auth.routes.ts`

| Endpoint | Méthode | Description | Auth |
|----------|---------|-------------|------|
| `/api/auth/login` | POST | Connexion utilisateur | Non |
| `/api/auth/refresh` | POST | Renouvellement token | Non |
| `/api/auth/logout` | POST | Déconnexion | Oui |
| `/api/auth/profile` | GET | Profil utilisateur | Oui |

**Schémas documentés**:
- LoginRequest
- LoginResponse
- RefreshRequest
- UserProfile

---

## ⏳ Modules à Documenter

### 2. Dashboard Module (Priorité: Haute)

**Fichier**: `apps/api/src/modules/dashboard/dashboard.routes.ts`

Endpoints à documenter:
- `GET /api/dashboard/kpis/global` - KPIs globaux
- `GET /api/dashboard/kpis/modules` - KPIs par module
- `GET /api/dashboard/evolution` - Données temporelles
- `GET /api/dashboard/expenses` - Répartition dépenses
- `GET /api/dashboard/alerts` - Alertes récentes
- `GET /api/dashboard/activities` - Activités récentes
- `POST /api/dashboard/alerts/:id/acknowledge` - Marquer alerte lue

### 3. Admin Module (Priorité: Haute)

**Fichiers**: `apps/api/src/modules/admin/*.ts`

Sous-modules:
- **Users**: CRUD utilisateurs, activation/désactivation
- **Roles**: Gestion rôles et permissions
- **Tenants**: Gestion organisations (CROU + Ministère)
- **Security**: Monitoring sécurité, sessions, logs
- **Audit**: Consultation logs d'audit

### 4. Financial Module (Priorité: Moyenne)

**Fichier**: `apps/api/src/modules/financial/financial.routes.ts`

Endpoints:
- Budgets (CRUD)
- Transactions (CRUD, validation)
- Catégories financières
- Rapports financiers

### 5. Stocks Module (Priorité: Moyenne)

**Fichier**: `apps/api/src/modules/stocks/stocks.routes.ts`

Endpoints:
- Articles (CRUD)
- Mouvements de stock (entrées/sorties)
- Inventaires
- Fournisseurs

### 6. Housing Module (Priorité: Moyenne)

**Fichier**: `apps/api/src/modules/housing/housing.routes.ts`

Endpoints:
- Cités universitaires
- Chambres/lits
- Réservations
- Maintenance

### 7. Transport Module (Priorité: Haute)

**Fichier**: `apps/api/src/modules/transport/transport.routes.ts`

Endpoints:
- Véhicules (CRUD)
- Missions
- Maintenances
- Conducteurs

### 8. Reports Module (Priorité: Basse)

**Fichier**: `apps/api/src/modules/reports/reports.routes.ts`

Endpoints:
- Génération rapports
- Export (PDF, Excel)
- Rapports programmés

### 9. Workflows Module (Priorité: Basse)

**Fichier**: `apps/api/src/modules/workflows/workflow.routes.ts`

Endpoints:
- Définitions de workflows
- Instances de workflow
- Approbations
- Historique

### 10. Notifications Module (Priorité: Basse)

**Fichier**: `apps/api/src/modules/notifications/notifications.routes.ts`

Endpoints:
- Liste notifications
- Marquer lu/non-lu
- Préférences notifications

---

## 🔄 Schémas Réutilisables

### Déjà Disponibles

Ces schémas sont définis dans `swagger.config.ts` et réutilisables:

```yaml
# Réponses
$ref: '#/components/responses/UnauthorizedError'    # 401
$ref: '#/components/responses/ForbiddenError'       # 403
$ref: '#/components/responses/NotFoundError'        # 404
$ref: '#/components/responses/ValidationError'      # 400
$ref: '#/components/responses/ServerError'          # 500

# Schémas
$ref: '#/components/schemas/Error'
$ref: '#/components/schemas/Success'
$ref: '#/components/schemas/Pagination'

# Paramètres
$ref: '#/components/parameters/PageParam'
$ref: '#/components/parameters/LimitParam'
$ref: '#/components/parameters/SearchParam'
$ref: '#/components/parameters/TenantIdParam'
```

### À Ajouter

Pour faciliter la documentation, ajouter ces schémas réutilisables:

```typescript
// Dans swagger.config.ts, section schemas
User: {
  type: 'object',
  properties: {
    id: { type: 'string', format: 'uuid' },
    email: { type: 'string', format: 'email' },
    firstName: { type: 'string' },
    lastName: { type: 'string' },
    role: { $ref: '#/components/schemas/Role' },
    tenant: { $ref: '#/components/schemas/Tenant' }
  }
},
Role: {
  type: 'object',
  properties: {
    id: { type: 'string', format: 'uuid' },
    name: { type: 'string' },
    level: { type: 'number' },
    permissions: {
      type: 'array',
      items: { $ref: '#/components/schemas/Permission' }
    }
  }
},
Tenant: {
  type: 'object',
  properties: {
    id: { type: 'string', format: 'uuid' },
    name: { type: 'string' },
    type: { type: 'string', enum: ['ministere', 'crou'] }
  }
}
```

---

## 📖 Best Practices

### 1. Tags

Toujours utiliser les tags définis dans `swagger.config.ts`:

```typescript
tags: [Auth]           // Authentification
tags: [Dashboard]      // Dashboard
tags: [Admin - Users]  // Administration - Users
tags: [Financial]      // Module financier
tags: [Stocks]         // Stocks
tags: [Housing]        // Logement
tags: [Transport]      // Transport
tags: [Reports]        // Rapports
tags: [Workflows]      // Workflows
tags: [Notifications]  // Notifications
```

### 2. Sécurité

**Endpoints publics** (login, health):
```yaml
security: []  # Désactive l'auth JWT
```

**Endpoints protégés**:
```yaml
security:
  - BearerAuth: []
```

### 3. Exemples

Toujours fournir des exemples réalistes:

```yaml
example: admin@crou.ne           # Email
example: Admin@2025!             # Password
example: "2024-01-15"            # Date
example: 1000000                 # Montant en FCFA
```

### 4. Validation

Documenter les contraintes de validation:

```yaml
email:
  type: string
  format: email
  minLength: 5
  maxLength: 100
  example: user@crou.ne

amount:
  type: number
  minimum: 0
  maximum: 999999999
  example: 500000
```

### 5. Réponses

Toujours documenter au minimum:
- `200/201` - Succès
- `400` - Validation error
- `401` - Non authentifié
- `403` - Non autorisé (permissions)
- `404` - Ressource non trouvée
- `500` - Erreur serveur

---

## 🚀 Workflow de Documentation

### Étape 1: Lire le fichier routes

```bash
code apps/api/src/modules/[module]/[module].routes.ts
```

### Étape 2: Identifier les endpoints

Lister tous les `router.get()`, `router.post()`, etc.

### Étape 3: Copier le template approprié

Utiliser les templates ci-dessus selon le type d'endpoint.

### Étape 4: Personnaliser

- Remplacer les chemins
- Ajouter les paramètres spécifiques
- Définir les schémas request/response
- Ajouter des exemples

### Étape 5: Tester

```bash
# Relancer le serveur
pnpm dev

# Ouvrir Swagger UI
http://localhost:3001/api-docs

# Vérifier que l'endpoint apparaît
# Tester avec "Try it out"
```

---

## 📈 Priorités de Documentation

### Priorité 1 (Urgent) ✅
- [x] Auth (4 endpoints) - **Complet**
- [ ] Dashboard (7 endpoints)
- [ ] Admin - Users (10 endpoints)
- [ ] Transport (10 endpoints) - **Nécessaire pour frontend**

### Priorité 2 (Haute)
- [ ] Financial (10 endpoints)
- [ ] Stocks (10 endpoints)
- [ ] Housing (10 endpoints)

### Priorité 3 (Moyenne)
- [ ] Admin - Roles (5 endpoints)
- [ ] Admin - Tenants (5 endpoints)
- [ ] Admin - Security (5 endpoints)

### Priorité 4 (Basse)
- [ ] Reports (5 endpoints)
- [ ] Workflows (8 endpoints)
- [ ] Notifications (5 endpoints)

---

## 🔗 Ressources

### Documentation OpenAPI
- [OpenAPI 3.0 Specification](https://swagger.io/specification/)
- [Swagger UI Documentation](https://swagger.io/tools/swagger-ui/)
- [swagger-jsdoc Documentation](https://github.com/Surnet/swagger-jsdoc)

### Exemples
- **Fichier de référence**: `apps/api/src/modules/auth/auth.routes.ts`
- **Configuration**: `apps/api/src/config/swagger.config.ts`

---

## ✅ Checklist pour Chaque Module

- [ ] Tous les endpoints ont une annotation `@swagger`
- [ ] Les tags sont corrects
- [ ] Les exemples sont fournis
- [ ] Les réponses d'erreur sont documentées
- [ ] Les paramètres sont validés
- [ ] L'authentification est spécifiée
- [ ] Testé dans Swagger UI

---

**Maintenu par**: Équipe CROU
**Dernière mise à jour**: 31 Octobre 2025

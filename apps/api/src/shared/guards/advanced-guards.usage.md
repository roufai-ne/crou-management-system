# Guide d'Utilisation des Guards et Décorateurs RBAC Avancés

## Vue d'Ensemble

Ce guide présente l'utilisation des guards et décorateurs RBAC avancés pour la tâche 5.2. Ces outils permettent une gestion granulaire des permissions avec des conditions dynamiques et une validation contextuelle.

## Architecture

```
Guards Spécialisés ──┐
                    ├── requireFinancialOperation()
                    ├── requireAdminOperation()
                    └── requireCrossTenantOperation()

Décorateurs Avancés ──┐
                     ├── @RequirePermission()
                     ├── @RequireAllPermissions()
                     ├── @RequireAnyPermission()
                     ├── @RequireConditions()
                     └── @RequireFinancialApproval()

Middleware Processeur ──┐
                       ├── processPermissionDecorators()
                       ├── enablePermissionLogging()
                       └── processPublicDecorators()
```

## 1. Guards Spécialisés

### 1.1 Guard Financier Avancé

```typescript
import { requireFinancialOperation } from '@/shared/guards/specialized.guards';

// Validation avec montant maximum
router.post('/budgets',
  authenticateJWT,
  requireFinancialOperation('write', {
    maxAmount: 5000000, // 5M FCFA max
    operationTypes: ['budget', 'depense', 'recette'],
    customValidator: async (req) => {
      // Validation personnalisée
      const { operationType, montant } = req.body;
      
      if (operationType === 'depense' && montant > 1000000) {
        // Vérifier si c'est un jour ouvrable
        const now = new Date();
        const dayOfWeek = now.getDay();
        return dayOfWeek >= 1 && dayOfWeek <= 5;
      }
      
      return true;
    }
  }),
  controller.createBudget
);
```

### 1.2 Guard Administration Renforcé

```typescript
import { requireAdminOperation } from '@/shared/guards/specialized.guards';

// Opération sensible avec audit
router.delete('/users/:id',
  authenticateJWT,
  requireAdminOperation('delete', {
    sensitiveOperation: true,
    requireAuditLog: true,
    targetUserValidation: true
  }),
  controller.deleteUser
);
```

### 1.3 Guard Cross-Tenant

```typescript
import { requireCrossTenantOperation } from '@/shared/guards/specialized.guards';

// Accès cross-tenant (ministère uniquement)
router.get('/tenants/:tenantId/reports',
  authenticateJWT,
  requireCrossTenantOperation('reports', 'read'),
  controller.getCrossTenantReports
);
```

## 2. Décorateurs Avancés

### 2.1 Décorateurs de Base

```typescript
import {
  RequirePermission,
  RequireAllPermissions,
  RequireAnyPermission,
  RequireConditions
} from '@/shared/decorators/permissions.decorator';

class FinancialController {
  // Permission simple
  @RequirePermission('financial', 'read')
  static async getBudgets(req: Request, res: Response) {
    // Logique métier
  }

  // Permissions multiples (ET logique)
  @RequireAllPermissions(
    { resource: 'financial', action: 'validate' },
    { resource: 'admin', action: 'read' }
  )
  static async approveBudget(req: Request, res: Response) {
    // Logique d'approbation
  }

  // Permissions multiples (OU logique)
  @RequireAnyPermission(
    { resource: 'financial', action: 'export' },
    { resource: 'reports', action: 'export' },
    { resource: 'admin', action: 'read' }
  )
  static async exportData(req: Request, res: Response) {
    // Logique d'export
  }
}
```

### 2.2 Décorateurs avec Conditions

```typescript
import { RequireConditions, RequireFinancialApproval } from '@/shared/decorators/permissions.decorator';

class AdvancedController {
  // Conditions personnalisées
  @RequireConditions(
    {
      field: 'body.montant',
      operator: 'gte',
      value: 1000000,
      message: 'Seuls les budgets >= 1M FCFA nécessitent une approbation'
    },
    {
      field: 'body.justification',
      operator: 'exists',
      message: 'Une justification est requise'
    }
  )
  static async processLargeAmount(req: Request, res: Response) {
    // Logique pour gros montants
  }

  // Approbation financière avec seuil
  @RequireFinancialApproval(10000000) // 10M FCFA
  static async createLargeBudget(req: Request, res: Response) {
    // Logique pour gros budgets
  }
}
```

### 2.3 Décorateurs Spécialisés

```typescript
import {
  RequireFinancialPermission,
  RequireCrossTenantAccess,
  RequireSensitiveOperation
} from '@/shared/decorators/permissions.decorator';

class SpecializedController {
  // Permission financière spécialisée
  @RequireFinancialPermission('write', [
    {
      field: 'body.amount',
      operator: 'lte',
      value: 5000000,
      message: 'Montant trop élevé pour cette opération'
    }
  ])
  static async createTransaction(req: Request, res: Response) {
    // Logique de transaction
  }

  // Accès cross-tenant
  @RequireCrossTenantAccess()
  static async accessOtherTenant(req: Request, res: Response) {
    // Logique cross-tenant
  }

  // Opération ultra-sensible
  @RequireSensitiveOperation()
  static async sensitiveOperation(req: Request, res: Response) {
    // Logique sensible
  }
}
```

## 3. Middleware de Traitement

### 3.1 Configuration de Base

```typescript
import { processPermissionDecorators } from '@/shared/middlewares/decorator-processor.middleware';

// Traitement standard
router.get('/data',
  authenticateJWT,
  processPermissionDecorators(),
  controller.getData
);

// Avec logging activé
router.post('/sensitive-data',
  authenticateJWT,
  processPermissionDecorators({ 
    logAccess: true,
    auditSensitive: true 
  }),
  controller.createSensitiveData
);
```

### 3.2 Middleware Pré-configurés

```typescript
import { 
  enablePermissionLogging,
  processPublicDecorators 
} from '@/shared/middlewares/decorator-processor.middleware';

// Logging automatique
router.use('/admin/*', enablePermissionLogging);

// Routes publiques
router.get('/public-info',
  processPublicDecorators,
  controller.getPublicInfo
);
```

## 4. Opérateurs de Conditions

### 4.1 Opérateurs Disponibles

```typescript
// Égalité
{ field: 'body.type', operator: 'eq', value: 'budget' }

// Inclusion dans liste
{ field: 'body.status', operator: 'in', value: ['active', 'pending'] }

// Comparaisons numériques
{ field: 'body.amount', operator: 'gt', value: 1000000 }
{ field: 'body.amount', operator: 'lte', value: 5000000 }

// Contient (chaînes)
{ field: 'body.description', operator: 'contains', value: 'urgent' }

// Existence
{ field: 'body.justification', operator: 'exists' }
```

### 4.2 Champs Spéciaux

```typescript
// Champs système
{ field: 'userId', operator: 'eq', value: 'specific-user-id' }
{ field: 'tenantId', operator: 'eq', value: 'ministere' }
{ field: 'method', operator: 'eq', value: 'POST' }
{ field: 'ip', operator: 'contains', value: '192.168.' }

// Données de requête
{ field: 'body.field', operator: 'exists' }
{ field: 'query.param', operator: 'eq', value: 'value' }
{ field: 'params.id', operator: 'exists' }
```

## 5. Exemples Complets

### 5.1 Contrôleur Financier Complet

```typescript
import { Router } from 'express';
import { authenticateJWT } from '@/shared/middlewares/auth.middleware';
import { requireFinancialOperation } from '@/shared/guards/specialized.guards';
import {
  RequireFinancialPermission,
  RequireFinancialApproval,
  RequireAllPermissions,
  RequireConditions
} from '@/shared/decorators/permissions.decorator';
import { processPermissionDecorators } from '@/shared/middlewares/decorator-processor.middleware';

const router = Router();

class FinancialController {
  @RequireFinancialPermission('read')
  static async getBudgets(req: Request, res: Response) {
    // Lecture des budgets
  }

  @RequireFinancialApproval(10000000)
  static async createBudget(req: Request, res: Response) {
    // Création avec validation de montant
  }

  @RequireAllPermissions(
    { resource: 'financial', action: 'validate' },
    { resource: 'admin', action: 'read' }
  )
  @RequireConditions(
    {
      field: 'body.montant',
      operator: 'gte',
      value: 1000000,
      message: 'Seuls les budgets >= 1M FCFA nécessitent une approbation'
    }
  )
  static async approveBudget(req: Request, res: Response) {
    // Approbation avec conditions
  }
}

// Routes avec décorateurs
router.get('/budgets',
  authenticateJWT,
  processPermissionDecorators({ logAccess: true }),
  FinancialController.getBudgets
);

router.post('/budgets',
  authenticateJWT,
  processPermissionDecorators({ auditSensitive: true }),
  FinancialController.createBudget
);

// Routes avec guards traditionnels
router.post('/operations',
  authenticateJWT,
  requireFinancialOperation('write', {
    maxAmount: 5000000,
    operationTypes: ['budget', 'depense'],
    customValidator: async (req) => {
      // Validation métier personnalisée
      return req.body.operationType !== 'depense' || req.body.montant <= 2000000;
    }
  }),
  async (req, res) => {
    // Logique d'opération
  }
);

export { router as financialRouter };
```

## 6. Gestion des Erreurs

### 6.1 Codes de Retour

- `401` - Non authentifié
- `403` - Permission insuffisante
- `403` - Conditions non satisfaites
- `403` - Accès cross-tenant refusé
- `400` - Validation métier échouée
- `500` - Erreur système

### 6.2 Format des Erreurs

```json
{
  "error": "Accès refusé",
  "message": "Permission insuffisante: financial:validate",
  "requiredPermission": "financial:validate"
}

{
  "error": "Conditions non satisfaites",
  "message": "Seuls les budgets >= 1M FCFA nécessitent une approbation"
}

{
  "error": "Montant trop élevé",
  "message": "Montant de 15000000 FCFA dépasse la limite autorisée de 10000000 FCFA",
  "requiredPermission": "financial:validate"
}
```

## 7. Bonnes Pratiques

### 7.1 Choix entre Guards et Décorateurs

**Utilisez les Guards quand :**
- Logique de validation complexe
- Conditions métier dynamiques
- Validation cross-cutting concerns
- Réutilisation sur plusieurs routes

**Utilisez les Décorateurs quand :**
- Permissions statiques simples
- Conditions déclaratives
- Métadonnées de classe/méthode
- Documentation auto-générée

### 7.2 Performance

```typescript
// ✅ Bon : Conditions simples
@RequireConditions(
  { field: 'body.amount', operator: 'lte', value: 1000000 }
)

// ❌ Éviter : Logique complexe dans les conditions
// Utilisez plutôt un guard avec customValidator
```

### 7.3 Sécurité

```typescript
// ✅ Bon : Validation des données sensibles
@RequireAllPermissions(
  { resource: 'admin', action: 'write' },
  { resource: 'audit', action: 'read' }
)
@RequireConditions(
  { field: 'body.targetUserId', operator: 'exists' }
)

// ✅ Bon : Audit des opérations sensibles
router.delete('/users/:id',
  authenticateJWT,
  processPermissionDecorators({ 
    logAccess: true, 
    auditSensitive: true 
  }),
  controller.deleteUser
);
```

## 8. Migration et Compatibilité

### 8.1 Migration Progressive

```typescript
// Étape 1 : Garder les anciens guards
router.get('/data',
  authenticateJWT,
  checkPermissions(['financial:read']), // Ancien
  controller.getData
);

// Étape 2 : Ajouter les nouveaux en parallèle
router.get('/data',
  authenticateJWT,
  checkPermissions(['financial:read']), // Ancien
  processPermissionDecorators(), // Nouveau
  controller.getData
);

// Étape 3 : Remplacer complètement
router.get('/data',
  authenticateJWT,
  processPermissionDecorators(), // Nouveau uniquement
  controller.getData
);
```

### 8.2 Tests

```typescript
// Test des décorateurs
describe('FinancialController', () => {
  it('should require financial permission for getBudgets', async () => {
    const req = mockRequest({ user: { permissions: [] } });
    const res = mockResponse();
    
    await processPermissionDecorators()(req, res, jest.fn());
    
    expect(res.status).toHaveBeenCalledWith(403);
  });
});
```

Ce système offre une flexibilité maximale pour gérer les permissions avec des conditions dynamiques tout en maintenant la lisibilité et la maintenabilité du code.
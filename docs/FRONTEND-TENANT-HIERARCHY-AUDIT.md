# 🔍 AUDIT COMPLET - GESTION MULTI-TENANT & HIÉRARCHIE
## Système CROU Management - Isolation et Visualisation par Tenant

**Date:** 1 Décembre 2025  
**Contexte:** Revue complète de l'isolation multi-tenant avec hiérarchie à 3 niveaux  
**Objectif:** S'assurer que toutes les données sont filtrées par tenant + permettre aux admins de filtrer

---

## 📋 RÉSUMÉ EXÉCUTIF

### ✅ Points Forts Identifiés

1. **Architecture Multi-Tenant Robuste**
   - Service `MultiTenantService` complet avec isolation automatique
   - Middleware `tenant-isolation.middleware` avec support hiérarchique
   - Service `TenantHierarchyService` pour la gestion de la hiérarchie à 3 niveaux

2. **Hiérarchie à 3 Niveaux Implémentée**
   - Niveau 0: **Ministère** (accès global)
   - Niveau 1: **CROU** (accès régional)
   - Niveau 2: **Services** (accès opérationnel)
   - Support du path matérialisé pour requêtes efficaces

3. **Permissions RBAC**
   - 8 rôles définis avec permissions granulaires
   - Support des accès cross-tenant pour le Ministère

### ⚠️ Problèmes Majeurs Identifiés

1. **❌ Middlewares pas appliqués systématiquement**
   - Certains controllers n'utilisent pas `injectTenantIdMiddleware`
   - Filtrage manuel du `tenantId` au lieu d'utiliser les middlewares

2. **❌ Frontend: Filtres tenant absents**
   - Pas de composant `TenantSelector` global
   - Pas de filtrage par tenant dans la plupart des modules
   - Admins ne peuvent pas changer de contexte tenant

3. **❌ Incohérences dans le filtrage**
   - Certains modules filtrent, d'autres non
   - Pas de pattern uniforme pour l'isolation

4. **❌ Visualisation admin limitée**
   - Pas de vue consolidée multi-tenant pour les admins
   - Impossible de voir les données de tous les CROU depuis le Ministère

---

## 🏗️ ARCHITECTURE ACTUELLE

### Backend - Services & Middlewares

#### ✅ Services Multi-Tenant Existants

**1. MultiTenantService** (`apps/api/src/shared/services/multi-tenant.service.ts`)
```typescript
✅ getTenantContext(userId) - Récupère le contexte tenant d'un utilisateur
✅ validateTenantAccess() - Valide l'accès cross-tenant
✅ applyTenantFilter() - Applique le filtre tenant aux QueryBuilder
✅ createTenantRepository() - Repository avec isolation automatique
✅ getAccessibleTenants() - Liste des tenants accessibles
✅ injectTenantId() - Injection automatique du tenant_id
```

**2. TenantHierarchyService** (`apps/api/src/modules/tenants/tenant-hierarchy.service.ts`)
```typescript
✅ getDescendants(tenantId) - Récupère tous les descendants
✅ getAncestors(tenantId) - Récupère tous les ancêtres
✅ getAccessScope(tenantId) - Calcule le scope d'accès
✅ canAccessTenant(source, target) - Vérifie l'accès hiérarchique
✅ getHierarchyTree(rootId) - Arbre hiérarchique complet
✅ getMinistere() - Récupère le tenant Ministère
✅ getAllCROUs() - Liste de tous les CROU
✅ getServicesOfCROU(crouId) - Services d'un CROU
```

**3. Middlewares d'Isolation** (`apps/api/src/shared/middlewares/tenant-isolation.middleware.ts`)
```typescript
✅ injectTenantIdMiddleware() - Injection automatique du tenant_id
✅ validateCrossTenantMiddleware() - Validation cross-tenant
✅ ministerialAccessMiddleware() - Accès étendu pour le Ministère
✅ autoTenantFilterMiddleware() - Filtrage automatique
✅ fullTenantIsolationMiddleware() - Isolation complète (combiné)

// Pré-configurés:
✅ strictTenantIsolation - Isolation stricte
✅ flexibleTenantIsolation - Isolation flexible
✅ ministerialTenantAccess - Accès ministériel
```

#### Utilisation Actuelle des Middlewares (par module)

| Module | Middleware Appliqué | Filtrage Manuel | Status |
|--------|---------------------|-----------------|--------|
| **Admin** (stats) | ✅ `injectTenantIdMiddleware` | ✅ Filtrage conditionnel | ✅ BON |
| **Admin** (tenants) | ❌ Aucun | ❌ Pas de filtrage | ⚠️ À CORRIGER |
| **Admin** (users) | ❌ Aucun | ❌ Pas de filtrage | ⚠️ À CORRIGER |
| **Financial** | ❌ Aucun | ✅ Filtrage manuel | ⚠️ AMÉLIORER |
| **Stocks** | ❌ Aucun | ✅ Filtrage manuel | ⚠️ AMÉLIORER |
| **Housing** | ✅ `injectTenantIdMiddleware` | ✅ Utilise `TenantIsolationUtils` | ✅ BON |
| **Transport** | ❌ Aucun | ✅ Filtrage manuel | ⚠️ AMÉLIORER |
| **Dashboard** | ❌ Aucun | ✅ Filtrage manuel | ⚠️ AMÉLIORER |
| **Workflows** | ❌ Aucun | ❓ Non vérifié | ⚠️ À AUDITER |
| **Notifications** | ❌ Aucun | ❓ Non vérifié | ⚠️ À AUDITER |
| **Reports** | ❌ Aucun | ❓ Non vérifié | ⚠️ À AUDITER |
| **Procurement** | ❌ Aucun | ❓ Non vérifié | ⚠️ À AUDITER |
| **Restauration** | ❓ Module absent | ❓ Non vérifié | ❌ À CRÉER |

### Frontend - Stores & Services

#### ✅ Store Auth (`apps/web/src/stores/auth.ts`)
```typescript
✅ Support de la hiérarchie à 3 niveaux (HierarchyLevel)
✅ Métadonnées tenant (tenantId, tenantType, tenantName, tenantPath)
✅ Identifiants hiérarchiques (ministryId, regionId, crouId)
✅ Méthodes de vérification:
   - getHierarchyLevel()
   - isMinistryLevel()
   - isRegionLevel()
   - isCrouLevel()
   - canAccessLevel(level)
   - canManageTenant(tenantId, level)
```

#### ❌ Composants Manquants

**1. TenantSelector**
```typescript
// MANQUANT - À CRÉER
// Composant pour sélectionner le tenant (pour les admins)
<TenantSelector 
  currentTenantId={tenantId}
  onChange={handleTenantChange}
  showHierarchy={true}
  allowedLevels={['ministry', 'region', 'crou']}
/>
```

**2. TenantFilter**
```typescript
// MANQUANT - À CRÉER
// Filtre tenant pour les listes de données
<TenantFilter 
  value={selectedTenantId}
  onChange={setSelectedTenantId}
  showAllOption={isMinistry}
/>
```

**3. TenantBreadcrumb**
```typescript
// MANQUANT - À CRÉER
// Fil d'Ariane de la hiérarchie tenant
<TenantBreadcrumb 
  tenantId={currentTenantId}
  showPath={true}
/>
```

---

## 🔍 AUDIT PAR MODULE

### MODULE 1: Admin - Statistiques ✅ BON

**Fichier:** `apps/api/src/modules/admin/stats.controller.ts`

**✅ Points Positifs:**
- Utilise `injectTenantIdMiddleware` sur tous les endpoints
- Filtrage conditionnel basé sur `hasExtendedAccess`
- Utilise `TenantIsolationUtils.extractTenantContext()`
- Support des accès ministériels (voir toutes les données)

**Code Exemple (getSystemStats):**
```typescript
router.get('/stats/system',
  authenticateJWT,
  checkPermissions(['admin:read']),
  injectTenantIdMiddleware({ strictMode: false }),
  async (req: TypedRequest, res: Response) => {
    const tenantContext = TenantIsolationUtils.extractTenantContext(req);
    const hasExtendedAccess = TenantIsolationUtils.hasExtendedAccess(req);

    // Filtrage conditionnel
    if (!hasExtendedAccess && tenantContext) {
      userQuery = userQuery.where('user.tenantId = :tenantId', { 
        tenantId: tenantContext.tenantId 
      });
    }
  }
);
```

**🎯 Recommandations:**
- ✅ Aucune modification nécessaire
- ✅ Pattern à réutiliser dans les autres modules

---

### MODULE 2: Admin - Tenants ⚠️ À CORRIGER

**Fichier:** `apps/api/src/modules/admin/tenants.controller.ts`

**❌ Problèmes:**
- Pas de middleware d'isolation tenant
- Accès direct au repository sans filtrage
- Pas de vérification des permissions cross-tenant

**Code Actuel (problématique):**
```typescript
router.get('/tenants/:id',
  authenticateJWT,
  checkPermissions(['admin:tenants:read']),
  async (req: TypedRequest, res: Response) => {
    const tenantId = req.params.id;
    const tenant = await tenantRepository.findOne({
      where: { id: tenantId }
    });
    // ❌ Pas de vérification si l'utilisateur peut accéder à ce tenant
  }
);
```

**🔧 Corrections Nécessaires:**

1. **Ajouter le middleware d'isolation**
```typescript
router.get('/tenants/:id',
  authenticateJWT,
  checkPermissions(['admin:tenants:read']),
  injectTenantIdMiddleware({ strictMode: false }), // ✅ AJOUTER
  async (req: TypedRequest, res: Response) => {
    const tenantId = req.params.id;
    const tenantContext = TenantIsolationUtils.extractTenantContext(req);
    
    // ✅ Vérifier l'accès hiérarchique
    const canAccess = await tenantHierarchyService.canAccessTenant(
      tenantContext.tenantId,
      tenantId
    );
    
    if (!canAccess) {
      return res.status(403).json({
        success: false,
        error: 'Accès refusé à ce tenant'
      });
    }
    
    const tenant = await tenantRepository.findOne({
      where: { id: tenantId }
    });
  }
);
```

2. **Liste des tenants - filtrer par scope**
```typescript
router.get('/tenants',
  authenticateJWT,
  checkPermissions(['admin:tenants:read']),
  injectTenantIdMiddleware({ strictMode: false }), // ✅ AJOUTER
  async (req: TypedRequest, res: Response) => {
    const tenantContext = TenantIsolationUtils.extractTenantContext(req);
    const hasExtendedAccess = TenantIsolationUtils.hasExtendedAccess(req);
    
    let query = tenantRepository.createQueryBuilder('tenant');
    
    // ✅ Filtrer selon le scope
    if (!hasExtendedAccess && tenantContext) {
      const accessScope = await tenantHierarchyService.getAccessScope(
        tenantContext.tenantId
      );
      query = query.where('tenant.id IN (:...ids)', {
        ids: accessScope.accessibleTenantIds
      });
    }
    
    const tenants = await query.getMany();
    res.json({ success: true, data: { tenants } });
  }
);
```

---

### MODULE 3: Admin - Users ⚠️ À CORRIGER

**Fichier:** `apps/api/src/modules/admin/UsersPage.tsx` (Frontend)

**❌ Problèmes:**
- Pas de filtre tenant dans l'interface
- Affiche tous les utilisateurs sans filtrage par défaut
- Admins ne peuvent pas filtrer par CROU

**🔧 Corrections Nécessaires:**

1. **Ajouter un filtre tenant**
```tsx
// ✅ AJOUTER dans le composant UsersPage
const [selectedTenantId, setSelectedTenantId] = useState<string | 'all'>('current');
const { user } = useAuth();
const isMinistry = user?.hierarchyLevel === 'ministry';

// Composant de filtre
<div className="flex gap-4 items-center">
  <Select
    label="Filtrer par tenant"
    value={selectedTenantId}
    onChange={(value) => setSelectedTenantId(value)}
  >
    <option value="current">Mon tenant</option>
    {isMinistry && <option value="all">Tous les tenants</option>}
    {accessibleTenants.map(tenant => (
      <option key={tenant.id} value={tenant.id}>
        {tenant.name}
      </option>
    ))}
  </Select>
</div>
```

2. **Backend - Filtrer les utilisateurs par tenant**
```typescript
// apps/api/src/modules/admin/users.controller.ts
router.get('/users',
  authenticateJWT,
  checkPermissions(['admin:users:read']),
  injectTenantIdMiddleware({ strictMode: false }), // ✅ AJOUTER
  async (req: TypedRequest, res: Response) => {
    const tenantContext = TenantIsolationUtils.extractTenantContext(req);
    const hasExtendedAccess = TenantIsolationUtils.hasExtendedAccess(req);
    const targetTenantId = req.query.tenantId as string;
    
    let query = userRepository.createQueryBuilder('user')
      .leftJoinAndSelect('user.tenant', 'tenant')
      .leftJoinAndSelect('user.role', 'role');
    
    // ✅ Filtrage par tenant
    if (targetTenantId && targetTenantId !== 'all') {
      // Vérifier l'accès au tenant cible
      if (!hasExtendedAccess) {
        const canAccess = await tenantHierarchyService.canAccessTenant(
          tenantContext.tenantId,
          targetTenantId
        );
        if (!canAccess) {
          return res.status(403).json({
            success: false,
            error: 'Accès refusé à ce tenant'
          });
        }
      }
      query = query.where('user.tenantId = :tenantId', { tenantId: targetTenantId });
    } else if (!hasExtendedAccess) {
      // Limiter au scope accessible
      const accessScope = await tenantHierarchyService.getAccessScope(
        tenantContext.tenantId
      );
      query = query.where('user.tenantId IN (:...ids)', {
        ids: accessScope.accessibleTenantIds
      });
    }
    
    const users = await query.getMany();
    res.json({ success: true, data: { users } });
  }
);
```

---

### MODULE 4: Financial ⚠️ AMÉLIORER

**Fichier:** `apps/api/src/modules/financial/financial.controller.ts`

**⚠️ État Actuel:**
- Filtrage manuel du `tenantId` dans chaque méthode
- Pas de middleware d'isolation
- Code répétitif

**Code Actuel (problématique):**
```typescript
static async getBudgets(req: Request, res: Response) {
  const tenantId = (req as any).user?.tenantId; // ❌ Filtrage manuel
  if (!tenantId) {
    return res.status(401).json({ error: 'Tenant ID manquant' });
  }
  
  const { budgets, total } = await FinancialService.getBudgets(tenantId, filters);
  // ...
}
```

**🔧 Corrections Nécessaires:**

1. **Appliquer les middlewares**
```typescript
// Ajouter dans financial.routes.ts
import { 
  injectTenantIdMiddleware, 
  flexibleTenantIsolation 
} from '@/shared/middlewares/tenant-isolation.middleware';

router.get('/budgets',
  authenticateJWT,
  checkPermissions(['financial:read']),
  injectTenantIdMiddleware({ strictMode: false }), // ✅ AJOUTER
  FinancialController.getBudgets
);
```

2. **Simplifier le controller**
```typescript
static async getBudgets(req: TypedRequest, res: Response) {
  // ✅ Plus besoin de récupérer manuellement tenantId
  const tenantContext = TenantIsolationUtils.extractTenantContext(req);
  const hasExtendedAccess = TenantIsolationUtils.hasExtendedAccess(req);
  const targetTenantId = req.query.tenantId as string;
  
  // ✅ Déterminer le tenant à utiliser
  const effectiveTenantId = hasExtendedAccess && targetTenantId 
    ? targetTenantId 
    : tenantContext.tenantId;
  
  const { budgets, total } = await FinancialService.getBudgets(
    effectiveTenantId, 
    filters
  );
  // ...
}
```

3. **Frontend - Ajouter filtre tenant**
```tsx
// apps/web/src/pages/financial/BudgetsPage.tsx
const { user } = useAuth();
const isMinistry = user?.hierarchyLevel === 'ministry';
const [selectedTenantId, setSelectedTenantId] = useState<string>(
  user?.tenantId || ''
);

// ✅ AJOUTER dans l'UI
{isMinistry && (
  <TenantFilter 
    value={selectedTenantId}
    onChange={setSelectedTenantId}
    showAllOption={true}
  />
)}

// ✅ Passer dans la requête
const { data, isLoading } = useQuery({
  queryKey: ['budgets', selectedTenantId, filters],
  queryFn: () => financialService.getBudgets({
    ...filters,
    tenantId: selectedTenantId
  })
});
```

---

### MODULE 5: Stocks ⚠️ AMÉLIORER

**Fichier:** `apps/api/src/modules/stocks/stocks.controller.ts`

**⚠️ État Actuel:**
- Même problème que Financial
- Filtrage manuel du `tenantId`

**🔧 Corrections Nécessaires:**

**Identiques au module Financial:**
1. Ajouter `injectTenantIdMiddleware` aux routes
2. Utiliser `TenantIsolationUtils` dans le controller
3. Ajouter un composant `TenantFilter` dans le frontend

**Frontend - Code à ajouter:**
```tsx
// apps/web/src/pages/stocks/StocksPage.tsx
const { user } = useAuth();
const isMinistry = user?.hierarchyLevel === 'ministry';
const [selectedTenantId, setSelectedTenantId] = useState<string>(
  user?.tenantId || ''
);

// Dans la barre de filtres
<div className="flex gap-4">
  {isMinistry && (
    <Select
      label="Tenant"
      value={selectedTenantId}
      onChange={(value) => setSelectedTenantId(value)}
    >
      <option value="all">Tous les CROU</option>
      {accessibleTenants.map(tenant => (
        <option key={tenant.id} value={tenant.id}>
          {tenant.name}
        </option>
      ))}
    </Select>
  )}
  
  {/* Autres filtres */}
</div>
```

---

### MODULE 6: Housing ✅ BON

**Fichier:** `apps/api/src/modules/housing/housing.controller.ts`

**✅ Points Positifs:**
- Utilise `injectTenantIdMiddleware`
- Utilise `TenantIsolationUtils` pour le filtrage
- Pattern correct pour l'isolation

**Code Exemple:**
```typescript
router.get('/',
  authenticateJWT,
  checkPermissions(['housing:read']),
  injectTenantIdMiddleware({ strictMode: false }),
  async (req: TypedRequest, res: Response) => {
    const tenantContext = TenantIsolationUtils.extractTenantContext(req);
    const hasExtendedAccess = TenantIsolationUtils.hasExtendedAccess(req);
    
    // ✅ Filtrage correct
    // ...
  }
);
```

**🎯 Recommandations:**
- ✅ Aucune modification backend nécessaire
- ⚠️ Frontend: Ajouter un filtre tenant pour les admins

---

### MODULE 7: Transport ⚠️ AMÉLIORER

**Fichier:** `apps/api/src/modules/transport/transport.controller.ts`

**⚠️ État Actuel:**
- Filtrage manuel du `tenantId`
- Pas de middleware

**🔧 Corrections Nécessaires:**
- Identiques aux modules Financial et Stocks

---

### MODULE 8: Dashboard ⚠️ AMÉLIORER

**Fichier:** `apps/api/src/modules/dashboard/dashboard.controller.ts`

**⚠️ État Actuel:**
- Filtrage manuel
- Pas de middleware

**🔧 Corrections Nécessaires:**

1. **Backend - Ajouter middleware**
```typescript
router.get('/kpis/global',
  authenticateJWT,
  checkPermissions(['dashboard:read']),
  injectTenantIdMiddleware({ strictMode: false }), // ✅ AJOUTER
  DashboardController.getGlobalKPIs
);
```

2. **Frontend - Ajouter sélecteur tenant**
```tsx
// apps/web/src/pages/dashboard/DashboardPage.tsx
const { user } = useAuth();
const isMinistry = user?.hierarchyLevel === 'ministry';
const [selectedTenantId, setSelectedTenantId] = useState<string>(
  user?.tenantId || ''
);

// ✅ Header avec sélecteur
<div className="flex justify-between items-center mb-6">
  <h1 className="text-2xl font-bold">Tableau de Bord</h1>
  
  {isMinistry && (
    <TenantSelector 
      value={selectedTenantId}
      onChange={setSelectedTenantId}
      showHierarchy={true}
    />
  )}
</div>

// ✅ KPIs avec tenant sélectionné
<KPICard 
  title="Budget Total"
  value={kpis.totalBudget}
  tenantId={selectedTenantId}
/>
```

---

### MODULE 9: Workflows ⚠️ À AUDITER

**Status:** Non audité dans le cadre de cette revue

**🔧 Actions Nécessaires:**
1. Auditer le code du module
2. Vérifier l'isolation tenant
3. Appliquer les corrections (pattern Financial/Stocks)

---

### MODULE 10: Notifications ⚠️ À AUDITER

**Status:** Non audité dans le cadre de cette revue

**🔧 Actions Nécessaires:**
1. Auditer le code du module
2. Vérifier l'isolation tenant
3. Appliquer les corrections

---

### MODULE 11: Reports ⚠️ À AUDITER

**Status:** Non audité dans le cadre de cette revue

**🔧 Actions Nécessaires:**
1. Auditer le code du module
2. Vérifier l'isolation tenant
3. Ajouter filtre tenant dans l'UI

---

### MODULE 12: Procurement ⚠️ À AUDITER

**Status:** Non audité dans le cadre de cette revue

**🔧 Actions Nécessaires:**
1. Auditer le code du module
2. Vérifier l'isolation tenant
3. Appliquer les corrections

---

### MODULE 13: Restauration ❌ À CRÉER

**Status:** Module absent (référencé dans `GUIDE_COORDINATION_AGENT.MD`)

**🔧 Actions Nécessaires:**
1. Créer le module selon le guide
2. Appliquer l'isolation tenant dès le début
3. Utiliser les middlewares standards

---

## 🛠️ COMPOSANTS RÉUTILISABLES À CRÉER

### 1. TenantSelector Component

**Fichier:** `apps/web/src/components/common/TenantSelector.tsx`

```tsx
/**
 * Composant de sélection de tenant avec hiérarchie
 * Usage: Pour les admins qui veulent changer de contexte
 */
import React, { useEffect, useState } from 'react';
import { useAuth } from '@/stores/auth';
import { tenantService } from '@/services/api/tenantService';

interface TenantSelectorProps {
  value: string;
  onChange: (tenantId: string) => void;
  showHierarchy?: boolean;
  allowedLevels?: ('ministry' | 'region' | 'crou')[];
  className?: string;
}

interface TenantOption {
  id: string;
  name: string;
  type: string;
  level: number;
  path: string;
}

export const TenantSelector: React.FC<TenantSelectorProps> = ({
  value,
  onChange,
  showHierarchy = false,
  allowedLevels,
  className = ''
}) => {
  const { user } = useAuth();
  const [tenants, setTenants] = useState<TenantOption[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAccessibleTenants = async () => {
      try {
        const response = await tenantService.getAccessibleTenants();
        setTenants(response.data.tenants);
      } catch (error) {
        console.error('Erreur chargement tenants:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAccessibleTenants();
  }, []);

  const filteredTenants = allowedLevels
    ? tenants.filter(t => allowedLevels.includes(t.type as any))
    : tenants;

  const getIndentation = (level: number) => {
    return '　'.repeat(level); // Espace insécable pour indentation
  };

  return (
    <div className={className}>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        Tenant
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={loading}
        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
      >
        <option value="current">
          {user?.tenantName || 'Mon tenant'}
        </option>
        
        {user?.hierarchyLevel === 'ministry' && (
          <option value="all">Tous les tenants</option>
        )}
        
        {filteredTenants.map((tenant) => (
          <option key={tenant.id} value={tenant.id}>
            {showHierarchy && getIndentation(tenant.level)}
            {tenant.name}
            {showHierarchy && ` (${tenant.type})`}
          </option>
        ))}
      </select>
    </div>
  );
};
```

### 2. TenantFilter Component

**Fichier:** `apps/web/src/components/common/TenantFilter.tsx`

```tsx
/**
 * Filtre tenant pour les listes
 * Usage: Dans les pages de listes (budgets, stocks, etc.)
 */
import React from 'react';
import { TenantSelector } from './TenantSelector';
import { useAuth } from '@/stores/auth';

interface TenantFilterProps {
  value: string;
  onChange: (tenantId: string) => void;
  showAllOption?: boolean;
  className?: string;
}

export const TenantFilter: React.FC<TenantFilterProps> = ({
  value,
  onChange,
  showAllOption = false,
  className = ''
}) => {
  const { user, isMinistryLevel } = useAuth();

  // Ne rien afficher si l'utilisateur n'est pas au niveau ministère
  if (!isMinistryLevel()) {
    return null;
  }

  return (
    <TenantSelector
      value={value}
      onChange={onChange}
      showHierarchy={true}
      className={className}
    />
  );
};
```

### 3. TenantBreadcrumb Component

**Fichier:** `apps/web/src/components/common/TenantBreadcrumb.tsx`

```tsx
/**
 * Fil d'Ariane hiérarchique du tenant
 * Usage: Afficher le chemin hiérarchique du tenant actuel
 */
import React, { useEffect, useState } from 'react';
import { ChevronRightIcon, HomeIcon } from '@heroicons/react/24/outline';
import { tenantService } from '@/services/api/tenantService';

interface TenantBreadcrumbProps {
  tenantId: string;
  showPath?: boolean;
  onNavigate?: (tenantId: string) => void;
}

interface BreadcrumbItem {
  id: string;
  name: string;
  type: string;
  level: number;
}

export const TenantBreadcrumb: React.FC<TenantBreadcrumbProps> = ({
  tenantId,
  showPath = true,
  onNavigate
}) => {
  const [breadcrumbs, setBreadcrumbs] = useState<BreadcrumbItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHierarchy = async () => {
      try {
        const response = await tenantService.getHierarchy(tenantId);
        setBreadcrumbs(response.data.ancestors);
      } catch (error) {
        console.error('Erreur chargement hiérarchie:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchHierarchy();
  }, [tenantId]);

  if (loading || !showPath) return null;

  return (
    <nav className="flex items-center space-x-2 text-sm text-gray-600">
      <HomeIcon className="h-4 w-4" />
      
      {breadcrumbs.map((item, index) => (
        <React.Fragment key={item.id}>
          <ChevronRightIcon className="h-4 w-4 text-gray-400" />
          <button
            onClick={() => onNavigate?.(item.id)}
            className={`hover:text-primary-600 ${
              index === breadcrumbs.length - 1 ? 'font-semibold' : ''
            }`}
          >
            {item.name}
          </button>
        </React.Fragment>
      ))}
    </nav>
  );
};
```

### 4. useTenantFilter Hook

**Fichier:** `apps/web/src/hooks/useTenantFilter.ts`

```tsx
/**
 * Hook pour gérer le filtrage par tenant
 * Usage: Dans toutes les pages de listes
 */
import { useState, useEffect } from 'react';
import { useAuth } from '@/stores/auth';

export const useTenantFilter = () => {
  const { user, isMinistryLevel } = useAuth();
  const [selectedTenantId, setSelectedTenantId] = useState<string>(
    user?.tenantId || ''
  );

  // Réinitialiser au tenant de l'utilisateur si changement
  useEffect(() => {
    if (user?.tenantId && !isMinistryLevel()) {
      setSelectedTenantId(user.tenantId);
    }
  }, [user?.tenantId, isMinistryLevel]);

  const effectiveTenantId = isMinistryLevel() && selectedTenantId !== 'current'
    ? selectedTenantId
    : user?.tenantId;

  return {
    selectedTenantId,
    setSelectedTenantId,
    effectiveTenantId,
    canFilterTenant: isMinistryLevel(),
    currentUserTenantId: user?.tenantId
  };
};
```

---

## 📊 PLAN D'ACTION PAR PRIORITÉ

### PRIORITÉ 1 - CRITIQUE (Semaine 1)

#### Backend: Uniformiser l'utilisation des middlewares

1. **Appliquer `injectTenantIdMiddleware` à tous les modules**
   - [ ] Financial (routes)
   - [ ] Stocks (routes)
   - [ ] Transport (routes)
   - [ ] Dashboard (routes)
   - [ ] Admin/Tenants (routes)
   - [ ] Admin/Users (routes)

2. **Refactoriser les controllers pour utiliser `TenantIsolationUtils`**
   - [ ] Financial controller
   - [ ] Stocks controller
   - [ ] Transport controller
   - [ ] Dashboard controller

3. **Ajouter la validation d'accès hiérarchique**
   - [ ] Admin/Tenants: Vérifier `canAccessTenant()`
   - [ ] Admin/Users: Filtrer par scope accessible

**Temps Estimé:** 2-3 jours

---

### PRIORITÉ 2 - IMPORTANT (Semaine 2)

#### Frontend: Créer les composants réutilisables

1. **Créer les composants de base**
   - [ ] `TenantSelector`
   - [ ] `TenantFilter`
   - [ ] `TenantBreadcrumb`
   - [ ] Hook `useTenantFilter`

2. **Créer le service API tenant**
   - [ ] `tenantService.getAccessibleTenants()`
   - [ ] `tenantService.getHierarchy(tenantId)`
   - [ ] `tenantService.getTenantById(id)`

**Temps Estimé:** 2-3 jours

---

### PRIORITÉ 3 - IMPORTANT (Semaine 2-3)

#### Frontend: Intégrer les filtres tenant dans les modules

1. **Module Financial**
   - [ ] Ajouter `TenantFilter` dans `BudgetsPage`
   - [ ] Ajouter `TenantFilter` dans `TransactionsPage`
   - [ ] Passer `selectedTenantId` dans les requêtes API

2. **Module Stocks**
   - [ ] Ajouter `TenantFilter` dans `StocksPage`
   - [ ] Ajouter `TenantFilter` dans `SuppliersPage`

3. **Module Housing**
   - [ ] Ajouter `TenantFilter` dans `HousingPage`
   - [ ] Ajouter `TenantFilter` dans `RoomsPage`

4. **Module Transport**
   - [ ] Ajouter `TenantFilter` dans `VehiclesPage`
   - [ ] Ajouter `TenantFilter` dans `MaintenancePage`

5. **Module Dashboard**
   - [ ] Ajouter `TenantSelector` dans le header
   - [ ] Mettre à jour les KPIs selon le tenant sélectionné

6. **Module Admin**
   - [ ] Ajouter `TenantFilter` dans `UsersPage`
   - [ ] Ajouter `TenantFilter` dans `AuditPage`

**Temps Estimé:** 3-4 jours

---

### PRIORITÉ 4 - MOYENNE (Semaine 3-4)

#### Auditer et corriger les modules restants

1. **Workflows**
   - [ ] Auditer le code
   - [ ] Appliquer middleware isolation
   - [ ] Ajouter filtres frontend

2. **Notifications**
   - [ ] Auditer le code
   - [ ] Appliquer middleware isolation
   - [ ] Filtrer par tenant

3. **Reports**
   - [ ] Auditer le code
   - [ ] Ajouter `TenantFilter`
   - [ ] Filtrer les rapports par tenant

4. **Procurement**
   - [ ] Auditer le code
   - [ ] Appliquer middleware isolation
   - [ ] Ajouter filtres frontend

**Temps Estimé:** 2-3 jours

---

### PRIORITÉ 5 - BASSE (Semaine 4+)

#### Améliorations UX

1. **Dashboard admin multi-tenant**
   - [ ] Vue consolidée tous tenants
   - [ ] Comparaison entre CROU
   - [ ] Graphiques agrégés

2. **Navigation hiérarchique**
   - [ ] Breadcrumb dans tous les modules
   - [ ] Navigation rapide entre tenants
   - [ ] Favoris tenants

3. **Documentation**
   - [ ] Guide d'utilisation filtres tenant
   - [ ] Documentation API
   - [ ] Guide développeur

**Temps Estimé:** 3-5 jours

---

## 📝 CHECKLIST DE VALIDATION

### Backend

- [ ] Tous les modules utilisent `injectTenantIdMiddleware`
- [ ] Tous les controllers utilisent `TenantIsolationUtils`
- [ ] La validation hiérarchique est appliquée partout
- [ ] Les tests d'isolation tenant passent
- [ ] Les endpoints retournent 403 pour les accès non autorisés

### Frontend

- [ ] Composants `TenantSelector`, `TenantFilter`, `TenantBreadcrumb` créés
- [ ] Hook `useTenantFilter` implémenté et testé
- [ ] Tous les modules principaux ont un filtre tenant
- [ ] Les admins peuvent filtrer par tenant
- [ ] Les utilisateurs CROU ne voient que leurs données
- [ ] La navigation hiérarchique fonctionne

### Tests

- [ ] Tests unitaires isolation tenant
- [ ] Tests d'intégration cross-tenant
- [ ] Tests E2E avec différents niveaux hiérarchiques
- [ ] Tests de permissions (Ministry → CROU → Service)

---

## 📚 RESSOURCES & RÉFÉRENCES

### Fichiers Clés

**Backend:**
- `apps/api/src/shared/services/multi-tenant.service.ts`
- `apps/api/src/modules/tenants/tenant-hierarchy.service.ts`
- `apps/api/src/shared/middlewares/tenant-isolation.middleware.ts`
- `apps/api/src/shared/utils/tenant-isolation.utils.ts`

**Frontend:**
- `apps/web/src/stores/auth.ts`
- `apps/web/src/hooks/` (à créer)
- `apps/web/src/components/common/` (à créer)

### Documentation

- `docs/GUIDE_COORDINATION_AGENT.MD` - Guide de coordination
- `docs/DEVELOPMENT-CHECK-COMPLETE.md` - État du développement
- `docs/FRONTEND-TENANT-HIERARCHY-AUDIT.md` - Ce document

---

## 🎯 MÉTRIQUES DE SUCCÈS

### Critères de Validation

1. **100% des modules utilisent l'isolation tenant**
   - ✅ Backend: Middlewares appliqués partout
   - ✅ Frontend: Filtres dans tous les modules

2. **Admins ministériels peuvent:**
   - ✅ Voir toutes les données de tous les CROU
   - ✅ Filtrer par CROU spécifique
   - ✅ Naviguer dans la hiérarchie

3. **Utilisateurs CROU ne voient que:**
   - ✅ Les données de leur CROU uniquement
   - ✅ Les données des services sous leur autorité (si niveau CROU)

4. **Tests de sécurité:**
   - ✅ Tentative d'accès cross-tenant non autorisée = 403
   - ✅ Pas de fuite de données entre tenants
   - ✅ Validation hiérarchique fonctionne

---

## 📧 CONTACT & SUPPORT

**Équipe Développement CROU**
- Pour questions techniques: [votre-email]
- Pour revue de code: [reviewer-email]
- Documentation: `docs/`

---

**Document généré le:** 1 Décembre 2025  
**Version:** 1.0  
**Auteur:** Claude Code Assistant  
**Status:** ⚠️ **EN COURS - Actions requises**

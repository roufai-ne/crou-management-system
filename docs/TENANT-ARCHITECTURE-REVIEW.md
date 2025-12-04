# 🏗️ REVUE COMPLÈTE - ARCHITECTURE MULTI-TENANT
## Analyse approfondie de la concordance Backend/Frontend

**Date:** 4 Décembre 2025
**Objectif:** Analyser la logique, les flux et l'architecture des modules avec utilisation des tenants
**Focus:** Identifier les incohérences entre backend et frontend

---

## 📊 RÉSUMÉ EXÉCUTIF

### Verdict Global
🟡 **ARCHITECTURE PARTIELLEMENT COHÉRENTE** - Nécessite uniformisation

| Aspect | Backend | Frontend | Concordance |
|--------|---------|----------|-------------|
| **Infrastructure tenant** | ✅ Excellente | ⚠️ Incomplète | 🟡 60% |
| **Middlewares d'isolation** | ✅ Robustes | ❌ Absents | 🔴 0% |
| **Services API** | ⚠️ Incohérents | ⚠️ Incohérents | 🟡 50% |
| **Filtrage des données** | ⚠️ Manuel | ❌ Absent | 🔴 20% |
| **Support hiérarchique** | ✅ Complet | ⚠️ Partiel | 🟡 70% |

---

## 🔍 ANALYSE BACKEND

### ✅ POINTS FORTS

#### 1. Infrastructure Multi-Tenant Robuste

**Middlewares d'isolation (apps/api/src/shared/middlewares/tenant-isolation.middleware.ts)**
```typescript
✅ injectTenantIdMiddleware()     // Injection automatique tenant_id
✅ validateCrossTenantMiddleware() // Validation accès cross-tenant
✅ ministerialAccessMiddleware()   // Accès étendu Ministère
✅ autoTenantFilterMiddleware()   // Filtrage automatique
✅ fullTenantIsolationMiddleware() // Isolation complète
```

**Service Multi-Tenant (apps/api/src/shared/services/multi-tenant.service.ts)**
```typescript
✅ getTenantContext()        // Récupère contexte utilisateur
✅ validateTenantAccess()    // Valide accès cross-tenant
✅ applyTenantFilter()       // Applique filtre QueryBuilder
✅ createTenantRepository()  // Repository avec isolation auto
✅ getAccessibleTenants()    // Liste tenants accessibles
```

**Support hiérarchique**
- Niveau 0: Ministère (accès global)
- Niveau 1: Région (accès descendants)
- Niveau 2: CROU (accès local uniquement)
- Validation automatique via `TenantHierarchyService`

#### 2. Capacités Avancées

- **Cache intelligent** avec TTL
- **Audit automatique** des accès cross-tenant
- **Filtrage réponse** automatique par tenant
- **Validation hiérarchique** intégrée
- **Repository wrapper** avec isolation auto

---

### ⚠️ INCOHÉRENCES BACKEND

#### 1. Utilisation Incohérente des Middlewares

**Modules AVEC middleware ✅**
```typescript
// Housing (✅ BON)
router.get('/',
  authenticateJWT,
  checkPermissions(['housing:read']),
  injectTenantIdMiddleware({ strictMode: false }), // ✅
  HousingController.getHousings
);

// Stocks (✅ PARTIEL - ajouté récemment)
router.get('/stocks',
  authenticateJWT,
  checkPermissions(['stocks:read']),
  injectTenantIdMiddleware({ strictMode: false }), // ✅
  StocksController.getStocks
);
```

**Modules SANS middleware ❌**
```typescript
// Financial (❌ MANQUE)
router.get('/budgets',
  authenticateJWT,
  checkPermissions(['financial:read']),
  // ❌ PAS DE MIDDLEWARE TENANT
  FinancialController.getBudgets
);

// Transport (❌ MANQUE)
router.get('/vehicles',
  authenticateJWT,
  checkPermissions(['transport:read']),
  // ❌ PAS DE MIDDLEWARE TENANT
  TransportController.getVehicles
);
```

#### 2. Filtrage Manuel vs Automatique

**Pattern actuel dans Stocks** (filtrage manuel répétitif):
```typescript
// stocks.controller.ts - RÉPÉTITIF ❌
static async getStocks(req: Request, res: Response) {
  const tenantId = req.user?.tenantId; // ❌ Manuel
  if (!tenantId) {
    return res.status(401).json({ error: 'Tenant ID manquant' });
  }

  const stocks = await StocksService.getStocks(tenantId, filters);
}

static async getMovements(req: Request, res: Response) {
  const tenantId = req.user?.tenantId; // ❌ Répété
  if (!tenantId) {
    return res.status(401).json({ error: 'Tenant ID manquant' });
  }

  const movements = await StocksService.getMovements(tenantId, filters);
}
```

**Pattern recommandé** (avec TenantIsolationUtils):
```typescript
// housing.controller.ts - PROPRE ✅
static async getHousings(req: TypedRequest, res: Response) {
  const tenantContext = TenantIsolationUtils.extractTenantContext(req); // ✅
  const hasExtendedAccess = TenantIsolationUtils.hasExtendedAccess(req); // ✅

  // Logique métier sans gestion manuelle du tenant
  const housings = await HousingService.getHousings(tenantContext, filters);
}
```

#### 3. Passage du tenantId aux Services

**❌ Stocks: Pattern ancien**
```typescript
// Passe tenantId à chaque méthode
static async getStocks(tenantId: string, filters?: StockFilters) {
  return stockRepo.find({ where: { tenantId } });
}

static async createStock(tenantId: string, userId: string, data: CreateStockDTO) {
  const stock = stockRepo.create({ ...data, tenantId }); // Manuel
  return await stockRepo.save(stock);
}
```

**✅ Housing: Pattern moderne**
```typescript
// Utilise TenantContext
static async getHousings(tenantContext: TenantContext, filters?: any) {
  const queryBuilder = housingRepo.createQueryBuilder('housing');

  // Filtre automatique via multiTenantService
  multiTenantService.applyTenantFilter(queryBuilder, tenantContext);

  return await queryBuilder.getMany();
}
```

---

## 🔍 ANALYSE FRONTEND

### ✅ POINTS FORTS

#### 1. Store Auth Complet

**apps/web/src/stores/auth.ts**
```typescript
✅ Support hiérarchie 3 niveaux (ministry, region, crou)
✅ Métadonnées tenant (tenantId, tenantType, tenantPath)
✅ Identifiants hiérarchiques (ministryId, regionId, crouId)
✅ Méthodes hiérarchiques:
   - isMinistryLevel()
   - isRegionLevel()
   - isCrouLevel()
   - canAccessLevel(level)
   - canManageTenant(tenantId, level)
   - hasExtendedAccess()
```

---

### ⚠️ INCOHÉRENCES FRONTEND

#### 1. Services API Incohérents

**❌ Financial Service - NE passe PAS tenantId**
```typescript
// apps/web/src/services/api/financialService.ts

async getBudgets(filters?: FinancialFilters): Promise<Budget[]> {
  const queryParams = new URLSearchParams();
  if (filters?.page) queryParams.append('page', filters.page.toString());
  if (filters?.limit) queryParams.append('limit', filters.limit.toString());
  // ❌ PAS DE tenantId dans les params

  const response = await apiClient.get(`/financial/budgets?${queryParams}`);
  return response.data;
}
```

**❌ Stocks Service - NE passe PAS tenantId**
```typescript
// apps/web/src/services/api/stocksService.ts

async getStockItems(params?: {
  page?: number;
  limit?: number;
  type?: string;
  category?: string;
}): Promise<{ items: StockItem[] }> {
  const queryParams = new URLSearchParams();
  if (params?.page) queryParams.append('page', params.page.toString());
  if (params?.limit) queryParams.append('limit', params.limit.toString());
  // ❌ PAS DE tenantId dans les params

  const response = await apiClient.get(`/stocks/stocks?${queryParams}`);
  return response.data;
}
```

**✅ Pattern attendu** (à implémenter):
```typescript
async getBudgets(filters?: FinancialFilters): Promise<Budget[]> {
  const queryParams = new URLSearchParams();

  // ✅ Ajouter tenantId si fourni (pour admins ministériels)
  if (filters?.tenantId) {
    queryParams.append('tenantId', filters.tenantId);
  }

  // Le backend utilise le middleware pour injecter le tenant par défaut
  const response = await apiClient.get(`/financial/budgets?${queryParams}`);
  return response.data;
}
```

#### 2. Composants UI Manquants

**❌ Filtres Tenant Absents**
```
Aucun composant TenantSelector trouvé
Aucun composant TenantFilter trouvé
Aucun hook useTenantFilter trouvé
```

**Impact:**
- Admins ministériels ne peuvent pas filtrer par CROU
- Impossible de visualiser données d'autres tenants
- Pas de navigation hiérarchique

#### 3. Pages Sans Filtre Tenant

**Modules affectés:**
```
❌ Financial - BudgetsPage.tsx (pas de filtre)
❌ Financial - TransactionsPage.tsx (pas de filtre)
❌ Stocks - StocksPage.tsx (pas de filtre)
❌ Stocks - SuppliersPage.tsx (pas de filtre)
❌ Transport - VehiclesPage.tsx (pas de filtre)
❌ Housing - HousingPage.tsx (pas de filtre)
❌ Dashboard - DashboardPage.tsx (pas de sélecteur)
```

---

## 🔄 FLUX ACTUELS vs FLUX ATTENDUS

### Scénario 1: Utilisateur CROU consulte ses budgets

**Flux ACTUEL ⚠️**
```
┌─────────────┐
│   Frontend  │
│ BudgetsPage │
└──────┬──────┘
       │ GET /financial/budgets (sans tenantId)
       │
┌──────▼──────┐
│   Backend   │
│  ❌ PAS DE  │
│  MIDDLEWARE │
└──────┬──────┘
       │ req.user.tenantId (manuel)
       │
┌──────▼──────┐
│ Controller  │
│ Filtrage    │
│ manuel      │
└──────┬──────┘
       │ tenantId passé manuellement
       │
┌──────▼──────┐
│  Service    │
│ WHERE       │
│ tenantId =  │
└──────┬──────┘
       │
       ▼
   Résultats filtrés
```

**Flux ATTENDU ✅**
```
┌─────────────┐
│   Frontend  │
│ BudgetsPage │
└──────┬──────┘
       │ GET /financial/budgets
       │
┌──────▼───────────────────┐
│   Backend                │
│ ✅ injectTenantIdMiddleware│
│   Injection auto         │
│   req.tenantContext      │
└──────┬───────────────────┘
       │
┌──────▼──────┐
│ Controller  │
│ Extract     │
│ context     │
└──────┬──────┘
       │ TenantContext
       │
┌──────▼──────┐
│  Service    │
│ applyTenant │
│ Filter()    │
└──────┬──────┘
       │
       ▼
   Résultats filtrés
```

### Scénario 2: Admin Ministère consulte budgets d'un CROU

**Flux ACTUEL ❌ (IMPOSSIBLE)**
```
┌─────────────┐
│   Frontend  │
│ BudgetsPage │
│ ❌ PAS DE   │
│ SÉLECTEUR   │
└─────────────┘

Impossible de filtrer par CROU
Admin voit seulement ses propres données
```

**Flux ATTENDU ✅**
```
┌─────────────────────┐
│   Frontend          │
│ BudgetsPage         │
│ ✅ TenantSelector   │
│   (CROU-Paris)      │
└──────┬──────────────┘
       │ GET /financial/budgets?tenantId=crou-paris-id
       │
┌──────▼───────────────────┐
│   Backend                │
│ ✅ injectTenantIdMiddleware│
│ ✅ hasExtendedAccess      │
└──────┬───────────────────┘
       │
┌──────▼──────┐
│ Validate    │
│ Hierarchy   │
│ Ministère   │
│ → CROU ✅   │
└──────┬──────┘
       │ Accès autorisé
       │
┌──────▼──────┐
│  Service    │
│ Filter by   │
│ targetTenant│
└──────┬──────┘
       │
       ▼
   Budgets du CROU-Paris
```

---

## 🎯 PROBLÈMES IDENTIFIÉS PAR MODULE

### Module: Financial

**Backend:**
```
❌ Pas de middleware tenant sur les routes
❌ Filtrage manuel répétitif (req.user.tenantId)
❌ Pas de support TenantIsolationUtils
❌ Validation hiérarchique absente
```

**Frontend:**
```
❌ Service ne passe pas tenantId
❌ Pas de TenantFilter dans BudgetsPage
❌ Pas de TenantFilter dans TransactionsPage
❌ Admin ne peut pas filtrer par CROU
```

**Concordance:** 🔴 **20%** - Réfactorisation complète nécessaire

---

### Module: Stocks

**Backend:**
```
⚠️ Middleware ajouté récemment (partiellement)
❌ Filtrage manuel dans controller (req.user.tenantId)
❌ Service reçoit tenantId en paramètre (pattern ancien)
⚠️ Certaines routes sans middleware
```

**Frontend:**
```
❌ Service ne passe pas tenantId
❌ Pas de TenantFilter dans StocksPage
❌ Pas de TenantFilter dans SuppliersPage
❌ Admin ne peut pas filtrer par CROU
```

**Concordance:** 🟡 **40%** - Amélioration en cours

---

### Module: Housing

**Backend:**
```
✅ Middleware tenant sur toutes les routes
✅ Utilise TenantIsolationUtils
✅ Pattern moderne avec TenantContext
✅ Validation hiérarchique
```

**Frontend:**
```
⚠️ Service ne passe pas tenantId (repose sur backend)
❌ Pas de TenantFilter dans HousingPage
❌ Admin ne peut pas filtrer par CROU
```

**Concordance:** 🟡 **70%** - Backend excellent, Frontend à améliorer

---

### Module: Transport

**Backend:**
```
❌ Pas de middleware tenant
❌ Filtrage manuel (req.user.tenantId)
❌ Pattern ancien
```

**Frontend:**
```
❌ Service ne passe pas tenantId
❌ Pas de TenantFilter
```

**Concordance:** 🔴 **20%** - Réfactorisation complète nécessaire

---

### Module: Dashboard

**Backend:**
```
❌ Pas de middleware tenant
❌ Filtrage manuel
❌ Pas de support multi-tenant pour KPIs
```

**Frontend:**
```
❌ Pas de TenantSelector dans header
❌ KPIs ne supportent pas le filtrage
❌ Admin voit uniquement ses données
```

**Concordance:** 🔴 **10%** - Réfactorisation complète nécessaire

---

## 📋 PLAN D'ACTION DÉTAILLÉ

### PHASE 1: Infrastructure Backend (Semaine 1)
**Objectif:** Uniformiser l'utilisation des middlewares

#### 1.1 Créer un utilitaire centralisé
```typescript
// apps/api/src/shared/utils/tenant-isolation.utils.ts

export class TenantIsolationUtils {
  /**
   * Extrait le contexte tenant de la requête
   */
  static extractTenantContext(req: TypedRequest): TenantContext | null {
    return req.tenantContext || null;
  }

  /**
   * Vérifie si l'utilisateur a un accès étendu (Ministère)
   */
  static hasExtendedAccess(req: TypedRequest): boolean {
    const context = req.tenantContext;
    return context?.tenantType === 'ministere' || req.hasExtendedAccess === true;
  }

  /**
   * Extrait le tenant cible de la requête
   */
  static getTargetTenantId(req: TypedRequest): string | undefined {
    const context = req.tenantContext;
    const queryTenantId = req.query.tenantId as string;

    // Si admin avec accès étendu, utiliser le tenant de la query
    if (TenantIsolationUtils.hasExtendedAccess(req) && queryTenantId) {
      return queryTenantId;
    }

    // Sinon, utiliser le tenant de l'utilisateur
    return context?.tenantId;
  }
}
```

#### 1.2 Appliquer middleware à tous les modules

**Financial (5 heures)**
```typescript
// apps/api/src/modules/financial/financial.routes.ts

import { injectTenantIdMiddleware } from '@/shared/middlewares/tenant-isolation.middleware';

// ✅ AJOUTER sur toutes les routes
router.get('/budgets',
  authenticateJWT,
  checkPermissions(['financial:read']),
  injectTenantIdMiddleware({ strictMode: false }), // ✅ AJOUTER
  FinancialController.getBudgets
);

router.post('/budgets',
  authenticateJWT,
  checkPermissions(['financial:create']),
  injectTenantIdMiddleware({ strictMode: false }), // ✅ AJOUTER
  FinancialController.createBudget
);

// ... toutes les autres routes
```

**Transport (4 heures)**
```typescript
// apps/api/src/modules/transport/transport.routes.ts

router.get('/vehicles',
  authenticateJWT,
  checkPermissions(['transport:read']),
  injectTenantIdMiddleware({ strictMode: false }), // ✅ AJOUTER
  TransportController.getVehicles
);

router.post('/tickets',
  authenticateJWT,
  checkPermissions(['transport:create']),
  injectTenantIdMiddleware({ strictMode: false }), // ✅ AJOUTER
  TransportController.createTicket
);
```

**Dashboard (3 heures)**
```typescript
// apps/api/src/modules/dashboard/dashboard.routes.ts

router.get('/kpis',
  authenticateJWT,
  checkPermissions(['dashboard:read']),
  injectTenantIdMiddleware({ strictMode: false }), // ✅ AJOUTER
  DashboardController.getKPIs
);
```

#### 1.3 Refactoriser les controllers

**Financial Controller (8 heures)**
```typescript
// AVANT ❌
static async getBudgets(req: Request, res: Response) {
  const tenantId = req.user?.tenantId;
  if (!tenantId) {
    return res.status(401).json({ error: 'Tenant ID manquant' });
  }

  const budgets = await FinancialService.getBudgets(tenantId, filters);
  res.json({ success: true, data: { budgets } });
}

// APRÈS ✅
static async getBudgets(req: TypedRequest, res: Response) {
  const tenantContext = TenantIsolationUtils.extractTenantContext(req);
  const hasExtendedAccess = TenantIsolationUtils.hasExtendedAccess(req);
  const targetTenantId = TenantIsolationUtils.getTargetTenantId(req);

  const budgets = await FinancialService.getBudgets({
    tenantContext,
    targetTenantId,
    hasExtendedAccess,
    filters
  });

  res.json({ success: true, data: { budgets } });
}
```

**Stocks Controller (6 heures)**
```typescript
// AVANT ❌
static async getStocks(req: Request, res: Response) {
  const tenantId = req.user?.tenantId;
  if (!tenantId) {
    return res.status(401).json({ error: 'Tenant ID manquant' });
  }

  const stocks = await StocksService.getStocks(tenantId, filters);
  res.json({ success: true, data: { stocks } });
}

// APRÈS ✅
static async getStocks(req: TypedRequest, res: Response) {
  const tenantContext = TenantIsolationUtils.extractTenantContext(req);
  const targetTenantId = TenantIsolationUtils.getTargetTenantId(req);

  const stocks = await StocksService.getStocks({
    tenantContext,
    targetTenantId,
    filters
  });

  res.json({ success: true, data: { stocks } });
}
```

#### 1.4 Refactoriser les services

**Pattern moderne à adopter:**
```typescript
// apps/api/src/modules/financial/financial.service.ts

class FinancialService {
  static async getBudgets(options: {
    tenantContext: TenantContext;
    targetTenantId?: string;
    hasExtendedAccess?: boolean;
    filters?: any;
  }) {
    const { tenantContext, targetTenantId, hasExtendedAccess, filters } = options;

    const queryBuilder = budgetRepo.createQueryBuilder('budget');

    // Appliquer filtre tenant
    if (hasExtendedAccess && targetTenantId) {
      // Admin filtrant un tenant spécifique
      queryBuilder.where('budget.tenantId = :tenantId', { tenantId: targetTenantId });
    } else if (hasExtendedAccess) {
      // Admin sans filtre = tous les tenants
      // Pas de filtre tenant
    } else {
      // Utilisateur normal = son tenant uniquement
      queryBuilder.where('budget.tenantId = :tenantId', { tenantId: tenantContext.tenantId });
    }

    // Appliquer autres filtres
    if (filters?.status) {
      queryBuilder.andWhere('budget.status = :status', { status: filters.status });
    }

    return await queryBuilder.getMany();
  }
}
```

**Temps estimé Phase 1:** 26 heures (3-4 jours)

---

### PHASE 2: Composants Frontend Réutilisables (Semaine 2)
**Objectif:** Créer l'infrastructure UI pour le filtrage tenant

#### 2.1 Créer TenantSelector Component (4 heures)
```typescript
// apps/web/src/components/common/TenantSelector.tsx

interface TenantSelectorProps {
  value: string;
  onChange: (tenantId: string) => void;
  showHierarchy?: boolean;
  allowedLevels?: ('ministry' | 'region' | 'crou')[];
}

export const TenantSelector: React.FC<TenantSelectorProps> = ({
  value,
  onChange,
  showHierarchy = false,
  allowedLevels
}) => {
  const { user } = useAuth();
  const [tenants, setTenants] = useState([]);

  // Charger tenants accessibles
  useEffect(() => {
    const fetchTenants = async () => {
      // Appel API pour récupérer tenants accessibles
      const response = await adminService.getTenants();
      setTenants(response.data.tenants);
    };
    fetchTenants();
  }, []);

  // Filtrer par niveaux autorisés
  const filteredTenants = allowedLevels
    ? tenants.filter(t => allowedLevels.includes(t.type))
    : tenants;

  return (
    <Select
      label="Tenant"
      value={value}
      onChange={(e) => onChange(e.target.value)}
    >
      <option value="current">Mon tenant ({user?.tenantName})</option>
      {user?.hierarchyLevel === 'ministry' && (
        <option value="all">Tous les tenants</option>
      )}
      {filteredTenants.map(tenant => (
        <option key={tenant.id} value={tenant.id}>
          {showHierarchy && '　'.repeat(tenant.level)}
          {tenant.name}
        </option>
      ))}
    </Select>
  );
};
```

#### 2.2 Créer TenantFilter Component (2 heures)
```typescript
// apps/web/src/components/common/TenantFilter.tsx

interface TenantFilterProps {
  value: string;
  onChange: (tenantId: string) => void;
  showAllOption?: boolean;
}

export const TenantFilter: React.FC<TenantFilterProps> = ({
  value,
  onChange,
  showAllOption = false
}) => {
  const { isMinistryLevel } = useAuth();

  // Ne rien afficher si pas admin ministère
  if (!isMinistryLevel()) {
    return null;
  }

  return (
    <TenantSelector
      value={value}
      onChange={onChange}
      showHierarchy={true}
    />
  );
};
```

#### 2.3 Créer useTenantFilter Hook (3 heures)
```typescript
// apps/web/src/hooks/useTenantFilter.ts

export const useTenantFilter = () => {
  const { user, isMinistryLevel } = useAuth();
  const [selectedTenantId, setSelectedTenantId] = useState<string>(
    user?.tenantId || ''
  );

  // Réinitialiser si utilisateur change
  useEffect(() => {
    if (user?.tenantId && !isMinistryLevel()) {
      setSelectedTenantId(user.tenantId);
    }
  }, [user?.tenantId, isMinistryLevel]);

  // Tenant effectif à utiliser pour les requêtes
  const effectiveTenantId = isMinistryLevel() && selectedTenantId !== 'current'
    ? selectedTenantId
    : user?.tenantId;

  return {
    selectedTenantId,
    setSelectedTenantId,
    effectiveTenantId,
    canFilterTenant: isMinistryLevel(),
    isFilteringAll: selectedTenantId === 'all'
  };
};
```

#### 2.4 Créer Backend API pour tenants accessibles (2 heures)
```typescript
// apps/api/src/modules/admin/tenants.controller.ts

router.get('/tenants/accessible',
  authenticateJWT,
  injectTenantIdMiddleware({ strictMode: false }),
  async (req: TypedRequest, res: Response) => {
    const tenantContext = TenantIsolationUtils.extractTenantContext(req);
    const hasExtendedAccess = TenantIsolationUtils.hasExtendedAccess(req);

    let tenants = [];

    if (hasExtendedAccess) {
      // Admin: tous les tenants
      tenants = await tenantRepository.find({
        where: { isActive: true },
        order: { name: 'ASC' }
      });
    } else {
      // Utilisateur normal: son tenant uniquement
      tenants = await tenantRepository.find({
        where: { id: tenantContext.tenantId, isActive: true }
      });
    }

    res.json({
      success: true,
      data: { tenants }
    });
  }
);
```

**Temps estimé Phase 2:** 11 heures (1-2 jours)

---

### PHASE 3: Intégration Services API Frontend (Semaine 2-3)
**Objectif:** Modifier les services pour supporter tenantId

#### 3.1 Refactoriser Financial Service (3 heures)
```typescript
// apps/web/src/services/api/financialService.ts

async getBudgets(params?: {
  page?: number;
  limit?: number;
  status?: string;
  category?: string;
  tenantId?: string; // ✅ AJOUTER
}): Promise<{ budgets: Budget[]; total: number }> {
  const queryParams = new URLSearchParams();
  if (params?.page) queryParams.append('page', params.page.toString());
  if (params?.limit) queryParams.append('limit', params.limit.toString());
  if (params?.status) queryParams.append('status', params.status);
  if (params?.category) queryParams.append('category', params.category);
  if (params?.tenantId) queryParams.append('tenantId', params.tenantId); // ✅ AJOUTER

  const response = await apiClient.get(`/financial/budgets?${queryParams}`);
  return response.data;
}

async getTransactions(params?: {
  page?: number;
  limit?: number;
  type?: string;
  tenantId?: string; // ✅ AJOUTER
}): Promise<{ transactions: Transaction[]; total: number }> {
  const queryParams = new URLSearchParams();
  if (params?.page) queryParams.append('page', params.page.toString());
  if (params?.limit) queryParams.append('limit', params.limit.toString());
  if (params?.type) queryParams.append('type', params.type);
  if (params?.tenantId) queryParams.append('tenantId', params.tenantId); // ✅ AJOUTER

  const response = await apiClient.get(`/financial/transactions?${queryParams}`);
  return response.data;
}
```

#### 3.2 Refactoriser Stocks Service (3 heures)
```typescript
// apps/web/src/services/api/stocksService.ts

async getStockItems(params?: {
  page?: number;
  limit?: number;
  type?: string;
  category?: string;
  tenantId?: string; // ✅ AJOUTER
}): Promise<{ items: StockItem[]; total: number }> {
  const queryParams = new URLSearchParams();
  if (params?.page) queryParams.append('page', params.page.toString());
  if (params?.limit) queryParams.append('limit', params.limit.toString());
  if (params?.type) queryParams.append('type', params.type);
  if (params?.category) queryParams.append('category', params.category);
  if (params?.tenantId) queryParams.append('tenantId', params.tenantId); // ✅ AJOUTER

  const response = await apiClient.get(`/stocks/stocks?${queryParams}`);
  return response.data;
}

async getSuppliers(params?: {
  page?: number;
  limit?: number;
  tenantId?: string; // ✅ AJOUTER
}): Promise<{ suppliers: Supplier[]; total: number }> {
  const queryParams = new URLSearchParams();
  if (params?.page) queryParams.append('page', params.page.toString());
  if (params?.limit) queryParams.append('limit', params.limit.toString());
  if (params?.tenantId) queryParams.append('tenantId', params.tenantId); // ✅ AJOUTER

  const response = await apiClient.get(`/stocks/suppliers?${queryParams}`);
  return response.data;
}
```

#### 3.3 Créer Admin Service pour tenants (2 heures)
```typescript
// apps/web/src/services/api/adminService.ts

class AdminService {
  async getTenants(params?: {
    page?: number;
    limit?: number;
  }): Promise<{ tenants: Tenant[]; total: number }> {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());

    const response = await apiClient.get(`/admin/tenants/accessible?${queryParams}`);
    return response.data;
  }
}

export const adminService = new AdminService();
```

**Temps estimé Phase 3:** 8 heures (1 jour)

---

### PHASE 4: Intégration UI dans les Pages (Semaine 3)
**Objectif:** Ajouter filtres tenant dans toutes les pages

#### 4.1 Financial - BudgetsPage (2 heures)
```typescript
// apps/web/src/pages/financial/BudgetsPage.tsx

export const BudgetsPage: React.FC = () => {
  const { selectedTenantId, setSelectedTenantId, effectiveTenantId, canFilterTenant } = useTenantFilter();

  // Query avec tenant
  const { data, isLoading } = useQuery({
    queryKey: ['budgets', effectiveTenantId, filters],
    queryFn: () => financialService.getBudgets({
      ...filters,
      tenantId: effectiveTenantId
    })
  });

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1>Budgets</h1>

        {/* ✅ AJOUTER Filtre Tenant */}
        {canFilterTenant && (
          <TenantFilter
            value={selectedTenantId}
            onChange={setSelectedTenantId}
          />
        )}
      </div>

      {/* Liste des budgets */}
      <BudgetList budgets={data?.budgets} />
    </div>
  );
};
```

#### 4.2 Financial - TransactionsPage (2 heures)
```typescript
// apps/web/src/pages/financial/TransactionsPage.tsx

export const TransactionsPage: React.FC = () => {
  const { selectedTenantId, setSelectedTenantId, effectiveTenantId, canFilterTenant } = useTenantFilter();

  const { data, isLoading } = useQuery({
    queryKey: ['transactions', effectiveTenantId, filters],
    queryFn: () => financialService.getTransactions({
      ...filters,
      tenantId: effectiveTenantId
    })
  });

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1>Transactions</h1>

        {/* ✅ AJOUTER Filtre Tenant */}
        {canFilterTenant && (
          <TenantFilter
            value={selectedTenantId}
            onChange={setSelectedTenantId}
          />
        )}
      </div>

      <TransactionList transactions={data?.transactions} />
    </div>
  );
};
```

#### 4.3 Stocks - StocksPage (2 heures)
```typescript
// apps/web/src/pages/stocks/StocksPage.tsx

export const StocksPage: React.FC = () => {
  const { selectedTenantId, setSelectedTenantId, effectiveTenantId, canFilterTenant } = useTenantFilter();

  const { data, isLoading } = useQuery({
    queryKey: ['stocks', effectiveTenantId, filters],
    queryFn: () => stocksService.getStockItems({
      ...filters,
      tenantId: effectiveTenantId
    })
  });

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1>Stocks</h1>

        {/* ✅ AJOUTER Filtre Tenant */}
        {canFilterTenant && (
          <TenantFilter
            value={selectedTenantId}
            onChange={setSelectedTenantId}
          />
        )}
      </div>

      <StockList items={data?.items} />
    </div>
  );
};
```

#### 4.4 Stocks - SuppliersPage (2 heures)
```typescript
// Pattern identique à StocksPage
```

#### 4.5 Housing - HousingPage (2 heures)
```typescript
// Pattern identique à StocksPage
```

#### 4.6 Transport - VehiclesPage (2 heures)
```typescript
// Pattern identique à StocksPage
```

#### 4.7 Dashboard - DashboardPage (3 heures)
```typescript
// apps/web/src/pages/dashboard/DashboardPage.tsx

export const DashboardPage: React.FC = () => {
  const { selectedTenantId, setSelectedTenantId, effectiveTenantId, canFilterTenant, isFilteringAll } = useTenantFilter();

  // KPIs avec tenant
  const { data: kpis } = useQuery({
    queryKey: ['dashboard-kpis', effectiveTenantId],
    queryFn: () => dashboardService.getKPIs({
      tenantId: isFilteringAll ? undefined : effectiveTenantId
    })
  });

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1>Tableau de Bord</h1>

        {/* ✅ AJOUTER Sélecteur Tenant */}
        {canFilterTenant && (
          <TenantSelector
            value={selectedTenantId}
            onChange={setSelectedTenantId}
            showHierarchy={true}
          />
        )}
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-4 gap-4">
        <KPICard title="Budget Total" value={kpis?.totalBudget} />
        <KPICard title="Dépenses" value={kpis?.totalSpent} />
        <KPICard title="Stocks" value={kpis?.totalStocks} />
        <KPICard title="Utilisateurs" value={kpis?.totalUsers} />
      </div>

      {/* Graphiques */}
      <div className="mt-6">
        <Charts data={kpis} tenantId={effectiveTenantId} />
      </div>
    </div>
  );
};
```

**Temps estimé Phase 4:** 15 heures (2 jours)

---

### PHASE 5: Tests et Validation (Semaine 4)
**Objectif:** Valider la concordance backend/frontend

#### 5.1 Tests Backend (8 heures)

**Test d'isolation tenant:**
```typescript
// tests/isolation/tenant-isolation.test.ts

describe('Tenant Isolation', () => {
  it('should filter budgets by tenant for CROU user', async () => {
    const crouUser = await createUser({ tenantId: 'crou-paris', role: 'user' });
    const token = generateToken(crouUser);

    const response = await request(app)
      .get('/financial/budgets')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.data.budgets).toHaveLength(3); // 3 budgets CROU-Paris
    expect(response.body.data.budgets.every(b => b.tenantId === 'crou-paris')).toBe(true);
  });

  it('should allow ministry user to access all tenants', async () => {
    const ministryUser = await createUser({ tenantId: 'ministere', role: 'admin' });
    const token = generateToken(ministryUser);

    const response = await request(app)
      .get('/financial/budgets')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.data.budgets.length).toBeGreaterThan(3); // Tous les budgets
  });

  it('should filter by target tenant for ministry user', async () => {
    const ministryUser = await createUser({ tenantId: 'ministere', role: 'admin' });
    const token = generateToken(ministryUser);

    const response = await request(app)
      .get('/financial/budgets?tenantId=crou-paris')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.data.budgets.every(b => b.tenantId === 'crou-paris')).toBe(true);
  });

  it('should reject cross-tenant access for CROU user', async () => {
    const crouUser = await createUser({ tenantId: 'crou-paris', role: 'user' });
    const token = generateToken(crouUser);

    const response = await request(app)
      .get('/financial/budgets?tenantId=crou-lyon')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(403);
  });
});
```

**Test de validation hiérarchique:**
```typescript
describe('Hierarchical Access', () => {
  it('should validate ministry → CROU access', async () => {
    const result = await tenantHierarchyService.canAccessTenant(
      'ministere-id',
      'crou-paris-id'
    );
    expect(result).toBe(true);
  });

  it('should reject CROU → other CROU access', async () => {
    const result = await tenantHierarchyService.canAccessTenant(
      'crou-paris-id',
      'crou-lyon-id'
    );
    expect(result).toBe(false);
  });
});
```

#### 5.2 Tests Frontend (6 heures)

**Test du hook useTenantFilter:**
```typescript
// tests/hooks/useTenantFilter.test.tsx

describe('useTenantFilter', () => {
  it('should return user tenant for CROU user', () => {
    const { result } = renderHook(() => useTenantFilter(), {
      wrapper: createAuthWrapper({
        tenantId: 'crou-paris',
        hierarchyLevel: 'crou'
      })
    });

    expect(result.current.effectiveTenantId).toBe('crou-paris');
    expect(result.current.canFilterTenant).toBe(false);
  });

  it('should allow filtering for ministry user', () => {
    const { result } = renderHook(() => useTenantFilter(), {
      wrapper: createAuthWrapper({
        tenantId: 'ministere',
        hierarchyLevel: 'ministry'
      })
    });

    expect(result.current.canFilterTenant).toBe(true);
  });

  it('should update effective tenant when selection changes', () => {
    const { result } = renderHook(() => useTenantFilter(), {
      wrapper: createAuthWrapper({
        tenantId: 'ministere',
        hierarchyLevel: 'ministry'
      })
    });

    act(() => {
      result.current.setSelectedTenantId('crou-paris');
    });

    expect(result.current.effectiveTenantId).toBe('crou-paris');
  });
});
```

**Test d'intégration E2E:**
```typescript
// e2e/tenant-filtering.spec.ts

describe('Tenant Filtering E2E', () => {
  it('ministry user can filter budgets by CROU', async () => {
    // Login as ministry user
    await page.goto('/login');
    await page.fill('[name="email"]', 'admin@ministere.gov');
    await page.fill('[name="password"]', 'password');
    await page.click('button[type="submit"]');

    // Navigate to budgets
    await page.goto('/financial/budgets');

    // Verify tenant selector is visible
    await expect(page.locator('[data-testid="tenant-selector"]')).toBeVisible();

    // Select CROU-Paris
    await page.selectOption('[data-testid="tenant-selector"]', 'crou-paris');

    // Wait for data to load
    await page.waitForResponse(res => res.url().includes('/financial/budgets?tenantId=crou-paris'));

    // Verify budgets are filtered
    const budgets = await page.locator('[data-testid="budget-item"]').count();
    expect(budgets).toBeGreaterThan(0);

    // Verify all budgets belong to CROU-Paris
    const tenantNames = await page.locator('[data-testid="budget-tenant"]').allTextContents();
    expect(tenantNames.every(name => name === 'CROU Paris')).toBe(true);
  });

  it('CROU user cannot see tenant selector', async () => {
    // Login as CROU user
    await page.goto('/login');
    await page.fill('[name="email"]', 'user@crou-paris.fr');
    await page.fill('[name="password"]', 'password');
    await page.click('button[type="submit"]');

    // Navigate to budgets
    await page.goto('/financial/budgets');

    // Verify tenant selector is NOT visible
    await expect(page.locator('[data-testid="tenant-selector"]')).not.toBeVisible();

    // Verify only CROU-Paris budgets are shown
    const tenantNames = await page.locator('[data-testid="budget-tenant"]').allTextContents();
    expect(tenantNames.every(name => name === 'CROU Paris')).toBe(true);
  });
});
```

#### 5.3 Validation manuelle (4 heures)

**Checklist de validation:**
```
✅ Backend
  ✅ Tous les modules ont middleware tenant
  ✅ Controllers utilisent TenantIsolationUtils
  ✅ Services supportent filtrage par tenant
  ✅ Validation hiérarchique fonctionne
  ✅ Admin ministère voit tous les tenants
  ✅ Utilisateur CROU voit uniquement son tenant
  ✅ Accès cross-tenant non autorisé bloqué (403)

✅ Frontend
  ✅ TenantSelector créé et fonctionnel
  ✅ TenantFilter créé et fonctionnel
  ✅ useTenantFilter hook fonctionnel
  ✅ Services API passent tenantId
  ✅ Toutes les pages principales ont filtre
  ✅ Admin ministère peut filtrer par CROU
  ✅ Utilisateur CROU ne voit pas le filtre
  ✅ Changement de tenant met à jour les données

✅ Intégration
  ✅ Backend + Frontend concordent
  ✅ Pas de requêtes échouées (403/401)
  ✅ Performance acceptable (<2s)
  ✅ Aucune fuite de données cross-tenant
```

**Temps estimé Phase 5:** 18 heures (2-3 jours)

---

## 📊 RÉCAPITULATIF TEMPS & RESSOURCES

### Temps Total Estimé

| Phase | Description | Temps | Complexité |
|-------|-------------|-------|------------|
| **Phase 1** | Infrastructure Backend | 26h | ⭐⭐⭐⭐ Élevée |
| **Phase 2** | Composants Frontend | 11h | ⭐⭐⭐ Moyenne |
| **Phase 3** | Services API | 8h | ⭐⭐ Faible |
| **Phase 4** | Intégration UI | 15h | ⭐⭐ Faible |
| **Phase 5** | Tests & Validation | 18h | ⭐⭐⭐ Moyenne |
| **TOTAL** | **Complet** | **78h** | **(~2 semaines)** |

### Allocation des Ressources

**Développeur Backend Senior (40h)**
- Phase 1: Infrastructure Backend (26h)
- Phase 5: Tests Backend (8h)
- Phase 5: Validation (4h)
- Buffer (2h)

**Développeur Frontend Senior (38h)**
- Phase 2: Composants (11h)
- Phase 3: Services API (8h)
- Phase 4: Intégration UI (15h)
- Phase 5: Tests Frontend (4h)

---

## 🎯 BÉNÉFICES ATTENDUS

### Concordance Backend/Frontend
```
AVANT:  🔴 35% concordance
APRÈS:  ✅ 95% concordance
```

### Modules Conformes
```
AVANT:  2/8 modules (Housing, Admin Stats)
APRÈS:  8/8 modules (tous conformes)
```

### Capacités Administratives
```
AVANT:  ❌ Admin ne peut pas filtrer par tenant
APRÈS:  ✅ Admin peut visualiser n'importe quel tenant
```

### Sécurité
```
AVANT:  ⚠️ Filtrage manuel incohérent
APRÈS:  ✅ Isolation automatique partout
```

### Maintenance
```
AVANT:  🔴 Code répétitif (req.user.tenantId partout)
APRÈS:  ✅ Code centralisé (TenantIsolationUtils)
```

---

## 🚀 ORDRE D'EXÉCUTION RECOMMANDÉ

### Semaine 1
1. **Jours 1-2:** Phase 1.1-1.2 (Middleware Financial, Transport, Dashboard)
2. **Jours 3-4:** Phase 1.3-1.4 (Refactoring controllers & services)

### Semaine 2
3. **Jours 1-2:** Phase 2 (Composants frontend)
4. **Jours 3-4:** Phase 3 (Services API)
5. **Jour 5:** Phase 4.1-4.3 (Intégration Financial & Stocks)

### Semaine 3
6. **Jours 1-2:** Phase 4.4-4.7 (Intégration Housing, Transport, Dashboard)
7. **Jours 3-5:** Phase 5 (Tests & Validation)

---

## 📋 CHECKLIST FINALE

### Backend
- [ ] Tous les modules ont `injectTenantIdMiddleware`
- [ ] Tous les controllers utilisent `TenantIsolationUtils`
- [ ] Tous les services supportent `TenantContext`
- [ ] Validation hiérarchique fonctionne
- [ ] Tests d'isolation passent (100%)
- [ ] Aucune fuite cross-tenant

### Frontend
- [ ] `TenantSelector` créé et testé
- [ ] `TenantFilter` créé et testé
- [ ] `useTenantFilter` hook créé et testé
- [ ] Tous les services API passent `tenantId`
- [ ] Toutes les pages principales ont filtre
- [ ] Tests E2E passent (100%)

### Intégration
- [ ] Backend répond correctement aux requêtes avec `tenantId`
- [ ] Frontend envoie `tenantId` correctement
- [ ] Admin ministère peut filtrer par n'importe quel tenant
- [ ] Utilisateurs CROU ne voient que leurs données
- [ ] Performance acceptable (<2s chargement)
- [ ] Documentation mise à jour

---

## 📚 DOCUMENTATION À CRÉER

1. **Guide Développeur - Multi-Tenant**
   - Comment utiliser `injectTenantIdMiddleware`
   - Comment utiliser `TenantIsolationUtils`
   - Pattern recommandé pour nouveaux modules

2. **Guide Utilisateur - Filtrage Tenant**
   - Comment utiliser le sélecteur de tenant
   - Permissions requises
   - Cas d'usage

3. **Guide Architecture**
   - Flux de données multi-tenant
   - Hiérarchie des niveaux
   - Validation des accès

---

**Document généré le:** 4 Décembre 2025
**Version:** 1.0
**Auteur:** Claude Code Assistant
**Status:** 🟡 **PLAN D'ACTION - Prêt pour exécution**

# 📘 GUIDE D'UTILISATION - FILTRAGE PAR TENANT

**Date:** 4 Décembre 2025
**Version:** 1.0
**Public:** Développeurs Frontend

---

## 🎯 OBJECTIF

Ce guide explique comment intégrer le filtrage par tenant dans les pages de listes existantes. Le système permet aux administrateurs ministériels de filtrer les données par CROU tout en maintenant l'isolation automatique pour les utilisateurs normaux.

---

## 📚 COMPOSANTS DISPONIBLES

### 1. Hook `useTenantFilter`

**Localisation:** `apps/web/src/hooks/useTenantFilter.ts`

**Description:** Hook React pour gérer l'état du filtrage tenant.

**Utilisation:**
```typescript
import { useTenantFilter } from '@/hooks/useTenantFilter';

const MyPage = () => {
  const {
    selectedTenantId,      // 'current', 'all', ou UUID
    setSelectedTenantId,   // Changer la sélection
    effectiveTenantId,     // Tenant à passer à l'API (undefined si 'all')
    canFilterTenant,       // true si admin ministère
    isFilteringAll,        // true si filtrage sur tous les tenants
    currentUserTenantId    // Tenant de l'utilisateur connecté
  } = useTenantFilter();

  // ...
};
```

**Retour:**
| Propriété | Type | Description |
|-----------|------|-------------|
| `selectedTenantId` | `string` | ID sélectionné dans l'UI ('current', 'all', ou UUID) |
| `setSelectedTenantId` | `(id: string) => void` | Fonction pour changer la sélection |
| `effectiveTenantId` | `string \| undefined` | ID à passer aux requêtes API |
| `canFilterTenant` | `boolean` | Indique si l'utilisateur peut filtrer |
| `isFilteringAll` | `boolean` | Indique si filtrage sur "tous" |
| `currentUserTenantId` | `string \| undefined` | Tenant de l'utilisateur |

---

### 2. Composant `TenantSelector`

**Localisation:** `apps/web/src/components/common/TenantSelector.tsx`

**Description:** Dropdown avec liste hiérarchique des tenants accessibles.

**Props:**
```typescript
interface TenantSelectorProps {
  value: string;                    // Valeur actuelle
  onChange: (id: string) => void;   // Callback changement
  showHierarchy?: boolean;          // Afficher indentation (défaut: true)
  showAllOption?: boolean;          // Afficher "Tous" (défaut: false)
  allowedLevels?: ('ministere' | 'region' | 'crou')[];
  className?: string;
  label?: string;                   // Label du champ (défaut: 'Tenant')
  disabled?: boolean;
}
```

**Exemple:**
```tsx
<TenantSelector
  value={selectedTenantId}
  onChange={setSelectedTenantId}
  showHierarchy={true}
  showAllOption={true}
  label="Sélectionner un tenant"
/>
```

**Rendu:**
```
┌──────────────────────────────┐
│ Tenant                       │
├──────────────────────────────┤
│ 🏫 Mon tenant (CROU Paris)   │ ← Option par défaut
│ 📊 Tous les tenants          │ ← Si admin et showAllOption
│ ────────────                 │
│ 🏛️ Ministère (MESRS)         │
│   🏫 CROU de Paris           │ ← Indenté (niveau 1)
│   🏫 CROU de Lyon            │
└──────────────────────────────┘
```

---

### 3. Composant `TenantFilter`

**Localisation:** `apps/web/src/components/common/TenantFilter.tsx`

**Description:** Wrapper simplifié autour de `TenantSelector` pour les barres de filtres. **S'affiche automatiquement uniquement pour les admins.**

**Props:**
```typescript
interface TenantFilterProps {
  value: string;
  onChange: (id: string) => void;
  showAllOption?: boolean;         // Défaut: true
  forceShow?: boolean;             // Forcer affichage (défaut: false)
  // Autres props de TenantSelector...
}
```

**Exemple:**
```tsx
import { TenantFilter } from '@/components/common/TenantFilter';

// S'affiche uniquement si admin ministère
<TenantFilter
  value={selectedTenantId}
  onChange={setSelectedTenantId}
/>
```

**Comportement:**
- ✅ Admin Ministère: Composant visible
- ❌ Utilisateur CROU: Composant caché (return null)
- ⚙️ Option `forceShow`: Afficher en lecture seule

---

## 🚀 INTÉGRATION DANS UNE PAGE

### Étape 1: Importer les dépendances

```typescript
import { useTenantFilter } from '@/hooks/useTenantFilter';
import { TenantFilter } from '@/components/common/TenantFilter';
```

### Étape 2: Utiliser le hook

```typescript
export const MyListPage = () => {
  // Hook de filtrage tenant
  const {
    selectedTenantId,
    setSelectedTenantId,
    effectiveTenantId,
    canFilterTenant
  } = useTenantFilter();

  // ... reste du code
};
```

### Étape 3: Passer `effectiveTenantId` à l'API

```typescript
const loadData = async () => {
  try {
    const response = await myService.getData({
      tenantId: effectiveTenantId, // ✅ Passer ici
      // ... autres filtres
    });
    setData(response.data);
  } catch (error) {
    console.error('Erreur:', error);
  }
};

useEffect(() => {
  loadData();
}, [effectiveTenantId]); // ✅ Recharger si tenant change
```

### Étape 4: Ajouter le composant dans l'UI

```tsx
return (
  <div>
    {/* Filtres */}
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      {/* ✅ Filtre Tenant (visible uniquement pour admins) */}
      {canFilterTenant && (
        <TenantFilter
          value={selectedTenantId}
          onChange={setSelectedTenantId}
          showAllOption={true}
        />
      )}

      {/* Autres filtres */}
      <Input placeholder="Recherche..." />
      <Select options={statusOptions} />
    </div>

    {/* Liste des données */}
    <DataTable data={data} />
  </div>
);
```

---

## 📝 EXEMPLE COMPLET

### BudgetsPage.tsx (Exemple réel)

```typescript
import React, { useState, useEffect } from 'react';
import { useTenantFilter } from '@/hooks/useTenantFilter';
import { TenantFilter } from '@/components/common/TenantFilter';
import { financialService, Budget } from '@/services/api/financialService';

export const BudgetsPage: React.FC = () => {
  // ✅ Hook de filtrage tenant
  const {
    selectedTenantId,
    setSelectedTenantId,
    effectiveTenantId,
    canFilterTenant
  } = useTenantFilter();

  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [filters, setFilters] = useState({
    status: 'all',
    category: 'all'
  });

  // ✅ Charger les budgets avec tenant
  const loadBudgets = async () => {
    try {
      const response = await financialService.getBudgets({
        tenantId: effectiveTenantId, // ✅ Passer le tenant
        status: filters.status !== 'all' ? filters.status : undefined,
        category: filters.category !== 'all' ? filters.category : undefined
      });
      setBudgets(response.budgets);
    } catch (error) {
      console.error('Erreur chargement budgets:', error);
    }
  };

  // ✅ Recharger si tenant ou filtres changent
  useEffect(() => {
    loadBudgets();
  }, [effectiveTenantId, filters]);

  return (
    <div className="p-6">
      <h1>Gestion des Budgets</h1>

      {/* Filtres */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {/* ✅ Filtre Tenant */}
        {canFilterTenant && (
          <TenantFilter
            value={selectedTenantId}
            onChange={setSelectedTenantId}
            showAllOption={true}
          />
        )}

        {/* Autres filtres */}
        <Select
          value={filters.status}
          onChange={(v) => setFilters(prev => ({ ...prev, status: v }))}
          options={[
            { value: 'all', label: 'Tous les statuts' },
            { value: 'draft', label: 'Brouillon' },
            { value: 'approved', label: 'Approuvé' }
          ]}
        />
      </div>

      {/* Liste des budgets */}
      <BudgetTable budgets={budgets} />
    </div>
  );
};
```

---

## 🎭 COMPORTEMENT SELON LE RÔLE

### Utilisateur CROU
```
┌─────────────────────────────┐
│ Gestion des Budgets         │
├─────────────────────────────┤
│ [Filtres]                   │
│ ┌─────────────┐             │ ← Pas de filtre tenant
│ │ Statut: Tous│             │
│ └─────────────┘             │
│                             │
│ Budgets du CROU Paris:      │
│ • Budget 2025 - Logement    │
│ • Budget 2025 - Restauration│
└─────────────────────────────┘
```

### Admin Ministère
```
┌─────────────────────────────────────┐
│ Gestion des Budgets                 │
├─────────────────────────────────────┤
│ [Filtres]                           │
│ ┌───────────────────┐ ┌───────────┐│ ← Filtre tenant visible
│ │🏫 CROU de Paris ▼ │ │Statut: ▼ ││
│ └───────────────────┘ └───────────┘│
│                                     │
│ Budgets du CROU Paris:              │
│ • Budget 2025 - Logement            │
│ • Budget 2025 - Restauration        │
│                                     │
│ [Change to: 📊 Tous les tenants]    │
│                                     │
│ Budgets de TOUS les CROUs:          │
│ • [Paris] Budget 2025 - Logement    │
│ • [Lyon] Budget 2025 - Logement     │
│ • [Bordeaux] Budget 2025 - Logement │
└─────────────────────────────────────┘
```

---

## 🔄 FLUX DE DONNÉES

```
┌──────────────┐
│ Utilisateur  │
│ change       │
│ sélection    │
└──────┬───────┘
       │
       ▼
┌──────────────────────┐
│ TenantFilter         │
│ onChange(newId)      │
└──────┬───────────────┘
       │
       ▼
┌──────────────────────┐
│ useTenantFilter      │
│ setSelectedTenantId  │
└──────┬───────────────┘
       │
       ▼
┌──────────────────────┐
│ Calcul               │
│ effectiveTenantId    │
│ - 'current' → userTenantId│
│ - 'all' → undefined  │
│ - UUID → UUID        │
└──────┬───────────────┘
       │
       ▼
┌──────────────────────┐
│ useEffect déclenché  │
│ loadData()           │
└──────┬───────────────┘
       │
       ▼
┌──────────────────────┐
│ API Request          │
│ GET /api/budgets?    │
│ tenantId=xxx         │
└──────┬───────────────┘
       │
       ▼
┌──────────────────────┐
│ Backend Middleware   │
│ injectTenantIdMiddleware│
│ - Validation accès   │
│ - Injection context  │
└──────┬───────────────┘
       │
       ▼
┌──────────────────────┐
│ Controller           │
│ TenantIsolationUtils │
│ getTargetTenantId()  │
└──────┬───────────────┘
       │
       ▼
┌──────────────────────┐
│ Service filtré       │
│ WHERE tenantId=xxx   │
└──────┬───────────────┘
       │
       ▼
┌──────────────────────┐
│ Response             │
│ Données filtrées     │
└──────────────────────┘
```

---

## ⚙️ CONFIGURATION DU SERVICE API

### Exemple: Financial Service

```typescript
// apps/web/src/services/api/financialService.ts

async getBudgets(params?: {
  page?: number;
  limit?: number;
  status?: string;
  tenantId?: string; // ✅ Ajouter ce paramètre
}): Promise<{ budgets: Budget[]; total: number }> {
  const queryParams = new URLSearchParams();

  if (params?.page) queryParams.append('page', params.page.toString());
  if (params?.limit) queryParams.append('limit', params.limit.toString());
  if (params?.status) queryParams.append('status', params.status);

  // ✅ Ajouter tenantId aux params
  if (params?.tenantId) {
    queryParams.append('tenantId', params.tenantId);
  }

  const response = await apiClient.get(`/financial/budgets?${queryParams}`);
  return response.data;
}
```

**Important:** Si `tenantId` est `undefined`, le backend utilisera automatiquement le tenant de l'utilisateur connecté (via le middleware).

---

## ✅ CHECKLIST D'INTÉGRATION

Pour intégrer le filtrage tenant dans une nouvelle page:

### Frontend
- [ ] Importer `useTenantFilter` et `TenantFilter`
- [ ] Appeler le hook en début de composant
- [ ] Passer `effectiveTenantId` aux appels API
- [ ] Ajouter `effectiveTenantId` dans les dépendances de `useEffect`
- [ ] Ajouter le composant `TenantFilter` dans la barre de filtres
- [ ] Entourer `TenantFilter` de `{canFilterTenant && ...}`
- [ ] Tester avec utilisateur CROU (filtre caché)
- [ ] Tester avec admin ministère (filtre visible)
- [ ] Vérifier le changement de tenant (rechargement données)

### Backend (si pas déjà fait)
- [ ] Ajouter `injectTenantIdMiddleware` sur toutes les routes du module
- [ ] Utiliser `TenantIsolationUtils.getTargetTenantId(req)` dans le controller
- [ ] Passer le `tenantId` au service
- [ ] Appliquer le filtre dans les requêtes SQL/TypeORM
- [ ] Tester l'isolation (CROU ne voit que ses données)
- [ ] Tester le filtrage admin (peut voir d'autres tenants)

---

## 🐛 DÉPANNAGE

### Le filtre ne s'affiche pas
**Cause:** Utilisateur n'est pas admin ministère
**Solution:** C'est normal ! Le filtre est réservé aux admins

### Les données ne changent pas lors du changement de tenant
**Cause:** `effectiveTenantId` n'est pas dans les dépendances de `useEffect`
**Solution:**
```typescript
useEffect(() => {
  loadData();
}, [effectiveTenantId]); // ✅ Ajouter ici
```

### Erreur 403 lors du filtrage
**Cause:** Backend refuse l'accès cross-tenant
**Solution:** Vérifier que le middleware `injectTenantIdMiddleware` est bien appliqué sur la route

### Les tenants ne se chargent pas
**Cause:** L'API `/admin/tenants/accessible` n'existe pas encore
**Solution:** Les données de mock sont utilisées temporairement. Implémenter l'endpoint côté backend.

---

## 📚 RESSOURCES

### Fichiers de référence
- **Hook:** [useTenantFilter.ts](../apps/web/src/hooks/useTenantFilter.ts)
- **Composants:** [TenantSelector.tsx](../apps/web/src/components/common/TenantSelector.tsx), [TenantFilter.tsx](../apps/web/src/components/common/TenantFilter.tsx)
- **Exemple:** [BudgetsPage.tsx](../apps/web/src/pages/financial/BudgetsPage.tsx)
- **Utils Backend:** [tenant-isolation.utils.ts](../apps/api/src/shared/utils/tenant-isolation.utils.ts)

### Documentation
- [Architecture Tenant - Revue complète](TENANT-ARCHITECTURE-REVIEW.md)
- [Corrections effectuées](TENANT-CORRECTIONS-DONE.md)

---

**Document créé le:** 4 Décembre 2025
**Version:** 1.0
**Auteur:** Claude Code Assistant
**Status:** ✅ **Prêt pour utilisation**

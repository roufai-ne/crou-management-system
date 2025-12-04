# ⚡ QUICK START - Filtrage Multi-Tenant

**5 minutes pour intégrer le filtrage tenant dans une page**

---

## 📋 Checklist Rapide

### 1️⃣ Imports (2 lignes)
```typescript
import { useTenantFilter } from '@/hooks/useTenantFilter';
import { TenantFilter } from '@/components/common/TenantFilter';
```

### 2️⃣ Hook (1 ligne)
```typescript
const { effectiveTenantId, selectedTenantId, setSelectedTenantId, canFilterTenant } = useTenantFilter();
```

### 3️⃣ API Call (1 modification)
```typescript
// AVANT ❌
const response = await myService.getData({
  tenantId: user?.tenantId,
  // ...
});

// APRÈS ✅
const response = await myService.getData({
  tenantId: effectiveTenantId,
  // ...
});
```

### 4️⃣ useEffect (1 modification)
```typescript
// AVANT ❌
useEffect(() => {
  loadData();
}, [filters, user]);

// APRÈS ✅
useEffect(() => {
  loadData();
}, [filters, effectiveTenantId]);
```

### 5️⃣ UI Component (4 lignes)
```tsx
{/* Dans la barre de filtres */}
{canFilterTenant && (
  <TenantFilter value={selectedTenantId} onChange={setSelectedTenantId} />
)}
```

---

## ✅ C'est Tout !

**Résultat:**
- ✅ Admin ministère peut filtrer par CROU
- ✅ Utilisateur CROU voit uniquement ses données
- ✅ Changement de tenant recharge automatiquement
- ✅ Sécurité: validation backend automatique

---

## 📝 Exemple Complet (Copy/Paste)

```tsx
import React, { useState, useEffect } from 'react';
import { useTenantFilter } from '@/hooks/useTenantFilter';
import { TenantFilter } from '@/components/common/TenantFilter';
import { myService } from '@/services/api/myService';

export const MyPage = () => {
  // ✅ Hook
  const { effectiveTenantId, selectedTenantId, setSelectedTenantId, canFilterTenant } = useTenantFilter();

  const [data, setData] = useState([]);
  const [filters, setFilters] = useState({ status: 'all' });

  // ✅ Load data
  const loadData = async () => {
    const response = await myService.getData({
      tenantId: effectiveTenantId, // ✅ Passer ici
      status: filters.status !== 'all' ? filters.status : undefined
    });
    setData(response.data);
  };

  // ✅ Recharger si tenant change
  useEffect(() => {
    loadData();
  }, [effectiveTenantId, filters]);

  return (
    <div>
      <h1>Ma Page</h1>

      {/* Filtres */}
      <div className="filters">
        {/* ✅ Filtre Tenant */}
        {canFilterTenant && (
          <TenantFilter value={selectedTenantId} onChange={setSelectedTenantId} />
        )}

        {/* Autres filtres */}
        <Select value={filters.status} onChange={(v) => setFilters({ status: v })} />
      </div>

      {/* Données */}
      <DataTable data={data} />
    </div>
  );
};
```

---

## 🔧 Vérifier que le Service API Supporte `tenantId`

```typescript
// ✅ Bon - Service supporte tenantId
async getData(params?: {
  tenantId?: string;  // ← Doit être présent
  status?: string;
}) {
  const queryParams = new URLSearchParams();
  if (params?.tenantId) queryParams.append('tenantId', params.tenantId);
  // ...
}

// ❌ Mauvais - Service ne supporte pas tenantId
async getData(params?: {
  status?: string;  // ← tenantId manquant
}) {
  // Ajouter: tenantId?: string;
}
```

---

## 🎯 Pages Prioritaires

### À Faire
- [ ] TransactionsPage
- [ ] StocksPage
- [ ] SuppliersPage
- [ ] HousingPage
- [ ] DashboardPage

### Déjà Fait
- [x] BudgetsPage ✅ (référence)

---

## 📚 Docs Complètes

- **Guide détaillé:** [GUIDE-UTILISATION-TENANT-FILTER.md](GUIDE-UTILISATION-TENANT-FILTER.md)
- **Architecture:** [TENANT-ARCHITECTURE-REVIEW.md](TENANT-ARCHITECTURE-REVIEW.md)
- **Synthèse:** [TENANT-SUMMARY.md](TENANT-SUMMARY.md)

---

**Temps d'intégration par page:** ~15 minutes
**Difficulté:** ⭐ Facile (copy/paste du pattern)

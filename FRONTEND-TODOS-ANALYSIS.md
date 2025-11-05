# Analyse des TODOs Frontend

**Date**: Octobre 2025
**Total TODOs**: 33
**Statut**: Documentés et priorisés

---

## 📊 Résumé

Le frontend contient **33 TODOs** répartis dans plusieurs catégories:
- Notifications/Feedback: 10 TODOs (30%)
- API/Backend Integration: 8 TODOs (24%)
- Monitoring/Analytics: 5 TODOs (15%)
- Features avancées: 10 TODOs (30%)

---

## 🎯 Classification par Priorité

### 🔴 PRIORITÉ HAUTE - Fonctionnalités critiques (10 TODOs)

#### 1. Notifications - TransactionsTab (8 TODOs)
**Fichier**: `apps/web/src/pages/financial/TransactionsTab.tsx`
**Lignes**: 78, 101, 104, 126, 179, 203, 227, 251, 275

```typescript
// TODO: Afficher notification d'erreur
// TODO: Afficher notification de succès
```

**Impact**: ⚠️ **HAUTE** - UX dégradée, utilisateur ne voit pas feedback actions
**Description**: Toutes les opérations CRUD sur transactions manquent de notifications utilisateur.
**Actions à faire**:
- Créer: lignes 101, 104
- Valider: ligne 126
- Approuver: ligne 179
- Rejeter: ligne 203
- Exporter: ligne 227
- Réconcilier: ligne 251
- Marquer comme payée: ligne 275
- Erreur générale: ligne 78

**Action Recommandée**: Utiliser système de toast/notification
```typescript
import { toast } from 'react-toastify';

// Success
toast.success('Transaction créée avec succès');

// Error
toast.error('Erreur lors de la création de la transaction');
```

---

#### 2. Workflows - API Calls (4 TODOs)
**Fichier**: `apps/web/src/pages/workflows/WorkflowsPage.tsx`
**Lignes**: 160, 169, 186, 195

```typescript
// TODO: Appeler l'API
```

**Impact**: ⚠️ **HAUTE** - Fonctionnalité workflows non connectée au backend
**Description**: Les opérations workflows (start, pause, cancel, delete) ne font pas d'appels API.
**Action Recommandée**:
```typescript
const handleStartWorkflow = async (id: string) => {
  try {
    await workflowService.startInstance(id);
    toast.success('Workflow démarré');
    refetch();
  } catch (error) {
    toast.error('Erreur démarrage workflow');
  }
};
```

---

### 🟡 PRIORITÉ MOYENNE - Fonctionnalités importantes (13 TODOs)

#### 3. Error Monitoring - Main.tsx (3 TODOs)
**Fichier**: `apps/web/src/main.tsx`
**Lignes**: 95, 106, 173

```typescript
// TODO: Implémenter l'envoi vers Sentry ou un autre service de monitoring
// TODO: Implémenter l'envoi vers Google Analytics ou autre
```

**Impact**: 🟡 **MOYENNE** - Pas de tracking erreurs production
**Description**: Les erreurs React et analytics ne sont pas envoyés à des services de monitoring.
**Action Recommandée**:
```typescript
// Installation
pnpm add @sentry/react @sentry/tracing

// Configuration
import * as Sentry from "@sentry/react";

Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN,
  integrations: [new Sentry.BrowserTracing()],
  tracesSampleRate: 1.0,
  environment: import.meta.env.MODE
});
```

---

#### 4. Offline Mode - Stats (4 TODOs)
**Fichier**: `apps/web/src/hooks/useOffline.ts`
**Lignes**: 294, 295, 296, 297

```typescript
cacheHitRate: 0, // TODO: Calculer le taux de succès du cache
syncSuccessRate: 0, // TODO: Calculer le taux de succès de la synchronisation
averageSyncTime: 0, // TODO: Calculer le temps moyen de synchronisation
dataProcessed: 0 // TODO: Calculer le nombre de données traitées
```

**Impact**: 🟡 **MOYENNE** - Métriques offline mode non disponibles
**Description**: Les statistiques du mode offline ne sont pas calculées.
**Action Recommandée**: Implémenter tracking dans le service offline
```typescript
const offlineStats = {
  cacheHitRate: (cacheHits / totalRequests) * 100,
  syncSuccessRate: (successfulSyncs / totalSyncs) * 100,
  averageSyncTime: totalSyncTime / totalSyncs,
  dataProcessed: pendingOperations.length
};
```

---

#### 5. Admin - Permissions Check (1 TODO)
**Fichier**: `apps/web/src/pages/admin/RolesPage.tsx:511`

```tsx
{/* TODO: Vérifier si le rôle a cette permission */}
```

**Impact**: 🟡 **MOYENNE** - UI permissions pas dynamique
**Description**: Interface rôles ne vérifie pas si rôle a déjà une permission.
**Action Recommandée**: Comparer permissions rôle avec liste disponible

---

#### 6. Admin - Reset Password (1 TODO)
**Fichier**: `apps/web/src/pages/auth/LoginPage.tsx:284`

```tsx
// TODO: Implémenter reset password
```

**Impact**: 🟡 **MOYENNE** - Utilisateurs ne peuvent pas réinitialiser mot de passe
**Description**: Fonctionnalité "Mot de passe oublié" non implémentée.
**Action Recommandée**: Créer page reset password + API endpoint

---

#### 7. Admin - Tenant Creation (1 TODO)
**Fichier**: `apps/web/src/pages/admin/TenantsPage.tsx:482`

```tsx
disabled // TODO: Implémenter la création de tenant
```

**Impact**: 🟡 **MOYENNE** - Pas de création tenant via UI
**Description**: Bouton création tenant désactivé.
**Action Recommandée**: Implémenter formulaire + API call

---

#### 8. Admin - Tenant Configuration (1 TODO)
**Fichier**: `apps/web/src/pages/admin/TenantsPage.tsx:871`

```tsx
{/* TODO: Implémenter l'interface de configuration */}
```

**Impact**: 🟡 **MOYENNE** - Configuration tenant limitée
**Description**: Interface configuration avancée tenant manquante.
**Action Recommandée**: Créer formulaire configuration (branding, limites, features)

---

#### 9. Reports - History API (1 TODO)
**Fichier**: `apps/web/src/components/reports/ReportGenerator.tsx:121`

```typescript
// TODO: Implémenter l'API d'historique
```

**Impact**: 🟡 **MOYENNE** - Pas d'historique rapports générés
**Description**: Historique rapports non disponible.
**Action Recommandée**: Créer endpoint `GET /api/reports/history`

---

#### 10. Admin - Stats Display (1 TODO)
**Fichier**: `apps/web/src/pages/admin/index.tsx:79`

```typescript
// TODO: Remplacer par les vrais appels API
```

**Impact**: 🟡 **MOYENNE** - Dashboard admin avec données mockées
**Description**: Statistiques admin utilisent données statiques.
**Action Recommandée**: Connecter à `adminService.getStats()`

---

### 🟢 PRIORITÉ BASSE - Améliorations futures (10 TODOs)

#### 11. Security - Monitoring Graphs (1 TODO)
**Fichier**: `apps/web/src/pages/admin/SecurityPage.tsx:716`

```tsx
{/* TODO: Implémenter les graphiques de monitoring */}
```

**Impact**: 🟢 **BASSE** - Visualisation sécurité avancée
**Description**: Graphiques monitoring sécurité manquants.
**Action Recommandée**: Utiliser Chart.js ou Recharts pour graphs

---

#### 12. Financial - Export Implementation (1 TODO)
**Fichier**: `apps/web/src/pages/financial/TransactionsTab.tsx:286`

```typescript
// TODO: Implémenter l'export
```

**Impact**: 🟢 **BASSE** - Export transactions
**Description**: Fonctionnalité export transactions non implémentée.
**Action Recommandée**: Utiliser backend endpoint `/api/financial/export`

---

#### 13. Financial - Budgets Export (1 TODO)
**Fichier**: `apps/web/src/pages/financial/BudgetsPage.tsx:243`

```typescript
onClick={() => {/* TODO: Export */}}
```

**Impact**: 🟢 **BASSE** - Export budgets
**Description**: Bouton export budgets non fonctionnel.
**Action Recommandée**: Implémenter export PDF/Excel

---

#### 14. Financial - Validation History (1 TODO)
**Fichier**: `apps/web/src/hooks/useFinancial.ts:389`

```typescript
validationHistory: [] // TODO: Implémenter historique validation
```

**Impact**: 🟢 **BASSE** - Traçabilité validations
**Description**: Historique validations transactions manquant.
**Action Recommandée**: Créer endpoint `GET /api/financial/transactions/:id/validation-history`

---

#### 15. Offline - Sync Resolver (1 TODO)
**Fichier**: `apps/web/src/components/offline/ConflictResolver.tsx:128`

```typescript
// TODO: Appliquer la résolution au service de synchronisation
```

**Impact**: 🟢 **BASSE** - Résolution conflits sync
**Description**: Interface résolution conflits non connectée.
**Action Recommandée**: Implémenter logique application résolution

---

#### 16. Admin - Permissions Loading (1 TODO)
**Fichier**: `apps/web/src/pages/admin/AdminLayout.tsx:86`

```typescript
// TODO: Récupérer les permissions de l'utilisateur depuis le store d'auth
```

**Impact**: 🟢 **BASSE** - Permissions layout admin
**Description**: Permissions admin layout pas récupérées depuis store.
**Action Recommandée**: Utiliser `useAuthStore()` pour récupérer permissions

---

#### 17. UI - Drawer Modal (1 TODO)
**Fichier**: `apps/web/src/components/ui/Modal.tsx:447`

```typescript
// TODO: Implémenter le vrai drawer modal
```

**Impact**: 🟢 **BASSE** - Composant drawer
**Description**: Drawer modal non implémenté, utilise modal classique.
**Action Recommandée**: Créer composant Drawer séparé

---

## 📋 Plan d'Action Recommandé

### Phase 1: UX Critique (PRIORITÉ HAUTE)
**Durée estimée**: 2 jours

1. ✅ **Implémenter toasts notifications TransactionsTab** (8 TODOs)
   - Installer react-toastify ou système toast choisi
   - Ajouter toasts success/error sur toutes opérations
   - Tester avec vrais appels API

2. ✅ **Connecter Workflows aux APIs** (4 TODOs)
   - Implémenter appels workflowService
   - Ajouter error handling
   - Tester cycle de vie workflows

---

### Phase 2: Monitoring & Intégrations (PRIORITÉ MOYENNE)
**Durée estimée**: 3 jours

3. ✅ **Configurer Sentry + Analytics** (3 TODOs)
   - Installer @sentry/react
   - Configurer error tracking
   - Implémenter Google Analytics

4. ✅ **Implémenter stats offline mode** (4 TODOs)
   - Ajouter tracking cache hits
   - Calculer sync success rate
   - Mesurer temps synchronisation

5. ✅ **Compléter fonctionnalités Admin** (4 TODOs)
   - Reset password flow
   - Création tenant
   - Configuration tenant
   - Check permissions rôles

6. ✅ **Reports history API** (1 TODO)
   - Créer endpoint backend
   - Intégrer frontend

7. ✅ **Dashboard admin avec vraies données** (1 TODO)
   - Connecter adminService
   - Remplacer mock data

---

### Phase 3: Améliorations (PRIORITÉ BASSE)
**Durée estimée**: 2-3 jours

8. ✅ **Graphiques monitoring sécurité** (1 TODO)
   - Installer Chart.js ou Recharts
   - Créer composants graphs

9. ✅ **Exports financial** (2 TODOs)
   - Export transactions
   - Export budgets

10. ✅ **Historique validations** (1 TODO)
    - Endpoint backend
    - Interface frontend

11. ✅ **Offline conflict resolver** (1 TODO)
    - Implémenter logique résolution
    - Tester scénarios conflits

12. ✅ **Permissions admin layout** (1 TODO)
    - Récupérer depuis authStore
    - Conditionner affichage

13. ✅ **Drawer modal component** (1 TODO)
    - Créer Drawer.tsx
    - Migrer usages Modal vers Drawer

---

## 🔧 Packages Requis

### Notifications
```bash
pnpm add react-toastify
# OU
pnpm add react-hot-toast
```

### Monitoring
```bash
pnpm add @sentry/react @sentry/tracing
pnpm add react-ga4  # Google Analytics
```

### Graphiques
```bash
pnpm add recharts
# OU
pnpm add chart.js react-chartjs-2
```

### Exports
```bash
pnpm add file-saver
pnpm add jspdf  # Pour PDFs côté client si besoin
```

---

## 📊 Métriques

| Catégorie | Nombre | Pourcentage |
|-----------|--------|-------------|
| **HAUTE Priorité** | 10 | 30% |
| **MOYENNE Priorité** | 13 | 39% |
| **BASSE Priorité** | 10 | 31% |
| **TOTAL** | 33 | 100% |

### Par Module

| Module | TODOs | Pourcentage |
|--------|-------|-------------|
| **Financial** | 11 | 33% |
| **Admin** | 7 | 21% |
| **Workflows** | 4 | 12% |
| **Offline** | 5 | 15% |
| **Monitoring** | 3 | 9% |
| **Reports** | 1 | 3% |
| **Auth** | 1 | 3% |
| **UI** | 1 | 3% |

---

## ✅ Checklist d'Implémentation

### UX & Notifications (HAUTE)
- [ ] Installer système toasts (react-toastify)
- [ ] Ajouter 8 notifications TransactionsTab
- [ ] Connecter 4 opérations workflows aux APIs
- [ ] Tester toutes notifications

### Monitoring & Analytics (MOYENNE)
- [ ] Configurer Sentry error tracking
- [ ] Configurer Google Analytics
- [ ] Implémenter stats offline (4 métriques)
- [ ] Tester error reporting production

### Admin Features (MOYENNE)
- [ ] Reset password flow complet
- [ ] Formulaire création tenant
- [ ] Interface configuration tenant
- [ ] Check permissions rôles dynamique
- [ ] Dashboard admin données réelles
- [ ] Reports history endpoint + UI

### Exports & Advanced (BASSE)
- [ ] Export transactions (PDF/Excel/CSV)
- [ ] Export budgets
- [ ] Historique validations transactions
- [ ] Graphiques monitoring sécurité
- [ ] Offline conflict resolver
- [ ] Drawer modal component
- [ ] Permissions admin layout

---

## 🚀 Estimation Globale

**Temps total estimé**: 7-8 jours développeur
**Complexité**: MOYENNE
**Dépendances**: Backend APIs (certains TODOs)

---

## 📝 Notes Importantes

1. **Prioriser UX**: TODOs notifications (#1) sont critiques pour expérience utilisateur

2. **Backend dependencies**: Certains TODOs nécessitent APIs backend:
   - Reports history
   - Tenant creation/configuration
   - Validation history
   - Export endpoints

3. **Tests requis**: Chaque TODO résolu doit inclure:
   - Tests unitaires composants
   - Tests E2E pour flux critiques
   - Tests accessibilité

4. **Performance**: Monitoring Sentry (#3) permettra d'identifier problèmes performance production

5. **Progressive enhancement**: Implémenter fonctionnalités par ordre priorité, features BASSE peuvent attendre V2

---

## 🎯 Quick Wins (Rapides à implémenter)

Ces TODOs peuvent être résolus rapidement (< 2h chacun):

1. ✅ **Notifications TransactionsTab** - Ajouter toasts (2h)
2. ✅ **Permissions admin layout** - Lire authStore (30min)
3. ✅ **Dashboard admin données** - Connecter service (1h)
4. ✅ **Workflows API calls** - 4 appels à implémenter (2h)

**Total Quick Wins**: ~5.5h = Gains UX immédiats!

---

**Auteur**: Équipe CROU
**Dernière mise à jour**: Octobre 2025
**Version**: 1.0.0

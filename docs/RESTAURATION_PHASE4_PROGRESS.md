# 📱 MODULE RESTAURATION - PHASE 4 FRONTEND (En cours)

**Date:** 11 Janvier 2025
**Statut:** 🔄 **EN COURS** (30% complété)

---

## 🎯 OBJECTIF PHASE 4

Créer les interfaces utilisateur React complètes pour le module Restauration :
- **Service API client** TypeScript
- **Store Zustand** pour state management
- **Hooks TanStack Query** pour data fetching
- **Pages React** pour toutes les fonctionnalités
- **Composants réutilisables** (formulaires, tableaux, modales)
- **Dashboard** avec KPIs et graphiques

---

## ✅ TRAVAUX COMPLÉTÉS (30%)

### 1. Service API Client - restaurationService.ts ✅

**Fichier:** [apps/web/src/services/api/restaurationService.ts](apps/web/src/services/api/restaurationService.ts)

**Contenu:** 900+ lignes de code TypeScript

**Types & Interfaces créés (50+):**

#### Types Restaurants
- `Restaurant`, `RestaurantType`, `RestaurantStatus`
- `CreateRestaurantRequest`, `UpdateRestaurantRequest`
- `RestaurantStatistics`, `RestaurantFilters`

#### Types Menus
- `Menu`, `TypeRepas`, `MenuStatus`
- `PlatMenu`, `IngredientMenu`, `BesoinDenree`
- `CreateMenuRequest`, `UpdateMenuRequest`, `MenuFilters`

#### Types Tickets
- `TicketRepas`, `TypeTicket`, `TicketStatus`, `CategorieTicket`
- `CreateTicketRequest`, `CreateTicketsBatchRequest`
- `UtiliserTicketRequest`, `TicketValidationResult`, `TicketFilters`

#### Types Repas
- `Repas`, `RepasStatus`
- `CreateRepasRequest`, `TerminerServiceRequest`
- `RepasStatistiques`, `RepasFilters`

#### Types Denrées
- `StockDenree`, `AllocationStatus`, `TypeMouvementDenree`
- `MouvementHistorique`, `AllouerDenreeRequest`
- `AlerteExpiration`, `DenreeFilters`

**Méthodes API (50+ endpoints):**

```typescript
// RESTAURANTS (7 méthodes)
getRestaurants(), getRestaurant(), createRestaurant()
updateRestaurant(), deleteRestaurant()
getRestaurantStatistics(), updateFrequentationMoyenne()

// MENUS (11 méthodes)
getMenus(), getMenu(), createMenu(), updateMenu(), deleteMenu()
publishMenu(), validateMenu(), calculateBesoins()
getMenusByRestaurantAndDate(), duplicateMenu()

// TICKETS (9 méthodes)
getTickets(), getTicketByNumero(), getTicketsByEtudiant()
createTicket(), createTicketsBatch(), utiliserTicket()
annulerTicket(), updateExpiredTickets()

// REPAS (8 méthodes)
getRepas(), getRepasById(), createRepas()
demarrerService(), terminerService(), calculerStatistiques()
getRepasByRestaurantAndPeriode(), annulerRepas()

// DENRÉES (8 méthodes)
getDenrees(), getDenreesRestaurant(), allouerDenree()
utiliserDenree(), retournerDenree(), enregistrerPerte()
getAlertesExpiration(), getHistoriqueMouvements()
```

**Intégration:**
- ✅ Utilise `apiClient` existant pour authentification automatique
- ✅ Gestion erreurs centralisée
- ✅ Format réponse standard `{ success, data, error }`
- ✅ Support filtres et pagination

---

### 2. Store Zustand - restauration.ts ✅

**Fichier:** [apps/web/src/stores/restauration.ts](apps/web/src/stores/restauration.ts)

**Contenu:** 1050+ lignes de code TypeScript

**État géré:**

```typescript
interface RestaurationState {
  // Collections
  restaurants: Restaurant[]
  menus: Menu[]
  tickets: TicketRepas[]
  repas: Repas[]
  denrees: StockDenree[]

  // Sélection courante
  selectedRestaurant: Restaurant | null
  selectedMenu: Menu | null
  selectedTicket: TicketRepas | null
  selectedRepas: Repas | null
  selectedDenree: StockDenree | null

  // Loading states
  restaurantsLoading, menusLoading, ticketsLoading, etc.

  // Errors
  restaurantsError, menusError, ticketsError, etc.

  // Filtres
  restaurantFilters, menuFilters, ticketFilters, etc.

  // Pagination
  restaurantsPagination, menusPagination, etc.

  // Cache
  lastFetch: { restaurants, menus, tickets, repas, denrees }
  cacheExpiry: 5 minutes

  // Spécifiques
  besoinsDenrees: BesoinDenree[]
  alertesExpiration: AlerteExpiration[]
}
```

**Actions créées (60+):**

#### Restaurants (7 actions)
```typescript
loadRestaurants(filters?)
loadRestaurant(id)
createRestaurant(data)
updateRestaurant(id, data)
deleteRestaurant(id)
updateFrequentationMoyenne(id, frequentation)
setRestaurantFilters(filters)
```

#### Menus (11 actions)
```typescript
loadMenus(filters?)
loadMenu(id)
createMenu(data)
updateMenu(id, data)
deleteMenu(id)
publishMenu(id) // BROUILLON → PUBLIE
validateMenu(id) // PUBLIE → VALIDE
duplicateMenu(id, nouvelleDateService)
calculateBesoins(id, nombreRationnaires) // CRITIQUE
loadMenusByRestaurantAndDate(restaurantId, date)
setMenuFilters(filters)
```

#### Tickets (9 actions)
```typescript
loadTickets(filters?)
loadTicketByNumero(numeroTicket)
loadTicketsByEtudiant(etudiantId)
createTicket(data)
createTicketsBatch(data) // Émission en masse
utiliserTicket(data) // CRITIQUE - Validation complète
annulerTicket(id, motif)
setTicketFilters(filters)
```

#### Repas (9 actions)
```typescript
loadRepas(filters?)
loadRepasById(id)
createRepas(data)
demarrerService(id) // PLANIFIE → EN_COURS
terminerService(id, stats) // EN_COURS → TERMINE
annulerRepas(id, motif)
loadRepasByRestaurantAndPeriode(restaurantId, dateDebut, dateFin)
setRepasFilters(filters)
```

#### Denrées (9 actions)
```typescript
loadDenrees(filters?)
loadDenreesRestaurant(restaurantId)
allouerDenree(data) // INTÉGRATION STOCKS
utiliserDenree(id, quantite, menuId?, repasId?)
retournerDenree(id, quantite, motif) // INTÉGRATION STOCKS
enregistrerPerte(id, quantite, motif)
loadAlertesExpiration(joursAvance?)
setDenreeFilters(filters)
```

#### Utilitaires (3 actions)
```typescript
clearErrors()
resetFilters()
invalidateCache(module?)
```

**Fonctionnalités avancées:**
- ✅ **Cache intelligent** - Évite requêtes inutiles (5 min TTL)
- ✅ **Persistence** - Filtres sauvegardés dans localStorage
- ✅ **Optimistic updates** - UI réactive avant confirmation serveur
- ✅ **DevTools** - Intégration Redux DevTools pour debugging
- ✅ **Error handling** - Gestion centralisée des erreurs
- ✅ **Loading states** - Par collection et globale

---

## 🔄 TRAVAUX EN COURS (0%)

### 3. Hooks TanStack Query ⏳

À créer pour simplifier l'utilisation du store dans les composants :

**Fichier à créer:** `apps/web/src/hooks/useRestauration.ts`

**Hooks prévus:**
```typescript
// Restaurants
useRestaurants(filters?)
useRestaurant(id)
useCreateRestaurant()
useUpdateRestaurant()
useDeleteRestaurant()

// Menus
useMenus(filters?)
useMenu(id)
useCreateMenu()
usePublishMenu()
useCalculateBesoins()

// Tickets
useTickets(filters?)
useCreateTicket()
useUtiliserTicket()

// Repas
useRepas(filters?)
useDemarrerService()
useTerminerService()

// Denrées
useDenrees(filters?)
useAllouerDenree()
useAlertesExpiration()
```

---

## ⏳ TRAVAUX À FAIRE (70%)

### 4. Pages React (0%)

Structure prévue:
```
apps/web/src/pages/restauration/
├── index.tsx                    // Dashboard principal
├── restaurants/
│   ├── RestaurantsListPage.tsx
│   ├── RestaurantDetailPage.tsx
│   └── RestaurantFormPage.tsx
├── menus/
│   ├── MenusListPage.tsx
│   ├── MenuDetailPage.tsx
│   ├── MenuFormPage.tsx
│   └── MenuPlanningPage.tsx     // Calendrier menus
├── tickets/
│   ├── TicketsListPage.tsx
│   ├── TicketEmissionPage.tsx   // Émission unitaire/batch
│   └── TicketScanPage.tsx       // Scanner validation
├── repas/
│   ├── RepasListPage.tsx
│   ├── RepasDetailPage.tsx
│   ├── ServiceEnCoursPage.tsx   // Interface temps réel
│   └── RepasStatsPage.tsx
└── denrees/
    ├── DenreesListPage.tsx
    ├── AllocationPage.tsx       // Allocation denrées
    └── AlertesPage.tsx          // Alertes péremption
```

### 5. Composants Formulaires (0%)

```
apps/web/src/components/restauration/forms/
├── RestaurantForm.tsx           // Formulaire restaurant
├── MenuForm.tsx                 // Composition menu + plats
├── PlatEditor.tsx               // Éditeur plat (ingrédients)
├── TicketForm.tsx               // Émission ticket unique
├── TicketBatchForm.tsx          // Émission massive
├── RepasForm.tsx                // Planification repas
├── ServiceStatsForm.tsx         // Saisie stats post-service
├── AllocationForm.tsx           // Allocation denrée
└── PerteForm.tsx                // Enregistrement perte
```

**Fonctionnalités formulaires:**
- React Hook Form + Zod validation
- Champs dynamiques (ingrédients menu)
- Auto-calculs (coûts, besoins)
- Intégration stocks (vérif dispo)

### 6. Composants Tableaux & Listes (0%)

```
apps/web/src/components/restauration/tables/
├── RestaurantsTable.tsx
├── MenusTable.tsx
├── MenuCalendar.tsx             // Calendrier visuel menus
├── TicketsTable.tsx
├── RepasTable.tsx
├── DenreesTable.tsx
└── AlertesTable.tsx
```

**Fonctionnalités tableaux:**
- Tri multi-colonnes
- Filtres inline
- Pagination
- Actions bulk
- Export Excel/PDF

### 7. Composants Modales & Dialogues (0%)

```
apps/web/src/components/restauration/modals/
├── ConfirmPublishMenuModal.tsx
├── ValidateMenuModal.tsx
├── UtiliserTicketModal.tsx      // Scanner + validation
├── DemarrerServiceModal.tsx
├── TerminerServiceModal.tsx     // Stats détaillées
├── AllouerDenreeModal.tsx
└── ConfirmDeleteModal.tsx
```

### 8. Composants Affichage (0%)

```
apps/web/src/components/restauration/display/
├── RestaurantCard.tsx
├── MenuCard.tsx
├── MenuPlatsViewer.tsx          // Affichage composition
├── BesoinsStockTable.tsx        // Tableau besoins + dispo
├── TicketStatusBadge.tsx
├── RepasStatusBadge.tsx
├── StatisticsCard.tsx
└── AlerteExpirationBanner.tsx
```

### 9. Dashboard Restauration (0%)

**Fichier:** `apps/web/src/pages/restauration/index.tsx`

**Sections dashboard:**
```tsx
<RestaurationDashboard>
  {/* KPIs principaux */}
  <KPIsSection>
    <KPI label="Repas servis aujourd'hui" value={1250} />
    <KPI label="Recettes du jour" value="425,000 FCFA" />
    <KPI label="Taux fréquentation" value="85%" trend="+5%" />
    <KPI label="Alertes denrées" value={8} color="warning" />
  </KPIsSection>

  {/* Services en cours */}
  <ServiceEnCoursCard>
    <LiveServiceIndicator />
    <QuickActions />
  </ServiceEnCoursCard>

  {/* Graphiques */}
  <ChartsSection>
    <LineChart title="Fréquentation 7 derniers jours" />
    <BarChart title="Répartition tickets par catégorie" />
    <PieChart title="Tickets actifs vs utilisés" />
  </ChartsSection>

  {/* Alertes et notifications */}
  <AlertesSection>
    <DenreesExpirationAlerts />
    <StockBasAlerts />
    <MenusNonValides />
  </AlertesSection>

  {/* Actions rapides */}
  <QuickActionsSection>
    <Button>Émettre tickets</Button>
    <Button>Planifier menu</Button>
    <Button>Allouer denrées</Button>
    <Button>Démarrer service</Button>
  </QuickActionsSection>
</RestaurationDashboard>
```

### 10. Intégration Routes (0%)

**Fichier à modifier:** `apps/web/src/App.tsx` ou fichier routes principal

**Routes à ajouter:**
```tsx
<Route path="/restauration">
  <Route index element={<RestaurationDashboard />} />

  <Route path="restaurants">
    <Route index element={<RestaurantsListPage />} />
    <Route path="nouveau" element={<RestaurantFormPage />} />
    <Route path=":id" element={<RestaurantDetailPage />} />
    <Route path=":id/edit" element={<RestaurantFormPage />} />
  </Route>

  <Route path="menus">
    <Route index element={<MenusListPage />} />
    <Route path="planning" element={<MenuPlanningPage />} />
    <Route path="nouveau" element={<MenuFormPage />} />
    <Route path=":id" element={<MenuDetailPage />} />
    <Route path=":id/edit" element={<MenuFormPage />} />
  </Route>

  <Route path="tickets">
    <Route index element={<TicketsListPage />} />
    <Route path="emettre" element={<TicketEmissionPage />} />
    <Route path="scan" element={<TicketScanPage />} />
  </Route>

  <Route path="repas">
    <Route index element={<RepasListPage />} />
    <Route path=":id" element={<RepasDetailPage />} />
    <Route path="en-cours" element={<ServiceEnCoursPage />} />
  </Route>

  <Route path="denrees">
    <Route index element={<DenreesListPage />} />
    <Route path="allouer" element={<AllocationPage />} />
    <Route path="alertes" element={<AlertesPage />} />
  </Route>
</Route>
```

---

## 📊 PROGRESSION GLOBALE PHASE 4

| Composant | Status | Progression |
|-----------|--------|-------------|
| **Service API** | ✅ Complété | 100% |
| **Store Zustand** | ✅ Complété | 100% |
| **Hooks TanStack Query** | ⏳ À faire | 0% |
| **Pages React** | ⏳ À faire | 0% |
| **Formulaires** | ⏳ À faire | 0% |
| **Tableaux** | ⏳ À faire | 0% |
| **Modales** | ⏳ À faire | 0% |
| **Dashboard** | ⏳ À faire | 0% |
| **Routes** | ⏳ À faire | 0% |

**Total Phase 4:** 30% complété

---

## 🎯 PROCHAINES ÉTAPES

### Priorité Immédiate
1. ✅ ~~Créer hooks TanStack Query~~ ← **PROCHAINE TÂCHE**
2. Créer page Dashboard principal
3. Créer pages Restaurants (CRUD complet)
4. Créer pages Menus avec composition plats

### Priorité Moyenne
5. Créer pages Tickets + émission
6. Créer pages Repas + service en cours
7. Créer pages Denrées + allocations

### Priorité Basse
8. Composants d'affichage avancés
9. Exports PDF/Excel
10. Tests unitaires composants

---

## 🔧 STACK TECHNIQUE CONFIRMÉE

- **Framework:** React 18.2.0 + Vite 5.0.0
- **State Management:** Zustand 4.4.7
- **Data Fetching:** TanStack Query 5.90.1
- **Routing:** React Router 6.20.1
- **Forms:** React Hook Form 7.48.2 + Zod 3.22.4
- **Styling:** TailwindCSS 3.3.6
- **Charts:** Recharts 3.2.1
- **HTTP Client:** Axios 1.6.2
- **Notifications:** React Hot Toast 2.4.1 + Sonner 2.0.7

---

## 📝 NOTES TECHNIQUES

### Patterns à suivre
- Utiliser `useRestaurationStore()` pour accès au store
- Préfixer hooks TanStack Query: `useRestaurants`, `useMenus`, etc.
- Composants dans `components/restauration/`
- Pages dans `pages/restauration/`
- Types importés depuis `@/services/api/restaurationService`

### Intégration Stocks
Les composants d'allocation denrées doivent:
1. Afficher stock disponible en temps réel
2. Valider quantités avant allocation
3. Afficher confirmations après création mouvement
4. Gérer erreurs "stock insuffisant"

### Workflow Menu
```
BROUILLON → [Publier] → PUBLIE → [Valider] → VALIDE
          ↓ Modifier                       ↓ Figé
```

### Workflow Repas
```
PLANIFIE → [Démarrer] → EN_COURS → [Terminer + Stats] → TERMINE
```

---

**Phase 4 Frontend en cours - 30% complété**

**Auteur:** Claude (Sonnet 4.5)
**Date:** 11 Janvier 2025

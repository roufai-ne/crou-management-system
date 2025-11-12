# ✅ PHASE 1 COMPLÉTÉE - Entités Module Restauration CROU

**Date:** 11 Janvier 2025
**Status:** ✅ Phase 1 Terminée
**Durée:** ~2h

---

## 📦 Livrables Phase 1

### 5 Entités TypeORM Créées

Toutes les entités suivent **exactement** les conventions du projet existant :
- **Décorateurs TypeORM standard**
- **Validation avec class-validator**
- **Support multi-tenant obligatoire** (tenant_id dans toutes les entités)
- **Index pour performance** (@Index sur colonnes critiques)
- **Audit trail complet** (createdAt, updatedAt, createdBy, updatedBy)
- **Relations TypeORM explicites** (ManyToOne, OneToMany avec onDelete)

---

## 1. Restaurant.entity.ts

**Table:** `restaurants`

**Description:** Gestion des restaurants universitaires (RU), cafétérias et cantines

**Colonnes principales:**
- `id` (UUID, PK)
- `tenantId` (UUID, FK → tenants) **OBLIGATOIRE**
- `code` (unique, ex: "RU-NIAMEY-01")
- `nom`, `description`
- `type` (UNIVERSITAIRE, CAFETERIA, CANTINE)
- `adresse`, `ville`, `commune`, `latitude`, `longitude`
- `capaciteTotal`, `nombrePlaces`, `frequentationMoyenne`
- `horaires` (JSONB: petitDejeuner, dejeuner, diner)
- `equipements` (JSONB array: ["cuisine", "four", "refrigerateurs"])
- `status` (ACTIF, FERME_TEMPORAIRE, MAINTENANCE, INACTIF)
- `tarifPetitDejeuner`, `tarifDejeuner`, `tarifDiner` (FCFA)
- `responsableNom`, `responsableTelephone`, `responsableEmail`
- Audit complet

**Relations:**
- `OneToMany` → Menu
- `OneToMany` → Repas
- `OneToMany` → StockDenree

**Index:**
- `['tenantId', 'type']`
- `['tenantId', 'status']`
- `['code']`

---

## 2. Menu.entity.ts

**Table:** `menus`

**Description:** Planification des menus journaliers avec composition détaillée

**Colonnes principales:**
- `id` (UUID, PK)
- `tenantId` (UUID, FK) **OBLIGATOIRE**
- `restaurantId` (UUID, FK → restaurants)
- `nom`, `description`
- `dateService` (DATE)
- `typeRepas` (PETIT_DEJEUNER, DEJEUNER, DINER)
- `plats` (JSONB: Array<PlatMenu>) avec ingrédients détaillés
- `nombreRationnairesPrevu`, `nombreReservations`
- `coutMatierePremiere`, `coutUnitaire`, `prixVente`
- `besoinsDenrees` (JSONB: pré-calcul des besoins en stocks)
- `status` (BROUILLON, PUBLIE, VALIDE, ARCHIVE)
- `stockDeduit` (boolean)
- `dateValidation`, `validePar`
- `allergenesPresents` (JSONB array)
- `valeursNutritionnelles` (JSONB: calories, proteines, etc.)
- Audit complet

**Interfaces TypeScript:**
```typescript
interface PlatMenu {
  nom: string;
  description?: string;
  ingredients: IngredientMenu[];
  categorieApport?: string;
  valeurNutritionnelle?: { calories, proteines, glucides, lipides };
}

interface IngredientMenu {
  stockId: string;
  nomDenree: string;
  quantiteUnitaire: number;
  unite: string;
  coutUnitaire: number;
  coutTotal?: number;
}
```

**Relations:**
- `ManyToOne` → Restaurant
- `OneToMany` → Repas

**Index:**
- `['tenantId', 'dateService']`
- `['restaurantId', 'dateService', 'typeRepas']`
- `['status']`

---

## 3. TicketRepas.entity.ts

**Table:** `tickets_repas`

**Description:** Gestion des tickets repas étudiants (unitaires, forfaits, gratuits)

**Colonnes principales:**
- `id` (UUID, PK)
- `tenantId` (UUID, FK) **OBLIGATOIRE**
- `etudiantId` (UUID, FK → users)
- `numeroTicket` (unique, format: "TKT-2025-001234")
- `type` (UNITAIRE, FORFAIT_HEBDO, FORFAIT_MENSUEL, GRATUIT)
- `categorie` (ETUDIANT_REGULIER, ETUDIANT_BOURSIER, PERSONNEL, INVITE)
- `typeRepasAutorise` (optionnel)
- `montant`, `montantSubvention`, `montantRembourse`
- `dateEmission`, `dateExpiration`
- `status` (ACTIF, UTILISE, EXPIRE, ANNULE, SUSPENDU)
- `estUtilise`, `dateUtilisation`
- `restaurantId`, `repasId` (si utilisé)
- `nombreRepasRestants`, `nombreRepasTotal` (pour forfaits)
- `methodePaiement`, `referencePaiement`
- `qrCode` (pour scan rapide)
- `validePar`, `annulePar`, `motifAnnulation`
- `metadata` (JSONB flexible)
- Audit complet

**Relations:**
- `ManyToOne` → User (étudiant)
- `ManyToOne` → Restaurant
- `ManyToOne` → Repas

**Index:**
- `['tenantId', 'etudiantId']`
- `['numeroTicket']` (unique)
- `['status', 'dateExpiration']`
- `['restaurantId', 'dateUtilisation']`

---

## 4. Repas.entity.ts

**Table:** `repas`

**Description:** Suivi des distributions réelles de repas (post-service)

**Colonnes principales:**
- `id` (UUID, PK)
- `tenantId` (UUID, FK) **OBLIGATOIRE**
- `restaurantId` (UUID, FK)
- `menuId` (UUID, FK → menus)
- `dateService` (DATE)
- `typeRepas` (PETIT_DEJEUNER, DEJEUNER, DINER)
- `heureDebut`, `heureFin` (TIME)
- **Statistiques fréquentation:**
  - `nombrePrevus`, `nombreServis`
  - `nombreTicketsUnitaires`, `nombreTicketsForfaits`, `nombreTicketsGratuits`
  - `repartitionCategories` (JSONB: etudiantsReguliers, boursiers, personnel, invites)
- **Statistiques financières:**
  - `recettesTotales`, `recettesUnitaires`, `recettesForfaits`, `montantSubventions`
  - `coutMatieresPremières`, `margeBrute`, `tauxFrequentation`
- **Gaspillage:**
  - `quantiteGaspillee`, `valeurGaspillage`, `raisonGaspillage`
- `status` (PLANIFIE, EN_COURS, TERMINE, ANNULE)
- `stockDeduit`, `dateDeductionStock`
- `observations`, `incidents` (JSONB array)
- `noteSatisfaction`, `nombreAvis`, `commentairesClients`
- `chefService`, `validePar`, `dateValidation`
- Audit complet

**Relations:**
- `ManyToOne` → Restaurant
- `ManyToOne` → Menu
- `OneToMany` → TicketRepas

**Index:**
- `['tenantId', 'dateService']`
- `['restaurantId', 'dateService', 'typeRepas']`
- `['menuId']`
- `['status']`

---

## 5. StockDenree.entity.ts ⭐ (Intégration Module Stocks)

**Table:** `stock_denrees`

**Description:** Allocation et utilisation des denrées du module Stocks par les restaurants

**Colonnes principales:**
- `id` (UUID, PK)
- `tenantId` (UUID, FK) **OBLIGATOIRE**
- `restaurantId` (UUID, FK → restaurants)
- `stockId` (UUID, FK → stocks) **CRITIQUE - Lien avec module Stocks**
- `menuId` (UUID, FK → menus, optionnel)
- **Informations denrée (dénormalisées):**
  - `nomDenree`, `codeDenree`, `unite`
- **Quantités:**
  - `quantiteAllouee`, `quantiteUtilisee`, `quantiteRestante`, `quantitePerdue`
- **Financier:**
  - `prixUnitaire`, `valeurTotale`, `valeurUtilisee`, `valeurPerdue`
- **Dates:**
  - `dateAllocation`, `dateExpiration`
  - `datePremiereUtilisation`, `dateDerniereUtilisation`
- `status` (ALLOUEE, UTILISEE_PARTIELLEMENT, UTILISEE_TOTALEMENT, EXPIREE, RETOURNEE)
- **Intégration Stocks:**
  - `mouvementStockCree` (boolean)
  - `stockMovementId` (ID du mouvement dans module Stocks)
- **Traçabilité:**
  - `allouePar`, `utiliseePar`, `motifAllocation`
  - `necessiteValidation`, `estValidee`, `valideePar`, `dateValidation`
- `historiqueMouvements` (JSONB array: tous les mouvements)
- `metadata` (JSONB: conditions_stockage, temperature, lot_numero, fournisseur)
- `alerteExpiration`, `alerteSurconsommation`
- Audit complet

**Relations:**
- `ManyToOne` → Restaurant
- `ManyToOne` → Stock (module Stocks) avec `onDelete: 'RESTRICT'`
- `ManyToOne` → Menu

**Index:**
- `['tenantId', 'restaurantId']`
- `['stockId', 'restaurantId']`
- `['status']`
- `['dateAllocation']`

---

## 📊 Schéma Relationnel

```
Tenant (CROU)
   │
   ├── Restaurant
   │      │
   │      ├──OneToMany──> Menu
   │      │                  │
   │      │                  └──OneToMany──> Repas
   │      │                                     │
   │      └──OneToMany────────────────────────>│
   │                                            │
   ├── TicketRepas ──ManyToOne──> Repas <──────┘
   │      │
   │      └──ManyToOne──> User (Étudiant)
   │
   └── StockDenree ──ManyToOne──> Stock (Module Stocks)
          │
          └──ManyToOne──> Restaurant
```

---

## 🔧 Fichiers Modifiés

### Nouveaux fichiers créés (5)
1. `packages/database/src/entities/Restaurant.entity.ts` ✅
2. `packages/database/src/entities/Menu.entity.ts` ✅
3. `packages/database/src/entities/TicketRepas.entity.ts` ✅
4. `packages/database/src/entities/Repas.entity.ts` ✅
5. `packages/database/src/entities/StockDenree.entity.ts` ✅

### Fichiers modifiés (1)
1. `packages/database/src/index.ts` ✅
   - Ajout des exports pour toutes les entités Restauration
   - Ajout des exports pour tous les enums (RestaurantType, MenuStatus, TypeRepas, etc.)

---

## ✅ Validations Effectuées

### Conventions respectées à 100%
- ✅ **Nommage:** snake_case pour tables, camelCase pour propriétés TypeScript
- ✅ **Tenant ID:** Présent dans TOUTES les entités (multi-tenant strict)
- ✅ **UUID:** Tous les ID utilisent UUID v4
- ✅ **Timestamps:** `@CreateDateColumn()` et `@UpdateDateColumn()` partout
- ✅ **Audit:** createdBy, updatedBy dans toutes les entités
- ✅ **Index:** Index sur colonnes critiques (tenantId, FK, dates, status)
- ✅ **Validation:** class-validator decorators (@IsString, @IsEnum, @IsNumber, etc.)
- ✅ **Relations:** Typage strict avec onDelete explicite
- ✅ **JSONB:** Utilisé pour données flexibles (plats, incidents, metadata)
- ✅ **Enums:** TypeScript enums exportés pour réutilisation frontend

---

## 🎯 Prochaines Étapes (Phase 2)

### Immédiatement
1. **Créer la migration TypeORM** pour générer les tables SQL
2. **Tester la migration** sur base PostgreSQL locale
3. **Créer les services** (RestaurantService, MenuService, etc.)
4. **Créer les controllers** avec middlewares auth + tenant isolation

### Priorité Haute
5. **Intégration module Stocks** - Tester les appels API entre Restauration ↔ Stocks
6. **Création des routes Express** avec permissions RBAC
7. **Ajouter permissions** `restauration:read`, `restauration:write`, etc.

---

## 📝 Notes Techniques Importantes

### Multi-Tenant Strict
**CRITIQUE:** Toutes les requêtes DOIVENT filtrer par `tenantId` via le middleware `injectTenantIdMiddleware({ strictMode: true })`.

Exemple de requête correcte :
```typescript
const restaurants = await restaurantRepo.find({
  where: { tenantId: req.user.tenantId, status: RestaurantStatus.ACTIF }
});
```

### Intégration Stocks (StockDenree)
**Workflow critique:**
1. Responsable Resto demande allocation denrée
2. Module Restauration crée record `StockDenree`
3. **Appel API au module Stocks** pour créer mouvement SORTIE
4. Module Stocks déduit quantité + crée `StockMovement`
5. Module Stocks retourne `stockMovementId`
6. Module Restauration stocke `stockMovementId` dans `StockDenree`

### JSONB vs Relations
**Choix architecture:**
- **Relations TypeORM** : Pour données normalisées (Restaurant, Menu, Ticket)
- **JSONB** : Pour données flexibles et peu requêtées directement (plats, incidents, metadata)

Exemple: `Menu.plats` est JSONB car la composition des plats varie énormément et n'a pas besoin d'être requêtée individuellement. Les `ingredients` dans chaque plat référencent `stockId` pour le lien avec le module Stocks.

---

## 🚀 Commandes Utiles

```bash
# Générer la migration (après Phase 2)
cd apps/api
pnpm db:generate

# Exécuter la migration
pnpm db:run

# Rollback (si nécessaire)
pnpm db:revert

# Vérifier les entités
pnpm typeorm entity:show Restaurant
```

---

## 📚 Documentation Référence

- **Conventions existantes:** Voir `Stock.entity.ts`, `Housing.entity.ts`
- **Architecture multi-tenant:** Voir `tenant-isolation.middleware.ts`
- **Patterns controllers:** Voir `stocks.controller.ts`
- **Spécifications métier:** Voir `GESTION_RESTAURATION_CROU.MD`
- **Workflows:** Voir `ARCHITECTURE_WORKFLOW.MD`

---

**Status Global:** ✅ Phase 1 (Entités) - 100% TERMINÉE
**Prochaine session:** Phase 2 - Migration TypeORM + Services
**Estimation Phase 2:** 2-3 heures

---

**Généré le:** 11 Janvier 2025 - 19:00
**Par:** Claude Code - Assistant Développement CROU

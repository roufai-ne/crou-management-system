# 🔍 ANALYSE COMPLÈTE - DATABASE, MIGRATIONS & SEEDS

**Date:** 3 Novembre 2025
**Système:** CROU Management System
**Statut:** ⚠️ ERREURS CRITIQUES DÉTECTÉES

---

## 📋 RÉSUMÉ EXÉCUTIF

L'analyse a révélé **5 problèmes critiques** qui empêchent l'exécution des migrations et des seeds:

1. ❌ **Entités manquantes dans datasource** (3 entités Transport)
2. ❌ **Conflit entre Role.entity.ts et Role.simple.entity.ts**
3. ❌ **Référence circulaire Permission ↔ Role**
4. ⚠️ **Migration existante en conflit** (tables déjà créées partiellement)
5. ⚠️ **Seeds utilisant @ts-nocheck** (schéma obsolète)

---

## 🗂️ ENTITÉS ANALYSÉES

### ✅ Entités Core (6)
- `User.entity.ts` - Utilisateurs du système
- `Tenant.entity.ts` - Organisations (CROU + Ministère)
- `Role.simple.entity.ts` - Rôles (version simplifiée) ⚠️ **UTILISÉ**
- `Role.entity.ts` - Rôles (version complète) ⚠️ **NON UTILISÉ**
- `Permission.entity.ts` - Permissions granulaires
- `RefreshToken.entity.ts` - Tokens de rafraîchissement
- `AuditLog.entity.ts` - Logs d'audit

### ✅ Module Financial (5)
- `Budget.entity.ts`
- `BudgetCategory.entity.ts`
- `BudgetTrimester.entity.ts`
- `Transaction.entity.ts`
- `ValidationStep.entity.ts`

### ✅ Module Stocks (4)
- `Stock.entity.ts`
- `StockMovement.entity.ts`
- `StockAlert.entity.ts`
- `Supplier.entity.ts`

### ✅ Module Housing (4)
- `Housing.entity.ts`
- `Room.entity.ts`
- `HousingOccupancy.entity.ts`
- `HousingMaintenance.entity.ts`

### ⚠️ Module Transport (7)
- `Vehicle.entity.ts` ✅ Dans datasource
- `VehicleUsage.entity.ts` ✅ Dans datasource
- `VehicleMaintenance.entity.ts` ✅ Dans datasource
- `VehicleFuel.entity.ts` ✅ Dans datasource
- `Driver.entity.ts` ❌ **MANQUANT dans datasource**
- `ScheduledTrip.entity.ts` ❌ **MANQUANT dans datasource**
- `TransportRoute.entity.ts` ❌ **MANQUANT dans datasource**

### ✅ Module Workflows (4)
- `Workflow.entity.ts`
- `WorkflowStep.entity.ts`
- `WorkflowInstance.entity.ts`
- `WorkflowAction.entity.ts`

### ✅ Module Notifications (2)
- `Notification.entity.ts`
- `NotificationPreference.entity.ts`

**TOTAL:** 33 entités (30 dans datasource, 3 manquantes)

---

## 🔴 PROBLÈME #1: Entités Transport Manquantes

### Description
Le fichier `datasource.ts` ne charge pas 3 entités du module Transport, ce qui cause des erreurs dans les services.

### Fichier Affecté
`packages/database/src/config/datasource.ts` (lignes 72-76)

### Code Actuel
```typescript
// Module Transport
path.join(__dirname, '../entities/Vehicle.entity.{ts,js}'),
path.join(__dirname, '../entities/VehicleUsage.entity.{ts,js}'),
path.join(__dirname, '../entities/VehicleMaintenance.entity.{ts,js}'),
path.join(__dirname, '../entities/VehicleFuel.entity.{ts,js}'),
```

### Code Requis
```typescript
// Module Transport
path.join(__dirname, '../entities/Vehicle.entity.{ts,js}'),
path.join(__dirname, '../entities/VehicleUsage.entity.{ts,js}'),
path.join(__dirname, '../entities/VehicleMaintenance.entity.{ts,js}'),
path.join(__dirname, '../entities/VehicleFuel.entity.{ts,js}'),
path.join(__dirname, '../entities/Driver.entity.{ts,js}'),           // MANQUANT
path.join(__dirname, '../entities/ScheduledTrip.entity.{ts,js}'),    // MANQUANT
path.join(__dirname, '../entities/TransportRoute.entity.{ts,js}'),   // MANQUANT
```

### Impact
- ❌ Services transport ne peuvent pas accéder aux entités Driver, ScheduledTrip, TransportRoute
- ❌ Migrations ne peuvent pas créer les tables correspondantes
- ❌ Seeds ne peuvent pas insérer les données de test

---

## 🔴 PROBLÈME #2: Conflit Role.entity vs Role.simple

### Description
Il existe deux versions de l'entité Role:
- `Role.entity.ts` - Version complète avec ManyToMany vers Permission
- `Role.simple.entity.ts` - Version simplifiée sans relations Permission

Le datasource utilise `Role.simple` mais `Permission.entity.ts` importe `Role.entity`, créant une incohérence.

### Fichiers Affectés
1. `packages/database/src/config/datasource.ts:48`
   ```typescript
   path.join(__dirname, '../entities/Role.simple.entity.{ts,js}'),  // Utilisé
   ```

2. `packages/database/src/entities/Permission.entity.ts:43`
   ```typescript
   import { Role } from './Role.entity';  // Référence Role.entity (pas simple)
   ```

### Impact
- ❌ TypeORM ne peut pas résoudre les metadata: `Entity metadata for Permission#roles was not found`
- ❌ Seeds ne peuvent pas créer les relations Role-Permission
- ❌ Relation ManyToMany impossible entre Role et Permission

### Solutions Possibles

**Option A:** Utiliser Role.entity.ts (RECOMMANDÉ)
```typescript
// datasource.ts
path.join(__dirname, '../entities/Role.entity.{ts,js}'),  // Utiliser la version complète
```

**Option B:** Corriger Permission.entity.ts
```typescript
// Permission.entity.ts
import { Role } from './Role.simple.entity';  // Utiliser simple
// ET supprimer @ManyToMany(() => Role, ...) de Permission
```

---

## 🔴 PROBLÈME #3: Référence Circulaire Permission ↔ Role

### Description
`Permission.entity.ts` et `Role.entity.ts` s'importent mutuellement:
- Permission importe Role
- Role importe Permission

### Code Problématique

**Permission.entity.ts**
```typescript
import { Role } from './Role.entity';  // ligne 43

@ManyToMany(() => Role, (role) => role.permissions)  // ligne 104
roles: Role[];
```

**Role.entity.ts**
```typescript
import { Permission } from './Permission.entity';  // ligne 37

@ManyToMany(() => Permission, (permission) => permission.roles, {  // ligne 78
  cascade: true,
  eager: false
})
@JoinTable({ ... })
permissions: Permission[];
```

### Impact
- ⚠️ Peut causer des problèmes de chargement de modules
- ⚠️ TypeORM peut avoir du mal à résoudre les relations
- ✅ Fonctionne actuellement avec les decorators () => ...

### Solution
Utiliser les factory functions TypeORM (déjà implémenté):
```typescript
@ManyToMany(() => Role, ...)  // Lazy loading avec arrow function
```

**Statut:** ✅ Déjà implémenté correctement, mais nécessite que les deux entités soient chargées.

---

## ⚠️ PROBLÈME #4: Migration en Conflit

### Description
La migration `1761901042893-InitialSchema.ts` échoue car:
1. La table `users` existe déjà
2. La colonne `first_name` existe déjà
3. La migration essaie d'ajouter des colonnes existantes

### Erreur
```
query failed: ALTER TABLE "users" ADD "first_name" character varying(100)
error: la colonne « first_name » de la relation « users » existe déjà
```

### Tables Déjà Créées (Partielles)
- ✅ `users` (avec first_name, last_name, is_active)
- ✅ `stocks`
- ✅ `audit_logs`
- ✅ `stock_movements`
- ✅ `tenants`
- ✅ `roles`
- ❌ `suppliers` (pas créée)
- ❌ `notifications` (pas créée)
- ❌ `notification_preferences` (pas créée)
- ❌ `permissions` (pas créée)
- ❌ `role_permissions` (pas créée)

### Solutions Possibles

**Option A:** Supprimer la base et recréer (DESTRUCTIF)
```bash
# Supprimer toutes les tables
psql -U crou_user -d crou_database -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"

# Relancer les migrations
cd packages/database && npm run migration:run
```

**Option B:** Créer une nouvelle migration incrémentale
```bash
# Générer une migration pour les tables manquantes seulement
cd packages/database && npm run migration:generate src/migrations/AddMissingTables
```

**Option C:** Synchronisation manuelle (RISQUÉ)
```typescript
// Activer synchronize temporairement
synchronize: true  // dans datasource.ts
```

---

## ⚠️ PROBLÈME #5: Seeds avec @ts-nocheck

### Description
Les 3 fichiers de seeds utilisent `// @ts-nocheck` en première ligne, indiquant que:
1. Le schéma des entities a changé depuis la création des seeds
2. Il y a des erreurs TypeScript dans les seeds
3. Les seeds peuvent insérer des données incompatibles

### Fichiers Affectés
- `packages/database/src/seeds/001-tenants.seed.ts`
- `packages/database/src/seeds/002-roles-permissions.seed.ts`
- `packages/database/src/seeds/003-users.seed.ts`

### Erreurs Potentielles

**001-tenants.seed.ts**
```typescript
// Utilise des propriétés qui n'existent peut-être pas:
contactEmail: 'contact@mesr.gouv.ne',    // Vérifié dans Tenant entity?
contactPhone: '+227 20 73 31 29',        // Existe?
address: 'Avenue du Général de Gaulle',  // Existe?
```

**002-roles-permissions.seed.ts**
```typescript
// Crée la relation Role-Permission avec quelle table?
// Si on utilise Role.simple, il n'y a PAS de relation ManyToMany!
```

**003-users.seed.ts**
```typescript
// Utilise UserStatus enum correctement?
// Hash du mot de passe avec bcrypt?
```

### Impact
- ⚠️ Seeds peuvent échouer silencieusement
- ⚠️ Données insérées peuvent être incomplètes
- ⚠️ Pas de validation TypeScript

### Solution
Supprimer `@ts-nocheck` et corriger toutes les erreurs TypeScript révélées.

---

## 📊 ÉTAT DES MIGRATIONS

### Migration Existante
- **Fichier:** `1761901042893-InitialSchema.ts`
- **Statut:** ❌ Échoue (colonne first_name existe déjà)
- **Tables Créées:** Partielles (suppliers, notifications, permissions manquantes)
- **Date:** 30 janvier 2025 (timestamp 1761901042893)

### Migration Supprimée
- **Fichier:** `001-create-rbac-entities.ts` (supprimé)
- **Raison:** Nom de classe incorrect (CreateRbacEntities1703000001 sans timestamp JavaScript)

### Tables Manquantes
1. `drivers` - Chauffeurs
2. `scheduled_trips` - Trajets planifiés
3. `transport_routes` - Routes de transport
4. Possiblement d'autres si migration n'a pas complété

---

## 🔧 CONFIGURATION TYPEORM

### datasource.ts
```typescript
// Configuration actuelle
entities: [
  // 30 entités chargées
  // MANQUE: Driver, ScheduledTrip, TransportRoute
],
migrations: [
  path.join(__dirname, '../migrations/*.{ts,js}')
],
synchronize: false,  // ✅ Correct (production-safe)
logging: ['query', 'error', 'warn']
```

### typeorm.config.ts (API)
**Statut:** ✅ Vérifié précédemment, utilise AppDataSource

---

## 📦 ÉTAT DES SEEDS

### Ordre d'Exécution Prévu
1. **001-tenants.seed.ts** - 9 organisations (1 Ministère + 8 CROU)
2. **002-roles-permissions.seed.ts** - 8 rôles + 40 permissions
3. **003-users.seed.ts** - 26 utilisateurs initiaux

### Données à Insérer
- **Tenants:** 9 (Ministère + 8 CROU régionaux)
- **Rôles:** 8 (ministre, directeur, comptable, etc.)
- **Permissions:** ~40 (dashboard, financial, stocks, etc.)
- **Utilisateurs:** 26 (1 super admin + 25 utilisateurs CROU)

### Credentials Super Admin
```
Email: admin@crou.ne
Mot de passe: Admin@2025!
```

---

## 🎯 PLAN D'ACTION RECOMMANDÉ

### Phase 1: Corriger le Datasource ⚡ URGENT
```typescript
// packages/database/src/config/datasource.ts

// 1. Utiliser Role.entity.ts au lieu de Role.simple.entity.ts
path.join(__dirname, '../entities/Role.entity.{ts,js}'),

// 2. Ajouter les 3 entités Transport manquantes
path.join(__dirname, '../entities/Driver.entity.{ts,js}'),
path.join(__dirname, '../entities/ScheduledTrip.entity.{ts,js}'),
path.join(__dirname, '../entities/TransportRoute.entity.{ts,js}'),
```

### Phase 2: Nettoyer la Base de Données
```bash
# Option destructive (développement uniquement)
psql -U crou_user -d crou_database <<EOF
DROP SCHEMA public CASCADE;
CREATE SCHEMA public;
GRANT ALL ON SCHEMA public TO crou_user;
EOF
```

### Phase 3: Générer une Nouvelle Migration
```bash
cd packages/database

# Supprimer l'ancienne migration problématique
rm src/migrations/1761901042893-InitialSchema.ts

# Générer une nouvelle migration complète
npm run migration:generate src/migrations/CompleteSchema
```

### Phase 4: Exécuter les Migrations
```bash
cd packages/database
npm run migration:run
```

### Phase 5: Corriger les Seeds
```bash
# Supprimer @ts-nocheck de chaque seed
# Corriger les erreurs TypeScript révélées
# Vérifier que les propriétés utilisées existent dans les entités
```

### Phase 6: Exécuter les Seeds
```bash
cd packages/database
npm run seed:run
```

---

## 📝 COMMANDES UTILES

### Vérifier l'État des Migrations
```bash
cd packages/database
npm run migration:show
```

### Rollback Migration
```bash
cd packages/database
npm run migration:revert
```

### Accès Direct PostgreSQL
```bash
# Connexion
psql -U crou_user -d crou_database

# Lister les tables
\dt

# Voir la structure d'une table
\d users

# Quitter
\q
```

### Rebuild Complet
```bash
# Backend
cd apps/api
npm run build

# Database
cd packages/database
npm run build
```

---

## ⚠️ AVERTISSEMENTS

1. **NE PAS ACTIVER `synchronize: true` EN PRODUCTION**
   - Risque de perte de données
   - Utilisez toujours les migrations

2. **BACKUP AVANT TOUTE OPÉRATION DESTRUCTIVE**
   ```bash
   pg_dump -U crou_user crou_database > backup_$(date +%Y%m%d_%H%M%S).sql
   ```

3. **TESTER EN DÉVELOPPEMENT D'ABORD**
   - Valider toutes les corrections en dev
   - Créer des migrations de test
   - Vérifier les seeds avec des données de test

4. **DOCUMENTER LES CHANGEMENTS**
   - Chaque migration doit avoir un commentaire
   - Chaque seed doit expliquer son objectif
   - Tenir à jour ce document d'analyse

---

## 📚 RÉFÉRENCES

### Documentation TypeORM
- Migrations: https://typeorm.io/migrations
- Relations: https://typeorm.io/relations
- Entities: https://typeorm.io/entities

### Fichiers Clés
- [packages/database/src/config/datasource.ts](packages/database/src/config/datasource.ts)
- [packages/database/src/entities/](packages/database/src/entities/)
- [packages/database/src/migrations/](packages/database/src/migrations/)
- [packages/database/src/seeds/](packages/database/src/seeds/)

---

## 📞 SUPPORT

En cas de problème:
1. Vérifier les logs: `apps/api/logs/`
2. Consulter ce document
3. Vérifier la documentation TypeORM
4. Contacter l'équipe infrastructure

---

**Dernière Mise à Jour:** 3 Novembre 2025
**Analysé Par:** Claude Code Assistant
**Statut:** ⚠️ CORRECTIONS REQUISES AVANT DÉPLOIEMENT

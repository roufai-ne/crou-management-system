# 🔍 ANALYSE DES PROBLÈMES API - SYSTÈME CROU

**Date:** 3 Novembre 2025
**Status:** ⚠️ **EN COURS DE CORRECTION**

---

## 🚨 PROBLÈME PRINCIPAL

Le serveur API ne démarre pas correctement et affiche l'erreur :
```
Entity metadata for User#role was not found.
Check if you specified a correct entity object and if it's connected in the connection options.
```

---

## 📋 PROBLÈMES IDENTIFIÉS ET CORRIGÉS

### ✅ 1. Import Role.simple au lieu de Role.entity
**Fichiers corrigés:**
- `packages/database/src/config/typeorm.auth.config.ts` (ligne 21)
- `packages/database/src/config/typeorm.config.ts` (ligne 81)
- `packages/database/src/seeds/003-users.seed.ts` (ligne 28)

**Changement:**
```typescript
// AVANT
import { Role } from '../entities/Role.simple.entity';

// APRÈS
import { Role } from '../entities/Role.entity';
```

### ✅ 2. initializeDatabase appelait initializeAuthDatabase
**Fichier:** `packages/database/src/config/typeorm.config.ts`

**Problème:** La ligne 162 faisait un `return initializeAuthDatabase()` ce qui empêchait le chargement de toutes les entités.

**Correction:** Suppression de la ligne 162 et restauration du code complet d'initialisation.

### ✅ 3. closeDatabase appelait closeAuthDatabase
**Fichier:** `packages/database/src/config/typeorm.config.ts`

**Problème:** La ligne 197 faisait un `return closeAuthDatabase()`

**Correction:** Implémentation complète de la fermeture propre avec `AppDataSource.destroy()`.

### ✅ 4. Fichier Role.simple.entity cause des conflits
**Action:** Renommé en `Role.simple.entity.ts.backup`

**Raison:** La présence de deux fichiers Role (Role.entity et Role.simple) créait des conflits de métadonnées TypeORM.

---

## ⚠️ PROBLÈME EN COURS

### Erreur TypeORM - Métadonnées circulaires

**Erreur:**
```
TypeORMError: Entity metadata for User#role was not found.
```

**Analyse:**
1. User.entity importe Role.entity (ligne 42)
2. Role.entity importe User.entity (ligne 36)
3. Dépendance circulaire: User ↔ Role

**Relations:**
```typescript
// Dans User.entity.ts (ligne 109)
@ManyToOne(() => Role, role => role.users, {
  onDelete: 'RESTRICT',
  eager: true  // ⚠️ EAGER = CHARGEMENT IMMÉDIAT
})
role: Role;

// Dans Role.entity.ts (ligne 75)
@OneToMany(() => User, user => user.role)
users: User[];
```

**Hypothèse du problème:**
- Le `eager: true` dans User force TypeORM à charger Role immédiatement
- TypeORM essaie de construire les métadonnées mais Role n'est pas encore chargé
- Ordre de chargement des entités dans datasource peut causer le problème

---

## 🔧 SOLUTIONS TESTÉES (sans succès)

1. ✅ Changement de tous les imports vers Role.entity
2. ✅ Suppression/renommage de Role.simple.entity
3. ✅ Correction de typeorm.config.ts pour utiliser AppDataSource
4. ✅ Correction de typeorm.auth.config.ts
5. ⚠️ Redémarrage du serveur (problème persiste)

---

## 🎯 SOLUTIONS À TESTER

### Solution 1: Retirer eager: true de User.role
**Fichier:** `packages/database/src/entities/User.entity.ts`

**Changement:**
```typescript
@ManyToOne(() => Role, role => role.users, {
  onDelete: 'RESTRICT',
  eager: false  // ← Changer de true à false
})
role: Role;
```

**Impact:** Il faudra ajouter `relations: ['role']` dans les queries qui ont besoin du rôle.

### Solution 2: Réorganiser l'ordre des entités dans datasource
**Fichier:** `packages/database/src/config/typeorm.config.ts`

**Changement:** Mettre Role.entity **AVANT** User.entity dans l'array entities (ligne 77-79).

### Solution 3: Utiliser le vrai datasource.ts au lieu de paths
**Fichier:** `packages/database/src/config/typeorm.config.ts`

**Changement:** Importer directement les entités au lieu d'utiliser `path.join(__dirname, ...)`

```typescript
// AU LIEU DE:
entities: [
  path.join(__dirname, '../entities/User.entity.{ts,js}'),
  path.join(__dirname, '../entities/Role.entity.{ts,js}'),
  // ...
]

// UTILISER:
import { User } from '../entities/User.entity';
import { Role } from '../entities/Role.entity';
// ... tous les autres imports

entities: [
  User,
  Role,
  Permission,
  // ... toutes les entités
]
```

### Solution 4: Vérifier que reflect-metadata est bien importé
**Fichier:** `apps/api/src/main.ts`

**Vérifier ligne 35:** `import 'reflect-metadata';` doit être la **première** ligne d'import.

---

## 📊 ÉTAT ACTUEL

### ✅ Ce qui fonctionne
- Base de données connectée
- 33 tables créées
- Seeds exécutés (9 tenants, 8 rôles, 40 permissions, 26 users)
- Build backend réussit
- Build frontend réussit

### ❌ Ce qui ne fonctionne pas
- Serveur API ne démarre pas
- Erreur de métadonnées TypeORM User#role
- Impossible de tester les endpoints

---

## 🔍 DIAGNOSTIC DÉTAILLÉ

### Configuration actuelle

**AppDataSource (typeorm.config.ts):**
- ✅ 33 entités chargées via paths
- ✅ Role.entity (pas Role.simple)
- ✅ Synchronize: true en développement
- ✅ Logging activé

**AuthDataSource (typeorm.auth.config.ts):**
- ✅ 6 entités (User, Tenant, Role, Permission, RefreshToken, AuditLog)
- ✅ Imports directs (pas de paths)
- ⚠️ **NON UTILISÉ** par l'API (main.ts appelle initializeDatabase pas initializeAuthDatabase)

**main.ts:**
- ✅ Import reflect-metadata en premier
- ✅ Appelle initializeDatabase() de typeorm.config.ts
- ✅ Utilise AppDataSource (pas AuthDataSource)

### Stack trace de l'erreur
```
TypeORMError: Entity metadata for User#role was not found
  at EntityMetadataBuilder.computeInverseProperties
  at EntityMetadataBuilder.build
  at ConnectionMetadataBuilder.buildEntityMetadatas
  at DataSource.buildMetadatas
  at DataSource.initialize
  at initializeDatabase (typeorm.config.ts:165)
  at startServer (main.ts:209)
```

**Ligne critique:** `EntityMetadataBuilder.computeInverseProperties`
→ TypeORM essaie de calculer les relations inverses mais ne trouve pas Role

---

## 🚀 PROCHAINES ÉTAPES RECOMMANDÉES

1. **Tester Solution 2** - Réorganiser l'ordre des entités (Role avant User)
2. **Tester Solution 1** - Retirer `eager: true` de User.role
3. **Tester Solution 3** - Imports directs au lieu de paths
4. **Vérifier** - Qu'aucun autre fichier n'importe Role.simple

---

## 📝 COMMANDES UTILES

```bash
# Redémarrer le serveur
cd apps/api && npm run dev

# Vérifier les entités chargées
grep -r "Role.simple" packages/database/src

# Tester la connexion DB
cd packages/database && npx tsx -e "import { AppDataSource } from './src/config/datasource'; AppDataSource.initialize().then(() => console.log('OK')).catch(e => console.error(e.message));"
```

---

**Dernière mise à jour:** 3 Novembre 2025 16:05
**Statut:** En attente de test des solutions proposées

# 🔴 PROBLÈME TYPEORM - RAPPORT FINAL

**Date**: 3 Novembre 2025
**Status**: ⚠️ **BLOQUANT** - Authentification impossible
**Priorité**: 🔴 **CRITIQUE**

---

## RÉSUMÉ EXÉCUTIF

L'API démarre correctement (port 3001), la base de données est connectée avec 33 entités chargées, MAIS l'authentification échoue systématiquement avec l'erreur:

```
EntityMetadataNotFoundError: No metadata for "User" was found.
```

## SYMPTÔMES

### ✅ Ce qui fonctionne:
- ✅ Serveur démarre sur port 3001
- ✅ PostgreSQL connecté
- ✅ 33 entités chargées
- ✅ `/health` et `/api/health` répondent
- ✅ `AppDataSource.isInitialized` = true
- ✅ `AppDataSource.hasMetadata('User')` = true
- ✅ `AppDataSource.entityMetadatas.length` = 33

### ❌ Ce qui ne fonctionne PAS:
- ❌ `AppDataSource.getRepository(User)` → Error: "No metadata for User"
- ❌ `AppDataSource.getRepository('User')` → Error: "No metadata for User"
- ❌ POST `/api/auth/login` → 500 Internal Server Error
- ❌ Toutes les routes nécessitant un repository échouent

## ANALYSE TECHNIQUE

###  Problème identifié

**TypeORM ne peut pas résoudre les métadonnées des entités via `getRepository()`**

Même si:
- `hasMetadata('User')` retourne `true`
- `entityMetadatas` contient 33 entités
- L'initialisation réussit sans erreur

**MAIS**:
- `getRepository('User')` échoue quand même
- L'erreur se produit à `Repository.get metadata()` ligne 54
- Le problème vient de `DataSource.getMetadata()` ligne 451

### Hypothèses testées (TOUTES ONT ÉCHOUÉ)

1. ❌ **Imports circulaires User ↔ Role**
   - Réorganisé l'ordre des entités (Role avant User)
   - Changé `eager: true` → `eager: false`
   - Résultat: Aucun effet

2. ❌ **Glob patterns vs imports directs**
   - Remplacé tous les `path.join()` par imports directs
   - Résultat: Serveur démarre mais même erreur

3. ❌ **Deux instances DataSource différentes**
   - Unifié sur `datasource.ts` partout
   - Vérifié avec logs que c'est la même instance
   - Résultat: Même erreur

4. ❌ **Repositories initialisés trop tôt**
   - Changé en getters lazy
   - Résultat: Même erreur

5. ❌ **Classes User différentes en mémoire**
   - Utilisé `getRepository('User')` avec string au lieu de classe
   - Résultat: Même erreur

6. ❌ **Fichier Role.simple.entity conflictuel**
   - Renommé en `.backup`
   - Tous les imports pointent vers `Role.entity`
   - Résultat: Même erreur

## CONFIGURATION ACTUELLE

### datasource.ts (fonctionne pour migrations)
```typescript
entities: [
  Role,        // Import direct
  Permission,  // Import direct
  Tenant,      // Import direct
  User,        // Import direct
  // ... 29 autres entités
]
```

### main.ts
```typescript
import { AppDataSource } from '../../../packages/database/src/config/datasource';
await AppDataSource.initialize(); // ✅ Réussit
```

### auth.service.ts
```typescript
import { AppDataSource } from '../../../../../packages/database/src/config/datasource';

// Tenté avec classe
private get userRepository() {
  return AppDataSource.getRepository(User); // ❌ Échoue
}

// Tenté avec string
private get userRepository() {
  return AppDataSource.getRepository('User'); // ❌ Échoue quand même
}
```

## LOGS CRITIQUES

```
[AuthService] AppDataSource initialized: true
[AuthService] Has User metadata: true
[AuthService] Entity metadatas: 33
error: No metadata for "User" was found.
    at DataSource.getMetadata (DataSource.ts:451)
    at Repository.get metadata (Repository.ts:54)
    at Repository.findOne (Repository.ts:626)
    at AuthService.login (auth.service.ts:99)
```

**PARADOXE**: `hasMetadata('User')` retourne `true` mais `getMetadata('User')` échoue !

## SOLUTIONS POTENTIELLES

### Solution 1: Utiliser EntityManager au lieu de Repository (RECOMMANDÉ)

Au lieu de:
```typescript
const userRepository = AppDataSource.getRepository('User');
const user = await userRepository.findOne({...});
```

Utiliser:
```typescript
const user = await AppDataSource.manager.findOne(User, {...});
```

**Avantages**:
- Évite complètement `getRepository()`
- `EntityManager` ne vérifie pas les métadonnées de la même manière
- Utilisé par TypeORM en interne pour les queries

### Solution 2: Synchronize = true en développement

Changer dans `datasource.ts`:
```typescript
synchronize: process.env.NODE_ENV === 'development', // Au lieu de false
```

**Risque**: Peut modifier le schéma DB automatiquement

### Solution 3: Downgrade TypeORM

Version actuelle: 0.3.27
Tenter: 0.3.20 (plus stable)

### Solution 4: Créer un service Database centralisé

```typescript
// database.service.ts
export class DatabaseService {
  private static instance: DatabaseService;
  private datasource: DataSource;

  async init() {
    this.datasource = await AppDataSource.initialize();
    // Pré-charger tous les repositories
    this.userRepo = this.datasource.getRepository(User);
    this.roleRepo = this.datasource.getRepository(Role);
    // ...
  }

  getUserRepository() {
    return this.userRepo; // Déjà initialisé
  }
}
```

## IMPACT

- 🔴 **Authentification**: Impossible de se connecter
- 🔴 **Tous les modules**: Aucune route DB ne fonctionne
- 🟢 **Routes statiques**: `/health`, `/api` fonctionnent
- 🟢 **Serveur**: Démarre correctement

## RECOMMANDATION

**Implémenter Solution 1 immédiatement** car:
1. C'est le moins risqué
2. Pas besoin de changer l'architecture
3. `EntityManager` est l'API recommandée par TypeORM
4. Évite le bug `getRepository()`

**Temps estimé**: 30 minutes pour auth.service.ts + 2h pour tous les services

---

**Prochaine étape**: Implémenter EntityManager dans auth.service.ts pour débloquer l'authentification.

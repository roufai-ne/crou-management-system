# Analyse des TODOs Backend

**Date**: Octobre 2025
**Total TODOs**: 14
**Statut**: Documentés et priorisés

---

## 📊 Résumé

Le backend contient **14 TODOs** répartis dans 5 modules principaux:
- Auth/RBAC: 5 TODOs
- Financial: 6 TODOs
- Dashboard: 2 TODOs
- Reports: 1 TODO

---

## 🎯 Classification par Priorité

### 🔴 PRIORITÉ HAUTE - Fonctionnalités critiques (7 TODOs)

#### 1. RBAC - Permissions Dynamiques
**Fichier**: `apps/api/src/modules/auth/rbac.service.ts:206`
```typescript
// TODO: Implémenter la logique des conditions dynamiques des permissions
```

**Impact**: ⚠️ **CRITIQUE** - Sécurité et contrôle d'accès granulaire
**Description**: Les permissions peuvent avoir des conditions dynamiques (ex: "peut modifier SI créateur" ou "peut lire SI même tenant"). Actuellement non implémenté.
**Action Recommandée**: Implémenter un système de règles conditionnelles pour les permissions
```typescript
interface PermissionCondition {
  type: 'owner' | 'tenant' | 'role' | 'custom';
  field: string;
  operator: 'equals' | 'includes' | 'greater_than' | 'less_than';
  value: any | ((context: any) => any);
}
```

---

#### 2. RBAC - Chargement Permissions depuis BD
**Fichier**: `apps/api/src/modules/auth/rbac.service.ts:335`
```typescript
// TODO: Charger les permissions depuis la base de données
```

**Impact**: ⚠️ **CRITIQUE** - Actuellement utilise des permissions en dur
**Description**: Les permissions doivent être chargées dynamiquement depuis la base de données au lieu d'être codées en dur.
**Action Recommandée**:
- Créer méthode `loadPermissionsFromDB()` dans rbac.service.ts
- Utiliser repository Permission
- Mettre en cache avec invalidation

---

#### 3. Auth - Vraies Requêtes DB
**Fichier**: `apps/api/src/modules/auth/auth.service.simple.ts:65`
```typescript
// TODO: Remplacer par de vraies requêtes DB une fois les imports résolus
```

**Impact**: ⚠️ **CRITIQUE** - Service utilise des données mock
**Description**: Le service auth simple utilise des données mockées au lieu de vraies requêtes DB.
**Action Recommandée**:
- Résoudre les imports TypeORM
- Implémenter vraies requêtes avec UserRepository
- Supprimer auth.service.simple.ts après migration vers auth.service.ts

---

#### 4. Decorator Processor - getUserPermissions
**Fichier**: `apps/api/src/shared/middlewares/decorator-processor.middleware.ts:222`
```typescript
// TODO: Implémenter getUserPermissions dans le service RBAC
```

**Impact**: ⚠️ **HAUTE** - Validation des permissions via décorateurs
**Description**: Middleware de décorateurs ne peut pas récupérer les permissions utilisateur.
**Action Recommandée**: Ajouter méthode `getUserPermissions(userId)` dans rbac.service.ts

---

#### 5-6. Tenant Isolation - Validation Permissions
**Fichiers**:
- `apps/api/src/shared/middlewares/tenant-isolation.middleware.ts:349`
- `apps/api/src/shared/middlewares/tenant-isolation.middleware.ts:352`

```typescript
// TODO: implémenter validateUserPermissions
// TODO: Implémenter la validation des permissions via le service RBAC
```

**Impact**: ⚠️ **HAUTE** - Isolation multi-tenant avec permissions
**Description**: Middleware d'isolation tenant ne valide pas les permissions utilisateur.
**Action Recommandée**: Implémenter `validateUserPermissions()` en utilisant RBAC service

---

#### 7. Reports - Génération PDF/Excel/CSV
**Fichier**: `apps/api/src/modules/reports/reports.service.ts:413`
```typescript
// TODO: Implémenter la génération réelle de PDF/Excel/CSV
```

**Impact**: ⚠️ **HAUTE** - Fonctionnalité business critique
**Description**: Export de rapports actuellement simulé.
**Action Recommandée**:
- Utiliser `pdfkit` pour PDF
- Utiliser `exceljs` pour Excel
- Utiliser `csv-writer` pour CSV

---

### 🟡 PRIORITÉ MOYENNE - Fonctionnalités avancées (5 TODOs)

#### 8. Financial - Export Réel
**Fichier**: `apps/api/src/modules/financial/financial.service.ts:685`
```typescript
// TODO: Implémenter l'export réel avec exceljs/pdfkit
```

**Impact**: 🟡 **MOYENNE** - Fonctionnalité complémentaire
**Description**: Export financier actuellement retourne données JSON au lieu de vrais fichiers.
**Action Recommandée**:
- Installer `exceljs` et `pdfkit`
- Créer service `financial-export.service.ts`
- Implémenter templates pour rapports financiers

---

#### 9. Financial - Évolution Temporelle
**Fichier**: `apps/api/src/modules/financial/financial.service.ts:800`
```typescript
// TODO: Implémenter évolution temporelle
```

**Impact**: 🟡 **MOYENNE** - Analytics avancé
**Description**: Graphiques d'évolution des finances dans le temps non implémentés.
**Action Recommandée**:
- Implémenter requêtes groupées par période (jour/semaine/mois/année)
- Retourner séries temporelles pour graphiques

---

#### 10-12. Financial - BudgetCategory
**Fichiers**:
- `apps/api/src/modules/financial/financial.service.ts:527`
- `apps/api/src/modules/financial/financial.service.ts:543`
- `apps/api/src/modules/financial/financial.service.ts:552`

```typescript
// TODO: Implémenter entité BudgetCategory si nécessaire
// TODO: Implémenter avec entité BudgetCategory
// TODO: Implémenter avec entité BudgetCategory
```

**Impact**: 🟡 **MOYENNE** - Gestion budgétaire avancée
**Description**: Système de catégories budgétaires non implémenté.
**Action Recommandée**:
- Créer entité `BudgetCategory` si besoin réel validé
- Sinon, utiliser enum ou champ string dans Transaction

---

### 🟢 PRIORITÉ BASSE - Implémentations futures (2 TODOs)

#### 13-14. Dashboard - Implémentations Services
**Fichiers**:
- `apps/api/src/modules/dashboard/dashboard.controller.ts:109`
- `apps/api/src/modules/dashboard/dashboard.controller.ts:137`

```typescript
// TODO: Implémenter avec le service
// TODO: Implémenter avec le service
```

**Impact**: 🟢 **BASSE** - Fonctionnalité dashboard en attente
**Description**: Certains endpoints dashboard controller n'utilisent pas encore le service.
**Action Recommandée**: Connecter endpoints au dashboard.service.ts

---

## 📋 Plan d'Action Recommandé

### Phase 1: Sécurité et Infrastructure (PRIORITÉ HAUTE)
**Durée estimée**: 2-3 jours

1. ✅ **Résoudre imports et migrer vers vraies requêtes DB** (TODOs #3)
   - Fichier: auth.service.simple.ts
   - Actions:
     - Fixer imports TypeORM
     - Remplacer mock data par vraies requêtes
     - Supprimer fichier simple après migration

2. ✅ **Implémenter chargement permissions depuis BD** (TODO #2)
   - Fichier: rbac.service.ts:335
   - Actions:
     - Créer `loadPermissionsFromDB()`
     - Ajouter cache avec TTL
     - Invalidation cache sur update

3. ✅ **Implémenter getUserPermissions** (TODO #4)
   - Fichier: decorator-processor.middleware.ts:222
   - Actions:
     - Ajouter méthode dans rbac.service.ts
     - Intégrer avec middleware

4. ✅ **Implémenter validateUserPermissions** (TODOs #5-6)
   - Fichier: tenant-isolation.middleware.ts:349,352
   - Actions:
     - Créer méthode validation
     - Intégrer avec RBAC service

5. ⏳ **Implémenter conditions dynamiques permissions** (TODO #1)
   - Fichier: rbac.service.ts:206
   - Actions:
     - Définir interface PermissionCondition
     - Implémenter évaluateur de conditions
     - Tester avec cas d'usage réels

---

### Phase 2: Fonctionnalités Business (PRIORITÉ MOYENNE)
**Durée estimée**: 3-4 jours

6. ✅ **Implémenter génération PDF/Excel/CSV** (TODOs #7, #8)
   - Fichiers: reports.service.ts:413, financial.service.ts:685
   - Actions:
     - Installer packages: `pdfkit`, `exceljs`, `csv-writer`
     - Créer service export générique
     - Implémenter templates

7. ✅ **Implémenter évolution temporelle** (TODO #9)
   - Fichier: financial.service.ts:800
   - Actions:
     - Créer requêtes groupées par période
     - Retourner données pour graphiques

8. ⏳ **Évaluer besoin BudgetCategory** (TODOs #10-12)
   - Fichier: financial.service.ts:527,543,552
   - Actions:
     - Analyser besoins réels
     - Créer entité si nécessaire OU utiliser enum

---

### Phase 3: Finitions (PRIORITÉ BASSE)
**Durée estimée**: 1 jour

9. ✅ **Connecter dashboard endpoints au service** (TODOs #13-14)
   - Fichier: dashboard.controller.ts:109,137
   - Actions:
     - Implémenter méthodes manquantes dans dashboard.service.ts
     - Connecter controller au service

---

## 🔧 Outils et Packages Requis

### Pour Exports (PDF/Excel/CSV)
```bash
pnpm add pdfkit exceljs csv-writer
pnpm add -D @types/pdfkit
```

### Pour Cache Permissions
```bash
pnpm add node-cache
# OU utiliser Redis si déjà en place
pnpm add ioredis
```

---

## 📊 Métriques

| Catégorie | Nombre | Pourcentage |
|-----------|--------|-------------|
| **HAUTE Priorité** | 7 | 50% |
| **MOYENNE Priorité** | 5 | 36% |
| **BASSE Priorité** | 2 | 14% |
| **TOTAL** | 14 | 100% |

---

## ✅ Checklist d'Implémentation

### Sécurité et RBAC
- [ ] Migrer auth.service.simple.ts vers vraies requêtes DB
- [ ] Implémenter loadPermissionsFromDB()
- [ ] Ajouter getUserPermissions() dans rbac.service
- [ ] Implémenter validateUserPermissions() dans tenant-isolation
- [ ] Implémenter conditions dynamiques permissions

### Exports et Rapports
- [ ] Installer packages export (pdfkit, exceljs, csv-writer)
- [ ] Créer service financial-export.service.ts
- [ ] Implémenter génération PDF dans reports.service
- [ ] Implémenter génération Excel dans reports.service
- [ ] Implémenter génération CSV dans reports.service

### Financial Analytics
- [ ] Implémenter évolution temporelle
- [ ] Évaluer besoin entité BudgetCategory
- [ ] Créer BudgetCategory entity (si validé)

### Dashboard
- [ ] Implémenter méthodes manquantes dashboard.service
- [ ] Connecter dashboard.controller au service

---

## 🚀 Estimation Globale

**Temps total estimé**: 6-8 jours développeur
**Complexité**: MOYENNE à HAUTE
**Dépendances**: Aucune bloquante

---

## 📝 Notes Importantes

1. **Prioriser la sécurité**: TODOs #1-6 (RBAC/Auth) doivent être traités en priorité car ils concernent la sécurité et l'isolation multi-tenant.

2. **Tests requis**: Chaque TODO résolu doit inclure:
   - Tests unitaires pour la logique métier
   - Tests d'intégration pour les endpoints
   - Tests de sécurité pour RBAC

3. **Documentation**: Mettre à jour Swagger après chaque TODO résolu

4. **Performance**: Implémenter cache pour permissions (#2) pour éviter requêtes DB répétées

5. **Backward compatibility**: Maintenir compatibilité lors migration auth.service.simple.ts (#3)

---

**Auteur**: Équipe CROU
**Dernière mise à jour**: Octobre 2025
**Version**: 1.0.0

# Guide de Démarrage Rapide - Gestion Hiérarchique des Utilisateurs

## 🚀 Modifications Implémentées

Toutes les améliorations de sécurité et de hiérarchie des rôles ont été **complètement implémentées** et sont **prêtes pour les tests**.

---

## ✅ Ce qui a été fait

### 1. **Fichier Partagé Créé**
📁 `packages/shared/src/constants/roleHierarchy.ts`

Ce fichier contient :
- La constante `ROLE_HIERARCHY` avec tous les niveaux
- La classe `RoleHierarchyUtils` avec toutes les méthodes utilitaires
- Les exports pour utilisation dans le backend et frontend

### 2. **Backend Mis à Jour**
📁 `apps/api/src/modules/admin/users.controller.ts`

Améliorations :
- ✅ Utilisation de `RoleHierarchyUtils` au lieu de code dupliqué
- ✅ Validation de tenant à la création (ligne 369-379)
- ✅ Eager loading des rôles pour optimiser les performances (lignes 503-504, 673-674)
- ✅ Validations cohérentes avec messages d'erreur clairs

### 3. **Frontend Mis à Jour**
📁 `apps/web/src/pages/admin/AdminPage.tsx`

Améliorations :
- ✅ Utilisation de `RoleHierarchyUtils` au lieu de code dupliqué
- ✅ **CRITIQUE:** Filtrage par tenant ET hiérarchie (lignes 104-109)
- ✅ Boutons correctement désactivés avec tooltips (ligne 520-521, 530-531)
- ✅ Code plus maintenable et lisible

---

## 🧪 Comment Tester

### Étape 1: Construire le Package Shared
```bash
cd packages/shared
npm run build
```

### Étape 2: Démarrer le Backend
```bash
cd apps/api
npm run dev
```

### Étape 3: Démarrer le Frontend
```bash
cd apps/web
npm run dev
```

### Étape 4: Tester les Scénarios

#### Test A: Super Admin (Accès Total)
```
URL: http://localhost:5173/login
Email: admin@crou.ne
Password: Password@2025!
```

**Actions à tester:**
1. Aller sur la page Administration
2. ✅ Vérifier que TOUS les utilisateurs sont visibles
3. ✅ Cliquer sur "Nouvel Utilisateur"
4. ✅ Vérifier que TOUS les rôles sont disponibles dans le dropdown
5. ✅ Créer un utilisateur "Admin Ministère" → Doit réussir
6. ✅ Tous les boutons "Modifier" et "Supprimer" doivent être actifs

#### Test B: Admin Ministère (Tous les CROUs)
```
Email: ministre@mesr.gouv.ne
Password: Password@2025!
```

**Actions à tester:**
1. Aller sur la page Administration
2. ✅ Vérifier que les utilisateurs de TOUS les CROUs sont visibles
3. ✅ Cliquer sur "Nouvel Utilisateur"
4. ✅ Vérifier que "Super Admin" n'est PAS dans le dropdown
5. ✅ Essayer de créer un "Directeur CROU" → Doit réussir
6. ✅ Les boutons pour les Super Admins doivent être désactivés (grisés)

#### Test C: Directeur CROU (Un seul CROU)
```
Email: directeur@crou-zinder.ne
Password: Password@2025!
```

**Actions à tester:**
1. Aller sur la page Administration
2. ✅ **CRITIQUE:** Vérifier que SEULS les utilisateurs du CROU Zinder sont visibles
3. ❌ Les utilisateurs des autres CROUs (Niamey, Maradi, etc.) ne doivent PAS apparaître
4. ✅ Cliquer sur "Nouvel Utilisateur"
5. ✅ Vérifier que "Directeur CROU" n'est PAS dans le dropdown
6. ✅ Essayer de créer un "Comptable" → Doit réussir
7. ✅ Les boutons pour les autres Directeurs doivent être désactivés

#### Test D: Gestionnaire Stocks (Restrictions Maximales)
```
Email: stocks@crou-zinder.ne
Password: Password@2025!
```

**Actions à tester:**
1. Aller sur la page Administration
2. ✅ **CRITIQUE:** Vérifier que SEULS les "Utilisateur" du CROU Zinder sont visibles
3. ❌ Les autres gestionnaires, comptables, directeur ne doivent PAS apparaître
4. ✅ Cliquer sur "Nouvel Utilisateur"
5. ✅ Vérifier que SEUL "Utilisateur" est dans le dropdown
6. ✅ Essayer de créer un "Gestionnaire Stocks" → Doit échouer avec message d'erreur
7. ✅ Tous les boutons pour les non-utilisateurs doivent être désactivés (grisés)

#### Test E: Isolation Multi-Tenant (Sécurité)
```
Email: directeur@crou-zinder.ne
Password: Password@2025!
```

**Actions à tester:**
1. Aller sur la page Administration
2. Ouvrir la Console Développeur (F12)
3. Aller sur l'onglet "Network"
4. Rafraîchir la page
5. Regarder la requête GET `/api/admin/users`
6. ✅ Vérifier que la réponse contient UNIQUEMENT les utilisateurs de Zinder
7. ❌ Aucun utilisateur des autres CROUs ne doit être dans la réponse JSON

#### Test F: Tentative d'Escalade de Privilèges (Backend)
```
Email: stocks@crou-zinder.ne
Password: Password@2025!
```

**Actions à tester:**
1. Aller sur la page Administration
2. Cliquer sur "Nouvel Utilisateur"
3. Ouvrir la Console Développeur (F12)
4. Aller sur l'onglet "Console"
5. Exécuter ce code JavaScript :
```javascript
fetch('http://localhost:3000/api/admin/users', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${localStorage.getItem('token')}`
  },
  body: JSON.stringify({
    name: 'Hacker',
    email: 'hacker@test.com',
    roleId: '<ID_DU_ROLE_DIRECTEUR>', // Remplacer par l'ID réel
    tenantId: '<ID_DU_CROU_ZINDER>'   // Remplacer par l'ID réel
  })
}).then(r => r.json()).then(console.log)
```
6. ✅ Vérifier que la réponse est HTTP 403 avec message "Permission refusée"
7. ✅ Vérifier le message : "Les gestionnaires ne peuvent créer que des utilisateurs avec le rôle 'Utilisateur'"

---

## 🔍 Points de Vérification Critiques

### 1. Filtrage par Tenant (Frontend)
**Fichier:** `apps/web/src/pages/admin/AdminPage.tsx`
**Lignes:** 104-109

```typescript
// Vérification du tenant (critique pour la sécurité)
const targetTenantId = targetUser.tenant?.id || targetUser.tenantId;
if (targetTenantId !== userTenantId) {
  return false;
}
```

**Test:** Connectez-vous avec un Directeur CROU et vérifiez qu'AUCUN utilisateur d'un autre CROU n'apparaît dans la liste.

### 2. Validation de Tenant (Backend)
**Fichier:** `apps/api/src/modules/admin/users.controller.ts`
**Lignes:** 369-379

```typescript
// Validation du tenant: si pas d'accès étendu, forcer le tenant de l'utilisateur
if (!hasExtendedAccess && tenantContext) {
  // L'utilisateur ne peut créer que dans son propre tenant
  if (userData.tenantId && userData.tenantId !== tenantContext.tenantId) {
    return res.status(403).json({
      error: 'Tenant non autorisé',
      message: 'Vous ne pouvez créer des utilisateurs que dans votre propre tenant'
    });
  }
  userData.tenantId = tenantContext.tenantId;
}
```

**Test:** Utilisez Postman ou la console pour tenter de créer un utilisateur dans un autre tenant. Doit retourner HTTP 403.

### 3. Boutons Désactivés (Frontend)
**Fichier:** `apps/web/src/pages/admin/AdminPage.tsx`
**Lignes:** 515-534

```typescript
<Button
  size="sm"
  variant="outline"
  leftIcon={<PencilIcon className="h-4 w-4" />}
  onClick={() => openEditModal('user', targetUser)}
  disabled={!canModify}
  title={!canModify ? `Vous ne pouvez pas modifier un utilisateur avec le rôle "${targetRoleName}"` : ''}
>
  Modifier
</Button>
```

**Test:** Connectez-vous avec un Gestionnaire Stocks et vérifiez que les boutons "Modifier" et "Supprimer" sont grisés pour les autres gestionnaires/comptables/directeurs.

### 4. Eager Loading (Backend)
**Fichier:** `apps/api/src/modules/admin/users.controller.ts`
**Lignes:** 503-504

```typescript
const queryBuilder = userRepository.createQueryBuilder('user')
  .leftJoinAndSelect('user.role', 'role')
  .where('user.id = :userId', { userId });
```

**Test:** Regardez les logs SQL dans la console backend. Vous devriez voir une seule requête avec un LEFT JOIN au lieu de deux requêtes séparées.

---

## 📊 Matrice de Tests

| Rôle | Peut Voir | Peut Créer | Peut Modifier | Peut Supprimer |
|------|-----------|------------|---------------|----------------|
| **Super Admin** | Tous les utilisateurs | Tous les rôles | Tous les utilisateurs | Tous les utilisateurs |
| **Admin Ministère** | Tous les utilisateurs | Tous sauf Super Admin | Tous sauf Super Admin | Tous sauf Super Admin |
| **Directeur CROU** | Son CROU uniquement | Comptable, Gestionnaires, Utilisateur | Niveaux inférieurs de son CROU | Niveaux inférieurs de son CROU |
| **Comptable** | Niveaux inférieurs de son CROU | Gestionnaires, Utilisateur | Niveaux inférieurs de son CROU | Niveaux inférieurs de son CROU |
| **Gestionnaire** | Utilisateurs de son CROU | Utilisateur uniquement | Utilisateurs de son CROU | Utilisateurs de son CROU |
| **Utilisateur** | Aucun (lecture seule) | Aucun | Aucun | Aucun |

---

## 🐛 En Cas de Problème

### Erreur: "Cannot find module '@crou/shared'"
**Solution:**
```bash
cd packages/shared
npm run build
```

### Erreur: "RoleHierarchyUtils is not defined"
**Solution:**
Vérifiez que l'import est présent :
```typescript
import { RoleHierarchyUtils } from '@crou/shared';
```

### Les utilisateurs d'autres CROUs apparaissent encore
**Solution:**
1. Vérifiez que vous avez bien la dernière version du code
2. Rafraîchissez complètement le navigateur (Ctrl+Shift+R)
3. Déconnectez-vous et reconnectez-vous
4. Vérifiez la réponse API dans la console Network

### Les boutons ne sont pas désactivés
**Solution:**
1. Vérifiez que le code à la ligne 520 de AdminPage.tsx contient bien `disabled={!canModify}`
2. Rafraîchissez le navigateur
3. Vérifiez dans les DevTools que `canModify` a la bonne valeur

---

## 📝 Notes Importantes

### Performance
- ✅ Les requêtes de base de données ont été optimisées avec eager loading
- ✅ Réduction de 50% du nombre de requêtes sur les endpoints UPDATE et DELETE

### Sécurité
- ✅ **4 couches de sécurité** : Base de données, Backend API, Frontend UI, Navigation
- ✅ **Filtrage double** : Par tenant ET par hiérarchie des rôles
- ✅ **Validation stricte** : Impossible de créer/modifier/supprimer des utilisateurs de niveau supérieur ou égal

### Maintenabilité
- ✅ **Code centralisé** : Une seule définition de la hiérarchie des rôles
- ✅ **Utilitaires réutilisables** : `RoleHierarchyUtils` disponible partout
- ✅ **TypeScript fort** : Types et interfaces cohérents

---

## 🚨 Avertissements

### ⚠️ NE PAS
- ❌ Modifier `ROLE_HIERARCHY` sans mise à jour de la documentation
- ❌ Bypass les méthodes `RoleHierarchyUtils.validate*()` dans le backend
- ❌ Retirer le filtrage par tenant dans le frontend (ligne 106-109)
- ❌ Permettre aux gestionnaires de créer d'autres gestionnaires

### ✅ TOUJOURS
- ✅ Utiliser `RoleHierarchyUtils` au lieu de code en dur
- ✅ Filtrer par tenant ET hiérarchie dans le frontend
- ✅ Vérifier les permissions dans le backend ET le frontend
- ✅ Logger les tentatives de violation de permissions

---

## 📞 Support

**Questions ou problèmes ?**
- 📧 Email: dev@crou.ne
- 💬 Slack: #crou-dev
- 📖 Doc complète: `IMPLEMENTATION_SUMMARY.md`

**Bugs de sécurité ?**
- 🚨 Contact immédiat: security@crou.ne
- 🔒 NE PAS créer de ticket public

---

**Statut:** ✅ Prêt pour les tests
**Prochaine étape:** Tests manuels complets puis déploiement

---

*Document généré le 10 Janvier 2025*

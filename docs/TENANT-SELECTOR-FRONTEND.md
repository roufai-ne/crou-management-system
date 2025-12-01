# Ajout du Sélecteur de Tenant - Frontend

**Date:** Janvier 2025  
**Statut:** ✅ Complété

---

## 📋 Résumé

Ajout d'un sélecteur de tenant (CROU) dans l'interface pour permettre aux administrateurs ministériels de filtrer toutes les données de l'application par CROU spécifique.

---

## 🎯 Fonctionnalités Ajoutées

### 1. Composant TenantSelector
**Fichier:** `apps/web/src/components/common/TenantSelector.tsx`

- ✅ Dropdown avec liste de tous les CROUs
- ✅ Option "Tous les CROUs" pour vue globale
- ✅ Persistance de la sélection dans localStorage
- ✅ Design moderne avec icônes et états visuels
- ✅ Rechargement automatique au changement

### 2. Hook useTenantFilter
**Fichier:** `apps/web/src/hooks/useTenantFilter.ts`

- ✅ Gestion globale du tenant sélectionné
- ✅ Méthode `getTenantParams()` pour ajouter tenantId aux requêtes
- ✅ Synchronisation avec localStorage
- ✅ Vérification des permissions (hasExtendedAccess)

### 3. API Client avec Auto-Filter
**Fichiers:** 
- `apps/web/src/lib/apiClient.ts`
- `apps/web/src/lib/api.ts`

- ✅ Intercepteur axios qui ajoute automatiquement `?tenantId=xxx` à toutes les requêtes
- ✅ Récupération depuis localStorage
- ✅ Compatible avec toutes les requêtes GET/POST/PUT/DELETE

### 4. Store Auth - hasExtendedAccess()
**Fichier:** `apps/web/src/stores/auth.ts`

- ✅ Nouvelle méthode `hasExtendedAccess()` 
- ✅ Retourne `true` pour Super Admin, Admin Ministère, ou niveau ministry
- ✅ Utilisée pour afficher/masquer le sélecteur

### 5. Intégration dans le Header
**Fichier:** `apps/web/src/components/layout/Header.tsx`

- ✅ Remplacement de l'ancien sélecteur "Vue Ministère/Locale"
- ✅ Affichage conditionnel si `hasExtendedAccess() === true`
- ✅ Position: Entre le logo et la barre de recherche
- ✅ Responsive: Caché sur mobile (<768px)

---

## 🔧 Utilisation

### Pour les Administrateurs

1. **Vue Globale (Défaut)**
   - À la connexion, aucun tenant n'est sélectionné
   - Le header affiche "Tous les CROUs"
   - Toutes les données de tous les CROUs sont visibles

2. **Filtrer par CROU**
   - Cliquer sur le sélecteur dans le header
   - Choisir un CROU spécifique
   - La page se recharge automatiquement
   - Toutes les requêtes incluent maintenant `?tenantId=xxx`

3. **Retour à la Vue Globale**
   - Cliquer sur le sélecteur
   - Choisir "Tous les CROUs"
   - La page se recharge sans filtre tenant

### Persistance

La sélection est sauvegardée dans `localStorage` avec la clé `selectedTenantId`:
```javascript
// Sauvegarder
localStorage.setItem('selectedTenantId', 'crou-id-xxx');

// Récupérer
const tenantId = localStorage.getItem('selectedTenantId');

// Supprimer (vue globale)
localStorage.removeItem('selectedTenantId');
```

---

## 📊 Impact sur les Modules

Tous les modules backend sont déjà prêts avec `injectTenantIdMiddleware({ strictMode: false })`:

### Modules Prêts ✅
- ✅ **Financial** - Budgets, transactions, rapports
- ✅ **Stocks** - Stocks, mouvements, fournisseurs
- ✅ **Transport** - Véhicules, usages, maintenances, chauffeurs
- ✅ **Dashboard** - KPIs, métriques, alertes
- ✅ **Admin/Tenants** - Gestion des CROUs
- ✅ **Admin/Users** - Gestion des utilisateurs

### Comportement
```http
# Sans filtre (vue globale)
GET /api/financial/budgets
→ Retourne les budgets de tous les CROUs

# Avec filtre
GET /api/financial/budgets?tenantId=crou-paris-uuid
→ Retourne uniquement les budgets du CROU Paris
```

---

## 🎨 Design

### Composant TenantSelector

**Bouton:**
- Largeur minimale: 240px
- Icône: `Building2` (Lucide)
- Texte: Nom du CROU ou "Tous les CROUs"
- Bordure: 2px indigo
- Hover: Shadow elevation

**Dropdown:**
- Max height: 384px (96 × 4px)
- Scroll: Auto si > 8 CROUs
- Options: Checkbox visuel avec `CheckCircle2`
- Background: White/Gray-800 (dark mode)
- Border: 2px indigo

### Position dans le Header
```
┌─────────────────────────────────────────────────────────┐
│ [☰] [LOGO] │ [🏛️ CROU Selector] │ [...] [🔍] [🔔] [👤] │
└─────────────────────────────────────────────────────────┘
```

---

## 🔒 Sécurité

### Contrôles Frontend
- ✅ Composant affiché uniquement si `hasExtendedAccess() === true`
- ✅ Vérification du rôle: Super Admin, Admin Ministère, ou ministry level
- ✅ Liste des CROUs récupérée via API sécurisée `/admin/tenants`

### Contrôles Backend
- ✅ Middleware `injectTenantIdMiddleware` valide le `tenantId` passé
- ✅ Vérification via `TenantIsolationUtils.hasExtendedAccess()`
- ✅ Si utilisateur non autorisé → ignore le paramètre, utilise son propre tenant

---

## 🐛 Dépannage

### Le sélecteur ne s'affiche pas
- Vérifier que l'utilisateur a le rôle "Super Admin" ou "Admin Ministère"
- Vérifier `user.hierarchyLevel === 'ministry'`
- Vérifier dans React DevTools: `hasExtendedAccess()` doit retourner `true`

### Les données ne se filtrent pas
- Vérifier dans DevTools Network: paramètre `?tenantId=xxx` présent ?
- Vérifier localStorage: clé `selectedTenantId` définie ?
- Vérifier backend: middleware `injectTenantIdMiddleware` sur la route ?

### La sélection ne persiste pas
- Vérifier que localStorage n'est pas désactivé
- Vérifier que le domaine ne change pas (localhost vs 127.0.0.1)
- Vider le cache: `localStorage.clear()`

---

## 📝 Prochaines Améliorations

### Phase 2 - Filtrage Avancé
- [ ] Filtrage par région (niveau intermédiaire)
- [ ] Sélection multiple de CROUs
- [ ] Sauvegarde des filtres préférés par utilisateur
- [ ] Historique des CROUs consultés

### Phase 3 - UX
- [ ] Indicateur visuel du filtre actif (badge)
- [ ] Shortcut clavier (Ctrl+K)
- [ ] Recherche dans la liste des CROUs
- [ ] Groupement par région

### Phase 4 - Analytics
- [ ] Tracking des CROUs les plus consultés
- [ ] Temps passé par CROU
- [ ] Export de rapports multi-CROUs

---

## ✅ Tests de Validation

### Scénarios Testés
1. ✅ Utilisateur normal → Sélecteur masqué
2. ✅ Admin Ministère → Sélecteur visible
3. ✅ Sélection CROU → Rechargement + filtre appliqué
4. ✅ "Tous les CROUs" → Pas de filtre
5. ✅ Persistance → Sélection conservée après refresh
6. ✅ API calls → Paramètre `tenantId` ajouté automatiquement

---

## 👥 Documentation

**Fichiers créés:**
- `TenantSelector.tsx` - Composant UI
- `useTenantFilter.ts` - Hook de gestion
- `apiClient.ts` - Client HTTP avec intercepteur
- `api.ts` - Export du client

**Fichiers modifiés:**
- `auth.ts` - Ajout `hasExtendedAccess()`
- `Header.tsx` - Intégration du sélecteur

**Documentation:**
- `TENANT-ISOLATION-CORRECTIONS-APPLIED.md` - Guide backend
- `TENANT-SELECTOR-FRONTEND.md` - Ce document

---

**Auteur:** Équipe CROU  
**Date:** Janvier 2025  
**Version:** 1.0.0

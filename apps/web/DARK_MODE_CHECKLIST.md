# Checklist Dark Mode - Classes à Ajouter

## Classes Essentielles par Élément

### Textes
```tsx
// Titres principaux
text-gray-900 dark:text-white

// Titres secondaires
text-gray-800 dark:text-gray-100

// Texte normal
text-gray-700 dark:text-gray-300

// Texte secondaire / descriptions
text-gray-600 dark:text-gray-400

// Texte tertiaire / helpers
text-gray-500 dark:text-gray-400

// Texte disabled
text-gray-400 dark:text-gray-500
```

### Backgrounds
```tsx
// Background principal
bg-white dark:bg-gray-800

// Background secondaire
bg-gray-50 dark:bg-gray-900

// Background hover
hover:bg-gray-100 dark:hover:bg-gray-700

// Background card
bg-white dark:bg-gray-800

// Background input
bg-white dark:bg-gray-700
```

### Borders
```tsx
// Border normale
border-gray-200 dark:border-gray-700

// Border légère
border-gray-100 dark:border-gray-800

// Border input
border-gray-300 dark:border-gray-600
```

### Composants Spécifiques

#### Buttons
```tsx
// Primary
className="bg-primary-600 hover:bg-primary-700 text-white"
// Pas de dark mode nécessaire (déjà coloré)

// Secondary
className="bg-gray-100 text-gray-900 hover:bg-gray-200
           dark:bg-gray-700 dark:text-gray-100 dark:hover:bg-gray-600"

// Outline
className="border border-gray-300 bg-transparent text-gray-700 hover:bg-gray-50
           dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
```

#### Inputs / Forms
```tsx
// Label
className="text-sm font-medium text-gray-700 dark:text-gray-300"

// Input
className="border-gray-300 bg-white text-gray-900
           dark:bg-gray-700 dark:border-gray-600
           dark:text-white dark:placeholder-gray-400"

// Error message
className="text-sm text-red-600 dark:text-red-400"

// Help text
className="text-sm text-gray-500 dark:text-gray-400"
```

#### Cards
```tsx
className="bg-white rounded-lg shadow border border-gray-200
           dark:bg-gray-800 dark:border-gray-700"
```

#### Modals
```tsx
// Backdrop
className="fixed inset-0 bg-black/50 dark:bg-black/70"

// Modal content
className="bg-white dark:bg-gray-800 rounded-lg shadow-xl"

// Modal header
className="border-b border-gray-200 dark:border-gray-700"
```

#### Tables
```tsx
// Table header
className="bg-gray-50 dark:bg-gray-700"

// Table header text
className="text-gray-500 dark:text-gray-400"

// Table row
className="text-gray-900 dark:text-gray-100"

// Table row hover
className="hover:bg-gray-50 dark:hover:bg-gray-700"
```

#### Badges
```tsx
// Success
className="bg-success-100 text-success-800
           dark:bg-success-900 dark:text-success-200"

// Warning
className="bg-warning-100 text-warning-800
           dark:bg-warning-900 dark:text-warning-200"

// Danger
className="bg-danger-100 text-danger-800
           dark:bg-danger-900 dark:text-danger-200"

// Gray
className="bg-gray-100 text-gray-800
           dark:bg-gray-700 dark:text-gray-300"
```

## Composants à Vérifier (Par Priorité)

### P0 - Critique (Auth & Layout)
- [x] AuthLayout.tsx
- [x] LoginPage.tsx
- [x] ProfilePage.tsx
- [x] MainLayout.tsx

### P1 - Important (Dashboard & Navigation)
- [ ] DashboardPage.tsx
- [ ] CROUDashboard.tsx
- [ ] MinistryDashboard.tsx
- [ ] ModernCROUDashboard.tsx
- [ ] Sidebar components

### P2 - Modules Principaux
- [ ] FinancialPage.tsx
- [ ] StocksPage.tsx
- [ ] HousingPage.tsx
- [ ] TransportPage.tsx
- [ ] RestaurationPage.tsx

### P3 - Composants UI
- [ ] Modals (UserModals, RoleModals, etc.)
- [ ] Forms (AllocationForm, BudgetForm, etc.)
- [ ] Tables (TransactionTable, AllocationTable, etc.)
- [ ] Cards (BudgetCard, KPICard, etc.)

## Script de Remplacement Automatique

Pour corriger en masse, utiliser ces regex (avec prudence) :

```bash
# Textes gray-900 sans dark mode
className="([^"]*?)text-gray-900(?! dark)([^"]*?)"
→
className="$1text-gray-900 dark:text-white$2"

# Background white sans dark mode
className="([^"]*?)bg-white(?! dark)([^"]*?)"
→
className="$1bg-white dark:bg-gray-800$2"

# Border gray-200 sans dark mode
className="([^"]*?)border-gray-200(?! dark)([^"]*?)"
→
className="$1border-gray-200 dark:border-gray-700$2"
```

## Tests à Effectuer

### Checklist Visuelle
- [ ] Toggle dark mode → tous les textes sont lisibles
- [ ] Tous les backgrounds changent
- [ ] Tous les borders sont visibles
- [ ] Les inputs sont utilisables
- [ ] Les buttons sont cliquables
- [ ] Les modals sont lisibles
- [ ] Les tables sont lisibles
- [ ] Les cards ont un bon contraste

### Pages à Tester
- [ ] /login
- [ ] /dashboard
- [ ] /profile
- [ ] /financial
- [ ] /stocks
- [ ] /housing
- [ ] /transport
- [ ] /restauration
- [ ] /admin

### Composants à Tester
- [ ] Formulaires
- [ ] Tableaux
- [ ] Modals
- [ ] Dropdowns
- [ ] Tooltips
- [ ] Toasts
- [ ] Badges
- [ ] Cards

## Problèmes Connus et Solutions

### Texte Invisible en Dark Mode
**Cause**: `text-gray-900` sur `dark:bg-gray-900`
**Solution**: Ajouter `dark:text-white` ou `dark:text-gray-100`

### Background Transparent en Dark Mode
**Cause**: `bg-white` non accompagné de `dark:bg-gray-800`
**Solution**: Ajouter la classe dark correspondante

### Borders Invisibles
**Cause**: Border gris clair sur fond sombre
**Solution**: `border-gray-200 dark:border-gray-700`

### Inputs Non Lisibles
**Cause**: Manque `dark:bg-gray-700` et `dark:text-white`
**Solution**: Utiliser `.form-input` qui a déjà les classes

## Classes Globales Déjà Configurées

Ces classes dans `globals.css` ont déjà le support dark mode :

- `.btn-primary`
- `.btn-secondary`
- `.btn-outline`
- `.form-label`
- `.form-input`
- `.form-select`
- `.form-error`
- `.form-help`
- `.card`
- `.badge`
- `.badge-*`
- `.alert`
- `.alert-*`

**Recommandation** : Utiliser ces classes au lieu de définir manuellement les couleurs.

## Commandes Utiles

### Rechercher les composants sans dark mode
```bash
# Textes gray-900 sans dark mode
grep -r "text-gray-900" --include="*.tsx" | grep -v "dark:"

# Backgrounds white sans dark mode
grep -r "bg-white" --include="*.tsx" | grep -v "dark:"

# Borders sans dark mode
grep -r "border-gray-200" --include="*.tsx" | grep -v "dark:"
```

### Compter les occurrences
```bash
grep -r "text-gray-900" apps/web/src --include="*.tsx" | wc -l
grep -r "text-gray-900 dark:text-white" apps/web/src --include="*.tsx" | wc -l
```

## Prochaines Étapes

1. **Corriger les composants P0** ✅ (Auth & Layout)
2. **Corriger les composants P1** (Dashboard)
3. **Corriger les composants P2** (Modules)
4. **Corriger les composants P3** (UI)
5. **Tests complets**
6. **Documentation finale**

## Notes Importantes

- Toujours tester visuellement après les changements
- Privilégier les classes globales (`.btn-primary`, `.form-input`, etc.)
- Ne pas oublier les états (hover, focus, active, disabled)
- Vérifier les contrastes WCAG AA (ratio 4.5:1 minimum)

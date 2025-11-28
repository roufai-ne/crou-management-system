# Diagnostic du Layout CROU

## Problème Identifié
Le header apparaît "tassé à gauche" au lieu de s'étendre sur toute la largeur.

## Structure Actuelle

### Header (ligne 146-234)
```tsx
<div className="fixed top-0 left-0 right-0 z-50 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 h-16 shadow-sm">
  <div className="h-full w-full px-4 lg:px-6 flex items-center justify-between">
    // Contenu
  </div>
</div>
```

### Sidebar (ligne 237-278)
```tsx
<div className="hidden lg:flex w-64 flex-col fixed top-16 bottom-0 left-0 z-40 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 shadow-sm">
  // Contenu
</div>
```

### Main (ligne 342-346)
```tsx
<main className="pt-16 lg:pl-64 min-h-screen bg-gray-50 dark:bg-gray-900">
  <div className="p-4 sm:p-6 lg:p-8">
    {children}
  </div>
</main>
```

## Analyse CSS

### Classes Appliquées au Header
- `fixed` → position: fixed
- `top-0` → top: 0px
- `left-0` → left: 0px
- `right-0` → right: 0px
- `z-50` → z-index: 50
- `h-16` → height: 4rem (64px)
- `w-full` → width: 100% (sur div interne)
- `flex` → display: flex
- `items-center` → align-items: center
- `justify-between` → justify-content: space-between

## Problèmes Potentiels

### 1. Box-sizing
Si `box-sizing: content-box` est appliqué, les paddings ajoutent à la largeur totale.

### 2. Position Fixed sans Width
Le header parent a `left-0 right-0` mais pas explicitement `width: 100%`.
Bien que `left-0 right-0` devrait suffire, certains navigateurs peuvent mal interpréter.

### 3. Conteneur Parent
Le conteneur racine `<div className="min-h-screen bg-gradient-soft">` n'a pas de largeur définie.

### 4. Padding/Margin par défaut
Les éléments body/html peuvent avoir des margins par défaut.

## Solutions Proposées

### Solution 1: Ajouter width:100% explicite au header
```tsx
<div className="fixed top-0 left-0 right-0 w-full z-50 ...">
```

### Solution 2: Vérifier box-sizing global
```css
*, *::before, *::after {
  box-sizing: border-box;
}
```

### Solution 3: Reset body/html
```css
html, body {
  margin: 0;
  padding: 0;
  width: 100%;
}
```

### Solution 4: Utiliser max-width sur conteneur parent
```tsx
<div className="min-h-screen w-full max-w-full overflow-x-hidden bg-gradient-soft">
```

# Configuration des Toasts - Résolution des problèmes

## Problème rencontré
Les toasts personnalisés n'apparaissent pas ou les notifications Windows système s'affichent à la place.

## Cause
Le composant `Toaster` de Sonner est correctement intégré dans `App.tsx` mais les notifications peuvent être interceptées par le système d'exploitation Windows.

## Solution 1: Vérifier l'intégration du Toaster

Le Toaster est déjà correctement intégré dans `apps/web/src/App.tsx` :

```tsx
<Toaster
  position="top-right"
  toastOptions={{
    duration: 4000,
    style: {
      background: '#fff',
      color: '#374151',
      ...
    }
  }}
/>
```

## Solution 2: Import correct dans les pages

Vérifier que l'import dans `StocksPage.tsx` est correct :

```tsx
import { toast } from '@/components/ui/Toaster';
```

✅ **DÉJÀ EN PLACE**

## Solution 3: Désactiver les notifications Windows

Les toasts Sonner peuvent être bloqués par les notifications Windows. Pour les désactiver temporairement :

1. **Paramètres Windows** > **Système** > **Notifications et actions**
2. Désactiver temporairement les notifications pour le navigateur (Chrome/Edge)

## Solution 4: Vérifier que le Toaster est rendu

Ouvrir la console du navigateur et vérifier :

```javascript
// Le conteneur Sonner doit être présent
document.querySelector('[data-sonner-toaster]')
```

Si null, le Toaster n'est pas monté.

## Test rapide

Dans la console du navigateur, tester directement :

```javascript
// Import dynamique pour tester
import('@/components/ui/Toaster').then(module => {
  module.toast.success('Test Toast!', { description: 'Ceci est un test' });
});
```

## Permissions DELETE corrigées

✅ Route DELETE changée de `stocks:delete` → `stocks:write`  
✅ Correspond aux permissions existantes dans la base de données  
✅ Gestionnaire Stocks peut maintenant supprimer des articles

## Résumé des modifications

### Backend (API)
- `apps/api/src/modules/stocks/stocks.routes.ts` : Permission DELETE corrigée

### Frontend (Web)
- `apps/web/src/pages/stocks/StocksPage.tsx` : 
  - ✅ Tous les `alert()` remplacés par `toast.success/error/warning()`
  - ✅ Messages descriptifs avec contexte
  - ✅ Import correct de toast depuis Toaster.tsx

## Prochaines étapes

1. **Redémarrer le serveur API** pour appliquer les changements de routes
2. **Rafraîchir le navigateur** (Ctrl+Shift+R) pour vider le cache
3. **Tester la suppression** d'un article
4. **Vérifier les toasts** apparaissent dans le coin supérieur droit

Si les toasts Windows persistent, c'est un comportement du navigateur/OS qui peut être ignoré - les toasts Sonner s'afficheront également.

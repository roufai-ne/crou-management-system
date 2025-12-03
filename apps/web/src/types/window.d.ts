/**
 * FICHIER: apps/web/src/types/window.d.ts
 * TYPES: Déclarations de types pour l'objet Window global
 *
 * DESCRIPTION:
 * Étend l'interface Window avec des propriétés personnalisées
 * pour React DevTools et les utilitaires de debug
 *
 * AUTEUR: Équipe CROU
 * DATE: Décembre 2025
 */

interface CrouDebugUtils {
  clearCache: () => void;
  resetAuth: () => void;
  version: string;
}

interface Window {
  /**
   * React DevTools Global Hook
   * Injecté par l'extension React DevTools dans le navigateur
   */
  __REACT_DEVTOOLS_GLOBAL_HOOK__?: {
    supportsFiber: boolean;
    inject: (renderer: any) => void;
    onCommitFiberRoot?: (id: number, root: any, priorityLevel?: any) => void;
    onCommitFiberUnmount?: (id: number, fiber: any) => void;
    [key: string]: any;
  };

  /**
   * Utilitaires de debug CROU (disponibles en développement seulement)
   */
  CROU_DEBUG?: CrouDebugUtils;
}

// Exporter pour utilisation dans d'autres fichiers
export {};

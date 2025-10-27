/**
 * FICHIER: packages\ui\src\index.ts
 * PACKAGE: @crou/ui - Composants UI réutilisables
 * 
 * DESCRIPTION:
 * Point d'entrée principal du package UI CROU
 * Export de tous les composants et utilitaires
 * 
 * AUTEUR: Équipe CROU
 * DATE: Décembre 2024
 */

// Export des utilitaires
export * from './utils';

// Export des contextes
export * from './contexts';

// Re-export des composants depuis l'app web
// En attendant la migration complète vers ce package
// Note: Cette ligne est temporairement commentée pour éviter les erreurs TypeScript
// export * from '../../../apps/web/src/components/ui';

// Types et interfaces communes
export interface UIComponentProps {
  className?: string;
  children?: React.ReactNode;
}

export interface FormComponentProps extends UIComponentProps {
  label?: string;
  error?: string;
  disabled?: boolean;
  required?: boolean;
}

// Constantes du design system
export const DESIGN_TOKENS = {
  colors: {
    primary: {
      50: '#eff6ff',
      500: '#3b82f6',
      600: '#2563eb',
      900: '#1e3a8a'
    },
    success: {
      50: '#f0fdf4',
      500: '#22c55e',
      600: '#16a34a'
    },
    warning: {
      50: '#fffbeb',
      500: '#f59e0b',
      600: '#d97706'
    },
    danger: {
      50: '#fef2f2',
      500: '#ef4444',
      600: '#dc2626'
    }
  },
  spacing: {
    xs: '0.25rem',
    sm: '0.5rem',
    md: '1rem',
    lg: '1.5rem',
    xl: '2rem'
  },
  borderRadius: {
    sm: '0.25rem',
    md: '0.375rem',
    lg: '0.5rem',
    xl: '0.75rem'
  }
} as const;

// Version du package
export const VERSION = '1.0.0';
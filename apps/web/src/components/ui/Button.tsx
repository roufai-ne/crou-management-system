/**
 * FICHIER: apps\web\src\components\ui\Button.tsx
 * COMPOSANT: Button - Composant bouton complet du système de design CROU
 * 
 * DESCRIPTION:
 * Composant bouton avec toutes les variantes, tailles et états
 * Support des icônes, états de chargement, et accessibilité complète
 * Optimisé pour l'usage dans l'application CROU multi-tenant
 * 
 * VARIANTES:
 * - primary: Bouton principal CROU (bleu)
 * - secondary: Bouton secondaire (gris)
 * - success: Bouton de succès (vert)
 * - danger: Bouton de danger (rouge)
 * - warning: Bouton d'avertissement (orange)
 * - outline: Bouton avec bordure uniquement
 * - ghost: Bouton transparent
 * 
 * TAILLES:
 * - xs: Extra petit (28px)
 * - sm: Petit (32px)
 * - md: Moyen (40px) - défaut
 * - lg: Grand (44px)
 * - xl: Extra grand (48px)
 * 
 * PROPS:
 * - variant: Variante du bouton
 * - size: Taille du bouton
 * - loading: État de chargement avec spinner
 * - disabled: État désactivé
 * - leftIcon: Icône à gauche du texte
 * - rightIcon: Icône à droite du texte
 * - iconOnly: Bouton avec icône uniquement
 * - fullWidth: Bouton pleine largeur
 * - children: Contenu du bouton
 * 
 * USAGE:
 * <Button variant="primary" size="md" onClick={handleClick}>
 *   Valider
 * </Button>
 * 
 * <Button variant="outline" leftIcon={<PlusIcon />} loading={isLoading}>
 *   Ajouter
 * </Button>
 * 
 * <Button variant="danger" iconOnly>
 *   <TrashIcon />
 * </Button>
 * 
 * AUTEUR: Équipe CROU
 * DATE: Décembre 2024
 */

import React from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';
import { cn } from '@/utils/cn';
import { hoverTap } from '@/utils/animations';

// Type pour les variantes de props (remplace VariantProps de class-variance-authority)
type VariantProps<T> = T extends (...args: any[]) => any
  ? Parameters<T>[0]
  : never;

// Composant Spinner pour l'état de chargement
const Spinner: React.FC<{ size?: 'xs' | 'sm' | 'md' | 'lg' }> = ({ size = 'md' }) => {
  const sizeClasses = {
    xs: 'h-3 w-3',
    sm: 'h-4 w-4',
    md: 'h-4 w-4',
    lg: 'h-5 w-5'
  };

  return (
    <svg
      className={cn('animate-spin', sizeClasses[size])}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );
};

// Types pour les variantes
type ButtonVariant = 'primary' | 'secondary' | 'success' | 'danger' | 'warning' | 'outline' | 'ghost';
type ButtonSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

// Fonction pour générer les classes CSS du bouton
const buttonVariants = (props: {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  iconOnly?: boolean;
}) => {
  const { variant = 'primary', size = 'md', fullWidth = false, iconOnly = false } = props;

  // Classes de base
  const baseClasses = [
    'inline-flex items-center justify-center font-medium transition-all duration-200',
    'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-gray-900',
    'disabled:pointer-events-none disabled:opacity-50 disabled:cursor-not-allowed',
    'active:scale-95 transform',
    'select-none'
  ];

  // Classes de variantes
  const variantClasses = {
    primary: [
      'bg-primary-600 text-white shadow-sm',
      'hover:bg-primary-700 hover:shadow-md',
      'focus:ring-primary-500',
      'active:bg-primary-800',
      'dark:bg-primary-600 dark:hover:bg-primary-700'
    ],
    secondary: [
      'bg-white text-gray-700 border border-gray-300 shadow-sm',
      'hover:bg-gray-50 hover:text-gray-900 hover:border-gray-400',
      'focus:ring-primary-500',
      'active:bg-gray-100',
      'dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600',
      'dark:hover:bg-gray-600 dark:hover:text-gray-100 dark:hover:border-gray-500'
    ],
    success: [
      'bg-success-600 text-white shadow-sm',
      'hover:bg-success-700 hover:shadow-md',
      'focus:ring-success-500',
      'active:bg-success-800',
      'dark:bg-success-600 dark:hover:bg-success-700'
    ],
    danger: [
      'bg-danger-600 text-white shadow-sm',
      'hover:bg-danger-700 hover:shadow-md',
      'focus:ring-danger-500',
      'active:bg-danger-800',
      'dark:bg-danger-600 dark:hover:bg-danger-700'
    ],
    warning: [
      'bg-warning-500 text-white shadow-sm',
      'hover:bg-warning-600 hover:shadow-md',
      'focus:ring-warning-500',
      'active:bg-warning-700',
      'dark:bg-warning-500 dark:hover:bg-warning-600'
    ],
    outline: [
      'bg-transparent text-gray-700 border border-gray-300',
      'hover:bg-gray-50 hover:text-gray-900 hover:border-gray-400',
      'focus:ring-primary-500',
      'active:bg-gray-100',
      'dark:text-gray-300 dark:border-gray-600',
      'dark:hover:bg-gray-800 dark:hover:text-gray-100 dark:hover:border-gray-500'
    ],
    ghost: [
      'bg-transparent text-gray-700',
      'hover:bg-gray-100 hover:text-gray-900',
      'focus:ring-primary-500',
      'active:bg-gray-200',
      'dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-gray-100'
    ]
  };

  // Classes de tailles
  const sizeClasses = {
    xs: iconOnly ? 'h-7 w-7' : 'h-7 px-2 text-xs rounded gap-1',
    sm: iconOnly ? 'h-8 w-8' : 'h-8 px-3 text-sm rounded-md gap-1.5',
    md: iconOnly ? 'h-10 w-10' : 'h-10 px-4 text-sm rounded-md gap-2',
    lg: iconOnly ? 'h-11 w-11' : 'h-11 px-6 text-base rounded-md gap-2',
    xl: iconOnly ? 'h-12 w-12' : 'h-12 px-8 text-base rounded-lg gap-2.5'
  };

  // Classes conditionnelles
  const conditionalClasses = [
    fullWidth && 'w-full',
    iconOnly && 'aspect-square p-0'
  ].filter(Boolean);

  return cn(
    baseClasses,
    variantClasses[variant],
    sizeClasses[size],
    conditionalClasses
  );
};

// Interface des props TypeScript
export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** Variante du bouton */
  variant?: ButtonVariant;

  /** Taille du bouton */
  size?: ButtonSize;

  /** Bouton pleine largeur */
  fullWidth?: boolean;

  /** Bouton avec icône uniquement */
  iconOnly?: boolean;

  /** État de chargement avec spinner */
  loading?: boolean;

  /** Icône à afficher à gauche du texte */
  leftIcon?: React.ReactNode;

  /** Icône à afficher à droite du texte */
  rightIcon?: React.ReactNode;

  /** Contenu du bouton */
  children?: React.ReactNode;

  /** Texte alternatif pour l'accessibilité (requis pour iconOnly) */
  'aria-label'?: string;

  /** Désactiver les animations */
  disableAnimation?: boolean;
}

// Composant Button principal
const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant,
      size,
      fullWidth,
      iconOnly,
      loading = false,
      disabled,
      leftIcon,
      rightIcon,
      children,
      'aria-label': ariaLabel,
      disableAnimation = false,
      ...props
    },
    ref
  ) => {
    // Validation pour les boutons icon-only
    if (iconOnly && !ariaLabel && !props['aria-labelledby']) {
      if (process.env.NODE_ENV === 'development') {
        console.warn('Button: aria-label est requis pour les boutons iconOnly pour l\'accessibilité');
      }
    }

    // Détermination de la taille du spinner selon la taille du bouton
    const spinnerSize = size === 'xs' ? 'xs' : size === 'sm' ? 'sm' : size === 'lg' || size === 'xl' ? 'lg' : 'md';

    const buttonClasses = cn(buttonVariants({ variant, size, fullWidth, iconOnly }), className);

    // Props d'animation
    const animationProps = !disableAnimation && !(disabled || loading) ? hoverTap : {};

    const ButtonComponent = disableAnimation ? 'button' : motion.button;

    return (
      <ButtonComponent
        ref={ref}
        className={buttonClasses}
        disabled={disabled || loading}
        aria-label={ariaLabel}
        aria-busy={loading}
        data-loading={loading}
        {...(animationProps as any)}
        {...props}
      >
        {/* Icône de gauche ou spinner de chargement */}
        {loading ? (
          <Spinner size={spinnerSize} />
        ) : leftIcon ? (
          <span className="flex-shrink-0" aria-hidden="true">
            {leftIcon}
          </span>
        ) : null}

        {/* Contenu textuel (masqué si iconOnly) */}
        {!iconOnly && children && (
          <span className={cn(loading && leftIcon && 'ml-2', loading && rightIcon && 'mr-2')}>
            {children}
          </span>
        )}

        {/* Icône de droite (pas affichée pendant le chargement) */}
        {!loading && rightIcon && !iconOnly && (
          <span className="flex-shrink-0" aria-hidden="true">
            {rightIcon}
          </span>
        )}

        {/* Pour les boutons iconOnly, afficher l'icône ou le spinner */}
        {iconOnly && !loading && children}
      </ButtonComponent>
    );
  }
);

Button.displayName = 'Button';

// Export des types et composants
export { Button, buttonVariants };
export type { ButtonVariant, ButtonSize };
export default Button;

import React from 'react';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/utils/cn';

// ============================================
// MODERN BUTTON - Niger Identity Design System
// ============================================
// 
// Button moderne avec gradient CROU (Vert→Orange Niger)
// Variants: primary, accent, gradient-crou, outline, ghost
// Features: Loading states, icons, hover glow
//
// Usage:
// <ModernButton variant="gradient-crou" icon={Plus} iconPosition="left">
//   Ajouter Demande
// </ModernButton>

export interface ModernButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /**
   * Style du bouton - contrôle couleurs et effets
   * - primary: Vert moderne (#059669) avec glow
   * - accent: Orange moderne (#ea580c) avec glow
   * - gradient-crou: Gradient Vert→Orange (signature Niger)
   * - outline: Bordure seule, fond transparent
   * - ghost: Pas de bordure, hover subtil
   * - danger: Rouge pour actions destructives
   */
  variant?: 'primary' | 'accent' | 'gradient-crou' | 'outline' | 'ghost' | 'danger';
  
  /**
   * Taille du bouton
   * - sm: Petit (px-3 py-1.5, text-sm)
   * - md: Moyen (px-4 py-2, text-base) - défaut
   * - lg: Large (px-6 py-3, text-lg)
   */
  size?: 'sm' | 'md' | 'lg';
  
  /**
   * État de chargement - affiche spinner + désactive le bouton
   */
  loading?: boolean;
  
  /**
   * Icône Lucide à afficher
   */
  icon?: LucideIcon;
  
  /**
   * Position de l'icône
   */
  iconPosition?: 'left' | 'right';
  
  /**
   * Largeur pleine (w-full)
   */
  fullWidth?: boolean;
  
  /**
   * Classe CSS supplémentaire
   */
  className?: string;
  
  /**
   * Contenu du bouton
   */
  children?: React.ReactNode;
}

/**
 * ModernButton - Composant bouton moderne avec gradient Niger
 */
export const ModernButton = React.forwardRef<HTMLButtonElement, ModernButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      loading = false,
      icon: Icon,
      iconPosition = 'left',
      fullWidth = false,
      className,
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    // Calcul de la classe de base
    const baseClasses = 'inline-flex items-center justify-center font-medium rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2';
    
    // Classes de taille
    const sizeClasses = {
      sm: 'px-3 py-1.5 text-sm gap-1.5',
      md: 'px-4 py-2 text-base gap-2',
      lg: 'px-6 py-3 text-lg gap-3',
    };
    
    // Classes de variant
    const variantClasses = {
      primary: 'bg-gradient-primary text-white hover:scale-[1.02] hover:shadow-button-primary focus:ring-primary-500',
      accent: 'bg-gradient-accent text-white hover:scale-[1.02] hover:shadow-button-accent focus:ring-accent-500',
      'gradient-crou': 'bg-gradient-crou text-white hover:scale-[1.02] hover:shadow-button-crou focus:ring-primary-500',
      outline: 'border-2 border-primary-500 text-primary-600 bg-transparent hover:bg-primary-50 hover:border-primary-600 focus:ring-primary-500',
      ghost: 'text-gray-700 bg-transparent hover:bg-gray-100 hover:text-gray-900 focus:ring-gray-400',
      danger: 'bg-gradient-to-br from-danger-500 to-danger-600 text-white hover:scale-[1.02] hover:shadow-lg hover:shadow-danger-500/30 focus:ring-danger-500',
    };
    
    // Icône de chargement (spinner)
    const LoadingSpinner = () => (
      <svg
        className="animate-spin h-4 w-4"
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
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
    
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(
          baseClasses,
          sizeClasses[size],
          variantClasses[variant],
          fullWidth && 'w-full',
          className
        )}
        {...props}
      >
        {/* Spinner si loading */}
        {loading && <LoadingSpinner />}
        
        {/* Icône à gauche */}
        {!loading && Icon && iconPosition === 'left' && (
          <Icon className={size === 'sm' ? 'h-4 w-4' : size === 'lg' ? 'h-6 w-6' : 'h-5 w-5'} strokeWidth={2.5} />
        )}
        
        {/* Contenu */}
        {children}
        
        {/* Icône à droite */}
        {!loading && Icon && iconPosition === 'right' && (
          <Icon className={size === 'sm' ? 'h-4 w-4' : size === 'lg' ? 'h-6 w-6' : 'h-5 w-5'} strokeWidth={2.5} />
        )}
      </button>
    );
  }
);

ModernButton.displayName = 'ModernButton';

// ============================================
// MODERN BUTTON GROUP
// ============================================

export interface ModernButtonGroupProps {
  /**
   * Boutons à afficher
   */
  children: React.ReactNode;
  
  /**
   * Orientation du groupe
   */
  orientation?: 'horizontal' | 'vertical';
  
  /**
   * Classe CSS supplémentaire
   */
  className?: string;
}

/**
 * ModernButtonGroup - Groupe de boutons collés
 */
export const ModernButtonGroup: React.FC<ModernButtonGroupProps> = ({
  children,
  orientation = 'horizontal',
  className,
}) => {
  return (
    <div
      className={cn(
        'inline-flex',
        orientation === 'horizontal' ? 'flex-row' : 'flex-col',
        '[&>button]:rounded-none',
        '[&>button:first-child]:rounded-l-lg',
        '[&>button:last-child]:rounded-r-lg',
        orientation === 'vertical' && '[&>button:first-child]:rounded-t-lg [&>button:first-child]:rounded-l-none',
        orientation === 'vertical' && '[&>button:last-child]:rounded-b-lg [&>button:last-child]:rounded-r-none',
        '[&>button:not(:last-child)]:-mr-px',
        className
      )}
    >
      {children}
    </div>
  );
};

// ============================================
// MODERN ICON BUTTON
// ============================================

export interface ModernIconButtonProps extends Omit<ModernButtonProps, 'icon' | 'children'> {
  /**
   * Icône Lucide (required)
   */
  icon: LucideIcon;
  
  /**
   * Label accessible (required pour a11y)
   */
  'aria-label': string;
}

/**
 * ModernIconButton - Bouton carré avec icône seule
 */
export const ModernIconButton = React.forwardRef<HTMLButtonElement, ModernIconButtonProps>(
  (
    {
      icon: Icon,
      size = 'md',
      variant = 'ghost',
      className,
      ...props
    },
    ref
  ) => {
    // Classes de taille pour bouton carré
    const squareSizeClasses = {
      sm: 'w-8 h-8 p-1.5',
      md: 'w-10 h-10 p-2',
      lg: 'w-12 h-12 p-2.5',
    };
    
    return (
      <ModernButton
        ref={ref}
        variant={variant}
        size={size}
        className={cn(
          squareSizeClasses[size],
          '!gap-0', // Pas de gap car icône seule
          className
        )}
        {...props}
      >
        <Icon className={size === 'sm' ? 'h-4 w-4' : size === 'lg' ? 'h-6 w-6' : 'h-5 w-5'} strokeWidth={2.5} />
      </ModernButton>
    );
  }
);

ModernIconButton.displayName = 'ModernIconButton';

// Export default
export default ModernButton;

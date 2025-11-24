import React from 'react';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/utils/cn';

// ============================================
// MODERN BADGE - Niger Identity Design System
// ============================================
// 
// Badge moderne avec variants CROU (Vert/Orange Niger)
// Variants: primary, accent, gradient-crou, success, warning, danger
// Features: Icons, glow effects, sizes
//
// Usage:
// <ModernBadge variant="gradient-crou" icon={Check} glow>
//   Validé
// </ModernBadge>

export interface ModernBadgeProps {
  /**
   * Style du badge
   * - primary: Vert moderne (#059669)
   * - accent: Orange moderne (#ea580c)
   * - gradient-crou: Gradient Vert→Orange (signature Niger)
   * - success: Vert de validation
   * - warning: Orange d'avertissement
   * - danger: Rouge d'erreur
   * - info: Bleu d'information
   * - neutral: Gris neutre
   */
  variant?: 'primary' | 'accent' | 'gradient-crou' | 'success' | 'warning' | 'danger' | 'info' | 'neutral';
  
  /**
   * Taille du badge
   * - sm: Petit (px-2 py-0.5, text-xs)
   * - md: Moyen (px-2.5 py-1, text-sm) - défaut
   * - lg: Large (px-3 py-1.5, text-base)
   */
  size?: 'sm' | 'md' | 'lg';
  
  /**
   * Icône Lucide à afficher
   */
  icon?: LucideIcon;
  
  /**
   * Position de l'icône
   */
  iconPosition?: 'left' | 'right';
  
  /**
   * Effet de glow (ombre lumineuse)
   */
  glow?: boolean;
  
  /**
   * Badge avec bordure uniquement
   */
  outline?: boolean;
  
  /**
   * Badge avec point indicateur
   */
  dot?: boolean;
  
  /**
   * Classe CSS supplémentaire
   */
  className?: string;
  
  /**
   * Contenu du badge
   */
  children?: React.ReactNode;
}

/**
 * ModernBadge - Composant badge moderne avec variants Niger
 */
export const ModernBadge: React.FC<ModernBadgeProps> = ({
  variant = 'neutral',
  size = 'md',
  icon: Icon,
  iconPosition = 'left',
  glow = false,
  outline = false,
  dot = false,
  className,
  children,
}) => {
  // Classes de base
  const baseClasses = 'inline-flex items-center font-medium rounded-full transition-all duration-200';
  
  // Classes de taille
  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs gap-1',
    md: 'px-2.5 py-1 text-sm gap-1.5',
    lg: 'px-3 py-1.5 text-base gap-2',
  };
  
  // Classes de variant (filled)
  const filledVariantClasses = {
    primary: 'bg-gradient-primary text-white',
    accent: 'bg-gradient-accent text-white',
    'gradient-crou': 'bg-gradient-crou text-white',
    success: 'bg-success-500 text-white',
    warning: 'bg-warning-500 text-white',
    danger: 'bg-danger-500 text-white',
    info: 'bg-info-500 text-white',
    neutral: 'bg-gray-100 text-gray-700',
  };
  
  // Classes de variant (outline)
  const outlineVariantClasses = {
    primary: 'border-2 border-primary-500 text-primary-600 bg-primary-50/50',
    accent: 'border-2 border-accent-500 text-accent-600 bg-accent-50/50',
    'gradient-crou': 'border-2 border-primary-500 text-primary-600 bg-gradient-to-r from-primary-50/50 to-accent-50/50',
    success: 'border-2 border-success-500 text-success-600 bg-success-50/50',
    warning: 'border-2 border-warning-500 text-warning-600 bg-warning-50/50',
    danger: 'border-2 border-danger-500 text-danger-600 bg-danger-50/50',
    info: 'border-2 border-info-500 text-info-600 bg-info-50/50',
    neutral: 'border-2 border-gray-300 text-gray-700 bg-gray-50/50',
  };
  
  // Classes de glow
  const glowClasses = {
    primary: 'shadow-button-primary',
    accent: 'shadow-button-accent',
    'gradient-crou': 'shadow-button-crou',
    success: 'shadow-lg shadow-success-500/30',
    warning: 'shadow-lg shadow-warning-500/30',
    danger: 'shadow-lg shadow-danger-500/30',
    info: 'shadow-lg shadow-info-500/30',
    neutral: 'shadow-md shadow-gray-500/20',
  };
  
  // Classes de taille d'icône
  const iconSizeClasses = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4',
    lg: 'h-5 w-5',
  };
  
  // Classes de taille de dot
  const dotSizeClasses = {
    sm: 'h-1.5 w-1.5',
    md: 'h-2 w-2',
    lg: 'h-2.5 w-2.5',
  };
  
  return (
    <span
      className={cn(
        baseClasses,
        sizeClasses[size],
        outline ? outlineVariantClasses[variant] : filledVariantClasses[variant],
        glow && glowClasses[variant],
        className
      )}
    >
      {/* Dot indicateur */}
      {dot && (
        <span
          className={cn(
            'rounded-full',
            dotSizeClasses[size],
            outline ? `bg-${variant}-500` : 'bg-white/80'
          )}
        />
      )}
      
      {/* Icône à gauche */}
      {Icon && iconPosition === 'left' && (
        <Icon className={iconSizeClasses[size]} strokeWidth={2.5} />
      )}
      
      {/* Contenu */}
      {children}
      
      {/* Icône à droite */}
      {Icon && iconPosition === 'right' && (
        <Icon className={iconSizeClasses[size]} strokeWidth={2.5} />
      )}
    </span>
  );
};

// ============================================
// MODERN BADGE GROUP
// ============================================

export interface ModernBadgeGroupProps {
  /**
   * Badges à afficher
   */
  children: React.ReactNode;
  
  /**
   * Espacement entre les badges
   */
  spacing?: 'tight' | 'normal' | 'loose';
  
  /**
   * Classe CSS supplémentaire
   */
  className?: string;
}

/**
 * ModernBadgeGroup - Groupe de badges avec espacement
 */
export const ModernBadgeGroup: React.FC<ModernBadgeGroupProps> = ({
  children,
  spacing = 'normal',
  className,
}) => {
  const spacingClasses = {
    tight: 'gap-1',
    normal: 'gap-2',
    loose: 'gap-3',
  };
  
  return (
    <div className={cn('inline-flex flex-wrap items-center', spacingClasses[spacing], className)}>
      {children}
    </div>
  );
};

// ============================================
// STATUS BADGE (Preset pour statuts communs)
// ============================================

export interface StatusBadgeProps extends Omit<ModernBadgeProps, 'variant' | 'children'> {
  /**
   * Statut à afficher
   * - pending: En attente (warning)
   * - approved: Approuvé (success)
   * - rejected: Rejeté (danger)
   * - processing: En cours (info)
   * - completed: Terminé (gradient-crou)
   */
  status: 'pending' | 'approved' | 'rejected' | 'processing' | 'completed';
  
  /**
   * Label personnalisé (sinon utilise le label par défaut)
   */
  label?: string;
}

/**
 * StatusBadge - Badge préconfiguré pour statuts
 */
export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  label,
  ...props
}) => {
  const statusConfig = {
    pending: {
      variant: 'warning' as const,
      label: 'En attente',
    },
    approved: {
      variant: 'success' as const,
      label: 'Approuvé',
    },
    rejected: {
      variant: 'danger' as const,
      label: 'Rejeté',
    },
    processing: {
      variant: 'info' as const,
      label: 'En cours',
    },
    completed: {
      variant: 'gradient-crou' as const,
      label: 'Terminé',
    },
  };
  
  const config = statusConfig[status];
  
  return (
    <ModernBadge variant={config.variant} dot {...props}>
      {label || config.label}
    </ModernBadge>
  );
};

// ============================================
// COUNTER BADGE (Badge de compteur)
// ============================================

export interface CounterBadgeProps extends Omit<ModernBadgeProps, 'children'> {
  /**
   * Nombre à afficher
   */
  count: number;
  
  /**
   * Maximum avant affichage "99+"
   */
  max?: number;
}

/**
 * CounterBadge - Badge compteur numérique
 */
export const CounterBadge: React.FC<CounterBadgeProps> = ({
  count,
  max = 99,
  ...props
}) => {
  const displayCount = count > max ? `${max}+` : count.toString();
  
  return (
    <ModernBadge size="sm" {...props}>
      {displayCount}
    </ModernBadge>
  );
};

// Export default
export default ModernBadge;

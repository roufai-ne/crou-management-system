import React from 'react';
import { cn } from '@/utils/cn';
import { LucideIcon } from 'lucide-react';

// Type pour les variantes de props (remplace VariantProps de class-variance-authority)
type VariantProps<T> = T extends (...args: any[]) => any
  ? Parameters<T>[0]
  : never;

// Fonction de variantes personnalisée pour le badge
const badgeVariants = (props: {
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info' | 'outline' | 'red' | 'green' | 'danger' | 'default' | 'accent' | 'gradient' | 'neutral';
  size?: 'sm' | 'md' | 'lg';
  rounded?: boolean;
  glow?: boolean;
  outline?: boolean;
}) => {
  const { variant = 'primary', size = 'md', rounded = false, glow = false, outline = false } = props;

  const baseClasses = 'inline-flex items-center justify-center font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2';

  // Classes de variant (filled)
  const filledVariantClasses = {
    primary: 'bg-primary-100 text-primary-800 border border-primary-200 focus:ring-primary-500',
    secondary: 'bg-gray-100 text-gray-800 border border-gray-200 focus:ring-gray-500',
    success: 'bg-green-100 text-green-800 border border-green-200 focus:ring-green-500',
    warning: 'bg-yellow-100 text-yellow-800 border border-yellow-200 focus:ring-yellow-500',
    error: 'bg-red-100 text-red-800 border border-red-200 focus:ring-red-500',
    info: 'bg-blue-100 text-blue-800 border border-blue-200 focus:ring-blue-500',
    outline: 'bg-transparent text-gray-700 border border-gray-300 hover:bg-gray-50 focus:ring-gray-500',
    accent: 'bg-orange-100 text-orange-800 border border-orange-200 focus:ring-orange-500',
    gradient: 'bg-gradient-to-r from-primary-500 to-orange-500 text-white border-none focus:ring-primary-500',
    neutral: 'bg-gray-100 text-gray-700 border border-gray-200 focus:ring-gray-500',
  } as Record<string, string>;

  // Aliases for legacy color names used across the codebase
  filledVariantClasses['red'] = filledVariantClasses['error'];
  filledVariantClasses['green'] = filledVariantClasses['success'];
  filledVariantClasses['danger'] = filledVariantClasses['error'];
  filledVariantClasses['default'] = filledVariantClasses['secondary'];

  // Classes de variant (outline) - Overrides filled if outline is true
  const outlineVariantClasses = {
    primary: 'border-2 border-primary-500 text-primary-600 bg-primary-50/50',
    secondary: 'border-2 border-gray-500 text-gray-600 bg-gray-50/50',
    success: 'border-2 border-success-500 text-success-600 bg-success-50/50',
    warning: 'border-2 border-warning-500 text-warning-600 bg-warning-50/50',
    error: 'border-2 border-danger-500 text-danger-600 bg-danger-50/50',
    info: 'border-2 border-info-500 text-info-600 bg-info-50/50',
    accent: 'border-2 border-orange-500 text-orange-600 bg-orange-50/50',
    gradient: 'border-2 border-primary-500 text-primary-600 bg-gradient-to-r from-primary-50/50 to-orange-50/50',
    neutral: 'border-2 border-gray-300 text-gray-700 bg-gray-50/50',
  } as Record<string, string>;

  // Aliases for outline
  outlineVariantClasses['red'] = outlineVariantClasses['error'];
  outlineVariantClasses['green'] = outlineVariantClasses['success'];
  outlineVariantClasses['danger'] = outlineVariantClasses['error'];
  outlineVariantClasses['default'] = outlineVariantClasses['secondary'];

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs gap-1',
    md: 'px-2.5 py-1 text-sm gap-1.5',
    lg: 'px-3 py-1.5 text-base gap-2'
  };

  const glowClasses = {
    primary: 'shadow-md shadow-primary-500/30',
    secondary: 'shadow-md shadow-gray-500/20',
    success: 'shadow-md shadow-green-500/30',
    warning: 'shadow-md shadow-yellow-500/30',
    error: 'shadow-md shadow-red-500/30',
    info: 'shadow-md shadow-blue-500/30',
    accent: 'shadow-md shadow-orange-500/30',
    gradient: 'shadow-md shadow-primary-500/30',
    neutral: 'shadow-md shadow-gray-500/20',
  } as Record<string, string>;

  // Aliases for glow
  glowClasses['red'] = glowClasses['error'];
  glowClasses['green'] = glowClasses['success'];
  glowClasses['danger'] = glowClasses['error'];
  glowClasses['default'] = glowClasses['secondary'];

  return cn(
    baseClasses,
    outline ? outlineVariantClasses[variant] : filledVariantClasses[variant],
    sizeClasses[size],
    rounded ? 'rounded-full' : 'rounded-md',
    glow && glowClasses[variant]
  );
};

// Interface des props
export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info' | 'outline' | 'red' | 'green' | 'danger' | 'default' | 'accent' | 'gradient' | 'neutral';
  size?: 'sm' | 'md' | 'lg';
  rounded?: boolean;
  children?: React.ReactNode;

  // ModernBadge compatibility
  icon?: LucideIcon;
  iconPosition?: 'left' | 'right';
  glow?: boolean;
  outline?: boolean; // Note: 'outline' variant exists, but this boolean prop is for ModernBadge compat
  dot?: boolean;
}

// Composant Badge
export const Badge: React.FC<BadgeProps> = ({
  variant = 'primary',
  size = 'md',
  rounded = false,
  className,
  children,
  icon: Icon,
  iconPosition = 'left',
  glow = false,
  outline = false,
  dot = false,
  ...props
}) => {
  // Handle 'outline' variant vs outline prop
  const isOutline = outline || variant === 'outline';

  // Classes de taille de dot
  const dotSizeClasses = {
    sm: 'h-1.5 w-1.5',
    md: 'h-2 w-2',
    lg: 'h-2.5 w-2.5',
  };

  // Classes de taille d'icône
  const iconSizeClasses = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4',
    lg: 'h-5 w-5',
  };

  return (
    <span
      className={cn(badgeVariants({ variant, size, rounded: rounded || dot, glow, outline: isOutline }), className)}
      {...props}
    >
      {/* Dot indicateur */}
      {dot && (
        <span
          className={cn(
            'rounded-full mr-1.5',
            dotSizeClasses[size],
            isOutline ? `bg-${variant === 'gradient' ? 'primary' : variant}-500` : 'bg-white/80'
          )}
        />
      )}

      {/* Icône à gauche */}
      {Icon && iconPosition === 'left' && (
        <Icon className={iconSizeClasses[size]} strokeWidth={2.5} />
      )}

      {children}

      {/* Icône à droite */}
      {Icon && iconPosition === 'right' && (
        <Icon className={iconSizeClasses[size]} strokeWidth={2.5} />
      )}
    </span>
  );
};

export default Badge;

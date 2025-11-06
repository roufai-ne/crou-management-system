import React from 'react';
import { cn } from '@/utils/cn';

// Type pour les variantes de props (remplace VariantProps de class-variance-authority)
type VariantProps<T> = T extends (...args: any[]) => any
  ? Parameters<T>[0]
  : never;

// Fonction de variantes personnalisée pour le badge
const badgeVariants = (props: {
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info' | 'outline' | 'red' | 'green' | 'danger' | 'default';
  size?: 'sm' | 'md' | 'lg';
  rounded?: boolean;
}) => {
  const baseClasses = 'inline-flex items-center justify-center font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2';
  
  const variantClasses = {
    primary: 'bg-primary-100 text-primary-800 border border-primary-200 focus:ring-primary-500',
    secondary: 'bg-gray-100 text-gray-800 border border-gray-200 focus:ring-gray-500',
    success: 'bg-green-100 text-green-800 border border-green-200 focus:ring-green-500',
    warning: 'bg-yellow-100 text-yellow-800 border border-yellow-200 focus:ring-yellow-500',
    error: 'bg-red-100 text-red-800 border border-red-200 focus:ring-red-500',
    info: 'bg-blue-100 text-blue-800 border border-blue-200 focus:ring-blue-500',
    outline: 'bg-transparent text-gray-700 border border-gray-300 hover:bg-gray-50 focus:ring-gray-500'
  } as Record<string, string>;
  
  // Aliases for legacy color names used across the codebase
  variantClasses['red'] = variantClasses['error'];
  variantClasses['green'] = variantClasses['success'];
  variantClasses['danger'] = variantClasses['error'];
  variantClasses['default'] = variantClasses['secondary'];
  
  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-sm',
    lg: 'px-3 py-1.5 text-base'
  };
  
  return cn(
    baseClasses,
    variantClasses[props.variant || 'primary'],
    sizeClasses[props.size || 'md'],
    props.rounded ? 'rounded-full' : 'rounded-md'
  );
};

// Interface des props
export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info' | 'outline' | 'red' | 'green' | 'danger' | 'default';
  size?: 'sm' | 'md' | 'lg';
  rounded?: boolean;
  children: React.ReactNode;
}

// Composant Badge
export const Badge: React.FC<BadgeProps> = ({
  variant = 'primary',
  size = 'md',
  rounded = false,
  className,
  children,
  ...props
}) => {
  return (
    <span
      className={cn(badgeVariants({ variant, size, rounded }), className)}
      {...props}
    >
      {children}
    </span>
  );
};

export default Badge;

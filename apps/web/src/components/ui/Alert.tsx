import React, { useState } from 'react';
import { cn } from '@/utils/cn';
import {
  CheckCircleIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  XCircleIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';

// Type pour les variantes de props (remplace VariantProps de class-variance-authority)
type VariantProps<T> = T extends (...args: any[]) => any
  ? Parameters<T>[0]
  : never;

// Fonction de variantes personnalisée pour l'alert
const alertVariants = (props: {
  variant?: 'info' | 'success' | 'warning' | 'error';
  size?: 'sm' | 'md' | 'lg';
}) => {
  const baseClasses = 'relative flex items-start gap-3 p-4 rounded-lg border transition-all duration-200';

  const variantClasses = {
    info: 'bg-blue-50 border-blue-200 text-blue-800',
    success: 'bg-green-50 border-green-200 text-green-800',
    warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
    error: 'bg-red-50 border-red-200 text-red-800'
  };

  const sizeClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg'
  };

  return cn(
    baseClasses,
    variantClasses[props.variant || 'info'],
    sizeClasses[props.size || 'md']
  );
};

// Interface des props
export interface AlertProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'info' | 'success' | 'warning' | 'error';
  size?: 'sm' | 'md' | 'lg';
  title?: string;
  children: React.ReactNode;
  dismissible?: boolean;
  onDismiss?: () => void;
  icon?: React.ReactNode;
  showIcon?: boolean;
}

// Composant Alert
export const Alert: React.FC<AlertProps> = ({
  variant = 'info',
  size = 'md',
  title,
  children,
  dismissible = false,
  onDismiss,
  icon,
  showIcon = true,
  className,
  ...props
}) => {
  const [isVisible, setIsVisible] = useState(true);

  const handleDismiss = () => {
    setIsVisible(false);
    onDismiss?.();
  };

  if (!isVisible) return null;

  // Icônes par défaut selon la variante
  const defaultIcons = {
    info: <InformationCircleIcon className="w-5 h-5 flex-shrink-0" />,
    success: <CheckCircleIcon className="w-5 h-5 flex-shrink-0" />,
    warning: <ExclamationTriangleIcon className="w-5 h-5 flex-shrink-0" />,
    error: <XCircleIcon className="w-5 h-5 flex-shrink-0" />
  };

  const displayIcon = icon || (showIcon ? defaultIcons[variant] : null);

  return (
    <div
      className={cn(alertVariants({ variant, size }), className)}
      role="alert"
      {...props}
    >
      {displayIcon && (
        <div className="flex-shrink-0">
          {displayIcon}
        </div>
      )}

      <div className="flex-1 min-w-0">
        {title && (
          <h3 className="font-medium mb-1">
            {title}
          </h3>
        )}
        <div className="text-sm">
          {children}
        </div>
      </div>

      {dismissible && (
        <button
          type="button"
          className="flex-shrink-0 ml-auto pl-3 opacity-70 hover:opacity-100 transition-opacity"
          onClick={handleDismiss}
          aria-label="Fermer l'alerte"
        >
          <XMarkIcon className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};

export default Alert;

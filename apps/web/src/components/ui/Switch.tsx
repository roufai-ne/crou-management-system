/**
 * FICHIER: apps\web\src\components\ui\Switch.tsx
 * COMPOSANT: Switch - Composant d'interrupteur du système de design CROU
 * 
 * DESCRIPTION:
 * Composant d'interrupteur (toggle) avec animations fluides et accessibilité
 * États on/off, validation, tailles multiples et intégration formulaires
 * Optimisé pour l'usage dans l'application CROU multi-tenant
 * 
 * FONCTIONNALITÉS:
 * - États: on/off avec animations fluides
 * - Validation: success, error, warning avec messages
 * - Tailles: sm, md, lg avec adaptation automatique
 * - Accessibilité: ARIA complet, navigation clavier
 * - Intégration: React Hook Form, Formik compatible
 * - Animations: Transitions fluides et micro-interactions
 * - Icônes: Support d'icônes dans les états on/off
 * 
 * VARIANTES:
 * - 'default': Style standard avec fond coloré
 * - outline: Bordure avec fond transparent
 * - filled: Fond coloré avec contraste élevé
 * 
 * TAILLES:
 * - sm: Petit (32x18px) pour interfaces compactes
 * - md: Moyen (44x24px) - défaut
 * - lg: Grand (56x32px) pour interfaces tactiles
 * 
 * PROPS:
 * - checked: État activé (boolean)
 * - onChange: Callback de changement d'état
 * - label: Libellé de l'interrupteur
 * - description: Description détaillée
 * - error: Message d'erreur
 * - disabled: État désactivé
 * - loading: État de chargement
 * - icons: Icônes pour les états on/off
 * 
 * USAGE:
 * <Switch
 *   checked={isEnabled}
 *   onChange={setIsEnabled}
 *   label="Activer les notifications"
 *   description="Recevoir des alertes par email"
 * />
 * 
 * AUTEUR: Équipe CROU
 * DATE: Décembre 2024
 */

import React, { forwardRef } from 'react';
// Type pour les variantes de props
type VariantProps<T> = T extends (...args: any[]) => any
  ? Parameters<T>[0]
  : never;
import { ExclamationCircleIcon } from '@heroicons/react/24/outline';
import { cn } from '@/utils/cn';

// Types pour les variantes
type SwitchVariant = 'default' | 'outline' | 'filled';
type SwitchSize = 'sm' | 'md' | 'lg';
type ValidationState = 'default' | 'success' | 'error' | 'warning';

// Fonction pour générer les classes CSS du conteneur switch
const switchContainerVariants = (props: {
  disabled?: boolean;
}) => {
  const { disabled = false } = props;

  return cn(
    'relative flex items-start gap-3',
    disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
  );
};

// Fonction pour générer les classes CSS de l'interrupteur
const switchVariants = (props: {
  variant?: SwitchVariant;
  size?: SwitchSize;
  validationState?: ValidationState;
}) => {
  const { variant = 'default', size = 'md', validationState = 'default' } = props;

  // Classes de base
  const baseClasses = [
    'relative inline-flex items-center rounded-full border-2 transition-all duration-200 ease-in-out',
    'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500',
    'disabled:cursor-not-allowed disabled:opacity-50'
  ];

  // Classes de variantes
  const variantClasses = {
    'default': [
      'border-transparent',
      'bg-gray-200 dark:bg-gray-700',
      'checked:bg-primary-600 dark:checked:bg-primary-600'
    ],
    outline: [
      'border-gray-300 dark:border-gray-600 bg-transparent',
      'checked:border-primary-600 checked:bg-primary-50 dark:checked:bg-primary-900/20'
    ],
    filled: [
      'border-transparent',
      'bg-gray-100 dark:bg-gray-800',
      'checked:bg-primary-500 dark:checked:bg-primary-500'
    ]
  };

  // Classes de tailles
  const sizeClasses = {
    sm: 'h-5 w-9',
    md: 'h-6 w-11',
    lg: 'h-8 w-14'
  };

  // Classes de validation
  const validationClasses = {
    'default': '',
    success: 'checked:bg-success-600 dark:checked:bg-success-600',
    error: 'checked:bg-danger-600 dark:checked:bg-danger-600',
    warning: 'checked:bg-warning-600 dark:checked:bg-warning-600'
  };

  // Classes conditionnelles
  const conditionalClasses = [];
  if (variant === 'outline') {
    if (validationState === 'success') {
      conditionalClasses.push('checked:border-success-600 checked:bg-success-50 dark:checked:bg-success-900/20');
    } else if (validationState === 'error') {
      conditionalClasses.push('checked:border-danger-600 checked:bg-danger-50 dark:checked:bg-danger-900/20');
    } else if (validationState === 'warning') {
      conditionalClasses.push('checked:border-warning-600 checked:bg-warning-50 dark:checked:bg-warning-900/20');
    }
  }

  return cn(
    baseClasses,
    variantClasses[variant],
    sizeClasses[size],
    validationClasses[validationState],
    conditionalClasses
  );
};

// Fonction pour générer les classes CSS du thumb (bouton mobile)
const thumbVariants = (props: {
  size?: SwitchSize;
  checked?: boolean;
}) => {
  const { size = 'md', checked = false } = props;

  // Classes de base
  const baseClasses = [
    'pointer-events-none inline-block rounded-full bg-white shadow-lg transform ring-0 transition-all duration-200 ease-in-out',
    'flex items-center justify-center'
  ];

  // Classes de tailles et positions
  const sizeClasses = {
    sm: checked ? 'h-4 w-4 translate-x-4' : 'h-4 w-4 translate-x-0',
    md: checked ? 'h-5 w-5 translate-x-5' : 'h-5 w-5 translate-x-0',
    lg: checked ? 'h-7 w-7 translate-x-6' : 'h-7 w-7 translate-x-0'
  };

  return cn(
    baseClasses,
    sizeClasses[size]
  );
};

// Interface pour les icônes
export interface SwitchIcons {
  on?: React.ReactNode;
  off?: React.ReactNode;
}

// Interface des props
export interface SwitchProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'>,
    VariantProps<typeof switchVariants> {
  /** État activé */
  checked?: boolean;
  
  /** Callback de changement d'état */
  onChange?: (checked: boolean, event: React.ChangeEvent<HTMLInputElement>) => void;
  
  /** Libellé de l'interrupteur */
  label?: string;
  
  /** Description détaillée */
  description?: string;
  
  /** Message d'erreur */
  error?: string;
  
  /** Texte d'aide */
  helperText?: string;
  
  /** État de chargement */
  loading?: boolean;
  
  /** Icônes pour les états on/off */
  icons?: SwitchIcons;
  
  /** Classe CSS pour le conteneur */
  containerClassName?: string;
  
  /** Classe CSS pour le label */
  labelClassName?: string;
  
  /** ID unique pour l'accessibilité */
  id?: string;
}

// Composant Switch principal
const Switch = forwardRef<HTMLInputElement, SwitchProps>(
  (
    {
      className,
      containerClassName,
      labelClassName,
      variant,
      size,
      validationState,
      checked = false,
      onChange,
      label,
      description,
      error,
      helperText,
      disabled,
      loading,
      icons,
      required,
      id,
      ...props
    },
    ref
  ) => {
    // Génération d'un ID unique si non fourni
    const switchId = id || `switch-${Math.random().toString(36).substr(2, 9)}`;
    
    // Détermination de l'état de validation
    const currentValidationState = error ? 'error' : validationState || 'default';
    
    // Fonction de gestion du changement
    const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
      if (onChange && !disabled && !loading) {
        onChange(event.target.checked, event);
      }
    };
    
    // Fonction de gestion du clic sur le conteneur
    const handleContainerClick = () => {
      if (!disabled && !loading) {
        const syntheticEvent = {
          target: { checked: !checked },
          currentTarget: { checked: !checked }
        } as React.ChangeEvent<HTMLInputElement>;
        
        if (onChange) {
          onChange(!checked, syntheticEvent);
        }
      }
    };
    
    // Fonction de gestion des touches clavier
    const handleKeyDown = (event: React.KeyboardEvent) => {
      if (event.key === ' ' || event.key === 'Enter') {
        event.preventDefault();
        handleContainerClick();
      }
    };
    
    // Rendu du contenu du thumb
    const renderThumbContent = () => {
      if (loading) {
        const spinnerSize = size === 'sm' ? 'h-2 w-2' : size === 'lg' ? 'h-3 w-3' : 'h-2.5 w-2.5';
        return (
          <div className={cn('animate-spin rounded-full border border-gray-400 border-t-gray-600', spinnerSize)} />
        );
      }
      
      if (icons) {
        const iconSize = size === 'sm' ? 'h-2 w-2' : size === 'lg' ? 'h-3 w-3' : 'h-2.5 w-2.5';
        const currentIcon = checked ? icons.on : icons.off;
        
        if (currentIcon) {
          return (
            <span className={cn('text-gray-600', iconSize)}>
              {currentIcon}
            </span>
          );
        }
      }
      
      return null;
    };

    return (
      <div className={cn('space-y-1', containerClassName)}>
        <div
          className={cn(
            switchContainerVariants({ disabled: disabled || loading }),
            'group'
          )}
          onClick={handleContainerClick}
          onKeyDown={handleKeyDown}
          tabIndex={disabled || loading ? -1 : 0}
          role="switch"
          aria-checked={checked}
          aria-describedby={
            error ? `${switchId}-error` : 
            helperText ? `${switchId}-helper` : 
            undefined
          }
          aria-required={required}
          aria-disabled={disabled || loading}
        >
          {/* Input caché pour la compatibilité formulaires */}
          <input
            ref={ref}
            type="checkbox"
            id={switchId}
            checked={checked}
            onChange={handleChange}
            disabled={disabled || loading}
            required={required}
            className="sr-only"
            aria-hidden="true"
            {...props}
          />
          
          {/* Interrupteur visuel */}
          <div
            className={cn(
              switchVariants({
                variant,
                size,
                validationState: currentValidationState
              }),
              className
            )}
            data-checked={checked}
            data-loading={loading}
          >
            {/* Thumb mobile */}
            <div
              className={cn(
                thumbVariants({
                  size,
                  checked
                })
              )}
            >
              {renderThumbContent()}
            </div>
          </div>
          
          {/* Contenu textuel */}
          {(label || description) && (
            <div className="flex-1 min-w-0">
              {label && (
                <label
                  htmlFor={switchId}
                  className={cn(
                    'block text-sm font-medium text-gray-900 dark:text-gray-100',
                    required && "after:content-['*'] after:ml-0.5 after:text-danger-500",
                    (disabled || loading) && 'text-gray-500 dark:text-gray-400',
                    'cursor-pointer group-hover:text-gray-700 dark:group-hover:text-gray-200',
                    labelClassName
                  )}
                >
                  {label}
                </label>
              )}
              
              {description && (
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  {description}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Message d'erreur */}
        {error && (
          <p
            id={`${switchId}-error`}
            className="text-sm text-danger-600 dark:text-danger-400 flex items-center gap-1"
            role="alert"
          >
            <ExclamationCircleIcon className="h-4 w-4 flex-shrink-0" />
            {error}
          </p>
        )}

        {/* Texte d'aide */}
        {helperText && !error && (
          <p
            id={`${switchId}-helper`}
            className="text-sm text-gray-500 dark:text-gray-400"
          >
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

Switch.displayName = 'Switch';

// Interface pour SwitchGroup
export interface SwitchGroupOption {
  key: string;
  label: string;
  description?: string;
  variant?: SwitchProps['variant'];
  disabled?: boolean;
}

export interface SwitchGroupProps {
  options: SwitchGroupOption[];
  value: Record<string, boolean>;
  onChange: (values: Record<string, boolean>) => void;
  label?: string;
  description?: string;
  className?: string;
  orientation?: 'vertical' | 'horizontal';
  spacing?: 'sm' | 'md' | 'lg';
}

// Composant SwitchGroup
export const SwitchGroup: React.FC<SwitchGroupProps> = ({
  options,
  value,
  onChange,
  label,
  description,
  className,
  orientation = 'vertical',
  spacing = 'md'
}) => {
  const handleSwitchChange = (key: string, checked: boolean) => {
    onChange({
      ...value,
      [key]: checked
    });
  };

  const spacingClasses = {
    sm: orientation === 'vertical' ? 'space-y-2' : 'space-x-4',
    md: orientation === 'vertical' ? 'space-y-3' : 'space-x-6',
    lg: orientation === 'vertical' ? 'space-y-4' : 'space-x-8'
  };

  const orientationClasses = {
    vertical: 'flex-col',
    horizontal: 'flex-row flex-wrap'
  };

  return (
    <div className={cn('space-y-3', className)}>
      {(label || description) && (
        <div>
          {label && (
            <label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-1">
              {label}
            </label>
          )}
          {description && (
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {description}
            </p>
          )}
        </div>
      )}
      
      <div className={cn(
        'flex',
        orientationClasses[orientation],
        spacingClasses[spacing]
      )}>
        {options.map((option) => (
          <Switch
            key={option.key}
            label={option.label}
            description={option.description}
            checked={value[option.key] || false}
            onChange={(checked) => handleSwitchChange(option.key, checked)}
            variant={option.variant}
            disabled={option.disabled}
          />
        ))}
      </div>
    </div>
  );
};

// Export des types et composants
export { Switch, switchContainerVariants, switchVariants, thumbVariants };
export type { SwitchProps, SwitchIcons, SwitchGroupProps, SwitchGroupOption };
export default Switch;

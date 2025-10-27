/**
 * FICHIER: apps\web\src\components\ui\Input.tsx
 * COMPOSANT: Input - Composant de saisie complet du système de design CROU
 * 
 * DESCRIPTION:
 * Composant de saisie avec support complet des variantes, validation et accessibilité
 * Intégration avec les formulaires CROU et formatage automatique
 * Support des icônes, états de validation et aide contextuelle
 * 
 * VARIANTES:
 * - 'default': Style standard avec bordure
 * - filled: Fond coloré avec bordure subtile
 * - flushed: Bordure inférieure uniquement
 * 
 * TAILLES:
 * - sm: Petit (32px)
 * - md: Moyen (40px) - défaut
 * - lg: Grand (44px)
 * 
 * ÉTATS DE VALIDATION:
 * - 'default': État normal
 * - success: Validation réussie
 * - error: Erreur de validation
 * - warning: Avertissement
 * 
 * PROPS:
 * - label: Libellé du champ
 * - placeholder: Texte d'aide
 * - error: Message d'erreur
 * - helperText: Texte d'aide
 * - leftIcon: Icône à gauche
 * - rightIcon: Icône à droite
 * - required: Champ obligatoire
 * - disabled: Champ désactivé
 * - loading: État de chargement
 * 
 * USAGE:
 * <Input
 *   label="Email"
 *   placeholder="nom@crou.gov.ne"
 *   type="email"
 *   required
 *   error={errors.email}
 * />
 * 
 * AUTEUR: Équipe CROU
 * DATE: Décembre 2024
 */

import React, { forwardRef, useState } from 'react';
// Type pour les variantes de props
type VariantProps<T> = T extends (...args: any[]) => any
  ? Parameters<T>[0]
  : never;
import { EyeIcon, EyeSlashIcon, ExclamationCircleIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import { cn } from '@/utils/cn';

// Composant Spinner pour l'état de chargement
const InputSpinner: React.FC<{ size?: 'sm' | 'md' | 'lg' }> = ({ size = 'md' }) => {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-4 w-4',
    lg: 'h-5 w-5'
  };

  return (
    <svg
      className={cn('animate-spin text-gray-400', sizeClasses[size])}
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
type InputVariant = 'default' | 'filled' | 'flushed';
type InputSize = 'sm' | 'md' | 'lg';
type ValidationState = 'default' | 'success' | 'error' | 'warning';

// Fonction pour générer les classes CSS du conteneur d'input
const inputContainerVariants = (props: {
  variant?: InputVariant;
  size?: InputSize;
  validationState?: ValidationState;
  disabled?: boolean;
}) => {
  const { variant = 'default', size = 'md', validationState = 'default', disabled = false } = props;

  // Classes de base
  const baseClasses = 'relative flex items-center transition-all duration-200';

  // Classes de variantes
  const variantClasses = {
    'default': 'rounded-md border bg-white dark:bg-gray-700',
    filled: 'rounded-md border bg-gray-50 dark:bg-gray-800',
    flushed: 'border-b bg-transparent'
  };

  // Classes de tailles
  const sizeClasses = {
    sm: 'h-8',
    md: 'h-10',
    lg: 'h-11'
  };

  // Classes de validation
  const validationClasses = {
    'default': 'border-gray-300 dark:border-gray-600 focus-within:border-primary-500 focus-within:ring-1 focus-within:ring-primary-500',
    success: 'border-success-500 dark:border-success-400 focus-within:border-success-500 focus-within:ring-1 focus-within:ring-success-500',
    error: 'border-danger-500 dark:border-danger-400 focus-within:border-danger-500 focus-within:ring-1 focus-within:ring-danger-500',
    warning: 'border-warning-500 dark:border-warning-400 focus-within:border-warning-500 focus-within:ring-1 focus-within:ring-warning-500'
  };

  // Classes conditionnelles
  const conditionalClasses = [
    disabled && 'opacity-50 cursor-not-allowed bg-gray-100 dark:bg-gray-800',
    variant === 'filled' && validationState === 'success' && 'bg-success-50 dark:bg-success-900/20',
    variant === 'filled' && validationState === 'error' && 'bg-danger-50 dark:bg-danger-900/20',
    variant === 'filled' && validationState === 'warning' && 'bg-warning-50 dark:bg-warning-900/20'
  ].filter(Boolean);

  return cn(
    baseClasses,
    variantClasses[variant],
    sizeClasses[size],
    validationClasses[validationState],
    conditionalClasses
  );
};

// Fonction pour générer les classes CSS de l'input
const inputVariants = (props: {
  size?: InputSize;
  hasLeftIcon?: boolean;
  hasRightIcon?: boolean;
}) => {
  const { size = 'md', hasLeftIcon = false, hasRightIcon = false } = props;

  // Classes de base
  const baseClasses = [
    'flex-1 bg-transparent border-0 outline-none transition-all duration-200',
    'placeholder:text-gray-400 dark:placeholder:text-gray-500',
    'text-gray-900 dark:text-gray-100',
    'disabled:cursor-not-allowed disabled:opacity-50'
  ];

  // Classes de tailles
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-3 py-2 text-sm',
    lg: 'px-4 py-2.5 text-base'
  };

  // Classes conditionnelles pour les icônes
  const iconClasses = [];
  if (hasLeftIcon) {
    const leftIconClasses = {
      sm: 'pl-8',
      md: 'pl-10',
      lg: 'pl-11'
    };
    iconClasses.push(leftIconClasses[size]);
  }
  if (hasRightIcon) {
    const rightIconClasses = {
      sm: 'pr-8',
      md: 'pr-10',
      lg: 'pr-11'
    };
    iconClasses.push(rightIconClasses[size]);
  }

  return cn(
    baseClasses,
    sizeClasses[size],
    iconClasses
  );
};

// Interface des props
export interface InputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'>,
    VariantProps<typeof inputContainerVariants> {
  /** Libellé du champ */
  label?: string;
  
  /** Message d'erreur */
  error?: string;
  
  /** Texte d'aide */
  helperText?: string;
  
  /** Icône à gauche */
  leftIcon?: React.ReactNode;
  
  /** Icône à droite */
  rightIcon?: React.ReactNode;
  
  /** État de chargement */
  loading?: boolean;
  
  /** Classe CSS pour le conteneur */
  containerClassName?: string;
  
  /** Classe CSS pour le label */
  labelClassName?: string;
  
  /** ID unique pour l'accessibilité */
  id?: string;
}

// Composant Input principal
const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      containerClassName,
      labelClassName,
      variant,
      size,
      validationState,
      disabled,
      label,
      error,
      helperText,
      leftIcon,
      rightIcon,
      loading,
      required,
      type = 'text',
      id,
      ...props
    },
    ref
  ) => {
    const [showPassword, setShowPassword] = useState(false);
    
    // Génération d'un ID unique si non fourni
    const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;
    
    // Détermination de l'état de validation
    const currentValidationState = error ? 'error' : validationState || 'default';
    
    // Gestion du type password avec toggle
    const inputType = type === 'password' && showPassword ? 'text' : type;
    
    // Détermination des icônes à afficher
    const hasLeftIcon = Boolean(leftIcon);
    const hasRightIcon = Boolean(rightIcon || loading || type === 'password' || currentValidationState !== 'default');
    
    // Icône de validation automatique
    const getValidationIcon = () => {
      if (loading) {
        return <InputSpinner size={size} />;
      }
      
      switch (currentValidationState) {
        case 'success':
          return <CheckCircleIcon className="h-5 w-5 text-success-500" />;
        case 'error':
          return <ExclamationCircleIcon className="h-5 w-5 text-danger-500" />;
        case 'warning':
          return <ExclamationCircleIcon className="h-5 w-5 text-warning-500" />;
  default:
          return null;
      }
    };

    return (
      <div className={cn('space-y-1', containerClassName)}>
        {/* Label */}
        {label && (
          <label
            htmlFor={inputId}
            className={cn(
              'block text-sm font-medium text-gray-700 dark:text-gray-300',
              required && "after:content-['*'] after:ml-0.5 after:text-danger-500",
              disabled && 'opacity-50',
              labelClassName
            )}
          >
            {label}
          </label>
        )}

        {/* Container d'input */}
        <div
          className={cn(
            inputContainerVariants({
              variant,
              size,
              validationState: currentValidationState,
              disabled
            })
          )}
        >
          {/* Icône de gauche */}
          {hasLeftIcon && (
            <div className="absolute left-3 flex items-center pointer-events-none">
              <span className="text-gray-400 dark:text-gray-500">
                {leftIcon}
              </span>
            </div>
          )}

          {/* Input principal */}
          <input
            ref={ref}
            id={inputId}
            type={inputType}
            disabled={disabled || loading}
            required={required}
            className={cn(
              inputVariants({
                size,
                hasLeftIcon,
                hasRightIcon
              }),
              className
            )}
            aria-invalid={currentValidationState === 'error'}
            aria-describedby={
              error ? `${inputId}-error` : 
              helperText ? `${inputId}-helper` : 
              undefined
            }
            {...props}
          />

          {/* Icônes de droite */}
          {hasRightIcon && (
            <div className="absolute right-3 flex items-center space-x-1">
              {/* Icône de validation ou loading */}
              {getValidationIcon()}
              
              {/* Toggle password visibility */}
              {type === 'password' && !loading && (
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                  aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <EyeSlashIcon className="h-5 w-5" />
                  ) : (
                    <EyeIcon className="h-5 w-5" />
                  )}
                </button>
              )}
              
              {/* Icône personnalisée de droite */}
              {rightIcon && !loading && (
                <span className="text-gray-400 dark:text-gray-500">
                  {rightIcon}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Message d'erreur */}
        {error && (
          <p
            id={`${inputId}-error`}
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
            id={`${inputId}-helper`}
            className="text-sm text-gray-500 dark:text-gray-400"
          >
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

// Export des types et composants
export { Input, inputContainerVariants, inputVariants, type InputProps };
export default Input;

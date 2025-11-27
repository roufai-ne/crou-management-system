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
 * - gradient: Bordure gradient CROU
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
 * - icon: Alias pour leftIcon (compatibilité)
 * - iconPosition: Position de l'icône (compatibilité)
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
import { Eye, EyeOff, AlertCircle, CheckCircle, Info, Loader2 } from 'lucide-react';
import { cn } from '@/utils/cn';

// Types pour les variantes
type InputVariant = 'default' | 'filled' | 'flushed' | 'gradient';
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
    flushed: 'border-b bg-transparent',
    gradient: 'rounded-md border-2 border-transparent bg-gradient-to-r from-primary-50 to-accent-50 dark:from-primary-900/20 dark:to-accent-900/20'
  };

  // Classes de tailles
  const sizeClasses = {
    sm: 'h-9',
    md: 'h-11',
    lg: 'h-13'
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
    variant === 'filled' && validationState === 'warning' && 'bg-warning-50 dark:bg-warning-900/20',
    variant === 'gradient' && 'focus-within:border-primary-500 focus-within:ring-primary-500/20'
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
    'disabled:cursor-not-allowed disabled:opacity-50',
    'w-full'
  ];

  // Classes de tailles
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-5 py-2.5 text-lg'
  };

  // Classes conditionnelles pour les icônes
  const iconClasses = [];
  if (hasLeftIcon) {
    const leftIconClasses = {
      sm: 'pl-9',
      md: 'pl-11',
      lg: 'pl-12'
    };
    iconClasses.push(leftIconClasses[size]);
  }
  if (hasRightIcon) {
    const rightIconClasses = {
      sm: 'pr-9',
      md: 'pr-11',
      lg: 'pr-12'
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

  /** Compatibilité ModernInput: Icône principale */
  icon?: React.ElementType;

  /** Compatibilité ModernInput: Position de l'icône */
  iconPosition?: 'left' | 'right';

  /** Compatibilité ModernInput: Succès */
  success?: boolean;
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
      leftIcon: propLeftIcon,
      rightIcon: propRightIcon,
      loading,
      required,
      type = 'text',
      id,
      icon: Icon,
      iconPosition = 'left',
      success,
      ...props
    },
    ref
  ) => {
    const [showPassword, setShowPassword] = useState(false);

    // Génération d'un ID unique si non fourni
    const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;

    // Détermination de l'état de validation
    const currentValidationState = error ? 'error' : success ? 'success' : validationState || 'default';

    // Gestion du type password avec toggle
    const inputType = type === 'password' && showPassword ? 'text' : type;

    // Gestion des icônes de compatibilité
    let leftIcon = propLeftIcon;
    let rightIcon = propRightIcon;

    if (Icon) {
      const IconElement = <Icon className="h-5 w-5" />;
      if (iconPosition === 'left') {
        leftIcon = leftIcon || IconElement;
      } else {
        rightIcon = rightIcon || IconElement;
      }
    }

    // Détermination des icônes à afficher
    const hasLeftIcon = Boolean(leftIcon);
    const hasRightIcon = Boolean(rightIcon || loading || type === 'password' || currentValidationState !== 'default');

    // Icône de validation automatique
    const getValidationIcon = () => {
      if (loading) {
        return <Loader2 className="h-4 w-4 animate-spin text-gray-400" />;
      }

      switch (currentValidationState) {
        case 'success':
          return <CheckCircle className="h-5 w-5 text-success-500" />;
        case 'error':
          return <AlertCircle className="h-5 w-5 text-danger-500" />;
        case 'warning':
          return <AlertCircle className="h-5 w-5 text-warning-500" />;
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
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors focus:outline-none"
                  aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
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
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            {error}
          </p>
        )}

        {/* Texte d'aide */}
        {helperText && !error && (
          <p
            id={`${inputId}-helper`}
            className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1"
          >
            <Info className="h-4 w-4 flex-shrink-0" />
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

// Export des types et composants
export { Input, inputContainerVariants, inputVariants };
export default Input;

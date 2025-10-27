/**
 * FICHIER: apps\web\src\components\ui\Radio.tsx
 * COMPOSANT: Radio - Composant de bouton radio du système de design CROU
 * 
 * DESCRIPTION:
 * Composant de bouton radio avec gestion de groupes et accessibilité complète
 * Support des orientations, validation et intégration formulaires
 * Optimisé pour l'usage dans l'application CROU multi-tenant
 * 
 * FONCTIONNALITÉS:
 * - Gestion de groupes avec sélection exclusive
 * - Orientations: horizontal, vertical, grid
 * - Validation: success, error, warning avec messages
 * - Tailles: sm, md, lg avec adaptation automatique
 * - Accessibilité: ARIA complet, navigation clavier
 * - Intégration: React Hook Form, Formik compatible
 * - Animations: Transitions fluides et micro-interactions
 * 
 * VARIANTES:
 * - 'default': Style standard avec bordure circulaire
 * - filled: Fond coloré avec contraste élevé
 * - outline: Bordure uniquement avec fond transparent
 * 
 * TAILLES:
 * - sm: Petit (16px) pour interfaces compactes
 * - md: Moyen (20px) - défaut
 * - lg: Grand (24px) pour interfaces tactiles
 * 
 * ORIENTATIONS:
 * - vertical: Disposition verticale (défaut)
 * - horizontal: Disposition horizontale
 * - grid: Disposition en grille (2 colonnes)
 * 
 * PROPS:
 * - options: Liste des options radio
 * - value: Valeur sélectionnée
 * - onChange: Callback de changement de valeur
 * - name: Nom du groupe radio
 * - orientation: Disposition des options
 * - label: Libellé du groupe
 * - error: Message d'erreur
 * - disabled: État désactivé
 * - required: Champ obligatoire
 * 
 * USAGE:
 * <RadioGroup
 *   options={[
 *     { value: 'option1', label: 'Option 1' },
 *     { value: 'option2', label: 'Option 2' }
 *   ]}
 *   value={selectedValue}
 *   onChange={setSelectedValue}
 *   label="Choisir une option"
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

// Types pour les options radio
export interface RadioOption {
  value: string | number;
  label: string;
  description?: string;
  disabled?: boolean;
  icon?: React.ReactNode;
}

// Types pour les variantes
type RadioVariant = 'default' | 'filled' | 'outline';
type RadioSize = 'sm' | 'md' | 'lg';
type RadioOrientation = 'vertical' | 'horizontal' | 'grid';
type ValidationState = 'default' | 'success' | 'error' | 'warning';

// Fonction pour générer les classes CSS du groupe radio
const radioGroupVariants = (props: {
  orientation?: RadioOrientation;
}) => {
  const { orientation = 'vertical' } = props;

  const orientationClasses = {
    vertical: 'space-y-3',
    horizontal: 'flex flex-wrap gap-6',
    grid: 'grid grid-cols-2 gap-3'
  };

  return cn('space-y-1', orientationClasses[orientation]);
};

// Fonction pour générer les classes CSS du conteneur radio individuel
const radioContainerVariants = (props: {
  disabled?: boolean;
}) => {
  const { disabled = false } = props;

  return cn(
    'relative flex items-start gap-3',
    disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
  );
};

// Fonction pour générer les classes CSS du bouton radio
const radioVariants = (props: {
  variant?: RadioVariant;
  size?: RadioSize;
  validationState?: ValidationState;
}) => {
  const { variant = 'default', size = 'md', validationState = 'default' } = props;

  // Classes de base
  const baseClasses = [
    'relative flex items-center justify-center rounded-full border-2 transition-all duration-200',
    'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500',
    'disabled:cursor-not-allowed disabled:opacity-50'
  ];

  // Classes de variantes
  const variantClasses = {
    'default': [
      'border-gray-300 bg-white dark:border-gray-600 dark:bg-gray-700',
      'checked:border-primary-600 checked:bg-white dark:checked:bg-gray-700',
      'hover:border-primary-500 dark:hover:border-primary-400'
    ],
    filled: [
      'border-gray-300 bg-gray-50 dark:border-gray-600 dark:bg-gray-800',
      'checked:border-primary-600 checked:bg-gray-50 dark:checked:bg-gray-800',
      'hover:bg-gray-100 dark:hover:bg-gray-700'
    ],
    outline: [
      'border-gray-300 bg-transparent dark:border-gray-600',
      'checked:border-primary-600 checked:bg-transparent',
      'hover:border-primary-500 dark:hover:border-primary-400'
    ]
  };

  // Classes de tailles
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-6 w-6'
  };

  // Classes de validation
  const validationClasses = {
    'default': '',
    success: 'border-success-500 checked:border-success-600',
    error: 'border-danger-500 checked:border-danger-600',
    warning: 'border-warning-500 checked:border-warning-600'
  };

  return cn(
    baseClasses,
    variantClasses[variant],
    sizeClasses[size],
    validationClasses[validationState]
  );
};

// Interface des props pour Radio individuel
export interface RadioProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'>,
    VariantProps<typeof radioVariants> {
  /** Option radio */
  option: RadioOption;
  
  /** Valeur sélectionnée */
  selectedValue?: string | number;
  
  /** Callback de changement */
  onChange?: (value: string | number, event: React.ChangeEvent<HTMLInputElement>) => void;
  
  /** Nom du groupe radio */
  name: string;
  
  /** Classe CSS pour le conteneur */
  containerClassName?: string;
  
  /** Classe CSS pour le label */
  labelClassName?: string;
}

// Composant Radio individuel
const Radio = forwardRef<HTMLInputElement, RadioProps>(
  (
    {
      className,
      containerClassName,
      labelClassName,
      variant,
      size,
      validationState,
      option,
      selectedValue,
      onChange,
      name,
      disabled,
      ...props
    },
    ref
  ) => {
    const isChecked = selectedValue === option.value;
    const isDisabled = disabled || option.disabled;
    
    // Génération d'un ID unique
    const radioId = `radio-${name}-${option.value}`;
    
    // Fonction de gestion du changement
    const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
      if (onChange && !isDisabled) {
        onChange(option.value, event);
      }
    };
    
    // Fonction de gestion du clic sur le conteneur
    const handleContainerClick = () => {
      if (!isDisabled) {
        const syntheticEvent = {
          target: { checked: true, value: option.value.toString() },
          currentTarget: { checked: true, value: option.value.toString() }
        } as React.ChangeEvent<HTMLInputElement>;
        
        if (onChange) {
          onChange(option.value, syntheticEvent);
        }
      }
    };
    
    // Rendu du point central
    const renderDot = () => {
      if (!isChecked) return null;
      
      const dotSize = size === 'sm' ? 'h-1.5 w-1.5' : size === 'lg' ? 'h-2.5 w-2.5' : 'h-2 w-2';
      const dotColor = validationState === 'success' ? 'bg-success-600' :
                      validationState === 'error' ? 'bg-danger-600' :
                      validationState === 'warning' ? 'bg-warning-600' :
                      'bg-primary-600';
      
      return (
        <div className={cn('rounded-full transition-all duration-200', dotSize, dotColor)} />
      );
    };

    return (
      <div
        className={cn(
          radioContainerVariants({ disabled: isDisabled }),
          'group',
          containerClassName
        )}
        onClick={handleContainerClick}
      >
        {/* Input caché pour la compatibilité formulaires */}
        <input
          ref={ref}
          type="radio"
          id={radioId}
          name={name}
          value={option.value}
          checked={isChecked}
          onChange={handleChange}
          disabled={isDisabled}
          className="sr-only"
          {...props}
        />
        
        {/* Bouton radio visuel */}
        <div
          className={cn(
            radioVariants({
              variant,
              size,
              validationState
            }),
            className
          )}
          data-checked={isChecked}
        >
          {renderDot()}
        </div>
        
        {/* Contenu textuel */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            {option.icon && (
              <span className="flex-shrink-0 text-gray-500 dark:text-gray-400">
                {option.icon}
              </span>
            )}
            
            <label
              htmlFor={radioId}
              className={cn(
                'block text-sm font-medium text-gray-900 dark:text-gray-100',
                isDisabled && 'text-gray-500 dark:text-gray-400',
                'cursor-pointer group-hover:text-gray-700 dark:group-hover:text-gray-200',
                labelClassName
              )}
            >
              {option.label}
            </label>
          </div>
          
          {option.description && (
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {option.description}
            </p>
          )}
        </div>
      </div>
    );
  }
);

Radio.displayName = 'Radio';

// Interface des props pour RadioGroup
export interface RadioGroupProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onChange'>,
    VariantProps<typeof radioVariants> {
  /** Liste des options radio */
  options: RadioOption[];
  
  /** Valeur sélectionnée */
  value?: string | number;
  
  /** Callback de changement de valeur */
  onChange?: (value: string | number) => void;
  
  /** Nom du groupe radio */
  name?: string;
  
  /** Orientation du groupe */
  orientation?: 'vertical' | 'horizontal' | 'grid';
  
  /** Libellé du groupe */
  label?: string;
  
  /** Description du groupe */
  description?: string;
  
  /** Message d'erreur */
  error?: string;
  
  /** Texte d'aide */
  helperText?: string;
  
  /** État désactivé */
  disabled?: boolean;
  
  /** Champ obligatoire */
  required?: boolean;
  
  /** Classe CSS pour le conteneur */
  containerClassName?: string;
  
  /** Classe CSS pour le label */
  labelClassName?: string;
  
  /** ID unique pour l'accessibilité */
  id?: string;
}

// Composant RadioGroup principal
const RadioGroup = forwardRef<HTMLDivElement, RadioGroupProps>(
  (
    {
      className,
      containerClassName,
      labelClassName,
      variant,
      size,
      validationState,
      options,
      value,
      onChange,
      name,
      orientation = 'vertical',
      label,
      description,
      error,
      helperText,
      disabled,
      required,
      id,
      ...props
    },
    ref
  ) => {
    // Génération d'un nom et ID uniques si non fournis
    const groupName = name || `radio-group-${Math.random().toString(36).substr(2, 9)}`;
    const groupId = id || `radio-group-${Math.random().toString(36).substr(2, 9)}`;
    
    // Détermination de l'état de validation
    const currentValidationState = error ? 'error' : validationState || 'default';
    
    // Fonction de gestion du changement
    const handleChange = (newValue: string | number) => {
      if (onChange && !disabled) {
        onChange(newValue);
      }
    };

    return (
      <div
        ref={ref}
        className={cn('space-y-3', containerClassName)}
        {...props}
      >
        {/* Label du groupe */}
        {label && (
          <div>
            <label
              className={cn(
                'block text-sm font-medium text-gray-900 dark:text-gray-100',
                required && "after:content-['*'] after:ml-0.5 after:text-danger-500",
                disabled && 'text-gray-500 dark:text-gray-400',
                labelClassName
              )}
            >
              {label}
            </label>
            
            {description && (
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                {description}
              </p>
            )}
          </div>
        )}

        {/* Groupe de boutons radio */}
        <div
          className={cn(
            radioGroupVariants({ orientation }),
            className
          )}
          role="radiogroup"
          aria-labelledby={label ? `${groupId}-label` : undefined}
          aria-describedby={
            error ? `${groupId}-error` : 
            helperText ? `${groupId}-helper` : 
            undefined
          }
          aria-required={required}
          aria-disabled={disabled}
        >
          {options.map((option) => (
            <Radio
              key={option.value}
              option={option}
              selectedValue={value}
              onChange={handleChange}
              name={groupName}
              variant={variant}
              size={size}
              validationState={currentValidationState}
              disabled={disabled}
            />
          ))}
        </div>

        {/* Message d'erreur */}
        {error && (
          <p
            id={`${groupId}-error`}
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
            id={`${groupId}-helper`}
            className="text-sm text-gray-500 dark:text-gray-400"
          >
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

RadioGroup.displayName = 'RadioGroup';

// Export des types et composants
export { 
  Radio, 
  RadioGroup, 
  radioGroupVariants, 
  radioContainerVariants, 
  radioVariants, 
  type RadioProps, 
  type RadioGroupProps,
  type RadioOption 
};
export default RadioGroup;

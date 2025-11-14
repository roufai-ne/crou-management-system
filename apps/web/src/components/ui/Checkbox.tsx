/**
 * FICHIER: apps\web\src\components\ui\Checkbox.tsx
 * COMPOSANT: Checkbox - Case à cocher
 * 
 * DESCRIPTION:
 * Composant de case à cocher réutilisable
 * États, validation, groupes
 * Design accessible et responsive
 * 
 * FONCTIONNALITÉS:
 * - Case à cocher avec validation
 * - États indéterminés
 * - Groupes de cases
 * - Design accessible
 * - Animations fluides
 * 
 * AUTEUR: Équipe CROU
 * DATE: Décembre 2024
 */

import React, { forwardRef } from 'react';
import { Check, Minus } from 'lucide-react';

// Interface pour les props du composant
export interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type' | 'size'> {
  label?: string;
  error?: boolean;
  errorMessage?: string;
  success?: boolean;
  successMessage?: string;
  helperText?: string;
  required?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  labelClassName?: string;
  inputClassName?: string;
  indeterminate?: boolean;
}

// Configuration des tailles
const sizeClasses = {
  sm: 'w-4 h-4',
  md: 'w-5 h-5',
  lg: 'w-6 h-6'
};

// Configuration des tailles pour le label
const labelSizeClasses = {
  sm: 'text-sm',
  md: 'text-sm',
  lg: 'text-base'
};

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({
    label,
    error = false,
    errorMessage,
    success = false,
    successMessage,
    helperText,
    required = false,
    size = 'md',
    className = '',
    labelClassName = '',
    inputClassName = '',
    indeterminate = false,
    checked,
    onChange,
    ...props
  }, ref) => {
    // Classes pour le conteneur
    const containerClasses = [
      'relative flex items-start',
      className
    ].join(' ');

    // Classes pour le label
    const labelClasses = [
      'ml-2 text-gray-700 cursor-pointer',
      labelSizeClasses[size],
      error ? 'text-red-700' : success ? 'text-green-700' : 'text-gray-700',
      props.disabled ? 'opacity-50 cursor-not-allowed' : '',
      labelClassName
    ].join(' ');

    // Classes pour la checkbox
    const checkboxClasses = [
      'relative inline-flex items-center justify-center',
      'border-2 rounded transition-all duration-200',
      'focus:outline-none focus:ring-2 focus:ring-offset-0',
      sizeClasses[size],
      error
        ? 'border-red-300 focus:ring-red-500'
        : success
        ? 'border-green-300 focus:ring-green-500'
        : 'border-gray-300 focus:ring-blue-500',
      checked || indeterminate
        ? error
          ? 'bg-red-600 border-red-600'
          : success
          ? 'bg-green-600 border-green-600'
          : 'bg-blue-600 border-blue-600'
        : 'bg-white hover:border-gray-400',
      props.disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer',
      inputClassName
    ].join(' ');

    // Classes pour l'icône
    const iconClasses = [
      'text-white',
      size === 'sm' ? 'w-3 h-3' : size === 'md' ? 'w-4 h-4' : 'w-5 h-5'
    ].join(' ');

    return (
      <div className={containerClasses}>
        {/* Checkbox */}
        <div className="relative">
          <input
            ref={ref}
            type="checkbox"
            checked={checked}
            onChange={onChange}
            className="sr-only"
            {...props}
          />
          <div className={checkboxClasses}>
            {(checked || indeterminate) && (
              <div className="flex items-center justify-center">
                {indeterminate ? (
                  <Minus className={iconClasses} />
                ) : (
                  <Check className={iconClasses} />
                )}
              </div>
            )}
          </div>
        </div>

        {/* Label et messages */}
        <div className="flex-1">
          {label && (
            <label className={labelClasses}>
              {label}
              {required && <span className="text-red-500 ml-1">*</span>}
            </label>
          )}

          {/* Message d'aide */}
          {helperText && !error && !success && (
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{helperText}</p>
          )}

          {/* Message d'erreur */}
          {error && errorMessage && (
            <p className="mt-1 text-sm text-red-600">{errorMessage}</p>
          )}

          {/* Message de succès */}
          {success && successMessage && (
            <p className="mt-1 text-sm text-green-600">{successMessage}</p>
          )}
        </div>
      </div>
    );
  }
);

Checkbox.displayName = 'Checkbox';

// Composant pour les groupes de checkboxes
export interface CheckboxGroupProps {
  label?: string;
  error?: boolean;
  errorMessage?: string;
  required?: boolean;
  className?: string;
  children: React.ReactNode;
  orientation?: 'horizontal' | 'vertical';
}

export function CheckboxGroup({
  label,
  error = false,
  errorMessage,
  required = false,
  className = '',
  children,
  orientation = 'vertical'
}: CheckboxGroupProps) {
  const containerClasses = [
    'space-y-2',
    orientation === 'horizontal' ? 'flex flex-wrap gap-4' : 'space-y-2',
    className
  ].join(' ');

  return (
    <div className="space-y-2">
      {label && (
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      
      <div className={containerClasses}>
        {children}
      </div>

      {error && errorMessage && (
        <p className="text-sm text-red-600">{errorMessage}</p>
      )}
    </div>
  );
}

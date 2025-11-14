/**
 * FICHIER: apps\web\src\components\ui\Textarea.tsx
 * COMPOSANT: Textarea - Zone de texte
 * 
 * DESCRIPTION:
 * Composant de zone de texte réutilisable
 * Validation, compteur de caractères, redimensionnement
 * Design accessible et responsive
 * 
 * FONCTIONNALITÉS:
 * - Zone de texte avec validation
 * - Compteur de caractères
 * - Redimensionnement automatique
 * - États d'erreur et de succès
 * - Design accessible
 * 
 * AUTEUR: Équipe CROU
 * DATE: Décembre 2024
 */

import React, { forwardRef, useState, useEffect } from 'react';

// Interface pour les props du composant
export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: boolean;
  errorMessage?: string;
  success?: boolean;
  successMessage?: string;
  helperText?: string;
  required?: boolean;
  showCharCount?: boolean;
  maxLength?: number;
  minLength?: number;
  resize?: 'none' | 'vertical' | 'horizontal' | 'both';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  labelClassName?: string;
  inputClassName?: string;
}

// Configuration des tailles
const sizeClasses = {
  sm: 'px-3 py-2 text-sm',
  md: 'px-3 py-2.5 text-sm',
  lg: 'px-4 py-3 text-base'
};

// Configuration du redimensionnement
const resizeClasses = {
  none: 'resize-none',
  vertical: 'resize-y',
  horizontal: 'resize-x',
  both: 'resize'
};

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({
    label,
    error = false,
    errorMessage,
    success = false,
    successMessage,
    helperText,
    required = false,
    showCharCount = false,
    maxLength,
    minLength,
    resize = 'vertical',
    size = 'md',
    className = '',
    labelClassName = '',
    inputClassName = '',
    value,
    onChange,
    ...props
  }, ref) => {
    const [charCount, setCharCount] = useState(0);
    const [isFocused, setIsFocused] = useState(false);

    // Calculer le nombre de caractères
    useEffect(() => {
      const currentValue = value?.toString() || '';
      setCharCount(currentValue.length);
    }, [value]);

    // Gérer le changement de valeur
    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const newValue = e.target.value;
      
      // Vérifier la limite de caractères
      if (maxLength && newValue.length > maxLength) {
        return;
      }
      
      setCharCount(newValue.length);
      onChange?.(e);
    };

    // Classes pour le conteneur
    const containerClasses = [
      'relative',
      className
    ].join(' ');

    // Classes pour le label
    const labelClasses = [
      'block text-sm font-medium mb-1',
      error ? 'text-red-700' : success ? 'text-green-700' : 'text-gray-700',
      labelClassName
    ].join(' ');

    // Classes pour la textarea
    const textareaClasses = [
      'w-full border rounded-md shadow-sm transition-colors duration-200',
      'focus:outline-none focus:ring-2 focus:ring-offset-0',
      sizeClasses[size],
      resizeClasses[resize],
      error 
        ? 'border-red-300 focus:ring-red-500 focus:border-red-500' 
        : success 
        ? 'border-green-300 focus:ring-green-500 focus:border-green-500'
        : isFocused
        ? 'border-blue-300 focus:ring-blue-500 focus:border-blue-500'
        : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500',
      props.disabled ? 'bg-gray-100 cursor-not-allowed' : 'bg-white',
      inputClassName
    ].join(' ');

    // Classes pour le compteur de caractères
    const charCountClasses = [
      'text-xs mt-1',
      charCount > (maxLength || 0) * 0.9 ? 'text-orange-600' : 'text-gray-500'
    ].join(' ');

    return (
      <div className={containerClasses}>
        {/* Label */}
        {label && (
          <label className={labelClasses}>
            {label}
            {required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}

        {/* Textarea */}
        <textarea
          ref={ref}
          value={value}
          onChange={handleChange}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          maxLength={maxLength}
          minLength={minLength}
          className={textareaClasses}
          {...props}
        />

        {/* Compteur de caractères */}
        {showCharCount && maxLength && (
          <div className={charCountClasses}>
            {charCount} / {maxLength} caractères
          </div>
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
    );
  }
);

Textarea.displayName = 'Textarea';

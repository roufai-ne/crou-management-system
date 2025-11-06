/**
 * FICHIER: apps/web/src/components/ui/NativeSelect.tsx
 * COMPOSANT: NativeSelect - Select natif HTML stylisé
 *
 * DESCRIPTION:
 * Composant select natif HTML avec styling CROU
 * Utilise des éléments <option> comme children
 *
 * USAGE:
 * <NativeSelect label="Type" value={value} onChange={handleChange}>
 *   <option value="1">Option 1</option>
 *   <option value="2">Option 2</option>
 * </NativeSelect>
 *
 * AUTEUR: Équipe CROU
 * DATE: Décembre 2024
 */

import React, { forwardRef } from 'react';
import { cn } from '@/utils/cn';
import { ChevronDown } from 'lucide-react';

export interface NativeSelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  helperText?: string;
  containerClassName?: string;
  labelClassName?: string;
}

export const NativeSelect = forwardRef<HTMLSelectElement, NativeSelectProps>(
  (
    {
      className,
      containerClassName,
      labelClassName,
      label,
      error,
      helperText,
      required,
      disabled,
      id,
      children,
      ...props
    },
    ref
  ) => {
    const inputId = id || `select-${Math.random().toString(36).substr(2, 9)}`;

    return (
      <div className={cn('space-y-1', containerClassName)}>
        {/* Label */}
        {label && (
          <label
            htmlFor={inputId}
            className={cn(
              'block text-sm font-medium text-gray-700 dark:text-gray-300',
              required && "after:content-['*'] after:ml-0.5 after:text-red-500",
              disabled && 'opacity-50',
              labelClassName
            )}
          >
            {label}
          </label>
        )}

        {/* Select container */}
        <div className="relative">
          <select
            ref={ref}
            id={inputId}
            disabled={disabled}
            required={required}
            className={cn(
              'w-full appearance-none rounded-md border bg-white dark:bg-gray-700 px-3 py-2 text-sm',
              'text-gray-900 dark:text-gray-100',
              'placeholder:text-gray-400 dark:placeholder:text-gray-500',
              'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500',
              'disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-gray-100 dark:disabled:bg-gray-800',
              error
                ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
                : 'border-gray-300 dark:border-gray-600',
              'pr-10', // Space for chevron icon
              className
            )}
            aria-invalid={error ? 'true' : 'false'}
            aria-describedby={
              error ? `${inputId}-error` : helperText ? `${inputId}-helper` : undefined
            }
            {...props}
          >
            {children}
          </select>

          {/* Chevron icon */}
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
            <ChevronDown className="h-4 w-4 text-gray-400" aria-hidden="true" />
          </div>
        </div>

        {/* Error message */}
        {error && (
          <p id={`${inputId}-error`} className="text-sm text-red-600 dark:text-red-400" role="alert">
            {error}
          </p>
        )}

        {/* Helper text */}
        {helperText && !error && (
          <p id={`${inputId}-helper`} className="text-sm text-gray-500 dark:text-gray-400">
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

NativeSelect.displayName = 'NativeSelect';

export default NativeSelect;

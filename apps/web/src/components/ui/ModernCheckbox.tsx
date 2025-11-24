import React, { forwardRef } from 'react';
import { Check, Minus } from 'lucide-react';
import { cn } from '@/utils/cn';

export interface ModernCheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size' | 'type'> {
  label?: string;
  helperText?: string;
  error?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'gradient-crou';
  indeterminate?: boolean;
}

export const ModernCheckbox = forwardRef<HTMLInputElement, ModernCheckboxProps>(
  (
    {
      label,
      helperText,
      error,
      size = 'md',
      variant = 'default',
      indeterminate = false,
      className,
      disabled,
      checked,
      ...props
    },
    ref
  ) => {
    const sizeClasses = {
      sm: 'h-4 w-4',
      md: 'h-5 w-5',
      lg: 'h-6 w-6',
    };

    const iconSizeClasses = {
      sm: 'h-3 w-3',
      md: 'h-4 w-4',
      lg: 'h-5 w-5',
    };

    const checkboxClasses = cn(
      'rounded border-2 transition-all duration-200 cursor-pointer flex items-center justify-center',
      sizeClasses[size],
      {
        'border-gray-300 bg-white': !checked && !indeterminate && variant === 'default',
        'border-primary-500 bg-gradient-primary text-white': (checked || indeterminate) && variant === 'default',
        'border-transparent bg-gradient-to-r from-primary-100 to-accent-100': !checked && !indeterminate && variant === 'gradient-crou',
        'border-transparent bg-gradient-crou text-white': (checked || indeterminate) && variant === 'gradient-crou',
        'border-danger-500': error,
        'opacity-50 cursor-not-allowed': disabled,
        'hover:border-primary-400': !disabled && !checked && !indeterminate,
      }
    );

    return (
      <div className={cn('flex items-start gap-3', className)}>
        <div className="relative flex-shrink-0 mt-0.5">
          <input
            ref={ref}
            type="checkbox"
            checked={checked}
            disabled={disabled}
            className="sr-only"
            {...props}
          />
          <div
            className={checkboxClasses}
            onClick={() => !disabled && props.onChange?.({ target: { checked: !checked } } as any)}
          >
            {indeterminate ? (
              <Minus className={iconSizeClasses[size]} strokeWidth={3} />
            ) : checked ? (
              <Check className={iconSizeClasses[size]} strokeWidth={3} />
            ) : null}
          </div>
        </div>

        {(label || helperText || error) && (
          <div className="flex-1">
            {label && (
              <label className={cn('block font-medium text-gray-700 cursor-pointer', {
                'text-sm': size === 'sm',
                'text-base': size === 'md',
                'text-lg': size === 'lg',
              })}>
                {label}
              </label>
            )}
            {(helperText || error) && (
              <p className={cn('text-sm mt-0.5', error ? 'text-danger-600' : 'text-gray-600')}>
                {error || helperText}
              </p>
            )}
          </div>
        )}
      </div>
    );
  }
);

ModernCheckbox.displayName = 'ModernCheckbox';

export interface ModernRadioProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size' | 'type'> {
  label?: string;
  helperText?: string;
  error?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'gradient-crou';
}

export const ModernRadio = forwardRef<HTMLInputElement, ModernRadioProps>(
  (
    {
      label,
      helperText,
      error,
      size = 'md',
      variant = 'default',
      className,
      disabled,
      checked,
      ...props
    },
    ref
  ) => {
    const sizeClasses = {
      sm: 'h-4 w-4',
      md: 'h-5 w-5',
      lg: 'h-6 w-6',
    };

    const dotSizeClasses = {
      sm: 'h-2 w-2',
      md: 'h-2.5 w-2.5',
      lg: 'h-3 w-3',
    };

    const radioClasses = cn(
      'rounded-full border-2 transition-all duration-200 cursor-pointer flex items-center justify-center',
      sizeClasses[size],
      {
        'border-gray-300 bg-white': !checked && variant === 'default',
        'border-primary-500 bg-white': checked && variant === 'default',
        'border-transparent bg-gradient-to-r from-primary-100 to-accent-100': !checked && variant === 'gradient-crou',
        'border-transparent bg-gradient-crou': checked && variant === 'gradient-crou',
        'border-danger-500': error,
        'opacity-50 cursor-not-allowed': disabled,
        'hover:border-primary-400': !disabled && !checked,
      }
    );

    return (
      <div className={cn('flex items-start gap-3', className)}>
        <div className="relative flex-shrink-0 mt-0.5">
          <input
            ref={ref}
            type="radio"
            checked={checked}
            disabled={disabled}
            className="sr-only"
            {...props}
          />
          <div
            className={radioClasses}
            onClick={() => !disabled && props.onChange?.({ target: { checked: true } } as any)}
          >
            {checked && (
              <div
                className={cn(
                  'rounded-full transition-all duration-200',
                  dotSizeClasses[size],
                  variant === 'default' ? 'bg-primary-500' : 'bg-white'
                )}
              />
            )}
          </div>
        </div>

        {(label || helperText || error) && (
          <div className="flex-1">
            {label && (
              <label className={cn('block font-medium text-gray-700 cursor-pointer', {
                'text-sm': size === 'sm',
                'text-base': size === 'md',
                'text-lg': size === 'lg',
              })}>
                {label}
              </label>
            )}
            {(helperText || error) && (
              <p className={cn('text-sm mt-0.5', error ? 'text-danger-600' : 'text-gray-600')}>
                {error || helperText}
              </p>
            )}
          </div>
        )}
      </div>
    );
  }
);

ModernRadio.displayName = 'ModernRadio';

export interface CheckboxGroupProps {
  children: React.ReactNode;
  orientation?: 'horizontal' | 'vertical';
  spacing?: 'tight' | 'normal' | 'loose';
  className?: string;
}

export const CheckboxGroup: React.FC<CheckboxGroupProps> = ({
  children,
  orientation = 'vertical',
  spacing = 'normal',
  className,
}) => {
  const spacingClasses = {
    tight: 'gap-2',
    normal: 'gap-3',
    loose: 'gap-4',
  };

  return (
    <div
      className={cn(
        'flex',
        orientation === 'horizontal' ? 'flex-row flex-wrap' : 'flex-col',
        spacingClasses[spacing],
        className
      )}
    >
      {children}
    </div>
  );
};

export default ModernCheckbox;

import React, { useState, forwardRef } from 'react';
import { LucideIcon, Eye, EyeOff, X, AlertCircle, CheckCircle, Info } from 'lucide-react';
import { cn } from '@/utils/cn';

export interface ModernInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label?: string;
  error?: string;
  helperText?: string;
  success?: boolean;
  icon?: LucideIcon;
  iconPosition?: 'left' | 'right';
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'gradient-crou';
  clearable?: boolean;
  onClear?: () => void;
}

export const ModernInput = forwardRef<HTMLInputElement, ModernInputProps>(
  (
    {
      label,
      error,
      helperText,
      success,
      icon: Icon,
      iconPosition = 'left',
      size = 'md',
      variant = 'default',
      clearable = false,
      onClear,
      className,
      type = 'text',
      disabled,
      value,
      ...props
    },
    ref
  ) => {
    const [showPassword, setShowPassword] = useState(false);
    const [isFocused, setIsFocused] = useState(false);

    const isPassword = type === 'password';
    const actualType = isPassword && showPassword ? 'text' : type;
    const hasValue = value !== undefined && value !== '';

    const sizeClasses = {
      sm: 'h-9 text-sm px-3',
      md: 'h-11 text-base px-4',
      lg: 'h-13 text-lg px-5',
    };

    const iconSizeClasses = {
      sm: 'h-4 w-4',
      md: 'h-5 w-5',
      lg: 'h-6 w-6',
    };

    const getStatusIcon = () => {
      if (error) return <AlertCircle className={cn(iconSizeClasses[size], 'text-danger-500')} strokeWidth={2} />;
      if (success) return <CheckCircle className={cn(iconSizeClasses[size], 'text-success-500')} strokeWidth={2} />;
      return null;
    };

    const inputClasses = cn(
      'w-full rounded-lg border bg-white transition-all duration-200',
      'focus:outline-none focus:ring-2',
      sizeClasses[size],
      {
        // Variants
        'border-gray-300 focus:border-primary-500 focus:ring-primary-500/20': variant === 'default' && !error,
        'border-2 border-transparent bg-gradient-to-r from-primary-50 to-accent-50 focus:border-primary-500 focus:ring-primary-500/20':
          variant === 'gradient-crou' && !error,
        // States
        'border-danger-500 focus:border-danger-500 focus:ring-danger-500/20': error,
        'border-success-500 focus:border-success-500 focus:ring-success-500/20': success,
        'opacity-60 cursor-not-allowed bg-gray-50': disabled,
        // Icon padding
        'pl-11': Icon && iconPosition === 'left' && size === 'md',
        'pl-10': Icon && iconPosition === 'left' && size === 'sm',
        'pl-12': Icon && iconPosition === 'left' && size === 'lg',
        'pr-11': Icon && iconPosition === 'right' && size === 'md',
        'pr-10': Icon && iconPosition === 'right' && size === 'sm',
        'pr-12': Icon && iconPosition === 'right' && size === 'lg',
        'pr-20': isPassword || (clearable && hasValue) || success || error,
      },
      className
    );

    return (
      <div className="w-full">
        {label && (
          <label className={cn('block mb-2 font-medium text-gray-700', size === 'sm' && 'text-sm')}>
            {label}
            {props.required && <span className="text-danger-500 ml-1">*</span>}
          </label>
        )}

        <div className="relative">
          {/* Left Icon */}
          {Icon && iconPosition === 'left' && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
              <Icon className={iconSizeClasses[size]} strokeWidth={2} />
            </div>
          )}

          {/* Input */}
          <input
            ref={ref}
            type={actualType}
            value={value}
            disabled={disabled}
            className={inputClasses}
            onFocus={(e) => {
              setIsFocused(true);
              props.onFocus?.(e);
            }}
            onBlur={(e) => {
              setIsFocused(false);
              props.onBlur?.(e);
            }}
            {...props}
          />

          {/* Right Icons Container */}
          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
            {/* Status Icon */}
            {getStatusIcon()}

            {/* Clear Button */}
            {clearable && hasValue && !disabled && (
              <button
                type="button"
                onClick={() => onClear?.()}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className={iconSizeClasses[size]} strokeWidth={2} />
              </button>
            )}

            {/* Password Toggle */}
            {isPassword && (
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                {showPassword ? (
                  <EyeOff className={iconSizeClasses[size]} strokeWidth={2} />
                ) : (
                  <Eye className={iconSizeClasses[size]} strokeWidth={2} />
                )}
              </button>
            )}

            {/* Right Icon */}
            {Icon && iconPosition === 'right' && !error && !success && (
              <Icon className={cn(iconSizeClasses[size], 'text-gray-400')} strokeWidth={2} />
            )}
          </div>
        </div>

        {/* Helper Text / Error */}
        {(helperText || error) && (
          <div className={cn('mt-1.5 text-sm flex items-start gap-1.5', error ? 'text-danger-600' : 'text-gray-600')}>
            {error && <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" strokeWidth={2} />}
            {helperText && !error && <Info className="h-4 w-4 mt-0.5 flex-shrink-0" strokeWidth={2} />}
            <span>{error || helperText}</span>
          </div>
        )}
      </div>
    );
  }
);

ModernInput.displayName = 'ModernInput';

export default ModernInput;

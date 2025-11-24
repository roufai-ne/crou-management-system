import React, { forwardRef, useRef, useEffect, useState } from 'react';
import { AlertCircle, Info } from 'lucide-react';
import { cn } from '@/utils/cn';

export interface ModernTextareaProps extends Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, 'size'> {
  label?: string;
  error?: string;
  helperText?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'gradient-crou';
  autoResize?: boolean;
  maxLength?: number;
  showCounter?: boolean;
  minRows?: number;
  maxRows?: number;
}

export const ModernTextarea = forwardRef<HTMLTextAreaElement, ModernTextareaProps>(
  (
    {
      label,
      error,
      helperText,
      size = 'md',
      variant = 'default',
      autoResize = false,
      maxLength,
      showCounter = false,
      minRows = 3,
      maxRows,
      className,
      disabled,
      value,
      onChange,
      ...props
    },
    ref
  ) => {
    const textareaRef = useRef<HTMLTextAreaElement | null>(null);
    const [charCount, setCharCount] = useState(0);

    useEffect(() => {
      if (value && typeof value === 'string') {
        setCharCount(value.length);
      }
    }, [value]);

    useEffect(() => {
      if (autoResize && textareaRef.current) {
        const textarea = textareaRef.current;
        textarea.style.height = 'auto';
        
        const lineHeight = parseInt(getComputedStyle(textarea).lineHeight);
        const minHeight = minRows * lineHeight;
        const maxHeight = maxRows ? maxRows * lineHeight : Infinity;
        
        const newHeight = Math.min(Math.max(textarea.scrollHeight, minHeight), maxHeight);
        textarea.style.height = `${newHeight}px`;
      }
    }, [value, autoResize, minRows, maxRows]);

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      if (maxLength && e.target.value.length > maxLength) {
        return;
      }
      setCharCount(e.target.value.length);
      onChange?.(e);
    };

    const sizeClasses = {
      sm: 'text-sm px-3 py-2',
      md: 'text-base px-4 py-3',
      lg: 'text-lg px-5 py-4',
    };

    const textareaClasses = cn(
      'w-full rounded-lg border bg-white transition-all duration-200 resize-none',
      'focus:outline-none focus:ring-2',
      sizeClasses[size],
      {
        'border-gray-300 focus:border-primary-500 focus:ring-primary-500/20': variant === 'default' && !error,
        'border-2 border-transparent bg-gradient-to-r from-primary-50 to-accent-50 focus:border-primary-500 focus:ring-primary-500/20':
          variant === 'gradient-crou' && !error,
        'border-danger-500 focus:border-danger-500 focus:ring-danger-500/20': error,
        'opacity-60 cursor-not-allowed bg-gray-50': disabled,
        'resize-y': !autoResize,
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
          <textarea
            ref={(node) => {
              textareaRef.current = node;
              if (typeof ref === 'function') {
                ref(node);
              } else if (ref) {
                ref.current = node;
              }
            }}
            value={value}
            onChange={handleChange}
            disabled={disabled}
            rows={minRows}
            maxLength={maxLength}
            className={textareaClasses}
            {...props}
          />

          {(showCounter || maxLength) && (
            <div className="absolute bottom-3 right-3 text-xs text-gray-500 bg-white/80 backdrop-blur-sm px-2 py-1 rounded">
              {charCount}
              {maxLength && ` / ${maxLength}`}
            </div>
          )}
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

ModernTextarea.displayName = 'ModernTextarea';

export default ModernTextarea;

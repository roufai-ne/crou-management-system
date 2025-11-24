import React, { useState, useRef, useEffect } from 'react';
import { LucideIcon, ChevronDown, Check, X, Search } from 'lucide-react';
import { cn } from '@/utils/cn';

export interface SelectOption {
  value: string;
  label: string;
  icon?: LucideIcon;
  disabled?: boolean;
  group?: string;
}

export interface ModernSelectProps {
  label?: string;
  error?: string;
  helperText?: string;
  options: SelectOption[];
  value?: string | string[];
  onChange?: (value: string | string[]) => void;
  placeholder?: string;
  searchable?: boolean;
  multiple?: boolean;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'gradient-crou';
  disabled?: boolean;
  required?: boolean;
  className?: string;
}

export const ModernSelect: React.FC<ModernSelectProps> = ({
  label,
  error,
  helperText,
  options,
  value,
  onChange,
  placeholder = 'Sélectionner...',
  searchable = false,
  multiple = false,
  size = 'md',
  variant = 'default',
  disabled = false,
  required = false,
  className,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const selectedValues = multiple
    ? Array.isArray(value)
      ? value
      : []
    : value
    ? [value as string]
    : [];

  const filteredOptions = searchable && searchQuery
    ? options.filter((opt) =>
        opt.label.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : options;

  const groupedOptions = filteredOptions.reduce((acc, option) => {
    const group = option.group || '_default';
    if (!acc[group]) acc[group] = [];
    acc[group].push(option);
    return acc;
  }, {} as Record<string, SelectOption[]>);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (isOpen && searchable && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen, searchable]);

  const handleSelect = (optionValue: string) => {
    if (multiple) {
      const newValues = selectedValues.includes(optionValue)
        ? selectedValues.filter((v) => v !== optionValue)
        : [...selectedValues, optionValue];
      onChange?.(newValues as string[]);
    } else {
      onChange?.(optionValue);
      setIsOpen(false);
    }
    setSearchQuery('');
  };

  const handleRemove = (optionValue: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (multiple) {
      onChange?.(selectedValues.filter((v) => v !== optionValue) as string[]);
    }
  };

  const getSelectedLabels = () => {
    return selectedValues
      .map((v) => options.find((opt) => opt.value === v)?.label)
      .filter(Boolean);
  };

  const sizeClasses = {
    sm: 'h-9 text-sm px-3',
    md: 'h-11 text-base px-4',
    lg: 'h-13 text-lg px-5',
  };

  const triggerClasses = cn(
    'w-full rounded-lg border bg-white transition-all duration-200 cursor-pointer',
    'flex items-center justify-between gap-2',
    sizeClasses[size],
    {
      'border-gray-300 hover:border-gray-400': variant === 'default' && !error,
      'border-2 border-transparent bg-gradient-to-r from-primary-50 to-accent-50':
        variant === 'gradient-crou' && !error,
      'border-danger-500': error,
      'opacity-60 cursor-not-allowed': disabled,
      'ring-2 ring-primary-500/20': isOpen && !error,
    },
    className
  );

  return (
    <div className="w-full" ref={containerRef}>
      {label && (
        <label className={cn('block mb-2 font-medium text-gray-700', size === 'sm' && 'text-sm')}>
          {label}
          {required && <span className="text-danger-500 ml-1">*</span>}
        </label>
      )}

      <div className="relative">
        <div
          className={triggerClasses}
          onClick={() => !disabled && setIsOpen(!isOpen)}
        >
          <div className="flex-1 flex flex-wrap gap-1 min-w-0">
            {selectedValues.length > 0 ? (
              multiple ? (
                selectedValues.map((v) => {
                  const opt = options.find((o) => o.value === v);
                  return (
                    <span
                      key={v}
                      className="inline-flex items-center gap-1 px-2 py-0.5 bg-gradient-crou text-white text-sm rounded-full"
                    >
                      {opt?.icon && <opt.icon className="h-3 w-3" strokeWidth={2.5} />}
                      {opt?.label}
                      <button
                        type="button"
                        onClick={(e) => handleRemove(v, e)}
                        className="hover:bg-white/20 rounded-full p-0.5"
                      >
                        <X className="h-3 w-3" strokeWidth={2.5} />
                      </button>
                    </span>
                  );
                })
              ) : (
                <span className="flex items-center gap-2 text-gray-900">
                  {options.find((o) => o.value === selectedValues[0])?.icon &&
                    React.createElement(
                      options.find((o) => o.value === selectedValues[0])!.icon!,
                      { className: 'h-5 w-5', strokeWidth: 2 }
                    )}
                  {getSelectedLabels()[0]}
                </span>
              )
            ) : (
              <span className="text-gray-400">{placeholder}</span>
            )}
          </div>

          <ChevronDown
            className={cn('h-5 w-5 text-gray-400 transition-transform', isOpen && 'rotate-180')}
            strokeWidth={2}
          />
        </div>

        {isOpen && (
          <div className="absolute z-50 mt-2 w-full bg-white rounded-lg shadow-lg border border-gray-200 max-h-60 overflow-auto">
            {searchable && (
              <div className="p-2 border-b border-gray-200 sticky top-0 bg-white">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" strokeWidth={2} />
                  <input
                    ref={searchInputRef}
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Rechercher..."
                    className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                  />
                </div>
              </div>
            )}

            <div className="py-1">
              {Object.entries(groupedOptions).map(([group, groupOptions]) => (
                <div key={group}>
                  {group !== '_default' && (
                    <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase">
                      {group}
                    </div>
                  )}
                  {groupOptions.map((option) => {
                    const isSelected = selectedValues.includes(option.value);
                    return (
                      <button
                        key={option.value}
                        type="button"
                        disabled={option.disabled}
                        onClick={() => handleSelect(option.value)}
                        className={cn(
                          'w-full px-3 py-2 text-left flex items-center justify-between gap-2 transition-colors',
                          {
                            'bg-gradient-crou text-white': isSelected,
                            'hover:bg-gray-100': !isSelected && !option.disabled,
                            'opacity-50 cursor-not-allowed': option.disabled,
                          }
                        )}
                      >
                        <span className="flex items-center gap-2">
                          {option.icon && (
                            <option.icon
                              className={cn('h-5 w-5', isSelected ? 'text-white' : 'text-gray-400')}
                              strokeWidth={2}
                            />
                          )}
                          {option.label}
                        </span>
                        {isSelected && <Check className="h-5 w-5" strokeWidth={2.5} />}
                      </button>
                    );
                  })}
                </div>
              ))}

              {filteredOptions.length === 0 && (
                <div className="px-3 py-6 text-center text-sm text-gray-500">
                  Aucun résultat trouvé
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {(helperText || error) && (
        <div className={cn('mt-1.5 text-sm', error ? 'text-danger-600' : 'text-gray-600')}>
          {error || helperText}
        </div>
      )}
    </div>
  );
};

export default ModernSelect;

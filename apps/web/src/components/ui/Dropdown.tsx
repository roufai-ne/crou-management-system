import React, { useState, useRef, useEffect } from 'react';
import { cn } from '@/utils/cn';
import { ChevronDownIcon, CheckIcon } from '@heroicons/react/24/outline';

// Type pour les variantes de props (remplace VariantProps de class-variance-authority)
type VariantProps<T> = T extends (...args: any[]) => any
  ? Parameters<T>[0]
  : never;

// Fonction de variantes personnalisée pour le dropdown
const dropdownVariants = (props: {
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'ghost';
}) => {
  const baseClasses = 'z-50 min-w-32 overflow-hidden rounded-md border bg-white shadow-md';
  
  const sizeClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg'
  };
  
  const variantClasses = {
    'default': 'border-gray-200',
    ghost: 'border-transparent shadow-lg'
  };
  
  return cn(
    baseClasses,
    sizeClasses[props.size || 'md'],
    variantClasses[props.variant || 'default']
  );
};

// Fonction de variantes pour les éléments du menu
const dropdownItemVariants = (props: {
  isSelected?: boolean;
  isDisabled?: boolean;
  variant?: 'default' | 'destructive';
}) => {
  const baseClasses = 'relative flex w-full cursor-pointer select-none items-center gap-2 px-2 py-1.5 text-sm outline-none';
  
  if (props.isDisabled) {
    return cn(baseClasses, 'cursor-not-allowed opacity-50');
  }
  
  if (props.isSelected) {
    return cn(baseClasses, 'bg-primary-100 text-primary-900');
  }
  
  const variantClasses = {
    'default': 'hover:bg-gray-100 focus:bg-gray-100',
    destructive: 'text-red-600 hover:bg-red-50 focus:bg-red-50'
  };
  
  return cn(
    baseClasses,
    variantClasses[props.variant || 'default']
  );
};

// Interface pour un élément de dropdown
export interface DropdownItem {
  id: string;
  label: string;
  value?: any;
  icon?: React.ReactNode;
  disabled?: boolean;
  variant?: 'default' | 'destructive';
  onClick?: () => void;
}

// Interface des props
interface DropdownProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onSelect'> {
  trigger: React.ReactNode;
  items: DropdownItem[];
  selectedId?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'ghost';
  placement?: 'bottom-start' | 'bottom-end' | 'top-start' | 'top-end';
  onSelect?: (item: DropdownItem) => void;
  disabled?: boolean;
  closeOnSelect?: boolean;
}

// Composant Dropdown
export const Dropdown: React.FC<DropdownProps> = ({
  trigger,
  items,
  selectedId,
  size = 'md',
  variant = 'default',
  placement = 'bottom-start',
  onSelect,
  disabled = false,
  closeOnSelect = true,
  className,
  ...props
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  // Fermer le dropdown quand on clique à l'extérieur
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setFocusedIndex(-1);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  // Gestion du clavier
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!isOpen) return;

      switch (event.key) {
        case 'Escape':
          setIsOpen(false);
          setFocusedIndex(-1);
          triggerRef.current?.focus();
          break;
        case 'ArrowDown':
          event.preventDefault();
          setFocusedIndex(prev => 
            prev < items.length - 1 ? prev + 1 : 0
          );
          break;
        case 'ArrowUp':
          event.preventDefault();
          setFocusedIndex(prev => 
            prev > 0 ? prev - 1 : items.length - 1
          );
          break;
        case 'Enter':
        case ' ':
          event.preventDefault();
          if (focusedIndex >= 0) {
            handleItemClick(items[focusedIndex]);
          }
          break;
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, focusedIndex, items]);

  const handleTriggerClick = () => {
    if (!disabled) {
      setIsOpen(!isOpen);
      setFocusedIndex(-1);
    }
  };

  const handleItemClick = (item: DropdownItem) => {
    if (item.disabled) return;

    onSelect?.(item);
    item.onClick?.();

    if (closeOnSelect) {
      setIsOpen(false);
      setFocusedIndex(-1);
    }
  };

  // Classes de positionnement
  const placementClasses = {
    'bottom-start': 'top-full left-0 mt-1',
    'bottom-end': 'top-full right-0 mt-1',
    'top-start': 'bottom-full left-0 mb-1',
    'top-end': 'bottom-full right-0 mb-1'
  };

  return (
    <div ref={dropdownRef} className={cn('relative inline-block', className)} {...props}>
      {/* Trigger */}
      <button
        ref={triggerRef}
        type="button"
        onClick={handleTriggerClick}
        disabled={disabled}
        className={cn(
          'inline-flex items-center justify-center gap-2',
          disabled && 'opacity-50 cursor-not-allowed'
        )}
        aria-expanded={isOpen}
        aria-haspopup="menu"
      >
        {trigger}
      </button>

      {/* Menu dropdown */}
      {isOpen && (
        <div
          className={cn(
            'absolute z-50',
            placementClasses[placement],
            dropdownVariants({ size, variant })
          )}
          role="menu"
        >
          {items.map((item, index) => (
            <button
              key={item.id}
              type="button"
              role="menuitem"
              disabled={item.disabled}
              onClick={() => handleItemClick(item)}
              onMouseEnter={() => setFocusedIndex(index)}
              className={cn(
                dropdownItemVariants({
                  isSelected: item.id === selectedId,
                  isDisabled: item.disabled,
                  variant: item.variant
                }),
                focusedIndex === index && 'bg-gray-100'
              )}
            >
              {item.icon && (
                <span className="w-4 h-4 flex-shrink-0">
                  {item.icon}
                </span>
              )}
              <span className="flex-1 text-left">{item.label}</span>
              {item.id === selectedId && (
                <CheckIcon className="w-4 h-4 flex-shrink-0" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default Dropdown;

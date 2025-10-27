/**
 * FICHIER: apps\web\src\components\ui\Select.tsx
 * COMPOSANT: Select - Sélecteur de données
 * 
 * DESCRIPTION:
 * Composant de sélection réutilisable
 * Options, recherche, multi-sélection
 * Design accessible et responsive
 * 
 * FONCTIONNALITÉS:
 * - Sélection simple et multiple
 * - Recherche dans les options
 * - Groupes d'options
 * - Désactivation d'options
 * - Design accessible
 * - Animations fluides
 * 
 * AUTEUR: Équipe CROU
 * DATE: Décembre 2024
 */

import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check, Search, X } from 'lucide-react';
import { Button } from './Button';

// Interface pour les options
export interface SelectOption {
  value: string | number;
  label: string;
  description?: string;
  disabled?: boolean;
  group?: string;
  icon?: React.ReactNode;
}

// Interface pour les props du composant
export interface SelectProps {
  value?: string | number | (string | number)[];
  onChange?: (value: string | number | (string | number)[]) => void;
  options: SelectOption[];
  placeholder?: string;
  disabled?: boolean;
  multiple?: boolean;
  searchable?: boolean;
  clearable?: boolean;
  className?: string;
  optionClassName?: string;
  error?: boolean;
  errorMessage?: string;
  label?: string;
  required?: boolean;
  size?: 'sm' | 'md' | 'lg';
  filterFunction?: (option: SelectOption, searchTerm: string) => boolean;
  noOptionsText?: string;
}

// Configuration des tailles
const sizeClasses = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-3 py-2 text-sm',
  lg: 'px-4 py-3 text-base'
};

export function Select({
  value,
  onChange,
  options,
  placeholder = 'Sélectionner...',
  disabled = false,
  multiple = false,
  searchable = false,
  clearable = false,
  className = '',
  optionClassName = '',
  error = false,
  errorMessage,
  label,
  required = false,
  size = 'md',
  filterFunction,
  noOptionsText = 'Aucune option disponible'
}: SelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [focusedIndex, setFocusedIndex] = useState(-1);
  
  const selectRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const optionRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Filtrer les options selon la recherche
  const filteredOptions = options.filter(option => {
    if (filterFunction) {
      return filterFunction(option, searchTerm);
    }
    return option.label.toLowerCase().includes(searchTerm.toLowerCase());
  });

  // Grouper les options
  const groupedOptions = filteredOptions.reduce((groups, option) => {
    const group = option.group || 'default';
    if (!groups[group]) {
      groups[group] = [];
    }
    groups[group].push(option);
    return groups;
  }, {} as Record<string, SelectOption[]>);

  // Vérifier si une option est sélectionnée
  const isSelected = (optionValue: string | number) => {
    if (multiple && Array.isArray(value)) {
      return value.includes(optionValue);
    }
    return value === optionValue;
  };

  // Gérer la sélection d'une option
  const handleSelect = (optionValue: string | number) => {
    if (multiple) {
      const currentValue = Array.isArray(value) ? value : [];
      const newValue = currentValue.includes(optionValue)
        ? currentValue.filter(v => v !== optionValue)
        : [...currentValue, optionValue];
      onChange?.(newValue);
    } else {
      onChange?.(optionValue);
      setIsOpen(false);
      setSearchTerm('');
    }
  };

  // Gérer la fermeture du select
  const handleClose = () => {
    setIsOpen(false);
    setSearchTerm('');
    setFocusedIndex(-1);
  };

  // Gérer les touches du clavier
  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (!isOpen) {
      if (event.key === 'Enter' || event.key === ' ' || event.key === 'ArrowDown') {
        event.preventDefault();
        setIsOpen(true);
      }
      return;
    }

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        setFocusedIndex(prev => 
          prev < filteredOptions.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        event.preventDefault();
        setFocusedIndex(prev => 
          prev > 0 ? prev - 1 : filteredOptions.length - 1
        );
        break;
      case 'Enter':
        event.preventDefault();
        if (focusedIndex >= 0 && focusedIndex < filteredOptions.length) {
          handleSelect(filteredOptions[focusedIndex].value);
        }
        break;
      case 'Escape':
        event.preventDefault();
        handleClose();
        break;
    }
  };

  // Focus sur l'option sélectionnée
  useEffect(() => {
    if (isOpen && focusedIndex >= 0) {
      optionRefs.current[focusedIndex]?.scrollIntoView({
        block: 'nearest'
      });
    }
  }, [focusedIndex, isOpen]);

  // Focus sur le champ de recherche
  useEffect(() => {
    if (isOpen && searchable && searchRef.current) {
      searchRef.current.focus();
    }
  }, [isOpen, searchable]);

  // Fermer le select quand on clique à l'extérieur
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (selectRef.current && !selectRef.current.contains(event.target as Node)) {
        handleClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Obtenir le texte affiché
  const getDisplayText = () => {
    if (multiple && Array.isArray(value)) {
      if (value.length === 0) return placeholder;
      if (value.length === 1) {
        const option = options.find(opt => opt.value === value[0]);
        return option?.label || placeholder;
      }
      return `${value.length} éléments sélectionnés`;
    }
    
    const option = options.find(opt => opt.value === value);
    return option?.label || placeholder;
  };

  // Effacer la sélection
  const handleClear = (event: React.MouseEvent) => {
    event.stopPropagation();
    onChange?.(multiple ? [] : '');
  };

  return (
    <div className={`relative ${className}`}>
      {/* Label */}
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}

      {/* Select */}
      <div
        ref={selectRef}
        className={`relative ${sizeClasses[size]} border rounded-md cursor-pointer ${
          error ? 'border-red-500' : 'border-gray-300'
        } ${disabled ? 'bg-gray-100 cursor-not-allowed' : 'bg-white hover:border-gray-400'}`}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        onKeyDown={handleKeyDown}
        tabIndex={disabled ? -1 : 0}
        role="combobox"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
      >
        <div className="flex items-center justify-between">
          <span className={`${!value ? 'text-gray-500' : 'text-gray-900'}`}>
            {getDisplayText()}
          </span>
          <div className="flex items-center gap-1">
            {clearable && value && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleClear}
                className="p-1 h-6 w-6"
              >
                <X className="w-3 h-3" />
              </Button>
            )}
            <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${
              isOpen ? 'rotate-180' : ''
            }`} />
          </div>
        </div>

        {/* Options */}
        {isOpen && (
          <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
            {/* Recherche */}
            {searchable && (
              <div className="p-2 border-b border-gray-200">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    ref={searchRef}
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Rechercher..."
                    className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            )}

            {/* Liste des options */}
            <div className="py-1">
              {Object.entries(groupedOptions).map(([groupName, groupOptions]) => (
                <div key={groupName}>
                  {groupName !== 'default' && (
                    <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      {groupName}
                    </div>
                  )}
                  {groupOptions.map((option, index) => (
                    <div
                      key={option.value}
                      ref={el => optionRefs.current[index] = el}
                      className={`px-3 py-2 cursor-pointer hover:bg-gray-100 ${
                        isSelected(option.value) ? 'bg-blue-50 text-blue-900' : 'text-gray-900'
                      } ${option.disabled ? 'opacity-50 cursor-not-allowed' : ''} ${optionClassName}`}
                      onClick={() => !option.disabled && handleSelect(option.value)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {option.icon && (
                            <span className="flex-shrink-0">
                              {option.icon}
                            </span>
                          )}
                          <div>
                            <span>{option.label}</span>
                            {option.description && (
                              <div className="text-xs text-gray-500 mt-1">
                                {option.description}
                              </div>
                            )}
                          </div>
                        </div>
                        {isSelected(option.value) && (
                          <Check className="w-4 h-4 text-blue-600" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ))}
              
              {filteredOptions.length === 0 && (
                <div className="px-3 py-2 text-sm text-gray-500 text-center">
                  {noOptionsText}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Message d'erreur */}
      {error && errorMessage && (
        <p className="mt-1 text-sm text-red-600">{errorMessage}</p>
      )}
    </div>
  );
}

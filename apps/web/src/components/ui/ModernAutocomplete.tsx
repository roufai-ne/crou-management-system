import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Search, X, ChevronDown, Plus, Check } from 'lucide-react';
import { cn } from '@/utils/cn';

export interface AutocompleteOption {
  value: string;
  label: string;
  description?: string;
  disabled?: boolean;
}

export interface ModernAutocompleteProps {
  value?: string;
  onChange?: (value: string) => void;
  options?: AutocompleteOption[];
  label?: string;
  placeholder?: string;
  error?: string;
  disabled?: boolean;
  loading?: boolean;
  // Recherche async
  onSearch?: (query: string) => Promise<AutocompleteOption[]>;
  // Permettre la création
  allowCreate?: boolean;
  onCreateOption?: (value: string) => void;
  createLabel?: string;
  // Debounce
  debounceMs?: number;
  variant?: 'default' | 'gradient-crou';
  className?: string;
}

export function ModernAutocomplete({
  value,
  onChange,
  options = [],
  label,
  placeholder = 'Rechercher...',
  error,
  disabled = false,
  loading = false,
  onSearch,
  allowCreate = false,
  onCreateOption,
  createLabel = 'Créer',
  debounceMs = 300,
  variant = 'default',
  className,
}: ModernAutocompleteProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [asyncOptions, setAsyncOptions] = useState<AutocompleteOption[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout>();

  // Combiner options locales et async
  const allOptions = useMemo(() => {
    return onSearch ? asyncOptions : options;
  }, [options, asyncOptions, onSearch]);

  // Filtrer les options
  const filteredOptions = useMemo(() => {
    if (!searchQuery || onSearch) return allOptions;
    
    const query = searchQuery.toLowerCase();
    return allOptions.filter(
      option =>
        option.label.toLowerCase().includes(query) ||
        option.value.toLowerCase().includes(query) ||
        option.description?.toLowerCase().includes(query)
    );
  }, [allOptions, searchQuery, onSearch]);

  // Option sélectionnée
  const selectedOption = useMemo(() => {
    return allOptions.find(opt => opt.value === value);
  }, [allOptions, value]);

  // Recherche async avec debounce
  useEffect(() => {
    if (!onSearch || !searchQuery) {
      setAsyncOptions([]);
      return;
    }

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(async () => {
      setIsSearching(true);
      try {
        const results = await onSearch(searchQuery);
        setAsyncOptions(results);
      } catch (err) {
        console.error('Search error:', err);
        setAsyncOptions([]);
      } finally {
        setIsSearching(false);
      }
    }, debounceMs);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [searchQuery, onSearch, debounceMs]);

  // Reset highlighted index quand les options changent
  useEffect(() => {
    setHighlightedIndex(0);
  }, [filteredOptions]);

  // Fermer au clic extérieur
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node) &&
        !inputRef.current?.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (option: AutocompleteOption) => {
    if (option.disabled) return;
    onChange?.(option.value);
    setSearchQuery('');
    setIsOpen(false);
    inputRef.current?.blur();
  };

  const handleClear = () => {
    onChange?.('');
    setSearchQuery('');
    setIsOpen(false);
  };

  const handleCreate = () => {
    if (!searchQuery.trim()) return;
    onCreateOption?.(searchQuery.trim());
    setSearchQuery('');
    setIsOpen(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) {
      if (e.key === 'Enter' || e.key === 'ArrowDown') {
        setIsOpen(true);
        e.preventDefault();
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex(prev =>
          prev < filteredOptions.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex(prev => (prev > 0 ? prev - 1 : prev));
        break;
      case 'Enter':
        e.preventDefault();
        if (allowCreate && searchQuery && filteredOptions.length === 0) {
          handleCreate();
        } else if (filteredOptions[highlightedIndex]) {
          handleSelect(filteredOptions[highlightedIndex]);
        }
        break;
      case 'Escape':
        e.preventDefault();
        setIsOpen(false);
        setSearchQuery('');
        break;
    }
  };

  // Highlight du texte de recherche
  const highlightMatch = (text: string, query: string) => {
    if (!query) return text;
    
    const index = text.toLowerCase().indexOf(query.toLowerCase());
    if (index === -1) return text;

    const before = text.substring(0, index);
    const match = text.substring(index, index + query.length);
    const after = text.substring(index + query.length);

    return (
      <>
        {before}
        <mark className="bg-yellow-200 font-medium">{match}</mark>
        {after}
      </>
    );
  };

  return (
    <div className={cn('relative', className)}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {label}
        </label>
      )}

      {/* Input Field */}
      <div className="relative">
        <div
          className={cn(
            'relative flex items-center',
            'rounded-lg border transition-all',
            variant === 'default' && [
              'border-gray-300 bg-white',
              isOpen && 'border-primary-500 ring-2 ring-primary-100'
            ],
            variant === 'gradient-crou' && [
              'border-transparent bg-gradient-to-r from-primary-50 to-accent-50',
              isOpen && 'ring-2 ring-primary-200'
            ],
            error && 'border-red-500 ring-2 ring-red-100',
            disabled && 'opacity-50 cursor-not-allowed bg-gray-100'
          )}
        >
          <Search
            className="absolute left-3 w-5 h-5 text-gray-400 pointer-events-none"
            strokeWidth={2}
          />

          <input
            ref={inputRef}
            type="text"
            value={isOpen ? searchQuery : (selectedOption?.label || '')}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => setIsOpen(true)}
            onKeyDown={handleKeyDown}
            disabled={disabled}
            placeholder={placeholder}
            className={cn(
              'w-full pl-10 pr-20 py-3 bg-transparent',
              'text-sm text-gray-900 placeholder-gray-500',
              'focus:outline-none',
              disabled && 'cursor-not-allowed'
            )}
          />

          {/* Actions droite */}
          <div className="absolute right-2 flex items-center gap-1">
            {(loading || isSearching) && (
              <div className="w-5 h-5 border-2 border-primary-600 border-t-transparent rounded-full animate-spin" />
            )}

            {value && !disabled && (
              <button
                type="button"
                onClick={handleClear}
                className="p-1 hover:bg-gray-100 rounded transition-colors"
              >
                <X className="w-4 h-4 text-gray-400" strokeWidth={2} />
              </button>
            )}

            <button
              type="button"
              onClick={() => !disabled && setIsOpen(!isOpen)}
              disabled={disabled}
              className="p-1 hover:bg-gray-100 rounded transition-colors"
            >
              <ChevronDown
                className={cn(
                  'w-5 h-5 text-gray-400 transition-transform',
                  isOpen && 'rotate-180'
                )}
                strokeWidth={2}
              />
            </button>
          </div>
        </div>

        {/* Dropdown */}
        {isOpen && (
          <div
            ref={dropdownRef}
            className="absolute z-50 w-full mt-2 bg-white rounded-lg shadow-xl border border-gray-200 max-h-64 overflow-y-auto"
          >
            {filteredOptions.length > 0 ? (
              <ul className="py-1">
                {filteredOptions.map((option, index) => (
                  <li key={option.value}>
                    <button
                      type="button"
                      onClick={() => handleSelect(option)}
                      disabled={option.disabled}
                      className={cn(
                        'w-full px-4 py-2.5 text-left transition-colors',
                        'flex items-center justify-between gap-2',
                        highlightedIndex === index && 'bg-primary-50',
                        option.disabled && 'opacity-50 cursor-not-allowed',
                        !option.disabled && 'hover:bg-gray-50',
                        option.value === value && 'bg-primary-100'
                      )}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-gray-900">
                          {highlightMatch(option.label, searchQuery)}
                        </div>
                        {option.description && (
                          <div className="text-xs text-gray-500 truncate">
                            {option.description}
                          </div>
                        )}
                      </div>
                      {option.value === value && (
                        <Check className="w-4 h-4 text-primary-600 flex-shrink-0" strokeWidth={2} />
                      )}
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="px-4 py-8 text-center">
                {isSearching ? (
                  <p className="text-sm text-gray-500">Recherche en cours...</p>
                ) : (
                  <>
                    <p className="text-sm text-gray-500 mb-3">
                      Aucun résultat trouvé
                    </p>
                    {allowCreate && searchQuery && (
                      <button
                        type="button"
                        onClick={handleCreate}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-crou text-white text-sm font-medium rounded-lg hover:opacity-90 transition-opacity"
                      >
                        <Plus className="w-4 h-4" strokeWidth={2} />
                        {createLabel} "{searchQuery}"
                      </button>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}
    </div>
  );
}

export default ModernAutocomplete;

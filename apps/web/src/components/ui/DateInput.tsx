/**
 * FICHIER: apps\web\src\components\ui\DateInput.tsx
 * COMPOSANT: DateInput - Composant de saisie de date français
 * 
 * DESCRIPTION:
 * Composant spécialisé pour la saisie de dates au format français
 * Formatage automatique DD/MM/YYYY avec validation
 * Support des plages de dates et formats spécialisés CROU
 * 
 * FONCTIONNALITÉS:
 * - Format français DD/MM/YYYY automatique
 * - Validation des dates (min, max, format)
 * - Support des années académiques CROU
 * - Formatage intelligent pendant la saisie
 * - Calendrier natif du navigateur
 * - Validation des dates métier (exercices budgétaires)
 * 
 * FORMATS SUPPORTÉS:
 * - DD/MM/YYYY: Format complet (défaut)
 * - MM/YYYY: Mois et année uniquement
 * - YYYY: Année uniquement
 * 
 * PROPS:
 * - value: Valeur Date ou string
 * - onValueChange: Callback avec objet Date
 * - format: Format d'affichage
 * - minDate: Date minimum
 * - maxDate: Date maximum
 * - locale: Locale (défaut: fr-NE)
 * - academicYear: Mode année académique CROU
 * 
 * USAGE:
 * <DateInput
 *   label="Date de naissance"
 *   value={birthDate}
 *   onValueChange={setBirthDate}
 *   maxDate={new Date()}
 *   required
 * />
 * 
 * AUTEUR: Équipe CROU
 * DATE: Décembre 2024
 */

import React, { forwardRef, useState, useEffect, useCallback } from 'react';
import { CalendarDaysIcon } from '@heroicons/react/24/outline';
import { Input, type InputProps } from './Input';
import { formatDate } from '@/utils/formatters';

// Types de format supportés
export type DateFormat = 'DD/MM/YYYY' | 'MM/YYYY' | 'YYYY';

// Interface des props spécifiques au DateInput
export interface DateInputProps extends Omit<InputProps, 'type' | 'value' | 'onChange'> {
  /** Valeur de la date */
  value?: Date | string | null;
  
  /** Callback appelé quand la date change */
  onValueChange?: (date: Date | null) => void;
  
  /** Format d'affichage de la date */
  format?: DateFormat;
  
  /** Date minimum autorisée */
  minDate?: Date;
  
  /** Date maximum autorisée */
  maxDate?: Date;
  
  /** Locale pour le formatage (défaut: fr-NE) */
  locale?: string;
  
  /** Mode année académique CROU (septembre à août) */
  academicYear?: boolean;
  
  /** Années d'exercice budgétaire uniquement */
  fiscalYear?: boolean;
  
  /** Afficher le calendrier natif */
  showCalendar?: boolean;
}

// Fonction utilitaire pour parser une date française
const parseFrenchDate = (value: string, format: DateFormat): Date | null => {
  if (!value || value.trim() === '') return null;
  
  // Nettoyer la valeur (garder seulement chiffres et /)
  const cleanValue = value.replace(/[^\d\/]/g, '');
  
  try {
    switch (format) {
      case 'DD/MM/YYYY': {
        const parts = cleanValue.split('/');
        if (parts.length !== 3) return null;
        
        const day = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10);
        const year = parseInt(parts[2], 10);
        
        if (day < 1 || day > 31 || month < 1 || month > 12 || year < 1900 || year > 2100) {
          return null;
        }
        
        const date = new Date(year, month - 1, day);
        
        // Vérifier que la date est valide (pas de 31 février par exemple)
        if (date.getDate() !== day || date.getMonth() !== month - 1 || date.getFullYear() !== year) {
          return null;
        }
        
        return date;
      }
      
      case 'MM/YYYY': {
        const parts = cleanValue.split('/');
        if (parts.length !== 2) return null;
        
        const month = parseInt(parts[0], 10);
        const year = parseInt(parts[1], 10);
        
        if (month < 1 || month > 12 || year < 1900 || year > 2100) {
          return null;
        }
        
        return new Date(year, month - 1, 1);
      }
      
      case 'YYYY': {
        const year = parseInt(cleanValue, 10);
        
        if (year < 1900 || year > 2100) {
          return null;
        }
        
        return new Date(year, 0, 1);
      }
      
      default:
        return null;
    }
  } catch {
    return null;
  }
};

// Fonction utilitaire pour formater une date pour l'affichage
const formatDisplayValue = (date: Date | null, format: DateFormat): string => {
  if (!date) return '';
  
  try {
    switch (format) {
      case 'DD/MM/YYYY':
        return formatDate(date, { format: 'short' });
      
      case 'MM/YYYY': {
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const year = date.getFullYear();
        return `${month}/${year}`;
      }
      
      case 'YYYY':
        return date.getFullYear().toString();
      
      default:
        return '';
    }
  } catch {
    return '';
  }
};

// Fonction utilitaire pour formater pendant la saisie
const formatInputValue = (value: string, format: DateFormat): string => {
  // Supprimer tous les caractères non numériques
  const numbers = value.replace(/\D/g, '');
  
  switch (format) {
    case 'DD/MM/YYYY': {
      if (numbers.length <= 2) return numbers;
      if (numbers.length <= 4) return `${numbers.slice(0, 2)}/${numbers.slice(2)}`;
      return `${numbers.slice(0, 2)}/${numbers.slice(2, 4)}/${numbers.slice(4, 8)}`;
    }
    
    case 'MM/YYYY': {
      if (numbers.length <= 2) return numbers;
      return `${numbers.slice(0, 2)}/${numbers.slice(2, 6)}`;
    }
    
    case 'YYYY': {
      return numbers.slice(0, 4);
    }
    
    default:
      return value;
  }
};

// Composant DateInput
const DateInput = forwardRef<HTMLInputElement, DateInputProps>(
  (
    {
      value,
      onValueChange,
      format = 'DD/MM/YYYY',
      minDate,
      maxDate,
      locale = 'fr-NE',
      academicYear = false,
      fiscalYear = false,
      showCalendar = true,
      error,
      leftIcon,
      placeholder,
      ...props
    },
    ref
  ) => {
    const [displayValue, setDisplayValue] = useState<string>('');
    const [isFocused, setIsFocused] = useState(false);
    
    // Générer le placeholder selon le format
    const getPlaceholder = (): string => {
      if (placeholder) return placeholder;
      
      switch (format) {
        case 'DD/MM/YYYY':
          return 'jj/mm/aaaa';
        case 'MM/YYYY':
          return 'mm/aaaa';
        case 'YYYY':
          return 'aaaa';
        default:
          return '';
      }
    };
    
    // Synchroniser la valeur d'affichage avec la prop value
    useEffect(() => {
      if (!isFocused) {
        let dateValue: Date | null = null;
        
        if (value instanceof Date) {
          dateValue = value;
        } else if (typeof value === 'string' && value) {
          dateValue = parseFrenchDate(value, format);
        }
        
        const formatted = formatDisplayValue(dateValue, format);
        setDisplayValue(formatted);
      }
    }, [value, format, isFocused]);
    
    // Validation de la date
    const validateDate = useCallback((date: Date | null): string | undefined => {
      if (!date) return undefined;
      
      if (minDate && date < minDate) {
        return `La date doit être postérieure au ${formatDate(minDate, { format: 'short' })}`;
      }
      
      if (maxDate && date > maxDate) {
        return `La date doit être antérieure au ${formatDate(maxDate, { format: 'short' })}`;
      }
      
      // Validation spécifique année académique
      if (academicYear) {
        const month = date.getMonth();
        if (format === 'MM/YYYY' && (month < 8 && month > 7)) {
          return 'L\'année académique va de septembre à août';
        }
      }
      
      // Validation spécifique exercice budgétaire
      if (fiscalYear) {
        const year = date.getFullYear();
        const currentYear = new Date().getFullYear();
        if (year < currentYear - 5 || year > currentYear + 2) {
          return 'L\'exercice budgétaire doit être dans une plage raisonnable';
        }
      }
      
      return undefined;
    }, [minDate, maxDate, academicYear, fiscalYear, format]);
    
    // Gestion du changement de valeur
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const inputValue = e.target.value;
      
      // Formater la valeur pendant la saisie
      const formattedValue = formatInputValue(inputValue, format);
      setDisplayValue(formattedValue);
      
      // Parser et valider la date
      const parsedDate = parseFrenchDate(formattedValue, format);
      
      // Appeler le callback avec la date parsée
      if (onValueChange) {
        onValueChange(parsedDate);
      }
    };
    
    // Gestion du focus
    const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(true);
      
      if (props.onFocus) {
        props.onFocus(e);
      }
    };
    
    // Gestion de la perte de focus
    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(false);
      
      // Reformater la valeur à la perte de focus
      const parsedDate = parseFrenchDate(displayValue, format);
      const formatted = formatDisplayValue(parsedDate, format);
      setDisplayValue(formatted);
      
      if (props.onBlur) {
        props.onBlur(e);
      }
    };
    
    // Gestion des touches spéciales
    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      // Autoriser les touches de navigation et d'édition
      const allowedKeys = [
        'Backspace', 'Delete', 'Tab', 'Escape', 'Enter',
        'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown',
        'Home', 'End'
      ];
      
      if (allowedKeys.includes(e.key)) {
        if (props.onKeyDown) {
          props.onKeyDown(e);
        }
        return;
      }
      
      // Autoriser Ctrl+A, Ctrl+C, Ctrl+V, Ctrl+X
      if (e.ctrlKey || e.metaKey) {
        if (props.onKeyDown) {
          props.onKeyDown(e);
        }
        return;
      }
      
      // Autoriser les chiffres
      if (/^\d$/.test(e.key)) {
        if (props.onKeyDown) {
          props.onKeyDown(e);
        }
        return;
      }
      
      // Autoriser le slash pour les séparateurs
      if (e.key === '/' && format !== 'YYYY') {
        if (props.onKeyDown) {
          props.onKeyDown(e);
        }
        return;
      }
      
      // Bloquer toutes les autres touches
      e.preventDefault();
    };
    
    // Convertir la date pour l'input natif
    const getNativeInputValue = (): string => {
      if (!value) return '';
      
      let dateValue: Date | null = null;
      
      if (value instanceof Date) {
        dateValue = value;
      } else if (typeof value === 'string') {
        dateValue = parseFrenchDate(value, format);
      }
      
      if (!dateValue) return '';
      
      // Format ISO pour l'input date natif (YYYY-MM-DD)
      const year = dateValue.getFullYear();
      const month = (dateValue.getMonth() + 1).toString().padStart(2, '0');
      const day = dateValue.getDate().toString().padStart(2, '0');
      
      return `${year}-${month}-${day}`;
    };
    
    // Déterminer l'erreur à afficher
    const parsedDate = parseFrenchDate(displayValue, format);
    const validationError = validateDate(parsedDate);
    const currentError = error || validationError;
    
    // Déterminer l'état de validation
    const validationState = currentError ? 'error' : parsedDate ? 'success' : 'default';

    return (
      <div className="relative">
        <Input
          ref={ref}
          type="text"
          value={displayValue}
          onChange={handleChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          error={currentError}
          validationState={validationState}
          leftIcon={leftIcon || <CalendarDaysIcon className="h-5 w-5" />}
          placeholder={getPlaceholder()}
          inputMode="numeric"
          autoComplete="off"
          {...props}
        />
        
        {/* Input date natif caché pour le calendrier */}
        {showCalendar && format === 'DD/MM/YYYY' && (
          <input
            type="date"
            value={getNativeInputValue()}
            onChange={(e) => {
              if (e.target.value) {
                const nativeDate = new Date(e.target.value + 'T00:00:00');
                if (onValueChange) {
                  onValueChange(nativeDate);
                }
              }
            }}
            min={minDate ? minDate.toISOString().split('T')[0] : undefined}
            max={maxDate ? maxDate.toISOString().split('T')[0] : undefined}
            className="absolute inset-0 opacity-0 cursor-pointer"
            tabIndex={-1}
            aria-hidden="true"
          />
        )}
      </div>
    );
  }
);

DateInput.displayName = 'DateInput';

export { DateInput };
export default DateInput;

/**
 * FICHIER: apps\web\src\components\ui\CurrencyInput.tsx
 * COMPOSANT: CurrencyInput - Composant de saisie monétaire FCFA
 * 
 * DESCRIPTION:
 * Composant spécialisé pour la saisie de montants en FCFA
 * Formatage automatique avec séparateurs français
 * Validation des montants et gestion des valeurs numériques
 * 
 * FONCTIONNALITÉS:
 * - Formatage automatique FCFA (1 500 000 FCFA)
 * - Séparateurs de milliers français (espaces)
 * - Validation des montants (min, max)
 * - Gestion des décimales optionnelles
 * - Callback avec valeur numérique pure
 * - Support des montants négatifs (optionnel)
 * 
 * PROPS:
 * - value: Valeur numérique du montant
 * - onValueChange: Callback avec la valeur numérique
 * - currency: Devise (défaut: 'FCFA')
 * - decimals: Nombre de décimales (défaut: 0)
 * - min: Montant minimum
 * - max: Montant maximum
 * - allowNegative: Autoriser les montants négatifs
 * - showCurrency: Afficher le symbole de devise
 * 
 * USAGE:
 * <CurrencyInput
 *   label="Montant du budget"
 *   value={budget}
 *   onValueChange={setBudget}
 *   min={0}
 *   max={10000000}
 *   required
 * />
 * 
 * AUTEUR: Équipe CROU
 * DATE: Décembre 2024
 */

import React, { forwardRef, useState, useEffect, useCallback } from 'react';
import { BanknotesIcon } from '@heroicons/react/24/outline';
import { Input, type InputProps } from './Input';
import { formatCurrency } from '@/utils/formatters';

// Interface des props spécifiques au CurrencyInput
export interface CurrencyInputProps extends Omit<InputProps, 'type' | 'value' | 'onChange'> {
  /** Valeur numérique du montant */
  value?: number | null;
  
  /** Callback appelé quand la valeur numérique change */
  onValueChange?: (value: number | null) => void;
  
  /** Devise à afficher (défaut: FCFA) */
  currency?: string;
  
  /** Nombre de décimales autorisées (défaut: 0) */
  decimals?: number;
  
  /** Montant minimum autorisé */
  min?: number;
  
  /** Montant maximum autorisé */
  max?: number;
  
  /** Autoriser les montants négatifs */
  allowNegative?: boolean;
  
  /** Afficher le symbole de devise dans le champ */
  showCurrency?: boolean;
  
  /** Séparateur de milliers (défaut: espace) */
  thousandSeparator?: string;
  
  /** Séparateur décimal (défaut: virgule) */
  decimalSeparator?: string;
}

// Fonction utilitaire pour nettoyer et parser une valeur
const parseNumericValue = (
  value: string,
  decimals: number,
  thousandSeparator: string,
  decimalSeparator: string
): number | null => {
  if (!value || value.trim() === '') return null;
  
  // Supprimer tous les caractères non numériques sauf le séparateur décimal et le signe moins
  let cleanValue = value
    .replace(new RegExp(`\\${thousandSeparator}`, 'g'), '') // Supprimer les séparateurs de milliers
    .replace(/[^\d\-.,]/g, '') // Garder seulement les chiffres, moins, point et virgule
    .replace(',', '.'); // Normaliser le séparateur décimal
  
  // Gérer le signe négatif
  const isNegative = cleanValue.startsWith('-');
  if (isNegative) {
    cleanValue = cleanValue.substring(1);
  }
  
  const numericValue = parseFloat(cleanValue);
  
  if (isNaN(numericValue)) return null;
  
  return isNegative ? -numericValue : numericValue;
};

// Fonction utilitaire pour formater une valeur pour l'affichage
const formatDisplayValue = (
  value: number | null,
  decimals: number,
  thousandSeparator: string,
  decimalSeparator: string,
  showCurrency: boolean,
  currency: string
): string => {
  if (value === null || value === undefined) return '';
  
  // Formatage avec le nombre de décimales spécifié
  const formatted = formatCurrency(value, {
    decimals,
    showSymbol: showCurrency,
    prefix: ''
  });
  
  // Remplacer les séparateurs si nécessaire
  return formatted
    .replace(/\s/g, thousandSeparator) // Remplacer les espaces par le séparateur choisi
    .replace('.', decimalSeparator); // Remplacer le point par le séparateur décimal choisi
};

// Composant CurrencyInput
const CurrencyInput = forwardRef<HTMLInputElement, CurrencyInputProps>(
  (
    {
      value,
      onValueChange,
      currency = 'FCFA',
      decimals = 0,
      min,
      max,
      allowNegative = false,
      showCurrency = true,
      thousandSeparator = ' ',
      decimalSeparator = ',',
      error,
      leftIcon,
      placeholder = '0',
      ...props
    },
    ref
  ) => {
    const [displayValue, setDisplayValue] = useState<string>('');
    const [isFocused, setIsFocused] = useState(false);
    
    // Synchroniser la valeur d'affichage avec la prop value
    useEffect(() => {
      if (!isFocused) {
        const formatted = formatDisplayValue(
          value ?? null,
          decimals,
          thousandSeparator,
          decimalSeparator,
          showCurrency,
          currency
        );
        setDisplayValue(formatted);
      }
    }, [value, decimals, thousandSeparator, decimalSeparator, showCurrency, currency, isFocused]);
    
    // Validation du montant
    const validateAmount = useCallback((amount: number | null): string | undefined => {
      if (amount === null) return undefined;
      
      if (!allowNegative && amount < 0) {
        return 'Le montant ne peut pas être négatif';
      }
      
      if (min !== undefined && amount < min) {
        return `Le montant minimum est ${formatCurrency(min, { decimals, showSymbol: true })}`;
      }
      
      if (max !== undefined && amount > max) {
        return `Le montant maximum est ${formatCurrency(max, { decimals, showSymbol: true })}`;
      }
      
      return undefined;
    }, [min, max, allowNegative, decimals]);
    
    // Gestion du changement de valeur
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const inputValue = e.target.value;
      setDisplayValue(inputValue);
      
      // Parser la valeur numérique
      const numericValue = parseNumericValue(
        inputValue,
        decimals,
        thousandSeparator,
        decimalSeparator
      );
      
      // Appeler le callback avec la valeur numérique
      if (onValueChange) {
        onValueChange(numericValue);
      }
    };
    
    // Gestion du focus
    const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(true);
      
      // Afficher la valeur brute sans formatage pendant l'édition
      if (value !== null && value !== undefined) {
        const rawValue = value.toString().replace('.', decimalSeparator);
        setDisplayValue(rawValue);
        
        // Sélectionner tout le texte pour faciliter la saisie
        setTimeout(() => {
          e.target.select();
        }, 0);
      }
      
      if (props.onFocus) {
        props.onFocus(e);
      }
    };
    
    // Gestion de la perte de focus
    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(false);
      
      // Reformater la valeur à la perte de focus
      const numericValue = parseNumericValue(
        displayValue,
        decimals,
        thousandSeparator,
        decimalSeparator
      );
      
      const formatted = formatDisplayValue(
        numericValue,
        decimals,
        thousandSeparator,
        decimalSeparator,
        showCurrency,
        currency
      );
      
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
        'Home', 'End', 'PageUp', 'PageDown'
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
      
      // Autoriser le séparateur décimal si les décimales sont autorisées
      if (decimals > 0 && (e.key === decimalSeparator || e.key === '.')) {
        // Vérifier qu'il n'y a pas déjà un séparateur décimal
        if (!displayValue.includes(decimalSeparator) && !displayValue.includes('.')) {
          if (props.onKeyDown) {
            props.onKeyDown(e);
          }
          return;
        }
      }
      
      // Autoriser le signe moins au début si les négatifs sont autorisés
      if (allowNegative && e.key === '-') {
        const selectionStart = (e.target as HTMLInputElement).selectionStart || 0;
        if (selectionStart === 0 && !displayValue.startsWith('-')) {
          if (props.onKeyDown) {
            props.onKeyDown(e);
          }
          return;
        }
      }
      
      // Bloquer toutes les autres touches
      e.preventDefault();
    };
    
    // Déterminer l'erreur à afficher (validation ou prop error)
    const validationError = validateAmount(value ?? null);
    const currentError = error || validationError;
    
    // Déterminer l'état de validation
    const validationState = currentError ? 'error' : value !== null && value !== undefined ? 'success' : 'default';

    return (
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
        leftIcon={leftIcon || <BanknotesIcon className="h-5 w-5" />}
        placeholder={placeholder}
        inputMode="decimal"
        autoComplete="off"
        {...props}
      />
    );
  }
);

CurrencyInput.displayName = 'CurrencyInput';

export { CurrencyInput };
export default CurrencyInput;

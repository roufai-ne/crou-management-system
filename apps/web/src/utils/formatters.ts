/**
 * UTILITAIRES: Formatage et conversion de données
 * 
 * Collection d'utilitaires pour formater et convertir différents types de données
 * utilisés dans l'interface utilisateur CROU
 */

/**
 * Formate un nombre en devise CFA
 */
export function formatCurrency(
  amount: number | null | undefined, 
  options?: {
    decimals?: number;
    showSymbol?: boolean;
    prefix?: string;
    currency?: string;
  }
): string {
  if (amount === null || amount === undefined) {
    return options?.showSymbol !== false ? '0 FCFA' : '0';
  }
  
  const currency = options?.currency || 'XOF';
  const decimals = options?.decimals ?? 0;
  
  const formatted = new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: currency,
    currencyDisplay: 'code',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  }).format(amount);
  
  if (options?.showSymbol === false) {
    return formatted.replace(/[^\d\s,.-]/g, '').trim();
  }
  
  return formatted.replace('XOF', 'FCFA');
}

/**
 * Formate un nombre avec séparateurs de milliers
 */
export function formatNumber(value: number | null | undefined): string {
  if (value === null || value === undefined) {
    return '0';
  }
  
  return new Intl.NumberFormat('fr-FR').format(value);
}

/**
 * Formate une date au format français
 */
export function formatDate(
  date: Date | string | null | undefined, 
  options?: Intl.DateTimeFormatOptions
): string {
  if (!date) {
    return '-';
  }
  
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  if (isNaN(dateObj.getTime())) {
    return '-';
  }
  
  const defaultOptions: Intl.DateTimeFormatOptions = {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  };
  
  return new Intl.DateTimeFormat('fr-FR', { ...defaultOptions, ...options }).format(dateObj);
}

/**
 * Formate une date avec l'heure
 */
export function formatDateTime(date: Date | string | null | undefined): string {
  if (!date) {
    return '-';
  }
  
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  if (isNaN(dateObj.getTime())) {
    return '-';
  }
  
  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(dateObj);
}

/**
 * Formate un pourcentage
 */
export function formatPercentage(value: number | null | undefined): string {
  if (value === null || value === undefined) {
    return '0%';
  }
  
  return new Intl.NumberFormat('fr-FR', {
    style: 'percent',
    minimumFractionDigits: 0,
    maximumFractionDigits: 1
  }).format(value / 100);
}

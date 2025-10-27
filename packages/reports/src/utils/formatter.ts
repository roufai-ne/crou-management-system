/**
 * FICHIER: packages\reports\src\utils\formatter.ts
 * UTILITAIRE: ReportFormatter - Formatage des données
 * 
 * DESCRIPTION:
 * Utilitaire pour le formatage des données dans les rapports
 * Support des formats français et internationaux
 * 
 * FONCTIONNALITÉS:
 * - Formatage des devises (FCFA)
 * - Formatage des dates et heures
 * - Formatage des nombres
 * - Formatage conditionnel
 * - Support multilingue
 * 
 * AUTEUR: Équipe CROU
 * DATE: Décembre 2024
 */

import moment from 'moment';
import 'moment/locale/fr';

// Configuration de moment.js en français
moment.locale('fr');

export class ReportFormatter {
  private locale: string;
  private currency: string;
  private timezone: string;

  constructor(locale: string = 'fr-FR', currency: string = 'XOF', timezone: string = 'Africa/Niamey') {
    this.locale = locale;
    this.currency = currency;
    this.timezone = timezone;
  }

  /**
   * Formatage des devises
   */
  formatCurrency(amount: number, options?: {
    showSymbol?: boolean;
    showDecimals?: boolean;
    locale?: string;
  }): string {
    const {
      showSymbol = true,
      showDecimals = false,
      locale = this.locale
    } = options || {};

    const formatter = new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: this.currency,
      minimumFractionDigits: showDecimals ? 2 : 0,
      maximumFractionDigits: showDecimals ? 2 : 0
    });

    let formatted = formatter.format(amount);
    
    if (!showSymbol) {
      formatted = formatted.replace(/[^\d,.-]/g, '');
    }

    return formatted;
  }

  /**
   * Formatage des nombres
   */
  formatNumber(number: number, decimals: number = 2, options?: {
    locale?: string;
    showThousandsSeparator?: boolean;
  }): string {
    const {
      locale = this.locale,
      showThousandsSeparator = true
    } = options || {};

    const formatter = new Intl.NumberFormat(locale, {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
      useGrouping: showThousandsSeparator
    });

    return formatter.format(number);
  }

  /**
   * Formatage des pourcentages
   */
  formatPercentage(value: number, decimals: number = 1): string {
    const formatter = new Intl.NumberFormat(this.locale, {
      style: 'percent',
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    });

    return formatter.format(value / 100);
  }

  /**
   * Formatage des dates
   */
  formatDate(date: Date | string, format: string = 'DD/MM/YYYY'): string {
    const momentDate = moment(date);
    
    if (!momentDate.isValid()) {
      return 'Date invalide';
    }

    return momentDate.format(format);
  }

  /**
   * Formatage des dates et heures
   */
  formatDateTime(date: Date | string, format: string = 'DD/MM/YYYY HH:mm'): string {
    const momentDate = moment(date);
    
    if (!momentDate.isValid()) {
      return 'Date invalide';
    }

    return momentDate.format(format);
  }

  /**
   * Formatage des durées
   */
  formatDuration(milliseconds: number, options?: {
    format?: 'short' | 'long' | 'detailed';
    locale?: string;
  }): string {
    const { format = 'short', locale = this.locale } = options || {};

    const duration = moment.duration(milliseconds);
    
    if (format === 'short') {
      if (duration.asDays() >= 1) {
        return `${Math.floor(duration.asDays())}j ${duration.hours()}h`;
      } else if (duration.asHours() >= 1) {
        return `${Math.floor(duration.asHours())}h ${duration.minutes()}min`;
      } else {
        return `${duration.minutes()}min ${duration.seconds()}s`;
      }
    } else if (format === 'long') {
      return duration.humanize();
    } else {
      // Format détaillé
      const parts = [];
      if (duration.days() > 0) parts.push(`${duration.days()} jour${duration.days() > 1 ? 's' : ''}`);
      if (duration.hours() > 0) parts.push(`${duration.hours()} heure${duration.hours() > 1 ? 's' : ''}`);
      if (duration.minutes() > 0) parts.push(`${duration.minutes()} minute${duration.minutes() > 1 ? 's' : ''}`);
      if (duration.seconds() > 0) parts.push(`${duration.seconds()} seconde${duration.seconds() > 1 ? 's' : ''}`);
      
      return parts.join(', ');
    }
  }

  /**
   * Formatage des tailles de fichiers
   */
  formatFileSize(bytes: number): string {
    const units = ['B', 'KB', 'MB', 'GB', 'TB'];
    let size = bytes;
    let unitIndex = 0;

    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }

    return `${this.formatNumber(size, 1)} ${units[unitIndex]}`;
  }

  /**
   * Formatage des valeurs selon le type
   */
  formatValue(value: any, type: string, format?: string): string {
    if (value === null || value === undefined) {
      return '-';
    }

    switch (type) {
      case 'currency':
        return this.formatCurrency(Number(value), { showDecimals: format === 'withDecimals' });
      
      case 'number':
        return this.formatNumber(Number(value), format ? parseInt(format) : 2);
      
      case 'percentage':
        return this.formatPercentage(Number(value), format ? parseInt(format) : 1);
      
      case 'date':
        return this.formatDate(value, format || 'DD/MM/YYYY');
      
      case 'datetime':
        return this.formatDateTime(value, format || 'DD/MM/YYYY HH:mm');
      
      case 'duration':
        return this.formatDuration(Number(value), { format: format as any || 'short' });
      
      case 'boolean':
        return value ? 'Oui' : 'Non';
      
      case 'string':
      default:
        return String(value);
    }
  }

  /**
   * Formatage conditionnel des valeurs
   */
  formatConditional(value: any, conditions: Array<{
    condition: (val: any) => boolean;
    format: (val: any) => string;
  }>): string {
    for (const { condition, format } of conditions) {
      if (condition(value)) {
        return format(value);
      }
    }
    
    return String(value);
  }

  /**
   * Formatage des adresses
   */
  formatAddress(address: {
    street?: string;
    city?: string;
    region?: string;
    country?: string;
    postalCode?: string;
  }): string {
    const parts = [];
    
    if (address.street) parts.push(address.street);
    if (address.city) parts.push(address.city);
    if (address.region) parts.push(address.region);
    if (address.postalCode) parts.push(address.postalCode);
    if (address.country) parts.push(address.country);
    
    return parts.join(', ');
  }

  /**
   * Formatage des numéros de téléphone
   */
  formatPhoneNumber(phone: string): string {
    // Supprimer tous les caractères non numériques
    const cleaned = phone.replace(/\D/g, '');
    
    // Format nigérien: +227 XX XX XX XX
    if (cleaned.length === 8) {
      return `+227 ${cleaned.slice(0, 2)} ${cleaned.slice(2, 4)} ${cleaned.slice(4, 6)} ${cleaned.slice(6, 8)}`;
    }
    
    // Format international
    if (cleaned.length > 8) {
      return `+${cleaned}`;
    }
    
    return phone;
  }

  /**
   * Formatage des emails
   */
  formatEmail(email: string): string {
    return email.toLowerCase().trim();
  }

  /**
   * Formatage des codes postaux
   */
  formatPostalCode(code: string): string {
    // Format nigérien: 5 chiffres
    const cleaned = code.replace(/\D/g, '');
    if (cleaned.length === 5) {
      return cleaned;
    }
    return code;
  }

  /**
   * Formatage des montants en FCFA
   */
  formatFCFA(amount: number, options?: {
    showSymbol?: boolean;
    showDecimals?: boolean;
  }): string {
    return this.formatCurrency(amount, {
      ...options
    });
  }

  /**
   * Formatage des montants en millions
   */
  formatMillions(amount: number, options?: {
    showSymbol?: boolean;
    showDecimals?: boolean;
  }): string {
    const millions = amount / 1000000;
    const formatted = this.formatNumber(millions, options?.showDecimals ? 2 : 0);
    const symbol = options?.showSymbol ? ' FCFA' : '';
    return `${formatted}M${symbol}`;
  }

  /**
   * Formatage des montants en milliards
   */
  formatBillions(amount: number, options?: {
    showSymbol?: boolean;
    showDecimals?: boolean;
  }): string {
    const billions = amount / 1000000000;
    const formatted = this.formatNumber(billions, options?.showDecimals ? 2 : 0);
    const symbol = options?.showSymbol ? ' FCFA' : '';
    return `${formatted}B${symbol}`;
  }

  /**
   * Formatage des montants avec unité appropriée
   */
  formatAmount(amount: number, options?: {
    showSymbol?: boolean;
    showDecimals?: boolean;
  }): string {
    if (amount >= 1000000000) {
      return this.formatBillions(amount, options);
    } else if (amount >= 1000000) {
      return this.formatMillions(amount, options);
    } else {
      return this.formatFCFA(amount, options);
    }
  }

  /**
   * Formatage des statuts
   */
  formatStatus(status: string): string {
    const statusMap: { [key: string]: string } = {
      'active': 'Actif',
      'inactive': 'Inactif',
      'pending': 'En attente',
      'completed': 'Terminé',
      'cancelled': 'Annulé',
      'rejected': 'Rejeté',
      'approved': 'Approuvé',
      'draft': 'Brouillon',
      'published': 'Publié',
      'archived': 'Archivé'
    };

    return statusMap[status.toLowerCase()] || status;
  }

  /**
   * Formatage des priorités
   */
  formatPriority(priority: string): string {
    const priorityMap: { [key: string]: string } = {
      'low': 'Faible',
      'medium': 'Moyenne',
      'high': 'Élevée',
      'critical': 'Critique',
      'urgent': 'Urgent'
    };

    return priorityMap[priority.toLowerCase()] || priority;
  }

  /**
   * Formatage des rôles
   */
  formatRole(role: string): string {
    const roleMap: { [key: string]: string } = {
      'admin': 'Administrateur',
      'director': 'Directeur',
      'manager': 'Gestionnaire',
      'employee': 'Employé',
      'student': 'Étudiant',
      'comptable': 'Comptable',
      'chef_financier': 'Chef Financier',
      'magasinier': 'Magasinier',
      'intendant': 'Intendant'
    };

    return roleMap[role.toLowerCase()] || role;
  }
}

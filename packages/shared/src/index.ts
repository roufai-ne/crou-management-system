/**
 * FICHIER: packages\shared\src\index.ts
 * PACKAGE: @crou/shared - Types et utilitaires partagés
 * 
 * DESCRIPTION:
 * Point d'entrée principal du package shared CROU
 * Types, interfaces et utilitaires communs
 * 
 * AUTEUR: Équipe CROU
 * DATE: Décembre 2024
 */

// Types utilisateur et authentification
export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  tenantId: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export type UserRole = 
  | 'MINISTRY_ADMIN'
  | 'MINISTRY_FINANCE'
  | 'MINISTRY_AUDIT'
  | 'MINISTRY_VIEWER'
  | 'CROU_ADMIN'
  | 'CROU_FINANCE'
  | 'CROU_STOCK'
  | 'CROU_HOUSING'
  | 'CROU_TRANSPORT';

// Types tenant
export interface Tenant {
  id: string;
  name: string;
  code: string;
  type: 'MINISTRY' | 'CROU';
  region?: string;
  isActive: boolean;
}

// Types de réponse API
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: string[];
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
  };
}

// Types de pagination
export interface PaginationParams {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
  search?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Types financiers
export interface Budget {
  id: string;
  title: string;
  amount: number;
  spent: number;
  remaining: number;
  status: 'DRAFT' | 'PENDING' | 'APPROVED' | 'REJECTED';
  tenantId: string;
  createdAt: Date;
}

export interface Transaction {
  id: string;
  amount: number;
  type: 'INCOME' | 'EXPENSE';
  category: string;
  description: string;
  budgetId?: string;
  tenantId: string;
  createdAt: Date;
}

// Types de notification
export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR';
  userId: string;
  tenantId: string;
  read: boolean;
  createdAt: Date;
}

// Utilitaires de formatage
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('fr-NE', {
    style: 'currency',
    currency: 'XOF',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount).replace('XOF', 'FCFA');
};

export const formatDate = (date: Date | string): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  }).format(d);
};

export const formatDateTime = (date: Date | string): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(d);
};

// Constantes
export const CROU_CENTERS = [
  { id: 'crou-niamey', name: 'CROU Niamey', code: 'NIA', region: 'Niamey' },
  { id: 'crou-maradi', name: 'CROU Maradi', code: 'MAR', region: 'Maradi' },
  { id: 'crou-zinder', name: 'CROU Zinder', code: 'ZIN', region: 'Zinder' },
  { id: 'crou-tahoua', name: 'CROU Tahoua', code: 'TAH', region: 'Tahoua' },
  { id: 'crou-agadez', name: 'CROU Agadez', code: 'AGA', region: 'Agadez' },
  { id: 'crou-dosso', name: 'CROU Dosso', code: 'DOS', region: 'Dosso' },
  { id: 'crou-tillaberi', name: 'CROU Tillabéri', code: 'TIL', region: 'Tillabéri' },
  { id: 'crou-diffa', name: 'CROU Diffa', code: 'DIF', region: 'Diffa' }
] as const;

export const USER_ROLES = {
  MINISTRY_ADMIN: 'Administrateur Ministère',
  MINISTRY_FINANCE: 'Responsable Financier Ministère',
  MINISTRY_AUDIT: 'Auditeur Ministère',
  MINISTRY_VIEWER: 'Visualiseur Ministère',
  CROU_ADMIN: 'Administrateur CROU',
  CROU_FINANCE: 'Responsable Financier CROU',
  CROU_STOCK: 'Gestionnaire Stock CROU',
  CROU_HOUSING: 'Gestionnaire Logement CROU',
  CROU_TRANSPORT: 'Gestionnaire Transport CROU'
} as const;

// Validation helpers
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const isValidCurrency = (amount: string): boolean => {
  const numericAmount = parseFloat(amount.replace(/[^\d.-]/g, ''));
  return !isNaN(numericAmount) && numericAmount >= 0;
};

// Hiérarchie des rôles
export {
  ROLE_HIERARCHY,
  MANAGER_ROLES,
  EXTENDED_ACCESS_ROLES,
  RoleHierarchyUtils,
  type RoleName,
  type RoleLevel
} from './constants/roleHierarchy';

// Version du package
export const VERSION = '1.0.0';
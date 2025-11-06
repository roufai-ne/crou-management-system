/**
 * FICHIER: apps/web/src/services/api/financialService.ts
 * SERVICE: FinancialService - Service pour les données financières
 *
 * DESCRIPTION:
 * Service pour la gestion des données financières (budgets, transactions, rapports)
 * Support multi-tenant avec permissions granulaires
 * Gestion des workflows de validation
 *
 * FONCTIONNALITÉS:
 * - Gestion des budgets (création, modification, validation)
 * - Gestion des transactions (recettes, dépenses)
 * - Rapports financiers (Excel, PDF)
 * - Suivi des subventions et allocations
 * - Workflows de validation par montants
 *
 * AUTEUR: Équipe CROU
 * DATE: Décembre 2024
 */

import { apiClient } from './apiClient';

// Types pour les budgets
export interface Budget {
  id: string;
  title: string;
  description?: string;
  category: string;
  amount: number;
  spent: number;
  remaining: number;
  status: 'draft' | 'pending' | 'approved' | 'rejected' | 'active' | 'closed';
  fiscalYear: string;
  tenantId: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  validations: BudgetValidation[];
}

export interface BudgetValidation {
  id: string;
  budgetId: string;
  validatorId: string;
  validatorName: string;
  status: 'pending' | 'approved' | 'rejected';
  comment?: string;
  validatedAt?: Date;
  level: number;
}

export interface CreateBudgetRequest {
  title: string;
  description?: string;
  category: string;
  amount: number;
  fiscalYear: string;
}

export interface UpdateBudgetRequest {
  title?: string;
  description?: string;
  category?: string;
  amount?: number;
}

// Types pour les transactions
export interface Transaction {
  id: string;
  description: string;
  amount: number;
  type: 'credit' | 'debit';
  category: string;
  subcategory?: string;
  status: 'pending' | 'approved' | 'rejected' | 'completed';
  reference?: string;
  budgetId?: string;
  tenantId: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  validations: TransactionValidation[];
}

export interface TransactionValidation {
  id: string;
  transactionId: string;
  validatorId: string;
  validatorName: string;
  status: 'pending' | 'approved' | 'rejected';
  comment?: string;
  validatedAt?: Date;
  level: number;
}

export interface CreateTransactionRequest {
  description: string;
  amount: number;
  type: 'credit' | 'debit';
  category: string;
  subcategory?: string;
  reference?: string;
  budgetId?: string;
}

export interface UpdateTransactionRequest {
  description?: string;
  amount?: number;
  category?: string;
  subcategory?: string;
  reference?: string;
  budgetId?: string;
}

// Types pour les rapports
export interface FinancialReport {
  id: string;
  title: string;
  type: 'budget' | 'transaction' | 'cashflow' | 'consolidated';
  format: 'excel' | 'pdf';
  status: 'pending' | 'generating' | 'completed' | 'failed';
  filters: ReportFilters;
  generatedAt?: Date;
  downloadUrl?: string;
  tenantId: string;
  createdBy: string;
  createdAt: Date;
}

export interface ReportFilters {
  dateFrom?: Date;
  dateTo?: Date;
  category?: string;
  status?: string;
  budgetId?: string;
  tenantId?: string;
}

export interface CreateReportRequest {
  title: string;
  type: 'budget' | 'transaction' | 'cashflow' | 'consolidated';
  format: 'excel' | 'pdf';
  filters: ReportFilters;
}

// Types pour les métriques
export interface FinancialMetrics {
  totalBudget: number;
  totalSpent: number;
  totalRevenue: number;
  balance: number;
  budgetUtilization: number;
  monthlyTrend: Array<{
    month: string;
    budget: number;
    spent: number;
    revenue: number;
  }>;
  categoryBreakdown: Array<{
    category: string;
    budget: number;
    spent: number;
    percentage: number;
  }>;
  topTransactions: Transaction[];
  pendingValidations: number;
}

class FinancialService {
  private baseUrl = '/financial';

  // === BUDGETS ===

  /**
   * Récupère la liste des budgets
   */
  async getBudgets(params?: {
    page?: number;
    limit?: number;
    status?: string;
    category?: string;
    fiscalYear?: string;
    tenantId?: string;
  }): Promise<{
    budgets: Budget[];
    total: number;
    page: number;
    limit: number;
  }> {
    try {
      const queryParams = new URLSearchParams();
      if (params?.page) queryParams.append('page', params.page.toString());
      if (params?.limit) queryParams.append('limit', params.limit.toString());
      if (params?.status) queryParams.append('status', params.status);
      if (params?.category) queryParams.append('category', params.category);
      if (params?.fiscalYear) queryParams.append('fiscalYear', params.fiscalYear);
      if (params?.tenantId) queryParams.append('tenantId', params.tenantId);

      const response = await apiClient.get(`${this.baseUrl}/budgets?${queryParams.toString()}`);
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la récupération des budgets:', error);
      throw error;
    }
  }

  /**
   * Récupère un budget par ID
   */
  async getBudget(id: string): Promise<Budget> {
    try {
      const response = await apiClient.get(`${this.baseUrl}/budgets/${id}`);
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la récupération du budget:', error);
      throw error;
    }
  }

  /**
   * Crée un nouveau budget
   */
  async createBudget(data: CreateBudgetRequest): Promise<Budget> {
    try {
      const response = await apiClient.post(`${this.baseUrl}/budgets`, data);
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la création du budget:', error);
      throw error;
    }
  }

  /**
   * Met à jour un budget
   */
  async updateBudget(id: string, data: UpdateBudgetRequest): Promise<Budget> {
    try {
      const response = await apiClient.put(`${this.baseUrl}/budgets/${id}`, data);
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la mise à jour du budget:', error);
      throw error;
    }
  }

  /**
   * Supprime un budget
   */
  async deleteBudget(id: string): Promise<void> {
    try {
      await apiClient.delete(`${this.baseUrl}/budgets/${id}`);
    } catch (error) {
      console.error('Erreur lors de la suppression du budget:', error);
      throw error;
    }
  }

  /**
   * Valide un budget
   */
  async validateBudget(id: string, status: 'approved' | 'rejected', comment?: string): Promise<Budget> {
    try {
      const response = await apiClient.post(`${this.baseUrl}/budgets/${id}/validate`, {
        status,
        comment
      });
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la validation du budget:', error);
      throw error;
    }
  }

  // === TRANSACTIONS ===

  /**
   * Récupère la liste des transactions
   */
  async getTransactions(params?: {
    page?: number;
    limit?: number;
    type?: string;
    category?: string;
    status?: string;
    dateFrom?: Date;
    dateTo?: Date;
    tenantId?: string;
  }): Promise<{
    transactions: Transaction[];
    total: number;
    page: number;
    limit: number;
  }> {
    try {
      const queryParams = new URLSearchParams();
      if (params?.page) queryParams.append('page', params.page.toString());
      if (params?.limit) queryParams.append('limit', params.limit.toString());
      if (params?.type) queryParams.append('type', params.type);
      if (params?.category) queryParams.append('category', params.category);
      if (params?.status) queryParams.append('status', params.status);
      if (params?.dateFrom) queryParams.append('dateFrom', params.dateFrom.toISOString());
      if (params?.dateTo) queryParams.append('dateTo', params.dateTo.toISOString());
      if (params?.tenantId) queryParams.append('tenantId', params.tenantId);

      const response = await apiClient.get(`${this.baseUrl}/transactions?${queryParams.toString()}`);
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la récupération des transactions:', error);
      throw error;
    }
  }

  /**
   * Récupère une transaction par ID
   */
  async getTransaction(id: string): Promise<Transaction> {
    try {
      const response = await apiClient.get(`${this.baseUrl}/transactions/${id}`);
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la récupération de la transaction:', error);
      throw error;
    }
  }

  /**
   * Crée une nouvelle transaction
   */
  async createTransaction(data: CreateTransactionRequest): Promise<Transaction> {
    try {
      const response = await apiClient.post(`${this.baseUrl}/transactions`, data);
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la création de la transaction:', error);
      throw error;
    }
  }

  /**
   * Met à jour une transaction
   */
  async updateTransaction(id: string, data: UpdateTransactionRequest): Promise<Transaction> {
    try {
      const response = await apiClient.put(`${this.baseUrl}/transactions/${id}`, data);
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la mise à jour de la transaction:', error);
      throw error;
    }
  }

  /**
   * Supprime une transaction
   */
  async deleteTransaction(id: string): Promise<void> {
    try {
      await apiClient.delete(`${this.baseUrl}/transactions/${id}`);
    } catch (error) {
      console.error('Erreur lors de la suppression de la transaction:', error);
      throw error;
    }
  }

  /**
   * Valide une transaction
   */
  async validateTransaction(id: string, status: 'approved' | 'rejected', comment?: string): Promise<Transaction> {
    try {
      const response = await apiClient.post(`${this.baseUrl}/transactions/${id}/validate`, {
        status,
        comment
      });
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la validation de la transaction:', error);
      throw error;
    }
  }

  // === MÉTRIQUES ===

  /**
   * Récupère les métriques financières
   */
  async getMetrics(tenantId?: string): Promise<FinancialMetrics> {
    try {
      const params = tenantId ? `?tenantId=${tenantId}` : '';
      const response = await apiClient.get(`${this.baseUrl}/metrics${params}`);
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la récupération des métriques financières:', error);
      throw error;
    }
  }

  // === RAPPORTS ===

  /**
   * Récupère la liste des rapports
   */
  async getReports(params?: {
    page?: number;
    limit?: number;
    type?: string;
    status?: string;
    tenantId?: string;
  }): Promise<{
    reports: FinancialReport[];
    total: number;
    page: number;
    limit: number;
  }> {
    try {
      const queryParams = new URLSearchParams();
      if (params?.page) queryParams.append('page', params.page.toString());
      if (params?.limit) queryParams.append('limit', params.limit.toString());
      if (params?.type) queryParams.append('type', params.type);
      if (params?.status) queryParams.append('status', params.status);
      if (params?.tenantId) queryParams.append('tenantId', params.tenantId);

      const response = await apiClient.get(`${this.baseUrl}/reports?${queryParams.toString()}`);
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la récupération des rapports:', error);
      throw error;
    }
  }

  /**
   * Crée un nouveau rapport
   */
  async createReport(data: CreateReportRequest): Promise<FinancialReport> {
    try {
      const response = await apiClient.post(`${this.baseUrl}/reports`, data);
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la création du rapport:', error);
      throw error;
    }
  }

  /**
   * Télécharge un rapport
   */
  async downloadReport(id: string): Promise<Blob> {
    try {
      const response = await apiClient.get(`${this.baseUrl}/reports/${id}/download`, {
        responseType: 'blob'
      });
      return response.data;
    } catch (error) {
      console.error('Erreur lors du téléchargement du rapport:', error);
      throw error;
    }
  }

  /**
   * Récupère les catégories disponibles
   */
  async getCategories(): Promise<Array<{
    id: string;
    name: string;
    type: 'budget' | 'transaction';
    subcategories?: Array<{
      id: string;
      name: string;
    }>;
  }>> {
    try {
      const response = await apiClient.get(`${this.baseUrl}/categories`);
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la récupération des catégories:', error);
      throw error;
    }
  }
}

export const financialService = new FinancialService();

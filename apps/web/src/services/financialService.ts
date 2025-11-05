/**
 * FICHIER: apps/web/src/services/financialService.ts
 * SERVICE: FinancialService - Service de gestion financière CROU
 *
 * DESCRIPTION:
 * Service centralisé pour toutes les opérations financières
 * Gestion budgets, subventions, validations, rapports
 * Support multi-tenant avec permissions granulaires
 *
 * FONCTIONNALITÉS:
 * - Gestion budgets annuels et trimestriels
 * - Workflows de validation multiniveau
 * - Suivi subventions gouvernementales
 * - Rapports financiers automatisés
 * - Exports Excel/PDF
 *
 * AUTEUR: Équipe CROU
 * DATE: Décembre 2024
 */

import axios from 'axios';
import { User } from '@/stores/auth';

// ================================================================================================
// TYPES ET INTERFACES
// ================================================================================================

export interface Budget {
  id: string;
  crouId?: string; // null pour budget national Ministère
  exercice: number; // Année budgétaire
  type: 'national' | 'crou' | 'service';
  libelle: string;
  montantInitial: number;
  montantRealise: number;
  montantEngage: number;
  montantDisponible: number;
  tauxExecution: number;
  statut: 'draft' | 'submitted' | 'approved' | 'rejected' | 'active' | 'closed';

  // Métadonnées
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  approvedBy?: string;
  approvedAt?: string;

  // Workflow
  validationLevel: number; // 0=CROU, 1=Ministère
  nextValidator?: string;
  validationHistory: ValidationStep[];

  // Catégorisation
  categories: BudgetCategory[];
  trimestres: BudgetTrimester[];
}

export interface BudgetCategory {
  id: string;
  budgetId: string;
  nom: string;
  code: string; // Ex: "ALIM", "LOG", "TRANS", "ADMIN"
  montantInitial: number;
  montantRealise: number;
  montantEngage: number;
  pourcentage: number;
  seuils: {
    alerte: number; // % d'alerte
    critique: number; // % critique
  };
}

export interface BudgetTrimester {
  id: string;
  budgetId: string;
  trimestre: 1 | 2 | 3 | 4;
  montantPrevu: number;
  montantRealise: number;
  ecartAbsolu: number;
  ecartPourcentage: number;
  statut: 'pending' | 'in_progress' | 'completed' | 'closed';
}

export interface Subvention {
  id: string;
  crouId?: string; // null pour subventions nationales
  exercice: number;
  trimestre: 1 | 2 | 3 | 4;
  type: 'fonctionnement' | 'investissement' | 'social' | 'exceptionnelle';
  libelle: string;

  // Montants
  montantDemande: number;
  montantAccorde: number;
  montantVerse: number;
  montantRestant: number;

  // Statuts et workflow
  statut: 'draft' | 'submitted' | 'reviewed' | 'approved' | 'disbursed' | 'completed';
  dateSubmission?: string;
  dateApproval?: string;
  dateDisbursement?: string;

  // Documents et justifications
  documentsRequis: string[];
  documentsUploaded: string[];
  justifications: string;
  observations?: string;

  // Workflow de validation
  validationHistory: ValidationStep[];
  nextValidator?: string;
}

export interface ValidationStep {
  id: string;
  entityId: string; // ID du budget ou subvention
  entityType: 'budget' | 'subvention';
  level: number;
  validatorId: string;
  validatorName: string;
  validatorRole: string;
  action: 'submit' | 'approve' | 'reject' | 'request_changes';
  commentaire?: string;
  timestamp: string;

  // Données de validation
  documentsChecked?: string[];
  amountValidated?: number;
  conditions?: string[];
}

export interface FinancialTransaction {
  id: string;
  crouId?: string;
  budgetId: string;
  categoryId: string;

  // Transaction details
  date: string;
  montant: number;
  type: 'engagement' | 'realisation' | 'annulation' | 'virement';
  libelle: string;
  description?: string;
  pieceJustificative: string;

  // Références
  fournisseur?: string;
  numeroPiece: string;
  numeroCommande?: string;

  // Validation
  statut: 'draft' | 'pending' | 'approved' | 'rejected' | 'paid';
  validatedBy?: string;
  validatedAt?: string;

  createdBy: string;
  createdAt: string;
}

export interface FinancialReport {
  id: string;
  type: 'budget_execution' | 'subvention_status' | 'category_analysis' | 'comparative';
  periode: {
    debut: string;
    fin: string;
  };
  crouIds: string[]; // Vide pour rapport national

  // Configuration
  filters: {
    categories?: string[];
    seuils?: { min: number; max: number };
    statuts?: string[];
  };

  // Données générées
  data: any; // Structure dépend du type de rapport
  generatedAt: string;
  generatedBy: string;

  // Export
  formats: ('excel' | 'pdf')[];
  downloadUrls: Record<string, string>;
}

export interface FinancialFilters {
  crouIds?: string[];
  exercice?: number;
  trimestre?: number;
  categories?: string[];
  statuts?: string[];
  dateDebut?: Date;
  dateFin?: Date;
  montantMin?: number;
  montantMax?: number;
  validationLevel?: number;
}

// ================================================================================================
// SERVICE PRINCIPAL
// ================================================================================================

class FinancialService {
  private static instance: FinancialService;
  private cache = new Map<string, { data: any; timestamp: number; ttl: number }>();

  // Cache TTL selon criticité des données
  private readonly CACHE_TTL = {
    budgets: 5 * 60 * 1000, // 5 minutes
    subventions: 3 * 60 * 1000, // 3 minutes
    transactions: 1 * 60 * 1000, // 1 minute
    reports: 15 * 60 * 1000, // 15 minutes
    categories: 30 * 60 * 1000 // 30 minutes
  };

  // Endpoints API
  private readonly endpoints = {
    budgets: '/financial/budgets',
    subventions: '/financial/subventions',
    transactions: '/financial/transactions',
    validation: '/financial/validation',
    reports: '/financial/reports',
    categories: '/financial/categories',
    export: '/financial/export'
  };

  public static getInstance(): FinancialService {
    if (!FinancialService.instance) {
      FinancialService.instance = new FinancialService();
    }
    return FinancialService.instance;
  }

  // ================================================================================================
  // GESTION CACHE
  // ================================================================================================

  private getCacheKey(endpoint: string, params?: any): string {
    return `financial_${endpoint}_${JSON.stringify(params || {})}`;
  }

  private setCache(key: string, data: any, ttl: number): void {
    this.cache.set(key, { data, timestamp: Date.now(), ttl });
  }

  private getCache(key: string): any | null {
    const cached = this.cache.get(key);
    if (!cached || Date.now() - cached.timestamp > cached.ttl) {
      this.cache.delete(key);
      return null;
    }
    return cached.data;
  }

  private async request<T>(endpoint: string, params?: any, cacheTTL?: number): Promise<T> {
    const cacheKey = this.getCacheKey(endpoint, params);

    if (cacheTTL) {
      const cached = this.getCache(cacheKey);
      if (cached) return cached;
    }

    try {
      const response = await axios.get(endpoint, { params });
      const data = response.data;

      if (cacheTTL) {
        this.setCache(cacheKey, data, cacheTTL);
      }

      return data;
    } catch (error: any) {
      console.error(`Erreur Financial API ${endpoint}:`, error);

      // Fallback sur cache expiré en cas d'erreur
      const staleCache = this.cache.get(cacheKey);
      if (staleCache) {
        console.warn(`Utilisation cache expiré pour ${endpoint}`);
        return staleCache.data;
      }

      throw error;
    }
  }

  // ================================================================================================
  // GESTION BUDGETS
  // ================================================================================================

  async getBudgets(user: User, filters?: FinancialFilters): Promise<Budget[]> {
    const params = {
      level: user.level,
      crouId: user.level === 'crou' ? user.crouId : undefined,
      crouIds: filters?.crouIds?.join(','),
      exercice: filters?.exercice || new Date().getFullYear(),
      trimestre: filters?.trimestre,
      statuts: filters?.statuts?.join(',')
    };

    return this.request<Budget[]>(
      this.endpoints.budgets,
      params,
      this.CACHE_TTL.budgets
    );
  }

  async getBudget(id: string): Promise<Budget> {
    return this.request<Budget>(
      `${this.endpoints.budgets}/${id}`,
      undefined,
      this.CACHE_TTL.budgets
    );
  }

  async createBudget(budget: Partial<Budget>): Promise<Budget> {
    try {
      const response = await axios.post(this.endpoints.budgets, budget);
      this.clearBudgetCache();
      return response.data;
    } catch (error: any) {
      console.error('Erreur création budget:', error);
      throw new Error(error.response?.data?.message || 'Erreur lors de la création du budget');
    }
  }

  async updateBudget(id: string, updates: Partial<Budget>): Promise<Budget> {
    try {
      const response = await axios.put(`${this.endpoints.budgets}/${id}`, updates);
      this.clearBudgetCache();
      return response.data;
    } catch (error: any) {
      console.error('Erreur mise à jour budget:', error);
      throw new Error(error.response?.data?.message || 'Erreur lors de la mise à jour du budget');
    }
  }

  async submitBudgetForApproval(id: string, comment?: string): Promise<Budget> {
    try {
      const response = await axios.post(`${this.endpoints.validation}/budget/${id}/submit`, {
        comment
      });
      this.clearBudgetCache();
      return response.data;
    } catch (error: any) {
      console.error('Erreur soumission budget:', error);
      throw new Error(error.response?.data?.message || 'Erreur lors de la soumission du budget');
    }
  }

  // ================================================================================================
  // GESTION SUBVENTIONS
  // ================================================================================================

  async getSubventions(user: User, filters?: FinancialFilters): Promise<Subvention[]> {
    const params = {
      level: user.level,
      crouId: user.level === 'crou' ? user.crouId : undefined,
      crouIds: filters?.crouIds?.join(','),
      exercice: filters?.exercice || new Date().getFullYear(),
      trimestre: filters?.trimestre,
      statuts: filters?.statuts?.join(',')
    };

    return this.request<Subvention[]>(
      this.endpoints.subventions,
      params,
      this.CACHE_TTL.subventions
    );
  }

  async createSubvention(subvention: Partial<Subvention>): Promise<Subvention> {
    try {
      const response = await axios.post(this.endpoints.subventions, subvention);
      this.clearSubventionCache();
      return response.data;
    } catch (error: any) {
      console.error('Erreur création subvention:', error);
      throw new Error(error.response?.data?.message || 'Erreur lors de la création de la subvention');
    }
  }

  async submitSubventionForApproval(id: string, documents: string[], comment?: string): Promise<Subvention> {
    try {
      const response = await axios.post(`${this.endpoints.validation}/subvention/${id}/submit`, {
        documents,
        comment
      });
      this.clearSubventionCache();
      return response.data;
    } catch (error: any) {
      console.error('Erreur soumission subvention:', error);
      throw new Error(error.response?.data?.message || 'Erreur lors de la soumission de la subvention');
    }
  }

  // ================================================================================================
  // WORKFLOWS DE VALIDATION
  // ================================================================================================

  async approveBudget(id: string, userId: string, comment?: string): Promise<Budget> {
    try {
      const response = await axios.post(`${this.endpoints.validation}/budget/${id}/approve`, {
        userId,
        comment,
        timestamp: new Date().toISOString()
      });
      this.clearBudgetCache();
      return response.data;
    } catch (error: any) {
      console.error('Erreur approbation budget:', error);
      throw new Error(error.response?.data?.message || 'Erreur lors de l\'approbation du budget');
    }
  }

  async rejectBudget(id: string, userId: string, comment: string): Promise<Budget> {
    try {
      const response = await axios.post(`${this.endpoints.validation}/budget/${id}/reject`, {
        userId,
        comment,
        timestamp: new Date().toISOString()
      });
      this.clearBudgetCache();
      return response.data;
    } catch (error: any) {
      console.error('Erreur rejet budget:', error);
      throw new Error(error.response?.data?.message || 'Erreur lors du rejet du budget');
    }
  }

  async approveSubvention(id: string, userId: string, montantAccorde?: number, comment?: string): Promise<Subvention> {
    try {
      const response = await axios.post(`${this.endpoints.validation}/subvention/${id}/approve`, {
        userId,
        montantAccorde,
        comment,
        timestamp: new Date().toISOString()
      });
      this.clearSubventionCache();
      return response.data;
    } catch (error: any) {
      console.error('Erreur approbation subvention:', error);
      throw new Error(error.response?.data?.message || 'Erreur lors de l\'approbation de la subvention');
    }
  }

  // ================================================================================================
  // TRANSACTIONS FINANCIÈRES
  // ================================================================================================

  async getTransactions(budgetId: string, filters?: FinancialFilters): Promise<FinancialTransaction[]> {
    // Si un exercice est fourni, définir les dates de début et fin de l'année
    let dateDebut = filters?.dateDebut;
    let dateFin = filters?.dateFin;

    if (filters?.exercice && !dateDebut && !dateFin) {
      dateDebut = new Date(filters.exercice, 0, 1); // 1er janvier
      dateFin = new Date(filters.exercice, 11, 31, 23, 59, 59); // 31 décembre
    }

    const params = {
      budgetId: budgetId || undefined,
      dateDebut: dateDebut?.toISOString(),
      dateFin: dateFin?.toISOString(),
      categories: filters?.categories?.join(','),
      statuts: filters?.statuts?.join(','),
      montantMin: filters?.montantMin,
      montantMax: filters?.montantMax
    };

    return this.request<FinancialTransaction[]>(
      this.endpoints.transactions,
      params,
      this.CACHE_TTL.transactions
    );
  }

  async createTransaction(transaction: Partial<FinancialTransaction>): Promise<FinancialTransaction> {
    try {
      const response = await axios.post(this.endpoints.transactions, transaction);
      this.clearTransactionCache();
      this.clearBudgetCache(); // Invalider aussi les budgets car montants changent
      return response.data;
    } catch (error: any) {
      console.error('Erreur création transaction:', error);
      throw new Error(error.response?.data?.message || 'Erreur lors de la création de la transaction');
    }
  }

  async getTransaction(id: string): Promise<FinancialTransaction> {
    return this.request<FinancialTransaction>(
      `${this.endpoints.transactions}/${id}`,
      undefined,
      this.CACHE_TTL.transactions
    );
  }

  async updateTransaction(id: string, updates: Partial<FinancialTransaction>): Promise<FinancialTransaction> {
    try {
      const response = await axios.put(`${this.endpoints.transactions}/${id}`, updates);
      this.clearTransactionCache();
      this.clearBudgetCache();
      return response.data;
    } catch (error: any) {
      console.error('Erreur mise à jour transaction:', error);
      throw new Error(error.response?.data?.message || 'Erreur lors de la mise à jour de la transaction');
    }
  }

  async deleteTransaction(id: string): Promise<void> {
    try {
      await axios.delete(`${this.endpoints.transactions}/${id}`);
      this.clearTransactionCache();
      this.clearBudgetCache();
    } catch (error: any) {
      console.error('Erreur suppression transaction:', error);
      throw new Error(error.response?.data?.message || 'Erreur lors de la suppression de la transaction');
    }
  }

  async submitTransaction(id: string): Promise<FinancialTransaction> {
    try {
      const response = await axios.post(`${this.endpoints.transactions}/${id}/validate`, {
        action: 'submit'
      });
      this.clearTransactionCache();
      return response.data;
    } catch (error: any) {
      console.error('Erreur soumission transaction:', error);
      throw new Error(error.response?.data?.message || 'Erreur lors de la soumission de la transaction');
    }
  }

  async approveTransaction(id: string): Promise<FinancialTransaction> {
    try {
      const response = await axios.post(`${this.endpoints.transactions}/${id}/validate`, {
        action: 'approve'
      });
      this.clearTransactionCache();
      this.clearBudgetCache();
      return response.data;
    } catch (error: any) {
      console.error('Erreur approbation transaction:', error);
      throw new Error(error.response?.data?.message || 'Erreur lors de l\'approbation de la transaction');
    }
  }

  async rejectTransaction(id: string, reason: string): Promise<FinancialTransaction> {
    try {
      const response = await axios.post(`${this.endpoints.transactions}/${id}/validate`, {
        action: 'reject',
        reason
      });
      this.clearTransactionCache();
      return response.data;
    } catch (error: any) {
      console.error('Erreur rejet transaction:', error);
      throw new Error(error.response?.data?.message || 'Erreur lors du rejet de la transaction');
    }
  }

  async executeTransaction(id: string): Promise<FinancialTransaction> {
    try {
      const response = await axios.post(`${this.endpoints.transactions}/${id}/validate`, {
        action: 'execute'
      });
      this.clearTransactionCache();
      this.clearBudgetCache();
      return response.data;
    } catch (error: any) {
      console.error('Erreur exécution transaction:', error);
      throw new Error(error.response?.data?.message || 'Erreur lors de l\'exécution de la transaction');
    }
  }

  async getTransactionStats(budgetId?: string): Promise<any> {
    const params = budgetId ? { budgetId } : {};
    return this.request<any>(
      `${this.endpoints.transactions}/stats`,
      params,
      this.CACHE_TTL.transactions
    );
  }

  // ================================================================================================
  // RAPPORTS FINANCIERS
  // ================================================================================================

  async generateFinancialReport(
    type: FinancialReport['type'],
    periode: { debut: Date; fin: Date },
    crouIds: string[] = [],
    filters?: FinancialFilters
  ): Promise<FinancialReport> {
    try {
      const response = await axios.post(this.endpoints.reports, {
        type,
        periode: {
          debut: periode.debut.toISOString(),
          fin: periode.fin.toISOString()
        },
        crouIds,
        filters
      });
      return response.data;
    } catch (error: any) {
      console.error('Erreur génération rapport:', error);
      throw new Error(error.response?.data?.message || 'Erreur lors de la génération du rapport');
    }
  }

  async exportReport(reportId: string, format: 'excel' | 'pdf'): Promise<string> {
    try {
      const response = await axios.post(`${this.endpoints.export}/${reportId}`, {
        format
      }, {
        responseType: 'blob'
      });

      // Créer URL de téléchargement
      const blob = new Blob([response.data]);
      const url = window.URL.createObjectURL(blob);
      return url;
    } catch (error: any) {
      console.error('Erreur export rapport:', error);
      throw new Error(error.response?.data?.message || 'Erreur lors de l\'export du rapport');
    }
  }

  // ================================================================================================
  // GESTION CACHE
  // ================================================================================================

  clearBudgetCache(): void {
    const keys = Array.from(this.cache.keys()).filter(key => key.includes('budgets'));
    keys.forEach(key => this.cache.delete(key));
  }

  clearSubventionCache(): void {
    const keys = Array.from(this.cache.keys()).filter(key => key.includes('subventions'));
    keys.forEach(key => this.cache.delete(key));
  }

  clearTransactionCache(): void {
    const keys = Array.from(this.cache.keys()).filter(key => key.includes('transactions'));
    keys.forEach(key => this.cache.delete(key));
  }

  clearAllCache(): void {
    this.cache.clear();
  }
}

// ================================================================================================
// UTILITAIRES FINANCIERS
// ================================================================================================

export const FinancialUtils = {
  // Calculer le taux d'exécution budgétaire
  calculateExecutionRate: (realise: number, initial: number): number => {
    return initial > 0 ? Math.round((realise / initial) * 100) : 0;
  },

  // Calculer l'écart budgétaire
  calculateVariance: (realise: number, prevu: number): { absolute: number; percentage: number } => {
    const absolute = realise - prevu;
    const percentage = prevu > 0 ? Math.round((absolute / prevu) * 100) : 0;
    return { absolute, percentage };
  },

  // Formater montant en FCFA
  formatCurrency: (amount: number): string => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XOF',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  },

  // Déterminer le niveau d'alerte selon seuils
  getAlertLevel: (percentage: number, seuils: { alerte: number; critique: number }): 'normal' | 'warning' | 'critical' => {
    if (percentage >= seuils.critique) return 'critical';
    if (percentage >= seuils.alerte) return 'warning';
    return 'normal';
  },

  // Valider montant selon rôle utilisateur
  validateAmount: (amount: number, userRole: string): { valid: boolean; message?: string } => {
    const limits: Record<string, number> = {
      'comptable': 1000000, // 1M FCFA
      'chef_financier': 10000000, // 10M FCFA
      'directeur': 50000000, // 50M FCFA
      'directeur_finances': Number.MAX_SAFE_INTEGER
    };

    const limit = limits[userRole] || 0;
    if (amount > limit) {
      return {
        valid: false,
        message: `Montant dépassant votre limite d'autorisation (${FinancialUtils.formatCurrency(limit)})`
      };
    }

    return { valid: true };
  }
};

// Instance singleton
export const financialService = FinancialService.getInstance();
export default financialService;

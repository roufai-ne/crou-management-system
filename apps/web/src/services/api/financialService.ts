/**
 * FICHIER: apps/web/src/services/api/financialService.consolidated.ts
 * SERVICE: FinancialService - Service consolidé pour les données financières
 *
 * DESCRIPTION:
 * Service unifié pour la gestion financière complète
 * Fusion des fonctionnalités simples (API) et complexes (business logic)
 * Support multi-tenant avec permissions granulaires
 *
 * FONCTIONNALITÉS:
 * - Gestion des budgets (création, modification, validation, workflows)
 * - Gestion des transactions (recettes, dépenses, validations)
 * - Gestion des subventions gouvernementales
 * - Rapports financiers (Excel, PDF)
 * - Workflows de validation multiniveau
 * - Cache intelligent avec TTL
 *
 * AUTEUR: Équipe CROU
 * DATE: Décembre 2024
 * VERSION: 2.0 (Consolidée)
 */

import { apiClient } from './apiClient';
import { User } from '@/stores/auth';

// ================================================================================================
// TYPES ET INTERFACES
// ================================================================================================

// --- BUDGETS ---

// Types des budgets selon backend
export enum BudgetType {
  NATIONAL = 'national',      // Budget national Ministère
  CROU = 'crou',             // Budget CROU régional
  SERVICE = 'service'         // Budget par service
}

export enum BudgetStatus {
  DRAFT = 'draft',           // Brouillon
  SUBMITTED = 'submitted',   // Soumis pour validation
  APPROVED = 'approved',     // Approuvé
  REJECTED = 'rejected',     // Rejeté
  ACTIVE = 'active',         // En cours d'exécution
  CLOSED = 'closed'          // Clôturé
}

export interface Budget {
  id: string;

  // Identification
  tenantId: string; // CROU ou Ministère
  exercice: number; // Année budgétaire

  // Type et libellé
  type: BudgetType; // national, crou, service
  libelle: string;
  description?: string | null;

  // Montants
  montantInitial: number;
  montantRealise: number;
  montantEngage: number;
  montantDisponible: number;
  tauxExecution: number; // Pourcentage 0-100

  // Statut
  status: BudgetStatus; // draft, submitted, approved, rejected, active, closed

  // Workflow
  validationLevel: number; // 0=CROU, 1=Ministère
  nextValidator?: string | null;

  // Métadonnées
  createdBy: string;
  approvedBy?: string | null;
  approvedAt?: Date | string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
  updatedBy?: string | null;

  // Relations
  tenant?: any;
  categories?: BudgetCategory[];
  trimestres?: BudgetTrimester[];
  transactions?: any[];
  validationSteps?: ValidationStep[];

  // Aliases pour compatibilité avec ancien code
  title?: string; // OLD: used title instead of libelle
  category?: string; // OLD: had single category string (now categories array)
  amount?: number; // OLD: used amount instead of montantInitial
  spent?: number; // OLD: used spent instead of montantRealise
  remaining?: number; // OLD: used remaining instead of montantDisponible
  fiscalYear?: string; // OLD: used fiscalYear string instead of exercice number
  statut?: BudgetStatus; // OLD: used statut
  validations?: BudgetValidation[]; // For backward compatibility
  validationHistory?: ValidationStep[]; // Alias
}

export interface BudgetCategory {
  id: string;
  budgetId: string;
  nom: string;
  name: string; // Alias pour compatibilité
  code: string; // Ex: "ALIM", "LOG", "TRANS", "ADMIN"
  montantInitial: number;
  montantRealise: number;
  montantEngage: number;
  pourcentage: number;
  percentage: number; // Alias pour compatibilité
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

export interface BudgetValidation {
  id: string;
  budgetId: string;
  validatorId: string;
  validatorName: string;
  validatorRole?: string;
  status: 'pending' | 'approved' | 'rejected';
  comment?: string;
  validatedAt?: Date | string;
  level: number;
}

export interface ValidationStep {
  id: string;
  entityId: string; // ID du budget ou subvention
  entityType: 'budget' | 'subvention' | 'transaction';
  level: number;
  validatorId: string;
  validatorName: string;
  validatorRole: string;
  action: 'submit' | 'approve' | 'reject' | 'request_changes';
  commentaire?: string;
  comment?: string; // Alias pour compatibilité
  timestamp: string | Date;

  // Données de validation
  documentsChecked?: string[];
  amountValidated?: number;
  conditions?: string[];
}

export interface CreateBudgetRequest {
  // Champs principaux (backend)
  exercice: number; // Année budgétaire (required)
  type: BudgetType; // national, crou, service (required)
  libelle: string; // Libellé du budget (required)
  description?: string;
  montantInitial: number; // Montant initial alloué (required)

  // Catégories et trimestres optionnels
  categories?: Array<{
    nom: string;
    code: string;
    montantInitial: number;
    pourcentage: number;
  }>;
  trimestres?: Array<{
    trimestre: 1 | 2 | 3 | 4;
    montantPrevu: number;
  }>;
}

export interface UpdateBudgetRequest {
  libelle?: string;
  description?: string;
  montantInitial?: number;
  status?: BudgetStatus;
}

// --- SUBVENTIONS ---

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

// --- TRANSACTIONS ---

// Types de transactions selon backend
export enum TransactionType {
  DEPENSE = 'depense',           // Sortie d'argent
  RECETTE = 'recette',           // Entrée d'argent
  ENGAGEMENT = 'engagement',     // Réservation de budget
  AJUSTEMENT = 'ajustement',     // Correction budgétaire
  VIREMENT = 'virement'          // Virement interne
}

export enum TransactionStatus {
  DRAFT = 'draft',               // Brouillon
  SUBMITTED = 'submitted',       // Soumis pour validation
  APPROVED = 'approved',         // Approuvé
  REJECTED = 'rejected',         // Rejeté
  EXECUTED = 'executed',         // Exécuté
  CANCELLED = 'cancelled'        // Annulé
}

export enum TransactionCategory {
  // Dépenses
  SALAIRES = 'salaires',
  FOURNITURES = 'fournitures',
  MAINTENANCE = 'maintenance',
  TRANSPORT = 'transport',
  COMMUNICATION = 'communication',
  FORMATION = 'formation',
  EQUIPEMENT = 'equipement',
  TRAVAUX = 'travaux',
  // Recettes
  LOYERS = 'loyers',
  TICKETS = 'tickets',
  SUBVENTIONS = 'subventions',
  AUTRES = 'autres'
}

export interface Transaction {
  id: string;

  // Identification
  tenantId: string;
  budgetId: string;
  budgetCategoryId?: string | null;

  // Informations de base (BACKEND USES libelle as PRIMARY)
  libelle: string; // PRIMARY - Libellé de la transaction
  description?: string | null; // SECONDARY - Description détaillée

  // Type et catégorie
  type: TransactionType; // depense, recette, engagement, ajustement, virement
  category: TransactionCategory; // salaires, fournitures, maintenance, etc.
  status: TransactionStatus; // draft, submitted, approved, rejected, executed, cancelled

  // Montants (BACKEND USES montant as PRIMARY)
  montant: number; // PRIMARY - Montant en FCFA
  devise: string; // XOF par défaut
  montantDevise?: number | null; // Montant dans la devise d'origine
  tauxChange?: number | null; // Taux de change

  // Informations de paiement
  numeroPiece?: string | null; // Numéro de pièce comptable
  reference?: string | null; // Référence externe
  beneficiaire?: string | null; // Bénéficiaire du paiement
  modePaiement?: string | null; // Virement, chèque, espèces

  // Dates
  date: Date | string; // Date de l'opération
  dateEcheance?: Date | string | null; // Date d'échéance pour engagements
  dateExecution?: Date | string | null; // Date d'exécution effective

  // Workflow de validation
  validationLevel: number; // Niveau de validation requis
  nextValidator?: string | null; // Prochain validateur

  // Métadonnées
  createdBy: string;
  approvedBy?: string | null;
  approvedAt?: Date | string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
  updatedBy?: string | null;

  // Relations
  tenant?: any;
  budget?: any;
  budgetCategory?: any;
  creator?: any;
  validationSteps?: ValidationStep[];

  // Aliases pour compatibilité avec ancien code
  description_legacy?: string; // OLD: description was primary
  amount?: number; // OLD: amount was primary
  fournisseur?: string; // OLD: used fournisseur instead of beneficiaire
}

export interface TransactionValidation {
  id: string;
  transactionId: string;
  validatorId: string;
  validatorName: string;
  status: 'pending' | 'approved' | 'rejected';
  comment?: string;
  validatedAt?: Date | string;
  level: number;
}

export interface FinancialTransaction extends Transaction {
  // Extension avec tous les champs de la version complexe
}

export interface CreateTransactionRequest {
  // Champs principaux (backend)
  libelle: string; // PRIMARY - required
  description?: string; // SECONDARY - optional
  montant: number; // PRIMARY - required
  type: TransactionType; // depense, recette, engagement, ajustement, virement
  category: TransactionCategory; // salaires, fournitures, etc.

  // IDs
  budgetId: string;
  budgetCategoryId?: string;

  // Devise et montants
  devise?: string; // XOF par défaut
  montantDevise?: number;
  tauxChange?: number;

  // Informations de paiement
  numeroPiece?: string;
  reference?: string;
  beneficiaire?: string;
  modePaiement?: string;

  // Dates
  date: string | Date;
  dateEcheance?: string | Date;
}

export interface UpdateTransactionRequest {
  libelle?: string;
  description?: string;
  montant?: number;
  type?: TransactionType;
  category?: TransactionCategory;
  budgetId?: string;
  budgetCategoryId?: string;
  devise?: string;
  montantDevise?: number;
  tauxChange?: number;
  numeroPiece?: string;
  reference?: string;
  beneficiaire?: string;
  modePaiement?: string;
  date?: string | Date;
  dateEcheance?: string | Date;
}

// --- RAPPORTS ---

export interface FinancialReport {
  id: string;
  title: string;
  type: 'budget' | 'transaction' | 'cashflow' | 'consolidated' | 'budget_execution' | 'subvention_status' | 'category_analysis' | 'comparative';
  format: 'excel' | 'pdf';
  status: 'pending' | 'generating' | 'completed' | 'failed';

  // Période et filtres
  periode?: {
    debut: string;
    fin: string;
  };
  filters: ReportFilters;

  // Données et métadonnées
  data?: any; // Structure dépend du type de rapport
  generatedAt?: Date | string;
  downloadUrl?: string;
  downloadUrls?: Record<string, string>;

  // Identification
  tenantId: string;
  crouIds?: string[]; // Vide pour rapport national
  createdBy: string;
  createdAt: Date | string;
  generatedBy?: string; // Alias

  // Export
  formats?: ('excel' | 'pdf')[];
}

export interface ReportFilters {
  dateFrom?: Date | string;
  dateTo?: Date | string;
  dateDebut?: Date | string; // Alias
  dateFin?: Date | string; // Alias
  category?: string;
  categories?: string[];
  status?: string;
  statuts?: string[];
  budgetId?: string;
  tenantId?: string;
  crouIds?: string[];
  exercice?: number;
  trimestre?: number;
  montantMin?: number;
  montantMax?: number;
  validationLevel?: number;
  seuils?: { min: number; max: number };
}

export interface CreateReportRequest {
  title: string;
  type: 'budget' | 'transaction' | 'cashflow' | 'consolidated' | 'budget_execution' | 'subvention_status' | 'category_analysis' | 'comparative';
  format: 'excel' | 'pdf';
  formats?: ('excel' | 'pdf')[];
  filters: ReportFilters;
  periode?: {
    debut: Date | string;
    fin: Date | string;
  };
  crouIds?: string[];
}

// --- MÉTRIQUES ---

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

export interface FinancialFilters {
  crouIds?: string[];
  exercice?: number;
  trimestre?: number;
  categories?: string[];
  statuts?: string[];
  dateDebut?: Date | string;
  dateFin?: Date | string;
  dateFrom?: Date | string; // Alias
  dateTo?: Date | string; // Alias
  montantMin?: number;
  montantMax?: number;
  validationLevel?: number;
  page?: number;
  limit?: number;
  status?: string;
  category?: string;
  fiscalYear?: string;
  tenantId?: string;
  type?: string;
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
    categories: 30 * 60 * 1000, // 30 minutes
    metrics: 2 * 60 * 1000 // 2 minutes
  };

  // Endpoints API
  private readonly baseUrl = '/financial';
  private readonly endpoints = {
    budgets: `${this.baseUrl}/budgets`,
    subventions: `${this.baseUrl}/subventions`,
    transactions: `${this.baseUrl}/transactions`,
    validation: `${this.baseUrl}/validation`,
    reports: `${this.baseUrl}/reports`,
    categories: `${this.baseUrl}/categories`,
    metrics: `${this.baseUrl}/metrics`,
    export: `${this.baseUrl}/export`
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

  // ================================================================================================
  // GESTION BUDGETS
  // ================================================================================================

  /**
   * Récupère la liste des budgets
   * Support pour les deux signatures (simple et avec User)
   */
  async getBudgets(
    userOrParams?: User | FinancialFilters,
    filters?: FinancialFilters
  ): Promise<Budget[] | { budgets: Budget[]; total: number; page: number; limit: number }> {
    try {
      // Déterminer si c'est un User ou des params
      let params: any = {};

      if (userOrParams && 'level' in userOrParams) {
        // C'est un User (version complexe)
        const user = userOrParams as User;
        params = {
          level: user.level,
          crouId: user.level === 'crou' ? user.crouId : undefined,
          crouIds: filters?.crouIds?.join(','),
          exercice: filters?.exercice || new Date().getFullYear(),
          trimestre: filters?.trimestre,
          statuts: filters?.statuts?.join(',')
        };
      } else {
        // Ce sont des params directs (version simple)
        const filterParams = (userOrParams as FinancialFilters) || {};
        params = {
          page: filterParams.page,
          limit: filterParams.limit,
          status: filterParams.status,
          category: filterParams.category,
          fiscalYear: filterParams.fiscalYear,
          tenantId: filterParams.tenantId
        };
      }

      // Vérifier le cache
      const cacheKey = this.getCacheKey('budgets', params);
      const cached = this.getCache(cacheKey);
      if (cached) return cached;

      // Construire query string
      const queryParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, String(value));
        }
      });

      const response = await apiClient.get(`${this.endpoints.budgets}?${queryParams.toString()}`);
      const data = response.data;

      // Mettre en cache
      this.setCache(cacheKey, data, this.CACHE_TTL.budgets);

      return data;
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
      const cacheKey = this.getCacheKey(`budget_${id}`);
      const cached = this.getCache(cacheKey);
      if (cached) return cached;

      const response = await apiClient.get(`${this.endpoints.budgets}/${id}`);
      const data = response.data;

      this.setCache(cacheKey, data, this.CACHE_TTL.budgets);
      return data;
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
      const response = await apiClient.post(this.endpoints.budgets, data);
      this.clearBudgetCache();
      return response.data;
    } catch (error: any) {
      console.error('Erreur lors de la création du budget:', error);
      throw new Error(error.response?.data?.message || 'Erreur lors de la création du budget');
    }
  }

  /**
   * Met à jour un budget
   */
  async updateBudget(id: string, data: UpdateBudgetRequest): Promise<Budget> {
    try {
      const response = await apiClient.put(`${this.endpoints.budgets}/${id}`, data);
      this.clearBudgetCache();
      return response.data;
    } catch (error: any) {
      console.error('Erreur lors de la mise à jour du budget:', error);
      throw new Error(error.response?.data?.message || 'Erreur lors de la mise à jour du budget');
    }
  }

  /**
   * Supprime un budget
   */
  async deleteBudget(id: string): Promise<void> {
    try {
      await apiClient.delete(`${this.endpoints.budgets}/${id}`);
      this.clearBudgetCache();
    } catch (error) {
      console.error('Erreur lors de la suppression du budget:', error);
      throw error;
    }
  }

  /**
   * Valide un budget (version simple)
   */
  async validateBudget(id: string, status: 'approved' | 'rejected', comment?: string): Promise<Budget> {
    try {
      const response = await apiClient.post(`${this.endpoints.budgets}/${id}/validate`, {
        status,
        comment
      });
      this.clearBudgetCache();
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la validation du budget:', error);
      throw error;
    }
  }

  /**
   * Soumet un budget pour approbation
   */
  async submitBudgetForApproval(id: string, comment?: string): Promise<Budget> {
    try {
      const response = await apiClient.post(`${this.endpoints.validation}/budget/${id}/submit`, {
        comment
      });
      this.clearBudgetCache();
      return response.data;
    } catch (error: any) {
      console.error('Erreur soumission budget:', error);
      throw new Error(error.response?.data?.message || 'Erreur lors de la soumission du budget');
    }
  }

  /**
   * Approuve un budget (workflow)
   */
  async approveBudget(id: string, userId: string, comment?: string): Promise<Budget> {
    try {
      const response = await apiClient.post(`${this.endpoints.validation}/budget/${id}/approve`, {
        userId,
        comment,
        timestamp: new Date().toISOString()
      });
      this.clearBudgetCache();
      return response.data;
    } catch (error: any) {
      console.error('Erreur approbation budget:', error);
      throw new Error(error.response?.data?.message || "Erreur lors de l'approbation du budget");
    }
  }

  /**
   * Rejette un budget (workflow)
   */
  async rejectBudget(id: string, userId: string, comment: string): Promise<Budget> {
    try {
      const response = await apiClient.post(`${this.endpoints.validation}/budget/${id}/reject`, {
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

  // ================================================================================================
  // GESTION SUBVENTIONS
  // ================================================================================================

  /**
   * Récupère la liste des subventions
   */
  async getSubventions(user: User, filters?: FinancialFilters): Promise<Subvention[]> {
    try {
      const params = {
        level: user.level,
        crouId: user.level === 'crou' ? user.crouId : undefined,
        crouIds: filters?.crouIds?.join(','),
        exercice: filters?.exercice || new Date().getFullYear(),
        trimestre: filters?.trimestre,
        statuts: filters?.statuts?.join(',')
      };

      const cacheKey = this.getCacheKey('subventions', params);
      const cached = this.getCache(cacheKey);
      if (cached) return cached;

      const queryParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, String(value));
        }
      });

      const response = await apiClient.get(`${this.endpoints.subventions}?${queryParams.toString()}`);
      const data = response.data;

      this.setCache(cacheKey, data, this.CACHE_TTL.subventions);
      return data;
    } catch (error) {
      console.error('Erreur lors de la récupération des subventions:', error);
      throw error;
    }
  }

  /**
   * Crée une nouvelle subvention
   */
  async createSubvention(subvention: Partial<Subvention>): Promise<Subvention> {
    try {
      const response = await apiClient.post(this.endpoints.subventions, subvention);
      this.clearSubventionCache();
      return response.data;
    } catch (error: any) {
      console.error('Erreur création subvention:', error);
      throw new Error(error.response?.data?.message || 'Erreur lors de la création de la subvention');
    }
  }

  /**
   * Soumet une subvention pour approbation
   */
  async submitSubventionForApproval(id: string, documents: string[], comment?: string): Promise<Subvention> {
    try {
      const response = await apiClient.post(`${this.endpoints.validation}/subvention/${id}/submit`, {
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

  /**
   * Approuve une subvention
   */
  async approveSubvention(id: string, userId: string, montantAccorde?: number, comment?: string): Promise<Subvention> {
    try {
      const response = await apiClient.post(`${this.endpoints.validation}/subvention/${id}/approve`, {
        userId,
        montantAccorde,
        comment,
        timestamp: new Date().toISOString()
      });
      this.clearSubventionCache();
      return response.data;
    } catch (error: any) {
      console.error('Erreur approbation subvention:', error);
      throw new Error(error.response?.data?.message || "Erreur lors de l'approbation de la subvention");
    }
  }

  // ================================================================================================
  // GESTION TRANSACTIONS
  // ================================================================================================

  /**
   * Récupère la liste des transactions
   * Support pour les deux signatures
   */
  async getTransactions(
    budgetIdOrParams?: string | FinancialFilters,
    filters?: FinancialFilters
  ): Promise<Transaction[] | { transactions: Transaction[]; total: number; page: number; limit: number }> {
    try {
      let params: any = {};

      if (typeof budgetIdOrParams === 'string') {
        // Version complexe avec budgetId
        const budgetId = budgetIdOrParams;
        let dateDebut = filters?.dateDebut || filters?.dateFrom;
        let dateFin = filters?.dateFin || filters?.dateTo;

        if (filters?.exercice && !dateDebut && !dateFin) {
          dateDebut = new Date(filters.exercice, 0, 1);
          dateFin = new Date(filters.exercice, 11, 31, 23, 59, 59);
        }

        params = {
          budgetId: budgetId || undefined,
          dateDebut: dateDebut ? new Date(dateDebut).toISOString() : undefined,
          dateFin: dateFin ? new Date(dateFin).toISOString() : undefined,
          categories: filters?.categories?.join(','),
          statuts: filters?.statuts?.join(','),
          montantMin: filters?.montantMin,
          montantMax: filters?.montantMax
        };
      } else {
        // Version simple avec params
        const filterParams = (budgetIdOrParams as FinancialFilters) || {};
        params = {
          page: filterParams.page,
          limit: filterParams.limit,
          type: filterParams.type,
          category: filterParams.category,
          status: filterParams.status,
          dateFrom: filterParams.dateFrom ? new Date(filterParams.dateFrom).toISOString() : undefined,
          dateTo: filterParams.dateTo ? new Date(filterParams.dateTo).toISOString() : undefined,
          tenantId: filterParams.tenantId
        };
      }

      const cacheKey = this.getCacheKey('transactions', params);
      const cached = this.getCache(cacheKey);
      if (cached) return cached;

      const queryParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, String(value));
        }
      });

      const response = await apiClient.get(`${this.endpoints.transactions}?${queryParams.toString()}`);
      const data = response.data;

      this.setCache(cacheKey, data, this.CACHE_TTL.transactions);
      return data;
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
      const cacheKey = this.getCacheKey(`transaction_${id}`);
      const cached = this.getCache(cacheKey);
      if (cached) return cached;

      const response = await apiClient.get(`${this.endpoints.transactions}/${id}`);
      const data = response.data;

      this.setCache(cacheKey, data, this.CACHE_TTL.transactions);
      return data;
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
      const response = await apiClient.post(this.endpoints.transactions, data);
      this.clearTransactionCache();
      this.clearBudgetCache();
      return response.data;
    } catch (error: any) {
      console.error('Erreur lors de la création de la transaction:', error);
      throw new Error(error.response?.data?.message || 'Erreur lors de la création de la transaction');
    }
  }

  /**
   * Met à jour une transaction
   */
  async updateTransaction(id: string, data: UpdateTransactionRequest): Promise<Transaction> {
    try {
      const response = await apiClient.put(`${this.endpoints.transactions}/${id}`, data);
      this.clearTransactionCache();
      this.clearBudgetCache();
      return response.data;
    } catch (error: any) {
      console.error('Erreur lors de la mise à jour de la transaction:', error);
      throw new Error(error.response?.data?.message || 'Erreur lors de la mise à jour de la transaction');
    }
  }

  /**
   * Supprime une transaction
   */
  async deleteTransaction(id: string): Promise<void> {
    try {
      await apiClient.delete(`${this.endpoints.transactions}/${id}`);
      this.clearTransactionCache();
      this.clearBudgetCache();
    } catch (error: any) {
      console.error('Erreur lors de la suppression de la transaction:', error);
      throw new Error(error.response?.data?.message || 'Erreur lors de la suppression de la transaction');
    }
  }

  /**
   * Valide une transaction (version simple)
   */
  async validateTransaction(id: string, status: 'approved' | 'rejected', comment?: string): Promise<Transaction> {
    try {
      const response = await apiClient.post(`${this.endpoints.transactions}/${id}/validate`, {
        status,
        comment
      });
      this.clearTransactionCache();
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la validation de la transaction:', error);
      throw error;
    }
  }

  /**
   * Soumet une transaction pour validation
   */
  async submitTransaction(id: string): Promise<Transaction> {
    try {
      const response = await apiClient.post(`${this.endpoints.transactions}/${id}/validate`, {
        action: 'submit'
      });
      this.clearTransactionCache();
      return response.data;
    } catch (error: any) {
      console.error('Erreur soumission transaction:', error);
      throw new Error(error.response?.data?.message || 'Erreur lors de la soumission de la transaction');
    }
  }

  /**
   * Approuve une transaction
   */
  async approveTransaction(id: string): Promise<Transaction> {
    try {
      const response = await apiClient.post(`${this.endpoints.transactions}/${id}/validate`, {
        action: 'approve'
      });
      this.clearTransactionCache();
      this.clearBudgetCache();
      return response.data;
    } catch (error: any) {
      console.error('Erreur approbation transaction:', error);
      throw new Error(error.response?.data?.message || "Erreur lors de l'approbation de la transaction");
    }
  }

  /**
   * Rejette une transaction
   */
  async rejectTransaction(id: string, reason: string): Promise<Transaction> {
    try {
      const response = await apiClient.post(`${this.endpoints.transactions}/${id}/validate`, {
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

  /**
   * Exécute une transaction
   */
  async executeTransaction(id: string): Promise<Transaction> {
    try {
      const response = await apiClient.post(`${this.endpoints.transactions}/${id}/validate`, {
        action: 'execute'
      });
      this.clearTransactionCache();
      this.clearBudgetCache();
      return response.data;
    } catch (error: any) {
      console.error('Erreur exécution transaction:', error);
      throw new Error(error.response?.data?.message || "Erreur lors de l'exécution de la transaction");
    }
  }

  /**
   * Récupère les statistiques des transactions
   */
  async getTransactionStats(budgetId?: string): Promise<any> {
    try {
      const params = budgetId ? { budgetId } : {};
      const cacheKey = this.getCacheKey('transaction_stats', params);
      const cached = this.getCache(cacheKey);
      if (cached) return cached;

      const queryParams = new URLSearchParams();
      if (budgetId) queryParams.append('budgetId', budgetId);

      const response = await apiClient.get(`${this.endpoints.transactions}/stats?${queryParams.toString()}`);
      const data = response.data;

      this.setCache(cacheKey, data, this.CACHE_TTL.transactions);
      return data;
    } catch (error) {
      console.error('Erreur lors de la récupération des stats de transactions:', error);
      throw error;
    }
  }

  // ================================================================================================
  // MÉTRIQUES
  // ================================================================================================

  /**
   * Récupère les métriques financières
   */
  async getMetrics(tenantId?: string): Promise<FinancialMetrics> {
    try {
      const cacheKey = this.getCacheKey('metrics', { tenantId });
      const cached = this.getCache(cacheKey);
      if (cached) return cached;

      const params = tenantId ? `?tenantId=${tenantId}` : '';
      const response = await apiClient.get(`${this.endpoints.metrics}${params}`);
      const data = response.data;

      this.setCache(cacheKey, data, this.CACHE_TTL.metrics);
      return data;
    } catch (error) {
      console.error('Erreur lors de la récupération des métriques financières:', error);
      throw error;
    }
  }

  // ================================================================================================
  // RAPPORTS
  // ================================================================================================

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
      const cacheKey = this.getCacheKey('reports', params);
      const cached = this.getCache(cacheKey);
      if (cached) return cached;

      const queryParams = new URLSearchParams();
      if (params?.page) queryParams.append('page', params.page.toString());
      if (params?.limit) queryParams.append('limit', params.limit.toString());
      if (params?.type) queryParams.append('type', params.type);
      if (params?.status) queryParams.append('status', params.status);
      if (params?.tenantId) queryParams.append('tenantId', params.tenantId);

      const response = await apiClient.get(`${this.endpoints.reports}?${queryParams.toString()}`);
      const data = response.data;

      this.setCache(cacheKey, data, this.CACHE_TTL.reports);
      return data;
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
      const response = await apiClient.post(this.endpoints.reports, data);
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la création du rapport:', error);
      throw error;
    }
  }

  /**
   * Génère un rapport financier (version complexe)
   */
  async generateFinancialReport(
    type: FinancialReport['type'],
    periode: { debut: Date | string; fin: Date | string },
    crouIds: string[] = [],
    filters?: FinancialFilters
  ): Promise<FinancialReport> {
    try {
      const response = await apiClient.post(this.endpoints.reports, {
        type,
        periode: {
          debut: typeof periode.debut === 'string' ? periode.debut : periode.debut.toISOString(),
          fin: typeof periode.fin === 'string' ? periode.fin : periode.fin.toISOString()
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

  /**
   * Télécharge un rapport
   */
  async downloadReport(id: string): Promise<Blob> {
    try {
      const response = await apiClient.get(`${this.endpoints.reports}/${id}/download`, {
        responseType: 'blob'
      });
      return response.data;
    } catch (error) {
      console.error('Erreur lors du téléchargement du rapport:', error);
      throw error;
    }
  }

  /**
   * Exporte un rapport dans un format spécifique
   */
  async exportReport(reportId: string, format: 'excel' | 'pdf'): Promise<string> {
    try {
      const response = await apiClient.post(
        `${this.endpoints.export}/${reportId}`,
        { format },
        { responseType: 'blob' }
      );

      // Créer URL de téléchargement
      const blob = new Blob([response.data]);
      const url = window.URL.createObjectURL(blob);
      return url;
    } catch (error: any) {
      console.error('Erreur export rapport:', error);
      throw new Error(error.response?.data?.message || "Erreur lors de l'export du rapport");
    }
  }

  // ================================================================================================
  // CATÉGORIES
  // ================================================================================================

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
      const cacheKey = this.getCacheKey('categories');
      const cached = this.getCache(cacheKey);
      if (cached) return cached;

      const response = await apiClient.get(this.endpoints.categories);
      const data = response.data;

      this.setCache(cacheKey, data, this.CACHE_TTL.categories);
      return data;
    } catch (error) {
      console.error('Erreur lors de la récupération des catégories:', error);
      throw error;
    }
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
  getAlertLevel: (
    percentage: number,
    seuils: { alerte: number; critique: number }
  ): 'normal' | 'warning' | 'critical' => {
    if (percentage >= seuils.critique) return 'critical';
    if (percentage >= seuils.alerte) return 'warning';
    return 'normal';
  },

  // Valider montant selon rôle utilisateur
  validateAmount: (amount: number, userRole: string): { valid: boolean; message?: string } => {
    const limits: Record<string, number> = {
      comptable: 1000000, // 1M FCFA
      chef_financier: 10000000, // 10M FCFA
      directeur: 50000000, // 50M FCFA
      directeur_finances: Number.MAX_SAFE_INTEGER
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

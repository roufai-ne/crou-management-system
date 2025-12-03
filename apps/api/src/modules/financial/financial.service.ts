/**
 * FICHIER: apps/api/src/modules/financial/financial.service.ts
 * SERVICE: FinancialService - Gestion des budgets financiers
 *
 * DESCRIPTION:
 * Service pour la gestion complète des budgets
 * CRUD, validation workflow, calcul montants, KPIs
 *
 * AUTEUR: Équipe CROU
 * DATE: Janvier 2025
 */

import { AppDataSource } from '../../../../../packages/database/src/config/datasource';
import { Budget, BudgetType, BudgetStatus } from '../../../../../packages/database/src/entities/Budget.entity';
import { Transaction, TransactionStatus } from '../../../../../packages/database/src/entities/Transaction.entity';
import { Between, In } from 'typeorm';
import { logger } from '@/shared/utils/logger';

// ================================================================================================
// TYPES ET INTERFACES
// ================================================================================================

export interface CreateBudgetDTO {
  exercice: number;
  type: BudgetType;
  libelle: string;
  montantInitial: number;
  crouId?: string;
  categories?: BudgetCategoryDTO[];
}

export interface UpdateBudgetDTO {
  libelle?: string;
  montantInitial?: number;
  status?: BudgetStatus;
}

export interface BudgetCategoryDTO {
  nom: string;
  code: string;
  montantInitial: number;
  pourcentage: number;
}

export interface BudgetFilters {
  exercice?: number;
  type?: string;
  status?: string;
  crouId?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface BudgetStats {
  totalBudgets: number;
  totalMontantInitial: number;
  totalMontantRealise: number;
  totalMontantEngage: number;
  totalMontantDisponible: number;
  tauxExecutionMoyen: number;
  parStatut: Record<string, number>;
  parType: Record<string, number>;
}

// ================================================================================================
// SERVICE PRINCIPAL
// ================================================================================================

export class FinancialService {
  /**
   * Créer un nouveau budget
   */
  static async createBudget(
    tenantId: string,
    userId: string,
    data: CreateBudgetDTO
  ): Promise<Budget> {
    const budgetRepo = AppDataSource.getRepository(Budget);

    try {
      // Vérifier unicité budget par exercice et type
      const existingBudget = await budgetRepo.findOne({
        where: {
          tenantId,
          exercice: data.exercice,
          type: data.type
        }
      });

      if (existingBudget) {
        throw new Error(
          `Un budget ${data.type} existe déjà pour l'exercice ${data.exercice}`
        );
      }

      // Créer le budget
      const budget = budgetRepo.create({
        tenantId,
        exercice: data.exercice,
        type: data.type,
        libelle: data.libelle,
        montantInitial: data.montantInitial,
        montantRealise: 0,
        montantEngage: 0,
        montantDisponible: data.montantInitial,
        tauxExecution: 0,
        status: BudgetStatus.DRAFT,
        createdBy: userId,
        validationLevel: 0
      });

      const savedBudget = await budgetRepo.save(budget);

      logger.info('Budget créé:', {
        budgetId: savedBudget.id,
        exercice: data.exercice,
        montant: data.montantInitial,
        userId
      });

      return savedBudget;
    } catch (error) {
      logger.error('Erreur création budget:', error);
      throw error;
    }
  }

  /**
   * Récupérer les budgets avec filtres
   */
  static async getBudgets(
    tenantId: string,
    filters: BudgetFilters = {}
  ): Promise<{ budgets: Budget[]; total: number }> {
    const budgetRepo = AppDataSource.getRepository(Budget);

    try {
      const queryBuilder = budgetRepo
        .createQueryBuilder('budget')
        .where('budget.tenantId = :tenantId', { tenantId });

      // Filtres
      if (filters.exercice) {
        queryBuilder.andWhere('budget.exercice = :exercice', {
          exercice: filters.exercice
        });
      }

      if (filters.type) {
        queryBuilder.andWhere('budget.type = :type', { type: filters.type });
      }

      if (filters.status) {
        queryBuilder.andWhere('budget.status = :statut', { statut: filters.status });
      }

      if (filters.crouId) {
        queryBuilder.andWhere('budget.crouId = :crouId', { crouId: filters.crouId });
      }

      if (filters.search) {
        queryBuilder.andWhere('budget.libelle ILIKE :search', {
          search: `%${filters.search}%`
        });
      }

      // Tri par défaut
      queryBuilder.orderBy('budget.exercice', 'DESC').addOrderBy('budget.createdAt', 'DESC');

      // Pagination au niveau de la base de données (beaucoup plus efficace)
      if (filters.page && filters.limit) {
        const page = Number(filters.page);
        const limit = Number(filters.limit);
        const skip = (page - 1) * limit;

        queryBuilder.skip(skip).take(limit);
      }

      const [budgets, total] = await queryBuilder.getManyAndCount();

      return { budgets, total };
    } catch (error) {
      logger.error('Erreur récupération budgets:', error);
      throw error;
    }
  }

  /**
   * Récupérer un budget par ID
   */
  static async getBudgetById(budgetId: string, tenantId: string): Promise<Budget> {
    const budgetRepo = AppDataSource.getRepository(Budget);

    try {
      const budget = await budgetRepo.findOne({
        where: { id: budgetId, tenantId },
        relations: ['transactions']
      });

      if (!budget) {
        throw new Error('Budget non trouvé');
      }

      return budget;
    } catch (error) {
      logger.error('Erreur récupération budget:', error);
      throw error;
    }
  }

  /**
   * Mettre à jour un budget
   */
  static async updateBudget(
    budgetId: string,
    tenantId: string,
    userId: string,
    data: UpdateBudgetDTO
  ): Promise<Budget> {
    const budgetRepo = AppDataSource.getRepository(Budget);

    try {
      const budget = await this.getBudgetById(budgetId, tenantId);

      // Vérifier si le budget peut être modifié
      if (![BudgetStatus.DRAFT, BudgetStatus.REJECTED].includes(budget.status)) {
        throw new Error(
          'Seuls les budgets en brouillon ou rejetés peuvent être modifiés'
        );
      }

      // Mettre à jour les champs
      if (data.libelle !== undefined) {
        budget.libelle = data.libelle;
      }

      if (data.montantInitial !== undefined) {
        const difference = data.montantInitial - budget.montantInitial;
        budget.montantInitial = data.montantInitial;
        budget.montantDisponible = budget.montantDisponible + difference;
      }

      if (data.status !== undefined) {
        budget.status = data.status;
      }

      budget.updatedBy = userId;
      budget.updatedAt = new Date();

      const updatedBudget = await budgetRepo.save(budget);

      logger.info('Budget mis à jour:', {
        budgetId,
        updates: data,
        userId
      });

      return updatedBudget;
    } catch (error) {
      logger.error('Erreur mise à jour budget:', error);
      throw error;
    }
  }

  /**
   * Supprimer un budget
   */
  static async deleteBudget(budgetId: string, tenantId: string): Promise<void> {
    const budgetRepo = AppDataSource.getRepository(Budget);

    try {
      const budget = await this.getBudgetById(budgetId, tenantId);

      // Vérifier si le budget peut être supprimé
      if (budget.status !== BudgetStatus.DRAFT) {
        throw new Error('Seuls les budgets en brouillon peuvent être supprimés');
      }

      // Vérifier qu'il n'a pas de transactions
      if (budget.montantRealise > 0 || budget.montantEngage > 0) {
        throw new Error('Impossible de supprimer un budget avec des transactions');
      }

      await budgetRepo.remove(budget);

      logger.info('Budget supprimé:', { budgetId });
    } catch (error) {
      logger.error('Erreur suppression budget:', error);
      throw error;
    }
  }

  /**
   * Soumettre un budget pour validation
   */
  static async submitBudget(
    budgetId: string,
    tenantId: string,
    userId: string
  ): Promise<Budget> {
    const budgetRepo = AppDataSource.getRepository(Budget);

    try {
      const budget = await this.getBudgetById(budgetId, tenantId);

      if (budget.status !== BudgetStatus.DRAFT && budget.status !== BudgetStatus.REJECTED) {
        throw new Error('Seuls les budgets en brouillon ou rejetés peuvent être soumis');
      }

      budget.status = BudgetStatus.SUBMITTED;
      budget.updatedBy = userId;
      budget.updatedAt = new Date();

      const updatedBudget = await budgetRepo.save(budget);

      logger.info('Budget soumis:', { budgetId, userId });

      return updatedBudget;
    } catch (error) {
      logger.error('Erreur soumission budget:', error);
      throw error;
    }
  }

  /**
   * Approuver un budget
   */
  static async approveBudget(
    budgetId: string,
    tenantId: string,
    userId: string,
    comment?: string
  ): Promise<Budget> {
    const budgetRepo = AppDataSource.getRepository(Budget);

    try {
      const budget = await this.getBudgetById(budgetId, tenantId);

      if (budget.status !== BudgetStatus.SUBMITTED) {
        throw new Error('Seuls les budgets soumis peuvent être approuvés');
      }

      budget.status = BudgetStatus.APPROVED;
      budget.approvedBy = userId;
      budget.approvedAt = new Date();
      budget.updatedBy = userId;
      budget.updatedAt = new Date();

      const updatedBudget = await budgetRepo.save(budget);

      logger.info('Budget approuvé:', { budgetId, userId, comment });

      return updatedBudget;
    } catch (error) {
      logger.error('Erreur approbation budget:', error);
      throw error;
    }
  }

  /**
   * Rejeter un budget
   */
  static async rejectBudget(
    budgetId: string,
    tenantId: string,
    userId: string,
    reason: string
  ): Promise<Budget> {
    const budgetRepo = AppDataSource.getRepository(Budget);

    try {
      const budget = await this.getBudgetById(budgetId, tenantId);

      if (budget.status !== BudgetStatus.SUBMITTED) {
        throw new Error('Seuls les budgets soumis peuvent être rejetés');
      }

      budget.status = BudgetStatus.REJECTED;
      budget.updatedBy = userId;
      budget.updatedAt = new Date();

      const updatedBudget = await budgetRepo.save(budget);

      logger.info('Budget rejeté:', { budgetId, userId, reason });

      return updatedBudget;
    } catch (error) {
      logger.error('Erreur rejet budget:', error);
      throw error;
    }
  }

  /**
   * Activer un budget
   */
  static async activateBudget(
    budgetId: string,
    tenantId: string,
    userId: string
  ): Promise<Budget> {
    const budgetRepo = AppDataSource.getRepository(Budget);

    try {
      const budget = await this.getBudgetById(budgetId, tenantId);

      if (budget.status !== BudgetStatus.APPROVED) {
        throw new Error('Seuls les budgets approuvés peuvent être activés');
      }

      budget.status = BudgetStatus.ACTIVE;
      budget.updatedBy = userId;
      budget.updatedAt = new Date();

      const updatedBudget = await budgetRepo.save(budget);

      logger.info('Budget activé:', { budgetId, userId });

      return updatedBudget;
    } catch (error) {
      logger.error('Erreur activation budget:', error);
      throw error;
    }
  }

  /**
   * Calculer les statistiques des budgets
   */
  static async getBudgetStats(
    tenantId: string,
    filters: BudgetFilters = {}
  ): Promise<BudgetStats> {
    try {
      const { budgets } = await this.getBudgets(tenantId, filters);

      const stats: BudgetStats = {
        totalBudgets: budgets.length,
        totalMontantInitial: 0,
        totalMontantRealise: 0,
        totalMontantEngage: 0,
        totalMontantDisponible: 0,
        tauxExecutionMoyen: 0,
        parStatut: {},
        parType: {}
      };

      budgets.forEach((budget) => {
        stats.totalMontantInitial += budget.montantInitial;
        stats.totalMontantRealise += budget.montantRealise;
        stats.totalMontantEngage += budget.montantEngage;
        stats.totalMontantDisponible += budget.montantDisponible;

        // Par statut
        stats.parStatut[budget.status] = (stats.parStatut[budget.status] || 0) + 1;

        // Par type
        stats.parType[budget.type] = (stats.parType[budget.type] || 0) + 1;
      });

      // Taux d'exécution moyen
      if (stats.totalMontantInitial > 0) {
        stats.tauxExecutionMoyen =
          (stats.totalMontantRealise / stats.totalMontantInitial) * 100;
      }

      return stats;
    } catch (error) {
      logger.error('Erreur calcul statistiques budgets:', error);
      throw error;
    }
  }

  /**
   * Recalculer les montants d'un budget à partir des transactions
   */
  static async recalculateBudgetAmounts(
    budgetId: string,
    tenantId: string
  ): Promise<Budget> {
    const budgetRepo = AppDataSource.getRepository(Budget);
    const transactionRepo = AppDataSource.getRepository(Transaction);

    try {
      const budget = await this.getBudgetById(budgetId, tenantId);

      // Récupérer toutes les transactions exécutées
      const transactions = await transactionRepo.find({
        where: {
          budgetId,
          tenantId,
          status: TransactionStatus.EXECUTED
        }
      });

      // Calculer les montants
      let montantRealise = 0;
      let montantEngage = 0;

      transactions.forEach((transaction) => {
        if (transaction.type === 'depense') {
          montantRealise += transaction.montant;
        } else if (transaction.type === 'engagement') {
          montantEngage += transaction.montant;
        } else if (transaction.type === 'recette') {
          montantRealise -= transaction.montant; // Les recettes réduisent les dépenses
        }
      });

      // Mettre à jour le budget
      budget.montantRealise = montantRealise;
      budget.montantEngage = montantEngage;
      budget.montantDisponible = budget.montantInitial - montantRealise - montantEngage;
      budget.tauxExecution =
        budget.montantInitial > 0 ? (montantRealise / budget.montantInitial) * 100 : 0;
      budget.updatedAt = new Date();

      const updatedBudget = await budgetRepo.save(budget);

      logger.info('Montants budget recalculés:', {
        budgetId,
        montantRealise,
        montantEngage,
        montantDisponible: budget.montantDisponible
      });

      return updatedBudget;
    } catch (error) {
      logger.error('Erreur recalcul montants budget:', error);
      throw error;
    }
  }

  /**
   * Récupérer les catégories budgétaires
   */
  static async getCategories(tenantId: string): Promise<any[]> {
    // Pour l'instant, retourner des catégories statiques
    // TODO: Implémenter entité BudgetCategory si nécessaire
    const categories = [
      { id: '1', nom: 'Personnel', code: 'PERS', description: 'Dépenses de personnel' },
      { id: '2', nom: 'Matériel', code: 'MAT', description: 'Achats de matériel' },
      { id: '3', nom: 'Fonctionnement', code: 'FCT', description: 'Frais de fonctionnement' },
      { id: '4', nom: 'Investissement', code: 'INV', description: 'Investissements' },
      { id: '5', nom: 'Maintenance', code: 'MAINT', description: 'Maintenance et réparation' }
    ];

    return categories;
  }

  /**
   * Créer une catégorie budgétaire
   */
  static async createCategory(tenantId: string, userId: string, data: any): Promise<any> {
    // TODO: Implémenter avec entité BudgetCategory
    logger.info('Catégorie créée:', { data, userId });
    return { id: 'new-id', ...data, tenantId, createdBy: userId };
  }

  /**
   * Mettre à jour une catégorie budgétaire
   */
  static async updateCategory(categoryId: string, tenantId: string, userId: string, data: any): Promise<any> {
    // TODO: Implémenter avec entité BudgetCategory
    logger.info('Catégorie mise à jour:', { categoryId, data, userId });
    return { id: categoryId, ...data, updatedBy: userId };
  }

  /**
   * Générer des rapports financiers
   */
  static async getReports(tenantId: string, filters?: any): Promise<any> {
    try {
      const { budgets } = await this.getBudgets(tenantId);
      const stats = await this.getBudgetStats(tenantId);

      const reports = [
        {
          id: 'budget-summary',
          title: 'Résumé Budgétaire',
          type: 'summary',
          data: stats,
          generatedAt: new Date()
        },
        {
          id: 'budget-execution',
          title: 'Exécution Budgétaire',
          type: 'execution',
          data: {
            budgets: budgets.map(b => ({
              id: b.id,
              libelle: b.libelle,
              initial: b.montantInitial,
              realise: b.montantRealise,
              disponible: b.montantDisponible,
              tauxExecution: b.tauxExecution
            }))
          },
          generatedAt: new Date()
        }
      ];

      return reports;
    } catch (error) {
      logger.error('Erreur génération rapports:', error);
      throw error;
    }
  }

  /**
   * Rapport d'exécution budgétaire détaillé
   */
  static async getBudgetExecutionReport(tenantId: string, filters?: any): Promise<any> {
    try {
      const { budgets } = await this.getBudgets(tenantId);

      const report = {
        title: 'Rapport d\'Exécution Budgétaire',
        period: filters?.period || 'Année en cours',
        generatedAt: new Date(),
        summary: {
          totalBudgets: budgets.length,
          totalInitial: budgets.reduce((sum, b) => sum + b.montantInitial, 0),
          totalRealise: budgets.reduce((sum, b) => sum + b.montantRealise, 0),
          totalDisponible: budgets.reduce((sum, b) => sum + b.montantDisponible, 0)
        },
        budgets: budgets.map(budget => ({
          id: budget.id,
          libelle: budget.libelle,
          type: budget.type,
          exercice: budget.exercice,
          status: budget.status,
          montants: {
            initial: budget.montantInitial,
            realise: budget.montantRealise,
            engage: budget.montantEngage,
            disponible: budget.montantDisponible
          },
          tauxExecution: budget.tauxExecution,
          createdAt: budget.createdAt
        }))
      };

      return report;
    } catch (error) {
      logger.error('Erreur rapport exécution budgétaire:', error);
      throw error;
    }
  }

  /**
   * Rapport des transactions
   */
  static async getTransactionsReport(tenantId: string, filters?: any): Promise<any> {
    try {
      // Cette méthode devrait utiliser TransactionService
      // Pour l'instant, retourner un rapport basique
      const report = {
        title: 'Rapport des Transactions',
        period: filters?.period || 'Période sélectionnée',
        generatedAt: new Date(),
        filters: filters || {},
        summary: {
          totalTransactions: 0,
          totalDepenses: 0,
          totalRecettes: 0,
          solde: 0
        },
        transactions: []
      };

      return report;
    } catch (error) {
      logger.error('Erreur rapport transactions:', error);
      throw error;
    }
  }

  /**
   * Exporter un rapport
   */
  static async exportReport(reportId: string, format: 'excel' | 'pdf', tenantId: string): Promise<Buffer> {
    try {
      let reportData;

      switch (reportId) {
        case 'budget-execution':
          reportData = await this.getBudgetExecutionReport(tenantId);
          break;
        case 'transactions':
          reportData = await this.getTransactionsReport(tenantId);
          break;
        default:
          reportData = await this.getReports(tenantId);
      }

      // TODO: Implémenter l'export réel avec exceljs/pdfkit
      // Pour l'instant, retourner un buffer vide
      const buffer = Buffer.from(JSON.stringify(reportData, null, 2));

      logger.info('Rapport exporté:', { reportId, format, tenantId });

      return buffer;
    } catch (error) {
      logger.error('Erreur export rapport:', error);
      throw error;
    }
  }

  /**
   * Récupérer les validations en attente
   */
  static async getPendingValidations(tenantId: string): Promise<any[]> {
    try {
      const { budgets } = await this.getBudgets(tenantId, { status: 'submitted' });

      const validations = budgets.map(budget => ({
        id: budget.id,
        type: 'budget',
        title: `Validation budget: ${budget.libelle}`,
        description: `Budget ${budget.type} ${budget.exercice} - ${budget.montantInitial} FCFA`,
        status: 'pending',
        requestedBy: budget.createdBy,
        requestedAt: budget.createdAt,
        priority: 'medium'
      }));

      return validations;
    } catch (error) {
      logger.error('Erreur récup validations en attente:', error);
      throw error;
    }
  }

  /**
   * Historique des validations
   */
  static async getValidationHistory(tenantId: string, filters?: any): Promise<any[]> {
    try {
      const { budgets } = await this.getBudgets(tenantId);

      const history = budgets
        .filter(b => b.status !== 'draft')
        .map(budget => ({
          id: budget.id,
          type: 'budget',
          title: budget.libelle,
          action: budget.status === 'approved' ? 'Approuvé' : budget.status === 'rejected' ? 'Rejeté' : 'Soumis',
          performedBy: budget.approvedBy || budget.updatedBy,
          performedAt: budget.approvedAt || budget.updatedAt,
          status: budget.status,
          comments: budget.status === 'rejected' ? 'Budget rejeté' : null
        }))
        .sort((a, b) => new Date(b.performedAt).getTime() - new Date(a.performedAt).getTime());

      return history;
    } catch (error) {
      logger.error('Erreur récup historique validations:', error);
      throw error;
    }
  }

  /**
   * KPIs financiers pour le dashboard
   */
  static async getFinancialKPIs(tenantId: string): Promise<any> {
    try {
      const stats = await this.getBudgetStats(tenantId);

      const kpis = {
        totalBudgets: {
          value: stats.totalBudgets,
          label: 'Budgets actifs',
          trend: 'stable',
          icon: 'budget'
        },
        totalMontantInitial: {
          value: stats.totalMontantInitial,
          label: 'Montant initial total',
          trend: 'up',
          icon: 'money',
          format: 'currency'
        },
        tauxExecutionMoyen: {
          value: Math.round(stats.tauxExecutionMoyen * 100) / 100,
          label: 'Taux exécution moyen',
          trend: stats.tauxExecutionMoyen > 50 ? 'up' : 'down',
          icon: 'percent',
          format: 'percentage'
        },
        totalDisponible: {
          value: stats.totalMontantDisponible,
          label: 'Montant disponible',
          trend: 'stable',
          icon: 'wallet',
          format: 'currency'
        }
      };

      return kpis;
    } catch (error) {
      logger.error('Erreur récup KPIs financiers:', error);
      throw error;
    }
  }

  /**
   * Évolution des indicateurs financiers
   */
  static async getFinancialEvolution(tenantId: string, period?: string): Promise<any[]> {
    try {
      // TODO: Implémenter évolution temporelle
      // Pour l'instant, retourner des données statiques
      const evolution = [
        { date: '2024-01', budgets: 5, montantInitial: 1000000, tauxExecution: 25 },
        { date: '2024-02', budgets: 5, montantInitial: 1000000, tauxExecution: 30 },
        { date: '2024-03', budgets: 6, montantInitial: 1200000, tauxExecution: 35 },
        { date: '2024-04', budgets: 6, montantInitial: 1200000, tauxExecution: 40 },
        { date: '2024-05', budgets: 7, montantInitial: 1400000, tauxExecution: 45 },
        { date: '2024-06', budgets: 7, montantInitial: 1400000, tauxExecution: 50 }
      ];

      return evolution;
    } catch (error) {
      logger.error('Erreur récup évolution financière:', error);
      throw error;
    }
  }

  /**
   * Alertes financières
   */
  static async getFinancialAlerts(tenantId: string): Promise<any[]> {
    try {
      const { budgets } = await this.getBudgets(tenantId);
      const alerts: any[] = [];

      budgets.forEach(budget => {
        // Alerte si budget presque épuisé (< 10% disponible)
        if (budget.montantDisponible < budget.montantInitial * 0.1 && budget.montantDisponible > 0) {
          alerts.push({
            id: `budget-low-${budget.id}`,
            type: 'warning',
            title: 'Budget presque épuisé',
            message: `Le budget "${budget.libelle}" n'a plus que ${budget.montantDisponible} FCFA disponible`,
            budgetId: budget.id,
            severity: 'medium',
            createdAt: new Date()
          });
        }

        // Alerte si budget épuisé
        if (budget.montantDisponible <= 0) {
          alerts.push({
            id: `budget-exhausted-${budget.id}`,
            type: 'error',
            title: 'Budget épuisé',
            message: `Le budget "${budget.libelle}" est complètement épuisé`,
            budgetId: budget.id,
            severity: 'high',
            createdAt: new Date()
          });
        }

        // Alerte si taux d'exécution élevé (> 90%)
        if (budget.tauxExecution > 90) {
          alerts.push({
            id: `budget-high-execution-${budget.id}`,
            type: 'info',
            title: 'Budget presque exécuté',
            message: `Le budget "${budget.libelle}" est exécuté à ${budget.tauxExecution.toFixed(1)}%`,
            budgetId: budget.id,
            severity: 'low',
            createdAt: new Date()
          });
        }
      });

      return alerts;
    } catch (error) {
      logger.error('Erreur récup alertes financières:', error);
      throw error;
    }
  }
}

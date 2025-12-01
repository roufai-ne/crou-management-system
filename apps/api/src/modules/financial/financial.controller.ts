/**
 * FICHIER: apps\api\src\modules\financial\financial.controller.ts
 * CONTROLLER: Module Financier
 * 
 * DESCRIPTION:
 * Contrôleur pour le module de gestion financière
 * Budgets, transactions, validations et rapports
 * 
 * AUTEUR: Équipe CROU
 * DATE: Décembre 2024
 */

import { Response } from 'express';
import { TypedRequest } from '@/shared/types/express.types';
import { body, query, param, validationResult } from 'express-validator';
import { logger } from '@/shared/utils/logger';
import { TenantIsolationUtils } from '@/shared/utils/tenant-isolation.utils';
import { TransactionService, CreateTransactionDTO, UpdateTransactionDTO, TransactionFilters } from './transaction.service';
import { FinancialService, CreateBudgetDTO, UpdateBudgetDTO, BudgetFilters } from './financial.service';
import { TransactionType, TransactionStatus, TransactionCategory } from '../../../../../packages/database/src/entities/Transaction.entity';

// Validateurs pour les budgets
export const budgetValidators = {
  create: [
    body('title').notEmpty().withMessage('Titre requis'),
    body('amount').isNumeric().withMessage('Montant requis'),
    body('categoryId').notEmpty().withMessage('Catégorie requise'),
    body('year').isInt({ min: 2020, max: 2030 }).withMessage('Année invalide')
  ],
  update: [
    param('id').isUUID().withMessage('ID invalide'),
    body('title').optional().notEmpty().withMessage('Titre requis'),
    body('amount').optional().isNumeric().withMessage('Montant invalide')
  ],
  validate: [
    param('id').isUUID().withMessage('ID invalide'),
    body('action').isIn(['approve', 'reject']).withMessage('Action invalide'),
    body('comment').optional().isString()
  ]
};

// Validateurs pour les transactions
export const transactionValidators = {
  create: [
    body('type').isIn(['income', 'expense']).withMessage('Type invalide'),
    body('amount').isNumeric().withMessage('Montant requis'),
    body('description').notEmpty().withMessage('Description requise'),
    body('budgetId').isUUID().withMessage('Budget ID invalide')
  ]
};

export class FinancialController {
  /**
   * GET /api/financial/budgets
   * Liste des budgets avec filtres
   */
  static async getBudgets(req: TypedRequest, res: Response) {
    try {
      const tenantContext = TenantIsolationUtils.extractTenantContext(req);
      const hasExtendedAccess = TenantIsolationUtils.hasExtendedAccess(req);
      const targetTenantId = req.query.tenantId as string;

      // Déterminer le tenant effectif à utiliser
      const effectiveTenantId = hasExtendedAccess && targetTenantId 
        ? targetTenantId 
        : tenantContext.tenantId;

      const { page = 1, limit = 10, status, year, type, search } = req.query;

      // Filtres
      const filters: BudgetFilters = {
        exercice: year ? Number(year) : undefined,
        status: status as string,
        type: type as string,
        search: search as string
      };

      // Récupérer les budgets
      const { budgets, total } = await FinancialService.getBudgets(effectiveTenantId, filters);

      // Pagination
      const startIndex = (Number(page) - 1) * Number(limit);
      const endIndex = startIndex + Number(limit);
      const paginatedBudgets = budgets.slice(startIndex, endIndex);

      res.json({
        success: true,
        data: {
          budgets: paginatedBudgets,
          pagination: {
            page: Number(page),
            limit: Number(limit),
            total,
            pages: Math.ceil(total / Number(limit))
          }
        }
      });
    } catch (error) {
      logger.error('Erreur récupération budgets:', error);
      res.status(500).json({
        success: false,
        error: 'Erreur serveur',
        message: 'Erreur lors de la récupération des budgets'
      });
    }
  }

  /**
   * POST /api/financial/budgets
   * Créer un nouveau budget
   */
  static async createBudget(req: TypedRequest, res: Response) {
    try {
      const tenantContext = TenantIsolationUtils.extractTenantContext(req);
      const userId = req.user?.userId;

      if (!userId) {
        return res.status(401).json({
          success: false,
          error: 'Authentification manquante'
        });
      }

      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: 'Données invalides',
          details: errors.array()
        });
      }

      const { libelle, montantInitial, exercice, type, crouId } = req.body;

      const budgetData: CreateBudgetDTO = {
        libelle,
        montantInitial: Number(montantInitial),
        exercice: Number(exercice),
        type: type || 'crou',
        crouId
      };

      const newBudget = await FinancialService.createBudget(tenantContext.tenantId, userId, budgetData);

      res.status(201).json({
        success: true,
        message: 'Budget créé avec succès',
        data: { budget: newBudget }
      });
    } catch (error: any) {
      logger.error('Erreur création budget:', error);
      res.status(500).json({
        success: false,
        error: 'Erreur serveur',
        message: error.message || 'Erreur lors de la création du budget'
      });
    }
  }

  /**
   * GET /api/financial/budgets/:id
   * Détails d'un budget
   */
  static async getBudget(req: TypedRequest, res: Response) {
    try {
      const tenantContext = TenantIsolationUtils.extractTenantContext(req);
      const hasExtendedAccess = TenantIsolationUtils.hasExtendedAccess(req);
      const targetTenantId = req.query.tenantId as string;

      // Déterminer le tenant effectif à utiliser
      const effectiveTenantId = hasExtendedAccess && targetTenantId 
        ? targetTenantId 
        : tenantContext.tenantId;

      const { id } = req.params;

      const budget = await FinancialService.getBudgetById(id, effectiveTenantId);

      res.json({
        success: true,
        data: { budget }
      });
    } catch (error: any) {
      logger.error('Erreur récupération budget:', error);
      res.status(500).json({
        success: false,
        error: 'Erreur serveur',
        message: error.message || 'Erreur lors de la récupération du budget'
      });
    }
  }

  /**
   * PUT /api/financial/budgets/:id
   * Modifier un budget
   */
  static async updateBudget(req: TypedRequest, res: Response) {
    try {
      const tenantContext = TenantIsolationUtils.extractTenantContext(req);
      const userId = req.user?.userId;

      if (!userId) {
        return res.status(401).json({
          success: false,
          error: 'Authentification manquante'
        });
      }

      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: 'Données invalides',
          details: errors.array()
        });
      }

      const { id } = req.params;
      const updateData: UpdateBudgetDTO = req.body;

      const updatedBudget = await FinancialService.updateBudget(id, tenantContext.tenantId, userId, updateData);

      res.json({
        success: true,
        message: 'Budget modifié avec succès',
        data: { budget: updatedBudget }
      });
    } catch (error: any) {
      logger.error('Erreur modification budget:', error);
      res.status(500).json({
        success: false,
        error: 'Erreur serveur',
        message: error.message || 'Erreur lors de la modification du budget'
      });
    }
  }

  /**
   * DELETE /api/financial/budgets/:id
   * Supprimer un budget
   */
  static async deleteBudget(req: TypedRequest, res: Response) {
    try {
      const tenantContext = TenantIsolationUtils.extractTenantContext(req);

      const { id } = req.params;

      await FinancialService.deleteBudget(id, tenantContext.tenantId);

      logger.info('Budget supprimé:', {
        budgetId: id,
        userId: (req as any).user?.userId
      });

      res.json({
        success: true,
        message: 'Budget supprimé avec succès'
      });
    } catch (error: any) {
      logger.error('Erreur suppression budget:', error);
      res.status(500).json({
        success: false,
        error: 'Erreur serveur',
        message: error.message || 'Erreur lors de la suppression du budget'
      });
    }
  }

  /**
   * POST /api/financial/budgets/:id/validate
   * Valider un budget
   */
  static async validateBudget(req: Request, res: Response) {
    try {
      const tenantId = (req as any).user?.tenantId;
      const userId = (req as any).user?.userId;

      if (!tenantId || !userId) {
        return res.status(401).json({
          success: false,
          error: 'Authentification manquante'
        });
      }

      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: 'Données invalides',
          details: errors.array()
        });
      }

      const { id } = req.params;
      const { action, comment } = req.body;

      let result;
      switch (action) {
        case 'approve':
          result = await FinancialService.approveBudget(id, tenantId, userId, comment);
          break;
        case 'reject':
          result = await FinancialService.rejectBudget(id, tenantId, userId, comment || 'Rejeté');
          break;
        default:
          return res.status(400).json({
            success: false,
            error: 'Action invalide'
          });
      }

      logger.info('Budget validé:', {
        budgetId: id,
        action,
        comment,
        userId
      });

      res.json({
        success: true,
        message: `Budget ${action === 'approve' ? 'approuvé' : 'rejeté'} avec succès`,
        data: { budget: result }
      });
    } catch (error: any) {
      logger.error('Erreur validation budget:', error);
      res.status(500).json({
        success: false,
        error: 'Erreur serveur',
        message: error.message || 'Erreur lors de la validation du budget'
      });
    }
  }

  /**
   * POST /api/financial/budgets/:id/submit
   * Soumettre un budget pour validation
   */
  static async submitBudget(req: Request, res: Response) {
    try {
      const tenantId = (req as any).user?.tenantId;
      const userId = (req as any).user?.userId;

      if (!tenantId || !userId) {
        return res.status(401).json({
          success: false,
          error: 'Authentification manquante'
        });
      }

      const { id } = req.params;

      const submittedBudget = await FinancialService.submitBudget(id, tenantId, userId);

      logger.info('Budget soumis:', {
        budgetId: id,
        userId
      });

      res.json({
        success: true,
        message: 'Budget soumis pour validation',
        data: { budget: submittedBudget }
      });
    } catch (error: any) {
      logger.error('Erreur soumission budget:', error);
      res.status(500).json({
        success: false,
        error: 'Erreur serveur',
        message: error.message || 'Erreur lors de la soumission du budget'
      });
    }
  }

  // Méthodes pour les autres endpoints (transactions, catégories, rapports, etc.)
  // Implémentations simplifiées pour éviter les erreurs de compilation

  static async getTransactions(req: Request, res: Response) {
    try {
      const tenantId = (req as any).user?.tenantId;
      if (!tenantId) {
        return res.status(401).json({ success: false, error: 'Tenant ID manquant' });
      }

      const filters: TransactionFilters = {
        type: req.query.type as TransactionType,
        status: req.query.status as TransactionStatus,
        category: req.query.category as TransactionCategory,
        budgetId: req.query.budgetId as string,
        startDate: req.query.startDate ? new Date(req.query.startDate as string) : undefined,
        endDate: req.query.endDate ? new Date(req.query.endDate as string) : undefined,
        minAmount: req.query.minAmount ? Number(req.query.minAmount) : undefined,
        maxAmount: req.query.maxAmount ? Number(req.query.maxAmount) : undefined,
        search: req.query.search as string
      };

      const result = await TransactionService.getTransactions(tenantId, filters);
      res.json({ success: true, data: result });
    } catch (error) {
      logger.error('Erreur getTransactions:', error);
      res.status(500).json({ success: false, error: 'Erreur lors de la recuperation des transactions' });
    }
  }

  static async createTransaction(req: Request, res: Response) {
    try {
      const tenantId = (req as any).user?.tenantId;
      const userId = (req as any).user?.userId;
      if (!tenantId || !userId) {
        return res.status(401).json({ success: false, error: 'Authentification manquante' });
      }

      const data: CreateTransactionDTO = req.body;
      const transaction = await TransactionService.createTransaction(tenantId, userId, data);
      res.json({ success: true, data: { transaction } });
    } catch (error: any) {
      logger.error('Erreur createTransaction:', error);
      res.status(500).json({ success: false, error: error.message || 'Erreur lors de la creation de la transaction' });
    }
  }

  static async getTransaction(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const tenantId = (req as any).user?.tenantId;
      if (!tenantId) {
        return res.status(401).json({ success: false, error: 'Tenant ID manquant' });
      }

      const transaction = await TransactionService.getTransactionById(id, tenantId);
      res.json({ success: true, data: { transaction } });
    } catch (error: any) {
      logger.error('Erreur getTransaction:', error);
      res.status(500).json({ success: false, error: error.message || 'Erreur lors de la recuperation de la transaction' });
    }
  }

  static async updateTransaction(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const tenantId = (req as any).user?.tenantId;
      const userId = (req as any).user?.userId;
      if (!tenantId || !userId) {
        return res.status(401).json({ success: false, error: 'Authentification manquante' });
      }

      const data: UpdateTransactionDTO = req.body;
      const transaction = await TransactionService.updateTransaction(id, tenantId, userId, data);
      res.json({ success: true, data: { transaction } });
    } catch (error: any) {
      logger.error('Erreur updateTransaction:', error);
      res.status(500).json({ success: false, error: error.message || 'Erreur lors de la mise a jour de la transaction' });
    }
  }

  static async validateTransaction(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { action, reason } = req.body;
      const tenantId = (req as any).user?.tenantId;
      const userId = (req as any).user?.userId;
      if (!tenantId || !userId) {
        return res.status(401).json({ success: false, error: 'Authentification manquante' });
      }

      let result;
      switch (action) {
        case 'submit':
          result = await TransactionService.submitTransaction(id, tenantId, userId);
          break;
        case 'approve':
          result = await TransactionService.approveTransaction(id, tenantId, userId);
          break;
        case 'reject':
          result = await TransactionService.rejectTransaction(id, tenantId, userId, reason);
          break;
        case 'execute':
          result = await TransactionService.executeTransaction(id, tenantId, userId);
          break;
        default:
          return res.status(400).json({ success: false, error: 'Action invalide' });
      }

      res.json(result);
    } catch (error: any) {
      logger.error('Erreur validateTransaction:', error);
      res.status(500).json({ success: false, error: error.message || 'Erreur lors de la validation de la transaction' });
    }
  }

  static async deleteTransaction(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const tenantId = (req as any).user?.tenantId;
      if (!tenantId) {
        return res.status(401).json({ success: false, error: 'Tenant ID manquant' });
      }

      const result = await TransactionService.deleteTransaction(id, tenantId);
      res.json(result);
    } catch (error: any) {
      logger.error('Erreur deleteTransaction:', error);
      res.status(500).json({ success: false, error: error.message || 'Erreur lors de la suppression de la transaction' });
    }
  }

  static async getTransactionStats(req: Request, res: Response) {
    try {
      const tenantId = (req as any).user?.tenantId;
      if (!tenantId) {
        return res.status(401).json({ success: false, error: 'Tenant ID manquant' });
      }

      const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined;
      const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;

      const stats = await TransactionService.getTransactionStats(tenantId, startDate, endDate);
      res.json({ success: true, data: stats });
    } catch (error) {
      logger.error('Erreur getTransactionStats:', error);
      res.status(500).json({ success: false, error: 'Erreur lors de la recuperation des statistiques' });
    }
  }

  /**
   * GET /api/financial/categories
   * Liste des catégories budgétaires
   */
  static async getCategories(req: Request, res: Response) {
    try {
      const tenantId = (req as any).user?.tenantId;
      if (!tenantId) {
        return res.status(401).json({
          success: false,
          error: 'Tenant ID manquant'
        });
      }

      const categories = await FinancialService.getCategories(tenantId);

      res.json({
        success: true,
        data: { categories }
      });
    } catch (error) {
      logger.error('Erreur récupération catégories:', error);
      res.status(500).json({
        success: false,
        error: 'Erreur serveur',
        message: 'Erreur lors de la récupération des catégories'
      });
    }
  }

  /**
   * POST /api/financial/categories
   * Créer une catégorie budgétaire
   */
  static async createCategory(req: Request, res: Response) {
    try {
      const tenantId = (req as any).user?.tenantId;
      const userId = (req as any).user?.userId;

      if (!tenantId || !userId) {
        return res.status(401).json({
          success: false,
          error: 'Authentification manquante'
        });
      }

      const { nom, code, description } = req.body;

      const categoryData = {
        nom,
        code,
        description: description || `${nom} - ${code}`
      };

      const newCategory = await FinancialService.createCategory(tenantId, userId, categoryData);

      res.status(201).json({
        success: true,
        message: 'Catégorie créée avec succès',
        data: { category: newCategory }
      });
    } catch (error: any) {
      logger.error('Erreur création catégorie:', error);
      res.status(500).json({
        success: false,
        error: 'Erreur serveur',
        message: error.message || 'Erreur lors de la création de la catégorie'
      });
    }
  }

  /**
   * PUT /api/financial/categories/:id
   * Modifier une catégorie budgétaire
   */
  static async updateCategory(req: Request, res: Response) {
    try {
      const tenantId = (req as any).user?.tenantId;
      const userId = (req as any).user?.userId;

      if (!tenantId || !userId) {
        return res.status(401).json({
          success: false,
          error: 'Authentification manquante'
        });
      }

      const { id } = req.params;
      const updateData = req.body;

      const updatedCategory = await FinancialService.updateCategory(id, tenantId, userId, updateData);

      res.json({
        success: true,
        message: 'Catégorie modifiée avec succès',
        data: { category: updatedCategory }
      });
    } catch (error: any) {
      logger.error('Erreur modification catégorie:', error);
      res.status(500).json({
        success: false,
        error: 'Erreur serveur',
        message: error.message || 'Erreur lors de la modification de la catégorie'
      });
    }
  }

  /**
   * GET /api/financial/reports
   * Générer des rapports financiers
   */
  static async getReports(req: Request, res: Response) {
    try {
      const tenantId = (req as any).user?.tenantId;
      if (!tenantId) {
        return res.status(401).json({
          success: false,
          error: 'Tenant ID manquant'
        });
      }

      const reports = await FinancialService.getReports(tenantId);

      res.json({
        success: true,
        data: { reports }
      });
    } catch (error) {
      logger.error('Erreur génération rapports:', error);
      res.status(500).json({
        success: false,
        error: 'Erreur serveur',
        message: 'Erreur lors de la génération des rapports'
      });
    }
  }

  /**
   * GET /api/financial/reports/budget-execution
   * Rapport d'exécution budgétaire
   */
  static async getBudgetExecutionReport(req: Request, res: Response) {
    try {
      const tenantId = (req as any).user?.tenantId;
      if (!tenantId) {
        return res.status(401).json({
          success: false,
          error: 'Tenant ID manquant'
        });
      }

      const report = await FinancialService.getBudgetExecutionReport(tenantId);

      res.json({
        success: true,
        data: { report }
      });
    } catch (error) {
      logger.error('Erreur rapport exécution budgétaire:', error);
      res.status(500).json({
        success: false,
        error: 'Erreur serveur',
        message: 'Erreur lors de la génération du rapport d\'exécution budgétaire'
      });
    }
  }

  /**
   * GET /api/financial/reports/transactions
   * Rapport des transactions
   */
  static async getTransactionsReport(req: Request, res: Response) {
    try {
      const tenantId = (req as any).user?.tenantId;
      if (!tenantId) {
        return res.status(401).json({
          success: false,
          error: 'Tenant ID manquant'
        });
      }

      const report = await FinancialService.getTransactionsReport(tenantId);

      res.json({
        success: true,
        data: { report }
      });
    } catch (error) {
      logger.error('Erreur rapport transactions:', error);
      res.status(500).json({
        success: false,
        error: 'Erreur serveur',
        message: 'Erreur lors de la génération du rapport de transactions'
      });
    }
  }

  /**
   * GET /api/financial/reports/export/:format
   * Exporter des rapports (Excel/PDF)
   */
  static async exportReport(req: Request, res: Response) {
    try {
      const tenantId = (req as any).user?.tenantId;
      if (!tenantId) {
        return res.status(401).json({
          success: false,
          error: 'Tenant ID manquant'
        });
      }

      const { format } = req.params;
      const { reportId } = req.query;

      if (!['excel', 'pdf'].includes(format)) {
        return res.status(400).json({
          success: false,
          error: 'Format invalide. Utilisez "excel" ou "pdf"'
        });
      }

      const buffer = await FinancialService.exportReport(reportId as string || 'budget-execution', format as 'excel' | 'pdf', tenantId);

      const mimeType = format === 'excel'
        ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        : 'application/pdf';

      const extension = format === 'excel' ? 'xlsx' : 'pdf';

      res.setHeader('Content-Type', mimeType);
      res.setHeader('Content-Disposition', `attachment; filename=rapport-financier-${Date.now()}.${extension}`);
      res.setHeader('Content-Length', buffer.length);

      res.send(buffer);
    } catch (error) {
      logger.error('Erreur export rapport:', error);
      res.status(500).json({
        success: false,
        error: 'Erreur serveur',
        message: 'Erreur lors de l\'export du rapport'
      });
    }
  }

  /**
   * GET /api/financial/validations/pending
   * Liste des validations en attente
   */
  static async getPendingValidations(req: Request, res: Response) {
    try {
      const tenantId = (req as any).user?.tenantId;
      if (!tenantId) {
        return res.status(401).json({
          success: false,
          error: 'Tenant ID manquant'
        });
      }

      const validations = await FinancialService.getPendingValidations(tenantId);

      res.json({
        success: true,
        data: { validations }
      });
    } catch (error) {
      logger.error('Erreur récup validations en attente:', error);
      res.status(500).json({
        success: false,
        error: 'Erreur serveur',
        message: 'Erreur lors de la récupération des validations en attente'
      });
    }
  }

  /**
   * GET /api/financial/validations/history
   * Historique des validations
   */
  static async getValidationHistory(req: Request, res: Response) {
    try {
      const tenantId = (req as any).user?.tenantId;
      if (!tenantId) {
        return res.status(401).json({
          success: false,
          error: 'Tenant ID manquant'
        });
      }

      const history = await FinancialService.getValidationHistory(tenantId);

      res.json({
        success: true,
        data: { history }
      });
    } catch (error) {
      logger.error('Erreur récup historique validations:', error);
      res.status(500).json({
        success: false,
        error: 'Erreur serveur',
        message: 'Erreur lors de la récupération de l\'historique des validations'
      });
    }
  }

  /**
   * GET /api/financial/dashboard/kpis
   * KPIs financiers pour le dashboard
   */
  static async getFinancialKPIs(req: Request, res: Response) {
    try {
      const tenantId = (req as any).user?.tenantId;
      if (!tenantId) {
        return res.status(401).json({
          success: false,
          error: 'Tenant ID manquant'
        });
      }

      const kpis = await FinancialService.getFinancialKPIs(tenantId);

      res.json({
        success: true,
        data: { kpis }
      });
    } catch (error) {
      logger.error('Erreur récup KPIs financiers:', error);
      res.status(500).json({
        success: false,
        error: 'Erreur serveur',
        message: 'Erreur lors de la récupération des KPIs financiers'
      });
    }
  }

  /**
   * GET /api/financial/dashboard/evolution
   * Évolution des indicateurs financiers
   */
  static async getFinancialEvolution(req: Request, res: Response) {
    try {
      const tenantId = (req as any).user?.tenantId;
      if (!tenantId) {
        return res.status(401).json({
          success: false,
          error: 'Tenant ID manquant'
        });
      }

      const { period } = req.query;
      const evolution = await FinancialService.getFinancialEvolution(tenantId, period as string);

      res.json({
        success: true,
        data: { evolution }
      });
    } catch (error) {
      logger.error('Erreur récup évolution financière:', error);
      res.status(500).json({
        success: false,
        error: 'Erreur serveur',
        message: 'Erreur lors de la récupération de l\'évolution financière'
      });
    }
  }

  /**
   * GET /api/financial/dashboard/alerts
   * Alertes financières
   */
  static async getFinancialAlerts(req: Request, res: Response) {
    try {
      const tenantId = (req as any).user?.tenantId;
      if (!tenantId) {
        return res.status(401).json({
          success: false,
          error: 'Tenant ID manquant'
        });
      }

      const alerts = await FinancialService.getFinancialAlerts(tenantId);

      res.json({
        success: true,
        data: { alerts }
      });
    } catch (error) {
      logger.error('Erreur récup alertes financières:', error);
      res.status(500).json({
        success: false,
        error: 'Erreur serveur',
        message: 'Erreur lors de la récupération des alertes financières'
      });
    }
  }
}

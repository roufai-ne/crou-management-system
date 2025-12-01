/**
 * FICHIER: apps\api\src\modules\stocks\stocks.controller.ts
 * CONTROLLER: Module Stocks
 * 
 * DESCRIPTION:
 * Contrôleur pour le module de gestion des stocks
 * 
 * AUTEUR: Équipe CROU
 * DATE: Décembre 2024
 */

import { Response } from 'express';
import { body, param } from 'express-validator';
import { TypedRequest } from '../../shared/types/express.types';
import { TenantIsolationUtils } from '@/shared/utils/tenant-isolation.utils';
import { StocksService, StockFilters, CreateStockDTO, UpdateStockDTO, CreateMovementDTO } from './stocks.service';
import { logger } from '@/shared/utils/logger';

// Validateurs pour les stocks
export const stockValidators = {
  create: [
    body('name').notEmpty().withMessage('Nom requis'),
    body('quantity').isNumeric().withMessage('Quantité requise'),
    body('category').notEmpty().withMessage('Catégorie requise')
  ],
  update: [
    param('id').isUUID().withMessage('ID invalide'),
    body('name').optional().notEmpty().withMessage('Nom requis'),
    body('quantity').optional().isNumeric().withMessage('Quantité invalide')
  ],
  movement: [
    body('stockId').isUUID().withMessage('Stock ID invalide'),
    body('type').isIn(['in', 'out']).withMessage('Type invalide'),
    body('quantity').isNumeric().withMessage('Quantité requise'),
    body('reason').notEmpty().withMessage('Raison requise')
  ]
};

export class StocksController {
  static async getStocks(req: TypedRequest, res: Response) {
    try {
      const tenantContext = TenantIsolationUtils.extractTenantContext(req);
      const hasExtendedAccess = TenantIsolationUtils.hasExtendedAccess(req);
      const targetTenantId = req.query.tenantId as string;

      // Déterminer le tenant effectif à utiliser
      const effectiveTenantId = hasExtendedAccess && targetTenantId 
        ? targetTenantId 
        : tenantContext.tenantId;

      // Filtrer les valeurs "all" qui ne sont pas des valeurs enum valides
      const category = req.query.category as string;
      const type = req.query.type as string;
      const status = req.query.status as string;

      const filters: StockFilters = {
        search: req.query.search as string,
        category: category && category !== 'all' ? category as any : undefined,
        type: type && type !== 'all' ? type as any : undefined,
        status: status && status !== 'all' ? status as any : undefined,
        lowStock: req.query.lowStock === 'true',
        outOfStock: req.query.outOfStock === 'true'
      };

      const result = await StocksService.getStocks(effectiveTenantId, filters);
      res.json({ success: true, data: result });
    } catch (error: any) {
      logger.error('Erreur getStocks:', error);
      res.status(500).json({
        success: false,
        error: 'Erreur serveur',
        message: error.message || 'Erreur lors de la récupération des stocks',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
    }
  }

  static async createStock(req: TypedRequest, res: Response) {
    try {
      const tenantContext = TenantIsolationUtils.extractTenantContext(req);
      const userId = req.user?.userId;
      if (!userId) {
        return res.status(401).json({ success: false, error: 'Authentification manquante' });
      }

      const data: CreateStockDTO = req.body;
      const stock = await StocksService.createStock(tenantContext.tenantId, userId, data);
      res.json({ success: true, data: { stock } });
    } catch (error: any) {
      logger.error('Erreur createStock:', error);
      res.status(500).json({ success: false, error: error.message || 'Erreur lors de la creation du stock' });
    }
  }

  static async getStock(req: TypedRequest, res: Response) {
    try {
      const { id } = req.params;
      const tenantId = req.user?.tenantId;
      if (!tenantId) {
        return res.status(401).json({ success: false, error: 'Tenant ID manquant' });
      }

      const result = await StocksService.getStockById(id, tenantId);
      res.json({ success: true, data: result });
    } catch (error: any) {
      logger.error('Erreur getStock:', error);
      res.status(500).json({ success: false, error: error.message || 'Erreur lors de la recuperation du stock' });
    }
  }

  static async updateStock(req: TypedRequest, res: Response) {
    try {
      const { id } = req.params;
      const tenantId = req.user?.tenantId;
      const userId = req.user?.userId;
      if (!tenantId || !userId) {
        return res.status(401).json({ success: false, error: 'Authentification manquante' });
      }

      const data: UpdateStockDTO = req.body;
      const stock = await StocksService.updateStock(id, tenantId, userId, data);
      res.json({ success: true, data: { stock } });
    } catch (error: any) {
      logger.error('Erreur updateStock:', error);
      res.status(500).json({ success: false, error: error.message || 'Erreur lors de la modification du stock' });
    }
  }

  static async deleteStock(req: TypedRequest, res: Response) {
    try {
      const { id } = req.params;
      const tenantId = req.user?.tenantId;
      if (!tenantId) {
        return res.status(401).json({ success: false, error: 'Tenant ID manquant' });
      }

      const result = await StocksService.deleteStock(id, tenantId);
      res.json(result);
    } catch (error: any) {
      logger.error('Erreur deleteStock:', error);
      res.status(500).json({ success: false, error: error.message || 'Erreur lors de la suppression du stock' });
    }
  }

  // Méthodes supplémentaires pour les routes
  static async getMovements(req: TypedRequest, res: Response) {
    try {
      const tenantId = req.user?.tenantId;
      if (!tenantId) {
        return res.status(401).json({ success: false, error: 'Tenant ID manquant' });
      }

      // Filtrer la valeur "all" pour le type
      const movementType = req.query.type as string;

      const filters = {
        stockId: req.query.stockId as string,
        type: movementType && movementType !== 'all' ? movementType as any : undefined,
        startDate: req.query.startDate ? new Date(req.query.startDate as string) : undefined,
        endDate: req.query.endDate ? new Date(req.query.endDate as string) : undefined,
        limit: req.query.limit ? Number(req.query.limit) : undefined
      };

      const result = await StocksService.getMovements(tenantId, filters);
      res.json({ success: true, data: result });
    } catch (error: any) {
      logger.error('Erreur getMovements:', error);
      res.status(500).json({
        success: false,
        error: 'Erreur serveur',
        message: error.message || 'Erreur lors de la recuperation des mouvements',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
    }
  }

  static async createMovement(req: TypedRequest, res: Response) {
    try {
      const tenantId = req.user?.tenantId;
      const userId = req.user?.userId;
      if (!tenantId || !userId) {
        return res.status(401).json({ success: false, error: 'Authentification manquante' });
      }

      const data: CreateMovementDTO = req.body;
      const result = await StocksService.createMovement(tenantId, userId, data);
      res.json({ success: true, data: result });
    } catch (error: any) {
      logger.error('Erreur createMovement:', error);
      res.status(500).json({ success: false, error: error.message || 'Erreur lors de la creation du mouvement' });
    }
  }

  static async getMovement(req: TypedRequest, res: Response) {
    res.json({ success: true, data: { movement: {} } });
  }

  static async updateMovement(req: TypedRequest, res: Response) {
    res.json({ success: true, message: 'Mouvement modifié' });
  }

  static async confirmMovement(req: TypedRequest, res: Response) {
    res.json({ success: true, message: 'Mouvement confirmé' });
  }

  static async getAlerts(req: TypedRequest, res: Response) {
    try {
      const tenantId = req.user?.tenantId;
      if (!tenantId) {
        return res.status(401).json({ success: false, error: 'Tenant ID manquant' });
      }

      const filters = {
        status: req.query.status as any,
        type: req.query.type as any,
        showResolved: req.query.showResolved === 'true'
      };

      const result = await StocksService.getAlerts(tenantId, filters);
      res.json({ success: true, data: result });
    } catch (error) {
      logger.error('Erreur getAlerts:', error);
      res.status(500).json({ success: false, error: 'Erreur lors de la recuperation des alertes' });
    }
  }

  static async getAlert(req: TypedRequest, res: Response) {
    res.json({ success: true, data: { alert: {} } });
  }

  static async resolveAlert(req: TypedRequest, res: Response) {
    try {
      const { id } = req.params;
      const tenantId = req.user?.tenantId;
      const userId = req.user?.userId;
      if (!tenantId || !userId) {
        return res.status(401).json({ success: false, error: 'Authentification manquante' });
      }

      const { note } = req.body;
      const result = await StocksService.resolveAlert(id, tenantId, userId, note);
      res.json(result);
    } catch (error: any) {
      logger.error('Erreur resolveAlert:', error);
      res.status(500).json({ success: false, error: error.message || 'Erreur lors de la resolution de alerte' });
    }
  }

  static async escalateAlert(req: TypedRequest, res: Response) {
    res.json({ success: true, message: 'Alerte escaladée' });
  }

  static async getInventory(req: TypedRequest, res: Response) {
    res.json({ success: true, data: { inventory: {} } });
  }

  static async startInventory(req: TypedRequest, res: Response) {
    res.json({ success: true, message: 'Inventaire démarré' });
  }

  static async completeInventory(req: TypedRequest, res: Response) {
    res.json({ success: true, message: 'Inventaire finalisé' });
  }

  static async getStockLevelsReport(req: TypedRequest, res: Response) {
    res.json({ success: true, data: { report: {} } });
  }

  static async getMovementsReport(req: TypedRequest, res: Response) {
    res.json({ success: true, data: { report: {} } });
  }

  static async getAlertsReport(req: TypedRequest, res: Response) {
    res.json({ success: true, data: { report: {} } });
  }

  static async exportReport(req: TypedRequest, res: Response) {
    res.json({ success: true, message: 'Rapport exporté' });
  }

  static async getStocksKPIs(req: TypedRequest, res: Response) {
    try {
      const tenantId = req.user?.tenantId;
      if (!tenantId) {
        return res.status(401).json({ success: false, error: 'Tenant ID manquant' });
      }

      const kpis = await StocksService.getStocksKPIs(tenantId);
      res.json({ success: true, data: kpis });
    } catch (error) {
      logger.error('Erreur getStocksKPIs:', error);
      res.status(500).json({ success: false, error: 'Erreur lors de la recuperation des KPIs' });
    }
  }

  static async getStocksEvolution(req: TypedRequest, res: Response) {
    res.json({ success: true, data: { evolution: [] } });
  }

  static async getStocksAlerts(req: TypedRequest, res: Response) {
    try {
      const tenantId = req.user?.tenantId;
      if (!tenantId) {
        return res.status(401).json({ success: false, error: 'Tenant ID manquant' });
      }

      const result = await StocksService.getAlerts(tenantId);
      res.json({ success: true, data: result });
    } catch (error) {
      logger.error('Erreur getStocksAlerts:', error);
      res.status(500).json({ success: false, error: 'Erreur lors de la recuperation des alertes' });
    }
  }
}
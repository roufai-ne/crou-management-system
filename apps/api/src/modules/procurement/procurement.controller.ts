/**
 * FICHIER: apps/api/src/modules/procurement/procurement.controller.ts
 * CONTROLLER: Gestion des achats et commandes
 * 
 * DESCRIPTION:
 * Contrôleur pour les endpoints de procurement (achats)
 * Gestion du workflow complet : création, validation, réception
 * 
 * AUTEUR: Équipe CROU
 * DATE: Novembre 2025
 */

import { Request, Response } from 'express';
import { body, param, validationResult } from 'express-validator';
import { logger } from '@/shared/utils/logger';
import { 
  ProcurementService, 
  CreatePurchaseOrderDTO, 
  UpdatePurchaseOrderDTO,
  ReceivePurchaseOrderDTO 
} from './procurement.service';
import { PurchaseOrderStatus } from '../../../../../packages/database/src/entities/PurchaseOrder.entity';

// Validateurs pour les bons de commande
export const purchaseOrderValidators = {
  create: [
    body('budgetId').isUUID().withMessage('Budget ID invalide'),
    body('supplierId').isUUID().withMessage('Fournisseur ID invalide'),
    body('objet').notEmpty().withMessage('Objet requis'),
    body('dateEcheance').isISO8601().withMessage('Date d\'échéance invalide'),
    body('items').isArray({ min: 1 }).withMessage('Au moins un article requis'),
    body('items.*.designation').notEmpty().withMessage('Désignation article requise'),
    body('items.*.quantiteCommandee').isFloat({ min: 0.001 }).withMessage('Quantité invalide'),
    body('items.*.unite').notEmpty().withMessage('Unité requise'),
    body('items.*.prixUnitaire').isFloat({ min: 0 }).withMessage('Prix unitaire invalide')
  ],
  
  submit: [
    param('id').isUUID().withMessage('ID invalide')
  ],

  approve: [
    param('id').isUUID().withMessage('ID invalide'),
    body('commentaire').optional().isString()
  ],

  receive: [
    param('id').isUUID().withMessage('ID invalide'),
    body('receptionDate').isISO8601().withMessage('Date de réception invalide'),
    body('items').isArray({ min: 1 }).withMessage('Au moins un article à réceptionner'),
    body('items.*.itemId').isUUID().withMessage('Item ID invalide'),
    body('items.*.quantiteRecue').isFloat({ min: 0.001 }).withMessage('Quantité reçue invalide')
  ],

  cancel: [
    param('id').isUUID().withMessage('ID invalide'),
    body('motif').notEmpty().withMessage('Motif d\'annulation requis')
  ]
};

export class ProcurementController {
  /**
   * GET /api/procurement/purchase-orders
   * Liste des bons de commande avec filtres
   */
  static async getPurchaseOrders(req: Request, res: Response) {
    try {
      const tenantId = (req as any).user?.tenantId;
      if (!tenantId) {
        return res.status(401).json({
          success: false,
          error: 'Tenant ID manquant'
        });
      }

      const { status, supplierId, budgetId, dateFrom, dateTo, search } = req.query;

      const filters: any = {};
      if (status) filters.status = status as PurchaseOrderStatus;
      if (supplierId) filters.supplierId = supplierId as string;
      if (budgetId) filters.budgetId = budgetId as string;
      if (dateFrom) filters.dateFrom = new Date(dateFrom as string);
      if (dateTo) filters.dateTo = new Date(dateTo as string);
      if (search) filters.search = search as string;

      const orders = await ProcurementService.getPurchaseOrders(tenantId, filters);

      res.json({
        success: true,
        data: { orders },
        count: orders.length
      });
    } catch (error: any) {
      logger.error('Erreur récupération BCs:', error);
      res.status(500).json({
        success: false,
        error: 'Erreur serveur',
        message: error.message
      });
    }
  }

  /**
   * GET /api/procurement/purchase-orders/:id
   * Détails d'un bon de commande
   */
  static async getPurchaseOrder(req: Request, res: Response) {
    try {
      const tenantId = (req as any).user?.tenantId;
      if (!tenantId) {
        return res.status(401).json({
          success: false,
          error: 'Tenant ID manquant'
        });
      }

      const { id } = req.params;

      const order = await ProcurementService.getPurchaseOrderById(id, tenantId);

      if (!order) {
        return res.status(404).json({
          success: false,
          error: 'Bon de commande non trouvé'
        });
      }

      res.json({
        success: true,
        data: { order }
      });
    } catch (error: any) {
      logger.error('Erreur récupération BC:', error);
      res.status(500).json({
        success: false,
        error: 'Erreur serveur',
        message: error.message
      });
    }
  }

  /**
   * POST /api/procurement/purchase-orders
   * Créer un nouveau bon de commande (draft)
   */
  static async createPurchaseOrder(req: Request, res: Response) {
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

      const data: CreatePurchaseOrderDTO = req.body;

      const order = await ProcurementService.createPurchaseOrder(tenantId, userId, data);

      res.status(201).json({
        success: true,
        message: 'Bon de commande créé avec succès',
        data: { order }
      });
    } catch (error: any) {
      logger.error('Erreur création BC:', error);
      res.status(500).json({
        success: false,
        error: 'Erreur serveur',
        message: error.message
      });
    }
  }

  /**
   * POST /api/procurement/purchase-orders/:id/submit
   * Soumettre un BC pour approbation
   */
  static async submitPurchaseOrder(req: Request, res: Response) {
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

      const order = await ProcurementService.submitPurchaseOrder(id, tenantId, userId);

      res.json({
        success: true,
        message: 'BC soumis pour approbation',
        data: { order }
      });
    } catch (error: any) {
      logger.error('Erreur soumission BC:', error);
      res.status(500).json({
        success: false,
        error: 'Erreur serveur',
        message: error.message
      });
    }
  }

  /**
   * POST /api/procurement/purchase-orders/:id/approve
   * Approuver un BC (Directeur)
   */
  static async approvePurchaseOrder(req: Request, res: Response) {
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
      const { commentaire } = req.body;

      const order = await ProcurementService.approvePurchaseOrder(id, tenantId, userId, commentaire);

      res.json({
        success: true,
        message: 'BC approuvé et budget engagé',
        data: { order }
      });
    } catch (error: any) {
      logger.error('Erreur approbation BC:', error);
      res.status(500).json({
        success: false,
        error: 'Erreur serveur',
        message: error.message
      });
    }
  }

  /**
   * POST /api/procurement/purchase-orders/:id/order
   * Marquer comme commandé (envoyé au fournisseur)
   */
  static async markAsOrdered(req: Request, res: Response) {
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

      const order = await ProcurementService.markAsOrdered(id, tenantId, userId);

      res.json({
        success: true,
        message: 'BC marqué comme commandé',
        data: { order }
      });
    } catch (error: any) {
      logger.error('Erreur BC commandé:', error);
      res.status(500).json({
        success: false,
        error: 'Erreur serveur',
        message: error.message
      });
    }
  }

  /**
   * POST /api/procurement/purchase-orders/:id/receive
   * Réceptionner un BC (total ou partiel)
   */
  static async receivePurchaseOrder(req: Request, res: Response) {
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
      const data: ReceivePurchaseOrderDTO = req.body;

      const order = await ProcurementService.receivePurchaseOrder(id, tenantId, userId, data);

      res.json({
        success: true,
        message: order.isFullyReceived 
          ? 'BC totalement réceptionné et stock mis à jour'
          : 'BC partiellement réceptionné',
        data: { order }
      });
    } catch (error: any) {
      logger.error('Erreur réception BC:', error);
      res.status(500).json({
        success: false,
        error: 'Erreur serveur',
        message: error.message
      });
    }
  }

  /**
   * POST /api/procurement/purchase-orders/:id/cancel
   * Annuler un BC
   */
  static async cancelPurchaseOrder(req: Request, res: Response) {
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
      const { motif } = req.body;

      const order = await ProcurementService.cancelPurchaseOrder(id, tenantId, userId, motif);

      res.json({
        success: true,
        message: 'BC annulé',
        data: { order }
      });
    } catch (error: any) {
      logger.error('Erreur annulation BC:', error);
      res.status(500).json({
        success: false,
        error: 'Erreur serveur',
        message: error.message
      });
    }
  }
}

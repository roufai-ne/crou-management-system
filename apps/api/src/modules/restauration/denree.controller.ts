/**
 * FICHIER: apps/api/src/modules/restauration/denree.controller.ts
 * CONTROLLER: Denree - Gestion des denrées allouées aux restaurants
 *
 * DESCRIPTION:
 * Controller Express pour les endpoints REST du module Denrées
 * Allocation, utilisation, retour de denrées
 * INTÉGRATION CRITIQUE avec module Stocks (bidirectionnelle)
 * Support multi-tenant strict
 *
 * AUTEUR: Équipe CROU - Module Restauration
 * DATE: Janvier 2025
 */

import { Request, Response } from 'express';
import { DenreeService, AllouerDenreeDTO } from './denree.service';
import { AllocationStatus, TypeMouvementDenree } from '@crou/database';
import { logger } from '@/shared/utils/logger';

// ========================================
// CONTROLLER
// ========================================

export class DenreeController {
  /**
   * GET /api/restauration/denrees
   * Récupérer toutes les allocations de denrées avec filtres
   */
  static async getDenrees(req: Request, res: Response) {
    try {
      const tenantId = (req as any).user?.tenantId;
      if (!tenantId) {
        return res.status(401).json({
          success: false,
          error: 'Tenant ID manquant'
        });
      }

      // Extraire les filtres de la query string
      const {
        restaurantId,
        status,
        alerteExpiration
      } = req.query;

      const filters = {
        restaurantId: restaurantId as string,
        status: status && status !== 'all' ? status as AllocationStatus : undefined,
        alerteExpiration: alerteExpiration === 'true'
      };

      const result = await DenreeService.getDenrees(tenantId, filters);

      res.json({
        success: true,
        data: result
      });
    } catch (error: any) {
      logger.error('[DenreeController.getDenrees] ERREUR:', error);
      res.status(500).json({
        success: false,
        error: 'Erreur serveur',
        message: error.message
      });
    }
  }

  /**
   * GET /api/restauration/denrees/restaurant/:restaurantId
   * Récupérer les denrées allouées à un restaurant
   */
  static async getDenreesRestaurant(req: Request, res: Response) {
    try {
      const tenantId = (req as any).user?.tenantId;
      if (!tenantId) {
        return res.status(401).json({
          success: false,
          error: 'Tenant ID manquant'
        });
      }

      const { restaurantId } = req.params;

      if (!restaurantId) {
        return res.status(400).json({
          success: false,
          error: 'ID restaurant manquant'
        });
      }

      const result = await DenreeService.getDenreesRestaurant(restaurantId, tenantId);

      res.json({
        success: true,
        data: result
      });
    } catch (error: any) {
      logger.error('[DenreeController.getDenreesRestaurant] ERREUR:', error);
      res.status(500).json({
        success: false,
        error: 'Erreur serveur',
        message: error.message
      });
    }
  }

  /**
   * POST /api/restauration/denrees/allouer
   * Allouer une denrée à un restaurant (INTÉGRATION STOCKS)
   */
  static async allouerDenree(req: Request, res: Response) {
    try {
      const tenantId = (req as any).user?.tenantId;
      const userId = (req as any).user?.userId;

      if (!tenantId || !userId) {
        return res.status(401).json({
          success: false,
          error: 'Authentification invalide'
        });
      }

      const data: AllouerDenreeDTO = req.body;

      // Validation des champs obligatoires
      if (!data.stockId || !data.restaurantId || data.quantiteAllouee === undefined || !data.datePeremption) {
        return res.status(400).json({
          success: false,
          error: 'Champs obligatoires manquants (stockId, restaurantId, quantiteAllouee, datePeremption)'
        });
      }

      const allocation = await DenreeService.allouerDenree(tenantId, userId, data);

      res.status(201).json({
        success: true,
        data: allocation
      });
    } catch (error: any) {
      logger.error('[DenreeController.allouerDenree] ERREUR:', error);

      if (error.message === 'Restaurant non trouvé' || error.message === 'Stock non trouvé') {
        return res.status(404).json({
          success: false,
          error: error.message
        });
      }

      if (error.message.includes('Stock insuffisant') || error.message.includes('Error deducting stock')) {
        return res.status(400).json({
          success: false,
          error: error.message
        });
      }

      res.status(500).json({
        success: false,
        error: 'Erreur serveur',
        message: error.message
      });
    }
  }

  /**
   * POST /api/restauration/denrees/:id/utiliser
   * Enregistrer l'utilisation d'une denrée
   */
  static async utiliserDenree(req: Request, res: Response) {
    try {
      const tenantId = (req as any).user?.tenantId;
      const userId = (req as any).user?.userId;

      if (!tenantId || !userId) {
        return res.status(401).json({
          success: false,
          error: 'Authentification invalide'
        });
      }

      const { id } = req.params;
      const { quantite, menuId, repasId } = req.body;

      if (!id) {
        return res.status(400).json({
          success: false,
          error: 'ID allocation manquant'
        });
      }

      if (quantite === undefined) {
        return res.status(400).json({
          success: false,
          error: 'Quantité manquante'
        });
      }

      const allocation = await DenreeService.utiliserDenree(id, tenantId, userId, quantite, menuId, repasId);

      res.json({
        success: true,
        data: allocation
      });
    } catch (error: any) {
      logger.error('[DenreeController.utiliserDenree] ERREUR:', error);

      if (error.message === 'Allocation non trouvée') {
        return res.status(404).json({
          success: false,
          error: error.message
        });
      }

      if (error.message.includes('Quantité insuffisante')) {
        return res.status(400).json({
          success: false,
          error: error.message
        });
      }

      res.status(500).json({
        success: false,
        error: 'Erreur serveur',
        message: error.message
      });
    }
  }

  /**
   * POST /api/restauration/denrees/:id/retourner
   * Retourner une denrée au stock central (INTÉGRATION STOCKS)
   */
  static async retournerDenree(req: Request, res: Response) {
    try {
      const tenantId = (req as any).user?.tenantId;
      const userId = (req as any).user?.userId;

      if (!tenantId || !userId) {
        return res.status(401).json({
          success: false,
          error: 'Authentification invalide'
        });
      }

      const { id } = req.params;
      const { quantite, motif } = req.body;

      if (!id) {
        return res.status(400).json({
          success: false,
          error: 'ID allocation manquant'
        });
      }

      if (quantite === undefined || !motif) {
        return res.status(400).json({
          success: false,
          error: 'Quantité ou motif manquant'
        });
      }

      const allocation = await DenreeService.retournerDenree(id, tenantId, userId, quantite, motif);

      res.json({
        success: true,
        data: allocation
      });
    } catch (error: any) {
      logger.error('[DenreeController.retournerDenree] ERREUR:', error);

      if (error.message === 'Allocation non trouvée') {
        return res.status(404).json({
          success: false,
          error: error.message
        });
      }

      if (error.message.includes('Quantité de retour supérieure')) {
        return res.status(400).json({
          success: false,
          error: error.message
        });
      }

      res.status(500).json({
        success: false,
        error: 'Erreur serveur',
        message: error.message
      });
    }
  }

  /**
   * POST /api/restauration/denrees/:id/perte
   * Enregistrer une perte de denrée
   */
  static async enregistrerPerte(req: Request, res: Response) {
    try {
      const tenantId = (req as any).user?.tenantId;
      const userId = (req as any).user?.userId;

      if (!tenantId || !userId) {
        return res.status(401).json({
          success: false,
          error: 'Authentification invalide'
        });
      }

      const { id } = req.params;
      const { quantite, motif } = req.body;

      if (!id) {
        return res.status(400).json({
          success: false,
          error: 'ID allocation manquant'
        });
      }

      if (quantite === undefined || !motif) {
        return res.status(400).json({
          success: false,
          error: 'Quantité ou motif de perte manquant'
        });
      }

      const allocation = await DenreeService.enregistrerPerte(id, tenantId, userId, quantite, motif);

      res.json({
        success: true,
        data: allocation
      });
    } catch (error: any) {
      logger.error('[DenreeController.enregistrerPerte] ERREUR:', error);

      if (error.message === 'Allocation non trouvée') {
        return res.status(404).json({
          success: false,
          error: error.message
        });
      }

      if (error.message.includes('Quantité de perte supérieure')) {
        return res.status(400).json({
          success: false,
          error: error.message
        });
      }

      res.status(500).json({
        success: false,
        error: 'Erreur serveur',
        message: error.message
      });
    }
  }

  /**
   * GET /api/restauration/denrees/alertes/expiration
   * Obtenir les alertes de péremption
   */
  static async getAlertesExpiration(req: Request, res: Response) {
    try {
      const tenantId = (req as any).user?.tenantId;

      if (!tenantId) {
        return res.status(401).json({
          success: false,
          error: 'Tenant ID manquant'
        });
      }

      const { joursAvance } = req.query;

      const jours = joursAvance ? parseInt(joursAvance as string, 10) : 7;

      const alertes = await DenreeService.getAlertesExpiration(tenantId, jours);

      res.json({
        success: true,
        data: alertes
      });
    } catch (error: any) {
      logger.error('[DenreeController.getAlertesExpiration] ERREUR:', error);
      res.status(500).json({
        success: false,
        error: 'Erreur serveur',
        message: error.message
      });
    }
  }

  /**
   * GET /api/restauration/denrees/:id/historique
   * Obtenir l'historique des mouvements d'une allocation
   */
  static async getHistoriqueMouvements(req: Request, res: Response) {
    try {
      const tenantId = (req as any).user?.tenantId;

      if (!tenantId) {
        return res.status(401).json({
          success: false,
          error: 'Tenant ID manquant'
        });
      }

      const { id } = req.params;

      if (!id) {
        return res.status(400).json({
          success: false,
          error: 'ID allocation manquant'
        });
      }

      const historique = await DenreeService.getHistoriqueMouvements(id, tenantId);

      res.json({
        success: true,
        data: historique
      });
    } catch (error: any) {
      logger.error('[DenreeController.getHistoriqueMouvements] ERREUR:', error);

      if (error.message === 'Allocation non trouvée') {
        return res.status(404).json({
          success: false,
          error: error.message
        });
      }

      res.status(500).json({
        success: false,
        error: 'Erreur serveur',
        message: error.message
      });
    }
  }
}

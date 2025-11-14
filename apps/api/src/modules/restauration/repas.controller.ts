/**
 * FICHIER: apps/api/src/modules/restauration/repas.controller.ts
 * CONTROLLER: Repas - Gestion des distributions de repas
 *
 * DESCRIPTION:
 * Controller Express pour les endpoints REST du module Repas
 * Distribution réelle de repas avec statistiques post-service
 * Calcul recettes, fréquentation, gaspillage
 * Support multi-tenant strict
 *
 * AUTEUR: Équipe CROU - Module Restauration
 * DATE: Janvier 2025
 */

import { Request, Response } from 'express';
import { RepasService, RepasFilters, CreateRepasDTO, TerminerServiceDTO } from './repas.service';
import { TypeRepas, RepasStatus } from '@crou/database';
import { logger } from '@/shared/utils/logger';

// ========================================
// CONTROLLER
// ========================================

export class RepasController {
  /**
   * GET /api/restauration/repas
   * Récupérer tous les repas avec filtres
   */
  static async getRepas(req: Request, res: Response) {
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
        dateDebut,
        dateFin,
        typeRepas,
        status,
        restaurantId
      } = req.query;

      const filters: RepasFilters = {
        dateDebut: dateDebut ? new Date(dateDebut as string) : undefined,
        dateFin: dateFin ? new Date(dateFin as string) : undefined,
        typeRepas: typeRepas && typeRepas !== 'all' ? typeRepas as TypeRepas : undefined,
        status: status && status !== 'all' ? status as RepasStatus : undefined,
        restaurantId: restaurantId as string
      };

      const result = await RepasService.getRepas(tenantId, filters);

      res.json({
        success: true,
        data: result
      });
    } catch (error: any) {
      logger.error('[RepasController.getRepas] ERREUR:', error);
      res.status(500).json({
        success: false,
        error: 'Erreur serveur',
        message: error.message
      });
    }
  }

  /**
   * GET /api/restauration/repas/:id
   * Récupérer un repas par ID
   */
  static async getRepasById(req: Request, res: Response) {
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
          error: 'ID repas manquant'
        });
      }

      const repas = await RepasService.getRepasById(id, tenantId);

      res.json({
        success: true,
        data: repas
      });
    } catch (error: any) {
      logger.error('[RepasController.getRepas] ERREUR:', error);

      if (error.message === 'Repas non trouvé') {
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

  /**
   * POST /api/restauration/repas
   * Créer une distribution de repas (planification)
   */
  static async createRepas(req: Request, res: Response) {
    try {
      const tenantId = (req as any).user?.tenantId;
      const userId = (req as any).user?.userId;

      if (!tenantId || !userId) {
        return res.status(401).json({
          success: false,
          error: 'Authentification invalide'
        });
      }

      const data: CreateRepasDTO = req.body;

      // Validation des champs obligatoires
      if (!data.restaurantId || !data.menuId || !data.dateService || !data.typeRepas || data.nombrePrevus === undefined) {
        return res.status(400).json({
          success: false,
          error: 'Champs obligatoires manquants'
        });
      }

      const repas = await RepasService.createRepas(tenantId, userId, data);

      res.status(201).json({
        success: true,
        data: repas
      });
    } catch (error: any) {
      logger.error('[RepasController.createRepas] ERREUR:', error);

      if (error.message === 'Restaurant non trouvé' || error.message === 'Menu non trouvé') {
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

  /**
   * POST /api/restauration/repas/:id/demarrer
   * Démarrer un service de repas
   */
  static async demarrerService(req: Request, res: Response) {
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

      if (!id) {
        return res.status(400).json({
          success: false,
          error: 'ID repas manquant'
        });
      }

      const repas = await RepasService.demarrerService(id, tenantId, userId);

      res.json({
        success: true,
        data: repas
      });
    } catch (error: any) {
      logger.error('[RepasController.demarrerService] ERREUR:', error);

      if (error.message === 'Repas non trouvé') {
        return res.status(404).json({
          success: false,
          error: error.message
        });
      }

      if (error.message === 'Seuls les repas planifiés peuvent être démarrés') {
        return res.status(403).json({
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
   * POST /api/restauration/repas/:id/terminer
   * Terminer un service et enregistrer les statistiques
   */
  static async terminerService(req: Request, res: Response) {
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
      const stats: TerminerServiceDTO = req.body;

      if (!id) {
        return res.status(400).json({
          success: false,
          error: 'ID repas manquant'
        });
      }

      // Validation des champs obligatoires
      if (
        stats.nombreServis === undefined ||
        stats.nombreTicketsUnitaires === undefined ||
        stats.nombreTicketsForfaits === undefined ||
        stats.nombreTicketsGratuits === undefined ||
        stats.recettesUnitaires === undefined ||
        stats.recettesForfaits === undefined ||
        stats.montantSubventions === undefined
      ) {
        return res.status(400).json({
          success: false,
          error: 'Statistiques incomplètes'
        });
      }

      const repas = await RepasService.terminerService(id, tenantId, userId, stats);

      res.json({
        success: true,
        data: repas
      });
    } catch (error: any) {
      logger.error('[RepasController.terminerService] ERREUR:', error);

      if (error.message === 'Repas non trouvé') {
        return res.status(404).json({
          success: false,
          error: error.message
        });
      }

      if (error.message === 'Seuls les repas en cours peuvent être terminés') {
        return res.status(403).json({
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
   * GET /api/restauration/repas/:id/statistiques
   * Calculer les statistiques d'un repas
   */
  static async calculerStatistiques(req: Request, res: Response) {
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
          error: 'ID repas manquant'
        });
      }

      const statistiques = await RepasService.calculerStatistiques(id, tenantId);

      res.json({
        success: true,
        data: statistiques
      });
    } catch (error: any) {
      logger.error('[RepasController.calculerStatistiques] ERREUR:', error);

      if (error.message === 'Repas non trouvé') {
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

  /**
   * GET /api/restauration/repas/restaurant/:restaurantId/periode
   * Obtenir les repas d'un restaurant pour une période
   */
  static async getRepasByRestaurantAndPeriode(req: Request, res: Response) {
    try {
      const tenantId = (req as any).user?.tenantId;

      if (!tenantId) {
        return res.status(401).json({
          success: false,
          error: 'Tenant ID manquant'
        });
      }

      const { restaurantId } = req.params;
      const { dateDebut, dateFin } = req.query;

      if (!restaurantId || !dateDebut || !dateFin) {
        return res.status(400).json({
          success: false,
          error: 'Restaurant ID, dateDebut ou dateFin manquant'
        });
      }

      const result = await RepasService.getRepasByRestaurantAndPeriode(
        restaurantId,
        tenantId,
        new Date(dateDebut as string),
        new Date(dateFin as string)
      );

      res.json({
        success: true,
        data: result
      });
    } catch (error: any) {
      logger.error('[RepasController.getRepasByRestaurantAndPeriode] ERREUR:', error);
      res.status(500).json({
        success: false,
        error: 'Erreur serveur',
        message: error.message
      });
    }
  }

  /**
   * POST /api/restauration/repas/:id/annuler
   * Annuler un repas
   */
  static async annulerRepas(req: Request, res: Response) {
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
      const { motif } = req.body;

      if (!id) {
        return res.status(400).json({
          success: false,
          error: 'ID repas manquant'
        });
      }

      if (!motif) {
        return res.status(400).json({
          success: false,
          error: 'Motif d\'annulation manquant'
        });
      }

      const repas = await RepasService.annulerRepas(id, tenantId, userId, motif);

      res.json({
        success: true,
        data: repas
      });
    } catch (error: any) {
      logger.error('[RepasController.annulerRepas] ERREUR:', error);

      if (error.message === 'Repas non trouvé') {
        return res.status(404).json({
          success: false,
          error: error.message
        });
      }

      if (error.message === 'Impossible d\'annuler un repas terminé') {
        return res.status(403).json({
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

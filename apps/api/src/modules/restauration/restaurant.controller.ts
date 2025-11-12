/**
 * FICHIER: apps/api/src/modules/restauration/restaurant.controller.ts
 * CONTROLLER: Restaurant - Gestion des restaurants universitaires
 *
 * DESCRIPTION:
 * Controller Express pour exposer les endpoints REST du module Restauration
 * Gestion CRUD des restaurants avec validation et permissions
 * Support multi-tenant strict
 *
 * AUTEUR: Équipe CROU - Module Restauration
 * DATE: Janvier 2025
 */

import { Request, Response } from 'express';
import { RestaurantService, RestaurantFilters, CreateRestaurantDTO, UpdateRestaurantDTO } from './restaurant.service';
import { RestaurantType, RestaurantStatus } from '@crou/database';
import { logger } from '@/shared/utils/logger';

// ========================================
// CONTROLLER
// ========================================

export class RestaurantController {
  /**
   * GET /api/restauration/restaurants
   * Récupérer tous les restaurants avec filtres
   */
  static async getRestaurants(req: Request, res: Response) {
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
        search,
        type,
        status,
        ville
      } = req.query;

      const filters: RestaurantFilters = {
        search: search as string,
        type: type && type !== 'all' ? type as RestaurantType : undefined,
        status: status && status !== 'all' ? status as RestaurantStatus : undefined,
        ville: ville as string
      };

      const result = await RestaurantService.getRestaurants(tenantId, filters);

      res.json({
        success: true,
        data: result
      });
    } catch (error: any) {
      logger.error('[RestaurantController.getRestaurants] ERREUR:', error);
      res.status(500).json({
        success: false,
        error: 'Erreur serveur',
        message: error.message
      });
    }
  }

  /**
   * GET /api/restauration/restaurants/:id
   * Récupérer un restaurant par ID
   */
  static async getRestaurant(req: Request, res: Response) {
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
          error: 'ID restaurant manquant'
        });
      }

      const restaurant = await RestaurantService.getRestaurantById(id, tenantId);

      res.json({
        success: true,
        data: restaurant
      });
    } catch (error: any) {
      logger.error('[RestaurantController.getRestaurant] ERREUR:', error);

      if (error.message === 'Restaurant non trouvé') {
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
   * POST /api/restauration/restaurants
   * Créer un nouveau restaurant
   */
  static async createRestaurant(req: Request, res: Response) {
    try {
      const tenantId = (req as any).user?.tenantId;
      const userId = (req as any).user?.userId;

      if (!tenantId || !userId) {
        return res.status(401).json({
          success: false,
          error: 'Authentification invalide'
        });
      }

      const data: CreateRestaurantDTO = req.body;

      // Validation des champs obligatoires
      if (!data.code || !data.nom || !data.type || !data.adresse || !data.capaciteAccueil) {
        return res.status(400).json({
          success: false,
          error: 'Champs obligatoires manquants'
        });
      }

      const restaurant = await RestaurantService.createRestaurant(tenantId, userId, data);

      res.status(201).json({
        success: true,
        data: restaurant
      });
    } catch (error: any) {
      logger.error('[RestaurantController.createRestaurant] ERREUR:', error);

      if (error.message.includes('déjà utilisé') || error.message.includes('already used')) {
        return res.status(409).json({
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
   * PUT /api/restauration/restaurants/:id
   * Mettre à jour un restaurant
   */
  static async updateRestaurant(req: Request, res: Response) {
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
          error: 'ID restaurant manquant'
        });
      }

      const data: UpdateRestaurantDTO = req.body;

      const restaurant = await RestaurantService.updateRestaurant(id, tenantId, userId, data);

      res.json({
        success: true,
        data: restaurant
      });
    } catch (error: any) {
      logger.error('[RestaurantController.updateRestaurant] ERREUR:', error);

      if (error.message === 'Restaurant non trouvé') {
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
   * DELETE /api/restauration/restaurants/:id
   * Supprimer un restaurant (soft delete)
   */
  static async deleteRestaurant(req: Request, res: Response) {
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
          error: 'ID restaurant manquant'
        });
      }

      const result = await RestaurantService.deleteRestaurant(id, tenantId, userId);

      res.json({
        success: true,
        data: result
      });
    } catch (error: any) {
      logger.error('[RestaurantController.deleteRestaurant] ERREUR:', error);

      if (error.message === 'Restaurant non trouvé') {
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
   * GET /api/restauration/restaurants/:id/statistics
   * Récupérer les statistiques d'un restaurant
   */
  static async getRestaurantStatistics(req: Request, res: Response) {
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
          error: 'ID restaurant manquant'
        });
      }

      const statistics = await RestaurantService.getRestaurantStatistics(id, tenantId);

      res.json({
        success: true,
        data: statistics
      });
    } catch (error: any) {
      logger.error('[RestaurantController.getRestaurantStatistics] ERREUR:', error);

      if (error.message === 'Restaurant non trouvé') {
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
   * PATCH /api/restauration/restaurants/:id/frequentation
   * Mettre à jour la fréquentation moyenne
   */
  static async updateFrequentationMoyenne(req: Request, res: Response) {
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
      const { frequentation } = req.body;

      if (!id) {
        return res.status(400).json({
          success: false,
          error: 'ID restaurant manquant'
        });
      }

      if (frequentation === undefined || frequentation === null) {
        return res.status(400).json({
          success: false,
          error: 'Fréquentation manquante'
        });
      }

      const restaurant = await RestaurantService.updateFrequentationMoyenne(id, tenantId, frequentation);

      res.json({
        success: true,
        data: restaurant
      });
    } catch (error: any) {
      logger.error('[RestaurantController.updateFrequentationMoyenne] ERREUR:', error);

      if (error.message === 'Restaurant non trouvé') {
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

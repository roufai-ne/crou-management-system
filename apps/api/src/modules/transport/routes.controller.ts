/**
 * FICHIER: apps/api/src/modules/transport/routes.controller.ts
 * CONTROLLER: RoutesController - Gestion des itinéraires
 *
 * DESCRIPTION:
 * Contrôleur pour les endpoints de gestion des itinéraires de transport
 *
 * ENDPOINTS:
 * - GET    /routes          - Liste des itinéraires
 * - POST   /routes          - Créer un itinéraire
 * - GET    /routes/:id      - Détails d'un itinéraire
 * - PUT    /routes/:id      - Mettre à jour un itinéraire
 * - DELETE /routes/:id      - Supprimer un itinéraire
 * - GET    /routes/active   - Itinéraires actifs
 *
 * AUTEUR: Équipe CROU
 * DATE: Octobre 2025
 */

import { Request, Response } from 'express';
import { body, param, validationResult } from 'express-validator';
import { RoutesService } from './routes.service';
import { logger } from '@/shared/utils/logger';
import { RouteType } from '../../../../../packages/database/src/entities/TransportRoute.entity';

export class RoutesController {
  private static routesService = new RoutesService();

  /**
   * GET /api/transport/routes
   * Liste des itinéraires
   */
  static async getRoutes(req: Request, res: Response) {
    try {
      const tenantId = (req as any).user?.tenantId;
      if (!tenantId) {
        return res.status(401).json({
          success: false,
          message: 'Tenant non identifié'
        });
      }

      const filters = {
        search: req.query.search as string,
        status: req.query.status as string,
        type: req.query.type as string,
        page: parseInt(req.query.page as string) || 1,
        limit: parseInt(req.query.limit as string) || 20
      };

      const result = await RoutesController.routesService.getRoutes(tenantId, filters);
      res.json(result);
    } catch (error) {
      logger.error('Erreur getRoutes:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération des itinéraires'
      });
    }
  }

  /**
   * GET /api/transport/routes/:id
   * Détails d'un itinéraire
   */
  static async getRoute(req: Request, res: Response) {
    try {
      const tenantId = (req as any).user?.tenantId;
      if (!tenantId) {
        return res.status(401).json({
          success: false,
          message: 'Tenant non identifié'
        });
      }

      const { id } = req.params;
      const result = await RoutesController.routesService.getRouteById(id, tenantId);
      res.json(result);
    } catch (error) {
      logger.error('Erreur getRoute:', error);
      const statusCode = error instanceof Error && error.message === 'Itinéraire non trouvé' ? 404 : 500;
      res.status(statusCode).json({
        success: false,
        message: error instanceof Error ? error.message : 'Erreur lors de la récupération de l\'itinéraire'
      });
    }
  }

  /**
   * POST /api/transport/routes
   * Créer un nouvel itinéraire
   */
  static async createRoute(req: Request, res: Response) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Données invalides',
          errors: errors.array()
        });
      }

      const tenantId = (req as any).user?.tenantId;
      const createdBy = (req as any).user?.email || 'system';

      if (!tenantId) {
        return res.status(401).json({
          success: false,
          message: 'Tenant non identifié'
        });
      }

      const result = await RoutesController.routesService.createRoute(
        req.body,
        tenantId,
        createdBy
      );

      res.status(201).json(result);
    } catch (error) {
      logger.error('Erreur createRoute:', error);
      res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : 'Erreur lors de la création de l\'itinéraire'
      });
    }
  }

  /**
   * PUT /api/transport/routes/:id
   * Mettre à jour un itinéraire
   */
  static async updateRoute(req: Request, res: Response) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Données invalides',
          errors: errors.array()
        });
      }

      const tenantId = (req as any).user?.tenantId;
      const updatedBy = (req as any).user?.email || 'system';

      if (!tenantId) {
        return res.status(401).json({
          success: false,
          message: 'Tenant non identifié'
        });
      }

      const { id } = req.params;
      const result = await RoutesController.routesService.updateRoute(
        id,
        req.body,
        tenantId,
        updatedBy
      );

      res.json(result);
    } catch (error) {
      logger.error('Erreur updateRoute:', error);
      const statusCode = error instanceof Error && error.message === 'Itinéraire non trouvé' ? 404 : 400;
      res.status(statusCode).json({
        success: false,
        message: error instanceof Error ? error.message : 'Erreur lors de la mise à jour de l\'itinéraire'
      });
    }
  }

  /**
   * DELETE /api/transport/routes/:id
   * Supprimer un itinéraire
   */
  static async deleteRoute(req: Request, res: Response) {
    try {
      const tenantId = (req as any).user?.tenantId;
      if (!tenantId) {
        return res.status(401).json({
          success: false,
          message: 'Tenant non identifié'
        });
      }

      const { id } = req.params;
      const result = await RoutesController.routesService.deleteRoute(id, tenantId);
      res.json(result);
    } catch (error) {
      logger.error('Erreur deleteRoute:', error);
      const statusCode = error instanceof Error && error.message === 'Itinéraire non trouvé' ? 404 : 400;
      res.status(statusCode).json({
        success: false,
        message: error instanceof Error ? error.message : 'Erreur lors de la suppression de l\'itinéraire'
      });
    }
  }

  /**
   * GET /api/transport/routes/active
   * Obtenir les itinéraires actifs
   */
  static async getActiveRoutes(req: Request, res: Response) {
    try {
      const tenantId = (req as any).user?.tenantId;
      if (!tenantId) {
        return res.status(401).json({
          success: false,
          message: 'Tenant non identifié'
        });
      }

      const result = await RoutesController.routesService.getActiveRoutes(tenantId);
      res.json(result);
    } catch (error) {
      logger.error('Erreur getActiveRoutes:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération des itinéraires actifs'
      });
    }
  }
}

// Validateurs
export const routeValidators = {
  create: [
    body('code').notEmpty().withMessage('Le code est requis'),
    body('name').notEmpty().withMessage('Le nom est requis'),
    body('startLocation').notEmpty().withMessage('Le lieu de départ est requis'),
    body('endLocation').notEmpty().withMessage('Le lieu d\'arrivée est requis'),
    body('distance').isNumeric().withMessage('La distance doit être un nombre'),
    body('estimatedDuration').isNumeric().withMessage('La durée estimée doit être un nombre'),
    body('type')
      .optional()
      .isIn([RouteType.CAMPUS, RouteType.INTER_CAMPUS, RouteType.CITY, RouteType.INTERCITY])
      .withMessage('Type d\'itinéraire invalide')
  ],

  update: [
    param('id').isUUID().withMessage('ID invalide'),
    body('distance').optional().isNumeric().withMessage('La distance doit être un nombre'),
    body('estimatedDuration').optional().isNumeric().withMessage('La durée estimée doit être un nombre'),
    body('type')
      .optional()
      .isIn([RouteType.CAMPUS, RouteType.INTER_CAMPUS, RouteType.CITY, RouteType.INTERCITY])
      .withMessage('Type d\'itinéraire invalide')
  ]
};

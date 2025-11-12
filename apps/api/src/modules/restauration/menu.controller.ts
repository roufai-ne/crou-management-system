/**
 * FICHIER: apps/api/src/modules/restauration/menu.controller.ts
 * CONTROLLER: Menu - Gestion des menus de restauration
 *
 * DESCRIPTION:
 * Controller Express pour les endpoints REST du module Menu
 * Planification et gestion CRUD des menus journaliers
 * Calcul automatique des besoins en denrées
 * Support multi-tenant strict
 *
 * AUTEUR: Équipe CROU - Module Restauration
 * DATE: Janvier 2025
 */

import { Request, Response } from 'express';
import { MenuService, MenuFilters, CreateMenuDTO, UpdateMenuDTO } from './menu.service';
import { TypeRepas, MenuStatus } from '@crou/database';
import { logger } from '@/shared/utils/logger';

// ========================================
// CONTROLLER
// ========================================

export class MenuController {
  /**
   * GET /api/restauration/menus
   * Récupérer tous les menus avec filtres
   */
  static async getMenus(req: Request, res: Response) {
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
        dateDebut,
        dateFin,
        typeRepas,
        status,
        restaurantId
      } = req.query;

      const filters: MenuFilters = {
        search: search as string,
        dateDebut: dateDebut ? new Date(dateDebut as string) : undefined,
        dateFin: dateFin ? new Date(dateFin as string) : undefined,
        typeRepas: typeRepas && typeRepas !== 'all' ? typeRepas as TypeRepas : undefined,
        status: status && status !== 'all' ? status as MenuStatus : undefined,
        restaurantId: restaurantId as string
      };

      const result = await MenuService.getMenus(tenantId, filters);

      res.json({
        success: true,
        data: result
      });
    } catch (error: any) {
      logger.error('[MenuController.getMenus] ERREUR:', error);
      res.status(500).json({
        success: false,
        error: 'Erreur serveur',
        message: error.message
      });
    }
  }

  /**
   * GET /api/restauration/menus/:id
   * Récupérer un menu par ID
   */
  static async getMenu(req: Request, res: Response) {
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
          error: 'ID menu manquant'
        });
      }

      const menu = await MenuService.getMenuById(id, tenantId);

      res.json({
        success: true,
        data: menu
      });
    } catch (error: any) {
      logger.error('[MenuController.getMenu] ERREUR:', error);

      if (error.message === 'Menu non trouvé') {
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
   * POST /api/restauration/menus
   * Créer un nouveau menu
   */
  static async createMenu(req: Request, res: Response) {
    try {
      const tenantId = (req as any).user?.tenantId;
      const userId = (req as any).user?.userId;

      if (!tenantId || !userId) {
        return res.status(401).json({
          success: false,
          error: 'Authentification invalide'
        });
      }

      const data: CreateMenuDTO = req.body;

      // Validation des champs obligatoires
      if (!data.restaurantId || !data.nom || !data.dateService || !data.typeRepas || !data.plats || !data.nombreRationnairesPrevu) {
        return res.status(400).json({
          success: false,
          error: 'Champs obligatoires manquants'
        });
      }

      const menu = await MenuService.createMenu(tenantId, userId, data);

      res.status(201).json({
        success: true,
        data: menu
      });
    } catch (error: any) {
      logger.error('[MenuController.createMenu] ERREUR:', error);

      if (error.message === 'Restaurant non trouvé ou accès refusé') {
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
   * PUT /api/restauration/menus/:id
   * Mettre à jour un menu
   */
  static async updateMenu(req: Request, res: Response) {
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
          error: 'ID menu manquant'
        });
      }

      const data: UpdateMenuDTO = req.body;

      const menu = await MenuService.updateMenu(id, tenantId, userId, data);

      res.json({
        success: true,
        data: menu
      });
    } catch (error: any) {
      logger.error('[MenuController.updateMenu] ERREUR:', error);

      if (error.message === 'Menu non trouvé') {
        return res.status(404).json({
          success: false,
          error: error.message
        });
      }

      if (error.message === 'Impossible de modifier un menu validé') {
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
   * DELETE /api/restauration/menus/:id
   * Supprimer un menu (soft delete)
   */
  static async deleteMenu(req: Request, res: Response) {
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
          error: 'ID menu manquant'
        });
      }

      const result = await MenuService.deleteMenu(id, tenantId, userId);

      res.json({
        success: true,
        data: result
      });
    } catch (error: any) {
      logger.error('[MenuController.deleteMenu] ERREUR:', error);

      if (error.message === 'Menu non trouvé') {
        return res.status(404).json({
          success: false,
          error: error.message
        });
      }

      if (error.message === 'Impossible de supprimer un menu validé') {
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
   * POST /api/restauration/menus/:id/publish
   * Publier un menu
   */
  static async publishMenu(req: Request, res: Response) {
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
          error: 'ID menu manquant'
        });
      }

      const menu = await MenuService.publishMenu(id, tenantId, userId);

      res.json({
        success: true,
        data: menu
      });
    } catch (error: any) {
      logger.error('[MenuController.publishMenu] ERREUR:', error);

      if (error.message === 'Menu non trouvé') {
        return res.status(404).json({
          success: false,
          error: error.message
        });
      }

      if (error.message === 'Seuls les menus brouillon peuvent être publiés') {
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
   * POST /api/restauration/menus/:id/validate
   * Valider un menu (par responsable)
   */
  static async validateMenu(req: Request, res: Response) {
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
          error: 'ID menu manquant'
        });
      }

      const menu = await MenuService.validateMenu(id, tenantId, userId);

      res.json({
        success: true,
        data: menu
      });
    } catch (error: any) {
      logger.error('[MenuController.validateMenu] ERREUR:', error);

      if (error.message === 'Menu non trouvé') {
        return res.status(404).json({
          success: false,
          error: error.message
        });
      }

      if (error.message === 'Seuls les menus publiés peuvent être validés') {
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
   * GET /api/restauration/menus/:id/besoins
   * Calculer les besoins en denrées pour un menu
   */
  static async calculateBesoins(req: Request, res: Response) {
    try {
      const tenantId = (req as any).user?.tenantId;

      if (!tenantId) {
        return res.status(401).json({
          success: false,
          error: 'Tenant ID manquant'
        });
      }

      const { id } = req.params;
      const { nombreRationnaires } = req.query;

      if (!id) {
        return res.status(400).json({
          success: false,
          error: 'ID menu manquant'
        });
      }

      if (!nombreRationnaires) {
        return res.status(400).json({
          success: false,
          error: 'Nombre de rationnaires manquant'
        });
      }

      const besoins = await MenuService.calculateBesoins(
        id,
        tenantId,
        parseInt(nombreRationnaires as string, 10)
      );

      res.json({
        success: true,
        data: besoins
      });
    } catch (error: any) {
      logger.error('[MenuController.calculateBesoins] ERREUR:', error);

      if (error.message === 'Menu non trouvé') {
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
   * GET /api/restauration/menus/restaurant/:restaurantId/date/:date
   * Obtenir les menus d'un restaurant pour une date
   */
  static async getMenusByRestaurantAndDate(req: Request, res: Response) {
    try {
      const tenantId = (req as any).user?.tenantId;

      if (!tenantId) {
        return res.status(401).json({
          success: false,
          error: 'Tenant ID manquant'
        });
      }

      const { restaurantId, date } = req.params;

      if (!restaurantId || !date) {
        return res.status(400).json({
          success: false,
          error: 'Restaurant ID ou date manquant'
        });
      }

      const menus = await MenuService.getMenusByRestaurantAndDate(
        restaurantId,
        tenantId,
        new Date(date)
      );

      res.json({
        success: true,
        data: menus
      });
    } catch (error: any) {
      logger.error('[MenuController.getMenusByRestaurantAndDate] ERREUR:', error);
      res.status(500).json({
        success: false,
        error: 'Erreur serveur',
        message: error.message
      });
    }
  }

  /**
   * POST /api/restauration/menus/:id/duplicate
   * Dupliquer un menu pour une nouvelle date
   */
  static async duplicateMenu(req: Request, res: Response) {
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
      const { nouvelleDateService } = req.body;

      if (!id) {
        return res.status(400).json({
          success: false,
          error: 'ID menu manquant'
        });
      }

      if (!nouvelleDateService) {
        return res.status(400).json({
          success: false,
          error: 'Nouvelle date de service manquante'
        });
      }

      const menu = await MenuService.duplicateMenu(
        id,
        tenantId,
        userId,
        new Date(nouvelleDateService)
      );

      res.status(201).json({
        success: true,
        data: menu
      });
    } catch (error: any) {
      logger.error('[MenuController.duplicateMenu] ERREUR:', error);

      if (error.message === 'Menu original non trouvé') {
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

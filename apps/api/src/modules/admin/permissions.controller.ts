/**
 * FICHIER: apps/api/src/modules/admin/permissions.controller.ts
 * CONTRÔLEUR: Gestion des permissions
 *
 * DESCRIPTION:
 * Contrôleur dédié à la gestion des permissions du système RBAC
 * Permet de lister, créer, modifier et supprimer des permissions
 *
 * ROUTES:
 * - GET /api/admin/permissions - Liste des permissions
 * - GET /api/admin/permissions/:id - Détail d'une permission
 * - POST /api/admin/permissions - Créer une permission
 * - PUT /api/admin/permissions/:id - Modifier une permission
 * - DELETE /api/admin/permissions/:id - Supprimer une permission
 *
 * AUTEUR: Équipe CROU
 * DATE: Décembre 2024
 */

import type { Request, Response } from 'express';
import { Router } from 'express';
import { AppDataSource } from '../../../../../packages/database/src/config/datasource';
import { Permission } from '../../../../../packages/database/src/entities/Permission.entity';
import { ministerialAccessMiddleware } from '@/shared/middlewares/tenant-isolation.middleware';
import { auditMiddleware } from '@/shared/middlewares/audit.middleware';
import { logger } from '@/shared/utils/logger';

const router: Router = Router();

/**
 * GET /api/admin/permissions
 * Liste des permissions disponibles
 */
router.get('/',
  ministerialAccessMiddleware(),
  auditMiddleware({ enabled: true }),
  async (req: Request, res: Response) => {
    try {
      const groupByResource = req.query.groupByResource === 'true';

      const permissionRepository = AppDataSource.getRepository(Permission);
      const permissions = await permissionRepository.find({
        order: { resource: 'ASC', createdAt: 'ASC' }
      });

      let responseData;

      if (groupByResource) {
        // Grouper par ressource
        const groupedPermissions = permissions.reduce((acc, permission) => {
          if (!acc[permission.resource]) {
            acc[permission.resource] = [];
          }
          acc[permission.resource].push(permission);
          return acc;
        }, {} as Record<string, Permission[]>);

        responseData = {
          permissionsByResource: groupedPermissions as any,
          total: permissions.length
        };
      } else {
        responseData = {
          permissions,
          total: permissions.length
        };
      }

      res.json({
        success: true,
        data: responseData
      });

    } catch (error) {
      logger.error('Erreur récupération permissions:', error);
      res.status(500).json({
        error: 'Erreur serveur',
        message: 'Erreur lors de la récupération des permissions'
      });
    }
  }
);

/**
 * GET /api/admin/permissions/:id
 * Détail d'une permission
 */
router.get('/:id',
  ministerialAccessMiddleware(),
  auditMiddleware({ enabled: true }),
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      const permissionRepository = AppDataSource.getRepository(Permission);
      const permission = await permissionRepository.findOne({
        where: { id },
        relations: ['roles']
      });

      if (!permission) {
        return res.status(404).json({
          error: 'Permission non trouvée',
          message: `Aucune permission trouvée avec l'ID: ${id}`
        });
      }

      res.json({
        success: true,
        data: {
          permission,
          roleCount: permission.roles?.length || 0
        }
      });

    } catch (error) {
      logger.error('Erreur récupération permission:', error);
      res.status(500).json({
        error: 'Erreur serveur',
        message: 'Erreur lors de la récupération de la permission'
      });
    }
  }
);

/**
 * GET /api/admin/permissions/module/:module
 * Liste des permissions par module
 */
router.get('/module/:module',
  ministerialAccessMiddleware(),
  auditMiddleware({ enabled: true }),
  async (req: Request, res: Response) => {
    try {
      const { module } = req.params;

      const permissionRepository = AppDataSource.getRepository(Permission);
      const permissions = await permissionRepository.find({
        where: { resource: module },
        order: { createdAt: 'ASC' }
      });

      res.json({
        success: true,
        data: {
          permissions,
          total: permissions.length,
          module
        }
      });

    } catch (error) {
      logger.error('Erreur récupération permissions du module:', error);
      res.status(500).json({
        error: 'Erreur serveur',
        message: 'Erreur lors de la récupération des permissions du module'
      });
    }
  }
);

/**
 * POST /api/admin/permissions
 * Création d'une nouvelle permission
 */
router.post('/',
  ministerialAccessMiddleware(),
  auditMiddleware({ enabled: true, sensitiveResource: true }),
  async (req: Request, res: Response) => {
    try {
      const { resource, actions, description } = req.body;

      // Validation des données
      if (!resource || !actions || !Array.isArray(actions)) {
        return res.status(400).json({
          error: 'Données invalides',
          message: 'Ressource et actions (tableau) sont requis'
        });
      }

      // Vérifier l'unicité
      const permissionRepository = AppDataSource.getRepository(Permission);
      const existingPermission = await permissionRepository.findOne({
        where: { resource }
      });

      if (existingPermission) {
        return res.status(409).json({
          error: 'Permission existante',
          message: `Une permission existe déjà pour la ressource: ${resource}`
        });
      }

      // Créer la permission
      const permission = permissionRepository.create({
        resource,
        actions,
        description: description || null,
        createdBy: req.user?.id || 'system'
      });

      await permissionRepository.save(permission);

      logger.info(`Permission créée: ${resource}`, {
        userId: req.user?.id,
        permissionId: permission.id
      });

      res.status(201).json({
        success: true,
        message: 'Permission créée avec succès',
        data: { permission }
      });

    } catch (error) {
      logger.error('Erreur création permission:', error);
      res.status(500).json({
        error: 'Erreur serveur',
        message: 'Erreur lors de la création de la permission'
      });
    }
  }
);

/**
 * PUT /api/admin/permissions/:id
 * Modification d'une permission
 */
router.put('/:id',
  ministerialAccessMiddleware(),
  auditMiddleware({ enabled: true, sensitiveResource: true }),
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { resource, actions, description, isActive } = req.body;

      const permissionRepository = AppDataSource.getRepository(Permission);
      const permission = await permissionRepository.findOne({
        where: { id }
      });

      if (!permission) {
        return res.status(404).json({
          error: 'Permission non trouvée',
          message: `Aucune permission trouvée avec l'ID: ${id}`
        });
      }

      // Mise à jour
      if (resource) permission.resource = resource;
      if (actions && Array.isArray(actions)) permission.actions = actions;
      if (description !== undefined) permission.description = description;
      if (isActive !== undefined) permission.isActive = isActive;
      permission.updatedBy = req.user?.id || 'system';

      await permissionRepository.save(permission);

      logger.info(`Permission modifiée: ${permission.resource}`, {
        userId: req.user?.id,
        permissionId: permission.id
      });

      res.json({
        success: true,
        message: 'Permission modifiée avec succès',
        data: { permission }
      });

    } catch (error) {
      logger.error('Erreur modification permission:', error);
      res.status(500).json({
        error: 'Erreur serveur',
        message: 'Erreur lors de la modification de la permission'
      });
    }
  }
);

/**
 * DELETE /api/admin/permissions/:id
 * Suppression d'une permission
 */
router.delete('/:id',
  ministerialAccessMiddleware(),
  auditMiddleware({ enabled: true, sensitiveResource: true }),
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      const permissionRepository = AppDataSource.getRepository(Permission);
      const permission = await permissionRepository.findOne({
        where: { id },
        relations: ['roles']
      });

      if (!permission) {
        return res.status(404).json({
          error: 'Permission non trouvée',
          message: `Aucune permission trouvée avec l'ID: ${id}`
        });
      }

      // Vérifier si la permission est utilisée
      if (permission.roles && permission.roles.length > 0) {
        return res.status(409).json({
          error: 'Permission utilisée',
          message: `Cette permission est utilisée par ${permission.roles.length} rôle(s). Veuillez d'abord la retirer de ces rôles.`
        });
      }

      await permissionRepository.remove(permission);

      logger.info(`Permission supprimée: ${permission.resource}`, {
        userId: req.user?.id,
        permissionId: id
      });

      res.json({
        success: true,
        message: 'Permission supprimée avec succès'
      });

    } catch (error) {
      logger.error('Erreur suppression permission:', error);
      res.status(500).json({
        error: 'Erreur serveur',
        message: 'Erreur lors de la suppression de la permission'
      });
    }
  }
);

export default router;

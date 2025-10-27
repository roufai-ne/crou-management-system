/**
 * FICHIER: apps\api\src\modules\admin\roles.controller.ts
 * CONTRÔLEUR: Administration des rôles et permissions
 * 
 * DESCRIPTION:
 * Contrôleur pour la gestion des rôles et permissions RBAC
 * Interface d'administration pour la configuration des droits
 * Gestion de la matrice de permissions
 * 
 * FONCTIONNALITÉS:
 * - CRUD des rôles
 * - CRUD des permissions
 * - Association rôles-permissions
 * - Matrice de permissions
 * - Validation des droits
 * - Export/Import de configuration
 * 
 * AUTEUR: Équipe CROU
 * DATE: Décembre 2024
 */

import type { Request, Response } from 'express';
import { Router } from 'express';
import { authenticateJWT } from '@/shared/middlewares/auth.middleware';
import { checkPermissions } from '@/shared/middlewares/permissions.middleware';
import { ministerialAccessMiddleware } from '@/shared/middlewares/tenant-isolation.middleware';
import { auditMiddleware } from '@/shared/middlewares/audit.middleware';
import { AppDataSource } from '../../../../../packages/database/src/config/typeorm.config';
import { Role } from '../../../../../packages/database/src/entities/Role.entity';
import { Permission } from '../../../../../packages/database/src/entities/Permission.entity';
import { User } from '../../../../../packages/database/src/entities/User.entity';
import { AuditService } from '@/shared/services/audit.service';
import { AuditAction } from '../../../../../packages/database/src/entities/AuditLog.entity';
import { logger } from '@/shared/utils/logger';

const router: Router = Router();
const auditService = new AuditService();

/**
 * Interface pour la création/modification de rôle
 */
interface RoleCreateData {
  name: string;
  description?: string;
  isActive?: boolean;
  permissionIds?: string[];
}

/**
 * Interface pour la création/modification de permission
 */
interface PermissionCreateData {
  name: string;
  resource: string;
  action: string;
  description?: string;
  conditions?: Record<string, any>;
}

/**
 * GET /api/admin/roles
 * Liste des rôles avec leurs permissions
 */
router.get('/',
  authenticateJWT,
  checkPermissions(['admin:roles:read']),
  ministerialAccessMiddleware(), // Seuls les utilisateurs ministériels peuvent gérer les rôles
  auditMiddleware({ enabled: true }),
  async (req: Request, res: Response) => {
    try {
      const includePermissions = req.query.includePermissions === 'true';
      const includeUsers = req.query.includeUsers === 'true';

      const roleRepository = AppDataSource.getRepository(Role);
      const queryBuilder = roleRepository.createQueryBuilder('role')
        .orderBy('role.name', 'ASC');

      if (includePermissions) {
        queryBuilder.leftJoinAndSelect('role.permissions', 'permissions');
      }

      if (includeUsers) {
        queryBuilder
          .leftJoinAndSelect('role.users', 'users')
          .addSelect(['users.id', 'users.name', 'users.email']);
      }

      const roles = await queryBuilder.getMany();

      // Compter les utilisateurs par rôle si pas inclus
      const rolesWithStats = await Promise.all(
        roles.map(async (role) => {
          let userCount = 0;
          if (includeUsers) {
            userCount = role.users?.length || 0;
          } else {
            userCount = await AppDataSource.getRepository(User).count({
              where: { roleId: role.id }
            });
          }

          return {
            ...role,
            userCount,
            permissionCount: role.permissions?.length || 0
          };
        })
      );

      res.json({
        success: true,
        data: {
          roles: rolesWithStats,
          total: roles.length
        }
      });

    } catch (error) {
      logger.error('Erreur récupération rôles:', error);
      res.status(500).json({
        error: 'Erreur serveur',
        message: 'Erreur lors de la récupération des rôles'
      });
    }
  }
);

/**
 * GET /api/admin/roles/:id
 * Détail d'un rôle avec ses permissions
 */
router.get('/:id',
  authenticateJWT,
  checkPermissions(['admin:roles:read']),
  ministerialAccessMiddleware(),
  auditMiddleware({ enabled: true }),
  async (req: Request, res: Response) => {
    try {
      const roleId = req.params.id;

      const roleRepository = AppDataSource.getRepository(Role);
      const role = await roleRepository.findOne({
        where: { id: roleId },
        relations: ['permissions', 'users'],
        select: {
          id: true,
          name: true,
          description: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
          users: {
            id: true,
            name: true,
            email: true,
            status: true
          }
        }
      });

      if (!role) {
        return res.status(404).json({
          error: 'Rôle non trouvé',
          message: 'Le rôle demandé n\'existe pas'
        });
      }

      res.json({
        success: true,
        data: { role }
      });

    } catch (error) {
      logger.error('Erreur récupération rôle:', error);
      res.status(500).json({
        error: 'Erreur serveur',
        message: 'Erreur lors de la récupération du rôle'
      });
    }
  }
);

/**
 * POST /api/admin/roles
 * Création d'un nouveau rôle
 */
router.post('/',
  authenticateJWT,
  checkPermissions(['admin:roles:create']),
  ministerialAccessMiddleware(),
  auditMiddleware({ enabled: true, sensitiveResource: true }),
  async (req: Request, res: Response) => {
    try {
      const roleData: RoleCreateData = req.body;

      // Validation des données
      if (!roleData.name) {
        return res.status(400).json({
          error: 'Données manquantes',
          message: 'Le nom du rôle est requis'
        });
      }

      // Vérifier que le nom n'existe pas déjà
      const roleRepository = AppDataSource.getRepository(Role);
      const existingRole = await roleRepository.findOne({
        where: { name: roleData.name }
      });

      if (existingRole) {
        return res.status(409).json({
          error: 'Nom déjà utilisé',
          message: 'Un rôle avec ce nom existe déjà'
        });
      }

      // Créer le rôle
      const newRole = roleRepository.create({
        name: roleData.name,
        description: roleData.description,
        isActive: roleData.isActive !== false
      });

      const savedRole = await roleRepository.save(newRole);

      // Associer les permissions si fournies
      if (roleData.permissionIds && roleData.permissionIds.length > 0) {
        const permissionRepository = AppDataSource.getRepository(Permission);
        const permissions = await permissionRepository.findByIds(roleData.permissionIds);
        
        savedRole.permissions = permissions;
        await roleRepository.save(savedRole);
      }

      // Audit de la création
      await auditService.logResourceAccess(
        req.user!.id,
        'role',
        AuditAction.CREATE,
        savedRole.id,
        undefined,
        req.ip,
        {
          newRole: {
            name: savedRole.name,
            description: savedRole.description,
            permissionIds: roleData.permissionIds
          }
        }
      );

      res.status(201).json({
        success: true,
        data: { role: savedRole },
        message: 'Rôle créé avec succès'
      });

    } catch (error) {
      logger.error('Erreur création rôle:', error);
      res.status(500).json({
        error: 'Erreur serveur',
        message: 'Erreur lors de la création du rôle'
      });
    }
  }
);

/**
 * PUT /api/admin/roles/:id
 * Modification d'un rôle
 */
router.put('/:id',
  authenticateJWT,
  checkPermissions(['admin:roles:update']),
  ministerialAccessMiddleware(),
  auditMiddleware({ enabled: true, sensitiveResource: true }),
  async (req: Request, res: Response) => {
    try {
      const roleId = req.params.id;
      const updateData: Partial<RoleCreateData> = req.body;

      const roleRepository = AppDataSource.getRepository(Role);
      const existingRole = await roleRepository.findOne({
        where: { id: roleId },
        relations: ['permissions']
      });

      if (!existingRole) {
        return res.status(404).json({
          error: 'Rôle non trouvé',
          message: 'Le rôle demandé n\'existe pas'
        });
      }

      // Sauvegarder les anciennes valeurs pour l'audit
      const oldValues = {
        name: existingRole.name,
        description: existingRole.description,
        isActive: existingRole.isActive,
        permissionIds: existingRole.permissions?.map(p => p.id) || []
      };

      // Vérifier l'unicité du nom si modifié
      if (updateData.name && updateData.name !== existingRole.name) {
        const nameExists = await roleRepository.findOne({
          where: { name: updateData.name }
        });

        if (nameExists) {
          return res.status(409).json({
            error: 'Nom déjà utilisé',
            message: 'Un autre rôle utilise déjà ce nom'
          });
        }
      }

      // Appliquer les modifications
      Object.assign(existingRole, {
        name: updateData.name || existingRole.name,
        description: updateData.description !== undefined ? updateData.description : existingRole.description,
        isActive: updateData.isActive !== undefined ? updateData.isActive : existingRole.isActive,
        updatedAt: new Date()
      });

      // Gérer les permissions si fournies
      if (updateData.permissionIds !== undefined) {
        if (updateData.permissionIds.length > 0) {
          const permissionRepository = AppDataSource.getRepository(Permission);
          const permissions = await permissionRepository.findByIds(updateData.permissionIds);
          existingRole.permissions = permissions;
        } else {
          existingRole.permissions = [];
        }
      }

      const updatedRole = await roleRepository.save(existingRole);

      // Audit de la modification
      await auditService.logResourceAccess(
        req.user!.id,
        'role',
        AuditAction.UPDATE,
        roleId,
        undefined,
        req.ip,
        {
          oldValues,
          newValues: updateData
        }
      );

      res.json({
        success: true,
        data: { role: updatedRole },
        message: 'Rôle modifié avec succès'
      });

    } catch (error) {
      logger.error('Erreur modification rôle:', error);
      res.status(500).json({
        error: 'Erreur serveur',
        message: 'Erreur lors de la modification du rôle'
      });
    }
  }
);

/**
 * DELETE /api/admin/roles/:id
 * Suppression d'un rôle
 */
router.delete('/:id',
  authenticateJWT,
  checkPermissions(['admin:roles:delete']),
  ministerialAccessMiddleware(),
  auditMiddleware({ enabled: true, sensitiveResource: true }),
  async (req: Request, res: Response) => {
    try {
      const roleId = req.params.id;

      const roleRepository = AppDataSource.getRepository(Role);
      const role = await roleRepository.findOne({
        where: { id: roleId },
        relations: ['users']
      });

      if (!role) {
        return res.status(404).json({
          error: 'Rôle non trouvé',
          message: 'Le rôle demandé n\'existe pas'
        });
      }

      // Vérifier qu'aucun utilisateur n'utilise ce rôle
      if (role.users && role.users.length > 0) {
        return res.status(400).json({
          error: 'Rôle utilisé',
          message: `Ce rôle est utilisé par ${role.users.length} utilisateur(s). Réassignez-les avant de supprimer le rôle.`
        });
      }

      // Sauvegarder les données pour l'audit
      const deletedRoleData = {
        name: role.name,
        description: role.description
      };

      // Supprimer le rôle
      await roleRepository.remove(role);

      // Audit de la suppression
      await auditService.logResourceAccess(
        req.user!.id,
        'role',
        AuditAction.DELETE,
        roleId,
        undefined,
        req.ip,
        {
          deletedRole: deletedRoleData
        }
      );

      res.json({
        success: true,
        message: 'Rôle supprimé avec succès'
      });

    } catch (error) {
      logger.error('Erreur suppression rôle:', error);
      res.status(500).json({
        error: 'Erreur serveur',
        message: 'Erreur lors de la suppression du rôle'
      });
    }
  }
);

/**
 * GET /api/admin/permissions
 * Liste des permissions disponibles
 */
router.get('/permissions',
  authenticateJWT,
  checkPermissions(['admin:permissions:read']),
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
 * POST /api/admin/permissions
 * Création d'une nouvelle permission
 */
router.post('/permissions',
  authenticateJWT,
  checkPermissions(['admin:permissions:create']),
  ministerialAccessMiddleware(),
  auditMiddleware({ enabled: true, sensitiveResource: true }),
  async (req: Request, res: Response) => {
    try {
      const permissionData: PermissionCreateData = req.body;

      // Validation des données
      if (!permissionData.name || !permissionData.resource || !permissionData.action) {
        return res.status(400).json({
          error: 'Données manquantes',
          message: 'Nom, ressource et action sont requis'
        });
      }

      // Vérifier l'unicité
      const permissionRepository = AppDataSource.getRepository(Permission);
      const existingPermission = await permissionRepository.findOne({
        where: { 
          resource: permissionData.resource
        }
      });

      if (existingPermission) {
        return res.status(409).json({
          error: 'Permission déjà existante',
          message: 'Une permission avec ces paramètres existe déjà'
        });
      }

      // Créer la permission
      const newPermission = permissionRepository.create({
        resource: permissionData.resource,
        actions: [permissionData.action],
        description: permissionData.description
      });

      const savedPermission = await permissionRepository.save(newPermission);

      // Audit de la création
      await auditService.logResourceAccess(
        req.user!.id,
        'permission',
        AuditAction.CREATE,
        savedPermission.id,
        undefined,
        req.ip,
        {
          newPermission: {
            resource: savedPermission.resource,
            actions: savedPermission.actions
          }
        }
      );

      res.status(201).json({
        success: true,
        data: { permission: savedPermission },
        message: 'Permission créée avec succès'
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
 * GET /api/admin/roles/matrix
 * Matrice des rôles et permissions
 */
router.get('/matrix',
  authenticateJWT,
  checkPermissions(['admin:roles:read']),
  ministerialAccessMiddleware(),
  auditMiddleware({ enabled: true }),
  async (req: Request, res: Response) => {
    try {
      const roleRepository = AppDataSource.getRepository(Role);
      const permissionRepository = AppDataSource.getRepository(Permission);

      // Récupérer tous les rôles avec leurs permissions
      const roles = await roleRepository.find({
        relations: ['permissions'],
        order: { name: 'ASC' }
      });

      // Récupérer toutes les permissions
      const allPermissions = await permissionRepository.find({
        order: { resource: 'ASC', createdAt: 'ASC' }
      });

      // Construire la matrice
      const matrix = roles.map(role => ({
        role: {
          id: role.id,
          name: role.name,
          description: role.description,
          isActive: role.isActive
        },
        permissions: allPermissions.map(permission => ({
          permission: {
            id: permission.id,
            resource: permission.resource,
            actions: permission.actions
          },
          hasPermission: role.permissions?.some(p => p.id === permission.id) || false
        }))
      }));

      // Grouper les permissions par ressource pour l'affichage
      const permissionsByResource = allPermissions.reduce((acc, permission) => {
        if (!acc[permission.resource]) {
          acc[permission.resource] = [];
        }
        acc[permission.resource].push(permission);
        return acc;
      }, {} as Record<string, Permission[]>);

      res.json({
        success: true,
        data: {
          matrix,
          permissionsByResource,
          totalRoles: roles.length,
          totalPermissions: allPermissions.length
        }
      });

    } catch (error) {
      logger.error('Erreur récupération matrice:', error);
      res.status(500).json({
        error: 'Erreur serveur',
        message: 'Erreur lors de la récupération de la matrice'
      });
    }
  }
);

/**
 * POST /api/admin/roles/:id/permissions
 * Mettre à jour les permissions d'un rôle
 */
router.post('/:id/permissions',
  authenticateJWT,
  checkPermissions(['admin:roles:update']),
  ministerialAccessMiddleware(),
  auditMiddleware({ enabled: true, sensitiveResource: true }),
  async (req: Request, res: Response) => {
    try {
      const roleId = req.params.id;
      const { permissionIds } = req.body;

      if (!Array.isArray(permissionIds)) {
        return res.status(400).json({
          error: 'Données invalides',
          message: 'permissionIds doit être un tableau'
        });
      }

      const roleRepository = AppDataSource.getRepository(Role);
      const role = await roleRepository.findOne({
        where: { id: roleId },
        relations: ['permissions']
      });

      if (!role) {
        return res.status(404).json({
          error: 'Rôle non trouvé',
          message: 'Le rôle demandé n\'existe pas'
        });
      }

      // Sauvegarder les anciennes permissions pour l'audit
      const oldPermissionIds = role.permissions?.map(p => p.id) || [];

      // Récupérer les nouvelles permissions
      let newPermissions: Permission[] = [];
      if (permissionIds.length > 0) {
        const permissionRepository = AppDataSource.getRepository(Permission);
        newPermissions = await permissionRepository.findByIds(permissionIds);
      }

      // Mettre à jour les permissions
      role.permissions = newPermissions;
      role.updatedAt = new Date();

      await roleRepository.save(role);

      // Audit de la modification
      await auditService.logResourceAccess(
        req.user!.id,
        'role_permissions',
        AuditAction.UPDATE,
        roleId,
        undefined,
        req.ip,
        {
          roleName: role.name,
          oldPermissionIds,
          newPermissionIds: permissionIds,
          addedPermissions: permissionIds.filter((id: string) => !oldPermissionIds.includes(id)),
          removedPermissions: oldPermissionIds.filter(id => !permissionIds.includes(id))
        }
      );

      res.json({
        success: true,
        data: {
          roleId,
          permissionCount: newPermissions.length,
          permissions: newPermissions
        },
        message: 'Permissions du rôle mises à jour avec succès'
      });

    } catch (error) {
      logger.error('Erreur mise à jour permissions rôle:', error);
      res.status(500).json({
        error: 'Erreur serveur',
        message: 'Erreur lors de la mise à jour des permissions'
      });
    }
  }
);

export default router;
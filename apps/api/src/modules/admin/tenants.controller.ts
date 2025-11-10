/**
 * FICHIER: apps\api\src\modules\admin\tenants.controller.ts
 * CONTRÔLEUR: Administration des tenants
 * 
 * DESCRIPTION:
 * Contrôleur pour la gestion et configuration des tenants
 * Interface d'administration pour les CROU et le ministère
 * Gestion des paramètres et statistiques par tenant
 * 
 * FONCTIONNALITÉS:
 * - CRUD des tenants
 * - Configuration des paramètres tenant
 * - Statistiques par tenant
 * - Gestion des quotas et limites
 * - Activation/désactivation des tenants
 * - Export des données tenant
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
import { AppDataSource } from '../../../../../packages/database/src/config/datasource';
import { Tenant, TenantType } from '../../../../../packages/database/src/entities/Tenant.entity';
import { User } from '../../../../../packages/database/src/entities/User.entity';
import { AuditService } from '@/shared/services/audit.service';
import { AuditAction } from '../../../../../packages/database/src/entities/AuditLog.entity';
import { logger } from '@/shared/utils/logger';

const router: Router = Router();
const auditService = new AuditService();

/**
 * Interface pour la création/modification de tenant
 */
interface TenantCreateData {
  name: string;
  code: string;
  type: TenantType;
  description?: string;
  isActive?: boolean;
  settings?: Record<string, any>;
  contactEmail?: string;
  contactPhone?: string;
  address?: string;
}

/**
 * Interface pour les statistiques tenant
 */
interface TenantStats {
  userCount: number;
  activeUserCount: number;
  lastActivity?: Date;
  createdAt: Date;
  dataSize?: number;
  quotaUsage?: {
    users: { current: number; limit: number };
    storage: { current: number; limit: number };
  };
}

/**
 * GET /api/admin/tenants
 * Liste des tenants avec statistiques
 */
router.get('/',
  ministerialAccessMiddleware(), // Seuls les utilisateurs ministériels peuvent gérer les tenants
  auditMiddleware({ enabled: true }),
  async (req: Request, res: Response) => {
    try {
      const includeStats = req.query.includeStats === 'true';
      const includeUsers = req.query.includeUsers === 'true';

      const tenantRepository = AppDataSource.getRepository(Tenant);
      const queryBuilder = tenantRepository.createQueryBuilder('tenant')
        .orderBy('tenant.type', 'ASC')
        .addOrderBy('tenant.name', 'ASC');

      if (includeUsers) {
        queryBuilder
          .leftJoinAndSelect('tenant.users', 'users')
          .addSelect(['users.id', 'users.name', 'users.email', 'users.status']);
      }

      const tenants = await queryBuilder.getMany();

      // Ajouter les statistiques si demandées
      const tenantsWithStats = await Promise.all(
        tenants.map(async (tenant) => {
          let stats: TenantStats | undefined;

          if (includeStats) {
            const userRepository = AppDataSource.getRepository(User);
            
            const userCount = await userRepository.count({
              where: { tenantId: tenant.id }
            });

            const activeUserCount = await userRepository.count({
              where: { 
                tenantId: tenant.id,
                status: 'active' as any
              }
            });

            // Récupérer la dernière activité
            const lastActiveUser = await userRepository.findOne({
              where: { tenantId: tenant.id },
              order: { lastLoginAt: 'DESC' },
              select: ['lastLoginAt']
            });

            stats = {
              userCount,
              activeUserCount,
              lastActivity: lastActiveUser?.lastLoginAt || undefined,
              createdAt: tenant.createdAt,
              quotaUsage: {
                users: { current: userCount, limit: 1000 }, // Limite par défaut
                storage: { current: 0, limit: 10000 } // MB
              }
            };
          }

          return {
            ...tenant,
            stats,
            userCount: includeUsers ? tenant.users?.length : undefined
          };
        })
      );

      res.json({
        success: true,
        data: {
          tenants: tenantsWithStats,
          total: tenants.length,
          summary: {
            totalTenants: tenants.length,
            activeTenants: tenants.filter(t => t.isActive).length,
            tenantsByType: tenants.reduce((acc, tenant) => {
              acc[tenant.type] = (acc[tenant.type] || 0) + 1;
              return acc;
            }, {} as Record<TenantType, number>)
          }
        }
      });

    } catch (error) {
      logger.error('Erreur récupération tenants:', error);
      res.status(500).json({
        error: 'Erreur serveur',
        message: 'Erreur lors de la récupération des tenants'
      });
    }
  }
);

/**
 * GET /api/admin/tenants/:id
 * Détail d'un tenant avec ses utilisateurs et statistiques
 */
router.get('/:id',
  ministerialAccessMiddleware(),
  auditMiddleware({ enabled: true }),
  async (req: Request, res: Response) => {
    try {
      const tenantId = req.params.id;

      const tenantRepository = AppDataSource.getRepository(Tenant);
      const tenant = await tenantRepository.findOne({
        where: { id: tenantId },
        relations: ['users']
      });

      if (!tenant) {
        return res.status(404).json({
          error: 'Tenant non trouvé',
          message: 'Le tenant demandé n\'existe pas'
        });
      }

      // Calculer les statistiques détaillées
      const userRepository = AppDataSource.getRepository(User);
      
      const userStats = await userRepository
        .createQueryBuilder('user')
        .select([
          'COUNT(*) as total',
          'COUNT(CASE WHEN status = \'active\' THEN 1 END) as active',
          'COUNT(CASE WHEN status = \'inactive\' THEN 1 END) as inactive',
          'COUNT(CASE WHEN status = \'suspended\' THEN 1 END) as suspended',
          'COUNT(CASE WHEN status = \'pending\' THEN 1 END) as pending'
        ])
        .where('user.tenantId = :tenantId', { tenantId })
        .getRawOne();

      // Activité récente (30 derniers jours)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const recentActivity = await userRepository.count({
        where: {
          tenantId,
          lastLoginAt: { $gte: thirtyDaysAgo } as any
        }
      });

      const detailedStats = {
        users: {
          total: parseInt(userStats.total),
          active: parseInt(userStats.active),
          inactive: parseInt(userStats.inactive),
          suspended: parseInt(userStats.suspended),
          pending: parseInt(userStats.pending)
        },
        activity: {
          recentActiveUsers: recentActivity,
          lastActivity: tenant.users?.[0]?.lastLoginAt
        },
        quotas: {
          users: { current: parseInt(userStats.total), limit: 1000 },
          storage: { current: 0, limit: 10000 }
        }
      };

      res.json({
        success: true,
        data: {
          tenant,
          stats: detailedStats
        }
      });

    } catch (error) {
      logger.error('Erreur récupération tenant:', error);
      res.status(500).json({
        error: 'Erreur serveur',
        message: 'Erreur lors de la récupération du tenant'
      });
    }
  }
);

/**
 * POST /api/admin/tenants
 * Création d'un nouveau tenant
 */
router.post('/',
  ministerialAccessMiddleware(),
  auditMiddleware({ enabled: true, sensitiveResource: true }),
  async (req: Request, res: Response) => {
    try {
      const tenantData: TenantCreateData = req.body;

      // Validation des données
      if (!tenantData.name || !tenantData.code || !tenantData.type) {
        return res.status(400).json({
          error: 'Données manquantes',
          message: 'Nom, code et type sont requis'
        });
      }

      // Vérifier l'unicité du code
      const tenantRepository = AppDataSource.getRepository(Tenant);
      const existingTenant = await tenantRepository.findOne({
        where: { code: tenantData.code }
      });

      if (existingTenant) {
        return res.status(409).json({
          error: 'Code déjà utilisé',
          message: 'Un tenant avec ce code existe déjà'
        });
      }

      // Créer le tenant
      const newTenant = tenantRepository.create({
        name: tenantData.name,
        code: tenantData.code,
        type: tenantData.type,
        isActive: tenantData.isActive !== false
      });

      const savedTenant = await tenantRepository.save(newTenant);

      // Audit de la création
      await auditService.logResourceAccess(
        req.user!.id,
        'tenant',
        AuditAction.CREATE,
        savedTenant.id,
        undefined,
        req.ip,
        {
          newTenant: {
            name: savedTenant.name,
            code: savedTenant.code,
            type: savedTenant.type
          }
        }
      );

      res.status(201).json({
        success: true,
        data: { tenant: savedTenant },
        message: 'Tenant créé avec succès'
      });

    } catch (error) {
      logger.error('Erreur création tenant:', error);
      res.status(500).json({
        error: 'Erreur serveur',
        message: 'Erreur lors de la création du tenant'
      });
    }
  }
);

/**
 * PUT /api/admin/tenants/:id
 * Modification d'un tenant
 */
router.put('/:id',
  ministerialAccessMiddleware(),
  auditMiddleware({ enabled: true, sensitiveResource: true }),
  async (req: Request, res: Response) => {
    try {
      const tenantId = req.params.id;
      const updateData: Partial<TenantCreateData> = req.body;

      const tenantRepository = AppDataSource.getRepository(Tenant);
      const existingTenant = await tenantRepository.findOne({
        where: { id: tenantId }
      });

      if (!existingTenant) {
        return res.status(404).json({
          error: 'Tenant non trouvé',
          message: 'Le tenant demandé n\'existe pas'
        });
      }

      // Sauvegarder les anciennes valeurs pour l'audit
      const oldValues = {
        name: existingTenant.name,
        code: existingTenant.code,
        type: existingTenant.type,
        isActive: existingTenant.isActive
      };

      // Vérifier l'unicité du code si modifié
      if (updateData.code && updateData.code !== existingTenant.code) {
        const codeExists = await tenantRepository.findOne({
          where: { code: updateData.code }
        });

        if (codeExists) {
          return res.status(409).json({
            error: 'Code déjà utilisé',
            message: 'Un autre tenant utilise déjà ce code'
          });
        }
      }

      // Appliquer les modifications
      Object.assign(existingTenant, {
        ...updateData,
        updatedAt: new Date()
      });

      const updatedTenant = await tenantRepository.save(existingTenant);

      // Audit de la modification
      await auditService.logResourceAccess(
        req.user!.id,
        'tenant',
        AuditAction.UPDATE,
        tenantId,
        undefined,
        req.ip,
        {
          oldValues,
          newValues: updateData
        }
      );

      res.json({
        success: true,
        data: { tenant: updatedTenant },
        message: 'Tenant modifié avec succès'
      });

    } catch (error) {
      logger.error('Erreur modification tenant:', error);
      res.status(500).json({
        error: 'Erreur serveur',
        message: 'Erreur lors de la modification du tenant'
      });
    }
  }
);

/**
 * POST /api/admin/tenants/:id/toggle-status
 * Activer/désactiver un tenant
 */
router.post('/:id/toggle-status',
  ministerialAccessMiddleware(),
  auditMiddleware({ enabled: true, sensitiveResource: true }),
  async (req: Request, res: Response) => {
    try {
      const tenantId = req.params.id;
      const { isActive } = req.body;

      if (typeof isActive !== 'boolean') {
        return res.status(400).json({
          error: 'Paramètre invalide',
          message: 'isActive doit être un booléen'
        });
      }

      const tenantRepository = AppDataSource.getRepository(Tenant);
      const tenant = await tenantRepository.findOne({
        where: { id: tenantId }
      });

      if (!tenant) {
        return res.status(404).json({
          error: 'Tenant non trouvé',
          message: 'Le tenant demandé n\'existe pas'
        });
      }

      const oldStatus = tenant.isActive;
      tenant.isActive = isActive;
      tenant.updatedAt = new Date();

      await tenantRepository.save(tenant);

      // Audit du changement de statut
      await auditService.logResourceAccess(
        req.user!.id,
        'tenant_status',
        AuditAction.UPDATE,
        tenantId,
        undefined,
        req.ip,
        {
          tenantName: tenant.name,
          tenantCode: tenant.code,
          oldStatus,
          newStatus: isActive
        }
      );

      res.json({
        success: true,
        data: {
          tenantId,
          tenantName: tenant.name,
          oldStatus,
          newStatus: isActive
        },
        message: `Tenant ${isActive ? 'activé' : 'désactivé'} avec succès`
      });

    } catch (error) {
      logger.error('Erreur modification statut tenant:', error);
      res.status(500).json({
        error: 'Erreur serveur',
        message: 'Erreur lors de la modification du statut'
      });
    }
  }
);

/**
 * GET /api/admin/tenants/:id/users
 * Liste des utilisateurs d'un tenant
 */
router.get('/:id/users',
  ministerialAccessMiddleware(),
  auditMiddleware({ enabled: true }),
  async (req: Request, res: Response) => {
    try {
      const tenantId = req.params.id;
      const limit = parseInt(req.query.limit as string) || 50;
      const offset = parseInt(req.query.offset as string) || 0;

      // Vérifier que le tenant existe
      const tenantRepository = AppDataSource.getRepository(Tenant);
      const tenant = await tenantRepository.findOne({
        where: { id: tenantId }
      });

      if (!tenant) {
        return res.status(404).json({
          error: 'Tenant non trouvé',
          message: 'Le tenant demandé n\'existe pas'
        });
      }

      // Récupérer les utilisateurs du tenant
      const userRepository = AppDataSource.getRepository(User);
      const queryBuilder = userRepository.createQueryBuilder('user')
        .leftJoinAndSelect('user.role', 'role')
        .where('user.tenantId = :tenantId', { tenantId })
        .select([
          'user.id',
          'user.email',
          'user.name',
          'user.status',
          'user.lastLoginAt',
          'user.createdAt',
          'role.id',
          'role.name'
        ])
        .orderBy('user.createdAt', 'DESC')
        .skip(offset)
        .take(limit + 1); // +1 pour détecter s'il y a plus

      const users = await queryBuilder.getMany();
      const hasMore = users.length > limit;
      
      if (hasMore) {
        users.pop();
      }

      const total = await userRepository.count({
        where: { tenantId }
      });

      res.json({
        success: true,
        data: {
          tenant: {
            id: tenant.id,
            name: tenant.name,
            code: tenant.code
          },
          users,
          pagination: {
            total,
            limit,
            offset,
            hasMore
          }
        }
      });

    } catch (error) {
      logger.error('Erreur récupération utilisateurs tenant:', error);
      res.status(500).json({
        error: 'Erreur serveur',
        message: 'Erreur lors de la récupération des utilisateurs'
      });
    }
  }
);

/**
 * GET /api/admin/tenants/stats/global
 * Statistiques globales des tenants
 */
router.get('/stats/global',
  ministerialAccessMiddleware(),
  auditMiddleware({ enabled: true }),
  async (req: Request, res: Response) => {
    try {
      const tenantRepository = AppDataSource.getRepository(Tenant);
      const userRepository = AppDataSource.getRepository(User);

      // Statistiques générales
      const totalTenants = await tenantRepository.count();
      const activeTenants = await tenantRepository.count({
        where: { isActive: true }
      });

      // Répartition par type
      const tenantsByType = await tenantRepository
        .createQueryBuilder('tenant')
        .select('tenant.type', 'type')
        .addSelect('COUNT(*)', 'count')
        .groupBy('tenant.type')
        .getRawMany();

      // Statistiques utilisateurs par tenant
      const usersByTenant = await userRepository
        .createQueryBuilder('user')
        .leftJoin('user.tenant', 'tenant')
        .select([
          'tenant.id as tenantId',
          'tenant.name as tenantName',
          'tenant.code as tenantCode',
          'COUNT(*) as userCount',
          'COUNT(CASE WHEN user.status = \'active\' THEN 1 END) as activeUsers'
        ])
        .groupBy('tenant.id, tenant.name, tenant.code')
        .orderBy('userCount', 'DESC')
        .getRawMany();

      // Activité récente (7 derniers jours)
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const recentActivity = await userRepository.count({
        where: {
          lastLoginAt: { $gte: sevenDaysAgo } as any
        }
      });

      const globalStats = {
        tenants: {
          total: totalTenants,
          active: activeTenants,
          inactive: totalTenants - activeTenants,
          byType: tenantsByType.reduce((acc, item) => {
            acc[item.type] = parseInt(item.count);
            return acc;
          }, {} as Record<string, number>)
        },
        users: {
          total: usersByTenant.reduce((sum, tenant) => sum + parseInt(tenant.usercount), 0),
          active: usersByTenant.reduce((sum, tenant) => sum + parseInt(tenant.activeusers), 0),
          recentActivity,
          byTenant: usersByTenant.map(tenant => ({
            tenantId: tenant.tenantid,
            tenantName: tenant.tenantname,
            tenantCode: tenant.tenantcode,
            userCount: parseInt(tenant.usercount),
            activeUsers: parseInt(tenant.activeusers)
          }))
        },
        generatedAt: new Date()
      };

      res.json({
        success: true,
        data: globalStats
      });

    } catch (error) {
      logger.error('Erreur récupération statistiques globales:', error);
      res.status(500).json({
        error: 'Erreur serveur',
        message: 'Erreur lors de la récupération des statistiques'
      });
    }
  }
);

/**
 * GET /api/tenants/hierarchy
 * Récupère la hiérarchie des tenants (publique, pas besoin d'être ministériel)
 */
router.get('/hierarchy',
  async (req: Request, res: Response) => {
    try {
      const tenantRepository = AppDataSource.getRepository(Tenant);

      // Récupérer tous les tenants actifs avec leurs relations parent
      const tenants = await tenantRepository.find({
        where: { isActive: true },
        relations: ['parent'],
        order: {
          type: 'ASC',
          name: 'ASC'
        }
      });

      // Construire la hiérarchie
      const hierarchy = tenants.map(tenant => ({
        id: tenant.id,
        name: tenant.name,
        code: tenant.code,
        type: tenant.type,
        parentId: tenant.parentId,
        level: tenant.level || 0,
        region: tenant.region,
        isActive: tenant.isActive
      }));

      res.json({
        success: true,
        data: hierarchy
      });

    } catch (error) {
      logger.error('Erreur récupération hiérarchie tenants:', error);
      res.status(500).json({
        error: 'Erreur serveur',
        message: 'Erreur lors de la récupération de la hiérarchie des tenants'
      });
    }
  }
);

export default router;

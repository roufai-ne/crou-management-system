/**
 * FICHIER: apps\api\src\modules\admin\stats.controller.ts
 * CONTRÔLEUR: Statistiques d'utilisation
 * 
 * DESCRIPTION:
 * Contrôleur pour les statistiques d'utilisation du système
 * Métriques de performance, utilisation et activité
 * Tableaux de bord et rapports analytiques
 * 
 * FONCTIONNALITÉS:
 * - Statistiques d'utilisation globales
 * - Métriques par tenant
 * - Analyses d'activité utilisateur
 * - Rapports de performance
 * - Tendances et évolutions
 * - Export des données statistiques
 * 
 * AUTEUR: Équipe CROU
 * DATE: Décembre 2024
 */

import type { Request, Response } from 'express';
import { Router } from 'express';
import { authenticateJWT } from '@/shared/middlewares/auth.middleware';
import { checkPermissions } from '@/shared/middlewares/permissions.middleware';
import { 
  injectTenantIdMiddleware,
  ministerialAccessMiddleware 
} from '@/shared/middlewares/tenant-isolation.middleware';
import { auditMiddleware } from '@/shared/middlewares/audit.middleware';
import { TenantIsolationUtils } from '@/shared/utils/tenant-isolation.utils';
import { AppDataSource } from '../../../../../packages/database/src/config/datasource';
import { User, UserStatus } from '../../../../../packages/database/src/entities/User.entity';
import { Tenant } from '../../../../../packages/database/src/entities/Tenant.entity';
import { AuditLog } from '../../../../../packages/database/src/entities/AuditLog.entity';
import { AuditService } from '@/shared/services/audit.service';
import { logger } from '@/shared/utils/logger';

const router: Router = Router();
const auditService = new AuditService();

/**
 * GET /api/admin/statistics (route racine pour compatibilité frontend)
 * Statistiques administratives globales
 */
router.get('/',
  injectTenantIdMiddleware({ strictMode: false }),
  auditMiddleware({ enabled: true }),
  async (req: Request, res: Response) => {
    try {
      const tenantContext = TenantIsolationUtils.extractTenantContext(req);
      const hasExtendedAccess = TenantIsolationUtils.hasExtendedAccess(req);

      // Repositories
      const userRepository = AppDataSource.getRepository(User);
      const tenantRepository = AppDataSource.getRepository(Tenant);
      const auditLogRepository = AppDataSource.getRepository(AuditLog);

      // Construire les requêtes avec filtrage tenant si nécessaire
      let userQuery = userRepository.createQueryBuilder('user');
      let auditQuery = auditLogRepository.createQueryBuilder('audit');

      if (!hasExtendedAccess && tenantContext) {
        userQuery = userQuery.where('user.tenantId = :tenantId', { tenantId: tenantContext.tenantId });
        auditQuery = auditQuery
          .leftJoin('audit.user', 'user')
          .where('user.tenantId = :tenantId', { tenantId: tenantContext.tenantId });
      }

      // Statistiques utilisateurs
      const totalUsers = await userQuery.getCount();
      const activeUsers = await userQuery.clone().andWhere('user.isActive = :active', { active: true }).getCount();
      const inactiveUsers = totalUsers - activeUsers;

      // Statistiques tenants (seulement pour accès étendu)
      let totalTenants = 0;
      let activeTenants = 0;
      if (hasExtendedAccess) {
        totalTenants = await tenantRepository.count();
        activeTenants = await tenantRepository.count({ where: { isActive: true } });
      }

      // Statistiques rôles et permissions (TODO: implémenter)
      const totalRoles = 5; // Placeholder
      const totalPermissions = 50; // Placeholder
      const activeRoles = 5;
      const modulePermissions = 10;

      // Statistiques d'activité
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

      // Statistiques d'audit simplifiées (sans filtrage complexe)
      const todayLogins = await auditLogRepository
        .createQueryBuilder('audit')
        .where('audit.action = :action', { action: 'login' })
        .andWhere('audit.createdAt >= :today', { today })
        .getCount();

      const thisWeekLogins = await auditLogRepository
        .createQueryBuilder('audit')
        .where('audit.action = :action', { action: 'login' })
        .andWhere('audit.createdAt >= :weekAgo', { weekAgo })
        .getCount();

      const todayAuditLogs = await auditLogRepository
        .createQueryBuilder('audit')
        .where('audit.createdAt >= :today', { today })
        .getCount();

      // Compter les actions échouées (sans filtrer par metadata pour éviter erreurs)
      const failedActions = 0; // TODO: implémenter correctement le comptage des échecs

      // Retourner les statistiques
      res.json({
        success: true,
        data: {
          totalUsers,
          activeUsers,
          inactiveUsers,
          totalTenants,
          activeTenants,
          totalRoles,
          activeRoles,
          totalPermissions,
          modulePermissions,
          todayLogins,
          thisWeekLogins,
          todayAuditLogs,
          failedActions,
          systemHealth: {
            status: 'healthy',
            uptime: process.uptime(),
            memoryUsage: process.memoryUsage().heapUsed / 1024 / 1024,
            diskUsage: 0,
            lastBackup: new Date().toISOString()
          },
          activityStats: {
            today: todayAuditLogs,
            thisWeek: thisWeekLogins,
            thisMonth: 0,
            topActions: []
          }
        }
      });
    } catch (error) {
      logger.error('Erreur récupération statistiques:', error);
      res.status(500).json({
        success: false,
        error: 'Erreur serveur',
        message: 'Erreur lors de la récupération des statistiques'
      });
    }
  }
);

/**
 * Interface pour les statistiques d'utilisation
 */
interface UsageStats {
  period: { from: Date; to: Date };
  users: {
    total: number;
    active: number;
    new: number;
    byStatus: Record<UserStatus, number>;
  };
  activity: {
    totalLogins: number;
    uniqueActiveUsers: number;
    averageSessionsPerUser: number;
    peakHours: Array<{ hour: number; count: number }>;
  };
  tenants: {
    total: number;
    active: number;
    mostActive: Array<{ tenantId: string; tenantName: string; activityCount: number }>;
  };
}

/**
 * GET /api/admin/stats/overview
 * Vue d'ensemble des statistiques système
 */
router.get('/overview',
  injectTenantIdMiddleware({ strictMode: false }),
  auditMiddleware({ enabled: true }),
  async (req: Request, res: Response) => {
    try {
      const tenantContext = TenantIsolationUtils.extractTenantContext(req);
      const hasExtendedAccess = TenantIsolationUtils.hasExtendedAccess(req);

      // Période par défaut : 30 derniers jours
      const dateTo = new Date();
      const dateFrom = new Date();
      dateFrom.setDate(dateTo.getDate() - 30);

      // Repositories
      const userRepository = AppDataSource.getRepository(User);
      const tenantRepository = AppDataSource.getRepository(Tenant);
      const auditLogRepository = AppDataSource.getRepository(AuditLog);

      // Construire les requêtes avec filtrage tenant si nécessaire
      let userQuery = userRepository.createQueryBuilder('user');
      let auditQuery = auditLogRepository.createQueryBuilder('audit');

      if (!hasExtendedAccess && tenantContext) {
        userQuery = userQuery.where('user.tenantId = :tenantId', { tenantId: tenantContext.tenantId });
        auditQuery = auditQuery
          .leftJoin('audit.user', 'user')
          .where('user.tenantId = :tenantId', { tenantId: tenantContext.tenantId });
      }

      // Statistiques utilisateurs
      const totalUsers = await userQuery.getCount();
      
      const activeUsers = await userQuery
        .andWhere('user.status = :status', { status: UserStatus.ACTIVE })
        .getCount();

      const newUsers = await userQuery
        .andWhere('user.createdAt >= :dateFrom', { dateFrom })
        .getCount();

      // Répartition par statut
      const usersByStatus = await userRepository
        .createQueryBuilder('user')
        .select('user.status', 'status')
        .addSelect('COUNT(*)', 'count')
        .where(hasExtendedAccess ? '1=1' : 'user.tenantId = :tenantId', 
               hasExtendedAccess ? {} : { tenantId: tenantContext?.tenantId })
        .groupBy('user.status')
        .getRawMany();

      const statusCounts = usersByStatus.reduce((acc, item) => {
        acc[item.status as UserStatus] = parseInt(item.count);
        return acc;
      }, {} as Record<UserStatus, number>);

      // Statistiques d'activité
      const totalLogins = await auditQuery
        .andWhere('audit.action = :action', { action: 'login' })
        .andWhere('audit.createdAt >= :dateFrom', { dateFrom })
        .getCount();

      const uniqueActiveUsers = await auditQuery
        .select('DISTINCT audit.userId')
        .andWhere('audit.createdAt >= :dateFrom', { dateFrom })
        .getCount();

      // Heures de pointe
      const peakHoursData = await auditQuery
        .select('EXTRACT(HOUR FROM audit.createdAt)', 'hour')
        .addSelect('COUNT(*)', 'count')
        .andWhere('audit.createdAt >= :dateFrom', { dateFrom })
        .groupBy('EXTRACT(HOUR FROM audit.createdAt)')
        .orderBy('count', 'DESC')
        .limit(5)
        .getRawMany();

      const peakHours = peakHoursData.map(item => ({
        hour: parseInt(item.hour),
        count: parseInt(item.count)
      }));

      // Statistiques tenants (seulement pour accès étendu)
      let tenantStats = { total: 0, active: 0, mostActive: [] };
      
      if (hasExtendedAccess) {
        const totalTenants = await tenantRepository.count();
        const activeTenants = await tenantRepository.count({
          where: { isActive: true }
        });

        // Tenants les plus actifs
        const mostActiveTenants = await auditLogRepository
          .createQueryBuilder('audit')
          .leftJoin('audit.user', 'user')
          .leftJoin('user.tenant', 'tenant')
          .select([
            'tenant.id as tenantId',
            'tenant.name as tenantName',
            'COUNT(*) as activityCount'
          ])
          .where('audit.createdAt >= :dateFrom', { dateFrom })
          .groupBy('tenant.id, tenant.name')
          .orderBy('activityCount', 'DESC')
          .limit(5)
          .getRawMany();

        tenantStats = {
          total: totalTenants,
          active: activeTenants,
          mostActive: mostActiveTenants.map(item => ({
            tenantId: item.tenantid,
            tenantName: item.tenantname,
            activityCount: parseInt(item.activitycount)
          })) as any
        };
      }

      const overview: UsageStats = {
        period: { from: dateFrom, to: dateTo },
        users: {
          total: totalUsers,
          active: activeUsers,
          new: newUsers,
          byStatus: statusCounts
        },
        activity: {
          totalLogins,
          uniqueActiveUsers,
          averageSessionsPerUser: uniqueActiveUsers > 0 ? Math.round(totalLogins / uniqueActiveUsers) : 0,
          peakHours
        },
        tenants: tenantStats as any
      };

      res.json({
        success: true,
        data: {
          overview,
          scope: hasExtendedAccess ? 'global' : 'tenant',
          tenantId: tenantContext?.tenantId
        }
      });

    } catch (error) {
      logger.error('Erreur récupération statistiques overview:', error);
      res.status(500).json({
        error: 'Erreur serveur',
        message: 'Erreur lors de la récupération des statistiques'
      });
    }
  }
);

/**
 * GET /api/admin/stats/users
 * Statistiques détaillées des utilisateurs
 */
router.get('/users',
  injectTenantIdMiddleware({ strictMode: false }),
  auditMiddleware({ enabled: true }),
  async (req: Request, res: Response) => {
    try {
      const tenantContext = TenantIsolationUtils.extractTenantContext(req);
      const hasExtendedAccess = TenantIsolationUtils.hasExtendedAccess(req);

      // Paramètres de période
      const dateFrom = req.query.dateFrom ? new Date(req.query.dateFrom as string) : 
        new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const dateTo = req.query.dateTo ? new Date(req.query.dateTo as string) : new Date();

      const userRepository = AppDataSource.getRepository(User);
      let baseQuery = userRepository.createQueryBuilder('user')
        .leftJoinAndSelect('user.tenant', 'tenant')
        .leftJoinAndSelect('user.role', 'role');

      // Filtrage par tenant si nécessaire
      if (!hasExtendedAccess && tenantContext) {
        baseQuery = baseQuery.where('user.tenantId = :tenantId', { tenantId: tenantContext.tenantId });
      }

      // Évolution des créations d'utilisateurs
      const userCreationTrend = await baseQuery
        .select([
          'DATE(user.createdAt) as date',
          'COUNT(*) as count'
        ])
        .where('user.createdAt >= :dateFrom', { dateFrom })
        .andWhere('user.createdAt <= :dateTo', { dateTo })
        .groupBy('DATE(user.createdAt)')
        .orderBy('date', 'ASC')
        .getRawMany();

      // Répartition par rôle
      const usersByRole = await baseQuery
        .select([
          'role.name as roleName',
          'COUNT(*) as count'
        ])
        .groupBy('role.name')
        .orderBy('count', 'DESC')
        .getRawMany();

      // Répartition par tenant (seulement pour accès étendu)
      let usersByTenant: any[] = [];
      if (hasExtendedAccess) {
        usersByTenant = await baseQuery
          .select([
            'tenant.name as tenantName',
            'tenant.code as tenantCode',
            'COUNT(*) as count',
            'COUNT(CASE WHEN user.status = \'active\' THEN 1 END) as activeCount'
          ])
          .groupBy('tenant.name, tenant.code')
          .orderBy('count', 'DESC')
          .getRawMany();
      }

      // Utilisateurs les plus actifs (basé sur les connexions)
      const auditLogRepository = AppDataSource.getRepository(AuditLog);
      let activeUsersQuery = auditLogRepository
        .createQueryBuilder('audit')
        .leftJoin('audit.user', 'user')
        .select([
          'user.id as userId',
          'user.name as userName',
          'user.email as userEmail',
          'COUNT(*) as loginCount'
        ])
        .where('audit.action = :action', { action: 'login' })
        .andWhere('audit.createdAt >= :dateFrom', { dateFrom })
        .andWhere('audit.createdAt <= :dateTo', { dateTo });

      if (!hasExtendedAccess && tenantContext) {
        activeUsersQuery = activeUsersQuery.andWhere('user.tenantId = :tenantId', { 
          tenantId: tenantContext.tenantId 
        });
      }

      const mostActiveUsers = await activeUsersQuery
        .groupBy('user.id, user.name, user.email')
        .orderBy('loginCount', 'DESC')
        .limit(10)
        .getRawMany();

      const userStats = {
        period: { from: dateFrom, to: dateTo },
        trends: {
          creations: userCreationTrend.map(item => ({
            date: item.date,
            count: parseInt(item.count)
          }))
        },
        distribution: {
          byRole: usersByRole.map(item => ({
            roleName: item.rolename,
            count: parseInt(item.count)
          })),
          byTenant: usersByTenant.map(item => ({
            tenantName: item.tenantname,
            tenantCode: item.tenantcode,
            count: parseInt(item.count),
            activeCount: parseInt(item.activecount)
          }))
        },
        activity: {
          mostActiveUsers: mostActiveUsers.map(item => ({
            userId: item.userid,
            userName: item.username,
            userEmail: item.useremail,
            loginCount: parseInt(item.logincount)
          }))
        }
      };

      res.json({
        success: true,
        data: userStats
      });

    } catch (error) {
      logger.error('Erreur récupération statistiques utilisateurs:', error);
      res.status(500).json({
        error: 'Erreur serveur',
        message: 'Erreur lors de la récupération des statistiques utilisateurs'
      });
    }
  }
);

/**
 * GET /api/admin/stats/activity
 * Statistiques d'activité système
 */
router.get('/activity',
  injectTenantIdMiddleware({ strictMode: false }),
  auditMiddleware({ enabled: true }),
  async (req: Request, res: Response) => {
    try {
      const tenantContext = TenantIsolationUtils.extractTenantContext(req);
      const hasExtendedAccess = TenantIsolationUtils.hasExtendedAccess(req);

      // Paramètres de période
      const dateFrom = req.query.dateFrom ? new Date(req.query.dateFrom as string) : 
        new Date(Date.now() - 7 * 24 * 60 * 60 * 1000); // 7 jours par défaut
      const dateTo = req.query.dateTo ? new Date(req.query.dateTo as string) : new Date();

      // Utiliser le service d'audit pour les statistiques
      const auditStats = await auditService.getServiceStats();

      // Générer un rapport d'audit pour la période
      const auditReport = await auditService.generateAuditReport(
        hasExtendedAccess ? undefined : tenantContext?.tenantId,
        dateFrom,
        dateTo
      );

      // Activité par jour
      const auditLogRepository = AppDataSource.getRepository(AuditLog);
      let dailyActivityQuery = auditLogRepository
        .createQueryBuilder('audit')
        .select([
          'DATE(audit.createdAt) as date',
          'COUNT(*) as totalActions',
          'COUNT(DISTINCT audit.userId) as uniqueUsers'
        ])
        .where('audit.createdAt >= :dateFrom', { dateFrom })
        .andWhere('audit.createdAt <= :dateTo', { dateTo });

      if (!hasExtendedAccess && tenantContext) {
        dailyActivityQuery = dailyActivityQuery
          .leftJoin('audit.user', 'user')
          .andWhere('user.tenantId = :tenantId', { tenantId: tenantContext.tenantId });
      }

      const dailyActivity = await dailyActivityQuery
        .groupBy('DATE(audit.createdAt)')
        .orderBy('date', 'ASC')
        .getRawMany();

      // Actions les plus fréquentes
      let topActionsQuery = auditLogRepository
        .createQueryBuilder('audit')
        .select([
          'audit.action as action',
          'COUNT(*) as count'
        ])
        .where('audit.createdAt >= :dateFrom', { dateFrom })
        .andWhere('audit.createdAt <= :dateTo', { dateTo });

      if (!hasExtendedAccess && tenantContext) {
        topActionsQuery = topActionsQuery
          .leftJoin('audit.user', 'user')
          .andWhere('user.tenantId = :tenantId', { tenantId: tenantContext.tenantId });
      }

      const topActions = await topActionsQuery
        .groupBy('audit.action')
        .orderBy('count', 'DESC')
        .limit(10)
        .getRawMany();

      // Ressources les plus accédées
      let topResourcesQuery = auditLogRepository
        .createQueryBuilder('audit')
        .select([
          'audit.tableName as resource',
          'COUNT(*) as count'
        ])
        .where('audit.createdAt >= :dateFrom', { dateFrom })
        .andWhere('audit.createdAt <= :dateTo', { dateTo });

      if (!hasExtendedAccess && tenantContext) {
        topResourcesQuery = topResourcesQuery
          .leftJoin('audit.user', 'user')
          .andWhere('user.tenantId = :tenantId', { tenantId: tenantContext.tenantId });
      }

      const topResources = await topResourcesQuery
        .groupBy('audit.tableName')
        .orderBy('count', 'DESC')
        .limit(10)
        .getRawMany();

      const activityStats = {
        period: { from: dateFrom, to: dateTo },
        overview: {
          totalActions: auditReport.totalEvents,
          uniqueUsers: Object.keys(auditReport.eventsByUser).length,
          suspiciousActivities: auditReport.suspiciousActivities.length
        },
        trends: {
          daily: dailyActivity.map(item => ({
            date: item.date,
            totalActions: parseInt(item.totalactions),
            uniqueUsers: parseInt(item.uniqueusers)
          }))
        },
        topActions: topActions.map(item => ({
          action: item.action,
          count: parseInt(item.count)
        })),
        topResources: topResources.map(item => ({
          resource: item.resource,
          count: parseInt(item.count)
        })),
        security: {
          suspiciousActivities: auditReport.suspiciousActivities,
          alertsCount: auditReport.suspiciousActivities.filter(a => 
            a.severity === 'high' || a.severity === 'critical'
          ).length
        },
        serviceStats: auditStats
      };

      res.json({
        success: true,
        data: activityStats
      });

    } catch (error) {
      logger.error('Erreur récupération statistiques activité:', error);
      res.status(500).json({
        error: 'Erreur serveur',
        message: 'Erreur lors de la récupération des statistiques d\'activité'
      });
    }
  }
);

/**
 * GET /api/admin/stats/performance
 * Métriques de performance système
 */
router.get('/performance',
  ministerialAccessMiddleware(), // Seuls les utilisateurs ministériels peuvent voir les métriques de performance
  auditMiddleware({ enabled: true }),
  async (req: Request, res: Response) => {
    try {
      // Métriques de base de données
      const dbStats = await AppDataSource.query(`
        SELECT 
          schemaname,
          tablename,
          n_tup_ins as inserts,
          n_tup_upd as updates,
          n_tup_del as deletes,
          n_live_tup as live_tuples,
          n_dead_tup as dead_tuples
        FROM pg_stat_user_tables 
        ORDER BY n_live_tup DESC
        LIMIT 10
      `);

      // Taille des tables principales
      const tableSizes = await AppDataSource.query(`
        SELECT 
          tablename,
          pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size,
          pg_total_relation_size(schemaname||'.'||tablename) as size_bytes
        FROM pg_tables 
        WHERE schemaname = 'public'
        ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC
        LIMIT 10
      `);

      // Statistiques des connexions
      const connectionStats = await AppDataSource.query(`
        SELECT 
          state,
          COUNT(*) as count
        FROM pg_stat_activity 
        WHERE datname = current_database()
        GROUP BY state
      `);

      // Métriques de performance des requêtes (si pg_stat_statements est activé)
      let queryStats: any[] = [];
      try {
        queryStats = await AppDataSource.query(`
          SELECT 
            query,
            calls,
            total_time,
            mean_time,
            rows
          FROM pg_stat_statements 
          ORDER BY total_time DESC
          LIMIT 5
        `);
      } catch (error) {
        // pg_stat_statements n'est pas activé
        logger.debug('pg_stat_statements non disponible');
      }

      // Métriques système (simulées - dans un vrai environnement, utiliser des outils comme Prometheus)
      const systemMetrics = {
        memory: {
          used: Math.floor(Math.random() * 8000), // MB
          total: 16000,
          percentage: Math.floor(Math.random() * 50) + 30
        },
        cpu: {
          usage: Math.floor(Math.random() * 30) + 10, // %
          loadAverage: (Math.random() * 2).toFixed(2)
        },
        disk: {
          used: Math.floor(Math.random() * 100000), // MB
          total: 500000,
          percentage: Math.floor(Math.random() * 40) + 20
        }
      };

      const performanceStats = {
        database: {
          tables: dbStats.map((table: any) => ({
            schema: table.schemaname,
            name: table.tablename,
            inserts: parseInt(table.inserts),
            updates: parseInt(table.updates),
            deletes: parseInt(table.deletes),
            liveTuples: parseInt(table.live_tuples),
            deadTuples: parseInt(table.dead_tuples)
          })),
          sizes: tableSizes.map((table: any) => ({
            name: table.tablename,
            size: table.size,
            sizeBytes: parseInt(table.size_bytes)
          })),
          connections: connectionStats.map((conn: any) => ({
            state: conn.state,
            count: parseInt(conn.count)
          })),
          queries: queryStats.map((query: any) => ({
            query: query.query?.substring(0, 100) + '...',
            calls: parseInt(query.calls),
            totalTime: parseFloat(query.total_time),
            meanTime: parseFloat(query.mean_time),
            rows: parseInt(query.rows)
          }))
        },
        system: systemMetrics,
        generatedAt: new Date()
      };

      res.json({
        success: true,
        data: performanceStats
      });

    } catch (error) {
      logger.error('Erreur récupération métriques performance:', error);
      res.status(500).json({
        error: 'Erreur serveur',
        message: 'Erreur lors de la récupération des métriques de performance'
      });
    }
  }
);

/**
 * GET /api/admin/stats/export
 * Export des statistiques en CSV/JSON
 */
router.get('/export',
  injectTenantIdMiddleware({ strictMode: false }),
  auditMiddleware({ enabled: true, sensitiveResource: true }),
  async (req: Request, res: Response) => {
    try {
      const format = req.query.format as string || 'json';
      const type = req.query.type as string || 'overview';
      const tenantContext = TenantIsolationUtils.extractTenantContext(req);
      const hasExtendedAccess = TenantIsolationUtils.hasExtendedAccess(req);

      let exportData: any = {};

      switch (type) {
        case 'users':
          // Export des données utilisateurs
          const userRepository = AppDataSource.getRepository(User);
          let userQuery = userRepository.createQueryBuilder('user')
            .leftJoinAndSelect('user.tenant', 'tenant')
            .leftJoinAndSelect('user.role', 'role')
            .select([
              'user.id',
              'user.email',
              'user.name',
              'user.status',
              'user.createdAt',
              'user.lastLoginAt',
              'tenant.name',
              'tenant.code',
              'role.name'
            ]);

          if (!hasExtendedAccess && tenantContext) {
            userQuery = userQuery.where('user.tenantId = :tenantId', { 
              tenantId: tenantContext.tenantId 
            });
          }

          const users = await userQuery.getMany();
          exportData = {
            type: 'users',
            data: users,
            exportedAt: new Date(),
            scope: hasExtendedAccess ? 'global' : 'tenant'
          };
          break;

        case 'activity':
          // Export des données d'activité
          const auditReport = await auditService.generateAuditReport(
            hasExtendedAccess ? undefined : tenantContext?.tenantId,
            new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
            new Date()
          );
          exportData = {
            type: 'activity',
            data: auditReport,
            exportedAt: new Date(),
            scope: hasExtendedAccess ? 'global' : 'tenant'
          };
          break;

        default:
          return res.status(400).json({
            error: 'Type d\'export invalide',
            message: 'Types supportés: users, activity'
          });
      }

      // Audit de l'export
      await auditService.logResourceAccess(
        req.user!.id,
        'stats_export',
        'export' as any,
        type,
        tenantContext?.tenantId,
        req.ip,
        {
          exportType: type,
          format,
          scope: hasExtendedAccess ? 'global' : 'tenant'
        }
      );

      if (format === 'csv') {
        // Conversion en CSV (simplifiée)
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="stats_${type}_${new Date().toISOString().split('T')[0]}.csv"`);
        
        // Pour une vraie implémentation, utiliser une librairie comme csv-writer
        res.send('CSV export not fully implemented yet');
      } else {
        // Export JSON
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', `attachment; filename="stats_${type}_${new Date().toISOString().split('T')[0]}.json"`);
        res.json(exportData);
      }

    } catch (error) {
      logger.error('Erreur export statistiques:', error);
      res.status(500).json({
        error: 'Erreur serveur',
        message: 'Erreur lors de l\'export des statistiques'
      });
    }
  }
);

export default router;

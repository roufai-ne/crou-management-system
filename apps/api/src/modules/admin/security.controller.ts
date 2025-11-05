/**
 * FICHIER: apps/api/src/modules/admin/security.controller.ts
 * CONTRÔLEUR: Security - Gestion de la sécurité et monitoring
 *
 * DESCRIPTION:
 * Contrôleur pour la gestion des alertes de sécurité, monitoring,
 * et gestion des comptes bloqués
 *
 * ROUTES:
 * - GET    /api/admin/security/alerts          - Liste des alertes de sécurité
 * - POST   /api/admin/security/alerts/:id/resolve - Résoudre une alerte
 * - GET    /api/admin/security/stats           - Statistiques de sécurité
 * - POST   /api/admin/security/users/:id/unlock - Débloquer un compte utilisateur
 * - GET    /api/admin/security/blocked-accounts - Liste des comptes bloqués
 *
 * AUTEUR: Équipe CROU
 * DATE: Décembre 2024
 */

import { Router, Request, Response } from 'express';
import { AppDataSource } from '../../../../../packages/database/src/config/datasource';
import { User } from '../../../../../packages/database/src/entities/User.entity';
import { AuditLog, AuditAction } from '../../../../../packages/database/src/entities/AuditLog.entity';
import { body, param, query, validationResult } from 'express-validator';
import { checkPermissions } from '../../shared/middlewares/permissions.middleware';
import { MoreThan } from 'typeorm';

const router: Router = Router();

// Types pour les alertes de sécurité
interface SecurityAlert {
  id: string;
  type: 'FAILED_LOGIN' | 'SUSPICIOUS_ACTIVITY' | 'RATE_LIMIT' | 'UNAUTHORIZED_ACCESS' | 'ACCOUNT_LOCKED';
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  description: string;
  userId?: string;
  userName?: string;
  userEmail?: string;
  ipAddress?: string;
  userAgent?: string;
  timestamp: Date;
  resolved: boolean;
  resolvedAt?: Date;
  resolvedBy?: string;
  metadata?: Record<string, any>;
}

interface SecurityStats {
  activeAlerts: number;
  totalAlerts: number;
  resolvedAlerts: number;
  blockedAccounts: number;
  failedLogins24h: number;
  suspiciousActivities: number;
}

interface BlockedAccount {
  userId: string;
  userName: string;
  userEmail: string;
  blockedAt: Date;
  blockedUntil: Date;
  reason: string;
  failedAttempts: number;
  lastAttemptIp?: string;
}

/**
 * GET /api/admin/security/alerts
 * Récupérer la liste des alertes de sécurité
 */
router.get(
  '/alerts',
  [
    query('severity').optional().isIn(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']),
    query('type').optional().isString(),
    query('resolved').optional().isBoolean(),
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 })
  ],
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array()
        });
      }

      const { severity, type, resolved, page = 1, limit = 50 } = req.query;
      const auditLogRepo = AppDataSource.getRepository(AuditLog);

      // Construire la requête pour les alertes basées sur les logs d'audit
      const queryBuilder = auditLogRepo.createQueryBuilder('log')
        .leftJoinAndSelect('log.user', 'user')
        .leftJoinAndSelect('log.tenant', 'tenant')
        .where('log.success = :success', { success: false })
        .orderBy('log.createdAt', 'DESC')
        .skip((Number(page) - 1) * Number(limit))
        .take(Number(limit));

      // Filtres optionnels
      if (type) {
        queryBuilder.andWhere('log.action = :action', { action: type });
      }

      const [logs, total] = await queryBuilder.getManyAndCount();

      // Convertir les logs d'audit en alertes de sécurité
      const alerts: SecurityAlert[] = logs.map((log: AuditLog) => {
        let alertType: SecurityAlert['type'] = 'SUSPICIOUS_ACTIVITY';
        let alertSeverity: SecurityAlert['severity'] = 'MEDIUM';

        if (log.action === AuditAction.LOGIN_FAILED || log.action === AuditAction.LOGIN) {
          alertType = 'FAILED_LOGIN';
          alertSeverity = 'LOW';
        } else if (log.metadata?.rateLimitExceeded) {
          alertType = 'RATE_LIMIT';
          alertSeverity = 'MEDIUM';
        } else if (log.action === AuditAction.PERMISSION_DENIED || log.metadata?.unauthorized) {
          alertType = 'UNAUTHORIZED_ACCESS';
          alertSeverity = 'HIGH';
        }

        return {
          id: log.id,
          type: alertType,
          severity: alertSeverity,
          description: `Action ${log.action} failed for ${log.resource || log.tableName}`,
          userId: log.userId,
          userName: log.user ? `${log.user.firstName || ''} ${log.user.lastName || ''}`.trim() || log.user.name : undefined,
          userEmail: log.user?.email,
          ipAddress: log.ipAddress,
          userAgent: log.userAgent,
          timestamp: log.createdAt,
          resolved: log.metadata?.resolved === true,
          resolvedAt: log.metadata?.resolvedAt ? new Date(log.metadata.resolvedAt) : undefined,
          resolvedBy: log.metadata?.resolvedBy,
          metadata: log.metadata
        };
      });

      // Filtrer par sévérité si spécifié
      let filteredAlerts = alerts;
      if (severity) {
        filteredAlerts = alerts.filter(a => a.severity === severity);
      }
      if (resolved !== undefined) {
        const isResolved = String(resolved) === 'true';
        filteredAlerts = alerts.filter(a => a.resolved === isResolved);
      }

      res.json({
        success: true,
        data: {
          alerts: filteredAlerts,
          total: filteredAlerts.length,
          page: Number(page),
          limit: Number(limit)
        }
      });

    } catch (error: any) {
      console.error('Erreur lors de la récupération des alertes:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération des alertes de sécurité',
        error: error.message
      });
    }
  }
);

/**
 * POST /api/admin/security/alerts/:id/resolve
 * Marquer une alerte comme résolue
 */
router.post(
  '/alerts/:id/resolve',
  [
    param('id').isUUID(),
    body('notes').optional().isString()
  ],
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array()
        });
      }

      const { id } = req.params;
      const { notes } = req.body;
      const auditLogRepo = AppDataSource.getRepository(AuditLog);

      // Trouver le log d'audit correspondant
      const log = await auditLogRepo.findOne({ where: { id } });

      if (!log) {
        return res.status(404).json({
          success: false,
          message: 'Alerte non trouvée'
        });
      }

      // Mettre à jour les métadonnées pour marquer comme résolu
      log.metadata = {
        ...log.metadata,
        resolved: true,
        resolvedAt: new Date().toISOString(),
        resolvedBy: req.user?.id,
        resolutionNotes: notes
      };

      await auditLogRepo.save(log);

      res.json({
        success: true,
        message: 'Alerte marquée comme résolue',
        data: {
          alertId: id,
          resolvedAt: new Date(),
          resolvedBy: req.user?.id
        }
      });

    } catch (error: any) {
      console.error('Erreur lors de la résolution de l\'alerte:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la résolution de l\'alerte',
        error: error.message
      });
    }
  }
);

/**
 * GET /api/admin/security/stats
 * Récupérer les statistiques de sécurité
 */
router.get(
  '/stats',
  async (req: Request, res: Response) => {
    try {
      const auditLogRepo = AppDataSource.getRepository(AuditLog);
      const userRepo = AppDataSource.getRepository(User);

      // Compter les échecs dans les dernières 24h
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

      const failedLogins24h = await auditLogRepo.count({
        where: {
          action: AuditAction.LOGIN_FAILED,
          createdAt: MoreThan(oneDayAgo) as any
        }
      });

      // Compter tous les logs d'échec
      const totalFailedActions = await auditLogRepo.count({
        where: { success: false }
      });

      // Compter les alertes résolues (celles avec metadata.resolved = true)
      const allFailedLogs = await auditLogRepo.find({
        where: { success: false },
        select: ['id', 'metadata']
      });

      const resolvedAlerts = allFailedLogs.filter(
        (log: AuditLog) => log.metadata?.resolved === true
      ).length;

      // Compter les comptes bloqués (utilisateurs non actifs)
      const blockedAccounts = await userRepo.count({
        where: { isActive: false }
      });

      const stats: SecurityStats = {
        activeAlerts: totalFailedActions - resolvedAlerts,
        totalAlerts: totalFailedActions,
        resolvedAlerts: resolvedAlerts,
        blockedAccounts: blockedAccounts,
        failedLogins24h: failedLogins24h,
        suspiciousActivities: Math.floor(totalFailedActions * 0.1) // Estimation
      };

      res.json({
        success: true,
        data: stats
      });

    } catch (error: any) {
      console.error('Erreur lors de la récupération des statistiques:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération des statistiques de sécurité',
        error: error.message
      });
    }
  }
);

/**
 * POST /api/admin/security/users/:id/unlock
 * Débloquer un compte utilisateur
 */
router.post(
  '/users/:id/unlock',
  [
    param('id').isUUID(),
    body('reason').optional().isString()
  ],
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array()
        });
      }

      const { id } = req.params;
      const { reason } = req.body;
      const userRepo = AppDataSource.getRepository(User);

      const user = await userRepo.findOne({ where: { id } });

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'Utilisateur non trouvé'
        });
      }

      // Réactiver le compte et réinitialiser les tentatives
      user.isActive = true;
      user.loginAttempts = 0;
      user.lockedUntil = null;
      await userRepo.save(user);

      res.json({
        success: true,
        message: 'Compte utilisateur débloqué avec succès',
        data: {
          userId: id,
          unlockedAt: new Date(),
          unlockedBy: req.user?.id,
          reason
        }
      });

    } catch (error: any) {
      console.error('Erreur lors du déblocage du compte:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors du déblocage du compte utilisateur',
        error: error.message
      });
    }
  }
);

/**
 * GET /api/admin/security/blocked-accounts
 * Récupérer la liste des comptes bloqués
 */
router.get(
  '/blocked-accounts',
  [
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 })
  ],
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array()
        });
      }

      const { page = 1, limit = 50 } = req.query;
      const userRepo = AppDataSource.getRepository(User);
      const auditLogRepo = AppDataSource.getRepository(AuditLog);

      // Récupérer les utilisateurs inactifs
      const [blockedUsers, total] = await userRepo.findAndCount({
        where: { isActive: false },
        skip: (Number(page) - 1) * Number(limit),
        take: Number(limit)
      });

      // Pour chaque utilisateur bloqué, récupérer les infos de sécurité
      const blockedAccounts: BlockedAccount[] = await Promise.all(
        blockedUsers.map(async (user: User) => {
          // Compter les tentatives échouées
          const failedAttempts = await auditLogRepo.count({
            where: {
              userId: user.id,
              action: AuditAction.LOGIN_FAILED
            }
          });

          // Récupérer la dernière tentative
          const lastAttempt = await auditLogRepo.findOne({
            where: {
              userId: user.id,
              action: AuditAction.LOGIN_FAILED
            },
            order: { createdAt: 'DESC' }
          });

          return {
            userId: user.id,
            userName: `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.name,
            userEmail: user.email,
            blockedAt: user.updatedAt,
            blockedUntil: user.lockedUntil || new Date(user.updatedAt.getTime() + 24 * 60 * 60 * 1000), // +24h
            reason: failedAttempts > 5 ? 'Trop de tentatives échouées' : 'Compte désactivé',
            failedAttempts: failedAttempts,
            lastAttemptIp: lastAttempt?.ipAddress
          };
        })
      );

      res.json({
        success: true,
        data: {
          accounts: blockedAccounts,
          total: total,
          page: Number(page),
          limit: Number(limit)
        }
      });

    } catch (error: any) {
      console.error('Erreur lors de la récupération des comptes bloqués:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération des comptes bloqués',
        error: error.message
      });
    }
  }
);

export default router;

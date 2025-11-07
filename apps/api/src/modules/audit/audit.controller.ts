/**
 * FICHIER: apps\api\src\modules\audit\audit.controller.ts
 * CONTRÔLEUR: Gestion des audits et rapports
 * 
 * DESCRIPTION:
 * Contrôleur pour la consultation des logs d'audit
 * Génération de rapports d'audit
 * Gestion des alertes de sécurité
 * 
 * FONCTIONNALITÉS:
 * - Consultation des logs d'audit avec filtres
 * - Génération de rapports d'audit
 * - Consultation des activités suspectes
 * - Statistiques d'utilisation
 * - Archivage des anciens logs
 * 
 * AUTEUR: Équipe CROU
 * DATE: Décembre 2024
 */

import { Request, Response, Router } from 'express';
import { authenticateJWT } from '@/shared/middlewares/auth.middleware';
import { checkPermissions } from '@/shared/middlewares/permissions.middleware';
import { AuditService, AuditSearchFilters } from '@/shared/services/audit.service';
import { AuditAction } from '../../../../../packages/database/src/entities/AuditLog.entity';
import { auditMiddleware } from '@/shared/middlewares/audit.middleware';
import { logger } from '@/shared/utils/logger';

const router: Router = Router();
const auditService = new AuditService();

/**
 * GET /api/audit ou /api/admin/audit-logs
 * Route racine pour compatibilité frontend (alias de /logs)
 */
router.get('/',
    authenticateJWT,
    checkPermissions(['audit:read']),
    auditMiddleware({ enabled: true, sensitiveResource: true }),
    async (req: Request, res: Response) => {
        try {
            // Construire les filtres depuis les paramètres de requête
            const filters: AuditSearchFilters = {
                limit: parseInt(req.query.limit as string) || 50,
                offset: parseInt(req.query.offset as string) || 0
            };

            // Filtres optionnels
            if (req.query.userId && req.query.userId !== 'all') {
                filters.userId = req.query.userId as string;
            }

            if (req.query.tenantId) {
                filters.tenantId = req.query.tenantId as string;
            } else if (req.user?.tenantId) {
                filters.tenantId = req.user.tenantId;
            }

            if (req.query.action && req.query.action !== 'all') {
                filters.action = req.query.action as AuditAction;
            }

            if (req.query.resource && req.query.resource !== 'all') {
                filters.resource = req.query.resource as string;
            }

            if (req.query.dateFrom) {
                filters.dateFrom = new Date(req.query.dateFrom as string);
            }

            if (req.query.dateTo) {
                filters.dateTo = new Date(req.query.dateTo as string);
            }

            if (req.query.ipAddress) {
                filters.ipAddress = req.query.ipAddress as string;
            }

            // Calculer pagination
            const page = parseInt(req.query.page as string) || 1;
            filters.offset = (page - 1) * filters.limit;

            // Rechercher les logs
            const result = await auditService.searchAuditLogs(filters);

            res.json({
                success: true,
                data: {
                    logs: result.logs.map(log => ({
                        id: log.id,
                        userId: log.userId,
                        userName: log.user?.name || 'Utilisateur inconnu',
                        userEmail: log.user?.email,
                        action: log.action,
                        resource: log.tableName,
                        resourceId: log.recordId,
                        oldValues: log.oldValues,
                        newValues: log.newValues,
                        ipAddress: log.ipAddress,
                        userAgent: log.userAgent,
                        createdAt: log.createdAt,
                        metadata: log.metadata
                    })),
                    pagination: {
                        total: result.total,
                        page,
                        limit: filters.limit,
                        pages: Math.ceil(result.total / filters.limit)
                    },
                    filters
                }
            });

        } catch (error) {
            logger.error('Erreur recherche logs audit:', error);
            res.status(500).json({
                success: false,
                error: 'Erreur serveur',
                message: 'Erreur lors de la recherche des logs d\'audit'
            });
        }
    }
);

/**
 * GET /api/audit/logs
 * Rechercher les logs d'audit avec filtres
 */
router.get('/logs',
    authenticateJWT,
    checkPermissions(['audit:read']),
    auditMiddleware({ enabled: true, sensitiveResource: true }),
    async (req: Request, res: Response) => {
        try {
            // Construire les filtres depuis les paramètres de requête
            const filters: AuditSearchFilters = {
                limit: parseInt(req.query.limit as string) || 50,
                offset: parseInt(req.query.offset as string) || 0
            };

            // Filtres optionnels
            if (req.query.userId) {
                filters.userId = req.query.userId as string;
            }

            if (req.query.tenantId) {
                filters.tenantId = req.query.tenantId as string;
            } else if (req.user?.tenantId) {
                // Filtrer par tenant de l'utilisateur si pas spécifié
                filters.tenantId = req.user.tenantId;
            }

            if (req.query.action) {
                filters.action = req.query.action as AuditAction;
            }

            if (req.query.resource) {
                filters.resource = req.query.resource as string;
            }

            if (req.query.dateFrom) {
                filters.dateFrom = new Date(req.query.dateFrom as string);
            }

            if (req.query.dateTo) {
                filters.dateTo = new Date(req.query.dateTo as string);
            }

            if (req.query.ipAddress) {
                filters.ipAddress = req.query.ipAddress as string;
            }

            // Rechercher les logs
            const result = await auditService.searchAuditLogs(filters);

            res.json({
                success: true,
                data: {
                    logs: result.logs.map(log => ({
                        id: log.id,
                        userId: log.userId,
                        userName: log.user?.name || 'Utilisateur inconnu',
                        userEmail: log.user?.email,
                        action: log.action,
                        resource: log.tableName,
                        resourceId: log.recordId,
                        oldValues: log.oldValues,
                        newValues: log.newValues,
                        ipAddress: log.ipAddress,
                        userAgent: log.userAgent,
                        createdAt: log.createdAt,
                        metadata: log.metadata
                    })),
                    pagination: {
                        total: result.total,
                        limit: filters.limit,
                        offset: filters.offset,
                        hasMore: result.hasMore
                    },
                    filters
                }
            });

        } catch (error) {
            logger.error('Erreur recherche logs audit:', error);
            res.status(500).json({
                success: false,
                error: 'Erreur serveur',
                message: 'Erreur lors de la recherche des logs d\'audit'
            });
        }
    }
);

/**
 * GET /api/audit/reports
 * Générer un rapport d'audit
 */
router.get('/reports',
    authenticateJWT,
    checkPermissions(['audit:read', 'reports:generate']),
    auditMiddleware({ enabled: true, sensitiveResource: true }),
    async (req: Request, res: Response) => {
        try {
            // Paramètres du rapport
            const dateFrom = req.query.dateFrom ? new Date(req.query.dateFrom as string) : undefined;
            const dateTo = req.query.dateTo ? new Date(req.query.dateTo as string) : undefined;

            let tenantId = req.query.tenantId as string;

            // Utiliser le tenant de l'utilisateur par défaut
            if (!tenantId) {
                tenantId = req.user?.tenantId || '';
            }

            // Générer le rapport
            const report = await auditService.generateAuditReport(tenantId, dateFrom, dateTo);

            res.json({
                success: true,
                data: {
                    report,
                    parameters: {
                        tenantId,
                        dateFrom,
                        dateTo,
                        generatedAt: new Date(),
                        generatedBy: {
                            userId: req.user?.id,
                            tenantId: req.user?.tenantId
                        }
                    }
                }
            });

        } catch (error) {
            logger.error('Erreur génération rapport audit:', error);
            res.status(500).json({
                success: false,
                error: 'Erreur serveur',
                message: 'Erreur lors de la génération du rapport d\'audit'
            });
        }
    }
);

/**
 * GET /api/audit/suspicious
 * Obtenir les activités suspectes récentes
 */
router.get('/suspicious',
    authenticateJWT,
    checkPermissions(['audit:read', 'security:monitor']),
    auditMiddleware({ enabled: true, sensitiveResource: true }),
    async (req: Request, res: Response) => {
        try {
            // Générer un rapport pour obtenir les activités suspectes
            const dateFrom = req.query.dateFrom ? new Date(req.query.dateFrom as string) :
                new Date(Date.now() - 7 * 24 * 60 * 60 * 1000); // 7 jours par défaut
            const dateTo = req.query.dateTo ? new Date(req.query.dateTo as string) : new Date();

            let tenantId = req.query.tenantId as string;

            // Utiliser le tenant de l'utilisateur par défaut
            if (!tenantId) {
                tenantId = req.user?.tenantId || '';
            }

            const report = await auditService.generateAuditReport(tenantId, dateFrom, dateTo);

            // Filtrer par sévérité si demandé
            let activities = report.suspiciousActivities;
            if (req.query.severity) {
                const severities = (req.query.severity as string).split(',');
                activities = activities.filter(activity => severities.includes(activity.severity));
            }

            // Trier par sévérité et date
            const severityOrder = { 'critical': 4, 'high': 3, 'medium': 2, 'low': 1 };
            activities.sort((a, b) => {
                const severityDiff = severityOrder[b.severity] - severityOrder[a.severity];
                if (severityDiff !== 0) return severityDiff;
                return b.timestamp.getTime() - a.timestamp.getTime();
            });

            res.json({
                success: true,
                data: {
                    activities,
                    summary: {
                        total: activities.length,
                        critical: activities.filter(a => a.severity === 'critical').length,
                        high: activities.filter(a => a.severity === 'high').length,
                        medium: activities.filter(a => a.severity === 'medium').length,
                        low: activities.filter(a => a.severity === 'low').length
                    },
                    parameters: {
                        tenantId,
                        dateFrom,
                        dateTo,
                        severity: req.query.severity
                    }
                }
            });

        } catch (error) {
            logger.error('Erreur récupération activités suspectes:', error);
            res.status(500).json({
                success: false,
                error: 'Erreur serveur',
                message: 'Erreur lors de la récupération des activités suspectes'
            });
        }
    }
);

/**
 * GET /api/audit/stats
 * Obtenir les statistiques du service d'audit
 */
router.get('/stats',
    authenticateJWT,
    checkPermissions(['audit:read']),
    auditMiddleware({ enabled: true }),
    async (req: Request, res: Response) => {
        try {
            const stats = await auditService.getServiceStats();

            res.json({
                success: true,
                data: {
                    stats,
                    generatedAt: new Date()
                }
            });

        } catch (error) {
            logger.error('Erreur récupération statistiques audit:', error);
            res.status(500).json({
                success: false,
                error: 'Erreur serveur',
                message: 'Erreur lors de la récupération des statistiques'
            });
        }
    }
);

/**
 * POST /api/audit/archive
 * Archiver les anciens logs d'audit
 */
router.post('/archive',
    authenticateJWT,
    checkPermissions(['audit:admin']),
    auditMiddleware({ enabled: true, sensitiveResource: true }),
    async (req: Request, res: Response) => {
        try {
            const retentionDays = parseInt(req.body.retentionDays) || 365;

            const archivedCount = await auditService.archiveOldLogs(retentionDays);

            res.json({
                success: true,
                data: {
                    archivedCount,
                    retentionDays,
                    archivedAt: new Date(),
                    archivedBy: {
                        userId: req.user?.id
                    }
                }
            });

        } catch (error) {
            logger.error('Erreur archivage logs audit:', error);
            res.status(500).json({
                success: false,
                error: 'Erreur serveur',
                message: 'Erreur lors de l\'archivage des logs'
            });
        }
    }
);

/**
 * GET /api/audit/user/:userId
 * Obtenir l'activité d'un utilisateur spécifique
 */
router.get('/user/:userId',
    authenticateJWT,
    checkPermissions(['audit:read']),
    auditMiddleware({ enabled: true, sensitiveResource: true }),
    async (req: Request, res: Response) => {
        try {
            const targetUserId = req.params.userId;

            // Vérifier les permissions d'accès
            if (req.user?.id !== targetUserId &&
                !req.user?.permissions?.includes('audit:admin')) {
                return res.status(403).json({
                    success: false,
                    error: 'Accès refusé',
                    message: 'Vous ne pouvez consulter que votre propre activité'
                });
            }

            // Construire les filtres
            const filters: AuditSearchFilters = {
                userId: targetUserId,
                limit: parseInt(req.query.limit as string) || 100,
                offset: parseInt(req.query.offset as string) || 0
            };

            if (req.query.dateFrom) {
                filters.dateFrom = new Date(req.query.dateFrom as string);
            }

            if (req.query.dateTo) {
                filters.dateTo = new Date(req.query.dateTo as string);
            }

            // Rechercher l'activité
            const result = await auditService.searchAuditLogs(filters);

            // Analyser l'activité
            const activitySummary = {
                totalActions: result.logs.length,
                actionsByType: {} as Record<AuditAction, number>,
                loginAttempts: result.logs.filter(log =>
                    log.action === AuditAction.LOGIN || log.action === AuditAction.LOGIN_FAILED
                ).length,
                failedLogins: result.logs.filter(log => log.action === AuditAction.LOGIN_FAILED).length,
                lastActivity: result.logs.length > 0 ? result.logs[0].createdAt : null,
                ipAddresses: [...new Set(result.logs.map(log => log.ipAddress).filter(Boolean))],
                mostActiveHours: {} as Record<number, number>
            };

            // Compter les actions par type
            result.logs.forEach(log => {
                activitySummary.actionsByType[log.action] = (activitySummary.actionsByType[log.action] || 0) + 1;

                // Compter les heures d'activité
                const hour = log.createdAt.getHours();
                activitySummary.mostActiveHours[hour] = (activitySummary.mostActiveHours[hour] || 0) + 1;
            });

            res.json({
                success: true,
                data: {
                    userId: targetUserId,
                    logs: result.logs.map(log => ({
                        id: log.id,
                        action: log.action,
                        resource: log.tableName,
                        resourceId: log.recordId,
                        ipAddress: log.ipAddress,
                        userAgent: log.userAgent,
                        createdAt: log.createdAt,
                        metadata: log.metadata
                    })),
                    summary: activitySummary,
                    pagination: {
                        total: result.total,
                        limit: filters.limit,
                        offset: filters.offset,
                        hasMore: result.hasMore
                    }
                }
            });

        } catch (error) {
            logger.error('Erreur récupération activité utilisateur:', error);
            res.status(500).json({
                success: false,
                error: 'Erreur serveur',
                message: 'Erreur lors de la récupération de l\'activité utilisateur'
            });
        }
    }
);

export default router;
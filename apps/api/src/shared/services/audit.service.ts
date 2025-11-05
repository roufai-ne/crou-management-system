/**
 * FICHIER: apps\api\src\shared\services\audit.service.ts
 * SERVICE: Audit - Service d'audit et traçabilité complet
 * 
 * DESCRIPTION:
 * Service pour l'enregistrement automatique des événements d'audit
 * Traçabilité complète des actions utilisateurs
 * Détection d'activités suspectes et alertes de sécurité
 * 
 * FONCTIONNALITÉS:
 * - Enregistrement automatique des événements d'auth
 * - Logging des accès aux ressources avec contexte
 * - Détection d'activités suspectes (tentatives multiples, accès anormaux)
 * - Archivage automatique des logs anciens
 * - Génération de rapports d'audit
 * - Alertes de sécurité en temps réel
 * - Recherche et filtrage avancés des logs
 * 
 * AUTEUR: Équipe CROU
 * DATE: Décembre 2024
 */

import { AppDataSource } from '../../../../../packages/database/src/config/datasource';
import { AuditLog, AuditAction } from '../../../../../packages/database/src/entities/AuditLog.entity';
import { User } from '../../../../../packages/database/src/entities/User.entity';
import { Repository, Between, MoreThan, LessThan, In } from 'typeorm';
import { logger } from '@/shared/utils/logger';

export interface AuditEvent {
  userId?: string;
  action: AuditAction;
  resource: string;
  resourceId?: string;
  oldValues?: Record<string, any>;
  newValues?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  tenantId?: string;
  sessionId?: string;
  metadata?: Record<string, any>;
}

export interface SuspiciousActivity {
  type: 'multiple_failed_logins' | 'unusual_access_pattern' | 'cross_tenant_access' | 'privilege_escalation' | 'bulk_operations';
  userId?: string;
  ipAddress?: string;
  tenantId?: string;
  count: number;
  timeWindow: string;
  details: Record<string, any>;
  severity: 'low' | 'medium' | 'high' | 'critical';
  timestamp: Date;
}

export interface AuditSearchFilters {
  userId?: string;
  tenantId?: string;
  action?: AuditAction;
  resource?: string;
  dateFrom?: Date;
  dateTo?: Date;
  ipAddress?: string;
  limit?: number;
  offset?: number;
}

export interface AuditReport {
  totalEvents: number;
  eventsByAction: Record<AuditAction, number>;
  eventsByUser: Record<string, number>;
  eventsByResource: Record<string, number>;
  suspiciousActivities: SuspiciousActivity[];
  timeRange: { from: Date; to: Date };
  generatedAt: Date;
}

/**
 * Service d'audit complet
 */
export class AuditService {
  private auditLogRepository: Repository<AuditLog>;
  private userRepository: Repository<User>;
  
  // Configuration des seuils de détection
  private readonly SUSPICIOUS_THRESHOLDS = {
    FAILED_LOGINS_PER_HOUR: 5,
    FAILED_LOGINS_PER_DAY: 20,
    REQUESTS_PER_MINUTE: 100,
    BULK_OPERATIONS_THRESHOLD: 50,
    CROSS_TENANT_ACCESS_THRESHOLD: 10
  };

  // Cache pour la détection d'activités suspectes
  private suspiciousActivityCache = new Map<string, number>();

  constructor() {
    this.auditLogRepository = AppDataSource.getRepository(AuditLog);
    this.userRepository = AppDataSource.getRepository(User);
    
    // Nettoyer le cache toutes les heures
    setInterval(() => {
      this.suspiciousActivityCache.clear();
    }, 60 * 60 * 1000);
  }

  /**
   * Enregistrer un événement d'audit
   */
  async logEvent(event: AuditEvent): Promise<void> {
    try {
      const auditLog = this.auditLogRepository.create({
        userId: event.userId,
        action: event.action,
        tableName: event.resource,
        recordId: event.resourceId || 'unknown',
        oldValues: event.oldValues || {},
        newValues: event.newValues || {},
        ipAddress: event.ipAddress || '',
        userAgent: event.userAgent || '',
        metadata: event.metadata || {}
      });

      await this.auditLogRepository.save(auditLog);

      // Détecter les activités suspectes en temps réel
      await this.detectSuspiciousActivity(event);

      logger.debug('Événement d\'audit enregistré:', {
        userId: event.userId,
        action: event.action,
        resource: event.resource,
        resourceId: event.resourceId
      });

    } catch (error) {
      logger.error('Erreur enregistrement événement audit:', error);
      // Ne pas faire échouer l'opération principale
    }
  }

  /**
   * Enregistrer un événement d'authentification
   */
  async logAuthEvent(
    action: 'login' | 'logout' | 'token_refresh' | 'password_change',
    userId?: string,
    email?: string,
    success: boolean = true,
    ipAddress?: string,
    userAgent?: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    const auditAction = this.mapAuthActionToAuditAction(action, success);
    
    await this.logEvent({
      userId,
      action: auditAction,
      resource: 'authentication',
      resourceId: email || userId || 'unknown',
      ipAddress,
      userAgent,
      metadata: {
        ...metadata,
        authAction: action,
        success,
        timestamp: new Date().toISOString()
      }
    });

    // Alertes spéciales pour les échecs de connexion
    if (!success && action === 'login') {
      await this.handleFailedLogin(email, ipAddress);
    }
  }

  /**
   * Enregistrer un accès à une ressource
   */
  async logResourceAccess(
    userId: string,
    resource: string,
    action: AuditAction,
    resourceId?: string,
    tenantId?: string,
    ipAddress?: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    await this.logEvent({
      userId,
      action,
      resource,
      resourceId,
      tenantId,
      ipAddress,
      metadata: {
        ...metadata,
        accessType: 'resource_access',
        timestamp: new Date().toISOString()
      }
    });
  }

  /**
   * Rechercher les logs d'audit
   */
  async searchAuditLogs(filters: AuditSearchFilters): Promise<{
    logs: AuditLog[];
    total: number;
    hasMore: boolean;
  }> {
    try {
      const queryBuilder = this.auditLogRepository.createQueryBuilder('audit')
        .leftJoinAndSelect('audit.user', 'user')
        .orderBy('audit.createdAt', 'DESC');

      // Appliquer les filtres
      if (filters.userId) {
        queryBuilder.andWhere('audit.userId = :userId', { userId: filters.userId });
      }

      if (filters.tenantId) {
        queryBuilder.andWhere('user.tenantId = :tenantId', { tenantId: filters.tenantId });
      }

      if (filters.action) {
        queryBuilder.andWhere('audit.action = :action', { action: filters.action });
      }

      if (filters.resource) {
        queryBuilder.andWhere('audit.tableName = :resource', { resource: filters.resource });
      }

      if (filters.dateFrom) {
        queryBuilder.andWhere('audit.createdAt >= :dateFrom', { dateFrom: filters.dateFrom });
      }

      if (filters.dateTo) {
        queryBuilder.andWhere('audit.createdAt <= :dateTo', { dateTo: filters.dateTo });
      }

      if (filters.ipAddress) {
        queryBuilder.andWhere('audit.ipAddress = :ipAddress', { ipAddress: filters.ipAddress });
      }

      // Pagination
      const limit = filters.limit || 50;
      const offset = filters.offset || 0;
      
      queryBuilder.skip(offset).take(limit + 1); // +1 pour détecter s'il y a plus

      const logs = await queryBuilder.getMany();
      const hasMore = logs.length > limit;
      
      if (hasMore) {
        logs.pop(); // Retirer le dernier élément
      }

      const total = await queryBuilder.getCount();

      return { logs, total, hasMore };

    } catch (error) {
      logger.error('Erreur recherche logs audit:', error);
      return { logs: [], total: 0, hasMore: false };
    }
  }

  /**
   * Générer un rapport d'audit
   */
  async generateAuditReport(
    tenantId?: string,
    dateFrom?: Date,
    dateTo?: Date
  ): Promise<AuditReport> {
    try {
      const filters: AuditSearchFilters = {
        tenantId,
        dateFrom: dateFrom || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 jours par défaut
        dateTo: dateTo || new Date(),
        limit: 10000 // Limite élevée pour le rapport
      };

      const { logs, total } = await this.searchAuditLogs(filters);

      // Analyser les événements
      const eventsByAction: Record<AuditAction, number> = {} as any;
      const eventsByUser: Record<string, number> = {};
      const eventsByResource: Record<string, number> = {};

      logs.forEach(log => {
        // Par action
        eventsByAction[log.action] = (eventsByAction[log.action] || 0) + 1;
        
        // Par utilisateur
        if (log.userId) {
          eventsByUser[log.userId] = (eventsByUser[log.userId] || 0) + 1;
        }
        
        // Par ressource
        eventsByResource[log.tableName] = (eventsByResource[log.tableName] || 0) + 1;
      });

      // Détecter les activités suspectes
      const suspiciousActivities = await this.analyzeSuspiciousActivities(logs);

      return {
        totalEvents: total,
        eventsByAction,
        eventsByUser,
        eventsByResource,
        suspiciousActivities,
        timeRange: {
          from: filters.dateFrom!,
          to: filters.dateTo!
        },
        generatedAt: new Date()
      };

    } catch (error) {
      logger.error('Erreur génération rapport audit:', error);
      throw error;
    }
  }

  /**
   * Archiver les anciens logs
   */
  async archiveOldLogs(retentionDays: number = 365): Promise<number> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

      const result = await this.auditLogRepository.delete({
        createdAt: LessThan(cutoffDate)
      });

      const archivedCount = result.affected || 0;
      
      logger.info(`Logs d'audit archivés: ${archivedCount} entrées supprimées`);
      
      return archivedCount;

    } catch (error) {
      logger.error('Erreur archivage logs audit:', error);
      return 0;
    }
  }

  /**
   * Obtenir les statistiques du service
   */
  async getServiceStats(): Promise<{
    totalLogs: number;
    logsToday: number;
    logsThisWeek: number;
    topUsers: Array<{ userId: string; count: number }>;
    topActions: Array<{ action: AuditAction; count: number }>;
    suspiciousActivitiesCount: number;
  }> {
    try {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

      // Statistiques générales
      const totalLogs = await this.auditLogRepository.count();
      const logsToday = await this.auditLogRepository.count({
        where: { createdAt: MoreThan(today) }
      });
      const logsThisWeek = await this.auditLogRepository.count({
        where: { createdAt: MoreThan(weekAgo) }
      });

      // Top utilisateurs (cette semaine)
      const topUsersQuery = await this.auditLogRepository
        .createQueryBuilder('audit')
        .select('audit.userId', 'userId')
        .addSelect('COUNT(*)', 'count')
        .where('audit.createdAt > :weekAgo', { weekAgo })
        .andWhere('audit.userId IS NOT NULL')
        .groupBy('audit.userId')
        .orderBy('count', 'DESC')
        .limit(10)
        .getRawMany();

      const topUsers = topUsersQuery.map(row => ({
        userId: row.userId,
        count: parseInt(row.count)
      }));

      // Top actions (cette semaine)
      const topActionsQuery = await this.auditLogRepository
        .createQueryBuilder('audit')
        .select('audit.action', 'action')
        .addSelect('COUNT(*)', 'count')
        .where('audit.createdAt > :weekAgo', { weekAgo })
        .groupBy('audit.action')
        .orderBy('count', 'DESC')
        .getRawMany();

      const topActions = topActionsQuery.map(row => ({
        action: row.action as AuditAction,
        count: parseInt(row.count)
      }));

      // Compter les activités suspectes récentes
      const suspiciousActivitiesCount = await this.auditLogRepository.count({
        where: {
          action: In([AuditAction.LOGIN_FAILED, AuditAction.PERMISSION_DENIED]),
          createdAt: MoreThan(today)
        }
      });

      return {
        totalLogs,
        logsToday,
        logsThisWeek,
        topUsers,
        topActions,
        suspiciousActivitiesCount
      };

    } catch (error) {
      logger.error('Erreur récupération statistiques audit:', error);
      return {
        totalLogs: 0,
        logsToday: 0,
        logsThisWeek: 0,
        topUsers: [],
        topActions: [],
        suspiciousActivitiesCount: 0
      };
    }
  }

  /**
   * Détecter les activités suspectes en temps réel
   */
  private async detectSuspiciousActivity(event: AuditEvent): Promise<void> {
    try {
      const now = new Date();
      const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

      // Détecter les tentatives de connexion échouées multiples
      if (event.action === AuditAction.LOGIN_FAILED && event.userId) {
        const recentFailures = await this.auditLogRepository.count({
          where: {
            userId: event.userId,
            action: AuditAction.LOGIN_FAILED,
            createdAt: MoreThan(oneHourAgo)
          }
        });

        if (recentFailures >= this.SUSPICIOUS_THRESHOLDS.FAILED_LOGINS_PER_HOUR) {
          await this.reportSuspiciousActivity({
            type: 'multiple_failed_logins',
            userId: event.userId,
            ipAddress: event.ipAddress,
            tenantId: event.tenantId,
            count: recentFailures,
            timeWindow: '1 hour',
            details: { action: event.action, resource: event.resource },
            severity: recentFailures > 10 ? 'high' : 'medium',
            timestamp: now
          });
        }
      }

    } catch (error) {
      logger.error('Erreur détection activité suspecte:', error);
    }
  }

  /**
   * Analyser les activités suspectes dans un ensemble de logs
   */
  private async analyzeSuspiciousActivities(logs: AuditLog[]): Promise<SuspiciousActivity[]> {
    const activities: SuspiciousActivity[] = [];

    try {
      // Grouper par utilisateur
      const userActivities = new Map<string, AuditLog[]>();
      logs.forEach(log => {
        if (log.userId) {
          if (!userActivities.has(log.userId)) {
            userActivities.set(log.userId, []);
          }
          userActivities.get(log.userId)!.push(log);
        }
      });

      // Analyser chaque utilisateur
      for (const [userId, userLogs] of userActivities) {
        // Connexions échouées
        const failedLogins = userLogs.filter(log => log.action === AuditAction.LOGIN_FAILED);
        if (failedLogins.length > this.SUSPICIOUS_THRESHOLDS.FAILED_LOGINS_PER_DAY) {
          activities.push({
            type: 'multiple_failed_logins',
            userId,
            count: failedLogins.length,
            timeWindow: 'analysis period',
            details: { failedLogins: failedLogins.length },
            severity: failedLogins.length > 50 ? 'critical' : 'high',
            timestamp: new Date()
          });
        }

        // Accès refusés
        const deniedAccess = userLogs.filter(log => log.action === AuditAction.PERMISSION_DENIED);
        if (deniedAccess.length > 10) {
          activities.push({
            type: 'privilege_escalation',
            userId,
            count: deniedAccess.length,
            timeWindow: 'analysis period',
            details: { deniedAccess: deniedAccess.length },
            severity: 'medium',
            timestamp: new Date()
          });
        }
      }

    } catch (error) {
      logger.error('Erreur analyse activités suspectes:', error);
    }

    return activities;
  }

  /**
   * Signaler une activité suspecte
   */
  private async reportSuspiciousActivity(activity: SuspiciousActivity): Promise<void> {
    try {
      // Logger l'activité suspecte
      logger.warn('Activité suspecte détectée:', activity);

      // Enregistrer comme événement d'audit
      await this.logEvent({
        userId: activity.userId || 'system',
        action: AuditAction.SECURITY_ALERT,
        resource: 'security',
        resourceId: `suspicious_${activity.type}`,
        metadata: {
          suspiciousActivity: activity,
          alertLevel: activity.severity,
          timestamp: activity.timestamp.toISOString()
        }
      });

    } catch (error) {
      logger.error('Erreur signalement activité suspecte:', error);
    }
  }

  /**
   * Gérer les échecs de connexion
   */
  private async handleFailedLogin(email?: string, ipAddress?: string): Promise<void> {
    try {
      if (!email && !ipAddress) return;

      const now = new Date();
      const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

      // Compter les échecs récents
      const queryBuilder = this.auditLogRepository.createQueryBuilder('audit')
        .where('audit.action = :action', { action: AuditAction.LOGIN_FAILED })
        .andWhere('audit.createdAt > :oneHourAgo', { oneHourAgo });

      if (email) {
        queryBuilder.andWhere('audit.recordId = :email', { email });
      }

      if (ipAddress) {
        queryBuilder.andWhere('audit.ipAddress = :ipAddress', { ipAddress });
      }

      const failedAttempts = await queryBuilder.getCount();

      // Alerter si trop d'échecs
      if (failedAttempts >= this.SUSPICIOUS_THRESHOLDS.FAILED_LOGINS_PER_HOUR) {
        await this.reportSuspiciousActivity({
          type: 'multiple_failed_logins',
          userId: email,
          ipAddress,
          count: failedAttempts,
          timeWindow: '1 hour',
          details: { email, ipAddress },
          severity: failedAttempts > 15 ? 'critical' : 'high',
          timestamp: now
        });
      }

    } catch (error) {
      logger.error('Erreur gestion échec connexion:', error);
    }
  }

  /**
   * Mapper les actions d'auth vers les actions d'audit
   */
  private mapAuthActionToAuditAction(
    action: 'login' | 'logout' | 'token_refresh' | 'password_change',
    success: boolean
  ): AuditAction {
    switch (action) {
      case 'login':
        return success ? AuditAction.LOGIN : AuditAction.LOGIN_FAILED;
      case 'logout':
        return AuditAction.LOGOUT;
      case 'token_refresh':
        return AuditAction.TOKEN_REFRESH;
      case 'password_change':
        return AuditAction.PASSWORD_CHANGE;
      default:
        return AuditAction.CUSTOM;
    }
  }
}

/**
 * FICHIER: apps/api/src/modules/notifications/notifications.service.db.ts
 * SERVICE: Notifications - Gestion avec base de données
 *
 * DESCRIPTION:
 * Service pour la gestion des notifications avec persistance en BDD
 * Support multi-canal, préférences utilisateurs
 * Migration de l'implémentation in-memory vers TypeORM
 *
 * AUTEUR: Équipe CROU
 * DATE: Janvier 2025
 */

import { AppDataSource } from '../../../../../packages/database/src/config/datasource';
import {
  Notification,
  NotificationType,
  NotificationCategory,
  NotificationPriority,
  NotificationStatus,
  DeliveryMethod
} from '../../../../../packages/database/src/entities/Notification.entity';
import { NotificationPreference } from '../../../../../packages/database/src/entities/NotificationPreference.entity';

export interface CreateNotificationDTO {
  title: string;
  message: string;
  type: NotificationType;
  category: NotificationCategory;
  priority: NotificationPriority;
  userId?: string;
  role?: string;
  data?: any;
  metadata?: any;
  expiresAt?: Date;
  deliveryMethods?: DeliveryMethod[];
}

export interface NotificationFilters {
  type?: NotificationType;
  category?: NotificationCategory;
  status?: NotificationStatus;
  priority?: NotificationPriority;
  unreadOnly?: boolean;
  startDate?: Date;
  endDate?: Date;
}

export class NotificationsServiceDB {
  /**
   * Créer une nouvelle notification
   */
  static async createNotification(
    tenantId: string,
    createdBy: string,
    data: CreateNotificationDTO
  ) {
    try {
      const notificationRepo = AppDataSource.getRepository(Notification);

      const notification = notificationRepo.create({
        tenantId,
        userId: data.userId,
        createdBy,
        title: data.title,
        message: data.message,
        type: data.type,
        category: data.category,
        priority: data.priority,
        status: NotificationStatus.PENDING,
        role: data.role,
        data: data.data,
        metadata: data.metadata,
        expiresAt: data.expiresAt,
        deliveryMethods: data.deliveryMethods || [DeliveryMethod.IN_APP],
        isRead: false,
        isArchived: false,
        deliveryAttempts: 0
      });

      const savedNotification = await notificationRepo.save(notification);

      // Marquer immédiatement comme envoyée
      savedNotification.status = NotificationStatus.SENT;
      savedNotification.deliveredAt = new Date();
      await notificationRepo.save(savedNotification);

      return savedNotification;
    } catch (error) {
      console.error('Erreur createNotification:', error);
      throw error;
    }
  }

  /**
   * Récupérer les notifications d'un utilisateur
   */
  static async getUserNotifications(
    tenantId: string,
    userId: string,
    filters?: NotificationFilters
  ) {
    try {
      const notificationRepo = AppDataSource.getRepository(Notification);
      const queryBuilder = notificationRepo
        .createQueryBuilder('notification')
        .where('notification.tenantId = :tenantId', { tenantId })
        .andWhere('notification.userId = :userId', { userId })
        .andWhere('notification.isArchived = :isArchived', { isArchived: false });

      // Appliquer les filtres
      if (filters?.type) {
        queryBuilder.andWhere('notification.type = :type', { type: filters.type });
      }

      if (filters?.category) {
        queryBuilder.andWhere('notification.category = :category', {
          category: filters.category
        });
      }

      if (filters?.status) {
        queryBuilder.andWhere('notification.status = :status', { status: filters.status });
      }

      if (filters?.priority) {
        queryBuilder.andWhere('notification.priority = :priority', {
          priority: filters.priority
        });
      }

      if (filters?.unreadOnly) {
        queryBuilder.andWhere('notification.isRead = :isRead', { isRead: false });
      }

      if (filters?.startDate && filters?.endDate) {
        queryBuilder.andWhere(
          'notification.createdAt >= :startDate AND notification.createdAt <= :endDate',
          { startDate: filters.startDate, endDate: filters.endDate }
        );
      }

      // Exclure les notifications expirées
      queryBuilder.andWhere(
        '(notification.expiresAt IS NULL OR notification.expiresAt > :now)',
        { now: new Date() }
      );

      // Trier par date décroissante
      queryBuilder.orderBy('notification.createdAt', 'DESC');

      const notifications = await queryBuilder.getMany();

      const unreadCount = notifications.filter(n => !n.isRead).length;

      return {
        notifications,
        total: notifications.length,
        unreadCount,
        bySeverity: {
          critical: notifications.filter(n => n.priority === NotificationPriority.CRITICAL)
            .length,
          urgent: notifications.filter(n => n.priority === NotificationPriority.URGENT).length,
          high: notifications.filter(n => n.priority === NotificationPriority.HIGH).length,
          medium: notifications.filter(n => n.priority === NotificationPriority.MEDIUM).length,
          low: notifications.filter(n => n.priority === NotificationPriority.LOW).length
        }
      };
    } catch (error) {
      console.error('Erreur getUserNotifications:', error);
      throw error;
    }
  }

  /**
   * Récupérer une notification par ID
   */
  static async getNotificationById(notificationId: string, tenantId: string) {
    try {
      const notificationRepo = AppDataSource.getRepository(Notification);
      const notification = await notificationRepo.findOne({
        where: { id: notificationId, tenantId }
      });

      if (!notification) {
        throw new Error('Notification non trouvée');
      }

      return notification;
    } catch (error) {
      console.error('Erreur getNotificationById:', error);
      throw error;
    }
  }

  /**
   * Marquer une notification comme lue
   */
  static async markAsRead(notificationId: string, tenantId: string, userId: string) {
    try {
      const notificationRepo = AppDataSource.getRepository(Notification);
      const notification = await notificationRepo.findOne({
        where: { id: notificationId, tenantId, userId }
      });

      if (!notification) {
        throw new Error('Notification non trouvée');
      }

      notification.markAsRead();
      await notificationRepo.save(notification);

      return { success: true, message: 'Notification marquée comme lue' };
    } catch (error) {
      console.error('Erreur markAsRead:', error);
      throw error;
    }
  }

  /**
   * Marquer toutes les notifications comme lues
   */
  static async markAllAsRead(tenantId: string, userId: string) {
    try {
      const notificationRepo = AppDataSource.getRepository(Notification);
      const result = await notificationRepo
        .createQueryBuilder()
        .update(Notification)
        .set({
          isRead: true,
          status: NotificationStatus.READ,
          readAt: new Date(),
          updatedAt: new Date()
        })
        .where('tenantId = :tenantId', { tenantId })
        .andWhere('userId = :userId', { userId })
        .andWhere('isRead = :isRead', { isRead: false })
        .execute();

      return {
        success: true,
        message: `${result.affected} notifications marquées comme lues`
      };
    } catch (error) {
      console.error('Erreur markAllAsRead:', error);
      throw error;
    }
  }

  /**
   * Supprimer une notification
   */
  static async deleteNotification(notificationId: string, tenantId: string, userId: string) {
    try {
      const notificationRepo = AppDataSource.getRepository(Notification);
      const notification = await notificationRepo.findOne({
        where: { id: notificationId, tenantId, userId }
      });

      if (!notification) {
        throw new Error('Notification non trouvée');
      }

      // Archiver au lieu de supprimer
      notification.archive();
      await notificationRepo.save(notification);

      return { success: true, message: 'Notification supprimée avec succès' };
    } catch (error) {
      console.error('Erreur deleteNotification:', error);
      throw error;
    }
  }

  /**
   * Supprimer toutes les notifications lues
   */
  static async clearReadNotifications(tenantId: string, userId: string) {
    try {
      const notificationRepo = AppDataSource.getRepository(Notification);
      const result = await notificationRepo
        .createQueryBuilder()
        .update(Notification)
        .set({
          isArchived: true,
          updatedAt: new Date()
        })
        .where('tenantId = :tenantId', { tenantId })
        .andWhere('userId = :userId', { userId })
        .andWhere('isRead = :isRead', { isRead: true })
        .execute();

      return { success: true, message: `${result.affected} notifications supprimées` };
    } catch (error) {
      console.error('Erreur clearReadNotifications:', error);
      throw error;
    }
  }

  /**
   * Récupérer les préférences de notification d'un utilisateur
   */
  static async getUserPreferences(userId: string, tenantId: string) {
    try {
      const preferenceRepo = AppDataSource.getRepository(NotificationPreference);
      let preference = await preferenceRepo.findOne({
        where: { userId, tenantId }
      });

      if (!preference) {
        // Créer des préférences par défaut
        preference = preferenceRepo.create({
          userId,
          tenantId,
          channels: {
            in_app: true,
            email: true,
            sms: false,
            push: true,
            websocket: true,
            sse: true
          },
          categories: {
            financial: true,
            stocks: true,
            housing: true,
            transport: true,
            workflow: true,
            system: true,
            security: true
          },
          types: {
            info: true,
            success: true,
            warning: true,
            error: true,
            critical: true
          },
          quietHours: {
            enabled: false,
            start: '22:00',
            end: '08:00',
            timezone: 'Africa/Niamey'
          },
          frequency: {
            immediate: true,
            digest: false,
            digestFrequency: 'daily'
          },
          isEnabled: true,
          allowSounds: true,
          allowVibrations: true,
          language: 'fr'
        });

        preference = await preferenceRepo.save(preference);
      }

      return preference;
    } catch (error) {
      console.error('Erreur getUserPreferences:', error);
      throw error;
    }
  }

  /**
   * Mettre à jour les préférences de notification
   */
  static async updateUserPreferences(
    userId: string,
    tenantId: string,
    updates: Partial<NotificationPreference>
  ) {
    try {
      const preferenceRepo = AppDataSource.getRepository(NotificationPreference);
      let preference = await preferenceRepo.findOne({
        where: { userId, tenantId }
      });

      if (!preference) {
        // Créer avec les valeurs fournies
        preference = await this.getUserPreferences(userId, tenantId);
      }

      // Appliquer les mises à jour
      Object.assign(preference, updates);
      preference.updatedAt = new Date();

      const updatedPreference = await preferenceRepo.save(preference);
      return updatedPreference;
    } catch (error) {
      console.error('Erreur updateUserPreferences:', error);
      throw error;
    }
  }

  /**
   * Envoyer une notification système
   */
  static async sendSystemNotification(
    tenantId: string,
    title: string,
    message: string,
    priority: NotificationPriority = NotificationPriority.MEDIUM
  ) {
    try {
      // Créer une notification système (sans userId spécifique)
      const notification = await this.createNotification(tenantId, 'system', {
        title,
        message,
        type: NotificationType.INFO,
        category: NotificationCategory.SYSTEM,
        priority
      });

      return notification;
    } catch (error) {
      console.error('Erreur sendSystemNotification:', error);
      throw error;
    }
  }

  /**
   * Envoyer une alerte critique
   */
  static async sendCriticalAlert(
    tenantId: string,
    userId: string,
    title: string,
    message: string,
    category: NotificationCategory,
    data?: any
  ) {
    try {
      const notification = await this.createNotification(tenantId, 'system', {
        title,
        message,
        type: NotificationType.CRITICAL,
        category,
        priority: NotificationPriority.CRITICAL,
        userId,
        data,
        deliveryMethods: [DeliveryMethod.IN_APP, DeliveryMethod.PUSH]
      });

      return notification;
    } catch (error) {
      console.error('Erreur sendCriticalAlert:', error);
      throw error;
    }
  }

  /**
   * Récupérer les statistiques des notifications
   */
  static async getNotificationStats(tenantId: string, userId?: string) {
    try {
      const notificationRepo = AppDataSource.getRepository(Notification);
      const queryBuilder = notificationRepo
        .createQueryBuilder('notification')
        .where('notification.tenantId = :tenantId', { tenantId })
        .andWhere('notification.isArchived = :isArchived', { isArchived: false });

      if (userId) {
        queryBuilder.andWhere('notification.userId = :userId', { userId });
      }

      const notifications = await queryBuilder.getMany();

      const total = notifications.length;
      const unread = notifications.filter(n => !n.isRead).length;
      const read = notifications.filter(n => n.isRead).length;

      const byType: any = {};
      Object.values(NotificationType).forEach(type => {
        byType[type] = notifications.filter(n => n.type === type).length;
      });

      const byCategory: any = {};
      Object.values(NotificationCategory).forEach(category => {
        byCategory[category] = notifications.filter(n => n.category === category).length;
      });

      const byPriority: any = {};
      Object.values(NotificationPriority).forEach(priority => {
        byPriority[priority] = notifications.filter(n => n.priority === priority).length;
      });

      return {
        total,
        unread,
        read,
        byType,
        byCategory,
        byPriority,
        readRate: total > 0 ? (read / total) * 100 : 0
      };
    } catch (error) {
      console.error('Erreur getNotificationStats:', error);
      throw error;
    }
  }

  /**
   * Nettoyer les notifications expirées
   */
  static async cleanupExpiredNotifications() {
    try {
      const notificationRepo = AppDataSource.getRepository(Notification);
      const result = await notificationRepo
        .createQueryBuilder()
        .delete()
        .from(Notification)
        .where('expiresAt IS NOT NULL')
        .andWhere('expiresAt < :now', { now: new Date() })
        .execute();

      console.log(`Nettoyage: ${result.affected} notifications expirées supprimées`);
      return result.affected || 0;
    } catch (error) {
      console.error('Erreur cleanupExpiredNotifications:', error);
      throw error;
    }
  }
}

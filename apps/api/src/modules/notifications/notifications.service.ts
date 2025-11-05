// ARCHIVED: Ce fichier n'est plus utilisé. Toute la logique notifications passe par notifications.service.db.ts (base de données).
// Gardé pour référence/transitional legacy uniquement.
/**
 * FICHIER: apps/api/src/modules/notifications/notifications.service.ts
 * SERVICE: Notifications - Gestion des notifications
 *
 * DESCRIPTION:
 * Service pour la gestion des notifications en temps réel
 * Support multi-canal (in-app, email, websocket)
 * Gestion des préférences et priorités
 *
 * AUTEUR: Équipe CROU
 * DATE: Décembre 2024
 */

import {
  Notification,
  NotificationType,
  NotificationCategory,
  NotificationPriority,
  NotificationStatus,
  NotificationPreferences,
  DeliveryMethod
} from '../../../../../packages/notifications/src/types/notification.types';

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

export class NotificationsService {
  private static notifications: Map<string, Notification> = new Map();
  private static preferences: Map<string, NotificationPreferences> = new Map();

  /**
   * Créer une nouvelle notification
   */
  static async createNotification(
    tenantId: string,
    userId: string,
    data: CreateNotificationDTO
  ): Promise<Notification> {
    try {
      const notification: Notification = {
        id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        title: data.title,
        message: data.message,
        type: data.type,
        category: data.category,
        priority: data.priority,
        status: NotificationStatus.PENDING,
        tenantId,
        userId: data.userId,
        role: data.role,
        data: data.data,
        metadata: data.metadata,
        createdAt: new Date(),
        updatedAt: new Date(),
        expiresAt: data.expiresAt
      };

      this.notifications.set(notification.id, notification);

      // Marquer immédiatement comme envoyée (pour l'instant)
      notification.status = NotificationStatus.SENT;
      notification.deliveredAt = new Date();

      return notification;
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
      let notifications = Array.from(this.notifications.values())
        .filter(n => n.tenantId === tenantId && n.userId === userId);

      // Appliquer les filtres
      if (filters?.type) {
        notifications = notifications.filter(n => n.type === filters.type);
      }

      if (filters?.category) {
        notifications = notifications.filter(n => n.category === filters.category);
      }

      if (filters?.status) {
        notifications = notifications.filter(n => n.status === filters.status);
      }

      if (filters?.priority) {
        notifications = notifications.filter(n => n.priority === filters.priority);
      }

      if (filters?.unreadOnly) {
        notifications = notifications.filter(n => !n.readAt);
      }

      if (filters?.startDate && filters?.endDate) {
        notifications = notifications.filter(n =>
          n.createdAt >= filters.startDate! && n.createdAt <= filters.endDate!
        );
      }

      // Trier par date décroissante
      notifications.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

      const unreadCount = notifications.filter(n => !n.readAt).length;

      return {
        notifications,
        total: notifications.length,
        unreadCount,
        bySeverity: {
          critical: notifications.filter(n => n.priority === NotificationPriority.CRITICAL).length,
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
   * Récupérer toutes les notifications d'un tenant
   */
  static async getTenantNotifications(
    tenantId: string,
    filters?: NotificationFilters
  ) {
    try {
      let notifications = Array.from(this.notifications.values())
        .filter(n => n.tenantId === tenantId);

      // Appliquer les mêmes filtres
      if (filters?.type) {
        notifications = notifications.filter(n => n.type === filters.type);
      }

      if (filters?.category) {
        notifications = notifications.filter(n => n.category === filters.category);
      }

      if (filters?.status) {
        notifications = notifications.filter(n => n.status === filters.status);
      }

      if (filters?.priority) {
        notifications = notifications.filter(n => n.priority === filters.priority);
      }

      if (filters?.startDate && filters?.endDate) {
        notifications = notifications.filter(n =>
          n.createdAt >= filters.startDate! && n.createdAt <= filters.endDate!
        );
      }

      notifications.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

      return {
        notifications,
        total: notifications.length
      };
    } catch (error) {
      console.error('Erreur getTenantNotifications:', error);
      throw error;
    }
  }

  /**
   * Récupérer une notification par ID
   */
  static async getNotificationById(notificationId: string, tenantId: string) {
    try {
      const notification = this.notifications.get(notificationId);

      if (!notification || notification.tenantId !== tenantId) {
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
      const notification = this.notifications.get(notificationId);

      if (!notification || notification.tenantId !== tenantId) {
        throw new Error('Notification non trouvée');
      }

      if (notification.userId !== userId) {
        throw new Error('Accès non autorisé');
      }

      notification.status = NotificationStatus.READ;
      notification.readAt = new Date();
      notification.updatedAt = new Date();

      this.notifications.set(notificationId, notification);

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
      let count = 0;

      for (const [id, notification] of this.notifications.entries()) {
        if (notification.tenantId === tenantId &&
            notification.userId === userId &&
            !notification.readAt) {
          notification.status = NotificationStatus.READ;
          notification.readAt = new Date();
          notification.updatedAt = new Date();
          this.notifications.set(id, notification);
          count++;
        }
      }

      return { success: true, message: `${count} notifications marquées comme lues` };
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
      const notification = this.notifications.get(notificationId);

      if (!notification || notification.tenantId !== tenantId) {
        throw new Error('Notification non trouvée');
      }

      if (notification.userId !== userId) {
        throw new Error('Accès non autorisé');
      }

      this.notifications.delete(notificationId);

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
      let count = 0;

      for (const [id, notification] of this.notifications.entries()) {
        if (notification.tenantId === tenantId &&
            notification.userId === userId &&
            notification.readAt) {
          this.notifications.delete(id);
          count++;
        }
      }

      return { success: true, message: `${count} notifications supprimées` };
    } catch (error) {
      console.error('Erreur clearReadNotifications:', error);
      throw error;
    }
  }

  /**
   * Récupérer les préférences de notification d'un utilisateur
   */
  static async getUserPreferences(userId: string, tenantId: string): Promise<NotificationPreferences> {
    try {
      const key = `${tenantId}_${userId}`;
      let preferences = this.preferences.get(key);

      if (!preferences) {
        // Créer des préférences par défaut
        preferences = {
          userId,
          tenantId,
          channels: {
            [DeliveryMethod.IN_APP]: true,
            [DeliveryMethod.EMAIL]: true,
            [DeliveryMethod.SMS]: false,
            [DeliveryMethod.PUSH]: true,
            [DeliveryMethod.WEBSOCKET]: true,
            [DeliveryMethod.SSE]: true
          },
          categories: {
            [NotificationCategory.FINANCIAL]: true,
            [NotificationCategory.STOCKS]: true,
            [NotificationCategory.HOUSING]: true,
            [NotificationCategory.TRANSPORT]: true,
            [NotificationCategory.WORKFLOW]: true,
            [NotificationCategory.SYSTEM]: true,
            [NotificationCategory.SECURITY]: true
          },
          types: {
            [NotificationType.INFO]: true,
            [NotificationType.SUCCESS]: true,
            [NotificationType.WARNING]: true,
            [NotificationType.ERROR]: true,
            [NotificationType.CRITICAL]: true
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
          createdAt: new Date(),
          updatedAt: new Date()
        };

        this.preferences.set(key, preferences);
      }

      return preferences;
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
    updates: Partial<NotificationPreferences>
  ) {
    try {
      const key = `${tenantId}_${userId}`;
      const preferences = await this.getUserPreferences(userId, tenantId);

      const updatedPreferences: NotificationPreferences = {
        ...preferences,
        ...updates,
        userId,
        tenantId,
        updatedAt: new Date()
      };

      this.preferences.set(key, updatedPreferences);

      return updatedPreferences;
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
      // Envoyer à tous les utilisateurs du tenant (simulation)
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
      const notification = await this.createNotification(tenantId, userId, {
        title,
        message,
        type: NotificationType.CRITICAL,
        category,
        priority: NotificationPriority.CRITICAL,
        data
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
      let notifications = Array.from(this.notifications.values())
        .filter(n => n.tenantId === tenantId);

      if (userId) {
        notifications = notifications.filter(n => n.userId === userId);
      }

      const total = notifications.length;
      const unread = notifications.filter(n => !n.readAt).length;
      const read = notifications.filter(n => n.readAt).length;

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
}

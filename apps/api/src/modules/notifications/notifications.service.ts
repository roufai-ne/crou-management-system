/**
 * FICHIER: apps\api\src\modules\notifications\notifications.service.ts
 * SERVICE: NotificationsService - Service de notifications API
 * 
 * DESCRIPTION:
 * Service pour la gestion des notifications dans l'API
 * Intégration avec WebSocket et SSE
 * 
 * FONCTIONNALITÉS:
 * - Gestion des notifications temps réel
 * - Support WebSocket et SSE
 * - Intégration avec les modules métier
 * - Gestion des alertes et KPIs
 * 
 * AUTEUR: Équipe CROU
 * DATE: Décembre 2024
 */

import { Injectable } from '@nestjs/common';
import { NotificationService } from '@crou/notifications';
import { 
  Notification, 
  NotificationType, 
  NotificationCategory, 
  NotificationPriority,
  CriticalKPI,
  Alert
} from '@crou/notifications';
import { logger } from '@/shared/utils/logger';

@Injectable()
export class NotificationsService {
  private notificationService: NotificationService;
  private kpiCheckInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.notificationService = new NotificationService();
    this.setupKPIMonitoring();
  }

  /**
   * Configuration du monitoring des KPIs
   */
  private setupKPIMonitoring(): void {
    // Vérifier les KPIs toutes les 30 secondes
    this.kpiCheckInterval = setInterval(() => {
      this.checkCriticalKPIs();
    }, 30000);
  }

  /**
   * Créer une notification
   */
  async createNotification(notification: Omit<Notification, 'id' | 'createdAt' | 'updatedAt'>): Promise<Notification> {
    try {
      return await this.notificationService.createNotification(notification);
    } catch (error) {
      logger.error('Erreur création notification:', error);
      throw error;
    }
  }

  /**
   * Obtenir les notifications d'un utilisateur
   */
  async getUserNotifications(
    userId: string, 
    tenantId: string, 
    options: {
      limit?: number;
      offset?: number;
      status?: string;
      type?: string;
      category?: string;
    } = {}
  ): Promise<Notification[]> {
    try {
      return await this.notificationService.getUserNotifications(userId, tenantId, {
        limit: options.limit,
        offset: options.offset,
        status: options.status as any,
        type: options.type as any,
        category: options.category as any
      });
    } catch (error) {
      logger.error('Erreur récupération notifications:', error);
      throw error;
    }
  }

  /**
   * Marquer une notification comme lue
   */
  async markAsRead(notificationId: string, userId: string): Promise<void> {
    try {
      await this.notificationService.markAsRead(notificationId, userId);
    } catch (error) {
      logger.error('Erreur marquage notification:', error);
      throw error;
    }
  }

  /**
   * Supprimer une notification
   */
  async deleteNotification(notificationId: string, userId: string): Promise<void> {
    try {
      await this.notificationService.deleteNotification(notificationId, userId);
    } catch (error) {
      logger.error('Erreur suppression notification:', error);
      throw error;
    }
  }

  /**
   * Créer une alerte
   */
  async createAlert(alert: Omit<Alert, 'id' | 'createdAt' | 'updatedAt'>): Promise<Alert> {
    try {
      return await this.notificationService.createAlert(alert);
    } catch (error) {
      logger.error('Erreur création alerte:', error);
      throw error;
    }
  }

  /**
   * Vérifier les alertes
   */
  async checkAlerts(tenantId: string): Promise<void> {
    try {
      await this.notificationService.checkAlerts(tenantId);
    } catch (error) {
      logger.error('Erreur vérification alertes:', error);
      throw error;
    }
  }

  /**
   * Mettre à jour un KPI critique
   */
  async updateKPI(kpi: CriticalKPI): Promise<void> {
    try {
      await this.notificationService.updateKPI(kpi);
    } catch (error) {
      logger.error('Erreur mise à jour KPI:', error);
      throw error;
    }
  }

  /**
   * Obtenir les statistiques des notifications
   */
  async getStats(tenantId: string): Promise<any> {
    try {
      return await this.notificationService.getStats(tenantId);
    } catch (error) {
      logger.error('Erreur récupération statistiques:', error);
      throw error;
    }
  }

  /**
   * Vérifier les KPIs critiques
   */
  private async checkCriticalKPIs(): Promise<void> {
    try {
      // TODO: Implémenter la vérification des KPIs critiques
      // Pour l'instant, créer des KPIs mockés
      const mockKPIs: CriticalKPI[] = [
        {
          id: 'budget-usage',
          name: 'Utilisation du Budget',
          description: 'Pourcentage du budget utilisé',
          category: NotificationCategory.FINANCIAL,
          threshold: {
            warning: 80,
            critical: 95
          },
          currentValue: Math.random() * 100,
          unit: '%',
          trend: 'up',
          lastUpdated: new Date(),
          tenantId: 'default'
        },
        {
          id: 'stock-level',
          name: 'Niveau de Stock',
          description: 'Pourcentage des articles en stock',
          category: NotificationCategory.STOCKS,
          threshold: {
            warning: 20,
            critical: 10
          },
          currentValue: Math.random() * 100,
          unit: '%',
          trend: 'down',
          lastUpdated: new Date(),
          tenantId: 'default'
        },
        {
          id: 'housing-occupancy',
          name: 'Taux d\'Occupation',
          description: 'Pourcentage des logements occupés',
          category: NotificationCategory.HOUSING,
          threshold: {
            warning: 90,
            critical: 95
          },
          currentValue: Math.random() * 100,
          unit: '%',
          trend: 'stable',
          lastUpdated: new Date(),
          tenantId: 'default'
        }
      ];

      for (const kpi of mockKPIs) {
        await this.updateKPI(kpi);
      }

    } catch (error) {
      logger.error('Erreur vérification KPIs critiques:', error);
    }
  }

  /**
   * Nettoyer les ressources
   */
  onModuleDestroy(): void {
    if (this.kpiCheckInterval) {
      clearInterval(this.kpiCheckInterval);
    }
  }
}

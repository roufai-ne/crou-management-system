/**
 * FICHIER: apps\api\src\modules\notifications\notifications.controller.ts
 * CONTROLLER: Module Notifications
 * 
 * DESCRIPTION:
 * Contrôleur pour le module de notifications
 * 
 * AUTEUR: Équipe CROU
 * DATE: Décembre 2024
 */

import { Request, Response } from 'express';
import {
  NotificationsServiceDB as NotificationsService,
  CreateNotificationDTO,
  NotificationFilters
} from './notifications.service.db';

export class NotificationsController {
  static async getNotifications(req: Request, res: Response) {
    try {
      const tenantId = (req as any).user?.tenantId;
      const userId = (req as any).user?.userId;
      if (!tenantId || !userId) {
        return res.status(401).json({ success: false, error: 'Authentification manquante' });
      }
      const filters: NotificationFilters = {
        type: req.query.type as any,
        category: req.query.category as any,
        status: req.query.status as any,
        priority: req.query.priority as any,
        unreadOnly: req.query.unreadOnly === 'true',
        startDate: req.query.startDate ? new Date(req.query.startDate as string) : undefined,
        endDate: req.query.endDate ? new Date(req.query.endDate as string) : undefined
      };
      const result = await NotificationsService.getUserNotifications(tenantId, userId, filters);
      res.json({ success: true, data: result });
    } catch (error) {
      console.error('Erreur getNotifications:', error);
      res.status(500).json({ success: false, error: 'Erreur lors de la recuperation des notifications' });
    }
  }

  static async createNotification(req: Request, res: Response) {
    try {
      const tenantId = (req as any).user?.tenantId;
      const userId = (req as any).user?.userId;
      if (!tenantId || !userId) {
        return res.status(401).json({ success: false, error: 'Authentification manquante' });
      }
      const data: CreateNotificationDTO = req.body;
      const notification = await NotificationsService.createNotification(tenantId, userId, data);
      res.json({ success: true, data: { notification } });
    } catch (error) {
      console.error('Erreur createNotification:', error);
      res.status(500).json({ success: false, error: 'Erreur lors de la creation de la notification' });
    }
  }

  static async markAsRead(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const tenantId = (req as any).user?.tenantId;
      const userId = (req as any).user?.userId;
      if (!tenantId || !userId) {
        return res.status(401).json({ success: false, error: 'Authentification manquante' });
      }
      const result = await NotificationsService.markAsRead(id, tenantId, userId);
      res.json(result);
    } catch (error: any) {
      console.error('Erreur markAsRead:', error);
      res.status(500).json({ success: false, error: error.message || 'Erreur lors du marquage de la notification' });
    }
  }

  static async deleteNotification(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const tenantId = (req as any).user?.tenantId;
      const userId = (req as any).user?.userId;
      if (!tenantId || !userId) {
        return res.status(401).json({ success: false, error: 'Authentification manquante' });
      }
      const result = await NotificationsService.deleteNotification(id, tenantId, userId);
      res.json(result);
    } catch (error: any) {
      console.error('Erreur deleteNotification:', error);
      res.status(500).json({ success: false, error: error.message || 'Erreur lors de la suppression de la notification' });
    }
  }

  static async markAllAsRead(req: Request, res: Response) {
    try {
      const tenantId = (req as any).user?.tenantId;
      const userId = (req as any).user?.userId;
      if (!tenantId || !userId) {
        return res.status(401).json({ success: false, error: 'Authentification manquante' });
      }
      const result = await NotificationsService.markAllAsRead(tenantId, userId);
      res.json(result);
    } catch (error) {
      console.error('Erreur markAllAsRead:', error);
      res.status(500).json({ success: false, error: 'Erreur lors du marquage des notifications' });
    }
  }

  static async getPreferences(req: Request, res: Response) {
    try {
      const tenantId = (req as any).user?.tenantId;
      const userId = (req as any).user?.userId;
      if (!tenantId || !userId) {
        return res.status(401).json({ success: false, error: 'Authentification manquante' });
      }
      const preferences = await NotificationsService.getUserPreferences(userId, tenantId);
      res.json({ success: true, data: { preferences } });
    } catch (error) {
      console.error('Erreur getPreferences:', error);
      res.status(500).json({ success: false, error: 'Erreur lors de la recuperation des preferences' });
    }
  }

  static async updatePreferences(req: Request, res: Response) {
    try {
      const tenantId = (req as any).user?.tenantId;
      const userId = (req as any).user?.userId;
      if (!tenantId || !userId) {
        return res.status(401).json({ success: false, error: 'Authentification manquante' });
      }
      const preferences = await NotificationsService.updateUserPreferences(userId, tenantId, req.body);
      res.json({ success: true, data: { preferences } });
    } catch (error) {
      console.error('Erreur updatePreferences:', error);
      res.status(500).json({ success: false, error: 'Erreur lors de la mise a jour des preferences' });
    }
  }

  static async getStats(req: Request, res: Response) {
    try {
      const tenantId = (req as any).user?.tenantId;
      const userId = (req as any).user?.userId;
      if (!tenantId || !userId) {
        return res.status(401).json({ success: false, error: 'Authentification manquante' });
      }
      const stats = await NotificationsService.getNotificationStats(tenantId, userId);
      res.json({ success: true, data: stats });
    } catch (error) {
      console.error('Erreur getStats:', error);
      res.status(500).json({ success: false, error: 'Erreur lors de la recuperation des statistiques' });
    }
  }

  static async cleanupExpired(req: Request, res: Response) {
    try {
      // (authentification/role admin peut être ajoutée ici)
      const result = await NotificationsService.cleanupExpiredNotifications();
      res.json({ success: true, message: `${result} notifications expirées supprimées` });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  }
}
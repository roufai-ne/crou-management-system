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

export class NotificationsController {
  static async getNotifications(req: Request, res: Response) {
    res.json({ success: true, data: { notifications: [] } });
  }

  static async createNotification(req: Request, res: Response) {
    res.json({ success: true, message: 'Notification créée' });
  }

  static async markAsRead(req: Request, res: Response) {
    res.json({ success: true, message: 'Notification marquée comme lue' });
  }

  static async deleteNotification(req: Request, res: Response) {
    res.json({ success: true, message: 'Notification supprimée' });
  }
}
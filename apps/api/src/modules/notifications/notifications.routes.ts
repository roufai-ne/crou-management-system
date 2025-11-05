/**
 * FICHIER: apps\api\src\modules\notifications\notifications.routes.ts
 * ROUTES: Module Notifications - WebSocket et notifications système
 */

import { Router } from 'express';
import { authMiddleware } from '@/shared/middlewares/auth.middleware';
import { NotificationsController } from './notifications.controller';

const router: Router = Router();

// Toutes les routes nécessitent une authentification
router.use(authMiddleware);

// Routes des notifications
router.get('/', NotificationsController.getNotifications);
router.put('/:notificationId/read', NotificationsController.markAsRead);
router.delete('/:notificationId', NotificationsController.deleteNotification);

export { router as notificationsRoutes };
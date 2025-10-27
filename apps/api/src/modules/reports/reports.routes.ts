/**
 * FICHIER: apps\api\src\modules\reports\reports.routes.ts
 * ROUTES: Module Rapports - Génération et export de rapports
 */

import { Router } from 'express';
import { authMiddleware } from '@/shared/middlewares/auth.middleware';
import { ReportsController } from './reports.controller';

const router = Router();

// Toutes les routes nécessitent une authentification
router.use(authMiddleware);

// Routes des rapports
router.get('/', ReportsController.getAllReports);
router.get('/generate/:type', ReportsController.generateReport);
router.get('/export/:reportId', ReportsController.exportReport);
router.delete('/:reportId', ReportsController.deleteReport);

export { router as reportsRoutes };
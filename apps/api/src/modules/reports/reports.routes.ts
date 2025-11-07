/**
 * FICHIER: apps\api\src\modules\reports\reports.routes.ts
 * ROUTES: Module Rapports - Génération et export de rapports
 */

import { Router } from 'express';
import { authMiddleware } from '@/shared/middlewares/auth.middleware';
import { ReportsController } from './reports.controller';

const router: Router = Router();

// Toutes les routes nécessitent une authentification
router.use(authMiddleware);

// Routes des rapports
router.get('/', ReportsController.getAllReports);
router.get('/jobs', ReportsController.getJobs); // Doit être avant /:reportId pour éviter le conflit
router.post('/generate', ReportsController.generateReport);
router.get('/:reportId', ReportsController.getReport);
router.delete('/:reportId', ReportsController.deleteReport);

// Routes d'export
router.get('/export/:reportId', ReportsController.exportReport); // Legacy
router.get('/export/:reportId/excel', ReportsController.exportToExcel);
router.get('/export/:reportId/pdf', ReportsController.exportToPDF);

export { router as reportsRoutes };
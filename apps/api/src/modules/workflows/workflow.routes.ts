/**
 * FICHIER: apps\api\src\modules\workflows\workflow.routes.ts
 * ROUTES: Module Workflows - Gestion des processus de validation
 */

import { Router } from 'express';
import { authMiddleware } from '@/shared/middlewares/auth.middleware';
import { WorkflowController } from './workflow.controller';

const router: Router = Router();

// Toutes les routes nécessitent une authentification
router.use(authMiddleware);

// Routes des workflows
router.get('/', WorkflowController.getWorkflows);
router.post('/', WorkflowController.createWorkflow);
router.get('/:workflowId', WorkflowController.getWorkflowById);
router.put('/:workflowId', WorkflowController.updateWorkflow);
router.delete('/:workflowId', WorkflowController.deleteWorkflow);

// Routes des instances de workflow
router.post('/:workflowId/instances', WorkflowController.startWorkflowInstance);
router.get('/instances/:instanceId', WorkflowController.getWorkflowInstance);
router.post('/instances/:instanceId/actions', WorkflowController.executeAction);

export { router as workflowRoutes };
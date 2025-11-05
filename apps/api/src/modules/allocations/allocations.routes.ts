/**
 * FICHIER: apps/api/src/modules/allocations/allocations.routes.ts
 * ROUTES: Module de gestion des allocations stratégiques
 *
 * DESCRIPTION:
 * Configuration des routes pour les allocations budgétaires et de stocks
 * du Ministère vers les CROUs
 *
 * ROUTES:
 * - POST   /api/allocations/budget      - Créer allocation budgétaire
 * - POST   /api/allocations/stock       - Créer allocation de stock
 * - GET    /api/allocations/history     - Historique des allocations
 * - GET    /api/allocations/summary     - Résumé des allocations
 * - POST   /api/allocations/:id/validate - Valider/rejeter allocation
 * - POST   /api/allocations/:id/execute  - Exécuter allocation
 * - POST   /api/allocations/:id/cancel   - Annuler allocation
 * - GET    /api/allocations/crou/:crouId - Allocations d'un CROU
 *
 * AUTEUR: Équipe CROU
 * DATE: Décembre 2024
 */

import { Router } from 'express';
import allocationsController from './allocations.controller';

const router: Router = Router();

// Toutes les routes du contrôleur allocations
router.use('/', allocationsController);

export const allocationsRoutes = router;

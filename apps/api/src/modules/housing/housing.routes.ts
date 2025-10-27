/**
 * FICHIER: apps\api\src\modules\housing\housing.routes.ts
 * ROUTES: Module de gestion des logements CROU
 *
 * DESCRIPTION:
 * Configuration des routes pour la gestion des logements
 * Support CRUD complet et statistiques
 *
 * ROUTES:
 * - GET    /api/housing          - Liste des logements
 * - GET    /api/housing/:id      - Détail d'un logement
 * - POST   /api/housing          - Créer un logement
 * - PUT    /api/housing/:id      - Modifier un logement
 * - DELETE /api/housing/:id      - Supprimer un logement
 * - GET    /api/housing/:id/stats - Statistiques d'un logement
 *
 * AUTEUR: Équipe CROU
 * DATE: Décembre 2024
 */

import { Router } from 'express';
import housingController from './housing.controller';

const router: Router = Router();

// Toutes les routes du contrôleur housing
router.use('/', housingController);

export const housingRoutes = router;

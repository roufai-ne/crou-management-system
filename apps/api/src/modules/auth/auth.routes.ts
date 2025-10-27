/**
 * FICHIER: apps\api\src\modules\auth\auth.routes.ts
 * ROUTES: Authentification - Endpoints sécurisés
 * 
 * DESCRIPTION:
 * Routes d'authentification pour l'API CROU
 * Login, logout, refresh token et profil utilisateur
 * Validation des données et gestion d'erreurs
 * 
 * ENDPOINTS:
 * - POST /login - Connexion utilisateur
 * - POST /refresh - Renouvellement token
 * - POST /logout - Déconnexion
 * - GET /profile - Profil utilisateur connecté
 * 
 * SÉCURITÉ:
 * - Validation côté serveur avec express-validator
 * - Rate limiting sur login
 * - JWT sécurisé avec refresh token
 * 
 * AUTEUR: Équipe CROU
 * DATE: Décembre 2024
 */

import { Router } from 'express';
import { AuthController, loginValidators } from './auth.controller';
import { authenticateJWT } from '@/shared/middlewares/auth.middleware';

const router = Router();

/**
 * POST /api/auth/login
 * Connexion utilisateur avec email/password
 */
router.post('/login', loginValidators, AuthController.login);

/**
 * POST /api/auth/refresh  
 * Renouvellement du token d'accès
 */
router.post('/refresh', AuthController.refresh);

/**
 * POST /api/auth/logout
 * Déconnexion utilisateur (nécessite authentification)
 */
router.post('/logout', authenticateJWT, AuthController.logout);

/**
 * GET /api/auth/profile
 * Récupération du profil utilisateur connecté
 */
router.get('/profile', authenticateJWT, AuthController.getProfile);

export { router as authRoutes };
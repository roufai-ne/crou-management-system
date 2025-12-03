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
import { authLimiter } from '@/shared/middlewares/rate-limiters.middleware';

const router: Router = Router();

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Connexion utilisateur
 *     description: Authentification avec email et mot de passe. Retourne un access token JWT et un refresh token.
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: admin@crou.ne
 *               password:
 *                 type: string
 *                 format: password
 *                 minLength: 6
 *                 example: Admin@2025!
 *     responses:
 *       200:
 *         description: Connexion réussie
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Connexion réussie
 *                 data:
 *                   type: object
 *                   properties:
 *                     user:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                           format: uuid
 *                         email:
 *                           type: string
 *                         firstName:
 *                           type: string
 *                         lastName:
 *                           type: string
 *                         role:
 *                           type: object
 *                           properties:
 *                             name:
 *                               type: string
 *                             permissions:
 *                               type: array
 *                               items:
 *                                 type: object
 *                         tenant:
 *                           type: object
 *                           properties:
 *                             id:
 *                               type: string
 *                             name:
 *                               type: string
 *                             type:
 *                               type: string
 *                     tokens:
 *                       type: object
 *                       properties:
 *                         accessToken:
 *                           type: string
 *                         refreshToken:
 *                           type: string
 *                         expiresIn:
 *                           type: string
 *       400:
 *         description: Données invalides
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Identifiants invalides
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Compte désactivé
 *       423:
 *         description: Compte verrouillé
 *       429:
 *         description: Trop de tentatives
 *     security: []
 */
// Appliquer rate limiting sur login et refresh
router.post('/login', authLimiter, loginValidators, AuthController.login);

/**
 * @swagger
 * /api/auth/refresh:
 *   post:
 *     summary: Renouvellement du token
 *     description: Génère un nouveau access token à partir d'un refresh token valide
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - refreshToken
 *             properties:
 *               refreshToken:
 *                 type: string
 *                 description: Refresh token obtenu lors de la connexion
 *     responses:
 *       200:
 *         description: Token renouvelé avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 accessToken:
 *                   type: string
 *                 expiresIn:
 *                   type: string
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 *     security: []
 */
router.post('/refresh', authLimiter, AuthController.refresh);

/**
 * @swagger
 * /api/auth/logout:
 *   post:
 *     summary: Déconnexion utilisateur
 *     description: Invalide le refresh token de l'utilisateur connecté
 *     tags: [Auth]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Déconnexion réussie
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Déconnexion réussie
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.post('/logout', authenticateJWT, AuthController.logout);

/**
 * @swagger
 * /api/auth/profile:
 *   get:
 *     summary: Profil utilisateur
 *     description: Récupère les informations complètes de l'utilisateur connecté (profil, rôle, permissions, tenant)
 *     tags: [Auth]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Profil récupéré avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 user:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       format: uuid
 *                     email:
 *                       type: string
 *                     firstName:
 *                       type: string
 *                     lastName:
 *                       type: string
 *                     role:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                         name:
 *                           type: string
 *                         level:
 *                           type: number
 *                         permissions:
 *                           type: array
 *                           items:
 *                             type: object
 *                             properties:
 *                               code:
 *                                 type: string
 *                               name:
 *                                 type: string
 *                     tenant:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                         name:
 *                           type: string
 *                         type:
 *                           type: string
 *                           enum: [ministere, crou]
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get('/profile', authenticateJWT, AuthController.getProfile);

export { router as authRoutes };
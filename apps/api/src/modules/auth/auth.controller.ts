/**
 * FICHIER: apps\api\src\modules\auth\auth.controller.ts
 * CONTROLLER: Authentification
 * 
 * DESCRIPTION:
 * Contrôleur pour l'authentification des utilisateurs
 * Login, logout, refresh token et profil
 * 
 * AUTEUR: Équipe CROU
 * DATE: Décembre 2024
 */

import { Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { logger } from '@/shared/utils/logger';
import { AuthService } from './auth.service';

// Validateurs pour le login
export const loginValidators = [
  body('email')
    .isEmail()
    .withMessage('Email invalide')
    .normalizeEmail(),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Mot de passe requis (minimum 6 caractères)')
];

export class AuthController {
  private static authService = new AuthService();

  /**
   * POST /api/auth/login
   * Connexion utilisateur avec base de données réelle
   */
  static async login(req: Request, res: Response) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: 'Données invalides',
          details: errors.array()
        });
      }

      const { email, password } = req.body;
      const ipAddress = req.ip;
      const userAgent = req.get('User-Agent');

      // Authentification avec le service RBAC
      const authResult = await AuthController.authService.login(
        { email, password },
        ipAddress,
        userAgent
      );

      // Définir le cookie HttpOnly pour le refresh token
      res.cookie('refreshToken', authResult.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production', // Secure en prod uniquement
        sameSite: 'lax', // Lax pour permettre la redirection après login si nécessaire
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 jours
        path: '/api/auth' // Restreindre au path d'auth
      });

      res.json({
        success: true,
        message: 'Connexion réussie',
        data: {
          user: authResult.user,
          tokens: {
            accessToken: authResult.accessToken,
            // Ne pas renvoyer le refresh token dans le body pour sécurité maximale
            // refreshToken: authResult.refreshToken, 
            expiresIn: authResult.expiresIn
          }
        }
      });

    } catch (error) {
      logger.error('Erreur login:', error);

      // Gestion des erreurs spécifiques
      const errorMessage = error instanceof Error ? error.message : 'Erreur lors de la connexion';

      if (errorMessage.includes('Identifiants invalides') ||
        errorMessage.includes('Utilisateur non trouvé') ||
        errorMessage.includes('Mot de passe incorrect')) {
        return res.status(401).json({
          error: 'Identifiants invalides',
          message: 'Email ou mot de passe incorrect'
        });
      }

      if (errorMessage.includes('Compte désactivé') ||
        errorMessage.includes('Compte suspendu')) {
        return res.status(403).json({
          error: 'Compte désactivé',
          message: 'Votre compte a été désactivé. Contactez l\'administrateur.'
        });
      }

      if (errorMessage.includes('Compte verrouillé')) {
        return res.status(423).json({
          error: 'Compte verrouillé',
          message: 'Compte temporairement verrouillé suite à plusieurs tentatives échouées.'
        });
      }

      res.status(500).json({
        error: 'Erreur serveur',
        message: 'Erreur lors de la connexion'
      });
    }
  }

  /**
   * POST /api/auth/refresh
   * Renouvellement du token d'accès avec base de données réelle
   */
  static async refresh(req: Request, res: Response) {
    try {
      // Récupérer le refresh token depuis le cookie (prioritaire) ou le body (fallback)
      const refreshToken = req.cookies?.refreshToken || req.body.refreshToken;

      if (!refreshToken) {
        return res.status(401).json({
          error: 'Token manquant',
          message: 'Refresh token requis'
        });
      }

      const ipAddress = req.ip;

      // Rafraîchir le token avec le service RBAC
      const result = await AuthController.authService.refreshAccessToken(refreshToken, ipAddress);

      res.json({
        success: true,
        data: {
          accessToken: result.accessToken,
          expiresIn: result.expiresIn
        }
      });

    } catch (error) {
      logger.error('Erreur refresh token:', error);

      const errorMessage = error instanceof Error ? error.message : 'Erreur lors du rafraîchissement';

      if (errorMessage.includes('expiré') || errorMessage.includes('invalide')) {
        // Nettoyer le cookie si invalide
        res.clearCookie('refreshToken', { path: '/api/auth' });

        return res.status(401).json({
          error: 'Token invalide',
          message: 'Refresh token expiré ou invalide, reconnexion requise'
        });
      }

      if (errorMessage.includes('Utilisateur désactivé')) {
        res.clearCookie('refreshToken', { path: '/api/auth' });
        return res.status(403).json({
          error: 'Compte désactivé',
          message: 'Votre compte a été désactivé'
        });
      }

      res.status(401).json({
        error: 'Token invalide',
        message: 'Refresh token invalide'
      });
    }
  }

  /**
   * POST /api/auth/logout
   * Déconnexion utilisateur avec révocation des tokens
   */
  static async logout(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      const refreshToken = req.cookies?.refreshToken || req.body.refreshToken;
      const ipAddress = req.ip;

      if (userId) {
        await AuthController.authService.logout(userId, refreshToken, ipAddress);
      }

      // Nettoyer le cookie
      res.clearCookie('refreshToken', { path: '/api/auth' });

      res.json({
        success: true,
        message: 'Déconnexion réussie'
      });

    } catch (error) {
      logger.error('Erreur logout:', error);
      res.status(500).json({
        error: 'Erreur serveur',
        message: 'Erreur lors de la déconnexion'
      });
    }
  }

  /**
   * GET /api/auth/profile
   * Profil utilisateur connecté avec données complètes de la base
   */
  static async getProfile(req: Request, res: Response) {
    try {
      if (!req.user?.id) {
        return res.status(401).json({
          error: 'Non authentifié',
          message: 'Utilisateur non authentifié'
        });
      }

      // Récupérer le profil complet depuis la base de données
      const userProfile = await AuthController.authService.getUserProfile(req.user.id);

      if (!userProfile) {
        return res.status(404).json({
          error: 'Utilisateur non trouvé',
          message: 'Profil utilisateur introuvable'
        });
      }

      res.json({
        success: true,
        data: {
          user: userProfile
        }
      });

    } catch (error) {
      logger.error('Erreur profil:', error);
      res.status(500).json({
        error: 'Erreur serveur',
        message: 'Erreur lors de la récupération du profil'
      });
    }
  }
}
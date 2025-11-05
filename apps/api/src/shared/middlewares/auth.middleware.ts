/**
 * FICHIER: apps\api\src\shared\middlewares\auth.middleware.ts
 * MIDDLEWARE: Authentification JWT
 * 
 * DESCRIPTION:
 * Middleware d'authentification avec JWT
 * Vérification des tokens et extraction des données utilisateur
 * 
 * AUTEUR: Équipe CROU
 * DATE: Décembre 2024
 */

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { logger } from '@/shared/utils/logger';
import { AuthService } from '@/modules/auth/auth.service';

// Extension de Request pour inclure l'utilisateur
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        roleId: string;
        tenantId: string;
        permissions: string[];
      };
    }
  }
}

const authService = new AuthService();

export const authenticateJWT = (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: 'Token manquant',
        message: 'Token d\'authentification requis'
      });
    }

    const token = authHeader.substring(7);
    
    // Valider le token avec le service d'authentification
    const decoded = authService.validateAccessToken(token);
    
    req.user = {
      id: decoded.userId,
      email: decoded.email,
      roleId: decoded.roleId,
      tenantId: decoded.tenantId,
      permissions: decoded.permissions || []
    };

    logger.debug('Utilisateur authentifié:', {
      userId: req.user.id,
      email: req.user.email,
      roleId: req.user.roleId,
      tenantId: req.user.tenantId
    });

    next();
  } catch (error) {
    logger.warn('Échec authentification JWT:', {
      error: error instanceof Error ? error.message : 'Erreur inconnue',
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });

    if (error instanceof jwt.TokenExpiredError) {
      return res.status(401).json({
        error: 'Token expiré',
        message: 'Votre session a expiré, veuillez vous reconnecter'
      });
    }

    if (error instanceof jwt.JsonWebTokenError || (error as any)?.message === 'Token invalide') {
      return res.status(401).json({
        error: 'Token invalide',
        message: 'Token d\'authentification invalide'
      });
    }

    return res.status(401).json({
      error: 'Authentification échouée',
      message: 'Erreur lors de la vérification du token'
    });
  }
};

// Alias pour compatibilité
export const authMiddleware = authenticateJWT;
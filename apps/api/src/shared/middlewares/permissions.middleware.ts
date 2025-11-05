/**
 * FICHIER: apps\api\src\shared\middlewares\permissions.middleware.ts
 * MIDDLEWARE: Vérification des permissions
 * 
 * DESCRIPTION:
 * Middleware pour vérifier les permissions utilisateur
 * Contrôle d'accès basé sur les rôles et permissions
 * 
 * AUTEUR: Équipe CROU
 * DATE: Décembre 2024
 */

import { Request, Response, NextFunction } from 'express';
import { logger } from '@/shared/utils/logger';

export const checkPermissions = (requiredPermissions: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      // Vérifier que l'utilisateur est authentifié
      if (!req.user) {
        return res.status(401).json({
          error: 'Non authentifié',
          message: 'Authentification requise'
        });
      }

      const userPermissions = req.user.permissions || [];
      
      // Vérifier si l'utilisateur a au moins une des permissions requises
      const hasPermission = requiredPermissions.some(permission => 
        userPermissions.includes(permission) || userPermissions.includes('admin:all')
      );

      if (!hasPermission) {
        logger.warn('Accès refusé - permissions insuffisantes:', {
          userId: req.user.id,
          userPermissions,
          requiredPermissions,
          url: req.url,
          method: req.method
        });

        return res.status(403).json({
          error: 'Accès refusé',
          message: 'Permissions insuffisantes pour cette action'
        });
      }

      logger.debug('Permissions vérifiées avec succès:', {
        userId: req.user.id,
        requiredPermissions,
        url: req.url
      });

      next();
    } catch (error) {
      logger.error('Erreur vérification permissions:', error);
      
      return res.status(500).json({
        error: 'Erreur serveur',
        message: 'Erreur lors de la vérification des permissions'
      });
    }
  };
};

// Middleware pour vérifier le rôle utilisateur
export const checkRole = (requiredRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          error: 'Non authentifié',
          message: 'Authentification requise'
        });
      }

      const userRole = (req.user as any).role;
      if (!requiredRoles.includes(userRole)) {
        logger.warn('Accès refusé - rôle insuffisant:', {
          userId: req.user.id,
          userRole: userRole,
          requiredRoles,
          url: req.url
        });

        return res.status(403).json({
          error: 'Accès refusé',
          message: 'Rôle insuffisant pour cette action'
        });
      }

      next();
    } catch (error) {
      logger.error('Erreur vérification rôle:', error);
      
      return res.status(500).json({
        error: 'Erreur serveur',
        message: 'Erreur lors de la vérification du rôle'
      });
    }
  };
};
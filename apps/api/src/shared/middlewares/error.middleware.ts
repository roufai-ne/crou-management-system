/**
 * FICHIER: apps\api\src\shared\middlewares\error.middleware.ts
 * MIDDLEWARE: Gestion globale des erreurs
 * 
 * DESCRIPTION:
 * Middleware centralisé pour la gestion des erreurs
 * Logging des erreurs et réponses standardisées
 * 
 * AUTEUR: Équipe CROU
 * DATE: Décembre 2024
 */

import { Request, Response, NextFunction } from 'express';
import { logger } from '@/shared/utils/logger';

export const errorHandler = (
  error: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Log de l'erreur
  logger.error('Erreur API:', {
    message: error.message,
    stack: error.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent')
  });

  // Erreurs de validation
  if (error.name === 'ValidationError') {
    return res.status(400).json({
      error: 'Données invalides',
      message: error.message,
      details: error.details
    });
  }

  // Erreurs de base de données
  if (error.code === '23505') { // Violation de contrainte unique
    return res.status(409).json({
      error: 'Conflit de données',
      message: 'Cette ressource existe déjà'
    });
  }

  if (error.code === '23503') { // Violation de clé étrangère
    return res.status(400).json({
      error: 'Référence invalide',
      message: 'La ressource référencée n\'existe pas'
    });
  }

  // Erreurs JWT
  if (error.name === 'JsonWebTokenError') {
    return res.status(401).json({
      error: 'Token invalide',
      message: 'Token d\'authentification invalide'
    });
  }

  if (error.name === 'TokenExpiredError') {
    return res.status(401).json({
      error: 'Token expiré',
      message: 'Votre session a expiré, veuillez vous reconnecter'
    });
  }

  // Erreurs de permissions
  if (error.name === 'ForbiddenError') {
    return res.status(403).json({
      error: 'Accès refusé',
      message: 'Vous n\'avez pas les permissions nécessaires'
    });
  }

  // Erreurs de ressource non trouvée
  if (error.name === 'NotFoundError') {
    return res.status(404).json({
      error: 'Ressource non trouvée',
      message: error.message || 'La ressource demandée n\'existe pas'
    });
  }

  // Erreur par défaut
  const statusCode = error.statusCode || 500;
  const message = process.env.NODE_ENV === 'production' 
    ? 'Erreur serveur interne'
    : error.message || 'Erreur serveur interne';

  res.status(statusCode).json({
    error: 'Erreur serveur',
    message,
    ...(process.env.NODE_ENV === 'development' && {
      stack: error.stack,
      details: error
    })
  });
};

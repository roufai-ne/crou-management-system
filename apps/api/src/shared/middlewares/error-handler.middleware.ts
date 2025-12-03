/**
 * FICHIER: apps/api/src/shared/middlewares/error-handler.middleware.ts
 * MIDDLEWARE: Gestionnaire d'erreurs standardisé
 *
 * DESCRIPTION:
 * Middleware pour standardiser le format des réponses d'erreur
 * dans toute l'application
 *
 * AUTEUR: Équipe CROU
 * DATE: Décembre 2025
 */

import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

/**
 * Interface standardisée pour les réponses d'erreur
 */
export interface ErrorResponse {
  success: false;
  error: string;
  message: string;
  details?: any[];
  code?: string;
  timestamp: string;
  path: string;
}

/**
 * Classe d'erreur personnalisée avec code d'état HTTP
 */
export class AppError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public code?: string,
    public details?: any[]
  ) {
    super(message);
    this.name = 'AppError';
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Middleware de gestion des erreurs
 * Doit être placé en dernier dans la chaîne de middlewares
 */
export function errorHandler(
  err: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  // Logger l'erreur
  logger.error('Error handled:', {
    name: err.name,
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    ip: req.ip
  });

  // Déterminer le code d'état HTTP
  let statusCode = 500;
  let errorCode = 'INTERNAL_SERVER_ERROR';
  let details: any[] | undefined;

  if (err instanceof AppError) {
    statusCode = err.statusCode;
    errorCode = err.code || errorCode;
    details = err.details;
  } else if (err.name === 'ValidationError') {
    statusCode = 400;
    errorCode = 'VALIDATION_ERROR';
  } else if (err.name === 'UnauthorizedError' || err.message.includes('jwt')) {
    statusCode = 401;
    errorCode = 'UNAUTHORIZED';
  } else if (err.name === 'ForbiddenError') {
    statusCode = 403;
    errorCode = 'FORBIDDEN';
  } else if (err.name === 'NotFoundError') {
    statusCode = 404;
    errorCode = 'NOT_FOUND';
  } else if (err.name === 'ConflictError') {
    statusCode = 409;
    errorCode = 'CONFLICT';
  }

  // Construire la réponse d'erreur standardisée
  const errorResponse: ErrorResponse = {
    success: false,
    error: errorCode,
    message: err.message || 'Une erreur interne est survenue',
    timestamp: new Date().toISOString(),
    path: req.path
  };

  // Ajouter les détails si disponibles
  if (details && details.length > 0) {
    errorResponse.details = details;
  }

  // En développement, ajouter la stack trace
  if (process.env.NODE_ENV === 'development') {
    (errorResponse as any).stack = err.stack;
  }

  // Envoyer la réponse
  res.status(statusCode).json(errorResponse);
}

/**
 * Middleware pour gérer les routes non trouvées (404)
 */
export function notFoundHandler(req: Request, res: Response): void {
  const errorResponse: ErrorResponse = {
    success: false,
    error: 'NOT_FOUND',
    message: `Route ${req.method} ${req.path} non trouvée`,
    timestamp: new Date().toISOString(),
    path: req.path
  };

  res.status(404).json(errorResponse);
}

/**
 * Utilitaires pour créer des erreurs standardisées
 */
export const createError = {
  badRequest: (message: string, details?: any[]) =>
    new AppError(400, message, 'BAD_REQUEST', details),

  unauthorized: (message: string = 'Non autorisé') =>
    new AppError(401, message, 'UNAUTHORIZED'),

  forbidden: (message: string = 'Accès interdit') =>
    new AppError(403, message, 'FORBIDDEN'),

  notFound: (resource: string = 'Ressource') =>
    new AppError(404, `${resource} non trouvé(e)`, 'NOT_FOUND'),

  conflict: (message: string) =>
    new AppError(409, message, 'CONFLICT'),

  internal: (message: string = 'Erreur interne du serveur') =>
    new AppError(500, message, 'INTERNAL_SERVER_ERROR'),

  validation: (message: string, details?: any[]) =>
    new AppError(400, message, 'VALIDATION_ERROR', details)
};

/**
 * Wrapper async pour gérer les erreurs dans les contrôleurs
 * Évite d'avoir à écrire try/catch dans chaque méthode
 */
export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

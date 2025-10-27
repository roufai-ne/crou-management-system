/**
 * FICHIER: apps\api\src\shared\middlewares\logging.middleware.ts
 * MIDDLEWARE: Logging des requêtes
 * 
 * DESCRIPTION:
 * Middleware pour logger les requêtes API
 * Informations de performance et de sécurité
 * 
 * AUTEUR: Équipe CROU
 * DATE: Décembre 2024
 */

import { Request, Response, NextFunction } from 'express';
import { logger } from '@/shared/utils/logger';

export const requestLogger = (req: Request, res: Response, next: NextFunction) => {
  const startTime = Date.now();
  const { method, url, ip } = req;
  const userAgent = req.get('User-Agent') || 'Unknown';

  // Log de la requête entrante
  logger.info('Requête API entrante', {
    method,
    url,
    ip,
    userAgent,
    timestamp: new Date().toISOString()
  });

  // Intercepter la réponse pour logger les performances
  const originalSend = res.send;
  res.send = function(data) {
    const duration = Date.now() - startTime;
    const { statusCode } = res;

    // Log de la réponse
    logger.info('Réponse API', {
      method,
      url,
      statusCode,
      duration: `${duration}ms`,
      ip,
      userAgent,
      timestamp: new Date().toISOString()
    });

    // Log des erreurs
    if (statusCode >= 400) {
      logger.warn('Erreur API', {
        method,
        url,
        statusCode,
        duration: `${duration}ms`,
        ip,
        userAgent,
        error: data
      });
    }

    // Log des requêtes lentes (> 5 secondes)
    if (duration > 5000) {
      logger.warn('Requête lente détectée', {
        method,
        url,
        duration: `${duration}ms`,
        ip,
        userAgent
      });
    }

    return originalSend.call(this, data);
  };

  next();
};

/**
 * FICHIER: packages\notifications\src\utils\logger.ts
 * UTILITAIRE: Logger - Système de logging
 * 
 * DESCRIPTION:
 * Utilitaire de logging pour le système de notifications
 * Intégration avec Winston
 * 
 * AUTEUR: Équipe CROU
 * DATE: Décembre 2024
 */

import winston from 'winston';

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'notifications' },
  transports: [
    new winston.transports.File({ filename: 'logs/notifications-error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/notifications-combined.log' })
  ]
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple()
  }));
}

export { logger };

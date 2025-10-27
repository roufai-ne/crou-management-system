/**
 * FICHIER: packages\notifications\src\index.ts
 * EXPORTS: Point d'entrée du package notifications
 * 
 * DESCRIPTION:
 * Exporte tous les services et types
 * pour le système de notifications
 * 
 * AUTEUR: Équipe CROU
 * DATE: Décembre 2024
 */

// Services
export { NotificationService } from './services/notification.service';

// Types
export * from './types/notification.types';

// Utilitaires
export { logger } from './utils/logger';

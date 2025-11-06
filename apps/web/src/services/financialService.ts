/**
 * FICHIER: apps/web/src/services/financialService.ts
 * RE-EXPORT: Service financier consolidé
 *
 * DESCRIPTION:
 * Ce fichier réexporte le service financier consolidé depuis /api/financialService
 * Maintient la compatibilité avec les imports existants
 *
 * IMPORTANT:
 * Utiliser désormais directement @/services/api/financialService pour les nouveaux fichiers
 * Ce fichier existe uniquement pour la compatibilité
 *
 * AUTEUR: Équipe CROU
 * DATE: Janvier 2025
 */

// Réexporter tout depuis le service API consolidé
export * from './api/financialService';
export { financialService as default } from './api/financialService';

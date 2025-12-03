/**
 * FICHIER: apps/api/src/shared/middlewares/rate-limiters.middleware.ts
 * MIDDLEWARE: Rate Limiters pour endpoints sensibles
 *
 * DESCRIPTION:
 * Définit différents rate limiters pour protéger les endpoints sensibles
 * contre les abus et les attaques DoS
 *
 * AUTEUR: Équipe CROU
 * DATE: Décembre 2025
 */

import rateLimit from 'express-rate-limit';

/**
 * Rate limiter global (défaut)
 * 100 requêtes par 15 minutes
 */
export const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: {
    success: false,
    error: 'Trop de requêtes, veuillez réessayer plus tard.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

/**
 * Rate limiter pour authentification
 * 5 tentatives par 15 minutes
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,
  message: {
    success: false,
    error: 'Trop de tentatives de connexion, réessayez dans 15 minutes.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

/**
 * Rate limiter pour validation de budget
 * 10 validations par heure
 */
export const budgetValidationLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 heure
  max: 10,
  message: {
    success: false,
    error: 'Trop de validations de budget, réessayez plus tard.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false
});

/**
 * Rate limiter pour approbation de transactions
 * 20 approbations par heure
 */
export const transactionApprovalLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 heure
  max: 20,
  message: {
    success: false,
    error: 'Trop d\'approbations de transactions, réessayez plus tard.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

/**
 * Rate limiter pour gestion des utilisateurs
 * 20 opérations par heure (création, modification, suppression)
 */
export const userManagementLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 heure
  max: 20,
  message: {
    success: false,
    error: 'Trop d\'opérations de gestion d\'utilisateurs, réessayez plus tard.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

/**
 * Rate limiter pour gestion des rôles/permissions
 * 30 opérations par heure
 */
export const rolePermissionLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 heure
  max: 30,
  message: {
    success: false,
    error: 'Trop de modifications de rôles/permissions, réessayez plus tard.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

/**
 * Rate limiter pour upload de fichiers
 * 10 uploads par heure
 */
export const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 heure
  max: 10,
  message: {
    success: false,
    error: 'Trop d\'uploads de fichiers, réessayez plus tard.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

/**
 * Rate limiter pour génération de rapports
 * 15 rapports par heure
 */
export const reportGenerationLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 heure
  max: 15,
  message: {
    success: false,
    error: 'Trop de générations de rapports, réessayez plus tard.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

/**
 * Rate limiter pour export de données
 * 10 exports par heure
 */
export const dataExportLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 heure
  max: 10,
  message: {
    success: false,
    error: 'Trop d\'exports de données, réessayez plus tard.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

/**
 * Rate limiter pour API admin
 * 50 requêtes par heure
 */
export const adminLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 heure
  max: 50,
  message: {
    success: false,
    error: 'Trop de requêtes administratives, réessayez plus tard.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

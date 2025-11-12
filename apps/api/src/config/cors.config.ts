/**
 * FICHIER: apps\api\src\config\cors.config.ts
 * CONFIG: Configuration CORS
 * 
 * DESCRIPTION:
 * Configuration CORS pour l'API CROU
 * Sécurité et compatibilité frontend
 * 
 * AUTEUR: Équipe CROU
 * DATE: Décembre 2024
 */

import { CorsOptions } from 'cors';

export const corsConfig: CorsOptions = {
  origin: (origin, callback) => {
    // Liste des origines autorisées (dev et prod)
    const allowedOrigins = [
      // Développement local
      'http://localhost:3000',
      'http://localhost:5173',
      'http://127.0.0.1:3000',
      'http://127.0.0.1:5173',
      // Production
      'https://crou.niamey.gov.ne',
      'https://admin.crou.niamey.gov.ne'
    ];

    // Lire les origines depuis les variables d'environnement
    const envOrigins = process.env.ALLOWED_ORIGINS?.split(',').map(o => o.trim()) || [];
    const allAllowedOrigins = [...allowedOrigins, ...envOrigins];

    // Permettre les requêtes sans origin (ex: Postman, curl, scripts serveur)
    // SEULEMENT en développement et avec whitelist stricte
    if (!origin) {
      if (process.env.NODE_ENV === 'development') {
        return callback(null, true);
      } else {
        // En production, refuser les requêtes sans origin (sécurité CSRF)
        return callback(new Error('Origin header requis'));
      }
    }

    // Vérifier si l'origine est dans la liste autorisée
    if (allAllowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      const isDev = process.env.NODE_ENV === 'development';
      const errorMsg = isDev
        ? `CORS: Origine '${origin}' non autorisée. Origines autorisées: ${allAllowedOrigins.join(', ')}`
        : 'Non autorisé par CORS';
      callback(new Error(errorMsg));
    }
  },
  
  credentials: true, // Autoriser les cookies et headers d'authentification
  
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  
  allowedHeaders: [
    'Origin',
    'X-Requested-With',
    'Content-Type',
    'Accept',
    'Authorization',
    'Cache-Control',
    'Pragma'
  ],
  
  exposedHeaders: [
    'X-Total-Count',
    'X-Page-Count',
    'X-Current-Page'
  ],
  
  maxAge: 86400 // Cache preflight pour 24h
};

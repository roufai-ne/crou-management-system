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
    // Récupérer les origines autorisées depuis les variables d'environnement
    // Format: URL1,URL2,URL3
    const envOrigins = process.env.ALLOWED_ORIGINS?.split(',').map(url => url.trim()) || [];

    // Origines par défaut en développement uniquement
    const defaultDevOrigins = process.env.NODE_ENV === 'development'
      ? [
          'http://localhost:3000',
          'http://localhost:5173',
          'http://127.0.0.1:3000',
          'http://127.0.0.1:5173'
        ]
      : [];

    // Combiner les origines
    const allowedOrigins = [...envOrigins, ...defaultDevOrigins];

    // Permettre les requêtes sans origin (ex: Postman, curl)
    // mais seulement en développement
    if (!origin && process.env.NODE_ENV === 'development') {
      return callback(null, true);
    }

    // Vérifier si l'origine est dans la liste autorisée
    if (origin && allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Non autorisé par CORS'));
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

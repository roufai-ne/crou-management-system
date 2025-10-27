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
    // En développement, autoriser toutes les origines
    if (process.env.NODE_ENV === 'development') {
      return callback(null, true);
    }

    // En production, vérifier les origines autorisées
    const allowedOrigins = [
      'http://localhost:3000',      // Frontend dev
      'http://localhost:5173',      // Vite dev
      'https://crou.niamey.gov.ne', // Production frontend
      'https://admin.crou.niamey.gov.ne' // Admin frontend
    ];

    if (!origin || allowedOrigins.includes(origin)) {
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

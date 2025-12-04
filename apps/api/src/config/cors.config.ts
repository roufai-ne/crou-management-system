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
    // Permettre les requêtes sans origin (Postman, curl, etc.) en développement
    if (!origin && process.env.NODE_ENV === 'development') {
      return callback(null, true);
    }

    // En mode développement, autoriser toutes les origines du réseau local
    if (process.env.NODE_ENV === 'development' && origin) {
      // Autoriser toutes les IPs du réseau local (192.168.x.x, 10.x.x.x, 172.16-31.x.x)
      const isLocalNetwork =
        origin.includes('localhost') ||
        origin.includes('127.0.0.1') ||
        origin.match(/http:\/\/192\.168\.\d{1,3}\.\d{1,3}:\d+/) ||
        origin.match(/http:\/\/10\.\d{1,3}\.\d{1,3}\.\d{1,3}:\d+/) ||
        origin.match(/http:\/\/172\.(1[6-9]|2[0-9]|3[0-1])\.\d{1,3}\.\d{1,3}:\d+/);

      if (isLocalNetwork) {
        return callback(null, true);
      }
    }

    // Liste des origines autorisées (prod)
    const allowedOrigins = [
      // Développement local
      'http://localhost:3000',
      'http://localhost:5173',
      'http://127.0.0.1:3000',
      'http://127.0.0.1:5173',

      // Production
      'https://crou.niamey.gov.ne',
      'https://admin.crou.niamey.gov.ne',
      'https://crou.mesrit.com',
      'http://crou.mesrit.com',
      'https://www.crou.mesrit.com',
      'http://www.crou.mesrit.com'
    ];

    // Lire les origines depuis les variables d'environnement
    const envOrigins = process.env.ALLOWED_ORIGINS?.split(',').map(o => o.trim()) || [];
    const allAllowedOrigins = [...allowedOrigins, ...envOrigins];

    // Permettre les requêtes sans origin en production ?
    if (!origin) {
      // En production, refuser les requêtes sans origin (sécurité CSRF)
      return callback(new Error('Origin header requis'));
    }

    // Vérifier si l'origine est dans la liste autorisée
    if (allAllowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      // Log pour debugging
      console.warn(`[CORS] Origin refusée: ${origin}`);
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
    'Pragma',
    'x-target-tenant-id'
  ],

  exposedHeaders: [
    'X-Total-Count',
    'X-Page-Count',
    'X-Current-Page'
  ],

  maxAge: 86400 // Cache preflight pour 24h
};

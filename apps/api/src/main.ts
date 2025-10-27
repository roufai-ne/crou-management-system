/**
 * FICHIER: apps\api\src\main.ts
 * SERVEUR: Point d'entrée principal API CROU
 * 
 * DESCRIPTION:
 * Serveur Express avec authentification JWT et middlewares sécurisés
 * Support multi-tenant avec séparation par tenant_id
 * Configuration CORS, rate limiting et logging
 * Gestion erreurs globales et monitoring
 * 
 * FONCTIONNALITÉS:
 * - Serveur Express configuré pour production
 * - Authentification JWT sécurisée
 * - CORS configuré pour frontend
 * - Rate limiting par IP et utilisateur
 * - Logging Winston avec rotation
 * - Health check et monitoring
 * - Gestion graceful shutdown
 * 
 * ROUTES PRINCIPALES:
 * - /api/auth - Authentification
 * - /api/dashboard - Tableaux de bord
 * - /api/financial - Module financier
 * - /api/stocks - Gestion stocks
 * - /api/housing - Logement
 * - /api/reports - Rapports
 * - /api/notifications - Notifications
 * - /api/workflows - Workflows
 * - /api/admin - Administration
 * 
 * AUTEUR: Équipe CROU
 * DATE: Décembre 2024
 */

import 'reflect-metadata';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import { config } from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

import { initializeDatabase, closeDatabase } from '../../../packages/database/src/config/typeorm.config';
import { errorHandler } from '@/shared/middlewares/error.middleware';
import { requestLogger } from '@/shared/middlewares/logging.middleware';
import { corsConfig } from '@/config/cors.config';
import { logger } from '@/shared/utils/logger';

// Routes modules
import { authRoutes } from '@/modules/auth/auth.routes';
import { dashboardRoutes } from '@/modules/dashboard/dashboard.routes';
import { financialRoutes } from '@/modules/financial/financial.routes';
import { stocksRoutes } from '@/modules/stocks/stocks.routes';
import { housingRoutes } from '@/modules/housing/housing.routes';
import { reportsRoutes } from '@/modules/reports/reports.routes';
import { notificationsRoutes } from '@/modules/notifications/notifications.routes';
import { workflowRoutes } from '@/modules/workflows/workflow.routes';
import adminRoutes from '@/modules/admin/index';

// Configuration environnement
config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration Express
const app = express();
const PORT = process.env.PORT || 3001;
const NODE_ENV = process.env.NODE_ENV || 'development';

// Middlewares de sécurité
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  crossOriginEmbedderPolicy: false
}));

// CORS configuré
app.use(cors(corsConfig));

// Compression gzip
app.use(compression());

// Rate limiting global
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: NODE_ENV === 'development' ? 1000 : 100, // 100 requêtes par 15min en prod
  message: {
    error: 'Trop de requêtes depuis cette IP, réessayez plus tard.'
  },
  standardHeaders: true,
  legacyHeaders: false
});
app.use(limiter);

// Rate limiting spécifique authentification
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5, // 5 tentatives de connexion par 15min
  message: {
    error: 'Trop de tentatives de connexion, réessayez plus tard.'
  }
});

// Parsing JSON avec limite de taille
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging des requêtes
if (NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined', {
    stream: {
      write: (message: string) => logger.info(message.trim())
    }
  }));
}

// Middleware de logging personnalisé
app.use(requestLogger);

// Routes de santé
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    environment: NODE_ENV,
    version: process.env.npm_package_version || '1.0.0'
  });
});

app.get('/api/health', async (req, res) => {
  try {
    // Vérifier la base de données
    const { AppDataSource } = await import('../../../packages/database/src/config/typeorm.config');
    const dbStatus = AppDataSource.isInitialized ? 'connected' : 'disconnected';
    
    res.json({
      status: 'OK',
      services: {
        database: dbStatus,
        api: 'running'
      },
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '1.0.0'
    });
  } catch (error) {
    res.status(503).json({
      status: 'ERROR',
      error: 'Service unavailable'
    });
  }
});

// Routes API
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/financial', financialRoutes);
app.use('/api/stocks', stocksRoutes);
app.use('/api/housing', housingRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/notifications', notificationsRoutes);
app.use('/api/workflows', workflowRoutes);
app.use('/api/admin', adminRoutes);

// Route par défaut
app.get('/api', (req, res) => {
  res.json({
    message: 'API CROU - Système de Gestion',
    version: '1.0.0',
    documentation: '/api/docs',
    status: 'running'
  });
});

// Gestion des routes non trouvées
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Route non trouvée',
    path: req.originalUrl,
    method: req.method
  });
});

// Middleware de gestion d'erreurs globales
app.use(errorHandler);

// Fonction de démarrage du serveur
async function startServer() {
  try {
    // Initialiser la base de données
    await initializeDatabase();
    
    // Démarrer le serveur
    const server = app.listen(PORT, () => {
      logger.info(`🚀 Serveur CROU démarré`);
      logger.info(`📡 Port: ${PORT}`);
      logger.info(`🌍 Environnement: ${NODE_ENV}`);
      logger.info(`🔗 URL: http://localhost:${PORT}`);
      logger.info(`📊 API: http://localhost:${PORT}/api`);
      logger.info(`🏥 Health: http://localhost:${PORT}/health`);
    });

    // Gestion graceful shutdown
    const gracefulShutdown = async (signal: string) => {
      logger.info(`Réception signal ${signal}, arrêt en cours...`);
      
      // Arrêter d'accepter de nouvelles connexions
      server.close(async () => {
        logger.info('Serveur HTTP fermé');
        
        try {
          // Fermer la base de données
          await closeDatabase();
          
          logger.info('✅ Arrêt propre terminé');
          process.exit(0);
        } catch (error) {
          logger.error('❌ Erreur pendant l\'arrêt:', error);
          process.exit(1);
        }
      });
      
      // Forcer l'arrêt après 10 secondes
      setTimeout(() => {
        logger.error('⏰ Arrêt forcé après timeout');
        process.exit(1);
      }, 10000);
    };

    // Écouter les signaux d'arrêt
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
    
    // Gestion des erreurs non capturées
    process.on('unhandledRejection', (reason, promise) => {
      logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
    });
    
    process.on('uncaughtException', (error) => {
      logger.error('Uncaught Exception:', error);
      process.exit(1);
    });

  } catch (error) {
    logger.error('❌ Erreur démarrage serveur:', error);
    process.exit(1);
  }
}

// Démarrer l'application
startServer();
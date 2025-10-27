/**
 * FICHIER: apps\api\src\main-simple.ts
 * VERSION SIMPLIFIÉE DU SERVEUR API CROU
 */

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import { config } from 'dotenv';

// Configuration environnement
config();

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
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:5173'],
  credentials: true
}));

// Compression gzip
app.use(compression());

// Rate limiting global
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: NODE_ENV === 'development' ? 1000 : 100,
  message: {
    error: 'Trop de requêtes depuis cette IP, réessayez plus tard.'
  },
  standardHeaders: true,
  legacyHeaders: false
});
app.use(limiter);

// Parsing JSON avec limite de taille
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging des requêtes
if (NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// Routes de santé
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    environment: NODE_ENV,
    version: process.env.npm_package_version || '1.0.0'
  });
});

app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    services: {
      database: 'not_connected',
      api: 'running'
    },
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0'
  });
});

// Routes API simplifiées
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;

  if (email === 'admin@crou.gov.ne' && password === 'password123') {
    res.json({
      message: 'Connexion réussie',
      user: {
        id: '1',
        email: 'admin@crou.gov.ne',
        name: 'Administrateur CROU',
        role: 'directeur',
        level: 'crou'
      },
      tokens: {
        accessToken: 'fake-jwt-token',
        refreshToken: 'fake-refresh-token',
        expiresIn: '1h'
      }
    });
  } else {
    res.status(401).json({
      error: 'Identifiants invalides'
    });
  }
});

app.post('/api/auth/logout', (req, res) => {
  res.json({
    message: 'Déconnexion réussie'
  });
});

app.get('/api/auth/profile', (req, res) => {
  res.json({
    user: {
      id: '1',
      email: 'admin@crou.gov.ne',
      name: 'Administrateur CROU',
      role: 'directeur',
      level: 'crou'
    }
  });
});

// Routes modules
app.get('/api/financial/*', (req, res) => {
  res.json({ message: 'Module Financier', endpoint: req.path, data: [] });
});

app.get('/api/stocks/*', (req, res) => {
  res.json({ message: 'Module Stocks', endpoint: req.path, data: [] });
});

app.get('/api/housing/*', (req, res) => {
  res.json({ message: 'Module Logement', endpoint: req.path, data: [] });
});

app.get('/api/reports/*', (req, res) => {
  res.json({ message: 'Module Rapports', endpoint: req.path, data: [] });
});

app.get('/api/notifications/*', (req, res) => {
  res.json({ message: 'Module Notifications', endpoint: req.path, data: [] });
});

app.get('/api/workflows/*', (req, res) => {
  res.json({ message: 'Module Workflows', endpoint: req.path, data: [] });
});

// Route par défaut
app.get('/api', (req, res) => {
  res.json({
    message: 'API CROU - Système de Gestion',
    version: '1.0.0',
    status: 'running',
    mode: 'simplified'
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

// Gestion d'erreurs globales
app.use((err: any, req: any, res: any, next: any) => {
  console.error('Erreur serveur:', err);
  res.status(500).json({
    error: 'Erreur serveur interne'
  });
});

// Démarrer le serveur
const server = app.listen(PORT, () => {
  console.log(`🚀 Serveur CROU démarré (mode simplifié)`);
  console.log(`📡 Port: ${PORT}`);
  console.log(`🌍 Environnement: ${NODE_ENV}`);
  console.log(`🔗 URL: http://localhost:${PORT}`);
  console.log(`📊 API: http://localhost:${PORT}/api`);
  console.log(`🏥 Health: http://localhost:${PORT}/health`);
});

// Gestion graceful shutdown
const gracefulShutdown = (signal: string) => {
  console.log(`Réception signal ${signal}, arrêt en cours...`);

  server.close(() => {
    console.log('✅ Serveur HTTP fermé');
    process.exit(0);
  });

  // Forcer l'arrêt après 5 secondes
  setTimeout(() => {
    console.log('⏰ Arrêt forcé après timeout');
    process.exit(1);
  }, 5000);
};

// Écouter les signaux d'arrêt
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Gestion des erreurs non capturées
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});
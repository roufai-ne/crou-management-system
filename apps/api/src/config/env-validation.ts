/**
 * FICHIER: apps\api\src\config\env-validation.ts
 * CONFIG: Validation des variables d'environnement
 *
 * DESCRIPTION:
 * Validation stricte des variables d'environnement au démarrage
 * Empêche le démarrage si des variables critiques manquent
 *
 * SÉCURITÉ:
 * - Empêche l'utilisation de secrets fallback
 * - Valide la présence de toutes les variables critiques
 * - Affiche des messages clairs en cas d'erreur
 *
 * AUTEUR: Équipe CROU
 * DATE: Décembre 2024
 */

export interface EnvironmentConfig {
  nodeEnv: string;
  port: number;
  apiVersion: string;

  // Database
  databaseUrl: string;

  // JWT
  jwtSecret: string;
  jwtExpiresIn: string;
  jwtRefreshSecret: string;
  jwtRefreshExpiresIn: string;

  // Redis
  redisHost: string;
  redisPort: number;
  redisPassword?: string;

  // CORS
  allowedOrigins: string;

  // Logging
  logLevel: string;
  logFilePath: string;

  // Uploads
  uploadMaxSize: number;
  uploadPath: string;

  // Email (optionnel)
  emailHost?: string;
  emailPort?: number;
  emailUser?: string;
  emailPassword?: string;
}

/**
 * Variables d'environnement critiques qui DOIVENT être définies en production
 */
const CRITICAL_ENV_VARS = [
  'JWT_SECRET',
  'JWT_REFRESH_SECRET',
  'DATABASE_URL'
];

/**
 * Variables d'environnement recommandées
 */
const RECOMMENDED_ENV_VARS = [
  'REDIS_HOST',
  'REDIS_PORT',
  'ALLOWED_ORIGINS',
  'LOG_LEVEL'
];

/**
 * Valider les variables d'environnement critiques
 */
export function validateEnvironment(): EnvironmentConfig {
  const isProduction = process.env.NODE_ENV === 'production';
  const errors: string[] = [];
  const warnings: string[] = [];

  // Valider les variables critiques - TOUJOURS requis (même en dev)
  for (const varName of CRITICAL_ENV_VARS) {
    if (!process.env[varName]) {
      errors.push(`❌ CRITIQUE: Variable ${varName} manquante (requise en ${isProduction ? 'production' : 'développement'})`);
    }
  }

  // Valider les variables recommandées
  for (const varName of RECOMMENDED_ENV_VARS) {
    if (!process.env[varName]) {
      warnings.push(`⚠️  Variable recommandée ${varName} manquante`);
    }
  }

  // Valider la longueur des secrets - CRITIQUE, pas juste un warning
  if (process.env.JWT_SECRET && process.env.JWT_SECRET.length < 32) {
    errors.push('❌ CRITIQUE: JWT_SECRET doit avoir au moins 32 caractères pour la sécurité');
  }

  if (process.env.JWT_REFRESH_SECRET && process.env.JWT_REFRESH_SECRET.length < 32) {
    errors.push('❌ CRITIQUE: JWT_REFRESH_SECRET doit avoir au moins 32 caractères');
  }

  // Valider DATABASE_URL
  if (process.env.DATABASE_URL && !process.env.DATABASE_URL.startsWith('postgresql://')) {
    warnings.push('⚠️  DATABASE_URL ne semble pas être une URL PostgreSQL valide');
  }

  // Afficher les erreurs et warnings
  if (errors.length > 0) {
    console.error('\n🚨 ERREURS DE CONFIGURATION CRITIQUES:\n');
    errors.forEach(err => console.error(err));
    console.error('\n💡 Conseil: Copiez .env.example vers .env et configurez les valeurs\n');

    throw new Error('Configuration d\'environnement invalide. Voir les erreurs ci-dessus.');
  }

  if (warnings.length > 0) {
    console.warn('\n⚠️  AVERTISSEMENTS DE CONFIGURATION:\n');
    warnings.forEach(warn => console.warn(warn));
    console.warn('');
  }

  // Construire l'objet de configuration validé
  // Les valeurs critiques ne doivent JAMAIS avoir de fallback vide
  const config: EnvironmentConfig = {
    nodeEnv: process.env.NODE_ENV || 'development',
    port: parseInt(process.env.PORT || '3001'),
    apiVersion: process.env.API_VERSION || '1.0.0',

    // Database - Pas de fallback vide (throw en erreur plus haut si manquant)
    databaseUrl: process.env.DATABASE_URL!,

    // JWT - Pas de fallback vide (throw en erreur plus haut si manquant)
    jwtSecret: process.env.JWT_SECRET!,
    jwtExpiresIn: process.env.JWT_EXPIRES_IN || '15m',
    jwtRefreshSecret: process.env.JWT_REFRESH_SECRET!,
    jwtRefreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',

    // Redis
    redisHost: process.env.REDIS_HOST || 'localhost',
    redisPort: parseInt(process.env.REDIS_PORT || '6379'),
    redisPassword: process.env.REDIS_PASSWORD,

    // CORS
    allowedOrigins: process.env.ALLOWED_ORIGINS || 'http://localhost:3000,http://localhost:5173',

    // Logging
    logLevel: process.env.LOG_LEVEL || 'info',
    logFilePath: process.env.LOG_FILE_PATH || './logs/api.log',

    // Uploads
    uploadMaxSize: parseInt(process.env.UPLOAD_MAX_SIZE || '10485760'),
    uploadPath: process.env.UPLOAD_PATH || './uploads',

    // Email
    emailHost: process.env.EMAIL_HOST,
    emailPort: process.env.EMAIL_PORT ? parseInt(process.env.EMAIL_PORT) : undefined,
    emailUser: process.env.EMAIL_USER,
    emailPassword: process.env.EMAIL_PASSWORD,
  };

  return config;
}

/**
 * Afficher la configuration (en masquant les secrets)
 */
export function displayConfig(config: EnvironmentConfig): void {
  console.log('\n📋 Configuration de l\'application:');
  console.log(`   Environnement: ${config.nodeEnv}`);
  console.log(`   Port: ${config.port}`);
  console.log(`   Version API: ${config.apiVersion}`);
  console.log(`   Database: ${config.databaseUrl ? '✓ Configurée' : '✗ Non configurée'}`);
  console.log(`   JWT Secret: ${config.jwtSecret ? '✓ Défini (' + config.jwtSecret.length + ' caractères)' : '✗ Non défini'}`);
  console.log(`   Redis: ${config.redisHost}:${config.redisPort}`);
  console.log(`   Log Level: ${config.logLevel}`);
  console.log('');
}

/**
 * Générer un secret aléatoire sécurisé (pour aide dev)
 */
export function generateSecret(length: number = 64): string {
  const crypto = require('crypto');
  return crypto.randomBytes(length).toString('hex');
}

/**
 * FICHIER: packages/database/src/config/typeorm.auth.config.ts
 * CONFIG: Configuration TypeORM pour authentification seulement
 * 
 * DESCRIPTION:
 * Configuration simplifiée avec seulement les entités d'authentification
 * Imports directs pour éviter les problèmes de métadonnées
 * 
 * AUTEUR: Équipe CROU
 * DATE: Décembre 2024
 */

import { DataSource, DataSourceOptions } from 'typeorm';
import { config } from 'dotenv';

// Imports directs des entités essentielles
import { User } from '../entities/User.entity';
import { Tenant } from '../entities/Tenant.entity';
import { AuditLog } from '../entities/AuditLog.entity';
import { RefreshToken } from '../entities/RefreshToken.entity';
import { Role } from '../entities/Role.entity';
import { Permission } from '../entities/Permission.entity';

// Configuration des variables d'environnement
config();

// Configuration base selon environnement
const isDevelopment = process.env.NODE_ENV === 'development';
const isProduction = process.env.NODE_ENV === 'production';

// Configuration TypeORM pour authentification
export const authTypeormConfig: DataSourceOptions = {
  type: 'postgres',
  
  // Configuration connexion
  ...(process.env.DATABASE_URL 
    ? { url: process.env.DATABASE_URL }
    : {
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '5432'),
        username: process.env.DB_USER || 'crou_user',
        password: process.env.DB_PASSWORD || 'crou_password',
        database: process.env.DB_NAME || 'crou_database'
      }
  ),

  // SSL en production
  ssl: isProduction ? { rejectUnauthorized: false } : false,

  // Pool de connexions optimisé
  extra: {
    connectionLimit: 10,
    acquireTimeoutMillis: 30000,
    timeout: 60000,
    ...(isProduction && {
      ssl: {
        rejectUnauthorized: false
      }
    })
  },

  // Entités - Import direct pour éviter les problèmes
  entities: [
    User,
    Tenant,
    AuditLog,
    RefreshToken,
    Role,
    Permission
  ],

  // Migrations
  migrations: [],

  // Configuration développement
  synchronize: isDevelopment,
  dropSchema: false,
  logging: isDevelopment ? ['error', 'warn'] : ['error'],
  logger: 'advanced-console',

  // Paramètres de migration
  migrationsRun: false,
  migrationsTableName: '_migrations_history',

  // Pas de cache pour simplifier
  cache: false
};

// Instance DataSource pour authentification
export const AuthDataSource = new DataSource(authTypeormConfig);

// Fonction d'initialisation simplifiée
export const initializeAuthDatabase = async (): Promise<void> => {
  try {
    console.log('🔄 Initialisation base de données authentification...');
    
    if (!AuthDataSource.isInitialized) {
      await AuthDataSource.initialize();
      console.log('✅ Connexion PostgreSQL établie (auth)');
    }

    // Pas de seeds pour le moment
    console.log('✅ Base de données authentification prête');

  } catch (error) {
    console.error('❌ Erreur initialisation base de données auth:', error);
    throw error;
  }
};

// Fonction de fermeture propre
export const closeAuthDatabase = async (): Promise<void> => {
  try {
    if (AuthDataSource.isInitialized) {
      await AuthDataSource.destroy();
      console.log('✅ Connexion base de données auth fermée');
    }
  } catch (error) {
    console.error('❌ Erreur fermeture base de données auth:', error);
  }
};
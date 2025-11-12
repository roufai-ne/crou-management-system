/**
 * FICHIER: packages/database/src/config/datasource-migrations.ts
 * CONFIG: DataSource pour migrations uniquement
 *
 * DESCRIPTION:
 * Configuration simplifiée pour exécuter les migrations
 * Utilise des glob patterns pour éviter les imports circulaires
 *
 * AUTEUR: Équipe CROU
 * DATE: Janvier 2025
 */

import { DataSource } from 'typeorm';
import { config } from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Configuration des variables d'environnement
config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// DataSource pour les migrations
const AppDataSource = new DataSource({
  type: 'postgres',

  // Configuration connexion
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  username: process.env.DB_USER || 'crou_user',
  password: process.env.DB_PASSWORD || 'crou_password',
  database: process.env.DB_NAME || 'crou_database',

  // SSL
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,

  // Entités - Glob pattern pour éviter imports circulaires
  entities: [
    path.join(__dirname, '../entities/*.entity.{ts,js}')
  ],

  // Migrations
  migrations: [
    path.join(__dirname, '../migrations/*.{ts,js}')
  ],

  // Configuration
  synchronize: false,
  logging: ['query', 'error', 'warn', 'migration'],
  logger: 'advanced-console',
  migrationsTableName: '_migrations_history',

  // Important: désactiver le cache des métadonnées
  cache: false
});

export default AppDataSource;

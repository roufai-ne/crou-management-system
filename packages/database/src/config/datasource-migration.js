/**
 * FICHIER: packages/database/src/config/datasource-migration.js
 * CONFIG: DataSource pour migrations TypeORM (CommonJS)
 *
 * DESCRIPTION:
 * Configuration compatible avec la CLI TypeORM
 * Fichier JavaScript pour éviter les problèmes d'imports ESM
 *
 * AUTEUR: Équipe CROU
 * DATE: Octobre 2025
 */

const { DataSource } = require('typeorm');
const dotenv = require('dotenv');
const path = require('path');

// Configuration des variables d'environnement
dotenv.config({ path: path.join(__dirname, '../../../../.env') });

// DataSource pour la CLI TypeORM
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

  // Entités - Chemin vers les fichiers TypeScript
  entities: [
    path.join(__dirname, '../entities/*.entity.ts')
  ],

  // Migrations
  migrations: [
    path.join(__dirname, '../migrations/*.ts')
  ],

  // Subscribers
  subscribers: [
    path.join(__dirname, '../subscribers/*.ts')
  ],

  // Configuration
  synchronize: false, // TOUJOURS false pour les migrations
  logging: ['error', 'warn', 'migration'],
  logger: 'advanced-console',
  migrationsTableName: '_migrations_history'
});

module.exports = AppDataSource;

/**
 * FICHIER: packages/database/src/config/datasource.ts
 * CONFIG: DataSource pour TypeORM CLI et migrations
 *
 * DESCRIPTION:
 * Configuration séparée pour la CLI TypeORM
 * Utilisée pour générer et exécuter les migrations
 *
 * USAGE:
 * - pnpm migration:generate src/migrations/InitialSchema
 * - pnpm migration:run
 * - pnpm migration:revert
 *
 * AUTEUR: Équipe CROU
 * DATE: Octobre 2025
 */

import { DataSource } from 'typeorm';
import { config } from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Configuration des variables d'environnement
config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// DataSource pour la CLI TypeORM
export const AppDataSource = new DataSource({
  type: 'postgres',

  // Configuration connexion
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  username: process.env.DB_USER || 'crou_user',
  password: process.env.DB_PASSWORD || 'crou_password',
  database: process.env.DB_NAME || 'crou_database',

  // SSL
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,

  // Entités - Utiliser glob pattern pour éviter import circulaires
  entities: [
    path.join(__dirname, '../entities/*.entity.{ts,js}')
  ],

  // Migrations
  migrations: [
    path.join(__dirname, '../migrations/*.{ts,js}')
  ],

  // Subscribers
  subscribers: [
    path.join(__dirname, '../subscribers/*.{ts,js}')
  ],

  // Configuration
  synchronize: false, // TOUJOURS false pour les migrations
  logging: ['query', 'error', 'warn'],
  logger: 'advanced-console',
  migrationsTableName: '_migrations_history'
});

export default AppDataSource;

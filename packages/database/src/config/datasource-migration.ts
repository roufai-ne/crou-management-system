/**
 * FICHIER: packages/database/src/config/datasource-migration.ts
 * CONFIG: DataSource pour migrations TypeORM (CommonJS compatible)
 *
 * DESCRIPTION:
 * Configuration compatible avec la CLI TypeORM
 * Utilisée exclusivement pour générer et exécuter les migrations
 *
 * AUTEUR: Équipe CROU
 * DATE: Octobre 2025
 */

import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';

// Configuration des variables d'environnement
dotenv.config({ path: '../../.env' });

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

  // Entités - Pattern glob pour auto-découverte
  entities: ['src/entities/*.entity.ts'],

  // Migrations
  migrations: ['src/migrations/*.ts'],

  // Subscribers
  subscribers: ['src/subscribers/*.ts'],

  // Configuration
  synchronize: false, // TOUJOURS false pour les migrations
  logging: ['error', 'warn', 'migration'],
  logger: 'advanced-console',
  migrationsTableName: '_migrations_history'
});

export default AppDataSource;

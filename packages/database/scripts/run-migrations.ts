/**
 * FICHIER: packages/database/scripts/run-migrations.ts
 * SCRIPT: Exécuteur de migrations avec support ESM
 *
 * DESCRIPTION:
 * Script pour exécuter les migrations TypeORM dans un projet ESM
 * Utilise tsx pour charger les fichiers TypeScript
 *
 * USAGE:
 * pnpm tsx scripts/run-migrations.ts
 *
 * AUTEUR: Équipe CROU
 * DATE: Janvier 2025
 */

import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Obtenir le chemin du fichier actuel en ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Charger les variables d'environnement
dotenv.config({ path: join(__dirname, '../../../.env') });

// Configuration du DataSource
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

  // Entités
  entities: [
    join(__dirname, '../src/entities/**/*.entity.ts'),
    join(__dirname, '../src/entities/*.entity.ts')
  ],

  // Migrations
  migrations: [
    join(__dirname, '../src/migrations/**/*.ts'),
    join(__dirname, '../src/migrations/*.ts')
  ],

  // Configuration
  synchronize: false,
  logging: ['error', 'warn', 'migration'],
  logger: 'advanced-console',
  migrationsTableName: '_migrations_history'
});

// Fonction principale
async function runMigrations() {
  try {
    console.log('🔄 Connexion à la base de données...');
    await AppDataSource.initialize();
    console.log('✅ Connexion établie');
    console.log('');

    console.log('🚀 Exécution des migrations...');
    const migrations = await AppDataSource.runMigrations({ transaction: 'all' });

    if (migrations.length === 0) {
      console.log('✅ Aucune migration à exécuter - Base de données à jour');
    } else {
      console.log(`✅ ${migrations.length} migration(s) exécutée(s) avec succès:`);
      migrations.forEach(migration => {
        console.log(`   - ${migration.name}`);
      });
    }

    await AppDataSource.destroy();
    console.log('');
    console.log('🔌 Connexion fermée');
    process.exit(0);

  } catch (error) {
    console.error('');
    console.error('❌ Erreur lors de l\'exécution des migrations:');
    console.error(error);
    console.error('');
    process.exit(1);
  }
}

// Exécuter
runMigrations();

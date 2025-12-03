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

// Validation des variables d'environnement requises
const requiredEnvVars = ['DB_HOST', 'DB_PORT', 'DB_USER', 'DB_PASSWORD', 'DB_NAME'];
const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingVars.length > 0) {
  console.error(`❌ Variables d'environnement manquantes: ${missingVars.join(', ')}`);
  console.error('Veuillez les définir dans votre fichier .env');
  process.exit(1);
}

// Configuration du DataSource
const AppDataSource = new DataSource({
  type: 'postgres',

  // Configuration connexion - Pas de valeurs par défaut pour la sécurité
  host: process.env.DB_HOST!,
  port: parseInt(process.env.DB_PORT!),
  username: process.env.DB_USER!,
  password: process.env.DB_PASSWORD!,
  database: process.env.DB_NAME!,

  // SSL
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,

  // Entités
  entities: [
    join(__dirname, '../src/entities/**/*.entity.ts')
  ],

  // Migrations
  migrations: [
    join(__dirname, '../src/migrations/**/*.ts')
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

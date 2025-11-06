/**
 * FICHIER: packages/database/scripts/show-migrations.ts
 * SCRIPT: Affiche l'état des migrations
 *
 * DESCRIPTION:
 * Script pour afficher quelles migrations ont été exécutées
 *
 * USAGE:
 * pnpm tsx scripts/show-migrations.ts
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
    join(__dirname, '../src/entities/**/*.entity.ts')
  ],

  // Migrations
  migrations: [
    join(__dirname, '../src/migrations/**/*.ts')
  ],

  // Configuration
  synchronize: false,
  logging: false,
  migrationsTableName: '_migrations_history'
});

// Fonction principale
async function showMigrations() {
  try {
    console.log('🔄 Connexion à la base de données...');
    await AppDataSource.initialize();
    console.log('✅ Connexion établie');
    console.log('');

    const executedMigrations = await AppDataSource.showMigrations();
    const allMigrations = AppDataSource.migrations;

    console.log('📊 État des migrations:');
    console.log('');
    console.log(`Total migrations définies: ${allMigrations.length}`);

    if (executedMigrations) {
      console.log('⚠️  Migrations en attente d\'exécution');
    } else {
      console.log('✅ Toutes les migrations sont à jour');
    }

    console.log('');
    console.log('📋 Liste des migrations:');

    // Récupérer les migrations exécutées
    const queryRunner = AppDataSource.createQueryRunner();
    let executed: any[] = [];

    try {
      executed = await queryRunner.query(
        `SELECT * FROM ${AppDataSource.options.migrationsTableName || 'migrations'} ORDER BY timestamp ASC`
      );
    } catch (error) {
      console.log('ℹ️  Table de migrations non créée encore');
    } finally {
      await queryRunner.release();
    }

    const executedNames = new Set(executed.map((m: any) => m.name));

    allMigrations.forEach((migration) => {
      const name = migration.name || migration.constructor.name;
      const isExecuted = executedNames.has(name);
      const status = isExecuted ? '✅' : '⏳';
      console.log(`   ${status} ${name}`);
    });

    await AppDataSource.destroy();
    console.log('');
    console.log('🔌 Connexion fermée');
    process.exit(0);

  } catch (error) {
    console.error('');
    console.error('❌ Erreur:');
    console.error(error);
    console.error('');
    process.exit(1);
  }
}

// Exécuter
showMigrations();

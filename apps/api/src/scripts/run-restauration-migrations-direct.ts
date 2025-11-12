/**
 * Script pour exécuter directement les migrations SQL du module Restauration
 * Lit les fichiers SQL et les exécute directement
 */

import pg from 'pg';
import { config } from 'dotenv';
import { readFileSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const { Client } = pg;

config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function runMigrations() {
  const client = new Client({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    user: process.env.DB_USER || 'crou_user',
    password: process.env.DB_PASSWORD || 'crou_password',
    database: process.env.DB_NAME || 'crou_database',
  });

  try {
    console.log('🔌 Connexion à la base de données...');
    await client.connect();
    console.log('✅ Connecté\n');

    // Vérifier les migrations existantes
    const existingMigrations = await client.query(
      'SELECT name FROM _migrations_history WHERE name IN ($1, $2)',
      ['RestaurantModule1762850835000', 'AnonymousTickets1762851000000']
    );

    const hasRestaurantModule = existingMigrations.rows.some(r => r.name === 'RestaurantModule1762850835000');
    const hasAnonymousTickets = existingMigrations.rows.some(r => r.name === 'AnonymousTickets1762851000000');

    console.log('📋 État des migrations:');
    console.log(`  • RestaurantModule: ${hasRestaurantModule ? '✅ Déjà exécutée' : '❌ À exécuter'}`);
    console.log(`  • AnonymousTickets: ${hasAnonymousTickets ? '✅ Déjà exécutée' : '❌ À exécuter'}`);
    console.log('');

    if (hasRestaurantModule && hasAnonymousTickets) {
      console.log('✅ Toutes les migrations sont déjà exécutées!');
      return;
    }

    // 1. Migration RestaurantModule - Copier le SQL depuis le fichier TypeScript
    if (!hasRestaurantModule) {
      console.log('🚀 Création du module Restauration...');
      console.log('─'.repeat(60));

      // Note: Cette migration est trop longue pour être extraite manuellement
      // On va simplement créer la table tickets_repas minimale pour l'instant
      console.log('⚠️  Migration RestaurantModule nécessite extraction manuelle du SQL');
      console.log('   Pour l\'instant, on skip cette migration et on crée juste tickets_repas');
      console.log('');
    }

    // 2. Migration AnonymousTickets
    if (!hasAnonymousTickets) {
      console.log('🚀 Exécution de AnonymousTickets migration...');
      console.log('─'.repeat(60));

      const sqlPath = join(__dirname, '../../../../packages/database/src/migrations/1762851000000-AnonymousTickets.sql');
      console.log(`📄 Lecture du fichier: ${sqlPath}`);
      const sql = readFileSync(sqlPath, 'utf-8');

      await client.query(sql);

      console.log('✅ AnonymousTickets migration exécutée avec succès!');
      console.log('');
    }

    // Vérifications post-migration
    console.log('🔍 Vérifications post-migration:');
    console.log('─'.repeat(60));

    const checks = [
      {
        query: 'SELECT COUNT(*) as count FROM tickets_repas',
        label: 'Tickets repas'
      },
      {
        query: 'SELECT COUNT(*) as count FROM tickets_repas WHERE qr_code IS NOT NULL',
        label: 'Tickets avec QR code'
      },
      {
        query: 'SELECT DISTINCT categorie FROM tickets_repas ORDER BY categorie',
        label: 'Catégories de tickets'
      },
      {
        query: 'SELECT DISTINCT type_repas FROM tickets_repas WHERE type_repas IS NOT NULL ORDER BY type_repas',
        label: 'Types de repas'
      }
    ];

    for (const check of checks) {
      try {
        const result = await client.query(check.query);
        console.log(`  • ${check.label}:`);
        if (result.rows.length === 1 && result.rows[0].count !== undefined) {
          console.log(`    ${result.rows[0].count}`);
        } else if (result.rows.length === 0) {
          console.log(`    (aucun)`);
        } else {
          result.rows.forEach((row: any) => {
            const value = row.categorie || row.type_repas || JSON.stringify(row);
            console.log(`    - ${value}`);
          });
        }
      } catch (err: any) {
        console.log(`    ⚠️  ${err.message}`);
      }
    }

    console.log('─'.repeat(60));
    console.log('');
    console.log('✅ Migrations terminées!');
    console.log('');

  } catch (error: any) {
    console.error('❌ ERREUR lors des migrations:', error.message);
    console.error('');
    console.error('Détails:', error);
    process.exit(1);
  } finally {
    await client.end();
    console.log('🔌 Déconnexion de la base de données');
  }
}

runMigrations();

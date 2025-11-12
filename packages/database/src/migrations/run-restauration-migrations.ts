/**
 * Script pour exécuter les migrations du module Restauration
 * Contourne le problème de dépendances circulaires TypeORM
 *
 * Exécute dans l'ordre:
 * 1. RestaurantModule migration (création tables avec ancien schéma)
 * 2. AnonymousTickets migration (transformation vers tickets anonymes)
 */

import pg from 'pg';
import { config } from 'dotenv';

const { Client } = pg;

// Charger les variables d'environnement
config();

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

    // Importer les migrations TypeScript
    const { RestaurantModule1762850835000 } = await import('./1762850835000-RestaurantModule.js');
    const { AnonymousTickets1762851000000 } = await import('./1762851000000-AnonymousTickets.js');

    // Créer un QueryRunner simplifié
    const queryRunner = {
      query: async (sql: string) => {
        return await client.query(sql);
      }
    };

    // 1. Exécuter RestaurantModule si nécessaire
    if (!hasRestaurantModule) {
      console.log('🚀 Exécution de RestaurantModule migration...');
      console.log('─'.repeat(60));

      const migration1 = new RestaurantModule1762850835000();
      await migration1.up(queryRunner as any);

      // Enregistrer dans l'historique
      await client.query(
        'INSERT INTO _migrations_history (timestamp, name) VALUES ($1, $2)',
        [1762850835000, 'RestaurantModule1762850835000']
      );

      console.log('✅ RestaurantModule migration exécutée avec succès!');
      console.log('');
    }

    // 2. Exécuter AnonymousTickets si nécessaire
    if (!hasAnonymousTickets) {
      console.log('🚀 Exécution de AnonymousTickets migration...');
      console.log('─'.repeat(60));

      const migration2 = new AnonymousTickets1762851000000();
      await migration2.up(queryRunner as any);

      // Enregistrer dans l'historique
      await client.query(
        'INSERT INTO _migrations_history (timestamp, name) VALUES ($1, $2)',
        [1762851000000, 'AnonymousTickets1762851000000']
      );

      console.log('✅ AnonymousTickets migration exécutée avec succès!');
      console.log('');
    }

    if (hasRestaurantModule && hasAnonymousTickets) {
      console.log('✅ Toutes les migrations sont déjà exécutées!');
      console.log('');
    }

    // Vérifications post-migration
    console.log('🔍 Vérifications post-migration:');
    console.log('─'.repeat(60));

    const checks = [
      {
        query: 'SELECT COUNT(*) as count FROM restaurants',
        label: 'Restaurants'
      },
      {
        query: 'SELECT COUNT(*) as count FROM menus',
        label: 'Menus'
      },
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
    console.log('✅ Migrations Restauration terminées avec succès!');
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

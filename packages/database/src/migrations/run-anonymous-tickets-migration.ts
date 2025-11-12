/**
 * Script d'exécution de la migration AnonymousTickets
 * Contourne le problème de dépendances circulaires TypeORM
 */

import pg from 'pg';
import { config } from 'dotenv';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const { Client } = pg;

// Charger les variables d'environnement
config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function runMigration() {
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
    console.log('✅ Connecté');

    // Lire le fichier SQL
    const sqlPath = join(__dirname, '1762851000000-AnonymousTickets.sql');
    console.log(`📄 Lecture du fichier: ${sqlPath}`);
    const sql = readFileSync(sqlPath, 'utf-8');

    console.log('🚀 Exécution de la migration AnonymousTickets...');
    console.log('─'.repeat(60));

    await client.query(sql);

    console.log('─'.repeat(60));
    console.log('✅ Migration exécutée avec succès!');
    console.log('');

    // Vérifications
    console.log('🔍 Vérifications post-migration:');
    console.log('');

    // Vérifier si la colonne etudiant_id existe avant de l'utiliser dans les vérifications
    const hasEtudiantId = await client.query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'tickets_repas' AND column_name = 'etudiant_id'
    `);

    const checks = [
      ...(hasEtudiantId.rows.length > 0 ? [{
        query: 'SELECT COUNT(*) as count FROM tickets_repas WHERE etudiant_id IS NULL',
        label: 'Tickets avec etudiant_id NULL'
      }] : []),
      {
        query: 'SELECT COUNT(*) as count FROM tickets_repas WHERE qr_code IS NOT NULL',
        label: 'Tickets avec QR code'
      },
      {
        query: 'SELECT DISTINCT categorie FROM tickets_repas ORDER BY categorie',
        label: 'Catégories existantes'
      },
      {
        query: 'SELECT DISTINCT type_repas FROM tickets_repas ORDER BY type_repas',
        label: 'Types de repas existants'
      },
      {
        query: 'SELECT COUNT(*) as count FROM tickets_repas',
        label: 'Total tickets'
      }
    ];

    for (const check of checks) {
      const result = await client.query(check.query);
      console.log(`  • ${check.label}:`);
      if (result.rows.length === 1 && result.rows[0].count !== undefined) {
        console.log(`    ${result.rows[0].count}`);
      } else {
        result.rows.forEach((row: any) => {
          const value = row.categorie || row.type_repas || JSON.stringify(row);
          console.log(`    - ${value}`);
        });
      }
    }

    console.log('');
    console.log('✅ Migration AnonymousTickets terminée avec succès!');
    console.log('');

  } catch (error) {
    console.error('❌ ERREUR lors de la migration:', error);
    process.exit(1);
  } finally {
    await client.end();
    console.log('🔌 Déconnexion de la base de données');
  }
}

// MIGRATION AUTOMATIQUE DÉSACTIVÉE - Les tables existent déjà avec les bonnes colonnes
// Décommenter cette ligne si vous devez réexécuter la migration manuellement
// runMigration();

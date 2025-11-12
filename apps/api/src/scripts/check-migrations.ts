import pg from 'pg';
import { config } from 'dotenv';

config();

const { Client } = pg;

async function checkMigrations() {
  const client = new Client({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    user: process.env.DB_USER || 'crou_user',
    password: process.env.DB_PASSWORD || 'crou_password',
    database: process.env.DB_NAME || 'crou_database',
  });

  try {
    await client.connect();
    console.log('✅ Connecté à la base de données');

    const result = await client.query('SELECT * FROM _migrations_history ORDER BY timestamp');
    console.log('\n📋 Migrations exécutées:');
    console.log('─'.repeat(60));
    result.rows.forEach(r => {
      console.log(`  ${r.timestamp} - ${r.name}`);
    });
    console.log('─'.repeat(60));
    console.log(`\nTotal: ${result.rows.length} migration(s)\n`);

  } catch (error: any) {
    console.error('❌ ERREUR:', error.message);
  } finally {
    await client.end();
  }
}

checkMigrations();

/**
 * Script pour nettoyer complètement la base de données
 * ATTENTION: Supprime toutes les tables et données!
 */

const { Client } = require('pg');
require('dotenv').config();

async function cleanDatabase() {
  const client = new Client({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    user: process.env.DB_USER || 'crou_user',
    password: process.env.DB_PASSWORD || 'crou_password',
    database: process.env.DB_NAME || 'crou_database',
  });

  try {
    await client.connect();
    console.log('✅ Connecté à PostgreSQL');

    // Supprimer le schéma public
    console.log('🔄 Suppression du schéma public...');
    await client.query('DROP SCHEMA IF EXISTS public CASCADE');

    // Recréer le schéma public
    console.log('🔄 Recréation du schéma public...');
    await client.query('CREATE SCHEMA public');

    // Donner les droits
    console.log('🔄 Attribution des droits...');
    await client.query('GRANT ALL ON SCHEMA public TO crou_user');
    await client.query('GRANT ALL ON SCHEMA public TO public');

    // Créer l'extension UUID
    console.log('🔄 Création de l\'extension UUID...');
    await client.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');

    console.log('');
    console.log('✅ Base de données nettoyée avec succès!');
    console.log('📊 Prêt pour les migrations');

  } catch (error) {
    console.error('❌ Erreur:', error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

cleanDatabase();

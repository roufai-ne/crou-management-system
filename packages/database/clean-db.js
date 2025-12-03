/**
 * Script pour nettoyer complètement la base de données
 * ATTENTION: Supprime toutes les tables et données!
 */

const { Client } = require('pg');
require('dotenv').config();

async function cleanDatabase() {
  // Validation des variables d'environnement requises
  const requiredEnvVars = ['DB_HOST', 'DB_PORT', 'DB_USER', 'DB_PASSWORD', 'DB_NAME'];
  const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

  if (missingVars.length > 0) {
    console.error(`❌ Variables d'environnement manquantes: ${missingVars.join(', ')}`);
    console.error('Veuillez les définir dans votre fichier .env');
    process.exit(1);
  }

  const client = new Client({
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
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

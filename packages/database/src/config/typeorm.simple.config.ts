/**
 * FICHIER: packages/database/src/config/typeorm.simple.config.ts
 * CONFIG: Configuration TypeORM simplifiée pour debug
 * 
 * DESCRIPTION:
 * Configuration simplifiée pour identifier les problèmes de métadonnées
 * 
 * AUTEUR: Équipe CROU
 * DATE: Décembre 2024
 */

import { DataSource, DataSourceOptions } from 'typeorm';
import { config } from 'dotenv';

// Configuration des variables d'environnement
config();

// Validation des variables d'environnement requises
const requiredEnvVars = ['DB_HOST', 'DB_PORT', 'DB_USER', 'DB_PASSWORD', 'DB_NAME'];
const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingVars.length > 0) {
  throw new Error(
    `❌ Variables d'environnement manquantes: ${missingVars.join(', ')}\n` +
    `Veuillez les définir dans votre fichier .env`
  );
}

// Configuration TypeORM simplifiée
export const simpleTypeormConfig: DataSourceOptions = {
  type: 'postgres',
  host: process.env.DB_HOST!,
  port: parseInt(process.env.DB_PORT!),
  username: process.env.DB_USER!,
  password: process.env.DB_PASSWORD!,
  database: process.env.DB_NAME!,
  
  // Entités de base seulement
  entities: [
    require('../entities/User.entity').User,
    require('../entities/Tenant.entity').Tenant,
    require('../entities/AuditLog.entity').AuditLog,
    require('../entities/RefreshToken.entity').RefreshToken,
  ],
  
  synchronize: true,
  logging: true
};

// Instance DataSource simplifiée
export const SimpleDataSource = new DataSource(simpleTypeormConfig);

// Test de connexion
export const testSimpleConnection = async (): Promise<void> => {
  try {
    console.log('🔄 Test connexion simplifiée...');
    
    if (!SimpleDataSource.isInitialized) {
      await SimpleDataSource.initialize();
      console.log('✅ Connexion établie');
    }
    
    // Tester les métadonnées
    const userMetadata = SimpleDataSource.getMetadata('User');
    console.log('✅ User metadata:', userMetadata.tableName);
    
    const tenantMetadata = SimpleDataSource.getMetadata('Tenant');
    console.log('✅ Tenant metadata:', tenantMetadata.tableName);
    
    console.log('🎉 Test simple réussi !');
    
  } catch (error) {
    console.error('❌ Erreur test simple:', error);
    throw error;
  } finally {
    if (SimpleDataSource.isInitialized) {
      await SimpleDataSource.destroy();
      console.log('🔌 Connexion fermée');
    }
  }
};
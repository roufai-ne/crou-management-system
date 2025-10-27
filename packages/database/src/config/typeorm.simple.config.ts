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

// Configuration TypeORM simplifiée
export const simpleTypeormConfig: DataSourceOptions = {
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  username: process.env.DB_USER || 'crou_user',
  password: process.env.DB_PASSWORD || 'crou_password',
  database: process.env.DB_NAME || 'crou_database',
  
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
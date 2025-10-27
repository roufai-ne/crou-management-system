/**
 * FICHIER: apps\api\src\test\global-teardown.ts
 * TEARDOWN: Nettoyage global des tests
 * 
 * DESCRIPTION:
 * Nettoyage global après les tests d'intégration
 * Fermeture de la base de données de test
 * 
 * AUTEUR: Équipe CROU
 * DATE: Décembre 2024
 */

import { AppDataSource } from '../config/database';
import { logger } from '../shared/utils/logger';

export default async function globalTeardown() {
  try {
    logger.info('Nettoyage de la base de données de test...');
    
    if (AppDataSource.isInitialized) {
      // Nettoyer toutes les tables
      await cleanAllTables();
      
      // Fermer la connexion
      await AppDataSource.destroy();
    }
    
    logger.info('Base de données de test nettoyée avec succès');
  } catch (error) {
    logger.error('Erreur nettoyage base de données de test:', error);
    throw error;
  }
}

async function cleanAllTables() {
  try {
    // Obtenir toutes les tables
    const entities = AppDataSource.entityMetadatas;
    const tableNames = entities
      .map(entity => `"${entity.tableName}"`)
      .join(', ');
    
    if (tableNames) {
      // Désactiver les contraintes de clé étrangère
      await AppDataSource.query('SET session_replication_role = replica');
      
      // Vider toutes les tables
      await AppDataSource.query(`TRUNCATE TABLE ${tableNames} RESTART IDENTITY CASCADE`);
      
      // Réactiver les contraintes de clé étrangère
      await AppDataSource.query('SET session_replication_role = DEFAULT');
    }
    
    logger.info('Toutes les tables nettoyées');
  } catch (error) {
    logger.error('Erreur nettoyage tables:', error);
    throw error;
  }
}

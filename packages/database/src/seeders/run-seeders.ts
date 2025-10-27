/**
 * FICHIER: packages\database\src\seeders\run-seeders.ts
 * SCRIPT: Exécution de tous les seeders
 */

import { AppDataSource } from '../config/typeorm.config';
// import { seedTenants } from './tenant.seeder';
// import { seedUsers } from './user.seeder';

async function runAllSeeders() {
  try {
    console.log('🌱 Démarrage des seeders CROU...');
    
    // Initialiser la connexion si nécessaire
    if (!AppDataSource.isInitialized) {
      console.log('🔌 Initialisation connexion base...');
      await AppDataSource.initialize();
      console.log('✅ Connexion établie');
    }

    // TODO: Implémenter les seeders
    console.log('📊 Seeders temporairement désactivés...');
    // await seedTenants(AppDataSource);
    // await seedUsers(AppDataSource);

    console.log('✅ Base de données initialisée !');
    
  } catch (error: any) {
    console.error('❌ Erreur lors de l\'exécution des seeders:', error);
    console.error('Stack trace:', error.stack);
    process.exit(1);
  } finally {
    // Fermer la connexion proprement
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
      console.log('🔌 Connexion fermée');
    }
  }
}

// Exécuter si appelé directement
if (import.meta.url === `file://${process.argv[1]}`) {
  runAllSeeders().catch(console.error);
}

export { runAllSeeders };
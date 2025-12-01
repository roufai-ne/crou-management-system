/**
 * Script pour exécuter les seeds manuellement
 */

import { AppDataSource } from '../src/config/datasource';
import { runAllSeeds } from '../src/seeds';

async function main() {
  try {
    console.log('🔄 Connexion à la base de données...');
    
    await AppDataSource.initialize();
    console.log('✅ Connexion établie\n');

    await runAllSeeds(AppDataSource);

    await AppDataSource.destroy();
    console.log('\n🔌 Connexion fermée');
    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur:', error);
    process.exit(1);
  }
}

main();

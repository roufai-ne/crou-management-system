/**
 * FICHIER: packages/database/src/seeds/index.ts
 * SEED: Fichier principal d'exécution des seeds
 *
 * DESCRIPTION:
 * Exécute tous les seeds dans l'ordre correct
 * Peut être appelé depuis l'application ou en ligne de commande
 *
 * ORDRE D'EXÉCUTION:
 * 1. Tenants (organisations)
 * 2. Roles & Permissions
 * 3. Users (utilisateurs initiaux)
 * 4. Test Data (données de test - dev uniquement)
 *
 * USAGE:
 * - Depuis l'app: import { runAllSeeds } from './seeds';
 * - CLI: pnpm seed:run
 *
 * AUTEUR: Équipe CROU
 * DATE: Octobre 2025
 */

import { DataSource } from 'typeorm';
import { seedTenants } from './001-tenants.seed';
import { seedRolesAndPermissions } from './002-roles-permissions.seed';
import { seedUsers } from './003-users.seed';
import { seedTestData } from './004-test-data.seed';

/**
 * Exécute tous les seeds dans l'ordre
 */
export const runAllSeeds = async (dataSource: DataSource): Promise<void> => {
  console.log('');
  console.log('========================================');
  console.log('🌱 SEEDS CROU - Initialisation');
  console.log('========================================');
  console.log('');

  const startTime = Date.now();

  try {
    // 1. Seeds des Tenants
    console.log('📦 Étape 1/4: Création des organisations...');
    await seedTenants(dataSource);
    console.log('');

    // 2. Seeds des Rôles et Permissions
    console.log('🔐 Étape 2/4: Création des rôles et permissions...');
    await seedRolesAndPermissions(dataSource);
    console.log('');

    // 3. Seeds des Utilisateurs
    console.log('👥 Étape 3/4: Création des utilisateurs...');
    await seedUsers(dataSource);
    console.log('');

    // 4. Seeds des données de test (optionnel, dev uniquement)
    console.log('🧪 Étape 4/4: Création des données de test (dev uniquement)...');
    await seedTestData(dataSource);
    console.log('');

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);

    console.log('========================================');
    console.log('✅ SEEDS COMPLÉTÉS AVEC SUCCÈS');
    console.log('========================================');
    console.log('');
    console.log('📊 RÉSUMÉ:');
    console.log(`   ⏱️  Temps d'exécution: ${duration}s`);
    console.log('   🏢 Organisations: 9 (1 Ministère + 8 CROU)');
    console.log('   🔐 Rôles: 8');
    console.log('   🎫 Permissions: 40');
    console.log('   👤 Utilisateurs: 26');
    if (process.env.NODE_ENV !== 'production') {
      console.log('   🧪 Données de test: Créées');
    }
    console.log('');
    console.log('🔑 ACCÈS SUPER ADMIN:');
    console.log('   Email: admin@crou.ne');
    console.log('   Mot de passe: Admin@2025!');
    console.log('');
    console.log('⚠️  IMPORTANT:');
    console.log('   - Changer les mots de passe par défaut');
    console.log('   - Configurer les emails de notification');
    console.log('   - Vérifier les permissions de chaque rôle');
    console.log('');

  } catch (error) {
    console.error('');
    console.error('========================================');
    console.error('❌ ERREUR LORS DES SEEDS');
    console.error('========================================');
    console.error(error);
    console.error('');
    throw error;
  }
};

/**
 * Script CLI pour exécuter les seeds
 */
export const runSeedsFromCLI = async (): Promise<void> => {
  // Import dynamique pour éviter les erreurs de dépendances circulaires
  const { AppDataSource } = await import('../config/datasource');

  try {
    console.log('🔄 Connexion à la base de données...');

    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
    }

    console.log('✅ Connexion établie');
    console.log('');

    await runAllSeeds(AppDataSource);

    await AppDataSource.destroy();
    console.log('🔌 Connexion fermée');
    process.exit(0);

  } catch (error) {
    console.error('❌ Erreur fatale:', error);
    process.exit(1);
  }
};

// Exécution si appelé directement
if (require.main === module) {
  runSeedsFromCLI();
}

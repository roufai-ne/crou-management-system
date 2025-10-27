/**
 * FICHIER: packages\database\src\seeders\run-rbac-seeders.ts
 * SEEDER: Orchestrateur des seeders RBAC
 * 
 * DESCRIPTION:
 * Script principal pour exécuter tous les seeders RBAC dans le bon ordre
 * 1. Tenants (déjà existants)
 * 2. Rôles système
 * 3. Permissions granulaires
 * 4. Liaison rôles-permissions
 * 5. Utilisateurs avec rôles RBAC
 * 
 * ORDRE D'EXÉCUTION CRITIQUE:
 * Les rôles doivent être créés avant les permissions
 * Les permissions doivent être liées aux rôles avant les utilisateurs
 * Les utilisateurs doivent référencer des rôles existants
 * 
 * USAGE:
 * npm run db:seed-rbac
 * ou directement: tsx src/seeders/run-rbac-seeders.ts
 * 
 * AUTEUR: Équipe CROU
 * DATE: Décembre 2024
 */

import { AppDataSource } from '../config/typeorm.config';
import { seedTenants } from './tenant.seeder';
import { seedRoles } from './role.seeder';
import { seedPermissions } from './permission.seeder';
import { seedUsersRBAC } from './user-rbac.seeder';

async function runRBACseeders(): Promise<void> {
  try {
    console.log('🌱 Démarrage des seeders RBAC...');
    console.log('=====================================');

    // Initialiser la connexion à la base de données
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
      console.log('✅ Connexion base de données établie');
    }

    // 1. Seeders des tenants (déjà existants normalement)
    console.log('\n📋 1. Vérification des tenants...');
    await seedTenants(AppDataSource);

    // 2. Seeders des rôles système
    console.log('\n👥 2. Création des rôles système...');
    await seedRoles(AppDataSource);

    // 3. Seeders des permissions granulaires avec liaison aux rôles
    console.log('\n🔐 3. Création des permissions et liaison aux rôles...');
    await seedPermissions(AppDataSource);

    // 4. Seeders des utilisateurs avec rôles RBAC
    console.log('\n👤 4. Création des utilisateurs RBAC...');
    await seedUsersRBAC(AppDataSource);

    console.log('\n=====================================');
    console.log('✅ Tous les seeders RBAC terminés avec succès !');
    console.log('\n📊 Résumé:');
    
    // Statistiques finales
    const roleRepository = AppDataSource.getRepository('Role');
    const permissionRepository = AppDataSource.getRepository('Permission');
    const userRepository = AppDataSource.getRepository('User');
    
    const roleCount = await roleRepository.count();
    const permissionCount = await permissionRepository.count();
    const userCount = await userRepository.count();
    
    console.log(`   - ${roleCount} rôles système créés`);
    console.log(`   - ${permissionCount} permissions granulaires créées`);
    console.log(`   - ${userCount} utilisateurs avec rôles RBAC`);
    
    console.log('\n🎯 Le système RBAC est maintenant opérationnel !');
    console.log('   Vous pouvez maintenant tester l\'authentification avec:');
    console.log('   - ministre@mesrit.gov.ne / password123');
    console.log('   - directeur@crou_niamey.gov.ne / password123');
    console.log('   - comptable@crou_dosso.gov.ne / password123');

  } catch (error) {
    console.error('❌ Erreur lors de l\'exécution des seeders RBAC:', error);
    throw error;
  } finally {
    // Fermer la connexion
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
      console.log('🔌 Connexion base de données fermée');
    }
  }
}

// Exécuter les seeders si ce fichier est appelé directement
if (require.main === module) {
  runRBACseeders()
    .then(() => {
      console.log('🎉 Seeders RBAC terminés !');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Échec des seeders RBAC:', error);
      process.exit(1);
    });
}

export { runRBACseeders };
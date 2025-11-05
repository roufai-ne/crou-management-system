/**
 * SCRIPT: fix-ministre-permissions.ts
 * FIX: Corriger les permissions du rôle Ministre
 *
 * DESCRIPTION:
 * Ce script met à jour les permissions du rôle Ministre
 * pour lui donner TOUTES les permissions disponibles
 *
 * USAGE:
 * pnpm run fix:ministre-permissions
 *
 * AUTEUR: Claude Code
 * DATE: 2025-11-05
 */

import { AppDataSource } from '../../../../packages/database/src/config/typeorm.config';
import { Role } from '../../../../packages/database/src/entities/Role.entity';
import { Permission } from '../../../../packages/database/src/entities/Permission.entity';

async function fixMinistrePermissions() {
  try {
    console.log('🔄 Initialisation de la connexion à la base de données...');

    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
    }

    console.log('✅ Connexion établie\n');

    const roleRepository = AppDataSource.getRepository(Role);
    const permissionRepository = AppDataSource.getRepository(Permission);

    // 1. Récupérer le rôle Ministre
    console.log('🔍 Recherche du rôle Ministre...');
    const ministre = await roleRepository.findOne({
      where: { name: 'Ministre' },
      relations: ['permissions']
    });

    if (!ministre) {
      console.error('❌ Rôle Ministre non trouvé!');
      console.log('   Assurez-vous que les seeds ont été exécutés.');
      process.exit(1);
    }

    console.log(`✅ Rôle Ministre trouvé (ID: ${ministre.id})`);
    console.log(`   Permissions actuelles: ${ministre.permissions?.length || 0}\n`);

    // 2. Récupérer toutes les permissions
    console.log('🔍 Récupération de toutes les permissions...');
    const allPermissions = await permissionRepository.find();

    console.log(`✅ ${allPermissions.length} permissions trouvées\n`);

    // 3. Assigner toutes les permissions au Ministre
    console.log('🔧 Attribution de toutes les permissions au Ministre...');
    ministre.permissions = allPermissions;
    await roleRepository.save(ministre);

    console.log('✅ Permissions mises à jour avec succès!\n');

    // 4. Afficher le résultat
    console.log('📊 RÉSUMÉ:');
    console.log(`   Rôle: ${ministre.name}`);
    console.log(`   Total permissions: ${ministre.permissions.length}`);
    console.log('\n   Permissions par ressource:');

    const permissionsByResource = new Map<string, number>();
    ministre.permissions.forEach(p => {
      const count = permissionsByResource.get(p.resource) || 0;
      permissionsByResource.set(p.resource, count + 1);
    });

    permissionsByResource.forEach((count, resource) => {
      console.log(`   - ${resource}: ${count} permission(s)`);
    });

    console.log('\n✅ SUCCÈS: Le Ministre a maintenant accès à toutes les fonctionnalités!');
    console.log('   Les administrateurs peuvent maintenant se connecter sans erreur 403.\n');

    await AppDataSource.destroy();
    process.exit(0);

  } catch (error) {
    console.error('\n❌ ERREUR lors de la mise à jour des permissions:', error);
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
    }
    process.exit(1);
  }
}

// Exécuter le script
fixMinistrePermissions();

/**
 * Script de correction: Assigne un tenant aux utilisateurs qui n'en ont pas
 */

import 'reflect-metadata';
import { config } from 'dotenv';
import { initializeDatabase, closeDatabase } from '../../../../packages/database/src/config/typeorm.config';
import { AppDataSource } from '../../../../packages/database/src/config/typeorm.config';
import { User } from '../../../../packages/database/src/entities/User.entity';
import { Tenant, TenantType } from '../../../../packages/database/src/entities/Tenant.entity';

config();

async function fixUsersTenant() {
  console.log('🔧 Correction des utilisateurs sans tenant...\n');

  try {
    await initializeDatabase();

    const userRepository = AppDataSource.getRepository(User);
    const tenantRepository = AppDataSource.getRepository(Tenant);

    // Trouver les utilisateurs sans tenant
    const usersWithoutTenant = await userRepository
      .createQueryBuilder('user')
      .where('user.tenantId IS NULL')
      .getMany();

    if (usersWithoutTenant.length === 0) {
      console.log('✅ Aucun utilisateur sans tenant. Tout est OK!');
      return;
    }

    console.log(`⚠️  ${usersWithoutTenant.length} utilisateur(s) sans tenant trouvé(s):\n`);
    usersWithoutTenant.forEach(user => {
      console.log(`   - ${user.email}`);
    });
    console.log('');

    // Trouver le tenant Ministère ou le premier tenant disponible
    let defaultTenant = await tenantRepository.findOne({
      where: { type: TenantType.MINISTERE }
    });

    if (!defaultTenant) {
      console.log('⚠️  Pas de tenant Ministère trouvé, utilisation du premier tenant disponible...');
      const tenants = await tenantRepository.find();
      defaultTenant = tenants[0];
    }

    if (!defaultTenant) {
      console.error('❌ Aucun tenant disponible! Exécutez d\'abord les seeders de tenants.');
      console.error('   npm run db:seed');
      return;
    }

    console.log(`📌 Tenant par défaut sélectionné: ${defaultTenant.name} (${defaultTenant.code})\n`);

    // Demander confirmation
    console.log('🔄 Assignation en cours...\n');

    // Assigner le tenant à tous les utilisateurs sans tenant
    for (const user of usersWithoutTenant) {
      user.tenantId = defaultTenant.id;
      user.updatedBy = 'system-fix';
      await userRepository.save(user);
      console.log(`✅ ${user.email} → ${defaultTenant.name}`);
    }

    console.log(`\n✅ ${usersWithoutTenant.length} utilisateur(s) corrigé(s)!`);
    console.log('\n💡 Conseils:');
    console.log('   - Vérifiez que les utilisateurs sont assignés aux bons tenants');
    console.log('   - Relancez le serveur pour appliquer les changements');
    console.log('   - Les utilisateurs peuvent maintenant se connecter sans erreur\n');

  } catch (error) {
    console.error('❌ Erreur:', error);
  } finally {
    await closeDatabase();
  }
}

fixUsersTenant();

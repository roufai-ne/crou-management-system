/**
 * Script de diagnostic des utilisateurs
 * Vérifie que les users ont bien des tenants associés
 */

import 'reflect-metadata';
import { config } from 'dotenv';
import { initializeDatabase, closeDatabase } from '../../../../packages/database/src/config/typeorm.config';
import { AppDataSource } from '../../../../packages/database/src/config/typeorm.config';
import { User } from '../../../../packages/database/src/entities/User.entity';
import { Tenant } from '../../../../packages/database/src/entities/Tenant.entity';

config();

async function diagnoseUsers() {
  console.log('🔍 Diagnostic des utilisateurs...\n');

  try {
    await initializeDatabase();

    const userRepository = AppDataSource.getRepository(User);
    const tenantRepository = AppDataSource.getRepository(Tenant);

    // Compter les utilisateurs
    const totalUsers = await userRepository.count();
    console.log(`📊 Total utilisateurs: ${totalUsers}`);

    // Compter les tenants
    const totalTenants = await tenantRepository.count();
    console.log(`📊 Total tenants: ${totalTenants}\n`);

    // Utilisateurs AVEC tenant
    const usersWithTenant = await userRepository
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.tenant', 'tenant')
      .leftJoinAndSelect('user.role', 'role')
      .where('user.tenantId IS NOT NULL')
      .getMany();

    console.log(`✅ Utilisateurs avec tenant: ${usersWithTenant.length}`);
    usersWithTenant.slice(0, 5).forEach(user => {
      console.log(`   - ${user.email} → ${user.tenant?.name || 'N/A'} (${user.role?.name || 'No role'})`);
    });
    if (usersWithTenant.length > 5) {
      console.log(`   ... et ${usersWithTenant.length - 5} autres\n`);
    } else {
      console.log('');
    }

    // Utilisateurs SANS tenant
    const usersWithoutTenant = await userRepository
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.role', 'role')
      .where('user.tenantId IS NULL')
      .getMany();

    if (usersWithoutTenant.length > 0) {
      console.log(`⚠️  Utilisateurs SANS tenant: ${usersWithoutTenant.length}`);
      usersWithoutTenant.forEach(user => {
        console.log(`   - ${user.email} (${user.role?.name || 'No role'}) - ID: ${user.id}`);
      });
      console.log('');
      console.log('💡 Ces utilisateurs causeront des erreurs "tenant requis"');
      console.log('   Solution: Associer ces utilisateurs à un tenant\n');
    } else {
      console.log(`✅ Tous les utilisateurs ont un tenant assigné\n`);
    }

    // Liste des tenants
    const tenants = await tenantRepository.find();
    console.log('📋 Tenants disponibles:');
    tenants.forEach(tenant => {
      console.log(`   - ${tenant.name} (${tenant.code}) - Type: ${tenant.type}`);
    });
    console.log('');

    // Recommandations
    if (usersWithoutTenant.length > 0) {
      console.log('🔧 CORRECTION NÉCESSAIRE:');
      console.log('   Exécutez ce SQL pour assigner un tenant par défaut:\n');

      const defaultTenant = tenants.find(t => t.type === 'ministere') || tenants[0];
      if (defaultTenant) {
        console.log(`   UPDATE users SET tenant_id = '${defaultTenant.id}' WHERE tenant_id IS NULL;\n`);
      }

      console.log('   Ou supprimez ces utilisateurs et relancez les seeders:');
      console.log('   npm run db:reset\n');
    }

    console.log('✅ Diagnostic terminé');

  } catch (error) {
    console.error('❌ Erreur:', error);
  } finally {
    await closeDatabase();
  }
}

diagnoseUsers();

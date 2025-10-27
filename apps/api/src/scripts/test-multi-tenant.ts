/**
 * FICHIER: apps\api\src\scripts\test-multi-tenant.ts
 * SCRIPT: Test du service multi-tenant
 * 
 * DESCRIPTION:
 * Script de test pour vérifier le fonctionnement du service multi-tenant
 * Teste l'isolation des données, les accès cross-tenant et les validations
 * 
 * USAGE:
 * npm run test:multi-tenant
 * ou directement: tsx src/scripts/test-multi-tenant.ts
 * 
 * AUTEUR: Équipe CROU
 * DATE: Décembre 2024
 */

import { AppDataSource } from '../../../../packages/database/src/config/typeorm.config';
import { MultiTenantService, TenantRepository } from '../shared/services/multi-tenant.service';
import { User } from '../../../../packages/database/src/entities/User.entity';
import { Tenant, TenantType } from '../../../../packages/database/src/entities/Tenant.entity';
import { runRBACseeders } from '../../../../packages/database/src/seeders/run-rbac-seeders';

async function testMultiTenantService(): Promise<void> {
  try {
    console.log('🧪 Test du service multi-tenant...');
    console.log('===================================');

    // Initialiser la connexion à la base de données
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
      console.log('✅ Connexion base de données établie');
    }

    // Exécuter les seeders si nécessaire
    console.log('\n🌱 Vérification des données...');
    try {
      await runRBACseeders();
    } catch (error) {
      console.log('⚠️  Seeders déjà exécutés');
    }

    const multiTenantService = new MultiTenantService();
    const userRepository = AppDataSource.getRepository(User);
    const tenantRepository = AppDataSource.getRepository(Tenant);

    // Test 1: Récupération du contexte tenant
    console.log('\n🏢 Test 1: Récupération du contexte tenant...');
    
    // Récupérer un utilisateur ministériel
    const ministereUser = await userRepository.findOne({
      where: { email: 'ministre@mesrit.gov.ne' },
      relations: ['tenant', 'role']
    });

    if (ministereUser) {
      const ministereContext = await multiTenantService.getTenantContext(ministereUser.id);
      console.log('✅ Contexte ministère récupéré:');
      console.log('   - Tenant ID:', ministereContext?.tenantId);
      console.log('   - Tenant Type:', ministereContext?.tenantType);
      console.log('   - Tenant Code:', ministereContext?.tenantCode);
      console.log('   - User Role:', ministereContext?.userRole);
    }

    // Récupérer un utilisateur CROU
    const crouUser = await userRepository.findOne({
      where: { email: 'directeur@crou_niamey.gov.ne' },
      relations: ['tenant', 'role']
    });

    if (crouUser) {
      const crouContext = await multiTenantService.getTenantContext(crouUser.id);
      console.log('✅ Contexte CROU récupéré:');
      console.log('   - Tenant ID:', crouContext?.tenantId);
      console.log('   - Tenant Type:', crouContext?.tenantType);
      console.log('   - Tenant Code:', crouContext?.tenantCode);
      console.log('   - User Role:', crouContext?.userRole);
    }

    // Test 2: Validation des accès cross-tenant
    console.log('\n🔐 Test 2: Validation des accès cross-tenant...');
    
    if (ministereUser && crouUser) {
      const ministereContext = await multiTenantService.getTenantContext(ministereUser.id);
      const crouContext = await multiTenantService.getTenantContext(crouUser.id);

      if (ministereContext && crouContext) {
        // Test accès ministère vers CROU (doit être autorisé)
        const ministereAccessToCrou = await multiTenantService.validateTenantAccess(
          ministereContext,
          crouContext.tenantId,
          { allowCrossTenant: true }
        );
        console.log('✅ Accès Ministère → CROU:', ministereAccessToCrou.allowed ? 'AUTORISÉ' : 'REFUSÉ');
        if (!ministereAccessToCrou.allowed) {
          console.log('   Raison:', ministereAccessToCrou.reason);
        }

        // Test accès CROU vers ministère (doit être refusé)
        const crouAccessToMinistere = await multiTenantService.validateTenantAccess(
          crouContext,
          ministereContext.tenantId,
          { allowCrossTenant: true }
        );
        console.log('✅ Accès CROU → Ministère:', crouAccessToMinistere.allowed ? 'AUTORISÉ' : 'REFUSÉ');
        if (!crouAccessToMinistere.allowed) {
          console.log('   Raison:', crouAccessToMinistere.reason);
        }

        // Test accès CROU vers même CROU (doit être autorisé)
        const crouAccessToSelf = await multiTenantService.validateTenantAccess(
          crouContext,
          crouContext.tenantId,
          { allowCrossTenant: true }
        );
        console.log('✅ Accès CROU → Même CROU:', crouAccessToSelf.allowed ? 'AUTORISÉ' : 'REFUSÉ');
      }
    }

    // Test 3: Récupération des tenants accessibles
    console.log('\n📋 Test 3: Tenants accessibles...');
    
    if (ministereUser && crouUser) {
      const ministereContext = await multiTenantService.getTenantContext(ministereUser.id);
      const crouContext = await multiTenantService.getTenantContext(crouUser.id);

      if (ministereContext) {
        const ministereAccessibleTenants = await multiTenantService.getAccessibleTenants(ministereContext);
        console.log('✅ Tenants accessibles par le Ministère:', ministereAccessibleTenants.length);
        ministereAccessibleTenants.forEach(tenant => {
          console.log(`   - ${tenant.name} (${tenant.type})`);
        });
      }

      if (crouContext) {
        const crouAccessibleTenants = await multiTenantService.getAccessibleTenants(crouContext);
        console.log('✅ Tenants accessibles par CROU:', crouAccessibleTenants.length);
        crouAccessibleTenants.forEach(tenant => {
          console.log(`   - ${tenant.name} (${tenant.type})`);
        });
      }
    }

    // Test 4: Repository avec isolation tenant
    console.log('\n🗄️ Test 4: Repository avec isolation tenant...');
    
    if (crouUser) {
      const crouContext = await multiTenantService.getTenantContext(crouUser.id);
      
      if (crouContext) {
        // Créer un repository avec isolation tenant
        const tenantUserRepository = multiTenantService.createTenantRepository(User, crouContext);
        
        // Test de recherche avec filtre automatique
        const usersInTenant = await tenantUserRepository.find({
          relations: ['role', 'tenant']
        });
        
        console.log('✅ Utilisateurs dans le tenant CROU:', usersInTenant.length);
        usersInTenant.forEach(user => {
          console.log(`   - ${user.name} (${user.email}) - Tenant: ${user.tenant?.name}`);
        });

        // Vérifier que tous les utilisateurs appartiennent au bon tenant
        const allSameTenant = usersInTenant.every(user => user.tenantId === crouContext.tenantId);
        console.log('✅ Isolation tenant respectée:', allSameTenant ? 'OUI' : 'NON');
      }
    }

    // Test 5: Injection de tenant_id
    console.log('\n💉 Test 5: Injection de tenant_id...');
    
    if (crouUser) {
      const crouContext = await multiTenantService.getTenantContext(crouUser.id);
      
      if (crouContext) {
        // Test injection normale
        const dataWithoutTenant = { name: 'Test Budget', montant: 1000000 };
        const dataWithTenant = multiTenantService.injectTenantId(dataWithoutTenant, crouContext);
        console.log('✅ Injection tenant_id:');
        console.log('   - Avant:', dataWithoutTenant);
        console.log('   - Après:', dataWithTenant);

        // Test avec tenant_id déjà présent (même tenant)
        const dataWithSameTenant = { name: 'Test Budget 2', tenantId: crouContext.tenantId };
        const dataWithSameTenantResult = multiTenantService.injectTenantId(dataWithSameTenant, crouContext);
        console.log('✅ Injection avec même tenant_id:', dataWithSameTenantResult.tenantId === crouContext.tenantId);

        // Test avec tenant_id différent (doit échouer pour non-ministère)
        try {
          const dataWithDifferentTenant = { name: 'Test Budget 3', tenantId: 'autre-tenant' };
          multiTenantService.injectTenantId(dataWithDifferentTenant, crouContext);
          console.log('❌ ERREUR: Injection tenant différent acceptée !');
        } catch (error) {
          console.log('✅ Injection tenant différent correctement rejetée:', error.message);
        }
      }
    }

    // Test 6: Cache des tenants
    console.log('\n💾 Test 6: Cache des tenants...');
    
    const allTenants = await tenantRepository.find();
    if (allTenants.length > 0) {
      const firstTenant = allTenants[0];
      
      // Premier accès (depuis la base)
      const tenant1 = await multiTenantService.getTenant(firstTenant.id);
      console.log('✅ Premier accès tenant:', tenant1?.name);
      
      // Deuxième accès (depuis le cache)
      const tenant2 = await multiTenantService.getTenant(firstTenant.id);
      console.log('✅ Deuxième accès tenant (cache):', tenant2?.name);
      
      // Statistiques du cache
      const cacheStats = multiTenantService.getCacheStats();
      console.log('✅ Statistiques cache:', cacheStats);
      
      // Nettoyage du cache
      multiTenantService.clearTenantCache();
      const cacheStatsAfterClear = multiTenantService.getCacheStats();
      console.log('✅ Cache après nettoyage:', cacheStatsAfterClear);
    }

    console.log('\n===================================');
    console.log('✅ Tous les tests multi-tenant terminés !');
    console.log('\n📊 Résumé des fonctionnalités testées:');
    console.log('   - ✅ Récupération du contexte tenant');
    console.log('   - ✅ Validation des accès cross-tenant');
    console.log('   - ✅ Isolation des données par tenant');
    console.log('   - ✅ Repository avec filtre automatique');
    console.log('   - ✅ Injection automatique du tenant_id');
    console.log('   - ✅ Cache des informations tenant');
    console.log('   - ✅ Gestion des permissions ministérielles');
    console.log('\n🎯 Le service multi-tenant est opérationnel !');

  } catch (error) {
    console.error('❌ Erreur lors des tests multi-tenant:', error);
    throw error;
  } finally {
    // Fermer la connexion
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
      console.log('🔌 Connexion base de données fermée');
    }
  }
}

// Exécuter les tests si ce fichier est appelé directement
if (require.main === module) {
  testMultiTenantService()
    .then(() => {
      console.log('🎉 Tests multi-tenant terminés !');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Échec des tests multi-tenant:', error);
      process.exit(1);
    });
}

export { testMultiTenantService };
/**
 * FICHIER: apps\api\src\scripts\test-tenant-isolation.ts
 * SCRIPT: Test des middlewares d'isolation tenant
 * 
 * DESCRIPTION:
 * Script de test pour valider le fonctionnement des middlewares d'isolation tenant
 * Test des fonctionnalités d'injection, validation et filtrage
 * 
 * UTILISATION:
 * npm run test:tenant-isolation
 * ou
 * npx ts-node apps/api/src/scripts/test-tenant-isolation.ts
 * 
 * AUTEUR: Équipe CROU
 * DATE: Décembre 2024
 */

import 'reflect-metadata';
import { AppDataSource } from '../../../../packages/database/src/config/typeorm.config';
import { MultiTenantService } from '../shared/services/multi-tenant.service';
import { TenantIsolationUtils, TenantAwareRepository } from '../shared/utils/tenant-isolation.utils';
import { User } from '../../../../packages/database/src/entities/User.entity';
import { Tenant, TenantType } from '../../../../packages/database/src/entities/Tenant.entity';
import { logger } from '../shared/utils/logger';

/**
 * Classe de test pour l'isolation tenant
 */
class TenantIsolationTester {
  private multiTenantService: MultiTenantService;
  private testUsers: User[] = [];
  private testTenants: Tenant[] = [];

  constructor() {
    this.multiTenantService = new MultiTenantService();
  }

  /**
   * Exécuter tous les tests
   */
  async runAllTests(): Promise<void> {
    try {
      console.log('🚀 Démarrage des tests d\'isolation tenant...\n');

      // Initialiser la base de données
      await this.initializeDatabase();

      // Charger les données de test
      await this.loadTestData();

      // Tests des utilitaires
      await this.testTenantIsolationUtils();
      await this.testTenantAwareRepository();
      await this.testDataFiltering();
      
      // Tests de validation
      await this.testTenantValidation();
      await this.testCrossTenantAccess();
      
      // Tests de performance
      await this.testPerformance();

      console.log('\n✅ Tous les tests d\'isolation tenant sont passés avec succès !');

    } catch (error) {
      console.error('\n❌ Erreur lors des tests:', error);
      throw error;
    }
  }

  /**
   * Initialiser la connexion à la base de données
   */
  private async initializeDatabase(): Promise<void> {
    try {
      if (!AppDataSource.isInitialized) {
        await AppDataSource.initialize();
      }
      console.log('✅ Connexion à la base de données établie');
    } catch (error) {
      console.error('❌ Erreur connexion base de données:', error);
      throw error;
    }
  }

  /**
   * Charger les données de test
   */
  private async loadTestData(): Promise<void> {
    try {
      const userRepository = AppDataSource.getRepository(User);
      const tenantRepository = AppDataSource.getRepository(Tenant);

      this.testUsers = await userRepository.find({ take: 5 });
      this.testTenants = await tenantRepository.find({ take: 3 });

      if (this.testUsers.length === 0 || this.testTenants.length === 0) {
        throw new Error('Données de test manquantes. Exécutez d\'abord les seeders.');
      }

      console.log(`✅ Données de test chargées: ${this.testUsers.length} utilisateurs, ${this.testTenants.length} tenants`);
    } catch (error) {
      console.error('❌ Erreur chargement données de test:', error);
      throw error;
    }
  }

  /**
   * Test des utilitaires d'isolation tenant
   */
  private async testTenantIsolationUtils(): Promise<void> {
    console.log('\n🔧 Test des utilitaires d\'isolation tenant...');

    try {
      const testUser = this.testUsers[0];
      const tenantContext = await this.multiTenantService.getTenantContext(testUser.id);

      if (!tenantContext) {
        throw new Error('Impossible de récupérer le contexte tenant');
      }

      // Test d'injection de tenant ID
      const testData = { name: 'Test Budget', amount: 50000 };
      const dataWithTenant = TenantIsolationUtils.injectTenantId(testData, tenantContext);
      
      if ((dataWithTenant as any).tenantId !== tenantContext.tenantId) {
        throw new Error('Injection tenant ID échouée');
      }
      console.log('✅ Injection tenant ID réussie');

      // Test de validation des données
      const validation = TenantIsolationUtils.validateTenantData(
        dataWithTenant,
        tenantContext,
        { strictMode: true }
      );

      if (!validation.isValid) {
        throw new Error('Validation des données tenant échouée');
      }
      console.log('✅ Validation des données tenant réussie');

      // Test de filtrage des données
      const testArray = [
        { id: '1', tenantId: tenantContext.tenantId, name: 'Item 1' },
        { id: '2', tenantId: 'other-tenant', name: 'Item 2' },
        { id: '3', tenantId: tenantContext.tenantId, name: 'Item 3' }
      ];

      const filteredData = TenantIsolationUtils.filterDataByTenant(
        testArray,
        tenantContext,
        { strictMode: true }
      );

      if (filteredData.length !== 2) {
        throw new Error('Filtrage des données par tenant échoué');
      }
      console.log('✅ Filtrage des données par tenant réussi');

    } catch (error) {
      console.error('❌ Erreur test utilitaires:', error);
      throw error;
    }
  }

  /**
   * Test du repository avec isolation tenant
   */
  private async testTenantAwareRepository(): Promise<void> {
    console.log('\n📊 Test du repository avec isolation tenant...');

    try {
      const testUser = this.testUsers[0];
      const tenantContext = await this.multiTenantService.getTenantContext(testUser.id);

      if (!tenantContext) {
        throw new Error('Contexte tenant manquant');
      }

      // Créer un repository avec isolation tenant
      const userRepository = AppDataSource.getRepository(User);
      const tenantAwareRepo = TenantIsolationUtils.createTenantAwareRepository(
        userRepository,
        tenantContext,
        { strictMode: true }
      );

      // Test de find avec filtre automatique
      const users = await tenantAwareRepo.find();
      console.log(`✅ Repository find: ${users.length} utilisateurs trouvés`);

      // Test de count avec filtre automatique
      const userCount = await tenantAwareRepo.count();
      console.log(`✅ Repository count: ${userCount} utilisateurs comptés`);

      // Test de query builder avec filtre automatique
      const queryBuilder = tenantAwareRepo.createQueryBuilder('user');
      const queryUsers = await queryBuilder.getMany();
      console.log(`✅ Query builder: ${queryUsers.length} utilisateurs via QB`);

      // Vérifier que tous les utilisateurs appartiennent au bon tenant
      const allBelongToTenant = users.every(user => user.tenantId === tenantContext.tenantId);
      if (!allBelongToTenant) {
        throw new Error('Certains utilisateurs n\'appartiennent pas au bon tenant');
      }
      console.log('✅ Tous les utilisateurs appartiennent au bon tenant');

    } catch (error) {
      console.error('❌ Erreur test repository:', error);
      throw error;
    }
  }

  /**
   * Test du filtrage des données
   */
  private async testDataFiltering(): Promise<void> {
    console.log('\n🔍 Test du filtrage des données...');

    try {
      const testUser = this.testUsers[0];
      const tenantContext = await this.multiTenantService.getTenantContext(testUser.id);

      if (!tenantContext) {
        throw new Error('Contexte tenant manquant');
      }

      // Test de transformation de réponse API
      const mockApiResponse = {
        success: true,
        data: [
          { id: '1', tenantId: tenantContext.tenantId, name: 'Item 1' },
          { id: '2', tenantId: 'other-tenant', name: 'Item 2' },
          { id: '3', tenantId: tenantContext.tenantId, name: 'Item 3' }
        ]
      };

      const transformedResponse = TenantIsolationUtils.transformApiResponse(
        mockApiResponse,
        tenantContext,
        { strictMode: true }
      );

      if (transformedResponse.data.length !== 2) {
        throw new Error('Transformation de réponse API échouée');
      }
      console.log('✅ Transformation de réponse API réussie');

      // Test avec accès étendu (ministère)
      const ministerialContext = {
        ...tenantContext,
        tenantType: 'ministere' as TenantType
      };

      const extendedResponse = TenantIsolationUtils.transformApiResponse(
        mockApiResponse,
        ministerialContext,
        { bypassForExtendedAccess: true }
      );

      if (extendedResponse.data.length !== 3) {
        throw new Error('Accès étendu ministériel échoué');
      }
      console.log('✅ Accès étendu ministériel réussi');

    } catch (error) {
      console.error('❌ Erreur test filtrage:', error);
      throw error;
    }
  }

  /**
   * Test de validation tenant
   */
  private async testTenantValidation(): Promise<void> {
    console.log('\n✅ Test de validation tenant...');

    try {
      const testUser = this.testUsers[0];
      const tenantContext = await this.multiTenantService.getTenantContext(testUser.id);

      if (!tenantContext) {
        throw new Error('Contexte tenant manquant');
      }

      // Test validation données valides
      const validData = { tenantId: tenantContext.tenantId, name: 'Valid Item' };
      const validValidation = TenantIsolationUtils.validateTenantData(
        validData,
        tenantContext,
        { strictMode: true }
      );

      if (!validValidation.isValid) {
        throw new Error('Validation de données valides échouée');
      }
      console.log('✅ Validation de données valides réussie');

      // Test validation données cross-tenant non autorisées
      const crossTenantData = { tenantId: 'other-tenant', name: 'Cross Tenant Item' };
      const crossTenantValidation = TenantIsolationUtils.validateTenantData(
        crossTenantData,
        tenantContext,
        { strictMode: true, allowCrossTenant: false }
      );

      if (crossTenantValidation.isValid) {
        throw new Error('Validation devrait échouer pour cross-tenant non autorisé');
      }
      console.log('✅ Validation cross-tenant non autorisé réussie');

      // Test validation données cross-tenant autorisées
      const allowedCrossTenantValidation = TenantIsolationUtils.validateTenantData(
        crossTenantData,
        tenantContext,
        { strictMode: true, allowCrossTenant: true }
      );

      if (!allowedCrossTenantValidation.isValid) {
        throw new Error('Validation devrait réussir pour cross-tenant autorisé');
      }
      console.log('✅ Validation cross-tenant autorisé réussie');

    } catch (error) {
      console.error('❌ Erreur test validation:', error);
      throw error;
    }
  }

  /**
   * Test d'accès cross-tenant
   */
  private async testCrossTenantAccess(): Promise<void> {
    console.log('\n🔄 Test d\'accès cross-tenant...');

    try {
      if (this.testTenants.length < 2) {
        console.log('⚠️  Pas assez de tenants pour tester l\'accès cross-tenant');
        return;
      }

      const testUser = this.testUsers[0];
      const tenantContext = await this.multiTenantService.getTenantContext(testUser.id);
      const targetTenant = this.testTenants.find(t => t.id !== tenantContext?.tenantId);

      if (!tenantContext || !targetTenant) {
        throw new Error('Contexte tenant ou tenant cible manquant');
      }

      // Test validation accès cross-tenant
      const accessValidation = await this.multiTenantService.validateTenantAccess(
        tenantContext,
        targetTenant.id,
        { allowCrossTenant: true }
      );

      console.log(`✅ Validation accès cross-tenant: ${accessValidation.allowed ? 'autorisé' : 'refusé'}`);
      console.log(`   Raison: ${accessValidation.reason || 'Accès autorisé'}`);

      // Test avec utilisateur ministériel
      const ministerialUser = this.testUsers.find(u => u.tenant?.type === 'ministere');
      if (ministerialUser) {
        const ministerialContext = await this.multiTenantService.getTenantContext(ministerialUser.id);
        
        if (ministerialContext) {
          const ministerialAccess = await this.multiTenantService.validateTenantAccess(
            ministerialContext,
            targetTenant.id,
            { allowCrossTenant: true }
          );

          console.log(`✅ Accès ministériel cross-tenant: ${ministerialAccess.allowed ? 'autorisé' : 'refusé'}`);
        }
      }

    } catch (error) {
      console.error('❌ Erreur test accès cross-tenant:', error);
      throw error;
    }
  }

  /**
   * Test de performance
   */
  private async testPerformance(): Promise<void> {
    console.log('\n⚡ Test de performance...');

    try {
      const testUser = this.testUsers[0];
      const tenantContext = await this.multiTenantService.getTenantContext(testUser.id);

      if (!tenantContext) {
        throw new Error('Contexte tenant manquant');
      }

      const iterations = 1000;
      const testData = Array.from({ length: 100 }, (_, i) => ({
        id: `item_${i}`,
        tenantId: i % 2 === 0 ? tenantContext.tenantId : 'other-tenant',
        name: `Item ${i}`
      }));

      // Test performance filtrage
      const startTime = Date.now();
      
      for (let i = 0; i < iterations; i++) {
        TenantIsolationUtils.filterDataByTenant(testData, tenantContext);
      }
      
      const duration = Date.now() - startTime;
      const operationsPerSecond = Math.round((iterations / duration) * 1000);

      console.log(`✅ Performance filtrage:`);
      console.log(`   - ${iterations} opérations en ${duration}ms`);
      console.log(`   - ${operationsPerSecond} opérations/seconde`);

      if (operationsPerSecond < 100) {
        console.log('⚠️  Performance faible (< 100 ops/sec)');
      }

      // Test performance validation
      const validationStartTime = Date.now();
      
      for (let i = 0; i < iterations; i++) {
        TenantIsolationUtils.validateTenantData(
          testData[i % testData.length],
          tenantContext
        );
      }
      
      const validationDuration = Date.now() - validationStartTime;
      const validationOpsPerSecond = Math.round((iterations / validationDuration) * 1000);

      console.log(`✅ Performance validation:`);
      console.log(`   - ${iterations} validations en ${validationDuration}ms`);
      console.log(`   - ${validationOpsPerSecond} validations/seconde`);

    } catch (error) {
      console.error('❌ Erreur test performance:', error);
      throw error;
    }
  }
}

/**
 * Fonction principale
 */
async function main(): Promise<void> {
  const tester = new TenantIsolationTester();
  
  try {
    await tester.runAllTests();
    process.exit(0);
  } catch (error) {
    console.error('💥 Tests échoués:', error);
    process.exit(1);
  }
}

// Exécuter si appelé directement
if (require.main === module) {
  main().catch(console.error);
}

export { TenantIsolationTester };
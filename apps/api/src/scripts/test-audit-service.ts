/**
 * FICHIER: apps\api\src\scripts\test-audit-service.ts
 * SCRIPT: Test du service d'audit avancé
 * 
 * DESCRIPTION:
 * Script de test pour valider le fonctionnement du service d'audit
 * Test des fonctionnalités d'enregistrement, recherche et détection
 * Validation des performances et de la robustesse
 * 
 * UTILISATION:
 * npm run test:audit
 * ou
 * npx ts-node apps/api/src/scripts/test-audit-service.ts
 * 
 * AUTEUR: Équipe CROU
 * DATE: Décembre 2024
 */

import 'reflect-metadata';
import { AppDataSource } from '../../../../packages/database/src/config/typeorm.config';
import { AuditService, AuditEvent } from '../shared/services/audit.service';
import { AuditAction } from '../../../../packages/database/src/entities/AuditLog.entity';
import { User } from '../../../../packages/database/src/entities/User.entity';
import { logger } from '../shared/utils/logger';

/**
 * Classe de test pour le service d'audit
 */
class AuditServiceTester {
  private auditService: AuditService;
  private testUsers: User[] = [];

  constructor() {
    this.auditService = new AuditService();
  }

  /**
   * Exécuter tous les tests
   */
  async runAllTests(): Promise<void> {
    try {
      console.log('🚀 Démarrage des tests du service d\'audit...\n');

      // Initialiser la base de données
      await this.initializeDatabase();

      // Récupérer des utilisateurs de test
      await this.loadTestUsers();

      // Tests de base
      await this.testBasicLogging();
      await this.testAuthEventLogging();
      await this.testResourceAccessLogging();
      
      // Tests de recherche
      await this.testSearchFilters();
      await this.testPagination();
      
      // Tests de rapports
      await this.testReportGeneration();
      await this.testStatistics();
      
      // Tests de détection d'anomalies
      await this.testSuspiciousActivityDetection();
      
      // Tests de performance
      await this.testPerformance();
      
      // Tests d'archivage
      await this.testArchiving();

      console.log('\n✅ Tous les tests du service d\'audit sont passés avec succès !');

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
   * Charger des utilisateurs de test
   */
  private async loadTestUsers(): Promise<void> {
    try {
      const userRepository = AppDataSource.getRepository(User);
      this.testUsers = await userRepository.find({ take: 5 });
      
      if (this.testUsers.length === 0) {
        throw new Error('Aucun utilisateur de test trouvé. Exécutez d\'abord les seeders.');
      }
      
      console.log(`✅ ${this.testUsers.length} utilisateurs de test chargés`);
    } catch (error) {
      console.error('❌ Erreur chargement utilisateurs de test:', error);
      throw error;
    }
  }

  /**
   * Test de logging basique
   */
  private async testBasicLogging(): Promise<void> {
    console.log('\n📝 Test de logging basique...');
    
    try {
      const testUser = this.testUsers[0];
      
      const event: AuditEvent = {
        userId: testUser.id,
        action: AuditAction.CREATE,
        resource: 'test_resource',
        resourceId: 'test_123',
        tenantId: testUser.tenantId,
        ipAddress: '192.168.1.100',
        userAgent: 'Test User Agent',
        newValues: { name: 'Test Resource', value: 42 },
        metadata: { testType: 'basic_logging' }
      };

      await this.auditService.logEvent(event);
      console.log('✅ Événement d\'audit enregistré avec succès');

      // Vérifier que l'événement a été enregistré
      const searchResult = await this.auditService.searchAuditLogs({
        userId: testUser.id,
        resource: 'test_resource',
        limit: 1
      });

      if (searchResult.logs.length === 0) {
        throw new Error('L\'événement d\'audit n\'a pas été trouvé');
      }

      console.log('✅ Événement d\'audit retrouvé dans la recherche');

    } catch (error) {
      console.error('❌ Erreur test logging basique:', error);
      throw error;
    }
  }

  /**
   * Test de logging des événements d'authentification
   */
  private async testAuthEventLogging(): Promise<void> {
    console.log('\n🔐 Test de logging des événements d\'authentification...');
    
    try {
      const testUser = this.testUsers[1];

      // Test login réussi
      await this.auditService.logAuthEvent(
        'login',
        testUser.id,
        testUser.email,
        true,
        '192.168.1.101',
        'Test Browser',
        { loginMethod: 'password' }
      );

      // Test login échoué
      await this.auditService.logAuthEvent(
        'login',
        undefined,
        'wrong@email.com',
        false,
        '192.168.1.102',
        'Test Browser',
        { reason: 'invalid_credentials' }
      );

      // Test logout
      await this.auditService.logAuthEvent(
        'logout',
        testUser.id,
        testUser.email,
        true,
        '192.168.1.101',
        'Test Browser'
      );

      console.log('✅ Événements d\'authentification enregistrés');

      // Vérifier les événements
      const authLogs = await this.auditService.searchAuditLogs({
        resource: 'authentication',
        limit: 10
      });

      if (authLogs.logs.length < 3) {
        throw new Error('Tous les événements d\'auth n\'ont pas été enregistrés');
      }

      console.log('✅ Événements d\'authentification retrouvés');

    } catch (error) {
      console.error('❌ Erreur test logging auth:', error);
      throw error;
    }
  }

  /**
   * Test de logging des accès aux ressources
   */
  private async testResourceAccessLogging(): Promise<void> {
    console.log('\n📂 Test de logging des accès aux ressources...');
    
    try {
      const testUser = this.testUsers[2];

      await this.auditService.logResourceAccess(
        testUser.id,
        'financial_data',
        AuditAction.VIEW,
        'budget_2024',
        testUser.tenantId,
        '192.168.1.103',
        { 
          module: 'finances',
          sensitive: true,
          accessReason: 'monthly_report'
        }
      );

      console.log('✅ Accès aux ressources enregistré');

      // Vérifier l'enregistrement
      const resourceLogs = await this.auditService.searchAuditLogs({
        userId: testUser.id,
        resource: 'financial_data',
        limit: 1
      });

      if (resourceLogs.logs.length === 0) {
        throw new Error('L\'accès aux ressources n\'a pas été enregistré');
      }

      console.log('✅ Accès aux ressources retrouvé');

    } catch (error) {
      console.error('❌ Erreur test logging accès ressources:', error);
      throw error;
    }
  }

  /**
   * Test des filtres de recherche
   */
  private async testSearchFilters(): Promise<void> {
    console.log('\n🔍 Test des filtres de recherche...');
    
    try {
      const testUser = this.testUsers[0];

      // Test filtre par utilisateur
      const userLogs = await this.auditService.searchAuditLogs({
        userId: testUser.id,
        limit: 10
      });

      console.log(`✅ Filtre par utilisateur: ${userLogs.logs.length} logs trouvés`);

      // Test filtre par action
      const createLogs = await this.auditService.searchAuditLogs({
        action: AuditAction.CREATE,
        limit: 10
      });

      console.log(`✅ Filtre par action: ${createLogs.logs.length} logs trouvés`);

      // Test filtre par date
      const today = new Date();
      const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
      
      const recentLogs = await this.auditService.searchAuditLogs({
        dateFrom: yesterday,
        dateTo: today,
        limit: 10
      });

      console.log(`✅ Filtre par date: ${recentLogs.logs.length} logs trouvés`);

    } catch (error) {
      console.error('❌ Erreur test filtres de recherche:', error);
      throw error;
    }
  }

  /**
   * Test de la pagination
   */
  private async testPagination(): Promise<void> {
    console.log('\n📄 Test de la pagination...');
    
    try {
      // Première page
      const page1 = await this.auditService.searchAuditLogs({
        limit: 5,
        offset: 0
      });

      // Deuxième page
      const page2 = await this.auditService.searchAuditLogs({
        limit: 5,
        offset: 5
      });

      console.log(`✅ Page 1: ${page1.logs.length} logs, hasMore: ${page1.hasMore}`);
      console.log(`✅ Page 2: ${page2.logs.length} logs, hasMore: ${page2.hasMore}`);

      // Vérifier que les pages sont différentes
      if (page1.logs.length > 0 && page2.logs.length > 0) {
        const page1Ids = page1.logs.map(log => log.id);
        const page2Ids = page2.logs.map(log => log.id);
        const overlap = page1Ids.some(id => page2Ids.includes(id));
        
        if (overlap) {
          throw new Error('Les pages se chevauchent');
        }
        
        console.log('✅ Pagination fonctionne correctement');
      }

    } catch (error) {
      console.error('❌ Erreur test pagination:', error);
      throw error;
    }
  }

  /**
   * Test de génération de rapports
   */
  private async testReportGeneration(): Promise<void> {
    console.log('\n📊 Test de génération de rapports...');
    
    try {
      const testUser = this.testUsers[0];
      
      // Générer un rapport pour le tenant de test
      const report = await this.auditService.generateAuditReport(
        testUser.tenantId,
        new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 jours
        new Date()
      );

      console.log(`✅ Rapport généré:`);
      console.log(`   - Total événements: ${report.totalEvents}`);
      console.log(`   - Actions uniques: ${Object.keys(report.eventsByAction).length}`);
      console.log(`   - Utilisateurs uniques: ${Object.keys(report.eventsByUser).length}`);
      console.log(`   - Ressources uniques: ${Object.keys(report.eventsByResource).length}`);
      console.log(`   - Activités suspectes: ${report.suspiciousActivities.length}`);

      if (report.totalEvents === 0) {
        console.log('⚠️  Aucun événement dans le rapport (normal si base vide)');
      }

    } catch (error) {
      console.error('❌ Erreur test génération rapport:', error);
      throw error;
    }
  }

  /**
   * Test des statistiques
   */
  private async testStatistics(): Promise<void> {
    console.log('\n📈 Test des statistiques...');
    
    try {
      const stats = await this.auditService.getServiceStats();

      console.log(`✅ Statistiques récupérées:`);
      console.log(`   - Total logs: ${stats.totalLogs}`);
      console.log(`   - Logs aujourd'hui: ${stats.logsToday}`);
      console.log(`   - Logs cette semaine: ${stats.logsThisWeek}`);
      console.log(`   - Top utilisateurs: ${stats.topUsers.length}`);
      console.log(`   - Top actions: ${stats.topActions.length}`);
      console.log(`   - Activités suspectes: ${stats.suspiciousActivitiesCount}`);

    } catch (error) {
      console.error('❌ Erreur test statistiques:', error);
      throw error;
    }
  }

  /**
   * Test de détection d'activités suspectes
   */
  private async testSuspiciousActivityDetection(): Promise<void> {
    console.log('\n🚨 Test de détection d\'activités suspectes...');
    
    try {
      const testUser = this.testUsers[3];

      // Simuler plusieurs tentatives de connexion échouées
      for (let i = 0; i < 6; i++) {
        await this.auditService.logAuthEvent(
          'login',
          undefined,
          testUser.email,
          false,
          '192.168.1.200',
          'Suspicious Browser',
          { attempt: i + 1 }
        );
      }

      console.log('✅ Tentatives de connexion échouées simulées');

      // Attendre un peu pour la détection
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Vérifier la détection via un rapport
      const report = await this.auditService.generateAuditReport(
        testUser.tenantId,
        new Date(Date.now() - 60 * 60 * 1000), // 1 heure
        new Date()
      );

      const suspiciousActivities = report.suspiciousActivities.filter(
        activity => activity.type === 'multiple_failed_logins'
      );

      if (suspiciousActivities.length > 0) {
        console.log(`✅ Activité suspecte détectée: ${suspiciousActivities[0].type}`);
        console.log(`   - Sévérité: ${suspiciousActivities[0].severity}`);
        console.log(`   - Nombre: ${suspiciousActivities[0].count}`);
      } else {
        console.log('⚠️  Aucune activité suspecte détectée (peut être normal)');
      }

    } catch (error) {
      console.error('❌ Erreur test détection activités suspectes:', error);
      throw error;
    }
  }

  /**
   * Test de performance
   */
  private async testPerformance(): Promise<void> {
    console.log('\n⚡ Test de performance...');
    
    try {
      const testUser = this.testUsers[4];
      const startTime = Date.now();
      const eventCount = 100;

      // Enregistrer plusieurs événements rapidement
      const promises = [];
      for (let i = 0; i < eventCount; i++) {
        const event: AuditEvent = {
          userId: testUser.id,
          action: AuditAction.VIEW,
          resource: 'performance_test',
          resourceId: `test_${i}`,
          tenantId: testUser.tenantId,
          ipAddress: '192.168.1.250',
          metadata: { batchTest: true, index: i }
        };
        
        promises.push(this.auditService.logEvent(event));
      }

      await Promise.all(promises);
      
      const duration = Date.now() - startTime;
      const eventsPerSecond = Math.round((eventCount / duration) * 1000);

      console.log(`✅ Performance test:`);
      console.log(`   - ${eventCount} événements en ${duration}ms`);
      console.log(`   - ${eventsPerSecond} événements/seconde`);

      if (eventsPerSecond < 10) {
        console.log('⚠️  Performance faible (< 10 événements/seconde)');
      }

    } catch (error) {
      console.error('❌ Erreur test performance:', error);
      throw error;
    }
  }

  /**
   * Test d'archivage
   */
  private async testArchiving(): Promise<void> {
    console.log('\n🗄️  Test d\'archivage...');
    
    try {
      // Compter les logs avant archivage
      const beforeStats = await this.auditService.getServiceStats();
      console.log(`📊 Logs avant archivage: ${beforeStats.totalLogs}`);

      // Archiver les logs très anciens (plus de 1000 jours)
      const archivedCount = await this.auditService.archiveOldLogs(1000);
      
      console.log(`✅ Archivage terminé: ${archivedCount} logs archivés`);

      // Compter les logs après archivage
      const afterStats = await this.auditService.getServiceStats();
      console.log(`📊 Logs après archivage: ${afterStats.totalLogs}`);

      if (archivedCount === 0) {
        console.log('ℹ️  Aucun log ancien à archiver (normal pour des données récentes)');
      }

    } catch (error) {
      console.error('❌ Erreur test archivage:', error);
      throw error;
    }
  }
}

/**
 * Fonction principale
 */
async function main(): Promise<void> {
  const tester = new AuditServiceTester();
  
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

export { AuditServiceTester };
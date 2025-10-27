/**
 * FICHIER: apps/api/src/scripts/test-security-features.ts
 * SCRIPT: Test des fonctionnalités de sécurité avancées
 * 
 * DESCRIPTION:
 * Script de test complet pour valider toutes les mesures de sécurité:
 * - Rate limiting par utilisateur et IP
 * - Système de blocage de compte
 * - Chiffrement/déchiffrement AES-256
 * - Détection d'activités suspectes
 * - Système d'alertes de sécurité
 * 
 * UTILISATION:
 * npm run test:security
 * ou
 * ts-node apps/api/src/scripts/test-security-features.ts
 * 
 * AUTEUR: Équipe CROU
 * DATE: Décembre 2024
 */

import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { AppModule } from '../app.module';
import { SecurityService } from '../shared/services/security.service';

class SecurityTester {
  private readonly logger = new Logger(SecurityTester.name);
  private securityService: SecurityService;

  async initialize() {
    try {
      const app = await NestFactory.createApplicationContext(AppModule);
      this.securityService = app.get(SecurityService);
      this.logger.log('Security tester initialized successfully');
      return app;
    } catch (error) {
      this.logger.error('Failed to initialize security tester:', error);
      throw error;
    }
  }

  /**
   * Test du rate limiting
   */
  async testRateLimiting(): Promise<void> {
    this.logger.log('\n=== TESTING RATE LIMITING ===');

    try {
      const testIp = '192.168.1.100';
      const testUserId = 'test-user-123';

      // Test 1: Rate limiting par IP
      this.logger.log('Testing IP rate limiting...');
      
      let successCount = 0;
      let blockedCount = 0;

      for (let i = 0; i < 105; i++) {
        const result = await this.securityService.checkRateLimit(testIp, 'ip', testIp);
        if (result.allowed) {
          successCount++;
        } else {
          blockedCount++;
          this.logger.log(`Request ${i + 1} blocked. Retry after: ${result.retryAfter}s`);
          break;
        }
      }

      this.logger.log(`IP Rate Limiting Results: ${successCount} allowed, ${blockedCount} blocked`);

      // Test 2: Rate limiting par utilisateur
      this.logger.log('Testing user rate limiting...');
      
      successCount = 0;
      blockedCount = 0;

      for (let i = 0; i < 105; i++) {
        const result = await this.securityService.checkRateLimit(testUserId, 'user', testIp);
        if (result.allowed) {
          successCount++;
        } else {
          blockedCount++;
          this.logger.log(`User request ${i + 1} blocked. Retry after: ${result.retryAfter}s`);
          break;
        }
      }

      this.logger.log(`User Rate Limiting Results: ${successCount} allowed, ${blockedCount} blocked`);

      // Test 3: Rate limiting pour login
      this.logger.log('Testing login rate limiting...');
      
      successCount = 0;
      blockedCount = 0;

      for (let i = 0; i < 12; i++) {
        const result = await this.securityService.checkRateLimit(testIp, 'login', testIp);
        if (result.allowed) {
          successCount++;
        } else {
          blockedCount++;
          this.logger.log(`Login attempt ${i + 1} blocked. Retry after: ${result.retryAfter}s`);
          break;
        }
      }

      this.logger.log(`Login Rate Limiting Results: ${successCount} allowed, ${blockedCount} blocked`);

      this.logger.log('✅ Rate limiting tests completed successfully');
    } catch (error) {
      this.logger.error('❌ Rate limiting test failed:', error);
      throw error;
    }
  }

  /**
   * Test du chiffrement AES-256
   */
  async testEncryption(): Promise<void> {
    this.logger.log('\n=== TESTING AES-256 ENCRYPTION ===');

    try {
      const testData = [
        'Simple text data',
        'Données avec des caractères spéciaux: àéèùç!@#$%^&*()',
        'Very long text data that contains multiple sentences and should test the encryption with larger payloads to ensure it works correctly with various data sizes.',
        JSON.stringify({ user: 'john.doe', password: 'secret123', data: [1, 2, 3, 4, 5] }),
        '{"sensitive": "financial data", "amount": 1000000, "account": "FR76 1234 5678 9012 3456 7890 123"}'
      ];

      for (let i = 0; i < testData.length; i++) {
        const originalData = testData[i];
        this.logger.log(`Testing encryption/decryption ${i + 1}/${testData.length}...`);

        // Test avec clé par défaut
        const encrypted = await this.securityService.encryptSensitiveData(originalData);
        this.logger.log(`Encrypted data length: ${encrypted.encryptedData.length} chars`);
        this.logger.log(`IV: ${encrypted.iv}`);
        this.logger.log(`Tag: ${encrypted.tag}`);

        const decrypted = await this.securityService.decryptSensitiveData(
          encrypted.encryptedData,
          encrypted.iv,
          encrypted.tag
        );

        if (decrypted === originalData) {
          this.logger.log(`✅ Test ${i + 1} passed - Data matches`);
        } else {
          throw new Error(`Test ${i + 1} failed - Data mismatch`);
        }

        // Test avec mot de passe personnalisé
        const customPassword = `custom-password-${i}`;
        const encryptedCustom = await this.securityService.encryptSensitiveData(originalData, customPassword);
        const decryptedCustom = await this.securityService.decryptSensitiveData(
          encryptedCustom.encryptedData,
          encryptedCustom.iv,
          encryptedCustom.tag,
          customPassword
        );

        if (decryptedCustom === originalData) {
          this.logger.log(`✅ Test ${i + 1} with custom password passed`);
        } else {
          throw new Error(`Test ${i + 1} with custom password failed`);
        }
      }

      // Test d'erreur avec mauvais mot de passe
      this.logger.log('Testing decryption with wrong password...');
      try {
        const encrypted = await this.securityService.encryptSensitiveData('test data', 'correct-password');
        await this.securityService.decryptSensitiveData(
          encrypted.encryptedData,
          encrypted.iv,
          encrypted.tag,
          'wrong-password'
        );
        throw new Error('Should have failed with wrong password');
      } catch (error) {
        if (error.message.includes('Failed to decrypt')) {
          this.logger.log('✅ Wrong password correctly rejected');
        } else {
          throw error;
        }
      }

      this.logger.log('✅ Encryption tests completed successfully');
    } catch (error) {
      this.logger.error('❌ Encryption test failed:', error);
      throw error;
    }
  }

  /**
   * Test de la détection d'activités suspectes
   */
  async testSuspiciousActivityDetection(): Promise<void> {
    this.logger.log('\n=== TESTING SUSPICIOUS ACTIVITY DETECTION ===');

    try {
      const testUserId = 'test-user-suspicious';
      const testIp = '10.0.0.1';

      // Test 1: User-Agent suspect
      this.logger.log('Testing suspicious user agent detection...');
      const suspiciousUserAgents = [
        'curl/7.68.0',
        'python-requests/2.25.1',
        'PostmanRuntime/7.28.0',
        'Mozilla/5.0 (compatible; Googlebot/2.1)',
        'wget/1.20.3'
      ];

      for (const userAgent of suspiciousUserAgents) {
        const result = await this.securityService.analyzeRequest(
          testUserId,
          testIp,
          userAgent,
          '/api/dashboard',
          'GET'
        );

        if (result.suspicious) {
          this.logger.log(`✅ Suspicious user agent detected: ${userAgent}`);
          this.logger.log(`   Reasons: ${result.reasons.join(', ')}`);
        } else {
          this.logger.warn(`⚠️  User agent not flagged as suspicious: ${userAgent}`);
        }
      }

      // Test 2: Accès à des endpoints sensibles
      this.logger.log('Testing sensitive endpoint access...');
      const sensitiveEndpoints = [
        '/api/admin/users',
        '/api/admin/roles',
        '/api/auth/password',
        '/api/audit/logs',
        '/api/security/stats'
      ];

      for (const endpoint of sensitiveEndpoints) {
        const result = await this.securityService.analyzeRequest(
          testUserId,
          testIp,
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          endpoint,
          'POST'
        );

        this.logger.log(`Endpoint ${endpoint}: ${result.suspicious ? 'SUSPICIOUS' : 'NORMAL'}`);
        if (result.reasons.length > 0) {
          this.logger.log(`   Reasons: ${result.reasons.join(', ')}`);
        }
      }

      // Test 3: Pattern d'accès anormal (beaucoup de requêtes)
      this.logger.log('Testing abnormal access pattern...');
      
      for (let i = 0; i < 55; i++) {
        await this.securityService.analyzeRequest(
          testUserId,
          testIp,
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          '/api/dashboard',
          'GET'
        );
      }

      const finalResult = await this.securityService.analyzeRequest(
        testUserId,
        testIp,
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        '/api/dashboard',
        'GET'
      );

      if (finalResult.suspicious) {
        this.logger.log('✅ Abnormal access pattern detected');
        this.logger.log(`   Reasons: ${finalResult.reasons.join(', ')}`);
      } else {
        this.logger.warn('⚠️  Abnormal access pattern not detected');
      }

      this.logger.log('✅ Suspicious activity detection tests completed');
    } catch (error) {
      this.logger.error('❌ Suspicious activity detection test failed:', error);
      throw error;
    }
  }

  /**
   * Test des statistiques de sécurité
   */
  async testSecurityStats(): Promise<void> {
    this.logger.log('\n=== TESTING SECURITY STATISTICS ===');

    try {
      const stats = await this.securityService.getSecurityStats();
      
      this.logger.log('Current Security Statistics:');
      this.logger.log(`- Active Alerts: ${stats.activeAlerts}`);
      this.logger.log(`- Locked Accounts: ${stats.lockedAccounts}`);
      this.logger.log(`- Rate Limit Violations: ${stats.rateLimitViolations}`);
      this.logger.log(`- Suspicious Activities: ${stats.suspiciousActivities}`);

      // Vérifier que les statistiques sont des nombres valides
      const isValidStats = 
        typeof stats.activeAlerts === 'number' &&
        typeof stats.lockedAccounts === 'number' &&
        typeof stats.rateLimitViolations === 'number' &&
        typeof stats.suspiciousActivities === 'number' &&
        stats.activeAlerts >= 0 &&
        stats.lockedAccounts >= 0 &&
        stats.rateLimitViolations >= 0 &&
        stats.suspiciousActivities >= 0;

      if (isValidStats) {
        this.logger.log('✅ Security statistics are valid');
      } else {
        throw new Error('Invalid security statistics format');
      }

      this.logger.log('✅ Security statistics test completed');
    } catch (error) {
      this.logger.error('❌ Security statistics test failed:', error);
      throw error;
    }
  }

  /**
   * Test de nettoyage des données expirées
   */
  async testDataCleanup(): Promise<void> {
    this.logger.log('\n=== TESTING DATA CLEANUP ===');

    try {
      await this.securityService.cleanupExpiredData();
      this.logger.log('✅ Data cleanup completed successfully');
    } catch (error) {
      this.logger.error('❌ Data cleanup test failed:', error);
      throw error;
    }
  }

  /**
   * Test de performance
   */
  async testPerformance(): Promise<void> {
    this.logger.log('\n=== TESTING PERFORMANCE ===');

    try {
      const iterations = 100;
      const testData = 'Performance test data with some content to encrypt and decrypt';

      // Test performance du chiffrement
      this.logger.log(`Testing encryption performance with ${iterations} iterations...`);
      const encryptionStart = Date.now();
      
      for (let i = 0; i < iterations; i++) {
        await this.securityService.encryptSensitiveData(testData);
      }
      
      const encryptionTime = Date.now() - encryptionStart;
      const encryptionAvg = encryptionTime / iterations;
      
      this.logger.log(`Encryption: ${encryptionTime}ms total, ${encryptionAvg.toFixed(2)}ms average`);

      // Test performance du rate limiting
      this.logger.log(`Testing rate limiting performance with ${iterations} iterations...`);
      const rateLimitStart = Date.now();
      
      for (let i = 0; i < iterations; i++) {
        await this.securityService.checkRateLimit(`test-perf-${i}`, 'user', '127.0.0.1');
      }
      
      const rateLimitTime = Date.now() - rateLimitStart;
      const rateLimitAvg = rateLimitTime / iterations;
      
      this.logger.log(`Rate limiting: ${rateLimitTime}ms total, ${rateLimitAvg.toFixed(2)}ms average`);

      // Test performance de l'analyse d'activité suspecte
      this.logger.log(`Testing suspicious activity analysis performance with ${iterations} iterations...`);
      const analysisStart = Date.now();
      
      for (let i = 0; i < iterations; i++) {
        await this.securityService.analyzeRequest(
          `test-user-${i}`,
          '127.0.0.1',
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          '/api/test',
          'GET'
        );
      }
      
      const analysisTime = Date.now() - analysisStart;
      const analysisAvg = analysisTime / iterations;
      
      this.logger.log(`Activity analysis: ${analysisTime}ms total, ${analysisAvg.toFixed(2)}ms average`);

      // Évaluer les performances
      if (encryptionAvg < 50 && rateLimitAvg < 10 && analysisAvg < 20) {
        this.logger.log('✅ Performance tests passed - All operations within acceptable limits');
      } else {
        this.logger.warn('⚠️  Performance tests show some slow operations:');
        if (encryptionAvg >= 50) this.logger.warn(`   - Encryption is slow: ${encryptionAvg.toFixed(2)}ms`);
        if (rateLimitAvg >= 10) this.logger.warn(`   - Rate limiting is slow: ${rateLimitAvg.toFixed(2)}ms`);
        if (analysisAvg >= 20) this.logger.warn(`   - Activity analysis is slow: ${analysisAvg.toFixed(2)}ms`);
      }

      this.logger.log('✅ Performance tests completed');
    } catch (error) {
      this.logger.error('❌ Performance test failed:', error);
      throw error;
    }
  }

  /**
   * Exécuter tous les tests
   */
  async runAllTests(): Promise<void> {
    this.logger.log('🚀 Starting comprehensive security tests...\n');

    const startTime = Date.now();
    let passedTests = 0;
    let totalTests = 6;

    try {
      // Test 1: Rate Limiting
      await this.testRateLimiting();
      passedTests++;

      // Test 2: Encryption
      await this.testEncryption();
      passedTests++;

      // Test 3: Suspicious Activity Detection
      await this.testSuspiciousActivityDetection();
      passedTests++;

      // Test 4: Security Statistics
      await this.testSecurityStats();
      passedTests++;

      // Test 5: Data Cleanup
      await this.testDataCleanup();
      passedTests++;

      // Test 6: Performance
      await this.testPerformance();
      passedTests++;

    } catch (error) {
      this.logger.error('Test suite failed:', error);
    }

    const totalTime = Date.now() - startTime;
    
    this.logger.log('\n=== TEST RESULTS SUMMARY ===');
    this.logger.log(`Tests passed: ${passedTests}/${totalTests}`);
    this.logger.log(`Total execution time: ${totalTime}ms`);
    this.logger.log(`Success rate: ${((passedTests / totalTests) * 100).toFixed(1)}%`);

    if (passedTests === totalTests) {
      this.logger.log('🎉 All security tests passed successfully!');
    } else {
      this.logger.error(`❌ ${totalTests - passedTests} test(s) failed`);
    }
  }
}

// Exécution du script
async function main() {
  const tester = new SecurityTester();
  let app;

  try {
    app = await tester.initialize();
    await tester.runAllTests();
  } catch (error) {
    console.error('Security test suite failed:', error);
    process.exit(1);
  } finally {
    if (app) {
      await app.close();
    }
  }
}

// Exécuter si appelé directement
if (require.main === module) {
  main();
}

export { SecurityTester };
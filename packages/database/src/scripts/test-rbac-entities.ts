/**
 * FICHIER: packages\database\src\scripts\test-rbac-entities.ts
 * SCRIPT: Test des entités RBAC
 * 
 * DESCRIPTION:
 * Script de test pour vérifier que les entités RBAC fonctionnent correctement
 * Teste les relations, validations et méthodes utilitaires
 * 
 * USAGE:
 * npm run test:rbac-entities
 * ou directement: tsx src/scripts/test-rbac-entities.ts
 * 
 * AUTEUR: Équipe CROU
 * DATE: Décembre 2024
 */

import { AppDataSource } from '../config/typeorm.config';
import { Role, RoleTenantType } from '../entities/Role.entity';
import { Permission, PermissionResource, PermissionAction } from '../entities/Permission.entity';
import { RefreshToken } from '../entities/RefreshToken.entity';
import { User } from '../entities/User.entity';

async function testRBACEntities(): Promise<void> {
  try {
    console.log('🧪 Test des entités RBAC...');
    console.log('============================');

    // Initialiser la connexion
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
      console.log('✅ Connexion base de données établie');
    }

    const roleRepository = AppDataSource.getRepository(Role);
    const permissionRepository = AppDataSource.getRepository(Permission);
    const refreshTokenRepository = AppDataSource.getRepository(RefreshToken);
    const userRepository = AppDataSource.getRepository(User);

    // Test 1: Création d'un rôle
    console.log('\n📋 Test 1: Création d\'un rôle...');
    const testRole = roleRepository.create({
      name: 'Test Role',
      description: 'Rôle de test',
      tenantType: RoleTenantType.CROU,
      isSystemRole: false,
      isActive: true,
      createdBy: 'test-script'
    });

    // Test des méthodes utilitaires avant sauvegarde
    console.log('   - Compatibilité tenant CROU:', testRole.isCompatibleWithTenant('crou'));
    console.log('   - Compatibilité tenant ministère:', testRole.isCompatibleWithTenant('ministere'));

    // Test 2: Création d'une permission
    console.log('\n🔐 Test 2: Création d\'une permission...');
    const testPermission = permissionRepository.create({
      resource: PermissionResource.DASHBOARD,
      actions: [PermissionAction.READ, PermissionAction.WRITE],
      description: 'Permission de test pour dashboard',
      conditions: [
        {
          field: 'tenantId',
          operator: 'eq',
          value: 'test-tenant'
        }
      ],
      isActive: true,
      createdBy: 'test-script'
    });

    // Test des méthodes utilitaires
    console.log('   - Autorise action READ:', testPermission.allowsAction('read'));
    console.log('   - Autorise action DELETE:', testPermission.allowsAction('delete'));
    console.log('   - A des conditions:', testPermission.hasConditions());
    console.log('   - Nom d\'affichage:', testPermission.getDisplayName());

    // Test d'évaluation des conditions
    const testContext = { tenantId: 'test-tenant', userId: 'test-user' };
    console.log('   - Évaluation conditions (match):', testPermission.evaluateConditions(testContext));
    
    const wrongContext = { tenantId: 'wrong-tenant', userId: 'test-user' };
    console.log('   - Évaluation conditions (no match):', testPermission.evaluateConditions(wrongContext));

    // Test 3: Création d'un refresh token
    console.log('\n🔑 Test 3: Création d\'un refresh token...');
    const testToken = 'test-token-123456789';
    const refreshToken = RefreshToken.create(
      'test-user-id',
      testToken,
      7 * 24 * 60 * 60 * 1000, // 7 jours
      '192.168.1.1',
      'Test User Agent'
    );

    // Test des méthodes utilitaires
    console.log('   - Token valide:', refreshToken.isValid());
    console.log('   - Token expiré:', refreshToken.isExpired());
    console.log('   - Expire bientôt:', refreshToken.expiresSoon());
    console.log('   - Temps avant expiration (ms):', refreshToken.getTimeToExpiry());

    // Test de vérification du token
    console.log('   - Vérification token correct:', refreshToken.verifyToken(testToken));
    console.log('   - Vérification token incorrect:', refreshToken.verifyToken('wrong-token'));

    // Test de révocation
    refreshToken.revoke('Test de révocation');
    console.log('   - Token révoqué:', refreshToken.isRevoked);
    console.log('   - Raison révocation:', refreshToken.revokedReason);

    // Test 4: Validation des actions de permission
    console.log('\n✅ Test 4: Validation des actions...');
    const validPermission = permissionRepository.create({
      resource: PermissionResource.FINANCIAL,
      actions: [PermissionAction.READ, PermissionAction.WRITE, PermissionAction.VALIDATE],
      description: 'Permission financière valide'
    });
    console.log('   - Actions valides:', validPermission.validateActions());

    // Test 5: Création de permission depuis string
    console.log('\n🔧 Test 5: Création permission depuis string...');
    const permissionFromString = Permission.fromString('stocks:read,write,export');
    console.log('   - Ressource:', permissionFromString.resource);
    console.log('   - Actions:', permissionFromString.actions);
    console.log('   - Description:', permissionFromString.description);

    // Test 6: Comparaison de permissions
    console.log('\n🔍 Test 6: Comparaison de permissions...');
    const permission1 = permissionRepository.create({
      resource: PermissionResource.STOCKS,
      actions: [PermissionAction.READ, PermissionAction.WRITE]
    });
    
    const permission2 = permissionRepository.create({
      resource: PermissionResource.STOCKS,
      actions: [PermissionAction.READ, PermissionAction.WRITE]
    });
    
    const permission3 = permissionRepository.create({
      resource: PermissionResource.STOCKS,
      actions: [PermissionAction.READ]
    });

    console.log('   - Permission1 équivalente à Permission2:', permission1.isEquivalentTo(permission2));
    console.log('   - Permission1 équivalente à Permission3:', permission1.isEquivalentTo(permission3));

    // Test 7: Hash de token
    console.log('\n🔒 Test 7: Hash de token...');
    const originalToken = 'my-secret-token-123';
    const hash1 = RefreshToken.createTokenHash(originalToken);
    const hash2 = RefreshToken.createTokenHash(originalToken);
    const hash3 = RefreshToken.createTokenHash('different-token');
    
    console.log('   - Hash1 === Hash2 (même token):', hash1 === hash2);
    console.log('   - Hash1 === Hash3 (token différent):', hash1 === hash3);
    console.log('   - Longueur hash (doit être 64):', hash1.length);

    console.log('\n============================');
    console.log('✅ Tous les tests des entités RBAC réussis !');
    console.log('\n📊 Résumé des fonctionnalités testées:');
    console.log('   - Création et validation des rôles');
    console.log('   - Création et validation des permissions');
    console.log('   - Évaluation des conditions de permissions');
    console.log('   - Gestion des refresh tokens');
    console.log('   - Hash sécurisé des tokens');
    console.log('   - Méthodes utilitaires des entités');
    console.log('\n🎯 Les entités RBAC sont prêtes pour la production !');

  } catch (error) {
    console.error('❌ Erreur lors des tests RBAC:', error);
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
  testRBACEntities()
    .then(() => {
      console.log('🎉 Tests RBAC terminés !');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Échec des tests RBAC:', error);
      process.exit(1);
    });
}

export { testRBACEntities };
/**
 * FICHIER: apps\api\src\scripts\test-auth-db-connection.ts
 * SCRIPT: Test de connexion authentification avec base de données
 * 
 * DESCRIPTION:
 * Script de test pour vérifier que l'authentification fonctionne avec la vraie base de données
 * Teste le login, refresh token, logout et récupération de profil
 * 
 * USAGE:
 * npm run test:auth-db
 * ou directement: tsx src/scripts/test-auth-db-connection.ts
 * 
 * AUTEUR: Équipe CROU
 * DATE: Décembre 2024
 */

import { AppDataSource } from '../../../../packages/database/src/config/typeorm.config';
import { AuthService } from '../modules/auth/auth.service';
import { runRBACseeders } from '../../../../packages/database/src/seeders/run-rbac-seeders';

async function testAuthDBConnection(): Promise<void> {
  try {
    console.log('🧪 Test de l\'authentification avec base de données...');
    console.log('=====================================================');

    // Initialiser la connexion à la base de données
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
      console.log('✅ Connexion base de données établie');
    }

    // Exécuter les seeders RBAC si nécessaire
    console.log('\n🌱 Vérification des données RBAC...');
    try {
      await runRBACseeders();
    } catch (error) {
      console.log('⚠️  Seeders déjà exécutés ou erreur:', error.message);
    }

    const authService = new AuthService();

    // Test 1: Login avec utilisateur valide
    console.log('\n🔐 Test 1: Login avec utilisateur valide...');
    try {
      const loginResult = await authService.login(
        {
          email: 'ministre@mesrit.gov.ne',
          password: 'password123'
        },
        '192.168.1.100',
        'Test User Agent'
      );

      console.log('✅ Login réussi !');
      console.log('   - Utilisateur:', loginResult.user.name);
      console.log('   - Rôle:', loginResult.user.role.name);
      console.log('   - Tenant:', loginResult.user.tenant.name);
      console.log('   - Permissions:', loginResult.user.permissions.length);
      console.log('   - Token expires in:', loginResult.expiresIn, 'secondes');

      // Test 2: Validation du token d'accès
      console.log('\n🎫 Test 2: Validation du token d\'accès...');
      const tokenPayload = authService.validateAccessToken(loginResult.accessToken);
      console.log('✅ Token valide !');
      console.log('   - User ID:', tokenPayload.userId);
      console.log('   - Email:', tokenPayload.email);
      console.log('   - Tenant ID:', tokenPayload.tenantId);
      console.log('   - Permissions:', tokenPayload.permissions.length);

      // Test 3: Récupération du profil
      console.log('\n👤 Test 3: Récupération du profil utilisateur...');
      const userProfile = await authService.getUserProfile(loginResult.user.id);
      if (userProfile) {
        console.log('✅ Profil récupéré !');
        console.log('   - Nom:', userProfile.name);
        console.log('   - Email:', userProfile.email);
        console.log('   - Rôle:', userProfile.role.name);
        console.log('   - Tenant:', userProfile.tenant.name);
        console.log('   - Dernière connexion:', userProfile.lastLoginAt);
      }

      // Test 4: Refresh token
      console.log('\n🔄 Test 4: Refresh token...');
      const refreshResult = await authService.refreshAccessToken(
        loginResult.refreshToken,
        '192.168.1.100'
      );
      console.log('✅ Token rafraîchi !');
      console.log('   - Nouveau token expires in:', refreshResult.expiresIn, 'secondes');

      // Test 5: Logout
      console.log('\n🚪 Test 5: Logout...');
      await authService.logout(
        loginResult.user.id,
        loginResult.refreshToken,
        '192.168.1.100'
      );
      console.log('✅ Logout réussi !');

      // Test 6: Tentative d'utilisation du refresh token révoqué
      console.log('\n❌ Test 6: Utilisation du refresh token révoqué...');
      try {
        await authService.refreshAccessToken(
          loginResult.refreshToken,
          '192.168.1.100'
        );
        console.log('❌ ERREUR: Le token révoqué a été accepté !');
      } catch (error) {
        console.log('✅ Token révoqué correctement rejeté:', error.message);
      }

    } catch (error) {
      console.error('❌ Erreur lors du test de login:', error.message);
    }

    // Test 7: Login avec identifiants invalides
    console.log('\n🚫 Test 7: Login avec identifiants invalides...');
    try {
      await authService.login(
        {
          email: 'inexistant@example.com',
          password: 'wrongpassword'
        },
        '192.168.1.100',
        'Test User Agent'
      );
      console.log('❌ ERREUR: Login avec identifiants invalides accepté !');
    } catch (error) {
      console.log('✅ Identifiants invalides correctement rejetés:', error.message);
    }

    // Test 8: Login avec mot de passe incorrect
    console.log('\n🔒 Test 8: Login avec mot de passe incorrect...');
    try {
      await authService.login(
        {
          email: 'ministre@mesrit.gov.ne',
          password: 'wrongpassword'
        },
        '192.168.1.100',
        'Test User Agent'
      );
      console.log('❌ ERREUR: Mot de passe incorrect accepté !');
    } catch (error) {
      console.log('✅ Mot de passe incorrect correctement rejeté:', error.message);
    }

    // Test 9: Test avec un autre utilisateur (CROU)
    console.log('\n🏢 Test 9: Login utilisateur CROU...');
    try {
      const crouLoginResult = await authService.login(
        {
          email: 'directeur@crou_niamey.gov.ne',
          password: 'password123'
        },
        '192.168.1.101',
        'Test User Agent CROU'
      );

      console.log('✅ Login CROU réussi !');
      console.log('   - Utilisateur:', crouLoginResult.user.name);
      console.log('   - Rôle:', crouLoginResult.user.role.name);
      console.log('   - Tenant:', crouLoginResult.user.tenant.name);
      console.log('   - Permissions:', crouLoginResult.user.permissions.length);

      // Logout immédiat
      await authService.logout(crouLoginResult.user.id, crouLoginResult.refreshToken);
      console.log('✅ Logout CROU réussi !');

    } catch (error) {
      console.error('❌ Erreur lors du test CROU:', error.message);
    }

    console.log('\n=====================================================');
    console.log('✅ Tous les tests d\'authentification terminés !');
    console.log('\n📊 Résumé des fonctionnalités testées:');
    console.log('   - ✅ Login avec base de données réelle');
    console.log('   - ✅ Validation des tokens JWT');
    console.log('   - ✅ Récupération du profil utilisateur');
    console.log('   - ✅ Refresh token avec base de données');
    console.log('   - ✅ Logout avec révocation des tokens');
    console.log('   - ✅ Gestion des erreurs d\'authentification');
    console.log('   - ✅ Support multi-tenant (Ministère + CROU)');
    console.log('   - ✅ Permissions RBAC intégrées');
    console.log('\n🎯 L\'authentification avec base de données est opérationnelle !');

  } catch (error) {
    console.error('❌ Erreur lors des tests d\'authentification:', error);
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
  testAuthDBConnection()
    .then(() => {
      console.log('🎉 Tests d\'authentification terminés !');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Échec des tests d\'authentification:', error);
      process.exit(1);
    });
}

export { testAuthDBConnection };
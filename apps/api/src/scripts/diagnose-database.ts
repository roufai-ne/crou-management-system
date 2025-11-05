/**
 * SCRIPT: diagnose-database.ts
 * DIAGNOSTIC: Vérifier l'état de la base de données
 *
 * DESCRIPTION:
 * Ce script vérifie si les tables et données essentielles existent
 * Aide à diagnostiquer les problèmes de seeds
 *
 * USAGE:
 * npm run diagnose:database
 *
 * AUTEUR: Claude Code
 * DATE: 2025-11-05
 */

import { AppDataSource } from '../../../../../packages/database/src/config/typeorm.config';

async function diagnoseDatabaseState() {
  try {
    console.log('🔄 Connexion à la base de données...\n');

    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
    }

    console.log('✅ Connexion établie\n');

    // Vérifier les tables principales
    console.log('📊 VÉRIFICATION DES TABLES:\n');

    const checks = [
      { table: 'tenants', entity: 'Tenant' },
      { table: 'roles', entity: 'Role' },
      { table: 'permissions', entity: 'Permission' },
      { table: 'users', entity: 'User' },
      { table: 'refresh_tokens', entity: 'RefreshToken' }
    ];

    for (const check of checks) {
      try {
        const result = await AppDataSource.query(
          `SELECT COUNT(*) as count FROM ${check.table}`
        );
        const count = parseInt(result[0].count);

        if (count > 0) {
          console.log(`   ✅ ${check.entity.padEnd(20)} ${count} enregistrement(s)`);
        } else {
          console.log(`   ⚠️  ${check.entity.padEnd(20)} VIDE (0 enregistrement)`);
        }
      } catch (error: any) {
        console.log(`   ❌ ${check.entity.padEnd(20)} TABLE N'EXISTE PAS`);
      }
    }

    // Vérifier les rôles spécifiques
    console.log('\n📋 VÉRIFICATION DES RÔLES:\n');

    try {
      const roles = await AppDataSource.query(
        `SELECT id, name, "tenantType" FROM roles ORDER BY name`
      );

      if (roles.length === 0) {
        console.log('   ⚠️  Aucun rôle trouvé - les seeds n\'ont pas été exécutés\n');
      } else {
        roles.forEach((role: any) => {
          console.log(`   - ${role.name} (${role.tenantType})`);
        });
        console.log(`\n   Total: ${roles.length} rôle(s)`);
      }
    } catch (error) {
      console.log('   ❌ Impossible de lire les rôles - table inexistante?\n');
    }

    // Vérifier les tenants
    console.log('\n🏢 VÉRIFICATION DES TENANTS:\n');

    try {
      const tenants = await AppDataSource.query(
        `SELECT id, name, type, code FROM tenants ORDER BY type, name`
      );

      if (tenants.length === 0) {
        console.log('   ⚠️  Aucun tenant trouvé - les seeds n\'ont pas été exécutés\n');
      } else {
        const ministere = tenants.filter((t: any) => t.type === 'MINISTERE');
        const crous = tenants.filter((t: any) => t.type === 'CROU');

        console.log(`   Ministère: ${ministere.length}`);
        ministere.forEach((t: any) => console.log(`      - ${t.name} (${t.code})`));

        console.log(`\n   CROU: ${crous.length}`);
        crous.forEach((t: any) => console.log(`      - ${t.name} (${t.code})`));

        console.log(`\n   Total: ${tenants.length} tenant(s)`);
      }
    } catch (error) {
      console.log('   ❌ Impossible de lire les tenants - table inexistante?\n');
    }

    // Vérifier les permissions
    console.log('\n🔑 VÉRIFICATION DES PERMISSIONS:\n');

    try {
      const permissions = await AppDataSource.query(
        `SELECT resource, COUNT(*) as count
         FROM permissions
         GROUP BY resource
         ORDER BY resource`
      );

      if (permissions.length === 0) {
        console.log('   ⚠️  Aucune permission trouvée - les seeds n\'ont pas été exécutés\n');
      } else {
        permissions.forEach((p: any) => {
          console.log(`   - ${p.resource}: ${p.count} permission(s)`);
        });

        const total = await AppDataSource.query(`SELECT COUNT(*) as count FROM permissions`);
        console.log(`\n   Total: ${total[0].count} permission(s)`);
      }
    } catch (error) {
      console.log('   ❌ Impossible de lire les permissions - table inexistante?\n');
    }

    // Vérifier les utilisateurs
    console.log('\n👥 VÉRIFICATION DES UTILISATEURS:\n');

    try {
      const users = await AppDataSource.query(
        `SELECT u.email, u.name, r.name as role_name, t.name as tenant_name
         FROM users u
         LEFT JOIN roles r ON u."roleId" = r.id
         LEFT JOIN tenants t ON u."tenantId" = t.id
         ORDER BY u.email
         LIMIT 10`
      );

      if (users.length === 0) {
        console.log('   ⚠️  Aucun utilisateur trouvé - les seeds n\'ont pas été exécutés\n');
      } else {
        users.forEach((u: any) => {
          console.log(`   - ${u.email}`);
          console.log(`     Role: ${u.role_name || 'N/A'}`);
          console.log(`     Tenant: ${u.tenant_name || 'N/A'}\n`);
        });

        const total = await AppDataSource.query(`SELECT COUNT(*) as count FROM users`);
        console.log(`   Total: ${total[0].count} utilisateur(s)`);

        if (users.length === 10 && total[0].count > 10) {
          console.log(`   (Affichage limité aux 10 premiers)`);
        }
      }
    } catch (error) {
      console.log('   ❌ Impossible de lire les utilisateurs - table inexistante?\n');
    }

    // Diagnostic final
    console.log('\n═══════════════════════════════════════════════════════\n');
    console.log('📋 DIAGNOSTIC:\n');

    const rolesCount = await AppDataSource.query(`SELECT COUNT(*) as count FROM roles`).then(r => parseInt(r[0].count)).catch(() => 0);
    const tenantsCount = await AppDataSource.query(`SELECT COUNT(*) as count FROM tenants`).then(r => parseInt(r[0].count)).catch(() => 0);
    const usersCount = await AppDataSource.query(`SELECT COUNT(*) as count FROM users`).then(r => parseInt(r[0].count)).catch(() => 0);

    if (rolesCount === 0 || tenantsCount === 0) {
      console.log('   ❌ BASE DE DONNÉES NON INITIALISÉE');
      console.log('\n   Actions recommandées:');
      console.log('   1. Exécuter les migrations: npm run db:run');
      console.log('   2. Exécuter les seeds: npm run db:seed');
      console.log('   3. OU tout réinitialiser: npm run db:reset\n');
    } else if (usersCount === 0) {
      console.log('   ⚠️  TABLES CRÉÉES MAIS DONNÉES MANQUANTES');
      console.log('\n   Actions recommandées:');
      console.log('   1. Exécuter les seeds: npm run db:seed\n');
    } else {
      console.log('   ✅ BASE DE DONNÉES INITIALISÉE ET FONCTIONNELLE');
      console.log(`\n   - ${tenantsCount} tenant(s)`);
      console.log(`   - ${rolesCount} rôle(s)`);
      console.log(`   - ${usersCount} utilisateur(s)\n`);
    }

    await AppDataSource.destroy();
    process.exit(0);

  } catch (error: any) {
    console.error('\n❌ ERREUR lors du diagnostic:', error.message);
    console.error('\nDétails:', error);

    if (error.message?.includes('database') && error.message?.includes('does not exist')) {
      console.log('\n💡 La base de données n\'existe pas.');
      console.log('   Créez-la avec: createdb crou_database');
    } else if (error.message?.includes('ECONNREFUSED')) {
      console.log('\n💡 PostgreSQL n\'est pas accessible.');
      console.log('   Vérifiez que PostgreSQL est démarré et accessible.');
    }

    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
    }
    process.exit(1);
  }
}

// Exécuter le diagnostic
diagnoseDatabaseState();

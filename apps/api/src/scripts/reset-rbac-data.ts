/**
 * SCRIPT: reset-rbac-data.ts
 * RESET: Nettoyer les anciennes données RBAC avant réinitialisation
 *
 * DESCRIPTION:
 * Ce script supprime toutes les données RBAC anciennes
 * pour permettre une réinitialisation propre avec les nouveaux seeds
 *
 * USAGE:
 * npm run reset:rbac
 *
 * AUTEUR: Claude Code
 * DATE: 2025-11-05
 */

import { AppDataSource } from '../../../../packages/database/src/config/typeorm.config';

async function resetRBACData() {
  try {
    console.log('🔄 Nettoyage des anciennes données RBAC...\n');

    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
    }

    console.log('✅ Connexion établie\n');

    // Désactiver les contraintes temporairement pour éviter les erreurs de clés étrangères
    console.log('🔓 Désactivation temporaire des contraintes de clés étrangères...');
    await AppDataSource.query('SET session_replication_role = replica;');

    // Ordre de suppression: commencer par les tables dépendantes
    const tables = [
      { name: 'refresh_tokens', label: 'Refresh Tokens' },
      { name: 'audit_logs', label: 'Audit Logs' },
      { name: 'users', label: 'Utilisateurs' },
      { name: 'role_permissions', label: 'Relations Rôles-Permissions' },
      { name: 'permissions', label: 'Permissions' },
      { name: 'roles', label: 'Rôles' },
      { name: 'tenants', label: 'Tenants' }
    ];

    console.log('🗑️  Suppression des données:\n');

    for (const table of tables) {
      try {
        const countResult = await AppDataSource.query(`SELECT COUNT(*) as count FROM ${table.name}`);
        const count = parseInt(countResult[0].count);

        if (count > 0) {
          await AppDataSource.query(`DELETE FROM ${table.name}`);
          console.log(`   ✅ ${table.label.padEnd(35)} ${count} supprimé(s)`);
        } else {
          console.log(`   ⚪ ${table.label.padEnd(35)} Déjà vide`);
        }
      } catch (error: any) {
        if (error.message?.includes('n\'existe pas') || error.message?.includes('does not exist')) {
          console.log(`   ⚪ ${table.label.padEnd(35)} Table n'existe pas`);
        } else {
          console.log(`   ⚠️  ${table.label.padEnd(35)} Erreur: ${error.message}`);
        }
      }
    }

    // Réactiver les contraintes
    console.log('\n🔒 Réactivation des contraintes de clés étrangères...');
    await AppDataSource.query('SET session_replication_role = DEFAULT;');

    // Réinitialiser les séquences (auto-increment)
    console.log('🔢 Réinitialisation des séquences...\n');

    const sequences = [
      'tenants_id_seq',
      'roles_id_seq',
      'permissions_id_seq',
      'users_id_seq'
    ];

    for (const seq of sequences) {
      try {
        await AppDataSource.query(`ALTER SEQUENCE IF EXISTS ${seq} RESTART WITH 1`);
        console.log(`   ✅ ${seq} réinitialisée`);
      } catch (error: any) {
        // Ignorer si la séquence n'existe pas
        if (!error.message?.includes('n\'existe pas') && !error.message?.includes('does not exist')) {
          console.log(`   ⚠️  ${seq}: ${error.message}`);
        }
      }
    }

    console.log('\n✅ Nettoyage terminé avec succès!');
    console.log('\n📋 Prochaines étapes:');
    console.log('   1. Exécuter les migrations: npm run db:run');
    console.log('   2. Exécuter les seeds RBAC: npm run db:seed');
    console.log('   3. OU tout en une fois: npm run db:reset\n');

    await AppDataSource.destroy();
    process.exit(0);

  } catch (error: any) {
    console.error('\n❌ ERREUR lors du nettoyage:', error);
    console.error('Détails:', error.message);

    if (AppDataSource.isInitialized) {
      // Réactiver les contraintes en cas d'erreur
      try {
        await AppDataSource.query('SET session_replication_role = DEFAULT;');
      } catch {}
      await AppDataSource.destroy();
    }
    process.exit(1);
  }
}

// Exécuter le script
resetRBACData();

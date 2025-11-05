/**
 * FICHIER: packages\database\src\seeders\run-seeders.ts
 * SCRIPT: Exécution de tous les seeders
 *
 * DESCRIPTION:
 * Point d'entrée principal pour les seeders
 * Délègue au système RBAC complet (run-rbac-seeders.ts)
 *
 * USAGE:
 * npm run db:seed
 *
 * AUTEUR: Équipe CROU
 * DATE: Décembre 2024
 */

import { runRBACseeders } from './run-rbac-seeders';

async function runAllSeeders() {
  try {
    console.log('🌱 Démarrage des seeders CROU...');
    console.log('📋 Exécution des seeders RBAC (tenants, rôles, permissions, utilisateurs)...\n');

    // Exécuter les seeders RBAC complets
    await runRBACseeders();

    console.log('\n✅ Base de données initialisée avec succès !');

  } catch (error: any) {
    console.error('\n❌ Erreur lors de l\'exécution des seeders:', error);
    console.error('Stack trace:', error.stack);
    process.exit(1);
  }
}

// Exécuter si appelé directement
if (import.meta.url === `file://${process.argv[1]}`) {
  runAllSeeders().catch(console.error);
}

export { runAllSeeders };
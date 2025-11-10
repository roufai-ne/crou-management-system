/**
 * Script de test pour diagnostiquer les erreurs 500 du module stocks
 * Usage: npx ts-node apps/api/src/test-stocks.ts
 */

import 'reflect-metadata';
import { AppDataSource } from '../../../packages/database/src/config/datasource';
import { Stock } from '../../../packages/database/src/entities/Stock.entity';

async function testStocks() {
  try {
    console.log('🔍 Test du module stocks...\n');

    // 1. Tester l'initialisation de la base de données
    console.log('1️⃣ Initialisation AppDataSource...');
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
      console.log('✅ AppDataSource initialisé\n');
    } else {
      console.log('✅ AppDataSource déjà initialisé\n');
    }

    // 2. Vérifier que l'entité Stock est enregistrée
    console.log('2️⃣ Vérification entité Stock...');
    const hasStock = AppDataSource.hasMetadata(Stock);
    console.log(`   Has Stock metadata: ${hasStock}`);

    if (!hasStock) {
      console.error('❌ L\'entité Stock n\'est pas enregistrée !');
      process.exit(1);
    }
    console.log('✅ Entité Stock enregistrée\n');

    // 3. Tester la récupération du repository
    console.log('3️⃣ Récupération du repository...');
    const stockRepo = AppDataSource.getRepository(Stock);
    console.log(`   Repository type: ${stockRepo.constructor.name}`);
    console.log('✅ Repository obtenu\n');

    // 4. Vérifier si la table existe
    console.log('4️⃣ Vérification de la table stocks...');
    const tableExists = await AppDataSource.query(
      `SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name = 'stocks'
      );`
    );
    console.log(`   Table exists: ${tableExists[0].exists}`);

    if (!tableExists[0].exists) {
      console.error('❌ La table stocks n\'existe pas en base !');
      console.log('\n💡 Solution: Exécutez les migrations avec:');
      console.log('   npm run migration:run');
      process.exit(1);
    }
    console.log('✅ Table stocks existe\n');

    // 5. Compter les stocks
    console.log('5️⃣ Comptage des stocks...');
    const count = await stockRepo.count();
    console.log(`   Nombre de stocks: ${count}\n`);

    // 6. Tester une requête simple
    console.log('6️⃣ Test requête SELECT...');
    const stocks = await stockRepo
      .createQueryBuilder('stock')
      .take(5)
      .getMany();
    console.log(`   Stocks récupérés: ${stocks.length}`);
    if (stocks.length > 0) {
      console.log(`   Premier stock: ${stocks[0].libelle}`);
    }
    console.log('✅ Requête réussie\n');

    // 7. Tester avec un tenantId fictif
    console.log('7️⃣ Test requête avec tenantId...');
    const testTenantId = '00000000-0000-0000-0000-000000000000';
    const stocksByTenant = await stockRepo
      .createQueryBuilder('stock')
      .where('stock.tenantId = :tenantId', { tenantId: testTenantId })
      .getMany();
    console.log(`   Stocks pour tenant test: ${stocksByTenant.length}`);
    console.log('✅ Requête filtrée réussie\n');

    console.log('🎉 Tous les tests passés !');
    console.log('\n📝 Résumé:');
    console.log(`   - AppDataSource: OK`);
    console.log(`   - Entité Stock: OK`);
    console.log(`   - Repository: OK`);
    console.log(`   - Table stocks: OK`);
    console.log(`   - Total stocks: ${count}`);
    console.log(`   - Requêtes: OK`);

  } catch (error) {
    console.error('\n❌ ERREUR:', error);
    console.error('\nStack trace:', error instanceof Error ? error.stack : 'N/A');
    process.exit(1);
  } finally {
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
      console.log('\n🔌 Connexion fermée');
    }
  }
}

// Exécuter le test
testStocks();

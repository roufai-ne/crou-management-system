/**
 * FICHIER: packages/database/src/seeds/004-test-data.seed.ts
 * SEED: Données de test pour le développement
 *
 * DESCRIPTION:
 * Seed optionnel pour créer des données de test dans tous les modules
 * À utiliser UNIQUEMENT en environnement de développement/staging
 * NE PAS EXÉCUTER EN PRODUCTION
 *
 * DONNÉES CRÉÉES:
 * - Budgets de test pour plusieurs CROU
 * - Stocks et mouvements de stock
 * - Logements et occupations
 * - Véhicules et maintenances
 * - Transactions financières
 *
 * AUTEUR: Équipe CROU
 * DATE: Janvier 2025
 */

import { DataSource } from 'typeorm';
import { Tenant } from '../entities/Tenant.entity';
import { User } from '../entities/User.entity';
import { Budget } from '../entities/financial/Budget.entity';
import { BudgetCategory } from '../entities/financial/BudgetCategory.entity';
import { Transaction } from '../entities/financial/Transaction.entity';
import { Stock } from '../entities/stocks/Stock.entity';
import { StockMovement } from '../entities/stocks/StockMovement.entity';
import { Supplier } from '../entities/stocks/Supplier.entity';
import { Housing } from '../entities/housing/Housing.entity';
import { Room } from '../entities/housing/Room.entity';
import { Vehicle } from '../entities/transport/Vehicle.entity';

export const seedTestData = async (dataSource: DataSource): Promise<void> => {
  // Vérifier l'environnement
  if (process.env.NODE_ENV === 'production') {
    console.log('⚠️  ATTENTION: Les seeds de test ne doivent PAS être exécutés en production !');
    console.log('⏭️  Passage au seed suivant...');
    return;
  }

  const tenantRepository = dataSource.getRepository(Tenant);
  const userRepository = dataSource.getRepository(User);
  const budgetRepository = dataSource.getRepository(Budget);
  const budgetCategoryRepository = dataSource.getRepository(BudgetCategory);
  const transactionRepository = dataSource.getRepository(Transaction);
  const stockRepository = dataSource.getRepository(Stock);
  const stockMovementRepository = dataSource.getRepository(StockMovement);
  const supplierRepository = dataSource.getRepository(Supplier);
  const housingRepository = dataSource.getRepository(Housing);
  const roomRepository = dataSource.getRepository(Room);
  const vehicleRepository = dataSource.getRepository(Vehicle);

  // Vérifier si des données de test existent déjà
  const existingBudgets = await budgetRepository.count();
  if (existingBudgets > 0) {
    console.log('⏭️  Données de test déjà créées, passage au seed suivant...');
    return;
  }

  console.log('🌱 Création des données de test...');
  console.log('⚠️  Mode développement détecté');
  console.log('');

  // Récupérer les tenants et utilisateurs
  const crouNiamey = await tenantRepository.findOne({ where: { code: 'CROU_NIAMEY' } });
  const crouMaradi = await tenantRepository.findOne({ where: { code: 'CROU_MARADI' } });

  if (!crouNiamey || !crouMaradi) {
    console.error('❌ Tenants non trouvés. Exécuter d\'abord les seeds de tenants.');
    return;
  }

  const directeur = await userRepository.findOne({
    where: { email: 'directeur.niamey@crou.ne' },
    relations: ['tenant']
  });

  if (!directeur) {
    console.error('❌ Utilisateurs non trouvés. Exécuter d\'abord les seeds d\'utilisateurs.');
    return;
  }

  // ===================================
  // 1. BUDGETS ET CATÉGORIES
  // ===================================
  console.log('💰 Création des budgets de test...');

  const categories = await budgetCategoryRepository.save([
    budgetCategoryRepository.create({
      code: 'PERSONNEL',
      name: 'Personnel et Salaires',
      type: 'PERSONNEL',
      description: 'Rémunérations et charges sociales',
      isActive: true,
      tenantId: crouNiamey.id
    }),
    budgetCategoryRepository.create({
      code: 'FONCTIONNEMENT',
      name: 'Fonctionnement',
      type: 'FONCTIONNEMENT',
      description: 'Dépenses courantes',
      isActive: true,
      tenantId: crouNiamey.id
    }),
    budgetCategoryRepository.create({
      code: 'INVESTISSEMENT',
      name: 'Investissement',
      type: 'INVESTISSEMENT',
      description: 'Équipements et infrastructures',
      isActive: true,
      tenantId: crouNiamey.id
    })
  ]);

  const budget2025 = await budgetRepository.save(
    budgetRepository.create({
      year: 2025,
      totalAmount: 500000000, // 500 millions XOF
      allocatedAmount: 300000000,
      committedAmount: 150000000,
      executedAmount: 100000000,
      status: 'APPROVED',
      tenantId: crouNiamey.id,
      approvedBy: directeur.id,
      approvedAt: new Date()
    })
  );

  console.log('✅ Budgets créés: 1 budget avec 3 catégories');

  // ===================================
  // 2. TRANSACTIONS FINANCIÈRES
  // ===================================
  console.log('💳 Création des transactions de test...');

  await transactionRepository.save([
    transactionRepository.create({
      reference: 'TRX-2025-001',
      type: 'EXPENSE',
      amount: 15000000,
      category: 'PERSONNEL',
      description: 'Salaires du personnel - Janvier 2025',
      status: 'COMPLETED',
      date: new Date('2025-01-05'),
      tenantId: crouNiamey.id,
      createdBy: directeur.id
    }),
    transactionRepository.create({
      reference: 'TRX-2025-002',
      type: 'EXPENSE',
      amount: 5000000,
      category: 'FONCTIONNEMENT',
      description: 'Fournitures de bureau',
      status: 'COMPLETED',
      date: new Date('2025-01-10'),
      tenantId: crouNiamey.id,
      createdBy: directeur.id
    }),
    transactionRepository.create({
      reference: 'TRX-2025-003',
      type: 'INCOME',
      amount: 50000000,
      category: 'SUBVENTION',
      description: 'Subvention gouvernementale Q1 2025',
      status: 'COMPLETED',
      date: new Date('2025-01-15'),
      tenantId: crouNiamey.id,
      createdBy: directeur.id
    })
  ]);

  console.log('✅ Transactions créées: 3 transactions');

  // ===================================
  // 3. FOURNISSEURS ET STOCKS
  // ===================================
  console.log('📦 Création des stocks de test...');

  const fournisseur1 = await supplierRepository.save(
    supplierRepository.create({
      code: 'FOUR-001',
      nom: 'Société SAHELIENNE APPROVISIONNEMENT',
      nomCommercial: 'SAHEL APPRO',
      type: 'FOURNISSEUR',
      status: 'ACTIF',
      telephone: '+227 20 73 45 67',
      email: 'contact@sahel-appro.ne',
      adresse: 'Rue de la Tapoa, Niamey',
      ville: 'Niamey',
      isPreference: true,
      tenantId: crouNiamey.id
    })
  );

  const stocks = await stockRepository.save([
    stockRepository.create({
      code: 'STK-RIZ-001',
      name: 'Riz Blanc 25kg',
      category: 'ALIMENTATION',
      quantity: 500,
      unit: 'SAC',
      minQuantity: 100,
      unitPrice: 15000,
      location: 'Magasin Central A',
      tenantId: crouNiamey.id
    }),
    stockRepository.create({
      code: 'STK-HUILE-001',
      name: 'Huile Végétale 20L',
      category: 'ALIMENTATION',
      quantity: 200,
      unit: 'BIDON',
      minQuantity: 50,
      unitPrice: 18000,
      location: 'Magasin Central A',
      tenantId: crouNiamey.id
    }),
    stockRepository.create({
      code: 'STK-BUR-001',
      name: 'Papier A4 Ramette',
      category: 'FOURNITURES',
      quantity: 150,
      unit: 'RAMETTE',
      minQuantity: 30,
      unitPrice: 2500,
      location: 'Bureau Admin',
      tenantId: crouNiamey.id
    })
  ]);

  await stockMovementRepository.save([
    stockMovementRepository.create({
      stockId: stocks[0].id,
      type: 'ENTREE',
      quantity: 500,
      reference: 'ENT-2025-001',
      reason: 'Réapprovisionnement initial',
      tenantId: crouNiamey.id,
      createdBy: directeur.id
    }),
    stockMovementRepository.create({
      stockId: stocks[0].id,
      type: 'SORTIE',
      quantity: 50,
      reference: 'SOR-2025-001',
      reason: 'Distribution restaurant universitaire',
      tenantId: crouNiamey.id,
      createdBy: directeur.id
    })
  ]);

  console.log('✅ Stocks créés: 1 fournisseur, 3 articles, 2 mouvements');

  // ===================================
  // 4. LOGEMENTS
  // ===================================
  console.log('🏠 Création des logements de test...');

  const residenceA = await housingRepository.save(
    housingRepository.create({
      code: 'RES-A',
      name: 'Résidence A - Campus',
      type: 'RESIDENCE',
      capacity: 100,
      address: 'Campus Universitaire Abdou Moumouni',
      city: 'Niamey',
      status: 'ACTIVE',
      amenities: ['Électricité', 'Eau courante', 'Internet', 'Salle d\'étude'],
      tenantId: crouNiamey.id
    })
  );

  await roomRepository.save([
    roomRepository.create({
      housingId: residenceA.id,
      roomNumber: 'A-101',
      type: 'DOUBLE',
      capacity: 2,
      floor: 1,
      status: 'AVAILABLE',
      monthlyRent: 15000,
      amenities: ['Lit', 'Bureau', 'Armoire'],
      tenantId: crouNiamey.id
    }),
    roomRepository.create({
      housingId: residenceA.id,
      roomNumber: 'A-102',
      type: 'DOUBLE',
      capacity: 2,
      floor: 1,
      status: 'OCCUPIED',
      monthlyRent: 15000,
      amenities: ['Lit', 'Bureau', 'Armoire'],
      tenantId: crouNiamey.id
    }),
    roomRepository.create({
      housingId: residenceA.id,
      roomNumber: 'A-201',
      type: 'SIMPLE',
      capacity: 1,
      floor: 2,
      status: 'AVAILABLE',
      monthlyRent: 20000,
      amenities: ['Lit', 'Bureau', 'Armoire', 'Climatisation'],
      tenantId: crouNiamey.id
    })
  ]);

  console.log('✅ Logements créés: 1 résidence, 3 chambres');

  // ===================================
  // 5. VÉHICULES
  // ===================================
  console.log('🚗 Création des véhicules de test...');

  await vehicleRepository.save([
    vehicleRepository.create({
      registrationNumber: 'NE-123-AB',
      brand: 'Toyota',
      model: 'HiLux',
      year: 2023,
      type: 'PICKUP',
      status: 'AVAILABLE',
      mileage: 15000,
      fuelType: 'DIESEL',
      capacity: 5,
      acquisitionDate: new Date('2023-06-01'),
      tenantId: crouNiamey.id
    }),
    vehicleRepository.create({
      registrationNumber: 'NE-456-CD',
      brand: 'Peugeot',
      model: 'Expert',
      year: 2022,
      type: 'VAN',
      status: 'IN_USE',
      mileage: 45000,
      fuelType: 'DIESEL',
      capacity: 9,
      acquisitionDate: new Date('2022-03-15'),
      tenantId: crouNiamey.id
    })
  ]);

  console.log('✅ Véhicules créés: 2 véhicules');

  console.log('');
  console.log('✅ Seeds de données de test terminé avec succès !');
  console.log('');
  console.log('📊 Résumé des données créées:');
  console.log('   💰 Budgets: 1');
  console.log('   📁 Catégories budgétaires: 3');
  console.log('   💳 Transactions: 3');
  console.log('   🏢 Fournisseurs: 1');
  console.log('   📦 Articles en stock: 3');
  console.log('   📋 Mouvements de stock: 2');
  console.log('   🏠 Logements: 1 résidence');
  console.log('   🚪 Chambres: 3');
  console.log('   🚗 Véhicules: 2');
  console.log('');
  console.log('⚠️  Ces données sont à usage de développement uniquement !');
  console.log('');
};

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
import { Budget, BudgetType, BudgetStatus } from '../entities/Budget.entity';
import { BudgetCategory } from '../entities/BudgetCategory.entity';
import { BudgetCategoryType } from '../enums/budget.enum';
import { Transaction, TransactionType, TransactionCategory, TransactionStatus } from '../entities/Transaction.entity';
import { Stock, StockType, StockCategory, StockUnit, StockStatus } from '../entities/Stock.entity';
import { StockMovement, MovementType, MovementReason } from '../entities/StockMovement.entity';
import { Supplier, SupplierType, SupplierStatus } from '../entities/Supplier.entity';
import { Housing, HousingType, HousingCategory, HousingStatus } from '../entities/Housing.entity';
import { Room, RoomType, RoomStatus } from '../entities/Room.entity';
import { Vehicle, VehicleType, VehicleStatus, FuelType } from '../entities/Vehicle.entity';

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

  const budget2025 = await budgetRepository.save(
    budgetRepository.create({
      tenantId: crouNiamey.id,
      exercice: 2025,
      type: BudgetType.CROU,
      libelle: 'Budget CROU Niamey 2025',
      description: 'Budget annuel du CROU de Niamey pour l\'exercice 2025',
      montantInitial: 500000000, // 500 millions XOF
      montantRealise: 100000000,
      montantEngage: 150000000,
      montantDisponible: 250000000,
      tauxExecution: 20,
      status: BudgetStatus.ACTIVE,
      validationLevel: 2,
      createdBy: directeur.id,
      approvedBy: directeur.id,
      approvedAt: new Date()
    })
  );

  await budgetCategoryRepository.save([
    budgetCategoryRepository.create({
      budgetId: budget2025.id,
      libelle: 'Personnel et Salaires',
      type: BudgetCategoryType.PERSONNEL,
      description: 'Rémunérations et charges sociales',
      code: 'PERS',
      montantAlloue: 200000000,
      montantRealise: 50000000,
      montantEngage: 50000000,
      montantDisponible: 100000000,
      tauxExecution: 25,
      isActive: true,
      createdBy: directeur.id
    }),
    budgetCategoryRepository.create({
      budgetId: budget2025.id,
      libelle: 'Fonctionnement',
      type: BudgetCategoryType.FONCTIONNEMENT,
      description: 'Dépenses courantes',
      code: 'FONC',
      montantAlloue: 150000000,
      montantRealise: 30000000,
      montantEngage: 50000000,
      montantDisponible: 70000000,
      tauxExecution: 20,
      isActive: true,
      createdBy: directeur.id
    }),
    budgetCategoryRepository.create({
      budgetId: budget2025.id,
      libelle: 'Investissement',
      type: BudgetCategoryType.INVESTISSEMENT,
      description: 'Équipements et infrastructures',
      code: 'INVT',
      montantAlloue: 150000000,
      montantRealise: 20000000,
      montantEngage: 50000000,
      montantDisponible: 80000000,
      tauxExecution: 13.33,
      isActive: true,
      createdBy: directeur.id
    })
  ]);

  console.log('✅ Budgets créés: 1 budget avec 3 catégories');

  // ===================================
  // 2. TRANSACTIONS FINANCIÈRES
  // ===================================
  console.log('💳 Création des transactions de test...');

  await transactionRepository.save([
    transactionRepository.create({
      tenantId: crouNiamey.id,
      budgetId: budget2025.id,
      libelle: 'Salaires du personnel - Janvier 2025',
      description: 'Paiement des salaires mensuels',
      type: TransactionType.DEPENSE,
      category: TransactionCategory.SALAIRES,
      status: TransactionStatus.EXECUTED,
      montant: 15000000,
      devise: 'XOF',
      numeroPiece: 'SAL-2025-001',
      reference: 'TRX-2025-001',
      beneficiaire: 'Personnel CROU Niamey',
      modePaiement: 'Virement bancaire',
      date: new Date('2025-01-05'),
      dateExecution: new Date('2025-01-05'),
      validationLevel: 2,
      createdBy: directeur.id,
      approvedBy: directeur.id,
      approvedAt: new Date('2025-01-05')
    }),
    transactionRepository.create({
      tenantId: crouNiamey.id,
      budgetId: budget2025.id,
      libelle: 'Fournitures de bureau',
      description: 'Achat de fournitures administratives',
      type: TransactionType.DEPENSE,
      category: TransactionCategory.FOURNITURES,
      status: TransactionStatus.EXECUTED,
      montant: 5000000,
      devise: 'XOF',
      numeroPiece: 'FOUR-2025-001',
      reference: 'TRX-2025-002',
      beneficiaire: 'Société SAHEL APPRO',
      modePaiement: 'Chèque',
      date: new Date('2025-01-10'),
      dateExecution: new Date('2025-01-12'),
      validationLevel: 1,
      createdBy: directeur.id,
      approvedBy: directeur.id,
      approvedAt: new Date('2025-01-10')
    }),
    transactionRepository.create({
      tenantId: crouNiamey.id,
      budgetId: budget2025.id,
      libelle: 'Subvention gouvernementale Q1 2025',
      description: 'Transfert trimestriel du Ministère',
      type: TransactionType.RECETTE,
      category: TransactionCategory.SUBVENTIONS,
      status: TransactionStatus.EXECUTED,
      montant: 50000000,
      devise: 'XOF',
      numeroPiece: 'SUB-2025-Q1',
      reference: 'TRX-2025-003',
      beneficiaire: 'CROU Niamey',
      modePaiement: 'Virement bancaire',
      date: new Date('2025-01-15'),
      dateExecution: new Date('2025-01-15'),
      validationLevel: 2,
      createdBy: directeur.id,
      approvedBy: directeur.id,
      approvedAt: new Date('2025-01-15')
    })
  ]);

  console.log('✅ Transactions créées: 3 transactions');

  // ===================================
  // 3. FOURNISSEURS ET STOCKS
  // ===================================
  console.log('📦 Création des stocks de test...');

  const fournisseur1 = await supplierRepository.save(
    supplierRepository.create({
      tenantId: crouNiamey.id,
      code: 'FOUR-001',
      nom: 'Société SAHELIENNE APPROVISIONNEMENT',
      nomCommercial: 'SAHEL APPRO',
      type: SupplierType.FOURNISSEUR,
      status: SupplierStatus.ACTIF,
      description: 'Fournisseur principal de denrées alimentaires',
      telephone: '+227 20 73 45 67',
      email: 'contact@sahel-appro.ne',
      adresse: 'Rue de la Tapoa, Niamey',
      ville: 'Niamey',
      region: 'Niamey',
      pays: 'Niger',
      contactPrincipal: 'Amadou Diallo',
      emailContact: 'a.diallo@sahel-appro.ne',
      telephoneContact: '+227 90 12 34 56',
      delaiPaiement: 30,
      devise: 'XOF',
      isActif: true,
      isPreference: true,
      createdBy: directeur.id
    })
  );

  const stocks = await stockRepository.save([
    stockRepository.create({
      tenantId: crouNiamey.id,
      code: 'STK-RIZ-001',
      libelle: 'Riz Blanc 25kg',
      description: 'Riz blanc de qualité supérieure en sacs de 25kg',
      type: StockType.CENTRALISE,
      category: StockCategory.CEREALES,
      unit: StockUnit.SAC,
      status: StockStatus.ACTIF,
      quantiteActuelle: 500,
      quantiteReservee: 50,
      quantiteDisponible: 450,
      seuilMinimum: 100,
      seuilMaximum: 1000,
      prixUnitaire: 15000,
      valeurStock: 7500000,
      devise: 'XOF',
      supplierId: fournisseur1.id,
      fournisseur: fournisseur1.nom,
      isPerissable: false,
      isActif: true,
      createdBy: directeur.id
    }),
    stockRepository.create({
      tenantId: crouNiamey.id,
      code: 'STK-HUILE-001',
      libelle: 'Huile Végétale 20L',
      description: 'Huile végétale en bidons de 20 litres',
      type: StockType.CENTRALISE,
      category: StockCategory.DENREES,
      unit: StockUnit.LITRE,
      status: StockStatus.ACTIF,
      quantiteActuelle: 200,
      quantiteReservee: 20,
      quantiteDisponible: 180,
      seuilMinimum: 50,
      seuilMaximum: 500,
      prixUnitaire: 18000,
      valeurStock: 3600000,
      devise: 'XOF',
      supplierId: fournisseur1.id,
      fournisseur: fournisseur1.nom,
      isPerissable: false,
      isActif: true,
      createdBy: directeur.id
    }),
    stockRepository.create({
      tenantId: crouNiamey.id,
      code: 'STK-BUR-001',
      libelle: 'Papier A4 Ramette',
      description: 'Ramettes de papier A4 blanc 80g',
      type: StockType.LOCAL,
      category: StockCategory.FOURNITURES,
      unit: StockUnit.UNITE,
      status: StockStatus.ACTIF,
      quantiteActuelle: 150,
      quantiteReservee: 10,
      quantiteDisponible: 140,
      seuilMinimum: 30,
      seuilMaximum: 300,
      prixUnitaire: 2500,
      valeurStock: 375000,
      devise: 'XOF',
      isPerissable: false,
      isActif: true,
      createdBy: directeur.id
    })
  ]);

  await stockMovementRepository.save([
    stockMovementRepository.create({
      stockId: stocks[0].id,
      tenantId: crouNiamey.id,
      numero: 'ENT-2025-001',
      libelle: 'Réapprovisionnement initial riz',
      description: 'Livraison initiale de riz pour le trimestre',
      type: MovementType.ENTREE,
      reason: MovementReason.RECEPTION,
      status: 'confirmed' as any,
      quantite: 500,
      quantiteAvant: 0,
      quantiteApres: 500,
      unit: 'SAC',
      prixUnitaire: 15000,
      valeurTotale: 7500000,
      devise: 'XOF',
      numeroBon: 'BON-2025-001',
      fournisseur: fournisseur1.nom,
      date: new Date('2025-01-05'),
      dateConfirmation: new Date('2025-01-05'),
      createdBy: directeur.id,
      confirmedBy: directeur.id
    }),
    stockMovementRepository.create({
      stockId: stocks[0].id,
      tenantId: crouNiamey.id,
      numero: 'SOR-2025-001',
      libelle: 'Distribution restaurant universitaire',
      description: 'Sortie pour préparation repas étudiants',
      type: MovementType.SORTIE,
      reason: MovementReason.CONSOMMATION,
      status: 'confirmed' as any,
      quantite: 50,
      quantiteAvant: 500,
      quantiteApres: 450,
      unit: 'SAC',
      destinataire: 'Restaurant Universitaire',
      date: new Date('2025-01-08'),
      dateConfirmation: new Date('2025-01-08'),
      createdBy: directeur.id,
      confirmedBy: directeur.id
    })
  ]);

  console.log('✅ Stocks créés: 1 fournisseur, 3 articles, 2 mouvements');

  // ===================================
  // 4. LOGEMENTS
  // ===================================
  console.log('🏠 Création des logements de test...');

  const residenceA = await housingRepository.save(
    housingRepository.create({
      tenantId: crouNiamey.id,
      code: 'RES-A',
      nom: 'Résidence A - Campus',
      description: 'Résidence universitaire principale du campus',
      type: HousingType.CITE_UNIVERSITAIRE,
      category: HousingCategory.STANDARD,
      status: HousingStatus.ACTIF,
      adresse: 'Campus Universitaire Abdou Moumouni',
      ville: 'Niamey',
      region: 'Niamey',
      nombreChambres: 100,
      capaciteTotale: 200,
      occupationActuelle: 150,
      tauxOccupation: 75,
      loyerMensuel: 15000,
      caution: 30000,
      devise: 'XOF',
      equipements: ['Électricité', 'Eau courante', 'Internet'],
      services: ['Salle d\'étude', 'Laverie'],
      wifi: true,
      securite: true,
      dateOuverture: new Date('2020-01-01'),
      isActif: true,
      createdBy: directeur.id
    })
  );

  await roomRepository.save([
    roomRepository.create({
      housingId: residenceA.id,
      numero: 'A-101',
      etage: '1',
      batiment: 'A',
      type: RoomType.DOUBLE,
      status: RoomStatus.DISPONIBLE,
      capacite: 2,
      occupation: 0,
      tauxOccupation: 0,
      equipements: ['Lit', 'Bureau', 'Armoire'],
      wifi: true,
      loyerMensuel: 15000,
      caution: 30000,
      devise: 'XOF',
      isActif: true,
      createdBy: directeur.id
    }),
    roomRepository.create({
      housingId: residenceA.id,
      numero: 'A-102',
      etage: '1',
      batiment: 'A',
      type: RoomType.DOUBLE,
      status: RoomStatus.OCCUPE,
      capacite: 2,
      occupation: 2,
      tauxOccupation: 100,
      equipements: ['Lit', 'Bureau', 'Armoire'],
      wifi: true,
      loyerMensuel: 15000,
      caution: 30000,
      devise: 'XOF',
      isActif: true,
      createdBy: directeur.id
    }),
    roomRepository.create({
      housingId: residenceA.id,
      numero: 'A-201',
      etage: '2',
      batiment: 'A',
      type: RoomType.SIMPLE,
      status: RoomStatus.DISPONIBLE,
      capacite: 1,
      occupation: 0,
      tauxOccupation: 0,
      equipements: ['Lit', 'Bureau', 'Armoire', 'Climatisation'],
      climatisation: true,
      wifi: true,
      loyerMensuel: 20000,
      caution: 40000,
      devise: 'XOF',
      isActif: true,
      createdBy: directeur.id
    })
  ]);

  console.log('✅ Logements créés: 1 résidence, 3 chambres');

  // ===================================
  // 5. VÉHICULES
  // ===================================
  console.log('🚗 Création des véhicules de test...');

  await vehicleRepository.save([
    vehicleRepository.create({
      tenantId: crouNiamey.id,
      immatriculation: 'NE-123-AB',
      marque: 'Toyota',
      modele: 'HiLux',
      version: 'Double Cabin 4x4',
      type: VehicleType.UTILITAIRE,
      status: VehicleStatus.ACTIF,
      annee: 2023,
      couleur: 'Blanc',
      typeCarburant: FuelType.DIESEL,
      capacitePassagers: 5,
      kilometrageActuel: 15000,
      kilometrageAchat: 0,
      prixAchat: 25000000,
      valeurActuelle: 23000000,
      consommationMoyenne: 10.5,
      devise: 'XOF',
      compagnieAssurance: 'SNAR Assurances',
      numeroAssurance: 'ASS-2024-12345',
      dateExpirationAssurance: new Date('2025-12-31'),
      dateExpirationControle: new Date('2025-06-30'),
      dateAchat: new Date('2023-06-01'),
      dateMiseEnService: new Date('2023-06-01'),
      isActif: true,
      createdBy: directeur.id
    }),
    vehicleRepository.create({
      tenantId: crouNiamey.id,
      immatriculation: 'NE-456-CD',
      marque: 'Peugeot',
      modele: 'Expert',
      version: 'L2H2 9 places',
      type: VehicleType.MINIBUS,
      status: VehicleStatus.ACTIF,
      annee: 2022,
      couleur: 'Gris',
      typeCarburant: FuelType.DIESEL,
      capacitePassagers: 9,
      kilometrageActuel: 45000,
      kilometrageAchat: 0,
      prixAchat: 18000000,
      valeurActuelle: 14000000,
      consommationMoyenne: 8.5,
      devise: 'XOF',
      compagnieAssurance: 'SNAR Assurances',
      numeroAssurance: 'ASS-2024-67890',
      dateExpirationAssurance: new Date('2025-09-30'),
      dateExpirationControle: new Date('2025-03-31'),
      dateAchat: new Date('2022-03-15'),
      dateMiseEnService: new Date('2022-03-15'),
      isActif: true,
      createdBy: directeur.id
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

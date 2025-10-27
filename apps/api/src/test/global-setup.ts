/**
 * FICHIER: apps\api\src\test\global-setup.ts
 * SETUP: Configuration globale des tests
 * 
 * DESCRIPTION:
 * Configuration globale pour les tests d'intégration
 * Initialisation de la base de données de test
 * 
 * AUTEUR: Équipe CROU
 * DATE: Décembre 2024
 */

import { AppDataSource } from '../config/database';
import { logger } from '../shared/utils/logger';

export default async function globalSetup() {
  try {
    logger.info('Initialisation de la base de données de test...');
    
    // Initialiser la base de données
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
    }
    
    // Créer les tables
    await AppDataSource.synchronize();
    
    // Insérer les données de test de base
    await seedTestData();
    
    logger.info('Base de données de test initialisée avec succès');
  } catch (error) {
    logger.error('Erreur initialisation base de données de test:', error);
    throw error;
  }
}

async function seedTestData() {
  try {
    // Créer les tenants de test
    const tenantRepository = AppDataSource.getRepository('Tenant');
    
    const testTenants = [
      {
        id: 'test-tenant-1',
        name: 'Ministère de l\'Enseignement Supérieur',
        code: 'MES',
        type: 'ministere',
        region: 'Niamey',
        isActive: true
      },
      {
        id: 'test-tenant-2',
        name: 'CROU Niamey',
        code: 'CROU-NI',
        type: 'crou',
        region: 'Niamey',
        isActive: true
      },
      {
        id: 'test-tenant-3',
        name: 'CROU Zinder',
        code: 'CROU-ZI',
        type: 'crou',
        region: 'Zinder',
        isActive: true
      }
    ];

    for (const tenantData of testTenants) {
      const existingTenant = await tenantRepository.findOne({ where: { id: tenantData.id } });
      if (!existingTenant) {
        const tenant = tenantRepository.create(tenantData);
        await tenantRepository.save(tenant);
      }
    }

    // Créer les utilisateurs de test
    const userRepository = AppDataSource.getRepository('User');
    
    const testUsers = [
      {
        id: 'test-user-1',
        email: 'admin@crou.niger',
        password: '$2b$10$test.hash.for.password123',
        name: 'Admin Test',
        role: 'admin',
        status: 'active',
        tenantId: 'test-tenant-1'
      },
      {
        id: 'test-user-2',
        email: 'manager@crou.niger',
        password: '$2b$10$test.hash.for.password123',
        name: 'Manager Test',
        role: 'manager',
        status: 'active',
        tenantId: 'test-tenant-2'
      },
      {
        id: 'test-user-3',
        email: 'user@crou.niger',
        password: '$2b$10$test.hash.for.password123',
        name: 'User Test',
        role: 'user',
        status: 'active',
        tenantId: 'test-tenant-2'
      }
    ];

    for (const userData of testUsers) {
      const existingUser = await userRepository.findOne({ where: { id: userData.id } });
      if (!existingUser) {
        const user = userRepository.create(userData);
        await userRepository.save(user);
      }
    }

    // Créer les catégories de budget de test
    const budgetCategoryRepository = AppDataSource.getRepository('BudgetCategory');
    
    const testCategories = [
      {
        id: 'test-category-1',
        name: 'Éducation',
        type: 'expense',
        description: 'Catégorie pour les dépenses d\'éducation',
        tenantId: 'test-tenant-1'
      },
      {
        id: 'test-category-2',
        name: 'Logement',
        type: 'expense',
        description: 'Catégorie pour les dépenses de logement',
        tenantId: 'test-tenant-1'
      },
      {
        id: 'test-category-3',
        name: 'Transport',
        type: 'expense',
        description: 'Catégorie pour les dépenses de transport',
        tenantId: 'test-tenant-1'
      }
    ];

    for (const categoryData of testCategories) {
      const existingCategory = await budgetCategoryRepository.findOne({ where: { id: categoryData.id } });
      if (!existingCategory) {
        const category = budgetCategoryRepository.create(categoryData);
        await budgetCategoryRepository.save(category);
      }
    }

    logger.info('Données de test insérées avec succès');
  } catch (error) {
    logger.error('Erreur insertion données de test:', error);
    throw error;
  }
}

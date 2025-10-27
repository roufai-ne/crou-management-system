/**
 * FICHIER: apps\api\src\test\setup.integration.ts
 * SETUP: Configuration des tests d'intégration
 * 
 * DESCRIPTION:
 * Configuration pour les tests d'intégration API
 * Base de données de test et mocks
 * 
 * AUTEUR: Équipe CROU
 * DATE: Décembre 2024
 */

import { beforeAll, beforeEach, afterEach, afterAll } from '@jest/globals';
import { AppDataSource } from '../config/database';
import { logger } from '../shared/utils/logger';

// Configuration de la base de données de test
const TEST_DATABASE_URL = process.env.TEST_DATABASE_URL || 'postgresql://test:test@localhost:5432/crou_test';

// Nettoyer la base de données avant chaque test
beforeEach(async () => {
  if (AppDataSource.isInitialized) {
    // Nettoyer les tables dans l'ordre inverse des dépendances
    const entities = AppDataSource.entityMetadatas;
    const tableNames = entities
      .map(entity => `"${entity.tableName}"`)
      .join(', ');
    
    if (tableNames) {
      await AppDataSource.query(`TRUNCATE TABLE ${tableNames} RESTART IDENTITY CASCADE`);
    }
  }
});

// Nettoyer après chaque test
afterEach(async () => {
  // Nettoyer les données de test
  if (AppDataSource.isInitialized) {
    const entities = AppDataSource.entityMetadatas;
    const tableNames = entities
      .map(entity => `"${entity.tableName}"`)
      .join(', ');
    
    if (tableNames) {
      await AppDataSource.query(`TRUNCATE TABLE ${tableNames} RESTART IDENTITY CASCADE`);
    }
  }
});

// Configuration globale
beforeAll(async () => {
  try {
    // Initialiser la base de données de test
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
    }
    
    // Créer les tables si elles n'existent pas
    await AppDataSource.synchronize();
    
    logger.info('Base de données de test initialisée');
  } catch (error) {
    logger.error('Erreur initialisation base de données de test:', error);
    throw error;
  }
});

// Nettoyage final
afterAll(async () => {
  try {
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
    }
    logger.info('Base de données de test fermée');
  } catch (error) {
    logger.error('Erreur fermeture base de données de test:', error);
  }
});

// Utilitaires de test
export const testUtils = {
  // Créer un utilisateur de test
  createTestUser: async (userData: any = {}) => {
    const defaultUser = {
      email: 'test@crou.niger',
      password: 'password123',
      name: 'Test User',
      role: 'admin',
      status: 'active',
      tenantId: 'test-tenant-1',
      ...userData
    };

    const userRepository = AppDataSource.getRepository('User');
    const user = userRepository.create(defaultUser);
    return await userRepository.save(user);
  },

  // Créer un tenant de test
  createTestTenant: async (tenantData: any = {}) => {
    const defaultTenant = {
      name: 'Test Tenant',
      code: 'TEST',
      type: 'crou',
      region: 'Niamey',
      isActive: true,
      ...tenantData
    };

    const tenantRepository = AppDataSource.getRepository('Tenant');
    const tenant = tenantRepository.create(defaultTenant);
    return await tenantRepository.save(tenant);
  },

  // Créer un budget de test
  createTestBudget: async (budgetData: any = {}) => {
    const defaultBudget = {
      title: 'Test Budget',
      amount: 1000000,
      year: 2024,
      trimester: 'T1',
      status: 'active',
      tenantId: 'test-tenant-1',
      ...budgetData
    };

    const budgetRepository = AppDataSource.getRepository('Budget');
    const budget = budgetRepository.create(defaultBudget);
    return await budgetRepository.save(budget);
  },

  // Créer une transaction de test
  createTestTransaction: async (transactionData: any = {}) => {
    const defaultTransaction = {
      description: 'Test Transaction',
      amount: 50000,
      type: 'debit',
      category: 'education',
      date: new Date(),
      status: 'completed',
      tenantId: 'test-tenant-1',
      ...transactionData
    };

    const transactionRepository = AppDataSource.getRepository('Transaction');
    const transaction = transactionRepository.create(defaultTransaction);
    return await transactionRepository.save(transaction);
  },

  // Créer un stock de test
  createTestStock: async (stockData: any = {}) => {
    const defaultStock = {
      name: 'Test Stock',
      description: 'Test Description',
      quantity: 100,
      unit: 'pièce',
      price: 1000,
      threshold: 10,
      tenantId: 'test-tenant-1',
      ...stockData
    };

    const stockRepository = AppDataSource.getRepository('Stock');
    const stock = stockRepository.create(defaultStock);
    return await stockRepository.save(stock);
  },

  // Créer un logement de test
  createTestHousing: async (housingData: any = {}) => {
    const defaultHousing = {
      name: 'Test Housing',
      type: 'studio',
      capacity: 1,
      status: 'available',
      address: 'Test Address',
      tenantId: 'test-tenant-1',
      ...housingData
    };

    const housingRepository = AppDataSource.getRepository('Housing');
    const housing = housingRepository.create(defaultHousing);
    return await housingRepository.save(housing);
  },

  // Créer un véhicule de test
  createTestVehicle: async (vehicleData: any = {}) => {
    const defaultVehicle = {
      make: 'Toyota',
      model: 'Corolla',
      licensePlate: 'AB-123-CD',
      type: 'sedan',
      status: 'available',
      mileage: 50000,
      tenantId: 'test-tenant-1',
      ...vehicleData
    };

    const vehicleRepository = AppDataSource.getRepository('Vehicle');
    const vehicle = vehicleRepository.create(defaultVehicle);
    return await vehicleRepository.save(vehicle);
  },

  // Nettoyer une table spécifique
  cleanTable: async (tableName: string) => {
    await AppDataSource.query(`TRUNCATE TABLE "${tableName}" RESTART IDENTITY CASCADE`);
  },

  // Obtenir le nombre d'enregistrements dans une table
  getTableCount: async (tableName: string) => {
    const result = await AppDataSource.query(`SELECT COUNT(*) FROM "${tableName}"`);
    return parseInt(result[0].count);
  },

  // Exécuter une requête SQL
  executeQuery: async (query: string, parameters: any[] = []) => {
    return await AppDataSource.query(query, parameters);
  }
};

// Mock des services externes
export const mockServices = {
  // Mock du service de notifications
  notificationService: {
    createNotification: jest.fn(),
    getUserNotifications: jest.fn(),
    markAsRead: jest.fn(),
    deleteNotification: jest.fn(),
    getStats: jest.fn()
  },

  // Mock du service de cache
  cacheService: {
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
    exists: jest.fn()
  },

  // Mock du service de logs
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn()
  }
};

// Configuration des tests
export const testConfig = {
  database: {
    url: TEST_DATABASE_URL,
    synchronize: true,
    logging: false
  },
  api: {
    baseUrl: 'http://localhost:3000/api',
    timeout: 10000
  },
  auth: {
    jwtSecret: 'test-secret',
    jwtExpiresIn: '1h',
    refreshTokenExpiresIn: '7d'
  }
};

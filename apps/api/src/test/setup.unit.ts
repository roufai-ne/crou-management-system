/**
 * FICHIER: apps\api\src\test\setup.unit.ts
 * SETUP: Configuration des tests unitaires
 * 
 * DESCRIPTION:
 * Configuration pour les tests unitaires API
 * Mocks et utilitaires pour les tests isolés
 * 
 * AUTEUR: Équipe CROU
 * DATE: Décembre 2024
 */

import { beforeAll, beforeEach, afterEach, afterAll } from '@jest/globals';

// Configuration des tests unitaires
beforeAll(async () => {
  console.log('Configuration des tests unitaires...');
});

beforeEach(async () => {
  // Nettoyer les mocks avant chaque test
  jest.clearAllMocks();
});

afterEach(async () => {
  // Nettoyer après chaque test
  jest.restoreAllMocks();
});

afterAll(async () => {
  console.log('Tests unitaires terminés');
});

// Utilitaires pour les tests unitaires
export const unitTestUtils = {
  // Mock des services
  mockServices: {
    database: {
      find: jest.fn(),
      findOne: jest.fn(),
      save: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      create: jest.fn()
    },
    logger: {
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      debug: jest.fn()
    },
    cache: {
      get: jest.fn(),
      set: jest.fn(),
      del: jest.fn(),
      exists: jest.fn()
    }
  },

  // Mock des données
  mockData: {
    user: {
      id: 'test-user-1',
      email: 'test@crou.niger',
      name: 'Test User',
      role: 'admin',
      status: 'active',
      tenantId: 'test-tenant-1'
    },
    tenant: {
      id: 'test-tenant-1',
      name: 'Test Tenant',
      code: 'TEST',
      type: 'crou',
      region: 'Niamey',
      isActive: true
    },
    budget: {
      id: 'test-budget-1',
      title: 'Test Budget',
      amount: 1000000,
      year: 2024,
      trimester: 'T1',
      status: 'active',
      tenantId: 'test-tenant-1'
    }
  },

  // Mock des requêtes Express
  mockRequest: (overrides = {}) => ({
    body: {},
    params: {},
    query: {},
    headers: {},
    user: null,
    ...overrides
  }),

  // Mock des réponses Express
  mockResponse: () => {
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      send: jest.fn().mockReturnThis(),
      cookie: jest.fn().mockReturnThis(),
      clearCookie: jest.fn().mockReturnThis(),
      setHeader: jest.fn().mockReturnThis()
    };
    return res;
  },

  // Mock des erreurs
  mockError: (message = 'Test error', status = 500) => {
    const error = new Error(message);
    (error as any).status = status;
    return error;
  }
};

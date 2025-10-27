/**
 * FICHIER: apps\web\src\test\setup.integration.ts
 * SETUP: Configuration des tests d'intégration
 * 
 * DESCRIPTION:
 * Configuration pour les tests d'intégration frontend
 * Mocks et utilitaires pour les tests avec API
 * 
 * AUTEUR: Équipe CROU
 * DATE: Décembre 2024
 */

import { beforeAll, beforeEach, afterEach, afterAll } from '@jest/globals';

// Configuration des tests d'intégration
beforeAll(async () => {
  console.log('Configuration des tests d\'intégration...');
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
  console.log('Tests d\'intégration terminés');
});

// Utilitaires pour les tests d'intégration
export const integrationTestUtils = {
  // Mock des APIs
  mockAPI: {
    auth: {
      login: jest.fn(),
      logout: jest.fn(),
      refresh: jest.fn(),
      profile: jest.fn()
    },
    dashboard: {
      getData: jest.fn(),
      getKPIs: jest.fn(),
      getActivities: jest.fn()
    },
    financial: {
      getBudgets: jest.fn(),
      getTransactions: jest.fn(),
      createBudget: jest.fn(),
      updateBudget: jest.fn(),
      deleteBudget: jest.fn()
    },
    stocks: {
      getItems: jest.fn(),
      getMovements: jest.fn(),
      createItem: jest.fn(),
      updateItem: jest.fn(),
      deleteItem: jest.fn()
    },
    housing: {
      getUnits: jest.fn(),
      getRooms: jest.fn(),
      createUnit: jest.fn(),
      updateUnit: jest.fn(),
      deleteUnit: jest.fn()
    },
    transport: {
      getVehicles: jest.fn(),
      getMaintenance: jest.fn(),
      createVehicle: jest.fn(),
      updateVehicle: jest.fn(),
      deleteVehicle: jest.fn()
    }
  },

  // Mock des données
  mockData: {
    user: {
      id: 'test-user-1',
      email: 'test@crou.niger',
      name: 'Test User',
      role: 'admin',
      level: 'ministere',
      permissions: ['*'],
      isActive: true
    },
    dashboard: {
      globalKPIs: {
        totalBudget: 10000000,
        totalSpent: 7500000,
        totalStudents: 5000,
        totalHousing: 1000,
        totalVehicles: 50
      },
      moduleKPIs: {
        financial: { budgetUtilization: 75, pendingApprovals: 5 },
        stocks: { lowStockItems: 10, totalItems: 500 },
        housing: { occupancyRate: 85, availableRooms: 150 },
        transport: { activeVehicles: 45, maintenanceDue: 3 }
      },
      recentActivities: [],
      alerts: []
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

  // Mock des services
  mockServices: {
    auth: {
      login: jest.fn(),
      logout: jest.fn(),
      refreshToken: jest.fn(),
      hasPermission: jest.fn(() => true)
    },
    offline: {
      isOnline: true,
      isSyncing: false,
      pendingCount: 0,
      lastSync: null,
      errors: [],
      addToSyncQueue: jest.fn(),
      cacheData: jest.fn(),
      getCachedData: jest.fn(),
      forceSync: jest.fn(),
      clearSyncQueue: jest.fn(),
      clearCache: jest.fn()
    },
    notifications: {
      notifications: [],
      stats: null,
      preferences: null,
      isConnected: true,
      isLoading: false,
      unreadCount: 0,
      criticalNotifications: [],
      loadNotifications: jest.fn(),
      loadStats: jest.fn(),
      loadPreferences: jest.fn(),
      markAsRead: jest.fn(),
      deleteNotification: jest.fn(),
      markAllAsRead: jest.fn(),
      updatePreferences: jest.fn()
    }
  }
};

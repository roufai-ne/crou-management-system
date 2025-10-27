/**
 * FICHIER: apps\web\src\test\setup.ts
 * SETUP: Configuration des tests
 * 
 * DESCRIPTION:
 * Configuration globale pour les tests
 * Mocks, polyfills et utilitaires
 * 
 * AUTEUR: Équipe CROU
 * DATE: Décembre 2024
 */

import '@testing-library/jest-dom';
import { vi } from 'vitest';
import React from 'react';

// Mock des modules externes
vi.mock('react-hot-toast', () => ({
  default: {
    success: vi.fn(),
    error: vi.fn(),
    loading: vi.fn(),
    dismiss: vi.fn(),
  },
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    loading: vi.fn(),
    dismiss: vi.fn(),
  }
}));

// Mock de socket.io-client
vi.mock('socket.io-client', () => ({
  io: vi.fn(() => ({
    on: vi.fn(),
    off: vi.fn(),
    emit: vi.fn(),
    disconnect: vi.fn(),
    connect: vi.fn(),
  }))
}));

// Mock des APIs
global.fetch = vi.fn();

// Mock de localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});

// Mock de sessionStorage
const sessionStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
Object.defineProperty(window, 'sessionStorage', {
  value: sessionStorageMock
});

// Mock de navigator.onLine
Object.defineProperty(navigator, 'onLine', {
  writable: true,
  value: true
});

// Mock de window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock de ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock de IntersectionObserver
global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock de crypto pour les tests
Object.defineProperty(global, 'crypto', {
  value: {
    randomUUID: vi.fn(() => 'test-uuid-123'),
    getRandomValues: vi.fn((arr) => arr.map(() => Math.floor(Math.random() * 256)))
  }
});

// Mock des modules de services
vi.mock('@/services/offline.service', () => ({
  offlineService: {
    addToSyncQueue: vi.fn(),
    cacheData: vi.fn(),
    getCachedData: vi.fn(),
    forceSync: vi.fn(),
    clearSyncQueue: vi.fn(),
    clearCache: vi.fn(),
    getSyncStatus: vi.fn(() => ({
      isOnline: true,
      isSyncing: false,
      pendingCount: 0,
      lastSync: null,
      errors: []
    })),
    on: vi.fn(),
    off: vi.fn(),
    emit: vi.fn()
  }
}));

vi.mock('@/services/sync.service', () => ({
  syncService: {
    addToSyncQueue: vi.fn(),
    getStats: vi.fn(() => ({
      total: 0,
      successful: 0,
      failed: 0,
      pending: 0,
      conflicts: 0,
      averageTime: 0,
      lastSync: null
    })),
    getQueue: vi.fn(() => []),
    getConflictResolutions: vi.fn(() => []),
    clearQueue: vi.fn(),
    forceSync: vi.fn(),
    on: vi.fn(),
    off: vi.fn(),
    emit: vi.fn()
  }
}));

// Mock des hooks personnalisés
vi.mock('@/hooks/useOffline', () => ({
  useOffline: vi.fn(() => ({
    isOnline: true,
    isSyncing: false,
    pendingCount: 0,
    lastSync: null,
    errors: [],
    cacheStats: { size: 0, entries: [] },
    addToSyncQueue: vi.fn(),
    cacheData: vi.fn(),
    getCachedData: vi.fn(),
    forceSync: vi.fn(),
    clearSyncQueue: vi.fn(),
    clearCache: vi.fn(),
    clearErrors: vi.fn(),
    getSyncStatus: vi.fn(),
    getPendingData: vi.fn(() => []),
    isDataPending: vi.fn(() => false),
    getRetryCount: vi.fn(() => 0),
    getSyncErrors: vi.fn(() => []),
    getCacheStatistics: vi.fn(() => ({ size: 0, entries: [] })),
    hasCachedData: vi.fn(() => false),
    getCacheSize: vi.fn(() => 0),
    getCacheKeys: vi.fn(() => []),
    isSyncInProgress: vi.fn(() => false),
    hasPendingData: vi.fn(() => false),
    getSyncProgress: vi.fn(() => 100),
    getTimeSinceLastSync: vi.fn(() => null),
    getConnectionStatus: vi.fn(() => ({ isOnline: true, isOffline: false, isConnecting: false })),
    getPerformanceMetrics: vi.fn(() => ({
      cacheHitRate: 0,
      syncSuccessRate: 0,
      averageSyncTime: 0,
      dataProcessed: 0
    }))
  }))
}));

vi.mock('@/hooks/useNotifications', () => ({
  useNotifications: vi.fn(() => ({
    notifications: [],
    stats: null,
    preferences: null,
    isConnected: true,
    isLoading: false,
    unreadCount: 0,
    criticalNotifications: [],
    loadNotifications: vi.fn(),
    loadStats: vi.fn(),
    loadPreferences: vi.fn(),
    markAsRead: vi.fn(),
    deleteNotification: vi.fn(),
    markAllAsRead: vi.fn(),
    updatePreferences: vi.fn(),
    sendTestNotification: vi.fn(),
    getNotificationsByCategory: vi.fn(() => []),
    getNotificationsByType: vi.fn(() => []),
    filterNotifications: vi.fn(() => []),
    formatDate: vi.fn((date) => date),
    socket: null
  }))
}));

// Mock des services API
vi.mock('@/services/api/apiClient', () => ({
  default: {
    get: vi.fn(() => Promise.resolve({ data: {} })),
    post: vi.fn(() => Promise.resolve({ data: {} })),
    put: vi.fn(() => Promise.resolve({ data: {} })),
    delete: vi.fn(() => Promise.resolve({ data: {} })),
    interceptors: {
      request: { use: vi.fn() },
      response: { use: vi.fn() }
    }
  }
}));

// Mock des stores Zustand
vi.mock('@/stores/auth', () => ({
  useAuth: vi.fn(() => ({
    user: {
      id: 'test-user-1',
      email: 'test@crou.niger',
      name: 'Test User',
      role: 'admin',
      level: 'ministere',
      permissions: ['*'],
      isActive: true
    },
    isAuthenticated: true,
    isLoading: false,
    login: vi.fn(),
    logout: vi.fn(),
    refreshAccessToken: vi.fn(),
    hasPermission: vi.fn(() => true),
    setAuth: vi.fn(),
    clearAuth: vi.fn()
  })),
  useAuth: vi.fn(() => ({
    user: {
      id: 'test-user-1',
      email: 'test@crou.niger',
      name: 'Test User',
      role: 'admin',
      level: 'ministere',
      permissions: ['*'],
      isActive: true
    },
    isAuthenticated: true,
    isLoading: false,
    login: vi.fn(),
    logout: vi.fn(),
    refreshAccessToken: vi.fn(),
    hasPermission: vi.fn(() => true),
    setAuth: vi.fn(),
    clearAuth: vi.fn()
  }))
}));

// Mock des utilitaires
vi.mock('@/utils/formatters', () => ({
  formatCurrency: vi.fn((amount) => `${amount} FCFA`),
  formatDate: vi.fn((date) => new Date(date).toLocaleDateString('fr-FR')),
  formatDateTime: vi.fn((date) => new Date(date).toLocaleString('fr-FR')),
  truncateString: vi.fn((str, num) => str.length > num ? str.slice(0, num) + '...' : str)
}));

// Mock des composants UI
vi.mock('@/components/ui', () => ({
  Button: ({ children, ...props }: any) => React.createElement('button', props, children),
  Card: ({ children, ...props }: any) => React.createElement('div', props, children),
  CardHeader: ({ children, ...props }: any) => React.createElement('div', props, children),
  CardContent: ({ children, ...props }: any) => React.createElement('div', props, children),
  CardTitle: ({ children, ...props }: any) => React.createElement('h3', props, children),
  Badge: ({ children, ...props }: any) => React.createElement('span', props, children),
  Input: ({ ...props }: any) => React.createElement('input', props),
  Modal: ({ children, ...props }: any) => React.createElement('div', props, children),
  Table: ({ children, ...props }: any) => React.createElement('table', props, children),
  Tabs: ({ children, ...props }: any) => React.createElement('div', props, children),
  TabsList: ({ children, ...props }: any) => React.createElement('div', props, children),
  TabsTrigger: ({ children, ...props }: any) => React.createElement('button', props, children),
  TabsContent: ({ children, ...props }: any) => React.createElement('div', props, children),
  Progress: ({ ...props }: any) => React.createElement('div', props),
  Select: ({ children, ...props }: any) => React.createElement('select', props, children),
  Textarea: ({ ...props }: any) => React.createElement('textarea', props),
  Spinner: ({ ...props }: any) => React.createElement('div', props),
  Alert: ({ children, ...props }: any) => React.createElement('div', props, children),
  Loading: ({ ...props }: any) => React.createElement('div', props, 'Loading...'),
  Toast: ({ children, ...props }: any) => React.createElement('div', props, children),
  Tooltip: ({ children, ...props }: any) => React.createElement('div', props, children),
  KPICard: ({ children, ...props }: any) => React.createElement('div', props, children),
  Breadcrumb: ({ children, ...props }: any) => React.createElement('nav', props, children),
  Checkbox: ({ ...props }: any) => React.createElement('input', { type: 'checkbox', ...props }),
  Radio: ({ ...props }: any) => React.createElement('input', { type: 'radio', ...props }),
  Switch: ({ ...props }: any) => React.createElement('input', { type: 'checkbox', ...props }),
  DateInput: ({ ...props }: any) => React.createElement('input', { type: 'date', ...props }),
  CurrencyInput: ({ ...props }: any) => React.createElement('input', { type: 'number', ...props }),
  CROUSelector: ({ children, ...props }: any) => React.createElement('select', props, children)
}));

// Configuration des tests
beforeEach(() => {
  // Nettoyer les mocks avant chaque test
  vi.clearAllMocks();

  // Réinitialiser localStorage
  localStorageMock.getItem.mockClear();
  localStorageMock.setItem.mockClear();
  localStorageMock.removeItem.mockClear();
  localStorageMock.clear.mockClear();

  // Réinitialiser sessionStorage
  sessionStorageMock.getItem.mockClear();
  sessionStorageMock.setItem.mockClear();
  sessionStorageMock.removeItem.mockClear();
  sessionStorageMock.clear.mockClear();

  // Réinitialiser fetch
  (global.fetch as any).mockClear();

  // Réinitialiser navigator.onLine
  Object.defineProperty(navigator, 'onLine', {
    writable: true,
    value: true
  });
});

afterEach(() => {
  // Nettoyer après chaque test
  vi.restoreAllMocks();
});

// Export des mocks pour utilisation dans les tests
export { localStorageMock, sessionStorageMock };

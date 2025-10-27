/**
 * FICHIER: apps\web\src\test\utils\test-utils.tsx
 * UTILITAIRES: Utilitaires de test
 * 
 * DESCRIPTION:
 * Utilitaires pour les tests React
 * Wrappers et helpers personnalisés
 * 
 * AUTEUR: Équipe CROU
 * DATE: Décembre 2024
 */

import React, { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { vi } from 'vitest';

// Mock des providers
const MockAuthProvider = ({ children }: { children: React.ReactNode }) => {
  return <div data-testid="auth-provider">{children}</div>;
};

const MockThemeProvider = ({ children }: { children: React.ReactNode }) => {
  return <div data-testid="theme-provider">{children}</div>;
};

const MockToastProvider = ({ children }: { children: React.ReactNode }) => {
  return <div data-testid="toast-provider">{children}</div>;
};

// Wrapper personnalisé pour les tests
const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <MockAuthProvider>
          <MockThemeProvider>
            <MockToastProvider>
              {children}
            </MockToastProvider>
          </MockThemeProvider>
        </MockAuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
};

// Fonction de rendu personnalisée
const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => render(ui, { wrapper: AllTheProviders, ...options });

// Mock des hooks personnalisés
export const mockUseAuth = (overrides = {}) => {
  const defaultAuth = {
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
  };

  return { ...defaultAuth, ...overrides };
};

export const mockUseOffline = (overrides = {}) => {
  const defaultOffline = {
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
    getSyncStatus: vi.fn(() => ({
      isOnline: true,
      isSyncing: false,
      pendingCount: 0,
      lastSync: null,
      errors: []
    })),
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
  };

  return { ...defaultOffline, ...overrides };
};

export const mockUseNotifications = (overrides = {}) => {
  const defaultNotifications = {
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
  };

  return { ...defaultNotifications, ...overrides };
};

// Mock des services
export const mockApiClient = {
  get: vi.fn(() => Promise.resolve({ data: {} })),
  post: vi.fn(() => Promise.resolve({ data: {} })),
  put: vi.fn(() => Promise.resolve({ data: {} })),
  delete: vi.fn(() => Promise.resolve({ data: {} })),
  interceptors: {
    request: { use: vi.fn() },
    response: { use: vi.fn() }
  }
};

export const mockOfflineService = {
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
};

export const mockSyncService = {
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
};

// Données de test
export const testData = {
  user: {
    id: 'test-user-1',
    email: 'test@crou.niger',
    name: 'Test User',
    role: 'admin',
    level: 'ministere',
    permissions: ['*'],
    isActive: true
  },
  
  budget: {
    id: 'budget-1',
    title: 'Budget Test',
    amount: 1000000,
    category: 'education',
    year: 2024,
    trimester: 'T1',
    status: 'active',
    tenantId: 'tenant-1'
  },
  
  transaction: {
    id: 'transaction-1',
    description: 'Transaction Test',
    amount: 50000,
    type: 'debit',
    category: 'education',
    date: '2024-01-15',
    status: 'completed',
    tenantId: 'tenant-1'
  },
  
  stock: {
    id: 'stock-1',
    name: 'Article Test',
    description: 'Description test',
    quantity: 100,
    unit: 'pièce',
    price: 1000,
    threshold: 10,
    tenantId: 'tenant-1'
  },
  
  housing: {
    id: 'housing-1',
    name: 'Logement Test',
    type: 'studio',
    capacity: 1,
    status: 'available',
    address: 'Adresse test',
    tenantId: 'tenant-1'
  },
  
  vehicle: {
    id: 'vehicle-1',
    make: 'Toyota',
    model: 'Corolla',
    licensePlate: 'AB-123-CD',
    type: 'sedan',
    status: 'available',
    mileage: 50000,
    tenantId: 'tenant-1'
  },
  
  notification: {
    id: 'notification-1',
    title: 'Notification Test',
    message: 'Message test',
    type: 'info',
    category: 'system',
    priority: 'medium',
    status: 'pending',
    createdAt: '2024-01-15T10:00:00Z',
    tenantId: 'tenant-1'
  }
};

// Utilitaires de test
export const testUtils = {
  // Mock fetch avec réponse personnalisée
  mockFetch: (response: any, status = 200) => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: status >= 200 && status < 300,
      status,
      json: () => Promise.resolve(response),
      text: () => Promise.resolve(JSON.stringify(response))
    });
  },
  
  // Mock fetch avec erreur
  mockFetchError: (error: string) => {
    (global.fetch as any).mockRejectedValueOnce(new Error(error));
  },
  
  // Mock localStorage
  mockLocalStorage: (data: Record<string, string>) => {
    Object.keys(data).forEach(key => {
      (localStorage.getItem as any).mockImplementation((k: string) => k === key ? data[key] : null);
    });
  },
  
  // Mock navigator.onLine
  mockOnline: (isOnline: boolean) => {
    Object.defineProperty(navigator, 'onLine', {
      writable: true,
      value: isOnline
    });
  },
  
  // Attendre qu'un élément soit visible
  waitForElement: async (selector: string, timeout = 1000) => {
    const start = Date.now();
    while (Date.now() - start < timeout) {
      const element = document.querySelector(selector);
      if (element) return element;
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    throw new Error(`Element ${selector} not found within ${timeout}ms`);
  },
  
  // Simuler un clic sur un élément
  clickElement: (selector: string) => {
    const element = document.querySelector(selector);
    if (element) {
      (element as HTMLElement).click();
    } else {
      throw new Error(`Element ${selector} not found`);
    }
  },
  
  // Simuler une saisie dans un input
  typeInInput: (selector: string, value: string) => {
    const input = document.querySelector(selector) as HTMLInputElement;
    if (input) {
      input.value = value;
      input.dispatchEvent(new Event('input', { bubbles: true }));
      input.dispatchEvent(new Event('change', { bubbles: true }));
    } else {
      throw new Error(`Input ${selector} not found`);
    }
  },
  
  // Vérifier qu'un élément a une classe
  hasClass: (selector: string, className: string) => {
    const element = document.querySelector(selector);
    return element ? element.classList.contains(className) : false;
  },
  
  // Vérifier qu'un élément est visible
  isVisible: (selector: string) => {
    const element = document.querySelector(selector);
    if (!element) return false;
    const style = window.getComputedStyle(element);
    return style.display !== 'none' && style.visibility !== 'hidden' && style.opacity !== '0';
  }
};

// Re-export de render personnalisé
export * from '@testing-library/react';
export { customRender as render };

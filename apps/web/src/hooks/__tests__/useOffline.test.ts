/**
 * FICHIER: apps\web\src\hooks\__tests__\useOffline.test.ts
 * TESTS: Tests unitaires pour useOffline
 * 
 * DESCRIPTION:
 * Tests unitaires pour le hook useOffline
 * Validation du comportement offline/online
 * 
 * AUTEUR: Équipe CROU
 * DATE: Décembre 2024
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useOffline } from '../useOffline';
import { mockOfflineService } from '../../test/utils/test-utils';

// Mock du service offline
vi.mock('@/services/offline.service', () => ({
  offlineService: mockOfflineService
}));

// Mock des événements window
const mockAddEventListener = vi.fn();
const mockRemoveEventListener = vi.fn();

Object.defineProperty(window, 'addEventListener', {
  value: mockAddEventListener
});

Object.defineProperty(window, 'removeEventListener', {
  value: mockRemoveEventListener
});

describe('useOffline', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockOfflineService.getSyncStatus.mockReturnValue({
      isOnline: true,
      isSyncing: false,
      pendingCount: 0,
      lastSync: null,
      errors: []
    });
    mockOfflineService.getCacheStats.mockReturnValue({
      size: 0,
      entries: []
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('retourne l\'état initial correct', () => {
    const { result } = renderHook(() => useOffline());

    expect(result.current.isOnline).toBe(true);
    expect(result.current.isSyncing).toBe(false);
    expect(result.current.pendingCount).toBe(0);
    expect(result.current.lastSync).toBeNull();
    expect(result.current.errors).toEqual([]);
    expect(result.current.cacheStats).toEqual({ size: 0, entries: [] });
  });

  it('met à jour l\'état quand la connexion change', () => {
    const { result } = renderHook(() => useOffline());

    // Simuler la perte de connexion
    act(() => {
      mockOfflineService.emit('offline');
    });

    expect(result.current.isOnline).toBe(false);
  });

  it('met à jour l\'état quand la connexion est rétablie', () => {
    const { result } = renderHook(() => useOffline());

    // Simuler la perte de connexion
    act(() => {
      mockOfflineService.emit('offline');
    });

    expect(result.current.isOnline).toBe(false);

    // Simuler la reconnexion
    act(() => {
      mockOfflineService.emit('online');
    });

    expect(result.current.isOnline).toBe(true);
  });

  it('met à jour l\'état de synchronisation', () => {
    const { result } = renderHook(() => useOffline());

    // Simuler le début de synchronisation
    act(() => {
      mockOfflineService.emit('sync:start');
    });

    expect(result.current.isSyncing).toBe(true);

    // Simuler la fin de synchronisation
    act(() => {
      mockOfflineService.emit('sync:complete');
    });

    expect(result.current.isSyncing).toBe(false);
  });

  it('met à jour le nombre de données en attente', () => {
    const { result } = renderHook(() => useOffline());

    // Simuler l'ajout de données en attente
    act(() => {
      mockOfflineService.emit('data:queued', { id: 'test-1' });
    });

    expect(mockOfflineService.getPendingData).toHaveBeenCalled();
  });

  it('met à jour les erreurs de synchronisation', () => {
    const { result } = renderHook(() => useOffline());

    // Simuler une erreur de synchronisation
    act(() => {
      mockOfflineService.emit('sync:error', { message: 'Erreur de connexion' });
    });

    expect(result.current.errors).toContain('Erreur de connexion');
  });

  it('appelle addToSyncQueue avec les bonnes données', () => {
    const { result } = renderHook(() => useOffline());

    const testData = {
      type: 'create' as const,
      endpoint: '/api/test',
      data: { test: 'data' },
      priority: 'high' as const
    };

    act(() => {
      result.current.addToSyncQueue(testData);
    });

    expect(mockOfflineService.addToSyncQueue).toHaveBeenCalledWith(testData);
  });

  it('appelle cacheData avec les bonnes données', () => {
    const { result } = renderHook(() => useOffline());

    const key = 'test-key';
    const data = { test: 'data' };
    const ttl = 5000;

    act(() => {
      result.current.cacheData(key, data, ttl);
    });

    expect(mockOfflineService.cacheData).toHaveBeenCalledWith(key, data, ttl);
  });

  it('appelle getCachedData avec la bonne clé', () => {
    const { result } = renderHook(() => useOffline());

    const key = 'test-key';
    mockOfflineService.getCachedData.mockReturnValue({ test: 'data' });

    act(() => {
      result.current.getCachedData(key);
    });

    expect(mockOfflineService.getCachedData).toHaveBeenCalledWith(key);
  });

  it('appelle forceSync', () => {
    const { result } = renderHook(() => useOffline());

    act(() => {
      result.current.forceSync();
    });

    expect(mockOfflineService.forceSync).toHaveBeenCalledTimes(1);
  });

  it('appelle clearSyncQueue', () => {
    const { result } = renderHook(() => useOffline());

    act(() => {
      result.current.clearSyncQueue();
    });

    expect(mockOfflineService.clearSyncQueue).toHaveBeenCalledTimes(1);
  });

  it('appelle clearCache', () => {
    const { result } = renderHook(() => useOffline());

    act(() => {
      result.current.clearCache();
    });

    expect(mockOfflineService.clearCache).toHaveBeenCalledTimes(1);
  });

  it('appelle clearErrors', () => {
    const { result } = renderHook(() => useOffline());

    act(() => {
      result.current.clearErrors();
    });

    expect(result.current.errors).toEqual([]);
  });

  it('retourne les bonnes données en attente', () => {
    const { result } = renderHook(() => useOffline());

    const pendingData = [{ id: 'test-1' }, { id: 'test-2' }];
    mockOfflineService.getPendingData.mockReturnValue(pendingData);

    act(() => {
      result.current.getPendingData();
    });

    expect(mockOfflineService.getPendingData).toHaveBeenCalled();
  });

  it('vérifie si une donnée est en attente', () => {
    const { result } = renderHook(() => useOffline());

    const endpoint = '/api/test';
    const type = 'create';

    act(() => {
      result.current.isDataPending(endpoint, type);
    });

    expect(mockOfflineService.getPendingData).toHaveBeenCalled();
  });

  it('retourne le nombre de tentatives', () => {
    const { result } = renderHook(() => useOffline());

    const endpoint = '/api/test';
    const type = 'create';

    act(() => {
      result.current.getRetryCount(endpoint, type);
    });

    expect(mockOfflineService.getPendingData).toHaveBeenCalled();
  });

  it('retourne les erreurs de synchronisation', () => {
    const { result } = renderHook(() => useOffline());

    const errors = ['Erreur 1', 'Erreur 2'];
    mockOfflineService.getSyncStatus.mockReturnValue({
      isOnline: true,
      isSyncing: false,
      pendingCount: 0,
      lastSync: null,
      errors
    });

    act(() => {
      result.current.getSyncErrors();
    });

    expect(result.current.errors).toEqual(errors);
  });

  it('retourne les statistiques du cache', () => {
    const { result } = renderHook(() => useOffline());

    const cacheStats = { size: 10, entries: ['key1', 'key2'] };
    mockOfflineService.getCacheStats.mockReturnValue(cacheStats);

    act(() => {
      result.current.getCacheStatistics();
    });

    expect(result.current.cacheStats).toEqual(cacheStats);
  });

  it('vérifie si des données sont en cache', () => {
    const { result } = renderHook(() => useOffline());

    const key = 'test-key';
    mockOfflineService.getCachedData.mockReturnValue({ test: 'data' });

    act(() => {
      result.current.hasCachedData(key);
    });

    expect(mockOfflineService.getCachedData).toHaveBeenCalledWith(key);
  });

  it('retourne la taille du cache', () => {
    const { result } = renderHook(() => useOffline());

    const cacheStats = { size: 10, entries: [] };
    mockOfflineService.getCacheStats.mockReturnValue(cacheStats);

    act(() => {
      result.current.getCacheSize();
    });

    expect(result.current.cacheStats.size).toBe(10);
  });

  it('retourne les clés du cache', () => {
    const { result } = renderHook(() => useOffline());

    const cacheStats = { size: 2, entries: ['key1', 'key2'] };
    mockOfflineService.getCacheStats.mockReturnValue(cacheStats);

    act(() => {
      result.current.getCacheKeys();
    });

    expect(result.current.cacheStats.entries).toEqual(['key1', 'key2']);
  });

  it('vérifie si la synchronisation est en cours', () => {
    const { result } = renderHook(() => useOffline());

    expect(result.current.isSyncInProgress()).toBe(false);

    // Simuler le début de synchronisation
    act(() => {
      mockOfflineService.emit('sync:start');
    });

    expect(result.current.isSyncInProgress()).toBe(true);
  });

  it('vérifie s\'il y a des données en attente', () => {
    const { result } = renderHook(() => useOffline());

    expect(result.current.hasPendingData()).toBe(false);

    // Simuler l'ajout de données en attente
    act(() => {
      mockOfflineService.emit('data:queued', { id: 'test-1' });
    });

    expect(result.current.hasPendingData()).toBe(true);
  });

  it('retourne le pourcentage de progression', () => {
    const { result } = renderHook(() => useOffline());

    const progress = result.current.getSyncProgress();
    expect(progress).toBe(100);
  });

  it('retourne le temps écoulé depuis la dernière synchronisation', () => {
    const { result } = renderHook(() => useOffline());

    const timeSince = result.current.getTimeSinceLastSync();
    expect(timeSince).toBeNull();
  });

  it('retourne le statut de connexion', () => {
    const { result } = renderHook(() => useOffline());

    const connectionStatus = result.current.getConnectionStatus();
    expect(connectionStatus).toEqual({
      isOnline: true,
      isOffline: false,
      isConnecting: false
    });
  });

  it('retourne les métriques de performance', () => {
    const { result } = renderHook(() => useOffline());

    const metrics = result.current.getPerformanceMetrics();
    expect(metrics).toEqual({
      cacheHitRate: 0,
      syncSuccessRate: 0,
      averageSyncTime: 0,
      dataProcessed: 0
    });
  });
});

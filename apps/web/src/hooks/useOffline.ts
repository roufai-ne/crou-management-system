/**
 * FICHIER: apps\web\src\hooks\useOffline.ts
 * HOOK: useOffline - Hook pour la gestion offline
 * 
 * DESCRIPTION:
 * Hook personnalisé pour la gestion des capacités offline
 * Intégration avec le service offline
 * 
 * FONCTIONNALITÉS:
 * - Détection de l'état de connexion
 * - Gestion du cache
 * - Synchronisation différée
 * - Notifications de statut
 * 
 * AUTEUR: Équipe CROU
 * DATE: Décembre 2024
 */

import { useState, useEffect, useCallback } from 'react';
import { offlineService, OfflineData } from '@/services/offline.service';
import { logger } from '@/utils/logger';

// Types pour le hook offline
interface OfflineStatus {
  isOnline: boolean;
  isSyncing: boolean;
  pendingCount: number;
  lastSync: Date | null;
  errors: string[];
}

interface CacheStats {
  size: number;
  entries: string[];
}

export function useOffline() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isSyncing, setIsSyncing] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const [lastSync, setLastSync] = useState<Date | null>(null);
  const [errors, setErrors] = useState<string[]>([]);
  const [cacheStats, setCacheStats] = useState<CacheStats>({ size: 0, entries: [] });

  // Mettre à jour l'état de connexion
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      logger.info('Connexion rétablie');
    };

    const handleOffline = () => {
      setIsOnline(false);
      logger.info('Connexion perdue');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Écouter les événements du service offline
  useEffect(() => {
    const handleSyncStart = () => {
      setIsSyncing(true);
    };

    const handleSyncComplete = () => {
      setIsSyncing(false);
      setLastSync(new Date());
      setErrors([]);
    };

    const handleSyncError = (error: any) => {
      setIsSyncing(false);
      setErrors(prev => [...prev, error.message || 'Erreur de synchronisation']);
    };

    const handleDataQueued = () => {
      setPendingCount(offlineService.getPendingData().length);
    };

    const handleDataSynced = () => {
      setPendingCount(offlineService.getPendingData().length);
    };

    const handleCacheUpdated = () => {
      setCacheStats(offlineService.getCacheStats());
    };

    // Écouter les événements
    offlineService.on('online', handleOnline);
    offlineService.on('offline', handleOffline);
    offlineService.on('sync:start', handleSyncStart);
    offlineService.on('sync:complete', handleSyncComplete);
    offlineService.on('sync:error', handleSyncError);
    offlineService.on('data:queued', handleDataQueued);
    offlineService.on('data:synced', handleDataSynced);
    offlineService.on('cache:updated', handleCacheUpdated);

    // Nettoyer les écouteurs
    return () => {
      offlineService.off('online', handleOnline);
      offlineService.off('offline', handleOffline);
      offlineService.off('sync:start', handleSyncStart);
      offlineService.off('sync:complete', handleSyncComplete);
      offlineService.off('sync:error', handleSyncError);
      offlineService.off('data:queued', handleDataQueued);
      offlineService.off('data:synced', handleDataSynced);
      offlineService.off('cache:updated', handleCacheUpdated);
    };
  }, []);

  // Mettre à jour les statistiques du cache
  useEffect(() => {
    setCacheStats(offlineService.getCacheStats());
  }, []);

  // Ajouter des données à synchroniser
  const addToSyncQueue = useCallback((data: Omit<OfflineData, 'id' | 'timestamp' | 'retryCount'>) => {
    try {
      offlineService.addToSyncQueue(data);
      logger.info('Données ajoutées à la file de synchronisation');
    } catch (error) {
      logger.error('Erreur ajout à la file de synchronisation:', error);
      throw error;
    }
  }, []);

  // Mettre en cache des données
  const cacheData = useCallback((key: string, data: any, ttl?: number) => {
    try {
      offlineService.cacheData(key, data, ttl);
      logger.info(`Données mises en cache: ${key}`);
    } catch (error) {
      logger.error('Erreur mise en cache:', error);
      throw error;
    }
  }, []);

  // Récupérer des données du cache
  const getCachedData = useCallback((key: string) => {
    try {
      return offlineService.getCachedData(key);
    } catch (error) {
      logger.error('Erreur récupération cache:', error);
      return null;
    }
  }, []);

  // Forcer la synchronisation
  const forceSync = useCallback(() => {
    try {
      offlineService.forceSync();
      logger.info('Synchronisation forcée');
    } catch (error) {
      logger.error('Erreur synchronisation forcée:', error);
      throw error;
    }
  }, []);

  // Vider la file de synchronisation
  const clearSyncQueue = useCallback(() => {
    try {
      offlineService.clearSyncQueue();
      setPendingCount(0);
      logger.info('File de synchronisation vidée');
    } catch (error) {
      logger.error('Erreur vidage file de synchronisation:', error);
      throw error;
    }
  }, []);

  // Vider le cache
  const clearCache = useCallback(() => {
    try {
      offlineService.clearCache();
      setCacheStats({ size: 0, entries: [] });
      logger.info('Cache vidé');
    } catch (error) {
      logger.error('Erreur vidage cache:', error);
      throw error;
    }
  }, []);

  // Obtenir le statut de synchronisation
  const getSyncStatus = useCallback((): OfflineStatus => {
    return {
      isOnline,
      isSyncing,
      pendingCount,
      lastSync,
      errors
    };
  }, [isOnline, isSyncing, pendingCount, lastSync, errors]);

  // Obtenir les données en attente
  const getPendingData = useCallback(() => {
    return offlineService.getPendingData();
  }, []);

  // Vérifier si une donnée est en attente
  const isDataPending = useCallback((endpoint: string, type: string) => {
    const pendingData = offlineService.getPendingData();
    return pendingData.some(data => data.endpoint === endpoint && data.type === type);
  }, []);

  // Obtenir le nombre de tentatives pour une donnée
  const getRetryCount = useCallback((endpoint: string, type: string) => {
    const pendingData = offlineService.getPendingData();
    const data = pendingData.find(d => d.endpoint === endpoint && d.type === type);
    return data ? data.retryCount : 0;
  }, []);

  // Obtenir les erreurs de synchronisation
  const getSyncErrors = useCallback(() => {
    return errors;
  }, [errors]);

  // Effacer les erreurs
  const clearErrors = useCallback(() => {
    setErrors([]);
  }, []);

  // Obtenir les statistiques du cache
  const getCacheStatistics = useCallback(() => {
    return cacheStats;
  }, [cacheStats]);

  // Vérifier si le cache contient une clé
  const hasCachedData = useCallback((key: string) => {
    return offlineService.getCachedData(key) !== null;
  }, []);

  // Obtenir la taille du cache
  const getCacheSize = useCallback(() => {
    return cacheStats.size;
  }, [cacheStats.size]);

  // Obtenir les clés du cache
  const getCacheKeys = useCallback(() => {
    return cacheStats.entries;
  }, [cacheStats.entries]);

  // Vérifier si la synchronisation est en cours
  const isSyncInProgress = useCallback(() => {
    return isSyncing;
  }, [isSyncing]);

  // Vérifier s'il y a des données en attente
  const hasPendingData = useCallback(() => {
    return pendingCount > 0;
  }, [pendingCount]);

  // Obtenir le pourcentage de données synchronisées
  const getSyncProgress = useCallback(() => {
    if (pendingCount === 0) return 100;
    // Calculer le pourcentage basé sur les données traitées
    // Pour l'instant, retourner 0 si des données sont en attente
    return 0;
  }, [pendingCount]);

  // Obtenir le temps écoulé depuis la dernière synchronisation
  const getTimeSinceLastSync = useCallback(() => {
    if (!lastSync) return null;
    const now = new Date();
    const diff = now.getTime() - lastSync.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'À l\'instant';
    if (minutes < 60) return `Il y a ${minutes} min`;
    if (hours < 24) return `Il y a ${hours}h`;
    return `Il y a ${days}j`;
  }, [lastSync]);

  // Obtenir le statut de connexion
  const getConnectionStatus = useCallback(() => {
    return {
      isOnline,
      isOffline: !isOnline,
      isConnecting: isSyncing && !isOnline
    };
  }, [isOnline, isSyncing]);

  // Obtenir les métriques de performance
  const getPerformanceMetrics = useCallback(() => {
    return {
      cacheHitRate: 0, // TODO: Calculer le taux de succès du cache
      syncSuccessRate: 0, // TODO: Calculer le taux de succès de la synchronisation
      averageSyncTime: 0, // TODO: Calculer le temps moyen de synchronisation
      dataProcessed: 0 // TODO: Calculer le nombre de données traitées
    };
  }, []);

  return {
    // État
    isOnline,
    isSyncing,
    pendingCount,
    lastSync,
    errors,
    cacheStats,
    
    // Actions
    addToSyncQueue,
    cacheData,
    getCachedData,
    forceSync,
    clearSyncQueue,
    clearCache,
    clearErrors,
    
    // Utilitaires
    getSyncStatus,
    getPendingData,
    isDataPending,
    getRetryCount,
    getSyncErrors,
    getCacheStatistics,
    hasCachedData,
    getCacheSize,
    getCacheKeys,
    isSyncInProgress,
    hasPendingData,
    getSyncProgress,
    getTimeSinceLastSync,
    getConnectionStatus,
    getPerformanceMetrics
  };
}

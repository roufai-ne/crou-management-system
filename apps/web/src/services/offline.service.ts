/**
 * FICHIER: apps\web\src\services\offline.service.ts
 * SERVICE: OfflineService - Service de gestion offline
 * 
 * DESCRIPTION:
 * Service pour la gestion des capacités offline
 * Cache intelligent et synchronisation différée
 * 
 * FONCTIONNALITÉS:
 * - Détection de l'état de connexion
 * - Cache intelligent des données
 * - Synchronisation différée
 * - Gestion des conflits
 * - Notifications de statut
 * 
 * AUTEUR: Équipe CROU
 * DATE: Décembre 2024
 */

import { EventEmitter } from 'events';
import { logger } from '@/utils/logger';

// Types pour le service offline
interface OfflineData {
  id: string;
  type: 'create' | 'update' | 'delete';
  endpoint: string;
  data: any;
  timestamp: Date;
  retryCount: number;
  maxRetries: number;
  priority: 'low' | 'medium' | 'high' | 'critical';
}

interface CacheEntry {
  key: string;
  data: any;
  timestamp: Date;
  ttl: number;
  version: number;
}

interface SyncStatus {
  isOnline: boolean;
  isSyncing: boolean;
  pendingCount: number;
  lastSync: Date | null;
  errors: string[];
}

export class OfflineService extends EventEmitter {
  private isOnline: boolean = navigator.onLine;
  private isSyncing: boolean = false;
  private pendingData: OfflineData[] = [];
  private cache: Map<string, CacheEntry> = new Map();
  private syncQueue: OfflineData[] = [];
  private retryTimeout: NodeJS.Timeout | null = null;
  private syncInterval: NodeJS.Timeout | null = null;

  // Configuration
  private config = {
    maxRetries: 3,
    retryDelay: 5000,
    syncInterval: 30000,
    cacheTTL: 300000, // 5 minutes
    maxCacheSize: 1000,
    maxPendingData: 100
  };

  constructor() {
    super();
    this.setupEventListeners();
    this.startSyncInterval();
    this.loadPendingData();
  }

  /**
   * Configuration des écouteurs d'événements
   */
  private setupEventListeners(): void {
    // Écouter les changements de connexion
    window.addEventListener('online', this.handleOnline.bind(this));
    window.addEventListener('offline', this.handleOffline.bind(this));

    // Écouter les messages du Service Worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', this.handleServiceWorkerMessage.bind(this));
    }

    // Écouter les événements de visibilité
    document.addEventListener('visibilitychange', this.handleVisibilityChange.bind(this));
  }

  /**
   * Gestion de la connexion en ligne
   */
  private handleOnline(): void {
    this.isOnline = true;
    this.emit('online');
    this.startSync();
    logger.info('Connexion rétablie');
  }

  /**
   * Gestion de la déconnexion
   */
  private handleOffline(): void {
    this.isOnline = false;
    this.emit('offline');
    this.stopSync();
    logger.info('Connexion perdue');
  }

  /**
   * Gestion des messages du Service Worker
   */
  private handleServiceWorkerMessage(event: MessageEvent): void {
    const { type, data } = event.data;
    
    switch (type) {
      case 'CACHE_UPDATED':
        this.handleCacheUpdate(data);
        break;
      case 'SYNC_COMPLETE':
        this.handleSyncComplete(data);
        break;
      case 'SYNC_ERROR':
        this.handleSyncError(data);
        break;
      default:
        logger.warn('Message Service Worker non reconnu:', type);
    }
  }

  /**
   * Gestion du changement de visibilité
   */
  private handleVisibilityChange(): void {
    if (document.visibilityState === 'visible' && this.isOnline) {
      this.startSync();
    }
  }

  /**
   * Démarrer la synchronisation
   */
  private startSync(): void {
    if (this.isSyncing || !this.isOnline) {
      return;
    }

    this.isSyncing = true;
    this.emit('sync:start');

    this.processSyncQueue()
      .then(() => {
        this.isSyncing = false;
        this.emit('sync:complete');
        logger.info('Synchronisation terminée');
      })
      .catch((error) => {
        this.isSyncing = false;
        this.emit('sync:error', error);
        logger.error('Erreur synchronisation:', error);
      });
  }

  /**
   * Arrêter la synchronisation
   */
  private stopSync(): void {
    this.isSyncing = false;
    if (this.retryTimeout) {
      clearTimeout(this.retryTimeout);
      this.retryTimeout = null;
    }
  }

  /**
   * Démarrer l'intervalle de synchronisation
   */
  private startSyncInterval(): void {
    this.syncInterval = setInterval(() => {
      if (this.isOnline && !this.isSyncing) {
        this.startSync();
      }
    }, this.config.syncInterval);
  }

  /**
   * Arrêter l'intervalle de synchronisation
   */
  private stopSyncInterval(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
  }

  /**
   * Traiter la file de synchronisation
   */
  private async processSyncQueue(): Promise<void> {
    const dataToSync = [...this.pendingData];
    this.pendingData = [];

    for (const data of dataToSync) {
      try {
        await this.syncData(data);
        this.emit('data:synced', data);
      } catch (error) {
        this.handleSyncError(data, error);
      }
    }
  }

  /**
   * Synchroniser une donnée
   */
  private async syncData(data: OfflineData): Promise<void> {
    try {
      const response = await fetch(data.endpoint, {
        method: data.type === 'create' ? 'POST' : data.type === 'update' ? 'PUT' : 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        },
        body: data.type !== 'delete' ? JSON.stringify(data.data) : undefined
      });

      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }

      logger.info(`Donnée synchronisée: ${data.id}`);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Gestion des erreurs de synchronisation
   */
  private handleSyncError(data: OfflineData, error: any): void {
    data.retryCount++;
    
    if (data.retryCount < data.maxRetries) {
      // Réessayer plus tard
      this.retryTimeout = setTimeout(() => {
        this.pendingData.push(data);
        this.startSync();
      }, this.config.retryDelay * data.retryCount);
      
      logger.warn(`Échec synchronisation, nouvelle tentative: ${data.id}`);
    } else {
      // Abandonner après le nombre maximum de tentatives
      this.emit('data:sync:failed', { data, error });
      logger.error(`Échec définitif synchronisation: ${data.id}`, error);
    }
  }

  /**
   * Gestion de la mise à jour du cache
   */
  private handleCacheUpdate(data: any): void {
    this.emit('cache:updated', data);
  }

  /**
   * Gestion de la fin de synchronisation
   */
  private handleSyncComplete(data: any): void {
    this.emit('sync:complete', data);
  }

  /**
   * Gestion des erreurs de synchronisation
   */
  private handleSyncError(data: any): void {
    this.emit('sync:error', data);
  }

  /**
   * Ajouter des données à synchroniser
   */
  addToSyncQueue(data: Omit<OfflineData, 'id' | 'timestamp' | 'retryCount'>): void {
    const offlineData: OfflineData = {
      ...data,
      id: this.generateId(),
      timestamp: new Date(),
      retryCount: 0,
      maxRetries: this.config.maxRetries
    };

    // Vérifier la limite de données en attente
    if (this.pendingData.length >= this.config.maxPendingData) {
      this.emit('sync:queue:full');
      logger.warn('File de synchronisation pleine');
      return;
    }

    this.pendingData.push(offlineData);
    this.emit('data:queued', offlineData);

    // Démarrer la synchronisation si en ligne
    if (this.isOnline) {
      this.startSync();
    }
  }

  /**
   * Mettre en cache des données
   */
  cacheData(key: string, data: any, ttl: number = this.config.cacheTTL): void {
    const entry: CacheEntry = {
      key,
      data,
      timestamp: new Date(),
      ttl,
      version: 1
    };

    this.cache.set(key, entry);
    this.emit('cache:set', { key, data });

    // Nettoyer le cache si nécessaire
    this.cleanupCache();
  }

  /**
   * Récupérer des données du cache
   */
  getCachedData(key: string): any | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return null;
    }

    // Vérifier l'expiration
    if (Date.now() - entry.timestamp.getTime() > entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  /**
   * Nettoyer le cache
   */
  private cleanupCache(): void {
    if (this.cache.size <= this.config.maxCacheSize) {
      return;
    }

    // Supprimer les entrées les plus anciennes
    const entries = Array.from(this.cache.entries())
      .sort((a, b) => a[1].timestamp.getTime() - b[1].timestamp.getTime());

    const toDelete = entries.slice(0, entries.length - this.config.maxCacheSize);
    
    for (const [key] of toDelete) {
      this.cache.delete(key);
    }

    logger.info(`Cache nettoyé: ${toDelete.length} entrées supprimées`);
  }

  /**
   * Charger les données en attente depuis le stockage local
   */
  private loadPendingData(): void {
    try {
      const stored = localStorage.getItem('crou-pending-data');
      if (stored) {
        this.pendingData = JSON.parse(stored).map((data: any) => ({
          ...data,
          timestamp: new Date(data.timestamp)
        }));
        logger.info(`Données en attente chargées: ${this.pendingData.length}`);
      }
    } catch (error) {
      logger.error('Erreur chargement données en attente:', error);
    }
  }

  /**
   * Sauvegarder les données en attente
   */
  private savePendingData(): void {
    try {
      localStorage.setItem('crou-pending-data', JSON.stringify(this.pendingData));
    } catch (error) {
      logger.error('Erreur sauvegarde données en attente:', error);
    }
  }

  /**
   * Obtenir le statut de synchronisation
   */
  getSyncStatus(): SyncStatus {
    return {
      isOnline: this.isOnline,
      isSyncing: this.isSyncing,
      pendingCount: this.pendingData.length,
      lastSync: this.pendingData.length === 0 ? new Date() : null,
      errors: []
    };
  }

  /**
   * Forcer la synchronisation
   */
  forceSync(): void {
    if (this.isOnline) {
      this.startSync();
    }
  }

  /**
   * Vider la file de synchronisation
   */
  clearSyncQueue(): void {
    this.pendingData = [];
    this.savePendingData();
    this.emit('sync:queue:cleared');
  }

  /**
   * Vider le cache
   */
  clearCache(): void {
    this.cache.clear();
    this.emit('cache:cleared');
  }

  /**
   * Obtenir les données en attente
   */
  getPendingData(): OfflineData[] {
    return [...this.pendingData];
  }

  /**
   * Obtenir les statistiques du cache
   */
  getCacheStats(): { size: number; entries: string[] } {
    return {
      size: this.cache.size,
      entries: Array.from(this.cache.keys())
    };
  }

  /**
   * Générer un ID unique
   */
  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  /**
   * Nettoyer les ressources
   */
  destroy(): void {
    this.stopSync();
    this.stopSyncInterval();
    this.savePendingData();
    this.removeAllListeners();
  }
}

// Instance singleton
export const offlineService = new OfflineService();

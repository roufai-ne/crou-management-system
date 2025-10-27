/**
 * FICHIER: apps\web\src\services\sync.service.ts
 * SERVICE: SyncService - Service de synchronisation différée
 * 
 * DESCRIPTION:
 * Service pour la synchronisation différée des données
 * Gestion des conflits et résolution automatique
 * 
 * FONCTIONNALITÉS:
 * - Synchronisation différée des données
 * - Gestion des conflits
 * - Résolution automatique
 * - Retry intelligent
 * - Audit trail
 * 
 * AUTEUR: Équipe CROU
 * DATE: Décembre 2024
 */

import { EventEmitter } from 'events';
import { logger } from '@/utils/logger';

// Types pour le service de synchronisation
interface SyncData {
  id: string;
  type: 'create' | 'update' | 'delete';
  endpoint: string;
  data: any;
  timestamp: Date;
  retryCount: number;
  maxRetries: number;
  priority: 'low' | 'medium' | 'high' | 'critical';
  conflictResolution?: 'server' | 'client' | 'merge' | 'manual';
  metadata?: any;
}

interface ConflictResolution {
  id: string;
  serverData: any;
  clientData: any;
  resolution: 'server' | 'client' | 'merge';
  resolvedAt: Date;
  resolvedBy: string;
}

interface SyncStats {
  total: number;
  successful: number;
  failed: number;
  pending: number;
  conflicts: number;
  averageTime: number;
  lastSync: Date | null;
}

export class SyncService extends EventEmitter {
  private syncQueue: SyncData[] = [];
  private conflictResolutions: ConflictResolution[] = [];
  private isProcessing: boolean = false;
  private retryTimeout: NodeJS.Timeout | null = null;
  private stats: SyncStats = {
    total: 0,
    successful: 0,
    failed: 0,
    pending: 0,
    conflicts: 0,
    averageTime: 0,
    lastSync: null
  };

  // Configuration
  private config = {
    maxRetries: 3,
    retryDelay: 5000,
    batchSize: 10,
    conflictTimeout: 30000,
    maxQueueSize: 1000
  };

  constructor() {
    super();
    this.loadFromStorage();
  }

  /**
   * Ajouter des données à synchroniser
   */
  addToSyncQueue(data: Omit<SyncData, 'id' | 'timestamp' | 'retryCount'>): string {
    const syncData: SyncData = {
      ...data,
      id: this.generateId(),
      timestamp: new Date(),
      retryCount: 0,
      maxRetries: this.config.maxRetries
    };

    // Vérifier la limite de la file
    if (this.syncQueue.length >= this.config.maxQueueSize) {
      this.emit('queue:full');
      throw new Error('File de synchronisation pleine');
    }

    this.syncQueue.push(syncData);
    this.stats.pending++;
    this.stats.total++;

    this.saveToStorage();
    this.emit('data:queued', syncData);

    // Démarrer le traitement si pas en cours
    if (!this.isProcessing) {
      this.processQueue();
    }

    return syncData.id;
  }

  /**
   * Traiter la file de synchronisation
   */
  private async processQueue(): Promise<void> {
    if (this.isProcessing || this.syncQueue.length === 0) {
      return;
    }

    this.isProcessing = true;
    this.emit('sync:start');

    try {
      // Trier par priorité et timestamp
      const sortedQueue = this.syncQueue.sort((a, b) => {
        const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
        const aPriority = priorityOrder[a.priority] || 1;
        const bPriority = priorityOrder[b.priority] || 1;
        
        if (aPriority !== bPriority) {
          return bPriority - aPriority;
        }
        
        return a.timestamp.getTime() - b.timestamp.getTime();
      });

      // Traiter par lots
      const batches = this.chunkArray(sortedQueue, this.config.batchSize);
      
      for (const batch of batches) {
        await this.processBatch(batch);
      }

      this.stats.lastSync = new Date();
      this.emit('sync:complete', this.stats);

    } catch (error) {
      this.emit('sync:error', error);
      logger.error('Erreur traitement file de synchronisation:', error);
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Traiter un lot de données
   */
  private async processBatch(batch: SyncData[]): Promise<void> {
    const promises = batch.map(data => this.syncData(data));
    await Promise.allSettled(promises);
  }

  /**
   * Synchroniser une donnée
   */
  private async syncData(data: SyncData): Promise<void> {
    const startTime = Date.now();
    
    try {
      const response = await this.sendRequest(data);
      
      if (response.ok) {
        // Succès
        this.removeFromQueue(data.id);
        this.stats.successful++;
        this.stats.pending--;
        
        const duration = Date.now() - startTime;
        this.updateAverageTime(duration);
        
        this.emit('data:synced', { data, duration });
        logger.info(`Donnée synchronisée: ${data.id}`);
        
      } else if (response.status === 409) {
        // Conflit
        await this.handleConflict(data, response);
        
      } else {
        // Erreur
        throw new Error(`Erreur HTTP: ${response.status}`);
      }

    } catch (error) {
      await this.handleSyncError(data, error);
    }
  }

  /**
   * Envoyer une requête
   */
  private async sendRequest(data: SyncData): Promise<Response> {
    const method = data.type === 'create' ? 'POST' : 
                  data.type === 'update' ? 'PUT' : 'DELETE';
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
    };

    // Ajouter des en-têtes de synchronisation
    headers['X-Sync-Id'] = data.id;
    headers['X-Sync-Timestamp'] = data.timestamp.toISOString();
    headers['X-Sync-Priority'] = data.priority;

    return fetch(data.endpoint, {
      method,
      headers,
      body: data.type !== 'delete' ? JSON.stringify(data.data) : undefined
    });
  }

  /**
   * Gérer un conflit
   */
  private async handleConflict(data: SyncData, response: Response): Promise<void> {
    try {
      const conflictData = await response.json();
      
      const conflict: ConflictResolution = {
        id: this.generateId(),
        serverData: conflictData.server,
        clientData: data.data,
        resolution: data.conflictResolution || 'server',
        resolvedAt: new Date(),
        resolvedBy: 'system'
      };

      this.conflictResolutions.push(conflict);
      this.stats.conflicts++;

      // Résoudre automatiquement selon la stratégie
      const resolvedData = await this.resolveConflict(conflict);
      
      if (resolvedData) {
        // Mettre à jour la donnée et réessayer
        data.data = resolvedData;
        this.emit('conflict:resolved', conflict);
        logger.info(`Conflit résolu: ${data.id}`);
      } else {
        // Marquer pour résolution manuelle
        this.emit('conflict:manual', conflict);
        logger.warn(`Conflit nécessite résolution manuelle: ${data.id}`);
      }

    } catch (error) {
      logger.error('Erreur gestion conflit:', error);
      await this.handleSyncError(data, error);
    }
  }

  /**
   * Résoudre un conflit automatiquement
   */
  private async resolveConflict(conflict: ConflictResolution): Promise<any> {
    switch (conflict.resolution) {
      case 'server':
        return conflict.serverData;
        
      case 'client':
        return conflict.clientData;
        
      case 'merge':
        return this.mergeData(conflict.serverData, conflict.clientData);
        
      case 'manual':
        return null;
        
      default:
        return conflict.serverData;
    }
  }

  /**
   * Fusionner des données
   */
  private mergeData(serverData: any, clientData: any): any {
    // Stratégie de fusion simple - le client gagne
    return { ...serverData, ...clientData };
  }

  /**
   * Gérer une erreur de synchronisation
   */
  private async handleSyncError(data: SyncData, error: any): Promise<void> {
    data.retryCount++;
    
    if (data.retryCount < data.maxRetries) {
      // Réessayer plus tard
      const delay = this.config.retryDelay * Math.pow(2, data.retryCount - 1);
      
      this.retryTimeout = setTimeout(() => {
        this.processQueue();
      }, delay);
      
      this.emit('data:retry', { data, retryCount: data.retryCount });
      logger.warn(`Échec synchronisation, nouvelle tentative: ${data.id} (${data.retryCount}/${data.maxRetries})`);
      
    } else {
      // Abandonner après le nombre maximum de tentatives
      this.removeFromQueue(data.id);
      this.stats.failed++;
      this.stats.pending--;
      
      this.emit('data:failed', { data, error });
      logger.error(`Échec définitif synchronisation: ${data.id}`, error);
    }
  }

  /**
   * Supprimer de la file
   */
  private removeFromQueue(id: string): void {
    const index = this.syncQueue.findIndex(data => data.id === id);
    if (index > -1) {
      this.syncQueue.splice(index, 1);
      this.saveToStorage();
    }
  }

  /**
   * Mettre à jour le temps moyen
   */
  private updateAverageTime(duration: number): void {
    if (this.stats.successful === 1) {
      this.stats.averageTime = duration;
    } else {
      this.stats.averageTime = (this.stats.averageTime * (this.stats.successful - 1) + duration) / this.stats.successful;
    }
  }

  /**
   * Diviser un tableau en lots
   */
  private chunkArray<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }

  /**
   * Sauvegarder dans le stockage local
   */
  private saveToStorage(): void {
    try {
      localStorage.setItem('crou-sync-queue', JSON.stringify(this.syncQueue));
      localStorage.setItem('crou-sync-stats', JSON.stringify(this.stats));
    } catch (error) {
      logger.error('Erreur sauvegarde file de synchronisation:', error);
    }
  }

  /**
   * Charger depuis le stockage local
   */
  private loadFromStorage(): void {
    try {
      const storedQueue = localStorage.getItem('crou-sync-queue');
      if (storedQueue) {
        this.syncQueue = JSON.parse(storedQueue).map((data: any) => ({
          ...data,
          timestamp: new Date(data.timestamp)
        }));
      }

      const storedStats = localStorage.getItem('crou-sync-stats');
      if (storedStats) {
        this.stats = {
          ...JSON.parse(storedStats),
          lastSync: this.stats.lastSync ? new Date(this.stats.lastSync) : null
        };
      }
    } catch (error) {
      logger.error('Erreur chargement file de synchronisation:', error);
    }
  }

  /**
   * Obtenir les statistiques
   */
  getStats(): SyncStats {
    return { ...this.stats };
  }

  /**
   * Obtenir la file de synchronisation
   */
  getQueue(): SyncData[] {
    return [...this.syncQueue];
  }

  /**
   * Obtenir les résolutions de conflits
   */
  getConflictResolutions(): ConflictResolution[] {
    return [...this.conflictResolutions];
  }

  /**
   * Vider la file de synchronisation
   */
  clearQueue(): void {
    this.syncQueue = [];
    this.stats.pending = 0;
    this.saveToStorage();
    this.emit('queue:cleared');
  }

  /**
   * Forcer la synchronisation
   */
  forceSync(): void {
    if (!this.isProcessing) {
      this.processQueue();
    }
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
    if (this.retryTimeout) {
      clearTimeout(this.retryTimeout);
    }
    this.removeAllListeners();
  }
}

// Instance singleton
export const syncService = new SyncService();

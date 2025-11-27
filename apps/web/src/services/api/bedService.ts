/**
 * FICHIER: apps/web/src/services/api/bedService.ts
 * SERVICE: Service API pour la gestion des lits
 *
 * DESCRIPTION:
 * Service frontend pour toutes les opérations sur les LITS
 * Les lits sont au cœur du système de logement
 *
 * AUTEUR: Équipe CROU
 * DATE: Janvier 2025
 */

import { apiClient } from './apiClient';

export enum BedStatus {
  AVAILABLE = 'available',
  OCCUPIED = 'occupied',
  MAINTENANCE = 'maintenance',
  OUT_OF_SERVICE = 'out_of_service'
}

export interface Bed {
  id: string;
  roomId: string;
  number: string;
  status: BedStatus;
  description?: string;
  notes?: string;
  isActive: boolean;
  room?: {
    id: string;
    numero: string;
    housing?: {
      id: string;
      nom: string;
    };
  };
  occupancies?: any[];
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  updatedBy?: string;
}

export interface CreateBedRequest {
  roomId: string;
  number: string;
  description?: string;
  notes?: string;
}

export interface UpdateBedRequest {
  number?: string;
  description?: string;
  status?: BedStatus;
  notes?: string;
  isActive?: boolean;
}

export interface BedFilters {
  roomId?: string;
  complexId?: string;
  status?: BedStatus | 'all';
  search?: string;
  isActive?: boolean;
}

export interface BedStats {
  total: number;
  available: number;
  occupied: number;
  maintenance: number;
  outOfService: number;
  occupancyRate: string;
  utilization?: {
    usable: number;
    utilizationRate: string;
  };
}

export const bedService = {
  /**
   * Récupérer tous les lits avec filtres
   */
  async getAll(filters?: BedFilters): Promise<{ data: Bed[]; total: number }> {
    const params = new URLSearchParams();

    if (filters?.roomId) params.append('roomId', filters.roomId);
    if (filters?.complexId) params.append('complexId', filters.complexId);
    if (filters?.status && filters.status !== 'all') params.append('status', filters.status);
    if (filters?.search) params.append('search', filters.search);
    if (filters?.isActive !== undefined) params.append('isActive', String(filters.isActive));

    return apiClient.get(`/housing/beds?${params.toString()}`);
  },

  /**
   * Récupérer un lit par ID
   */
  async getById(id: string): Promise<Bed> {
    return apiClient.get(`/housing/beds/${id}`);
  },

  /**
   * Récupérer les lits d'une chambre
   */
  async getByRoom(roomId: string): Promise<Bed[]> {
    return apiClient.get(`/housing/beds/room/${roomId}`);
  },

  /**
   * Récupérer les lits disponibles d'une chambre
   */
  async getAvailableByRoom(roomId: string): Promise<Bed[]> {
    return apiClient.get(`/housing/beds/room/${roomId}/available`);
  },

  /**
   * Récupérer les lits d'un complexe
   */
  async getByComplex(complexId: string): Promise<Bed[]> {
    return apiClient.get(`/housing/beds/complex/${complexId}`);
  },

  /**
   * Créer un nouveau lit
   */
  async create(data: CreateBedRequest): Promise<Bed> {
    return apiClient.post('/housing/beds', data);
  },

  /**
   * Générer automatiquement les lits pour une chambre
   */
  async generateForRoom(roomId: string, capacity: number): Promise<Bed[]> {
    return apiClient.post(`/housing/beds/room/${roomId}/generate`, { capacity });
  },

  /**
   * Mettre à jour un lit
   */
  async update(id: string, data: UpdateBedRequest): Promise<Bed> {
    return apiClient.patch(`/housing/beds/${id}`, data);
  },

  /**
   * Supprimer un lit
   */
  async delete(id: string): Promise<void> {
    return apiClient.delete(`/housing/beds/${id}`);
  },

  /**
   * Mettre un lit en maintenance
   */
  async setMaintenance(id: string, notes?: string): Promise<Bed> {
    return apiClient.post(`/housing/beds/${id}/maintenance`, { notes });
  },

  /**
   * Remettre un lit en service (disponible)
   */
  async setAvailable(id: string): Promise<Bed> {
    return apiClient.post(`/housing/beds/${id}/available`, {});
  },

  /**
   * Mettre un lit hors service
   */
  async setOutOfService(id: string, reason?: string): Promise<Bed> {
    return apiClient.post(`/housing/beds/${id}/out-of-service`, { reason });
  },

  /**
   * Statistiques globales des lits
   */
  async getGlobalStats(): Promise<BedStats> {
    return apiClient.get('/housing/beds/stats');
  },

  /**
   * Statistiques des lits d'un complexe
   */
  async getStatsByComplex(complexId: string): Promise<BedStats> {
    return apiClient.get(`/housing/beds/complex/${complexId}/stats`);
  },

  /**
   * Statistiques des lits d'une chambre
   */
  async getStatsByRoom(roomId: string): Promise<BedStats> {
    return apiClient.get(`/housing/beds/room/${roomId}/stats`);
  },

  /**
   * Obtenir le label du statut
   */
  getStatusLabel(status: BedStatus): string {
    const labels: Record<BedStatus, string> = {
      [BedStatus.AVAILABLE]: 'Disponible',
      [BedStatus.OCCUPIED]: 'Occupé',
      [BedStatus.MAINTENANCE]: 'En maintenance',
      [BedStatus.OUT_OF_SERVICE]: 'Hors service'
    };
    return labels[status] || status;
  },

  /**
   * Obtenir la classe CSS du badge
   */
  getStatusBadgeClass(status: BedStatus): string {
    const classes: Record<BedStatus, string> = {
      [BedStatus.AVAILABLE]: 'badge-success',
      [BedStatus.OCCUPIED]: 'badge-error',
      [BedStatus.MAINTENANCE]: 'badge-warning',
      [BedStatus.OUT_OF_SERVICE]: 'badge-neutral'
    };
    return classes[status] || 'badge-neutral';
  },

  /**
   * Obtenir l'icône du statut
   */
  getStatusIcon(status: BedStatus): string {
    const icons: Record<BedStatus, string> = {
      [BedStatus.AVAILABLE]: '🟢',
      [BedStatus.OCCUPIED]: '🔴',
      [BedStatus.MAINTENANCE]: '🟠',
      [BedStatus.OUT_OF_SERVICE]: '⚫'
    };
    return icons[status] || '⚪';
  }
};

/**
 * FICHIER: apps/web/src/services/api/housingOccupancyService.ts
 * SERVICE: HousingOccupancyService - Service pour les occupations de logement
 *
 * DESCRIPTION:
 * Service API pour la gestion des occupations de chambres
 * Une occupation = un étudiant logé dans une chambre pour une période
 *
 * FONCTIONNALITÉS:
 * - Création occupation (manuelle ou depuis demande approuvée)
 * - Libération de chambre
 * - Suivi paiements loyers
 * - Historique occupations
 * - Alertes fins de contrat
 *
 * AUTEUR: Équipe CROU - Module Logement
 * DATE: Janvier 2025
 */

import { apiClient } from './apiClient';

// Types
export interface HousingOccupancy {
  id: string;
  studentId: string;
  student?: {
    firstName: string;
    lastName: string;
    email: string;
    studentNumber: string;
  };
  roomId: string;
  room?: {
    number: string;
    complex?: {
      name: string;
    };
    monthlyRent: number;
  };
  startDate: Date;
  endDate: Date;
  status: 'ACTIVE' | 'ENDED' | 'CANCELLED';
  monthlyRent: number;
  isRentPaid: boolean;
  lastRentPaymentDate?: Date;
  contractFile?: string;
  notes?: string;
  tenantId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateOccupancyRequest {
  studentId: string;
  roomId: string;
  startDate: string;
  endDate: string;
  monthlyRent: number;
  notes?: string;
}

export interface UpdateOccupancyRequest {
  endDate?: string;
  status?: 'ACTIVE' | 'ENDED' | 'CANCELLED';
  isRentPaid?: boolean;
  lastRentPaymentDate?: string;
  notes?: string;
}

export interface OccupancyFilters {
  page?: number;
  limit?: number;
  status?: 'ACTIVE' | 'ENDED' | 'CANCELLED' | 'all';
  complexId?: string;
  roomId?: string;
  studentId?: string;
  search?: string;
}

export interface OccupancyStats {
  total: number;
  active: number;
  ended: number;
  cancelled: number;
  unpaidRents: number;
  expiringWithin30Days: number;
}

// Service API
export const housingOccupancyService = {
  /**
   * Récupérer toutes les occupations avec filtres
   */
  async getAll(filters?: OccupancyFilters) {
    const params = new URLSearchParams();
    if (filters?.page) params.append('page', filters.page.toString());
    if (filters?.limit) params.append('limit', filters.limit.toString());
    if (filters?.status && filters.status !== 'all') params.append('status', filters.status);
    if (filters?.complexId) params.append('complexId', filters.complexId);
    if (filters?.roomId) params.append('roomId', filters.roomId);
    if (filters?.studentId) params.append('studentId', filters.studentId);
    if (filters?.search) params.append('search', filters.search);

    return apiClient.get<{ data: HousingOccupancy[]; total: number }>(
      `/housing/occupancies?${params.toString()}`
    );
  },

  /**
   * Récupérer une occupation par ID
   */
  async getById(id: string) {
    return apiClient.get<{ data: HousingOccupancy }>(`/housing/occupancies/${id}`);
  },

  /**
   * Créer une nouvelle occupation
   */
  async create(data: CreateOccupancyRequest) {
    return apiClient.post<{ data: HousingOccupancy }>('/housing/occupancies', data);
  },

  /**
   * Mettre à jour une occupation
   */
  async update(id: string, data: UpdateOccupancyRequest) {
    return apiClient.patch<{ data: HousingOccupancy }>(`/housing/occupancies/${id}`, data);
  },

  /**
   * Libérer une chambre (terminer occupation)
   */
  async release(id: string) {
    return apiClient.post<{ data: HousingOccupancy }>(`/housing/occupancies/${id}/release`, {});
  },

  /**
   * Marquer loyer comme payé
   */
  async markRentPaid(id: string) {
    return apiClient.post<{ data: HousingOccupancy }>(`/housing/occupancies/${id}/rent-paid`, {});
  },

  /**
   * Récupérer statistiques des occupations
   */
  async getStats() {
    return apiClient.get<{ data: OccupancyStats }>('/housing/occupancies/stats');
  },

  /**
   * Récupérer occupations avec alertes (fins de contrat proches)
   */
  async getExpiringOccupancies(days: number = 30) {
    return apiClient.get<{ data: HousingOccupancy[] }>(
      `/housing/occupancies/expiring?days=${days}`
    );
  },

  /**
   * Récupérer occupations avec loyers impayés
   */
  async getUnpaidRents() {
    return apiClient.get<{ data: HousingOccupancy[] }>('/housing/occupancies/unpaid-rents');
  },

  /**
   * Récupérer historique occupations d'un étudiant
   */
  async getStudentHistory(studentId: string) {
    return apiClient.get<{ data: HousingOccupancy[] }>(
      `/housing/occupancies/student/${studentId}/history`
    );
  },

  /**
   * Récupérer historique occupations d'une chambre
   */
  async getRoomHistory(roomId: string) {
    return apiClient.get<{ data: HousingOccupancy[] }>(
      `/housing/occupancies/room/${roomId}/history`
    );
  }
};

export default housingOccupancyService;

/**
 * FICHIER: apps/web/src/services/api/housingBatchService.ts
 * SERVICE: HousingBatchService - Service pour les campagnes d'attribution
 *
 * DESCRIPTION:
 * Service API pour la gestion des campagnes d'attribution de logements
 * Gère le cycle de vie complet : création, ouverture, fermeture, traitement
 *
 * FONCTIONNALITÉS:
 * - CRUD campagnes (ApplicationBatch)
 * - Gestion statuts (DRAFT, OPEN, CLOSED, PROCESSING, COMPLETED)
 * - Lancement assignation automatique
 * - Suivi progression temps réel
 * - Statistiques et rapports
 *
 * AUTEUR: Équipe CROU
 * DATE: Janvier 2025
 */

import { apiClient } from './apiClient';

// Types campagnes
export interface ApplicationBatch {
  id: string;
  batchNumber: string;
  name: string;
  type: 'RENEWAL_CAMPAIGN' | 'NEW_ASSIGNMENT_CAMPAIGN';
  academicYear: string;
  startDate: string;
  endDate: string;
  status: 'DRAFT' | 'OPEN' | 'CLOSED' | 'PROCESSING' | 'COMPLETED';
  allowOnlineSubmission: boolean;
  totalApplications: number;
  processedApplications: number;
  approvedCount: number;
  assignedCount: number;
  rejectedCount: number;
  onlineSubmissionsCount: number;
  manualSubmissionsCount: number;
  successRate: number;
  onlineSubmissionsRate: number;
  description?: string;
  tenantId: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateBatchRequest {
  name: string;
  type: 'RENEWAL_CAMPAIGN' | 'NEW_ASSIGNMENT_CAMPAIGN';
  academicYear: string;
  startDate: string;
  endDate: string;
  allowOnlineSubmission?: boolean;
  description?: string;
}

export interface UpdateBatchRequest {
  name?: string;
  type?: 'RENEWAL_CAMPAIGN' | 'NEW_ASSIGNMENT_CAMPAIGN';
  academicYear?: string;
  startDate?: string;
  endDate?: string;
  allowOnlineSubmission?: boolean;
  description?: string;
}

export interface BatchStatistics {
  batchId: string;
  totalApplications: number;
  processedApplications: number;
  assignedCount: number;
  pendingCount: number;
  failedCount: number;
  progressPercentage: number;
  status: string;
}

export interface BatchAssignmentReport {
  batchId: string;
  totalProcessed: number;
  successCount: number;
  failureCount: number;
  results: Array<{
    requestId: string;
    studentName: string;
    success: boolean;
    roomAssigned?: string;
    error?: string;
  }>;
  processedAt: string;
}

export interface BatchFilters {
  page?: number;
  limit?: number;
  status?: string;
  type?: string;
  academicYear?: string;
  search?: string;
}

// Service API
export const housingBatchService = {
  /**
   * Récupérer liste campagnes avec filtres et pagination
   */
  async getBatches(filters: BatchFilters = {}): Promise<{ data: ApplicationBatch[]; total: number; pages: number }> {
    const params = new URLSearchParams();
    if (filters.page) params.append('page', filters.page.toString());
    if (filters.limit) params.append('limit', filters.limit.toString());
    if (filters.status && filters.status !== 'all') params.append('status', filters.status);
    if (filters.type && filters.type !== 'all') params.append('type', filters.type);
    if (filters.academicYear) params.append('academicYear', filters.academicYear);
    if (filters.search) params.append('search', filters.search);

    const response = await apiClient.get(`/housing/batches?${params.toString()}`);
    return response.data;
  },

  /**
   * Récupérer campagnes actives (ouvertes pour soumission)
   */
  async getActiveBatches(): Promise<{ data: ApplicationBatch[] }> {
    const response = await apiClient.get('/housing/batches/active');
    return response.data;
  },

  /**
   * Récupérer détails d'une campagne
   */
  async getBatchById(id: string): Promise<{ data: ApplicationBatch }> {
    const response = await apiClient.get(`/housing/batches/${id}`);
    return response.data;
  },

  /**
   * Créer nouvelle campagne
   */
  async createBatch(data: CreateBatchRequest): Promise<{ data: ApplicationBatch; message: string }> {
    const response = await apiClient.post('/housing/batches', data);
    return response.data;
  },

  /**
   * Modifier campagne (uniquement si DRAFT)
   */
  async updateBatch(id: string, data: UpdateBatchRequest): Promise<{ data: ApplicationBatch; message: string }> {
    const response = await apiClient.patch(`/housing/batches/${id}`, data);
    return response.data;
  },

  /**
   * Supprimer campagne (uniquement si DRAFT)
   */
  async deleteBatch(id: string): Promise<{ message: string }> {
    const response = await apiClient.delete(`/housing/batches/${id}`);
    return response.data;
  },

  /**
   * Ouvrir campagne (DRAFT/CLOSED → OPEN)
   */
  async openBatch(id: string): Promise<{ data: ApplicationBatch; message: string }> {
    const response = await apiClient.post(`/housing/batches/${id}/open`);
    return response.data;
  },

  /**
   * Fermer campagne (OPEN → CLOSED)
   */
  async closeBatch(id: string): Promise<{ data: ApplicationBatch; message: string }> {
    const response = await apiClient.post(`/housing/batches/${id}/close`);
    return response.data;
  },

  /**
   * Lancer assignation automatique (CLOSED → PROCESSING → COMPLETED)
   */
  async processBatch(id: string): Promise<{ message: string; report: BatchAssignmentReport }> {
    const response = await apiClient.post(`/housing/batches/${id}/process`);
    return response.data;
  },

  /**
   * Récupérer statistiques temps réel d'une campagne
   */
  async getBatchStatistics(id: string): Promise<{ data: BatchStatistics }> {
    const response = await apiClient.get(`/housing/batches/${id}/stats`);
    return response.data;
  }
};

export default housingBatchService;

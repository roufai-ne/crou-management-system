/**
 * FICHIER: apps/web/src/services/api/housingRequestService.ts
 * SERVICE: HousingRequestService - Service pour les demandes de logement
 *
 * DESCRIPTION:
 * Service API pour la gestion des demandes de logement étudiants
 * Soumission demandes, upload documents, suivi statut
 *
 * FONCTIONNALITÉS:
 * - Soumission demandes (NOUVELLE/RENOUVELLEMENT)
 * - Validation éligibilité automatique
 * - Upload documents (PDF/JPG/PNG)
 * - Suivi statut temps réel
 * - Classement priorité
 *
 * AUTEUR: Équipe CROU
 * DATE: Janvier 2025
 */

import { apiClient } from './apiClient';

// Types demandes
export interface HousingRequest {
  id: string;
  studentId: string;
  batchId: string;
  type: 'NOUVELLE' | 'RENOUVELLEMENT';
  status: 'DRAFT' | 'SUBMITTED' | 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED' | 'ASSIGNED' | 'CONFIRMED';
  submissionMethod: 'ONLINE' | 'MANUAL';
  priorityScore: number;
  typeChambresPreferees: string[];
  preferenceCites: string[];
  dateSubmission?: string;
  dateTraitement?: string;
  roomAssignedId?: string;
  treatedById?: string;
  motifRejet?: string;
  observations?: string;
  hasQuittanceLoyer: boolean;
  hasQuittanceInscription: boolean;
  hasAttestation: boolean;
  tenantId: string;
  createdAt: string;
  updatedAt: string;
  student?: any;
  batch?: any;
  roomAssigned?: any;
}

export interface CreateRequestRequest {
  batchId: string;
  type: 'NOUVELLE' | 'RENOUVELLEMENT';
  typeChambresPreferees: string[];
  preferenceCites: string[];
  observations?: string;
}

export interface RequestFilters {
  page?: number;
  limit?: number;
  batchId?: string;
  status?: string;
  type?: string;
  submissionMethod?: string;
  search?: string;
}

export interface EligibilityCheck {
  isEligible: boolean;
  score: number;
  reasons: string[];
  checks: {
    hasRentPaid?: boolean;
    hasNotExceededMaxYears?: boolean;
    isBoursier?: boolean;
    hasDocuments?: boolean;
  };
}

export interface DocumentUpload {
  id: string;
  docType: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  url: string;
  uploadedAt: string;
  verifiedAt?: string;
}

// Service API
export const housingRequestService = {
  /**
   * Récupérer liste demandes avec filtres
   */
  async getRequests(filters: RequestFilters = {}): Promise<{ data: HousingRequest[]; total: number; pages: number }> {
    const params = new URLSearchParams();
    if (filters.page) params.append('page', filters.page.toString());
    if (filters.limit) params.append('limit', filters.limit.toString());
    if (filters.batchId) params.append('batchId', filters.batchId);
    if (filters.status && filters.status !== 'all') params.append('status', filters.status);
    if (filters.type && filters.type !== 'all') params.append('type', filters.type);
    if (filters.submissionMethod && filters.submissionMethod !== 'all') params.append('submissionMethod', filters.submissionMethod);
    if (filters.search) params.append('search', filters.search);

    const response = await apiClient.get(`/housing/requests?${params.toString()}`);
    return response.data;
  },

  /**
   * Récupérer demandes de l'étudiant connecté
   */
  async getMyRequests(): Promise<{ data: HousingRequest[] }> {
    const response = await apiClient.get('/housing/requests/my');
    return response.data;
  },

  /**
   * Récupérer détails demande
   */
  async getRequestById(id: string): Promise<{ data: HousingRequest }> {
    const response = await apiClient.get(`/housing/requests/${id}`);
    return response.data;
  },

  /**
   * Créer demande (soumission complète avec validation)
   */
  async createRequest(data: CreateRequestRequest): Promise<{ data: HousingRequest; message: string }> {
    const response = await apiClient.post('/housing/requests', data);
    return response.data;
  },

  /**
   * Créer brouillon (sans validation éligibilité)
   */
  async createDraftRequest(data: Partial<CreateRequestRequest>): Promise<{ data: HousingRequest; message: string }> {
    const response = await apiClient.post('/housing/requests/draft', data);
    return response.data;
  },

  /**
   * Modifier demande (uniquement si DRAFT)
   */
  async updateRequest(id: string, data: Partial<CreateRequestRequest>): Promise<{ data: HousingRequest; message: string }> {
    const response = await apiClient.patch(`/housing/requests/${id}`, data);
    return response.data;
  },

  /**
   * Supprimer demande (uniquement si DRAFT)
   */
  async deleteRequest(id: string): Promise<{ message: string }> {
    const response = await apiClient.delete(`/housing/requests/${id}`);
    return response.data;
  },

  /**
   * Changer statut demande (approve/reject)
   */
  async updateRequestStatus(id: string, status: string, motifRejet?: string): Promise<{ data: HousingRequest; message: string }> {
    const response = await apiClient.patch(`/housing/requests/${id}/status`, { status, motifRejet });
    return response.data;
  },

  /**
   * Récupérer classement par priorité
   */
  async getRanking(batchId: string): Promise<{ data: Array<HousingRequest & { rank: number }> }> {
    const response = await apiClient.get(`/housing/requests/ranking/${batchId}`);
    return response.data;
  },

  /**
   * Upload document
   */
  async uploadDocument(requestId: string, docType: string, file: File): Promise<{ message: string; document: DocumentUpload }> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await apiClient.post(`/housing/requests/${requestId}/upload/${docType}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  },

  /**
   * Récupérer documents d'une demande
   */
  async getRequestDocuments(requestId: string): Promise<{ data: DocumentUpload[]; count: number }> {
    const response = await apiClient.get(`/housing/requests/${requestId}/documents`);
    return response.data;
  },

  /**
   * Supprimer document
   */
  async deleteDocument(documentId: string): Promise<{ message: string }> {
    const response = await apiClient.delete(`/housing/documents/${documentId}`);
    return response.data;
  }
};

export default housingRequestService;

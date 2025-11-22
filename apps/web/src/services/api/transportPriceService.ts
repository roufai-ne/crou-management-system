/**
 * FICHIER: apps/web/src/services/api/transportPriceService.ts
 * SERVICE: TransportPriceService - API des tarifs de tickets transport
 *
 * DESCRIPTION:
 * Service frontend pour la gestion des tarifs configurables
 * Communication avec l'API backend /transport/prices
 *
 * AUTEUR: Équipe CROU - Module Transport
 * DATE: Janvier 2025
 */

import { apiClient } from './apiClient';

// ========================================
// TYPES & INTERFACES
// ========================================

export enum TicketPriceCategory {
  STANDARD = 'standard',
  BOURSIER = 'boursier',
  REDUIT = 'reduit',
  PERSONNEL = 'personnel',
  EXTERNE = 'externe'
}

export interface TransportTicketPrice {
  id: string;
  tenantId: string;
  category: TicketPriceCategory;
  name: string;
  description?: string;
  amount: number;
  isActive: boolean;
  isDefault: boolean;
  displayOrder: number;
  conditions?: {
    requiresProof?: boolean;
    proofType?: string;
    validFrom?: string;
    validUntil?: string;
    maxTicketsPerPerson?: number;
    notes?: string;
  };
  totalTicketsIssued: number;
  totalRevenue: number;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  updatedBy?: string;
}

export interface CreatePriceRequest {
  category: TicketPriceCategory;
  name: string;
  description?: string;
  amount: number;
  isDefault?: boolean;
  displayOrder?: number;
  conditions?: any;
}

export interface UpdatePriceRequest {
  name?: string;
  description?: string;
  amount?: number;
  isActive?: boolean;
  isDefault?: boolean;
  displayOrder?: number;
  conditions?: any;
}

export interface PriceStatistics {
  prices: Array<{
    id: string;
    name: string;
    category: TicketPriceCategory;
    amount: number;
    totalTicketsIssued: number;
    totalRevenue: number;
    percentage: number;
    isActive: boolean;
    isDefault: boolean;
  }>;
  summary: {
    totalPrices: number;
    activePrices: number;
    totalTickets: number;
    totalRevenue: number;
    averagePrice: number;
  };
}

// ========================================
// SERVICE API
// ========================================

export const transportPriceService = {
  /**
   * Récupérer tous les tarifs actifs (pour émission tickets)
   */
  async getActivePrices(): Promise<TransportTicketPrice[]> {
    const response = await apiClient.get('/transport/prices/active');
    return response.data.data;
  },

  /**
   * Récupérer tous les tarifs (actifs et inactifs) - Admin uniquement
   */
  async getAllPrices(): Promise<TransportTicketPrice[]> {
    const response = await apiClient.get('/transport/prices');
    return response.data.data;
  },

  /**
   * Récupérer un tarif par ID
   */
  async getPriceById(id: string): Promise<TransportTicketPrice> {
    const response = await apiClient.get(`/transport/prices/${id}`);
    return response.data.data;
  },

  /**
   * Récupérer le tarif par défaut
   */
  async getDefaultPrice(): Promise<TransportTicketPrice> {
    const response = await apiClient.get('/transport/prices/default/get');
    return response.data.data;
  },

  /**
   * Créer un nouveau tarif
   */
  async createPrice(data: CreatePriceRequest): Promise<TransportTicketPrice> {
    const response = await apiClient.post('/transport/prices', data);
    return response.data.data;
  },

  /**
   * Mettre à jour un tarif
   */
  async updatePrice(id: string, data: UpdatePriceRequest): Promise<TransportTicketPrice> {
    const response = await apiClient.put(`/transport/prices/${id}`, data);
    return response.data.data;
  },

  /**
   * Définir un tarif comme défaut
   */
  async setAsDefault(id: string): Promise<TransportTicketPrice> {
    const response = await apiClient.post(`/transport/prices/${id}/set-default`);
    return response.data.data;
  },

  /**
   * Activer un tarif
   */
  async activatePrice(id: string): Promise<TransportTicketPrice> {
    const response = await apiClient.post(`/transport/prices/${id}/activate`);
    return response.data.data;
  },

  /**
   * Désactiver un tarif
   */
  async deactivatePrice(id: string): Promise<TransportTicketPrice> {
    const response = await apiClient.post(`/transport/prices/${id}/deactivate`);
    return response.data.data;
  },

  /**
   * Supprimer un tarif
   */
  async deletePrice(id: string): Promise<void> {
    await apiClient.delete(`/transport/prices/${id}`);
  },

  /**
   * Obtenir les statistiques des tarifs
   */
  async getStatistics(): Promise<PriceStatistics> {
    const response = await apiClient.get('/transport/prices/statistics/summary');
    return response.data.data;
  }
};

export default transportPriceService;

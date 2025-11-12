/**
 * FICHIER: apps/web/src/services/api/transportTicketService.ts
 * SERVICE: TransportTicketService - Service pour la gestion des tickets transport
 *
 * DESCRIPTION:
 * Service pour la gestion complète des tickets de transport anonymes
 * Support multi-tenant avec permissions granulaires
 * Gestion émission, utilisation, annulation, statistiques
 *
 * FONCTIONNALITÉS:
 * - Émission de tickets (unitaire et batch)
 * - Utilisation/validation de tickets (scan QR)
 * - Annulation de tickets
 * - Recherche et filtres avancés
 * - Statistiques et rapports
 *
 * AUTEUR: Équipe CROU - Module Transport
 * DATE: Janvier 2025
 */

import { apiClient } from './apiClient';

// ========================================
// TYPES TICKETS TRANSPORT
// ========================================

export enum CategorieTicketTransport {
  PAYANT = 'payant',
  GRATUIT = 'gratuit'
}

export enum TicketTransportStatus {
  ACTIF = 'actif',
  UTILISE = 'utilise',
  EXPIRE = 'expire',
  ANNULE = 'annule'
}

export interface TicketTransport {
  id: string;
  tenantId: string;
  numeroTicket: string; // TKT-TRANS-2025-XXXXXX
  categorie: CategorieTicketTransport;
  annee: number;
  tarif: number;
  qrCode: string; // QR-TRANS-[TENANT]-[HASH]
  circuitId: string;
  circuitNom?: string;
  dateVoyage: Date;
  dateExpiration: Date;
  dateEmission: Date;
  estUtilise: boolean;
  dateUtilisation?: Date;
  trajetId?: string;
  vehiculeImmatriculation?: string;
  conducteur?: string;
  status: TicketTransportStatus;
  validePar?: string;
  motifAnnulation?: string;
  annulePar?: string;
  dateAnnulation?: Date;
  createdBy: string;
  updatedBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateTicketTransportRequest {
  circuitId: string;
  categorie: CategorieTicketTransport;
  tarif: number;
  dateVoyage: string; // ISO date
  dateExpiration: string; // ISO date
  annee?: number;
  observations?: string;
}

export interface CreateTicketsTransportBatchRequest {
  circuitId: string;
  categorie: CategorieTicketTransport;
  tarif: number;
  dateVoyage: string;
  dateExpiration: string;
  quantite: number; // Max 1000
  annee?: number;
}

export interface UtiliserTicketTransportRequest {
  numeroTicket?: string;
  qrCode?: string;
  trajetId?: string;
  vehiculeImmatriculation?: string;
  conducteur?: string;
}

export interface AnnulerTicketTransportRequest {
  motif: string;
}

export interface TicketTransportValidationResult {
  valide: boolean;
  raison?: string;
  ticket?: TicketTransport;
}

export interface TicketTransportFilters {
  status?: TicketTransportStatus;
  categorie?: CategorieTicketTransport;
  circuitId?: string;
  dateVoyageDebut?: string;
  dateVoyageFin?: string;
  dateEmissionDebut?: string;
  dateEmissionFin?: string;
  annee?: number;
  estUtilise?: boolean;
  page?: number;
  limit?: number;
}

export interface TicketTransportStatistics {
  totalEmis: number;
  totalActifs: number;
  totalUtilises: number;
  totalExpires: number;
  totalAnnules: number;
  totalPayants: number;
  totalGratuits: number;
  recettesTotales: number;
  ticketsParCircuit: Array<{
    circuitId: string;
    circuitNom: string;
    count: number;
  }>;
  evolutionMensuelle: Array<{
    mois: string;
    emis: number;
    utilises: number;
  }>;
}

export interface BatchCreateResult {
  tickets: TicketTransport[];
  total: number;
  montantTotal: number;
  payants: number;
  gratuits: number;
}

// ========================================
// SERVICE API
// ========================================

export const transportTicketService = {
  /**
   * Récupérer la liste des tickets avec filtres
   */
  async getTickets(filters?: TicketTransportFilters): Promise<{ data: TicketTransport[]; total: number }> {
    const response = await apiClient.get('/transport/tickets', { params: filters });
    return response.data.data;
  },

  /**
   * Récupérer un ticket par son ID
   */
  async getTicketById(id: string): Promise<TicketTransport> {
    const response = await apiClient.get(`/transport/tickets/${id}`);
    return response.data.data;
  },

  /**
   * Récupérer un ticket par son numéro
   */
  async getTicketByNumero(numeroTicket: string): Promise<TicketTransport> {
    const response = await apiClient.get(`/transport/tickets/numero/${numeroTicket}`);
    return response.data.data;
  },

  /**
   * Récupérer un ticket par son QR code
   */
  async getTicketByQRCode(qrCode: string): Promise<TicketTransport> {
    const response = await apiClient.get(`/transport/tickets/qr/${qrCode}`);
    return response.data.data;
  },

  /**
   * Créer un ticket individuel
   */
  async createTicket(data: CreateTicketTransportRequest): Promise<TicketTransport> {
    const response = await apiClient.post('/transport/tickets', data);
    return response.data.data;
  },

  /**
   * Créer un lot de tickets identiques
   */
  async createTicketsBatch(data: CreateTicketsTransportBatchRequest): Promise<BatchCreateResult> {
    const response = await apiClient.post('/transport/tickets/batch', data);
    return response.data.data;
  },

  /**
   * Utiliser/valider un ticket (scan QR ou numéro)
   */
  async utiliserTicket(ticketId: string, data: UtiliserTicketTransportRequest): Promise<TicketTransport> {
    const response = await apiClient.post(`/transport/tickets/${ticketId}/utiliser`, data);
    return response.data.data;
  },

  /**
   * Vérifier la validité d'un ticket
   */
  async verifierValidite(ticketId: string): Promise<TicketTransportValidationResult> {
    const response = await apiClient.get(`/transport/tickets/${ticketId}/verifier`);
    return response.data.data;
  },

  /**
   * Annuler un ticket
   */
  async annulerTicket(ticketId: string, data: AnnulerTicketTransportRequest): Promise<TicketTransport> {
    const response = await apiClient.put(`/transport/tickets/${ticketId}/annuler`, data);
    return response.data.data;
  },

  /**
   * Mettre à jour les tickets expirés (tâche de maintenance)
   */
  async updateExpiredTickets(): Promise<{ updated: number }> {
    const response = await apiClient.post('/transport/tickets/expired/update');
    return response.data.data;
  },

  /**
   * Obtenir les statistiques des tickets transport
   */
  async getStatistics(filters?: { annee?: number; mois?: number }): Promise<TicketTransportStatistics> {
    const response = await apiClient.get('/transport/tickets/statistics', { params: filters });
    return response.data.data;
  },

  /**
   * Exporter les tickets (CSV/Excel)
   */
  async exportTickets(filters?: TicketTransportFilters, format: 'csv' | 'excel' = 'csv'): Promise<Blob> {
    const response = await apiClient.get('/transport/tickets/export', {
      params: { ...filters, format },
      responseType: 'blob'
    });
    return response.data;
  },

  /**
   * Télécharger un ticket avec QR code (PDF)
   */
  async downloadTicketPDF(ticketId: string): Promise<Blob> {
    const response = await apiClient.get(`/transport/tickets/${ticketId}/pdf`, {
      responseType: 'blob'
    });
    return response.data;
  },

  /**
   * Télécharger un lot de tickets (ZIP de PDFs)
   */
  async downloadTicketsBatchPDF(ticketIds: string[]): Promise<Blob> {
    const response = await apiClient.post('/transport/tickets/batch/pdf',
      { ticketIds },
      { responseType: 'blob' }
    );
    return response.data;
  }
};

export default transportTicketService;

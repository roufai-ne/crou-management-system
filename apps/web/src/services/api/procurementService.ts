/**
 * FICHIER: apps/web/src/services/api/procurementService.new.ts
 * SERVICE: Procurement - Service API simplifié pour le nouveau backend
 * 
 * DESCRIPTION:
 * Service API aligné avec le backend NestJS /api/procurement
 * Workflow: Draft → Submit → Approve → Order → Receive → Close
 * 
 * AUTEUR: Équipe CROU
 * DATE: Janvier 2025
 */

import { apiClient } from './apiClient';

// ============================================================================
// TYPES ET ENUMS (alignés avec le backend)
// ============================================================================

export enum PurchaseOrderStatus {
  DRAFT = 'DRAFT',
  SUBMITTED = 'SUBMITTED',
  APPROVED = 'APPROVED',
  ORDERED = 'ORDERED',
  PARTIALLY_RECEIVED = 'PARTIALLY_RECEIVED',
  FULLY_RECEIVED = 'FULLY_RECEIVED',
  CLOSED = 'CLOSED',
  CANCELLED = 'CANCELLED'
}

export enum PurchaseOrderType {
  STANDARD = 'STANDARD',
  URGENT = 'URGENT',
  FRAMEWORK = 'FRAMEWORK',
  CONTRACT = 'CONTRACT'
}

export enum PaymentMethod {
  VIREMENT = 'VIREMENT',
  CHEQUE = 'CHEQUE',
  ESPECES = 'ESPECES',
  CARTE = 'CARTE'
}

// ============================================================================
// INTERFACES
// ============================================================================

export interface PurchaseOrderItem {
  id?: string;
  stockId?: string;
  codeArticle?: string;
  designation: string;
  description?: string;
  reference?: string;
  quantiteCommandee: number;
  quantiteRecue?: number;
  quantiteRestante?: number;
  unite: string;
  prixUnitaire: number;
  montantTotal?: number;
  tauxTVA?: number;
  tauxRemise?: number;
  delaiLivraison?: number;
  notes?: string;
}

export interface PurchaseOrder {
  id: string;
  reference: string;
  tenantId: string;
  budgetId: string;
  supplierId: string;
  objet: string;
  description?: string;
  type: PurchaseOrderType;
  status: PurchaseOrderStatus;
  
  // Dates
  dateCommande: string;
  dateEcheance?: string;
  dateApprobation?: string;
  dateEnvoi?: string;
  dateReception?: string;
  
  // Montants
  montantHT: number;
  montantTVA: number;
  montantTTC: number;
  montantReceptionne: number;
  devise: string;
  
  // Paiement
  modePaiement: PaymentMethod;
  delaiPaiement: number;
  conditionsParticulieres?: string;
  
  // Livraison
  adresseLivraison?: string;
  contactLivraison?: string;
  telephoneLivraison?: string;
  
  // Workflow
  createdBy: string;
  approvedBy?: string;
  receivedBy?: string;
  commentaireApprobation?: string;
  commentaireReception?: string;
  
  // Relations
  items?: PurchaseOrderItem[];
  supplier?: any;
  budget?: any;
  stockMovements?: any[];
  
  // Flags
  isFullyReceived: boolean;
  
  // Timestamps
  createdAt: string;
  updatedAt: string;
}

export interface CreatePurchaseOrderRequest {
  budgetId: string;
  supplierId: string;
  objet: string;
  description?: string;
  type?: PurchaseOrderType;
  dateEcheance?: string;
  modePaiement?: PaymentMethod;
  delaiPaiement?: number;
  conditionsParticulieres?: string;
  adresseLivraison?: string;
  contactLivraison?: string;
  telephoneLivraison?: string;
  items: Array<{
    stockId?: string;
    codeArticle?: string;
    designation: string;
    description?: string;
    reference?: string;
    quantiteCommandee: number;
    unite: string;
    prixUnitaire: number;
    tauxTVA?: number;
    tauxRemise?: number;
    delaiLivraison?: number;
    notes?: string;
  }>;
}

export interface PurchaseOrderFilters {
  status?: string;
  supplierId?: string;
  budgetId?: string;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
}

export interface ReceivePurchaseOrderRequest {
  receptionDate: string;
  items: Array<{
    itemId: string;
    quantiteRecue: number;
  }>;
  commentaire?: string;
}

export interface PurchaseOrdersResponse {
  success: boolean;
  data: {
    orders: PurchaseOrder[];
  };
  count: number;
}

export interface PurchaseOrderResponse {
  success: boolean;
  data: {
    order: PurchaseOrder;
  };
  message?: string;
}

// ============================================================================
// SERVICE API
// ============================================================================

export const procurementService = {
  /**
   * Lister les bons de commande
   */
  getPurchaseOrders: async (filters?: PurchaseOrderFilters): Promise<PurchaseOrdersResponse> => {
    const params = new URLSearchParams();
    if (filters?.status) params.append('status', filters.status);
    if (filters?.supplierId) params.append('supplierId', filters.supplierId);
    if (filters?.budgetId) params.append('budgetId', filters.budgetId);
    if (filters?.dateFrom) params.append('dateFrom', filters.dateFrom);
    if (filters?.dateTo) params.append('dateTo', filters.dateTo);
    if (filters?.search) params.append('search', filters.search);

    const response = await apiClient.get<PurchaseOrdersResponse>(
      `/procurement/purchase-orders?${params.toString()}`
    );
    return response.data;
  },

  /**
   * Obtenir un bon de commande par ID
   */
  getPurchaseOrderById: async (id: string): Promise<PurchaseOrderResponse> => {
    const response = await apiClient.get<PurchaseOrderResponse>(
      `/procurement/purchase-orders/${id}`
    );
    return response.data;
  },

  /**
   * Créer un bon de commande (brouillon)
   */
  createPurchaseOrder: async (data: CreatePurchaseOrderRequest): Promise<PurchaseOrderResponse> => {
    const response = await apiClient.post<PurchaseOrderResponse>(
      '/procurement/purchase-orders',
      data
    );
    return response.data;
  },

  /**
   * Soumettre un BC pour approbation
   */
  submitPurchaseOrder: async (id: string): Promise<PurchaseOrderResponse> => {
    const response = await apiClient.post<PurchaseOrderResponse>(
      `/procurement/purchase-orders/${id}/submit`
    );
    return response.data;
  },

  /**
   * Approuver un BC (engage le budget)
   */
  approvePurchaseOrder: async (id: string, commentaire?: string): Promise<PurchaseOrderResponse> => {
    const response = await apiClient.post<PurchaseOrderResponse>(
      `/procurement/purchase-orders/${id}/approve`,
      { commentaire }
    );
    return response.data;
  },

  /**
   * Marquer comme commandé (envoyé au fournisseur)
   */
  markAsOrdered: async (id: string): Promise<PurchaseOrderResponse> => {
    const response = await apiClient.post<PurchaseOrderResponse>(
      `/procurement/purchase-orders/${id}/order`
    );
    return response.data;
  },

  /**
   * Réceptionner un BC (crée mouvements de stock)
   */
  receivePurchaseOrder: async (
    id: string,
    data: ReceivePurchaseOrderRequest
  ): Promise<PurchaseOrderResponse> => {
    const response = await apiClient.post<PurchaseOrderResponse>(
      `/procurement/purchase-orders/${id}/receive`,
      data
    );
    return response.data;
  },

  /**
   * Annuler un BC (libère le budget engagé)
   */
  cancelPurchaseOrder: async (id: string, motif: string): Promise<PurchaseOrderResponse> => {
    const response = await apiClient.post<PurchaseOrderResponse>(
      `/procurement/purchase-orders/${id}/cancel`,
      { motif }
    );
    return response.data;
  }
};

export default procurementService;

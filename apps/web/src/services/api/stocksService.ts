/**
 * FICHIER: apps/web/src/services/api/stocksService.ts
 * SERVICE: StocksService - Service pour la gestion des stocks
 *
 * DESCRIPTION:
 * Service pour la gestion des stocks et inventaires
 * Support multi-tenant avec permissions granulaires
 * Gestion des mouvements, alertes et valorisation
 *
 * FONCTIONNALITÉS:
 * - Gestion des articles en stock
 * - Mouvements d'entrée/sortie
 * - Alertes de stock bas
 * - Valorisation des stocks
 * - Gestion des fournisseurs
 * - Rapports d'inventaire
 *
 * AUTEUR: Équipe CROU
 * DATE: Décembre 2024
 */

import { apiClient } from './apiClient';

// Types pour les articles de stock
export interface StockItem {
  id: string;
  code: string;
  libelle: string;
  description?: string;
  type: 'centralise' | 'local';
  category: string;
  unit: string;
  status: 'actif' | 'inactif' | 'en_rupture';
  quantiteActuelle: number;
  quantiteReservee: number;
  quantiteDisponible: number;
  seuilMinimum: number;
  seuilMaximum: number;
  prixUnitaire: number;
  valeurStock: number;
  tenantId: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  lastMovementAt?: Date;
  fournisseur?: {
    id: string;
    nom: string;
    contact: string;
  };
}

export interface CreateStockItemRequest {
  code: string;
  libelle: string;
  description?: string;
  type: 'centralise' | 'local';
  category: string;
  unit: string;
  quantiteInitiale: number;
  seuilMinimum: number;
  seuilMaximum: number;
  prixUnitaire: number;
  fournisseurId?: string;
}

export interface UpdateStockItemRequest {
  libelle?: string;
  description?: string;
  category?: string;
  unit?: string;
  seuilMinimum?: number;
  seuilMaximum?: number;
  prixUnitaire?: number;
  fournisseurId?: string;
}

// Types pour les mouvements de stock
export interface StockMovement {
  id: string;
  stockItemId: string;
  type: 'entree' | 'sortie' | 'ajustement' | 'transfert';
  quantite: number;
  prixUnitaire?: number;
  valeurTotale?: number;
  reference?: string;
  description?: string;
  motif?: string;
  tenantId: string;
  createdBy: string;
  createdAt: Date;
  stockItem?: StockItem;
}

export interface CreateStockMovementRequest {
  stockItemId: string;
  type: 'entree' | 'sortie' | 'ajustement' | 'transfert';
  quantite: number;
  prixUnitaire?: number;
  reference?: string;
  description?: string;
  motif?: string;
}

// Types pour les alertes de stock
export interface StockAlert {
  id: string;
  stockItemId: string;
  type: 'stock_bas' | 'stock_critique' | 'rupture' | 'expiration';
  niveau: 'warning' | 'danger' | 'critical';
  message: string;
  quantiteActuelle: number;
  seuil: number;
  isRead: boolean;
  tenantId: string;
  createdAt: Date;
  stockItem?: StockItem;
}

// Types pour les fournisseurs
export interface Supplier {
  id: string;
  nom: string;
  contact: string;
  email?: string;
  telephone?: string;
  adresse?: string;
  specialite: string;
  statut: 'actif' | 'inactif' | 'suspendu';
  tenantId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateSupplierRequest {
  nom: string;
  contact: string;
  email?: string;
  telephone?: string;
  adresse?: string;
  specialite: string;
}

// Types pour les métriques
export interface StocksMetrics {
  totalItems: number;
  totalValue: number;
  lowStockAlerts: number;
  pendingOrders: number;
  topCategories: Array<{
    category: string;
    count: number;
    value: number;
    percentage: number;
  }>;
  recentMovements: StockMovement[];
  criticalAlerts: StockAlert[];
}

class StocksService {
  private baseUrl = '/stocks';

  // === ARTICLES DE STOCK ===

  /**
   * Récupère la liste des articles de stock
   */
  async getStockItems(params?: {
    page?: number;
    limit?: number;
    type?: string;
    category?: string;
    status?: string;
    search?: string;
    tenantId?: string;
  }): Promise<{
    items: StockItem[];
    total: number;
    page: number;
    limit: number;
  }> {
    try {
      const queryParams = new URLSearchParams();
      if (params?.page) queryParams.append('page', params.page.toString());
      if (params?.limit) queryParams.append('limit', params.limit.toString());
      if (params?.type) queryParams.append('type', params.type);
      if (params?.category) queryParams.append('category', params.category);
      if (params?.status) queryParams.append('status', params.status);
      if (params?.search) queryParams.append('search', params.search);
      if (params?.tenantId) queryParams.append('tenantId', params.tenantId);

      // Fixed: Backend route is /stocks/stocks not /stocks/items
      const response = await apiClient.get(`${this.baseUrl}/stocks?${queryParams.toString()}`);
      
      console.log('🔍 API Response:', response.data);
      
      // Le backend retourne directement { stocks: [...], total: ... }
      // apiClient.get déjà extrait response.data du wrapper { success: true, data: {...} }
      const result = {
        items: response.data.stocks || [],
        total: response.data.total || 0,
        page: params?.page || 1,
        limit: params?.limit || 10
      };
      
      console.log('📦 Mapped result:', result);
      
      return result;
    } catch (error) {
      console.error('Erreur lors de la récupération des articles de stock:', error);
      throw error;
    }
  }

  /**
   * Récupère un article de stock par ID
   */
  async getStockItem(id: string): Promise<StockItem> {
    try {
      // Fixed: Backend route is /stocks/stocks/:id not /stocks/items/:id
      const response = await apiClient.get(`${this.baseUrl}/stocks/${id}`);
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la récupération de l\'article de stock:', error);
      throw error;
    }
  }

  /**
   * Crée un nouvel article de stock
   */
  async createStockItem(data: CreateStockItemRequest): Promise<StockItem> {
    try {
      // Fixed: Backend route is /stocks/stocks not /stocks/items
      const response = await apiClient.post(`${this.baseUrl}/stocks`, data);
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la création de l\'article de stock:', error);
      throw error;
    }
  }

  /**
   * Met à jour un article de stock
   */
  async updateStockItem(id: string, data: UpdateStockItemRequest): Promise<StockItem> {
    try {
      // Fixed: Backend route is /stocks/stocks/:id not /stocks/items/:id
      const response = await apiClient.put(`${this.baseUrl}/stocks/${id}`, data);
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la mise à jour de l\'article de stock:', error);
      throw error;
    }
  }

  /**
   * Supprime un article de stock
   */
  async deleteStockItem(id: string): Promise<void> {
    try {
      // Fixed: Backend route is /stocks/stocks/:id not /stocks/items/:id
      await apiClient.delete(`${this.baseUrl}/stocks/${id}`);
    } catch (error) {
      console.error('Erreur lors de la suppression de l\'article de stock:', error);
      throw error;
    }
  }

  // === MOUVEMENTS DE STOCK ===

  /**
   * Récupère la liste des mouvements de stock
   */
  async getStockMovements(params?: {
    page?: number;
    limit?: number;
    stockItemId?: string;
    type?: string;
    dateFrom?: Date;
    dateTo?: Date;
    tenantId?: string;
  }): Promise<{
    movements: StockMovement[];
    total: number;
    page: number;
    limit: number;
  }> {
    try {
      const queryParams = new URLSearchParams();
      if (params?.page) queryParams.append('page', params.page.toString());
      if (params?.limit) queryParams.append('limit', params.limit.toString());
      if (params?.stockItemId) queryParams.append('stockItemId', params.stockItemId);
      if (params?.type) queryParams.append('type', params.type);
      if (params?.dateFrom) queryParams.append('dateFrom', params.dateFrom.toISOString());
      if (params?.dateTo) queryParams.append('dateTo', params.dateTo.toISOString());
      if (params?.tenantId) queryParams.append('tenantId', params.tenantId);

      const response = await apiClient.get(`${this.baseUrl}/movements?${queryParams.toString()}`);
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la récupération des mouvements de stock:', error);
      throw error;
    }
  }

  /**
   * Crée un nouveau mouvement de stock
   */
  async createStockMovement(data: CreateStockMovementRequest): Promise<StockMovement> {
    try {
      const response = await apiClient.post(`${this.baseUrl}/movements`, data);
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la création du mouvement de stock:', error);
      throw error;
    }
  }

  // === ALERTES DE STOCK ===

  /**
   * Récupère les alertes de stock
   */
  async getStockAlerts(params?: {
    type?: string;
    niveau?: string;
    isRead?: boolean;
    tenantId?: string;
  }): Promise<StockAlert[]> {
    try {
      const queryParams = new URLSearchParams();
      if (params?.type) queryParams.append('type', params.type);
      if (params?.niveau) queryParams.append('niveau', params.niveau);
      if (params?.isRead !== undefined) queryParams.append('isRead', params.isRead.toString());
      if (params?.tenantId) queryParams.append('tenantId', params.tenantId);

      const response = await apiClient.get(`${this.baseUrl}/alerts?${queryParams.toString()}`);
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la récupération des alertes de stock:', error);
      throw error;
    }
  }

  /**
   * Marque une alerte comme lue
   */
  async markAlertAsRead(alertId: string): Promise<void> {
    try {
      await apiClient.patch(`${this.baseUrl}/alerts/${alertId}/read`);
    } catch (error) {
      console.error('Erreur lors de la mise à jour de l\'alerte:', error);
      throw error;
    }
  }

  // === FOURNISSEURS ===

  /**
   * Récupère la liste des fournisseurs
   */
  async getSuppliers(params?: {
    page?: number;
    limit?: number;
    statut?: string;
    specialite?: string;
    search?: string;
    tenantId?: string;
  }): Promise<{
    suppliers: Supplier[];
    total: number;
    page: number;
    limit: number;
  }> {
    try {
      const queryParams = new URLSearchParams();
      if (params?.page) queryParams.append('page', params.page.toString());
      if (params?.limit) queryParams.append('limit', params.limit.toString());
      if (params?.statut) queryParams.append('statut', params.statut);
      if (params?.specialite) queryParams.append('specialite', params.specialite);
      if (params?.search) queryParams.append('search', params.search);
      if (params?.tenantId) queryParams.append('tenantId', params.tenantId);

      const response = await apiClient.get(`${this.baseUrl}/suppliers?${queryParams.toString()}`);
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la récupération des fournisseurs:', error);
      throw error;
    }
  }

  /**
   * Crée un nouveau fournisseur
   */
  async createSupplier(data: CreateSupplierRequest): Promise<Supplier> {
    try {
      const response = await apiClient.post(`${this.baseUrl}/suppliers`, data);
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la création du fournisseur:', error);
      throw error;
    }
  }

  // === MÉTRIQUES ===

  /**
   * Récupère les métriques de stock
   */
  async getMetrics(tenantId?: string): Promise<StocksMetrics> {
    try {
      const params = tenantId ? `?tenantId=${tenantId}` : '';
      const response = await apiClient.get(`${this.baseUrl}/metrics${params}`);
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la récupération des métriques de stock:', error);
      throw error;
    }
  }

  /**
   * Récupère les catégories disponibles
   */
  async getCategories(): Promise<Array<{
    id: string;
    name: string;
    count: number;
    value: number;
  }>> {
    try {
      const response = await apiClient.get(`${this.baseUrl}/categories`);
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la récupération des catégories:', error);
      throw error;
    }
  }

  /**
   * Récupère les unités disponibles
   */
  async getUnits(): Promise<Array<{
    id: string;
    name: string;
    symbol: string;
  }>> {
    try {
      const response = await apiClient.get(`${this.baseUrl}/units`);
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la récupération des unités:', error);
      throw error;
    }
  }
}

export const stocksService = new StocksService();

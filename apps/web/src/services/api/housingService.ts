/**
 * FICHIER: apps/web/src/services/api/housingService.ts
 * SERVICE: HousingService - Service pour la gestion des logements
 *
 * DESCRIPTION:
 * Service pour la gestion des logements universitaires
 * Gestion des cités, chambres, résidents et maintenance
 * Support multi-tenant avec permissions granulaires
 *
 * FONCTIONNALITÉS:
 * - Gestion des cités universitaires
 * - Attribution des chambres aux étudiants
 * - Suivi des résidents et paiements
 * - Gestion de la maintenance
 * - Rapports d'occupation et revenus
 *
 * AUTEUR: Équipe CROU
 * DATE: Décembre 2024
 */

import { apiClient } from './apiClient';

// Types pour les cités universitaires
export interface HousingComplex {
  id: string;
  name: string;
  address: string;
  description?: string;
  totalRooms: number;
  availableRooms: number;
  occupiedRooms: number;
  maintenanceRooms: number;
  status: 'active' | 'inactive' | 'maintenance';
  monthlyRent: number;
  tenantId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateHousingComplexRequest {
  name: string;
  address: string;
  description?: string;
  totalRooms: number;
  monthlyRent: number;
}

export interface UpdateHousingComplexRequest {
  name?: string;
  address?: string;
  description?: string;
  totalRooms?: number;
  monthlyRent?: number;
  status?: 'active' | 'inactive' | 'maintenance';
}

// Types pour les chambres
export interface Room {
  id: string;
  number: string;
  complexId: string;
  type: 'single' | 'double' | 'triple' | 'quadruple';
  capacity: number;
  currentOccupancy: number;
  status: 'available' | 'occupied' | 'maintenance' | 'reserved';
  monthlyRent: number;
  amenities: string[];
  tenantId: string;
  createdAt: Date;
  updatedAt: Date;
  complex?: HousingComplex;
  residents?: Resident[];
}

export interface CreateRoomRequest {
  number: string;
  complexId: string;
  type: 'single' | 'double' | 'triple' | 'quadruple';
  capacity: number;
  monthlyRent: number;
  amenities?: string[];
}

export interface UpdateRoomRequest {
  number?: string;
  type?: 'single' | 'double' | 'triple' | 'quadruple';
  capacity?: number;
  monthlyRent?: number;
  amenities?: string[];
  status?: 'available' | 'occupied' | 'maintenance' | 'reserved';
}

// Types pour les résidents
export interface Resident {
  id: string;
  studentId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  roomId: string;
  checkInDate: Date;
  checkOutDate?: Date;
  monthlyRent: number;
  paymentStatus: 'current' | 'overdue' | 'paid';
  lastPaymentDate?: Date;
  nextPaymentDate: Date;
  status: 'active' | 'inactive' | 'graduated';
  tenantId: string;
  createdAt: Date;
  updatedAt: Date;
  room?: Room;
}

export interface CreateResidentRequest {
  studentId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  roomId: string;
  checkInDate: Date;
  monthlyRent: number;
}

export interface UpdateResidentRequest {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  roomId?: string;
  monthlyRent?: number;
  paymentStatus?: 'current' | 'overdue' | 'paid';
  status?: 'active' | 'inactive' | 'graduated';
}

// Types pour la maintenance
export interface MaintenanceRequest {
  id: string;
  roomId: string;
  complexId: string;
  type: 'repair' | 'cleaning' | 'renovation' | 'inspection';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  description: string;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  assignedTo?: string;
  estimatedCost?: number;
  actualCost?: number;
  scheduledDate?: Date;
  completedDate?: Date;
  tenantId: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  room?: Room;
  complex?: HousingComplex;
}

export interface CreateMaintenanceRequest {
  roomId: string;
  complexId: string;
  type: 'repair' | 'cleaning' | 'renovation' | 'inspection';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  description: string;
  estimatedCost?: number;
  scheduledDate?: Date;
}

export interface UpdateMaintenanceRequest {
  type?: 'repair' | 'cleaning' | 'renovation' | 'inspection';
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  description?: string;
  status?: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  assignedTo?: string;
  estimatedCost?: number;
  actualCost?: number;
  scheduledDate?: Date;
  completedDate?: Date;
}

// Types pour les paiements
export interface Payment {
  id: string;
  residentId: string;
  amount: number;
  type: 'rent' | 'deposit' | 'penalty' | 'refund';
  status: 'pending' | 'completed' | 'failed' | 'cancelled';
  paymentMethod: 'cash' | 'bank_transfer' | 'mobile_money' | 'check';
  reference?: string;
  paidAt?: Date;
  dueDate: Date;
  tenantId: string;
  createdAt: Date;
  updatedAt: Date;
  resident?: Resident;
}

export interface CreatePaymentRequest {
  residentId: string;
  amount: number;
  type: 'rent' | 'deposit' | 'penalty' | 'refund';
  paymentMethod: 'cash' | 'bank_transfer' | 'mobile_money' | 'check';
  reference?: string;
  dueDate: Date;
}

// Types pour les métriques
export interface HousingMetrics {
  totalComplexes: number;
  totalRooms: number;
  availableRooms: number;
  occupiedRooms: number;
  maintenanceRooms: number;
  occupancyRate: number;
  totalResidents: number;
  monthlyRevenue: number;
  pendingMaintenance: number;
  overduePayments: number;
  topComplexes: Array<{
    id: string;
    name: string;
    occupancyRate: number;
    revenue: number;
  }>;
  recentCheckIns: Resident[];
  recentCheckOuts: Resident[];
}

class HousingService {
  private baseUrl = '/housing';

  // === CITÉS UNIVERSITAIRES ===

  /**
   * Récupère la liste des cités universitaires
   */
  async getComplexes(params?: {
    page?: number;
    limit?: number;
    status?: string;
    search?: string;
    tenantId?: string;
  }): Promise<{
    complexes: HousingComplex[];
    total: number;
    page: number;
    limit: number;
  }> {
    try {
      const queryParams = new URLSearchParams();
      if (params?.page) queryParams.append('page', params.page.toString());
      if (params?.limit) queryParams.append('limit', params.limit.toString());
      if (params?.status) queryParams.append('status', params.status);
      if (params?.search) queryParams.append('search', params.search);
      if (params?.tenantId) queryParams.append('tenantId', params.tenantId);

      const response = await apiClient.get(`${this.baseUrl}/complexes?${queryParams.toString()}`);
      
      // Mapper les champs français du backend vers l'interface TypeScript
      const data = response.data;
      if (data.complexes) {
        data.complexes = data.complexes.map((complex: any) => ({
          ...complex,
          name: complex.name || complex.nom,
          address: complex.address || complex.adresse,
        }));
      }
      
      return data;
    } catch (error) {
      console.error('Erreur lors de la récupération des cités:', error);
      throw error;
    }
  }

  /**
   * Récupère une cité par ID
   */
  async getComplex(id: string): Promise<HousingComplex> {
    try {
      const response = await apiClient.get(`${this.baseUrl}/complexes/${id}`);
      const complex = response.data;
      
      // Mapper les champs français du backend
      return {
        ...complex,
        name: complex.name || complex.nom,
        address: complex.address || complex.adresse,
      };
    } catch (error) {
      console.error('Erreur lors de la récupération de la cité:', error);
      throw error;
    }
  }

  /**
   * Crée une nouvelle cité
   */
  async createComplex(data: CreateHousingComplexRequest): Promise<HousingComplex> {
    try {
      const response = await apiClient.post(`${this.baseUrl}/complexes`, data);
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la création de la cité:', error);
      throw error;
    }
  }

  /**
   * Met à jour une cité
   */
  async updateComplex(id: string, data: UpdateHousingComplexRequest): Promise<HousingComplex> {
    try {
      const response = await apiClient.put(`${this.baseUrl}/complexes/${id}`, data);
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la mise à jour de la cité:', error);
      throw error;
    }
  }

  /**
   * Supprime une cité
   */
  async deleteComplex(id: string): Promise<void> {
    try {
      await apiClient.delete(`${this.baseUrl}/complexes/${id}`);
    } catch (error) {
      console.error('Erreur lors de la suppression de la cité:', error);
      throw error;
    }
  }

  // === CHAMBRES ===

  /**
   * Récupère la liste des chambres
   */
  async getRooms(params?: {
    page?: number;
    limit?: number;
    complexId?: string;
    type?: string;
    status?: string;
    search?: string;
    tenantId?: string;
  }): Promise<{
    rooms: Room[];
    total: number;
    page: number;
    limit: number;
  }> {
    try {
      const queryParams = new URLSearchParams();
      if (params?.page) queryParams.append('page', params.page.toString());
      if (params?.limit) queryParams.append('limit', params.limit.toString());
      if (params?.complexId) queryParams.append('complexId', params.complexId);
      if (params?.type) queryParams.append('type', params.type);
      if (params?.status) queryParams.append('status', params.status);
      if (params?.search) queryParams.append('search', params.search);
      if (params?.tenantId) queryParams.append('tenantId', params.tenantId);

      const response = await apiClient.get(`${this.baseUrl}/rooms?${queryParams.toString()}`);
      
      // Mapper les champs français du backend vers l'interface TypeScript
      const data = response.data;
      if (data.rooms) {
        data.rooms = data.rooms.map((room: any) => ({
          ...room,
          number: room.number || room.numero,
          complexId: room.complexId || room.housingId,
          capacity: room.capacity || room.capacite,
          currentOccupancy: room.currentOccupancy || room.occupation || 0,
          monthlyRent: room.monthlyRent || room.loyerMensuel,
          amenities: room.amenities || room.equipements || [],
        }));
      }
      
      return data;
    } catch (error) {
      console.error('Erreur lors de la récupération des chambres:', error);
      throw error;
    }
  }

  /**
   * Crée une nouvelle chambre
   */
  async createRoom(data: CreateRoomRequest): Promise<Room> {
    try {
      const response = await apiClient.post(`${this.baseUrl}/rooms`, data);
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la création de la chambre:', error);
      throw error;
    }
  }

  /**
   * Met à jour une chambre
   */
  async updateRoom(id: string, data: UpdateRoomRequest): Promise<Room> {
    try {
      const response = await apiClient.put(`${this.baseUrl}/rooms/${id}`, data);
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la mise à jour de la chambre:', error);
      throw error;
    }
  }

  /**
   * Supprime une chambre
   */
  async deleteRoom(id: string): Promise<void> {
    try {
      await apiClient.delete(`${this.baseUrl}/rooms/${id}`);
    } catch (error) {
      console.error('Erreur lors de la suppression de la chambre:', error);
      throw error;
    }
  }

  // === RÉSIDENTS ===

  /**
   * Récupère la liste des résidents
   */
  async getResidents(params?: {
    page?: number;
    limit?: number;
    roomId?: string;
    complexId?: string;
    status?: string;
    paymentStatus?: string;
    search?: string;
    tenantId?: string;
  }): Promise<{
    residents: Resident[];
    total: number;
    page: number;
    limit: number;
  }> {
    try {
      const queryParams = new URLSearchParams();
      if (params?.page) queryParams.append('page', params.page.toString());
      if (params?.limit) queryParams.append('limit', params.limit.toString());
      if (params?.roomId) queryParams.append('roomId', params.roomId);
      if (params?.complexId) queryParams.append('complexId', params.complexId);
      if (params?.status) queryParams.append('status', params.status);
      if (params?.paymentStatus) queryParams.append('paymentStatus', params.paymentStatus);
      if (params?.search) queryParams.append('search', params.search);
      if (params?.tenantId) queryParams.append('tenantId', params.tenantId);

      const response = await apiClient.get(`${this.baseUrl}/residents?${queryParams.toString()}`);
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la récupération des résidents:', error);
      throw error;
    }
  }

  /**
   * Crée un nouveau résident
   */
  async createResident(data: CreateResidentRequest): Promise<Resident> {
    try {
      const response = await apiClient.post(`${this.baseUrl}/residents`, data);
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la création du résident:', error);
      throw error;
    }
  }

  /**
   * Met à jour un résident
   */
  async updateResident(id: string, data: UpdateResidentRequest): Promise<Resident> {
    try {
      const response = await apiClient.put(`${this.baseUrl}/residents/${id}`, data);
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la mise à jour du résident:', error);
      throw error;
    }
  }

  /**
   * Supprime un résident
   */
  async deleteResident(id: string): Promise<void> {
    try {
      await apiClient.delete(`${this.baseUrl}/residents/${id}`);
    } catch (error) {
      console.error('Erreur lors de la suppression du résident:', error);
      throw error;
    }
  }

  // === MAINTENANCE ===

  /**
   * Récupère la liste des demandes de maintenance
   */
  async getMaintenanceRequests(params?: {
    page?: number;
    limit?: number;
    roomId?: string;
    complexId?: string;
    type?: string;
    priority?: string;
    status?: string;
    tenantId?: string;
  }): Promise<{
    requests: MaintenanceRequest[];
    total: number;
    page: number;
    limit: number;
  }> {
    try {
      const queryParams = new URLSearchParams();
      if (params?.page) queryParams.append('page', params.page.toString());
      if (params?.limit) queryParams.append('limit', params.limit.toString());
      if (params?.roomId) queryParams.append('roomId', params.roomId);
      if (params?.complexId) queryParams.append('complexId', params.complexId);
      if (params?.type) queryParams.append('type', params.type);
      if (params?.priority) queryParams.append('priority', params.priority);
      if (params?.status) queryParams.append('status', params.status);
      if (params?.tenantId) queryParams.append('tenantId', params.tenantId);

      const response = await apiClient.get(`${this.baseUrl}/maintenance?${queryParams.toString()}`);
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la récupération des demandes de maintenance:', error);
      throw error;
    }
  }

  /**
   * Crée une nouvelle demande de maintenance
   */
  async createMaintenanceRequest(data: CreateMaintenanceRequest): Promise<MaintenanceRequest> {
    try {
      const response = await apiClient.post(`${this.baseUrl}/maintenance`, data);
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la création de la demande de maintenance:', error);
      throw error;
    }
  }

  /**
   * Met à jour une demande de maintenance
   */
  async updateMaintenanceRequest(id: string, data: UpdateMaintenanceRequest): Promise<MaintenanceRequest> {
    try {
      const response = await apiClient.put(`${this.baseUrl}/maintenance/${id}`, data);
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la mise à jour de la demande de maintenance:', error);
      throw error;
    }
  }

  // === PAIEMENTS ===

  /**
   * Récupère la liste des paiements
   */
  async getPayments(params?: {
    page?: number;
    limit?: number;
    residentId?: string;
    type?: string;
    status?: string;
    dateFrom?: Date;
    dateTo?: Date;
    tenantId?: string;
  }): Promise<{
    payments: Payment[];
    total: number;
    page: number;
    limit: number;
  }> {
    try {
      const queryParams = new URLSearchParams();
      if (params?.page) queryParams.append('page', params.page.toString());
      if (params?.limit) queryParams.append('limit', params.limit.toString());
      if (params?.residentId) queryParams.append('residentId', params.residentId);
      if (params?.type) queryParams.append('type', params.type);
      if (params?.status) queryParams.append('status', params.status);
      if (params?.dateFrom) queryParams.append('dateFrom', params.dateFrom.toISOString());
      if (params?.dateTo) queryParams.append('dateTo', params.dateTo.toISOString());
      if (params?.tenantId) queryParams.append('tenantId', params.tenantId);

      const response = await apiClient.get(`${this.baseUrl}/payments?${queryParams.toString()}`);
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la récupération des paiements:', error);
      throw error;
    }
  }

  /**
   * Crée un nouveau paiement
   */
  async createPayment(data: CreatePaymentRequest): Promise<Payment> {
    try {
      const response = await apiClient.post(`${this.baseUrl}/payments`, data);
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la création du paiement:', error);
      throw error;
    }
  }

  // === MÉTRIQUES ===

  /**
   * Récupère les métriques de logement
   */
  async getMetrics(tenantId?: string): Promise<HousingMetrics> {
    try {
      const params = tenantId ? `?tenantId=${tenantId}` : '';
      const response = await apiClient.get(`${this.baseUrl}/metrics${params}`);
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la récupération des métriques de logement:', error);
      throw error;
    }
  }

  /**
   * Récupère les types de chambres disponibles
   */
  async getRoomTypes(): Promise<Array<{
    id: string;
    name: string;
    capacity: number;
    description: string;
  }>> {
    try {
      const response = await apiClient.get(`${this.baseUrl}/room-types`);
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la récupération des types de chambres:', error);
      throw error;
    }
  }

  /**
   * Récupère les équipements disponibles
   */
  async getAmenities(): Promise<Array<{
    id: string;
    name: string;
    category: string;
  }>> {
    try {
      const response = await apiClient.get(`${this.baseUrl}/amenities`);
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la récupération des équipements:', error);
      throw error;
    }
  }
}

export const housingService = new HousingService();

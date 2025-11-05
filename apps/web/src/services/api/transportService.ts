/**
 * FICHIER: apps/web/src/services/api/transportService.ts
 * SERVICE: TransportService - Service pour la gestion du transport
 *
 * DESCRIPTION:
 * Service pour la gestion du transport étudiant
 * Gestion des véhicules, chauffeurs, trajets et maintenance
 * Support multi-tenant avec permissions granulaires
 *
 * FONCTIONNALITÉS:
 * - Gestion du parc de véhicules
 * - Gestion des chauffeurs
 * - Planification des trajets
 * - Suivi de la maintenance
 * - Optimisation des routes
 * - Rapports de performance
 *
 * AUTEUR: Équipe CROU
 * DATE: Décembre 2024
 */

import { apiClient } from './apiClient';

// Types pour les véhicules
export interface Vehicle {
  id: string;
  plateNumber: string;
  make: string;
  model: string;
  year: number;
  type: 'bus' | 'minibus' | 'van' | 'car';
  capacity: number;
  fuelType: 'gasoline' | 'diesel' | 'electric' | 'hybrid';
  status: 'active' | 'maintenance' | 'inactive' | 'retired';
  mileage: number;
  lastMaintenanceDate?: Date;
  nextMaintenanceDate?: Date;
  insuranceExpiry?: Date;
  registrationExpiry?: Date;
  tenantId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateVehicleRequest {
  plateNumber: string;
  make: string;
  model: string;
  year: number;
  type: 'bus' | 'minibus' | 'van' | 'car';
  capacity: number;
  fuelType: 'gasoline' | 'diesel' | 'electric' | 'hybrid';
  mileage?: number;
  insuranceExpiry?: Date;
  registrationExpiry?: Date;
}

export interface UpdateVehicleRequest {
  plateNumber?: string;
  make?: string;
  model?: string;
  year?: number;
  type?: 'bus' | 'minibus' | 'van' | 'car';
  capacity?: number;
  fuelType?: 'gasoline' | 'diesel' | 'electric' | 'hybrid';
  status?: 'active' | 'maintenance' | 'inactive' | 'retired';
  mileage?: number;
  insuranceExpiry?: Date;
  registrationExpiry?: Date;
}

// Types pour les chauffeurs
export interface Driver {
  id: string;
  employeeId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  licenseNumber: string;
  licenseType: 'A' | 'B' | 'C' | 'D' | 'E';
  licenseExpiry: Date;
  status: 'active' | 'inactive' | 'suspended';
  assignedVehicleId?: string;
  hireDate: Date;
  tenantId: string;
  createdAt: Date;
  updatedAt: Date;
  assignedVehicle?: Vehicle;
}

export interface CreateDriverRequest {
  employeeId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  licenseNumber: string;
  licenseType: 'A' | 'B' | 'C' | 'D' | 'E';
  licenseExpiry: Date;
  hireDate: Date;
}

export interface UpdateDriverRequest {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  licenseNumber?: string;
  licenseType?: 'A' | 'B' | 'C' | 'D' | 'E';
  licenseExpiry?: Date;
  status?: 'active' | 'inactive' | 'suspended';
  assignedVehicleId?: string;
}

// Types pour les trajets
export interface Route {
  id: string;
  name: string;
  description?: string;
  startLocation: string;
  endLocation: string;
  distance: number; // en kilomètres
  estimatedDuration: number; // en minutes
  stops: Array<{
    id: string;
    name: string;
    address: string;
    order: number;
    latitude?: number;
    longitude?: number;
  }>;
  status: 'active' | 'inactive' | 'maintenance';
  tenantId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateRouteRequest {
  name: string;
  description?: string;
  startLocation: string;
  endLocation: string;
  distance: number;
  estimatedDuration: number;
  stops: Array<{
    name: string;
    address: string;
    order: number;
    latitude?: number;
    longitude?: number;
  }>;
}

export interface UpdateRouteRequest {
  name?: string;
  description?: string;
  startLocation?: string;
  endLocation?: string;
  distance?: number;
  estimatedDuration?: number;
  stops?: Array<{
    name: string;
    address: string;
    order: number;
    latitude?: number;
    longitude?: number;
  }>;
  status?: 'active' | 'inactive' | 'maintenance';
}

// Types pour les trajets programmés
export interface ScheduledTrip {
  id: string;
  routeId: string;
  vehicleId: string;
  driverId: string;
  scheduledDate: Date;
  startTime: string;
  endTime: string;
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  actualStartTime?: Date;
  actualEndTime?: Date;
  passengersCount: number;
  notes?: string;
  tenantId: string;
  createdAt: Date;
  updatedAt: Date;
  route?: Route;
  vehicle?: Vehicle;
  driver?: Driver;
}

export interface CreateScheduledTripRequest {
  routeId: string;
  vehicleId: string;
  driverId: string;
  scheduledDate: Date;
  startTime: string;
  endTime: string;
  passengersCount?: number;
  notes?: string;
}

export interface UpdateScheduledTripRequest {
  routeId?: string;
  vehicleId?: string;
  driverId?: string;
  scheduledDate?: Date;
  startTime?: string;
  endTime?: string;
  status?: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  actualStartTime?: Date;
  actualEndTime?: Date;
  passengersCount?: number;
  notes?: string;
}

// Types pour la maintenance
export interface MaintenanceRecord {
  id: string;
  vehicleId: string;
  type: 'preventive' | 'corrective' | 'inspection' | 'repair';
  description: string;
  cost: number;
  mileage: number;
  performedBy: string;
  performedAt: Date;
  nextMaintenanceDate?: Date;
  status: 'completed' | 'in_progress' | 'scheduled';
  tenantId: string;
  createdAt: Date;
  updatedAt: Date;
  vehicle?: Vehicle;
}

export interface CreateMaintenanceRecordRequest {
  vehicleId: string;
  type: 'preventive' | 'corrective' | 'inspection' | 'repair';
  description: string;
  cost: number;
  mileage: number;
  performedBy: string;
  performedAt: Date;
  nextMaintenanceDate?: Date;
}

export interface UpdateMaintenanceRecordRequest {
  type?: 'preventive' | 'corrective' | 'inspection' | 'repair';
  description?: string;
  cost?: number;
  mileage?: number;
  performedBy?: string;
  performedAt?: Date;
  nextMaintenanceDate?: Date;
  status?: 'completed' | 'in_progress' | 'scheduled';
}

// Types pour les métriques
export interface TransportMetrics {
  totalVehicles: number;
  activeVehicles: number;
  maintenanceVehicles: number;
  totalDrivers: number;
  activeDrivers: number;
  totalRoutes: number;
  activeRoutes: number;
  totalTrips: number;
  completedTrips: number;
  totalMileage: number;
  fuelConsumption: number;
  averageEfficiency: number;
  maintenanceCost: number;
  topRoutes: Array<{
    id: string;
    name: string;
    tripCount: number;
    passengerCount: number;
  }>;
  recentTrips: ScheduledTrip[];
  maintenanceAlerts: Array<{
    id: string;
    vehicleId: string;
    type: 'maintenance_due' | 'insurance_expiry' | 'registration_expiry';
    message: string;
    dueDate: Date;
  }>;
}

class TransportService {
  private baseUrl = '/transport';

  // === VÉHICULES ===

  /**
   * Récupère la liste des véhicules
   */
  async getVehicles(params?: {
    page?: number;
    limit?: number;
    type?: string;
    status?: string;
    search?: string;
  }): Promise<{
    vehicles: Vehicle[];
    total: number;
    page: number;
    limit: number;
  }> {
    try {
      const queryParams = new URLSearchParams();
      if (params?.page) queryParams.append('page', params.page.toString());
      if (params?.limit) queryParams.append('limit', params.limit.toString());
      if (params?.type) queryParams.append('type', params.type);
      if (params?.status) queryParams.append('status', params.status);
      if (params?.search) queryParams.append('search', params.search);

      const response = await apiClient.get(`${this.baseUrl}/vehicles?${queryParams.toString()}`);
      return response.data.data;
    } catch (error) {
      console.error('Erreur lors de la récupération des véhicules:', error);
      throw error;
    }
  }

  // === USAGES ===

  /**
   * Récupère la liste des usages de véhicules
   */
  async getUsages(params?: {
    page?: number;
    limit?: number;
    vehicleId?: string;
    conducteur?: string;
    type?: string;
    tenantId?: string;
  }): Promise<{
    usages: any[];
    total: number;
    page: number;
    limit: number;
  }> {
    try {
      const queryParams = new URLSearchParams();
      if (params?.page) queryParams.append('page', params.page.toString());
      if (params?.limit) queryParams.append('limit', params.limit.toString());
      if (params?.vehicleId) queryParams.append('vehicleId', params.vehicleId);
      if (params?.conducteur) queryParams.append('conducteur', params.conducteur);
      if (params?.type) queryParams.append('type', params.type);
      if (params?.tenantId) queryParams.append('tenantId', params.tenantId);

      const response = await apiClient.get(`${this.baseUrl}/usages?${queryParams.toString()}`);
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la récupération des usages:', error);
      throw error;
    }
  }

  /**
   * Crée un nouvel usage de véhicule
   */
  async createUsage(data: any): Promise<any> {
    try {
      const response = await apiClient.post(`${this.baseUrl}/usages`, data);
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la création de l\'usage:', error);
      throw error;
    }
  }

  /**
   * Met à jour un usage de véhicule
   */
  async updateUsage(id: string, data: any): Promise<any> {
    try {
      const response = await apiClient.put(`${this.baseUrl}/usages/${id}`, data);
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la mise à jour de l\'usage:', error);
      throw error;
    }
  }

  /**
   * Supprime un usage de véhicule
   */
  async deleteUsage(id: string): Promise<void> {
    try {
      await apiClient.delete(`${this.baseUrl}/usages/${id}`);
    } catch (error) {
      console.error('Erreur lors de la suppression de l\'usage:', error);
      throw error;
    }
  }

  // === MAINTENANCE ===

  /**
   * Récupère la liste des maintenances de véhicules
   */
  async getMaintenances(params?: {
    page?: number;
    limit?: number;
    vehicleId?: string;
    type?: string;
    status?: string;
    tenantId?: string;
  }): Promise<{
    maintenances: any[];
    total: number;
    page: number;
    limit: number;
  }> {
    try {
      const queryParams = new URLSearchParams();
      if (params?.page) queryParams.append('page', params.page.toString());
      if (params?.limit) queryParams.append('limit', params.limit.toString());
      if (params?.vehicleId) queryParams.append('vehicleId', params.vehicleId);
      if (params?.type) queryParams.append('type', params.type);
      if (params?.status) queryParams.append('status', params.status);
      if (params?.tenantId) queryParams.append('tenantId', params.tenantId);

      const response = await apiClient.get(`${this.baseUrl}/maintenances?${queryParams.toString()}`);
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la récupération des maintenances:', error);
      throw error;
    }
  }

  /**
   * Crée une nouvelle maintenance de véhicule
   */
  async createMaintenance(data: any): Promise<any> {
    try {
      const response = await apiClient.post(`${this.baseUrl}/maintenances`, data);
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la création de la maintenance:', error);
      throw error;
    }
  }

  /**
   * Met à jour une maintenance de véhicule
   */
  async updateMaintenance(id: string, data: any): Promise<any> {
    try {
      const response = await apiClient.put(`${this.baseUrl}/maintenances/${id}`, data);
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la mise à jour de la maintenance:', error);
      throw error;
    }
  }

  /**
   * Supprime une maintenance de véhicule
   */
  async deleteMaintenance(id: string): Promise<void> {
    try {
      await apiClient.delete(`${this.baseUrl}/maintenances/${id}`);
    } catch (error) {
      console.error('Erreur lors de la suppression de la maintenance:', error);
      throw error;
    }
  }

  /**
   * Récupère un véhicule par ID
   */
  async getVehicle(id: string): Promise<Vehicle> {
    try {
      const response = await apiClient.get(`${this.baseUrl}/vehicles/${id}`);
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la récupération du véhicule:', error);
      throw error;
    }
  }

  /**
   * Crée un nouveau véhicule
   */
  async createVehicle(data: CreateVehicleRequest): Promise<Vehicle> {
    try {
      const response = await apiClient.post(`${this.baseUrl}/vehicles`, data);
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la création du véhicule:', error);
      throw error;
    }
  }

  /**
   * Met à jour un véhicule
   */
  async updateVehicle(id: string, data: UpdateVehicleRequest): Promise<Vehicle> {
    try {
      const response = await apiClient.put(`${this.baseUrl}/vehicles/${id}`, data);
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la mise à jour du véhicule:', error);
      throw error;
    }
  }

  /**
   * Supprime un véhicule
   */
  async deleteVehicle(id: string): Promise<void> {
    try {
      await apiClient.delete(`${this.baseUrl}/vehicles/${id}`);
    } catch (error) {
      console.error('Erreur lors de la suppression du véhicule:', error);
      throw error;
    }
  }

  // === CHAUFFEURS ===

  /**
   * Récupère la liste des chauffeurs
   */
  async getDrivers(params?: {
    page?: number;
    limit?: number;
    status?: string;
    licenseType?: string;
    search?: string;
  }): Promise<{
    drivers: Driver[];
    total: number;
    page: number;
    limit: number;
  }> {
    try {
      const queryParams = new URLSearchParams();
      if (params?.page) queryParams.append('page', params.page.toString());
      if (params?.limit) queryParams.append('limit', params.limit.toString());
      if (params?.status) queryParams.append('status', params.status);
      if (params?.licenseType) queryParams.append('licenseType', params.licenseType);
      if (params?.search) queryParams.append('search', params.search);

      const response = await apiClient.get(`${this.baseUrl}/drivers?${queryParams.toString()}`);
      return response.data.data;
    } catch (error) {
      console.error('Erreur lors de la récupération des chauffeurs:', error);
      throw error;
    }
  }

  /**
   * Récupère un chauffeur par ID
   */
  async getDriver(id: string): Promise<Driver> {
    try {
      const response = await apiClient.get(`${this.baseUrl}/drivers/${id}`);
      return response.data.data;
    } catch (error) {
      console.error('Erreur lors de la récupération du chauffeur:', error);
      throw error;
    }
  }

  /**
   * Crée un nouveau chauffeur
   */
  async createDriver(data: CreateDriverRequest): Promise<Driver> {
    try {
      const response = await apiClient.post(`${this.baseUrl}/drivers`, data);
      return response.data.data;
    } catch (error) {
      console.error('Erreur lors de la création du chauffeur:', error);
      throw error;
    }
  }

  /**
   * Met à jour un chauffeur
   */
  async updateDriver(id: string, data: UpdateDriverRequest): Promise<Driver> {
    try {
      const response = await apiClient.put(`${this.baseUrl}/drivers/${id}`, data);
      return response.data.data;
    } catch (error) {
      console.error('Erreur lors de la mise à jour du chauffeur:', error);
      throw error;
    }
  }

  /**
   * Supprime un chauffeur
   */
  async deleteDriver(id: string): Promise<void> {
    try {
      await apiClient.delete(`${this.baseUrl}/drivers/${id}`);
    } catch (error) {
      console.error('Erreur lors de la suppression du chauffeur:', error);
      throw error;
    }
  }

  /**
   * Affecte un véhicule à un chauffeur
   */
  async assignVehicleToDriver(driverId: string, vehicleId: string): Promise<Driver> {
    try {
      const response = await apiClient.post(`${this.baseUrl}/drivers/${driverId}/assign-vehicle`, {
        vehicleId
      });
      return response.data.data;
    } catch (error) {
      console.error('Erreur lors de l\'affectation du véhicule:', error);
      throw error;
    }
  }

  /**
   * Retire l'affectation d'un véhicule à un chauffeur
   */
  async unassignVehicleFromDriver(driverId: string): Promise<Driver> {
    try {
      const response = await apiClient.post(`${this.baseUrl}/drivers/${driverId}/unassign-vehicle`);
      return response.data.data;
    } catch (error) {
      console.error('Erreur lors du retrait de l\'affectation:', error);
      throw error;
    }
  }

  /**
   * Récupère les chauffeurs disponibles
   */
  async getAvailableDrivers(): Promise<Driver[]> {
    try {
      const response = await apiClient.get(`${this.baseUrl}/drivers/available`);
      return response.data.data;
    } catch (error) {
      console.error('Erreur lors de la récupération des chauffeurs disponibles:', error);
      throw error;
    }
  }

  /**
   * Récupère les alertes chauffeurs (permis expirés, visites médicales)
   */
  async getDriverAlerts(): Promise<any> {
    try {
      const response = await apiClient.get(`${this.baseUrl}/drivers/alerts`);
      return response.data.data;
    } catch (error) {
      console.error('Erreur lors de la récupération des alertes:', error);
      throw error;
    }
  }

  /**
   * Récupère les statistiques des chauffeurs
   */
  async getDriverStatistics(): Promise<any> {
    try {
      const response = await apiClient.get(`${this.baseUrl}/drivers/statistics`);
      return response.data.data;
    } catch (error) {
      console.error('Erreur lors de la récupération des statistiques:', error);
      throw error;
    }
  }

  // === ROUTES ===

  /**
   * Récupère la liste des routes
   */
  async getRoutes(params?: {
    page?: number;
    limit?: number;
    status?: string;
    type?: string;
    search?: string;
  }): Promise<{
    routes: Route[];
    total: number;
    page: number;
    limit: number;
  }> {
    try {
      const queryParams = new URLSearchParams();
      if (params?.page) queryParams.append('page', params.page.toString());
      if (params?.limit) queryParams.append('limit', params.limit.toString());
      if (params?.status) queryParams.append('status', params.status);
      if (params?.type) queryParams.append('type', params.type);
      if (params?.search) queryParams.append('search', params.search);

      const response = await apiClient.get(`${this.baseUrl}/routes?${queryParams.toString()}`);
      return response.data.data;
    } catch (error) {
      console.error('Erreur lors de la récupération des routes:', error);
      throw error;
    }
  }

  /**
   * Récupère une route par ID
   */
  async getRoute(id: string): Promise<Route> {
    try {
      const response = await apiClient.get(`${this.baseUrl}/routes/${id}`);
      return response.data.data;
    } catch (error) {
      console.error('Erreur lors de la récupération de la route:', error);
      throw error;
    }
  }

  /**
   * Crée une nouvelle route
   */
  async createRoute(data: CreateRouteRequest): Promise<Route> {
    try {
      const response = await apiClient.post(`${this.baseUrl}/routes`, data);
      return response.data.data;
    } catch (error) {
      console.error('Erreur lors de la création de la route:', error);
      throw error;
    }
  }

  /**
   * Met à jour une route
   */
  async updateRoute(id: string, data: UpdateRouteRequest): Promise<Route> {
    try {
      const response = await apiClient.put(`${this.baseUrl}/routes/${id}`, data);
      return response.data.data;
    } catch (error) {
      console.error('Erreur lors de la mise à jour de la route:', error);
      throw error;
    }
  }

  /**
   * Supprime une route
   */
  async deleteRoute(id: string): Promise<void> {
    try {
      await apiClient.delete(`${this.baseUrl}/routes/${id}`);
    } catch (error) {
      console.error('Erreur lors de la suppression de la route:', error);
      throw error;
    }
  }

  /**
   * Récupère les routes actives
   */
  async getActiveRoutes(): Promise<Route[]> {
    try {
      const response = await apiClient.get(`${this.baseUrl}/routes/active`);
      return response.data.data;
    } catch (error) {
      console.error('Erreur lors de la récupération des routes actives:', error);
      throw error;
    }
  }

  // === TRAJETS PROGRAMMÉS ===

  /**
   * Récupère la liste des trajets programmés
   */
  async getScheduledTrips(params?: {
    page?: number;
    limit?: number;
    status?: string;
    routeId?: string;
    vehicleId?: string;
    driverId?: string;
    dateFrom?: Date;
    dateTo?: Date;
  }): Promise<{
    trips: ScheduledTrip[];
    total: number;
    page: number;
    limit: number;
  }> {
    try {
      const queryParams = new URLSearchParams();
      if (params?.page) queryParams.append('page', params.page.toString());
      if (params?.limit) queryParams.append('limit', params.limit.toString());
      if (params?.status) queryParams.append('status', params.status);
      if (params?.routeId) queryParams.append('routeId', params.routeId);
      if (params?.vehicleId) queryParams.append('vehicleId', params.vehicleId);
      if (params?.driverId) queryParams.append('driverId', params.driverId);
      if (params?.dateFrom) queryParams.append('dateFrom', params.dateFrom.toISOString());
      if (params?.dateTo) queryParams.append('dateTo', params.dateTo.toISOString());

      const response = await apiClient.get(`${this.baseUrl}/scheduled-trips?${queryParams.toString()}`);
      return response.data.data;
    } catch (error) {
      console.error('Erreur lors de la récupération des trajets:', error);
      throw error;
    }
  }

  /**
   * Récupère un trajet programmé par ID
   */
  async getScheduledTrip(id: string): Promise<ScheduledTrip> {
    try {
      const response = await apiClient.get(`${this.baseUrl}/scheduled-trips/${id}`);
      return response.data.data;
    } catch (error) {
      console.error('Erreur lors de la récupération du trajet:', error);
      throw error;
    }
  }

  /**
   * Crée un nouveau trajet programmé
   */
  async createScheduledTrip(data: CreateScheduledTripRequest): Promise<ScheduledTrip> {
    try {
      const response = await apiClient.post(`${this.baseUrl}/scheduled-trips`, data);
      return response.data.data;
    } catch (error) {
      console.error('Erreur lors de la création du trajet:', error);
      throw error;
    }
  }

  /**
   * Met à jour un trajet programmé
   */
  async updateScheduledTrip(id: string, data: UpdateScheduledTripRequest): Promise<ScheduledTrip> {
    try {
      const response = await apiClient.put(`${this.baseUrl}/scheduled-trips/${id}`, data);
      return response.data.data;
    } catch (error) {
      console.error('Erreur lors de la mise à jour du trajet:', error);
      throw error;
    }
  }

  /**
   * Supprime un trajet programmé
   */
  async deleteScheduledTrip(id: string): Promise<void> {
    try {
      await apiClient.delete(`${this.baseUrl}/scheduled-trips/${id}`);
    } catch (error) {
      console.error('Erreur lors de la suppression du trajet:', error);
      throw error;
    }
  }

  /**
   * Démarre un trajet programmé
   */
  async startScheduledTrip(id: string, startKilometers: number): Promise<ScheduledTrip> {
    try {
      const response = await apiClient.post(`${this.baseUrl}/scheduled-trips/${id}/start`, {
        startKilometers
      });
      return response.data.data;
    } catch (error) {
      console.error('Erreur lors du démarrage du trajet:', error);
      throw error;
    }
  }

  /**
   * Termine un trajet programmé
   */
  async completeScheduledTrip(id: string, data: {
    endKilometers: number;
    passengersCount?: number;
    fuelCost?: number;
    tollCost?: number;
    otherCosts?: number;
    revenue?: number;
    rating?: number;
    notes?: string;
  }): Promise<ScheduledTrip> {
    try {
      const response = await apiClient.post(`${this.baseUrl}/scheduled-trips/${id}/complete`, data);
      return response.data.data;
    } catch (error) {
      console.error('Erreur lors de la finalisation du trajet:', error);
      throw error;
    }
  }

  /**
   * Annule un trajet programmé
   */
  async cancelScheduledTrip(id: string, reason: string, details?: string): Promise<ScheduledTrip> {
    try {
      const response = await apiClient.post(`${this.baseUrl}/scheduled-trips/${id}/cancel`, {
        reason,
        details
      });
      return response.data.data;
    } catch (error) {
      console.error('Erreur lors de l\'annulation du trajet:', error);
      throw error;
    }
  }

  /**
   * Récupère les statistiques des trajets programmés
   */
  async getTripsStatistics(params?: {
    dateFrom?: Date;
    dateTo?: Date;
  }): Promise<any> {
    try {
      const queryParams = new URLSearchParams();
      if (params?.dateFrom) queryParams.append('dateFrom', params.dateFrom.toISOString());
      if (params?.dateTo) queryParams.append('dateTo', params.dateTo.toISOString());

      const response = await apiClient.get(`${this.baseUrl}/scheduled-trips/statistics?${queryParams.toString()}`);
      return response.data.data;
    } catch (error) {
      console.error('Erreur lors de la récupération des statistiques:', error);
      throw error;
    }
  }



  // === MÉTRIQUES ===

  /**
   * Récupère les métriques de transport
   */
  async getMetrics(tenantId?: string): Promise<TransportMetrics> {
    try {
      const params = tenantId ? `?tenantId=${tenantId}` : '';
      const response = await apiClient.get(`${this.baseUrl}/metrics${params}`);
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la récupération des métriques de transport:', error);
      throw error;
    }
  }

  /**
   * Récupère les types de véhicules disponibles
   */
  async getVehicleTypes(): Promise<Array<{
    id: string;
    name: string;
    capacity: number;
    description: string;
  }>> {
    try {
      const response = await apiClient.get(`${this.baseUrl}/vehicle-types`);
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la récupération des types de véhicules:', error);
      throw error;
    }
  }

  /**
   * Récupère les types de carburant disponibles
   */
  async getFuelTypes(): Promise<Array<{
    id: string;
    name: string;
    symbol: string;
  }>> {
    try {
      const response = await apiClient.get(`${this.baseUrl}/fuel-types`);
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la récupération des types de carburant:', error);
      throw error;
    }
  }

  /**
   * Récupère les types de permis disponibles
   */
  async getLicenseTypes(): Promise<Array<{
    id: string;
    name: string;
    description: string;
  }>> {
    try {
      const response = await apiClient.get(`${this.baseUrl}/license-types`);
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la récupération des types de permis:', error);
      throw error;
    }
  }
}

export const transportService = new TransportService();

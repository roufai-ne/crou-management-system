/**
 * FICHIER: apps/web/src/services/api/housingReportService.ts
 * SERVICE: HousingReportService - Service pour rapports et disponibilité
 *
 * DESCRIPTION:
 * Service API pour consulter disponibilité chambres et rapports occupation
 * Données temps réel et historiques
 *
 * FONCTIONNALITÉS:
 * - Disponibilité temps réel par genre/cité
 * - Statistiques agrégées
 * - Rapports annuels historiques
 * - Tendances mensuelles
 *
 * AUTEUR: Équipe CROU
 * DATE: Janvier 2025
 */

import { apiClient } from './apiClient';

// Types rapports
export interface RoomAvailability {
  roomId: string;
  roomNumber: string;
  housingId: string;
  housingName: string;
  genderRestriction: 'MIXTE' | 'HOMMES' | 'FEMMES';
  totalBeds: number;
  occupiedBeds: number;
  reservedBeds: number;
  availableBeds: number;
  occupancyRate: number;
  type: string;
  loyerMensuel: number;
}

export interface GenderStatistics {
  gender: 'MALE' | 'FEMALE';
  totalBeds: number;
  occupiedBeds: number;
  reservedBeds: number;
  availableBeds: number;
  roomCount: number;
  occupancyRate: number;
}

export interface OccupancyReport {
  id: string;
  year: number;
  academicYear: string;
  housingName: string;
  roomNumber: string;
  genderRestriction: string;
  totalBeds: number;
  occupiedBeds: number;
  availableBeds: number;
  occupancyRate: number;
  renewalCount: number;
  newAssignmentCount: number;
  onlineSubmissionsRate: number;
}

export interface GlobalStatistics {
  occupancy: {
    totalRooms: number;
    totalBeds: number;
    occupiedBeds: number;
    reservedBeds: number;
    availableBeds: number;
    globalOccupancyRate: number;
  };
  requests: {
    totalRequests12Months: number;
    onlineSubmissions: number;
    manualSubmissions: number;
    onlineSubmissionsRate: number;
    approvedCount: number;
    assignedCount: number;
  };
  trends: Array<{
    year: number;
    month: number;
    count: number;
  }>;
}

// Service API
export const housingReportService = {
  /**
   * Disponibilité chambres temps réel
   */
  async getAvailability(filters: {
    genderRestriction?: string;
    housingId?: string;
    minBeds?: number;
  } = {}): Promise<{ data: RoomAvailability[]; count: number; summary: any }> {
    const params = new URLSearchParams();
    if (filters.genderRestriction) params.append('genderRestriction', filters.genderRestriction);
    if (filters.housingId) params.append('housingId', filters.housingId);
    if (filters.minBeds) params.append('minBeds', filters.minBeds.toString());

    const response = await apiClient.get(`/housing/reports/availability?${params.toString()}`);
    return response.data;
  },

  /**
   * Statistiques agrégées par genre
   */
  async getAvailabilityByGender(): Promise<{ data: { male: GenderStatistics; female: GenderStatistics; total: any } }> {
    const response = await apiClient.get('/housing/reports/availability/by-gender');
    return response.data;
  },

  /**
   * Rapports annuels historiques
   */
  async getAnnualReports(filters: {
    year?: number;
    housingId?: string;
    genderRestriction?: string;
  } = {}): Promise<{ data: OccupancyReport[]; aggregates: any[]; count: number }> {
    const params = new URLSearchParams();
    if (filters.year) params.append('year', filters.year.toString());
    if (filters.housingId) params.append('housingId', filters.housingId);
    if (filters.genderRestriction) params.append('genderRestriction', filters.genderRestriction);

    const response = await apiClient.get(`/housing/reports/annual?${params.toString()}`);
    return response.data;
  },

  /**
   * Occupation temps réel d'une cité
   */
  async getOccupancy(housingId: string): Promise<{ data: any }> {
    const response = await apiClient.get(`/housing/reports/occupancy/${housingId}`);
    return response.data;
  },

  /**
   * Statistiques globales système
   */
  async getGlobalStatistics(): Promise<{ data: GlobalStatistics }> {
    const response = await apiClient.get('/housing/reports/statistics/global');
    return response.data;
  }
};

export default housingReportService;

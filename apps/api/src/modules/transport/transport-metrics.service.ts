/**
 * FICHIER: apps/api/src/modules/transport/transport-metrics.service.ts
 * SERVICE: TransportMetricsService - Métriques et statistiques globales du transport
 *
 * DESCRIPTION:
 * Service pour agréger les statistiques de tous les modules de transport
 * Fournit une vue d'ensemble complète des performances du système de transport
 *
 * MÉTRIQUES FOURNIES:
 * - Vue d'ensemble (overview): compteurs généraux
 * - Performance véhicules: taux d'utilisation, coûts
 * - Performance chauffeurs: disponibilité, performance
 * - Performance itinéraires: trafic, rentabilité
 * - Performance trajets: complétion, ponctualité, occupation
 * - Alertes et notifications: maintenances dues, permis expirés
 *
 * AUTEUR: Équipe CROU
 * DATE: Octobre 2025
 */

import { AppDataSource } from '../../../../../packages/database/src/config/datasource';
import { Vehicle, VehicleStatus } from '../../../../../packages/database/src/entities/Vehicle.entity';
import { Driver } from '../../../../../packages/database/src/entities/Driver.entity';
import { TransportRoute } from '../../../../../packages/database/src/entities/TransportRoute.entity';
import { ScheduledTrip, TripStatus } from '../../../../../packages/database/src/entities/ScheduledTrip.entity';
import { VehicleUsage } from '../../../../../packages/database/src/entities/VehicleUsage.entity';
import { VehicleMaintenance } from '../../../../../packages/database/src/entities/VehicleMaintenance.entity';
import { Repository } from 'typeorm';
import { logger } from '@/shared/utils/logger';

export class TransportMetricsService {
  private vehicleRepository: Repository<Vehicle>;
  private driverRepository: Repository<Driver>;
  private routeRepository: Repository<TransportRoute>;
  private tripRepository: Repository<ScheduledTrip>;
  private usageRepository: Repository<VehicleUsage>;
  private maintenanceRepository: Repository<VehicleMaintenance>;

  constructor() {
    this.vehicleRepository = AppDataSource.getRepository(Vehicle);
    this.driverRepository = AppDataSource.getRepository(Driver);
    this.routeRepository = AppDataSource.getRepository(TransportRoute);
    this.tripRepository = AppDataSource.getRepository(ScheduledTrip);
    this.usageRepository = AppDataSource.getRepository(VehicleUsage);
    this.maintenanceRepository = AppDataSource.getRepository(VehicleMaintenance);
  }

  /**
   * Obtenir toutes les métriques du transport
   */
  async getAllMetrics(tenantId: string, filters: { dateFrom?: string; dateTo?: string } = {}) {
    try {
      const [overview, vehiclesMetrics, driversMetrics, routesMetrics, tripsMetrics, alerts] = await Promise.all([
        this.getOverviewMetrics(tenantId, filters),
        this.getVehiclesMetrics(tenantId, filters),
        this.getDriversMetrics(tenantId, filters),
        this.getRoutesMetrics(tenantId, filters),
        this.getTripsMetrics(tenantId, filters),
        this.getAlerts(tenantId)
      ]);

      return {
        success: true,
        data: {
          overview,
          vehicles: vehiclesMetrics,
          drivers: driversMetrics,
          routes: routesMetrics,
          trips: tripsMetrics,
          alerts
        },
        filters
      };
    } catch (error) {
      logger.error('Erreur getAllMetrics:', error);
      throw new Error('Erreur lors de la récupération des métriques');
    }
  }

  /**
   * Vue d'ensemble générale
   */
  private async getOverviewMetrics(tenantId: string, filters: { dateFrom?: string; dateTo?: string }) {
    const [
      totalVehicles,
      activeVehicles,
      totalDrivers,
      availableDrivers,
      totalRoutes,
      activeRoutes,
      totalTrips,
      completedTrips
    ] = await Promise.all([
      this.vehicleRepository.count({ where: { tenantId } }),
      this.vehicleRepository.count({ where: { tenantId, status: VehicleStatus.ACTIF } }),
      this.driverRepository.count({ where: { tenantId } }),
      this.driverRepository.count({ where: { tenantId, isActive: true, isAvailable: true } }),
      this.routeRepository.count({ where: { tenantId } }),
      this.routeRepository.count({ where: { tenantId, isActive: true } }),
      this.tripRepository.count({ where: { tenantId } }),
      this.tripRepository.count({ where: { tenantId, status: TripStatus.COMPLETED } })
    ]);

    return {
      totalVehicles,
      activeVehicles,
      vehicleUtilizationRate: totalVehicles > 0 ? (activeVehicles / totalVehicles) * 100 : 0,
      totalDrivers,
      availableDrivers,
      driverAvailabilityRate: totalDrivers > 0 ? (availableDrivers / totalDrivers) * 100 : 0,
      totalRoutes,
      activeRoutes,
      totalTrips,
      completedTrips,
      tripCompletionRate: totalTrips > 0 ? (completedTrips / totalTrips) * 100 : 0
    };
  }

  /**
   * Métriques des véhicules
   */
  private async getVehiclesMetrics(tenantId: string, filters: { dateFrom?: string; dateTo?: string }) {
    const vehicles = await this.vehicleRepository.find({
      where: { tenantId },
      relations: ['usages', 'maintenances']
    });

    const usageQuery = this.usageRepository
      .createQueryBuilder('usage')
      .innerJoin('usage.vehicle', 'vehicle')
      .where('vehicle.tenantId = :tenantId', { tenantId });

    if (filters.dateFrom) {
      usageQuery.andWhere('usage.date >= :dateFrom', { dateFrom: filters.dateFrom });
    }
    if (filters.dateTo) {
      usageQuery.andWhere('usage.date <= :dateTo', { dateTo: filters.dateTo });
    }

    const usages = await usageQuery.getMany();

    const totalKilometers = usages.reduce((sum, u) => sum + u.kilometrageParcouru, 0);
    const totalMaintenanceCosts = vehicles.reduce(
      (sum, v) => sum + (v.maintenances || []).reduce((s, m) => s + (m.coutReel || m.coutEstime || 0), 0),
      0
    );

    const maintenancesDue = vehicles.filter(v => v.isMaintenanceDue && v.isMaintenanceDue()).length;
    const maintenancesOverdue = vehicles.filter(v => v.isMaintenanceDue && v.isMaintenanceDue()).length;

    return {
      total: vehicles.length,
      byStatus: {
        actif: vehicles.filter(v => v.status === 'actif').length,
        enMaintenance: vehicles.filter(v => v.status === 'en_maintenance').length,
        horsService: vehicles.filter(v => v.status === 'hors_service').length,
        reforme: vehicles.filter(v => v.status === 'vendu' || v.status === 'casse').length
      },
      byType: vehicles.reduce((acc, v) => {
        acc[v.type] = (acc[v.type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      totalKilometers,
      averageKilometersPerVehicle: vehicles.length > 0 ? totalKilometers / vehicles.length : 0,
      totalMaintenanceCosts,
      averageMaintenanceCostPerVehicle: vehicles.length > 0 ? totalMaintenanceCosts / vehicles.length : 0,
      maintenancesDue,
      maintenancesOverdue,
      utilizationRate: vehicles.length > 0
        ? (vehicles.filter(v => v.status === 'actif').length / vehicles.length) * 100
        : 0
    };
  }

  /**
   * Métriques des chauffeurs
   */
  private async getDriversMetrics(tenantId: string, filters: { dateFrom?: string; dateTo?: string }) {
    const drivers = await this.driverRepository.find({
      where: { tenantId },
      relations: ['assignedVehicle']
    });

    const expiredLicenses = drivers.filter(d => d.isLicenseExpired()).length;
    const expiringSoonLicenses = drivers.filter(d => d.isLicenseExpiringSoon()).length;
    const medicalCheckupDue = drivers.filter(d => d.isMedicalCheckupDue()).length;

    const totalTrips = drivers.reduce((sum, d) => sum + d.totalTrips, 0);
    const totalKilometers = drivers.reduce((sum, d) => sum + d.totalKilometers, 0);
    const ratingsCount = drivers.filter(d => d.performanceRating > 0).length;
    const averageRating = ratingsCount > 0
      ? drivers.reduce((sum, d) => sum + d.performanceRating, 0) / ratingsCount
      : 0;

    return {
      total: drivers.length,
      byStatus: {
        active: drivers.filter(d => d.status === 'active').length,
        inactive: drivers.filter(d => d.status === 'inactive').length,
        suspended: drivers.filter(d => d.status === 'suspended').length,
        on_leave: drivers.filter(d => d.status === 'on_leave').length
      },
      byLicenseType: {
        A: drivers.filter(d => d.licenseType === 'A').length,
        B: drivers.filter(d => d.licenseType === 'B').length,
        C: drivers.filter(d => d.licenseType === 'C').length,
        D: drivers.filter(d => d.licenseType === 'D').length,
        E: drivers.filter(d => d.licenseType === 'E').length
      },
      available: drivers.filter(d => d.checkIsAvailable()).length,
      withVehicleAssigned: drivers.filter(d => d.assignedVehicleId).length,
      expiredLicenses,
      expiringSoonLicenses,
      medicalCheckupDue,
      totalTrips,
      totalKilometers,
      averageTripsPerDriver: drivers.length > 0 ? totalTrips / drivers.length : 0,
      averageKilometersPerDriver: drivers.length > 0 ? totalKilometers / drivers.length : 0,
      averageRating
    };
  }

  /**
   * Métriques des itinéraires
   */
  private async getRoutesMetrics(tenantId: string, filters: { dateFrom?: string; dateTo?: string }) {
    const routes = await this.routeRepository.find({
      where: { tenantId },
      relations: ['scheduledTrips']
    });

    const totalDistance = routes.reduce((sum, r) => sum + Number(r.distance), 0);
    const totalTripsCompleted = routes.reduce((sum, r) => sum + r.totalTripsCompleted, 0);
    const totalPassengersTransported = routes.reduce((sum, r) => sum + r.totalPassengersTransported, 0);

    return {
      total: routes.length,
      byType: {
        campus: routes.filter(r => r.type === 'campus').length,
        inter_campus: routes.filter(r => r.type === 'inter_campus').length,
        city: routes.filter(r => r.type === 'city').length,
        intercity: routes.filter(r => r.type === 'intercity').length
      },
      byStatus: {
        active: routes.filter(r => r.status === 'active').length,
        inactive: routes.filter(r => r.status === 'inactive').length,
        maintenance: routes.filter(r => r.status === 'maintenance').length
      },
      totalDistance,
      averageDistance: routes.length > 0 ? totalDistance / routes.length : 0,
      totalTripsCompleted,
      totalPassengersTransported,
      averagePassengersPerRoute: routes.length > 0 ? totalPassengersTransported / routes.length : 0,
      mostUsedRoute: routes.length > 0
        ? routes.reduce((max, r) => r.totalTripsCompleted > max.totalTripsCompleted ? r : max, routes[0])
        : null
    };
  }

  /**
   * Métriques des trajets programmés
   */
  private async getTripsMetrics(tenantId: string, filters: { dateFrom?: string; dateTo?: string }) {
    const query = this.tripRepository
      .createQueryBuilder('trip')
      .where('trip.tenantId = :tenantId', { tenantId });

    if (filters.dateFrom) {
      query.andWhere('trip.scheduledDate >= :dateFrom', { dateFrom: filters.dateFrom });
    }
    if (filters.dateTo) {
      query.andWhere('trip.scheduledDate <= :dateTo', { dateTo: filters.dateTo });
    }

    const trips = await query.getMany();

    const completedTrips = trips.filter(t => t.status === TripStatus.COMPLETED);
    const totalPassengers = trips.reduce((sum, t) => sum + t.passengersCount, 0);
    const totalDistance = completedTrips.reduce((sum, t) => sum + (t.distanceCovered || 0), 0);
    const totalRevenue = completedTrips.reduce((sum, t) => sum + (t.revenue || 0), 0);
    const totalCosts = completedTrips.reduce((sum, t) => sum + t.calculateTotalCost(), 0);
    const delayedTrips = trips.filter(t => t.isDelayed()).length;

    const occupancyRates = completedTrips
      .filter(t => t.occupancyRate !== null)
      .map(t => t.occupancyRate as number);
    const averageOccupancy = occupancyRates.length > 0
      ? occupancyRates.reduce((sum, rate) => sum + rate, 0) / occupancyRates.length
      : 0;

    const ratings = completedTrips.filter(t => t.rating).map(t => t.rating as number);
    const averageRating = ratings.length > 0
      ? ratings.reduce((sum, r) => sum + r, 0) / ratings.length
      : 0;

    return {
      total: trips.length,
      byStatus: {
        scheduled: trips.filter(t => t.status === TripStatus.SCHEDULED).length,
        in_progress: trips.filter(t => t.status === TripStatus.IN_PROGRESS).length,
        completed: completedTrips.length,
        cancelled: trips.filter(t => t.status === TripStatus.CANCELLED).length,
        delayed: delayedTrips
      },
      completionRate: trips.length > 0 ? (completedTrips.length / trips.length) * 100 : 0,
      cancellationRate: trips.length > 0 ? (trips.filter(t => t.status === TripStatus.CANCELLED).length / trips.length) * 100 : 0,
      delayRate: trips.length > 0 ? (delayedTrips / trips.length) * 100 : 0,
      totalPassengers,
      averagePassengersPerTrip: trips.length > 0 ? totalPassengers / trips.length : 0,
      totalDistance,
      averageDistance: completedTrips.length > 0 ? totalDistance / completedTrips.length : 0,
      totalRevenue,
      totalCosts,
      totalProfit: totalRevenue - totalCosts,
      profitMargin: totalRevenue > 0 ? ((totalRevenue - totalCosts) / totalRevenue) * 100 : 0,
      averageOccupancy,
      averageRating
    };
  }

  /**
   * Alertes et notifications
   */
  private async getAlerts(tenantId: string) {
    const [vehicles, drivers, maintenances] = await Promise.all([
      this.vehicleRepository.find({ where: { tenantId }, relations: ['maintenances'] }),
      this.driverRepository.find({ where: { tenantId, isActive: true } }),
      this.maintenanceRepository.find({
        where: { tenantId, status: 'in_progress' as any },
        relations: ['vehicle']
      })
    ]);

    // Alertes véhicules
    const vehiclesMaintenanceDue = vehicles.filter(v => v.isMaintenanceDue && v.isMaintenanceDue());
    const vehiclesMaintenanceOverdue = vehicles.filter(v => v.isMaintenanceDue && v.isMaintenanceDue());
    const vehiclesOutOfService = vehicles.filter(v => v.status === 'hors_service');

    // Alertes chauffeurs
    const driversExpiredLicense = drivers.filter(d => d.isLicenseExpired());
    const driversExpiringSoonLicense = drivers.filter(d => d.isLicenseExpiringSoon());
    const driversMedicalCheckupDue = drivers.filter(d => d.isMedicalCheckupDue());

    // Alertes maintenances
    const maintenancesInProgress = maintenances;

    return {
      vehicles: {
        maintenanceDue: vehiclesMaintenanceDue.length,
        maintenanceOverdue: vehiclesMaintenanceOverdue.length,
        outOfService: vehiclesOutOfService.length,
        details: {
          maintenanceDue: vehiclesMaintenanceDue.map(v => ({
            id: v.id,
            immatriculation: v.immatriculation,
            type: v.type,
            kilometrageActuel: v.kilometrageActuel
          })),
          maintenanceOverdue: vehiclesMaintenanceOverdue.map(v => ({
            id: v.id,
            immatriculation: v.immatriculation,
            type: v.type,
            kilometrageActuel: v.kilometrageActuel
          }))
        }
      },
      drivers: {
        expiredLicense: driversExpiredLicense.length,
        expiringSoonLicense: driversExpiringSoonLicense.length,
        medicalCheckupDue: driversMedicalCheckupDue.length,
        details: {
          expiredLicense: driversExpiredLicense.map(d => ({
            id: d.id,
            name: `${d.firstName} ${d.lastName}`,
            employeeId: d.employeeId,
            licenseExpiryDate: d.licenseExpiryDate
          })),
          expiringSoonLicense: driversExpiringSoonLicense.map(d => ({
            id: d.id,
            name: `${d.firstName} ${d.lastName}`,
            employeeId: d.employeeId,
            licenseExpiryDate: d.licenseExpiryDate
          })),
          medicalCheckupDue: driversMedicalCheckupDue.map(d => ({
            id: d.id,
            name: `${d.firstName} ${d.lastName}`,
            employeeId: d.employeeId,
            lastMedicalCheckup: d.lastMedicalCheckup
          }))
        }
      },
      maintenances: {
        inProgress: maintenancesInProgress.length,
        details: maintenancesInProgress.map(m => ({
          id: m.id,
          vehicleId: m.vehicleId,
          vehicleImmatriculation: m.vehicle?.immatriculation,
          type: m.type,
          dateDebut: m.dateDebut,
          coutEstime: m.coutEstime
        }))
      },
      totalAlerts:
        vehiclesMaintenanceDue.length +
        vehiclesMaintenanceOverdue.length +
        vehiclesOutOfService.length +
        driversExpiredLicense.length +
        driversExpiringSoonLicense.length +
        driversMedicalCheckupDue.length +
        maintenancesInProgress.length
    };
  }
}

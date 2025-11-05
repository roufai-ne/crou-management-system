/**
 * FICHIER: apps/api/src/modules/transport/scheduled-trips.service.ts
 * SERVICE: ScheduledTripsService - Logique métier pour les trajets programmés
 *
 * DESCRIPTION:
 * Service pour la gestion des trajets programmés
 * CRUD complet avec gestion des statuts et calculs automatiques
 *
 * AUTEUR: Équipe CROU
 * DATE: Octobre 2025
 */

import { AppDataSource } from '../../../../../packages/database/src/config/datasource';
import { ScheduledTrip, TripStatus } from '../../../../../packages/database/src/entities/ScheduledTrip.entity';
import { TransportRoute } from '../../../../../packages/database/src/entities/TransportRoute.entity';
import { Vehicle } from '../../../../../packages/database/src/entities/Vehicle.entity';
import { Driver } from '../../../../../packages/database/src/entities/Driver.entity';
import { Repository } from 'typeorm';
import { logger } from '@/shared/utils/logger';

export class ScheduledTripsService {
  private tripRepository: Repository<ScheduledTrip>;
  private routeRepository: Repository<TransportRoute>;
  private vehicleRepository: Repository<Vehicle>;
  private driverRepository: Repository<Driver>;

  constructor() {
    this.tripRepository = AppDataSource.getRepository(ScheduledTrip);
    this.routeRepository = AppDataSource.getRepository(TransportRoute);
    this.vehicleRepository = AppDataSource.getRepository(Vehicle);
    this.driverRepository = AppDataSource.getRepository(Driver);
  }

  /**
   * Récupérer tous les trajets programmés
   */
  async getScheduledTrips(
    tenantId: string,
    filters: {
      search?: string;
      status?: string;
      routeId?: string;
      vehicleId?: string;
      driverId?: string;
      dateFrom?: string;
      dateTo?: string;
      page?: number;
      limit?: number;
    } = {}
  ) {
    try {
      const {
        search = '',
        status = 'all',
        routeId,
        vehicleId,
        driverId,
        dateFrom,
        dateTo,
        page = 1,
        limit = 20
      } = filters;

      const query = this.tripRepository
        .createQueryBuilder('trip')
        .leftJoinAndSelect('trip.route', 'route')
        .leftJoinAndSelect('trip.vehicle', 'vehicle')
        .leftJoinAndSelect('trip.driver', 'driver')
        .where('trip.tenantId = :tenantId', { tenantId });

      // Filtre recherche
      if (search) {
        query.andWhere('trip.tripNumber ILIKE :search', { search: `%${search}%` });
      }

      // Filtre statut
      if (status !== 'all') {
        query.andWhere('trip.status = :status', { status });
      }

      // Filtre itinéraire
      if (routeId) {
        query.andWhere('trip.routeId = :routeId', { routeId });
      }

      // Filtre véhicule
      if (vehicleId) {
        query.andWhere('trip.vehicleId = :vehicleId', { vehicleId });
      }

      // Filtre chauffeur
      if (driverId) {
        query.andWhere('trip.driverId = :driverId', { driverId });
      }

      // Filtre dates
      if (dateFrom) {
        query.andWhere('trip.scheduledDate >= :dateFrom', { dateFrom });
      }
      if (dateTo) {
        query.andWhere('trip.scheduledDate <= :dateTo', { dateTo });
      }

      // Pagination
      const skip = (page - 1) * limit;
      query.skip(skip).take(limit);

      // Ordre
      query.orderBy('trip.scheduledDate', 'DESC').addOrderBy('trip.scheduledDepartureTime', 'ASC');

      const [trips, total] = await query.getManyAndCount();

      return {
        success: true,
        data: trips,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      logger.error('Erreur getScheduledTrips:', error);
      throw new Error('Erreur lors de la récupération des trajets programmés');
    }
  }

  /**
   * Récupérer un trajet par ID
   */
  async getScheduledTripById(id: string, tenantId: string) {
    try {
      const trip = await this.tripRepository.findOne({
        where: { id, tenantId },
        relations: ['route', 'vehicle', 'driver', 'vehicleUsage']
      });

      if (!trip) {
        throw new Error('Trajet programmé non trouvé');
      }

      return {
        success: true,
        data: trip
      };
    } catch (error) {
      logger.error('Erreur getScheduledTripById:', error);
      throw error;
    }
  }

  /**
   * Créer un nouveau trajet programmé
   */
  async createScheduledTrip(data: any, tenantId: string, createdBy: string) {
    try {
      // Validation de l'itinéraire
      const route = await this.routeRepository.findOne({
        where: { id: data.routeId, tenantId }
      });
      if (!route) {
        throw new Error('Itinéraire non trouvé');
      }
      if (!route.checkIsActive()) {
        throw new Error('Cet itinéraire n\'est pas actif');
      }

      // Validation du véhicule si fourni
      if (data.vehicleId) {
        const vehicle = await this.vehicleRepository.findOne({
          where: { id: data.vehicleId, tenantId }
        });
        if (!vehicle) {
          throw new Error('Véhicule non trouvé');
        }
        if (!vehicle.isAvailable()) {
          throw new Error('Ce véhicule n\'est pas disponible');
        }
      }

      // Validation du chauffeur si fourni
      if (data.driverId) {
        const driver = await this.driverRepository.findOne({
          where: { id: data.driverId, tenantId }
        });
        if (!driver) {
          throw new Error('Chauffeur non trouvé');
        }
        if (!driver.checkIsAvailable()) {
          throw new Error('Ce chauffeur n\'est pas disponible');
        }
        if (driver.isLicenseExpired()) {
          throw new Error('Le permis du chauffeur est expiré');
        }
      }

      // Générer le numéro de trajet
      const date = new Date(data.scheduledDate);
      const dateStr = date.toISOString().split('T')[0].replace(/-/g, '');
      const count = await this.tripRepository.count({
        where: { tenantId, scheduledDate: date }
      });
      const tripNumber = `TRIP-${dateStr}-${String(count + 1).padStart(3, '0')}`;

      // Calculer les sièges disponibles
      let seatsAvailable = data.seatsAvailable;
      if (!seatsAvailable && data.vehicleId) {
        const vehicle = await this.vehicleRepository.findOne({
          where: { id: data.vehicleId }
        });
        seatsAvailable = vehicle?.capacitePassagers || null;
      }

      const trip = this.tripRepository.create({
        ...data,
        tenantId,
        createdBy,
        tripNumber,
        status: TripStatus.SCHEDULED,
        passengersCount: data.passengersCount || 0,
        seatsAvailable,
        hasIncident: false
      });

      const savedTrips = await this.tripRepository.save(trip);
      const savedTrip = Array.isArray(savedTrips) ? savedTrips[0] : savedTrips;

      logger.info(`Trajet programmé créé: ${savedTrip.id} par ${createdBy}`);

      return {
        success: true,
        message: 'Trajet programmé créé avec succès',
        data: savedTrip
      };
    } catch (error) {
      logger.error('Erreur createScheduledTrip:', error);
      throw error;
    }
  }

  /**
   * Mettre à jour un trajet programmé
   */
  async updateScheduledTrip(id: string, data: any, tenantId: string, updatedBy: string) {
    try {
      const trip = await this.tripRepository.findOne({
        where: { id, tenantId }
      });

      if (!trip) {
        throw new Error('Trajet programmé non trouvé');
      }

      // Ne pas permettre la modification si le trajet est terminé
      if (trip.status === TripStatus.COMPLETED) {
        throw new Error('Impossible de modifier un trajet terminé');
      }

      Object.assign(trip, {
        ...data,
        updatedBy,
        updatedAt: new Date()
      });

      const updatedTrip = await this.tripRepository.save(trip);

      logger.info(`Trajet programmé mis à jour: ${id} par ${updatedBy}`);

      return {
        success: true,
        message: 'Trajet programmé mis à jour avec succès',
        data: updatedTrip
      };
    } catch (error) {
      logger.error('Erreur updateScheduledTrip:', error);
      throw error;
    }
  }

  /**
   * Supprimer un trajet programmé
   */
  async deleteScheduledTrip(id: string, tenantId: string) {
    try {
      const trip = await this.tripRepository.findOne({
        where: { id, tenantId }
      });

      if (!trip) {
        throw new Error('Trajet programmé non trouvé');
      }

      // Ne pas permettre la suppression si le trajet est en cours ou terminé
      if ([TripStatus.IN_PROGRESS, TripStatus.COMPLETED].includes(trip.status)) {
        throw new Error('Impossible de supprimer un trajet en cours ou terminé');
      }

      await this.tripRepository.remove(trip);

      logger.info(`Trajet programmé supprimé: ${id}`);

      return {
        success: true,
        message: 'Trajet programmé supprimé avec succès'
      };
    } catch (error) {
      logger.error('Erreur deleteScheduledTrip:', error);
      throw error;
    }
  }

  /**
   * Démarrer un trajet
   */
  async startTrip(id: string, data: { startKilometers: number }, tenantId: string, updatedBy: string) {
    try {
      const trip = await this.tripRepository.findOne({
        where: { id, tenantId },
        relations: ['vehicle', 'driver']
      });

      if (!trip) {
        throw new Error('Trajet programmé non trouvé');
      }

      if (trip.status !== TripStatus.SCHEDULED) {
        throw new Error('Ce trajet ne peut pas être démarré');
      }

      if (!trip.canStart()) {
        throw new Error('Le trajet nécessite un véhicule et un chauffeur pour démarrer');
      }

      trip.status = TripStatus.IN_PROGRESS;
      trip.actualDepartureTime = new Date();
      trip.startKilometers = data.startKilometers;
      trip.updatedBy = updatedBy;

      const updatedTrip = await this.tripRepository.save(trip);

      logger.info(`Trajet démarré: ${id}`);

      return {
        success: true,
        message: 'Trajet démarré avec succès',
        data: updatedTrip
      };
    } catch (error) {
      logger.error('Erreur startTrip:', error);
      throw error;
    }
  }

  /**
   * Terminer un trajet
   */
  async completeTrip(
    id: string,
    data: {
      endKilometers: number;
      passengersCount?: number;
      fuelCost?: number;
      tollCost?: number;
      otherCosts?: number;
      revenue?: number;
      rating?: number;
      notes?: string;
    },
    tenantId: string,
    updatedBy: string
  ) {
    try {
      const trip = await this.tripRepository.findOne({
        where: { id, tenantId },
        relations: ['route', 'driver']
      });

      if (!trip) {
        throw new Error('Trajet programmé non trouvé');
      }

      if (trip.status !== TripStatus.IN_PROGRESS) {
        throw new Error('Ce trajet n\'est pas en cours');
      }

      // Calculs automatiques
      trip.status = TripStatus.COMPLETED;
      trip.actualArrivalTime = new Date();
      trip.endKilometers = data.endKilometers;
      trip.distanceCovered = data.endKilometers - (trip.startKilometers || 0);
      trip.passengersCount = data.passengersCount || trip.passengersCount;
      trip.fuelCost = data.fuelCost || 0;
      trip.tollCost = data.tollCost || 0;
      trip.otherCosts = data.otherCosts || 0;
      trip.revenue = data.revenue || 0;
      trip.rating = data.rating || 0;
      trip.driverNotes = data.notes || '';
      trip.updatedBy = updatedBy;

      // Calculer le taux d'occupation
      if (trip.seatsAvailable && trip.seatsAvailable > 0) {
        trip.occupancyRate = (trip.passengersCount / trip.seatsAvailable) * 100;
      }

      // Calculer le retard
      if (trip.scheduledArrivalTime && trip.actualArrivalTime) {
        const scheduled = new Date(`${trip.scheduledDate}T${trip.scheduledArrivalTime}`);
        const actual = trip.actualArrivalTime;
        const diffMinutes = Math.floor((actual.getTime() - scheduled.getTime()) / (1000 * 60));
        if (diffMinutes > 0) {
          trip.delayMinutes = diffMinutes;
        }
      }

      const updatedTrip = await this.tripRepository.save(trip);

      // Mettre à jour les statistiques du chauffeur
      if (trip.driver) {
        trip.driver.totalTrips += 1;
        trip.driver.totalKilometers += trip.distanceCovered || 0;
        await this.driverRepository.save(trip.driver);
      }

      // Mettre à jour les statistiques de l'itinéraire
      if (trip.route) {
        trip.route.totalTripsCompleted += 1;
        trip.route.totalPassengersTransported += trip.passengersCount;
        await this.routeRepository.save(trip.route);
      }

      logger.info(`Trajet terminé: ${id}`);

      return {
        success: true,
        message: 'Trajet terminé avec succès',
        data: updatedTrip
      };
    } catch (error) {
      logger.error('Erreur completeTrip:', error);
      throw error;
    }
  }

  /**
   * Annuler un trajet
   */
  async cancelTrip(
    id: string,
    data: { reason: string; details?: string },
    tenantId: string,
    cancelledBy: string
  ) {
    try {
      const trip = await this.tripRepository.findOne({
        where: { id, tenantId }
      });

      if (!trip) {
        throw new Error('Trajet programmé non trouvé');
      }

      if ([TripStatus.COMPLETED, TripStatus.CANCELLED].includes(trip.status)) {
        throw new Error('Ce trajet ne peut pas être annulé');
      }

      trip.status = TripStatus.CANCELLED;
      trip.cancellationReason = data.reason as any;
      trip.cancellationDetails = data.details || '';
      trip.cancelledAt = new Date();
      trip.cancelledBy = cancelledBy;

      const updatedTrip = await this.tripRepository.save(trip);

      logger.info(`Trajet annulé: ${id} par ${cancelledBy}`);

      return {
        success: true,
        message: 'Trajet annulé avec succès',
        data: updatedTrip
      };
    } catch (error) {
      logger.error('Erreur cancelTrip:', error);
      throw error;
    }
  }

  /**
   * Obtenir les statistiques des trajets
   */
  async getTripsStatistics(tenantId: string, filters: { dateFrom?: string; dateTo?: string } = {}) {
    try {
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

      const stats = {
        total: trips.length,
        scheduled: trips.filter(t => t.status === TripStatus.SCHEDULED).length,
        inProgress: trips.filter(t => t.status === TripStatus.IN_PROGRESS).length,
        completed: trips.filter(t => t.status === TripStatus.COMPLETED).length,
        cancelled: trips.filter(t => t.status === TripStatus.CANCELLED).length,
        delayed: trips.filter(t => t.isDelayed()).length,
        totalPassengers: trips.reduce((sum, t) => sum + t.passengersCount, 0),
        totalKilometers: trips.reduce((sum, t) => sum + (t.distanceCovered || 0), 0),
        totalCost: trips.reduce((sum, t) => sum + t.calculateTotalCost(), 0),
        totalRevenue: trips.reduce((sum, t) => sum + (t.revenue || 0), 0),
        averageOccupancy: trips.length > 0
          ? trips.reduce((sum, t) => sum + (t.occupancyRate || 0), 0) / trips.length
          : 0,
        averageRating: trips.filter(t => t.rating).length > 0
          ? trips.reduce((sum, t) => sum + (t.rating || 0), 0) / trips.filter(t => t.rating).length
          : 0
      };

      return {
        success: true,
        data: stats
      };
    } catch (error) {
      logger.error('Erreur getTripsStatistics:', error);
      throw error;
    }
  }
}

/**
 * FICHIER: apps/api/src/modules/transport/drivers.service.ts
 * SERVICE: DriversService - Logique métier pour les chauffeurs
 *
 * DESCRIPTION:
 * Service pour la gestion des chauffeurs de transport
 * CRUD complet avec validation et règles métier
 * Support multi-tenant
 *
 * FONCTIONNALITÉS:
 * - CRUD chauffeurs
 * - Validation des permis
 * - Gestion des affectations véhicules
 * - Statistiques chauffeurs
 * - Alertes (permis expirés, visites médicales)
 *
 * AUTEUR: Équipe CROU
 * DATE: Octobre 2025
 */

import { AppDataSource } from '../../../../../packages/database/src/config/datasource';
import { Driver, DriverStatus, LicenseType } from '../../../../../packages/database/src/entities/Driver.entity';
import { Vehicle } from '../../../../../packages/database/src/entities/Vehicle.entity';
import { Repository } from 'typeorm';
import { logger } from '@/shared/utils/logger';

export class DriversService {
  private driverRepository: Repository<Driver>;
  private vehicleRepository: Repository<Vehicle>;

  constructor() {
    this.driverRepository = AppDataSource.getRepository(Driver);
    this.vehicleRepository = AppDataSource.getRepository(Vehicle);
  }

  /**
   * Récupérer tous les chauffeurs avec filtres et pagination
   */
  async getDrivers(
    tenantId: string,
    filters: {
      search?: string;
      status?: string;
      licenseType?: string;
      page?: number;
      limit?: number;
    } = {}
  ) {
    try {
      const {
        search = '',
        status = 'all',
        licenseType = 'all',
        page = 1,
        limit = 20
      } = filters;

      const query = this.driverRepository
        .createQueryBuilder('driver')
        .leftJoinAndSelect('driver.assignedVehicle', 'vehicle')
        .where('driver.tenantId = :tenantId', { tenantId });

      // Filtre recherche
      if (search) {
        query.andWhere(
          '(driver.firstName ILIKE :search OR driver.lastName ILIKE :search OR driver.employeeId ILIKE :search OR driver.email ILIKE :search)',
          { search: `%${search}%` }
        );
      }

      // Filtre statut
      if (status !== 'all') {
        query.andWhere('driver.status = :status', { status });
      }

      // Filtre type de permis
      if (licenseType !== 'all') {
        query.andWhere('driver.licenseType = :licenseType', { licenseType });
      }

      // Pagination
      const skip = (page - 1) * limit;
      query.skip(skip).take(limit);

      // Ordre
      query.orderBy('driver.createdAt', 'DESC');

      const [drivers, total] = await query.getManyAndCount();

      return {
        success: true,
        data: drivers,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      logger.error('Erreur getDrivers:', error);
      throw new Error('Erreur lors de la récupération des chauffeurs');
    }
  }

  /**
   * Récupérer un chauffeur par ID
   */
  async getDriverById(id: string, tenantId: string) {
    try {
      const driver = await this.driverRepository.findOne({
        where: { id, tenantId },
        relations: ['assignedVehicle', 'usages']
      });

      if (!driver) {
        throw new Error('Chauffeur non trouvé');
      }

      return {
        success: true,
        data: driver
      };
    } catch (error) {
      logger.error('Erreur getDriverById:', error);
      throw error;
    }
  }

  /**
   * Créer un nouveau chauffeur
   */
  async createDriver(data: any, tenantId: string, createdBy: string) {
    try {
      // Validation unicité employeeId
      const existingByEmployeeId = await this.driverRepository.findOne({
        where: { employeeId: data.employeeId, tenantId }
      });
      if (existingByEmployeeId) {
        throw new Error('Un chauffeur avec ce matricule existe déjà');
      }

      // Validation unicité email
      const existingByEmail = await this.driverRepository.findOne({
        where: { email: data.email, tenantId }
      });
      if (existingByEmail) {
        throw new Error('Un chauffeur avec cet email existe déjà');
      }

      // Validation unicité licenseNumber
      const existingByLicense = await this.driverRepository.findOne({
        where: { licenseNumber: data.licenseNumber }
      });
      if (existingByLicense) {
        throw new Error('Un chauffeur avec ce numéro de permis existe déjà');
      }

      // Validation date de permis
      const licenseExpiry = new Date(data.licenseExpiryDate);
      if (licenseExpiry <= new Date()) {
        throw new Error('La date d\'expiration du permis doit être dans le futur');
      }

      const driver = this.driverRepository.create({
        ...data,
        tenantId,
        createdBy,
        status: data.status || DriverStatus.ACTIF,
        isActive: true,
        isAvailable: true
      });

      const savedDrivers = await this.driverRepository.save(driver);
      const savedDriver = Array.isArray(savedDrivers) ? savedDrivers[0] : savedDrivers;

      logger.info(`Chauffeur créé: ${savedDriver.id} par ${createdBy}`);

      return {
        success: true,
        message: 'Chauffeur créé avec succès',
        data: savedDriver
      };
    } catch (error) {
      logger.error('Erreur createDriver:', error);
      throw error;
    }
  }

  /**
   * Mettre à jour un chauffeur
   */
  async updateDriver(id: string, data: any, tenantId: string, updatedBy: string) {
    try {
      const driver = await this.driverRepository.findOne({
        where: { id, tenantId }
      });

      if (!driver) {
        throw new Error('Chauffeur non trouvé');
      }

      // Validation email si modifié
      if (data.email && data.email !== driver.email) {
        const existingByEmail = await this.driverRepository.findOne({
          where: { email: data.email, tenantId }
        });
        if (existingByEmail && existingByEmail.id !== id) {
          throw new Error('Un chauffeur avec cet email existe déjà');
        }
      }

      // Validation licenseNumber si modifié
      if (data.licenseNumber && data.licenseNumber !== driver.licenseNumber) {
        const existingByLicense = await this.driverRepository.findOne({
          where: { licenseNumber: data.licenseNumber }
        });
        if (existingByLicense && existingByLicense.id !== id) {
          throw new Error('Un chauffeur avec ce numéro de permis existe déjà');
        }
      }

      // Mise à jour
      Object.assign(driver, {
        ...data,
        updatedBy,
        updatedAt: new Date()
      });

      const updatedDriver = await this.driverRepository.save(driver);

      logger.info(`Chauffeur mis à jour: ${id} par ${updatedBy}`);

      return {
        success: true,
        message: 'Chauffeur mis à jour avec succès',
        data: updatedDriver
      };
    } catch (error) {
      logger.error('Erreur updateDriver:', error);
      throw error;
    }
  }

  /**
   * Supprimer un chauffeur
   */
  async deleteDriver(id: string, tenantId: string) {
    try {
      const driver = await this.driverRepository.findOne({
        where: { id, tenantId },
        relations: ['assignedVehicle']
      });

      if (!driver) {
        throw new Error('Chauffeur non trouvé');
      }

      // Vérifier si le chauffeur a un véhicule affecté
      if (driver.assignedVehicleId) {
        throw new Error('Impossible de supprimer un chauffeur avec un véhicule affecté. Retirez d\'abord l\'affectation.');
      }

      await this.driverRepository.remove(driver);

      logger.info(`Chauffeur supprimé: ${id}`);

      return {
        success: true,
        message: 'Chauffeur supprimé avec succès'
      };
    } catch (error) {
      logger.error('Erreur deleteDriver:', error);
      throw error;
    }
  }

  /**
   * Affecter un véhicule à un chauffeur
   */
  async assignVehicle(driverId: string, vehicleId: string, tenantId: string, updatedBy: string) {
    try {
      const driver = await this.driverRepository.findOne({
        where: { id: driverId, tenantId }
      });

      if (!driver) {
        throw new Error('Chauffeur non trouvé');
      }

      const vehicle = await this.vehicleRepository.findOne({
        where: { id: vehicleId, tenantId }
      });

      if (!vehicle) {
        throw new Error('Véhicule non trouvé');
      }

      // Vérifier si le chauffeur peut conduire ce type de véhicule
      if (!driver.canDriveVehicleType(vehicle.type)) {
        throw new Error(`Le chauffeur avec un permis ${driver.licenseType} ne peut pas conduire un véhicule de type ${vehicle.type}`);
      }

      // Vérifier si le permis est valide
      if (driver.isLicenseExpired()) {
        throw new Error('Le permis du chauffeur est expiré');
      }

      // Affecter le véhicule
      driver.assignedVehicleId = vehicleId;
      driver.updatedBy = updatedBy;
      await this.driverRepository.save(driver);

      logger.info(`Véhicule ${vehicleId} affecté au chauffeur ${driverId}`);

      return {
        success: true,
        message: 'Véhicule affecté avec succès',
        data: driver
      };
    } catch (error) {
      logger.error('Erreur assignVehicle:', error);
      throw error;
    }
  }

  /**
   * Retirer l'affectation d'un véhicule
   */
  async unassignVehicle(driverId: string, tenantId: string, updatedBy: string) {
    try {
      const driver = await this.driverRepository.findOne({
        where: { id: driverId, tenantId }
      });

      if (!driver) {
        throw new Error('Chauffeur non trouvé');
      }

      driver.assignedVehicleId = null;
      driver.updatedBy = updatedBy;
      await this.driverRepository.save(driver);

      logger.info(`Affectation retirée pour le chauffeur ${driverId}`);

      return {
        success: true,
        message: 'Affectation retirée avec succès',
        data: driver
      };
    } catch (error) {
      logger.error('Erreur unassignVehicle:', error);
      throw error;
    }
  }

  /**
   * Obtenir les chauffeurs disponibles
   */
  async getAvailableDrivers(tenantId: string) {
    try {
      const drivers = await this.driverRepository.find({
        where: {
          tenantId,
          status: DriverStatus.ACTIF,
          isActive: true,
          isAvailable: true
        },
        relations: ['assignedVehicle']
      });

      // Filtrer ceux dont le permis n'est pas expiré
      const availableDrivers = drivers.filter(driver => !driver.isLicenseExpired());

      return {
        success: true,
        data: availableDrivers
      };
    } catch (error) {
      logger.error('Erreur getAvailableDrivers:', error);
      throw error;
    }
  }

  /**
   * Obtenir les alertes (permis expirés, visites médicales dues)
   */
  async getDriverAlerts(tenantId: string) {
    try {
      const drivers = await this.driverRepository.find({
        where: { tenantId, isActive: true }
      });

      const alerts = {
        expiredLicenses: [] as Driver[],
        expiringSoonLicenses: [] as Driver[],
        medicalCheckupDue: [] as Driver[]
      };

      drivers.forEach(driver => {
        if (driver.isLicenseExpired()) {
          alerts.expiredLicenses.push(driver);
        } else if (driver.isLicenseExpiringSoon()) {
          alerts.expiringSoonLicenses.push(driver);
        }

        if (driver.isMedicalCheckupDue()) {
          alerts.medicalCheckupDue.push(driver);
        }
      });

      return {
        success: true,
        data: alerts
      };
    } catch (error) {
      logger.error('Erreur getDriverAlerts:', error);
      throw error;
    }
  }

  /**
   * Obtenir les statistiques des chauffeurs
   */
  async getDriverStatistics(tenantId: string) {
    try {
      const drivers = await this.driverRepository.find({
        where: { tenantId }
      });

      const stats = {
        total: drivers.length,
        active: drivers.filter(d => d.status === DriverStatus.ACTIF).length,
        inactive: drivers.filter(d => d.status === DriverStatus.INACTIF).length,
        suspended: drivers.filter(d => d.status === DriverStatus.SUSPENDU).length,
        available: drivers.filter(d => d.checkIsAvailable()).length,
        withExpiredLicense: drivers.filter(d => d.isLicenseExpired()).length,
        withExpiringSoonLicense: drivers.filter(d => d.isLicenseExpiringSoon()).length,
        withVehicleAssigned: drivers.filter(d => d.assignedVehicleId).length,
        byLicenseType: {
          A: drivers.filter(d => d.licenseType === LicenseType.A).length,
          B: drivers.filter(d => d.licenseType === LicenseType.B).length,
          C: drivers.filter(d => d.licenseType === LicenseType.C).length,
          D: drivers.filter(d => d.licenseType === LicenseType.D).length,
          E: drivers.filter(d => d.licenseType === LicenseType.E).length
        },
        totalTrips: drivers.reduce((sum, d) => sum + d.totalTrips, 0),
        totalKilometers: drivers.reduce((sum, d) => sum + d.totalKilometers, 0),
        averageRating: drivers.length > 0
          ? drivers.reduce((sum, d) => sum + d.performanceRating, 0) / drivers.length
          : 0
      };

      return {
        success: true,
        data: stats
      };
    } catch (error) {
      logger.error('Erreur getDriverStatistics:', error);
      throw error;
    }
  }
}

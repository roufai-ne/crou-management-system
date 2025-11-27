/**
 * FICHIER: apps/api/src/modules/housing/services/HousingOccupancyService.ts
 * SERVICE: HousingOccupancyService - Service métier pour les occupations
 *
 * DESCRIPTION:
 * Service pour la gestion des occupations de LITS
 * Logique métier : attribution par lit, libération, paiements
 * Une chambre peut avoir plusieurs lits (1-10+), chaque lit occupé individuellement
 *
 * AUTEUR: Équipe CROU
 * DATE: Janvier 2025
 */

import { Repository } from 'typeorm';
import { AppDataSource } from '../../../../../../packages/database/src/config/datasource';
import { HousingOccupancy, OccupancyStatus } from '../../../../../../packages/database/src/entities/HousingOccupancy.entity';
import { Room } from '../../../../../../packages/database/src/entities/Room.entity';
import { Bed, BedStatus } from '../../../../../../packages/database/src/entities/Bed.entity';

export interface CreateOccupancyDTO {
  studentId: string;
  bedId: string;  // ID du lit (plus roomId directement)
  roomId: string; // On garde roomId pour faciliter les requêtes
  startDate: Date;
  endDate: Date;
  monthlyRent: number;
  housingRequestId?: string;
  notes?: string;
  createdBy: string;
}

export interface UpdateOccupancyDTO {
  endDate?: Date;
  status?: OccupancyStatus;
  isRentPaid?: boolean;
  lastRentPaymentDate?: Date;
  notes?: string;
  updatedBy: string;
}

export class HousingOccupancyService {
  private occupancyRepository: Repository<HousingOccupancy>;
  private roomRepository: Repository<Room>;
  private bedRepository: Repository<Bed>;

  constructor() {
    this.occupancyRepository = AppDataSource.getRepository(HousingOccupancy);
    this.roomRepository = AppDataSource.getRepository(Room);
    this.bedRepository = AppDataSource.getRepository(Bed);
  }

  /**
   * Créer une nouvelle occupation (attribuer un lit)
   */
  async create(tenantId: string, data: CreateOccupancyDTO): Promise<HousingOccupancy> {
    // Vérifier que le lit existe et est disponible
    const bed = await this.bedRepository.findOne({
      where: { id: data.bedId },
      relations: ['room']
    });

    if (!bed) {
      throw new Error('Lit introuvable');
    }

    if (bed.status !== BedStatus.AVAILABLE) {
      throw new Error(`Lit non disponible (statut: ${bed.getStatusLabel()})`);
    }

    // Créer l'occupation
    const occupancy = this.occupancyRepository.create({
      ...data,
      tenantId,
      status: OccupancyStatus.ACTIVE
    });

    const saved = await this.occupancyRepository.save(occupancy);

    // Mettre à jour le statut du lit
    await this.bedRepository.update(
      { id: data.bedId },
      { status: BedStatus.OCCUPIED }
    );

    // Mettre à jour le compteur d'occupation de la chambre
    const room = await this.roomRepository.findOne({
      where: { id: data.roomId },
      relations: ['beds']
    });

    if (room) {
      const occupiedBeds = await this.bedRepository.count({
        where: { roomId: room.id, status: BedStatus.OCCUPIED }
      });

      await this.roomRepository.update(
        { id: room.id },
        {
          occupation: occupiedBeds,
          status: occupiedBeds >= room.capacite ? 'occupe' : 'disponible'
        }
      );
    }

    return saved;
  }

  /**
   * Récupérer toutes les occupations
   */
  async getAll(tenantId: string, filters?: any): Promise<{ data: HousingOccupancy[]; total: number }> {
    const query = this.occupancyRepository
      .createQueryBuilder('occupancy')
      .leftJoinAndSelect('occupancy.student', 'student')
      .leftJoinAndSelect('occupancy.bed', 'bed')
      .leftJoinAndSelect('occupancy.room', 'room')
      .leftJoinAndSelect('room.housing', 'housing')
      .where('occupancy.tenantId = :tenantId', { tenantId });

    // Filtres
    if (filters?.status && filters.status !== 'all') {
      query.andWhere('occupancy.status = :status', { status: filters.status });
    }

    if (filters?.complexId) {
      query.andWhere('room.housingId = :complexId', { complexId: filters.complexId });
    }

    if (filters?.roomId) {
      query.andWhere('occupancy.roomId = :roomId', { roomId: filters.roomId });
    }

    if (filters?.bedId) {
      query.andWhere('occupancy.bedId = :bedId', { bedId: filters.bedId });
    }

    if (filters?.studentId) {
      query.andWhere('occupancy.studentId = :studentId', { studentId: filters.studentId });
    }

    if (filters?.search) {
      query.andWhere(
        '(student.firstName ILIKE :search OR student.lastName ILIKE :search OR room.numero ILIKE :search OR bed.number ILIKE :search)',
        { search: `%${filters.search}%` }
      );
    }

    const [data, total] = await query.getManyAndCount();
    return { data, total };
  }

  /**
   * Récupérer une occupation par ID
   */
  async getById(tenantId: string, id: string): Promise<HousingOccupancy> {
    const occupancy = await this.occupancyRepository.findOne({
      where: { id, tenantId },
      relations: ['student', 'bed', 'room', 'room.housing']
    });

    if (!occupancy) {
      throw new Error('Occupation introuvable');
    }

    return occupancy;
  }

  /**
   * Mettre à jour une occupation
   */
  async update(tenantId: string, id: string, data: UpdateOccupancyDTO): Promise<HousingOccupancy> {
    const occupancy = await this.getById(tenantId, id);

    Object.assign(occupancy, data);
    return await this.occupancyRepository.save(occupancy);
  }

  /**
   * Libérer un lit (terminer occupation)
   */
  async release(tenantId: string, id: string, userId: string): Promise<HousingOccupancy> {
    const occupancy = await this.getById(tenantId, id);

    if (!occupancy.canBeReleased()) {
      throw new Error('Cette occupation ne peut pas être libérée');
    }

    occupancy.status = OccupancyStatus.ENDED;
    occupancy.actualEndDate = new Date();
    occupancy.updatedBy = userId;

    const saved = await this.occupancyRepository.save(occupancy);

    // Libérer le lit
    await this.bedRepository.update(
      { id: occupancy.bedId },
      { status: BedStatus.AVAILABLE }
    );

    // Mettre à jour le compteur d'occupation de la chambre
    const room = await this.roomRepository.findOne({
      where: { id: occupancy.roomId },
      relations: ['beds']
    });

    if (room) {
      const occupiedBeds = await this.bedRepository.count({
        where: { roomId: room.id, status: BedStatus.OCCUPIED }
      });

      await this.roomRepository.update(
        { id: room.id },
        {
          occupation: occupiedBeds,
          status: occupiedBeds === 0 ? 'disponible' : occupiedBeds >= room.capacite ? 'occupe' : 'disponible'
        }
      );
    }

    return saved;
  }

  /**
   * Marquer le loyer comme payé
   */
  async markRentPaid(tenantId: string, id: string, userId: string): Promise<HousingOccupancy> {
    const occupancy = await this.getById(tenantId, id);

    occupancy.isRentPaid = true;
    occupancy.lastRentPaymentDate = new Date();
    occupancy.updatedBy = userId;

    return await this.occupancyRepository.save(occupancy);
  }

  /**
   * Récupérer occupations expirant bientôt
   */
  async getExpiring(tenantId: string, days: number = 30): Promise<HousingOccupancy[]> {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + days);

    return await this.occupancyRepository
      .createQueryBuilder('occupancy')
      .leftJoinAndSelect('occupancy.student', 'student')
      .leftJoinAndSelect('occupancy.bed', 'bed')
      .leftJoinAndSelect('occupancy.room', 'room')
      .where('occupancy.tenantId = :tenantId', { tenantId })
      .andWhere('occupancy.status = :status', { status: OccupancyStatus.ACTIVE })
      .andWhere('occupancy.endDate <= :futureDate', { futureDate })
      .andWhere('occupancy.endDate >= :now', { now: new Date() })
      .getMany();
  }

  /**
   * Récupérer occupations avec loyers impayés
   */
  async getUnpaidRents(tenantId: string): Promise<HousingOccupancy[]> {
    return await this.occupancyRepository.find({
      where: {
        tenantId,
        status: OccupancyStatus.ACTIVE,
        isRentPaid: false
      },
      relations: ['student', 'bed', 'room']
    });
  }

  /**
   * Récupérer les lits disponibles d'une chambre
   */
  async getAvailableBeds(roomId: string): Promise<Bed[]> {
    return await this.bedRepository.find({
      where: {
        roomId,
        status: BedStatus.AVAILABLE,
        isActive: true
      },
      order: { number: 'ASC' }
    });
  }

  /**
   * Récupérer les lits d'une chambre avec leur statut
   */
  async getRoomBeds(roomId: string): Promise<Bed[]> {
    return await this.bedRepository.find({
      where: { roomId },
      relations: ['occupancies'],
      order: { number: 'ASC' }
    });
  }

  /**
   * Statistiques des occupations
   */
  async getStats(tenantId: string) {
    const total = await this.occupancyRepository.count({ where: { tenantId } });
    const active = await this.occupancyRepository.count({
      where: { tenantId, status: OccupancyStatus.ACTIVE }
    });
    const ended = await this.occupancyRepository.count({
      where: { tenantId, status: OccupancyStatus.ENDED }
    });
    const cancelled = await this.occupancyRepository.count({
      where: { tenantId, status: OccupancyStatus.CANCELLED }
    });
    const unpaidRents = await this.occupancyRepository.count({
      where: { tenantId, status: OccupancyStatus.ACTIVE, isRentPaid: false }
    });

    const expiring = await this.getExpiring(tenantId, 30);

    // Statistiques sur les lits
    const totalBeds = await this.bedRepository
      .createQueryBuilder('bed')
      .leftJoin('bed.room', 'room')
      .where('room.tenantId = :tenantId', { tenantId })
      .getCount();

    const occupiedBeds = await this.bedRepository
      .createQueryBuilder('bed')
      .leftJoin('bed.room', 'room')
      .where('room.tenantId = :tenantId', { tenantId })
      .andWhere('bed.status = :status', { status: BedStatus.OCCUPIED })
      .getCount();

    const availableBeds = await this.bedRepository
      .createQueryBuilder('bed')
      .leftJoin('bed.room', 'room')
      .where('room.tenantId = :tenantId', { tenantId })
      .andWhere('bed.status = :status', { status: BedStatus.AVAILABLE })
      .andWhere('bed.isActive = :isActive', { isActive: true })
      .getCount();

    return {
      total,
      active,
      ended,
      cancelled,
      unpaidRents,
      expiringWithin30Days: expiring.length,
      beds: {
        total: totalBeds,
        occupied: occupiedBeds,
        available: availableBeds,
        occupancyRate: totalBeds > 0 ? ((occupiedBeds / totalBeds) * 100).toFixed(1) : '0'
      }
    };
  }
}

export default new HousingOccupancyService();

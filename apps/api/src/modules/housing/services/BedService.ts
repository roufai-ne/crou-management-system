/**
 * FICHIER: apps/api/src/modules/housing/services/BedService.ts
 * SERVICE: BedService - Service métier pour la gestion des lits
 *
 * DESCRIPTION:
 * Service central pour la gestion des LITS
 * Les lits sont au cœur du système de logement
 * Chaque lit peut être attribué individuellement à un étudiant
 *
 * AUTEUR: Équipe CROU
 * DATE: Janvier 2025
 */

import { Repository } from 'typeorm';
import { AppDataSource } from '../../../../../../packages/database/src/config/datasource';
import { Bed, BedStatus } from '../../../../../../packages/database/src/entities/Bed.entity';
import { Room } from '../../../../../../packages/database/src/entities/Room.entity';

export interface CreateBedDTO {
  roomId: string;
  number: string;
  description?: string;
  notes?: string;
  createdBy: string;
}

export interface UpdateBedDTO {
  number?: string;
  description?: string;
  status?: BedStatus;
  notes?: string;
  isActive?: boolean;
  updatedBy: string;
}

export interface BedFilters {
  roomId?: string;
  complexId?: string;
  status?: BedStatus;
  search?: string;
  isActive?: boolean;
}

export class BedService {
  private bedRepository: Repository<Bed>;
  private roomRepository: Repository<Room>;

  constructor() {
    this.bedRepository = AppDataSource.getRepository(Bed);
    this.roomRepository = AppDataSource.getRepository(Room);
  }

  /**
   * Créer un nouveau lit
   */
  async create(data: CreateBedDTO): Promise<Bed> {
    // Vérifier que la chambre existe
    const room = await this.roomRepository.findOne({
      where: { id: data.roomId }
    });

    if (!room) {
      throw new Error('Chambre introuvable');
    }

    // Vérifier que le numéro n'existe pas déjà dans cette chambre
    const existingBed = await this.bedRepository.findOne({
      where: {
        roomId: data.roomId,
        number: data.number
      }
    });

    if (existingBed) {
      throw new Error(`Le lit ${data.number} existe déjà dans cette chambre`);
    }

    // Créer le lit
    const bed = this.bedRepository.create({
      ...data,
      status: BedStatus.AVAILABLE,
      isActive: true
    });

    return await this.bedRepository.save(bed);
  }

  /**
   * Récupérer tous les lits avec filtres
   */
  async getAll(filters?: BedFilters): Promise<{ data: Bed[]; total: number }> {
    const query = this.bedRepository
      .createQueryBuilder('bed')
      .leftJoinAndSelect('bed.room', 'room')
      .leftJoinAndSelect('room.housing', 'housing')
      .leftJoinAndSelect('bed.occupancies', 'occupancies', 'occupancies.status = :activeStatus', {
        activeStatus: 'active'
      });

    // Filtres
    if (filters?.roomId) {
      query.andWhere('bed.roomId = :roomId', { roomId: filters.roomId });
    }

    if (filters?.complexId) {
      query.andWhere('room.housingId = :complexId', { complexId: filters.complexId });
    }

    if (filters?.status) {
      query.andWhere('bed.status = :status', { status: filters.status });
    }

    if (filters?.isActive !== undefined) {
      query.andWhere('bed.isActive = :isActive', { isActive: filters.isActive });
    }

    if (filters?.search) {
      query.andWhere(
        '(bed.number ILIKE :search OR bed.description ILIKE :search OR room.numero ILIKE :search)',
        { search: `%${filters.search}%` }
      );
    }

    query.orderBy('room.numero', 'ASC').addOrderBy('bed.number', 'ASC');

    const [data, total] = await query.getManyAndCount();
    return { data, total };
  }

  /**
   * Récupérer un lit par ID
   */
  async getById(id: string): Promise<Bed> {
    const bed = await this.bedRepository.findOne({
      where: { id },
      relations: ['room', 'room.housing', 'occupancies']
    });

    if (!bed) {
      throw new Error('Lit introuvable');
    }

    return bed;
  }

  /**
   * Récupérer les lits d'une chambre
   */
  async getByRoom(roomId: string): Promise<Bed[]> {
    return await this.bedRepository.find({
      where: { roomId },
      relations: ['occupancies'],
      order: { number: 'ASC' }
    });
  }

  /**
   * Récupérer les lits disponibles d'une chambre
   */
  async getAvailableByRoom(roomId: string): Promise<Bed[]> {
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
   * Récupérer les lits d'un complexe
   */
  async getByComplex(complexId: string): Promise<Bed[]> {
    return await this.bedRepository
      .createQueryBuilder('bed')
      .leftJoinAndSelect('bed.room', 'room')
      .where('room.housingId = :complexId', { complexId })
      .orderBy('room.numero', 'ASC')
      .addOrderBy('bed.number', 'ASC')
      .getMany();
  }

  /**
   * Mettre à jour un lit
   */
  async update(id: string, data: UpdateBedDTO): Promise<Bed> {
    const bed = await this.getById(id);

    // Si on change le numéro, vérifier qu'il n'existe pas déjà
    if (data.number && data.number !== bed.number) {
      const existingBed = await this.bedRepository.findOne({
        where: {
          roomId: bed.roomId,
          number: data.number
        }
      });

      if (existingBed) {
        throw new Error(`Le lit ${data.number} existe déjà dans cette chambre`);
      }
    }

    Object.assign(bed, data);
    return await this.bedRepository.save(bed);
  }

  /**
   * Supprimer un lit
   */
  async delete(id: string): Promise<void> {
    const bed = await this.getById(id);

    // Ne pas supprimer un lit occupé
    if (bed.status === BedStatus.OCCUPIED) {
      throw new Error('Impossible de supprimer un lit occupé');
    }

    await this.bedRepository.remove(bed);
  }

  /**
   * Mettre un lit en maintenance
   */
  async setMaintenance(id: string, userId: string, notes?: string): Promise<Bed> {
    const bed = await this.getById(id);

    if (bed.status === BedStatus.OCCUPIED) {
      throw new Error('Impossible de mettre en maintenance un lit occupé');
    }

    bed.status = BedStatus.MAINTENANCE;
    bed.notes = notes || bed.notes;
    bed.updatedBy = userId;

    return await this.bedRepository.save(bed);
  }

  /**
   * Remettre un lit en service
   */
  async setAvailable(id: string, userId: string): Promise<Bed> {
    const bed = await this.getById(id);

    bed.status = BedStatus.AVAILABLE;
    bed.updatedBy = userId;

    return await this.bedRepository.save(bed);
  }

  /**
   * Mettre un lit hors service
   */
  async setOutOfService(id: string, userId: string, reason?: string): Promise<Bed> {
    const bed = await this.getById(id);

    if (bed.status === BedStatus.OCCUPIED) {
      throw new Error('Impossible de mettre hors service un lit occupé');
    }

    bed.status = BedStatus.OUT_OF_SERVICE;
    bed.notes = reason || bed.notes;
    bed.updatedBy = userId;

    return await this.bedRepository.save(bed);
  }

  /**
   * Générer automatiquement les lits pour une chambre
   */
  async generateBedsForRoom(roomId: string, capacity: number, userId: string): Promise<Bed[]> {
    const room = await this.roomRepository.findOne({
      where: { id: roomId },
      relations: ['beds']
    });

    if (!room) {
      throw new Error('Chambre introuvable');
    }

    // Supprimer les lits existants qui sont disponibles
    const existingBeds = room.beds || [];
    const bedsToDelete = existingBeds.filter(b => b.status === BedStatus.AVAILABLE);
    if (bedsToDelete.length > 0) {
      await this.bedRepository.remove(bedsToDelete);
    }

    // Créer les nouveaux lits
    const beds: Bed[] = [];
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

    for (let i = 0; i < capacity; i++) {
      const bedNumber = i < 26 ? letters[i] : `${i + 1}`;

      const bed = this.bedRepository.create({
        roomId,
        number: bedNumber,
        description: `Lit ${bedNumber}`,
        status: BedStatus.AVAILABLE,
        isActive: true,
        createdBy: userId
      });

      beds.push(bed);
    }

    return await this.bedRepository.save(beds);
  }

  /**
   * Statistiques globales des lits
   */
  async getGlobalStats(tenantId?: string) {
    const queryBuilder = this.bedRepository
      .createQueryBuilder('bed')
      .leftJoin('bed.room', 'room')
      .leftJoin('room.housing', 'housing');

    if (tenantId) {
      queryBuilder.where('housing.tenantId = :tenantId', { tenantId });
    }

    const total = await queryBuilder.getCount();

    const available = await queryBuilder
      .clone()
      .andWhere('bed.status = :status', { status: BedStatus.AVAILABLE })
      .andWhere('bed.isActive = :isActive', { isActive: true })
      .getCount();

    const occupied = await queryBuilder
      .clone()
      .andWhere('bed.status = :status', { status: BedStatus.OCCUPIED })
      .getCount();

    const maintenance = await queryBuilder
      .clone()
      .andWhere('bed.status = :status', { status: BedStatus.MAINTENANCE })
      .getCount();

    const outOfService = await queryBuilder
      .clone()
      .andWhere('bed.status = :status', { status: BedStatus.OUT_OF_SERVICE })
      .getCount();

    const occupancyRate = total > 0 ? ((occupied / total) * 100).toFixed(1) : '0';

    return {
      total,
      available,
      occupied,
      maintenance,
      outOfService,
      occupancyRate,
      utilization: {
        usable: total - outOfService,
        utilizationRate: (total - outOfService) > 0
          ? ((occupied / (total - outOfService)) * 100).toFixed(1)
          : '0'
      }
    };
  }

  /**
   * Statistiques des lits par complexe
   */
  async getStatsByComplex(complexId: string) {
    const beds = await this.getByComplex(complexId);

    const total = beds.length;
    const available = beds.filter(b => b.status === BedStatus.AVAILABLE && b.isActive).length;
    const occupied = beds.filter(b => b.status === BedStatus.OCCUPIED).length;
    const maintenance = beds.filter(b => b.status === BedStatus.MAINTENANCE).length;
    const outOfService = beds.filter(b => b.status === BedStatus.OUT_OF_SERVICE).length;

    const occupancyRate = total > 0 ? ((occupied / total) * 100).toFixed(1) : '0';

    return {
      total,
      available,
      occupied,
      maintenance,
      outOfService,
      occupancyRate
    };
  }

  /**
   * Statistiques des lits par chambre
   */
  async getStatsByRoom(roomId: string) {
    const beds = await this.getByRoom(roomId);

    const total = beds.length;
    const available = beds.filter(b => b.status === BedStatus.AVAILABLE && b.isActive).length;
    const occupied = beds.filter(b => b.status === BedStatus.OCCUPIED).length;
    const maintenance = beds.filter(b => b.status === BedStatus.MAINTENANCE).length;
    const outOfService = beds.filter(b => b.status === BedStatus.OUT_OF_SERVICE).length;

    const occupancyRate = total > 0 ? ((occupied / total) * 100).toFixed(1) : '0';

    return {
      total,
      available,
      occupied,
      maintenance,
      outOfService,
      occupancyRate
    };
  }
}

export default new BedService();

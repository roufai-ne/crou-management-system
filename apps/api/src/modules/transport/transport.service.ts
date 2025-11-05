import { AppDataSource } from '../../../../../packages/database/src/config/datasource';
import { Vehicle, VehicleType } from '../../../../../packages/database/src/entities/Vehicle.entity';
import { VehicleUsage, UsageType } from '../../../../../packages/database/src/entities/VehicleUsage.entity';
import { VehicleMaintenance, MaintenanceType, MaintenanceStatus } from '../../../../../packages/database/src/entities/VehicleMaintenance.entity';

export interface CreateVehicleDTO {
  immatriculation: string;
  marque: string;
  modele: string;
  type: string;
  [key: string]: any;
}
export interface UpdateVehicleDTO {
  marque?: string;
  modele?: string;
  type?: string;
  status?: string;
  [key: string]: any;
}

export interface CreateUsageDTO {
  vehicleId: string;
  conducteur: string;
  description: string;
  type: string;
  kilometrageDebut: number;
  kilometrageFin: number;
  kilometrageParcouru?: number;
  dateDebut: Date;
  dateFin: Date;
  date: Date;
  [key: string]: any;
}
export interface UpdateUsageDTO {
  conducteur?: string;
  description?: string;
  type?: string;
  kilometrageDebut?: number;
  kilometrageFin?: number;
  kilometrageParcouru?: number;
  dateDebut?: Date;
  dateFin?: Date;
  date?: Date;
  [key: string]: any;
}

export interface CreateMaintenanceDTO {
  vehicleId: string;
  title: string;
  type: string;
  status?: string;
  kilometrage: number;
  dateDebut: Date;
  dateFin?: Date;
  description?: string;
  coutEstime?: number;
  coutReel?: number;
  devise?: string;
  garage?: string;
  [key: string]: any;
}
export interface UpdateMaintenanceDTO {
  title?: string;
  type?: string;
  status?: string;
  kilometrage?: number;
  dateDebut?: Date;
  dateFin?: Date;
  description?: string;
  coutEstime?: number;
  coutReel?: number;
  devise?: string;
  garage?: string;
  [key: string]: any;
}

export class TransportService {
  static async getVehicles(tenantId: string, { page = 1, limit = 20, filters = {} } : any) {
    const repo = AppDataSource.getRepository(Vehicle);
    const skip = (page - 1) * limit;
    const qb = repo.createQueryBuilder('vehicle').where('vehicle.tenantId = :tenantId', { tenantId });
    if (filters.status) qb.andWhere('vehicle.status = :status', { status: filters.status });
    if (filters.type) qb.andWhere('vehicle.type = :type', { type: filters.type });
    const [list, total] = await qb.skip(skip).take(limit).getManyAndCount();
    return { vehicles: list, total, page, limit, pages: Math.ceil(total / limit) };
  }
  static async getVehicleById(tenantId: string, id: string) {
    const repo = AppDataSource.getRepository(Vehicle);
    const vehicle = await repo.findOne({ where: { id, tenantId }});
    if (!vehicle) throw new Error('Véhicule non trouvé');
    return vehicle;
  }
  static async createVehicle(tenantId: string, userId: string, data: CreateVehicleDTO) {
    const repo = AppDataSource.getRepository(Vehicle);
    const exist = await repo.findOne({ where: { immatriculation: data.immatriculation, tenantId }});
    if (exist) throw new Error('Immatriculation déjà utilisée');
    const toSave = repo.create({ ...data, type: VehicleType[data.type as keyof typeof VehicleType] ?? data.type, tenantId, createdBy: userId });
    const saved = await repo.save(toSave);
    return saved;
  }
  static async updateVehicle(tenantId: string, userId: string, id: string, data: UpdateVehicleDTO) {
    const repo = AppDataSource.getRepository(Vehicle);
    const vehicle = await repo.findOne({ where: { id, tenantId }});
    if (!vehicle) throw new Error('Véhicule non trouvé');
    Object.assign(vehicle, data, { updatedBy: userId });
    const saved = await repo.save(vehicle);
    return saved;
  }
  static async deleteVehicle(tenantId: string, id: string) {
    const repo = AppDataSource.getRepository(Vehicle);
    const vehicle = await repo.findOne({ where: { id, tenantId }});
    if (!vehicle) throw new Error('Véhicule non trouvé');
    await repo.remove(vehicle);
    return true;
  }

  static async getUsages(tenantId: string, { page = 1, limit = 20, filters = {} } : any) {
    const repo = AppDataSource.getRepository(VehicleUsage);
    const skip = (page - 1) * limit;
    const qb = repo.createQueryBuilder('usage').where('usage.tenantId = :tenantId', { tenantId });
    if (filters.vehicleId) qb.andWhere('usage.vehicleId = :vehicleId', { vehicleId: filters.vehicleId });
    if (filters.conducteur) qb.andWhere('usage.conducteur LIKE :conducteur', { conducteur: `%${filters.conducteur}%` });
    if (filters.type) qb.andWhere('usage.type = :type', { type: filters.type });
    const [list, total] = await qb.skip(skip).take(limit).getManyAndCount();
    return { usages: list, total, page, limit, pages: Math.ceil(total / limit) };
  }
  static async getUsageById(tenantId: string, id: string) {
    const repo = AppDataSource.getRepository(VehicleUsage);
    const usage = await repo.findOne({ where: { id, tenantId }});
    if (!usage) throw new Error('Usage non trouvé');
    return usage;
  }
  static async createUsage(tenantId: string, userId: string, data: CreateUsageDTO) {
    const repo = AppDataSource.getRepository(VehicleUsage);
    if (!data.conducteur) throw new Error('Conducteur obligatoire');
    if (data.kilometrageFin < data.kilometrageDebut) throw new Error('Kilométrage incohérent');
    data.kilometrageParcouru = data.kilometrageFin - data.kilometrageDebut;
    const toSave = repo.create({ ...data, type: UsageType[data.type as keyof typeof UsageType] ?? data.type, tenantId, createdBy: userId });
    const saved = await repo.save(toSave);
    return saved;
  }
  static async updateUsage(tenantId: string, userId: string, id: string, data: UpdateUsageDTO) {
    const repo = AppDataSource.getRepository(VehicleUsage);
    const usage = await repo.findOne({ where: { id, tenantId }});
    if (!usage) throw new Error('Usage non trouvé');
    if ((data.kilometrageDebut ?? usage.kilometrageDebut) !== undefined && (data.kilometrageFin ?? usage.kilometrageFin) !== undefined && (data.kilometrageFin ?? usage.kilometrageFin) < (data.kilometrageDebut ?? usage.kilometrageDebut)) throw new Error('Kilométrage incohérent');
    Object.assign(usage, data, { updatedBy: userId });
    if (usage.kilometrageDebut !== undefined && usage.kilometrageFin !== undefined) {
      usage.kilometrageParcouru = usage.kilometrageFin - usage.kilometrageDebut;
    }
    const saved = await repo.save(usage);
    return saved;
  }
  static async deleteUsage(tenantId: string, id: string) {
    const repo = AppDataSource.getRepository(VehicleUsage);
    const usage = await repo.findOne({ where: { id, tenantId }});
    if (!usage) throw new Error('Usage non trouvé');
    await repo.remove(usage);
    return true;
  }

  static async getMaintenances(tenantId: string, { page = 1, limit = 20, filters = {} } : any) {
    const repo = AppDataSource.getRepository(VehicleMaintenance);
    const skip = (page - 1) * limit;
    const qb = repo.createQueryBuilder('maintenance').where('maintenance.tenantId = :tenantId', { tenantId });
    if (filters.vehicleId) qb.andWhere('maintenance.vehicleId = :vehicleId', { vehicleId: filters.vehicleId });
    if (filters.type) qb.andWhere('maintenance.type = :type', { type: filters.type });
    if (filters.status) qb.andWhere('maintenance.status = :status', { status: filters.status });
    const [list, total] = await qb.skip(skip).take(limit).getManyAndCount();
    return { maintenances: list, total, page, limit, pages: Math.ceil(total / limit) };
  }
  static async getMaintenanceById(tenantId: string, id: string) {
    const repo = AppDataSource.getRepository(VehicleMaintenance);
    const maintenance = await repo.findOne({ where: { id, tenantId }});
    if (!maintenance) throw new Error('Maintenance non trouvée');
    return maintenance;
  }
  static async createMaintenance(tenantId: string, userId: string, data: CreateMaintenanceDTO) {
    const repo = AppDataSource.getRepository(VehicleMaintenance);
    const toSave = repo.create({
      ...data,
      type: MaintenanceType[data.type as keyof typeof MaintenanceType] ?? data.type,
      status: MaintenanceStatus[data.status as keyof typeof MaintenanceStatus] ?? (data.status || MaintenanceStatus.PLANNED),
      tenantId,
      createdBy: userId
    });
    const saved = await repo.save(toSave);
    return saved;
  }
  static async updateMaintenance(tenantId: string, userId: string, id: string, data: UpdateMaintenanceDTO) {
    const repo = AppDataSource.getRepository(VehicleMaintenance);
    const maintenance = await repo.findOne({ where: { id, tenantId }});
    if (!maintenance) throw new Error('Maintenance non trouvée');
    Object.assign(maintenance,
      data,
      data.type ? { type: MaintenanceType[data.type as keyof typeof MaintenanceType] ?? data.type } : {},
      data.status ? { status: MaintenanceStatus[data.status as keyof typeof MaintenanceStatus] ?? data.status } : {},
      { updatedBy: userId }
    );
    const saved = await repo.save(maintenance);
    return saved;
  }
  static async deleteMaintenance(tenantId: string, id: string) {
    const repo = AppDataSource.getRepository(VehicleMaintenance);
    const maintenance = await repo.findOne({ where: { id, tenantId }});
    if (!maintenance) throw new Error('Maintenance non trouvée');
    await repo.remove(maintenance);
    return true;
  }
}

import { AppDataSource } from '../../../../../packages/database/src/config/datasource';
import { Vehicle, VehicleType, VehicleStatus } from '../../../../../packages/database/src/entities/Vehicle.entity';
import { VehicleUsage, UsageType } from '../../../../../packages/database/src/entities/VehicleUsage.entity';
import { VehicleMaintenance, MaintenanceType, MaintenanceStatus } from '../../../../../packages/database/src/entities/VehicleMaintenance.entity';
import { CreateVehicleDto, UpdateVehicleDto } from './dtos/vehicle.dto';
import { CreateUsageDto, UpdateUsageDto } from './dtos/usage.dto';
import { CreateMaintenanceDto, UpdateMaintenanceDto } from './dtos/maintenance.dto';

export class TransportService {
  static async getVehicles(tenantId: string, { page = 1, limit = 20, filters = {} }: { page?: number, limit?: number, filters?: any }) {
    const repo = AppDataSource.getRepository(Vehicle);
    const skip = (page - 1) * limit;
    const qb = repo.createQueryBuilder('vehicle').where('vehicle.tenantId = :tenantId', { tenantId });
    if (filters.status && filters.status !== 'all') qb.andWhere('vehicle.status = :status', { status: filters.status });
    if (filters.type && filters.type !== 'all') qb.andWhere('vehicle.type = :type', { type: filters.type });
    const [list, total] = await qb.skip(skip).take(limit).getManyAndCount();
    return { vehicles: list, total, page, limit, pages: Math.ceil(total / limit) };
  }

  static async getVehicleById(tenantId: string, id: string) {
    const repo = AppDataSource.getRepository(Vehicle);
    const vehicle = await repo.findOne({ where: { id, tenantId } });
    if (!vehicle) throw new Error('Véhicule non trouvé');
    return vehicle;
  }

  static async createVehicle(tenantId: string, userId: string, data: CreateVehicleDto) {
    const repo = AppDataSource.getRepository(Vehicle);
    const exist = await repo.findOne({ where: { immatriculation: data.immatriculation, tenantId } });
    if (exist) throw new Error('Immatriculation déjà utilisée');

    const toSave = repo.create({
      ...data,
      type: VehicleType[data.type as keyof typeof VehicleType] ?? data.type,
      status: data.status ? (VehicleStatus[data.status as keyof typeof VehicleStatus] ?? data.status) : VehicleStatus.ACTIF,
      tenantId,
      createdBy: userId
    });
    const saved = await repo.save(toSave);
    return saved;
  }

  static async updateVehicle(tenantId: string, userId: string, id: string, data: UpdateVehicleDto) {
    const repo = AppDataSource.getRepository(Vehicle);
    const vehicle = await repo.findOne({ where: { id, tenantId } });
    if (!vehicle) throw new Error('Véhicule non trouvé');

    Object.assign(vehicle, data, { updatedBy: userId });
    const saved = await repo.save(vehicle);
    return saved;
  }

  static async deleteVehicle(tenantId: string, id: string) {
    const repo = AppDataSource.getRepository(Vehicle);
    const vehicle = await repo.findOne({ where: { id, tenantId } });
    if (!vehicle) throw new Error('Véhicule non trouvé');
    await repo.remove(vehicle);
    return true;
  }

  static async getUsages(tenantId: string, { page = 1, limit = 20, filters = {} }: { page?: number, limit?: number, filters?: any }) {
    const repo = AppDataSource.getRepository(VehicleUsage);
    const skip = (page - 1) * limit;
    const qb = repo.createQueryBuilder('usage').where('usage.tenantId = :tenantId', { tenantId });
    if (filters.vehicleId && filters.vehicleId !== 'all') qb.andWhere('usage.vehicleId = :vehicleId', { vehicleId: filters.vehicleId });
    if (filters.conducteur) qb.andWhere('usage.conducteur LIKE :conducteur', { conducteur: `%${filters.conducteur}%` });
    if (filters.type && filters.type !== 'all') qb.andWhere('usage.type = :type', { type: filters.type });
    const [list, total] = await qb.skip(skip).take(limit).getManyAndCount();
    return { usages: list, total, page, limit, pages: Math.ceil(total / limit) };
  }

  static async getUsageById(tenantId: string, id: string) {
    const repo = AppDataSource.getRepository(VehicleUsage);
    const usage = await repo.findOne({ where: { id, tenantId } });
    if (!usage) throw new Error('Usage non trouvé');
    return usage;
  }

  static async createUsage(tenantId: string, userId: string, data: CreateUsageDto) {
    const repo = AppDataSource.getRepository(VehicleUsage);

    if (data.kilometrageFin < data.kilometrageDebut) throw new Error('Kilométrage incohérent');

    // Convert string dates to Date objects if necessary (class-validator ensures they are date strings)
    const usageData = {
      ...data,
      dateDebut: new Date(data.dateDebut),
      dateFin: new Date(data.dateFin),
      date: new Date(data.date),
      kilometrageParcouru: data.kilometrageFin - data.kilometrageDebut,
      type: UsageType[data.type as keyof typeof UsageType] ?? data.type,
      tenantId,
      createdBy: userId
    };

    const toSave = repo.create(usageData);
    const saved = await repo.save(toSave);
    return saved;
  }

  static async updateUsage(tenantId: string, userId: string, id: string, data: UpdateUsageDto) {
    const repo = AppDataSource.getRepository(VehicleUsage);
    const usage = await repo.findOne({ where: { id, tenantId } });
    if (!usage) throw new Error('Usage non trouvé');

    const kmDebut = data.kilometrageDebut ?? usage.kilometrageDebut;
    const kmFin = data.kilometrageFin ?? usage.kilometrageFin;

    if (kmFin < kmDebut) throw new Error('Kilométrage incohérent');

    const updateData: any = { ...data, updatedBy: userId };

    if (data.dateDebut) updateData.dateDebut = new Date(data.dateDebut);
    if (data.dateFin) updateData.dateFin = new Date(data.dateFin);
    if (data.date) updateData.date = new Date(data.date);

    Object.assign(usage, updateData);

    usage.kilometrageParcouru = usage.kilometrageFin - usage.kilometrageDebut;

    const saved = await repo.save(usage);
    return saved;
  }

  static async deleteUsage(tenantId: string, id: string) {
    const repo = AppDataSource.getRepository(VehicleUsage);
    const usage = await repo.findOne({ where: { id, tenantId } });
    if (!usage) throw new Error('Usage non trouvé');
    await repo.remove(usage);
    return true;
  }

  static async getMaintenances(tenantId: string, { page = 1, limit = 20, filters = {} }: { page?: number, limit?: number, filters?: any }) {
    const repo = AppDataSource.getRepository(VehicleMaintenance);
    const skip = (page - 1) * limit;
    const qb = repo.createQueryBuilder('maintenance').where('maintenance.tenantId = :tenantId', { tenantId });
    if (filters.vehicleId && filters.vehicleId !== 'all') qb.andWhere('maintenance.vehicleId = :vehicleId', { vehicleId: filters.vehicleId });
    if (filters.type && filters.type !== 'all') qb.andWhere('maintenance.type = :type', { type: filters.type });
    if (filters.status && filters.status !== 'all') qb.andWhere('maintenance.status = :status', { status: filters.status });
    const [list, total] = await qb.skip(skip).take(limit).getManyAndCount();
    return { maintenances: list, total, page, limit, pages: Math.ceil(total / limit) };
  }

  static async getMaintenanceById(tenantId: string, id: string) {
    const repo = AppDataSource.getRepository(VehicleMaintenance);
    const maintenance = await repo.findOne({ where: { id, tenantId } });
    if (!maintenance) throw new Error('Maintenance non trouvée');
    return maintenance;
  }

  static async createMaintenance(tenantId: string, userId: string, data: CreateMaintenanceDto) {
    const repo = AppDataSource.getRepository(VehicleMaintenance);

    const maintenanceData = {
      ...data,
      dateDebut: new Date(data.dateDebut),
      dateFin: data.dateFin ? new Date(data.dateFin) : undefined,
      type: MaintenanceType[data.type as keyof typeof MaintenanceType] ?? data.type,
      status: data.status ? (MaintenanceStatus[data.status as keyof typeof MaintenanceStatus] ?? data.status) : MaintenanceStatus.PLANNED,
      tenantId,
      createdBy: userId
    };

    const toSave = repo.create(maintenanceData);
    const saved = await repo.save(toSave);
    return saved;
  }

  static async updateMaintenance(tenantId: string, userId: string, id: string, data: UpdateMaintenanceDto) {
    const repo = AppDataSource.getRepository(VehicleMaintenance);
    const maintenance = await repo.findOne({ where: { id, tenantId } });
    if (!maintenance) throw new Error('Maintenance non trouvée');

    const updateData: any = { ...data, updatedBy: userId };

    if (data.dateDebut) updateData.dateDebut = new Date(data.dateDebut);
    if (data.dateFin) updateData.dateFin = new Date(data.dateFin);
    if (data.type) updateData.type = MaintenanceType[data.type as keyof typeof MaintenanceType] ?? data.type;
    if (data.status) updateData.status = MaintenanceStatus[data.status as keyof typeof MaintenanceStatus] ?? data.status;

    Object.assign(maintenance, updateData);
    const saved = await repo.save(maintenance);
    return saved;
  }

  static async deleteMaintenance(tenantId: string, id: string) {
    const repo = AppDataSource.getRepository(VehicleMaintenance);
    const maintenance = await repo.findOne({ where: { id, tenantId } });
    if (!maintenance) throw new Error('Maintenance non trouvée');
    await repo.remove(maintenance);
    return true;
  }
}


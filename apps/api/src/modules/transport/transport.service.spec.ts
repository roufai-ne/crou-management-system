import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TransportService } from './transport.service';
import { AppDataSource } from '../../../../../packages/database/src/config/datasource';
import { Vehicle, VehicleType, VehicleStatus } from '../../../../../packages/database/src/entities/Vehicle.entity';

vi.mock('../../../../../packages/database/src/config/datasource');

describe('TransportService', () => {
    let mockRepo: any;

    beforeEach(() => {
        mockRepo = {
            createQueryBuilder: vi.fn(),
            findOne: vi.fn(),
            create: vi.fn(),
            save: vi.fn(),
            remove: vi.fn(),
        };
        (AppDataSource.getRepository as any).mockReturnValue(mockRepo);
    });

    describe('createVehicle', () => {
        it('should create a vehicle successfully', async () => {
            const tenantId = 'tenant-1';
            const userId = 'user-1';
            const dto = {
                immatriculation: 'AB-123-CD',
                marque: 'Toyota',
                modele: 'Corolla',
                type: 'voiture',
                status: 'actif'
            };

            mockRepo.findOne.mockResolvedValue(null); // No existing vehicle
            mockRepo.create.mockReturnValue({ ...dto, id: 'v-1', tenantId });
            mockRepo.save.mockResolvedValue({ ...dto, id: 'v-1', tenantId });

            const result = await TransportService.createVehicle(tenantId, userId, dto);

            expect(mockRepo.findOne).toHaveBeenCalledWith({ where: { immatriculation: dto.immatriculation, tenantId } });
            expect(mockRepo.create).toHaveBeenCalledWith(expect.objectContaining({
                immatriculation: dto.immatriculation,
                type: VehicleType.VOITURE,
                status: VehicleStatus.ACTIF
            }));
            expect(result).toBeDefined();
        });

        it('should throw error if immatriculation exists', async () => {
            const tenantId = 'tenant-1';
            const userId = 'user-1';
            const dto = {
                immatriculation: 'AB-123-CD',
                marque: 'Toyota',
                modele: 'Corolla',
                type: 'voiture'
            };

            mockRepo.findOne.mockResolvedValue({ id: 'existing' });

            await expect(TransportService.createVehicle(tenantId, userId, dto))
                .rejects.toThrow('Immatriculation déjà utilisée');
        });
    });
});

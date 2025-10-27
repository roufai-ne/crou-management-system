/**
 * FICHIER: packages\database\src\entities\VehicleMaintenance.entity.ts
 * ENTITÉ: VehicleMaintenance - Maintenance des véhicules
 *
 * DESCRIPTION:
 * Entité pour gérer la maintenance des véhicules
 *
 * RELATIONS:
 * - ManyToOne avec Vehicle (véhicule)
 * - ManyToOne avec Tenant (CROU)
 *
 * AUTEUR: Équipe CROU
 * DATE: Décembre 2024
 */
import { Vehicle } from './Vehicle.entity';
import { Tenant } from './Tenant.entity';
export declare enum MaintenanceType {
    PREVENTIVE = "preventive",// Maintenance préventive
    CORRECTIVE = "corrective",// Maintenance corrective
    REVISION = "revision",// Révision
    REPARATION = "reparation"
}
export declare enum MaintenanceStatus {
    PLANNED = "planned",// Planifiée
    IN_PROGRESS = "in_progress",// En cours
    COMPLETED = "completed",// Terminée
    CANCELLED = "cancelled"
}
export declare class VehicleMaintenance {
    id: string;
    vehicleId: string;
    vehicle: Vehicle;
    tenantId: string;
    tenant: Tenant;
    title: string;
    description: string;
    type: MaintenanceType;
    status: MaintenanceStatus;
    kilometrage: number;
    coutEstime: number;
    coutReel: number;
    devise: string;
    dateDebut: Date;
    dateFin: Date;
    garage: string;
    createdAt: Date;
    updatedAt: Date;
    createdBy: string;
    isCompleted(): boolean;
    isInProgress(): boolean;
}
//# sourceMappingURL=VehicleMaintenance.entity.d.ts.map
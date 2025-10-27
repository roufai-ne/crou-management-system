/**
 * FICHIER: packages\database\src\entities\VehicleUsage.entity.ts
 * ENTITÉ: VehicleUsage - Utilisation des véhicules
 *
 * DESCRIPTION:
 * Entité pour tracer l'utilisation des véhicules
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
export declare enum UsageType {
    TRANSPORT_ETUDIANTS = "transport_etudiants",// Transport étudiants
    MISSION = "mission",// Mission officielle
    MAINTENANCE = "maintenance",// Déplacement maintenance
    PERSONNEL = "personnel"
}
export declare class VehicleUsage {
    id: string;
    vehicleId: string;
    vehicle: Vehicle;
    tenantId: string;
    tenant: Tenant;
    description: string;
    type: UsageType;
    kilometrageDebut: number;
    kilometrageFin: number;
    kilometrageParcouru: number;
    conducteur: string;
    dateDebut: Date;
    dateFin: Date;
    createdAt: Date;
    updatedAt: Date;
    createdBy: string;
    calculateKilometers(): number;
}
//# sourceMappingURL=VehicleUsage.entity.d.ts.map
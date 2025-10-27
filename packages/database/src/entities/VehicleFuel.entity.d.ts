/**
 * FICHIER: packages\database\src\entities\VehicleFuel.entity.ts
 * ENTITÉ: VehicleFuel - Consommation de carburant
 *
 * DESCRIPTION:
 * Entité pour tracer la consommation de carburant des véhicules
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
export declare enum FuelType {
    ESSENCE = "essence",// Essence
    DIESEL = "diesel",// Diesel
    GPL = "gpl",// GPL
    ELECTRIQUE = "electrique"
}
export declare class VehicleFuel {
    id: string;
    vehicleId: string;
    vehicle: Vehicle;
    tenantId: string;
    tenant: Tenant;
    type: FuelType;
    quantite: number;
    prixUnitaire: number;
    montantTotal: number;
    devise: string;
    station: string;
    adresseStation: string;
    kilometrage: number;
    date: Date;
    createdAt: Date;
    updatedAt: Date;
    createdBy: string;
    calculateTotalAmount(): number;
}
//# sourceMappingURL=VehicleFuel.entity.d.ts.map
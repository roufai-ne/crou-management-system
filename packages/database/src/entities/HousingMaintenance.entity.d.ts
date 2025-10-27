/**
 * FICHIER: packages\database\src\entities\HousingMaintenance.entity.ts
 * ENTITÉ: HousingMaintenance - Maintenance des logements
 *
 * DESCRIPTION:
 * Entité pour gérer la maintenance des logements et chambres
 *
 * RELATIONS:
 * - ManyToOne avec Housing (logement)
 * - ManyToOne avec Room (chambre, optionnel)
 * - ManyToOne avec Tenant (CROU)
 *
 * AUTEUR: Équipe CROU
 * DATE: Décembre 2024
 */
import { Housing } from './Housing.entity';
import { Room } from './Room.entity';
import { Tenant } from './Tenant.entity';
export declare enum MaintenanceType {
    PREVENTIVE = "preventive",// Maintenance préventive
    CORRECTIVE = "corrective",// Maintenance corrective
    URGENTE = "urgente"
}
export declare enum MaintenanceStatus {
    PLANNED = "planned",// Planifiée
    IN_PROGRESS = "in_progress",// En cours
    COMPLETED = "completed",// Terminée
    CANCELLED = "cancelled"
}
export declare class HousingMaintenance {
    id: string;
    housingId: string;
    housing: Housing;
    roomId: string;
    room: Room;
    tenantId: string;
    tenant: Tenant;
    title: string;
    description: string;
    type: MaintenanceType;
    status: MaintenanceStatus;
    coutEstime: number;
    coutReel: number;
    devise: string;
    dateDebut: Date;
    dateFin: Date;
    prestataire: string;
    createdAt: Date;
    updatedAt: Date;
    createdBy: string;
    isCompleted(): boolean;
    isInProgress(): boolean;
}
//# sourceMappingURL=HousingMaintenance.entity.d.ts.map
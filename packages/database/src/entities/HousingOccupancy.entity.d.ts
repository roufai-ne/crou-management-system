/**
 * FICHIER: packages\database\src\entities\HousingOccupancy.entity.ts
 * ENTITÉ: HousingOccupancy - Occupations des logements
 *
 * DESCRIPTION:
 * Entité pour gérer les occupations des chambres
 * Suivi des étudiants et des paiements
 *
 * RELATIONS:
 * - ManyToOne avec Housing (logement)
 * - ManyToOne avec Room (chambre)
 * - ManyToOne avec Tenant (CROU)
 *
 * AUTEUR: Équipe CROU
 * DATE: Décembre 2024
 */
import { Housing } from './Housing.entity';
import { Room } from './Room.entity';
import { Tenant } from './Tenant.entity';
export declare enum OccupancyStatus {
    ACTIVE = "active",// Occupation active
    TERMINATED = "terminated",// Occupation terminée
    SUSPENDED = "suspended"
}
export declare class HousingOccupancy {
    id: string;
    housingId: string;
    housing: Housing;
    roomId: string;
    room: Room;
    tenantId: string;
    tenant: Tenant;
    nom: string;
    prenom: string;
    email: string;
    telephone: string;
    numeroEtudiant: string;
    universite: string;
    filiere: string;
    dateDebut: Date;
    dateFin: Date;
    status: OccupancyStatus;
    loyerMensuel: number;
    caution: number;
    devise: string;
    createdAt: Date;
    updatedAt: Date;
    createdBy: string;
    isActive(): boolean;
    getFullName(): string;
}
//# sourceMappingURL=HousingOccupancy.entity.d.ts.map
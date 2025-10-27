/**
 * FICHIER: packages\database\src\entities\Room.entity.ts
 * ENTITÉ: Room - Chambres des logements CROU
 *
 * DESCRIPTION:
 * Entité pour la gestion des chambres individuelles
 * Gestion des lits, occupations et maintenance
 *
 * RELATIONS:
 * - ManyToOne avec Housing (logement parent)
 * - OneToMany avec HousingOccupancy (occupations)
 * - OneToMany avec HousingMaintenance (maintenance)
 *
 * TYPES DE CHAMBRES:
 * - Simple: 1 lit
 * - Double: 2 lits
 * - Triple: 3 lits
 * - Quadruple: 4 lits
 *
 * AUTEUR: Équipe CROU
 * DATE: Décembre 2024
 */
import { Housing } from './Housing.entity';
import { HousingOccupancy } from './HousingOccupancy.entity';
import { HousingMaintenance } from './HousingMaintenance.entity';
export declare enum RoomType {
    SIMPLE = "simple",// 1 lit
    DOUBLE = "double",// 2 lits
    TRIPLE = "triple",// 3 lits
    QUADRUPLE = "quadruple"
}
export declare enum RoomStatus {
    DISPONIBLE = "disponible",// Disponible
    OCCUPE = "occupe",// Occupée
    MAINTENANCE = "maintenance",// En maintenance
    HORS_SERVICE = "hors_service"
}
export declare class Room {
    id: string;
    housingId: string;
    housing: Housing;
    numero: string;
    etage: string;
    batiment: string;
    type: RoomType;
    status: RoomStatus;
    capacite: number;
    occupation: number;
    tauxOccupation: number;
    equipements: string[];
    climatisation: boolean;
    chauffage: boolean;
    wifi: boolean;
    balcon: boolean;
    salleDeBain: boolean;
    cuisine: boolean;
    loyerMensuel: number;
    caution: number;
    devise: string;
    dateDerniereMaintenance: Date;
    dateProchaineMaintenance: Date;
    isActif: boolean;
    notes: string;
    createdAt: Date;
    updatedAt: Date;
    createdBy: string;
    updatedBy: string;
    occupancies: HousingOccupancy[];
    maintenances: HousingMaintenance[];
    /**
     * Calculer le taux d'occupation
     */
    calculateOccupancyRate(): number;
    /**
     * Calculer le nombre de lits disponibles
     */
    calculateAvailableBeds(): number;
    /**
     * Mettre à jour les calculs
     */
    updateCalculations(): void;
    /**
     * Vérifier si la chambre est disponible
     */
    isAvailable(): boolean;
    /**
     * Vérifier si la chambre est complète
     */
    isFull(): boolean;
    /**
     * Vérifier si la chambre est en maintenance
     */
    isInMaintenance(): boolean;
    /**
     * Vérifier si la chambre est hors service
     */
    isOutOfService(): boolean;
    /**
     * Ajouter un occupant
     */
    addOccupant(): boolean;
    /**
     * Retirer un occupant
     */
    removeOccupant(): boolean;
    /**
     * Obtenir le type formaté
     */
    getTypeLabel(): string;
    /**
     * Obtenir le statut formaté
     */
    getStatusLabel(): string;
    /**
     * Obtenir le numéro complet de la chambre
     */
    getFullNumber(): string;
    /**
     * Obtenir la description de la chambre
     */
    getDescription(): string;
}
//# sourceMappingURL=Room.entity.d.ts.map
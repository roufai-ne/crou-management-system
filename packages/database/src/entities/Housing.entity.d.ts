/**
 * FICHIER: packages\database\src\entities\Housing.entity.ts
 * ENTITÉ: Housing - Gestion des logements CROU
 *
 * DESCRIPTION:
 * Entité pour la gestion des cités universitaires et logements
 * Support multi-tenant avec tenant_id
 * Gestion des chambres, occupations et maintenance
 *
 * RELATIONS:
 * - ManyToOne avec Tenant (CROU)
 * - OneToMany avec Room (chambres)
 * - OneToMany avec HousingOccupancy (occupations)
 * - OneToMany avec HousingMaintenance (maintenance)
 *
 * TYPES DE LOGEMENTS:
 * - Cité universitaire
 * - Résidence étudiante
 * - Foyer
 * - Logement personnel
 *
 * AUTEUR: Équipe CROU
 * DATE: Décembre 2024
 */
import { Tenant } from './Tenant.entity';
import { Room } from './Room.entity';
import { HousingOccupancy } from './HousingOccupancy.entity';
import { HousingMaintenance } from './HousingMaintenance.entity';
export declare enum HousingType {
    CITE_UNIVERSITAIRE = "cite_universitaire",// Cité universitaire
    RESIDENCE = "residence",// Résidence étudiante
    FOYER = "foyer",// Foyer
    LOGEMENT_PERSONNEL = "logement_personnel"
}
export declare enum HousingStatus {
    ACTIF = "actif",// Actif
    INACTIF = "inactif",// Inactif
    EN_CONSTRUCTION = "en_construction",// En construction
    EN_RENOVATION = "en_renovation",// En rénovation
    FERME = "ferme"
}
export declare enum HousingCategory {
    STANDARD = "standard",// Standard
    CONFORT = "confort",// Confort
    LUXE = "luxe",// Luxe
    HANDICAPE = "handicape"
}
export declare class Housing {
    id: string;
    tenantId: string;
    tenant: Tenant;
    code: string;
    nom: string;
    description: string;
    type: HousingType;
    category: HousingCategory;
    status: HousingStatus;
    adresse: string;
    ville: string;
    region: string;
    codePostal: string;
    latitude: number;
    longitude: number;
    nombreChambres: number;
    capaciteTotale: number;
    occupationActuelle: number;
    tauxOccupation: number;
    loyerMensuel: number;
    caution: number;
    devise: string;
    equipements: string[];
    services: string[];
    wifi: boolean;
    climatisation: boolean;
    chauffage: boolean;
    cuisine: boolean;
    laverie: boolean;
    parking: boolean;
    securite: boolean;
    dateConstruction: Date;
    dateRenovation: Date;
    dateOuverture: Date;
    dateFermeture: Date;
    isActif: boolean;
    maintenanceProgrammee: boolean;
    notes: string;
    createdAt: Date;
    updatedAt: Date;
    createdBy: string;
    updatedBy: string;
    rooms: Room[];
    occupancies: HousingOccupancy[];
    maintenances: HousingMaintenance[];
    /**
     * Calculer le taux d'occupation
     */
    calculateOccupancyRate(): number;
    /**
     * Calculer le nombre de chambres disponibles
     */
    calculateAvailableRooms(): number;
    /**
     * Calculer le nombre de lits disponibles
     */
    calculateAvailableBeds(): number;
    /**
     * Mettre à jour les calculs
     */
    updateCalculations(): void;
    /**
     * Vérifier si le logement est disponible
     */
    isAvailable(): boolean;
    /**
     * Vérifier si le logement est en maintenance
     */
    isInMaintenance(): boolean;
    /**
     * Vérifier si le logement est complet
     */
    isFull(): boolean;
    /**
     * Obtenir le type formaté
     */
    getTypeLabel(): string;
    /**
     * Obtenir la catégorie formatée
     */
    getCategoryLabel(): string;
    /**
     * Obtenir le statut formaté
     */
    getStatusLabel(): string;
    /**
     * Obtenir l'adresse complète
     */
    getFullAddress(): string;
}
//# sourceMappingURL=Housing.entity.d.ts.map
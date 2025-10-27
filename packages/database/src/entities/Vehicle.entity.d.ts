/**
 * FICHIER: packages\database\src\entities\Vehicle.entity.ts
 * ENTITÉ: Vehicle - Gestion du parc véhicules CROU
 *
 * DESCRIPTION:
 * Entité pour la gestion du parc de véhicules
 * Support multi-tenant avec tenant_id
 * Gestion de la maintenance et des coûts
 *
 * RELATIONS:
 * - ManyToOne avec Tenant (CROU ou Ministère)
 * - OneToMany avec VehicleMaintenance (maintenance)
 * - OneToMany avec VehicleUsage (utilisation)
 * - OneToMany avec VehicleFuel (carburant)
 *
 * TYPES DE VÉHICULES:
 * - Bus: Transport collectif
 * - Minibus: Transport moyen
 * - Utilitaire: Transport de marchandises
 * - Voiture: Transport personnel
 *
 * AUTEUR: Équipe CROU
 * DATE: Décembre 2024
 */
import { Tenant } from './Tenant.entity';
import { VehicleMaintenance } from './VehicleMaintenance.entity';
import { VehicleUsage } from './VehicleUsage.entity';
import { VehicleFuel } from './VehicleFuel.entity';
export declare enum VehicleType {
    BUS = "bus",// Bus de transport
    MINIBUS = "minibus",// Minibus
    UTILITAIRE = "utilitaire",// Véhicule utilitaire
    VOITURE = "voiture",// Voiture de service
    MOTO = "moto",// Moto
    VELO = "velo"
}
export declare enum VehicleStatus {
    ACTIF = "actif",// Actif
    HORS_SERVICE = "hors_service",// Hors service
    EN_MAINTENANCE = "en_maintenance",// En maintenance
    EN_PANNE = "en_panne",// En panne
    VENDU = "vendu",// Vendu
    CASSE = "casse"
}
export declare enum FuelType {
    ESSENCE = "essence",// Essence
    DIESEL = "diesel",// Diesel
    GPL = "gpl",// GPL
    ELECTRIQUE = "electrique",// Électrique
    HYBRIDE = "hybride"
}
export declare class Vehicle {
    id: string;
    tenantId: string;
    tenant: Tenant;
    immatriculation: string;
    marque: string;
    modele: string;
    version: string;
    type: VehicleType;
    status: VehicleStatus;
    annee: number;
    couleur: string;
    numeroChassis: string;
    numeroMoteur: string;
    cylindree: number;
    puissance: number;
    typeCarburant: FuelType;
    capacitePassagers: number;
    capaciteCharge: number;
    kilometrageActuel: number;
    kilometrageAchat: number;
    kilometrageMaintenance: number;
    kilometrageRevision: number;
    prixAchat: number;
    valeurActuelle: number;
    consommationMoyenne: number;
    devise: string;
    compagnieAssurance: string;
    numeroAssurance: string;
    dateExpirationAssurance: Date;
    dateExpirationControle: Date;
    dateExpirationVignette: Date;
    dateAchat: Date;
    dateMiseEnService: Date;
    dateDerniereMaintenance: Date;
    dateProchaineMaintenance: Date;
    isActif: boolean;
    maintenanceProgrammee: boolean;
    notes: string;
    createdAt: Date;
    updatedAt: Date;
    createdBy: string;
    updatedBy: string;
    maintenances: VehicleMaintenance[];
    usages: VehicleUsage[];
    fuels: VehicleFuel[];
    /**
     * Vérifier si le véhicule est disponible
     */
    isAvailable(): boolean;
    /**
     * Vérifier si le véhicule est en maintenance
     */
    isInMaintenance(): boolean;
    /**
     * Vérifier si le véhicule est hors service
     */
    isOutOfService(): boolean;
    /**
     * Vérifier si l'assurance est expirée
     */
    isInsuranceExpired(): boolean;
    /**
     * Vérifier si le contrôle technique est expiré
     */
    isControlExpired(): boolean;
    /**
     * Vérifier si la vignette est expirée
     */
    isVignetteExpired(): boolean;
    /**
     * Vérifier si la maintenance est due
     */
    isMaintenanceDue(): boolean;
    /**
     * Calculer le kilométrage parcouru depuis l'achat
     */
    calculateTotalKilometers(): number;
    /**
     * Calculer le kilométrage depuis la dernière maintenance
     */
    calculateKilometersSinceMaintenance(): number;
    /**
     * Obtenir le type formaté
     */
    getTypeLabel(): string;
    /**
     * Obtenir le statut formaté
     */
    getStatusLabel(): string;
    /**
     * Obtenir le type de carburant formaté
     */
    getFuelTypeLabel(): string;
    /**
     * Obtenir la description complète
     */
    getDescription(): string;
}
//# sourceMappingURL=Vehicle.entity.d.ts.map
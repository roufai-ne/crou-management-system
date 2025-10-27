/**
 * FICHIER: packages\database\src\entities\Stock.entity.ts
 * ENTITÉ: Stock - Gestion des stocks CROU
 *
 * DESCRIPTION:
 * Entité pour la gestion des stocks et inventaires
 * Support multi-tenant avec tenant_id
 * Gestion des seuils et alertes automatiques
 * Valorisation et traçabilité des mouvements
 *
 * RELATIONS:
 * - ManyToOne avec Tenant (CROU ou Ministère)
 * - OneToMany avec StockMovement (mouvements)
 * - OneToMany avec StockAlert (alertes)
 *
 * TYPES DE STOCKS:
 * - Centralisé: Céréales, équipements (Ministère)
 * - Local: Denrées périssables, fournitures (CROU)
 *
 * AUTEUR: Équipe CROU
 * DATE: Décembre 2024
 */
import { Tenant } from './Tenant.entity';
import { StockMovement } from './StockMovement.entity';
import { StockAlert } from './StockAlert.entity';
export declare enum StockType {
    CENTRALISE = "centralise",// Stocks centralisés (Ministère)
    LOCAL = "local"
}
export declare enum StockCategory {
    CEREALES = "cereales",// Riz, mil, sorgho, maïs, niébé
    DENREES = "denrees",// Denrées périssables
    FOURNITURES = "fournitures",// Fournitures de bureau
    EQUIPEMENTS = "equipements",// Équipements et mobilier
    VEHICULES = "vehicules",// Véhicules et transport
    MAINTENANCE = "maintenance"
}
export declare enum StockUnit {
    KG = "kg",// Kilogrammes
    TONNE = "tonne",// Tonnes
    LITRE = "litre",// Litres
    UNITE = "unite",// Unités
    CARTON = "carton",// Cartons
    SAC = "sac",// Sacs
    BOUTEILLE = "bouteille"
}
export declare enum StockStatus {
    ACTIF = "actif",// Stock actif
    INACTIF = "inactif",// Stock inactif
    OBSOLETE = "obsolete",// Stock obsolète
    EN_RUPTURE = "en_rupture"
}
export declare class Stock {
    id: string;
    tenantId: string;
    tenant: Tenant;
    code: string;
    libelle: string;
    description: string;
    type: StockType;
    category: StockCategory;
    unit: StockUnit;
    status: StockStatus;
    quantiteActuelle: number;
    quantiteReservee: number;
    quantiteDisponible: number;
    seuilMinimum: number;
    seuilMaximum: number;
    quantiteCommande: number;
    prixUnitaire: number;
    valeurStock: number;
    devise: string;
    fournisseur: string;
    referenceFournisseur: string;
    dateDerniereEntree: Date;
    dateDerniereSortie: Date;
    datePeremption: Date;
    isPerissable: boolean;
    dureeConservation: number;
    isControle: boolean;
    isActif: boolean;
    enAlerte: boolean;
    enRupture: boolean;
    approvisionnementUrgent: boolean;
    createdAt: Date;
    updatedAt: Date;
    createdBy: string;
    updatedBy: string;
    movements: StockMovement[];
    alerts: StockAlert[];
    /**
     * Calculer la quantité disponible
     */
    calculateAvailableQuantity(): number;
    /**
     * Calculer la valeur du stock
     */
    calculateStockValue(): number;
    /**
     * Vérifier si le stock est en alerte
     */
    checkAlert(): boolean;
    /**
     * Vérifier si le stock est en rupture
     */
    checkRupture(): boolean;
    /**
     * Vérifier si l'approvisionnement est urgent
     */
    checkUrgentReplenishment(): boolean;
    /**
     * Mettre à jour tous les calculs
     */
    updateCalculations(): void;
    /**
     * Ajouter de la quantité au stock
     */
    addQuantity(quantity: number, unitPrice?: number): void;
    /**
     * Retirer de la quantité du stock
     */
    removeQuantity(quantity: number): boolean;
    /**
     * Réserver de la quantité
     */
    reserveQuantity(quantity: number): boolean;
    /**
     * Libérer la quantité réservée
     */
    releaseReservedQuantity(quantity: number): void;
    /**
     * Vérifier si le produit est périmé
     */
    isExpired(): boolean;
    /**
     * Obtenir le statut formaté
     */
    getStatusLabel(): string;
    /**
     * Obtenir la catégorie formatée
     */
    getCategoryLabel(): string;
}
//# sourceMappingURL=Stock.entity.d.ts.map
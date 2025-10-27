/**
 * FICHIER: packages\database\src\entities\StockMovement.entity.ts
 * ENTITÉ: StockMovement - Mouvements de stock
 *
 * DESCRIPTION:
 * Entité pour tracer tous les mouvements de stock
 * Entrées, sorties, ajustements, transferts
 * Traçabilité complète avec justificatifs
 *
 * RELATIONS:
 * - ManyToOne avec Stock (produit concerné)
 * - ManyToOne avec Tenant (contexte)
 * - ManyToOne avec User (utilisateur)
 *
 * TYPES DE MOUVEMENTS:
 * - Entrée: Réception de marchandises
 * - Sortie: Distribution ou vente
 * - Ajustement: Correction d'inventaire
 * - Transfert: Mouvement entre CROU
 *
 * AUTEUR: Équipe CROU
 * DATE: Décembre 2024
 */
import { Stock } from './Stock.entity';
import { Tenant } from './Tenant.entity';
import { User } from './User.entity';
export declare enum MovementType {
    ENTREE = "entree",// Entrée de stock
    SORTIE = "sortie",// Sortie de stock
    AJUSTEMENT = "ajustement",// Ajustement d'inventaire
    TRANSFERT = "transfert",// Transfert entre CROU
    PERTE = "perte",// Perte ou casse
    RETOUR = "retour"
}
export declare enum MovementReason {
    RECEPTION = "reception",// Réception de commande
    DON = "don",// Don ou subvention
    TRANSFERT_ENTREE = "transfert_entree",// Transfert entrant
    INVENTAIRE_PLUS = "inventaire_plus",// Ajustement inventaire (+)
    DISTRIBUTION = "distribution",// Distribution aux étudiants
    VENTE = "vente",// Vente de tickets
    CONSOMMATION = "consommation",// Consommation interne
    TRANSFERT_SORTIE = "transfert_sortie",// Transfert sortant
    MAINTENANCE = "maintenance",// Utilisation maintenance
    INVENTAIRE_MOINS = "inventaire_moins",// Ajustement inventaire (-)
    PERTE = "perte",// Perte ou casse
    VOL = "vol",// Vol ou détournement
    PERTE_QUALITE = "perte_qualite",// Perte qualité
    RETOUR_FOURNISSEUR = "retour_fournisseur"
}
export declare enum MovementStatus {
    DRAFT = "draft",// Brouillon
    CONFIRMED = "confirmed",// Confirmé
    CANCELLED = "cancelled"
}
export declare class StockMovement {
    id: string;
    stockId: string;
    stock: Stock;
    tenantId: string;
    tenant: Tenant;
    numero: string;
    libelle: string;
    description: string;
    type: MovementType;
    reason: MovementReason;
    status: MovementStatus;
    quantite: number;
    quantiteAvant: number;
    quantiteApres: number;
    unit: string;
    prixUnitaire: number;
    valeurTotale: number;
    devise: string;
    numeroBon: string;
    numeroFacture: string;
    fournisseur: string;
    beneficiaire: string;
    destinataire: string;
    date: Date;
    dateConfirmation: Date;
    createdBy: string;
    creator: User;
    confirmedBy: string;
    updatedBy: string;
    createdAt: Date;
    updatedAt: Date;
    /**
     * Vérifier si le mouvement peut être modifié
     */
    canBeModified(): boolean;
    /**
     * Vérifier si le mouvement peut être confirmé
     */
    canBeConfirmed(): boolean;
    /**
     * Confirmer le mouvement
     */
    confirm(confirmedBy: string): void;
    /**
     * Annuler le mouvement
     */
    cancel(): void;
    /**
     * Calculer la valeur totale
     */
    calculateTotalValue(): number;
    /**
     * Mettre à jour les calculs
     */
    updateCalculations(): void;
    /**
     * Obtenir le signe de la quantité selon le type
     */
    getSignedQuantity(): number;
    /**
     * Vérifier si c'est une entrée
     */
    isEntry(): boolean;
    /**
     * Vérifier si c'est une sortie
     */
    isExit(): boolean;
    /**
     * Obtenir le type formaté
     */
    getTypeLabel(): string;
    /**
     * Obtenir le motif formaté
     */
    getReasonLabel(): string;
}
//# sourceMappingURL=StockMovement.entity.d.ts.map
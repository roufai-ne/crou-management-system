/**
 * FICHIER: packages\database\src\entities\StockAlert.entity.ts
 * ENTITÉ: StockAlert - Alertes de stock
 *
 * DESCRIPTION:
 * Entité pour gérer les alertes de stock automatiques
 * Seuils, ruptures, péremption, approvisionnement
 * Notifications et escalade
 *
 * RELATIONS:
 * - ManyToOne avec Stock (produit concerné)
 * - ManyToOne avec Tenant (contexte)
 * - ManyToOne avec User (créateur)
 *
 * TYPES D'ALERTES:
 * - Seuil minimum atteint
 * - Rupture de stock
 * - Approvisionnement urgent
 * - Péremption proche
 * - Surstock
 *
 * AUTEUR: Équipe CROU
 * DATE: Décembre 2024
 */
import { Stock } from './Stock.entity';
import { Tenant } from './Tenant.entity';
import { User } from './User.entity';
export declare enum AlertType {
    SEUIL_MINIMUM = "seuil_minimum",// Seuil minimum atteint
    RUPTURE = "rupture",// Rupture de stock
    URGENT = "urgent",// Approvisionnement urgent
    PEREMPTION = "peremption",// Péremption proche
    SURSTOCK = "surstock",// Surstock
    QUALITE = "qualite"
}
export declare enum AlertPriority {
    LOW = "low",// Faible
    MEDIUM = "medium",// Moyenne
    HIGH = "high",// Élevée
    CRITICAL = "critical"
}
export declare enum AlertStatus {
    ACTIVE = "active",// Active
    ACKNOWLEDGED = "acknowledged",// Reconnue
    RESOLVED = "resolved",// Résolue
    CANCELLED = "cancelled"
}
export declare class StockAlert {
    id: string;
    stockId: string;
    stock: Stock;
    tenantId: string;
    tenant: Tenant;
    type: AlertType;
    priority: AlertPriority;
    status: AlertStatus;
    title: string;
    message: string;
    description: string;
    quantiteActuelle: number;
    seuil: number;
    joursRestants: number;
    actionRecommandee: string;
    actionEffectuee: string;
    resolvedBy: string;
    resolvedAt: Date;
    resolutionNote: string;
    emailSent: boolean;
    smsSent: boolean;
    inAppSent: boolean;
    lastNotificationSent: Date;
    escalated: boolean;
    escalatedTo: string;
    escalatedAt: Date;
    createdBy: string;
    creator: User;
    updatedBy: string;
    createdAt: Date;
    updatedAt: Date;
    /**
     * Vérifier si l'alerte est active
     */
    isActive(): boolean;
    /**
     * Vérifier si l'alerte est résolue
     */
    isResolved(): boolean;
    /**
     * Vérifier si l'alerte est critique
     */
    isCritical(): boolean;
    /**
     * Reconnaître l'alerte
     */
    acknowledge(): void;
    /**
     * Résoudre l'alerte
     */
    resolve(resolvedBy: string, note?: string): void;
    /**
     * Annuler l'alerte
     */
    cancel(): void;
    /**
     * Escalader l'alerte
     */
    escalate(escalatedTo: string): void;
    /**
     * Marquer les notifications comme envoyées
     */
    markNotificationsSent(email?: boolean, sms?: boolean, inApp?: boolean): void;
    /**
     * Obtenir le type formaté
     */
    getTypeLabel(): string;
    /**
     * Obtenir la priorité formatée
     */
    getPriorityLabel(): string;
    /**
     * Obtenir le statut formaté
     */
    getStatusLabel(): string;
    /**
     * Obtenir la couleur de priorité
     */
    getPriorityColor(): string;
    /**
     * Calculer l'âge de l'alerte en heures
     */
    getAgeInHours(): number;
    /**
     * Vérifier si l'alerte doit être escaladée
     */
    shouldEscalate(): boolean;
}
//# sourceMappingURL=StockAlert.entity.d.ts.map
/**
 * FICHIER: packages\database\src\entities\WorkflowAction.entity.ts
 * ENTITÉ: WorkflowAction - Action de workflow
 * 
 * DESCRIPTION:
 * Entité pour enregistrer les actions effectuées
 * Historique complet des validations
 * Support multi-tenant avec traçabilité
 * 
 * FONCTIONNALITÉS:
 * - Enregistrement des actions utilisateur
 * - Historique des validations et rejets
 * - Gestion des délégations et escalades
 * - Traçabilité complète des décisions
 * 
 * AUTEUR: Équipe CROU
 * DATE: Décembre 2024
 */

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index
} from 'typeorm';
import { WorkflowInstance } from './WorkflowInstance.entity';

// Types pour les actions
export enum ActionType {
  APPROVE = 'approve',       // Approbation
  REJECT = 'reject',         // Rejet
  DELEGATE = 'delegate',     // Délégation
  ESCALATE = 'escalate',     // Escalade
  SKIP = 'skip',             // Ignorer
  COMMENT = 'comment',       // Commentaire
  ASSIGN = 'assign',         // Assignment
  CANCEL = 'cancel',         // Annulation
  EXPIRE = 'expire',         // Expiration
  START = 'start',           // Démarrage
  COMPLETE = 'complete'      // Finalisation
}

export enum ActionStatus {
  PENDING = 'pending',       // En attente
  PROCESSING = 'processing', // En cours de traitement
  COMPLETED = 'completed',   // Terminée
  FAILED = 'failed'          // Échouée
}

@Entity('workflow_actions')
@Index(['instanceId', 'createdAt'])
@Index(['instanceId', 'type'])
@Index(['userId', 'createdAt'])
export class WorkflowAction {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'instance_id' })
  instanceId: string;

  @Column({
    type: 'enum',
    enum: ActionType
  })
  type: ActionType;

  @Column({
    type: 'enum',
    enum: ActionStatus,
    default: ActionStatus.COMPLETED
  })
  status: ActionStatus;

  @Column({ type: 'varchar', length: 255 })
  title: string; // Titre de l'action

  @Column({ type: 'text', nullable: true })
  description: string; // Description de l'action

  @Column({ type: 'text', nullable: true })
  comment: string; // Commentaire de l'utilisateur

  @Column({ type: 'jsonb', nullable: true })
  data: any; // Données supplémentaires

  @Column({ type: 'jsonb', nullable: true })
  metadata: any; // Métadonnées

  @Column({ type: 'uuid' })
  userId: string; // Utilisateur qui a effectué l'action

  @Column({ type: 'varchar', length: 255, nullable: true })
  userRole: string; // Rôle de l'utilisateur

  @Column({ type: 'varchar', length: 255, nullable: true })
  userName: string; // Nom de l'utilisateur

  @Column({ type: 'uuid', nullable: true })
  targetUserId: string; // Utilisateur cible (pour délégation, assignment)

  @Column({ type: 'varchar', length: 255, nullable: true })
  targetUserRole: string; // Rôle de l'utilisateur cible

  @Column({ type: 'varchar', length: 255, nullable: true })
  targetUserName: string; // Nom de l'utilisateur cible

  @Column({ type: 'timestamp', nullable: true })
  processedAt: Date; // Date de traitement

  @Column({ type: 'varchar', length: 500, nullable: true })
  errorMessage: string; // Message d'erreur si échec

  @Column({ type: 'uuid', name: 'tenant_id' })
  tenantId: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  // Relations
  @ManyToOne(() => WorkflowInstance, instance => instance.actions, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'instance_id' })
  instance: WorkflowInstance;

  // Méthodes métier
  /**
   * Marquer l'action comme en cours de traitement
   */
  markAsProcessing(): void {
    this.status = ActionStatus.PROCESSING;
  }

  /**
   * Marquer l'action comme terminée
   */
  markAsCompleted(): void {
    this.status = ActionStatus.COMPLETED;
    this.processedAt = new Date();
  }

  /**
   * Marquer l'action comme échouée
   */
  markAsFailed(errorMessage: string): void {
    this.status = ActionStatus.FAILED;
    this.errorMessage = errorMessage;
    this.processedAt = new Date();
  }

  /**
   * Vérifier si l'action est terminée
   */
  isCompleted(): boolean {
    return this.status === ActionStatus.COMPLETED;
  }

  /**
   * Vérifier si l'action a échoué
   */
  isFailed(): boolean {
    return this.status === ActionStatus.FAILED;
  }

  /**
   * Vérifier si l'action est en cours
   */
  isProcessing(): boolean {
    return this.status === ActionStatus.PROCESSING;
  }

  /**
   * Vérifier si l'action est en attente
   */
  isPending(): boolean {
    return this.status === ActionStatus.PENDING;
  }

  /**
   * Obtenir les données de l'action
   */
  getData(): any {
    return this.data || {};
  }

  /**
   * Mettre à jour les données
   */
  updateData(newData: any): void {
    this.data = { ...this.data, ...newData };
  }

  /**
   * Obtenir les métadonnées
   */
  getMetadata(): any {
    return this.metadata || {};
  }

  /**
   * Mettre à jour les métadonnées
   */
  updateMetadata(newMetadata: any): void {
    this.metadata = { ...this.metadata, ...newMetadata };
  }

  /**
   * Obtenir la durée de traitement en millisecondes
   */
  getProcessingTime(): number | null {
    if (!this.processedAt) {
      return null;
    }

    return this.processedAt.getTime() - this.createdAt.getTime();
  }

  /**
   * Obtenir la durée de traitement en minutes
   */
  getProcessingTimeMinutes(): number | null {
    const time = this.getProcessingTime();
    return time ? time / (1000 * 60) : null;
  }

  /**
   * Vérifier si l'action est une approbation
   */
  isApproval(): boolean {
    return this.type === ActionType.APPROVE;
  }

  /**
   * Vérifier si l'action est un rejet
   */
  isRejection(): boolean {
    return this.type === ActionType.REJECT;
  }

  /**
   * Vérifier si l'action est une délégation
   */
  isDelegation(): boolean {
    return this.type === ActionType.DELEGATE;
  }

  /**
   * Vérifier si l'action est une escalade
   */
  isEscalation(): boolean {
    return this.type === ActionType.ESCALATE;
  }

  /**
   * Vérifier si l'action est un commentaire
   */
  isComment(): boolean {
    return this.type === ActionType.COMMENT;
  }

  /**
   * Obtenir le message de l'action
   */
  getMessage(): string {
    const messages = {
      [ActionType.APPROVE]: 'Approuvé',
      [ActionType.REJECT]: 'Rejeté',
      [ActionType.DELEGATE]: 'Délégué',
      [ActionType.ESCALATE]: 'Escaladé',
      [ActionType.SKIP]: 'Ignoré',
      [ActionType.COMMENT]: 'Commenté',
      [ActionType.ASSIGN]: 'Assigné',
      [ActionType.CANCEL]: 'Annulé',
      [ActionType.EXPIRE]: 'Expiré',
      [ActionType.START]: 'Démarré',
      [ActionType.COMPLETE]: 'Terminé'
    };

    return messages[this.type] || 'Action inconnue';
  }

  /**
   * Obtenir le message complet de l'action
   */
  getFullMessage(): string {
    let message = this.getMessage();
    
    if (this.comment) {
      message += `: ${this.comment}`;
    }
    
    if (this.targetUserName) {
      message += ` vers ${this.targetUserName}`;
    }
    
    return message;
  }

  /**
   * Obtenir l'utilisateur cible
   */
  getTargetUser(): { id: string; name: string; role: string } | null {
    if (!this.targetUserId) {
      return null;
    }

    return {
      id: this.targetUserId,
      name: this.targetUserName || 'Utilisateur inconnu',
      role: this.targetUserRole || 'Rôle inconnu'
    };
  }

  /**
   * Obtenir l'utilisateur qui a effectué l'action
   */
  getUser(): { id: string; name: string; role: string } {
    return {
      id: this.userId,
      name: this.userName || 'Utilisateur inconnu',
      role: this.userRole || 'Rôle inconnu'
    };
  }
}

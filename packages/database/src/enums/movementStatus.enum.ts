/**
 * FICHIER: packages/database/src/enums/movementStatus.enum.ts
 * ENUMS: Énumérations pour les statuts de mouvement
 * 
 * DESCRIPTION:
 * Définit les statuts des mouvements de stock
 * 
 * AUTEUR: Équipe CROU
 * DATE: Décembre 2024
 */

export enum MovementStatus {
  DRAFT = 'draft',
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled'
}
/**
 * FICHIER: packages\database\src\entities\RefreshToken.entity.ts
 * ENTITÉ: RefreshToken - Gestion sécurisée des tokens de rafraîchissement
 * 
 * DESCRIPTION:
 * Entité pour la gestion sécurisée des refresh tokens JWT
 * Permet la révocation des tokens et la rotation automatique
 * Audit trail complet pour la sécurité
 * 
 * RELATIONS:
 * - ManyToOne avec User (utilisateur propriétaire du token)
 * 
 * FONCTIONNALITÉS:
 * - Stockage sécurisé avec hash du token
 * - Gestion de l'expiration automatique
 * - Révocation manuelle et automatique
 * - Rotation des tokens pour sécurité maximale
 * - Nettoyage automatique des tokens expirés
 * 
 * SÉCURITÉ:
 * - Hash SHA-256 du token stocké (jamais le token en clair)
 * - Expiration configurable (défaut: 7 jours)
 * - Révocation en cas d'activité suspecte
 * - Limitation du nombre de tokens actifs par utilisateur
 * 
 * AUTEUR: Équipe CROU
 * DATE: Décembre 2024
 */

import { 
  Entity, 
  PrimaryGeneratedColumn, 
  Column, 
  ManyToOne,
  CreateDateColumn, 
  UpdateDateColumn,
  JoinColumn,
  BeforeInsert,
  Index
} from 'typeorm';
import { IsString, IsBoolean, IsOptional, IsDate } from 'class-validator';
import { createHash } from 'crypto';

import { User } from './User.entity';

@Entity('refresh_tokens')
@Index(['userId', 'isRevoked']) // Index pour optimiser les requêtes
@Index(['expiresAt']) // Index pour le nettoyage automatique
export class RefreshToken {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'user_id' })
  userId: string;

  @ManyToOne(() => User, {
    onDelete: 'CASCADE',
    eager: false
  })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ type: 'varchar', length: 255 })
  @IsString()
  tokenHash: string; // Hash SHA-256 du token, jamais le token en clair

  @Column({ type: 'timestamp' })
  @IsDate()
  expiresAt: Date;

  @Column({ type: 'boolean', default: false })
  @IsBoolean()
  isRevoked: boolean;

  @Column({ type: 'timestamp', nullable: true })
  @IsOptional()
  @IsDate()
  revokedAt: Date | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  @IsOptional()
  @IsString()
  revokedReason: string | null;

  @Column({ type: 'inet', nullable: true })
  @IsOptional()
  @IsString()
  ipAddress: string | null;

  @Column({ type: 'text', nullable: true })
  @IsOptional()
  @IsString()
  userAgent: string | null;

  // Audit trail
  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Méthodes utilitaires

  /**
   * Créer le hash du token avant insertion
   */
  @BeforeInsert()
  hashToken() {
    if (this.tokenHash && !this.isTokenHashed()) {
      this.tokenHash = this.createTokenHash(this.tokenHash);
    }
  }

  /**
   * Créer un hash SHA-256 du token
   */
  static createTokenHash(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  /**
   * Créer le hash du token
   */
  private createTokenHash(token: string): string {
    return RefreshToken.createTokenHash(token);
  }

  /**
   * Vérifier si le token est déjà hashé
   */
  private isTokenHashed(): boolean {
    // Un hash SHA-256 fait toujours 64 caractères hexadécimaux
    return /^[a-f0-9]{64}$/i.test(this.tokenHash);
  }

  /**
   * Vérifier si le token correspond au hash stocké
   */
  verifyToken(token: string): boolean {
    const tokenHash = this.createTokenHash(token);
    return this.tokenHash === tokenHash;
  }

  /**
   * Vérifier si le token est valide (non expiré et non révoqué)
   */
  isValid(): boolean {
    const now = new Date();
    return !this.isRevoked && this.expiresAt > now;
  }

  /**
   * Vérifier si le token est expiré
   */
  isExpired(): boolean {
    return new Date() > this.expiresAt;
  }

  /**
   * Révoquer le token
   */
  revoke(reason?: string): void {
    this.isRevoked = true;
    this.revokedAt = new Date();
    this.revokedReason = reason || 'Révoqué manuellement';
  }

  /**
   * Obtenir le temps restant avant expiration (en millisecondes)
   */
  getTimeToExpiry(): number {
    return Math.max(0, this.expiresAt.getTime() - Date.now());
  }

  /**
   * Vérifier si le token expire bientôt (dans les 24h)
   */
  expiresSoon(): boolean {
    const twentyFourHours = 24 * 60 * 60 * 1000;
    return this.getTimeToExpiry() < twentyFourHours;
  }

  /**
   * Créer un nouveau refresh token
   */
  static create(
    userId: string, 
    token: string, 
    expiresIn: number = 7 * 24 * 60 * 60 * 1000, // 7 jours par défaut
    ipAddress?: string,
    userAgent?: string
  ): RefreshToken {
    const refreshToken = new RefreshToken();
    refreshToken.userId = userId;
    refreshToken.tokenHash = token; // Sera hashé automatiquement par @BeforeInsert
    refreshToken.expiresAt = new Date(Date.now() + expiresIn);
    refreshToken.ipAddress = ipAddress || null;
    refreshToken.userAgent = userAgent || null;
    
    return refreshToken;
  }

  /**
   * Obtenir des informations de debug (sans données sensibles)
   */
  getDebugInfo(): object {
    return {
      id: this.id,
      userId: this.userId,
      isRevoked: this.isRevoked,
      isExpired: this.isExpired(),
      isValid: this.isValid(),
      expiresAt: this.expiresAt,
      createdAt: this.createdAt,
      ipAddress: this.ipAddress,
      revokedReason: this.revokedReason
    };
  }
}
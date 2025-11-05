/**
 * FICHIER: apps\api\src\modules\auth\auth.service.ts
 * SERVICE: Authentification avec base de données réelle
 * 
 * DESCRIPTION:
 * Service d'authentification utilisant les entités RBAC
 * Remplace les données mock par de vraies requêtes en base
 * Gestion complète des utilisateurs, rôles et permissions
 * 
 * FONCTIONNALITÉS:
 * - Authentification avec User, Role, Permission entities
 * - Gestion des RefreshToken sécurisés
 * - Audit trail automatique
 * - Blocage de compte après échecs
 * - Validation des permissions RBAC
 * 
 * AUTEUR: Équipe CROU
 * DATE: Décembre 2024
 */

import { AppDataSource } from '../../../../../packages/database/src/config/typeorm.config';
import { User, UserStatus } from '../../../../../packages/database/src/entities/User.entity';
import { Role } from '../../../../../packages/database/src/entities/Role.entity';
import { RefreshToken } from '../../../../../packages/database/src/entities/RefreshToken.entity';
import { AuditLog, AuditAction } from '../../../../../packages/database/src/entities/AuditLog.entity';
import jwt from 'jsonwebtoken';
import { randomBytes } from 'crypto';
import { logger } from '@/shared/utils/logger';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthResult {
  accessToken: string;
  refreshToken: string;
  user: UserProfile;
  expiresIn: number;
}

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  role: {
    id: string;
    name: string;
    tenantType: string;
  };
  tenant: {
    id: string;
    name: string;
    type: string;
  };
  permissions: string[];
  lastLoginAt: Date | null;
}

export interface TokenPayload {
  userId: string;
  email: string;
  tenantId: string;
  roleId: string;
  permissions: string[];
  iat: number;
  exp: number;
}

export class AuthService {
  private userRepository = AppDataSource.getRepository(User);
  private roleRepository = AppDataSource.getRepository(Role);
  private refreshTokenRepository = AppDataSource.getRepository(RefreshToken);
  private auditLogRepository = AppDataSource.getRepository(AuditLog);

  /**
   * Authentifier un utilisateur
   */
  async login(credentials: LoginCredentials, ipAddress?: string, userAgent?: string): Promise<AuthResult> {
    const { email, password } = credentials;

    try {
      // 1. Rechercher l'utilisateur avec ses relations
      const user = await this.userRepository.findOne({
        where: { email: email.toLowerCase() },
        relations: ['role', 'role.permissions', 'tenant']
      });

      if (!user) {
        await this.logAuthEvent('login', email, false, ipAddress, userAgent, 'Utilisateur non trouvé');
        throw new Error('Identifiants invalides');
      }

      // 2. Vérifier le statut du compte
      if (user.status !== UserStatus.ACTIVE) {
        await this.logAuthEvent('login', email, false, ipAddress, userAgent, `Compte ${user.status}`);
        throw new Error('Compte désactivé ou suspendu');
      }

      // 3. Vérifier si le compte est verrouillé
      if (user.isLocked()) {
        await this.logAuthEvent('login', email, false, ipAddress, userAgent, 'Compte verrouillé');
        throw new Error('Compte temporairement verrouillé. Réessayez plus tard.');
      }

      // 4. Vérifier le mot de passe
      const isValidPassword = await user.validatePassword(password);
      if (!isValidPassword) {
        // Incrémenter les tentatives d'échec
        user.incLoginAttempts();
        await this.userRepository.save(user);
        
        await this.logAuthEvent('login', email, false, ipAddress, userAgent, 'Mot de passe incorrect');
        throw new Error('Identifiants invalides');
      }

      // 5. Réinitialiser les tentatives de connexion
      user.resetLoginAttempts();
      user.lastLoginIp = ipAddress || '';
      await this.userRepository.save(user);

      // 6. Générer les tokens
      const { accessToken, refreshToken } = await this.generateTokens(user, ipAddress, userAgent);

      // 7. Créer le profil utilisateur
      const userProfile = this.createUserProfile(user);

      // 8. Logger la connexion réussie
      await this.logAuthEvent('login', email, true, ipAddress, userAgent, 'Connexion réussie');

      logger.info('Connexion réussie:', {
        userId: user.id,
        email: user.email,
        role: user.role?.name,
        tenant: user.tenant?.name,
        ip: ipAddress
      });

      return {
        accessToken,
        refreshToken,
        user: userProfile,
        expiresIn: this.getTokenExpirationTime()
      };

    } catch (error) {
      logger.error('Erreur lors de la connexion:', error);
      throw error;
    }
  }

  /**
   * Rafraîchir un token d'accès
   */
  async refreshAccessToken(refreshTokenString: string, ipAddress?: string): Promise<{ accessToken: string; expiresIn: number }> {
    try {
      // 1. Vérifier le format du refresh token JWT
      const refreshSecret = process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET;
      if (!refreshSecret) {
        throw new Error('JWT_REFRESH_SECRET ou JWT_SECRET doit être défini');
      }
      const decoded = jwt.verify(refreshTokenString, refreshSecret) as any;

      if (decoded.type !== 'refresh') {
        throw new Error('Type de token incorrect');
      }

      // 2. Rechercher le refresh token en base
      const tokenHash = RefreshToken.createTokenHash(refreshTokenString);
      const refreshToken = await this.refreshTokenRepository.findOne({
        where: { tokenHash },
        relations: ['user', 'user.role', 'user.role.permissions', 'user.tenant']
      });

      if (!refreshToken || !refreshToken.isValid()) {
        throw new Error('Refresh token invalide ou expiré');
      }

      // 3. Vérifier que l'utilisateur est toujours actif
      if (refreshToken.user.status !== UserStatus.ACTIVE) {
        // Révoquer le token si l'utilisateur n'est plus actif
        refreshToken.revoke('Utilisateur désactivé');
        await this.refreshTokenRepository.save(refreshToken);
        throw new Error('Utilisateur désactivé');
      }

      // 4. Générer un nouveau token d'accès
      const accessToken = this.generateAccessToken(refreshToken.user);

      // 5. Logger l'événement
      await this.logAuthEvent('token_refresh', refreshToken.user.email, true, ipAddress, undefined, 'Token rafraîchi');

      return {
        accessToken,
        expiresIn: this.getTokenExpirationTime()
      };

    } catch (error) {
      logger.error('Erreur lors du rafraîchissement du token:', error);
      throw error;
    }
  }

  /**
   * Déconnecter un utilisateur
   */
  async logout(userId: string, refreshTokenString?: string, ipAddress?: string): Promise<void> {
    try {
      // 1. Révoquer le refresh token si fourni
      if (refreshTokenString) {
        const tokenHash = RefreshToken.createTokenHash(refreshTokenString);
        const refreshToken = await this.refreshTokenRepository.findOne({
          where: { tokenHash, userId }
        });

        if (refreshToken && refreshToken.isValid()) {
          refreshToken.revoke('Déconnexion utilisateur');
          await this.refreshTokenRepository.save(refreshToken);
        }
      }

      // 2. Optionnel: Révoquer tous les refresh tokens de l'utilisateur
      // await this.refreshTokenRepository.update(
      //   { userId, isRevoked: false },
      //   { isRevoked: true, revokedAt: new Date(), revokedReason: 'Déconnexion globale' }
      // );

      // 3. Logger la déconnexion
      const user = await this.userRepository.findOne({ where: { id: userId } });
      if (user) {
        await this.logAuthEvent('logout', user.email, true, ipAddress, undefined, 'Déconnexion');
      }

      logger.info('Déconnexion réussie:', { userId, ip: ipAddress });

    } catch (error) {
      logger.error('Erreur lors de la déconnexion:', error);
      throw error;
    }
  }

  /**
   * Obtenir le profil complet d'un utilisateur
   */
  async getUserProfile(userId: string): Promise<UserProfile | null> {
    try {
      const user = await this.userRepository.findOne({
        where: { id: userId },
        relations: ['role', 'role.permissions', 'tenant']
      });

      if (!user) {
        return null;
      }

      return this.createUserProfile(user);

    } catch (error) {
      logger.error('Erreur lors de la récupération du profil:', error);
      throw error;
    }
  }

  /**
   * Valider un token d'accès
   */
  validateAccessToken(token: string): TokenPayload {
    try {
      const jwtSecret = process.env.JWT_SECRET;
      if (!jwtSecret) {
        throw new Error('JWT_SECRET doit être défini');
      }
      const decoded = jwt.verify(token, jwtSecret) as TokenPayload;
      
      return decoded;
    } catch (error) {
      throw new Error('Token invalide');
    }
  }

  /**
   * Générer les tokens d'accès et de rafraîchissement
   */
  private async generateTokens(user: User, ipAddress?: string, userAgent?: string): Promise<{ accessToken: string; refreshToken: string }> {
    // 1. Générer le token d'accès
    const accessToken = this.generateAccessToken(user);

    // 2. Générer le refresh token
    const refreshTokenString = this.generateRefreshTokenString();
    const refreshSecret = process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET;
    if (!refreshSecret) {
      throw new Error('JWT_REFRESH_SECRET ou JWT_SECRET doit être défini');
    }
    const refreshTokenJWT = jwt.sign(
      { id: user.id, type: 'refresh', token: refreshTokenString },
      refreshSecret,
      { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d' } as jwt.SignOptions
    );

    // 3. Sauvegarder le refresh token en base
    const refreshTokenEntity = RefreshToken.create(
      user.id,
      refreshTokenString,
      7 * 24 * 60 * 60 * 1000, // 7 jours
      ipAddress,
      userAgent
    );
    await this.refreshTokenRepository.save(refreshTokenEntity);

    // 4. Nettoyer les anciens tokens expirés de l'utilisateur
    await this.cleanupExpiredTokens(user.id);

    return {
      accessToken,
      refreshToken: refreshTokenJWT
    };
  }

  /**
   * Générer un token d'accès
   */
  private generateAccessToken(user: User): string {
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      throw new Error('JWT_SECRET doit être défini');
    }

    const permissions = user.role?.permissions?.map((p: any) => p.getDisplayName()) || [];

    const payload: Omit<TokenPayload, 'iat' | 'exp'> = {
      userId: user.id,
      email: user.email,
      tenantId: user.tenantId,
      roleId: user.roleId,
      permissions
    };

    return jwt.sign(
      payload,
      jwtSecret,
      { expiresIn: process.env.JWT_EXPIRES_IN || '15m' } as jwt.SignOptions
    );
  }

  /**
   * Générer une chaîne de refresh token sécurisée
   */
  private generateRefreshTokenString(): string {
    return randomBytes(32).toString('hex');
  }

  /**
   * Créer le profil utilisateur pour la réponse
   */
  private createUserProfile(user: User): UserProfile {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: {
        id: user.role?.id || '',
        name: user.role?.name || '',
        tenantType: user.role?.tenantType || ''
      },
      tenant: {
        id: user.tenant?.id || '',
        name: user.tenant?.name || '',
        type: user.tenant?.type || ''
      },
      permissions: user.role?.permissions?.map((p: any) => p.getDisplayName()) || [],
      lastLoginAt: user.lastLoginAt
    };
  }

  /**
   * Logger un événement d'authentification
   */
  private async logAuthEvent(
    action: string,
    email: string,
    success: boolean,
    ipAddress?: string,
    userAgent?: string,
    details?: string
  ): Promise<void> {
    try {
      const auditLog = this.auditLogRepository.create({
        userId: 'system', // Utilisateur système pour les événements d'auth
        action: action as AuditAction,
        tableName: 'users',
        recordId: email,
        oldValues: {},
        newValues: {
          success,
          details,
          timestamp: new Date().toISOString()
        },
        ipAddress: ipAddress || '',
        userAgent: userAgent || ''
      });

      await this.auditLogRepository.save(auditLog);
    } catch (error) {
      logger.error('Erreur lors de l\'enregistrement de l\'audit:', error);
    }
  }

  /**
   * Nettoyer les tokens expirés d'un utilisateur
   */
  private async cleanupExpiredTokens(userId: string): Promise<void> {
    try {
      // Supprimer les tokens expirés de cet utilisateur
      await this.refreshTokenRepository
        .createQueryBuilder()
        .delete()
        .from(RefreshToken)
        .where('userId = :userId', { userId })
        .andWhere('expiresAt < :now', { now: new Date() })
        .execute();
    } catch (error) {
      logger.error('Erreur lors du nettoyage des tokens expirés:', error);
    }
  }

  /**
   * Obtenir le temps d'expiration du token en secondes
   */
  private getTokenExpirationTime(): number {
    const expiresIn = process.env.JWT_EXPIRES_IN || '15m';
    
    // Convertir en secondes
    if (expiresIn.endsWith('m')) {
      return parseInt(expiresIn) * 60;
    } else if (expiresIn.endsWith('h')) {
      return parseInt(expiresIn) * 3600;
    } else if (expiresIn.endsWith('d')) {
      return parseInt(expiresIn) * 86400;
    }
    
    return 900; // 15 minutes par défaut
  }
}
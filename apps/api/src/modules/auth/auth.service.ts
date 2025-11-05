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

import { AppDataSource } from '../../../../../packages/database/src/config/datasource';
import { User, UserStatus } from '../../../../../packages/database/src/entities/User.entity';
import { RefreshToken } from '../../../../../packages/database/src/entities/RefreshToken.entity';
import { AuditAction } from '../../../../../packages/database/src/entities/AuditLog.entity';
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
  // Utilisation d'EntityManager au lieu de getRepository() pour contourner le bug TypeORM
  // EntityManager ne vérifie pas les métadonnées de la même manière
  private get manager() {
    return AppDataSource.manager;
  }

  /**
   * Authentifier un utilisateur
   */
  async login(credentials: LoginCredentials, ipAddress?: string, userAgent?: string): Promise<AuthResult> {
    const { email, password } = credentials;

    try {
      // 1. Rechercher l'utilisateur avec ses relations
      // CONTOURNEMENT BUG TYPEORM : Toutes les méthodes (findOne, createQueryBuilder, getRepository)
      // passent par getMetadata() qui échoue même si hasMetadata() retourne true
      // Solution : utiliser query() avec SQL brut puis mapper manuellement
      const result = await this.manager.query(`
        SELECT
          u.*,
          r.id as "role_id", r.name as "role_name", r."tenantType" as "role_tenantType",
          t.id as "tenant_id", t.name as "tenant_name", t.type as "tenant_type",
          json_agg(json_build_object('id', p.id, 'resource', p.resource, 'actions', p.actions)) as "permissions"
        FROM users u
        LEFT JOIN roles r ON u.role_id = r.id
        LEFT JOIN tenants t ON u.tenant_id = t.id
        LEFT JOIN role_permissions rp ON r.id = rp.role_id
        LEFT JOIN permissions p ON rp.permission_id = p.id
        WHERE LOWER(u.email) = LOWER($1)
        GROUP BY u.id, r.id, r.name, r."tenantType", t.id, t.name, t.type
      `, [email]);

      if (!result || result.length === 0) {
        await this.logAuthEvent('login', email, false, ipAddress, userAgent, 'Utilisateur non trouvé');
        throw new Error('Identifiants invalides');
      }

      // Mapper le résultat SQL vers l'objet User
      const userData = result[0];
      const user = Object.assign(new User(), userData);

      // Mapper les colonnes snake_case vers camelCase pour l'entité User
      user.roleId = userData.role_id;
      user.tenantId = userData.tenant_id;

      // Reconstituer les relations
      if (userData.role_id) {
        user.role = {
          id: userData.role_id,
          name: userData.role_name,
          tenantType: userData.role_tenantType,
          permissions: userData.permissions.filter((p: any) => p.id !== null)
        } as any;
      }

      if (userData.tenant_id) {
        user.tenant = {
          id: userData.tenant_id,
          name: userData.tenant_name,
          type: userData.tenant_type
        } as any;
      }

      if (!user) {
        await this.logAuthEvent('login', email, false, ipAddress, userAgent, 'Utilisateur non trouvé');
        throw new Error('Identifiants invalides');
      }

      // 2. Vérifier le statut du compte
      if (user.status !== UserStatus.ACTIVE) {
        await this.logAuthEvent('login', email, false, ipAddress, userAgent, `Compte ${user.status}`, user.id);
        throw new Error('Compte désactivé ou suspendu');
      }

      // 3. Vérifier si le compte est verrouillé
      if (user.isLocked()) {
        await this.logAuthEvent('login', email, false, ipAddress, userAgent, 'Compte verrouillé', user.id);
        throw new Error('Compte temporairement verrouillé. Réessayez plus tard.');
      }

      // 4. Vérifier le mot de passe
      const isValidPassword = await user.validatePassword(password);
      if (!isValidPassword) {
        // Incrémenter les tentatives d'échec
        user.incLoginAttempts();
        // Utiliser SQL brut au lieu de save() pour contourner le bug TypeORM
        await this.manager.query(`
          UPDATE users
          SET "loginAttempts" = $1, "lockedUntil" = $2
          WHERE id = $3
        `, [user.loginAttempts, user.lockedUntil, user.id]);

        await this.logAuthEvent('login', email, false, ipAddress, userAgent, 'Mot de passe incorrect', user.id);
        throw new Error('Identifiants invalides');
      }

      // 5. Réinitialiser les tentatives de connexion
      user.resetLoginAttempts();
      user.lastLoginIp = ipAddress || '';
      // Utiliser SQL brut au lieu de save() pour contourner le bug TypeORM
      await this.manager.query(`
        UPDATE users
        SET "loginAttempts" = $1, "lockedUntil" = $2, "lastLoginIp" = $3, "lastLoginAt" = $4
        WHERE id = $5
      `, [user.loginAttempts, user.lockedUntil, ipAddress || '', new Date(), user.id]);

      // 6. Générer les tokens
      const { accessToken, refreshToken } = await this.generateTokens(user, ipAddress, userAgent);

      // 7. Créer le profil utilisateur
      const userProfile = this.createUserProfile(user);

      // 8. Logger la connexion réussie
      await this.logAuthEvent('login', email, true, ipAddress, userAgent, 'Connexion réussie', user.id);

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
      const refreshSecret = process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET || 'fallback-secret';
      const decoded = jwt.verify(refreshTokenString, refreshSecret) as any;

      if (decoded.type !== 'refresh') {
        throw new Error('Type de token incorrect');
      }

      // 2. Rechercher le refresh token en base avec l'utilisateur
      // Le JWT contient le token brut dans decoded.token
      const tokenHash = RefreshToken.createTokenHash(decoded.token);

      // Utiliser SQL brut pour éviter le bug TypeORM
      const result = await this.manager.query(`
        SELECT
          rt.*,
          u.id as "user_id", u.email as "user_email", u.name as "user_name",
          u.status as "user_status", u.tenant_id as "user_tenantId", u.role_id as "user_roleId",
          r.id as "role_id", r.name as "role_name", r."tenantType" as "role_tenantType",
          t.id as "tenant_id", t.name as "tenant_name", t.type as "tenant_type",
          json_agg(json_build_object('id', p.id, 'resource', p.resource, 'actions', p.actions)) as "permissions"
        FROM refresh_tokens rt
        INNER JOIN users u ON rt.user_id = u.id
        LEFT JOIN roles r ON u.role_id = r.id
        LEFT JOIN tenants t ON u.tenant_id = t.id
        LEFT JOIN role_permissions rp ON r.id = rp.role_id
        LEFT JOIN permissions p ON rp.permission_id = p.id
        WHERE rt."tokenHash" = $1
        GROUP BY rt.id, u.id, u.email, u.name, u.status, u.tenant_id, u.role_id,
                 r.id, r.name, r."tenantType", t.id, t.name, t.type
      `, [tokenHash]);

      if (!result || result.length === 0) {
        throw new Error('Refresh token invalide ou expiré');
      }

      const tokenData = result[0];

      // Vérifier si le token est expiré ou révoqué
      const now = new Date();
      const expiresAt = new Date(tokenData.expiresAt);
      if (tokenData.isRevoked || expiresAt < now) {
        throw new Error('Refresh token invalide ou expiré');
      }

      // Reconstituer l'objet User
      const user = Object.assign(new User(), {
        id: tokenData.user_id,
        email: tokenData.user_email,
        name: tokenData.user_name,
        status: tokenData.user_status,
        tenantId: tokenData.user_tenantId,
        roleId: tokenData.user_roleId
      });

      user.role = {
        id: tokenData.role_id,
        name: tokenData.role_name,
        tenantType: tokenData.role_tenantType,
        permissions: tokenData.permissions.filter((p: any) => p.id !== null)
      } as any;

      user.tenant = {
        id: tokenData.tenant_id,
        name: tokenData.tenant_name,
        type: tokenData.tenant_type
      } as any;

      // 3. Vérifier que l'utilisateur est toujours actif
      if (user.status !== UserStatus.ACTIVE) {
        // Révoquer le token si l'utilisateur n'est plus actif
        await this.manager.query(`
          UPDATE refresh_tokens
          SET "isRevoked" = true, "revokedAt" = $1, "revokedReason" = $2
          WHERE "tokenHash" = $3
        `, [new Date(), 'Utilisateur désactivé', tokenHash]);
        throw new Error('Utilisateur désactivé');
      }

      // 4. Générer un nouveau token d'accès
      const accessToken = this.generateAccessToken(user);

      // 5. Logger l'événement
      await this.logAuthEvent('token_refresh', user.email, true, ipAddress, undefined, 'Token rafraîchi', user.id);

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

        // Utiliser SQL brut pour éviter le bug TypeORM
        // Vérifier si le token existe et est valide
        const result = await this.manager.query(`
          SELECT id, "expiresAt", "isRevoked"
          FROM refresh_tokens
          WHERE "tokenHash" = $1 AND user_id = $2
        `, [tokenHash, userId]);

        if (result && result.length > 0) {
          const token = result[0];
          const now = new Date();
          const expiresAt = new Date(token.expiresAt);

          // Si le token est valide (non révoqué et non expiré), le révoquer
          if (!token.isRevoked && expiresAt > now) {
            await this.manager.query(`
              UPDATE refresh_tokens
              SET "isRevoked" = true, "revokedAt" = $1, "revokedReason" = $2
              WHERE "tokenHash" = $3
            `, [new Date(), 'Déconnexion utilisateur', tokenHash]);
          }
        }
      }

      // 2. Optionnel: Révoquer tous les refresh tokens de l'utilisateur
      // await this.manager.query(`
      //   UPDATE refresh_tokens
      //   SET "isRevoked" = true, "revokedAt" = $1, "revokedReason" = $2
      //   WHERE user_id = $3 AND "isRevoked" = false
      // `, [new Date(), 'Déconnexion globale', userId]);

      // 3. Logger la déconnexion - récupérer l'email de l'utilisateur
      const userResult = await this.manager.query(`
        SELECT email FROM users WHERE id = $1
      `, [userId]);

      if (userResult && userResult.length > 0) {
        await this.logAuthEvent('logout', userResult[0].email, true, ipAddress, undefined, 'Déconnexion', userId);
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
      // Utiliser SQL brut pour éviter le bug TypeORM
      const result = await this.manager.query(`
        SELECT
          u.*,
          r.id as "role_id", r.name as "role_name", r."tenantType" as "role_tenantType",
          t.id as "tenant_id", t.name as "tenant_name", t.type as "tenant_type",
          json_agg(json_build_object('id', p.id, 'resource', p.resource, 'actions', p.actions)) as "permissions"
        FROM users u
        LEFT JOIN roles r ON u.role_id = r.id
        LEFT JOIN tenants t ON u.tenant_id = t.id
        LEFT JOIN role_permissions rp ON r.id = rp.role_id
        LEFT JOIN permissions p ON rp.permission_id = p.id
        WHERE u.id = $1
        GROUP BY u.id, r.id, r.name, r."tenantType", t.id, t.name, t.type
      `, [userId]);

      if (!result || result.length === 0) {
        return null;
      }

      // Mapper le résultat SQL vers l'objet User
      const userData = result[0];
      const user = Object.assign(new User(), userData);

      // Mapper les colonnes snake_case vers camelCase pour l'entité User
      user.roleId = userData.role_id;
      user.tenantId = userData.tenant_id;

      // Reconstituer les relations
      if (userData.role_id) {
        user.role = {
          id: userData.role_id,
          name: userData.role_name,
          tenantType: userData.role_tenantType,
          permissions: userData.permissions.filter((p: any) => p.id !== null)
        } as any;
      }

      if (userData.tenant_id) {
        user.tenant = {
          id: userData.tenant_id,
          name: userData.tenant_name,
          type: userData.tenant_type
        } as any;
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
      const jwtSecret = process.env.JWT_SECRET || 'fallback-secret';
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
    const refreshTokenJWT = jwt.sign(
      { id: user.id, type: 'refresh', token: refreshTokenString },
      process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET || 'fallback-secret',
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
    // Générer un ID UUID car create() ne le fait pas
    const { randomUUID } = await import('crypto');
    const tokenId = randomUUID();

    // Utiliser SQL brut au lieu de save() pour contourner le bug TypeORM
    await this.manager.query(`
      INSERT INTO refresh_tokens (id, user_id, "tokenHash", "expiresAt", "ipAddress", "userAgent", "isRevoked", "createdAt")
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    `, [
      tokenId,
      user.id, // Utiliser user.id directement au lieu de refreshTokenEntity.userId
      refreshTokenEntity.tokenHash,
      refreshTokenEntity.expiresAt,
      refreshTokenEntity.ipAddress || null,
      refreshTokenEntity.userAgent || null,
      refreshTokenEntity.isRevoked || false,
      refreshTokenEntity.createdAt || new Date()
    ]);

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
    const role = user.role as any;
    // Les permissions sont des objets JSON (pas des instances de classe) depuis le SQL brut
    const permissions = role?.permissions?.map((p: any) => {
      // Si c'est une instance de Permission avec getDisplayName(), l'utiliser
      if (typeof p.getDisplayName === 'function') {
        return p.getDisplayName();
      }
      // Sinon c'est un objet JSON simple, construire le display name manuellement
      // p.actions est un tableau, le convertir en string
      const actions = Array.isArray(p.actions) ? p.actions.join(',') : p.actions;
      return `${p.resource}:${actions}`;
    }) || [];

    const payload: Omit<TokenPayload, 'iat' | 'exp'> = {
      userId: user.id,
      email: user.email,
      tenantId: user.tenantId,
      roleId: user.roleId,
      permissions
    };

    return jwt.sign(
      payload,
      process.env.JWT_SECRET || 'fallback-secret',
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
    const role = user.role as any;
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
      permissions: role?.permissions?.map((p: any) => {
        // Les permissions sont des objets JSON (pas des instances de classe) depuis le SQL brut
        if (typeof p.getDisplayName === 'function') {
          return p.getDisplayName();
        }
        return `${p.resource}:${p.actions}`;
      }) || [],
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
    details?: string,
    userId?: string
  ): Promise<void> {
    try {
      // Si userId n'est pas fourni, essayer de le récupérer via l'email
      let finalUserId = userId;
      if (!finalUserId) {
        const userResult = await this.manager.query(`
          SELECT id FROM users WHERE LOWER(email) = LOWER($1) LIMIT 1
        `, [email]);

        if (userResult && userResult.length > 0) {
          finalUserId = userResult[0].id;
        }
      }

      // Si on n'a toujours pas d'userId, skip l'audit log
      if (!finalUserId) {
        logger.warn(`Impossible de logger l'événement d'audit: userId non trouvé pour ${email}`);
        return;
      }

      // Utiliser SQL brut au lieu de save() pour contourner le bug TypeORM
      const newValues = {
        success,
        details,
        timestamp: new Date().toISOString()
      };

      await this.manager.query(`
        INSERT INTO audit_logs (user_id, action, "tableName", "recordId", "oldValues", "newValues", "ipAddress", "userAgent", "createdAt")
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      `, [
        finalUserId,
        action as any, // Cast pour éviter les erreurs de type
        'users',
        email,
        JSON.stringify({}),
        JSON.stringify(newValues),
        ipAddress || null,
        userAgent || null,
        new Date()
      ]);
    } catch (error) {
      logger.error('Erreur lors de l\'enregistrement de l\'audit:', error);
    }
  }

  /**
   * Nettoyer les tokens expirés d'un utilisateur
   */
  private async cleanupExpiredTokens(userId: string): Promise<void> {
    try {
      // Supprimer les tokens expirés de cet utilisateur - utiliser SQL brut
      await this.manager.query(`
        DELETE FROM refresh_tokens
        WHERE user_id = $1 AND "expiresAt" < $2
      `, [userId, new Date()]);
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
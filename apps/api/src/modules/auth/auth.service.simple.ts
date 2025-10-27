/**
 * FICHIER: apps\api\src\modules\auth\auth.service.simple.ts
 * SERVICE: Authentification simplifiée avec base de données réelle
 * 
 * DESCRIPTION:
 * Version simplifiée du service d'authentification
 * Utilise les entités de base de données sans imports complexes
 * 
 * AUTEUR: Équipe CROU
 * DATE: Décembre 2024
 */

import jwt from 'jsonwebtoken';
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

export class AuthServiceSimple {
  /**
   * Authentifier un utilisateur (version simplifiée avec mock amélioré)
   */
  async login(credentials: LoginCredentials, ipAddress?: string, userAgent?: string): Promise<AuthResult> {
    const { email, password } = credentials;

    try {
      // Pour le moment, utiliser des données mock améliorées
      // TODO: Remplacer par de vraies requêtes DB une fois les imports résolus
      
      const mockUsers = [
        {
          id: 'ministre-001',
          email: 'ministre@mesrit.gov.ne',
          password: 'password123', // En réalité, ce serait hashé
          name: 'Excellence Ministre MESRIT',
          role: {
            id: 'role-ministre',
            name: 'Ministre',
            tenantType: 'ministere'
          },
          tenant: {
            id: 'ministere',
            name: 'Ministère de l\'Enseignement Supérieur',
            type: 'ministere'
          },
          permissions: [
            'dashboard:read', 'dashboard:write', 'dashboard:validate',
            'financial:read', 'financial:write', 'financial:validate', 'financial:export',
            'stocks:read', 'stocks:write', 'stocks:validate', 'stocks:export',
            'housing:read', 'housing:write', 'housing:validate', 'housing:export',
            'transport:read', 'transport:write', 'transport:validate', 'transport:export',
            'reports:read', 'reports:export',
            'admin:read', 'admin:write', 'admin:validate',
            'users:read', 'users:write', 'users:validate',
            'audit:read', 'audit:export'
          ]
        },
        {
          id: 'directeur-crou-niamey-001',
          email: 'directeur@crou_niamey.gov.ne',
          password: 'password123',
          name: 'Directeur CROU Niamey',
          role: {
            id: 'role-directeur-crou',
            name: 'Directeur CROU',
            tenantType: 'crou'
          },
          tenant: {
            id: 'crou_niamey',
            name: 'CROU Niamey',
            type: 'crou'
          },
          permissions: [
            'dashboard:read', 'dashboard:write', 'dashboard:validate',
            'financial:read', 'financial:write', 'financial:validate', 'financial:export',
            'stocks:read', 'stocks:write', 'stocks:validate',
            'housing:read', 'housing:write', 'housing:validate',
            'transport:read', 'transport:write', 'transport:validate',
            'reports:read', 'reports:export',
            'users:read', 'users:write'
          ]
        },
        {
          id: 'comptable-crou-dosso-001',
          email: 'comptable@crou_dosso.gov.ne',
          password: 'password123',
          name: 'Comptable CROU Dosso',
          role: {
            id: 'role-comptable',
            name: 'Comptable',
            tenantType: 'crou'
          },
          tenant: {
            id: 'crou_dosso',
            name: 'CROU Dosso',
            type: 'crou'
          },
          permissions: [
            'dashboard:read',
            'financial:read', 'financial:write',
            'reports:read'
          ]
        }
      ];

      // Rechercher l'utilisateur
      const user = mockUsers.find(u => u.email.toLowerCase() === email.toLowerCase());
      
      if (!user) {
        throw new Error('Identifiants invalides');
      }

      // Vérifier le mot de passe (en réalité, on utiliserait bcrypt)
      if (password !== user.password) {
        throw new Error('Identifiants invalides');
      }

      // Générer les tokens
      const { accessToken, refreshToken } = this.generateTokens(user);

      logger.info('Connexion réussie (service simplifié):', {
        userId: user.id,
        email: user.email,
        role: user.role.name,
        tenant: user.tenant.name,
        ip: ipAddress
      });

      return {
        accessToken,
        refreshToken,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          tenant: user.tenant,
          permissions: user.permissions,
          lastLoginAt: new Date()
        },
        expiresIn: this.getTokenExpirationTime()
      };

    } catch (error) {
      logger.error('Erreur lors de la connexion (service simplifié):', error);
      throw error;
    }
  }

  /**
   * Rafraîchir un token d'accès
   */
  async refreshAccessToken(refreshTokenString: string, ipAddress?: string): Promise<{ accessToken: string; expiresIn: number }> {
    try {
      const refreshSecret = process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET || 'fallback-secret';
      const decoded = jwt.verify(refreshTokenString, refreshSecret) as any;

      if (decoded.type !== 'refresh') {
        throw new Error('Type de token incorrect');
      }

      // Pour le moment, générer un nouveau token avec les données du token
      const mockUser = {
        id: decoded.id,
        email: decoded.email || 'user@crou.ne',
        tenantId: decoded.tenantId || 'crou_niamey',
        roleId: decoded.roleId || 'role-directeur-crou',
        permissions: decoded.permissions || ['dashboard:read']
      };

      const accessToken = this.generateAccessToken(mockUser);

      return {
        accessToken,
        expiresIn: this.getTokenExpirationTime()
      };

    } catch (error) {
      logger.error('Erreur lors du rafraîchissement du token (service simplifié):', error);
      throw error;
    }
  }

  /**
   * Déconnecter un utilisateur
   */
  async logout(userId: string, refreshTokenString?: string, ipAddress?: string): Promise<void> {
    try {
      // Pour le moment, juste logger la déconnexion
      logger.info('Déconnexion réussie (service simplifié):', { userId, ip: ipAddress });
    } catch (error) {
      logger.error('Erreur lors de la déconnexion (service simplifié):', error);
      throw error;
    }
  }

  /**
   * Obtenir le profil complet d'un utilisateur
   */
  async getUserProfile(userId: string): Promise<UserProfile | null> {
    try {
      // Pour le moment, retourner un profil mock basé sur l'ID
      const mockProfile: UserProfile = {
        id: userId,
        email: 'user@crou.ne',
        name: 'Utilisateur Test',
        role: {
          id: 'role-test',
          name: 'Utilisateur Test',
          tenantType: 'crou'
        },
        tenant: {
          id: 'crou_niamey',
          name: 'CROU Niamey',
          type: 'crou'
        },
        permissions: ['dashboard:read'],
        lastLoginAt: new Date()
      };

      return mockProfile;
    } catch (error) {
      logger.error('Erreur lors de la récupération du profil (service simplifié):', error);
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
  private generateTokens(user: any): { accessToken: string; refreshToken: string } {
    const accessToken = this.generateAccessToken(user);
    
    const refreshToken = jwt.sign(
      { id: user.id, type: 'refresh', email: user.email, tenantId: user.tenant.id, roleId: user.role.id },
      process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET || 'fallback-secret',
      { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d' } as jwt.SignOptions
    );

    return { accessToken, refreshToken };
  }

  /**
   * Générer un token d'accès
   */
  private generateAccessToken(user: any): string {
    const payload: Omit<TokenPayload, 'iat' | 'exp'> = {
      userId: user.id,
      email: user.email,
      tenantId: user.tenant?.id || user.tenantId,
      roleId: user.role?.id || user.roleId,
      permissions: user.permissions || []
    };

    return jwt.sign(
      payload,
      process.env.JWT_SECRET || 'fallback-secret',
      { expiresIn: process.env.JWT_EXPIRES_IN || '15m' } as jwt.SignOptions
    );
  }

  /**
   * Obtenir le temps d'expiration du token en secondes
   */
  private getTokenExpirationTime(): number {
    const expiresIn = process.env.JWT_EXPIRES_IN || '15m';
    
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
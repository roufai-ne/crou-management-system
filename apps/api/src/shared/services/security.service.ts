/**
 * FICHIER: apps/api/src/shared/services/security.service.ts
 * SERVICE: SecurityService - Mesures de sécurité avancées
 * 
 * DESCRIPTION:
 * Service complet pour les mesures de sécurité avancées:
 * - Rate limiting par utilisateur et IP
 * - Système de blocage de compte après échecs
 * - Chiffrement AES-256 pour données sensibles
 * - Système d'alertes de sécurité
 * - Détection d'activités suspectes
 * 
 * FONCTIONNALITÉS:
 * - Rate limiting intelligent avec Redis
 * - Blocage temporaire et permanent des comptes
 * - Chiffrement/déchiffrement AES-256-GCM
 * - Alertes en temps réel
 * - Monitoring des tentatives d'intrusion
 * 
 * AUTEUR: Équipe CROU
 * DATE: Décembre 2024
 */

import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { createCipheriv, createDecipheriv, randomBytes, scrypt } from 'crypto';
import { promisify } from 'util';
import Redis from 'ioredis';

import { User } from '../../../../packages/database/src/entities/User.entity';
import { AuditLog, AuditAction } from '../../../../packages/database/src/entities/AuditLog.entity';
import { AuditService } from './audit.service';

// Configuration de sécurité
export interface SecurityConfig {
  rateLimiting: {
    maxRequestsPerMinute: number;
    maxRequestsPerHour: number;
    maxLoginAttemptsPerHour: number;
    blockDurationMinutes: number;
  };
  accountLocking: {
    maxFailedAttempts: number;
    lockDurationMinutes: number;
    permanentLockAfterAttempts: number;
  };
  encryption: {
    algorithm: string;
    keyLength: number;
    ivLength: number;
  };
  alerts: {
    enabled: boolean;
    webhookUrl?: string;
    emailRecipients: string[];
  };
}

export interface SecurityAlert {
  type: 'BRUTE_FORCE' | 'SUSPICIOUS_ACTIVITY' | 'ACCOUNT_LOCKED' | 'RATE_LIMIT_EXCEEDED' | 'UNAUTHORIZED_ACCESS';
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  userId?: string;
  ipAddress: string;
  userAgent?: string;
  details: Record<string, any>;
  timestamp: Date;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetTime: Date;
  retryAfter?: number;
}

export interface EncryptionResult {
  encryptedData: string;
  iv: string;
  tag: string;
}

@Injectable()
export class SecurityService {
  private readonly logger = new Logger(SecurityService.name);
  private readonly redis: Redis;
  private readonly scryptAsync = promisify(scrypt);
  
  private readonly config: SecurityConfig = {
    rateLimiting: {
      maxRequestsPerMinute: 100,
      maxRequestsPerHour: 1000,
      maxLoginAttemptsPerHour: 10,
      blockDurationMinutes: 15
    },
    accountLocking: {
      maxFailedAttempts: 5,
      lockDurationMinutes: 30,
      permanentLockAfterAttempts: 10
    },
    encryption: {
      algorithm: 'aes-256-gcm',
      keyLength: 32,
      ivLength: 16
    },
    alerts: {
      enabled: true,
      emailRecipients: ['security@crou.ne', 'admin@crou.ne']
    }
  };

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(AuditLog)
    private readonly auditRepository: Repository<AuditLog>,
    private readonly auditService: AuditService
  ) {
    // Initialiser Redis pour le rate limiting
    this.redis = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      password: process.env.REDIS_PASSWORD,
      retryDelayOnFailover: 100,
      maxRetriesPerRequest: 3
    });

    this.redis.on('error', (error: any) => {
      this.logger.error('Redis connection error:', error);
    });

    this.redis.on('connect', () => {
      this.logger.log('Redis connected successfully');
    });
  }

  /**
   * RATE LIMITING
   */

  /**
   * Vérifier le rate limiting pour un utilisateur/IP
   */
  async checkRateLimit(
    identifier: string, 
    type: 'user' | 'ip' | 'login',
    ipAddress?: string
  ): Promise<RateLimitResult> {
    try {
      const key = `rate_limit:${type}:${identifier}`;
      const now = Date.now();
      const windowMs = type === 'login' ? 3600000 : 60000; // 1h pour login, 1min pour autres
      const maxRequests = type === 'login' 
        ? this.config.rateLimiting.maxLoginAttemptsPerHour
        : this.config.rateLimiting.maxRequestsPerMinute;

      // Utiliser une fenêtre glissante avec Redis
      const pipeline = this.redis.pipeline();
      pipeline.zremrangebyscore(key, 0, now - windowMs);
      pipeline.zcard(key);
      pipeline.zadd(key, now, `${now}-${Math.random()}`);
      pipeline.expire(key, Math.ceil(windowMs / 1000));
      
      const results = await pipeline.exec();
      const currentCount = results[1][1] as number;

      const allowed = currentCount < maxRequests;
      const remaining = Math.max(0, maxRequests - currentCount - 1);
      const resetTime = new Date(now + windowMs);

      if (!allowed) {
        // Déclencher une alerte si rate limit dépassé
        await this.triggerSecurityAlert({
          type: 'RATE_LIMIT_EXCEEDED',
          severity: 'MEDIUM',
          ipAddress: ipAddress || identifier,
          details: {
            type,
            identifier,
            currentCount,
            maxRequests,
            windowMs
          },
          timestamp: new Date()
        });

        return {
          allowed: false,
          remaining: 0,
          resetTime,
          retryAfter: Math.ceil(windowMs / 1000)
        };
      }

      return {
        allowed: true,
        remaining,
        resetTime
      };
    } catch (error) {
      this.logger.error('Rate limiting error:', error);
      // En cas d'erreur Redis, permettre la requête mais logger
      return {
        allowed: true,
        remaining: 0,
        resetTime: new Date()
      };
    }
  }

  /**
   * BLOCAGE DE COMPTES
   */

  /**
   * Gérer les échecs de connexion et blocage de compte
   */
  async handleLoginFailure(
    userId: string, 
    ipAddress: string, 
    userAgent?: string
  ): Promise<{ locked: boolean; lockDuration?: number; attemptsRemaining?: number }> {
    try {
      const user = await this.userRepository.findOne({ where: { id: userId } });
      if (!user) {
        throw new Error('User not found');
      }

      // Incrémenter les tentatives
      user.incLoginAttempts();
      
      const isLocked = user.isLocked();
      const attemptsRemaining = Math.max(0, this.config.accountLocking.maxFailedAttempts - user.loginAttempts);

      // Sauvegarder les modifications
      await this.userRepository.save(user);

      // Logger l'événement
      await this.auditService.logEvent({
        userId,
        action: AuditAction.LOGIN_FAILED,
        recordId: userId,
        ipAddress,
        userAgent,
        metadata: {
          loginAttempts: user.loginAttempts,
          isLocked,
          attemptsRemaining
        }
      });

      // Déclencher des alertes selon la gravité
      if (isLocked) {
        await this.triggerSecurityAlert({
          type: 'ACCOUNT_LOCKED',
          severity: user.loginAttempts >= this.config.accountLocking.permanentLockAfterAttempts ? 'CRITICAL' : 'HIGH',
          userId,
          ipAddress,
          userAgent,
          details: {
            loginAttempts: user.loginAttempts,
            lockDuration: this.config.accountLocking.lockDurationMinutes,
            isPermanent: user.loginAttempts >= this.config.accountLocking.permanentLockAfterAttempts
          },
          timestamp: new Date()
        });
      } else if (user.loginAttempts >= 3) {
        await this.triggerSecurityAlert({
          type: 'BRUTE_FORCE',
          severity: 'MEDIUM',
          userId,
          ipAddress,
          userAgent,
          details: {
            loginAttempts: user.loginAttempts,
            attemptsRemaining
          },
          timestamp: new Date()
        });
      }

      return {
        locked: isLocked,
        lockDuration: isLocked ? this.config.accountLocking.lockDurationMinutes : undefined,
        attemptsRemaining: isLocked ? 0 : attemptsRemaining
      };
    } catch (error) {
      this.logger.error('Error handling login failure:', error);
      throw error;
    }
  }

  /**
   * Gérer une connexion réussie
   */
  async handleLoginSuccess(
    userId: string, 
    ipAddress: string, 
    userAgent?: string
  ): Promise<void> {
    try {
      const user = await this.userRepository.findOne({ where: { id: userId } });
      if (!user) {
        throw new Error('User not found');
      }

      // Réinitialiser les tentatives de connexion
      user.resetLoginAttempts();
      user.lastLoginIp = ipAddress;
      
      await this.userRepository.save(user);

      // Logger la connexion réussie
      await this.auditService.logEvent({
        userId,
        action: AuditAction.LOGIN,
        recordId: userId,
        ipAddress,
        userAgent,
        metadata: {
          previousLoginAttempts: user.loginAttempts,
          loginTime: new Date()
        }
      });
    } catch (error) {
      this.logger.error('Error handling login success:', error);
      throw error;
    }
  }

  /**
   * Débloquer manuellement un compte
   */
  async unlockAccount(userId: string, adminUserId: string): Promise<void> {
    try {
      const user = await this.userRepository.findOne({ where: { id: userId } });
      if (!user) {
        throw new Error('User not found');
      }

      user.loginAttempts = 0;
      user.lockedUntil = null;
      
      await this.userRepository.save(user);

      // Logger le déblocage
      await this.auditService.logEvent({
        userId: adminUserId,
        action: AuditAction.UPDATE,
        recordId: userId,
        metadata: {
          action: 'account_unlocked',
          targetUserId: userId
        }
      });

      this.logger.log(`Account ${userId} unlocked by admin ${adminUserId}`);
    } catch (error) {
      this.logger.error('Error unlocking account:', error);
      throw error;
    }
  }

  /**
   * CHIFFREMENT AES-256
   */

  /**
   * Chiffrer des données sensibles avec AES-256-GCM
   */
  async encryptSensitiveData(data: string, password?: string): Promise<EncryptionResult> {
    try {
      const key = password 
        ? await this.deriveKey(password)
        : await this.deriveKey(process.env.ENCRYPTION_KEY || 'default-key-change-in-production');
      
      const iv = randomBytes(this.config.encryption.ivLength);
      const cipher = createCipheriv(this.config.encryption.algorithm, key, iv);
      
      let encrypted = cipher.update(data, 'utf8', 'hex');
      encrypted += cipher.final('hex');
      
      const tag = (cipher as any).getAuthTag();

      return {
        encryptedData: encrypted,
        iv: iv.toString('hex'),
        tag: tag.toString('hex')
      };
    } catch (error) {
      this.logger.error('Encryption error:', error);
      throw new Error('Failed to encrypt data');
    }
  }

  /**
   * Déchiffrer des données avec AES-256-GCM
   */
  async decryptSensitiveData(
    encryptedData: string, 
    iv: string, 
    tag: string, 
    password?: string
  ): Promise<string> {
    try {
      const key = password 
        ? await this.deriveKey(password)
        : await this.deriveKey(process.env.ENCRYPTION_KEY || 'default-key-change-in-production');
      
      const decipher = createDecipheriv(
        this.config.encryption.algorithm, 
        key, 
        Buffer.from(iv, 'hex')
      );
      
      (decipher as any).setAuthTag(Buffer.from(tag, 'hex'));
      
      let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      
      return decrypted;
    } catch (error) {
      this.logger.error('Decryption error:', error);
      throw new Error('Failed to decrypt data');
    }
  }

  /**
   * Dériver une clé de chiffrement à partir d'un mot de passe
   */
  private async deriveKey(password: string): Promise<Buffer> {
    const salt = Buffer.from(process.env.ENCRYPTION_SALT || 'default-salt-change-in-production', 'utf8');
    return (await this.scryptAsync(password, salt, this.config.encryption.keyLength)) as Buffer;
  }

  /**
   * SYSTÈME D'ALERTES
   */

  /**
   * Déclencher une alerte de sécurité
   */
  async triggerSecurityAlert(alert: SecurityAlert): Promise<void> {
    try {
      if (!this.config.alerts.enabled) {
        return;
      }

      // Logger l'alerte
      this.logger.warn(`Security Alert [${alert.severity}]: ${alert.type}`, {
        userId: alert.userId,
        ipAddress: alert.ipAddress,
        details: alert.details
      });

      // Enregistrer dans les logs d'audit
      await this.auditService.logEvent({
        userId: alert.userId,
        action: AuditAction.SECURITY_ALERT,
        ipAddress: alert.ipAddress,
        userAgent: alert.userAgent,
        metadata: {
          alertType: alert.type,
          severity: alert.severity,
          details: alert.details
        }
      });

      // Envoyer des notifications selon la gravité
      if (alert.severity === 'HIGH' || alert.severity === 'CRITICAL') {
        await this.sendSecurityNotification(alert);
      }

      // Stocker l'alerte dans Redis pour monitoring en temps réel
      await this.storeAlertForMonitoring(alert);

    } catch (error) {
      this.logger.error('Error triggering security alert:', error);
    }
  }

  /**
   * Envoyer une notification de sécurité
   */
  private async sendSecurityNotification(alert: SecurityAlert): Promise<void> {
    try {
      // Ici vous pouvez implémenter l'envoi d'emails, webhooks, etc.
      // Pour l'instant, on log seulement
      this.logger.error(`CRITICAL SECURITY ALERT: ${alert.type}`, {
        severity: alert.severity,
        userId: alert.userId,
        ipAddress: alert.ipAddress,
        details: alert.details
      });

      // TODO: Implémenter l'envoi d'emails ou webhooks
      // await this.emailService.sendSecurityAlert(alert);
      // await this.webhookService.sendAlert(alert);
      
    } catch (error) {
      this.logger.error('Error sending security notification:', error);
    }
  }

  /**
   * Stocker l'alerte pour monitoring
   */
  private async storeAlertForMonitoring(alert: SecurityAlert): Promise<void> {
    try {
      const key = `security_alerts:${alert.type}:${Date.now()}`;
      await this.redis.setex(key, 86400, JSON.stringify(alert)); // 24h TTL
      
      // Maintenir un compteur d'alertes par type
      const counterKey = `alert_counter:${alert.type}`;
      await this.redis.incr(counterKey);
      await this.redis.expire(counterKey, 3600); // 1h TTL
      
    } catch (error) {
      this.logger.error('Error storing alert for monitoring:', error);
    }
  }

  /**
   * DÉTECTION D'ACTIVITÉS SUSPECTES
   */

  /**
   * Analyser une requête pour détecter des activités suspectes
   */
  async analyzeRequest(
    userId: string,
    ipAddress: string,
    userAgent: string,
    endpoint: string,
    method: string
  ): Promise<{ suspicious: boolean; reasons: string[] }> {
    const reasons: string[] = [];
    let suspicious = false;

    try {
      // 1. Vérifier les changements d'IP fréquents
      const ipChangeCheck = await this.checkFrequentIpChanges(userId, ipAddress);
      if (ipChangeCheck.suspicious) {
        suspicious = true;
        reasons.push('Frequent IP address changes detected');
      }

      // 2. Vérifier les User-Agent suspects
      if (this.isSuspiciousUserAgent(userAgent)) {
        suspicious = true;
        reasons.push('Suspicious user agent detected');
      }

      // 3. Vérifier les patterns d'accès anormaux
      const accessPattern = await this.checkAccessPattern(userId, endpoint, method);
      if (accessPattern.suspicious) {
        suspicious = true;
        reasons.push('Abnormal access pattern detected');
      }

      // 4. Vérifier les tentatives d'accès à des endpoints sensibles
      if (this.isSensitiveEndpoint(endpoint) && method !== 'GET') {
        const sensitiveAccessCheck = await this.checkSensitiveAccess(userId, endpoint);
        if (sensitiveAccessCheck.suspicious) {
          suspicious = true;
          reasons.push('Suspicious access to sensitive endpoint');
        }
      }

      // Déclencher une alerte si activité suspecte détectée
      if (suspicious) {
        await this.triggerSecurityAlert({
          type: 'SUSPICIOUS_ACTIVITY',
          severity: reasons.length > 2 ? 'HIGH' : 'MEDIUM',
          userId,
          ipAddress,
          userAgent,
          details: {
            endpoint,
            method,
            reasons,
            timestamp: new Date()
          },
          timestamp: new Date()
        });
      }

      return { suspicious, reasons };
    } catch (error) {
      this.logger.error('Error analyzing request:', error);
      return { suspicious: false, reasons: [] };
    }
  }

  /**
   * Vérifier les changements d'IP fréquents
   */
  private async checkFrequentIpChanges(userId: string, currentIp: string): Promise<{ suspicious: boolean }> {
    try {
      const key = `user_ips:${userId}`;
      const recentIps = await this.redis.lrange(key, 0, 9); // 10 dernières IPs
      
      // Ajouter la nouvelle IP
      await this.redis.lpush(key, currentIp);
      await this.redis.ltrim(key, 0, 9); // Garder seulement les 10 dernières
      await this.redis.expire(key, 3600); // 1h TTL

      // Compter les IPs uniques dans les 10 dernières
      const uniqueIps = new Set(recentIps);
      
      // Suspect si plus de 5 IPs différentes dans la dernière heure
      return { suspicious: uniqueIps.size > 5 };
    } catch (error) {
      this.logger.error('Error checking IP changes:', error);
      return { suspicious: false };
    }
  }

  /**
   * Vérifier si le User-Agent est suspect
   */
  private isSuspiciousUserAgent(userAgent: string): boolean {
    const suspiciousPatterns = [
      /bot/i,
      /crawler/i,
      /spider/i,
      /scraper/i,
      /curl/i,
      /wget/i,
      /python/i,
      /postman/i
    ];

    return suspiciousPatterns.some(pattern => pattern.test(userAgent));
  }

  /**
   * Vérifier les patterns d'accès anormaux
   */
  private async checkAccessPattern(userId: string, endpoint: string, method: string): Promise<{ suspicious: boolean }> {
    try {
      const key = `access_pattern:${userId}`;
      const now = Date.now();
      const windowMs = 300000; // 5 minutes
      
      // Enregistrer l'accès
      await this.redis.zadd(key, now, `${endpoint}:${method}:${now}`);
      await this.redis.zremrangebyscore(key, 0, now - windowMs);
      await this.redis.expire(key, 300); // 5 min TTL
      
      // Compter les accès dans la fenêtre
      const accessCount = await this.redis.zcard(key);
      
      // Suspect si plus de 50 requêtes en 5 minutes
      return { suspicious: accessCount > 50 };
    } catch (error) {
      this.logger.error('Error checking access pattern:', error);
      return { suspicious: false };
    }
  }

  /**
   * Vérifier si l'endpoint est sensible
   */
  private isSensitiveEndpoint(endpoint: string): boolean {
    const sensitiveEndpoints = [
      '/api/admin',
      '/api/users',
      '/api/auth/password',
      '/api/audit',
      '/api/security'
    ];

    return sensitiveEndpoints.some(sensitive => endpoint.startsWith(sensitive));
  }

  /**
   * Vérifier l'accès aux endpoints sensibles
   */
  private async checkSensitiveAccess(userId: string, endpoint: string): Promise<{ suspicious: boolean }> {
    try {
      const key = `sensitive_access:${userId}`;
      const now = Date.now();
      const windowMs = 3600000; // 1 heure
      
      await this.redis.zadd(key, now, `${endpoint}:${now}`);
      await this.redis.zremrangebyscore(key, 0, now - windowMs);
      await this.redis.expire(key, 3600); // 1h TTL
      
      const sensitiveAccessCount = await this.redis.zcard(key);
      
      // Suspect si plus de 10 accès sensibles en 1 heure
      return { suspicious: sensitiveAccessCount > 10 };
    } catch (error) {
      this.logger.error('Error checking sensitive access:', error);
      return { suspicious: false };
    }
  }

  /**
   * MÉTHODES UTILITAIRES
   */

  /**
   * Obtenir les statistiques de sécurité
   */
  async getSecurityStats(): Promise<{
    activeAlerts: number;
    lockedAccounts: number;
    rateLimitViolations: number;
    suspiciousActivities: number;
  }> {
    try {
      const [
        activeAlerts,
        lockedAccounts,
        rateLimitViolations,
        suspiciousActivities
      ] = await Promise.all([
        this.redis.keys('security_alerts:*').then((keys: string[]) => keys.length),
        this.userRepository.count({ where: { lockedUntil: new Date() } }),
        this.redis.keys('rate_limit:*').then((keys: string[]) => keys.length),
        this.redis.keys('alert_counter:SUSPICIOUS_ACTIVITY').then((keys: string[]) => 
          keys.length > 0 ? this.redis.get(keys[0]).then((val: string | null) => parseInt(val || '0')) : 0
        )
      ]);

      return {
        activeAlerts,
        lockedAccounts,
        rateLimitViolations,
        suspiciousActivities
      };
    } catch (error) {
      this.logger.error('Error getting security stats:', error);
      return {
        activeAlerts: 0,
        lockedAccounts: 0,
        rateLimitViolations: 0,
        suspiciousActivities: 0
      };
    }
  }

  /**
   * Nettoyer les données de sécurité expirées
   */
  async cleanupExpiredData(): Promise<void> {
    try {
      const patterns = [
        'rate_limit:*',
        'security_alerts:*',
        'user_ips:*',
        'access_pattern:*',
        'sensitive_access:*',
        'alert_counter:*'
      ];

      for (const pattern of patterns) {
        const keys = await this.redis.keys(pattern);
        if (keys.length > 0) {
          // Vérifier TTL et supprimer les clés expirées
          for (const key of keys) {
            const ttl = await this.redis.ttl(key);
            if (ttl === -1) { // Pas de TTL défini
              await this.redis.expire(key, 3600); // Définir 1h par défaut
            }
          }
        }
      }

      this.logger.log('Security data cleanup completed');
    } catch (error) {
      this.logger.error('Error during security cleanup:', error);
    }
  }
}
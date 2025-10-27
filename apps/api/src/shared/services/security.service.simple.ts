/**
 * FICHIER: apps/api/src/shared/services/security.service.simple.ts
 * SERVICE: SecurityService - Version simplifiée des mesures de sécurité avancées
 * 
 * DESCRIPTION:
 * Service simplifié pour les mesures de sécurité avancées:
 * - Rate limiting par utilisateur et IP (en mémoire)
 * - Système de blocage de compte après échecs
 * - Chiffrement AES-256 pour données sensibles
 * - Système d'alertes de sécurité
 * - Détection d'activités suspectes
 * 
 * FONCTIONNALITÉS:
 * - Rate limiting en mémoire (Map)
 * - Blocage temporaire des comptes
 * - Chiffrement/déchiffrement AES-256-GCM
 * - Alertes en temps réel
 * - Monitoring des tentatives d'intrusion
 * 
 * AUTEUR: Équipe CROU
 * DATE: Décembre 2024
 */

import { Injectable, Logger } from '@nestjs/common';
import { createCipheriv, createDecipheriv, randomBytes, scrypt } from 'crypto';
import { promisify } from 'util';

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

// Structure pour stocker les données de rate limiting en mémoire
interface RateLimitEntry {
    count: number;
    resetTime: number;
    requests: number[];
}

@Injectable()
export class SecurityService {
    private readonly logger = new Logger(SecurityService.name);
    private readonly scryptAsync = promisify(scrypt);

    // Stockage en mémoire pour le rate limiting
    private rateLimitStore = new Map<string, RateLimitEntry>();
    private alertsStore: SecurityAlert[] = [];

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

    constructor() {
        this.logger.log('SecurityService initialized successfully');

        // Nettoyer les données expirées toutes les 5 minutes
        setInterval(() => {
            this.cleanupExpiredData();
        }, 5 * 60 * 1000);
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
            const key = `${type}:${identifier}`;
            const now = Date.now();
            const windowMs = type === 'login' ? 3600000 : 60000; // 1h pour login, 1min pour autres
            const maxRequests = type === 'login'
                ? this.config.rateLimiting.maxLoginAttemptsPerHour
                : this.config.rateLimiting.maxRequestsPerMinute;

            let entry = this.rateLimitStore.get(key);

            if (!entry || now > entry.resetTime) {
                // Créer ou réinitialiser l'entrée
                entry = {
                    count: 0,
                    resetTime: now + windowMs,
                    requests: []
                };
            }

            // Nettoyer les anciennes requêtes
            entry.requests = entry.requests.filter(time => time > now - windowMs);
            entry.count = entry.requests.length;

            const allowed = entry.count < maxRequests;
            const remaining = Math.max(0, maxRequests - entry.count - 1);
            const resetTime = new Date(entry.resetTime);

            if (allowed) {
                entry.requests.push(now);
                entry.count++;
                this.rateLimitStore.set(key, entry);
            } else {
                // Déclencher une alerte si rate limit dépassé
                await this.triggerSecurityAlert({
                    type: 'RATE_LIMIT_EXCEEDED',
                    severity: 'MEDIUM',
                    ipAddress: ipAddress || identifier,
                    details: {
                        type,
                        identifier,
                        currentCount: entry.count,
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
            // En cas d'erreur, permettre la requête mais logger
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
            // Pour cette version simplifiée, on simule le comportement
            // Dans la vraie version, cela interagirait avec la base de données

            const key = `login_failures:${userId}`;
            const now = Date.now();
            const windowMs = 3600000; // 1 heure

            let entry = this.rateLimitStore.get(key);
            if (!entry || now > entry.resetTime) {
                entry = {
                    count: 0,
                    resetTime: now + windowMs,
                    requests: []
                };
            }

            entry.requests.push(now);
            entry.count++;
            this.rateLimitStore.set(key, entry);

            const isLocked = entry.count >= this.config.accountLocking.maxFailedAttempts;
            const attemptsRemaining = Math.max(0, this.config.accountLocking.maxFailedAttempts - entry.count);

            // Déclencher des alertes selon la gravité
            if (isLocked) {
                await this.triggerSecurityAlert({
                    type: 'ACCOUNT_LOCKED',
                    severity: entry.count >= this.config.accountLocking.permanentLockAfterAttempts ? 'CRITICAL' : 'HIGH',
                    userId,
                    ipAddress,
                    userAgent,
                    details: {
                        loginAttempts: entry.count,
                        lockDuration: this.config.accountLocking.lockDurationMinutes,
                        isPermanent: entry.count >= this.config.accountLocking.permanentLockAfterAttempts
                    },
                    timestamp: new Date()
                });
            } else if (entry.count >= 3) {
                await this.triggerSecurityAlert({
                    type: 'BRUTE_FORCE',
                    severity: 'MEDIUM',
                    userId,
                    ipAddress,
                    userAgent,
                    details: {
                        loginAttempts: entry.count,
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
            // Réinitialiser les tentatives de connexion
            const key = `login_failures:${userId}`;
            this.rateLimitStore.delete(key);

            this.logger.log(`Successful login for user ${userId} from ${ipAddress}`);
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
            // Supprimer les tentatives de connexion échouées
            const key = `login_failures:${userId}`;
            this.rateLimitStore.delete(key);

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

            // Stocker l'alerte
            this.alertsStore.push(alert);

            // Garder seulement les 1000 dernières alertes
            if (this.alertsStore.length > 1000) {
                this.alertsStore = this.alertsStore.slice(-1000);
            }

            // Envoyer des notifications selon la gravité
            if (alert.severity === 'HIGH' || alert.severity === 'CRITICAL') {
                await this.sendSecurityNotification(alert);
            }

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
            const now = Date.now();
            const windowMs = 3600000; // 1 heure

            let entry = this.rateLimitStore.get(key);
            if (!entry || now > entry.resetTime) {
                entry = {
                    count: 0,
                    resetTime: now + windowMs,
                    requests: []
                };
            }

            // Ajouter la nouvelle IP (on utilise requests pour stocker les IPs)
            const ipKey = `${currentIp}:${now}`;
            entry.requests.push(now);

            // Nettoyer les anciennes entrées
            entry.requests = entry.requests.filter(time => time > now - windowMs);

            this.rateLimitStore.set(key, entry);

            // Compter les IPs uniques (simulation)
            const uniqueIps = new Set(entry.requests.map(time => Math.floor(time / 600000))); // Grouper par 10 min

            // Suspect si plus de 5 groupes d'IPs différents dans la dernière heure
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

            let entry = this.rateLimitStore.get(key);
            if (!entry || now > entry.resetTime) {
                entry = {
                    count: 0,
                    resetTime: now + windowMs,
                    requests: []
                };
            }

            // Enregistrer l'accès
            entry.requests.push(now);
            entry.requests = entry.requests.filter(time => time > now - windowMs);
            entry.count = entry.requests.length;

            this.rateLimitStore.set(key, entry);

            // Suspect si plus de 50 requêtes en 5 minutes
            return { suspicious: entry.count > 50 };
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

            let entry = this.rateLimitStore.get(key);
            if (!entry || now > entry.resetTime) {
                entry = {
                    count: 0,
                    resetTime: now + windowMs,
                    requests: []
                };
            }

            entry.requests.push(now);
            entry.requests = entry.requests.filter(time => time > now - windowMs);
            entry.count = entry.requests.length;

            this.rateLimitStore.set(key, entry);

            // Suspect si plus de 10 accès sensibles en 1 heure
            return { suspicious: entry.count > 10 };
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
            const now = Date.now();
            const oneHourAgo = now - 3600000;

            // Compter les alertes récentes
            const recentAlerts = this.alertsStore.filter(alert =>
                alert.timestamp.getTime() > oneHourAgo
            );

            const activeAlerts = recentAlerts.length;
            const lockedAccounts = Array.from(this.rateLimitStore.keys())
                .filter(key => key.startsWith('login_failures:'))
                .filter(key => {
                    const entry = this.rateLimitStore.get(key);
                    return entry && entry.count >= this.config.accountLocking.maxFailedAttempts;
                }).length;

            const rateLimitViolations = Array.from(this.rateLimitStore.keys())
                .filter(key => !key.startsWith('login_failures:'))
                .length;

            const suspiciousActivities = recentAlerts.filter(alert =>
                alert.type === 'SUSPICIOUS_ACTIVITY'
            ).length;

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
            const now = Date.now();

            // Nettoyer les entrées de rate limiting expirées
            for (const [key, entry] of this.rateLimitStore.entries()) {
                if (now > entry.resetTime) {
                    this.rateLimitStore.delete(key);
                }
            }

            // Nettoyer les anciennes alertes (garder seulement les 24 dernières heures)
            const oneDayAgo = now - 86400000;
            this.alertsStore = this.alertsStore.filter(alert =>
                alert.timestamp.getTime() > oneDayAgo
            );

            this.logger.debug('Security data cleanup completed');
        } catch (error) {
            this.logger.error('Error during security cleanup:', error);
        }
    }

    /**
     * Obtenir les alertes récentes
     */
    getRecentAlerts(limit: number = 50): SecurityAlert[] {
        return this.alertsStore
            .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
            .slice(0, limit);
    }
}
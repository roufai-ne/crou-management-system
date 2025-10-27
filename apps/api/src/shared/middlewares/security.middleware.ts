/**
 * FICHIER: apps/api/src/shared/middlewares/security.middleware.ts
 * MIDDLEWARE: SecurityMiddleware - Middlewares de sécurité avancée
 * 
 * DESCRIPTION:
 * Middlewares pour appliquer les mesures de sécurité avancées:
 * - Rate limiting automatique
 * - Détection d'activités suspectes
 * - Protection contre les attaques
 * - Logging de sécurité
 * 
 * FONCTIONNALITÉS:
 * - Rate limiting par utilisateur/IP
 * - Analyse des requêtes suspectes
 * - Blocage automatique des comptes
 * - Headers de sécurité
 * 
 * AUTEUR: Équipe CROU
 * DATE: Décembre 2024
 */

import { Injectable, NestMiddleware, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { SecurityService } from '../services/security.service';

// Extension de l'interface Request pour inclure les données de sécurité
interface SecurityRequest extends Request {
  user?: {
    id: string;
    email: string;
    roleId: string;
    tenantId: string;
    permissions: string[];
  };
  security?: {
    rateLimitResult?: any;
    suspiciousActivity?: boolean;
    reasons?: string[];
  };
}

@Injectable()
export class RateLimitMiddleware implements NestMiddleware {
  private readonly logger = new Logger(RateLimitMiddleware.name);

  constructor(private readonly securityService: SecurityService) {}

  async use(req: SecurityRequest, res: Response, next: NextFunction) {
    try {
      const ipAddress = this.getClientIp(req);
      const userId = req.user?.id;
      
      // Vérifier le rate limiting par IP
      const ipRateLimit = await this.securityService.checkRateLimit(
        ipAddress, 
        'ip', 
        ipAddress
      );

      if (!ipRateLimit.allowed) {
        res.set({
          'X-RateLimit-Limit': '100',
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': ipRateLimit.resetTime.toISOString(),
          'Retry-After': ipRateLimit.retryAfter?.toString() || '60'
        });

        this.logger.warn(`Rate limit exceeded for IP: ${ipAddress}`);
        
        throw new HttpException({
          error: 'Rate limit exceeded',
          message: 'Too many requests from this IP address',
          retryAfter: ipRateLimit.retryAfter
        }, HttpStatus.TOO_MANY_REQUESTS);
      }

      // Vérifier le rate limiting par utilisateur si authentifié
      if (userId) {
        const userRateLimit = await this.securityService.checkRateLimit(
          userId, 
          'user', 
          ipAddress
        );

        if (!userRateLimit.allowed) {
          res.set({
            'X-RateLimit-User-Limit': '100',
            'X-RateLimit-User-Remaining': '0',
            'X-RateLimit-User-Reset': userRateLimit.resetTime.toISOString()
          });

          this.logger.warn(`User rate limit exceeded for user: ${userId}`);
          
          throw new HttpException({
            error: 'User rate limit exceeded',
            message: 'Too many requests from this user account',
            retryAfter: userRateLimit.retryAfter
          }, HttpStatus.TOO_MANY_REQUESTS);
        }

        // Ajouter les headers de rate limiting
        res.set({
          'X-RateLimit-User-Remaining': userRateLimit.remaining.toString(),
          'X-RateLimit-User-Reset': userRateLimit.resetTime.toISOString()
        });
      }

      // Ajouter les headers de rate limiting IP
      res.set({
        'X-RateLimit-Remaining': ipRateLimit.remaining.toString(),
        'X-RateLimit-Reset': ipRateLimit.resetTime.toISOString()
      });

      // Stocker le résultat pour utilisation ultérieure
      req.security = {
        ...req.security,
        rateLimitResult: { ip: ipRateLimit, user: userId ? await this.securityService.checkRateLimit(userId, 'user', ipAddress) : null },
        suspiciousActivity: false,
        reasons: []
      };

      next();
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      
      this.logger.error('Rate limiting error:', error);
      next(); // Continuer en cas d'erreur pour ne pas bloquer l'application
    }
  }

  private getClientIp(req: Request): string {
    return (
      req.headers['x-forwarded-for'] as string ||
      req.headers['x-real-ip'] as string ||
      req.connection.remoteAddress ||
      req.socket.remoteAddress ||
      'unknown'
    ).split(',')[0].trim();
  }
}

@Injectable()
export class SuspiciousActivityMiddleware implements NestMiddleware {
  private readonly logger = new Logger(SuspiciousActivityMiddleware.name);

  constructor(private readonly securityService: SecurityService) {}

  async use(req: SecurityRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      
      // Analyser seulement si l'utilisateur est authentifié
      if (userId) {
        const ipAddress = this.getClientIp(req);
        const userAgent = req.headers['user-agent'] || 'unknown';
        const endpoint = req.path;
        const method = req.method;

        // Analyser la requête pour détecter des activités suspectes
        const analysis = await this.securityService.analyzeRequest(
          userId,
          ipAddress,
          userAgent,
          endpoint,
          method
        );

        if (analysis.suspicious) {
          this.logger.warn(`Suspicious activity detected for user ${userId}:`, {
            ipAddress,
            endpoint,
            method,
            reasons: analysis.reasons
          });

          // Ajouter un header d'avertissement
          res.set('X-Security-Warning', 'Suspicious activity detected');
        }

        // Stocker les résultats pour utilisation ultérieure
        req.security = {
          rateLimitResult: req.security?.rateLimitResult,
          suspiciousActivity: analysis.suspicious,
          reasons: analysis.reasons
        };
      }

      next();
    } catch (error) {
      this.logger.error('Suspicious activity analysis error:', error);
      next(); // Continuer en cas d'erreur
    }
  }

  private getClientIp(req: Request): string {
    return (
      req.headers['x-forwarded-for'] as string ||
      req.headers['x-real-ip'] as string ||
      req.connection.remoteAddress ||
      req.socket.remoteAddress ||
      'unknown'
    ).split(',')[0].trim();
  }
}

@Injectable()
export class SecurityHeadersMiddleware implements NestMiddleware {
  private readonly logger = new Logger(SecurityHeadersMiddleware.name);

  use(req: Request, res: Response, next: NextFunction) {
    // Headers de sécurité standard
    res.set({
      // Protection XSS
      'X-XSS-Protection': '1; mode=block',
      
      // Empêcher le MIME type sniffing
      'X-Content-Type-Options': 'nosniff',
      
      // Empêcher l'embedding dans des frames
      'X-Frame-Options': 'DENY',
      
      // Politique de référent stricte
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      
      // Content Security Policy basique
      'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' https:; connect-src 'self' https:; frame-ancestors 'none';",
      
      // Permissions Policy
      'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=()',
      
      // HSTS (si HTTPS)
      ...(req.secure && {
        'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload'
      })
    });

    next();
  }
}

@Injectable()
export class LoginSecurityMiddleware implements NestMiddleware {
  private readonly logger = new Logger(LoginSecurityMiddleware.name);

  constructor(private readonly securityService: SecurityService) {}

  async use(req: SecurityRequest, res: Response, next: NextFunction) {
    try {
      // Appliquer seulement aux routes de login
      if (req.path === '/api/auth/login' && req.method === 'POST') {
        const ipAddress = this.getClientIp(req);
        const userAgent = req.headers['user-agent'] || 'unknown';

        // Rate limiting spécial pour les tentatives de login
        const loginRateLimit = await this.securityService.checkRateLimit(
          ipAddress, 
          'login', 
          ipAddress
        );

        if (!loginRateLimit.allowed) {
          res.set({
            'X-Login-RateLimit-Limit': '10',
            'X-Login-RateLimit-Remaining': '0',
            'X-Login-RateLimit-Reset': loginRateLimit.resetTime.toISOString(),
            'Retry-After': loginRateLimit.retryAfter?.toString() || '3600'
          });

          this.logger.warn(`Login rate limit exceeded for IP: ${ipAddress}`);
          
          throw new HttpException({
            error: 'Login rate limit exceeded',
            message: 'Too many login attempts from this IP address',
            retryAfter: loginRateLimit.retryAfter
          }, HttpStatus.TOO_MANY_REQUESTS);
        }

        // Ajouter les headers de rate limiting pour login
        res.set({
          'X-Login-RateLimit-Remaining': loginRateLimit.remaining.toString(),
          'X-Login-RateLimit-Reset': loginRateLimit.resetTime.toISOString()
        });

        // Analyser les patterns de login suspects
        const suspiciousPatterns = this.analyzeSuspiciousLoginPatterns(req);
        if (suspiciousPatterns.length > 0) {
          this.logger.warn(`Suspicious login patterns detected from IP ${ipAddress}:`, suspiciousPatterns);
          res.set('X-Login-Security-Warning', 'Suspicious login patterns detected');
        }
      }

      next();
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      
      this.logger.error('Login security middleware error:', error);
      next();
    }
  }

  private getClientIp(req: Request): string {
    return (
      req.headers['x-forwarded-for'] as string ||
      req.headers['x-real-ip'] as string ||
      req.connection.remoteAddress ||
      req.socket.remoteAddress ||
      'unknown'
    ).split(',')[0].trim();
  }

  private analyzeSuspiciousLoginPatterns(req: Request): string[] {
    const patterns: string[] = [];
    const userAgent = req.headers['user-agent'] || '';
    const body = req.body || {};

    // Vérifier les User-Agents suspects
    if (!userAgent || userAgent.length < 10) {
      patterns.push('Missing or suspicious user agent');
    }

    // Vérifier les patterns d'email suspects
    if (body.email) {
      if (body.email.includes('..') || body.email.includes('--')) {
        patterns.push('Suspicious email format');
      }
      
      if (body.email.length > 100) {
        patterns.push('Unusually long email address');
      }
    }

    // Vérifier les patterns de mot de passe suspects
    if (body.password) {
      if (body.password.length > 200) {
        patterns.push('Unusually long password');
      }
      
      // Détecter les tentatives d'injection
      const injectionPatterns = [/'/, /--/, /;/, /\/\*/, /\*\//, /xp_/, /sp_/];
      if (injectionPatterns.some(pattern => pattern.test(body.password))) {
        patterns.push('Potential SQL injection attempt');
      }
    }

    return patterns;
  }
}

// Middleware composite pour appliquer toutes les mesures de sécurité
@Injectable()
export class ComprehensiveSecurityMiddleware implements NestMiddleware {
  private readonly logger = new Logger(ComprehensiveSecurityMiddleware.name);

  constructor(private readonly securityService: SecurityService) {}

  async use(req: SecurityRequest, res: Response, next: NextFunction) {
    try {
      const startTime = Date.now();
      
      // Appliquer les headers de sécurité
      const securityHeaders = new SecurityHeadersMiddleware();
      securityHeaders.use(req, res, () => {});

      // Analyser la requête
      const ipAddress = this.getClientIp(req);
      const userAgent = req.headers['user-agent'] || 'unknown';
      const userId = req.user?.id;

      // Logger la requête pour monitoring
      this.logger.debug(`Security check for ${req.method} ${req.path}`, {
        userId,
        ipAddress,
        userAgent: userAgent.substring(0, 100) // Limiter la longueur
      });

      // Vérifier les blacklists IP (si implémentées)
      if (await this.isBlacklistedIp(ipAddress)) {
        this.logger.warn(`Blocked request from blacklisted IP: ${ipAddress}`);
        throw new HttpException({
          error: 'Access denied',
          message: 'Your IP address has been blocked'
        }, HttpStatus.FORBIDDEN);
      }

      // Mesurer le temps de traitement de sécurité
      const processingTime = Date.now() - startTime;
      res.set('X-Security-Processing-Time', processingTime.toString());

      next();
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      
      this.logger.error('Comprehensive security middleware error:', error);
      next();
    }
  }

  private getClientIp(req: Request): string {
    return (
      req.headers['x-forwarded-for'] as string ||
      req.headers['x-real-ip'] as string ||
      req.connection.remoteAddress ||
      req.socket.remoteAddress ||
      'unknown'
    ).split(',')[0].trim();
  }

  private async isBlacklistedIp(ipAddress: string): Promise<boolean> {
    // TODO: Implémenter la vérification de blacklist IP
    // Peut utiliser Redis ou une base de données
    return false;
  }
}

// Factory pour créer les middlewares de sécurité
export class SecurityMiddlewareFactory {
  static createRateLimitMiddleware(securityService: SecurityService) {
    return new RateLimitMiddleware(securityService);
  }

  static createSuspiciousActivityMiddleware(securityService: SecurityService) {
    return new SuspiciousActivityMiddleware(securityService);
  }

  static createLoginSecurityMiddleware(securityService: SecurityService) {
    return new LoginSecurityMiddleware(securityService);
  }

  static createComprehensiveSecurityMiddleware(securityService: SecurityService) {
    return new ComprehensiveSecurityMiddleware(securityService);
  }
}
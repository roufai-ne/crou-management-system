/**
 * FICHIER: apps/api/src/modules/security/security.controller.ts
 * CONTRÔLEUR: SecurityController - API de gestion de la sécurité
 * 
 * DESCRIPTION:
 * Contrôleur pour exposer les fonctionnalités de sécurité avancées:
 * - Consultation des statistiques de sécurité
 * - Gestion des comptes bloqués
 * - Consultation des alertes de sécurité
 * - Configuration des paramètres de sécurité
 * 
 * ENDPOINTS:
 * - GET /api/security/stats - Statistiques de sécurité
 * - GET /api/security/alerts - Liste des alertes
 * - POST /api/security/unlock-account - Débloquer un compte
 * - GET /api/security/rate-limits - État des rate limits
 * - POST /api/security/encrypt - Chiffrer des données
 * - POST /api/security/decrypt - Déchiffrer des données
 * 
 * AUTEUR: Équipe CROU
 * DATE: Décembre 2024
 */

import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  Param,
  UseGuards,
  Request,
  HttpException,
  HttpStatus,
  Logger
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';

import { SecurityService } from '../../shared/services/security.service';
import { AuditService } from '../../shared/services/audit.service';
import { AuditAction } from '../../../packages/database/src/entities/AuditLog.entity';

// DTOs pour les requêtes et réponses
export class UnlockAccountDto {
  userId!: string;
  reason?: string;
}

export class EncryptDataDto {
  data!: string;
  password?: string;
}

export class DecryptDataDto {
  encryptedData!: string;
  iv!: string;
  tag!: string;
  password?: string;
}

export class SecurityStatsResponse {
  activeAlerts!: number;
  lockedAccounts!: number;
  rateLimitViolations!: number;
  suspiciousActivities!: number;
  timestamp!: Date;
}

export class SecurityAlertResponse {
  id!: string;
  type!: string;
  severity!: string;
  userId?: string;
  ipAddress!: string;
  userAgent?: string;
  details!: Record<string, any>;
  timestamp!: Date;
}

export class RateLimitStatusResponse {
  userId?: string;
  ipAddress!: string;
  limits!: {
    user?: {
      allowed: boolean;
      remaining: number;
      resetTime: Date;
    };
    ip: {
      allowed: boolean;
      remaining: number;
      resetTime: Date;
    };
    login: {
      allowed: boolean;
      remaining: number;
      resetTime: Date;
    };
  };
}

@ApiTags('Security')
@Controller('api/security')
export class SecurityController {
  private readonly logger = new Logger(SecurityController.name);

  constructor(
    private readonly securityService: SecurityService,
    private readonly auditService: AuditService
  ) {}

  /**
   * Obtenir les statistiques de sécurité
   */
  @Get('stats')
  @ApiOperation({ summary: 'Obtenir les statistiques de sécurité' })
  @ApiResponse({ status: 200, description: 'Statistiques récupérées avec succès', type: SecurityStatsResponse })
  async getSecurityStats(@Request() req: any): Promise<SecurityStatsResponse> {
    try {
      const stats = await this.securityService.getSecurityStats();
      
      // Logger l'accès aux statistiques
      await this.auditService.logEvent({
        userId: req.user.id,
        action: AuditAction.READ,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
        metadata: { stats }
      });

      return {
        ...stats,
        timestamp: new Date()
      };
    } catch (error) {
      this.logger.error('Error getting security stats:', error);
      throw new HttpException(
        'Failed to retrieve security statistics',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Obtenir la liste des alertes de sécurité
   */
  @Get('alerts')
  @ApiOperation({ summary: 'Obtenir les alertes de sécurité' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Numéro de page' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Nombre d\'éléments par page' })
  @ApiQuery({ name: 'severity', required: false, type: String, description: 'Filtrer par gravité' })
  @ApiQuery({ name: 'type', required: false, type: String, description: 'Filtrer par type' })
  @ApiResponse({ status: 200, description: 'Alertes récupérées avec succès' })
  async getSecurityAlerts(
    @Request() req: any,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 50,
    @Query('severity') severity?: string,
    @Query('type') type?: string
  ): Promise<{
    alerts: SecurityAlertResponse[];
    total: number;
    page: number;
    limit: number;
  }> {
    try {
      // Pour l'instant, on récupère depuis les logs d'audit
      // TODO: Implémenter une table dédiée aux alertes de sécurité
      // Pour l'instant, retourner des données mockées
      // TODO: Implémenter la récupération depuis les logs d'audit
      const alerts: SecurityAlertResponse[] = [];
      const total = 0;

      // Logger l'accès aux alertes
      await this.auditService.logEvent({
        userId: req.user.id,
        action: AuditAction.READ,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
        metadata: { resultCount: alerts.length }
      });

      return {
        alerts,
        total,
        page,
        limit
      };
    } catch (error) {
      this.logger.error('Error getting security alerts:', error);
      throw new HttpException(
        'Failed to retrieve security alerts',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Débloquer un compte utilisateur
   */
  @Post('unlock-account')
  @ApiOperation({ summary: 'Débloquer un compte utilisateur' })
  @ApiResponse({ status: 200, description: 'Compte débloqué avec succès' })
  @ApiResponse({ status: 404, description: 'Utilisateur non trouvé' })
  async unlockAccount(
    @Request() req: any,
    @Body() unlockDto: UnlockAccountDto
  ): Promise<{ message: string; userId: string }> {
    try {
      await this.securityService.unlockAccount(unlockDto.userId, req.user.id);

      // Logger l'action de déblocage
      await this.auditService.logEvent({
        userId: req.user.id,
        action: AuditAction.UPDATE,
        recordId: unlockDto.userId,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
        metadata: {
          action: 'account_unlocked',
          targetUserId: unlockDto.userId,
          reason: unlockDto.reason
        }
      });

      this.logger.log(`Account ${unlockDto.userId} unlocked by admin ${req.user.id}`);

      return {
        message: 'Account unlocked successfully',
        userId: unlockDto.userId
      };
    } catch (error) {
      this.logger.error('Error unlocking account:', error);
      
      if ((error as any).message === 'User not found') {
        throw new HttpException('User not found', HttpStatus.NOT_FOUND);
      }
      
      throw new HttpException(
        'Failed to unlock account',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Obtenir l'état des rate limits pour un utilisateur/IP
   */
  @Get('rate-limits')
  @ApiOperation({ summary: 'Obtenir l\'état des rate limits' })
  @ApiQuery({ name: 'userId', required: false, type: String, description: 'ID utilisateur' })
  @ApiQuery({ name: 'ipAddress', required: false, type: String, description: 'Adresse IP' })
  @ApiResponse({ status: 200, description: 'État des rate limits récupéré', type: RateLimitStatusResponse })
  async getRateLimitStatus(
    @Request() req: any,
    @Query('userId') userId?: string,
    @Query('ipAddress') ipAddress?: string
  ): Promise<RateLimitStatusResponse> {
    try {
      const targetUserId = userId || req.user.id;
      const targetIpAddress = ipAddress || req.ip;

      // Vérifier les différents types de rate limits
      const [userLimit, ipLimit, loginLimit] = await Promise.all([
        targetUserId ? this.securityService.checkRateLimit(targetUserId, 'user', targetIpAddress) : null,
        this.securityService.checkRateLimit(targetIpAddress, 'ip', targetIpAddress),
        this.securityService.checkRateLimit(targetIpAddress, 'login', targetIpAddress)
      ]);

      const response: RateLimitStatusResponse = {
        userId: targetUserId,
        ipAddress: targetIpAddress,
        limits: {
          ip: ipLimit,
          login: loginLimit,
          ...(userLimit && { user: userLimit })
        }
      };

      // Logger la consultation des rate limits
      await this.auditService.logEvent({
        userId: req.user.id,
        action: AuditAction.READ,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
        metadata: {
          targetUserId,
          targetIpAddress,
          limits: response.limits
        }
      });

      return response;
    } catch (error) {
      this.logger.error('Error getting rate limit status:', error);
      throw new HttpException(
        'Failed to retrieve rate limit status',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Chiffrer des données sensibles
   */
  @Post('encrypt')
  @ApiOperation({ summary: 'Chiffrer des données sensibles' })
  @ApiResponse({ status: 200, description: 'Données chiffrées avec succès' })
  async encryptData(
    @Request() req: any,
    @Body() encryptDto: EncryptDataDto
  ): Promise<{
    encryptedData: string;
    iv: string;
    tag: string;
    timestamp: Date;
  }> {
    try {
      if (!encryptDto.data || encryptDto.data.trim().length === 0) {
        throw new HttpException('Data to encrypt is required', HttpStatus.BAD_REQUEST);
      }

      const result = await this.securityService.encryptSensitiveData(
        encryptDto.data,
        encryptDto.password
      );

      // Logger l'opération de chiffrement (sans les données)
      await this.auditService.logEvent({
        userId: req.user.id,
        action: AuditAction.SENSITIVE_OPERATION,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
        metadata: {
          operation: 'encrypt',
          dataLength: encryptDto.data.length,
          hasCustomPassword: !!encryptDto.password
        }
      });

      return {
        ...result,
        timestamp: new Date()
      };
    } catch (error) {
      this.logger.error('Error encrypting data:', error);
      
      // Logger l'échec
      await this.auditService.logEvent({
        userId: req.user.id,
        action: AuditAction.SENSITIVE_OPERATION_FAILED,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
        metadata: {
          operation: 'encrypt',
          error: (error as any).message
        }
      });

      throw new HttpException(
        'Failed to encrypt data',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Déchiffrer des données
   */
  @Post('decrypt')
  @ApiOperation({ summary: 'Déchiffrer des données' })
  @ApiResponse({ status: 200, description: 'Données déchiffrées avec succès' })
  async decryptData(
    @Request() req: any,
    @Body() decryptDto: DecryptDataDto
  ): Promise<{
    decryptedData: string;
    timestamp: Date;
  }> {
    try {
      if (!decryptDto.encryptedData || !decryptDto.iv || !decryptDto.tag) {
        throw new HttpException(
          'Encrypted data, IV, and tag are required',
          HttpStatus.BAD_REQUEST
        );
      }

      const decryptedData = await this.securityService.decryptSensitiveData(
        decryptDto.encryptedData,
        decryptDto.iv,
        decryptDto.tag,
        decryptDto.password
      );

      // Logger l'opération de déchiffrement (sans les données)
      await this.auditService.logEvent({
        userId: req.user.id,
        action: AuditAction.SENSITIVE_OPERATION_SUCCESS,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
        metadata: {
          operation: 'decrypt',
          hasCustomPassword: !!decryptDto.password
        }
      });

      return {
        decryptedData,
        timestamp: new Date()
      };
    } catch (error) {
      this.logger.error('Error decrypting data:', error);
      
      // Logger l'échec
      await this.auditService.logEvent({
        userId: req.user.id,
        action: AuditAction.SENSITIVE_OPERATION_FAILED,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
        metadata: {
          operation: 'decrypt',
          error: (error as any).message
        }
      });

      throw new HttpException(
        'Failed to decrypt data',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Nettoyer les données de sécurité expirées
   */
  @Post('cleanup')
  @ApiOperation({ summary: 'Nettoyer les données de sécurité expirées' })
  @ApiResponse({ status: 200, description: 'Nettoyage effectué avec succès' })
  async cleanupExpiredData(@Request() req: any): Promise<{ message: string; timestamp: Date }> {
    try {
      await this.securityService.cleanupExpiredData();

      // Logger l'opération de nettoyage
      await this.auditService.logEvent({
        userId: req.user.id,
        action: AuditAction.CUSTOM,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
        metadata: {
          operation: 'cleanup_expired_data'
        }
      });

      this.logger.log(`Security data cleanup performed by admin ${req.user.id}`);

      return {
        message: 'Security data cleanup completed successfully',
        timestamp: new Date()
      };
    } catch (error) {
      this.logger.error('Error during security cleanup:', error);
      throw new HttpException(
        'Failed to cleanup security data',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Obtenir les métriques de sécurité en temps réel
   */
  @Get('metrics')
  @ApiOperation({ summary: 'Obtenir les métriques de sécurité en temps réel' })
  @ApiResponse({ status: 200, description: 'Métriques récupérées avec succès' })
  async getSecurityMetrics(@Request() req: any): Promise<{
    rateLimits: {
      activeBlocks: number;
      requestsPerMinute: number;
    };
    authentication: {
      failedLogins: number;
      lockedAccounts: number;
      suspiciousActivities: number;
    };
    alerts: {
      total: number;
      critical: number;
      high: number;
      medium: number;
      low: number;
    };
    timestamp: Date;
  }> {
    try {
      const stats = await this.securityService.getSecurityStats();
      
      // TODO: Implémenter des métriques plus détaillées
      const metrics = {
        rateLimits: {
          activeBlocks: stats.rateLimitViolations,
          requestsPerMinute: 0 // À implémenter
        },
        authentication: {
          failedLogins: 0, // À implémenter
          lockedAccounts: stats.lockedAccounts,
          suspiciousActivities: stats.suspiciousActivities
        },
        alerts: {
          total: stats.activeAlerts,
          critical: 0, // À implémenter
          high: 0,
          medium: 0,
          low: 0
        },
        timestamp: new Date()
      };

      // Logger l'accès aux métriques
      await this.auditService.logEvent({
        userId: req.user.id,
        action: AuditAction.READ,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
        metadata: { metrics }
      });

      return metrics;
    } catch (error) {
      this.logger.error('Error getting security metrics:', error);
      throw new HttpException(
        'Failed to retrieve security metrics',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
}
/**
 * FICHIER: apps/api/src/modules/security/security.module.ts
 * MODULE: SecurityModule - Module de sécurité avancée
 * 
 * DESCRIPTION:
 * Module NestJS pour organiser tous les composants de sécurité:
 * - Services de sécurité
 * - Contrôleurs de sécurité
 * - Middlewares de sécurité
 * - Guards et décorateurs
 * 
 * EXPORTS:
 * - SecurityService pour utilisation dans d'autres modules
 * - Middlewares de sécurité
 * - Contrôleur de sécurité
 * 
 * AUTEUR: Équipe CROU
 * DATE: Décembre 2024
 */

import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

// Entités
import { User } from '../../../../packages/database/src/entities/User.entity';
import { AuditLog } from '../../../../packages/database/src/entities/AuditLog.entity';

// Services
import { SecurityService } from '../../shared/services/security.service';
import { AuditService } from '../../shared/services/audit.service';

// Contrôleurs
import { SecurityController } from './security.controller';

// Middlewares
import {
  RateLimitMiddleware,
  SuspiciousActivityMiddleware,
  SecurityHeadersMiddleware,
  LoginSecurityMiddleware,
  ComprehensiveSecurityMiddleware
} from '../../shared/middlewares/security.middleware';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, AuditLog])
  ],
  providers: [
    SecurityService,
    AuditService,
    RateLimitMiddleware,
    SuspiciousActivityMiddleware,
    SecurityHeadersMiddleware,
    LoginSecurityMiddleware,
    ComprehensiveSecurityMiddleware
  ],
  controllers: [SecurityController],
  exports: [
    SecurityService,
    RateLimitMiddleware,
    SuspiciousActivityMiddleware,
    SecurityHeadersMiddleware,
    LoginSecurityMiddleware,
    ComprehensiveSecurityMiddleware
  ]
})
export class SecurityModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    // Appliquer les headers de sécurité à toutes les routes
    consumer
      .apply(SecurityHeadersMiddleware)
      .forRoutes('*');

    // Appliquer le rate limiting à toutes les routes API
    consumer
      .apply(RateLimitMiddleware)
      .forRoutes('api/*');

    // Appliquer la sécurité spéciale pour les routes de login
    consumer
      .apply(LoginSecurityMiddleware)
      .forRoutes('api/auth/login');

    // Appliquer la détection d'activités suspectes aux routes protégées
    consumer
      .apply(SuspiciousActivityMiddleware)
      .forRoutes('api/*');
  }
}
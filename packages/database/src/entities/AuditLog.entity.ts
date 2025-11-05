/**
 * FICHIER: packages\database\src\entities\AuditLog.entity.ts
 * ENTITÉ: AuditLog - Journal d'audit pour traçabilité
 */

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  JoinColumn
} from 'typeorm';
import { User } from './User.entity';
import { Tenant } from './Tenant.entity';

export enum AuditAction {
  CREATE = 'create',
  UPDATE = 'update', 
  DELETE = 'delete',
  LOGIN = 'login',
  LOGIN_FAILED = 'login_failed',
  LOGOUT = 'logout',
  VIEW = 'view',
  READ = 'read',
  EXPORT = 'export',
  VALIDATE = 'validate',
  TOKEN_REFRESH = 'token_refresh',
  PASSWORD_CHANGE = 'password_change',
  PERMISSION_DENIED = 'permission_denied',
  SECURITY_ALERT = 'security_alert',
  CUSTOM = 'custom',
  HTTP_REQUEST = 'http_request',
  SENSITIVE_OPERATION = 'sensitive_operation',
  SENSITIVE_OPERATION_SUCCESS = 'sensitive_operation_success',
  SENSITIVE_OPERATION_FAILED = 'sensitive_operation_failed'
}

@Entity('audit_logs')
export class AuditLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'user_id' })
  userId: string;

  @ManyToOne(() => User, {
    onDelete: 'SET NULL'
  })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ type: 'enum', enum: AuditAction })
  action: AuditAction;

  @Column({ type: 'varchar', length: 100 })
  tableName: string;

  // Nom de la ressource (pour compatibilité API)
  @Column({ type: 'varchar', length: 100, nullable: true })
  resource: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  recordId: string;

  // ID de la ressource (pour compatibilité API)
  @Column({ type: 'varchar', length: 255, nullable: true, name: 'resource_id' })
  resourceId: string;

  // Succès ou échec de l'opération (pour sécurité)
  @Column({ type: 'boolean', default: true })
  success: boolean;

  @Column({ type: 'jsonb', nullable: true })
  oldValues: Record<string, any>;

  @Column({ type: 'jsonb', nullable: true })
  newValues: Record<string, any>;

  @Column({ type: 'inet', nullable: true })
  ipAddress: string;

  @Column({ type: 'text', nullable: true })
  userAgent: string;

  // Session ID (pour traçabilité)
  @Column({ type: 'varchar', length: 255, nullable: true, name: 'session_id' })
  sessionId: string;

  // Tenant ID (pour multi-tenant)
  @Column({ type: 'uuid', nullable: true, name: 'tenant_id' })
  tenantId: string;

  @ManyToOne(() => Tenant, {
    onDelete: 'SET NULL'
  })
  @JoinColumn({ name: 'tenant_id' })
  tenant: Tenant;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;
}
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

  @Column({ type: 'varchar', length: 255, nullable: true })
  recordId: string;

  @Column({ type: 'jsonb', nullable: true })
  oldValues: Record<string, any>;

  @Column({ type: 'jsonb', nullable: true })
  newValues: Record<string, any>;

  @Column({ type: 'inet', nullable: true })
  ipAddress: string;

  @Column({ type: 'text', nullable: true })
  userAgent: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;
}
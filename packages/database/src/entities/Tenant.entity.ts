/**
 * FICHIER: packages\database\src\entities\Tenant.entity.ts
 * ENTITÉ: Tenant - Tenants multi-tenant (Ministère + 8 CROU)
 */


import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn
} from 'typeorm';
import { User } from './User.entity';

export enum TenantType {
  MINISTERE = 'ministere',
  CROU = 'crou'
}

@Entity('tenants')
export class Tenant {
  @PrimaryGeneratedColumn('uuid')
  id: string = '';

  @Column({ type: 'varchar', length: 255, unique: true })
  name: string = '';

  @Column({ type: 'varchar', length: 50, unique: true })
  code: string = '';

  @Column({ type: 'enum', enum: TenantType })
  type: TenantType = TenantType.CROU;

  @Column({ type: 'varchar', length: 255, nullable: true })
  region: string | null = null;

  @Column({ type: 'jsonb', nullable: true })
  config: Record<string, any> = {};

  @Column({ type: 'boolean', default: true })
  isActive: boolean = true;

  // Relations
  @OneToMany(() => User, user => user.tenant)
  users: User[] ;

  // Audit
  @CreateDateColumn()
  createdAt: Date = new Date();

  @UpdateDateColumn()
  updatedAt: Date = new Date();
}
/**
 * FICHIER: packages\database\src\entities\Tenant.entity.ts
 * ENTITÉ: Tenant - Tenants multi-tenant (Ministère + 8 CROU)
 */


import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn
} from 'typeorm';
import { User } from './User.entity';

export enum TenantType {
  MINISTERE = 'ministere',
  CROU = 'crou',
  SERVICE = 'service'
}

export enum ServiceType {
  FINANCIAL = 'financial',
  STOCKS = 'stocks',
  TRANSPORT = 'transport',
  LOGEMENT = 'logement',
  RESTAURATION = 'restauration'
}

@Entity('tenants')
export class Tenant {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255, unique: true })
  name: string;

  @Column({ type: 'varchar', length: 50, unique: true })
  code: string;

  @Column({ type: 'enum', enum: TenantType })
  type: TenantType;

  @Column({ type: 'varchar', length: 255, nullable: true })
  region: string | null;

  @Column({ type: 'jsonb', nullable: true })
  config: Record<string, any>;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  // ========================================
  // HIÉRARCHIE TENANT (NOUVEAU)
  // ========================================

  /**
   * Tenant parent dans la hiérarchie
   * null pour le Ministère (niveau 0)
   * Ministère pour les CROU (niveau 1)
   * CROU pour les Services (niveau 2)
   */
  @Column({ type: 'uuid', nullable: true })
  parentId: string | null;

  @ManyToOne('Tenant', (tenant: Tenant) => tenant.children, { nullable: true })
  parent: Tenant | null;

  @OneToMany('Tenant', (tenant: Tenant) => tenant.parent)
  children: Tenant[];

  /**
   * Chemin matérialisé pour requêtes hiérarchiques efficaces
   * Format: "ministere-001/crou-niamey/crou-niamey-stocks"
   * Permet de retrouver rapidement tous les descendants
   */
  @Column({ type: 'varchar', length: 500, default: '' })
  path: string;

  /**
   * Niveau dans la hiérarchie
   * 0 = Ministère (global)
   * 1 = CROU (régional)
   * 2 = Service (opérationnel)
   */
  @Column({ type: 'int', default: 0 })
  level: number;

  /**
   * Type de service (uniquement pour les tenants de type SERVICE)
   * Définit le module fonctionnel géré par ce service
   */
  @Column({
    type: 'enum',
    enum: ServiceType,
    nullable: true
  })
  serviceType: ServiceType | null;

  // Relations
  @OneToMany(() => User, user => user.tenant)
  users: User[];

  // Audit
  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // ========================================
  // MÉTHODES HIÉRARCHIE
  // ========================================

  /**
   * Vérifie si ce tenant est un descendant d'un autre tenant
   * Utilise le path matérialisé pour une vérification rapide
   */
  isDescendantOf(ancestorPath: string): boolean {
    return this.path.startsWith(ancestorPath + '/');
  }

  /**
   * Vérifie si ce tenant est un ancêtre d'un autre tenant
   */
  isAncestorOf(descendantPath: string): boolean {
    return descendantPath.startsWith(this.path + '/');
  }

  /**
   * Récupère les IDs de tous les tenants accessibles depuis ce tenant
   * - Ministère: Accès à tous les tenants (via getDescendants)
   * - CROU: Accès à ses services
   * - Service: Accès uniquement à lui-même
   */
  getAccessScopeIds(): string[] {
    const ids: string[] = [this.id];

    // Les enfants (si chargés) sont ajoutés
    if (this.children && this.children.length > 0) {
      for (const child of this.children) {
        ids.push(...child.getAccessScopeIds());
      }
    }

    return ids;
  }

  /**
   * Retourne le niveau hiérarchique en format lisible
   */
  getLevelName(): string {
    switch (this.level) {
      case 0:
        return 'Ministère';
      case 1:
        return 'CROU';
      case 2:
        return 'Service';
      default:
        return 'Inconnu';
    }
  }

  /**
   * Construit le path à partir du parent
   */
  buildPath(): string {
    if (!this.parent) {
      return this.code;
    }
    return `${this.parent.path}/${this.code}`;
  }
}
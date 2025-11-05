# Architecture Hiérarchique Multi-Tenant - Document d'Implémentation

## 📋 Table des Matières

1. [Vue d'ensemble](#vue-densemble)
2. [Structure Hiérarchique](#structure-hiérarchique)
3. [Matrice des Permissions](#matrice-des-permissions)
4. [Impact sur les Composants](#impact-sur-les-composants)
5. [Plan de Migration](#plan-de-migration)
6. [Risques et Mitigation](#risques-et-mitigation)

---

## 1. Vue d'ensemble

### Objectif
Transformer l'architecture multi-tenant plate actuelle en une architecture **hiérarchique à 3 niveaux** avec héritage des permissions et isolation stricte par niveau organisationnel.

### Principe Fondamental
**"Lecture en haut, Écriture en bas"**
- **Ministère**: Supervision (lecture) + Allocations stratégiques
- **Directeurs CROU**: Lecture sur services + Gestion utilisateurs
- **Chefs Service**: Saisie opérationnelle quotidienne

---

## 2. Structure Hiérarchique

### 2.1 Niveaux Organisationnels

```
Niveau 0: GLOBAL
└── Superuser (is_superuser = true)
    └── Bypass complet de toutes les règles
    └── Utilisé pour: Support technique, migrations, debug

Niveau 1: MINISTÈRE (Supervision)
└── Ministère MESRIT (tenant_id: ministere-001)
    ├── Ministre (lecture globale + allocations budgétaires)
    ├── Directeur Affaires Financières (lecture + validation budgets)
    ├── Responsable Approvisionnements (lecture + allocation stocks stratégiques)
    └── Contrôleur Budgétaire (lecture + audit)

Niveau 2: CROU (Coordination)
├── CROU Niamey (tenant_id: crou-niamey, parent_id: ministere-001)
│   ├── Directeur CROU (lecture services + gestion utilisateurs)
│   └── Secrétaire Administratif (lecture + admin)
│
├── CROU Maradi (tenant_id: crou-maradi, parent_id: ministere-001)
└── CROU Zinder (tenant_id: crou-zinder, parent_id: ministere-001)

Niveau 3: SERVICES (Opérationnel)
└── CROU Niamey
    ├── Service Financier (tenant_id: crou-niamey-finance, parent_id: crou-niamey)
    │   ├── Chef Financier (lecture + écriture finance)
    │   └── Comptable (écriture transactions)
    │
    ├── Service Stocks (tenant_id: crou-niamey-stocks, parent_id: crou-niamey)
    │   ├── Intendant (lecture + écriture stocks + validation)
    │   └── Magasinier (écriture mouvements stocks)
    │
    ├── Service Transport (tenant_id: crou-niamey-transport, parent_id: crou-niamey)
    │   └── Chef Transport (lecture + écriture transport)
    │
    ├── Service Logement (tenant_id: crou-niamey-logement, parent_id: crou-niamey)
    │   └── Chef Logement (lecture + écriture logement)
    │
    └── Service Restauration (tenant_id: crou-niamey-restauration, parent_id: crou-niamey)
        └── Chef Restauration (lecture stocks + écriture menus)
```

---

## 3. Matrice des Permissions

### 3.1 Permissions par Niveau et Module

#### Légende
- **R**: Read (Lecture)
- **W**: Write (Écriture/Création)
- **V**: Validate (Validation)
- **E**: Export
- **A**: Allocate (Allocation stratégique)

### 3.2 Niveau 1: MINISTÈRE (Supervision)

| Rôle | Dashboard | Financial | Stocks | Transport | Logement | Users | Admin |
|------|-----------|-----------|--------|-----------|----------|-------|-------|
| **Ministre** | R | R, V, A | R, A | R | R | R | R, V |
| **Dir. Finances** | R | R, V, A | R | R | R | R | R |
| **Resp. Appro** | R | R | R, A | R | R | R | R |
| **Contrôleur** | R, E | R, E | R, E | R, E | R, E | R | R, E |

**Permissions Spéciales Ministère:**
```typescript
// Allocations budgétaires
'financial:allocate' → Uniquement Ministre + Dir. Finances
  → Allouer des budgets aux CROUs
  → Approuver des budgets > seuil (ex: 10M FCFA)

// Allocations stocks stratégiques
'stocks:allocate' → Uniquement Ministre + Resp. Appro
  → Distribuer céréales, équipements lourds aux CROUs
  → Gérer le stock central ministériel

// Validation stratégique
'admin:validate' → Ministre
  → Valider création de nouveaux CROUs
  → Approuver changements organisationnels majeurs
```

### 3.3 Niveau 2: CROU (Coordination)

| Rôle | Dashboard | Financial | Stocks | Transport | Logement | Users | Services |
|------|-----------|-----------|--------|-----------|----------|-------|----------|
| **Directeur CROU** | R | R, V | R, V | R, V | R, V | R, W, V | R (tous) |
| **Secrétaire** | R | R | R | R | R, W | R, W | R |

**Permissions Spéciales CROU:**
```typescript
// Gestion utilisateurs du CROU
'users:manage_crou' → Directeur CROU
  → Créer/modifier/désactiver utilisateurs de son CROU
  → Affecter rôles de niveau Service uniquement
  → Ne peut pas créer de Directeurs CROU (réservé Ministère)

// Validation inter-services
'operations:validate_crou' → Directeur CROU
  → Valider opérations > seuil des services
  → Approuver transferts inter-services
  → Valider demandes d'achats > seuil
```

### 3.4 Niveau 3: SERVICES (Opérationnel)

| Rôle | Module Principal | Permissions | Accès Autres Modules |
|------|------------------|-------------|----------------------|
| **Chef Financier** | Financial | R, W, V, E | Dashboard: R |
| **Comptable** | Financial | R, W | Dashboard: R |
| **Intendant** | Stocks | R, W, V, E | Financial: R |
| **Magasinier** | Stocks | R, W | - |
| **Chef Transport** | Transport | R, W, V, E | Stocks: R (carburant) |
| **Chef Logement** | Logement | R, W, V, E | Financial: R |
| **Chef Restauration** | Restauration | R, W | Stocks: R (denrées) |

**Permissions Opérationnelles:**
```typescript
// Saisie quotidienne
'[module]:write' → Tous les chefs de service
  → Créer des enregistrements dans leur module
  → Modifier leurs propres données
  → Préparer des rapports

// Validation locale
'[module]:validate' → Chefs de service (sauf Magasinier, Comptable)
  → Valider opérations < seuil dans leur service
  → Approuver demandes internes
  → Clôturer des périodes

// Lecture transversale limitée
Chefs service peuvent lire d'autres modules pour contexte:
  → Chef Transport lit Stocks pour voir stock carburant
  → Chef Restauration lit Stocks pour voir denrées alimentaires
  → Tous lisent Dashboard pour KPIs généraux
```

---

## 4. Impact sur les Composants

### 4.1 Base de Données

#### Modifications Entités

**packages/database/src/entities/Tenant.entity.ts**
```typescript
@Entity('tenants')
export class Tenant {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'varchar', length: 100 })
  code: string; // crou-niamey, crou-maradi, etc.

  // ✅ NOUVEAU: Type hiérarchique
  @Column({
    type: 'enum',
    enum: ['ministere', 'crou', 'service']
  })
  type: 'ministere' | 'crou' | 'service';

  // ✅ NOUVEAU: Type de service (si type = 'service')
  @Column({
    type: 'enum',
    enum: ['financial', 'stocks', 'transport', 'logement', 'restauration'],
    nullable: true
  })
  serviceType?: string;

  // ✅ NOUVEAU: Hiérarchie
  @Column({ type: 'uuid', nullable: true })
  parentId: string | null;

  @ManyToOne(() => Tenant, tenant => tenant.children, {
    onDelete: 'CASCADE'
  })
  @JoinColumn({ name: 'parent_id' })
  parent: Tenant | null;

  @OneToMany(() => Tenant, tenant => tenant.parent)
  children: Tenant[];

  // ✅ NOUVEAU: Path matérialisé pour requêtes rapides
  @Column({ type: 'varchar', length: 500 })
  path: string; // "ministere-001/crou-niamey/crou-niamey-stocks"

  // ✅ NOUVEAU: Niveau hiérarchique
  @Column({ type: 'int', default: 0 })
  level: number; // 0=Ministère, 1=CROU, 2=Service

  // Autres colonnes existantes...
  @Column({ type: 'varchar', length: 255, nullable: true })
  description: string;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // ✅ NOUVEAU: Méthodes utilitaires
  isDescendantOf(ancestorId: string): boolean {
    return this.path.includes(ancestorId);
  }

  getAncestors(): string[] {
    return this.path.split('/').filter(id => id !== this.id);
  }

  getDepth(): number {
    return this.path.split('/').length - 1;
  }
}
```

**packages/database/src/entities/User.entity.ts**
```typescript
@Entity('users')
export class User {
  // Colonnes existantes...

  // ✅ NOUVEAU: Superuser flag
  @Column({ type: 'boolean', default: false })
  isSuperuser: boolean;

  // ✅ NOUVEAU: Scope d'accès calculé
  @Column({ type: 'json', nullable: true })
  accessScope: {
    tenantIds: string[]; // Liste des tenants accessibles
    level: number; // Niveau hiérarchique de l'utilisateur
    canManageUsers: boolean; // Peut gérer des utilisateurs
    canAllocate: boolean; // Peut faire des allocations
  };

  // Méthode existante améliorée
  canAccessTenant(targetTenantId: string): boolean {
    if (this.isSuperuser) return true;

    if (!this.accessScope) return this.tenantId === targetTenantId;

    return this.accessScope.tenantIds.includes(targetTenantId);
  }

  // ✅ NOUVEAU
  canManageUser(targetUser: User): boolean {
    if (this.isSuperuser) return true;

    // Directeurs CROU peuvent gérer utilisateurs de leur CROU et services enfants
    if (this.accessScope?.canManageUsers) {
      return this.accessScope.tenantIds.includes(targetUser.tenantId);
    }

    return false;
  }
}
```

**packages/database/src/entities/Permission.entity.ts**
```typescript
// ✅ NOUVEAU: Actions étendues pour allocations
export enum PermissionAction {
  READ = 'read',
  WRITE = 'write',
  VALIDATE = 'validate',
  EXPORT = 'export',
  DELETE = 'delete',
  ALLOCATE = 'allocate', // ✅ NOUVEAU: Pour allocations ministérielles
  MANAGE = 'manage'      // ✅ NOUVEAU: Pour gestion utilisateurs
}

// ✅ NOUVEAU: Resources étendues
export enum PermissionResource {
  DASHBOARD = 'dashboard',
  FINANCIAL = 'financial',
  STOCKS = 'stocks',
  HOUSING = 'housing',
  TRANSPORT = 'transport',
  REPORTS = 'reports',
  ADMIN = 'admin',
  USERS = 'users',
  AUDIT = 'audit',
  OPERATIONS = 'operations', // ✅ NOUVEAU: Validation cross-service
  ALLOCATIONS = 'allocations' // ✅ NOUVEAU: Allocations stratégiques
}
```

#### Nouvelles Tables

**tenant_hierarchy_cache (pour performance)**
```sql
CREATE TABLE tenant_hierarchy_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  ancestor_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  depth INT NOT NULL,
  path VARCHAR(500) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  UNIQUE(tenant_id, ancestor_id)
);

CREATE INDEX idx_hierarchy_tenant ON tenant_hierarchy_cache(tenant_id);
CREATE INDEX idx_hierarchy_ancestor ON tenant_hierarchy_cache(ancestor_id);
CREATE INDEX idx_hierarchy_path ON tenant_hierarchy_cache(path);
```

**allocation_history (traçabilité allocations)**
```sql
CREATE TABLE allocation_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type VARCHAR(50) NOT NULL, -- 'budget' | 'stock'
  from_tenant_id UUID NOT NULL REFERENCES tenants(id),
  to_tenant_id UUID NOT NULL REFERENCES tenants(id),
  resource_type VARCHAR(100) NOT NULL, -- 'FCFA' | 'cereales' | 'equipement'
  quantity DECIMAL(15,2) NOT NULL,
  unit VARCHAR(50),
  description TEXT,
  allocated_by UUID NOT NULL REFERENCES users(id),
  allocated_at TIMESTAMP DEFAULT NOW(),
  status VARCHAR(50) DEFAULT 'active', -- 'active' | 'consumed' | 'returned'

  metadata JSONB -- Détails additionnels
);

CREATE INDEX idx_allocation_from ON allocation_history(from_tenant_id);
CREATE INDEX idx_allocation_to ON allocation_history(to_tenant_id);
CREATE INDEX idx_allocation_type ON allocation_history(type, status);
```

#### Migrations SQL

**Migration 001: Ajouter colonnes hiérarchie**
```sql
-- File: packages/database/migrations/001_add_tenant_hierarchy.sql

-- Ajouter colonnes à tenants
ALTER TABLE tenants
ADD COLUMN parent_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
ADD COLUMN path VARCHAR(500) NOT NULL DEFAULT '',
ADD COLUMN level INT NOT NULL DEFAULT 0,
ADD COLUMN service_type VARCHAR(50);

-- Créer index pour performance
CREATE INDEX idx_tenants_parent ON tenants(parent_id);
CREATE INDEX idx_tenants_path ON tenants USING gin(to_tsvector('simple', path));
CREATE INDEX idx_tenants_level ON tenants(level);
CREATE INDEX idx_tenants_service_type ON tenants(service_type);

-- Créer trigger pour maintenir le path automatiquement
CREATE OR REPLACE FUNCTION update_tenant_path()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.parent_id IS NULL THEN
    NEW.path := NEW.id::text;
    NEW.level := 0;
  ELSE
    SELECT path || '/' || NEW.id::text, level + 1
    INTO NEW.path, NEW.level
    FROM tenants
    WHERE id = NEW.parent_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tenant_path_trigger
BEFORE INSERT OR UPDATE OF parent_id ON tenants
FOR EACH ROW
EXECUTE FUNCTION update_tenant_path();
```

**Migration 002: Ajouter superuser et access_scope**
```sql
-- File: packages/database/migrations/002_add_user_superuser.sql

ALTER TABLE users
ADD COLUMN is_superuser BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN access_scope JSONB;

CREATE INDEX idx_users_superuser ON users(is_superuser) WHERE is_superuser = true;
CREATE INDEX idx_users_access_scope ON users USING gin(access_scope);
```

**Migration 003: Données initiales hiérarchie**
```sql
-- File: packages/database/migrations/003_migrate_tenant_data.sql

-- Étape 1: Fixer le Ministère (niveau 0)
UPDATE tenants
SET
  level = 0,
  path = id::text,
  parent_id = NULL
WHERE type = 'ministere';

-- Étape 2: Migrer les CROUs (niveau 1)
UPDATE tenants
SET
  parent_id = (SELECT id FROM tenants WHERE type = 'ministere' LIMIT 1),
  level = 1,
  path = (SELECT id FROM tenants WHERE type = 'ministere' LIMIT 1)::text || '/' || id::text
WHERE type = 'crou';

-- Étape 3: Créer les services pour chaque CROU (niveau 2)
WITH crous AS (
  SELECT id, name, code FROM tenants WHERE type = 'crou'
),
services AS (
  SELECT
    unnest(ARRAY['financial', 'stocks', 'transport', 'logement', 'restauration']) as service_type,
    unnest(ARRAY['Service Financier', 'Service Stocks', 'Service Transport',
                  'Service Logement', 'Service Restauration']) as service_name
)
INSERT INTO tenants (id, name, code, type, service_type, parent_id, level, path, is_active)
SELECT
  gen_random_uuid(),
  c.name || ' - ' || s.service_name,
  c.code || '-' || s.service_type,
  'service',
  s.service_type,
  c.id,
  2,
  c.path || '/' || gen_random_uuid()::text,
  true
FROM crous c
CROSS JOIN services s;

-- Étape 4: Créer cache hiérarchie
INSERT INTO tenant_hierarchy_cache (tenant_id, ancestor_id, depth, path)
SELECT
  t.id as tenant_id,
  a.id as ancestor_id,
  array_length(string_to_array(t.path, '/'), 1) - array_length(string_to_array(a.path, '/'), 1) as depth,
  t.path
FROM tenants t
JOIN tenants a ON t.path LIKE a.path || '%'
WHERE t.id != a.id;
```

---

### 4.2 Backend (API)

#### Nouveaux Services

**packages/database/src/services/TenantHierarchyService.ts**
```typescript
import { AppDataSource } from '../config/datasource';
import { Tenant } from '../entities/Tenant.entity';
import { In } from 'typeorm';

export class TenantHierarchyService {
  private tenantRepo = AppDataSource.getRepository(Tenant);

  /**
   * Obtenir tous les descendants d'un tenant (enfants, petits-enfants, etc.)
   */
  async getDescendants(tenantId: string): Promise<string[]> {
    const tenant = await this.tenantRepo.findOne({
      where: { id: tenantId },
      select: ['path']
    });

    if (!tenant) return [];

    const descendants = await this.tenantRepo
      .createQueryBuilder('t')
      .select('t.id')
      .where('t.path LIKE :path', { path: `${tenant.path}/%` })
      .getRawMany();

    return descendants.map(d => d.id);
  }

  /**
   * Obtenir tous les ancêtres d'un tenant (parent, grand-parent, etc.)
   */
  async getAncestors(tenantId: string): Promise<string[]> {
    const tenant = await this.tenantRepo.findOne({
      where: { id: tenantId },
      select: ['path']
    });

    if (!tenant) return [];

    const ancestorIds = tenant.path.split('/').filter(id => id !== tenantId);
    return ancestorIds;
  }

  /**
   * Obtenir le scope d'accès pour un tenant
   * Retourne: [tenant lui-même] + [tous ses descendants]
   */
  async getAccessScope(tenantId: string): Promise<string[]> {
    const descendants = await this.getDescendants(tenantId);
    return [tenantId, ...descendants];
  }

  /**
   * Vérifier si un tenant a accès à un autre tenant
   */
  async hasAccessToTenant(
    userTenantId: string,
    targetTenantId: string
  ): Promise<boolean> {
    if (userTenantId === targetTenantId) return true;

    const accessScope = await this.getAccessScope(userTenantId);
    return accessScope.includes(targetTenantId);
  }

  /**
   * Obtenir les enfants directs d'un tenant
   */
  async getChildren(tenantId: string): Promise<Tenant[]> {
    return await this.tenantRepo.find({
      where: { parentId: tenantId },
      order: { name: 'ASC' }
    });
  }

  /**
   * Obtenir l'arbre hiérarchique complet
   */
  async getHierarchyTree(rootTenantId?: string): Promise<Tenant[]> {
    const qb = this.tenantRepo
      .createQueryBuilder('t')
      .leftJoinAndSelect('t.children', 'children')
      .leftJoinAndSelect('children.children', 'grandchildren');

    if (rootTenantId) {
      qb.where('t.id = :rootTenantId', { rootTenantId });
    } else {
      qb.where('t.parent_id IS NULL');
    }

    return await qb.getMany();
  }

  /**
   * Obtenir les services d'un CROU
   */
  async getCROUServices(crouId: string): Promise<Tenant[]> {
    return await this.tenantRepo.find({
      where: {
        parentId: crouId,
        type: 'service' as any
      },
      order: { serviceType: 'ASC' }
    });
  }

  /**
   * Vérifier le niveau hiérarchique
   */
  async getTenantLevel(tenantId: string): Promise<number> {
    const tenant = await this.tenantRepo.findOne({
      where: { id: tenantId },
      select: ['level']
    });
    return tenant?.level ?? -1;
  }

  /**
   * Obtenir le type de service
   */
  async getServiceType(tenantId: string): Promise<string | null> {
    const tenant = await this.tenantRepo.findOne({
      where: { id: tenantId },
      select: ['serviceType']
    });
    return tenant?.serviceType ?? null;
  }
}
```

**apps/api/src/services/AllocationService.ts**
```typescript
import { AppDataSource } from '@crou/database';
import { TenantHierarchyService } from '@crou/database/services/TenantHierarchyService';

export class AllocationService {
  private hierarchyService = new TenantHierarchyService();

  /**
   * Allouer un budget du Ministère vers un CROU
   */
  async allocateBudget(
    fromTenantId: string,
    toTenantId: string,
    amount: number,
    category: string,
    allocatedBy: string,
    description?: string
  ) {
    // Vérifier que fromTenant est Ministère (niveau 0)
    const fromLevel = await this.hierarchyService.getTenantLevel(fromTenantId);
    if (fromLevel !== 0) {
      throw new Error('Seul le Ministère peut allouer des budgets');
    }

    // Vérifier que toTenant est un CROU (niveau 1)
    const toLevel = await this.hierarchyService.getTenantLevel(toTenantId);
    if (toLevel !== 1) {
      throw new Error('Les budgets ne peuvent être alloués qu\'aux CROUs');
    }

    // Enregistrer l'allocation
    await AppDataSource.query(`
      INSERT INTO allocation_history
      (type, from_tenant_id, to_tenant_id, resource_type, quantity, unit, description, allocated_by)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    `, ['budget', fromTenantId, toTenantId, category, amount, 'FCFA', description, allocatedBy]);

    // Créer la ligne budgétaire dans le CROU
    // ... (logique métier)

    return { success: true, message: 'Budget alloué avec succès' };
  }

  /**
   * Allouer des stocks stratégiques (céréales, etc.)
   */
  async allocateStock(
    fromTenantId: string,
    toTenantId: string,
    itemCode: string,
    quantity: number,
    unit: string,
    allocatedBy: string,
    description?: string
  ) {
    // Vérifier que fromTenant est Ministère
    const fromLevel = await this.hierarchyService.getTenantLevel(fromTenantId);
    if (fromLevel !== 0) {
      throw new Error('Seul le Ministère peut allouer des stocks stratégiques');
    }

    // Enregistrer l'allocation
    await AppDataSource.query(`
      INSERT INTO allocation_history
      (type, from_tenant_id, to_tenant_id, resource_type, quantity, unit, description, allocated_by)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    `, ['stock', fromTenantId, toTenantId, itemCode, quantity, unit, description, allocatedBy]);

    // Créer le mouvement de stock
    // ... (logique métier)

    return { success: true, message: 'Stock alloué avec succès' };
  }

  /**
   * Obtenir l'historique des allocations
   */
  async getAllocationHistory(tenantId: string, type?: string) {
    let query = `
      SELECT
        ah.*,
        ft.name as from_tenant_name,
        tt.name as to_tenant_name,
        u.name as allocated_by_name
      FROM allocation_history ah
      JOIN tenants ft ON ah.from_tenant_id = ft.id
      JOIN tenants tt ON ah.to_tenant_id = tt.id
      JOIN users u ON ah.allocated_by = u.id
      WHERE ah.from_tenant_id = $1 OR ah.to_tenant_id = $1
    `;

    const params: any[] = [tenantId];

    if (type) {
      query += ` AND ah.type = $2`;
      params.push(type);
    }

    query += ` ORDER BY ah.allocated_at DESC`;

    return await AppDataSource.query(query, params);
  }
}
```

#### Middleware Modifié

**apps/api/src/shared/middlewares/tenant-isolation.middleware.ts**
```typescript
import { TenantHierarchyService } from '@crou/database/services/TenantHierarchyService';

const hierarchyService = new TenantHierarchyService();

export const injectTenantIdMiddleware = (options: TenantIsolationOptions = {}) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        return next();
      }

      // ✅ NOUVEAU: Superuser bypass tout
      if (req.user.isSuperuser) {
        (req as any).isSuperuser = true;
        (req as any).tenantScope = ['*']; // Accès global
        return next();
      }

      const userTenantId = req.user.tenantId;
      const targetTenantId = extractTargetTenantId(req);

      // ✅ NOUVEAU: Calculer le scope d'accès basé sur la hiérarchie
      const accessScope = await hierarchyService.getAccessScope(userTenantId);
      (req as any).tenantScope = accessScope;

      // ✅ NOUVEAU: Vérifier l'accès hiérarchique
      if (targetTenantId && !accessScope.includes(targetTenantId)) {
        return res.status(403).json({
          error: 'Accès tenant refusé',
          message: 'Vous n\'avez pas accès à ce tenant dans la hiérarchie'
        });
      }

      // ✅ NOUVEAU: Ajouter infos niveau
      const level = await hierarchyService.getTenantLevel(userTenantId);
      const serviceType = await hierarchyService.getServiceType(userTenantId);

      (req as any).tenantContext = {
        tenantId: userTenantId,
        level,
        serviceType,
        accessScope
      };

      next();
    } catch (error) {
      logger.error('Erreur tenant middleware:', error);
      return res.status(500).json({
        error: 'Erreur serveur',
        message: 'Erreur lors de la vérification tenant'
      });
    }
  };
};
```

#### Nouveaux Controllers

**apps/api/src/modules/admin/allocations.controller.ts**
```typescript
import { Router, Request, Response } from 'express';
import { authenticateJWT } from '@/shared/middlewares/auth.middleware';
import { checkPermissions } from '@/shared/middlewares/permissions.middleware';
import { AllocationService } from '@/services/allocation.service';

const router = Router();
const allocationService = new AllocationService();

/**
 * POST /api/admin/allocations/budget
 * Allouer un budget du Ministère vers un CROU
 * Permissions: allocations:allocate (Ministre + Dir. Finances uniquement)
 */
router.post('/budget',
  authenticateJWT,
  checkPermissions(['allocations:allocate']),
  async (req: Request, res: Response) => {
    try {
      const { toTenantId, amount, category, description } = req.body;
      const fromTenantId = (req as any).user.tenantId;
      const allocatedBy = (req as any).user.id;

      const result = await allocationService.allocateBudget(
        fromTenantId,
        toTenantId,
        amount,
        category,
        allocatedBy,
        description
      );

      res.json({ success: true, data: result });
    } catch (error: any) {
      res.status(400).json({ success: false, error: error.message });
    }
  }
);

/**
 * POST /api/admin/allocations/stock
 * Allouer des stocks stratégiques (céréales, etc.)
 * Permissions: allocations:allocate
 */
router.post('/stock',
  authenticateJWT,
  checkPermissions(['allocations:allocate']),
  async (req: Request, res: Response) => {
    try {
      const { toTenantId, itemCode, quantity, unit, description } = req.body;
      const fromTenantId = (req as any).user.tenantId;
      const allocatedBy = (req as any).user.id;

      const result = await allocationService.allocateStock(
        fromTenantId,
        toTenantId,
        itemCode,
        quantity,
        unit,
        allocatedBy,
        description
      );

      res.json({ success: true, data: result });
    } catch (error: any) {
      res.status(400).json({ success: false, error: error.message });
    }
  }
);

/**
 * GET /api/admin/allocations/history
 * Historique des allocations
 * Permissions: admin:read
 */
router.get('/history',
  authenticateJWT,
  checkPermissions(['admin:read']),
  async (req: Request, res: Response) => {
    try {
      const tenantId = (req as any).user.tenantId;
      const { type } = req.query;

      const history = await allocationService.getAllocationHistory(
        tenantId,
        type as string
      );

      res.json({ success: true, data: history });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  }
);

export default router;
```

**apps/api/src/modules/admin/users-management.controller.ts**
```typescript
import { Router, Request, Response } from 'express';
import { authenticateJWT } from '@/shared/middlewares/auth.middleware';
import { checkPermissions } from '@/shared/middlewares/permissions.middleware';
import { AppDataSource } from '@crou/database';
import { User } from '@crou/database/entities/User.entity';
import { TenantHierarchyService } from '@crou/database/services/TenantHierarchyService';

const router = Router();
const hierarchyService = new TenantHierarchyService();

/**
 * POST /api/admin/users-management
 * Créer un utilisateur (Directeur CROU peut créer pour son CROU)
 * Permissions: users:manage
 */
router.post('/',
  authenticateJWT,
  checkPermissions(['users:manage']),
  async (req: Request, res: Response) => {
    try {
      const currentUser = (req as any).user;
      const { email, name, roleId, tenantId, ...userData } = req.body;

      // Vérifier que le tenant cible est dans le scope d'accès
      const accessScope = await hierarchyService.getAccessScope(currentUser.tenantId);

      if (!accessScope.includes(tenantId)) {
        return res.status(403).json({
          success: false,
          error: 'Vous ne pouvez créer des utilisateurs que dans votre périmètre'
        });
      }

      // Créer l'utilisateur
      const userRepo = AppDataSource.getRepository(User);
      const newUser = userRepo.create({
        email,
        name,
        roleId,
        tenantId,
        ...userData,
        createdBy: currentUser.id
      });

      await userRepo.save(newUser);

      res.status(201).json({ success: true, data: { user: newUser } });
    } catch (error: any) {
      res.status(400).json({ success: false, error: error.message });
    }
  }
);

/**
 * GET /api/admin/users-management/scope
 * Obtenir les utilisateurs dans le scope d'accès
 * Permissions: users:read
 */
router.get('/scope',
  authenticateJWT,
  checkPermissions(['users:read']),
  async (req: Request, res: Response) => {
    try {
      const currentUser = (req as any).user;
      const accessScope = await hierarchyService.getAccessScope(currentUser.tenantId);

      const userRepo = AppDataSource.getRepository(User);
      const users = await userRepo.find({
        where: { tenantId: In(accessScope) },
        relations: ['role', 'tenant'],
        order: { name: 'ASC' }
      });

      res.json({ success: true, data: users });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  }
);

export default router;
```

---

### 4.3 Frontend (Web)

#### Nouveaux Composants

**apps/web/src/components/admin/TenantHierarchyTree.tsx**
```typescript
import React, { useState, useEffect } from 'react';
import { ChevronRightIcon, ChevronDownIcon } from '@heroicons/react/24/outline';

interface TenantNode {
  id: string;
  name: string;
  code: string;
  type: 'ministere' | 'crou' | 'service';
  serviceType?: string;
  level: number;
  children: TenantNode[];
}

export const TenantHierarchyTree: React.FC<{
  onSelectTenant?: (tenantId: string) => void;
}> = ({ onSelectTenant }) => {
  const [tree, setTree] = useState<TenantNode[]>([]);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  useEffect(() => {
    // Charger l'arbre hiérarchique
    fetch('/api/admin/tenants/hierarchy')
      .then(res => res.json())
      .then(data => setTree(data.data));
  }, []);

  const toggleExpand = (nodeId: string) => {
    setExpanded(prev => {
      const next = new Set(prev);
      if (next.has(nodeId)) {
        next.delete(nodeId);
      } else {
        next.add(nodeId);
      }
      return next;
    });
  };

  const renderNode = (node: TenantNode) => {
    const isExpanded = expanded.has(node.id);
    const hasChildren = node.children && node.children.length > 0;

    return (
      <div key={node.id} className="ml-4">
        <div
          className="flex items-center py-2 px-3 hover:bg-gray-100 rounded cursor-pointer"
          onClick={() => onSelectTenant?.(node.id)}
        >
          {hasChildren && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleExpand(node.id);
              }}
              className="mr-2"
            >
              {isExpanded ? (
                <ChevronDownIcon className="h-4 w-4" />
              ) : (
                <ChevronRightIcon className="h-4 w-4" />
              )}
            </button>
          )}

          <div className="flex items-center">
            <span className={`
              px-2 py-1 rounded text-xs font-medium mr-3
              ${node.type === 'ministere' ? 'bg-purple-100 text-purple-800' : ''}
              ${node.type === 'crou' ? 'bg-blue-100 text-blue-800' : ''}
              ${node.type === 'service' ? 'bg-green-100 text-green-800' : ''}
            `}>
              {node.type}
            </span>
            <span className="font-medium">{node.name}</span>
            <span className="text-gray-500 ml-2 text-sm">({node.code})</span>
          </div>
        </div>

        {isExpanded && hasChildren && (
          <div className="ml-6 border-l-2 border-gray-200">
            {node.children.map(child => renderNode(child))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <h3 className="text-lg font-semibold mb-4">Hiérarchie des Tenants</h3>
      {tree.map(node => renderNode(node))}
    </div>
  );
};
```

**apps/web/src/pages/admin/AllocationsPage.tsx**
```typescript
import React, { useState } from 'react';
import { Container, Card, Button, Input, Select } from '@/components/ui';
import { TenantHierarchyTree } from '@/components/admin/TenantHierarchyTree';

export const AllocationsPage: React.FC = () => {
  const [allocationType, setAllocationType] = useState<'budget' | 'stock'>('budget');
  const [targetTenant, setTargetTenant] = useState<string>('');

  const handleAllocateBudget = async (data: any) => {
    // Appel API pour allouer budget
  };

  const handleAllocateStock = async (data: any) => {
    // Appel API pour allouer stock
  };

  return (
    <Container size="xl" className="py-6">
      <h1 className="text-3xl font-bold mb-8">Allocations Stratégiques</h1>

      <div className="grid grid-cols-3 gap-6">
        {/* Arbre hiérarchique */}
        <div className="col-span-1">
          <TenantHierarchyTree onSelectTenant={setTargetTenant} />
        </div>

        {/* Formulaire allocation */}
        <div className="col-span-2">
          <Card>
            <h2 className="text-xl font-semibold mb-4">Nouvelle Allocation</h2>

            {/* Type d'allocation */}
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Type</label>
              <Select
                value={allocationType}
                onChange={(e) => setAllocationType(e.target.value as any)}
                options={[
                  { value: 'budget', label: 'Budget (FCFA)' },
                  { value: 'stock', label: 'Stock Stratégique (Céréales, etc.)' }
                ]}
              />
            </div>

            {allocationType === 'budget' ? (
              <>
                <Input label="Montant (FCFA)" type="number" />
                <Select
                  label="Catégorie"
                  options={[
                    { value: 'fonctionnement', label: 'Fonctionnement' },
                    { value: 'investissement', label: 'Investissement' },
                    { value: 'bourses', label: 'Bourses' },
                    { value: 'infrastructures', label: 'Infrastructures' }
                  ]}
                />
              </>
            ) : (
              <>
                <Input label="Code Article" />
                <Input label="Quantité" type="number" />
                <Select
                  label="Unité"
                  options={[
                    { value: 'kg', label: 'Kilogrammes (kg)' },
                    { value: 't', label: 'Tonnes (t)' },
                    { value: 'sac', label: 'Sacs' },
                    { value: 'unite', label: 'Unités' }
                  ]}
                />
              </>
            )}

            <Input label="Description" multiline rows={3} />

            <div className="mt-6">
              <Button
                onClick={() => allocationType === 'budget' ? handleAllocateBudget({}) : handleAllocateStock({})}
                className="w-full"
              >
                Allouer
              </Button>
            </div>
          </Card>

          {/* Historique */}
          <Card className="mt-6">
            <h2 className="text-xl font-semibold mb-4">Historique des Allocations</h2>
            {/* Table historique */}
          </Card>
        </div>
      </div>
    </Container>
  );
};
```

#### Services Modifiés

**apps/web/src/services/api/adminService.ts**
```typescript
class AdminService {
  // ... méthodes existantes

  /**
   * ✅ NOUVEAU: Obtenir la hiérarchie des tenants
   */
  async getTenantHierarchy(): Promise<any> {
    const response = await apiClient.get('/admin/tenants/hierarchy');
    return response.data;
  }

  /**
   * ✅ NOUVEAU: Allouer un budget
   */
  async allocateBudget(data: {
    toTenantId: string;
    amount: number;
    category: string;
    description?: string;
  }): Promise<any> {
    const response = await apiClient.post('/admin/allocations/budget', data);
    return response.data;
  }

  /**
   * ✅ NOUVEAU: Allouer des stocks
   */
  async allocateStock(data: {
    toTenantId: string;
    itemCode: string;
    quantity: number;
    unit: string;
    description?: string;
  }): Promise<any> {
    const response = await apiClient.post('/admin/allocations/stock', data);
    return response.data;
  }

  /**
   * ✅ NOUVEAU: Obtenir historique allocations
   */
  async getAllocationHistory(type?: 'budget' | 'stock'): Promise<any> {
    const params = type ? `?type=${type}` : '';
    const response = await apiClient.get(`/admin/allocations/history${params}`);
    return response.data;
  }

  /**
   * ✅ NOUVEAU: Créer utilisateur dans scope
   */
  async createUserInScope(data: any): Promise<any> {
    const response = await apiClient.post('/admin/users-management', data);
    return response.data;
  }

  /**
   * ✅ NOUVEAU: Obtenir utilisateurs dans scope
   */
  async getUsersInScope(): Promise<any> {
    const response = await apiClient.get('/admin/users-management/scope');
    return response.data;
  }
}

export const adminService = new AdminService();
```

---

## 5. Plan de Migration

### Phase 1: Préparation (Semaine 1)

**Jour 1-2: Backup et Analyse**
- ✅ Backup complet de la base de données
- ✅ Analyser les données existantes (nombre de tenants, users, etc.)
- ✅ Créer environnement de test

**Jour 3-4: Migrations Base de Données**
- ✅ Exécuter migration 001: Ajouter colonnes hiérarchie
- ✅ Exécuter migration 002: Ajouter superuser
- ✅ Exécuter migration 003: Migrer données existantes
- ✅ Créer les services pour chaque CROU
- ✅ Vérifier intégrité des données

**Jour 5: Nouvelles Tables**
- ✅ Créer table tenant_hierarchy_cache
- ✅ Créer table allocation_history
- ✅ Peupler le cache hiérarchique
- ✅ Tests de performance des requêtes hiérarchiques

### Phase 2: Backend (Semaine 2)

**Jour 1-2: Services Core**
- ✅ Implémenter TenantHierarchyService
- ✅ Implémenter AllocationService
- ✅ Tests unitaires des services

**Jour 3-4: Middlewares et Permissions**
- ✅ Modifier tenant-isolation.middleware.ts
- ✅ Ajouter nouvelles permissions (allocate, manage)
- ✅ Mettre à jour permission.seeder.ts avec nouvelles permissions
- ✅ Tests des middlewares

**Jour 5: Controllers**
- ✅ Implémenter allocations.controller.ts
- ✅ Implémenter users-management.controller.ts
- ✅ Modifier tenants.controller.ts pour hiérarchie
- ✅ Tests d'intégration des API

### Phase 3: Frontend (Semaine 3)

**Jour 1-2: Composants UI**
- ✅ Implémenter TenantHierarchyTree
- ✅ Implémenter AllocationsPage
- ✅ Modifier AdminUsersPage pour scope

**Jour 3-4: Services Frontend**
- ✅ Mettre à jour adminService.ts
- ✅ Créer hooks pour allocations
- ✅ Tests des composants

**Jour 5: Intégration**
- ✅ Tester flux complet allocations
- ✅ Tester gestion utilisateurs avec scope
- ✅ Vérifier permissions frontend

### Phase 4: Tests et Validation (Semaine 4)

**Jour 1-2: Tests Fonctionnels**
- ✅ Tester tous les rôles ministériels
- ✅ Tester Directeurs CROU avec gestion users
- ✅ Tester Chefs Service avec saisie opérationnelle
- ✅ Tester Superuser avec bypass complet

**Jour 3: Tests de Performance**
- ✅ Benchmarks requêtes hiérarchiques
- ✅ Optimisation index si nécessaire
- ✅ Tests de charge

**Jour 4: Tests de Sécurité**
- ✅ Tentatives d'accès cross-tenant non autorisés
- ✅ Vérifier isolation entre services
- ✅ Audit des logs

**Jour 5: Formation et Documentation**
- ✅ Former les administrateurs
- ✅ Documenter les nouvelles fonctionnalités
- ✅ Préparer guides utilisateurs

### Phase 5: Déploiement (Semaine 5)

**Jour 1: Pre-Prod**
- ✅ Déployer en pre-production
- ✅ Tests UAT avec utilisateurs pilotes

**Jour 2-3: Corrections**
- ✅ Corriger bugs trouvés
- ✅ Ajustements UX

**Jour 4: Production**
- ✅ Backup final
- ✅ Déploiement production
- ✅ Monitoring actif

**Jour 5: Support**
- ✅ Support utilisateurs
- ✅ Monitoring performances
- ✅ Collecte feedback

---

## 6. Risques et Mitigation

### Risque 1: Perte de Données lors Migration
**Probabilité**: Faible
**Impact**: Critique
**Mitigation**:
- ✅ Backups complets avant migration
- ✅ Tests en environnement de dev/staging
- ✅ Migration réversible (rollback plan)
- ✅ Validation des données après migration

### Risque 2: Régression Fonctionnalités Existantes
**Probabilité**: Moyenne
**Impact**: Élevé
**Mitigation**:
- ✅ Tests de non-régression complets
- ✅ Vérifier toutes les routes existantes
- ✅ Tests E2E automatisés
- ✅ Période de bascule progressive

### Risque 3: Performance Dégradée
**Probabilité**: Moyenne
**Impact**: Moyen
**Mitigation**:
- ✅ Index sur colonnes hiérarchiques
- ✅ Cache matérialisé (tenant_hierarchy_cache)
- ✅ Benchmarks avant/après
- ✅ Monitoring continu post-déploiement

### Risque 4: Complexité pour Utilisateurs
**Probabilité**: Moyenne
**Impact**: Moyen
**Mitigation**:
- ✅ Formation des administrateurs
- ✅ UI intuitive avec arbre hiérarchique visuel
- ✅ Messages d'erreur clairs
- ✅ Documentation complète

### Risque 5: Bugs de Permissions
**Probabilité**: Moyenne
**Impact**: Critique (sécurité)
**Mitigation**:
- ✅ Tests exhaustifs des permissions
- ✅ Audit automatique des accès
- ✅ Principe du moindre privilège
- ✅ Logs détaillés

---

## 7. Checklist de Validation

### Validation Technique

- [ ] Migrations base de données exécutées sans erreur
- [ ] Tous les tests unitaires passent
- [ ] Tous les tests d'intégration passent
- [ ] Performance des requêtes < 200ms (p95)
- [ ] Aucune régression fonctionnelle
- [ ] Logs d'audit fonctionnels

### Validation Fonctionnelle par Rôle

**Superuser:**
- [ ] Accès complet à tous les tenants
- [ ] Bypass de toutes les restrictions
- [ ] Peut modifier n'importe quel utilisateur

**Ministre:**
- [ ] Lecture sur tous les CROUs et services
- [ ] Peut allouer budgets aux CROUs
- [ ] Peut allouer stocks stratégiques aux CROUs
- [ ] Validation des opérations > seuil stratégique

**Directeur CROU:**
- [ ] Lecture sur tous les services de son CROU
- [ ] Peut créer/modifier/désactiver utilisateurs de son CROU
- [ ] Ne peut PAS accéder aux autres CROUs
- [ ] Validation des opérations > seuil CROU

**Chef Service (ex: Chef Transport):**
- [ ] Écriture complète dans son module (Transport)
- [ ] Lecture des autres modules nécessaires (Stocks pour carburant)
- [ ] Ne peut PAS accéder aux autres services
- [ ] Validation des opérations < seuil service

### Validation Sécurité

- [ ] Impossible d'accéder à un tenant hors scope
- [ ] Impossible de créer un utilisateur hors scope
- [ ] Impossible d'allouer sans permission 'allocate'
- [ ] Logs d'audit enregistrent toutes les allocations
- [ ] Tentatives d'accès non autorisé sont bloquées et loguées

---

## 8. Métriques de Succès

### Métriques Techniques
- **Performance**: < 200ms pour 95% des requêtes hiérarchiques
- **Disponibilité**: > 99.5% uptime
- **Erreurs**: < 0.1% taux d'erreur

### Métriques Métier
- **Adoption**: 100% des utilisateurs migrés en 2 semaines
- **Support**: < 5 tickets par jour après semaine 1
- **Satisfaction**: > 80% satisfaction utilisateurs

---

## Annexes

### A. Script de Rollback

```sql
-- En cas de problème, retour à l'état précédent
BEGIN;

-- Supprimer les nouveaux services (niveau 3)
DELETE FROM tenants WHERE type = 'service';

-- Réinitialiser les colonnes hiérarchiques
UPDATE tenants SET parent_id = NULL, path = id::text, level = 0;

-- Supprimer les tables de cache
DROP TABLE IF EXISTS tenant_hierarchy_cache;
DROP TABLE IF EXISTS allocation_history;

-- Supprimer les colonnes ajoutées
ALTER TABLE tenants DROP COLUMN IF EXISTS service_type;
ALTER TABLE users DROP COLUMN IF EXISTS is_superuser;
ALTER TABLE users DROP COLUMN IF EXISTS access_scope;

COMMIT;
```

### B. Requêtes Utiles

```sql
-- Obtenir l'arbre hiérarchique complet
WITH RECURSIVE tenant_tree AS (
  SELECT id, name, type, parent_id, path, level, 0 as depth
  FROM tenants
  WHERE parent_id IS NULL

  UNION ALL

  SELECT t.id, t.name, t.type, t.parent_id, t.path, t.level, tt.depth + 1
  FROM tenants t
  JOIN tenant_tree tt ON t.parent_id = tt.id
)
SELECT * FROM tenant_tree ORDER BY path;

-- Vérifier les accès d'un utilisateur
SELECT
  u.name as user_name,
  t.name as user_tenant,
  array_agg(DISTINCT accessible.name) as accessible_tenants
FROM users u
JOIN tenants t ON u.tenant_id = t.id
JOIN tenants accessible ON accessible.path LIKE t.path || '%'
WHERE u.id = 'USER_ID'
GROUP BY u.name, t.name;

-- Audit des allocations du mois
SELECT
  ah.type,
  ft.name as from_tenant,
  tt.name as to_tenant,
  ah.quantity,
  ah.unit,
  u.name as allocated_by,
  ah.allocated_at
FROM allocation_history ah
JOIN tenants ft ON ah.from_tenant_id = ft.id
JOIN tenants tt ON ah.to_tenant_id = tt.id
JOIN users u ON ah.allocated_by = u.id
WHERE ah.allocated_at >= date_trunc('month', CURRENT_DATE)
ORDER BY ah.allocated_at DESC;
```

---

**Document Version**: 1.0
**Date**: 2025-01-05
**Auteur**: Équipe Technique CROU
**Statut**: Prêt pour Révision et Approbation

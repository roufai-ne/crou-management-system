/**
 * FICHIER: packages\database\src\seeders\permission.seeder.ts
 * SEEDER: Permissions - Permissions granulaires selon PRD CROU
 * 
 * DESCRIPTION:
 * Création des permissions granulaires selon la matrice du PRD
 * Permissions par module avec actions spécifiques
 * Liaison avec les rôles selon la matrice de permissions
 * 
 * MODULES ET ACTIONS:
 * - Dashboard: read, write, validate
 * - Financial: read, write, validate, export
 * - Stocks: read, write, validate, export
 * - Housing: read, write, validate, export
 * - Transport: read, write, validate, export
 * - Reports: read, export
 * - Admin: read, write, validate
 * - Users: read, write, validate
 * - Audit: read, export
 * 
 * MATRICE DE PERMISSIONS (selon PRD):
 * Module/Role    | Ministre | Dir.Fin | Dir.CROU | Comptable
 * Dashboard      |   RWV    |   RWV   |    RW    |     R
 * Finances       |   RWV    |   RWV   |    RWV   |    RW
 * Stocks         |   RWV    |    R    |    RWV   |     R
 * Transport      |   RWV    |    R    |    RWV   |     -
 * Logement       |   RWV    |    R    |    RWV   |     -
 * 
 * Légende: R=Read, W=Write, V=Validate
 * 
 * AUTEUR: Équipe CROU
 * DATE: Décembre 2024
 */

import { DataSource } from 'typeorm';
import { Permission, PermissionResource, PermissionAction } from '../entities/Permission.entity';
import { Role } from '../entities/Role.entity';

export async function seedPermissions(dataSource: DataSource): Promise<void> {
  const permissionRepository = dataSource.getRepository(Permission);
  const roleRepository = dataSource.getRepository(Role);

  // Vérifier si les permissions existent déjà
  const existingCount = await permissionRepository.count();
  if (existingCount > 0) {
    console.log('⚠️  Permissions déjà créées, passage...');
    return;
  }

  // Récupérer tous les rôles pour les liaisons
  const roles = await roleRepository.find();
  const roleMap = new Map(roles.map(role => [role.name, role]));

  // Définition des permissions par module
  const permissionData = [
    // DASHBOARD
    {
      resource: PermissionResource.DASHBOARD,
      actions: [PermissionAction.READ],
      description: 'Lecture des tableaux de bord'
    },
    {
      resource: PermissionResource.DASHBOARD,
      actions: [PermissionAction.WRITE],
      description: 'Modification des tableaux de bord'
    },
    {
      resource: PermissionResource.DASHBOARD,
      actions: [PermissionAction.VALIDATE],
      description: 'Validation des données de tableau de bord'
    },

    // FINANCIAL
    {
      resource: PermissionResource.FINANCIAL,
      actions: [PermissionAction.READ],
      description: 'Lecture des données financières'
    },
    {
      resource: PermissionResource.FINANCIAL,
      actions: [PermissionAction.WRITE],
      description: 'Modification des données financières'
    },
    {
      resource: PermissionResource.FINANCIAL,
      actions: [PermissionAction.VALIDATE],
      description: 'Validation des opérations financières'
    },
    {
      resource: PermissionResource.FINANCIAL,
      actions: [PermissionAction.EXPORT],
      description: 'Export des données financières'
    },

    // STOCKS
    {
      resource: PermissionResource.STOCKS,
      actions: [PermissionAction.READ],
      description: 'Lecture des données de stocks'
    },
    {
      resource: PermissionResource.STOCKS,
      actions: [PermissionAction.WRITE],
      description: 'Modification des données de stocks'
    },
    {
      resource: PermissionResource.STOCKS,
      actions: [PermissionAction.VALIDATE],
      description: 'Validation des mouvements de stocks'
    },
    {
      resource: PermissionResource.STOCKS,
      actions: [PermissionAction.EXPORT],
      description: 'Export des données de stocks'
    },

    // HOUSING
    {
      resource: PermissionResource.HOUSING,
      actions: [PermissionAction.READ],
      description: 'Lecture des données de logement'
    },
    {
      resource: PermissionResource.HOUSING,
      actions: [PermissionAction.WRITE],
      description: 'Modification des données de logement'
    },
    {
      resource: PermissionResource.HOUSING,
      actions: [PermissionAction.VALIDATE],
      description: 'Validation des opérations de logement'
    },
    {
      resource: PermissionResource.HOUSING,
      actions: [PermissionAction.EXPORT],
      description: 'Export des données de logement'
    },

    // TRANSPORT
    {
      resource: PermissionResource.TRANSPORT,
      actions: [PermissionAction.READ],
      description: 'Lecture des données de transport'
    },
    {
      resource: PermissionResource.TRANSPORT,
      actions: [PermissionAction.WRITE],
      description: 'Modification des données de transport'
    },
    {
      resource: PermissionResource.TRANSPORT,
      actions: [PermissionAction.VALIDATE],
      description: 'Validation des opérations de transport'
    },
    {
      resource: PermissionResource.TRANSPORT,
      actions: [PermissionAction.EXPORT],
      description: 'Export des données de transport'
    },

    // REPORTS
    {
      resource: PermissionResource.REPORTS,
      actions: [PermissionAction.READ],
      description: 'Lecture des rapports'
    },
    {
      resource: PermissionResource.REPORTS,
      actions: [PermissionAction.EXPORT],
      description: 'Export des rapports'
    },

    // ADMIN
    {
      resource: PermissionResource.ADMIN,
      actions: [PermissionAction.READ],
      description: 'Lecture des données d\'administration'
    },
    {
      resource: PermissionResource.ADMIN,
      actions: [PermissionAction.WRITE],
      description: 'Modification des données d\'administration'
    },
    {
      resource: PermissionResource.ADMIN,
      actions: [PermissionAction.VALIDATE],
      description: 'Validation des opérations d\'administration'
    },

    // USERS
    {
      resource: PermissionResource.USERS,
      actions: [PermissionAction.READ],
      description: 'Lecture des données utilisateurs'
    },
    {
      resource: PermissionResource.USERS,
      actions: [PermissionAction.WRITE],
      description: 'Modification des données utilisateurs'
    },
    {
      resource: PermissionResource.USERS,
      actions: [PermissionAction.VALIDATE],
      description: 'Validation des opérations utilisateurs'
    },

    // AUDIT
    {
      resource: PermissionResource.AUDIT,
      actions: [PermissionAction.READ],
      description: 'Lecture des logs d\'audit'
    },
    {
      resource: PermissionResource.AUDIT,
      actions: [PermissionAction.EXPORT],
      description: 'Export des logs d\'audit'
    }
  ];

  // Création des permissions
  const permissions = permissionData.map(data => 
    permissionRepository.create({
      ...data,
      isActive: true,
      createdBy: 'system'
    })
  );
  
  await permissionRepository.save(permissions);

  console.log(`✅ ${permissions.length} permissions créées`);

  // Maintenant, lier les permissions aux rôles selon la matrice du PRD
  await linkPermissionsToRoles(dataSource, roleMap, permissions);
}

/**
 * Lier les permissions aux rôles selon la matrice du PRD
 */
async function linkPermissionsToRoles(
  dataSource: DataSource, 
  roleMap: Map<string, Role>, 
  permissions: Permission[]
): Promise<void> {
  const roleRepository = dataSource.getRepository(Role);

  // Helper pour trouver une permission
  const findPermission = (resource: string, action: string) => 
    permissions.find(p => p.resource === resource && p.actions.includes(action));

  // MATRICE DE PERMISSIONS SELON PRD

  // 1. MINISTRE - Accès complet (RWV) à TOUS les modules
  // Le Ministre a toutes les permissions sans exception
  const ministre = roleMap.get('Ministre');
  if (ministre) {
    ministre.permissions = permissions; // TOUTES les permissions
    await roleRepository.save(ministre);
  }

  // 2. DIRECTEUR AFFAIRES FINANCIÈRES - RWV sur finances, R sur autres
  const dirFinances = roleMap.get('Directeur Affaires Financières');
  if (dirFinances) {
    dirFinances.permissions = [
      // Dashboard: RWV
      findPermission('dashboard', 'read'),
      findPermission('dashboard', 'write'),
      findPermission('dashboard', 'validate'),
      // Financial: RWV + Export
      findPermission('financial', 'read'),
      findPermission('financial', 'write'),
      findPermission('financial', 'validate'),
      findPermission('financial', 'export'),
      // Autres modules: R seulement
      findPermission('stocks', 'read'),
      findPermission('housing', 'read'),
      findPermission('transport', 'read'),
      findPermission('reports', 'read'),
      findPermission('reports', 'export'),
      findPermission('audit', 'read')
    ].filter(Boolean) as Permission[];
    await roleRepository.save(dirFinances);
  }

  // 3. RESPONSABLE APPROVISIONNEMENTS - RWV sur stocks, R sur autres
  const respAppro = roleMap.get('Responsable Approvisionnements');
  if (respAppro) {
    respAppro.permissions = [
      // Dashboard: RW
      findPermission('dashboard', 'read'),
      findPermission('dashboard', 'write'),
      // Stocks: RWV + Export
      findPermission('stocks', 'read'),
      findPermission('stocks', 'write'),
      findPermission('stocks', 'validate'),
      findPermission('stocks', 'export'),
      // Transport: RWV (gestion véhicules)
      findPermission('transport', 'read'),
      findPermission('transport', 'write'),
      findPermission('transport', 'validate'),
      // Autres: R
      findPermission('financial', 'read'),
      findPermission('housing', 'read'),
      findPermission('reports', 'read'),
      findPermission('reports', 'export')
    ].filter(Boolean) as Permission[];
    await roleRepository.save(respAppro);
  }

  // 4. CONTRÔLEUR BUDGÉTAIRE - R sur tous, Export rapports
  const controleur = roleMap.get('Contrôleur Budgétaire');
  if (controleur) {
    controleur.permissions = [
      // Lecture sur tous les modules
      findPermission('dashboard', 'read'),
      findPermission('financial', 'read'),
      findPermission('stocks', 'read'),
      findPermission('housing', 'read'),
      findPermission('transport', 'read'),
      // Reports et audit: R + Export
      findPermission('reports', 'read'),
      findPermission('reports', 'export'),
      findPermission('audit', 'read'),
      findPermission('audit', 'export')
    ].filter(Boolean) as Permission[];
    await roleRepository.save(controleur);
  }

  // 5. DIRECTEUR CROU - RWV sur modules locaux
  const directeurCrou = roleMap.get('Directeur CROU');
  if (directeurCrou) {
    directeurCrou.permissions = [
      // Dashboard: RWV
      findPermission('dashboard', 'read'),
      findPermission('dashboard', 'write'),
      findPermission('dashboard', 'validate'),
      // Financial: RWV
      findPermission('financial', 'read'),
      findPermission('financial', 'write'),
      findPermission('financial', 'validate'),
      findPermission('financial', 'export'),
      // Stocks: RWV
      findPermission('stocks', 'read'),
      findPermission('stocks', 'write'),
      findPermission('stocks', 'validate'),
      // Housing: RWV
      findPermission('housing', 'read'),
      findPermission('housing', 'write'),
      findPermission('housing', 'validate'),
      // Transport: RWV
      findPermission('transport', 'read'),
      findPermission('transport', 'write'),
      findPermission('transport', 'validate'),
      // Reports: R + Export
      findPermission('reports', 'read'),
      findPermission('reports', 'export'),
      // Users locaux: RW
      findPermission('users', 'read'),
      findPermission('users', 'write')
    ].filter(Boolean) as Permission[];
    await roleRepository.save(directeurCrou);
  }

  // 6. CHEF FINANCIER - RWV sur financial, RW sur dashboard
  const chefFinancier = roleMap.get('Chef Financier');
  if (chefFinancier) {
    chefFinancier.permissions = [
      findPermission('dashboard', 'read'),
      findPermission('dashboard', 'write'),
      findPermission('financial', 'read'),
      findPermission('financial', 'write'),
      findPermission('financial', 'validate'),
      findPermission('financial', 'export'),
      findPermission('reports', 'read'),
      findPermission('reports', 'export')
    ].filter(Boolean) as Permission[];
    await roleRepository.save(chefFinancier);
  }

  // 7. COMPTABLE - RW sur financial, R sur dashboard
  const comptable = roleMap.get('Comptable');
  if (comptable) {
    comptable.permissions = [
      findPermission('dashboard', 'read'),
      findPermission('financial', 'read'),
      findPermission('financial', 'write'),
      findPermission('reports', 'read')
    ].filter(Boolean) as Permission[];
    await roleRepository.save(comptable);
  }

  // 8. INTENDANT - RWV sur stocks, RW sur dashboard
  const intendant = roleMap.get('Intendant');
  if (intendant) {
    intendant.permissions = [
      findPermission('dashboard', 'read'),
      findPermission('dashboard', 'write'),
      findPermission('stocks', 'read'),
      findPermission('stocks', 'write'),
      findPermission('stocks', 'validate'),
      findPermission('stocks', 'export'),
      findPermission('financial', 'read'),
      findPermission('reports', 'read')
    ].filter(Boolean) as Permission[];
    await roleRepository.save(intendant);
  }

  // 9. MAGASINIER - RW sur stocks
  const magasinier = roleMap.get('Magasinier');
  if (magasinier) {
    magasinier.permissions = [
      findPermission('dashboard', 'read'),
      findPermission('stocks', 'read'),
      findPermission('stocks', 'write'),
      findPermission('reports', 'read')
    ].filter(Boolean) as Permission[];
    await roleRepository.save(magasinier);
  }

  // 10. CHEF TRANSPORT - RWV sur transport
  const chefTransport = roleMap.get('Chef Transport');
  if (chefTransport) {
    chefTransport.permissions = [
      findPermission('dashboard', 'read'),
      findPermission('transport', 'read'),
      findPermission('transport', 'write'),
      findPermission('transport', 'validate'),
      findPermission('transport', 'export'),
      findPermission('reports', 'read')
    ].filter(Boolean) as Permission[];
    await roleRepository.save(chefTransport);
  }

  // 11. CHEF LOGEMENT - RWV sur housing
  const chefLogement = roleMap.get('Chef Logement');
  if (chefLogement) {
    chefLogement.permissions = [
      findPermission('dashboard', 'read'),
      findPermission('housing', 'read'),
      findPermission('housing', 'write'),
      findPermission('housing', 'validate'),
      findPermission('housing', 'export'),
      findPermission('reports', 'read')
    ].filter(Boolean) as Permission[];
    await roleRepository.save(chefLogement);
  }

  // 12. SECRÉTAIRE ADMINISTRATIF - RW sur housing et admin
  const secretaire = roleMap.get('Secrétaire Administratif');
  if (secretaire) {
    secretaire.permissions = [
      findPermission('dashboard', 'read'),
      findPermission('housing', 'read'),
      findPermission('housing', 'write'),
      findPermission('admin', 'read'),
      findPermission('admin', 'write'),
      findPermission('reports', 'read')
    ].filter(Boolean) as Permission[];
    await roleRepository.save(secretaire);
  }

  // 13. CHEF RESTAURATION - R sur stocks et dashboard
  const chefRestauration = roleMap.get('Chef Restauration');
  if (chefRestauration) {
    chefRestauration.permissions = [
      findPermission('dashboard', 'read'),
      findPermission('stocks', 'read'),
      findPermission('stocks', 'write'),
      findPermission('reports', 'read')
    ].filter(Boolean) as Permission[];
    await roleRepository.save(chefRestauration);
  }

  console.log('✅ Permissions liées aux rôles selon la matrice du PRD');
}
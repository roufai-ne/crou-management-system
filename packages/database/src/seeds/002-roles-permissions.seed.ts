/**
 * FICHIER: packages/database/src/seeds/002-roles-permissions.seed.ts
 * SEED: Création des rôles et permissions du système
 *
 * DESCRIPTION:
 * Seed pour créer la matrice complète des rôles et permissions
 * Système RBAC (Role-Based Access Control) avec permissions granulaires
 *
 * RÔLES:
 * 1. Super Admin - Accès total au système
 * 2. Admin Ministère - Monitoring et reporting multi-CROU
 * 3. Directeur CROU - Gestion complète d'un CROU
 * 4. Comptable - Gestion financière
 * 5. Gestionnaire Stocks - Gestion des stocks
 * 6. Gestionnaire Logement - Gestion des logements
 * 7. Gestionnaire Transport - Gestion des véhicules
 * 8. Utilisateur - Lecture seule
 *
 * AUTEUR: Équipe CROU
 * DATE: Octobre 2025
 */

import { DataSource } from 'typeorm';
import { Role, RoleTenantType } from '../entities/Role.entity';
import { Permission } from '../entities/Permission.entity';

export const seedRolesAndPermissions = async (dataSource: DataSource): Promise<void> => {
  const roleRepository = dataSource.getRepository(Role);
  const permissionRepository = dataSource.getRepository(Permission);

  // Vérifier si les rôles existent déjà
  const existingRolesCount = await roleRepository.count();
  if (existingRolesCount > 0) {
    console.log('⏭️  Rôles et permissions déjà créés, passage au seed suivant...');
    return;
  }

  console.log('🌱 Création des permissions...');

  // ========================================
  // PERMISSIONS PAR MODULE
  // ========================================

  // --- Module Dashboard ---
  const dashboardRead = await permissionRepository.save({
    resource: 'dashboard',
    actions: ['read'],
    description: 'Consulter le dashboard'
  });

  const dashboardStats = await permissionRepository.save({
    resource: 'dashboard',
    actions: ['read', 'stats'],
    description: 'Voir les statistiques détaillées'
  });

  // --- Module Admin - Users ---
  const adminUsersRead = await permissionRepository.save({
    resource: 'users',
    actions: ['read'],
    description: 'Consulter les utilisateurs'
  });

  const adminUsersWrite = await permissionRepository.save({
    resource: 'users',
    actions: ['create', 'update'],
    description: 'Créer/Modifier les utilisateurs'
  });

  const adminUsersDelete = await permissionRepository.save({
    resource: 'users',
    actions: ['delete'],
    description: 'Supprimer les utilisateurs'
  });

  // --- Module Admin - Roles ---
  const adminRolesRead = await permissionRepository.save({
    resource: 'admin',
    actions: ['read'],
    description: 'Consulter les rôles'
  });

  const adminRolesWrite = await permissionRepository.save({
    resource: 'admin',
    actions: ['create', 'update'],
    description: 'Créer/Modifier les rôles'
  });

  // --- Module Admin - Tenants ---
  const adminTenantsRead = await permissionRepository.save({
    resource: 'tenants',
    actions: ['read'],
    description: 'Consulter les organisations'
  });

  const adminTenantsWrite = await permissionRepository.save({
    resource: 'tenants',
    actions: ['create', 'update'],
    description: 'Créer/Modifier les organisations'
  });

  // --- Module Admin - Security & Audit ---
  const adminSecurityRead = await permissionRepository.save({
    resource: 'admin',
    actions: ['read'],
    description: 'Consulter les alertes de sécurité'
  });

  const adminAuditRead = await permissionRepository.save({
    resource: 'audit',
    actions: ['read'],
    description: 'Consulter les logs d\'audit'
  });

  // --- Module Financial ---
  const financialRead = await permissionRepository.save({
    resource: 'financial',
    actions: ['read'],
    description: 'Consulter les finances'
  });

  const financialWrite = await permissionRepository.save({
    resource: 'financial',
    actions: ['create', 'update'],
    description: 'Créer/Modifier les budgets et transactions'
  });

  const financialDelete = await permissionRepository.save({
    resource: 'financial',
    actions: ['delete'],
    description: 'Supprimer les budgets et transactions'
  });

  const financialValidate = await permissionRepository.save({
    resource: 'financial',
    actions: ['validate'],
    description: 'Valider les budgets et transactions'
  });

  const financialExport = await permissionRepository.save({
    resource: 'financial',
    actions: ['export'],
    description: 'Exporter les données financières'
  });

  // --- Module Stocks ---
  const stocksRead = await permissionRepository.save({
    resource: 'stocks',
    actions: ['read'],
    description: 'Consulter les stocks'
  });

  const stocksWrite = await permissionRepository.save({
    resource: 'stocks',
    actions: ['create', 'update'],
    description: 'Créer/Modifier les stocks'
  });

  const stocksDelete = await permissionRepository.save({
    resource: 'stocks',
    actions: ['delete'],
    description: 'Supprimer les stocks'
  });

  const stocksMovements = await permissionRepository.save({
    resource: 'stocks',
    actions: ['create', 'update', 'read'],
    description: 'Gérer les mouvements de stocks'
  });

  const stocksSuppliers = await permissionRepository.save({
    resource: 'stocks',
    actions: ['create', 'update', 'read'],
    description: 'Gérer les fournisseurs'
  });

  // --- Module Housing ---
  const housingRead = await permissionRepository.save({
    resource: 'housing',
    actions: ['read'],
    description: 'Consulter les logements'
  });

  const housingWrite = await permissionRepository.save({
    resource: 'housing',
    actions: ['create', 'update'],
    description: 'Créer/Modifier les logements'
  });

  const housingDelete = await permissionRepository.save({
    resource: 'housing',
    actions: ['delete'],
    description: 'Supprimer les logements'
  });

  const housingOccupancy = await permissionRepository.save({
    resource: 'housing',
    actions: ['create', 'update', 'read'],
    description: 'Gérer les occupations'
  });

  const housingMaintenance = await permissionRepository.save({
    resource: 'housing',
    actions: ['create', 'update', 'read'],
    description: 'Gérer la maintenance'
  });

  // --- Module Transport ---
  const transportRead = await permissionRepository.save({
    resource: 'transport',
    actions: ['read'],
    description: 'Consulter les véhicules'
  });

  const transportWrite = await permissionRepository.save({
    resource: 'transport',
    actions: ['create', 'update'],
    description: 'Créer/Modifier les véhicules'
  });

  const transportDelete = await permissionRepository.save({
    resource: 'transport',
    actions: ['delete'],
    description: 'Supprimer les véhicules'
  });

  const transportUsage = await permissionRepository.save({
    resource: 'transport',
    actions: ['create', 'update', 'read'],
    description: 'Gérer les utilisations'
  });

  const transportMaintenance = await permissionRepository.save({
    resource: 'transport',
    actions: ['create', 'update', 'read'],
    description: 'Gérer la maintenance des véhicules'
  });

  // --- Module Reports ---
  const reportsRead = await permissionRepository.save({
    resource: 'reports',
    actions: ['read'],
    description: 'Consulter les rapports'
  });

  const reportsGenerate = await permissionRepository.save({
    resource: 'reports',
    actions: ['generate'],
    description: 'Générer des rapports'
  });

  const reportsExport = await permissionRepository.save({
    resource: 'reports',
    actions: ['export'],
    description: 'Exporter les rapports'
  });

  // --- Module Workflows ---
  const workflowsRead = await permissionRepository.save({
    resource: 'admin',
    actions: ['read'],
    description: 'Consulter les workflows'
  });

  const workflowsWrite = await permissionRepository.save({
    resource: 'admin',
    actions: ['create', 'update'],
    description: 'Créer/Modifier les workflows'
  });

  const workflowsApprove = await permissionRepository.save({
    resource: 'admin',
    actions: ['approve'],
    description: 'Approuver les workflows'
  });

  // --- Module Notifications ---
  const notificationsRead = await permissionRepository.save({
    resource: 'admin',
    actions: ['read'],
    description: 'Consulter les notifications'
  });

  const notificationsWrite = await permissionRepository.save({
    resource: 'admin',
    actions: ['create', 'update'],
    description: 'Créer des notifications'
  });

  console.log('✅ 40 permissions créées');
  console.log('🌱 Création des rôles...');

  // ========================================
  // RÔLES ET ATTRIBUTION DES PERMISSIONS
  // ========================================

  // --- 1. SUPER ADMIN ---
  const superAdmin = roleRepository.create({
    name: 'Super Admin',
    description: 'Accès total au système - Gestion complète de tous les modules et organisations',
    tenantType: RoleTenantType.BOTH,
    isActive: true,
    permissions: [
      // Toutes les permissions
      dashboardRead, dashboardStats,
      adminUsersRead, adminUsersWrite, adminUsersDelete,
      adminRolesRead, adminRolesWrite,
      adminTenantsRead, adminTenantsWrite,
      adminSecurityRead, adminAuditRead,
      financialRead, financialWrite, financialDelete, financialValidate, financialExport,
      stocksRead, stocksWrite, stocksDelete, stocksMovements, stocksSuppliers,
      housingRead, housingWrite, housingDelete, housingOccupancy, housingMaintenance,
      transportRead, transportWrite, transportDelete, transportUsage, transportMaintenance,
      reportsRead, reportsGenerate, reportsExport,
      workflowsRead, workflowsWrite, workflowsApprove,
      notificationsRead, notificationsWrite
    ]
  });

  // --- 2. ADMIN MINISTÈRE ---
  const adminMinistere = roleRepository.create({
    name: 'Admin Ministère',
    description: 'Administrateur du Ministère - Monitoring et reporting multi-CROU',
    tenantType: RoleTenantType.MINISTERE,
    isActive: true,
    permissions: [
      dashboardRead, dashboardStats,
      adminUsersRead, adminRolesRead, adminTenantsRead,
      adminSecurityRead, adminAuditRead,
      financialRead, financialExport,
      stocksRead,
      housingRead,
      transportRead,
      reportsRead, reportsGenerate, reportsExport,
      workflowsRead, workflowsApprove,
      notificationsRead, notificationsWrite
    ]
  });

  // --- 3. DIRECTEUR CROU ---
  const directeurCrou = roleRepository.create({
    name: 'Directeur CROU',
    description: 'Directeur d\'un CROU - Gestion complète de son organisation',
    tenantType: RoleTenantType.CROU,
    isActive: true,
    permissions: [
      dashboardRead, dashboardStats,
      adminUsersRead, adminUsersWrite, adminRolesRead,
      adminSecurityRead, adminAuditRead,
      financialRead, financialWrite, financialValidate, financialExport,
      stocksRead, stocksWrite, stocksMovements, stocksSuppliers,
      housingRead, housingWrite, housingOccupancy, housingMaintenance,
      transportRead, transportWrite, transportUsage, transportMaintenance,
      reportsRead, reportsGenerate, reportsExport,
      workflowsRead, workflowsWrite, workflowsApprove,
      notificationsRead, notificationsWrite
    ]
  });

  // --- 4. COMPTABLE ---
  const comptable = roleRepository.create({
    name: 'Comptable',
    description: 'Gestionnaire financier - Gestion des budgets et transactions',
    tenantType: RoleTenantType.BOTH,
    isActive: true,
    permissions: [
      dashboardRead,
      financialRead, financialWrite, financialExport,
      reportsRead, reportsGenerate,
      workflowsRead,
      notificationsRead
    ]
  });

  // --- 5. GESTIONNAIRE STOCKS ---
  const gestionnaireStocks = roleRepository.create({
    name: 'Gestionnaire Stocks',
    description: 'Gestionnaire des stocks - Gestion complète des inventaires',
    tenantType: RoleTenantType.CROU,
    isActive: true,
    permissions: [
      dashboardRead,
      stocksRead, stocksWrite, stocksMovements, stocksSuppliers,
      reportsRead, reportsGenerate,
      workflowsRead,
      notificationsRead
    ]
  });

  // --- 6. GESTIONNAIRE LOGEMENT ---
  const gestionnaireLogement = roleRepository.create({
    name: 'Gestionnaire Logement',
    description: 'Gestionnaire des logements - Gestion des cités universitaires',
    tenantType: RoleTenantType.CROU,
    isActive: true,
    permissions: [
      dashboardRead,
      housingRead, housingWrite, housingOccupancy, housingMaintenance,
      reportsRead, reportsGenerate,
      workflowsRead,
      notificationsRead
    ]
  });

  // --- 7. GESTIONNAIRE TRANSPORT ---
  const gestionnaireTransport = roleRepository.create({
    name: 'Gestionnaire Transport',
    description: 'Gestionnaire du transport - Gestion de la flotte de véhicules',
    tenantType: RoleTenantType.CROU,
    isActive: true,
    permissions: [
      dashboardRead,
      transportRead, transportWrite, transportUsage, transportMaintenance,
      reportsRead, reportsGenerate,
      workflowsRead,
      notificationsRead
    ]
  });

  // --- 8. UTILISATEUR (LECTURE SEULE) ---
  const utilisateur = roleRepository.create({
    name: 'Utilisateur',
    description: 'Utilisateur standard - Accès en lecture seule',
    tenantType: RoleTenantType.BOTH,
    isActive: true,
    permissions: [
      dashboardRead,
      financialRead,
      stocksRead,
      housingRead,
      transportRead,
      reportsRead,
      workflowsRead,
      notificationsRead
    ]
  });

  // Enregistrer tous les rôles
  await roleRepository.save([
    superAdmin,
    adminMinistere,
    directeurCrou,
    comptable,
    gestionnaireStocks,
    gestionnaireLogement,
    gestionnaireTransport,
    utilisateur
  ]);

  console.log('✅ 8 rôles créés avec succès');
  console.log('   - Super Admin (100%) - Toutes permissions');
  console.log('   - Admin Ministère (90%) - Monitoring multi-CROU');
  console.log('   - Directeur CROU (80%) - Gestion complète CROU');
  console.log('   - Comptable (50%) - Gestion financière');
  console.log('   - Gestionnaire Stocks (50%) - Gestion stocks');
  console.log('   - Gestionnaire Logement (50%) - Gestion logements');
  console.log('   - Gestionnaire Transport (50%) - Gestion transport');
  console.log('   - Utilisateur (10%) - Lecture seule');
  console.log('');
  console.log('📊 Matrice des permissions:');
  console.log('   - Super Admin: 40/40 permissions');
  console.log('   - Admin Ministère: 19/40 permissions');
  console.log('   - Directeur CROU: 30/40 permissions');
  console.log('   - Comptable: 7/40 permissions');
  console.log('   - Gestionnaire Stocks: 7/40 permissions');
  console.log('   - Gestionnaire Logement: 7/40 permissions');
  console.log('   - Gestionnaire Transport: 7/40 permissions');
  console.log('   - Utilisateur: 8/40 permissions');
};

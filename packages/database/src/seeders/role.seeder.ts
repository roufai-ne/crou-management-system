/**
 * FICHIER: packages\database\src\seeders\role.seeder.ts
 * SEEDER: Roles - Rôles système selon PRD CROU
 * 
 * DESCRIPTION:
 * Création des 13 rôles système selon la matrice du PRD
 * 4 rôles ministériels + 9 rôles CROU
 * Rôles système non modifiables par les utilisateurs
 * 
 * RÔLES MINISTÉRIELS:
 * - Ministre/Directeur Général (supervision générale)
 * - Directeur Affaires Financières (validation budgets)
 * - Responsable Approvisionnements (achats centralisés)
 * - Contrôleur Budgétaire (audit et contrôle)
 * 
 * RÔLES CROU:
 * - Directeur CROU (direction générale locale)
 * - Secrétaire Administratif (gestion administrative)
 * - Chef Financier (gestion financière locale)
 * - Comptable (comptabilité et états financiers)
 * - Intendant (gestion stocks et approvisionnements)
 * - Magasinier (gestion stocks opérationnels)
 * - Chef Transport (gestion parc automobile)
 * - Chef Logement (gestion cités universitaires)
 * - Chef Restauration (gestion restauration universitaire)
 * 
 * AUTEUR: Équipe CROU
 * DATE: Décembre 2024
 */

import { DataSource } from 'typeorm';
import { Role, RoleTenantType } from '../entities/Role.entity';

export async function seedRoles(dataSource: DataSource): Promise<void> {
  const roleRepository = dataSource.getRepository(Role);

  // Vérifier si les rôles existent déjà
  const existingCount = await roleRepository.count();
  if (existingCount > 0) {
    console.log('⚠️  Rôles déjà créés, passage...');
    return;
  }

  // Données des rôles selon PRD
  const roleData = [
    // RÔLES MINISTÉRIELS
    {
      name: 'Ministre',
      description: 'Ministre/Directeur Général - Supervision générale et validation finale',
      tenantType: RoleTenantType.MINISTERE,
      isSystemRole: true,
      isActive: true,
      createdBy: 'system'
    },
    {
      name: 'Directeur Affaires Financières',
      description: 'Directeur des Affaires Financières - Validation budgets et subventions',
      tenantType: RoleTenantType.MINISTERE,
      isSystemRole: true,
      isActive: true,
      createdBy: 'system'
    },
    {
      name: 'Responsable Approvisionnements',
      description: 'Responsable Approvisionnements - Achats centralisés et contrats',
      tenantType: RoleTenantType.MINISTERE,
      isSystemRole: true,
      isActive: true,
      createdBy: 'system'
    },
    {
      name: 'Contrôleur Budgétaire',
      description: 'Contrôleur Budgétaire - Audit, contrôle et rapports',
      tenantType: RoleTenantType.MINISTERE,
      isSystemRole: true,
      isActive: true,
      createdBy: 'system'
    },

    // RÔLES CROU
    {
      name: 'Directeur CROU',
      description: 'Directeur CROU - Direction générale du centre régional',
      tenantType: RoleTenantType.CROU,
      isSystemRole: true,
      isActive: true,
      createdBy: 'system'
    },
    {
      name: 'Secrétaire Administratif',
      description: 'Secrétaire Administratif - Gestion administrative et logement',
      tenantType: RoleTenantType.CROU,
      isSystemRole: true,
      isActive: true,
      createdBy: 'system'
    },
    {
      name: 'Chef Financier',
      description: 'Chef Service Financier - Gestion financière locale',
      tenantType: RoleTenantType.CROU,
      isSystemRole: true,
      isActive: true,
      createdBy: 'system'
    },
    {
      name: 'Comptable',
      description: 'Comptable - Comptabilité et états financiers',
      tenantType: RoleTenantType.CROU,
      isSystemRole: true,
      isActive: true,
      createdBy: 'system'
    },
    {
      name: 'Intendant',
      description: 'Intendant - Gestion des stocks et approvisionnements',
      tenantType: RoleTenantType.CROU,
      isSystemRole: true,
      isActive: true,
      createdBy: 'system'
    },
    {
      name: 'Magasinier',
      description: 'Magasinier - Gestion des stocks opérationnels',
      tenantType: RoleTenantType.CROU,
      isSystemRole: true,
      isActive: true,
      createdBy: 'system'
    },
    {
      name: 'Chef Transport',
      description: 'Chef Transport - Gestion du parc automobile',
      tenantType: RoleTenantType.CROU,
      isSystemRole: true,
      isActive: true,
      createdBy: 'system'
    },
    {
      name: 'Chef Logement',
      description: 'Chef Logement - Gestion des cités universitaires',
      tenantType: RoleTenantType.CROU,
      isSystemRole: true,
      isActive: true,
      createdBy: 'system'
    },
    {
      name: 'Chef Restauration',
      description: 'Chef Restauration - Gestion de la restauration universitaire',
      tenantType: RoleTenantType.CROU,
      isSystemRole: true,
      isActive: true,
      createdBy: 'system'
    }
  ];

  // Création des rôles
  const roles = roleData.map(data => roleRepository.create(data));
  await roleRepository.save(roles);

  console.log(`✅ ${roles.length} rôles système créés (4 ministériels + 9 CROU)`);
  
  // Afficher le détail des rôles créés
  console.log('📋 Rôles créés:');
  console.log('   Ministériels:', roles.filter(r => r.tenantType === RoleTenantType.MINISTERE).map(r => r.name));
  console.log('   CROU:', roles.filter(r => r.tenantType === RoleTenantType.CROU).map(r => r.name));
}
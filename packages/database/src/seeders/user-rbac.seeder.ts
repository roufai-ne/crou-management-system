/**
 * FICHIER: packages\database\src\seeders\user-rbac.seeder.ts
 * SEEDER: Users RBAC - Utilisateurs avec rôles RBAC pour chaque tenant
 * 
 * DESCRIPTION:
 * Création des utilisateurs de test avec les nouveaux rôles RBAC
 * Remplace l'ancien système d'enum UserRole par les relations Role
 * 77 utilisateurs au total (4 ministère + 9×8 CROU + 1 admin)
 * 
 * UTILISATEURS MINISTÉRIELS:
 * - ministre@mesrit.gov.ne (Ministre)
 * - directeur.finances@mesrit.gov.ne (Directeur Affaires Financières)
 * - resp.appro@mesrit.gov.ne (Responsable Approvisionnements)
 * - controleur@mesrit.gov.ne (Contrôleur Budgétaire)
 * 
 * UTILISATEURS CROU (9 par CROU):
 * - directeur@crou_xxx.gov.ne (Directeur CROU)
 * - secretaire@crou_xxx.gov.ne (Secrétaire Administratif)
 * - chef.financier@crou_xxx.gov.ne (Chef Financier)
 * - comptable@crou_xxx.gov.ne (Comptable)
 * - intendant@crou_xxx.gov.ne (Intendant)
 * - magasinier@crou_xxx.gov.ne (Magasinier)
 * - chef.transport@crou_xxx.gov.ne (Chef Transport)
 * - chef.logement@crou_xxx.gov.ne (Chef Logement)
 * - chef.restauration@crou_xxx.gov.ne (Chef Restauration)
 * 
 * AUTEUR: Équipe CROU
 * DATE: Décembre 2024
 */

import { DataSource } from 'typeorm';
import { User, UserStatus } from '../entities/User.entity';
import { Tenant, TenantType } from '../entities/Tenant.entity';
import { Role } from '../entities/Role.entity';

export async function seedUsersRBAC(dataSource: DataSource): Promise<void> {
  const userRepository = dataSource.getRepository(User);
  const tenantRepository = dataSource.getRepository(Tenant);
  const roleRepository = dataSource.getRepository(Role);

  // Vérifier si les utilisateurs RBAC existent déjà
  // Compter les utilisateurs avec un roleId (utilisent le système RBAC)
  const existingUsersCount = await userRepository
    .createQueryBuilder('user')
    .where('user.roleId IS NOT NULL')
    .getCount();

  if (existingUsersCount > 0) {
    console.log(`⚠️  ${existingUsersCount} utilisateur(s) RBAC déjà créé(s), passage...`);
    return;
  }

  // Récupérer tous les tenants et rôles
  const tenants = await tenantRepository.find();
  const roles = await roleRepository.find();
  
  const ministere = tenants.find(t => t.type === TenantType.MINISTERE);
  const crouList = tenants.filter(t => t.type === TenantType.CROU);

  // Créer une map des rôles pour faciliter la recherche
  const roleMap = new Map(roles.map(role => [role.name, role]));

  const users: Partial<User>[] = [];

  // UTILISATEURS MINISTÉRIELS
  if (ministere) {
    const ministeriels = [
      {
        email: 'ministre@mesrit.gov.ne',
        name: 'Excellence Ministre MESRIT',
        roleName: 'Ministre',
        phone: '+227 20 72 34 56',
        department: 'Cabinet du Ministre'
      },
      {
        email: 'directeur.finances@mesrit.gov.ne',
        name: 'Directeur des Affaires Financières',
        roleName: 'Directeur Affaires Financières',
        phone: '+227 20 72 34 57',
        department: 'Direction Finances'
      },
      {
        email: 'resp.appro@mesrit.gov.ne',
        name: 'Responsable Approvisionnements',
        roleName: 'Responsable Approvisionnements',
        phone: '+227 20 72 34 58',
        department: 'Service Approvisionnements'
      },
      {
        email: 'controleur@mesrit.gov.ne',
        name: 'Contrôleur Budgétaire',
        roleName: 'Contrôleur Budgétaire',
        phone: '+227 20 72 34 59',
        department: 'Contrôle Budgétaire'
      }
    ];

    for (const userData of ministeriels) {
      const role = roleMap.get(userData.roleName);
      if (role) {
        users.push({
          email: userData.email,
          password: 'password123',
          name: userData.name,
          roleId: role.id,
          status: UserStatus.ACTIVE,
          tenantId: ministere.id,
          phone: userData.phone,
          department: userData.department,
          createdBy: 'system'
        });
      }
    }
  }

  // UTILISATEURS CROU (9 par CROU)
  const crouRoles = [
    { roleName: 'Directeur CROU', prefix: 'directeur', department: 'Direction' },
    { roleName: 'Secrétaire Administratif', prefix: 'secretaire', department: 'Administration' },
    { roleName: 'Chef Financier', prefix: 'chef.financier', department: 'Service Financier' },
    { roleName: 'Comptable', prefix: 'comptable', department: 'Comptabilité' },
    { roleName: 'Intendant', prefix: 'intendant', department: 'Intendance' },
    { roleName: 'Magasinier', prefix: 'magasinier', department: 'Magasin' },
    { roleName: 'Chef Transport', prefix: 'chef.transport', department: 'Transport' },
    { roleName: 'Chef Logement', prefix: 'chef.logement', department: 'Logement' },
    { roleName: 'Chef Restauration', prefix: 'chef.restauration', department: 'Restauration' }
  ];

  crouList.forEach((crou, crouIndex) => {
    const crouSuffix = crou.code.replace('crou_', '');
    const phoneBase = 20800000 + (crouIndex * 1000);
    
    crouRoles.forEach((roleData, roleIndex) => {
      const role = roleMap.get(roleData.roleName);
      if (role) {
        users.push({
          email: `${roleData.prefix}@${crou.code}.gov.ne`,
          password: 'password123',
          name: `${roleData.roleName} ${crou.region}`,
          roleId: role.id,
          status: UserStatus.ACTIVE,
          tenantId: crou.id,
          phone: `+227 ${phoneBase + roleIndex + 1}`,
          department: roleData.department,
          createdBy: 'system'
        });
      }
    });
  });

  // Création des utilisateurs par lots pour optimiser
  const batchSize = 10;
  let totalCreated = 0;
  
  for (let i = 0; i < users.length; i += batchSize) {
    const batch = users.slice(i, i + batchSize);
    const usersToSave = batch.map(userData => userRepository.create(userData));
    await userRepository.save(usersToSave);
    totalCreated += usersToSave.length;
    console.log(`Lot ${Math.floor(i/batchSize) + 1}: ${usersToSave.length} utilisateurs RBAC créés`);
  }

  console.log(`✅ ${totalCreated} utilisateurs RBAC créés au total :`);
  console.log(`   - 4 utilisateurs Ministère`);
  console.log(`   - ${crouList.length * 9} utilisateurs CROU (9 par région)`);
  console.log(`   - Total: ${4 + (crouList.length * 9)} utilisateurs avec rôles RBAC`);

  // Afficher quelques exemples d'utilisateurs créés
  const sampleUsers = await userRepository.find({
    take: 5,
    relations: ['role', 'tenant']
  });
  
  console.log('📋 Exemples d\'utilisateurs créés:');
  sampleUsers.forEach(user => {
    console.log(`   - ${user.email} (${user.role?.name}) - ${user.tenant?.name}`);
  });
}
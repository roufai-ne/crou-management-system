/**
 * FICHIER: packages/database/src/seeds/003-users.seed.ts
 * SEED: Création des utilisateurs initiaux du système
 *
 * DESCRIPTION:
 * Seed pour créer les utilisateurs de base pour chaque organisation
 *
 * UTILISATEURS CRÉÉS:
 * 1. Super Admin (accès système complet)
 * 2. Admin Ministère (monitoring)
 * 3. 8 Directeurs CROU (un par CROU)
 * 4. 16 Gestionnaires (2 par CROU: Stocks et Logement)
 *
 * TOTAL: 26 utilisateurs
 *
 * MOTS DE PASSE PAR DÉFAUT:
 * - Super Admin: Admin@2025!
 * - Autres: Password@2025! (à changer à la première connexion)
 *
 * AUTEUR: Équipe CROU
 * DATE: Octobre 2025
 */

import { DataSource } from 'typeorm';
import bcrypt from 'bcryptjs';
import { UserStatus } from '../entities/User.entity';
import { User } from '../entities/User.entity';
import { Role } from '../entities/Role.entity';
import { Tenant } from '../entities/Tenant.entity';

export const seedUsers = async (dataSource: DataSource): Promise<void> => {
  const userRepository = dataSource.getRepository(User);
  const roleRepository = dataSource.getRepository(Role);
  const tenantRepository = dataSource.getRepository(Tenant);

  // Vérifier si les utilisateurs existent déjà
  const existingUsersCount = await userRepository.count();
  if (existingUsersCount > 0) {
    console.log('⏭️  Utilisateurs déjà créés, passage au seed suivant...');
    return;
  }

  console.log('🌱 Récupération des rôles et tenants...');

  // Récupérer les rôles
  const roleSuperAdmin = await roleRepository.findOne({ where: { name: 'Super Admin' } });
  const roleAdminMinistere = await roleRepository.findOne({ where: { name: 'Admin Ministère' } });
  const roleDirecteurCrou = await roleRepository.findOne({ where: { name: 'Directeur CROU' } });
  const roleGestionnaireStocks = await roleRepository.findOne({ where: { name: 'Gestionnaire Stocks' } });
  const roleGestionnaireLogement = await roleRepository.findOne({ where: { name: 'Gestionnaire Logement' } });

  if (!roleSuperAdmin || !roleAdminMinistere || !roleDirecteurCrou || !roleGestionnaireStocks || !roleGestionnaireLogement) {
    throw new Error('❌ Les rôles doivent être créés avant les utilisateurs');
  }

  // Récupérer les tenants
  const ministere = await tenantRepository.findOne({ where: { code: 'MINISTERE' } });
  const crouNiamey = await tenantRepository.findOne({ where: { code: 'CROU_NIAMEY' } });
  const crouMaradi = await tenantRepository.findOne({ where: { code: 'CROU_MARADI' } });
  const crouZinder = await tenantRepository.findOne({ where: { code: 'CROU_ZINDER' } });
  const crouTahoua = await tenantRepository.findOne({ where: { code: 'CROU_TAHOUA' } });
  const crouAgadez = await tenantRepository.findOne({ where: { code: 'CROU_AGADEZ' } });
  const crouDosso = await tenantRepository.findOne({ where: { code: 'CROU_DOSSO' } });
  const crouDiffa = await tenantRepository.findOne({ where: { code: 'CROU_DIFFA' } });
  const crouTillabery = await tenantRepository.findOne({ where: { code: 'CROU_TILLABERY' } });

  if (!ministere || !crouNiamey || !crouMaradi || !crouZinder || !crouTahoua || !crouAgadez || !crouDosso || !crouDiffa || !crouTillabery) {
    throw new Error('❌ Les tenants doivent être créés avant les utilisateurs');
  }

  console.log('🌱 Création des utilisateurs...');

  // Hash des mots de passe
  const adminPassword = await bcrypt.hash('Admin@2025!', 10);
  const defaultPassword = await bcrypt.hash('Password@2025!', 10);

  const users: User[] = [];

  // ==============================================
  // 1. SUPER ADMIN
  // ==============================================
  users.push(userRepository.create({
    email: 'admin@crou.ne',
    password: adminPassword,
    name: 'Super Administrateur',
    firstName: 'Super',
    lastName: 'Administrateur',
    role: roleSuperAdmin,
    tenant: ministere,
    isActive: true,
    // emailVerified: true,
    status: UserStatus.ACTIVE
  }));

  // ==============================================
  // 2. ADMIN MINISTÈRE
  // ==============================================
  users.push(userRepository.create({
    email: 'ministre@mesr.gouv.ne',
    password: defaultPassword,
    name: 'Ministre de l\'Enseignement Supérieur',
    firstName: 'Ministre',
    lastName: 'MESR',
    role: roleAdminMinistere,
    tenant: ministere,
    isActive: true,
    // emailVerified: true,
    status: UserStatus.ACTIVE
  }));

  // ==============================================
  // 3-10. DIRECTEURS CROU (8)
  // ==============================================
  const croussWithDirectors = [
    { tenant: crouNiamey, name: 'Directeur CROU Niamey', email: 'directeur@crou-niamey.ne', firstName: 'Abdou', lastName: 'Moumouni' },
    { tenant: crouMaradi, name: 'Directeur CROU Maradi', email: 'directeur@crou-maradi.ne', firstName: 'Ibrahim', lastName: 'Sani' },
    { tenant: crouZinder, name: 'Directeur CROU Zinder', email: 'directeur@crou-zinder.ne', firstName: 'Mahamane', lastName: 'Ousmane' },
    { tenant: crouTahoua, name: 'Directeur CROU Tahoua', email: 'directeur@crou-tahoua.ne', firstName: 'Amadou', lastName: 'Issoufou' },
    { tenant: crouAgadez, name: 'Directeur CROU Agadez', email: 'directeur@crou-agadez.ne', firstName: 'Mohamed', lastName: 'Ali' },
    { tenant: crouDosso, name: 'Directeur CROU Dosso', email: 'directeur@crou-dosso.ne', firstName: 'Hamidou', lastName: 'Yahaya' },
    { tenant: crouDiffa, name: 'Directeur CROU Diffa', email: 'directeur@crou-diffa.ne', firstName: 'Moussa', lastName: 'Kaka' },
    { tenant: crouTillabery, name: 'Directeur CROU Tillabéry', email: 'directeur@crou-tillabery.ne', firstName: 'Oumarou', lastName: 'Boureima' }
  ];

  for (const director of croussWithDirectors) {
    users.push(userRepository.create({
      email: director.email,
      password: defaultPassword,
      name: director.name,
      firstName: director.firstName,
      lastName: director.lastName,
      role: roleDirecteurCrou,
      tenant: director.tenant,
      isActive: true,
      // emailVerified: true,
      status: UserStatus.ACTIVE
    }));
  }

  // ==============================================
  // 11-26. GESTIONNAIRES (16)
  // 2 par CROU: Stocks + Logement
  // ==============================================
  const croussWithManagers = [
    {
      tenant: crouNiamey,
      code: 'niamey',
      stocks: { email: 'stocks@crou-niamey.ne', firstName: 'Fatima', lastName: 'Boubacar' },
      logement: { email: 'logement@crou-niamey.ne', firstName: 'Aissata', lastName: 'Mamane' }
    },
    {
      tenant: crouMaradi,
      code: 'maradi',
      stocks: { email: 'stocks@crou-maradi.ne', firstName: 'Halima', lastName: 'Moussa' },
      logement: { email: 'logement@crou-maradi.ne', firstName: 'Mariama', lastName: 'Ibrahim' }
    },
    {
      tenant: crouZinder,
      code: 'zinder',
      stocks: { email: 'stocks@crou-zinder.ne', firstName: 'Rakiatou', lastName: 'Harouna' },
      logement: { email: 'logement@crou-zinder.ne', firstName: 'Zeinabou', lastName: 'Amadou' }
    },
    {
      tenant: crouTahoua,
      code: 'tahoua',
      stocks: { email: 'stocks@crou-tahoua.ne', firstName: 'Hadiza', lastName: 'Saidou' },
      logement: { email: 'logement@crou-tahoua.ne', firstName: 'Ramatou', lastName: 'Ali' }
    },
    {
      tenant: crouAgadez,
      code: 'agadez',
      stocks: { email: 'stocks@crou-agadez.ne', firstName: 'Amina', lastName: 'Mohamed' },
      logement: { email: 'logement@crou-agadez.ne', firstName: 'Salamatou', lastName: 'Ousmane' }
    },
    {
      tenant: crouDosso,
      code: 'dosso',
      stocks: { email: 'stocks@crou-dosso.ne', firstName: 'Haoua', lastName: 'Issa' },
      logement: { email: 'logement@crou-dosso.ne', firstName: 'Fatoumata', lastName: 'Soumana' }
    },
    {
      tenant: crouDiffa,
      code: 'diffa',
      stocks: { email: 'stocks@crou-diffa.ne', firstName: 'Nana', lastName: 'Mahamadou' },
      logement: { email: 'logement@crou-diffa.ne', firstName: 'Safiya', lastName: 'Boubacar' }
    },
    {
      tenant: crouTillabery,
      code: 'tillabery',
      stocks: { email: 'stocks@crou-tillabery.ne', firstName: 'Asma', lastName: 'Abdou' },
      logement: { email: 'logement@crou-tillabery.ne', firstName: 'Maryam', lastName: 'Hamidou' }
    }
  ];

  for (const crou of croussWithManagers) {
    // Gestionnaire Stocks
    users.push(userRepository.create({
      email: crou.stocks.email,
      password: defaultPassword,
      name: `Gestionnaire Stocks - ${crou.tenant.name}`,
      firstName: crou.stocks.firstName,
      lastName: crou.stocks.lastName,
      role: roleGestionnaireStocks,
      tenant: crou.tenant,
      isActive: true,
      // emailVerified: true,
      status: UserStatus.ACTIVE
    }));

    // Gestionnaire Logement
    users.push(userRepository.create({
      email: crou.logement.email,
      password: defaultPassword,
      name: `Gestionnaire Logement - ${crou.tenant.name}`,
      firstName: crou.logement.firstName,
      lastName: crou.logement.lastName,
      role: roleGestionnaireLogement,
      tenant: crou.tenant,
      isActive: true,
      // emailVerified: true,
      status: UserStatus.ACTIVE
    }));
  }

  // Enregistrer tous les utilisateurs
  await userRepository.save(users);

  console.log('✅ 26 utilisateurs créés avec succès');
  console.log('');
  console.log('👤 SUPER ADMIN:');
  console.log('   Email: admin@crou.ne');
  console.log('   Mot de passe: Admin@2025!');
  console.log('');
  console.log('👥 STRUCTURE:');
  console.log('   - 1 Super Admin (système)');
  console.log('   - 1 Admin Ministère (MESR)');
  console.log('   - 8 Directeurs CROU');
  console.log('   - 8 Gestionnaires Stocks');
  console.log('   - 8 Gestionnaires Logement');
  console.log('');
  console.log('🔐 MOTS DE PASSE PAR DÉFAUT:');
  console.log('   - Super Admin: Admin@2025!');
  console.log('   - Tous les autres: Password@2025!');
  console.log('');
  console.log('⚠️  IMPORTANT: Changer les mots de passe à la première connexion!');
};

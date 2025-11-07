/**
 * FICHIER: packages/database/src/seeds/001-tenants.seed.ts
 * SEED: Création des 8 CROU + Ministère
 *
 * DESCRIPTION:
 * Seed initial pour créer les 9 organisations du système
 * - 1 Ministère de l'Enseignement Supérieur (tenant principal)
 * - 8 CROU régionaux (Niamey, Maradi, Zinder, Tahoua, Agadez, Dosso, Diffa, Tillabéry)
 *
 * AUTEUR: Équipe CROU
 * DATE: Octobre 2025
 */

import { DataSource } from 'typeorm';
import { Tenant, TenantType } from '../entities/Tenant.entity';

export const seedTenants = async (dataSource: DataSource): Promise<void> => {
  const tenantRepository = dataSource.getRepository(Tenant);

  // Vérifier si les tenants existent déjà
  const existingCount = await tenantRepository.count();
  if (existingCount > 0) {
    console.log('⏭️  Tenants déjà créés, passage au seed suivant...');
    return;
  }

  console.log('🌱 Création des tenants (8 CROU + Ministère)...');

  // 1. Ministère de l'Enseignement Supérieur (Tenant Principal)
  const ministere = tenantRepository.create({
    code: 'MINISTERE',
    name: 'Ministère de l\'Enseignement Supérieur',
    type: TenantType.MINISTERE,
    // contactEmail: 'contact@mesr.gouv.ne',
    // contactPhone: '+227 20 73 31 29',
    // address: 'Avenue du Général de Gaulle, Niamey',
    isActive: true,
    // Hiérarchie: Niveau 0 (racine)
    parentId: null,
    path: 'MINISTERE',
    level: 0,
    config: {
      canManageAllCROUs: true,
      hasGlobalAccess: true,
      dashboardType: 'ministry',
      features: {
        budgetConsolidation: true,
        globalReporting: true,
        crouMonitoring: true,
        advancedAnalytics: true
      }
    }
  });

  // 2. CROU Niamey (Plus grand CROU)
  const crouNiamey = tenantRepository.create({
    code: 'CROU_NIAMEY',
    name: 'CROU Niamey',
    type: TenantType.CROU,
    // contactEmail: 'contact@crou-niamey.ne',
    // contactPhone: '+227 20 73 42 15',
    // address: 'Campus Universitaire Abdou Moumouni, Niamey',
    isActive: true,
    config: {
      region: 'Niamey',
      capacity: {
        students: 35000,
        housing: 5000,
        restaurants: 3
      },
      features: {
        housing: true,
        restaurants: true,
        transport: true,
        sports: true,
        health: true,
        library: true
      }
    }
  });

  // 3. CROU Maradi
  const crouMaradi = tenantRepository.create({
    code: 'CROU_MARADI',
    name: 'CROU Maradi',
    type: TenantType.CROU,
    // contactEmail: 'contact@crou-maradi.ne',
    // contactPhone: '+227 20 41 02 34',
    // address: 'Université de Maradi, Maradi',
    isActive: true,
    config: {
      region: 'Maradi',
      capacity: {
        students: 8000,
        housing: 1200,
        restaurants: 1
      },
      features: {
        housing: true,
        restaurants: true,
        transport: true,
        sports: true
      }
    }
  });

  // 4. CROU Zinder
  const crouZinder = tenantRepository.create({
    code: 'CROU_ZINDER',
    name: 'CROU Zinder',
    type: TenantType.CROU,
    // contactEmail: 'contact@crou-zinder.ne',
    // contactPhone: '+227 20 51 03 45',
    // address: 'Université de Zinder, Zinder',
    isActive: true,
    config: {
      region: 'Zinder',
      capacity: {
        students: 7500,
        housing: 1000,
        restaurants: 1
      },
      features: {
        housing: true,
        restaurants: true,
        transport: true
      }
    }
  });

  // 5. CROU Tahoua
  const crouTahoua = tenantRepository.create({
    code: 'CROU_TAHOUA',
    name: 'CROU Tahoua',
    type: TenantType.CROU,
    // contactEmail: 'contact@crou-tahoua.ne',
    // contactPhone: '+227 20 61 04 56',
    // address: 'Université de Tahoua, Tahoua',
    isActive: true,
    config: {
      region: 'Tahoua',
      capacity: {
        students: 6000,
        housing: 800,
        restaurants: 1
      },
      features: {
        housing: true,
        restaurants: true,
        transport: false
      }
    }
  });

  // 6. CROU Agadez
  const crouAgadez = tenantRepository.create({
    code: 'CROU_AGADEZ',
    name: 'CROU Agadez',
    type: TenantType.CROU,
    // contactEmail: 'contact@crou-agadez.ne',
    // contactPhone: '+227 20 44 05 67',
    // address: 'Université d\'Agadez, Agadez',
    isActive: true,
    config: {
      region: 'Agadez',
      capacity: {
        students: 3500,
        housing: 500,
        restaurants: 1
      },
      features: {
        housing: true,
        restaurants: true,
        transport: false
      }
    }
  });

  // 7. CROU Dosso
  const crouDosso = tenantRepository.create({
    code: 'CROU_DOSSO',
    name: 'CROU Dosso',
    type: TenantType.CROU,
    // contactEmail: 'contact@crou-dosso.ne',
    // contactPhone: '+227 20 65 06 78',
    // address: 'Université de Dosso, Dosso',
    isActive: true,
    config: {
      region: 'Dosso',
      capacity: {
        students: 5500,
        housing: 700,
        restaurants: 1
      },
      features: {
        housing: true,
        restaurants: true,
        transport: false
      }
    }
  });

  // 8. CROU Diffa
  const crouDiffa = tenantRepository.create({
    code: 'CROU_DIFFA',
    name: 'CROU Diffa',
    type: TenantType.CROU,
    // contactEmail: 'contact@crou-diffa.ne',
    // contactPhone: '+227 20 53 07 89',
    // address: 'Université de Diffa, Diffa',
    isActive: true,
    config: {
      region: 'Diffa',
      capacity: {
        students: 3000,
        housing: 400,
        restaurants: 1
      },
      features: {
        housing: true,
        restaurants: true,
        transport: false
      }
    }
  });

  // 9. CROU Tillabéry
  const crouTillabery = tenantRepository.create({
    code: 'CROU_TILLABERY',
    name: 'CROU Tillabéry',
    type: TenantType.CROU,
    // contactEmail: 'contact@crou-tillabery.ne',
    // contactPhone: '+227 20 71 08 90',
    // address: 'Université de Tillabéry, Tillabéry',
    isActive: true,
    config: {
      region: 'Tillabéry',
      capacity: {
        students: 4500,
        housing: 600,
        restaurants: 1
      },
      features: {
        housing: true,
        restaurants: true,
        transport: false
      }
    }
  });

  // Enregistrer d'abord le Ministère pour obtenir son ID
  const savedMinistere = await tenantRepository.save(ministere);

  // Maintenant, définir le parentId pour tous les CROU
  crouNiamey.parentId = savedMinistere.id;
  crouNiamey.path = `${savedMinistere.path}/${crouNiamey.code}`;
  crouNiamey.level = 1;

  crouMaradi.parentId = savedMinistere.id;
  crouMaradi.path = `${savedMinistere.path}/${crouMaradi.code}`;
  crouMaradi.level = 1;

  crouZinder.parentId = savedMinistere.id;
  crouZinder.path = `${savedMinistere.path}/${crouZinder.code}`;
  crouZinder.level = 1;

  crouTahoua.parentId = savedMinistere.id;
  crouTahoua.path = `${savedMinistere.path}/${crouTahoua.code}`;
  crouTahoua.level = 1;

  crouAgadez.parentId = savedMinistere.id;
  crouAgadez.path = `${savedMinistere.path}/${crouAgadez.code}`;
  crouAgadez.level = 1;

  crouDosso.parentId = savedMinistere.id;
  crouDosso.path = `${savedMinistere.path}/${crouDosso.code}`;
  crouDosso.level = 1;

  crouDiffa.parentId = savedMinistere.id;
  crouDiffa.path = `${savedMinistere.path}/${crouDiffa.code}`;
  crouDiffa.level = 1;

  crouTillabery.parentId = savedMinistere.id;
  crouTillabery.path = `${savedMinistere.path}/${crouTillabery.code}`;
  crouTillabery.level = 1;

  // Enregistrer tous les CROU
  await tenantRepository.save([
    crouNiamey,
    crouMaradi,
    crouZinder,
    crouTahoua,
    crouAgadez,
    crouDosso,
    crouDiffa,
    crouTillabery
  ]);

  console.log('✅ 9 tenants créés avec succès (1 Ministère + 8 CROU)');
  console.log('   - Ministère de l\'Enseignement Supérieur');
  console.log('   - CROU Niamey (35,000 étudiants)');
  console.log('   - CROU Maradi (8,000 étudiants)');
  console.log('   - CROU Zinder (7,500 étudiants)');
  console.log('   - CROU Tahoua (6,000 étudiants)');
  console.log('   - CROU Agadez (3,500 étudiants)');
  console.log('   - CROU Dosso (5,500 étudiants)');
  console.log('   - CROU Diffa (3,000 étudiants)');
  console.log('   - CROU Tillabéry (4,500 étudiants)');
};

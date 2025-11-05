/**
 * FICHIER: packages\database\src\seeders\tenant.seeder.ts
 * SEEDER: Tenants - Ministère + 8 CROU du Niger avec hiérarchie
 *
 * DESCRIPTION:
 * Création des tenants multi-tenant selon structure officielle CROU Niger
 * 1 Ministère + 8 CROU régionaux avec configuration hiérarchique
 * Données réelles des régions du Niger
 *
 * TENANTS CRÉÉS:
 * - Ministère MESRIT (niveau 0 - supervision nationale)
 * - CROU Niamey (niveau 1 - capitale)
 * - CROU Dosso, Maradi, Tahoua, Zinder, Agadez, Tillabéri, Diffa (niveau 1)
 *
 * HIÉRARCHIE:
 * - Niveau 0: Ministère (parent null, path: "ministere")
 * - Niveau 1: CROUs (parent: Ministère, path: "ministere/crou_xxx")
 * - Niveau 2: Services (parent: CROU, path: "ministere/crou_xxx/service_xxx") [à créer]
 *
 * FONCTIONNALITÉS:
 * - Création initiale des tenants avec hiérarchie
 * - Mise à jour de la hiérarchie pour bases existantes
 * - Validation des relations parent-enfant
 *
 * AUTEUR: Équipe CROU
 * DATE: Décembre 2024
 */

import { DataSource } from 'typeorm';
import { Tenant, TenantType } from '../entities/Tenant.entity';

export async function seedTenants(dataSource: DataSource): Promise<void> {
  const tenantRepository = dataSource.getRepository(Tenant);

  // Vérifier si les tenants existent déjà
  const existingCount = await tenantRepository.count();
  if (existingCount > 0) {
    console.log('⚠️  Tenants déjà créés, mise à jour hiérarchie si nécessaire...');

    // Vérifier si la hiérarchie est déjà configurée
    const ministere = await tenantRepository.findOne({
      where: { type: TenantType.MINISTERE }
    });

    if (ministere && !ministere.path) {
      // Mise à jour de la hiérarchie pour les tenants existants
      await updateExistingTenantsHierarchy(dataSource);
    }
    return;
  }

  // ========================================
  // ÉTAPE 1: Créer le Ministère (niveau 0)
  // ========================================
  const ministereData = {
    name: 'Ministère de l\'Enseignement Supérieur',
    code: 'ministere',
    type: TenantType.MINISTERE,
    region: null,
    level: 0,
    path: 'ministere',
    parentId: null,
    serviceType: null,
    config: {
      centralizedPurchasing: true,
      supervisionLevel: 'national',
      reportingFrequency: 'monthly'
    }
  };

  const ministere = tenantRepository.create(ministereData);
  await tenantRepository.save(ministere);
  console.log('✅ Ministère créé (niveau 0)');

  // ========================================
  // ÉTAPE 2: Créer les CROUs (niveau 1)
  // ========================================
  const crouData = [
    
    // CROU Régionaux
    {
      name: 'CROU Niamey',
      code: 'crou_niamey', 
      type: TenantType.CROU,
      region: 'Niamey',
      config: {
        studentsCapacity: 3000,
        housingUnits: 1200,
        restaurantSeats: 800,
        vehicleFleet: 12
      }
    },
    {
      name: 'CROU Dosso',
      code: 'crou_dosso',
      type: TenantType.CROU,
      region: 'Dosso',
      config: {
        studentsCapacity: 1500,
        housingUnits: 600,
        restaurantSeats: 400,
        vehicleFleet: 6
      }
    },
    {
      name: 'CROU Maradi',
      code: 'crou_maradi',
      type: TenantType.CROU,
      region: 'Maradi',
      config: {
        studentsCapacity: 2000,
        housingUnits: 800,
        restaurantSeats: 500,
        vehicleFleet: 8
      }
    },
    {
      name: 'CROU Tahoua',
      code: 'crou_tahoua',
      type: TenantType.CROU,
      region: 'Tahoua',
      config: {
        studentsCapacity: 1200,
        housingUnits: 480,
        restaurantSeats: 300,
        vehicleFleet: 5
      }
    },
    {
      name: 'CROU Zinder',
      code: 'crou_zinder',
      type: TenantType.CROU,
      region: 'Zinder',
      config: {
        studentsCapacity: 1800,
        housingUnits: 720,
        restaurantSeats: 450,
        vehicleFleet: 7
      }
    },
    {
      name: 'CROU Agadez',
      code: 'crou_agadez',
      type: TenantType.CROU,
      region: 'Agadez',
      config: {
        studentsCapacity: 800,
        housingUnits: 320,
        restaurantSeats: 200,
        vehicleFleet: 4
      }
    },
    {
      name: 'CROU Tillabéri',
      code: 'crou_tillaberi',
      type: TenantType.CROU,
      region: 'Tillabéri',
      config: {
        studentsCapacity: 1000,
        housingUnits: 400,
        restaurantSeats: 250,
        vehicleFleet: 5
      }
    },
    {
      name: 'CROU Diffa',
      code: 'crou_diffa',
      type: TenantType.CROU,
      region: 'Diffa',
      config: {
        studentsCapacity: 600,
        housingUnits: 240,
        restaurantSeats: 150,
        vehicleFleet: 3
      }
    }
  ];

  // Créer les CROUs avec la hiérarchie
  const crous = crouData.map(data => tenantRepository.create({
    ...data,
    level: 1,
    parentId: ministere.id,
    path: `ministere/${data.code}`,
    serviceType: null
  }));
  await tenantRepository.save(crous);
  console.log(`✅ ${crous.length} CROUs créés (niveau 1)`);

  console.log(`\n✅ ${1 + crous.length} tenants créés au total (1 Ministère + ${crous.length} CROU)`);
  console.log('📊 Hiérarchie tenant configurée:');
  console.log(`   Niveau 0: Ministère (${ministere.name})`);
  console.log(`   Niveau 1: ${crous.length} CROUs`);
}

/**
 * Mettre à jour la hiérarchie des tenants existants
 * Utilisé lors de la migration d'une base existante
 */
async function updateExistingTenantsHierarchy(dataSource: DataSource): Promise<void> {
  const tenantRepository = dataSource.getRepository(Tenant);

  // Récupérer le ministère
  const ministere = await tenantRepository.findOne({
    where: { type: TenantType.MINISTERE }
  });

  if (!ministere) {
    console.error('❌ Ministère introuvable, impossible de mettre à jour la hiérarchie');
    return;
  }

  // Mettre à jour le ministère
  await tenantRepository.update(ministere.id, {
    level: 0,
    path: ministere.code,
    parentId: null
  });
  console.log('✅ Ministère mis à jour avec hiérarchie');

  // Récupérer tous les CROUs
  const crous = await tenantRepository.find({
    where: { type: TenantType.CROU }
  });

  // Mettre à jour chaque CROU
  for (const crou of crous) {
    await tenantRepository.update(crou.id, {
      level: 1,
      parentId: ministere.id,
      path: `${ministere.code}/${crou.code}`
    });
  }

  console.log(`✅ ${crous.length} CROUs mis à jour avec hiérarchie`);
  console.log('✅ Hiérarchie des tenants existants mise à jour avec succès');
}
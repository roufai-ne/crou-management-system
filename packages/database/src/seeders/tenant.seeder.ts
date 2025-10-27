/**
 * FICHIER: packages\database\src\seeders\tenant.seeder.ts
 * SEEDER: Tenants - Ministère + 8 CROU du Niger
 * 
 * DESCRIPTION:
 * Création des tenants multi-tenant selon structure officielle CROU Niger
 * 1 Ministère + 8 CROU régionaux avec configuration spécifique
 * Données réelles des régions du Niger
 * 
 * TENANTS CRÉÉS:
 * - Ministère MESRIT (supervision nationale)
 * - CROU Niamey (capitale)  
 * - CROU Dosso, Maradi, Tahoua, Zinder, Agadez, Tillabéri, Diffa
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
    console.log('⚠️  Tenants déjà créés, passage...');
    return;
  }

  // Données des tenants Niger (Ministère + 8 CROU)
  const tenantData = [
    // Niveau Ministère
    {
      name: 'Ministère de l\'Enseignement Supérieur',
      code: 'ministere',
      type: TenantType.MINISTERE,
      region: null,
      config: {
        centralizedPurchasing: true,
        supervisionLevel: 'national',
        reportingFrequency: 'monthly'
      }
    },
    
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

  // Création des tenants
  const tenants = tenantData.map(data => tenantRepository.create(data));
  await tenantRepository.save(tenants);

  console.log(`✅ ${tenants.length} tenants créés (1 Ministère + 8 CROU)`);
}
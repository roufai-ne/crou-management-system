/**
 * FICHIER: packages/database/src/seeds/005-housing-data.seed.ts
 * SEED: Données de test pour le module logement
 *
 * DESCRIPTION:
 * Seed pour créer une hiérarchie complète de logements:
 * Tenant → Cités → Chambres → Lits
 *
 * DONNÉES CRÉÉES:
 * - 2 cités universitaires par CROU
 * - 10 chambres par cité (différents types)
 * - Lits correspondants à chaque chambre
 *
 * AUTEUR: Équipe CROU
 * DATE: Décembre 2025
 */

import { DataSource } from 'typeorm';
import { Tenant } from '../entities/Tenant.entity';
import { User } from '../entities/User.entity';
import { Housing, HousingType, HousingCategory, HousingStatus } from '../entities/Housing.entity';
import { Room, RoomType, RoomStatus } from '../entities/Room.entity';
import { Bed, BedStatus } from '../entities/Bed.entity';

export const seedHousingData = async (dataSource: DataSource): Promise<void> => {
  // Vérifier l'environnement
  if (process.env.NODE_ENV === 'production') {
    console.log('⚠️  Seeds de logement désactivés en production');
    return;
  }

  const tenantRepository = dataSource.getRepository(Tenant);
  const userRepository = dataSource.getRepository(User);
  const housingRepository = dataSource.getRepository(Housing);
  const roomRepository = dataSource.getRepository(Room);
  const bedRepository = dataSource.getRepository(Bed);

  // Ne pas recréer si des données existent déjà
  const existingHousings = await housingRepository.count();
  if (existingHousings > 0) {
    console.log('⏭️  Données de logement déjà créées');
    console.log(`   → ${existingHousings} cité(s) trouvée(s)`);
    console.log('   → Pour recréer les données, exécutez d\'abord: pnpm --filter @crou/database exec tsx scripts/reset-housing.ts\n');
    return;
  }

  console.log('🏠 Création des données de logement...');

  // Récupérer uniquement 3 tenants pour créer des données
  const tenants = await tenantRepository.find({ 
    where: { isActive: true },
    take: 3,
    order: { createdAt: 'ASC' }
  });
  
  if (tenants.length === 0) {
    console.error('❌ Aucun tenant trouvé. Exécuter d\'abord les seeds de tenants.');
    return;
  }

  console.log(`📊 Création de données pour ${tenants.length} tenant(s)\n`);

  let totalComplexes = 0;
  let totalRooms = 0;
  let totalBeds = 0;

  for (const tenant of tenants) {
    console.log(`\n📍 Création logements pour: ${tenant.name}`);

    // Récupérer un utilisateur du tenant pour createdBy
    const user = await userRepository.findOne({
      where: { tenantId: tenant.id },
      order: { createdAt: 'ASC' }
    });

    if (!user) {
      console.log(`⚠️  Aucun utilisateur trouvé pour ${tenant.name}`);
      continue;
    }

    // Créer 2 cités par CROU
    const cite1 = await housingRepository.save(
      housingRepository.create({
        tenantId: tenant.id,
        code: `${tenant.code}-CU-NORD`,
        nom: `Cité Universitaire Nord - ${tenant.name}`,
        adresse: `Avenue de la République, ${tenant.name.split(' ').pop()}`,
        description: 'Résidence moderne avec toutes les commodités',
        type: HousingType.CITE_UNIVERSITAIRE,
        category: HousingCategory.STANDARD,
        status: HousingStatus.ACTIF,
        nombreChambres: 50,
        capaciteTotale: 100,
        occupationActuelle: 70,
        tauxOccupation: 70,
        loyerMensuel: 15000,
        caution: 30000,
        devise: 'XOF',
        wifi: true,
        securite: true,
        isActif: true,
        createdBy: user.id
      })
    );

    const cite2 = await housingRepository.save(
      housingRepository.create({
        tenantId: tenant.id,
        code: `${tenant.code}-CU-SUD`,
        nom: `Cité Universitaire Sud - ${tenant.name}`,
        adresse: `Boulevard de l'Indépendance, ${tenant.name.split(' ').pop()}`,
        description: 'Cité récente avec équipements sportifs',
        type: HousingType.CITE_UNIVERSITAIRE,
        category: HousingCategory.STANDARD,
        status: HousingStatus.ACTIF,
        nombreChambres: 40,
        capaciteTotale: 80,
        occupationActuelle: 56,
        tauxOccupation: 70,
        loyerMensuel: 15000,
        caution: 30000,
        devise: 'XOF',
        wifi: true,
        climatisation: true,
        securite: true,
        isActif: true,
        createdBy: user.id
      })
    );

    totalComplexes += 2;

    // Créer chambres et lits pour cite1
    const roomTypes: Array<{ type: RoomType; capacity: number; count: number }> = [
      { type: RoomType.SIMPLE, capacity: 1, count: 3 },
      { type: RoomType.DOUBLE, capacity: 2, count: 4 },
      { type: RoomType.TRIPLE, capacity: 3, count: 2 },
      { type: RoomType.QUADRUPLE, capacity: 4, count: 1 }
    ];

    for (const { type, capacity, count } of roomTypes) {
      for (let i = 1; i <= count; i++) {
        const roomNumber = `${type.charAt(0).toUpperCase()}${i.toString().padStart(2, '0')}`;
        const isOccupied = Math.random() > 0.3; // 70% occupées
        const currentOccupancy = isOccupied ? Math.floor(Math.random() * capacity) + 1 : 0;

        const room = await roomRepository.save(
          roomRepository.create({
            housingId: cite1.id,
            numero: roomNumber,
            type: type,
            capacite: capacity,
            occupation: currentOccupancy,
            tauxOccupation: (currentOccupancy / capacity) * 100,
            loyerMensuel: 15000,
            caution: 30000,
            devise: 'XOF',
            status: currentOccupancy === 0 ? RoomStatus.DISPONIBLE : currentOccupancy < capacity ? RoomStatus.DISPONIBLE : RoomStatus.OCCUPE,
            equipements: ['Lit', 'Bureau', 'Armoire', 'Ventilateur'],
            wifi: true,
            isActif: true,
            createdBy: user.id
          })
        );

        totalRooms++;

        // Créer les lits pour cette chambre
        for (let bedNum = 1; bedNum <= capacity; bedNum++) {
          const bedStatus = bedNum <= currentOccupancy ? BedStatus.OCCUPIED : BedStatus.AVAILABLE;
          
          await bedRepository.save(
            bedRepository.create({
              roomId: room.id,
              number: `${roomNumber}-L${bedNum}`,
              description: `Lit ${bedNum} de la chambre ${roomNumber}`,
              status: bedStatus,
              createdBy: user.id
            })
          );

          totalBeds++;
        }
      }
    }

    // Créer chambres et lits pour cite2 (moins de chambres)
    for (const { type, capacity, count } of roomTypes.slice(0, 3)) { // Seulement les 3 premiers types
      for (let i = 1; i <= count; i++) {
        const roomNumber = `${type.charAt(0).toUpperCase()}${(i + 10).toString().padStart(2, '0')}`;
        const isOccupied = Math.random() > 0.4; // 60% occupées
        const currentOccupancy = isOccupied ? Math.floor(Math.random() * capacity) + 1 : 0;

        const room = await roomRepository.save(
          roomRepository.create({
            housingId: cite2.id,
            numero: roomNumber,
            type: type,
            capacite: capacity,
            occupation: currentOccupancy,
            tauxOccupation: (currentOccupancy / capacity) * 100,
            loyerMensuel: 15000,
            caution: 30000,
            devise: 'XOF',
            status: currentOccupancy === 0 ? RoomStatus.DISPONIBLE : currentOccupancy < capacity ? RoomStatus.DISPONIBLE : RoomStatus.OCCUPE,
            equipements: ['Lit', 'Bureau', 'Armoire', 'Climatisation'],
            climatisation: true,
            wifi: true,
            isActif: true,
            createdBy: user.id
          })
        );

        totalRooms++;

        // Créer les lits
        for (let bedNum = 1; bedNum <= capacity; bedNum++) {
          const bedStatus = bedNum <= currentOccupancy ? BedStatus.OCCUPIED : BedStatus.AVAILABLE;
          
          await bedRepository.save(
            bedRepository.create({
              roomId: room.id,
              number: `${roomNumber}-L${bedNum}`,
              description: `Lit ${bedNum} de la chambre ${roomNumber}`,
              status: bedStatus,
              createdBy: user.id
            })
          );

          totalBeds++;
        }
      }
    }

    console.log(`   ✅ ${tenant.name}: 2 cités créées`);
  }

  console.log('');
  console.log('✅ Seeds de logement terminé avec succès !');
  console.log('');
  console.log('📊 Résumé des données créées:');
  console.log(`   🏢 Cités universitaires: ${totalComplexes}`);
  console.log(`   🚪 Chambres: ${totalRooms}`);
  console.log(`   🛏️  Lits: ${totalBeds}`);
  console.log('');
};

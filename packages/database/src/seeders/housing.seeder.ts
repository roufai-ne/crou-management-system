/**
 * FICHIER: packages/database/src/seeders/housing.seeder.ts
 * SEEDER: Données de test pour le module Logement
 *
 * DESCRIPTION:
 * Génère des données complètes pour le module Housing
 * - Cités universitaires (complexes)
 * - Bâtiments
 * - Chambres
 * - Lits (bed-centered)
 * - Étudiants
 * - Demandes de logement
 * - Occupations
 *
 * USAGE:
 * npm run seed:housing
 *
 * AUTEUR: Équipe CROU
 * DATE: Janvier 2025
 */

import { AppDataSource } from '../config/datasource';
import { Tenant } from '../entities/Tenant.entity';
import { Student } from '../entities/Student.entity';
import { HousingRequest } from '../entities/HousingRequest.entity';
import { HousingOccupancy } from '../entities/HousingOccupancy.entity';
import { Bed, BedStatus } from '../entities/Bed.entity';

interface SeedComplexData {
  nom: string;
  adresse: string;
  ville: string;
  nombreBatiments: number;
  chambresParBatiment: number;
  litsParChambre: number;
}

const COMPLEXES: SeedComplexData[] = [
  {
    nom: 'Cité Universitaire Aéroport',
    adresse: 'Route de l\'Aéroport',
    ville: 'Niamey',
    nombreBatiments: 5,
    chambresParBatiment: 40,
    litsParChambre: 2
  },
  {
    nom: 'Cité Universitaire Yantala',
    adresse: 'Quartier Yantala',
    ville: 'Niamey',
    nombreBatiments: 4,
    chambresParBatiment: 30,
    litsParChambre: 3
  },
  {
    nom: 'Cité Universitaire Kennedy',
    adresse: 'Boulevard Kennedy',
    ville: 'Niamey',
    nombreBatiments: 3,
    chambresParBatiment: 50,
    litsParChambre: 2
  },
  {
    nom: 'Cité Universitaire Terminus',
    adresse: 'Quartier Terminus',
    ville: 'Niamey',
    nombreBatiments: 6,
    chambresParBatiment: 35,
    litsParChambre: 4
  }
];

const PRENOMS_MASCULINS = [
  'Abdoulaye', 'Moussa', 'Ibrahim', 'Amadou', 'Ousmane', 'Mamadou', 'Ali', 'Issoufou',
  'Mahamadou', 'Hamidou', 'Seydou', 'Boureima', 'Yacouba', 'Hassane', 'Omar'
];

const PRENOMS_FEMININS = [
  'Aïcha', 'Fatima', 'Aminata', 'Mariama', 'Rahila', 'Hawa', 'Fatoumata', 'Zeinabou',
  'Hadiza', 'Balkissa', 'Salamatou', 'Ramatou', 'Djeneba', 'Assiatou', 'Maimouna'
];

const NOMS = [
  'Diallo', 'Soumaila', 'Maiga', 'Touré', 'Traoré', 'Koné', 'Sangaré', 'Cissé',
  'Sidibé', 'Keita', 'Ouattara', 'Coulibaly', 'Kaboré', 'Zoungrana', 'Sawadogo'
];

const UNIVERSITES = [
  'Université Abdou Moumouni',
  'Université de Tillabéri',
  'Université de Maradi',
  'Université de Zinder'
];

const FACULTES = [
  'Faculté des Sciences',
  'Faculté des Lettres et Sciences Humaines',
  'Faculté de Droit et Sciences Économiques',
  'Faculté de Médecine',
  'École Normale Supérieure',
  'Institut Universitaire de Technologie'
];

const FILIERES = [
  'Informatique', 'Mathématiques', 'Physique', 'Chimie', 'Biologie',
  'Géographie', 'Histoire', 'Sociologie', 'Philosophie',
  'Droit', 'Économie', 'Gestion', 'Commerce',
  'Médecine', 'Pharmacie', 'Sciences Infirmières',
  'Génie Civil', 'Génie Électrique', 'Génie Informatique'
];

const NIVEAUX = ['L1', 'L2', 'L3', 'M1', 'M2'] as const;

/**
 * Génère un nom d'étudiant aléatoire
 */
function genererNomEtudiant(): { prenom: string; nom: string; genre: 'M' | 'F' } {
  const genre = Math.random() > 0.4 ? 'M' : 'F'; // 60% hommes, 40% femmes
  const prenom = genre === 'M'
    ? PRENOMS_MASCULINS[Math.floor(Math.random() * PRENOMS_MASCULINS.length)]
    : PRENOMS_FEMININS[Math.floor(Math.random() * PRENOMS_FEMININS.length)];
  const nom = NOMS[Math.floor(Math.random() * NOMS.length)];

  return { prenom, nom, genre };
}

/**
 * Génère un numéro de téléphone nigérien
 */
function genererTelephone(): string {
  const prefixes = ['90', '91', '92', '93', '94', '95', '96', '97', '98', '99'];
  const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
  const numero = Math.floor(10000000 + Math.random() * 90000000).toString().substring(0, 6);
  return `+227 ${prefix} ${numero.substring(0, 2)} ${numero.substring(2, 4)} ${numero.substring(4)}`;
}

/**
 * Génère une date de naissance (18-30 ans)
 */
function genererDateNaissance(): Date {
  const annee = new Date().getFullYear() - (18 + Math.floor(Math.random() * 12));
  const mois = Math.floor(Math.random() * 12);
  const jour = Math.floor(Math.random() * 28) + 1;
  return new Date(annee, mois, jour);
}

/**
 * Seed principal
 */
export async function seedHousing() {
  console.log('🌱 Démarrage du seed Housing...\n');

  try {
    await AppDataSource.initialize();
    console.log('✅ Connexion à la base de données établie\n');

    // Récupérer le tenant par défaut
    const tenantRepo = AppDataSource.getRepository(Tenant);
    const tenant = await tenantRepo.findOne({ where: { code: 'CROU_NIAMEY' } });

    if (!tenant) {
      console.error('❌ Tenant CROU Niamey non trouvé');
      return;
    }

    console.log(`📍 Tenant: ${tenant.nom}\n`);

    // Repositories
    const studentRepo = AppDataSource.getRepository(Student);
    const bedRepo = AppDataSource.getRepository(Bed);
    const requestRepo = AppDataSource.getRepository(HousingRequest);
    const occupancyRepo = AppDataSource.getRepository(HousingOccupancy);

    // Variables de comptage
    let totalEtudiants = 0;
    let totalLits = 0;
    let totalDemandes = 0;
    let totalOccupations = 0;

    // ========================================
    // 1. CRÉER DES ÉTUDIANTS
    // ========================================
    console.log('👨‍🎓 Création des étudiants...');

    const etudiants: any[] = [];
    const nombreEtudiants = 500;

    for (let i = 0; i < nombreEtudiants; i++) {
      const { prenom, nom, genre } = genererNomEtudiant();
      const matricule = `ETU${new Date().getFullYear()}${String(i + 1).padStart(5, '0')}`;
      const email = `${prenom.toLowerCase()}.${nom.toLowerCase()}${i}@etudiant.ne`;

      // Utiliser une requête SQL directe pour éviter les problèmes de colonnes manquantes
      const result = await AppDataSource.query(`
        INSERT INTO students (
          id, tenant_id, matricule, nom, prenom, email, telephone, "dateNaissance",
          genre, universite, faculte, filiere, niveau, "anneeUniversitaire",
          status, "isBoursier", "isHandicape", "isActif", "createdBy", "createdAt", "updatedAt"
        )
        VALUES (
          uuid_generate_v4(), $1, $2, $3, $4, $5, $6, $7,
          $8, $9, $10, $11, $12, $13,
          $14, $15, $16, $17, $18, NOW(), NOW()
        )
        RETURNING id
      `, [
        tenant.id,
        matricule,
        nom,
        prenom,
        email,
        genererTelephone(),
        genererDateNaissance(),
        genre,
        UNIVERSITES[Math.floor(Math.random() * UNIVERSITES.length)],
        FACULTES[Math.floor(Math.random() * FACULTES.length)],
        FILIERES[Math.floor(Math.random() * FILIERES.length)],
        NIVEAUX[Math.floor(Math.random() * NIVEAUX.length)],
        '2024-2025',
        'actif',
        Math.random() > 0.7, // 30% boursiers
        Math.random() > 0.95, // 5% handicapés
        true,
        'seeder'
      ]);

      etudiants.push({ id: result[0].id, nom, prenom, email });
    }

    totalEtudiants = etudiants.length;
    console.log(`✅ ${totalEtudiants} étudiants créés\n`);

    // ========================================
    // 2. CRÉER DES LITS (à partir des chambres existantes)
    // ========================================
    console.log('🛏️  Génération des lits pour les chambres existantes...');

    // Récupérer toutes les chambres
    const rooms = await AppDataSource.query(`
      SELECT id, numero, capacite FROM rooms WHERE tenant_id = $1 ORDER BY numero
    `, [tenant.id]);

    if (rooms.length === 0) {
      console.log('⚠️  Aucune chambre trouvée. Création de chambres de test...');

      // Créer quelques chambres de test si aucune n'existe
      for (let i = 1; i <= 50; i++) {
        const numero = `${100 + i}`;
        const capacite = [2, 3, 4][Math.floor(Math.random() * 3)];

        await AppDataSource.query(`
          INSERT INTO rooms (id, tenant_id, numero, capacite, status, "createdBy", "createdAt", "updatedAt")
          VALUES (uuid_generate_v4(), $1, $2, $3, 'disponible', 'seeder', NOW(), NOW())
        `, [tenant.id, numero, capacite]);
      }

      // Re-récupérer les chambres
      const newRooms = await AppDataSource.query(`
        SELECT id, numero, capacite FROM rooms WHERE tenant_id = $1 ORDER BY numero
      `, [tenant.id]);

      console.log(`✅ ${newRooms.length} chambres de test créées\n`);
    }

    // Générer les lits pour chaque chambre
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const allBeds: Bed[] = [];

    for (const room of rooms) {
      for (let i = 0; i < room.capacite; i++) {
        const bedNumber = i < 26 ? letters[i] : `${i + 1}`;

        const bed = bedRepo.create({
          roomId: room.id,
          number: bedNumber,
          description: `Lit ${bedNumber} - Chambre ${room.numero}`,
          status: BedStatus.AVAILABLE,
          isActive: true,
          createdBy: 'seeder'
        });

        allBeds.push(bed);
      }
    }

    await bedRepo.save(allBeds);
    totalLits = allBeds.length;
    console.log(`✅ ${totalLits} lits générés pour ${rooms.length} chambres\n`);

    // ========================================
    // 3. CRÉER DES DEMANDES DE LOGEMENT
    // ========================================
    console.log('📝 Création des demandes de logement...');

    // Récupérer les étudiants créés avec leurs propriétés
    const etudiantsComplets = await AppDataSource.query(`
      SELECT id, "isBoursier", "isHandicape" FROM students WHERE tenant_id = $1 LIMIT 400
    `, [tenant.id]);

    const demandes: any[] = [];
    const nombreDemandes = Math.min(etudiantsComplets.length, 400);

    for (let i = 0; i < nombreDemandes; i++) {
      const etudiant = etudiantsComplets[i];
      const dateSubmission = new Date();
      dateSubmission.setDate(dateSubmission.getDate() - Math.floor(Math.random() * 60));

      // 70% approuvées, 20% en cours, 10% rejetées
      const rand = Math.random();
      let status: any;
      let dateTraitement: Date | null = null;

      if (rand < 0.7) {
        status = 'approved';
        dateTraitement = new Date(dateSubmission);
        dateTraitement.setDate(dateTraitement.getDate() + Math.floor(Math.random() * 10));
      } else if (rand < 0.9) {
        status = 'under_review';
      } else {
        status = 'rejected';
        dateTraitement = new Date(dateSubmission);
        dateTraitement.setDate(dateTraitement.getDate() + Math.floor(Math.random() * 5));
      }

      const priority = etudiant.isBoursier ? 'boursier' : (etudiant.isHandicape ? 'handicape' : 'normal');
      const priorityScore = etudiant.isBoursier ? 100 : (etudiant.isHandicape ? 150 : 50);

      const result = await AppDataSource.query(`
        INSERT INTO housing_requests (
          id, tenant_id, student_id, "anneeUniversitaire", type, "typeChambresPreferees",
          "motifDemande", "isUrgent", status, priority, "priorityScore",
          "dateSubmission", "dateTraitement", "certificatScolariteFourni",
          "pieceIdentiteFournie", "photoFournie", "createdBy", "createdAt", "updatedAt"
        )
        VALUES (
          uuid_generate_v4(), $1, $2, $3, $4, $5,
          $6, $7, $8, $9, $10,
          $11, $12, $13,
          $14, $15, $16, NOW(), NOW()
        )
        RETURNING id, status
      `, [
        tenant.id,
        etudiant.id,
        '2024-2025',
        'nouvelle',
        Math.random() > 0.5 ? 'Chambre double' : 'Chambre triple',
        'Demande de logement pour l\'année universitaire 2024-2025',
        Math.random() > 0.9,
        status,
        priority,
        priorityScore,
        dateSubmission,
        dateTraitement,
        true,
        true,
        true,
        etudiant.id
      ]);

      demandes.push({ id: result[0].id, studentId: etudiant.id, status: result[0].status });
    }

    totalDemandes = demandes.length;
    console.log(`✅ ${totalDemandes} demandes créées\n`);

    // ========================================
    // 4. CRÉER DES OCCUPATIONS (attribuer des lits)
    // ========================================
    console.log('🏠 Création des occupations (attribution de lits)...');

    const demandesApprouvees = demandes.filter(d => d.status === 'approved');
    const litsDisponibles = [...allBeds]; // Copie pour manipulation
    const occupations: HousingOccupancy[] = [];

    // Attribuer des lits à 80% des demandes approuvées
    const nombreOccupations = Math.floor(demandesApprouvees.length * 0.8);

    for (let i = 0; i < nombreOccupations && litsDisponibles.length > 0; i++) {
      const demande = demandesApprouvees[i];
      const lit = litsDisponibles.shift(); // Prendre le premier lit disponible

      if (!lit) break;

      const dateDebut = new Date();
      dateDebut.setMonth(dateDebut.getMonth() - Math.floor(Math.random() * 6));

      const dateFin = new Date(dateDebut);
      dateFin.setMonth(dateFin.getMonth() + 10); // 10 mois d'occupation

      const occupation = occupancyRepo.create({
        tenantId: tenant.id,
        studentId: demande.studentId,
        bedId: lit.id,
        roomId: lit.roomId,
        housingRequestId: demande.id,
        startDate: dateDebut,
        endDate: dateFin,
        status: 'active',
        monthlyRent: [15000, 20000, 25000, 30000][Math.floor(Math.random() * 4)],
        isRentPaid: Math.random() > 0.3, // 70% ont payé
        createdBy: 'seeder'
      });

      occupations.push(occupation);

      // Marquer le lit comme occupé
      lit.status = BedStatus.OCCUPIED;
    }

    await occupancyRepo.save(occupations);
    await bedRepo.save(allBeds); // Mettre à jour les statuts des lits
    totalOccupations = occupations.length;

    console.log(`✅ ${totalOccupations} occupations créées\n`);

    // ========================================
    // 5. MARQUER QUELQUES LITS EN MAINTENANCE
    // ========================================
    console.log('🔧 Mise en maintenance de quelques lits...');

    const litsRestants = allBeds.filter(b => b.status === BedStatus.AVAILABLE);
    const nombreMaintenance = Math.floor(litsRestants.length * 0.05); // 5% en maintenance

    for (let i = 0; i < nombreMaintenance; i++) {
      litsRestants[i].status = BedStatus.MAINTENANCE;
      litsRestants[i].notes = 'En maintenance - Réparation plomberie';
    }

    await bedRepo.save(litsRestants);
    console.log(`✅ ${nombreMaintenance} lits mis en maintenance\n`);

    // ========================================
    // RÉSUMÉ
    // ========================================
    console.log('\n' + '='.repeat(60));
    console.log('✅ SEED HOUSING TERMINÉ AVEC SUCCÈS !');
    console.log('='.repeat(60));
    console.log(`\n📊 STATISTIQUES:\n`);
    console.log(`  👨‍🎓 Étudiants créés:          ${totalEtudiants}`);
    console.log(`  🏢 Chambres:                  ${rooms.length}`);
    console.log(`  🛏️  Lits générés:              ${totalLits}`);
    console.log(`  🟢 Lits disponibles:          ${allBeds.filter(b => b.status === BedStatus.AVAILABLE).length}`);
    console.log(`  🔴 Lits occupés:              ${allBeds.filter(b => b.status === BedStatus.OCCUPIED).length}`);
    console.log(`  🟠 Lits en maintenance:       ${allBeds.filter(b => b.status === BedStatus.MAINTENANCE).length}`);
    console.log(`  📝 Demandes créées:           ${totalDemandes}`);
    console.log(`  ✅ Demandes approuvées:       ${demandesApprouvees.length}`);
    console.log(`  🏠 Occupations actives:       ${totalOccupations}`);
    console.log(`  📊 Taux d'occupation:         ${((totalOccupations / totalLits) * 100).toFixed(1)}%`);
    console.log('\n' + '='.repeat(60) + '\n');

  } catch (error) {
    console.error('\n❌ Erreur lors du seed:', error);
    throw error;
  } finally {
    await AppDataSource.destroy();
  }
}

// Exécuter si appelé directement
seedHousing()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

/**
 * FICHIER: packages/database/src/seeders/stocks.seeder.ts
 * SEEDER: Données de test pour le module Stocks
 *
 * DESCRIPTION:
 * Génère des données complètes pour le module Stocks
 * - Articles de stock (denrées, fournitures, équipements)
 * - Mouvements de stock (entrées/sorties)
 * - Fournisseurs
 *
 * USAGE:
 * npm run seed:stocks
 *
 * AUTEUR: Équipe CROU
 * DATE: Janvier 2025
 */

import { AppDataSource } from '../config/datasource';
import { Tenant } from '../entities/Tenant.entity';
import { User } from '../entities/User.entity';

// Types d'articles par catégorie
const ARTICLES_PAR_CATEGORIE = {
  cereales: [
    { libelle: 'Riz blanc', unit: 'kg', prixUnitaire: 450 },
    { libelle: 'Riz complet', unit: 'kg', prixUnitaire: 500 },
    { libelle: 'Maïs grain', unit: 'kg', prixUnitaire: 350 },
    { libelle: 'Mil', unit: 'kg', prixUnitaire: 400 },
    { libelle: 'Sorgho', unit: 'kg', prixUnitaire: 380 }
  ],
  denrees: [
    { libelle: 'Huile végétale', unit: 'litre', prixUnitaire: 850 },
    { libelle: 'Sucre', unit: 'kg', prixUnitaire: 600 },
    { libelle: 'Sel', unit: 'kg', prixUnitaire: 250 },
    { libelle: 'Tomate concentrée', unit: 'carton', prixUnitaire: 12000 },
    { libelle: 'Pâtes alimentaires', unit: 'kg', prixUnitaire: 550 },
    { libelle: 'Lait en poudre', unit: 'kg', prixUnitaire: 2500 },
    { libelle: 'Haricots secs', unit: 'kg', prixUnitaire: 700 }
  ],
  fournitures: [
    { libelle: 'Assiettes jetables', unit: 'carton', prixUnitaire: 8000 },
    { libelle: 'Gobelets plastique', unit: 'carton', prixUnitaire: 5000 },
    { libelle: 'Cuillères jetables', unit: 'carton', prixUnitaire: 4500 },
    { libelle: 'Sacs poubelle 50L', unit: 'carton', prixUnitaire: 15000 },
    { libelle: 'Papier toilette', unit: 'carton', prixUnitaire: 18000 },
    { libelle: 'Savon liquide', unit: 'litre', prixUnitaire: 3500 }
  ],
  equipements: [
    { libelle: 'Marmite 100L', unit: 'unite', prixUnitaire: 85000 },
    { libelle: 'Louche inox', unit: 'unite', prixUnitaire: 5500 },
    { libelle: 'Couteau de cuisine', unit: 'unite', prixUnitaire: 4000 },
    { libelle: 'Planche à découper', unit: 'unite', prixUnitaire: 6500 },
    { libelle: 'Plateau service', unit: 'unite', prixUnitaire: 3500 }
  ],
  vehicules: [
    { libelle: 'Camion frigorifique 5T', unit: 'unite', prixUnitaire: 15000000 },
    { libelle: 'Camionnette 4x4', unit: 'unite', prixUnitaire: 12000000 }
  ],
  maintenance: [
    { libelle: 'Peinture murale 20L', unit: 'unite', prixUnitaire: 25000 },
    { libelle: 'Ciment gris 50kg', unit: 'sac', prixUnitaire: 8500 },
    { libelle: 'Ampoule LED 15W', unit: 'unite', prixUnitaire: 2500 },
    { libelle: 'Tuyau PVC 50mm', unit: 'unite', prixUnitaire: 1200 }
  ]
};

/**
 * Génère un code article unique
 */
function genererCodeArticle(category: string, index: number): string {
  const prefix = category.substring(0, 3).toUpperCase();
  const timestamp = Date.now().toString().slice(-6);
  return `${prefix}-${timestamp}-${index.toString().padStart(3, '0')}`;
}

/**
 * Génère une quantité aléatoire réaliste selon la catégorie
 */
function genererQuantite(category: string, unit: string): number {
  if (category === 'vehicules') return Math.floor(Math.random() * 3) + 1; // 1-3 véhicules
  if (category === 'equipements') return Math.floor(Math.random() * 20) + 10; // 10-30 équipements
  if (unit === 'carton') return Math.floor(Math.random() * 100) + 50; // 50-150 cartons
  if (unit === 'kg' || unit === 'litre') return Math.floor(Math.random() * 500) + 200; // 200-700 kg/L
  if (unit === 'sac') return Math.floor(Math.random() * 80) + 20; // 20-100 sacs
  return Math.floor(Math.random() * 100) + 30; // 30-130 unités par défaut
}

/**
 * Génère des seuils réalistes
 */
function genererSeuils(quantite: number): { seuilMin: number; seuilMax: number } {
  const seuilMin = Math.floor(quantite * 0.2); // 20% de la quantité
  const seuilMax = Math.floor(quantite * 1.5); // 150% de la quantité
  return { seuilMin, seuilMax };
}

/**
 * Seed principal
 */
export async function seedStocks() {
  try {
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
    }

    console.log('🌱 Démarrage du seed des stocks...\n');

    // Récupérer les tenants CROU
    const tenantRepo = AppDataSource.getRepository(Tenant);
    const crousAll = await tenantRepo.find({
      where: { level: 1 } // Niveau CROU
    });

    if (crousAll.length === 0) {
      console.error('❌ Aucun CROU trouvé. Veuillez d\'abord exécuter le seed des tenants.');
      return;
    }

    // Prendre uniquement le premier CROU (Niamey) pour les données de test
    const crous = [crousAll[0]];
    console.log(`📍 Seed pour ${crous.length} CROU: ${crous[0].nom}\n`);

    // Récupérer un utilisateur admin pour les créations
    const userRepo = AppDataSource.getRepository(User);
    const adminUser = await userRepo.findOne({
      where: { tenantId: crous[0].id },
      order: { createdAt: 'ASC' }
    });

    if (!adminUser) {
      console.error(`❌ Aucun utilisateur trouvé pour le CROU ${crous[0].nom}`);
      return;
    }

    // Créer les articles de stock
    const stockItemRepo = AppDataSource.manager.getRepository('stocks');
    let totalArticles = 0;

    for (const crou of crous) {
      console.log(`\n📦 Création des articles pour ${crou.nom}...`);

      for (const [category, articles] of Object.entries(ARTICLES_PAR_CATEGORIE)) {
        for (let i = 0; i < articles.length; i++) {
          const article = articles[i];
          const quantiteInitiale = genererQuantite(category, article.unit);
          const { seuilMin, seuilMax } = genererSeuils(quantiteInitiale);
          const code = genererCodeArticle(category, i);

          const stockItem = {
            code,
            libelle: article.libelle,
            description: `Article ${article.libelle} - Catégorie ${category}`,
            type: 'centralise',
            category,
            unit: article.unit,
            status: 'actif',
            quantiteActuelle: quantiteInitiale,
            quantiteReservee: 0,
            quantiteDisponible: quantiteInitiale,
            seuilMinimum: seuilMin,
            seuilMaximum: seuilMax,
            prixUnitaire: article.prixUnitaire,
            valeurStock: quantiteInitiale * article.prixUnitaire,
            tenantId: crou.id,
            createdBy: adminUser.id,
            createdAt: new Date(),
            updatedAt: new Date()
          };

          await stockItemRepo.save(stockItem);
          totalArticles++;
        }

        console.log(`  ✅ ${articles.length} articles créés pour la catégorie "${category}"`);
      }
    }

    console.log(`\n✅ Seed terminé avec succès!`);
    console.log(`📊 Résumé:`);
    console.log(`   - Articles créés: ${totalArticles}`);
    console.log(`   - CROUs: ${crous.length}`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur lors du seed:', error);
    process.exit(1);
  }
}

// Exécuter le seed automatiquement
seedStocks();

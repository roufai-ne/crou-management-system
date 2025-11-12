/**
 * FICHIER: apps/api/src/modules/restauration/repas.service.ts
 * SERVICE: Repas - Gestion des distributions de repas
 *
 * DESCRIPTION:
 * Service pour la gestion des distributions réelles de repas
 * Suivi post-service avec statistiques complètes
 * Calcul recettes, fréquentation, gaspillage
 * Support multi-tenant strict
 *
 * AUTEUR: Équipe CROU - Module Restauration
 * DATE: Janvier 2025
 */

import { AppDataSource } from '../../../../../packages/database/src/config/datasource';
import { Repas, RepasStatus } from '../../../../../packages/database/src/entities/Repas.entity';
import { Menu, TypeRepas } from '../../../../../packages/database/src/entities/Menu.entity';
import { Restaurant } from '../../../../../packages/database/src/entities/Restaurant.entity';
import { TicketRepas } from '../../../../../packages/database/src/entities/TicketRepas.entity';
import { Between } from 'typeorm';
import { logger } from '@/shared/utils/logger';

// ========================================
// INTERFACES & TYPES
// ========================================

export interface RepasFilters {
  dateDebut?: Date;
  dateFin?: Date;
  typeRepas?: TypeRepas;
  status?: RepasStatus;
  restaurantId?: string;
}

export interface CreateRepasDTO {
  restaurantId: string;
  menuId: string;
  dateService: Date;
  typeRepas: TypeRepas;
  heureDebut?: string;
  heureFin?: string;
  nombrePrevus: number;
}

export interface TerminerServiceDTO {
  nombreServis: number;
  nombreTicketsUnitaires: number;
  nombreTicketsForfaits: number;
  nombreTicketsGratuits: number;
  recettesUnitaires: number;
  recettesForfaits: number;
  montantSubventions: number;
  quantiteGaspillee?: number;
  raisonGaspillage?: string;
  observations?: string;
  incidents?: Array<{
    type: string;
    description: string;
    heure: string;
    gravite: 'faible' | 'moyenne' | 'elevee';
  }>;
}

// ========================================
// SERVICE
// ========================================

export class RepasService {
  /**
   * Récupérer tous les repas avec filtres
   */
  static async getRepas(tenantId: string, filters?: RepasFilters) {
    try {
      logger.info('[RepasService.getRepas] Début - tenantId:', tenantId);

      if (!AppDataSource.isInitialized) {
        throw new Error('AppDataSource non initialisé');
      }

      const repasRepo = AppDataSource.getRepository(Repas);
      const queryBuilder = repasRepo.createQueryBuilder('repas')
        .leftJoinAndSelect('repas.restaurant', 'restaurant')
        .leftJoinAndSelect('repas.menu', 'menu')
        .where('repas.tenantId = :tenantId', { tenantId });

      // Filtre par date
      if (filters?.dateDebut && filters?.dateFin) {
        queryBuilder.andWhere(
          'repas.dateService BETWEEN :dateDebut AND :dateFin',
          { dateDebut: filters.dateDebut, dateFin: filters.dateFin }
        );
      } else if (filters?.dateDebut) {
        queryBuilder.andWhere('repas.dateService >= :dateDebut', { dateDebut: filters.dateDebut });
      } else if (filters?.dateFin) {
        queryBuilder.andWhere('repas.dateService <= :dateFin', { dateFin: filters.dateFin });
      }

      // Filtre par type de repas
      if (filters?.typeRepas) {
        queryBuilder.andWhere('repas.typeRepas = :typeRepas', { typeRepas: filters.typeRepas });
      }

      // Filtre par statut
      if (filters?.status) {
        queryBuilder.andWhere('repas.status = :status', { status: filters.status });
      }

      // Filtre par restaurant
      if (filters?.restaurantId) {
        queryBuilder.andWhere('repas.restaurantId = :restaurantId', { restaurantId: filters.restaurantId });
      }

      const repas = await queryBuilder
        .orderBy('repas.dateService', 'DESC')
        .addOrderBy('repas.typeRepas', 'ASC')
        .getMany();

      logger.info('[RepasService.getRepas] Repas trouvés:', repas.length);

      // Calcul statistiques globales
      const result = {
        repas,
        total: repas.length,
        termines: repas.filter(r => r.status === RepasStatus.TERMINE).length,
        enCours: repas.filter(r => r.status === RepasStatus.EN_COURS).length,
        totalServis: repas.reduce((sum, r) => sum + r.nombreServis, 0),
        recettesTotales: repas.reduce((sum, r) => sum + Number(r.recettesTotales || 0), 0),
        tauxFrequentationMoyen: this.calculateTauxFrequentationMoyen(repas)
      };

      return result;
    } catch (error) {
      logger.error('[RepasService.getRepas] ERREUR:', error);
      throw error;
    }
  }

  /**
   * Récupérer un repas par ID
   */
  static async getRepasById(repasId: string, tenantId: string) {
    try {
      logger.info('[RepasService.getRepasById] Récupération repas:', repasId);

      const repasRepo = AppDataSource.getRepository(Repas);
      const repas = await repasRepo.findOne({
        where: { id: repasId, tenantId },
        relations: ['restaurant', 'menu', 'tickets']
      });

      if (!repas) {
        throw new Error('Repas non trouvé');
      }

      return repas;
    } catch (error) {
      logger.error('[RepasService.getRepasById] ERREUR:', error);
      throw error;
    }
  }

  /**
   * Créer une distribution de repas (planification)
   */
  static async createRepas(
    tenantId: string,
    userId: string,
    data: CreateRepasDTO
  ) {
    try {
      logger.info('[RepasService.createRepas] Création repas');

      const repasRepo = AppDataSource.getRepository(Repas);
      const restaurantRepo = AppDataSource.getRepository(Restaurant);
      const menuRepo = AppDataSource.getRepository(Menu);

      // Vérifier restaurant
      const restaurant = await restaurantRepo.findOne({
        where: { id: data.restaurantId, tenantId }
      });

      if (!restaurant) {
        throw new Error('Restaurant non trouvé');
      }

      // Vérifier menu
      const menu = await menuRepo.findOne({
        where: { id: data.menuId, tenantId }
      });

      if (!menu) {
        throw new Error('Menu non trouvé');
      }

      // Créer le repas
      const newRepas = repasRepo.create({
        ...data,
        tenantId,
        nombreServis: 0,
        nombreTicketsUnitaires: 0,
        nombreTicketsForfaits: 0,
        nombreTicketsGratuits: 0,
        recettesTotales: 0,
        recettesUnitaires: 0,
        recettesForfaits: 0,
        montantSubventions: 0,
        coutMatieresPremières: Number(menu.coutMatierePremiere || 0),
        status: RepasStatus.PLANIFIE,
        stockDeduit: false,
        createdBy: userId
      });

      const savedRepas = await repasRepo.save(newRepas);

      logger.info('[RepasService.createRepas] Repas créé:', savedRepas.id);

      return savedRepas;
    } catch (error) {
      logger.error('[RepasService.createRepas] ERREUR:', error);
      throw error;
    }
  }

  /**
   * Démarrer un service de repas
   */
  static async demarrerService(
    repasId: string,
    tenantId: string,
    userId: string
  ) {
    try {
      logger.info('[RepasService.demarrerService] Démarrage service repas:', repasId);

      const repasRepo = AppDataSource.getRepository(Repas);

      const repas = await repasRepo.findOne({
        where: { id: repasId, tenantId }
      });

      if (!repas) {
        throw new Error('Repas non trouvé');
      }

      if (repas.status !== RepasStatus.PLANIFIE) {
        throw new Error('Seuls les repas planifiés peuvent être démarrés');
      }

      repas.status = RepasStatus.EN_COURS;
      repas.heureDebut = new Date().toISOString().split('T')[1].substring(0, 5); // HH:mm
      repas.updatedBy = userId;
      repas.updatedAt = new Date();

      await repasRepo.save(repas);

      logger.info('[RepasService.demarrerService] Service démarré');

      return repas;
    } catch (error) {
      logger.error('[RepasService.demarrerService] ERREUR:', error);
      throw error;
    }
  }

  /**
   * Terminer un service et enregistrer les statistiques
   */
  static async terminerService(
    repasId: string,
    tenantId: string,
    userId: string,
    stats: TerminerServiceDTO
  ) {
    try {
      logger.info('[RepasService.terminerService] Fin service repas:', repasId);

      const repasRepo = AppDataSource.getRepository(Repas);

      const repas = await repasRepo.findOne({
        where: { id: repasId, tenantId }
      });

      if (!repas) {
        throw new Error('Repas non trouvé');
      }

      if (repas.status !== RepasStatus.EN_COURS) {
        throw new Error('Seuls les repas en cours peuvent être terminés');
      }

      // Enregistrer les statistiques
      repas.nombreServis = stats.nombreServis;
      repas.nombreTicketsUnitaires = stats.nombreTicketsUnitaires;
      repas.nombreTicketsForfaits = stats.nombreTicketsForfaits;
      repas.nombreTicketsGratuits = stats.nombreTicketsGratuits;
      repas.recettesUnitaires = stats.recettesUnitaires;
      repas.recettesForfaits = stats.recettesForfaits;
      repas.montantSubventions = stats.montantSubventions;

      // Calculer recettes totales
      repas.recettesTotales = stats.recettesUnitaires + stats.recettesForfaits;

      // Calculer marge brute
      repas.margeBrute = repas.recettesTotales - repas.coutMatieresPremières;

      // Calculer taux de fréquentation
      if (repas.nombrePrevus > 0) {
        repas.tauxFrequentation = ((repas.nombreServis / repas.nombrePrevus) * 100);
      }

      // Gaspillage
      if (stats.quantiteGaspillee) {
        repas.quantiteGaspillee = stats.quantiteGaspillee;
        repas.raisonGaspillage = stats.raisonGaspillage;
        // Calculer valeur gaspillage (approximation)
        repas.valeurGaspillage = (repas.coutMatieresPremières / repas.nombrePrevus) * stats.quantiteGaspillee;
      }

      // Observations et incidents
      repas.observations = stats.observations;
      repas.incidents = stats.incidents;

      // Finaliser
      repas.status = RepasStatus.TERMINE;
      repas.heureFin = new Date().toISOString().split('T')[1].substring(0, 5);
      repas.updatedBy = userId;
      repas.updatedAt = new Date();

      await repasRepo.save(repas);

      logger.info('[RepasService.terminerService] Service terminé');

      return repas;
    } catch (error) {
      logger.error('[RepasService.terminerService] ERREUR:', error);
      throw error;
    }
  }

  /**
   * Calculer les statistiques d'un repas
   */
  static async calculerStatistiques(repasId: string, tenantId: string) {
    try {
      logger.info('[RepasService.calculerStatistiques] Calcul statistiques repas:', repasId);

      const repasRepo = AppDataSource.getRepository(Repas);
      const ticketRepo = AppDataSource.getRepository(TicketRepas);

      const repas = await repasRepo.findOne({
        where: { id: repasId, tenantId },
        relations: ['restaurant', 'menu']
      });

      if (!repas) {
        throw new Error('Repas non trouvé');
      }

      // Compter les tickets utilisés
      const ticketsUtilises = await ticketRepo.find({
        where: { repasId, tenantId }
      });

      const statistiques = {
        repasId: repas.id,
        dateService: repas.dateService,
        typeRepas: repas.typeRepas,
        restaurant: repas.restaurant.nom,

        // Fréquentation
        nombrePrevus: repas.nombrePrevus,
        nombreServis: repas.nombreServis,
        tauxFrequentation: repas.tauxFrequentation,

        // Tickets
        totalTickets: ticketsUtilises.length,
        ticketsUnitaires: repas.nombreTicketsUnitaires,
        ticketsForfaits: repas.nombreTicketsForfaits,
        ticketsGratuits: repas.nombreTicketsGratuits,

        // Finances
        recettesTotales: repas.recettesTotales,
        coutMatieresPremières: repas.coutMatieresPremières,
        margeBrute: repas.margeBrute,
        margePercent: repas.recettesTotales > 0
          ? ((repas.margeBrute / repas.recettesTotales) * 100).toFixed(2)
          : '0',

        // Gaspillage
        quantiteGaspillee: repas.quantiteGaspillee,
        valeurGaspillage: repas.valeurGaspillage,
        tauxGaspillage: repas.nombrePrevus > 0
          ? ((repas.quantiteGaspillee || 0) / repas.nombrePrevus * 100).toFixed(2)
          : '0'
      };

      return statistiques;
    } catch (error) {
      logger.error('[RepasService.calculerStatistiques] ERREUR:', error);
      throw error;
    }
  }

  /**
   * Calculer le taux de fréquentation moyen
   */
  private static calculateTauxFrequentationMoyen(repas: Repas[]): number {
    const repasTermines = repas.filter(r => r.status === RepasStatus.TERMINE && r.tauxFrequentation);

    if (repasTermines.length === 0) return 0;

    const sum = repasTermines.reduce((acc, r) => acc + Number(r.tauxFrequentation || 0), 0);
    return Number((sum / repasTermines.length).toFixed(2));
  }

  /**
   * Obtenir les repas d'un restaurant pour une période
   */
  static async getRepasByRestaurantAndPeriode(
    restaurantId: string,
    tenantId: string,
    dateDebut: Date,
    dateFin: Date
  ) {
    try {
      logger.info('[RepasService.getRepasByRestaurantAndPeriode] Restaurant:', restaurantId);

      const repasRepo = AppDataSource.getRepository(Repas);

      const repas = await repasRepo.find({
        where: {
          restaurantId,
          tenantId,
          dateService: Between(dateDebut, dateFin)
        },
        relations: ['menu'],
        order: { dateService: 'ASC', typeRepas: 'ASC' }
      });

      return {
        repas,
        total: repas.length,
        totalServis: repas.reduce((sum, r) => sum + r.nombreServis, 0),
        recettesTotales: repas.reduce((sum, r) => sum + Number(r.recettesTotales || 0), 0)
      };
    } catch (error) {
      logger.error('[RepasService.getRepasByRestaurantAndPeriode] ERREUR:', error);
      throw error;
    }
  }

  /**
   * Annuler un repas
   */
  static async annulerRepas(
    repasId: string,
    tenantId: string,
    userId: string,
    motif: string
  ) {
    try {
      logger.info('[RepasService.annulerRepas] Annulation repas:', repasId);

      const repasRepo = AppDataSource.getRepository(Repas);

      const repas = await repasRepo.findOne({
        where: { id: repasId, tenantId }
      });

      if (!repas) {
        throw new Error('Repas non trouvé');
      }

      if (repas.status === RepasStatus.TERMINE) {
        throw new Error('Impossible d\'annuler un repas terminé');
      }

      repas.status = RepasStatus.ANNULE;
      repas.observations = `${repas.observations || ''}\nAnnulé: ${motif}`.trim();
      repas.updatedBy = userId;
      repas.updatedAt = new Date();

      await repasRepo.save(repas);

      logger.info('[RepasService.annulerRepas] Repas annulé');

      return repas;
    } catch (error) {
      logger.error('[RepasService.annulerRepas] ERREUR:', error);
      throw error;
    }
  }
}

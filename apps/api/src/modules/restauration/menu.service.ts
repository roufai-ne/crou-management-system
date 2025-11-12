/**
 * FICHIER: apps/api/src/modules/restauration/menu.service.ts
 * SERVICE: Menu - Gestion des menus de restauration
 *
 * DESCRIPTION:
 * Service pour la gestion CRUD des menus journaliers
 * Planification des menus avec composition détaillée
 * Calcul automatique des besoins en denrées
 * Support multi-tenant strict
 *
 * AUTEUR: Équipe CROU - Module Restauration
 * DATE: Janvier 2025
 */

import { AppDataSource } from '../../../../../packages/database/src/config/datasource';
import { Menu, TypeRepas, MenuStatus, PlatMenu, IngredientMenu } from '../../../../../packages/database/src/entities/Menu.entity';
import { Restaurant } from '../../../../../packages/database/src/entities/Restaurant.entity';
import { Stock } from '../../../../../packages/database/src/entities/Stock.entity';
import { Between } from 'typeorm';
import { logger } from '@/shared/utils/logger';

// ========================================
// INTERFACES & TYPES
// ========================================

export interface MenuFilters {
  search?: string;
  dateDebut?: Date;
  dateFin?: Date;
  typeRepas?: TypeRepas;
  status?: MenuStatus;
  restaurantId?: string;
}

export interface CreateMenuDTO {
  restaurantId: string;
  nom: string;
  description?: string;
  dateService: Date;
  typeRepas: TypeRepas;
  plats: PlatMenu[];
  nombreRationnairesPrevu: number;
  prixVente?: number;
  notes?: string;
  allergenesPresents?: string[];
}

export interface UpdateMenuDTO {
  nom?: string;
  description?: string;
  dateService?: Date;
  typeRepas?: TypeRepas;
  plats?: PlatMenu[];
  nombreRationnairesPrevu?: number;
  prixVente?: number;
  status?: MenuStatus;
  notes?: string;
  allergenesPresents?: string[];
}

export interface BesoinDenree {
  stockId: string;
  nomDenree: string;
  quantiteTotale: number;
  unite: string;
  stockDisponible?: number;
  suffisant?: boolean;
}

// ========================================
// SERVICE
// ========================================

export class MenuService {
  /**
   * Récupérer tous les menus avec filtres
   */
  static async getMenus(tenantId: string, filters?: MenuFilters) {
    try {
      logger.info('[MenuService.getMenus] Début - tenantId:', tenantId);

      if (!AppDataSource.isInitialized) {
        throw new Error('AppDataSource non initialisé');
      }

      const menuRepo = AppDataSource.getRepository(Menu);
      const queryBuilder = menuRepo.createQueryBuilder('menu')
        .leftJoinAndSelect('menu.restaurant', 'restaurant')
        .where('menu.tenantId = :tenantId', { tenantId });

      // Recherche textuelle
      if (filters?.search) {
        queryBuilder.andWhere(
          '(menu.nom ILIKE :search OR menu.description ILIKE :search)',
          { search: `%${filters.search}%` }
        );
      }

      // Filtre par date
      if (filters?.dateDebut && filters?.dateFin) {
        queryBuilder.andWhere(
          'menu.dateService BETWEEN :dateDebut AND :dateFin',
          { dateDebut: filters.dateDebut, dateFin: filters.dateFin }
        );
      } else if (filters?.dateDebut) {
        queryBuilder.andWhere('menu.dateService >= :dateDebut', { dateDebut: filters.dateDebut });
      } else if (filters?.dateFin) {
        queryBuilder.andWhere('menu.dateService <= :dateFin', { dateFin: filters.dateFin });
      }

      // Filtre par type de repas
      if (filters?.typeRepas) {
        queryBuilder.andWhere('menu.typeRepas = :typeRepas', { typeRepas: filters.typeRepas });
      }

      // Filtre par statut
      if (filters?.status) {
        queryBuilder.andWhere('menu.status = :status', { status: filters.status });
      }

      // Filtre par restaurant
      if (filters?.restaurantId) {
        queryBuilder.andWhere('menu.restaurantId = :restaurantId', { restaurantId: filters.restaurantId });
      }

      const menus = await queryBuilder
        .orderBy('menu.dateService', 'DESC')
        .addOrderBy('menu.typeRepas', 'ASC')
        .getMany();

      logger.info('[MenuService.getMenus] Menus trouvés:', menus.length);

      // Calcul statistiques
      const result = {
        menus,
        total: menus.length,
        publies: menus.filter(m => m.status === MenuStatus.PUBLIE).length,
        valides: menus.filter(m => m.status === MenuStatus.VALIDE).length,
        brouillons: menus.filter(m => m.status === MenuStatus.BROUILLON).length,
        coutTotalMatierePremiere: menus.reduce((sum, m) => sum + Number(m.coutMatierePremiere || 0), 0)
      };

      return result;
    } catch (error) {
      logger.error('[MenuService.getMenus] ERREUR:', error);
      throw error;
    }
  }

  /**
   * Récupérer un menu par ID
   */
  static async getMenuById(menuId: string, tenantId: string) {
    try {
      logger.info('[MenuService.getMenuById] Récupération menu:', menuId);

      const menuRepo = AppDataSource.getRepository(Menu);
      const menu = await menuRepo.findOne({
        where: { id: menuId, tenantId },
        relations: ['restaurant']
      });

      if (!menu) {
        throw new Error('Menu non trouvé');
      }

      return menu;
    } catch (error) {
      logger.error('[MenuService.getMenuById] ERREUR:', error);
      throw error;
    }
  }

  /**
   * Créer un nouveau menu
   */
  static async createMenu(
    tenantId: string,
    userId: string,
    data: CreateMenuDTO
  ) {
    try {
      logger.info('[MenuService.createMenu] Création menu:', data.nom);

      const menuRepo = AppDataSource.getRepository(Menu);
      const restaurantRepo = AppDataSource.getRepository(Restaurant);

      // Vérifier que le restaurant existe et appartient au tenant
      const restaurant = await restaurantRepo.findOne({
        where: { id: data.restaurantId, tenantId }
      });

      if (!restaurant) {
        throw new Error('Restaurant non trouvé ou accès refusé');
      }

      // Calculer le coût des matières premières
      const coutMatierePremiere = data.plats.reduce((total, plat) => {
        const coutPlat = plat.ingredients.reduce((sum, ing) => {
          return sum + (Number(ing.coutUnitaire || 0) * Number(ing.quantiteUnitaire || 0));
        }, 0);
        return total + coutPlat;
      }, 0);

      // Calculer le coût unitaire par rationnaire
      const coutUnitaire = data.nombreRationnairesPrevu > 0
        ? coutMatierePremiere / data.nombreRationnairesPrevu
        : 0;

      // Créer le menu
      const newMenu = menuRepo.create({
        ...data,
        tenantId,
        createdBy: userId,
        status: MenuStatus.BROUILLON,
        isActif: true,
        stockDeduit: false,
        coutMatierePremiere,
        coutUnitaire,
        nombreReservations: 0
      });

      const savedMenu = await menuRepo.save(newMenu);

      logger.info('[MenuService.createMenu] Menu créé:', savedMenu.id);

      // Calculer automatiquement les besoins en denrées
      const besoins = await this.calculateBesoins(savedMenu.id, tenantId, data.nombreRationnairesPrevu);

      // Mettre à jour le menu avec les besoins
      savedMenu.besoinsDenrees = besoins;
      await menuRepo.save(savedMenu);

      return savedMenu;
    } catch (error) {
      logger.error('[MenuService.createMenu] ERREUR:', error);
      throw error;
    }
  }

  /**
   * Mettre à jour un menu
   */
  static async updateMenu(
    menuId: string,
    tenantId: string,
    userId: string,
    data: UpdateMenuDTO
  ) {
    try {
      logger.info('[MenuService.updateMenu] Mise à jour menu:', menuId);

      const menuRepo = AppDataSource.getRepository(Menu);

      // Vérifier l'existence et l'appartenance au tenant
      const menu = await menuRepo.findOne({
        where: { id: menuId, tenantId }
      });

      if (!menu) {
        throw new Error('Menu non trouvé');
      }

      // Vérifier que le menu n'est pas validé (modification interdite)
      if (menu.status === MenuStatus.VALIDE && data.status !== MenuStatus.ARCHIVE) {
        throw new Error('Impossible de modifier un menu validé');
      }

      // Appliquer les modifications
      Object.assign(menu, data);
      menu.updatedBy = userId;
      menu.updatedAt = new Date();

      // Recalculer coûts si les plats ont changé
      if (data.plats) {
        const coutMatierePremiere = data.plats.reduce((total, plat) => {
          const coutPlat = plat.ingredients.reduce((sum, ing) => {
            return sum + (Number(ing.coutUnitaire || 0) * Number(ing.quantiteUnitaire || 0));
          }, 0);
          return total + coutPlat;
        }, 0);

        menu.coutMatierePremiere = coutMatierePremiere;
        menu.coutUnitaire = menu.nombreRationnairesPrevu > 0
          ? coutMatierePremiere / menu.nombreRationnairesPrevu
          : 0;

        // Recalculer besoins
        const besoins = await this.calculateBesoins(menuId, tenantId, menu.nombreRationnairesPrevu);
        menu.besoinsDenrees = besoins;
      }

      const updatedMenu = await menuRepo.save(menu);

      logger.info('[MenuService.updateMenu] Menu mis à jour');

      return updatedMenu;
    } catch (error) {
      logger.error('[MenuService.updateMenu] ERREUR:', error);
      throw error;
    }
  }

  /**
   * Publier un menu (rendre visible aux étudiants)
   */
  static async publishMenu(menuId: string, tenantId: string, userId: string) {
    try {
      logger.info('[MenuService.publishMenu] Publication menu:', menuId);

      const menuRepo = AppDataSource.getRepository(Menu);

      const menu = await menuRepo.findOne({
        where: { id: menuId, tenantId }
      });

      if (!menu) {
        throw new Error('Menu non trouvé');
      }

      if (menu.status !== MenuStatus.BROUILLON) {
        throw new Error('Seuls les menus brouillon peuvent être publiés');
      }

      menu.status = MenuStatus.PUBLIE;
      menu.updatedBy = userId;
      menu.updatedAt = new Date();

      await menuRepo.save(menu);

      logger.info('[MenuService.publishMenu] Menu publié');

      return menu;
    } catch (error) {
      logger.error('[MenuService.publishMenu] ERREUR:', error);
      throw error;
    }
  }

  /**
   * Valider un menu (par responsable)
   */
  static async validateMenu(menuId: string, tenantId: string, userId: string) {
    try {
      logger.info('[MenuService.validateMenu] Validation menu:', menuId);

      const menuRepo = AppDataSource.getRepository(Menu);

      const menu = await menuRepo.findOne({
        where: { id: menuId, tenantId }
      });

      if (!menu) {
        throw new Error('Menu non trouvé');
      }

      if (menu.status !== MenuStatus.PUBLIE) {
        throw new Error('Seuls les menus publiés peuvent être validés');
      }

      menu.status = MenuStatus.VALIDE;
      menu.dateValidation = new Date();
      menu.validePar = userId;
      menu.updatedBy = userId;
      menu.updatedAt = new Date();

      await menuRepo.save(menu);

      logger.info('[MenuService.validateMenu] Menu validé');

      return menu;
    } catch (error) {
      logger.error('[MenuService.validateMenu] ERREUR:', error);
      throw error;
    }
  }

  /**
   * Calculer les besoins en denrées pour un menu
   */
  static async calculateBesoins(
    menuId: string,
    tenantId: string,
    nombreRationnaires: number
  ): Promise<BesoinDenree[]> {
    try {
      logger.info('[MenuService.calculateBesoins] Calcul besoins menu:', menuId);

      const menuRepo = AppDataSource.getRepository(Menu);
      const stockRepo = AppDataSource.getRepository(Stock);

      const menu = await menuRepo.findOne({
        where: { id: menuId, tenantId }
      });

      if (!menu) {
        throw new Error('Menu non trouvé');
      }

      const besoins: BesoinDenree[] = [];

      // Parcourir tous les plats et leurs ingrédients
      for (const plat of menu.plats) {
        for (const ingredient of plat.ingredients) {
          // Vérifier si l'ingrédient existe déjà dans les besoins
          const existingBesoin = besoins.find(b => b.stockId === ingredient.stockId);

          if (existingBesoin) {
            // Additionner les quantités
            existingBesoin.quantiteTotale += ingredient.quantiteUnitaire * nombreRationnaires;
          } else {
            // Récupérer le stock pour vérifier disponibilité
            const stock = await stockRepo.findOne({
              where: { id: ingredient.stockId, tenantId }
            });

            const quantiteTotale = ingredient.quantiteUnitaire * nombreRationnaires;

            besoins.push({
              stockId: ingredient.stockId,
              nomDenree: ingredient.nomDenree,
              quantiteTotale,
              unite: ingredient.unite,
              stockDisponible: stock?.quantiteActuelle || 0,
              suffisant: stock ? stock.quantiteActuelle >= quantiteTotale : false
            });
          }
        }
      }

      logger.info('[MenuService.calculateBesoins] Besoins calculés:', besoins.length, 'denrées');

      return besoins;
    } catch (error) {
      logger.error('[MenuService.calculateBesoins] ERREUR:', error);
      throw error;
    }
  }

  /**
   * Supprimer un menu (soft delete)
   */
  static async deleteMenu(menuId: string, tenantId: string, userId: string) {
    try {
      logger.info('[MenuService.deleteMenu] Suppression menu:', menuId);

      const menuRepo = AppDataSource.getRepository(Menu);

      const menu = await menuRepo.findOne({
        where: { id: menuId, tenantId }
      });

      if (!menu) {
        throw new Error('Menu non trouvé');
      }

      // Vérifier que le menu n'est pas validé ou lié à des repas
      if (menu.status === MenuStatus.VALIDE) {
        throw new Error('Impossible de supprimer un menu validé');
      }

      // Soft delete: archiver au lieu de supprimer
      menu.isActif = false;
      menu.status = MenuStatus.ARCHIVE;
      menu.updatedBy = userId;
      menu.updatedAt = new Date();

      await menuRepo.save(menu);

      logger.info('[MenuService.deleteMenu] Menu archivé');

      return { success: true, message: 'Menu archivé avec succès' };
    } catch (error) {
      logger.error('[MenuService.deleteMenu] ERREUR:', error);
      throw error;
    }
  }

  /**
   * Obtenir les menus d'un restaurant pour une date
   */
  static async getMenusByRestaurantAndDate(
    restaurantId: string,
    tenantId: string,
    date: Date
  ) {
    try {
      logger.info('[MenuService.getMenusByRestaurantAndDate] Restaurant:', restaurantId, 'Date:', date);

      const menuRepo = AppDataSource.getRepository(Menu);

      const menus = await menuRepo.find({
        where: {
          restaurantId,
          tenantId,
          dateService: date,
          isActif: true
        },
        relations: ['restaurant'],
        order: { typeRepas: 'ASC' }
      });

      return menus;
    } catch (error) {
      logger.error('[MenuService.getMenusByRestaurantAndDate] ERREUR:', error);
      throw error;
    }
  }

  /**
   * Dupliquer un menu (pour faciliter la planification)
   */
  static async duplicateMenu(
    menuId: string,
    tenantId: string,
    userId: string,
    nouvelleDateService: Date
  ) {
    try {
      logger.info('[MenuService.duplicateMenu] Duplication menu:', menuId);

      const menuRepo = AppDataSource.getRepository(Menu);

      const menuOriginal = await menuRepo.findOne({
        where: { id: menuId, tenantId }
      });

      if (!menuOriginal) {
        throw new Error('Menu original non trouvé');
      }

      // Créer une copie
      const menuDuplique = menuRepo.create({
        ...menuOriginal,
        id: undefined, // Nouveau UUID sera généré
        dateService: nouvelleDateService,
        status: MenuStatus.BROUILLON,
        stockDeduit: false,
        dateValidation: undefined,
        validePar: undefined,
        nombreReservations: 0,
        createdBy: userId,
        updatedBy: undefined,
        createdAt: new Date(),
        updatedAt: new Date()
      });

      const savedMenu = await menuRepo.save(menuDuplique);

      logger.info('[MenuService.duplicateMenu] Menu dupliqué:', savedMenu.id);

      return savedMenu;
    } catch (error) {
      logger.error('[MenuService.duplicateMenu] ERREUR:', error);
      throw error;
    }
  }
}

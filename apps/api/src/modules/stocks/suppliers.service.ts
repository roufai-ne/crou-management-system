/**
 * FICHIER: apps/api/src/modules/stocks/suppliers.service.ts
 * SERVICE: Suppliers - Gestion des fournisseurs
 *
 * DESCRIPTION:
 * Service pour la gestion CRUD des fournisseurs
 * Support multi-tenant avec isolation stricte
 *
 * AUTEUR: Équipe CROU
 * DATE: Janvier 2025
 */

import { AppDataSource } from '../../../../../packages/database/src/config/datasource';
import { Supplier, SupplierType, SupplierStatus } from '../../../../../packages/database/src/entities/Supplier.entity';
import { Like } from 'typeorm';
import { logger } from '@/shared/utils/logger';

export interface SupplierFilters {
  search?: string;
  type?: SupplierType;
  status?: SupplierStatus;
  isPreference?: boolean;
  isCertifie?: boolean;
}

export interface CreateSupplierDTO {
  code: string;
  nom: string;
  nomCommercial?: string;
  type: SupplierType;
  status?: SupplierStatus;
  description?: string;
  numeroSIRET?: string;
  numeroTVA?: string;
  registreCommerce?: string;
  adresse?: string;
  ville?: string;
  region?: string;
  pays?: string;
  codePostal?: string;
  email?: string;
  telephone?: string;
  fax?: string;
  siteWeb?: string;
  contactPrincipal?: string;
  emailContact?: string;
  telephoneContact?: string;
  fonctionContact?: string;
  iban?: string;
  bic?: string;
  banque?: string;
  delaiPaiement?: number;
  devise?: string;
  categoriesProduits?: string[];
  produitsServices?: string;
  tauxRemise?: number;
  montantMinCommande?: number;
  delaiLivraison?: number;
  conditionsParticulieres?: string;
  isPreference?: boolean;
  isCertifie?: boolean;
  certifications?: string;
  notes?: string;
}

export interface UpdateSupplierDTO {
  nom?: string;
  nomCommercial?: string;
  type?: SupplierType;
  status?: SupplierStatus;
  description?: string;
  numeroSIRET?: string;
  numeroTVA?: string;
  registreCommerce?: string;
  adresse?: string;
  ville?: string;
  region?: string;
  pays?: string;
  codePostal?: string;
  email?: string;
  telephone?: string;
  fax?: string;
  siteWeb?: string;
  contactPrincipal?: string;
  emailContact?: string;
  telephoneContact?: string;
  fonctionContact?: string;
  iban?: string;
  bic?: string;
  banque?: string;
  delaiPaiement?: number;
  devise?: string;
  categoriesProduits?: string[];
  produitsServices?: string;
  tauxRemise?: number;
  montantMinCommande?: number;
  delaiLivraison?: number;
  conditionsParticulieres?: string;
  noteQualite?: number;
  noteDelai?: number;
  notePrix?: number;
  isActif?: boolean;
  isPreference?: boolean;
  isCertifie?: boolean;
  certifications?: string;
  notes?: string;
}

export class SuppliersService {
  /**
   * Récupérer tous les fournisseurs avec filtres
   */
  static async getSuppliers(tenantId: string, filters?: SupplierFilters) {
    try {
      const supplierRepo = AppDataSource.getRepository(Supplier);

      const queryBuilder = supplierRepo.createQueryBuilder('supplier')
        .where('supplier.tenantId = :tenantId', { tenantId });

      // Recherche textuelle
      if (filters?.search) {
        queryBuilder.andWhere(
          '(supplier.nom ILIKE :search OR supplier.code ILIKE :search OR supplier.nomCommercial ILIKE :search)',
          { search: `%${filters.search}%` }
        );
      }

      // Filtres
      if (filters?.type) {
        queryBuilder.andWhere('supplier.type = :type', { type: filters.type });
      }

      if (filters?.status) {
        queryBuilder.andWhere('supplier.status = :status', { status: filters.status });
      }

      if (filters?.isPreference !== undefined) {
        queryBuilder.andWhere('supplier.isPreference = :isPreference', { isPreference: filters.isPreference });
      }

      if (filters?.isCertifie !== undefined) {
        queryBuilder.andWhere('supplier.isCertifie = :isCertifie', { isCertifie: filters.isCertifie });
      }

      queryBuilder.orderBy('supplier.nom', 'ASC');

      const suppliers = await queryBuilder.getMany();

      return {
        suppliers,
        total: suppliers.length
      };
    } catch (error) {
      logger.error('Erreur getSuppliers:', error);
      throw error;
    }
  }

  /**
   * Récupérer un fournisseur par ID
   */
  static async getSupplierById(tenantId: string, supplierId: string) {
    try {
      const supplierRepo = AppDataSource.getRepository(Supplier);

      const supplier = await supplierRepo.findOne({
        where: { id: supplierId, tenantId },
        relations: ['stocks']
      });

      if (!supplier) {
        throw new Error('Fournisseur non trouvé');
      }

      return supplier;
    } catch (error) {
      logger.error('Erreur getSupplierById:', error);
      throw error;
    }
  }

  /**
   * Créer un nouveau fournisseur
   */
  static async createSupplier(tenantId: string, userId: string, data: CreateSupplierDTO) {
    try {
      const supplierRepo = AppDataSource.getRepository(Supplier);

      // Vérifier unicité du code
      const existingSupplier = await supplierRepo.findOne({
        where: { code: data.code, tenantId }
      });

      if (existingSupplier) {
        throw new Error('Un fournisseur avec ce code existe déjà');
      }

      // Créer le fournisseur
      const supplier = supplierRepo.create({
        ...data,
        tenantId,
        createdBy: userId,
        status: data.status || SupplierStatus.ACTIF,
        isActif: true
      });

      const savedSupplier = await supplierRepo.save(supplier);

      return savedSupplier;
    } catch (error) {
      logger.error('Erreur createSupplier:', error);
      throw error;
    }
  }

  /**
   * Mettre à jour un fournisseur
   */
  static async updateSupplier(
    tenantId: string,
    userId: string,
    supplierId: string,
    data: UpdateSupplierDTO
  ) {
    try {
      const supplierRepo = AppDataSource.getRepository(Supplier);

      const supplier = await supplierRepo.findOne({
        where: { id: supplierId, tenantId }
      });

      if (!supplier) {
        throw new Error('Fournisseur non trouvé');
      }

      // Mettre à jour les champs
      Object.assign(supplier, data);
      supplier.updatedBy = userId;

      // Recalculer la note moyenne si les notes ont changé
      if (data.noteQualite !== undefined || data.noteDelai !== undefined || data.notePrix !== undefined) {
        supplier.noteMoyenne = supplier.calculateAverageRating();
      }

      const updatedSupplier = await supplierRepo.save(supplier);

      return updatedSupplier;
    } catch (error) {
      logger.error('Erreur updateSupplier:', error);
      throw error;
    }
  }

  /**
   * Supprimer un fournisseur
   */
  static async deleteSupplier(tenantId: string, supplierId: string) {
    try {
      const supplierRepo = AppDataSource.getRepository(Supplier);

      const supplier = await supplierRepo.findOne({
        where: { id: supplierId, tenantId },
        relations: ['stocks']
      });

      if (!supplier) {
        throw new Error('Fournisseur non trouvé');
      }

      // Vérifier si le fournisseur a des stocks associés
      if (supplier.stocks && supplier.stocks.length > 0) {
        throw new Error('Impossible de supprimer un fournisseur avec des stocks associés');
      }

      await supplierRepo.remove(supplier);

      return { success: true, message: 'Fournisseur supprimé avec succès' };
    } catch (error) {
      logger.error('Erreur deleteSupplier:', error);
      throw error;
    }
  }

  /**
   * Obtenir les statistiques des fournisseurs
   */
  static async getSuppliersStats(tenantId: string) {
    try {
      const supplierRepo = AppDataSource.getRepository(Supplier);

      const suppliers = await supplierRepo.find({
        where: { tenantId }
      });

      // Calculer les statistiques
      const totalSuppliers = suppliers.length;
      const activeSuppliers = suppliers.filter(s => s.isActive()).length;
      const preferredSuppliers = suppliers.filter(s => s.isPreference).length;
      const certifiedSuppliers = suppliers.filter(s => s.isCertifie).length;

      // Statistiques par type
      const byType = suppliers.reduce((acc, supplier) => {
        const type = supplier.type;
        acc[type] = (acc[type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      // Top fournisseurs par nombre de commandes
      const topSuppliers = suppliers
        .sort((a, b) => b.nombreCommandes - a.nombreCommandes)
        .slice(0, 5)
        .map(s => ({
          id: s.id,
          nom: s.nom,
          nombreCommandes: s.nombreCommandes,
          montantTotal: s.montantTotalCommandes,
          noteMoyenne: s.noteMoyenne
        }));

      // Note moyenne globale
      const suppliersWithRating = suppliers.filter(s => s.noteMoyenne > 0);
      const averageRating = suppliersWithRating.length > 0
        ? suppliersWithRating.reduce((sum, s) => sum + s.noteMoyenne, 0) / suppliersWithRating.length
        : 0;

      return {
        totalSuppliers,
        activeSuppliers,
        preferredSuppliers,
        certifiedSuppliers,
        byType,
        topSuppliers,
        averageRating: Math.round(averageRating * 100) / 100
      };
    } catch (error) {
      logger.error('Erreur getSuppliersStats:', error);
      throw error;
    }
  }

  /**
   * Mettre à jour les statistiques de commande d'un fournisseur
   */
  static async updateSupplierOrderStats(
    tenantId: string,
    supplierId: string,
    orderAmount: number
  ) {
    try {
      const supplierRepo = AppDataSource.getRepository(Supplier);

      const supplier = await supplierRepo.findOne({
        where: { id: supplierId, tenantId }
      });

      if (!supplier) {
        throw new Error('Fournisseur non trouvé');
      }

      // Mettre à jour les statistiques
      supplier.nombreCommandes += 1;
      supplier.montantTotalCommandes += orderAmount;
      supplier.dateDerniereCommande = new Date();

      if (!supplier.datePremiereCommande) {
        supplier.datePremiereCommande = new Date();
      }

      await supplierRepo.save(supplier);

      return supplier;
    } catch (error) {
      logger.error('Erreur updateSupplierOrderStats:', error);
      throw error;
    }
  }
}

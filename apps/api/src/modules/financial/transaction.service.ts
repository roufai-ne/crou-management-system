/**
 * FICHIER: apps/api/src/modules/financial/transaction.service.ts
 * SERVICE: Transactions - Gestion des transactions financières
 *
 * DESCRIPTION:
 * Service pour la gestion complète des transactions financières
 * CRUD, validation workflow, calcul soldes, statistiques
 *
 * AUTEUR: Équipe CROU
 * DATE: Janvier 2025
 */

import { AppDataSource } from '../../../../../packages/database/src/config/datasource';
import {
  Transaction,
  TransactionType,
  TransactionStatus,
  TransactionCategory
} from '../../../../../packages/database/src/entities/Transaction.entity';
import { Budget } from '../../../../../packages/database/src/entities/Budget.entity';
import { BudgetCategory } from '../../../../../packages/database/src/entities/BudgetCategory.entity';
import { Between, In, LessThanOrEqual, MoreThanOrEqual } from 'typeorm';

export interface CreateTransactionDTO {
  budgetId: string;
  budgetCategoryId?: string;
  libelle: string;
  description?: string;
  type: TransactionType;
  category: TransactionCategory;
  montant: number;
  devise?: string;
  numeroPiece?: string;
  reference?: string;
  beneficiaire?: string;
  modePaiement?: string;
  date: Date;
  dateEcheance?: Date;
}

export interface UpdateTransactionDTO {
  libelle?: string;
  description?: string;
  category?: TransactionCategory;
  montant?: number;
  numeroPiece?: string;
  reference?: string;
  beneficiaire?: string;
  modePaiement?: string;
  date?: Date;
  dateEcheance?: Date;
}

export interface TransactionFilters {
  type?: TransactionType;
  status?: TransactionStatus;
  category?: TransactionCategory;
  budgetId?: string;
  startDate?: Date;
  endDate?: Date;
  minAmount?: number;
  maxAmount?: number;
  search?: string;
}

export class TransactionService {
  /**
   * Créer une nouvelle transaction
   */
  static async createTransaction(
    tenantId: string,
    userId: string,
    data: CreateTransactionDTO
  ) {
    try {
      const transactionRepo = AppDataSource.getRepository(Transaction);
      const budgetRepo = AppDataSource.getRepository(Budget);

      // Vérifier que le budget existe et appartient au tenant
      const budget = await budgetRepo.findOne({
        where: { id: data.budgetId, tenantId }
      });

      if (!budget) {
        throw new Error('Budget non trouvé ou accès non autorisé');
      }

      // Vérifier si la catégorie existe (si fournie)
      if (data.budgetCategoryId) {
        const categoryRepo = AppDataSource.getRepository(BudgetCategory);
        const category = await categoryRepo.findOne({
          where: { id: data.budgetCategoryId, budgetId: data.budgetId }
        });

        if (!category) {
          throw new Error('Catégorie de budget non trouvée');
        }
      }

      // Valider le montant disponible pour les dépenses
      if (data.type === TransactionType.DEPENSE || data.type === TransactionType.ENGAGEMENT) {
        const available = await this.getBudgetAvailableAmount(data.budgetId, tenantId);
        if (data.montant > available) {
          throw new Error(
            `Montant insuffisant. Disponible: ${available} FCFA, Demandé: ${data.montant} FCFA`
          );
        }
      }

      // Générer un numéro de pièce unique si non fourni
      const numeroPiece = data.numeroPiece || await this.generatePieceNumber(tenantId);

      // Créer la transaction
      const transaction = transactionRepo.create({
        tenantId,
        budgetId: data.budgetId,
        budgetCategoryId: data.budgetCategoryId,
        libelle: data.libelle,
        description: data.description,
        type: data.type,
        category: data.category,
        status: TransactionStatus.DRAFT,
        montant: data.montant,
        devise: data.devise || 'XOF',
        numeroPiece,
        reference: data.reference,
        beneficiaire: data.beneficiaire,
        modePaiement: data.modePaiement,
        date: data.date,
        dateEcheance: data.dateEcheance,
        createdBy: userId,
        validationLevel: 0
      });

      const savedTransaction = await transactionRepo.save(transaction);

      // Charger les relations pour la réponse
      const result = await transactionRepo.findOne({
        where: { id: savedTransaction.id },
        relations: ['budget', 'budgetCategory']
      });

      return result;
    } catch (error) {
      console.error('Erreur createTransaction:', error);
      throw error;
    }
  }

  /**
   * Récupérer les transactions avec filtres
   */
  static async getTransactions(tenantId: string, filters?: TransactionFilters) {
    try {
      const transactionRepo = AppDataSource.getRepository(Transaction);
      const queryBuilder = transactionRepo
        .createQueryBuilder('transaction')
        .leftJoinAndSelect('transaction.budget', 'budget')
        .leftJoinAndSelect('transaction.budgetCategory', 'budgetCategory')
        .where('transaction.tenantId = :tenantId', { tenantId });

      // Appliquer les filtres
      if (filters?.type) {
        queryBuilder.andWhere('transaction.type = :type', { type: filters.type });
      }

      if (filters?.status) {
        queryBuilder.andWhere('transaction.status = :status', { status: filters.status });
      }

      if (filters?.category) {
        queryBuilder.andWhere('transaction.category = :category', { category: filters.category });
      }

      if (filters?.budgetId) {
        queryBuilder.andWhere('transaction.budgetId = :budgetId', { budgetId: filters.budgetId });
      }

      if (filters?.startDate && filters?.endDate) {
        queryBuilder.andWhere('transaction.date BETWEEN :startDate AND :endDate', {
          startDate: filters.startDate,
          endDate: filters.endDate
        });
      }

      if (filters?.minAmount !== undefined) {
        queryBuilder.andWhere('transaction.montant >= :minAmount', {
          minAmount: filters.minAmount
        });
      }

      if (filters?.maxAmount !== undefined) {
        queryBuilder.andWhere('transaction.montant <= :maxAmount', {
          maxAmount: filters.maxAmount
        });
      }

      if (filters?.search) {
        queryBuilder.andWhere(
          '(transaction.libelle ILIKE :search OR transaction.description ILIKE :search OR transaction.beneficiaire ILIKE :search)',
          { search: `%${filters.search}%` }
        );
      }

      // Trier par date décroissante
      queryBuilder.orderBy('transaction.date', 'DESC').addOrderBy('transaction.createdAt', 'DESC');

      const transactions = await queryBuilder.getMany();

      // Calculer les statistiques
      const totalDepenses = transactions
        .filter(t => t.isExpense())
        .reduce((sum, t) => sum + Number(t.montant), 0);

      const totalRecettes = transactions
        .filter(t => t.isRevenue())
        .reduce((sum, t) => sum + Number(t.montant), 0);

      const byStatus: any = {};
      Object.values(TransactionStatus).forEach(status => {
        byStatus[status] = transactions.filter(t => t.status === status).length;
      });

      return {
        transactions,
        total: transactions.length,
        statistics: {
          totalDepenses,
          totalRecettes,
          solde: totalRecettes - totalDepenses,
          byStatus,
          byType: {
            depense: transactions.filter(t => t.type === TransactionType.DEPENSE).length,
            recette: transactions.filter(t => t.type === TransactionType.RECETTE).length,
            engagement: transactions.filter(t => t.type === TransactionType.ENGAGEMENT).length,
            ajustement: transactions.filter(t => t.type === TransactionType.AJUSTEMENT).length,
            virement: transactions.filter(t => t.type === TransactionType.VIREMENT).length
          }
        }
      };
    } catch (error) {
      console.error('Erreur getTransactions:', error);
      throw error;
    }
  }

  /**
   * Récupérer une transaction par ID
   */
  static async getTransactionById(transactionId: string, tenantId: string) {
    try {
      const transactionRepo = AppDataSource.getRepository(Transaction);
      const transaction = await transactionRepo.findOne({
        where: { id: transactionId, tenantId },
        relations: ['budget', 'budgetCategory', 'creator', 'validationSteps']
      });

      if (!transaction) {
        throw new Error('Transaction non trouvée');
      }

      return transaction;
    } catch (error) {
      console.error('Erreur getTransactionById:', error);
      throw error;
    }
  }

  /**
   * Mettre à jour une transaction
   */
  static async updateTransaction(
    transactionId: string,
    tenantId: string,
    userId: string,
    data: UpdateTransactionDTO
  ) {
    try {
      const transactionRepo = AppDataSource.getRepository(Transaction);
      const transaction = await transactionRepo.findOne({
        where: { id: transactionId, tenantId }
      });

      if (!transaction) {
        throw new Error('Transaction non trouvée');
      }

      // Vérifier si la transaction peut être modifiée
      if (!transaction.canBeModified()) {
        throw new Error(
          `Transaction au statut "${transaction.status}" ne peut pas être modifiée`
        );
      }

      // Vérifier le montant disponible si le montant change
      if (data.montant && data.montant !== transaction.montant) {
        if (transaction.isExpense()) {
          const available = await this.getBudgetAvailableAmount(transaction.budgetId, tenantId);
          const difference = data.montant - transaction.montant;

          if (difference > available) {
            throw new Error(
              `Montant insuffisant. Disponible: ${available} FCFA, Supplément demandé: ${difference} FCFA`
            );
          }
        }
      }

      // Appliquer les modifications
      Object.assign(transaction, data);
      transaction.updatedBy = userId;

      const updatedTransaction = await transactionRepo.save(transaction);

      // Recharger avec relations
      const result = await transactionRepo.findOne({
        where: { id: updatedTransaction.id },
        relations: ['budget', 'budgetCategory']
      });

      return result;
    } catch (error) {
      console.error('Erreur updateTransaction:', error);
      throw error;
    }
  }

  /**
   * Supprimer une transaction
   */
  static async deleteTransaction(transactionId: string, tenantId: string) {
    try {
      const transactionRepo = AppDataSource.getRepository(Transaction);
      const transaction = await transactionRepo.findOne({
        where: { id: transactionId, tenantId }
      });

      if (!transaction) {
        throw new Error('Transaction non trouvée');
      }

      // Vérifier si la transaction peut être supprimée
      if (!transaction.canBeModified()) {
        throw new Error(
          `Transaction au statut "${transaction.status}" ne peut pas être supprimée`
        );
      }

      await transactionRepo.remove(transaction);

      return { success: true, message: 'Transaction supprimée avec succès' };
    } catch (error) {
      console.error('Erreur deleteTransaction:', error);
      throw error;
    }
  }

  /**
   * Soumettre une transaction pour validation
   */
  static async submitTransaction(transactionId: string, tenantId: string, userId: string) {
    try {
      const transactionRepo = AppDataSource.getRepository(Transaction);
      const transaction = await transactionRepo.findOne({
        where: { id: transactionId, tenantId }
      });

      if (!transaction) {
        throw new Error('Transaction non trouvée');
      }

      if (!transaction.canBeSubmitted()) {
        throw new Error('Transaction ne peut pas être soumise');
      }

      transaction.status = TransactionStatus.SUBMITTED;
      transaction.updatedBy = userId;

      await transactionRepo.save(transaction);

      return { success: true, message: 'Transaction soumise pour validation' };
    } catch (error) {
      console.error('Erreur submitTransaction:', error);
      throw error;
    }
  }

  /**
   * Approuver une transaction
   */
  static async approveTransaction(transactionId: string, tenantId: string, userId: string) {
    try {
      const transactionRepo = AppDataSource.getRepository(Transaction);
      const transaction = await transactionRepo.findOne({
        where: { id: transactionId, tenantId }
      });

      if (!transaction) {
        throw new Error('Transaction non trouvée');
      }

      if (!transaction.canBeApproved()) {
        throw new Error('Transaction ne peut pas être approuvée');
      }

      transaction.status = TransactionStatus.APPROVED;
      transaction.approvedBy = userId;
      transaction.approvedAt = new Date();
      transaction.updatedBy = userId;

      await transactionRepo.save(transaction);

      return { success: true, message: 'Transaction approuvée' };
    } catch (error) {
      console.error('Erreur approveTransaction:', error);
      throw error;
    }
  }

  /**
   * Rejeter une transaction
   */
  static async rejectTransaction(
    transactionId: string,
    tenantId: string,
    userId: string,
    reason?: string
  ) {
    try {
      const transactionRepo = AppDataSource.getRepository(Transaction);
      const transaction = await transactionRepo.findOne({
        where: { id: transactionId, tenantId }
      });

      if (!transaction) {
        throw new Error('Transaction non trouvée');
      }

      if (!transaction.canBeApproved()) {
        throw new Error('Transaction ne peut pas être rejetée');
      }

      transaction.status = TransactionStatus.REJECTED;
      transaction.updatedBy = userId;
      if (reason) {
        transaction.description = (transaction.description || '') + `\nRejet: ${reason}`;
      }

      await transactionRepo.save(transaction);

      return { success: true, message: 'Transaction rejetée' };
    } catch (error) {
      console.error('Erreur rejectTransaction:', error);
      throw error;
    }
  }

  /**
   * Exécuter une transaction approuvée
   */
  static async executeTransaction(transactionId: string, tenantId: string, userId: string) {
    try {
      const transactionRepo = AppDataSource.getRepository(Transaction);
      const transaction = await transactionRepo.findOne({
        where: { id: transactionId, tenantId },
        relations: ['budget']
      });

      if (!transaction) {
        throw new Error('Transaction non trouvée');
      }

      if (!transaction.canBeExecuted()) {
        throw new Error('Transaction ne peut pas être exécutée');
      }

      // Mettre à jour les montants du budget
      const budgetRepo = AppDataSource.getRepository(Budget);
      const budget = transaction.budget;

      if (transaction.isExpense()) {
        budget.montantRealise += Number(transaction.montant);
      }

      await budgetRepo.save(budget);

      // Marquer la transaction comme exécutée
      transaction.status = TransactionStatus.EXECUTED;
      transaction.dateExecution = new Date();
      transaction.updatedBy = userId;

      await transactionRepo.save(transaction);

      return { success: true, message: 'Transaction exécutée avec succès' };
    } catch (error) {
      console.error('Erreur executeTransaction:', error);
      throw error;
    }
  }

  /**
   * Calculer le montant disponible dans un budget
   */
  private static async getBudgetAvailableAmount(budgetId: string, tenantId: string) {
    try {
      const budgetRepo = AppDataSource.getRepository(Budget);
      const budget = await budgetRepo.findOne({
        where: { id: budgetId, tenantId }
      });

      if (!budget) {
        throw new Error('Budget non trouvé');
      }

      const montantDisponible =
        Number(budget.montantInitial) - Number(budget.montantRealise);

      return montantDisponible;
    } catch (error) {
      console.error('Erreur getBudgetAvailableAmount:', error);
      throw error;
    }
  }

  /**
   * Générer un numéro de pièce unique
   */
  private static async generatePieceNumber(tenantId: string): Promise<string> {
    const year = new Date().getFullYear();
    const transactionRepo = AppDataSource.getRepository(Transaction);

    // Compter les transactions de l'année
    const count = await transactionRepo
      .createQueryBuilder('transaction')
      .where('transaction.tenantId = :tenantId', { tenantId })
      .andWhere("EXTRACT(YEAR FROM transaction.date) = :year", { year })
      .getCount();

    const number = (count + 1).toString().padStart(5, '0');
    return `TR-${year}-${number}`;
  }

  /**
   * Obtenir les statistiques des transactions
   */
  static async getTransactionStats(tenantId: string, startDate?: Date, endDate?: Date) {
    try {
      const transactionRepo = AppDataSource.getRepository(Transaction);
      const queryBuilder = transactionRepo
        .createQueryBuilder('transaction')
        .where('transaction.tenantId = :tenantId', { tenantId });

      if (startDate && endDate) {
        queryBuilder.andWhere('transaction.date BETWEEN :startDate AND :endDate', {
          startDate,
          endDate
        });
      }

      const transactions = await queryBuilder.getMany();

      const depenses = transactions.filter(t => t.isExpense());
      const recettes = transactions.filter(t => t.isRevenue());

      return {
        totalTransactions: transactions.length,
        totalDepenses: depenses.reduce((sum, t) => sum + Number(t.montant), 0),
        totalRecettes: recettes.reduce((sum, t) => sum + Number(t.montant), 0),
        nombreDepenses: depenses.length,
        nombreRecettes: recettes.length,
        byStatus: {
          draft: transactions.filter(t => t.status === TransactionStatus.DRAFT).length,
          submitted: transactions.filter(t => t.status === TransactionStatus.SUBMITTED).length,
          approved: transactions.filter(t => t.status === TransactionStatus.APPROVED).length,
          rejected: transactions.filter(t => t.status === TransactionStatus.REJECTED).length,
          executed: transactions.filter(t => t.status === TransactionStatus.EXECUTED).length,
          cancelled: transactions.filter(t => t.status === TransactionStatus.CANCELLED).length
        },
        byCategory: this.groupByCategory(transactions)
      };
    } catch (error) {
      console.error('Erreur getTransactionStats:', error);
      throw error;
    }
  }

  /**
   * Grouper les transactions par catégorie
   */
  private static groupByCategory(transactions: Transaction[]) {
    const grouped: any = {};

    Object.values(TransactionCategory).forEach(category => {
      const categoryTransactions = transactions.filter(t => t.category === category);
      grouped[category] = {
        count: categoryTransactions.length,
        total: categoryTransactions.reduce((sum, t) => sum + Number(t.montant), 0)
      };
    });

    return grouped;
  }
}

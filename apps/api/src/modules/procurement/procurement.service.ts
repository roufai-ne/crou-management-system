/**
 * FICHIER: apps/api/src/modules/procurement/procurement.service.ts
 * SERVICE: Gestion des achats et commandes (Procurement)
 * 
 * DESCRIPTION:
 * Service pour gérer le processus d'achat complet
 * Pont entre Financial (budget) et Stocks (réception)
 * Workflow: Draft → Submit → Approve → Order → Receive → Close
 * 
 * FONCTIONNALITÉS:
 * - Création et gestion des bons de commande
 * - Validation budgétaire (engagement)
 * - Workflow d'approbation multi-niveaux
 * - Réception et mise à jour stocks
 * - Génération transaction financière
 * - Traçabilité complète
 * 
 * AUTEUR: Équipe CROU
 * DATE: Novembre 2025
 */

import { AppDataSource } from '../../../../../packages/database/src/config/datasource';
import { 
  PurchaseOrder, 
  PurchaseOrderStatus, 
  PurchaseOrderType,
  PaymentMethod 
} from '../../../../../packages/database/src/entities/PurchaseOrder.entity';
import { PurchaseOrderItem } from '../../../../../packages/database/src/entities/PurchaseOrderItem.entity';
import { Budget, BudgetStatus } from '../../../../../packages/database/src/entities/Budget.entity';
import { 
  Transaction, 
  TransactionType, 
  TransactionStatus, 
  TransactionCategory 
} from '../../../../../packages/database/src/entities/Transaction.entity';
import { 
  StockMovement, 
  MovementType, 
  MovementReason 
} from '../../../../../packages/database/src/entities/StockMovement.entity';
import { Stock } from '../../../../../packages/database/src/entities/Stock.entity';
import { MovementStatus } from '../../../../../packages/database/src/enums/movementStatus.enum';
import { logger } from '@/shared/utils/logger';

export interface CreatePurchaseOrderDTO {
  budgetId: string;
  supplierId: string;
  objet: string;
  description?: string;
  type?: PurchaseOrderType;
  dateEcheance: Date;
  modePaiement?: PaymentMethod;
  delaiPaiement?: number;
  adresseLivraison?: string;
  contactLivraison?: string;
  telephoneLivraison?: string;
  items: CreatePurchaseOrderItemDTO[];
}

export interface CreatePurchaseOrderItemDTO {
  stockId?: string;
  codeArticle?: string;
  designation: string;
  description?: string;
  reference?: string;
  quantiteCommandee: number;
  unite: string;
  prixUnitaire: number;
  tauxTVA?: number;
  tauxRemise?: number;
  delaiLivraison?: number;
  notes?: string;
}

export interface UpdatePurchaseOrderDTO {
  objet?: string;
  description?: string;
  dateEcheance?: Date;
  modePaiement?: PaymentMethod;
  delaiPaiement?: number;
  adresseLivraison?: string;
  contactLivraison?: string;
  telephoneLivraison?: string;
}

export interface ReceivePurchaseOrderDTO {
  receptionDate: Date;
  items: {
    itemId: string;
    quantiteRecue: number;
    notes?: string;
  }[];
  commentaire?: string;
}

export class ProcurementService {
  /**
   * Générer une référence unique pour le bon de commande
   */
  private static async generateReference(tenantId: string): Promise<string> {
    // Récupérer le code tenant
    const tenant = await AppDataSource.manager.query(`
      SELECT code FROM tenants WHERE id = $1
    `, [tenantId]);

    const year = new Date().getFullYear();
    const tenantCode = tenant[0]?.code || 'CROU';

    // Compter les BC existants pour cette année
    const count = await AppDataSource.manager.query(`
      SELECT COUNT(*) as count
      FROM purchase_orders
      WHERE tenant_id = $1 AND EXTRACT(YEAR FROM "dateCommande") = $2
    `, [tenantId, year]);

    const number = (parseInt(count[0]?.count || '0') + 1).toString().padStart(4, '0');
    return `BC-${tenantCode}-${year}-${number}`;
  }

  /**
   * Créer un bon de commande (Draft)
   */
  static async createPurchaseOrder(
    tenantId: string,
    userId: string,
    data: CreatePurchaseOrderDTO
  ): Promise<PurchaseOrder> {
    try {
      // 1. Vérifier que le budget existe et est actif
      const budget = await AppDataSource.manager.findOne(Budget, {
        where: { id: data.budgetId, tenantId }
      });

      if (!budget) {
        throw new Error('Budget non trouvé');
      }

      if (budget.status !== BudgetStatus.ACTIVE && budget.status !== BudgetStatus.APPROVED) {
        throw new Error('Le budget n\'est pas actif');
      }

      // 2. Calculer le montant total de la commande
      let montantHT = 0;
      const processedItems: PurchaseOrderItem[] = [];

      for (const itemData of data.items) {
        const item = new PurchaseOrderItem();
        item.stockId = itemData.stockId ?? null;
        item.numeroLigne = processedItems.length + 1;
        item.codeArticle = itemData.codeArticle ?? null;
        item.designation = itemData.designation;
        item.description = itemData.description ?? null;
        item.reference = itemData.reference ?? null;
        item.quantiteCommandee = itemData.quantiteCommandee;
        item.quantiteRestante = itemData.quantiteCommandee;
        item.unite = itemData.unite;
        item.prixUnitaire = itemData.prixUnitaire;
        item.tauxTVA = itemData.tauxTVA || 19; // TVA 19% par défaut au Niger
        item.tauxRemise = itemData.tauxRemise || 0;
        item.delaiLivraison = itemData.delaiLivraison ?? null;
        item.notes = itemData.notes ?? null;

        // Calculer les montants
        item.calculateTotal();
        montantHT += item.montantTotal;
        processedItems.push(item);
      }

      const montantTVA = montantHT * 0.19;
      const montantTTC = montantHT + montantTVA;

      // 3. Vérifier la disponibilité budgétaire (optionnel en draft)
      if (budget.montantDisponible < montantTTC) {
        logger.warn(`Budget insuffisant pour BC (disponible: ${budget.montantDisponible}, requis: ${montantTTC})`);
      }

      // 4. Générer référence
      const reference = await this.generateReference(tenantId);

      // 5. Créer le bon de commande
      const purchaseOrder = new PurchaseOrder();
      purchaseOrder.tenantId = tenantId;
      purchaseOrder.reference = reference;
      purchaseOrder.budgetId = data.budgetId;
      purchaseOrder.supplierId = data.supplierId;
      purchaseOrder.objet = data.objet;
      purchaseOrder.description = data.description ?? null;
      purchaseOrder.type = data.type || PurchaseOrderType.STANDARD;
      purchaseOrder.status = PurchaseOrderStatus.DRAFT;
      purchaseOrder.dateCommande = new Date();
      purchaseOrder.dateEcheance = data.dateEcheance ?? null;
      purchaseOrder.montantHT = montantHT;
      purchaseOrder.montantTVA = montantTVA;
      purchaseOrder.montantTTC = montantTTC;
      purchaseOrder.modePaiement = data.modePaiement || PaymentMethod.VIREMENT;
      purchaseOrder.delaiPaiement = data.delaiPaiement || 30;
      purchaseOrder.adresseLivraison = data.adresseLivraison ?? null;
      purchaseOrder.contactLivraison = data.contactLivraison ?? null;
      purchaseOrder.telephoneLivraison = data.telephoneLivraison ?? null;
      purchaseOrder.createdBy = userId;
      purchaseOrder.items = processedItems;

      // 6. Sauvegarder
      const savedOrder = await AppDataSource.manager.save(PurchaseOrder, purchaseOrder);

      logger.info(`Bon de commande créé: ${reference}`, {
        orderId: savedOrder.id,
        montantTTC,
        userId
      });

      return savedOrder;
    } catch (error) {
      logger.error('Erreur création bon de commande:', error);
      throw error;
    }
  }

  /**
   * Soumettre un bon de commande pour approbation
   */
  static async submitPurchaseOrder(
    orderId: string,
    tenantId: string,
    userId: string
  ): Promise<PurchaseOrder> {
    try {
      const order = await AppDataSource.manager.findOne(PurchaseOrder, {
        where: { id: orderId, tenantId },
        relations: ['items', 'budget']
      });

      if (!order) {
        throw new Error('Bon de commande non trouvé');
      }

      if (!order.canBeSubmitted()) {
        throw new Error('Le bon de commande ne peut pas être soumis (statut incompatible ou aucun article)');
      }

      // Vérifier budget disponible
      if (order.budget.montantDisponible < order.montantTTC) {
        throw new Error(`Budget insuffisant (disponible: ${order.budget.montantDisponible} XOF, requis: ${order.montantTTC} XOF)`);
      }

      order.status = PurchaseOrderStatus.SUBMITTED;
      const updated = await AppDataSource.manager.save(PurchaseOrder, order);

      logger.info(`BC soumis pour approbation: ${order.reference}`, { orderId, userId });

      return updated;
    } catch (error) {
      logger.error('Erreur soumission BC:', error);
      throw error;
    }
  }

  /**
   * Approuver un bon de commande (Directeur)
   * Engage le budget
   */
  static async approvePurchaseOrder(
    orderId: string,
    tenantId: string,
    userId: string,
    commentaire?: string
  ): Promise<PurchaseOrder> {
    try {
      const order = await AppDataSource.manager.findOne(PurchaseOrder, {
        where: { id: orderId, tenantId },
        relations: ['items', 'budget']
      });

      if (!order) {
        throw new Error('Bon de commande non trouvé');
      }

      if (!order.canBeApproved()) {
        throw new Error('Le bon de commande ne peut pas être approuvé (statut incompatible)');
      }

      // Vérifier budget disponible
      if (order.budget.montantDisponible < order.montantTTC) {
        throw new Error(`Budget insuffisant (disponible: ${order.budget.montantDisponible} XOF, requis: ${order.montantTTC} XOF)`);
      }

      // Engager le budget
      order.budget.montantEngage += order.montantTTC;
      order.budget.montantDisponible -= order.montantTTC;
      await AppDataSource.manager.save(Budget, order.budget);

      // Créer transaction d'engagement
      const engagement = new Transaction();
      engagement.tenantId = tenantId;
      engagement.budgetId = order.budgetId;
      engagement.libelle = `Engagement BC ${order.reference}`;
      engagement.description = `Engagement budgétaire pour ${order.objet}`;
      engagement.type = TransactionType.ENGAGEMENT;
      engagement.category = TransactionCategory.FOURNITURES; // À adapter selon la catégorie
      engagement.status = TransactionStatus.APPROVED;
      engagement.montant = order.montantTTC;
      engagement.date = new Date();
      engagement.reference = order.reference;
      engagement.createdBy = userId;
      await AppDataSource.manager.save(Transaction, engagement);

      // Mettre à jour le BC
      order.status = PurchaseOrderStatus.APPROVED;
      order.approvedBy = userId;
      order.dateApprobation = new Date();
      order.commentaireApprobation = commentaire || null;

      const updated = await AppDataSource.manager.save(PurchaseOrder, order);

      logger.info(`BC approuvé et budget engagé: ${order.reference}`, {
        orderId,
        montantEngage: order.montantTTC,
        userId
      });

      return updated;
    } catch (error) {
      logger.error('Erreur approbation BC:', error);
      throw error;
    }
  }

  /**
   * Marquer comme commandé (envoyé au fournisseur)
   */
  static async markAsOrdered(
    orderId: string,
    tenantId: string,
    userId: string
  ): Promise<PurchaseOrder> {
    try {
      const order = await AppDataSource.manager.findOne(PurchaseOrder, {
        where: { id: orderId, tenantId }
      });

      if (!order) {
        throw new Error('Bon de commande non trouvé');
      }

      if (order.status !== PurchaseOrderStatus.APPROVED) {
        throw new Error('Le BC doit être approuvé avant d\'être commandé');
      }

      order.status = PurchaseOrderStatus.ORDERED;
      order.dateEnvoi = new Date();

      const updated = await AppDataSource.manager.save(PurchaseOrder, order);

      logger.info(`BC marqué comme commandé: ${order.reference}`, { orderId, userId });

      return updated;
    } catch (error) {
      logger.error('Erreur marquage BC commandé:', error);
      throw error;
    }
  }

  /**
   * Réceptionner un bon de commande (total ou partiel)
   * Crée les mouvements de stock et la transaction de dépense
   */
  static async receivePurchaseOrder(
    orderId: string,
    tenantId: string,
    userId: string,
    data: ReceivePurchaseOrderDTO
  ): Promise<PurchaseOrder> {
    try {
      const order = await AppDataSource.manager.findOne(PurchaseOrder, {
        where: { id: orderId, tenantId },
        relations: ['items', 'budget', 'items.stock']
      });

      if (!order) {
        throw new Error('Bon de commande non trouvé');
      }

      if (![PurchaseOrderStatus.ORDERED, PurchaseOrderStatus.PARTIALLY_RECEIVED].includes(order.status)) {
        throw new Error('Le BC doit être commandé avant réception');
      }

      let montantReceptionne = 0;

      // Traiter chaque ligne reçue
      for (const itemReception of data.items) {
        const item = order.items.find(i => i.id === itemReception.itemId);
        
        if (!item) {
          throw new Error(`Article ${itemReception.itemId} non trouvé dans le BC`);
        }

        if (itemReception.quantiteRecue > item.quantiteRestante) {
          throw new Error(`Quantité reçue (${itemReception.quantiteRecue}) supérieure à la quantité restante (${item.quantiteRestante})`);
        }

        // Mettre à jour l'item
        item.recordReception(itemReception.quantiteRecue);
        await AppDataSource.manager.save(PurchaseOrderItem, item);

        // Calculer le montant de cette réception
        const montantLigne = (itemReception.quantiteRecue / item.quantiteCommandee) * item.montantTTC;
        montantReceptionne += montantLigne;

        // Créer mouvement de stock (entrée) - seulement si l'item est lié à un stock existant
        if (item.stock && item.stockId) {
          const movement = new StockMovement();
          movement.stockId = item.stockId;
          movement.tenantId = tenantId;
          movement.purchaseOrderId = orderId;
          movement.numero = `MVT-${order.reference}-${item.numeroLigne}`;
          movement.libelle = `Réception BC ${order.reference} - ${item.designation}`;
          movement.description = `Réception partielle/totale`;
          movement.type = MovementType.ENTREE;
          movement.reason = MovementReason.RECEPTION;
          movement.status = MovementStatus.CONFIRMED;
          movement.quantite = itemReception.quantiteRecue;
          movement.quantiteAvant = item.stock.quantiteActuelle;
          movement.quantiteApres = item.stock.quantiteActuelle + itemReception.quantiteRecue;
          movement.unit = item.unite;
          movement.prixUnitaire = item.prixUnitaire;
          movement.valeurTotale = itemReception.quantiteRecue * item.prixUnitaire;
          movement.numeroBon = order.reference;
          movement.date = data.receptionDate;
          movement.dateConfirmation = new Date();
          movement.createdBy = userId;
          movement.confirmedBy = userId;

          await AppDataSource.manager.save(StockMovement, movement);

          // Mettre à jour les quantités en stock
          item.stock.quantiteActuelle += itemReception.quantiteRecue;
          item.stock.quantiteDisponible = item.stock.quantiteActuelle - item.stock.quantiteReservee;
          item.stock.dateDerniereEntree = new Date();
          await AppDataSource.manager.save(Stock, item.stock);
        }
      }

      // Mettre à jour le BC
      order.montantReceptionne += montantReceptionne;
      order.nombreReceptions += 1;
      order.checkFullyReceived();
      order.receivedBy = userId;
      order.dateReception = (order.isFullyReceived ? data.receptionDate : null) as any;
      order.commentaireReception = data.commentaire || null;

      await AppDataSource.manager.save(PurchaseOrder, order);

      // Si totalement réceptionné, créer la transaction de dépense
      if (order.isFullyReceived) {
        // Transformer l'engagement en dépense
        const depense = new Transaction();
        depense.tenantId = tenantId;
        depense.budgetId = order.budgetId;
        depense.libelle = `Dépense BC ${order.reference}`;
        depense.description = `Paiement ${order.objet}`;
        depense.type = TransactionType.DEPENSE;
        depense.category = TransactionCategory.FOURNITURES;
        depense.status = TransactionStatus.EXECUTED;
        depense.montant = order.montantTTC;
        depense.date = data.receptionDate;
        depense.reference = order.reference;
        depense.createdBy = userId;
        await AppDataSource.manager.save(Transaction, depense);

        // Mettre à jour le budget
        order.budget.montantEngage -= order.montantTTC;
        order.budget.montantRealise += order.montantTTC;
        order.budget.tauxExecution = (order.budget.montantRealise / order.budget.montantInitial) * 100;
        await AppDataSource.manager.save(Budget, order.budget);
      }

      logger.info(`BC réceptionné (${order.isFullyReceived ? 'total' : 'partiel'}): ${order.reference}`, {
        orderId,
        montantReceptionne,
        userId
      });

      return order;
    } catch (error) {
      logger.error('Erreur réception BC:', error);
      throw error;
    }
  }

  /**
   * Annuler un bon de commande
   * Libère le budget engagé si approuvé
   */
  static async cancelPurchaseOrder(
    orderId: string,
    tenantId: string,
    userId: string,
    motif: string
  ): Promise<PurchaseOrder> {
    try {
      const order = await AppDataSource.manager.findOne(PurchaseOrder, {
        where: { id: orderId, tenantId },
        relations: ['budget']
      });

      if (!order) {
        throw new Error('Bon de commande non trouvé');
      }

      if (!order.canBeCancelled()) {
        throw new Error('Le BC ne peut plus être annulé (déjà réceptionné ou clôturé)');
      }

      // Si approuvé, libérer le budget
      if (order.status === PurchaseOrderStatus.APPROVED || order.status === PurchaseOrderStatus.ORDERED) {
        order.budget.montantEngage -= order.montantTTC;
        order.budget.montantDisponible += order.montantTTC;
        await AppDataSource.manager.save(Budget, order.budget);
      }

      order.status = PurchaseOrderStatus.CANCELLED;
      order.cancelledBy = userId;
      order.dateCancellation = new Date();
      order.motifAnnulation = motif;

      const updated = await AppDataSource.manager.save(PurchaseOrder, order);

      logger.info(`BC annulé: ${order.reference}`, { orderId, motif, userId });

      return updated;
    } catch (error) {
      logger.error('Erreur annulation BC:', error);
      throw error;
    }
  }

  /**
   * Récupérer les bons de commande avec filtres
   */
  static async getPurchaseOrders(
    tenantId: string,
    filters?: {
      status?: PurchaseOrderStatus;
      supplierId?: string;
      budgetId?: string;
      dateFrom?: Date;
      dateTo?: Date;
      search?: string;
    }
  ): Promise<PurchaseOrder[]> {
    try {
      const query = AppDataSource.manager
        .createQueryBuilder(PurchaseOrder, 'po')
        .leftJoinAndSelect('po.supplier', 'supplier')
        .leftJoinAndSelect('po.budget', 'budget')
        .leftJoinAndSelect('po.items', 'items')
        .where('po.tenantId = :tenantId', { tenantId });

      if (filters?.status) {
        query.andWhere('po.status = :status', { status: filters.status });
      }

      if (filters?.supplierId) {
        query.andWhere('po.supplierId = :supplierId', { supplierId: filters.supplierId });
      }

      if (filters?.budgetId) {
        query.andWhere('po.budgetId = :budgetId', { budgetId: filters.budgetId });
      }

      if (filters?.dateFrom) {
        query.andWhere('po.dateCommande >= :dateFrom', { dateFrom: filters.dateFrom });
      }

      if (filters?.dateTo) {
        query.andWhere('po.dateCommande <= :dateTo', { dateTo: filters.dateTo });
      }

      if (filters?.search) {
        query.andWhere(
          '(po.reference ILIKE :search OR po.objet ILIKE :search OR supplier.nom ILIKE :search)',
          { search: `%${filters.search}%` }
        );
      }

      query.orderBy('po.dateCommande', 'DESC');

      return await query.getMany();
    } catch (error) {
      logger.error('Erreur récupération BCs:', error);
      throw error;
    }
  }

  /**
   * Récupérer un bon de commande par ID
   */
  static async getPurchaseOrderById(
    orderId: string,
    tenantId: string
  ): Promise<PurchaseOrder | null> {
    try {
      return await AppDataSource.manager.findOne(PurchaseOrder, {
        where: { id: orderId, tenantId },
        relations: ['supplier', 'budget', 'items', 'items.stock', 'receptions']
      });
    } catch (error) {
      logger.error('Erreur récupération BC:', error);
      throw error;
    }
  }
}

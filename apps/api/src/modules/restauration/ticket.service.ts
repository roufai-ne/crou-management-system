/**
 * FICHIER: apps/api/src/modules/restauration/ticket.service.ts
 * SERVICE: Ticket - Gestion des tickets repas ANONYMES
 *
 * DESCRIPTION:
 * Service pour la gestion des tickets repas anonymes
 * Émission tickets payants et gratuits
 * Un ticket = un repas (selon service: déjeuner, dîner, petit déjeuner)
 * Utilisable une seule fois avec QR code unique
 * Support multi-tenant strict
 *
 * AUTEUR: Équipe CROU - Module Restauration
 * DATE: Janvier 2025
 */

import { AppDataSource } from '../../../../../packages/database/src/config/datasource';
import { TicketRepas, TicketStatus, CategorieTicket } from '../../../../../packages/database/src/entities/TicketRepas.entity';
import { TypeRepas } from '../../../../../packages/database/src/entities/Menu.entity';
import { Between, Like } from 'typeorm';
import { logger } from '@/shared/utils/logger';
import { randomBytes } from 'crypto';

// ========================================
// INTERFACES & TYPES
// ========================================

export interface TicketFilters {
  status?: TicketStatus;
  categorie?: CategorieTicket;
  typeRepas?: TypeRepas;
  dateEmissionDebut?: Date;
  dateEmissionFin?: Date;
  numeroTicket?: string;
  qrCode?: string;
  annee?: number;
}

export interface CreateTicketDTO {
  categorie: CategorieTicket; // PAYANT ou GRATUIT
  typeRepas: TypeRepas; // PETIT_DEJEUNER, DEJEUNER, DINER
  tarif: number; // Montant en FCFA (0 si gratuit)
  dateExpiration: Date; // Date d'expiration
  annee?: number; // Année (défaut: année courante)
  methodePaiement?: string; // Si payant: ESPECES, CARTE, MOBILE_MONEY
  referencePaiement?: string; // Référence transaction si applicable
  messageIndication?: string; // Message sur le ticket (ex: "Bon appétit!")
  notes?: string;
}

export interface CreateTicketsBatchDTO {
  quantite: number; // Nombre de tickets à créer
  categorie: CategorieTicket;
  typeRepas: TypeRepas;
  tarif: number;
  dateExpiration: Date;
  annee?: number;
  messageIndication?: string;
}

export interface UtiliserTicketDTO {
  numeroTicket?: string; // Soit par numéro
  qrCode?: string; // Soit par QR code
  repasId: string;
  restaurantId: string;
}

// ========================================
// SERVICE
// ========================================

export class TicketService {
  /**
   * Générer un numéro de ticket unique
   * Format: TKT-2025-001234
   */
  private static async generateNumeroTicket(tenantId: string, annee?: number): Promise<string> {
    const ticketRepo = AppDataSource.getRepository(TicketRepas);

    const year = annee || new Date().getFullYear();
    const prefix = `TKT-${year}-`;

    // Compter les tickets de l'année
    const count = await ticketRepo.count({
      where: {
        tenantId,
        numeroTicket: Like(`${prefix}%`)
      }
    });

    const sequence = (count + 1).toString().padStart(6, '0');
    return `${prefix}${sequence}`;
  }

  /**
   * Générer un QR code unique
   * Format: QR-[TENANT_PREFIX]-[RANDOM_HASH]
   */
  private static async generateQRCode(tenantId: string): Promise<string> {
    const ticketRepo = AppDataSource.getRepository(TicketRepas);

    let qrCode: string;
    let exists = true;

    // Générer jusqu'à trouver un code unique
    while (exists) {
      const hash = randomBytes(16).toString('hex'); // 32 caractères
      const tenantPrefix = tenantId.substring(0, 8);
      qrCode = `QR-${tenantPrefix}-${hash}`;

      const existing = await ticketRepo.findOne({
        where: { qrCode }
      });

      exists = !!existing;
    }

    return qrCode!;
  }

  /**
   * Récupérer tous les tickets avec filtres
   */
  static async getTickets(tenantId: string, filters?: TicketFilters) {
    try {
      logger.info('[TicketService.getTickets] Début - tenantId:', tenantId);

      if (!AppDataSource.isInitialized) {
        throw new Error('AppDataSource non initialisé');
      }

      const ticketRepo = AppDataSource.getRepository(TicketRepas);
      const queryBuilder = ticketRepo.createQueryBuilder('ticket')
        .leftJoinAndSelect('ticket.restaurant', 'restaurant')
        .leftJoinAndSelect('ticket.repas', 'repas')
        .where('ticket.tenantId = :tenantId', { tenantId });

      // Filtre par statut
      if (filters?.status) {
        queryBuilder.andWhere('ticket.status = :status', { status: filters.status });
      }

      // Filtre par catégorie
      if (filters?.categorie) {
        queryBuilder.andWhere('ticket.categorie = :categorie', { categorie: filters.categorie });
      }

      // Filtre par type de repas
      if (filters?.typeRepas) {
        queryBuilder.andWhere('ticket.typeRepas = :typeRepas', { typeRepas: filters.typeRepas });
      }

      // Filtre par année
      if (filters?.annee) {
        queryBuilder.andWhere('ticket.annee = :annee', { annee: filters.annee });
      }

      // Filtre par date d'émission
      if (filters?.dateEmissionDebut && filters?.dateEmissionFin) {
        queryBuilder.andWhere(
          'ticket.dateEmission BETWEEN :dateDebut AND :dateFin',
          { dateDebut: filters.dateEmissionDebut, dateFin: filters.dateEmissionFin }
        );
      }

      // Recherche par numéro
      if (filters?.numeroTicket) {
        queryBuilder.andWhere('ticket.numeroTicket ILIKE :numero', {
          numero: `%${filters.numeroTicket}%`
        });
      }

      // Recherche par QR code
      if (filters?.qrCode) {
        queryBuilder.andWhere('ticket.qrCode ILIKE :qrCode', {
          qrCode: `%${filters.qrCode}%`
        });
      }

      const tickets = await queryBuilder
        .orderBy('ticket.dateEmission', 'DESC')
        .getMany();

      logger.info('[TicketService.getTickets] Tickets trouvés:', tickets.length);

      // Calcul statistiques
      const result = {
        tickets,
        total: tickets.length,
        actifs: tickets.filter(t => t.status === TicketStatus.ACTIF).length,
        utilises: tickets.filter(t => t.status === TicketStatus.UTILISE).length,
        expires: tickets.filter(t => t.status === TicketStatus.EXPIRE).length,
        annules: tickets.filter(t => t.status === TicketStatus.ANNULE).length,
        montantTotal: tickets.reduce((sum, t) => sum + Number(t.tarif || 0), 0),
        payants: tickets.filter(t => t.categorie === CategorieTicket.PAYANT).length,
        gratuits: tickets.filter(t => t.categorie === CategorieTicket.GRATUIT).length
      };

      return result;
    } catch (error) {
      logger.error('[TicketService.getTickets] ERREUR:', error);
      throw error;
    }
  }

  /**
   * Récupérer un ticket par numéro ou QR code
   */
  static async getTicketByIdentifier(identifier: string, tenantId: string) {
    try {
      logger.info('[TicketService.getTicketByIdentifier] Identifier:', identifier);

      const ticketRepo = AppDataSource.getRepository(TicketRepas);

      // Chercher par numéro ou QR code
      const ticket = await ticketRepo.findOne({
        where: [
          { numeroTicket: identifier, tenantId },
          { qrCode: identifier, tenantId }
        ],
        relations: ['restaurant', 'repas']
      });

      if (!ticket) {
        throw new Error('Ticket non trouvé');
      }

      return ticket;
    } catch (error) {
      logger.error('[TicketService.getTicketByIdentifier] ERREUR:', error);
      throw error;
    }
  }

  /**
   * Créer un ticket anonyme
   */
  static async createTicket(
    tenantId: string,
    userId: string,
    data: CreateTicketDTO
  ) {
    try {
      logger.info('[TicketService.createTicket] Création ticket:', data.categorie, data.typeRepas);

      const ticketRepo = AppDataSource.getRepository(TicketRepas);

      // Validation: tarif = 0 si gratuit
      if (data.categorie === CategorieTicket.GRATUIT && data.tarif !== 0) {
        throw new Error('Le tarif d\'un ticket gratuit doit être 0');
      }

      // Validation: tarif > 0 si payant
      if (data.categorie === CategorieTicket.PAYANT && data.tarif <= 0) {
        throw new Error('Le tarif d\'un ticket payant doit être supérieur à 0');
      }

      // Générer numéro de ticket unique
      const numeroTicket = await this.generateNumeroTicket(tenantId, data.annee);

      // Générer QR code unique
      const qrCode = await this.generateQRCode(tenantId);

      // Créer le ticket
      const newTicket = ticketRepo.create({
        ...data,
        tenantId,
        numeroTicket,
        qrCode,
        annee: data.annee || new Date().getFullYear(),
        dateEmission: new Date(),
        status: TicketStatus.ACTIF,
        estUtilise: false,
        createdBy: userId
      });

      const savedTicket = await ticketRepo.save(newTicket);

      logger.info('[TicketService.createTicket] Ticket créé:', savedTicket.numeroTicket, '- QR:', savedTicket.qrCode);

      return savedTicket;
    } catch (error) {
      logger.error('[TicketService.createTicket] ERREUR:', error);
      throw error;
    }
  }

  /**
   * Créer plusieurs tickets identiques (émission en lot)
   */
  static async createTicketsBatch(
    tenantId: string,
    userId: string,
    data: CreateTicketsBatchDTO
  ) {
    try {
      logger.info('[TicketService.createTicketsBatch] Création lot:', data.quantite, 'tickets');

      const createdTickets = [];

      // Créer N tickets identiques
      for (let i = 0; i < data.quantite; i++) {
        const ticketData: CreateTicketDTO = {
          categorie: data.categorie,
          typeRepas: data.typeRepas,
          tarif: data.tarif,
          dateExpiration: data.dateExpiration,
          annee: data.annee,
          messageIndication: data.messageIndication
        };

        const ticket = await this.createTicket(tenantId, userId, ticketData);
        createdTickets.push(ticket);
      }

      logger.info('[TicketService.createTicketsBatch] Lot créé:', createdTickets.length);

      return {
        tickets: createdTickets,
        total: createdTickets.length,
        montantTotal: createdTickets.reduce((sum, t) => sum + Number(t.tarif), 0),
        payants: createdTickets.filter(t => t.categorie === CategorieTicket.PAYANT).length,
        gratuits: createdTickets.filter(t => t.categorie === CategorieTicket.GRATUIT).length
      };
    } catch (error) {
      logger.error('[TicketService.createTicketsBatch] ERREUR:', error);
      throw error;
    }
  }

  /**
   * Utiliser un ticket pour un repas (par numéro ou QR code)
   */
  static async utiliserTicket(
    tenantId: string,
    userId: string,
    data: UtiliserTicketDTO
  ) {
    try {
      logger.info('[TicketService.utiliserTicket] Utilisation ticket:', data.numeroTicket || data.qrCode);

      if (!data.numeroTicket && !data.qrCode) {
        throw new Error('Numéro de ticket ou QR code requis');
      }

      const ticketRepo = AppDataSource.getRepository(TicketRepas);

      // Chercher le ticket par numéro ou QR code
      const where: any = { tenantId };
      if (data.numeroTicket) {
        where.numeroTicket = data.numeroTicket;
      } else if (data.qrCode) {
        where.qrCode = data.qrCode;
      }

      const ticket = await ticketRepo.findOne({ where });

      if (!ticket) {
        throw new Error('Ticket non trouvé');
      }

      // Vérifier la validité
      const validationResult = await this.verifierValidite(ticket);
      if (!validationResult.valide) {
        throw new Error(validationResult.raison);
      }

      // Marquer le ticket comme utilisé (ticket unique)
      ticket.estUtilise = true;
      ticket.status = TicketStatus.UTILISE;
      ticket.dateUtilisation = new Date();
      ticket.repasId = data.repasId;
      ticket.restaurantId = data.restaurantId;
      ticket.validePar = userId;
      ticket.updatedBy = userId;
      ticket.updatedAt = new Date();

      const updatedTicket = await ticketRepo.save(ticket);

      logger.info('[TicketService.utiliserTicket] Ticket utilisé:', ticket.numeroTicket);

      return updatedTicket;
    } catch (error) {
      logger.error('[TicketService.utiliserTicket] ERREUR:', error);
      throw error;
    }
  }

  /**
   * Vérifier la validité d'un ticket
   */
  static async verifierValidite(ticket: TicketRepas): Promise<{ valide: boolean; raison?: string }> {
    try {
      // Vérifier le statut
      if (ticket.status === TicketStatus.ANNULE) {
        return { valide: false, raison: 'Ticket annulé' };
      }

      if (ticket.status === TicketStatus.EXPIRE) {
        return { valide: false, raison: 'Ticket expiré' };
      }

      if (ticket.status === TicketStatus.UTILISE) {
        return { valide: false, raison: 'Ticket déjà utilisé' };
      }

      // Vérifier l'expiration
      const now = new Date();
      const expiration = new Date(ticket.dateExpiration);

      if (expiration < now) {
        // Marquer comme expiré
        const ticketRepo = AppDataSource.getRepository(TicketRepas);
        ticket.status = TicketStatus.EXPIRE;
        await ticketRepo.save(ticket);

        return { valide: false, raison: 'Ticket expiré (date dépassée)' };
      }

      // Vérifier si déjà utilisé
      if (ticket.estUtilise) {
        return { valide: false, raison: 'Ticket déjà utilisé' };
      }

      return { valide: true };
    } catch (error) {
      logger.error('[TicketService.verifierValidite] ERREUR:', error);
      throw error;
    }
  }

  /**
   * Annuler un ticket
   */
  static async annulerTicket(
    ticketId: string,
    tenantId: string,
    userId: string,
    motif: string
  ) {
    try {
      logger.info('[TicketService.annulerTicket] Annulation ticket:', ticketId);

      const ticketRepo = AppDataSource.getRepository(TicketRepas);

      const ticket = await ticketRepo.findOne({
        where: { id: ticketId, tenantId }
      });

      if (!ticket) {
        throw new Error('Ticket non trouvé');
      }

      if (ticket.status === TicketStatus.UTILISE) {
        throw new Error('Impossible d\'annuler un ticket déjà utilisé');
      }

      ticket.status = TicketStatus.ANNULE;
      ticket.annulePar = userId;
      ticket.motifAnnulation = motif;
      ticket.updatedBy = userId;
      ticket.updatedAt = new Date();

      // TODO: Calculer remboursement si applicable
      // ticket.montantRembourse = ...

      await ticketRepo.save(ticket);

      logger.info('[TicketService.annulerTicket] Ticket annulé');

      return ticket;
    } catch (error) {
      logger.error('[TicketService.annulerTicket] ERREUR:', error);
      throw error;
    }
  }

  /**
   * Vérifier et mettre à jour les tickets expirés
   */
  static async updateExpiredTickets(tenantId: string) {
    try {
      logger.info('[TicketService.updateExpiredTickets] Mise à jour tickets expirés');

      const ticketRepo = AppDataSource.getRepository(TicketRepas);
      const now = new Date();

      const expiredTickets = await ticketRepo.find({
        where: {
          tenantId,
          status: TicketStatus.ACTIF,
          dateExpiration: Between(new Date(0), now)
        }
      });

      for (const ticket of expiredTickets) {
        ticket.status = TicketStatus.EXPIRE;
        await ticketRepo.save(ticket);
      }

      logger.info('[TicketService.updateExpiredTickets] Tickets expirés mis à jour:', expiredTickets.length);

      return { updated: expiredTickets.length };
    } catch (error) {
      logger.error('[TicketService.updateExpiredTickets] ERREUR:', error);
      throw error;
    }
  }
}

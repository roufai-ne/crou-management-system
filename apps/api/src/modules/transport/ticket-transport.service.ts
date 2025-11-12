/**
 * FICHIER: apps/api/src/modules/transport/ticket-transport.service.ts
 * SERVICE: TicketTransport - Gestion des tickets de transport ANONYMES
 *
 * DESCRIPTION:
 * Service pour la gestion des tickets de transport anonymes (tickets de bus)
 * Émission tickets payants et gratuits pour circuits de transport
 * Un ticket = un trajet (selon circuit choisi)
 * Utilisable une seule fois avec QR code unique
 * Support multi-tenant strict
 *
 * SIMILAIRE À: TicketService (restauration)
 *
 * AUTEUR: Équipe CROU - Module Transport
 * DATE: Janvier 2025
 */

import { AppDataSource } from '../../../../../packages/database/src/config/datasource';
import { TicketTransport, TicketTransportStatus, CategorieTicketTransport } from '../../../../../packages/database/src/entities/TicketTransport.entity';
import { TransportRoute } from '../../../../../packages/database/src/entities/TransportRoute.entity';
import { Like } from 'typeorm';
import { logger } from '@/shared/utils/logger';
import { randomBytes } from 'crypto';

// ========================================
// INTERFACES & TYPES
// ========================================

export interface TicketTransportFilters {
  status?: TicketTransportStatus;
  categorie?: CategorieTicketTransport;
  circuitId?: string;
  dateVoyageDebut?: Date;
  dateVoyageFin?: Date;
  numeroTicket?: string;
  qrCode?: string;
  annee?: number;
}

export interface CreateTicketTransportDTO {
  circuitId: string;            // Circuit de transport (obligatoire)
  categorie: CategorieTicketTransport; // PAYANT ou GRATUIT
  dateVoyage: Date;             // Date du voyage prévu
  tarif: number;                // Montant en FCFA (0 si gratuit)
  dateExpiration: Date;         // Date d'expiration
  annee?: number;               // Année (défaut: année courante)
  methodePaiement?: string;     // Si payant: ESPECES, CARTE, MOBILE_MONEY
  referencePaiement?: string;   // Référence transaction
  messageIndication?: string;   // Message sur le ticket (ex: "Bon voyage!")
  notes?: string;
}

export interface CreateTicketsTransportBatchDTO {
  quantite: number;             // Nombre de tickets à créer
  circuitId: string;
  categorie: CategorieTicketTransport;
  dateVoyage: Date;
  tarif: number;
  dateExpiration: Date;
  annee?: number;
  messageIndication?: string;
}

export interface UtiliserTicketTransportDTO {
  numeroTicket?: string;        // Soit par numéro
  qrCode?: string;              // Soit par QR code
  trajetId?: string;            // ID du trajet (si lié à ScheduledTrip)
  vehiculeImmatriculation?: string; // Immatriculation véhicule
  conducteur?: string;          // Nom du conducteur
}

// ========================================
// SERVICE
// ========================================

export class TicketTransportService {
  /**
   * Générer un numéro de ticket unique
   * Format: TKT-TRANS-2025-001234
   */
  private static async generateNumeroTicket(tenantId: string, annee?: number): Promise<string> {
    const ticketRepo = AppDataSource.getRepository(TicketTransport);

    const year = annee || new Date().getFullYear();
    const prefix = `TKT-TRANS-${year}-`;

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
   * Format: QR-TRANS-[TENANT_PREFIX]-[RANDOM_HASH]
   */
  private static async generateQRCode(tenantId: string): Promise<string> {
    const ticketRepo = AppDataSource.getRepository(TicketTransport);

    let qrCode: string;
    let exists = true;

    // Générer jusqu'à trouver un code unique
    while (exists) {
      const hash = randomBytes(16).toString('hex'); // 32 caractères
      const tenantPrefix = tenantId.substring(0, 8);
      qrCode = `QR-TRANS-${tenantPrefix}-${hash}`;

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
  static async getTickets(tenantId: string, filters?: TicketTransportFilters) {
    try {
      logger.info('[TicketTransportService.getTickets] Début - tenantId:', tenantId);

      if (!AppDataSource.isInitialized) {
        throw new Error('AppDataSource non initialisé');
      }

      const ticketRepo = AppDataSource.getRepository(TicketTransport);
      const queryBuilder = ticketRepo.createQueryBuilder('ticket')
        .leftJoinAndSelect('ticket.circuit', 'circuit')
        .where('ticket.tenantId = :tenantId', { tenantId });

      // Filtre par statut
      if (filters?.status) {
        queryBuilder.andWhere('ticket.status = :status', { status: filters.status });
      }

      // Filtre par catégorie
      if (filters?.categorie) {
        queryBuilder.andWhere('ticket.categorie = :categorie', { categorie: filters.categorie });
      }

      // Filtre par circuit
      if (filters?.circuitId) {
        queryBuilder.andWhere('ticket.circuitId = :circuitId', { circuitId: filters.circuitId });
      }

      // Filtre par année
      if (filters?.annee) {
        queryBuilder.andWhere('ticket.annee = :annee', { annee: filters.annee });
      }

      // Filtre par date de voyage
      if (filters?.dateVoyageDebut && filters?.dateVoyageFin) {
        queryBuilder.andWhere(
          'ticket.dateVoyage BETWEEN :dateDebut AND :dateFin',
          { dateDebut: filters.dateVoyageDebut, dateFin: filters.dateVoyageFin }
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
        .orderBy('ticket.dateVoyage', 'DESC')
        .addOrderBy('ticket.dateEmission', 'DESC')
        .getMany();

      logger.info('[TicketTransportService.getTickets] Tickets trouvés:', tickets.length);

      // Calcul statistiques
      const result = {
        tickets,
        total: tickets.length,
        actifs: tickets.filter(t => t.status === TicketTransportStatus.ACTIF).length,
        utilises: tickets.filter(t => t.status === TicketTransportStatus.UTILISE).length,
        expires: tickets.filter(t => t.status === TicketTransportStatus.EXPIRE).length,
        annules: tickets.filter(t => t.status === TicketTransportStatus.ANNULE).length,
        montantTotal: tickets.reduce((sum, t) => sum + Number(t.tarif || 0), 0),
        payants: tickets.filter(t => t.categorie === CategorieTicketTransport.PAYANT).length,
        gratuits: tickets.filter(t => t.categorie === CategorieTicketTransport.GRATUIT).length
      };

      return result;
    } catch (error) {
      logger.error('[TicketTransportService.getTickets] ERREUR:', error);
      throw error;
    }
  }

  /**
   * Récupérer un ticket par numéro ou QR code
   */
  static async getTicketByIdentifier(identifier: string, tenantId: string) {
    try {
      logger.info('[TicketTransportService.getTicketByIdentifier] Identifier:', identifier);

      const ticketRepo = AppDataSource.getRepository(TicketTransport);

      // Chercher par numéro ou QR code
      const ticket = await ticketRepo.findOne({
        where: [
          { numeroTicket: identifier, tenantId },
          { qrCode: identifier, tenantId }
        ],
        relations: ['circuit']
      });

      if (!ticket) {
        throw new Error('Ticket non trouvé');
      }

      return ticket;
    } catch (error) {
      logger.error('[TicketTransportService.getTicketByIdentifier] ERREUR:', error);
      throw error;
    }
  }

  /**
   * Créer un ticket anonyme de transport
   */
  static async createTicket(
    tenantId: string,
    userId: string,
    data: CreateTicketTransportDTO
  ) {
    try {
      logger.info('[TicketTransportService.createTicket] Création ticket:', data.categorie, data.circuitId);

      const ticketRepo = AppDataSource.getRepository(TicketTransport);
      const circuitRepo = AppDataSource.getRepository(TransportRoute);

      // Vérifier que le circuit existe
      const circuit = await circuitRepo.findOne({
        where: { id: data.circuitId, tenantId }
      });

      if (!circuit) {
        throw new Error('Circuit de transport non trouvé');
      }

      // Validation: tarif = 0 si gratuit
      if (data.categorie === CategorieTicketTransport.GRATUIT && data.tarif !== 0) {
        throw new Error('Le tarif d\'un ticket gratuit doit être 0');
      }

      // Validation: tarif > 0 si payant
      if (data.categorie === CategorieTicketTransport.PAYANT && data.tarif <= 0) {
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
        status: TicketTransportStatus.ACTIF,
        estUtilise: false,
        createdBy: userId
      });

      const savedTicket = await ticketRepo.save(newTicket);

      logger.info('[TicketTransportService.createTicket] Ticket créé:', savedTicket.numeroTicket, '- QR:', savedTicket.qrCode);

      // Retourner avec les relations
      return await ticketRepo.findOne({
        where: { id: savedTicket.id },
        relations: ['circuit']
      });
    } catch (error) {
      logger.error('[TicketTransportService.createTicket] ERREUR:', error);
      throw error;
    }
  }

  /**
   * Créer plusieurs tickets identiques (émission en lot)
   */
  static async createTicketsBatch(
    tenantId: string,
    userId: string,
    data: CreateTicketsTransportBatchDTO
  ) {
    try {
      logger.info('[TicketTransportService.createTicketsBatch] Création lot:', data.quantite, 'tickets');

      const createdTickets = [];

      // Créer N tickets identiques
      for (let i = 0; i < data.quantite; i++) {
        const ticketData: CreateTicketTransportDTO = {
          circuitId: data.circuitId,
          categorie: data.categorie,
          dateVoyage: data.dateVoyage,
          tarif: data.tarif,
          dateExpiration: data.dateExpiration,
          annee: data.annee,
          messageIndication: data.messageIndication
        };

        const ticket = await this.createTicket(tenantId, userId, ticketData);
        createdTickets.push(ticket);
      }

      logger.info('[TicketTransportService.createTicketsBatch] Lot créé:', createdTickets.length);

      return {
        tickets: createdTickets,
        total: createdTickets.length,
        montantTotal: createdTickets.reduce((sum, t) => sum + Number(t.tarif), 0),
        payants: createdTickets.filter(t => t.categorie === CategorieTicketTransport.PAYANT).length,
        gratuits: createdTickets.filter(t => t.categorie === CategorieTicketTransport.GRATUIT).length
      };
    } catch (error) {
      logger.error('[TicketTransportService.createTicketsBatch] ERREUR:', error);
      throw error;
    }
  }

  /**
   * Utiliser un ticket pour un trajet (par numéro ou QR code)
   */
  static async utiliserTicket(
    tenantId: string,
    userId: string,
    data: UtiliserTicketTransportDTO
  ) {
    try {
      logger.info('[TicketTransportService.utiliserTicket] Utilisation ticket:', data.numeroTicket || data.qrCode);

      if (!data.numeroTicket && !data.qrCode) {
        throw new Error('Numéro de ticket ou QR code requis');
      }

      const ticketRepo = AppDataSource.getRepository(TicketTransport);

      // Chercher le ticket par numéro ou QR code
      const where: any = { tenantId };
      if (data.numeroTicket) {
        where.numeroTicket = data.numeroTicket;
      } else if (data.qrCode) {
        where.qrCode = data.qrCode;
      }

      const ticket = await ticketRepo.findOne({ where, relations: ['circuit'] });

      if (!ticket) {
        throw new Error('Ticket non trouvé');
      }

      // Vérifier la validité
      const validationResult = await this.verifierValidite(ticket);
      if (!validationResult.valide) {
        throw new Error(validationResult.raison);
      }

      // Marquer le ticket comme utilisé
      ticket.estUtilise = true;
      ticket.status = TicketTransportStatus.UTILISE;
      ticket.dateUtilisation = new Date();
      ticket.trajetId = data.trajetId;
      ticket.vehiculeImmatriculation = data.vehiculeImmatriculation;
      ticket.conducteur = data.conducteur;
      ticket.validePar = userId;
      ticket.updatedBy = userId;
      ticket.updatedAt = new Date();

      const updatedTicket = await ticketRepo.save(ticket);

      logger.info('[TicketTransportService.utiliserTicket] Ticket utilisé:', ticket.numeroTicket);

      return updatedTicket;
    } catch (error) {
      logger.error('[TicketTransportService.utiliserTicket] ERREUR:', error);
      throw error;
    }
  }

  /**
   * Vérifier la validité d'un ticket
   */
  static async verifierValidite(ticket: TicketTransport): Promise<{ valide: boolean; raison?: string }> {
    try {
      // Vérifier le statut
      if (ticket.status === TicketTransportStatus.ANNULE) {
        return { valide: false, raison: 'Ticket annulé' };
      }

      if (ticket.status === TicketTransportStatus.EXPIRE) {
        return { valide: false, raison: 'Ticket expiré' };
      }

      if (ticket.status === TicketTransportStatus.UTILISE) {
        return { valide: false, raison: 'Ticket déjà utilisé' };
      }

      // Vérifier l'expiration
      const now = new Date();
      const expiration = new Date(ticket.dateExpiration);

      if (expiration < now) {
        // Marquer comme expiré
        const ticketRepo = AppDataSource.getRepository(TicketTransport);
        ticket.status = TicketTransportStatus.EXPIRE;
        await ticketRepo.save(ticket);

        return { valide: false, raison: 'Ticket expiré (date dépassée)' };
      }

      // Vérifier si déjà utilisé
      if (ticket.estUtilise) {
        return { valide: false, raison: 'Ticket déjà utilisé' };
      }

      return { valide: true };
    } catch (error) {
      logger.error('[TicketTransportService.verifierValidite] ERREUR:', error);
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
      logger.info('[TicketTransportService.annulerTicket] Annulation ticket:', ticketId);

      const ticketRepo = AppDataSource.getRepository(TicketTransport);

      const ticket = await ticketRepo.findOne({
        where: { id: ticketId, tenantId }
      });

      if (!ticket) {
        throw new Error('Ticket non trouvé');
      }

      if (ticket.status === TicketTransportStatus.UTILISE) {
        throw new Error('Impossible d\'annuler un ticket déjà utilisé');
      }

      ticket.status = TicketTransportStatus.ANNULE;
      ticket.annulePar = userId;
      ticket.motifAnnulation = motif;
      ticket.updatedBy = userId;
      ticket.updatedAt = new Date();

      // TODO: Calculer remboursement si applicable
      // ticket.montantRembourse = ticket.tarif;

      await ticketRepo.save(ticket);

      logger.info('[TicketTransportService.annulerTicket] Ticket annulé');

      return ticket;
    } catch (error) {
      logger.error('[TicketTransportService.annulerTicket] ERREUR:', error);
      throw error;
    }
  }

  /**
   * Vérifier et mettre à jour les tickets expirés
   */
  static async updateExpiredTickets(tenantId: string) {
    try {
      logger.info('[TicketTransportService.updateExpiredTickets] Mise à jour tickets expirés');

      const ticketRepo = AppDataSource.getRepository(TicketTransport);
      const now = new Date();

      // Trouver tous les tickets actifs dont la date d'expiration est dépassée
      const expiredTickets = await ticketRepo
        .createQueryBuilder('ticket')
        .where('ticket.tenantId = :tenantId', { tenantId })
        .andWhere('ticket.status = :status', { status: TicketTransportStatus.ACTIF })
        .andWhere('ticket.dateExpiration < :now', { now })
        .getMany();

      for (const ticket of expiredTickets) {
        ticket.status = TicketTransportStatus.EXPIRE;
        await ticketRepo.save(ticket);
      }

      logger.info('[TicketTransportService.updateExpiredTickets] Tickets expirés mis à jour:', expiredTickets.length);

      return { updated: expiredTickets.length };
    } catch (error) {
      logger.error('[TicketTransportService.updateExpiredTickets] ERREUR:', error);
      throw error;
    }
  }
}

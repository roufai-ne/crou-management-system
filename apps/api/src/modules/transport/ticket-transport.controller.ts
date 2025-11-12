/**
 * FICHIER: apps/api/src/modules/transport/ticket-transport.controller.ts
 * CONTROLLER: TicketTransport - API REST pour tickets de transport
 *
 * DESCRIPTION:
 * Controller pour l'exposition des endpoints API de gestion des tickets de transport
 * CRUD + émission + validation + statistiques
 *
 * ENDPOINTS:
 * - GET    /api/transport/tickets
 * - GET    /api/transport/tickets/numero/:numeroTicket
 * - POST   /api/transport/tickets
 * - POST   /api/transport/tickets/batch
 * - POST   /api/transport/tickets/:id/utiliser
 * - PUT    /api/transport/tickets/:id/annuler
 *
 * AUTEUR: Équipe CROU - Module Transport
 * DATE: Janvier 2025
 */

import { Request, Response } from 'express';
import { TicketTransportService, TicketTransportFilters, CreateTicketTransportDTO, CreateTicketsTransportBatchDTO, UtiliserTicketTransportDTO } from './ticket-transport.service';
import { TicketTransportStatus, CategorieTicketTransport } from '../../../../../packages/database/src/entities/TicketTransport.entity';
import { logger } from '@/shared/utils/logger';

export class TicketTransportController {
  /**
   * GET /api/transport/tickets
   * Récupérer tous les tickets avec filtres
   */
  static async getTickets(req: Request, res: Response) {
    try {
      const tenantId = req.user?.tenantId;
      if (!tenantId) {
        return res.status(400).json({
          success: false,
          error: 'Tenant ID manquant'
        });
      }

      // Construction des filtres depuis query params
      const filters: TicketTransportFilters = {};

      if (req.query.status) {
        filters.status = req.query.status as TicketTransportStatus;
      }

      if (req.query.categorie) {
        filters.categorie = req.query.categorie as CategorieTicketTransport;
      }

      if (req.query.circuitId) {
        filters.circuitId = req.query.circuitId as string;
      }

      if (req.query.dateVoyageDebut && req.query.dateVoyageFin) {
        filters.dateVoyageDebut = new Date(req.query.dateVoyageDebut as string);
        filters.dateVoyageFin = new Date(req.query.dateVoyageFin as string);
      }

      if (req.query.numeroTicket) {
        filters.numeroTicket = req.query.numeroTicket as string;
      }

      if (req.query.qrCode) {
        filters.qrCode = req.query.qrCode as string;
      }

      if (req.query.annee) {
        filters.annee = parseInt(req.query.annee as string);
      }

      const result = await TicketTransportService.getTickets(tenantId, filters);

      res.json({
        success: true,
        data: result
      });
    } catch (error: any) {
      logger.error('[TicketTransportController.getTickets] Erreur:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Erreur lors de la récupération des tickets'
      });
    }
  }

  /**
   * GET /api/transport/tickets/numero/:numeroTicket
   * Récupérer un ticket par son numéro ou QR code
   */
  static async getTicketByNumero(req: Request, res: Response) {
    try {
      const tenantId = req.user?.tenantId;
      if (!tenantId) {
        return res.status(400).json({
          success: false,
          error: 'Tenant ID manquant'
        });
      }

      const { numeroTicket } = req.params;

      if (!numeroTicket) {
        return res.status(400).json({
          success: false,
          error: 'Numéro de ticket manquant'
        });
      }

      const ticket = await TicketTransportService.getTicketByIdentifier(numeroTicket, tenantId);

      res.json({
        success: true,
        data: ticket
      });
    } catch (error: any) {
      logger.error('[TicketTransportController.getTicketByNumero] Erreur:', error);

      if (error.message === 'Ticket non trouvé') {
        return res.status(404).json({
          success: false,
          error: error.message
        });
      }

      res.status(500).json({
        success: false,
        error: error.message || 'Erreur lors de la récupération du ticket'
      });
    }
  }

  /**
   * POST /api/transport/tickets
   * Créer un nouveau ticket de transport
   */
  static async createTicket(req: Request, res: Response) {
    try {
      const tenantId = req.user?.tenantId;
      const userId = req.user?.id;

      if (!tenantId || !userId) {
        return res.status(400).json({
          success: false,
          error: 'Informations d\'authentification manquantes'
        });
      }

      const data: CreateTicketTransportDTO = req.body;

      // Validation des champs obligatoires
      if (!data.circuitId || !data.categorie || data.tarif === undefined || !data.dateVoyage || !data.dateExpiration) {
        return res.status(400).json({
          success: false,
          error: 'Champs obligatoires manquants (circuitId, categorie, tarif, dateVoyage, dateExpiration)'
        });
      }

      // Convertir les dates si nécessaire
      if (typeof data.dateVoyage === 'string') {
        data.dateVoyage = new Date(data.dateVoyage);
      }
      if (typeof data.dateExpiration === 'string') {
        data.dateExpiration = new Date(data.dateExpiration);
      }

      const ticket = await TicketTransportService.createTicket(tenantId, userId, data);

      res.status(201).json({
        success: true,
        data: ticket,
        message: 'Ticket de transport créé avec succès'
      });
    } catch (error: any) {
      logger.error('[TicketTransportController.createTicket] Erreur:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Erreur lors de la création du ticket'
      });
    }
  }

  /**
   * POST /api/transport/tickets/batch
   * Créer plusieurs tickets identiques (émission en lot)
   */
  static async createTicketsBatch(req: Request, res: Response) {
    try {
      const tenantId = req.user?.tenantId;
      const userId = req.user?.id;

      if (!tenantId || !userId) {
        return res.status(400).json({
          success: false,
          error: 'Informations d\'authentification manquantes'
        });
      }

      const data: CreateTicketsTransportBatchDTO = req.body;

      // Validation des champs obligatoires
      if (!data.quantite || data.quantite <= 0 || !data.circuitId || !data.categorie || data.tarif === undefined || !data.dateVoyage || !data.dateExpiration) {
        return res.status(400).json({
          success: false,
          error: 'Champs obligatoires manquants ou invalides (quantite, circuitId, categorie, tarif, dateVoyage, dateExpiration)'
        });
      }

      // Limiter la quantité pour éviter les abus
      if (data.quantite > 1000) {
        return res.status(400).json({
          success: false,
          error: 'Quantité trop élevée (maximum: 1000 tickets par lot)'
        });
      }

      // Convertir les dates si nécessaire
      if (typeof data.dateVoyage === 'string') {
        data.dateVoyage = new Date(data.dateVoyage);
      }
      if (typeof data.dateExpiration === 'string') {
        data.dateExpiration = new Date(data.dateExpiration);
      }

      const result = await TicketTransportService.createTicketsBatch(tenantId, userId, data);

      res.status(201).json({
        success: true,
        data: result,
        message: `${result.total} tickets de transport créés avec succès`
      });
    } catch (error: any) {
      logger.error('[TicketTransportController.createTicketsBatch] Erreur:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Erreur lors de la création des tickets'
      });
    }
  }

  /**
   * POST /api/transport/tickets/:id/utiliser
   * Utiliser un ticket (scan QR ou saisie numéro)
   */
  static async utiliserTicket(req: Request, res: Response) {
    try {
      const tenantId = req.user?.tenantId;
      const userId = req.user?.id;

      if (!tenantId || !userId) {
        return res.status(400).json({
          success: false,
          error: 'Informations d\'authentification manquantes'
        });
      }

      const data: UtiliserTicketTransportDTO = req.body;

      // Validation: au moins un identifiant requis
      if (!data.numeroTicket && !data.qrCode) {
        return res.status(400).json({
          success: false,
          error: 'Numéro de ticket ou QR code requis'
        });
      }

      const ticket = await TicketTransportService.utiliserTicket(tenantId, userId, data);

      res.json({
        success: true,
        data: ticket,
        message: 'Ticket utilisé avec succès'
      });
    } catch (error: any) {
      logger.error('[TicketTransportController.utiliserTicket] Erreur:', error);

      // Messages d'erreur spécifiques
      if (error.message.includes('non trouvé')) {
        return res.status(404).json({
          success: false,
          error: error.message
        });
      }

      if (error.message.includes('déjà utilisé') || error.message.includes('expiré') || error.message.includes('annulé')) {
        return res.status(400).json({
          success: false,
          error: error.message
        });
      }

      res.status(500).json({
        success: false,
        error: error.message || 'Erreur lors de l\'utilisation du ticket'
      });
    }
  }

  /**
   * PUT /api/transport/tickets/:id/annuler
   * Annuler un ticket
   */
  static async annulerTicket(req: Request, res: Response) {
    try {
      const tenantId = req.user?.tenantId;
      const userId = req.user?.id;

      if (!tenantId || !userId) {
        return res.status(400).json({
          success: false,
          error: 'Informations d\'authentification manquantes'
        });
      }

      const { id } = req.params;
      const { motif } = req.body;

      if (!id) {
        return res.status(400).json({
          success: false,
          error: 'ID de ticket manquant'
        });
      }

      if (!motif) {
        return res.status(400).json({
          success: false,
          error: 'Motif d\'annulation requis'
        });
      }

      const ticket = await TicketTransportService.annulerTicket(id, tenantId, userId, motif);

      res.json({
        success: true,
        data: ticket,
        message: 'Ticket annulé avec succès'
      });
    } catch (error: any) {
      logger.error('[TicketTransportController.annulerTicket] Erreur:', error);

      if (error.message === 'Ticket non trouvé') {
        return res.status(404).json({
          success: false,
          error: error.message
        });
      }

      if (error.message.includes('Impossible')) {
        return res.status(400).json({
          success: false,
          error: error.message
        });
      }

      res.status(500).json({
        success: false,
        error: error.message || 'Erreur lors de l\'annulation du ticket'
      });
    }
  }

  /**
   * POST /api/transport/tickets/expired/update
   * Mettre à jour les tickets expirés (tâche de maintenance)
   */
  static async updateExpiredTickets(req: Request, res: Response) {
    try {
      const tenantId = req.user?.tenantId;

      if (!tenantId) {
        return res.status(400).json({
          success: false,
          error: 'Tenant ID manquant'
        });
      }

      const result = await TicketTransportService.updateExpiredTickets(tenantId);

      res.json({
        success: true,
        data: result,
        message: `${result.updated} tickets expirés mis à jour`
      });
    } catch (error: any) {
      logger.error('[TicketTransportController.updateExpiredTickets] Erreur:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Erreur lors de la mise à jour des tickets expirés'
      });
    }
  }
}

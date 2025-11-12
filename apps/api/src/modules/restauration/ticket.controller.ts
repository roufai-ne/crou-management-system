/**
 * FICHIER: apps/api/src/modules/restauration/ticket.controller.ts
 * CONTROLLER: Ticket - Gestion des tickets repas
 *
 * DESCRIPTION:
 * Controller Express pour les endpoints REST du module Tickets
 * Émission, utilisation et suivi des tickets repas
 * Support tickets unitaires, forfaits, gratuits
 * Support multi-tenant strict
 *
 * AUTEUR: Équipe CROU - Module Restauration
 * DATE: Janvier 2025
 */

import { Request, Response } from 'express';
import { TicketService, TicketFilters, CreateTicketDTO, CreateTicketsBatchDTO, UtiliserTicketDTO } from './ticket.service';
import { TicketStatus, CategorieTicket } from '@crou/database';
import { logger } from '@/shared/utils/logger';

// ========================================
// CONTROLLER
// ========================================

export class TicketController {
  /**
   * GET /api/restauration/tickets
   * Récupérer tous les tickets avec filtres
   */
  static async getTickets(req: Request, res: Response) {
    try {
      const tenantId = (req as any).user?.tenantId;
      if (!tenantId) {
        return res.status(401).json({
          success: false,
          error: 'Tenant ID manquant'
        });
      }

      // Extraire les filtres de la query string
      const {
        status,
        type,
        categorie,
        dateEmissionDebut,
        dateEmissionFin,
        numeroTicket
      } = req.query;

      const filters: TicketFilters = {
        status: status && status !== 'all' ? status as TicketStatus : undefined,
        categorie: categorie && categorie !== 'all' ? categorie as CategorieTicket : undefined,
        dateEmissionDebut: dateEmissionDebut ? new Date(dateEmissionDebut as string) : undefined,
        dateEmissionFin: dateEmissionFin ? new Date(dateEmissionFin as string) : undefined,
        numeroTicket: numeroTicket as string
      };

      const result = await TicketService.getTickets(tenantId, filters);

      res.json({
        success: true,
        data: result
      });
    } catch (error: any) {
      logger.error('[TicketController.getTickets] ERREUR:', error);
      res.status(500).json({
        success: false,
        error: 'Erreur serveur',
        message: error.message
      });
    }
  }

  /**
   * GET /api/restauration/tickets/numero/:numeroTicket
   * Récupérer un ticket par numéro
   */
  static async getTicketByNumero(req: Request, res: Response) {
    try {
      const tenantId = (req as any).user?.tenantId;
      if (!tenantId) {
        return res.status(401).json({
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

      const ticket = await TicketService.getTicketByIdentifier(numeroTicket, tenantId);

      res.json({
        success: true,
        data: ticket
      });
    } catch (error: any) {
      logger.error('[TicketController.getTicketByNumero] ERREUR:', error);

      if (error.message === 'Ticket non trouvé') {
        return res.status(404).json({
          success: false,
          error: error.message
        });
      }

      res.status(500).json({
        success: false,
        error: 'Erreur serveur',
        message: error.message
      });
    }
  }

  // Note: getTicketsByEtudiant supprimée - tickets anonymes

  /**
   * POST /api/restauration/tickets
   * Créer un nouveau ticket
   */
  static async createTicket(req: Request, res: Response) {
    try {
      const tenantId = (req as any).user?.tenantId;
      const userId = (req as any).user?.userId;

      if (!tenantId || !userId) {
        return res.status(401).json({
          success: false,
          error: 'Authentification invalide'
        });
      }

      const data: CreateTicketDTO = req.body;

      // Validation des champs obligatoires
      if (!data.categorie || !data.typeRepas || data.tarif === undefined || !data.dateExpiration) {
        return res.status(400).json({
          success: false,
          error: 'Champs obligatoires manquants (categorie, typeRepas, tarif, dateExpiration)'
        });
      }

      const ticket = await TicketService.createTicket(tenantId, userId, data);

      res.status(201).json({
        success: true,
        data: ticket
      });
    } catch (error: any) {
      logger.error('[TicketController.createTicket] ERREUR:', error);

      res.status(500).json({
        success: false,
        error: 'Erreur serveur',
        message: error.message
      });
    }
  }

  /**
   * POST /api/restauration/tickets/batch
   * Créer plusieurs tickets (émission en lot)
   */
  static async createTicketsBatch(req: Request, res: Response) {
    try {
      const tenantId = (req as any).user?.tenantId;
      const userId = (req as any).user?.userId;

      if (!tenantId || !userId) {
        return res.status(401).json({
          success: false,
          error: 'Authentification invalide'
        });
      }

      const data: CreateTicketsBatchDTO = req.body;

      if (!data.quantite || data.quantite <= 0 || !data.categorie || !data.typeRepas || data.tarif === undefined || !data.dateExpiration) {
        return res.status(400).json({
          success: false,
          error: 'Champs obligatoires manquants ou invalides (quantite, categorie, typeRepas, tarif, dateExpiration)'
        });
      }

      const result = await TicketService.createTicketsBatch(tenantId, userId, data);

      res.status(201).json({
        success: true,
        data: result
      });
    } catch (error: any) {
      logger.error('[TicketController.createTicketsBatch] ERREUR:', error);
      res.status(500).json({
        success: false,
        error: 'Erreur serveur',
        message: error.message
      });
    }
  }

  /**
   * POST /api/restauration/tickets/utiliser
   * Utiliser un ticket pour un repas
   */
  static async utiliserTicket(req: Request, res: Response) {
    try {
      const tenantId = (req as any).user?.tenantId;
      const userId = (req as any).user?.userId;

      if (!tenantId || !userId) {
        return res.status(401).json({
          success: false,
          error: 'Authentification invalide'
        });
      }

      const data: UtiliserTicketDTO = req.body;

      // Validation des champs obligatoires
      if (!data.numeroTicket || !data.repasId || !data.restaurantId) {
        return res.status(400).json({
          success: false,
          error: 'Champs obligatoires manquants (numeroTicket, repasId, restaurantId)'
        });
      }

      const ticket = await TicketService.utiliserTicket(tenantId, userId, data);

      res.json({
        success: true,
        data: ticket
      });
    } catch (error: any) {
      logger.error('[TicketController.utiliserTicket] ERREUR:', error);

      if (error.message === 'Ticket non trouvé') {
        return res.status(404).json({
          success: false,
          error: error.message
        });
      }

      if (
        error.message.includes('annulé') ||
        error.message.includes('suspendu') ||
        error.message.includes('expiré') ||
        error.message.includes('utilisé') ||
        error.message.includes('Aucun repas restant')
      ) {
        return res.status(403).json({
          success: false,
          error: error.message
        });
      }

      res.status(500).json({
        success: false,
        error: 'Erreur serveur',
        message: error.message
      });
    }
  }

  /**
   * POST /api/restauration/tickets/:id/annuler
   * Annuler un ticket
   */
  static async annulerTicket(req: Request, res: Response) {
    try {
      const tenantId = (req as any).user?.tenantId;
      const userId = (req as any).user?.userId;

      if (!tenantId || !userId) {
        return res.status(401).json({
          success: false,
          error: 'Authentification invalide'
        });
      }

      const { id } = req.params;
      const { motif } = req.body;

      if (!id) {
        return res.status(400).json({
          success: false,
          error: 'ID ticket manquant'
        });
      }

      if (!motif) {
        return res.status(400).json({
          success: false,
          error: 'Motif d\'annulation manquant'
        });
      }

      const ticket = await TicketService.annulerTicket(id, tenantId, userId, motif);

      res.json({
        success: true,
        data: ticket
      });
    } catch (error: any) {
      logger.error('[TicketController.annulerTicket] ERREUR:', error);

      if (error.message === 'Ticket non trouvé') {
        return res.status(404).json({
          success: false,
          error: error.message
        });
      }

      if (error.message === 'Impossible d\'annuler un ticket déjà utilisé') {
        return res.status(403).json({
          success: false,
          error: error.message
        });
      }

      res.status(500).json({
        success: false,
        error: 'Erreur serveur',
        message: error.message
      });
    }
  }

  /**
   * POST /api/restauration/tickets/expired/update
   * Mettre à jour les tickets expirés (tâche périodique)
   */
  static async updateExpiredTickets(req: Request, res: Response) {
    try {
      const tenantId = (req as any).user?.tenantId;

      if (!tenantId) {
        return res.status(401).json({
          success: false,
          error: 'Tenant ID manquant'
        });
      }

      const result = await TicketService.updateExpiredTickets(tenantId);

      res.json({
        success: true,
        data: result
      });
    } catch (error: any) {
      logger.error('[TicketController.updateExpiredTickets] ERREUR:', error);
      res.status(500).json({
        success: false,
        error: 'Erreur serveur',
        message: error.message
      });
    }
  }
}

/**
 * FICHIER: apps/api/src/modules/housing/occupancy.controller.ts
 * CONTROLLER: OccupancyController - API REST pour les occupations
 *
 * DESCRIPTION:
 * Controller pour exposer les endpoints de gestion des occupations
 * CRUD + actions métier (libération, paiements, statistiques)
 *
 * AUTEUR: Équipe CROU
 * DATE: Janvier 2025
 */

import { Router, Request, Response } from 'express';
import { HousingOccupancyService } from './services/HousingOccupancyService';
import { authenticateJWT } from '@/shared/middlewares/auth.middleware';
import { injectTenantIdMiddleware } from '@/shared/middlewares/tenant-isolation.middleware';
import { validate } from 'class-validator';
import { plainToClass } from 'class-transformer';

const router = Router();
const occupancyService = new HousingOccupancyService();

// Tous les endpoints nécessitent l'authentification
router.use(authenticateJWT);

// Tous les endpoints utilisent l'isolation tenant
router.use(injectTenantIdMiddleware({ strictMode: false }));

/**
 * GET /api/housing/occupancies
 * Récupérer toutes les occupations avec filtres
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const tenantId = req.user.tenantId;
    const filters = {
      status: req.query.status as string,
      complexId: req.query.complexId as string,
      roomId: req.query.roomId as string,
      studentId: req.query.studentId as string,
      search: req.query.search as string
    };

    const result = await occupancyService.getAll(tenantId, filters);
    res.json(result);
  } catch (error) {
    console.error('Erreur récupération occupations:', error);
    res.status(500).json({
      message: 'Erreur lors de la récupération des occupations',
      error: error.message
    });
  }
});

/**
 * GET /api/housing/occupancies/stats
 * Récupérer les statistiques des occupations
 */
router.get('/stats', async (req: Request, res: Response) => {
  try {
    const tenantId = req.user.tenantId;
    const stats = await occupancyService.getStats(tenantId);
    res.json(stats);
  } catch (error) {
    console.error('Erreur récupération stats occupations:', error);
    res.status(500).json({
      message: 'Erreur lors de la récupération des statistiques',
      error: error.message
    });
  }
});

/**
 * GET /api/housing/occupancies/expiring
 * Récupérer les occupations expirant bientôt
 */
router.get('/expiring', async (req: Request, res: Response) => {
  try {
    const tenantId = req.user.tenantId;
    const days = req.query.days ? parseInt(req.query.days as string) : 30;
    const expiring = await occupancyService.getExpiring(tenantId, days);
    res.json(expiring);
  } catch (error) {
    console.error('Erreur récupération occupations expirant:', error);
    res.status(500).json({
      message: 'Erreur lors de la récupération des occupations expirant',
      error: error.message
    });
  }
});

/**
 * GET /api/housing/occupancies/unpaid-rents
 * Récupérer les occupations avec loyers impayés
 */
router.get('/unpaid-rents', async (req: Request, res: Response) => {
  try {
    const tenantId = req.user.tenantId;
    const unpaid = await occupancyService.getUnpaidRents(tenantId);
    res.json(unpaid);
  } catch (error) {
    console.error('Erreur récupération loyers impayés:', error);
    res.status(500).json({
      message: 'Erreur lors de la récupération des loyers impayés',
      error: error.message
    });
  }
});

/**
 * GET /api/housing/occupancies/:id
 * Récupérer une occupation par ID
 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const tenantId = req.user.tenantId;
    const { id } = req.params;
    const occupancy = await occupancyService.getById(tenantId, id);
    res.json(occupancy);
  } catch (error) {
    console.error('Erreur récupération occupation:', error);
    res.status(error.message.includes('introuvable') ? 404 : 500).json({
      message: error.message || 'Erreur lors de la récupération de l\'occupation'
    });
  }
});

/**
 * POST /api/housing/occupancies
 * Créer une nouvelle occupation
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const tenantId = req.user.tenantId;
    const userId = req.user.id;

    const data = {
      ...req.body,
      createdBy: userId
    };

    const occupancy = await occupancyService.create(tenantId, data);
    res.status(201).json(occupancy);
  } catch (error) {
    console.error('Erreur création occupation:', error);
    res.status(400).json({
      message: error.message || 'Erreur lors de la création de l\'occupation'
    });
  }
});

/**
 * PATCH /api/housing/occupancies/:id
 * Mettre à jour une occupation
 */
router.patch('/:id', async (req: Request, res: Response) => {
  try {
    const tenantId = req.user.tenantId;
    const userId = req.user.id;
    const { id } = req.params;

    const data = {
      ...req.body,
      updatedBy: userId
    };

    const occupancy = await occupancyService.update(tenantId, id, data);
    res.json(occupancy);
  } catch (error) {
    console.error('Erreur mise à jour occupation:', error);
    res.status(error.message.includes('introuvable') ? 404 : 400).json({
      message: error.message || 'Erreur lors de la mise à jour de l\'occupation'
    });
  }
});

/**
 * POST /api/housing/occupancies/:id/release
 * Libérer une chambre (terminer occupation)
 */
router.post('/:id/release', async (req: Request, res: Response) => {
  try {
    const tenantId = req.user.tenantId;
    const userId = req.user.id;
    const { id } = req.params;

    const occupancy = await occupancyService.release(tenantId, id, userId);
    res.json(occupancy);
  } catch (error) {
    console.error('Erreur libération chambre:', error);
    res.status(error.message.includes('introuvable') ? 404 : 400).json({
      message: error.message || 'Erreur lors de la libération de la chambre'
    });
  }
});

/**
 * POST /api/housing/occupancies/:id/rent-paid
 * Marquer le loyer comme payé
 */
router.post('/:id/rent-paid', async (req: Request, res: Response) => {
  try {
    const tenantId = req.user.tenantId;
    const userId = req.user.id;
    const { id } = req.params;

    const occupancy = await occupancyService.markRentPaid(tenantId, id, userId);
    res.json(occupancy);
  } catch (error) {
    console.error('Erreur marquage loyer payé:', error);
    res.status(error.message.includes('introuvable') ? 404 : 400).json({
      message: error.message || 'Erreur lors du marquage du loyer'
    });
  }
});

/**
 * GET /api/housing/occupancies/rooms/:roomId/beds/available
 * Récupérer les lits disponibles d'une chambre
 */
router.get('/rooms/:roomId/beds/available', async (req: Request, res: Response) => {
  try {
    const { roomId } = req.params;
    const availableBeds = await occupancyService.getAvailableBeds(roomId);
    res.json(availableBeds);
  } catch (error) {
    console.error('Erreur récupération lits disponibles:', error);
    res.status(500).json({
      message: 'Erreur lors de la récupération des lits disponibles',
      error: error.message
    });
  }
});

/**
 * GET /api/housing/occupancies/rooms/:roomId/beds
 * Récupérer tous les lits d'une chambre avec leur statut
 */
router.get('/rooms/:roomId/beds', async (req: Request, res: Response) => {
  try {
    const { roomId } = req.params;
    const beds = await occupancyService.getRoomBeds(roomId);
    res.json(beds);
  } catch (error) {
    console.error('Erreur récupération lits chambre:', error);
    res.status(500).json({
      message: 'Erreur lors de la récupération des lits de la chambre',
      error: error.message
    });
  }
});

export default router;

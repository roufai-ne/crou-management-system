/**
 * FICHIER: apps/api/src/modules/housing/bed.controller.ts
 * CONTROLLER: BedController - API REST pour les lits
 *
 * DESCRIPTION:
 * Controller pour la gestion des LITS
 * Les lits sont au cœur du système de logement
 * CRUD complet + actions métier (maintenance, statistiques)
 *
 * AUTEUR: Équipe CROU
 * DATE: Janvier 2025
 */

import { Router, Request, Response } from 'express';
import { BedService } from './services/BedService';
import { authenticateJWT } from '@/shared/middlewares/auth.middleware';
import { injectTenantIdMiddleware } from '@/shared/middlewares/tenant-isolation.middleware';

const router = Router();
const bedService = new BedService();

// Tous les endpoints nécessitent l'authentification
router.use(authenticateJWT);

// Tous les endpoints utilisent l'isolation tenant
router.use(injectTenantIdMiddleware({ strictMode: false }));

/**
 * GET /api/housing/beds
 * Récupérer tous les lits avec filtres
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const filters = {
      roomId: req.query.roomId as string,
      complexId: req.query.complexId as string,
      status: req.query.status as string,
      search: req.query.search as string,
      isActive: req.query.isActive ? req.query.isActive === 'true' : undefined
    };

    const result = await bedService.getAll(filters);
    res.json(result);
  } catch (error) {
    console.error('Erreur récupération lits:', error);
    res.status(500).json({
      message: 'Erreur lors de la récupération des lits',
      error: error.message
    });
  }
});

/**
 * GET /api/housing/beds/stats
 * Statistiques globales des lits
 */
router.get('/stats', async (req: Request, res: Response) => {
  try {
    const tenantId = req.user.tenantId;
    const stats = await bedService.getGlobalStats(tenantId);
    res.json(stats);
  } catch (error) {
    console.error('Erreur récupération stats lits:', error);
    res.status(500).json({
      message: 'Erreur lors de la récupération des statistiques',
      error: error.message
    });
  }
});

/**
 * GET /api/housing/beds/complex/:complexId
 * Récupérer les lits d'un complexe
 */
router.get('/complex/:complexId', async (req: Request, res: Response) => {
  try {
    const { complexId } = req.params;
    const beds = await bedService.getByComplex(complexId);
    res.json(beds);
  } catch (error) {
    console.error('Erreur récupération lits complexe:', error);
    res.status(500).json({
      message: 'Erreur lors de la récupération des lits du complexe',
      error: error.message
    });
  }
});

/**
 * GET /api/housing/beds/complex/:complexId/stats
 * Statistiques des lits d'un complexe
 */
router.get('/complex/:complexId/stats', async (req: Request, res: Response) => {
  try {
    const { complexId } = req.params;
    const stats = await bedService.getStatsByComplex(complexId);
    res.json(stats);
  } catch (error) {
    console.error('Erreur récupération stats complexe:', error);
    res.status(500).json({
      message: 'Erreur lors de la récupération des statistiques du complexe',
      error: error.message
    });
  }
});

/**
 * GET /api/housing/beds/room/:roomId
 * Récupérer les lits d'une chambre
 */
router.get('/room/:roomId', async (req: Request, res: Response) => {
  try {
    const { roomId } = req.params;
    const beds = await bedService.getByRoom(roomId);
    res.json(beds);
  } catch (error) {
    console.error('Erreur récupération lits chambre:', error);
    res.status(500).json({
      message: 'Erreur lors de la récupération des lits de la chambre',
      error: error.message
    });
  }
});

/**
 * GET /api/housing/beds/room/:roomId/available
 * Récupérer les lits disponibles d'une chambre
 */
router.get('/room/:roomId/available', async (req: Request, res: Response) => {
  try {
    const { roomId } = req.params;
    const beds = await bedService.getAvailableByRoom(roomId);
    res.json(beds);
  } catch (error) {
    console.error('Erreur récupération lits disponibles:', error);
    res.status(500).json({
      message: 'Erreur lors de la récupération des lits disponibles',
      error: error.message
    });
  }
});

/**
 * GET /api/housing/beds/room/:roomId/stats
 * Statistiques des lits d'une chambre
 */
router.get('/room/:roomId/stats', async (req: Request, res: Response) => {
  try {
    const { roomId } = req.params;
    const stats = await bedService.getStatsByRoom(roomId);
    res.json(stats);
  } catch (error) {
    console.error('Erreur récupération stats chambre:', error);
    res.status(500).json({
      message: 'Erreur lors de la récupération des statistiques de la chambre',
      error: error.message
    });
  }
});

/**
 * GET /api/housing/beds/:id
 * Récupérer un lit par ID
 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const bed = await bedService.getById(id);
    res.json(bed);
  } catch (error) {
    console.error('Erreur récupération lit:', error);
    res.status(error.message.includes('introuvable') ? 404 : 500).json({
      message: error.message || 'Erreur lors de la récupération du lit'
    });
  }
});

/**
 * POST /api/housing/beds
 * Créer un nouveau lit
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const userId = req.user.id;

    const data = {
      ...req.body,
      createdBy: userId
    };

    const bed = await bedService.create(data);
    res.status(201).json(bed);
  } catch (error) {
    console.error('Erreur création lit:', error);
    res.status(400).json({
      message: error.message || 'Erreur lors de la création du lit'
    });
  }
});

/**
 * POST /api/housing/beds/room/:roomId/generate
 * Générer automatiquement les lits pour une chambre
 */
router.post('/room/:roomId/generate', async (req: Request, res: Response) => {
  try {
    const { roomId } = req.params;
    const { capacity } = req.body;
    const userId = req.user.id;

    if (!capacity || capacity < 1) {
      return res.status(400).json({
        message: 'La capacité doit être supérieure à 0'
      });
    }

    const beds = await bedService.generateBedsForRoom(roomId, capacity, userId);
    res.status(201).json(beds);
  } catch (error) {
    console.error('Erreur génération lits:', error);
    res.status(400).json({
      message: error.message || 'Erreur lors de la génération des lits'
    });
  }
});

/**
 * PATCH /api/housing/beds/:id
 * Mettre à jour un lit
 */
router.patch('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const data = {
      ...req.body,
      updatedBy: userId
    };

    const bed = await bedService.update(id, data);
    res.json(bed);
  } catch (error) {
    console.error('Erreur mise à jour lit:', error);
    res.status(error.message.includes('introuvable') ? 404 : 400).json({
      message: error.message || 'Erreur lors de la mise à jour du lit'
    });
  }
});

/**
 * POST /api/housing/beds/:id/maintenance
 * Mettre un lit en maintenance
 */
router.post('/:id/maintenance', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { notes } = req.body;
    const userId = req.user.id;

    const bed = await bedService.setMaintenance(id, userId, notes);
    res.json(bed);
  } catch (error) {
    console.error('Erreur mise en maintenance:', error);
    res.status(error.message.includes('introuvable') ? 404 : 400).json({
      message: error.message || 'Erreur lors de la mise en maintenance'
    });
  }
});

/**
 * POST /api/housing/beds/:id/available
 * Remettre un lit en service (disponible)
 */
router.post('/:id/available', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const bed = await bedService.setAvailable(id, userId);
    res.json(bed);
  } catch (error) {
    console.error('Erreur remise en service:', error);
    res.status(error.message.includes('introuvable') ? 404 : 400).json({
      message: error.message || 'Erreur lors de la remise en service'
    });
  }
});

/**
 * POST /api/housing/beds/:id/out-of-service
 * Mettre un lit hors service
 */
router.post('/:id/out-of-service', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const userId = req.user.id;

    const bed = await bedService.setOutOfService(id, userId, reason);
    res.json(bed);
  } catch (error) {
    console.error('Erreur mise hors service:', error);
    res.status(error.message.includes('introuvable') ? 404 : 400).json({
      message: error.message || 'Erreur lors de la mise hors service'
    });
  }
});

/**
 * DELETE /api/housing/beds/:id
 * Supprimer un lit
 */
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    await bedService.delete(id);
    res.json({ message: 'Lit supprimé avec succès' });
  } catch (error) {
    console.error('Erreur suppression lit:', error);
    res.status(error.message.includes('introuvable') ? 404 : 400).json({
      message: error.message || 'Erreur lors de la suppression du lit'
    });
  }
});

export default router;

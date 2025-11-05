/**
 * FICHIER: apps/api/src/modules/transport/transport-metrics.controller.ts
 * CONTROLLER: TransportMetricsController - Métriques globales du transport
 *
 * DESCRIPTION:
 * Contrôleur pour l'endpoint de métriques agrégées du module transport
 * Fournit une vue d'ensemble complète des performances
 *
 * ENDPOINTS:
 * - GET /api/transport/metrics - Métriques complètes du transport
 *
 * AUTEUR: Équipe CROU
 * DATE: Octobre 2025
 */

import { Request, Response } from 'express';
import { TransportMetricsService } from './transport-metrics.service';
import { logger } from '@/shared/utils/logger';

export class TransportMetricsController {
  private static metricsService = new TransportMetricsService();

  /**
   * GET /api/transport/metrics
   * Obtenir toutes les métriques du module transport
   */
  static async getMetrics(req: Request, res: Response) {
    try {
      const tenantId = (req as any).user?.tenantId;
      if (!tenantId) {
        return res.status(401).json({
          success: false,
          message: 'Tenant non identifié'
        });
      }

      const filters = {
        dateFrom: req.query.dateFrom as string,
        dateTo: req.query.dateTo as string
      };

      const result = await TransportMetricsController.metricsService.getAllMetrics(tenantId, filters);
      res.json(result);
    } catch (error) {
      logger.error('Erreur getMetrics:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération des métriques',
        error: error instanceof Error ? error.message : 'Erreur inconnue'
      });
    }
  }
}

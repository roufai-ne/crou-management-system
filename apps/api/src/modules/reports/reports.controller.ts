/**
 * FICHIER: apps\api\src\modules\reports\reports.controller.ts
 * CONTROLLER: Module Rapports
 *
 * DESCRIPTION:
 * Contrôleur pour le module de génération de rapports
 *
 * AUTEUR: Équipe CROU
 * DATE: Décembre 2024
 */

import { Request, Response } from 'express';
import { ReportsService } from './reports.service';
import { ReportsExportService } from './reports.export.service';

export class ReportsController {
  static async getAllReports(req: Request, res: Response) {
    try {
      const tenantId = (req as any).user?.tenantId;

      if (!tenantId) {
        return res.status(401).json({
          success: false,
          error: 'Tenant ID manquant'
        });
      }

      const result = await ReportsService.getAllReports(tenantId, req.query);

      res.json({ success: true, data: result });
    } catch (error) {
      console.error('Erreur getAllReports:', error);
      res.status(500).json({
        success: false,
        error: 'Erreur lors de la récupération des rapports'
      });
    }
  }

  static async getReport(req: Request, res: Response) {
    try {
      const { reportId } = req.params;
      const tenantId = (req as any).user?.tenantId;

      if (!tenantId) {
        return res.status(401).json({
          success: false,
          error: 'Tenant ID manquant'
        });
      }

      const report = await ReportsService.getReport(reportId, tenantId);

      res.json({ success: true, data: { report } });
    } catch (error) {
      console.error('Erreur getReport:', error);
      res.status(500).json({
        success: false,
        error: 'Erreur lors de la récupération du rapport'
      });
    }
  }

  static async generateReport(req: Request, res: Response) {
    try {
      const { type, startDate, endDate } = req.body;
      const tenantId = (req as any).user?.tenantId;
      const userId = (req as any).user?.userId;

      if (!tenantId || !userId) {
        return res.status(401).json({
          success: false,
          error: 'Authentification manquante'
        });
      }

      const parsedStartDate = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const parsedEndDate = endDate ? new Date(endDate) : new Date();

      let report;

      switch (type) {
        case 'financial':
          report = await ReportsService.generateFinancialReport(
            tenantId,
            parsedStartDate,
            parsedEndDate,
            userId
          );
          break;
        case 'housing':
          report = await ReportsService.generateHousingReport(
            tenantId,
            parsedStartDate,
            parsedEndDate,
            userId
          );
          break;
        case 'stocks':
          report = await ReportsService.generateStocksReport(
            tenantId,
            parsedStartDate,
            parsedEndDate,
            userId
          );
          break;
        case 'audit':
          report = await ReportsService.generateAuditReport(
            tenantId,
            parsedStartDate,
            parsedEndDate,
            userId
          );
          break;
        default:
          return res.status(400).json({
            success: false,
            error: 'Type de rapport invalide'
          });
      }

      res.json({ success: true, data: report });
    } catch (error) {
      console.error('Erreur generateReport:', error);
      res.status(500).json({
        success: false,
        error: 'Erreur lors de la génération du rapport'
      });
    }
  }

  static async exportReport(req: Request, res: Response) {
    try {
      const { reportId } = req.params;
      const { format = 'pdf' } = req.query;
      const tenantId = (req as any).user?.tenantId;

      if (!tenantId) {
        return res.status(401).json({
          success: false,
          error: 'Tenant ID manquant'
        });
      }

      const result = await ReportsService.exportReport(
        reportId,
        tenantId,
        format as 'pdf' | 'excel' | 'csv'
      );

      res.json(result);
    } catch (error) {
      console.error('Erreur exportReport:', error);
      res.status(500).json({
        success: false,
        error: "Erreur lors de l'export du rapport"
      });
    }
  }

  static async deleteReport(req: Request, res: Response) {
    try {
      const { reportId } = req.params;
      const tenantId = (req as any).user?.tenantId;

      if (!tenantId) {
        return res.status(401).json({
          success: false,
          error: 'Tenant ID manquant'
        });
      }

      const result = await ReportsService.deleteReport(reportId, tenantId);

      res.json(result);
    } catch (error) {
      console.error('Erreur deleteReport:', error);
      res.status(500).json({
        success: false,
        error: 'Erreur lors de la suppression du rapport'
      });
    }
  }

  /**
   * Exporter un rapport en format Excel
   */
  static async exportToExcel(req: Request, res: Response) {
    try {
      const { reportId } = req.params;
      const tenantId = (req as any).user?.tenantId;
      const userName = (req as any).user?.name || 'Utilisateur';

      if (!tenantId) {
        return res.status(401).json({
          success: false,
          error: 'Tenant ID manquant'
        });
      }

      // Récupérer le rapport
      const report = await ReportsService.getReport(reportId, tenantId);
      const reportFilters = report.filters || {};

      // Préparer les données pour l'export
      const reportData = {
        title: report.title || 'Rapport',
        subtitle: report.description,
        period: {
          start: reportFilters.startDate ? new Date(reportFilters.startDate) : new Date(),
          end: reportFilters.endDate ? new Date(reportFilters.endDate) : new Date()
        },
        crouName: reportFilters.crouName,
        generatedBy: userName,
        generatedAt: new Date(),
        sections: reportFilters.sections || [],
        summary: reportFilters.summary
      };

      // Générer le fichier Excel
      const buffer = await ReportsExportService.exportToExcel(reportData);

      // Définir les headers pour le téléchargement
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="rapport_${reportId}_${Date.now()}.xlsx"`);
      res.setHeader('Content-Length', buffer.length);

      res.send(buffer);
    } catch (error) {
      console.error('Erreur exportToExcel:', error);
      res.status(500).json({
        success: false,
        error: "Erreur lors de l'export Excel du rapport"
      });
    }
  }

  /**
   * Exporter un rapport en format PDF
   */
  static async exportToPDF(req: Request, res: Response) {
    try {
      const { reportId } = req.params;
      const tenantId = (req as any).user?.tenantId;
      const userName = (req as any).user?.name || 'Utilisateur';

      if (!tenantId) {
        return res.status(401).json({
          success: false,
          error: 'Tenant ID manquant'
        });
      }

      // Récupérer le rapport
      const report = await ReportsService.getReport(reportId, tenantId);
      const reportFilters = report.filters || {};

      // Préparer les données pour l'export
      const reportData = {
        title: report.title || 'Rapport',
        subtitle: report.description,
        period: {
          start: reportFilters.startDate ? new Date(reportFilters.startDate) : new Date(),
          end: reportFilters.endDate ? new Date(reportFilters.endDate) : new Date()
        },
        crouName: reportFilters.crouName,
        generatedBy: userName,
        generatedAt: new Date(),
        sections: reportFilters.sections || [],
        summary: reportFilters.summary
      };

      // Générer le fichier PDF
      const buffer = await ReportsExportService.exportToPDF(reportData);

      // Définir les headers pour le téléchargement
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="rapport_${reportId}_${Date.now()}.pdf"`);
      res.setHeader('Content-Length', buffer.length);

      res.send(buffer);
    } catch (error) {
      console.error('Erreur exportToPDF:', error);
      res.status(500).json({
        success: false,
        error: "Erreur lors de l'export PDF du rapport"
      });
    }
  }

  /**
   * Obtenir la liste des jobs de génération de rapports
   */
  static async getJobs(req: Request, res: Response) {
    try {
      const tenantId = (req as any).user?.tenantId;

      if (!tenantId) {
        return res.status(401).json({
          success: false,
          error: 'Tenant ID manquant'
        });
      }

      // Pour l'instant, retourner une liste vide
      // TODO: Implémenter la gestion des jobs de génération de rapports avec une queue
      const jobs = [];

      res.json({
        success: true,
        data: {
          jobs,
          total: 0,
          pagination: {
            page: 1,
            limit: 10,
            total: 0,
            pages: 0
          }
        }
      });
    } catch (error) {
      console.error('Erreur getJobs:', error);
      res.status(500).json({
        success: false,
        error: 'Erreur lors de la récupération des jobs'
      });
    }
  }
}

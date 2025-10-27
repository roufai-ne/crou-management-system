/**
 * FICHIER: apps\api\src\modules\reports\reports.service.ts
 * SERVICE: ReportsService - Gestion des rapports
 * 
 * DESCRIPTION:
 * Service pour la génération de rapports Excel/PDF
 * Intégration avec les modules métier
 * Support multi-tenant avec permissions
 * 
 * FONCTIONNALITÉS:
 * - Génération de rapports Excel/PDF
 * - Intégration avec les modules métier
 * - Gestion des templates et formats
 * - Support multilingue
 * - Cache et optimisation
 * 
 * AUTEUR: Équipe CROU
 * DATE: Décembre 2024
 */

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { 
  ExcelReportGenerator, 
  PDFReportGenerator,
  FinancialExcelReport,
  FinancialPDFReport,
  ReportFormatter
} from '@crou/reports';
import { ReportConfig, ReportType, ReportFormat, ReportResult } from '@crou/reports';
import { logger } from '@/shared/utils/logger';

// Interfaces pour les données de rapport
interface FinancialReportData {
  budgets: Array<{
    id: string;
    title: string;
    category: string;
    amount: number;
    spent: number;
    status: string;
    createdAt: Date;
  }>;
  transactions: Array<{
    id: string;
    description: string;
    amount: number;
    type: 'credit' | 'debit';
    category: string;
    status: string;
    date: Date;
    reference?: string;
  }>;
  cashFlow: Array<{
    mois: string;
    recettes: number;
    depenses: number;
  }>;
}

interface StocksReportData {
  stocks: Array<{
    id: string;
    name: string;
    description: string;
    quantity: number;
    price: number;
    threshold: number;
    status: string;
    category: string;
  }>;
  movements: Array<{
    id: string;
    type: 'in' | 'out';
    quantity: number;
    date: Date;
    reason: string;
    user: string;
  }>;
  alerts: Array<{
    id: string;
    type: string;
    message: string;
    status: string;
    date: Date;
  }>;
}

interface HousingReportData {
  housings: Array<{
    id: string;
    name: string;
    type: string;
    capacity: number;
    occupied: number;
    status: string;
    address: string;
  }>;
  rooms: Array<{
    id: string;
    name: string;
    type: string;
    capacity: number;
    occupied: number;
    status: string;
    housingId: string;
  }>;
  occupancies: Array<{
    id: string;
    studentName: string;
    roomId: string;
    startDate: Date;
    endDate?: Date;
    status: string;
  }>;
}

interface TransportReportData {
  vehicles: Array<{
    id: string;
    make: string;
    model: string;
    licensePlate: string;
    type: string;
    status: string;
    mileage: number;
    year: number;
  }>;
  maintenances: Array<{
    id: string;
    vehicleId: string;
    type: string;
    description: string;
    cost: number;
    date: Date;
    status: string;
  }>;
  usages: Array<{
    id: string;
    vehicleId: string;
    driver: string;
    purpose: string;
    startDate: Date;
    endDate: Date;
    distance: number;
  }>;
}

@Injectable()
export class ReportsService {
  private excelGenerator: ExcelReportGenerator;
  private pdfGenerator: PDFReportGenerator;
  private financialExcelReport: FinancialExcelReport;
  private financialPDFReport: FinancialPDFReport;
  private formatter: ReportFormatter;

  constructor() {
    this.excelGenerator = new ExcelReportGenerator();
    this.pdfGenerator = new PDFReportGenerator();
    this.financialExcelReport = new FinancialExcelReport();
    this.financialPDFReport = new FinancialPDFReport();
    this.formatter = new ReportFormatter();
  }

  /**
   * Générer un rapport financier
   */
  async generateFinancialReport(
    tenantId: string,
    userId: string,
    config: Partial<ReportConfig>,
    data: FinancialReportData
  ): Promise<ReportResult> {
    try {
      const reportConfig: ReportConfig = {
        type: config.type || ReportType.EXCEL,
        format: ReportFormat.FINANCIAL,
        period: config.period || 'monthly',
        startDate: config.startDate || new Date(),
        endDate: config.endDate || new Date(),
        tenantId,
        filters: config.filters,
        options: config.options
      };

      let buffer: Buffer;
      let filename: string;
      let mimeType: string;

      if (reportConfig.type === ReportType.EXCEL) {
        buffer = await this.financialExcelReport.generateReport(reportConfig, {
          ...data,
          tenantId,
          generatedBy: userId,
          tenantName: await this.getTenantName(tenantId),
          startDate: reportConfig.startDate,
          endDate: reportConfig.endDate
        });
        filename = `rapport_financier_${this.formatter.formatDate(new Date(), 'YYYY-MM-DD')}.xlsx`;
        mimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
      } else {
        buffer = await this.financialPDFReport.generateReport(reportConfig, {
          ...data,
          tenantId,
          generatedBy: userId,
          tenantName: await this.getTenantName(tenantId),
          startDate: reportConfig.startDate,
          endDate: reportConfig.endDate
        });
        filename = `rapport_financier_${this.formatter.formatDate(new Date(), 'YYYY-MM-DD')}.pdf`;
        mimeType = 'application/pdf';
      }

      return {
        success: true,
        data: buffer,
        filename,
        mimeType,
        size: buffer.length,
        metadata: {
          generatedAt: new Date(),
          duration: 0,
          recordCount: data.budgets.length + data.transactions.length
        }
      };

    } catch (error) {
      logger.error('Erreur génération rapport financier:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Générer un rapport de stocks
   */
  async generateStocksReport(
    tenantId: string,
    userId: string,
    config: Partial<ReportConfig>,
    data: StocksReportData
  ): Promise<ReportResult> {
    try {
      const reportConfig: ReportConfig = {
        type: config.type || ReportType.EXCEL,
        format: ReportFormat.STOCKS,
        period: config.period || 'monthly',
        startDate: config.startDate || new Date(),
        endDate: config.endDate || new Date(),
        tenantId,
        filters: config.filters,
        options: config.options
      };

      let buffer: Buffer;
      let filename: string;
      let mimeType: string;

      if (reportConfig.type === ReportType.EXCEL) {
        buffer = await this.generateStocksExcelReport(reportConfig, data);
        filename = `rapport_stocks_${this.formatter.formatDate(new Date(), 'YYYY-MM-DD')}.xlsx`;
        mimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
      } else {
        buffer = await this.generateStocksPDFReport(reportConfig, data);
        filename = `rapport_stocks_${this.formatter.formatDate(new Date(), 'YYYY-MM-DD')}.pdf`;
        mimeType = 'application/pdf';
      }

      return {
        success: true,
        data: buffer,
        filename,
        mimeType,
        size: buffer.length,
        metadata: {
          generatedAt: new Date(),
          duration: 0,
          recordCount: data.stocks.length + data.movements.length
        }
      };

    } catch (error) {
      logger.error('Erreur génération rapport stocks:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Générer un rapport de logement
   */
  async generateHousingReport(
    tenantId: string,
    userId: string,
    config: Partial<ReportConfig>,
    data: HousingReportData
  ): Promise<ReportResult> {
    try {
      const reportConfig: ReportConfig = {
        type: config.type || ReportType.EXCEL,
        format: ReportFormat.HOUSING,
        period: config.period || 'monthly',
        startDate: config.startDate || new Date(),
        endDate: config.endDate || new Date(),
        tenantId,
        filters: config.filters,
        options: config.options
      };

      let buffer: Buffer;
      let filename: string;
      let mimeType: string;

      if (reportConfig.type === ReportType.EXCEL) {
        buffer = await this.generateHousingExcelReport(reportConfig, data);
        filename = `rapport_logement_${this.formatter.formatDate(new Date(), 'YYYY-MM-DD')}.xlsx`;
        mimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
      } else {
        buffer = await this.generateHousingPDFReport(reportConfig, data);
        filename = `rapport_logement_${this.formatter.formatDate(new Date(), 'YYYY-MM-DD')}.pdf`;
        mimeType = 'application/pdf';
      }

      return {
        success: true,
        data: buffer,
        filename,
        mimeType,
        size: buffer.length,
        metadata: {
          generatedAt: new Date(),
          duration: 0,
          recordCount: data.housings.length + data.rooms.length
        }
      };

    } catch (error) {
      logger.error('Erreur génération rapport logement:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Générer un rapport de transport
   */
  async generateTransportReport(
    tenantId: string,
    userId: string,
    config: Partial<ReportConfig>,
    data: TransportReportData
  ): Promise<ReportResult> {
    try {
      const reportConfig: ReportConfig = {
        type: config.type || ReportType.EXCEL,
        format: ReportFormat.TRANSPORT,
        period: config.period || 'monthly',
        startDate: config.startDate || new Date(),
        endDate: config.endDate || new Date(),
        tenantId,
        filters: config.filters,
        options: config.options
      };

      let buffer: Buffer;
      let filename: string;
      let mimeType: string;

      if (reportConfig.type === ReportType.EXCEL) {
        buffer = await this.generateTransportExcelReport(reportConfig, data);
        filename = `rapport_transport_${this.formatter.formatDate(new Date(), 'YYYY-MM-DD')}.xlsx`;
        mimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
      } else {
        buffer = await this.generateTransportPDFReport(reportConfig, data);
        filename = `rapport_transport_${this.formatter.formatDate(new Date(), 'YYYY-MM-DD')}.pdf`;
        mimeType = 'application/pdf';
      }

      return {
        success: true,
        data: buffer,
        filename,
        mimeType,
        size: buffer.length,
        metadata: {
          generatedAt: new Date(),
          duration: 0,
          recordCount: data.vehicles.length + data.maintenances.length
        }
      };

    } catch (error) {
      logger.error('Erreur génération rapport transport:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Générer un rapport de tableau de bord
   */
  async generateDashboardReport(
    tenantId: string,
    userId: string,
    config: Partial<ReportConfig>,
    data: any
  ): Promise<ReportResult> {
    try {
      const reportConfig: ReportConfig = {
        type: config.type || ReportType.PDF,
        format: ReportFormat.DASHBOARD,
        period: config.period || 'monthly',
        startDate: config.startDate || new Date(),
        endDate: config.endDate || new Date(),
        tenantId,
        filters: config.filters,
        options: config.options
      };

      let buffer: Buffer;
      let filename: string;
      let mimeType: string;

      if (reportConfig.type === ReportType.EXCEL) {
        buffer = await this.generateDashboardExcelReport(reportConfig, data);
        filename = `tableau_bord_${this.formatter.formatDate(new Date(), 'YYYY-MM-DD')}.xlsx`;
        mimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
      } else {
        buffer = await this.generateDashboardPDFReport(reportConfig, data);
        filename = `tableau_bord_${this.formatter.formatDate(new Date(), 'YYYY-MM-DD')}.pdf`;
        mimeType = 'application/pdf';
      }

      return {
        success: true,
        data: buffer,
        filename,
        mimeType,
        size: buffer.length,
        metadata: {
          generatedAt: new Date(),
          duration: 0,
          recordCount: 0
        }
      };

    } catch (error) {
      logger.error('Erreur génération rapport tableau de bord:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Générer un rapport Excel de stocks
   */
  private async generateStocksExcelReport(config: ReportConfig, data: StocksReportData): Promise<Buffer> {
    const workbook = this.excelGenerator['workbook'];
    const worksheet = workbook.addWorksheet('Rapport Stocks');

    // En-tête
    worksheet.addRow(['RAPPORT DE STOCKS CROU']);
    worksheet.addRow(['']);
    worksheet.addRow([`Période: ${this.formatter.formatDate(config.startDate!)} - ${this.formatter.formatDate(config.endDate!)}`]);
    worksheet.addRow([`Centre: ${await this.getTenantName(config.tenantId)}`]);
    worksheet.addRow(['']);

    // Tableau des stocks
    worksheet.addRow(['ÉTAT DES STOCKS']);
    worksheet.addRow(['Article', 'Quantité', 'Prix Unitaire', 'Valeur Totale', 'Seuil', 'Statut']);

    if (data.stocks && data.stocks.length > 0) {
      data.stocks.forEach((stock) => {
        const valeurTotale = stock.quantity * stock.price;
        const statut = stock.quantity <= stock.threshold ? 'ALERTE' : 'NORMAL';

        worksheet.addRow([
          stock.name,
          stock.quantity,
          stock.price,
          valeurTotale,
          stock.threshold,
          statut
        ]);
      });

      // Ligne de total
      const lastRow = worksheet.rowCount;
      worksheet.addRow([
        'TOTAL',
        `=SOMME(B3:B${lastRow - 1})`,
        `=MOYENNE(C3:C${lastRow - 1})`,
        `=SOMME(D3:D${lastRow - 1})`,
        '',
        ''
      ]);
    }

    return await workbook.xlsx.writeBuffer() as Buffer;
  }

  /**
   * Générer un rapport PDF de stocks
   */
  private async generateStocksPDFReport(config: ReportConfig, data: StocksReportData): Promise<Buffer> {
    const html = `
      <!DOCTYPE html>
      <html lang="fr">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Rapport de Stocks CROU</title>
        <style>
          ${this.getPDFStyles()}
        </style>
      </head>
      <body>
        <div class="report-container">
          <div class="institutional-header">
            <h1>RAPPORT DE STOCKS CROU</h1>
            <h2>Période: ${this.formatter.formatDate(config.startDate!)} - ${this.formatter.formatDate(config.endDate!)}</h2>
          </div>
          
          <div class="section">
            <h2>ÉTAT DES STOCKS</h2>
            <table class="data-table">
              <thead>
                <tr>
                  <th>Article</th>
                  <th>Quantité</th>
                  <th>Prix Unitaire</th>
                  <th>Valeur Totale</th>
                  <th>Seuil</th>
                  <th>Statut</th>
                </tr>
              </thead>
              <tbody>
                ${data.stocks?.map(stock => {
                  const valeurTotale = stock.quantity * stock.price;
                  const statut = stock.quantity <= stock.threshold ? 'ALERTE' : 'NORMAL';
                  const statutClass = stock.quantity <= stock.threshold ? 'alert' : 'normal';
                  
                  return `
                    <tr>
                      <td>${stock.name}</td>
                      <td>${stock.quantity}</td>
                      <td class="currency">${this.formatter.formatFCFA(stock.price)}</td>
                      <td class="currency">${this.formatter.formatFCFA(valeurTotale)}</td>
                      <td>${stock.threshold}</td>
                      <td class="${statutClass}">${statut}</td>
                    </tr>
                  `;
                }).join('') || '<tr><td colspan="6" class="text-center">Aucun stock trouvé</td></tr>'}
              </tbody>
            </table>
          </div>
        </div>
      </body>
      </html>
    `;

    return await this.pdfGenerator.generate(config, {
      title: 'Rapport de Stocks',
      period: `${this.formatter.formatDate(config.startDate!)} - ${this.formatter.formatDate(config.endDate!)}`,
      generatedAt: new Date(),
      generatedBy: 'Système CROU',
      tenant: { name: await this.getTenantName(config.tenantId) },
      sections: []
    });
  }

  /**
   * Générer un rapport Excel de logement
   */
  private async generateHousingExcelReport(config: ReportConfig, data: HousingReportData): Promise<Buffer> {
    const workbook = this.excelGenerator['workbook'];
    const worksheet = workbook.addWorksheet('Rapport Logement');

    // En-tête
    worksheet.addRow(['RAPPORT DE LOGEMENT CROU']);
    worksheet.addRow(['']);
    worksheet.addRow([`Période: ${this.formatter.formatDate(config.startDate!)} - ${this.formatter.formatDate(config.endDate!)}`]);
    worksheet.addRow([`Centre: ${await this.getTenantName(config.tenantId)}`]);
    worksheet.addRow(['']);

    // Tableau des logements
    worksheet.addRow(['ÉTAT DES LOGEMENTS']);
    worksheet.addRow(['Nom', 'Type', 'Capacité', 'Occupé', 'Disponible', 'Taux Occupation', 'Statut']);

    if (data.housings && data.housings.length > 0) {
      data.housings.forEach((housing) => {
        const disponible = housing.capacity - housing.occupied;
        const tauxOccupation = housing.capacity > 0 ? (housing.occupied / housing.capacity) * 100 : 0;

        worksheet.addRow([
          housing.name,
          housing.type,
          housing.capacity,
          housing.occupied,
          disponible,
          `${tauxOccupation.toFixed(1)}%`,
          housing.status
        ]);
      });
    }

    return await workbook.xlsx.writeBuffer() as Buffer;
  }

  /**
   * Générer un rapport PDF de logement
   */
  private async generateHousingPDFReport(config: ReportConfig, data: HousingReportData): Promise<Buffer> {
    const html = `
      <!DOCTYPE html>
      <html lang="fr">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Rapport de Logement CROU</title>
        <style>
          ${this.getPDFStyles()}
        </style>
      </head>
      <body>
        <div class="report-container">
          <div class="institutional-header">
            <h1>RAPPORT DE LOGEMENT CROU</h1>
            <h2>Période: ${this.formatter.formatDate(config.startDate!)} - ${this.formatter.formatDate(config.endDate!)}</h2>
          </div>
          
          <div class="section">
            <h2>ÉTAT DES LOGEMENTS</h2>
            <table class="data-table">
              <thead>
                <tr>
                  <th>Nom</th>
                  <th>Type</th>
                  <th>Capacité</th>
                  <th>Occupé</th>
                  <th>Disponible</th>
                  <th>Taux Occupation</th>
                  <th>Statut</th>
                </tr>
              </thead>
              <tbody>
                ${data.housings?.map(housing => {
                  const disponible = housing.capacity - housing.occupied;
                  const tauxOccupation = housing.capacity > 0 ? (housing.occupied / housing.capacity) * 100 : 0;
                  
                  return `
                    <tr>
                      <td>${housing.name}</td>
                      <td>${housing.type}</td>
                      <td>${housing.capacity}</td>
                      <td>${housing.occupied}</td>
                      <td>${disponible}</td>
                      <td class="percentage">${tauxOccupation.toFixed(1)}%</td>
                      <td class="${housing.status}">${housing.status}</td>
                    </tr>
                  `;
                }).join('') || '<tr><td colspan="7" class="text-center">Aucun logement trouvé</td></tr>'}
              </tbody>
            </table>
          </div>
        </div>
      </body>
      </html>
    `;

    return await this.pdfGenerator.generate(config, {
      title: 'Rapport de Logement',
      period: `${this.formatter.formatDate(config.startDate!)} - ${this.formatter.formatDate(config.endDate!)}`,
      generatedAt: new Date(),
      generatedBy: 'Système CROU',
      tenant: { name: await this.getTenantName(config.tenantId) },
      sections: []
    });
  }

  /**
   * Générer un rapport Excel de transport
   */
  private async generateTransportExcelReport(config: ReportConfig, data: TransportReportData): Promise<Buffer> {
    const workbook = this.excelGenerator['workbook'];
    const worksheet = workbook.addWorksheet('Rapport Transport');

    // En-tête
    worksheet.addRow(['RAPPORT DE TRANSPORT CROU']);
    worksheet.addRow(['']);
    worksheet.addRow([`Période: ${this.formatter.formatDate(config.startDate!)} - ${this.formatter.formatDate(config.endDate!)}`]);
    worksheet.addRow([`Centre: ${await this.getTenantName(config.tenantId)}`]);
    worksheet.addRow(['']);

    // Tableau des véhicules
    worksheet.addRow(['ÉTAT DU PARC AUTOMOBILE']);
    worksheet.addRow(['Marque', 'Modèle', 'Immatriculation', 'Type', 'Kilométrage', 'Année', 'Statut']);

    if (data.vehicles && data.vehicles.length > 0) {
      data.vehicles.forEach((vehicle) => {
        worksheet.addRow([
          vehicle.make,
          vehicle.model,
          vehicle.licensePlate,
          vehicle.type,
          vehicle.mileage,
          vehicle.year,
          vehicle.status
        ]);
      });
    }

    return await workbook.xlsx.writeBuffer() as Buffer;
  }

  /**
   * Générer un rapport PDF de transport
   */
  private async generateTransportPDFReport(config: ReportConfig, data: TransportReportData): Promise<Buffer> {
    const html = `
      <!DOCTYPE html>
      <html lang="fr">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Rapport de Transport CROU</title>
        <style>
          ${this.getPDFStyles()}
        </style>
      </head>
      <body>
        <div class="report-container">
          <div class="institutional-header">
            <h1>RAPPORT DE TRANSPORT CROU</h1>
            <h2>Période: ${this.formatter.formatDate(config.startDate!)} - ${this.formatter.formatDate(config.endDate!)}</h2>
          </div>
          
          <div class="section">
            <h2>ÉTAT DU PARC AUTOMOBILE</h2>
            <table class="data-table">
              <thead>
                <tr>
                  <th>Marque</th>
                  <th>Modèle</th>
                  <th>Immatriculation</th>
                  <th>Type</th>
                  <th>Kilométrage</th>
                  <th>Année</th>
                  <th>Statut</th>
                </tr>
              </thead>
              <tbody>
                ${data.vehicles?.map(vehicle => `
                  <tr>
                    <td>${vehicle.make}</td>
                    <td>${vehicle.model}</td>
                    <td>${vehicle.licensePlate}</td>
                    <td>${vehicle.type}</td>
                    <td>${vehicle.mileage.toLocaleString()}</td>
                    <td>${vehicle.year}</td>
                    <td class="${vehicle.status}">${vehicle.status}</td>
                  </tr>
                `).join('') || '<tr><td colspan="7" class="text-center">Aucun véhicule trouvé</td></tr>'}
              </tbody>
            </table>
          </div>
        </div>
      </body>
      </html>
    `;

    return await this.pdfGenerator.generate(config, {
      title: 'Rapport de Transport',
      period: `${this.formatter.formatDate(config.startDate!)} - ${this.formatter.formatDate(config.endDate!)}`,
      generatedAt: new Date(),
      generatedBy: 'Système CROU',
      tenant: { name: await this.getTenantName(config.tenantId) },
      sections: []
    });
  }

  /**
   * Générer un rapport Excel de tableau de bord
   */
  private async generateDashboardExcelReport(config: ReportConfig, data: any): Promise<Buffer> {
    const workbook = this.excelGenerator['workbook'];
    const worksheet = workbook.addWorksheet('Tableau de Bord');

    // En-tête
    worksheet.addRow(['TABLEAU DE BORD CROU']);
    worksheet.addRow(['']);
    worksheet.addRow([`Période: ${this.formatter.formatDate(config.startDate!)} - ${this.formatter.formatDate(config.endDate!)}`]);
    worksheet.addRow([`Centre: ${await this.getTenantName(config.tenantId)}`]);
    worksheet.addRow(['']);

    // KPIs
    worksheet.addRow(['INDICATEURS CLÉS']);
    worksheet.addRow(['Indicateur', 'Valeur', 'Unité', 'Tendance']);

    if (data.kpis && data.kpis.length > 0) {
      data.kpis.forEach((kpi: any) => {
        worksheet.addRow([
          kpi.name,
          kpi.value,
          kpi.unit || '',
          kpi.trend || ''
        ]);
      });
    }

    return await workbook.xlsx.writeBuffer() as Buffer;
  }

  /**
   * Générer un rapport PDF de tableau de bord
   */
  private async generateDashboardPDFReport(config: ReportConfig, data: any): Promise<Buffer> {
    const html = `
      <!DOCTYPE html>
      <html lang="fr">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Tableau de Bord CROU</title>
        <style>
          ${this.getPDFStyles()}
        </style>
      </head>
      <body>
        <div class="report-container">
          <div class="institutional-header">
            <h1>TABLEAU DE BORD CROU</h1>
            <h2>Période: ${this.formatter.formatDate(config.startDate!)} - ${this.formatter.formatDate(config.endDate!)}</h2>
          </div>
          
          <div class="section">
            <h2>INDICATEURS CLÉS</h2>
            <table class="data-table">
              <thead>
                <tr>
                  <th>Indicateur</th>
                  <th>Valeur</th>
                  <th>Unité</th>
                  <th>Tendance</th>
                </tr>
              </thead>
              <tbody>
                ${data.kpis?.map((kpi: any) => `
                  <tr>
                    <td>${kpi.name}</td>
                    <td class="currency">${kpi.value}</td>
                    <td>${kpi.unit || ''}</td>
                    <td class="${kpi.trend || 'stable'}">${kpi.trend || 'Stable'}</td>
                  </tr>
                `).join('') || '<tr><td colspan="4" class="text-center">Aucun indicateur trouvé</td></tr>'}
              </tbody>
            </table>
          </div>
        </div>
      </body>
      </html>
    `;

    return await this.pdfGenerator.generate(config, {
      title: 'Tableau de Bord',
      period: `${this.formatter.formatDate(config.startDate!)} - ${this.formatter.formatDate(config.endDate!)}`,
      generatedAt: new Date(),
      generatedBy: 'Système CROU',
      tenant: { name: await this.getTenantName(config.tenantId) },
      sections: []
    });
  }

  /**
   * Obtenir le nom du tenant
   */
  private async getTenantName(tenantId: string): Promise<string> {
    // TODO: Implémenter la récupération du nom du tenant depuis la base de données
    return 'CROU';
  }

  /**
   * Obtenir les styles CSS pour les PDFs
   */
  private getPDFStyles(): string {
    return `
      * {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
      }

      body {
        font-family: 'Arial', sans-serif;
        font-size: 12px;
        line-height: 1.4;
        color: #333;
        background: #fff;
      }

      .report-container {
        max-width: 100%;
        margin: 0 auto;
        padding: 20px;
      }

      .institutional-header {
        text-align: center;
        margin-bottom: 30px;
        border-bottom: 2px solid #2E5BBA;
        padding-bottom: 20px;
      }

      .institutional-header h1 {
        font-size: 18px;
        font-weight: bold;
        color: #2E5BBA;
        margin-bottom: 10px;
      }

      .institutional-header h2 {
        font-size: 14px;
        font-weight: normal;
        color: #666;
      }

      .section {
        margin-bottom: 30px;
      }

      .section h2 {
        font-size: 14px;
        font-weight: bold;
        color: #2E5BBA;
        margin-bottom: 15px;
        border-bottom: 1px solid #ddd;
        padding-bottom: 5px;
      }

      .data-table {
        width: 100%;
        border-collapse: collapse;
        margin-bottom: 20px;
      }

      .data-table th,
      .data-table td {
        border: 1px solid #ddd;
        padding: 8px;
        text-align: left;
      }

      .data-table th {
        background-color: #2E5BBA;
        color: white;
        font-weight: bold;
        text-align: center;
      }

      .data-table tr:nth-child(even) {
        background-color: #f9f9f9;
      }

      .currency {
        text-align: right;
      }

      .percentage {
        text-align: center;
      }

      .text-center {
        text-align: center;
      }

      .alert {
        color: #d32f2f;
        font-weight: bold;
      }

      .normal {
        color: #388e3c;
        font-weight: bold;
      }

      .positive {
        color: #388e3c;
        font-weight: bold;
      }

      .negative {
        color: #d32f2f;
        font-weight: bold;
      }

      .stable {
        color: #666;
        font-weight: bold;
      }

      @media print {
        body {
          font-size: 11px;
        }
        
        .report-container {
          padding: 0;
        }
        
        .section {
          page-break-inside: avoid;
        }
      }
    `;
  }
}

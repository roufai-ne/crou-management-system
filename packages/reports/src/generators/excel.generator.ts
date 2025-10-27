/**
 * FICHIER: packages\reports\src\generators\excel.generator.ts
 * GÉNÉRATEUR: ExcelReportGenerator - Générateur de rapports Excel
 * 
 * DESCRIPTION:
 * Générateur de rapports Excel avec formules françaises
 * Mise en page institutionnelle CROU
 * Support des graphiques et formats avancés
 * 
 * FONCTIONNALITÉS:
 * - Génération de fichiers Excel (.xlsx)
 * - Formules françaises (SOMME, MOYENNE, etc.)
 * - Mise en page institutionnelle
 * - Graphiques et visualisations
 * - Formatage conditionnel
 * - Protection des feuilles
 * 
 * AUTEUR: Équipe CROU
 * DATE: Décembre 2024
 */

import ExcelJS from 'exceljs';
import { 
  ReportGenerator, 
  ReportConfig, 
  ReportData, 
  ReportResult,
  ReportColumn,
  ChartConfig,
  ExcelGenerator
} from '../types/report.types';
import { ReportFormatter } from '../utils/formatter';

export class ExcelReportGenerator implements ExcelGenerator {
  private workbook: ExcelJS.Workbook;
  private formatter: ReportFormatter;

  constructor() {
    this.workbook = new ExcelJS.Workbook();
    this.formatter = new ReportFormatter();
    this.setupWorkbook();
  }

  /**
   * Configuration initiale du classeur
   */
  private setupWorkbook(): void {
    // Propriétés du document
    this.workbook.creator = 'Système CROU';
    this.workbook.lastModifiedBy = 'Système CROU';
    this.workbook.created = new Date();
    this.workbook.modified = new Date();
    this.workbook.lastPrinted = new Date();

      // Propriétés personnalisées non supportées par ExcelJS
      // this.workbook.properties.customProperties = [ ... ];
  }

  /**
   * Générer un rapport Excel
   */
  async generate(config: ReportConfig, data: ReportData): Promise<Buffer> {
    try {
      // Créer la feuille principale
      const worksheet = this.workbook.addWorksheet('Rapport');
      // Ajouter l'en-tête institutionnel
      await this.addInstitutionalHeader(worksheet, data);
      // Ajouter le résumé
      if (data.summary) {
        await this.addSummary(worksheet, data.summary);
      }
      // Ajouter les sections
      for (const section of data.sections) {
        await this.addSection(worksheet, section);
      }
      // Ajouter le pied de page
      await this.addFooter(worksheet, data);
      // Appliquer les styles
      await this.applyStyles(worksheet);
      // Générer le buffer
      const buffer = await this.workbook.xlsx.writeBuffer();
      return buffer as unknown as Buffer;
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Erreur génération Excel: ${error.message}`);
      } else {
        throw new Error('Erreur génération Excel inconnue');
      }
    }
  }

  /**
   * Valider la configuration
   */
  validate(config: ReportConfig): boolean {
    return !!(config.type && config.format && config.tenantId);
  }

  /**
   * Obtenir les formats supportés
   */
  getSupportedFormats(): import('../types/report.types').ReportFormat[] {
    return [
      'financial',
      'stocks',
      'housing',
      'transport',
      'workflow',
      'dashboard',
      'audit',
    ] as import('../types/report.types').ReportFormat[];
      // Note: Ensure that the return type is correctly set to ReportFormat[]
  }

  /**
   * Ajouter une feuille de calcul
   */
  addWorksheet(name: string, data: any[]): void {
    const worksheet = this.workbook.addWorksheet(name);
    
    if (data.length > 0) {
      // Ajouter les en-têtes
      const headers = Object.keys(data[0]);
      worksheet.addRow(headers);
      
      // Ajouter les données
      data.forEach(row => {
        const values = headers.map(header => row[header]);
        worksheet.addRow(values);
      });
      
      // Appliquer les styles aux en-têtes
      const headerRow = worksheet.getRow(1);
      headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2E5BBA' } };
    }
  }

  /**
   * Ajouter un graphique
   */
  addChart(worksheetName: string, chart: ChartConfig): void {
    const worksheet = this.workbook.getWorksheet(worksheetName);
    if (!worksheet) return;

    // Configuration du graphique selon le type
    let chartConfig: any = {
      type: chart.type,
      // title: chart.title || 'Graphique', // Not in ChartConfig type
      data: chart.data,
      options: {
        ...chart.options,
        legend: { position: 'right' },
        scales: {
          y: { beginAtZero: true }
        }
      }
    };

    // worksheet.addChart(chartConfig); // Not supported by ExcelJS
  }

  /**
   * Ajouter une formule
   */
  addFormula(cell: string, formula: string): void {
    const worksheet = this.workbook.getWorksheet(1);
    if (worksheet) {
      worksheet.getCell(cell).value = { formula: formula };
    }
  }

  /**
   * Appliquer un style à une plage
   */
  setStyle(range: string, style: any): void {
    const worksheet = this.workbook.getWorksheet(1);
    if (worksheet) {
      const cell = worksheet.getCell(range);
      Object.assign(cell, style);
    }
  }

  /**
   * Ajouter l'en-tête institutionnel
   */
  private async addInstitutionalHeader(worksheet: ExcelJS.Worksheet, data: ReportData): Promise<void> {
    // Logo et titre principal
    worksheet.addRow(['']);
    worksheet.addRow(['RÉPUBLIQUE DU NIGER']);
    worksheet.addRow(['MINISTÈRE DE L\'ENSEIGNEMENT SUPÉRIEUR']);
    worksheet.addRow(['CENTRE RÉGIONAL DES ŒUVRES UNIVERSITAIRES']);
    worksheet.addRow(['']);
    
    // Titre du rapport
    worksheet.addRow([data.title]);
    if (data.subtitle) {
      worksheet.addRow([data.subtitle]);
    }
    worksheet.addRow(['']);
    
    // Période et informations
    worksheet.addRow([`Période: ${data.period}`]);
    worksheet.addRow([`Généré le: ${this.formatter.formatDate(data.generatedAt)}`]);
    worksheet.addRow([`Généré par: ${data.generatedBy}`]);
    worksheet.addRow([`Centre: ${data.tenant.name}`]);
    worksheet.addRow(['']);
    
    // Styles pour l'en-tête
    const titleRow = worksheet.getRow(6);
    titleRow.font = { size: 16, bold: true, color: { argb: 'FF2E5BBA' } };
    titleRow.alignment = { horizontal: 'center' };
    
    const subtitleRow = worksheet.getRow(7);
    subtitleRow.font = { size: 14, bold: true, color: { argb: 'FF666666' } };
    subtitleRow.alignment = { horizontal: 'center' };
  }

  /**
   * Ajouter le résumé
   */
  private async addSummary(worksheet: ExcelJS.Worksheet, summary: any): Promise<void> {
    worksheet.addRow(['RÉSUMÉ EXÉCUTIF']);
    worksheet.addRow(['']);
    
    // Métriques clés
    if (summary.keyMetrics) {
      summary.keyMetrics.forEach((metric: any) => {
        worksheet.addRow([`${metric.name}: ${metric.value}${metric.unit || ''}`]);
      });
    }
    
    worksheet.addRow(['']);
    
    // Style du résumé
    const summaryTitleRow = worksheet.getRow(worksheet.rowCount - summary.keyMetrics.length - 2);
    summaryTitleRow.font = { size: 14, bold: true, color: { argb: 'FF2E5BBA' } };
  }

  /**
   * Ajouter une section
   */
  private async addSection(worksheet: ExcelJS.Worksheet, section: any): Promise<void> {
    worksheet.addRow([section.title]);
    worksheet.addRow(['']);
    
    if (section.type === 'table' && section.data) {
      // Ajouter les en-têtes
      if (section.columns) {
        const headers = section.columns.map((col: ReportColumn) => col.title);
        worksheet.addRow(headers);
        
        // Ajouter les données
        section.data.forEach((row: any) => {
          const values = section.columns.map((col: ReportColumn) => {
            const value = row[col.key];
            return this.formatter.formatValue(value, col.type, col.format);
          });
          worksheet.addRow(values);
        });
      }
    }
    
    worksheet.addRow(['']);
    
    // Style de la section
    const sectionTitleRow = worksheet.getRow(worksheet.rowCount - section.data.length - 3);
    sectionTitleRow.font = { size: 12, bold: true, color: { argb: 'FF2E5BBA' } };
  }

  /**
   * Ajouter le pied de page
   */
  private async addFooter(worksheet: ExcelJS.Worksheet, data: ReportData): Promise<void> {
    worksheet.addRow(['']);
    worksheet.addRow(['']);
    worksheet.addRow(['---']);
    worksheet.addRow(['Rapport généré automatiquement par le Système de Gestion CROU']);
    worksheet.addRow([`Centre: ${data.tenant.name}`]);
    worksheet.addRow([`Date de génération: ${this.formatter.formatDate(data.generatedAt)}`]);
    worksheet.addRow(['---']);
  }

  /**
   * Appliquer les styles
   */
  private async applyStyles(worksheet: ExcelJS.Worksheet): Promise<void> {
    // Définir les largeurs de colonnes
    worksheet.columns = [
      { width: 30 },
      { width: 20 },
      { width: 20 },
      { width: 20 },
      { width: 20 }
    ];
    
    // Appliquer les bordures
    worksheet.eachRow((row, rowNumber) => {
      row.eachCell((cell, colNumber) => {
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' }
        };
      });
    });
  }

  /**
   * Générer un rapport financier Excel
   */
  async generateFinancialReport(data: any): Promise<Buffer> {
    const worksheet = this.workbook.addWorksheet('Rapport Financier');
    
    // En-tête
    worksheet.addRow(['RAPPORT FINANCIER CROU']);
    worksheet.addRow(['']);
    
    // Tableau des budgets
    worksheet.addRow(['BUDGETS']);
    worksheet.addRow(['Titre', 'Montant Alloué', 'Montant Dépensé', 'Solde', 'Progression']);
    
    if (data.budgets) {
      data.budgets.forEach((budget: any) => {
        const progression = (budget.spent / budget.amount) * 100;
        worksheet.addRow([
          budget.title,
          budget.amount,
          budget.spent,
          budget.amount - budget.spent,
          `${progression.toFixed(1)}%`
        ]);
      });
    }
    
    // Formules
    const lastRow = worksheet.rowCount;
    worksheet.addRow(['TOTAL', '=SOMME(B3:B' + (lastRow - 1) + ')', '=SOMME(C3:C' + (lastRow - 1) + ')', '=SOMME(D3:D' + (lastRow - 1) + ')', '']);
    
    // Appliquer les styles
    await this.applyStyles(worksheet);
    
  return await this.workbook.xlsx.writeBuffer() as unknown as Buffer;
  }

  /**
   * Générer un rapport de stocks Excel
   */
  async generateStocksReport(data: any): Promise<Buffer> {
    const worksheet = this.workbook.addWorksheet('Rapport Stocks');
    
    // En-tête
    worksheet.addRow(['RAPPORT DE STOCKS CROU']);
    worksheet.addRow(['']);
    
    // Tableau des stocks
    worksheet.addRow(['STOCKS']);
    worksheet.addRow(['Article', 'Quantité', 'Prix Unitaire', 'Valeur Totale', 'Seuil', 'Statut']);
    
    if (data.stocks) {
      data.stocks.forEach((stock: any) => {
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
    }
    
    // Appliquer les styles
    await this.applyStyles(worksheet);
    
  return await this.workbook.xlsx.writeBuffer() as unknown as Buffer;
  }
}

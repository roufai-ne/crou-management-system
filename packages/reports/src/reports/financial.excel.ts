/**
 * FICHIER: packages\reports\src\reports\financial.excel.ts
 * RAPPORT: FinancialExcelReport - Rapport financier Excel
 * 
 * DESCRIPTION:
 * Générateur de rapports financiers Excel
 * Formules françaises et mise en page institutionnelle
 * 
 * FONCTIONNALITÉS:
 * - Rapport des budgets et transactions
 * - Formules Excel françaises
 * - Graphiques et visualisations
 * - Mise en page CROU
 * 
 * AUTEUR: Équipe CROU
 * DATE: Décembre 2024
 */

import { ExcelReportGenerator } from '../generators/excel.generator';
import { ReportConfig, ReportData } from '../types/report.types';
import { ReportFormatter } from '../utils/formatter';

export class FinancialExcelReport {
  private generator: ExcelReportGenerator;
  private formatter: ReportFormatter;

  constructor() {
    this.generator = new ExcelReportGenerator();
    this.formatter = new ReportFormatter();
  }

  /**
   * Générer un rapport financier complet
   */
  async generateReport(config: ReportConfig, data: any): Promise<Buffer> {
    const reportData: ReportData = {
      title: 'RAPPORT FINANCIER CROU',
      subtitle: `Période: ${this.formatter.formatDate(config.startDate || new Date())} - ${this.formatter.formatDate(config.endDate || new Date())}`,
      period: this.getPeriodText(config),
      generatedAt: new Date(),
      generatedBy: data.generatedBy || 'Système CROU',
      tenant: {
        name: data.tenantName || 'CROU',
        type: data.tenantType || 'Centre',
        region: data.region
      },
      summary: this.generateSummary(data),
      sections: this.generateSections(data),
      metadata: {
        module: 'financial',
        version: '1.0.0',
        generatedBy: 'CROU System'
      }
    };

    return await this.generator.generate(config, reportData);
  }

  /**
   * Générer un rapport de budget
   */
  async generateBudgetReport(data: any): Promise<Buffer> {
    const workbook = this.generator['workbook'];
    const worksheet = workbook.addWorksheet('Rapport Budget');

    // En-tête
    worksheet.addRow(['RAPPORT DE BUDGET CROU']);
    worksheet.addRow(['']);
    worksheet.addRow([`Période: ${this.formatter.formatDate(data.startDate)} - ${this.formatter.formatDate(data.endDate)}`]);
    worksheet.addRow([`Centre: ${data.tenantName}`]);
    worksheet.addRow(['']);

    // Tableau des budgets
    worksheet.addRow(['BUDGETS PAR CATÉGORIE']);
    worksheet.addRow(['Catégorie', 'Budget Alloué', 'Montant Dépensé', 'Solde', 'Progression (%)', 'Statut']);

    if (data.budgets && data.budgets.length > 0) {
      data.budgets.forEach((budget: any) => {
        const progression = (budget.spent / budget.amount) * 100;
        const solde = budget.amount - budget.spent;
        const statut = solde < 0 ? 'DÉPASSEMENT' : progression > 80 ? 'ATTENTION' : 'NORMAL';

        worksheet.addRow([
          budget.category,
          budget.amount,
          budget.spent,
          solde,
          progression.toFixed(1),
          statut
        ]);
      });

      // Ligne de total
      const lastRow = worksheet.rowCount;
      worksheet.addRow([
        'TOTAL',
        `=SOMME(B3:B${lastRow - 1})`,
        `=SOMME(C3:C${lastRow - 1})`,
        `=SOMME(D3:D${lastRow - 1})`,
        `=MOYENNE(E3:E${lastRow - 1})`,
        ''
      ]);
    }

    // Appliquer les styles
    await this.applyBudgetStyles(worksheet);

  return await workbook.xlsx.writeBuffer() as unknown as Buffer;
  }

  /**
   * Générer un rapport de transactions
   */
  async generateTransactionReport(data: any): Promise<Buffer> {
    const workbook = this.generator['workbook'];
    const worksheet = workbook.addWorksheet('Rapport Transactions');

    // En-tête
    worksheet.addRow(['RAPPORT DE TRANSACTIONS CROU']);
    worksheet.addRow(['']);
    worksheet.addRow([`Période: ${this.formatter.formatDate(data.startDate)} - ${this.formatter.formatDate(data.endDate)}`]);
    worksheet.addRow([`Centre: ${data.tenantName}`]);
    worksheet.addRow(['']);

    // Tableau des transactions
    worksheet.addRow(['TRANSACTIONS FINANCIÈRES']);
    worksheet.addRow(['Date', 'Description', 'Type', 'Montant', 'Catégorie', 'Statut', 'Référence']);

    if (data.transactions && data.transactions.length > 0) {
      data.transactions.forEach((transaction: any) => {
        worksheet.addRow([
          this.formatter.formatDate(transaction.date),
          transaction.description,
          transaction.type === 'credit' ? 'CRÉDIT' : 'DÉBIT',
          transaction.amount,
          transaction.category,
          transaction.status,
          transaction.reference || ''
        ]);
      });

      // Ligne de total
      const lastRow = worksheet.rowCount;
      worksheet.addRow([
        'TOTAL',
        '',
        '',
        `=SOMME(D3:D${lastRow - 1})`,
        '',
        '',
        ''
      ]);
    }

    // Appliquer les styles
    await this.applyTransactionStyles(worksheet);

  return await workbook.xlsx.writeBuffer() as unknown as Buffer;
  }

  /**
   * Générer un rapport de trésorerie
   */
  async generateCashFlowReport(data: any): Promise<Buffer> {
    const workbook = this.generator['workbook'];
    const worksheet = workbook.addWorksheet('Rapport Trésorerie');

    // En-tête
    worksheet.addRow(['RAPPORT DE TRÉSORERIE CROU']);
    worksheet.addRow(['']);
    worksheet.addRow([`Période: ${this.formatter.formatDate(data.startDate)} - ${this.formatter.formatDate(data.endDate)}`]);
    worksheet.addRow([`Centre: ${data.tenantName}`]);
    worksheet.addRow(['']);

    // Tableau de trésorerie
    worksheet.addRow(['TRÉSORERIE PAR MOIS']);
    worksheet.addRow(['Mois', 'Recettes', 'Dépenses', 'Solde', 'Cumul']);

    if (data.cashFlow && data.cashFlow.length > 0) {
      let cumul = 0;
      data.cashFlow.forEach((month: any) => {
        const solde = month.recettes - month.depenses;
        cumul += solde;

        worksheet.addRow([
          month.mois,
          month.recettes,
          month.depenses,
          solde,
          cumul
        ]);
      });

      // Ligne de total
      const lastRow = worksheet.rowCount;
      worksheet.addRow([
        'TOTAL',
        `=SOMME(B3:B${lastRow - 1})`,
        `=SOMME(C3:C${lastRow - 1})`,
        `=SOMME(D3:D${lastRow - 1})`,
        `=SOMME(E3:E${lastRow - 1})`
      ]);
    }

    // Appliquer les styles
    await this.applyCashFlowStyles(worksheet);

  return await workbook.xlsx.writeBuffer() as unknown as Buffer;
  }

  /**
   * Générer le résumé
   */
  private generateSummary(data: any): any {
    const totalBudget = data.budgets?.reduce((sum: number, budget: any) => sum + budget.amount, 0) || 0;
    const totalSpent = data.budgets?.reduce((sum: number, budget: any) => sum + budget.spent, 0) || 0;
    const totalTransactions = data.transactions?.length || 0;
    const totalAmount = data.transactions?.reduce((sum: number, transaction: any) => sum + transaction.amount, 0) || 0;

    return {
      totalRecords: totalTransactions,
      totalAmount: totalAmount,
      averageAmount: totalTransactions > 0 ? totalAmount / totalTransactions : 0,
      keyMetrics: [
        {
          name: 'Budget Total',
          value: this.formatter.formatFCFA(totalBudget),
          unit: 'FCFA'
        },
        {
          name: 'Montant Dépensé',
          value: this.formatter.formatFCFA(totalSpent),
          unit: 'FCFA'
        },
        {
          name: 'Solde Restant',
          value: this.formatter.formatFCFA(totalBudget - totalSpent),
          unit: 'FCFA'
        },
        {
          name: 'Nombre de Transactions',
          value: totalTransactions,
          unit: 'transactions'
        }
      ]
    };
  }

  /**
   * Générer les sections
   */
  private generateSections(data: any): any[] {
    const sections = [];

    // Section budgets
    if (data.budgets && data.budgets.length > 0) {
      sections.push({
        title: 'BUDGETS PAR CATÉGORIE',
        type: 'table',
        columns: [
          { key: 'category', title: 'Catégorie', type: 'string' },
          { key: 'amount', title: 'Budget Alloué', type: 'currency' },
          { key: 'spent', title: 'Montant Dépensé', type: 'currency' },
          { key: 'balance', title: 'Solde', type: 'currency' },
          { key: 'progress', title: 'Progression (%)', type: 'number' },
          { key: 'status', title: 'Statut', type: 'string' }
        ],
        data: data.budgets.map((budget: any) => ({
          ...budget,
          balance: budget.amount - budget.spent,
          progress: (budget.spent / budget.amount) * 100,
          status: budget.amount - budget.spent < 0 ? 'DÉPASSEMENT' : 
                  (budget.spent / budget.amount) > 0.8 ? 'ATTENTION' : 'NORMAL'
        }))
      });
    }

    // Section transactions
    if (data.transactions && data.transactions.length > 0) {
      sections.push({
        title: 'TRANSACTIONS RÉCENTES',
        type: 'table',
        columns: [
          { key: 'date', title: 'Date', type: 'date' },
          { key: 'description', title: 'Description', type: 'string' },
          { key: 'type', title: 'Type', type: 'string' },
          { key: 'amount', title: 'Montant', type: 'currency' },
          { key: 'category', title: 'Catégorie', type: 'string' },
          { key: 'status', title: 'Statut', type: 'string' }
        ],
        data: data.transactions.slice(0, 50) // Limiter à 50 transactions
      });
    }

    return sections;
  }

  /**
   * Obtenir le texte de la période
   */
  private getPeriodText(config: ReportConfig): string {
    if (config.startDate && config.endDate) {
      return `${this.formatter.formatDate(config.startDate)} - ${this.formatter.formatDate(config.endDate)}`;
    }
    return 'Période non spécifiée';
  }

  /**
   * Appliquer les styles pour les budgets
   */
  private async applyBudgetStyles(worksheet: any): Promise<void> {
    // Styles des en-têtes
    const headerRow = worksheet.getRow(2);
    headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2E5BBA' } };
    headerRow.alignment = { horizontal: 'center' };

    // Styles des données
    worksheet.eachRow((row: any, rowNumber: number) => {
      if (rowNumber > 2) {
        row.eachCell((cell: any, colNumber: number) => {
          if (colNumber === 6) { // Colonne statut
            if (cell.value === 'DÉPASSEMENT') {
              cell.font = { color: { argb: 'FFD32F2F' }, bold: true };
            } else if (cell.value === 'ATTENTION') {
              cell.font = { color: { argb: 'FFF57C00' }, bold: true };
            } else {
              cell.font = { color: { argb: 'FF388E3C' }, bold: true };
            }
          }
        });
      }
    });

    // Bordures
    worksheet.eachRow((row: any) => {
      row.eachCell((cell: any) => {
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
   * Appliquer les styles pour les transactions
   */
  private async applyTransactionStyles(worksheet: any): Promise<void> {
    // Styles des en-têtes
    const headerRow = worksheet.getRow(2);
    headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2E5BBA' } };
    headerRow.alignment = { horizontal: 'center' };

    // Bordures
    worksheet.eachRow((row: any) => {
      row.eachCell((cell: any) => {
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
   * Appliquer les styles pour la trésorerie
   */
  private async applyCashFlowStyles(worksheet: any): Promise<void> {
    // Styles des en-têtes
    const headerRow = worksheet.getRow(2);
    headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2E5BBA' } };
    headerRow.alignment = { horizontal: 'center' };

    // Bordures
    worksheet.eachRow((row: any) => {
      row.eachCell((cell: any) => {
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' }
        };
      });
    });
  }
}

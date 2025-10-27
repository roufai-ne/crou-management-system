/**
 * FICHIER: packages\reports\src\reports\financial.pdf.ts
 * RAPPORT: FinancialPDFReport - Rapport financier PDF
 * 
 * DESCRIPTION:
 * Générateur de rapports financiers PDF
 * Mise en page institutionnelle et graphiques
 * 
 * FONCTIONNALITÉS:
 * - Rapport des budgets et transactions
 * - Graphiques et visualisations
 * - Mise en page CROU
 * - Support multilingue
 * 
 * AUTEUR: Équipe CROU
 * DATE: Décembre 2024
 */

import { PDFReportGenerator } from '../generators/pdf.generator';
import { ReportConfig, ReportData, ReportType, ReportFormat, ReportPeriod } from '../types/report.types';
import { ReportFormatter } from '../utils/formatter';

export class FinancialPDFReport {
  private generator: PDFReportGenerator;
  private formatter: ReportFormatter;

  constructor() {
    this.generator = new PDFReportGenerator();
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
    const html = this.generateBudgetHTML(data);
  return await this.generator.generate({ type: ReportType.PDF, format: ReportFormat.FINANCIAL, period: ReportPeriod.MONTHLY, tenantId: data.tenantId }, {
      title: 'Rapport de Budget',
      period: this.getPeriodText(data),
      generatedAt: new Date(),
      generatedBy: data.generatedBy || 'Système CROU',
  tenant: { name: data.tenantName || 'CROU', type: data.tenantType || 'Centre' },
      sections: []
    });
  }

  /**
   * Générer un rapport de transactions
   */
  async generateTransactionReport(data: any): Promise<Buffer> {
    const html = this.generateTransactionHTML(data);
  return await this.generator.generate({ type: ReportType.PDF, format: ReportFormat.FINANCIAL, period: ReportPeriod.MONTHLY, tenantId: data.tenantId }, {
      title: 'Rapport de Transactions',
      period: this.getPeriodText(data),
      generatedAt: new Date(),
      generatedBy: data.generatedBy || 'Système CROU',
  tenant: { name: data.tenantName || 'CROU', type: data.tenantType || 'Centre' },
      sections: []
    });
  }

  /**
   * Générer un rapport de trésorerie
   */
  async generateCashFlowReport(data: any): Promise<Buffer> {
    const html = this.generateCashFlowHTML(data);
  return await this.generator.generate({ type: ReportType.PDF, format: ReportFormat.FINANCIAL, period: ReportPeriod.MONTHLY, tenantId: data.tenantId }, {
      title: 'Rapport de Trésorerie',
      period: this.getPeriodText(data),
      generatedAt: new Date(),
      generatedBy: data.generatedBy || 'Système CROU',
  tenant: { name: data.tenantName || 'CROU', type: data.tenantType || 'Centre' },
      sections: []
    });
  }

  /**
   * Générer le HTML pour le rapport de budget
   */
  private generateBudgetHTML(data: any): string {
    const totalBudget = data.budgets?.reduce((sum: number, budget: any) => sum + budget.amount, 0) || 0;
    const totalSpent = data.budgets?.reduce((sum: number, budget: any) => sum + budget.spent, 0) || 0;
    const totalBalance = totalBudget - totalSpent;

    return `
      <!DOCTYPE html>
      <html lang="fr">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Rapport de Budget CROU</title>
        <style>
          ${this.getStyles()}
        </style>
      </head>
      <body>
        <div class="report-container">
          <!-- En-tête institutionnel -->
          <div class="institutional-header">
            <div class="logo-section">
              <h1>RÉPUBLIQUE DU NIGER</h1>
              <h2>MINISTÈRE DE L'ENSEIGNEMENT SUPÉRIEUR</h2>
              <h3>CENTRE RÉGIONAL DES ŒUVRES UNIVERSITAIRES</h3>
            </div>
            <div class="report-title">
              <h1>RAPPORT DE BUDGET</h1>
              <h2>Période: ${this.formatter.formatDate(data.startDate)} - ${this.formatter.formatDate(data.endDate)}</h2>
            </div>
          </div>

          <!-- Informations du rapport -->
          <div class="report-info">
            <div class="info-row">
              <span class="label">Centre:</span>
              <span class="value">${data.tenantName || 'CROU'}</span>
            </div>
            <div class="info-row">
              <span class="label">Généré le:</span>
              <span class="value">${this.formatter.formatDate(new Date())}</span>
            </div>
            <div class="info-row">
              <span class="label">Généré par:</span>
              <span class="value">${data.generatedBy || 'Système CROU'}</span>
            </div>
          </div>

          <!-- Résumé exécutif -->
          <div class="summary-section">
            <h2>RÉSUMÉ EXÉCUTIF</h2>
            <div class="summary-metrics">
              <div class="metric">
                <span class="metric-label">Budget Total:</span>
                <span class="metric-value">${this.formatter.formatFCFA(totalBudget)}</span>
              </div>
              <div class="metric">
                <span class="metric-label">Montant Dépensé:</span>
                <span class="metric-value">${this.formatter.formatFCFA(totalSpent)}</span>
              </div>
              <div class="metric">
                <span class="metric-label">Solde Restant:</span>
                <span class="metric-value ${totalBalance < 0 ? 'negative' : 'positive'}">${this.formatter.formatFCFA(totalBalance)}</span>
              </div>
              <div class="metric">
                <span class="metric-label">Taux d'Exécution:</span>
                <span class="metric-value">${totalBudget > 0 ? ((totalSpent / totalBudget) * 100).toFixed(1) : 0}%</span>
              </div>
            </div>
          </div>

          <!-- Tableau des budgets -->
          <div class="section">
            <h2>BUDGETS PAR CATÉGORIE</h2>
            <table class="data-table">
              <thead>
                <tr>
                  <th>Catégorie</th>
                  <th>Budget Alloué</th>
                  <th>Montant Dépensé</th>
                  <th>Solde</th>
                  <th>Progression</th>
                  <th>Statut</th>
                </tr>
              </thead>
              <tbody>
                ${data.budgets?.map((budget: any) => {
                  const progression = (budget.spent / budget.amount) * 100;
                  const solde = budget.amount - budget.spent;
                  const statut = solde < 0 ? 'DÉPASSEMENT' : progression > 80 ? 'ATTENTION' : 'NORMAL';
                  const statutClass = solde < 0 ? 'alert' : progression > 80 ? 'warning' : 'normal';

                  return `
                    <tr>
                      <td>${budget.category}</td>
                      <td class="currency">${this.formatter.formatFCFA(budget.amount)}</td>
                      <td class="currency">${this.formatter.formatFCFA(budget.spent)}</td>
                      <td class="currency ${solde < 0 ? 'negative' : 'positive'}">${this.formatter.formatFCFA(solde)}</td>
                      <td class="percentage">${progression.toFixed(1)}%</td>
                      <td class="${statutClass}">${statut}</td>
                    </tr>
                  `;
                }).join('') || '<tr><td colspan="6" class="text-center">Aucun budget trouvé</td></tr>'}
              </tbody>
              <tfoot>
                <tr class="total-row">
                  <td><strong>TOTAL</strong></td>
                  <td class="currency"><strong>${this.formatter.formatFCFA(totalBudget)}</strong></td>
                  <td class="currency"><strong>${this.formatter.formatFCFA(totalSpent)}</strong></td>
                  <td class="currency ${totalBalance < 0 ? 'negative' : 'positive'}"><strong>${this.formatter.formatFCFA(totalBalance)}</strong></td>
                  <td class="percentage"><strong>${totalBudget > 0 ? ((totalSpent / totalBudget) * 100).toFixed(1) : 0}%</strong></td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>

          <!-- Graphique de progression -->
          <div class="section">
            <h2>PROGRESSION DES BUDGETS</h2>
            <div class="chart-container">
              <div class="chart-placeholder">
                <p>Graphique de progression des budgets par catégorie</p>
                <p><em>Les graphiques seront générés automatiquement dans la version complète</em></p>
              </div>
            </div>
          </div>

          <!-- Pied de page -->
          <div class="footer">
            <hr>
            <p>Rapport généré automatiquement par le Système de Gestion CROU</p>
            <p>Centre: ${data.tenantName || 'CROU'} | Date: ${this.formatter.formatDate(new Date())}</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Générer le HTML pour le rapport de transactions
   */
  private generateTransactionHTML(data: any): string {
    const totalAmount = data.transactions?.reduce((sum: number, transaction: any) => sum + transaction.amount, 0) || 0;
    const creditAmount = data.transactions?.filter((t: any) => t.type === 'credit').reduce((sum: number, transaction: any) => sum + transaction.amount, 0) || 0;
    const debitAmount = data.transactions?.filter((t: any) => t.type === 'debit').reduce((sum: number, transaction: any) => sum + transaction.amount, 0) || 0;

    return `
      <!DOCTYPE html>
      <html lang="fr">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Rapport de Transactions CROU</title>
        <style>
          ${this.getStyles()}
        </style>
      </head>
      <body>
        <div class="report-container">
          <!-- En-tête institutionnel -->
          <div class="institutional-header">
            <div class="logo-section">
              <h1>RÉPUBLIQUE DU NIGER</h1>
              <h2>MINISTÈRE DE L'ENSEIGNEMENT SUPÉRIEUR</h2>
              <h3>CENTRE RÉGIONAL DES ŒUVRES UNIVERSITAIRES</h3>
            </div>
            <div class="report-title">
              <h1>RAPPORT DE TRANSACTIONS</h1>
              <h2>Période: ${this.formatter.formatDate(data.startDate)} - ${this.formatter.formatDate(data.endDate)}</h2>
            </div>
          </div>

          <!-- Informations du rapport -->
          <div class="report-info">
            <div class="info-row">
              <span class="label">Centre:</span>
              <span class="value">${data.tenantName || 'CROU'}</span>
            </div>
            <div class="info-row">
              <span class="label">Généré le:</span>
              <span class="value">${this.formatter.formatDate(new Date())}</span>
            </div>
            <div class="info-row">
              <span class="label">Généré par:</span>
              <span class="value">${data.generatedBy || 'Système CROU'}</span>
            </div>
          </div>

          <!-- Résumé exécutif -->
          <div class="summary-section">
            <h2>RÉSUMÉ EXÉCUTIF</h2>
            <div class="summary-metrics">
              <div class="metric">
                <span class="metric-label">Total Transactions:</span>
                <span class="metric-value">${data.transactions?.length || 0}</span>
              </div>
              <div class="metric">
                <span class="metric-label">Montant Total:</span>
                <span class="metric-value">${this.formatter.formatFCFA(totalAmount)}</span>
              </div>
              <div class="metric">
                <span class="metric-label">Crédits:</span>
                <span class="metric-value positive">${this.formatter.formatFCFA(creditAmount)}</span>
              </div>
              <div class="metric">
                <span class="metric-label">Débits:</span>
                <span class="metric-value negative">${this.formatter.formatFCFA(debitAmount)}</span>
              </div>
            </div>
          </div>

          <!-- Tableau des transactions -->
          <div class="section">
            <h2>TRANSACTIONS FINANCIÈRES</h2>
            <table class="data-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Description</th>
                  <th>Type</th>
                  <th>Montant</th>
                  <th>Catégorie</th>
                  <th>Statut</th>
                </tr>
              </thead>
              <tbody>
                ${data.transactions?.slice(0, 100).map((transaction: any) => `
                  <tr>
                    <td>${this.formatter.formatDate(transaction.date)}</td>
                    <td>${transaction.description}</td>
                    <td class="${transaction.type === 'credit' ? 'credit' : 'debit'}">${transaction.type === 'credit' ? 'CRÉDIT' : 'DÉBIT'}</td>
                    <td class="currency">${this.formatter.formatFCFA(transaction.amount)}</td>
                    <td>${transaction.category}</td>
                    <td class="${transaction.status}">${transaction.status}</td>
                  </tr>
                `).join('') || '<tr><td colspan="6" class="text-center">Aucune transaction trouvée</td></tr>'}
              </tbody>
            </table>
          </div>

          <!-- Pied de page -->
          <div class="footer">
            <hr>
            <p>Rapport généré automatiquement par le Système de Gestion CROU</p>
            <p>Centre: ${data.tenantName || 'CROU'} | Date: ${this.formatter.formatDate(new Date())}</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Générer le HTML pour le rapport de trésorerie
   */
  private generateCashFlowHTML(data: any): string {
    return `
      <!DOCTYPE html>
      <html lang="fr">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Rapport de Trésorerie CROU</title>
        <style>
          ${this.getStyles()}
        </style>
      </head>
      <body>
        <div class="report-container">
          <!-- En-tête institutionnel -->
          <div class="institutional-header">
            <div class="logo-section">
              <h1>RÉPUBLIQUE DU NIGER</h1>
              <h2>MINISTÈRE DE L'ENSEIGNEMENT SUPÉRIEUR</h2>
              <h3>CENTRE RÉGIONAL DES ŒUVRES UNIVERSITAIRES</h3>
            </div>
            <div class="report-title">
              <h1>RAPPORT DE TRÉSORERIE</h1>
              <h2>Période: ${this.formatter.formatDate(data.startDate)} - ${this.formatter.formatDate(data.endDate)}</h2>
            </div>
          </div>

          <!-- Informations du rapport -->
          <div class="report-info">
            <div class="info-row">
              <span class="label">Centre:</span>
              <span class="value">${data.tenantName || 'CROU'}</span>
            </div>
            <div class="info-row">
              <span class="label">Généré le:</span>
              <span class="value">${this.formatter.formatDate(new Date())}</span>
            </div>
            <div class="info-row">
              <span class="label">Généré par:</span>
              <span class="value">${data.generatedBy || 'Système CROU'}</span>
            </div>
          </div>

          <!-- Tableau de trésorerie -->
          <div class="section">
            <h2>TRÉSORERIE PAR MOIS</h2>
            <table class="data-table">
              <thead>
                <tr>
                  <th>Mois</th>
                  <th>Recettes</th>
                  <th>Dépenses</th>
                  <th>Solde</th>
                  <th>Cumul</th>
                </tr>
              </thead>
              <tbody>
                ${data.cashFlow?.map((month: any, index: number) => {
                  const solde = month.recettes - month.depenses;
                  const cumul = data.cashFlow.slice(0, index + 1).reduce((sum: number, m: any) => sum + (m.recettes - m.depenses), 0);
                  
                  return `
                    <tr>
                      <td>${month.mois}</td>
                      <td class="currency positive">${this.formatter.formatFCFA(month.recettes)}</td>
                      <td class="currency negative">${this.formatter.formatFCFA(month.depenses)}</td>
                      <td class="currency ${solde >= 0 ? 'positive' : 'negative'}">${this.formatter.formatFCFA(solde)}</td>
                      <td class="currency ${cumul >= 0 ? 'positive' : 'negative'}">${this.formatter.formatFCFA(cumul)}</td>
                    </tr>
                  `;
                }).join('') || '<tr><td colspan="5" class="text-center">Aucune donnée de trésorerie</td></tr>'}
              </tbody>
            </table>
          </div>

          <!-- Pied de page -->
          <div class="footer">
            <hr>
            <p>Rapport généré automatiquement par le Système de Gestion CROU</p>
            <p>Centre: ${data.tenantName || 'CROU'} | Date: ${this.formatter.formatDate(new Date())}</p>
          </div>
        </div>
      </body>
      </html>
    `;
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

    return sections;
  }

  /**
   * Obtenir le texte de la période
   */
  private getPeriodText(config: any): string {
    if (config.startDate && config.endDate) {
      return `${this.formatter.formatDate(config.startDate)} - ${this.formatter.formatDate(config.endDate)}`;
    }
    return 'Période non spécifiée';
  }

  /**
   * Obtenir les styles CSS
   */
  private getStyles(): string {
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

      .logo-section h1 {
        font-size: 16px;
        font-weight: bold;
        color: #2E5BBA;
        margin-bottom: 5px;
      }

      .logo-section h2 {
        font-size: 14px;
        font-weight: bold;
        color: #666;
        margin-bottom: 5px;
      }

      .logo-section h3 {
        font-size: 12px;
        font-weight: bold;
        color: #888;
        margin-bottom: 10px;
      }

      .report-title h1 {
        font-size: 18px;
        font-weight: bold;
        color: #2E5BBA;
        margin-top: 20px;
      }

      .report-title h2 {
        font-size: 14px;
        font-weight: normal;
        color: #666;
        margin-top: 5px;
      }

      .report-info {
        background: #f8f9fa;
        padding: 15px;
        border-radius: 5px;
        margin-bottom: 20px;
      }

      .info-row {
        display: flex;
        margin-bottom: 5px;
      }

      .info-row .label {
        font-weight: bold;
        width: 120px;
        color: #2E5BBA;
      }

      .info-row .value {
        color: #333;
      }

      .summary-section {
        background: #e3f2fd;
        padding: 20px;
        border-radius: 5px;
        margin-bottom: 20px;
      }

      .summary-section h2 {
        font-size: 16px;
        font-weight: bold;
        color: #2E5BBA;
        margin-bottom: 15px;
      }

      .summary-metrics {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 10px;
      }

      .metric {
        display: flex;
        justify-content: space-between;
        padding: 8px;
        background: white;
        border-radius: 3px;
      }

      .metric-label {
        font-weight: bold;
        color: #666;
      }

      .metric-value {
        font-weight: bold;
        color: #2E5BBA;
      }

      .metric-value.positive {
        color: #388e3c;
      }

      .metric-value.negative {
        color: #d32f2f;
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

      .data-table tr:hover {
        background-color: #f5f5f5;
      }

      .total-row {
        background-color: #f0f0f0;
        font-weight: bold;
      }

      .currency {
        text-align: right;
      }

      .percentage {
        text-align: center;
      }

      .positive {
        color: #388e3c;
        font-weight: bold;
      }

      .negative {
        color: #d32f2f;
        font-weight: bold;
      }

      .credit {
        color: #388e3c;
        font-weight: bold;
      }

      .debit {
        color: #d32f2f;
        font-weight: bold;
      }

      .alert {
        color: #d32f2f;
        font-weight: bold;
      }

      .warning {
        color: #f57c00;
        font-weight: bold;
      }

      .normal {
        color: #388e3c;
        font-weight: bold;
      }

      .text-center {
        text-align: center;
      }

      .chart-container {
        background: #f8f9fa;
        padding: 20px;
        border-radius: 5px;
        text-align: center;
      }

      .chart-placeholder {
        color: #666;
        font-style: italic;
      }

      .footer {
        margin-top: 40px;
        text-align: center;
        font-size: 10px;
        color: #666;
      }

      .footer hr {
        border: none;
        border-top: 1px solid #ddd;
        margin-bottom: 10px;
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

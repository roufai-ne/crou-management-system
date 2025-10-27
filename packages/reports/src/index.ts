/**
 * FICHIER: packages\reports\src\index.ts
 * EXPORTS: Point d'entrée du package reports
 * 
 * DESCRIPTION:
 * Exporte tous les générateurs de rapports
 * Excel, PDF, et utilitaires
 * 
 * AUTEUR: Équipe CROU
 * DATE: Décembre 2024
 */

// Générateurs Excel
export { ExcelReportGenerator } from './generators/excel.generator';
export { FinancialExcelReport } from './reports/financial.excel';
export { StocksExcelReport } from './reports/stocks.excel';
export { HousingExcelReport } from './reports/housing.excel';
export { TransportExcelReport } from './reports/transport.excel';
export { WorkflowExcelReport } from './reports/workflow.excel';

// Générateurs PDF
export { PDFReportGenerator } from './generators/pdf.generator';
export { FinancialPDFReport } from './reports/financial.pdf';
export { DashboardPDFReport } from './reports/dashboard.pdf';
export { AuditPDFReport } from './reports/audit.pdf';

// Utilitaires
export { ReportFormatter } from './utils/formatter';
export { ReportTemplates } from './templates/templates';
export { ReportConfig } from './config/report.config';

// Types
export * from './types/report.types';

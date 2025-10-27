/**
 * FICHIER: packages\reports\src\types\report.types.ts
 * TYPES: Types pour le système de rapports
 * 
 * DESCRIPTION:
 * Définit tous les types et interfaces
 * pour la génération de rapports
 * 
 * AUTEUR: Équipe CROU
 * DATE: Décembre 2024
 */

// Types de rapports
export enum ReportType {
  EXCEL = 'excel',
  PDF = 'pdf',
  CSV = 'csv'
}

export enum ReportFormat {
  FINANCIAL = 'financial',
  STOCKS = 'stocks',
  HOUSING = 'housing',
  TRANSPORT = 'transport',
  WORKFLOW = 'workflow',
  DASHBOARD = 'dashboard',
  AUDIT = 'audit'
}

export enum ReportPeriod {
  DAILY = 'daily',
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
  QUARTERLY = 'quarterly',
  YEARLY = 'yearly',
  CUSTOM = 'custom'
}

// Configuration des rapports
export interface ReportConfig {
  type: ReportType;
  format: ReportFormat;
  period: ReportPeriod;
  startDate?: Date;
  endDate?: Date;
  tenantId: string;
  filters?: ReportFilters;
  options?: ReportOptions;
}

export interface ReportFilters {
  module?: string;
  status?: string;
  priority?: string;
  userId?: string;
  department?: string;
  region?: string;
  [key: string]: any;
}

export interface ReportOptions {
  includeCharts?: boolean;
  includeDetails?: boolean;
  includeSummary?: boolean;
  language?: 'fr' | 'en';
  timezone?: string;
  currency?: string;
  [key: string]: any;
}

// Données de rapport
export interface ReportData {
  title: string;
  subtitle?: string;
  period: string;
  generatedAt: Date;
  generatedBy: string;
  tenant: {
    name: string;
    type: string;
    region?: string;
  };
  summary?: ReportSummary;
  sections: ReportSection[];
  metadata?: any;
}

export interface ReportSummary {
  totalRecords: number;
  totalAmount?: number;
  averageAmount?: number;
  growthRate?: number;
  keyMetrics: ReportMetric[];
}

export interface ReportMetric {
  name: string;
  value: number | string;
  unit?: string;
  change?: number;
  trend?: 'up' | 'down' | 'stable';
}

export interface ReportSection {
  title: string;
  type: 'table' | 'chart' | 'text' | 'image';
  data: any;
  columns?: ReportColumn[];
  chart?: ChartConfig;
  style?: SectionStyle;
}

export interface ReportColumn {
  key: string;
  title: string;
  type: 'string' | 'number' | 'currency' | 'date' | 'boolean';
  format?: string;
  width?: number;
  align?: 'left' | 'center' | 'right';
}

export interface ChartConfig {
  type: 'line' | 'bar' | 'pie' | 'doughnut' | 'area';
  data: any;
  options?: any;
  width?: number;
  height?: number;
}

export interface SectionStyle {
  backgroundColor?: string;
  textColor?: string;
  fontSize?: number;
  fontWeight?: 'normal' | 'bold';
  border?: boolean;
  padding?: number;
}

// Générateurs
export interface ReportGenerator {
  generate(config: ReportConfig, data: ReportData): Promise<Buffer>;
  validate(config: ReportConfig): boolean;
  getSupportedFormats(): ReportFormat[];
}

export interface ExcelGenerator extends ReportGenerator {
  addWorksheet(name: string, data: any[]): void;
  addChart(worksheet: string, chart: ChartConfig): void;
  addFormula(cell: string, formula: string): void;
  setStyle(range: string, style: any): void;
}

export interface PDFGenerator extends ReportGenerator {
  addHeader(content: string): void;
  addFooter(content: string): void;
  addPageBreak(): void;
  addTable(data: any[], columns: ReportColumn[]): void;
  addChart(chart: ChartConfig): void;
  addText(content: string, style?: any): void;
}

// Templates
export interface ReportTemplate {
  name: string;
  format: ReportFormat;
  type: ReportType;
  sections: TemplateSection[];
  styles: TemplateStyles;
  metadata: TemplateMetadata;
}

export interface TemplateSection {
  id: string;
  title: string;
  type: 'header' | 'summary' | 'table' | 'chart' | 'footer';
  required: boolean;
  order: number;
  config: any;
}

export interface TemplateStyles {
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    text: string;
  };
  fonts: {
    title: FontConfig;
    subtitle: FontConfig;
    body: FontConfig;
    caption: FontConfig;
  };
  spacing: {
    margin: number;
    padding: number;
    lineHeight: number;
  };
}

export interface FontConfig {
  family: string;
  size: number;
  weight: 'normal' | 'bold' | 'light';
  color: string;
}

export interface TemplateMetadata {
  version: string;
  author: string;
  description: string;
  tags: string[];
  lastModified: Date;
}

// Résultats
export interface ReportResult {
  success: boolean;
  data?: Buffer;
  filename?: string;
  mimeType?: string;
  size?: number;
  error?: string;
  metadata?: {
    generatedAt: Date;
    duration: number;
    recordCount: number;
  };
}

export interface ReportProgress {
  step: string;
  progress: number;
  message: string;
  data?: any;
}

// Callbacks
export type ReportProgressCallback = (progress: ReportProgress) => void;
export type ReportErrorCallback = (error: Error) => void;
export type ReportCompleteCallback = (result: ReportResult) => void;

/**
 * FICHIER: apps/web/src/services/api/reportsService.ts
 * SERVICE: ReportsService - Service pour la génération de rapports
 *
 * DESCRIPTION:
 * Service pour la génération de rapports Excel et PDF
 * Support des graphiques, tableaux croisés dynamiques
 * Templates personnalisables et formats institutionnels
 *
 * FONCTIONNALITÉS:
 * - Génération Excel avec graphiques intégrés
 * - Génération PDF avec mise en forme institutionnelle
 * - Templates de rapports prédéfinis
 * - Rapports consolidés multi-modules
 * - Exports personnalisés
 * - Planification automatique
 *
 * AUTEUR: Équipe CROU
 * DATE: Décembre 2024
 */

import { apiClient } from './apiClient';

// Types pour les rapports
export interface ReportTemplate {
  id: string;
  name: string;
  description: string;
  module: 'financial' | 'stocks' | 'housing' | 'transport' | 'consolidated';
  type: 'excel' | 'pdf' | 'both';
  frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly' | 'on_demand';
  parameters: ReportParameter[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ReportParameter {
  id: string;
  name: string;
  type: 'date' | 'date_range' | 'select' | 'text' | 'number' | 'boolean';
  label: string;
  required: boolean;
  defaultValue?: any;
  options?: Array<{ value: string; label: string }>;
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
  };
}

export interface ReportRequest {
  templateId: string;
  parameters: Record<string, any>;
  format: 'excel' | 'pdf';
  includeCharts: boolean;
  includePivotTables: boolean;
  customTitle?: string;
  customDescription?: string;
}

export interface ReportJob {
  id: string;
  templateId: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  parameters: Record<string, any>;
  format: 'excel' | 'pdf';
  fileUrl?: string;
  fileName?: string;
  fileSize?: number;
  errorMessage?: string;
  createdAt: Date;
  completedAt?: Date;
  expiresAt?: Date;
}

export interface ReportData {
  title: string;
  description: string;
  generatedAt: Date;
  period: {
    start: Date;
    end: Date;
  };
  tenant: {
    id: string;
    name: string;
    type: 'ministere' | 'crou';
  };
  data: {
    summary: Record<string, any>;
    charts: ChartData[];
    tables: TableData[];
    pivotTables: PivotTableData[];
  };
}

export interface ChartData {
  id: string;
  type: 'line' | 'bar' | 'pie' | 'doughnut' | 'area' | 'scatter';
  title: string;
  data: Array<{
    label: string;
    value: number;
    color?: string;
  }>;
  options?: {
    showLegend?: boolean;
    showDataLabels?: boolean;
    showGridLines?: boolean;
    colors?: string[];
  };
}

export interface TableData {
  id: string;
  title: string;
  headers: string[];
  rows: Array<Record<string, any>>;
  summary?: {
    total: number;
    average: number;
    min: number;
    max: number;
  };
}

export interface PivotTableData {
  id: string;
  title: string;
  sourceTable: string;
  rows: string[];
  columns: string[];
  values: Array<{
    field: string;
    function: 'sum' | 'count' | 'average' | 'min' | 'max';
  }>;
  filters?: Record<string, any>;
}

// Types pour les rapports spécifiques
export interface FinancialReportData extends ReportData {
  data: {
    summary: {
      totalBudget: number;
      totalSpent: number;
      remainingBudget: number;
      budgetUtilization: number;
      monthlyTrend: Array<{
        month: string;
        budget: number;
        spent: number;
        variance: number;
      }>;
    };
    charts: ChartData[];
    tables: TableData[];
  };
}

export interface StocksReportData extends ReportData {
  data: {
    summary: {
      totalItems: number;
      totalValue: number;
      lowStockItems: number;
      topCategories: Array<{
        category: string;
        count: number;
        value: number;
        percentage: number;
      }>;
    };
    charts: ChartData[];
    tables: TableData[];
  };
}

export interface HousingReportData extends ReportData {
  data: {
    summary: {
      totalComplexes: number;
      totalRooms: number;
      occupiedRooms: number;
      occupancyRate: number;
      monthlyRevenue: number;
      topComplexes: Array<{
        name: string;
        occupancyRate: number;
        revenue: number;
      }>;
    };
    charts: ChartData[];
    tables: TableData[];
  };
}

export interface TransportReportData extends ReportData {
  data: {
    summary: {
      totalVehicles: number;
      activeVehicles: number;
      totalMileage: number;
      averageEfficiency: number;
      maintenanceCost: number;
      topRoutes: Array<{
        name: string;
        tripCount: number;
        passengerCount: number;
      }>;
    };
    charts: ChartData[];
    tables: TableData[];
  };
}

export interface ConsolidatedReportData extends ReportData {
  data: {
    summary: {
      totalCrous: number;
      totalBudget: number;
      totalStudents: number;
      overallPerformance: number;
      regionalBreakdown: Array<{
        region: string;
        budget: number;
        students: number;
        performance: number;
      }>;
    };
    charts: ChartData[];
    tables: TableData[];
  };
}

class ReportsService {
  private baseUrl = '/reports';

  // === TEMPLATES DE RAPPORTS ===

  /**
   * Récupère la liste des templates de rapports
   */
  async getTemplates(params?: {
    module?: string;
    type?: string;
    frequency?: string;
    isActive?: boolean;
    tenantId?: string;
  }): Promise<{
    templates: ReportTemplate[];
    total: number;
  }> {
    try {
      const queryParams = new URLSearchParams();
      if (params?.module) queryParams.append('module', params.module);
      if (params?.type) queryParams.append('type', params.type);
      if (params?.frequency) queryParams.append('frequency', params.frequency);
      if (params?.isActive !== undefined) queryParams.append('isActive', params.isActive.toString());
      if (params?.tenantId) queryParams.append('tenantId', params.tenantId);

      const response = await apiClient.get(`${this.baseUrl}/templates?${queryParams.toString()}`);
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la récupération des templates:', error);
      throw error;
    }
  }

  /**
   * Récupère un template par ID
   */
  async getTemplate(id: string): Promise<ReportTemplate> {
    try {
      const response = await apiClient.get(`${this.baseUrl}/templates/${id}`);
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la récupération du template:', error);
      throw error;
    }
  }

  /**
   * Crée un nouveau template
   */
  async createTemplate(data: Partial<ReportTemplate>): Promise<ReportTemplate> {
    try {
      const response = await apiClient.post(`${this.baseUrl}/templates`, data);
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la création du template:', error);
      throw error;
    }
  }

  /**
   * Met à jour un template
   */
  async updateTemplate(id: string, data: Partial<ReportTemplate>): Promise<ReportTemplate> {
    try {
      const response = await apiClient.put(`${this.baseUrl}/templates/${id}`, data);
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la mise à jour du template:', error);
      throw error;
    }
  }

  /**
   * Supprime un template
   */
  async deleteTemplate(id: string): Promise<void> {
    try {
      await apiClient.delete(`${this.baseUrl}/templates/${id}`);
    } catch (error) {
      console.error('Erreur lors de la suppression du template:', error);
      throw error;
    }
  }

  // === GÉNÉRATION DE RAPPORTS ===

  /**
   * Génère un rapport
   */
  async generateReport(request: ReportRequest): Promise<ReportJob> {
    try {
      const response = await apiClient.post(`${this.baseUrl}/generate`, request);
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la génération du rapport:', error);
      throw error;
    }
  }

  /**
   * Récupère le statut d'un job de rapport
   */
  async getReportJob(jobId: string): Promise<ReportJob> {
    try {
      const response = await apiClient.get(`${this.baseUrl}/jobs/${jobId}`);
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la récupération du job:', error);
      throw error;
    }
  }

  /**
   * Récupère la liste des jobs de rapports
   */
  async getReportJobs(params?: {
    status?: string;
    templateId?: string;
    dateFrom?: Date;
    dateTo?: Date;
    tenantId?: string;
  }): Promise<{
    jobs: ReportJob[];
    total: number;
  }> {
    try {
      const queryParams = new URLSearchParams();
      if (params?.status) queryParams.append('status', params.status);
      if (params?.templateId) queryParams.append('templateId', params.templateId);
      if (params?.dateFrom) queryParams.append('dateFrom', params.dateFrom.toISOString());
      if (params?.dateTo) queryParams.append('dateTo', params.dateTo.toISOString());
      if (params?.tenantId) queryParams.append('tenantId', params.tenantId);

      const response = await apiClient.get(`${this.baseUrl}/jobs?${queryParams.toString()}`);
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la récupération des jobs:', error);
      throw error;
    }
  }

  /**
   * Télécharge un rapport généré
   */
  async downloadReport(jobId: string): Promise<Blob> {
    try {
      const response = await apiClient.get(`${this.baseUrl}/download/${jobId}`, {
        responseType: 'blob'
      });
      return response.data;
    } catch (error) {
      console.error('Erreur lors du téléchargement du rapport:', error);
      throw error;
    }
  }

  /**
   * Supprime un rapport généré
   */
  async deleteReport(jobId: string): Promise<void> {
    try {
      await apiClient.delete(`${this.baseUrl}/jobs/${jobId}`);
    } catch (error) {
      console.error('Erreur lors de la suppression du rapport:', error);
      throw error;
    }
  }

  // === RAPPORTS PRÉDÉFINIS ===

  /**
   * Génère un rapport financier
   */
  async generateFinancialReport(params: {
    startDate: Date;
    endDate: Date;
    format: 'excel' | 'pdf';
    includeCharts?: boolean;
    tenantId?: string;
  }): Promise<ReportJob> {
    try {
      const response = await apiClient.post(`${this.baseUrl}/financial`, {
        ...params,
        includeCharts: params.includeCharts ?? true
      });
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la génération du rapport financier:', error);
      throw error;
    }
  }

  /**
   * Génère un rapport de stocks
   */
  async generateStocksReport(params: {
    startDate: Date;
    endDate: Date;
    format: 'excel' | 'pdf';
    includeCharts?: boolean;
    tenantId?: string;
  }): Promise<ReportJob> {
    try {
      const response = await apiClient.post(`${this.baseUrl}/stocks`, {
        ...params,
        includeCharts: params.includeCharts ?? true
      });
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la génération du rapport de stocks:', error);
      throw error;
    }
  }

  /**
   * Génère un rapport de logement
   */
  async generateHousingReport(params: {
    startDate: Date;
    endDate: Date;
    format: 'excel' | 'pdf';
    includeCharts?: boolean;
    tenantId?: string;
  }): Promise<ReportJob> {
    try {
      const response = await apiClient.post(`${this.baseUrl}/housing`, {
        ...params,
        includeCharts: params.includeCharts ?? true
      });
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la génération du rapport de logement:', error);
      throw error;
    }
  }

  /**
   * Génère un rapport de transport
   */
  async generateTransportReport(params: {
    startDate: Date;
    endDate: Date;
    format: 'excel' | 'pdf';
    includeCharts?: boolean;
    tenantId?: string;
  }): Promise<ReportJob> {
    try {
      const response = await apiClient.post(`${this.baseUrl}/transport`, {
        ...params,
        includeCharts: params.includeCharts ?? true
      });
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la génération du rapport de transport:', error);
      throw error;
    }
  }

  /**
   * Génère un rapport consolidé
   */
  async generateConsolidatedReport(params: {
    startDate: Date;
    endDate: Date;
    format: 'excel' | 'pdf';
    includeCharts?: boolean;
    tenantId?: string;
  }): Promise<ReportJob> {
    try {
      const response = await apiClient.post(`${this.baseUrl}/consolidated`, {
        ...params,
        includeCharts: params.includeCharts ?? true
      });
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la génération du rapport consolidé:', error);
      throw error;
    }
  }

  // === RAPPORTS AUTOMATIQUES ===

  /**
   * Planifie un rapport automatique
   */
  async scheduleReport(params: {
    templateId: string;
    frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';
    time: string; // HH:MM format
    parameters: Record<string, any>;
    format: 'excel' | 'pdf';
    emailRecipients: string[];
    tenantId?: string;
  }): Promise<{
    id: string;
    message: string;
  }> {
    try {
      const response = await apiClient.post(`${this.baseUrl}/schedule`, params);
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la planification du rapport:', error);
      throw error;
    }
  }

  /**
   * Récupère les rapports planifiés
   */
  async getScheduledReports(tenantId?: string): Promise<Array<{
    id: string;
    templateId: string;
    frequency: string;
    time: string;
    nextRun: Date;
    isActive: boolean;
    createdAt: Date;
  }>> {
    try {
      const params = tenantId ? `?tenantId=${tenantId}` : '';
      const response = await apiClient.get(`${this.baseUrl}/scheduled${params}`);
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la récupération des rapports planifiés:', error);
      throw error;
    }
  }

  /**
   * Met à jour un rapport planifié
   */
  async updateScheduledReport(id: string, data: {
    frequency?: string;
    time?: string;
    isActive?: boolean;
    emailRecipients?: string[];
  }): Promise<void> {
    try {
      await apiClient.put(`${this.baseUrl}/scheduled/${id}`, data);
    } catch (error) {
      console.error('Erreur lors de la mise à jour du rapport planifié:', error);
      throw error;
    }
  }

  /**
   * Supprime un rapport planifié
   */
  async deleteScheduledReport(id: string): Promise<void> {
    try {
      await apiClient.delete(`${this.baseUrl}/scheduled/${id}`);
    } catch (error) {
      console.error('Erreur lors de la suppression du rapport planifié:', error);
      throw error;
    }
  }

  // === UTILITAIRES ===

  /**
   * Récupère les formats de rapports supportés
   */
  async getSupportedFormats(): Promise<Array<{
    id: string;
    name: string;
    extension: string;
    mimeType: string;
    description: string;
  }>> {
    try {
      const response = await apiClient.get(`${this.baseUrl}/formats`);
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la récupération des formats:', error);
      throw error;
    }
  }

  /**
   * Récupère les types de graphiques supportés
   */
  async getSupportedChartTypes(): Promise<Array<{
    id: string;
    name: string;
    description: string;
    supportedFormats: string[];
  }>> {
    try {
      const response = await apiClient.get(`${this.baseUrl}/chart-types`);
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la récupération des types de graphiques:', error);
      throw error;
    }
  }

  /**
   * Valide les paramètres d'un rapport
   */
  async validateReportParameters(templateId: string, parameters: Record<string, any>): Promise<{
    isValid: boolean;
    errors: Array<{
      parameter: string;
      message: string;
    }>;
  }> {
    try {
      const response = await apiClient.post(`${this.baseUrl}/validate`, {
        templateId,
        parameters
      });
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la validation des paramètres:', error);
      throw error;
    }
  }
}

export const reportsService = new ReportsService();

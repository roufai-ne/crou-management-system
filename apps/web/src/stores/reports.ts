/**
 * FICHIER: apps/web/src/stores/reports.ts
 * STORE: ReportsStore - Store Zustand pour la gestion des rapports
 *
 * DESCRIPTION:
 * Store centralisé pour la gestion de l'état des rapports
 * Gestion des templates, jobs et rapports planifiés
 * Support multi-tenant avec cache intelligent
 *
 * FONCTIONNALITÉS:
 * - Gestion des templates de rapports
 * - Génération et suivi des rapports
 * - Rapports planifiés
 * - Cache et synchronisation
 * - Gestion des erreurs
 *
 * AUTEUR: Équipe CROU
 * DATE: Décembre 2024
 */

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { 
  ReportTemplate, 
  ReportJob, 
  ReportRequest,
  reportsService 
} from '@/services/api/reportsService';

// Interface pour l'état des rapports
interface ReportsState {
  // Templates
  templates: ReportTemplate[];
  templatesLoading: boolean;
  templatesError: string | null;
  
  // Jobs de rapports
  jobs: ReportJob[];
  jobsLoading: boolean;
  jobsError: string | null;
  
  // Rapports planifiés
  scheduledReports: Array<{
    id: string;
    templateId: string;
    frequency: string;
    time: string;
    nextRun: Date;
    isActive: boolean;
    createdAt: Date;
  }>;
  scheduledLoading: boolean;
  scheduledError: string | null;
  
  // Formats et types supportés
  supportedFormats: Array<{
    id: string;
    name: string;
    extension: string;
    mimeType: string;
    description: string;
  }>;
  supportedChartTypes: Array<{
    id: string;
    name: string;
    description: string;
    supportedFormats: string[];
  }>;
  
  // Filtres et pagination
  filters: {
    module: string;
    type: string;
    status: string;
    dateFrom: Date;
    dateTo: Date;
  };
  
  pagination: {
    page: number;
    limit: number;
    total: number;
  };
  
  // Cache
  lastFetch: number | null;
  cacheExpiry: number; // 5 minutes
}

// Interface pour les actions
interface ReportsActions {
  // Templates
  loadTemplates: (tenantId: string, filters?: Partial<ReportsState['filters']>) => Promise<void>;
  createTemplate: (data: Partial<ReportTemplate>, tenantId: string) => Promise<void>;
  updateTemplate: (id: string, data: Partial<ReportTemplate>, tenantId: string) => Promise<void>;
  deleteTemplate: (id: string, tenantId: string) => Promise<void>;
  
  // Jobs de rapports
  loadJobs: (tenantId: string, filters?: any) => Promise<void>;
  generateReport: (request: ReportRequest, tenantId: string) => Promise<ReportJob>;
  getJobStatus: (jobId: string) => Promise<ReportJob>;
  downloadReport: (jobId: string) => Promise<Blob>;
  deleteJob: (jobId: string, tenantId: string) => Promise<void>;
  
  // Rapports planifiés
  loadScheduledReports: (tenantId: string) => Promise<void>;
  scheduleReport: (data: any, tenantId: string) => Promise<void>;
  updateScheduledReport: (id: string, data: any, tenantId: string) => Promise<void>;
  deleteScheduledReport: (id: string, tenantId: string) => Promise<void>;
  
  // Formats et types
  loadSupportedFormats: () => Promise<void>;
  loadSupportedChartTypes: () => Promise<void>;
  
  // Filtres et pagination
  setFilters: (filters: Partial<ReportsState['filters']>) => void;
  setPagination: (pagination: Partial<ReportsState['pagination']>) => void;
  
  // Cache et synchronisation
  refreshAll: (tenantId: string) => Promise<void>;
  clearCache: () => void;
  
  // Utilitaires
  getTemplateById: (id: string) => ReportTemplate | undefined;
  getJobById: (id: string) => ReportJob | undefined;
  getTemplatesByModule: (module: string) => ReportTemplate[];
  getJobsByStatus: (status: string) => ReportJob[];
  getActiveJobs: () => ReportJob[];
  getCompletedJobs: () => ReportJob[];
  getFailedJobs: () => ReportJob[];
}

// Store principal
export const useReports = create<ReportsState & ReportsActions>()(
  devtools(
    persist(
      (set, get) => ({
        // État initial
        templates: [],
        templatesLoading: false,
        templatesError: null,
        
        jobs: [],
        jobsLoading: false,
        jobsError: null,
        
        scheduledReports: [],
        scheduledLoading: false,
        scheduledError: null,
        
        supportedFormats: [],
        supportedChartTypes: [],
        
        filters: {
          module: 'all',
          type: 'all',
          status: 'all',
          dateFrom: new Date(new Date().setMonth(new Date().getMonth() - 1)),
          dateTo: new Date()
        },
        
        pagination: {
          page: 1,
          limit: 10,
          total: 0
        },
        
        lastFetch: null,
        cacheExpiry: 5 * 60 * 1000, // 5 minutes
        
        // Actions pour les templates
        loadTemplates: async (tenantId: string, filters?: Partial<ReportsState['filters']>) => {
          set({ templatesLoading: true, templatesError: null });
          
          try {
            const currentFilters = { ...get().filters, ...filters };
            const response = await reportsService.getTemplates({
              tenantId,
              ...currentFilters
            });
            
            set({
              templates: response.templates,
              pagination: {
                ...get().pagination,
                total: response.total
              },
              templatesLoading: false,
              lastFetch: Date.now()
            });
          } catch (error: any) {
            set({
              templatesLoading: false,
              templatesError: error.message || 'Erreur lors du chargement des templates'
            });
          }
        },
        
        createTemplate: async (data: Partial<ReportTemplate>, tenantId: string) => {
          try {
            await reportsService.createTemplate(data);
            await get().loadTemplates(tenantId);
          } catch (error: any) {
            set({ templatesError: error.message || 'Erreur lors de la création du template' });
            throw error;
          }
        },
        
        updateTemplate: async (id: string, data: Partial<ReportTemplate>, tenantId: string) => {
          try {
            await reportsService.updateTemplate(id, data);
            await get().loadTemplates(tenantId);
          } catch (error: any) {
            set({ templatesError: error.message || 'Erreur lors de la mise à jour du template' });
            throw error;
          }
        },
        
        deleteTemplate: async (id: string, tenantId: string) => {
          try {
            await reportsService.deleteTemplate(id);
            await get().loadTemplates(tenantId);
          } catch (error: any) {
            set({ templatesError: error.message || 'Erreur lors de la suppression du template' });
            throw error;
          }
        },
        
        // Actions pour les jobs de rapports
        loadJobs: async (tenantId: string, filters?: any) => {
          set({ jobsLoading: true, jobsError: null });
          
          try {
            const response = await reportsService.getReportJobs({
              tenantId,
              ...filters
            });
            
            set({
              jobs: response.jobs,
              jobsLoading: false,
              lastFetch: Date.now()
            });
          } catch (error: any) {
            set({
              jobsLoading: false,
              jobsError: error.message || 'Erreur lors du chargement des jobs'
            });
          }
        },
        
        generateReport: async (request: ReportRequest, tenantId: string) => {
          try {
            const job = await reportsService.generateReport(request);
            set(state => ({
              jobs: [job, ...state.jobs]
            }));
            return job;
          } catch (error: any) {
            set({ jobsError: error.message || 'Erreur lors de la génération du rapport' });
            throw error;
          }
        },
        
        getJobStatus: async (jobId: string) => {
          try {
            const job = await reportsService.getReportJob(jobId);
            set(state => ({
              jobs: state.jobs.map(j => j.id === jobId ? job : j)
            }));
            return job;
          } catch (error: any) {
            set({ jobsError: error.message || 'Erreur lors de la récupération du statut du job' });
            throw error;
          }
        },
        
        downloadReport: async (jobId: string) => {
          try {
            return await reportsService.downloadReport(jobId);
          } catch (error: any) {
            set({ jobsError: error.message || 'Erreur lors du téléchargement du rapport' });
            throw error;
          }
        },
        
        deleteJob: async (jobId: string, tenantId: string) => {
          try {
            await reportsService.deleteReport(jobId);
            set(state => ({
              jobs: state.jobs.filter(job => job.id !== jobId)
            }));
          } catch (error: any) {
            set({ jobsError: error.message || 'Erreur lors de la suppression du job' });
            throw error;
          }
        },
        
        // Actions pour les rapports planifiés
        loadScheduledReports: async (tenantId: string) => {
          set({ scheduledLoading: true, scheduledError: null });
          
          try {
            const scheduledReports = await reportsService.getScheduledReports(tenantId);
            set({
              scheduledReports,
              scheduledLoading: false,
              lastFetch: Date.now()
            });
          } catch (error: any) {
            set({
              scheduledLoading: false,
              scheduledError: error.message || 'Erreur lors du chargement des rapports planifiés'
            });
          }
        },
        
        scheduleReport: async (data: any, tenantId: string) => {
          try {
            await reportsService.scheduleReport(data);
            await get().loadScheduledReports(tenantId);
          } catch (error: any) {
            set({ scheduledError: error.message || 'Erreur lors de la planification du rapport' });
            throw error;
          }
        },
        
        updateScheduledReport: async (id: string, data: any, tenantId: string) => {
          try {
            await reportsService.updateScheduledReport(id, data);
            await get().loadScheduledReports(tenantId);
          } catch (error: any) {
            set({ scheduledError: error.message || 'Erreur lors de la mise à jour du rapport planifié' });
            throw error;
          }
        },
        
        deleteScheduledReport: async (id: string, tenantId: string) => {
          try {
            await reportsService.deleteScheduledReport(id);
            await get().loadScheduledReports(tenantId);
          } catch (error: any) {
            set({ scheduledError: error.message || 'Erreur lors de la suppression du rapport planifié' });
            throw error;
          }
        },
        
        // Actions pour les formats et types
        loadSupportedFormats: async () => {
          try {
            const formats = await reportsService.getSupportedFormats();
            set({ supportedFormats: formats });
          } catch (error: any) {
            console.error('Erreur lors du chargement des formats supportés:', error);
          }
        },
        
        loadSupportedChartTypes: async () => {
          try {
            const chartTypes = await reportsService.getSupportedChartTypes();
            set({ supportedChartTypes: chartTypes });
          } catch (error: any) {
            console.error('Erreur lors du chargement des types de graphiques:', error);
          }
        },
        
        // Actions pour les filtres et pagination
        setFilters: (filters: Partial<ReportsState['filters']>) => {
          set({ filters: { ...get().filters, ...filters } });
        },
        
        setPagination: (pagination: Partial<ReportsState['pagination']>) => {
          set({ pagination: { ...get().pagination, ...pagination } });
        },
        
        // Actions pour le cache et la synchronisation
        refreshAll: async (tenantId: string) => {
          set({ lastFetch: null }); // Forcer le rechargement
          await Promise.all([
            get().loadTemplates(tenantId),
            get().loadJobs(tenantId),
            get().loadScheduledReports(tenantId),
            get().loadSupportedFormats(),
            get().loadSupportedChartTypes()
          ]);
        },
        
        clearCache: () => {
          set({
            templates: [],
            jobs: [],
            scheduledReports: [],
            lastFetch: null
          });
        },
        
        // Utilitaires
        getTemplateById: (id: string) => {
          return get().templates.find(template => template.id === id);
        },
        
        getJobById: (id: string) => {
          return get().jobs.find(job => job.id === id);
        },
        
        getTemplatesByModule: (module: string) => {
          return get().templates.filter(template => template.module === module);
        },
        
        getJobsByStatus: (status: string) => {
          return get().jobs.filter(job => job.status === status);
        },
        
        getActiveJobs: () => {
          return get().jobs.filter(job => job.status === 'pending' || job.status === 'processing');
        },
        
        getCompletedJobs: () => {
          return get().jobs.filter(job => job.status === 'completed');
        },
        
        getFailedJobs: () => {
          return get().jobs.filter(job => job.status === 'failed');
        }
      }),
      {
        name: 'crou-reports-storage',
        partialize: (state) => ({
          templates: state.templates,
          jobs: state.jobs,
          scheduledReports: state.scheduledReports,
          supportedFormats: state.supportedFormats,
          supportedChartTypes: state.supportedChartTypes,
          lastFetch: state.lastFetch
        })
      }
    ),
    { name: 'ReportsStore' }
  )
);

// Hooks spécialisés pour une utilisation plus facile
export const useReportTemplates = () => useReports(state => ({
  templates: state.templates,
  loading: state.templatesLoading,
  error: state.templatesError,
  loadTemplates: state.loadTemplates,
  createTemplate: state.createTemplate,
  updateTemplate: state.updateTemplate,
  deleteTemplate: state.deleteTemplate
}));

export const useReportJobs = () => useReports(state => ({
  jobs: state.jobs,
  loading: state.jobsLoading,
  error: state.jobsError,
  loadJobs: state.loadJobs,
  generateReport: state.generateReport,
  getJobStatus: state.getJobStatus,
  downloadReport: state.downloadReport,
  deleteJob: state.deleteJob
}));

export const useScheduledReports = () => useReports(state => ({
  scheduledReports: state.scheduledReports,
  loading: state.scheduledLoading,
  error: state.scheduledError,
  loadScheduledReports: state.loadScheduledReports,
  scheduleReport: state.scheduleReport,
  updateScheduledReport: state.updateScheduledReport,
  deleteScheduledReport: state.deleteScheduledReport
}));

export const useReportFormats = () => useReports(state => ({
  supportedFormats: state.supportedFormats,
  supportedChartTypes: state.supportedChartTypes,
  loadSupportedFormats: state.loadSupportedFormats,
  loadSupportedChartTypes: state.loadSupportedChartTypes
}));

/**
 * FICHIER: apps/web/src/hooks/useReports.ts
 * HOOKS: Hooks personnalisés pour la gestion des rapports
 *
 * DESCRIPTION:
 * Hooks React personnalisés pour la gestion des rapports
 * Simplification de l'utilisation du store Zustand
 * Gestion automatique du chargement et des erreurs
 *
 * FONCTIONNALITÉS:
 * - Hooks pour templates, jobs et rapports planifiés
 * - Gestion automatique du chargement
 * - Filtres et pagination
 * - Génération de rapports
 * - Cache et synchronisation
 *
 * AUTEUR: Équipe CROU
 * DATE: Décembre 2024
 */

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/stores/auth';
import { 
  useReports, 
  useReportTemplates, 
  useReportJobs, 
  useScheduledReports, 
  useReportFormats 
} from '@/stores/reports';
import { ReportTemplate, ReportJob, ReportRequest } from '@/services/api/reportsService';

// Hook pour les templates de rapports
export const useReportTemplates = () => {
  const { user } = useAuth();
  const { 
    templates, 
    loading, 
    error, 
    loadTemplates, 
    createTemplate, 
    updateTemplate, 
    deleteTemplate 
  } = useReports();

  const [filters, setFilters] = useState({
    module: 'all',
    type: 'all',
    status: 'all',
    dateFrom: new Date(new Date().setMonth(new Date().getMonth() - 1)),
    dateTo: new Date()
  });

  // Charger les templates au montage et quand les filtres changent
  useEffect(() => {
    if (user?.tenantId) {
      loadTemplates(user.tenantId, filters);
    }
  }, [user?.tenantId, filters, loadTemplates]);

  // Fonctions de gestion
  const handleCreateTemplate = useCallback(async (data: Partial<ReportTemplate>) => {
    if (user?.tenantId) {
      await createTemplate(data, user.tenantId);
    }
  }, [user?.tenantId, createTemplate]);

  const handleUpdateTemplate = useCallback(async (id: string, data: Partial<ReportTemplate>) => {
    if (user?.tenantId) {
      await updateTemplate(id, data, user.tenantId);
    }
  }, [user?.tenantId, updateTemplate]);

  const handleDeleteTemplate = useCallback(async (id: string) => {
    if (user?.tenantId) {
      await deleteTemplate(id, user.tenantId);
    }
  }, [user?.tenantId, deleteTemplate]);

  const updateFilters = useCallback((newFilters: Partial<typeof filters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  }, []);

  const resetFilters = useCallback(() => {
    setFilters({
      module: 'all',
      type: 'all',
      status: 'all',
      dateFrom: new Date(new Date().setMonth(new Date().getMonth() - 1)),
      dateTo: new Date()
    });
  }, []);

  return {
    templates,
    loading,
    error,
    filters,
    createTemplate: handleCreateTemplate,
    updateTemplate: handleUpdateTemplate,
    deleteTemplate: handleDeleteTemplate,
    updateFilters,
    resetFilters,
    refresh: () => user?.tenantId ? loadTemplates(user.tenantId, filters) : Promise.resolve()
  };
};

// Hook pour les jobs de rapports
export const useReportJobs = () => {
  const { user } = useAuth();
  const { 
    jobs, 
    loading, 
    error, 
    loadJobs, 
    generateReport, 
    getJobStatus, 
    downloadReport, 
    deleteJob 
  } = useReports();

  const [filters, setFilters] = useState({
    status: 'all',
    templateId: 'all',
    dateFrom: new Date(new Date().setMonth(new Date().getMonth() - 1)),
    dateTo: new Date()
  });

  // Charger les jobs au montage et quand les filtres changent
  useEffect(() => {
    if (user?.tenantId) {
      loadJobs(user.tenantId, filters);
    }
  }, [user?.tenantId, filters, loadJobs]);

  // Fonctions de gestion
  const handleGenerateReport = useCallback(async (request: ReportRequest) => {
    if (user?.tenantId) {
      return await generateReport(request, user.tenantId);
    }
    throw new Error('Utilisateur non authentifié');
  }, [user?.tenantId, generateReport]);

  const handleGetJobStatus = useCallback(async (jobId: string) => {
    return await getJobStatus(jobId);
  }, [getJobStatus]);

  const handleDownloadReport = useCallback(async (jobId: string) => {
    return await downloadReport(jobId);
  }, [downloadReport]);

  const handleDeleteJob = useCallback(async (jobId: string) => {
    if (user?.tenantId) {
      await deleteJob(jobId, user.tenantId);
    }
  }, [user?.tenantId, deleteJob]);

  const updateFilters = useCallback((newFilters: Partial<typeof filters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  }, []);

  const resetFilters = useCallback(() => {
    setFilters({
      status: 'all',
      templateId: 'all',
      dateFrom: new Date(new Date().setMonth(new Date().getMonth() - 1)),
      dateTo: new Date()
    });
  }, []);

  return {
    jobs,
    loading,
    error,
    filters,
    generateReport: handleGenerateReport,
    getJobStatus: handleGetJobStatus,
    downloadReport: handleDownloadReport,
    deleteJob: handleDeleteJob,
    updateFilters,
    resetFilters,
    refresh: () => user?.tenantId ? loadJobs(user.tenantId, filters) : Promise.resolve()
  };
};

// Hook pour les rapports planifiés
export const useScheduledReports = () => {
  const { user } = useAuth();
  const { 
    scheduledReports, 
    loading, 
    error, 
    loadScheduledReports, 
    scheduleReport, 
    updateScheduledReport, 
    deleteScheduledReport 
  } = useReports();

  // Charger les rapports planifiés au montage
  useEffect(() => {
    if (user?.tenantId) {
      loadScheduledReports(user.tenantId);
    }
  }, [user?.tenantId, loadScheduledReports]);

  // Fonctions de gestion
  const handleScheduleReport = useCallback(async (data: any) => {
    if (user?.tenantId) {
      await scheduleReport(data, user.tenantId);
    }
  }, [user?.tenantId, scheduleReport]);

  const handleUpdateScheduledReport = useCallback(async (id: string, data: any) => {
    if (user?.tenantId) {
      await updateScheduledReport(id, data, user.tenantId);
    }
  }, [user?.tenantId, updateScheduledReport]);

  const handleDeleteScheduledReport = useCallback(async (id: string) => {
    if (user?.tenantId) {
      await deleteScheduledReport(id, user.tenantId);
    }
  }, [user?.tenantId, deleteScheduledReport]);

  return {
    scheduledReports,
    loading,
    error,
    scheduleReport: handleScheduleReport,
    updateScheduledReport: handleUpdateScheduledReport,
    deleteScheduledReport: handleDeleteScheduledReport,
    refresh: () => user?.tenantId ? loadScheduledReports(user.tenantId) : Promise.resolve()
  };
};

// Hook pour les formats et types supportés
export const useReportFormats = () => {
  const { 
    supportedFormats, 
    supportedChartTypes, 
    loadSupportedFormats, 
    loadSupportedChartTypes 
  } = useReports();

  // Charger les formats et types au montage
  useEffect(() => {
    loadSupportedFormats();
    loadSupportedChartTypes();
  }, [loadSupportedFormats, loadSupportedChartTypes]);

  return {
    supportedFormats,
    supportedChartTypes,
    refresh: () => {
      loadSupportedFormats();
      loadSupportedChartTypes();
    }
  };
};

// Hook pour la génération de rapports rapides
export const useQuickReports = () => {
  const { user } = useAuth();
  const { generateReport } = useReportJobs();

  // Génération de rapports prédéfinis
  const generateFinancialReport = useCallback(async (params: {
    startDate: Date;
    endDate: Date;
    format: 'excel' | 'pdf';
    includeCharts?: boolean;
  }) => {
    if (!user?.tenantId) throw new Error('Utilisateur non authentifié');
    
    const request: ReportRequest = {
      templateId: 'financial-report',
      parameters: {
        startDate: params.startDate.toISOString(),
        endDate: params.endDate.toISOString(),
        includeCharts: params.includeCharts ?? true
      },
      format: params.format,
      includeCharts: params.includeCharts ?? true,
      includePivotTables: true
    };
    
    return await generateReport(request, user.tenantId);
  }, [user?.tenantId, generateReport]);

  const generateStocksReport = useCallback(async (params: {
    startDate: Date;
    endDate: Date;
    format: 'excel' | 'pdf';
    includeCharts?: boolean;
  }) => {
    if (!user?.tenantId) throw new Error('Utilisateur non authentifié');
    
    const request: ReportRequest = {
      templateId: 'stocks-report',
      parameters: {
        startDate: params.startDate.toISOString(),
        endDate: params.endDate.toISOString(),
        includeCharts: params.includeCharts ?? true
      },
      format: params.format,
      includeCharts: params.includeCharts ?? true,
      includePivotTables: true
    };
    
    return await generateReport(request, user.tenantId);
  }, [user?.tenantId, generateReport]);

  const generateHousingReport = useCallback(async (params: {
    startDate: Date;
    endDate: Date;
    format: 'excel' | 'pdf';
    includeCharts?: boolean;
  }) => {
    if (!user?.tenantId) throw new Error('Utilisateur non authentifié');
    
    const request: ReportRequest = {
      templateId: 'housing-report',
      parameters: {
        startDate: params.startDate.toISOString(),
        endDate: params.endDate.toISOString(),
        includeCharts: params.includeCharts ?? true
      },
      format: params.format,
      includeCharts: params.includeCharts ?? true,
      includePivotTables: true
    };
    
    return await generateReport(request, user.tenantId);
  }, [user?.tenantId, generateReport]);

  const generateTransportReport = useCallback(async (params: {
    startDate: Date;
    endDate: Date;
    format: 'excel' | 'pdf';
    includeCharts?: boolean;
  }) => {
    if (!user?.tenantId) throw new Error('Utilisateur non authentifié');
    
    const request: ReportRequest = {
      templateId: 'transport-report',
      parameters: {
        startDate: params.startDate.toISOString(),
        endDate: params.endDate.toISOString(),
        includeCharts: params.includeCharts ?? true
      },
      format: params.format,
      includeCharts: params.includeCharts ?? true,
      includePivotTables: true
    };
    
    return await generateReport(request, user.tenantId);
  }, [user?.tenantId, generateReport]);

  const generateConsolidatedReport = useCallback(async (params: {
    startDate: Date;
    endDate: Date;
    format: 'excel' | 'pdf';
    includeCharts?: boolean;
  }) => {
    if (!user?.tenantId) throw new Error('Utilisateur non authentifié');
    
    const request: ReportRequest = {
      templateId: 'consolidated-report',
      parameters: {
        startDate: params.startDate.toISOString(),
        endDate: params.endDate.toISOString(),
        includeCharts: params.includeCharts ?? true
      },
      format: params.format,
      includeCharts: params.includeCharts ?? true,
      includePivotTables: true
    };
    
    return await generateReport(request, user.tenantId);
  }, [user?.tenantId, generateReport]);

  return {
    generateFinancialReport,
    generateStocksReport,
    generateHousingReport,
    generateTransportReport,
    generateConsolidatedReport
  };
};

// Hook pour le suivi des jobs en temps réel
export const useJobMonitoring = (jobId?: string) => {
  const { getJobStatus } = useReportJobs();
  const [job, setJob] = useState<ReportJob | null>(null);
  const [isMonitoring, setIsMonitoring] = useState(false);

  // Démarrer le monitoring
  const startMonitoring = useCallback(async (id: string) => {
    setIsMonitoring(true);
    const interval = setInterval(async () => {
      try {
        const jobStatus = await getJobStatus(id);
        setJob(jobStatus);
        
        if (jobStatus.status === 'completed' || jobStatus.status === 'failed') {
          setIsMonitoring(false);
          clearInterval(interval);
        }
      } catch (error) {
        console.error('Erreur lors du monitoring du job:', error);
        setIsMonitoring(false);
        clearInterval(interval);
      }
    }, 2000); // Vérifier toutes les 2 secondes

    return () => clearInterval(interval);
  }, [getJobStatus]);

  // Arrêter le monitoring
  const stopMonitoring = useCallback(() => {
    setIsMonitoring(false);
  }, []);

  // Monitoring automatique si jobId fourni
  useEffect(() => {
    if (jobId && !isMonitoring) {
      startMonitoring(jobId);
    }
  }, [jobId, isMonitoring, startMonitoring]);

  return {
    job,
    isMonitoring,
    startMonitoring,
    stopMonitoring
  };
};

// Hook pour les statistiques de rapports
export const useReportStatistics = () => {
  const { jobs, templates, scheduledReports } = useReports();

  // Calculer les statistiques en temps réel
  const statistics = {
    totalTemplates: templates.length,
    activeTemplates: templates.filter(t => t.isActive).length,
    totalJobs: jobs.length,
    completedJobs: jobs.filter(j => j.status === 'completed').length,
    failedJobs: jobs.filter(j => j.status === 'failed').length,
    pendingJobs: jobs.filter(j => j.status === 'pending').length,
    processingJobs: jobs.filter(j => j.status === 'processing').length,
    scheduledReports: scheduledReports.length,
    activeScheduledReports: scheduledReports.filter(r => r.isActive).length,
    totalFileSize: jobs
      .filter(j => j.fileSize)
      .reduce((sum, j) => sum + (j.fileSize || 0), 0)
  };

  // Répartition par module
  const moduleDistribution = templates.reduce((acc, template) => {
    if (!acc[template.module]) {
      acc[template.module] = 0;
    }
    acc[template.module] += 1;
    return acc;
  }, {} as Record<string, number>);

  // Répartition par type
  const typeDistribution = templates.reduce((acc, template) => {
    if (!acc[template.type]) {
      acc[template.type] = 0;
    }
    acc[template.type] += 1;
    return acc;
  }, {} as Record<string, number>);

  // Répartition par fréquence
  const frequencyDistribution = templates.reduce((acc, template) => {
    if (!acc[template.frequency]) {
      acc[template.frequency] = 0;
    }
    acc[template.frequency] += 1;
    return acc;
  }, {} as Record<string, number>);

  return {
    ...statistics,
    moduleDistribution,
    typeDistribution,
    frequencyDistribution
  };
};

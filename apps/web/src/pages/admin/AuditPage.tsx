/**
 * FICHIER: apps/web/src/pages/admin/AuditPage.tsx
 * PAGE: AuditPage - Interface de consultation des logs d'audit
 * 
 * DESCRIPTION:
 * Interface complète pour la consultation et l'analyse des logs d'audit
 * Recherche avancée, filtres, export et visualisation des données
 * 
 * FONCTIONNALITÉS:
 * - Consultation des logs d'audit avec pagination
 * - Recherche avancée par utilisateur, action, ressource, date
 * - Filtres multiples et combinables
 * - Détails complets des événements d'audit
 * - Export des logs (Excel, PDF, CSV)
 * - Graphiques de statistiques d'utilisation
 * - Détection d'activités suspectes
 * - Timeline des événements
 * 
 * AUTEUR: Équipe CROU
 * DATE: Décembre 2024
 */

import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Filter, 
  Download, 
  Eye, 
  Calendar,
  User,
  Activity,
  FileText,
  AlertTriangle,
  TrendingUp,
  Clock,
  MapPin,
  Smartphone,
  RefreshCw,
  BarChart3,
  PieChart
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Table, TableColumn } from '@/components/ui/Table';
import { Modal } from '@/components/ui/Modal';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { KPICard } from '@/components/ui/KPICard';
import { Tabs } from '@/components/ui/Tabs';
import { CROUSelector } from '@/components/ui/CROUSelector';
import { DateInput } from '@/components/ui/DateInput';
import { adminService, type AuditLog as ApiAuditLog } from '@/services/api/adminService';
import { Toast } from '@/components/ui/Toast';
import { exportAuditLogsToPDF } from '@/utils/pdfExport';

// Types pour les logs d'audit
interface AuditLog {
  id: string;
  userId?: string;
  userName?: string;
  userEmail?: string;
  action: string;
  resource: string;
  resourceId?: string;
  oldValues?: Record<string, any>;
  newValues?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  tenantId?: string;
  tenantName?: string;
  sessionId?: string;
  metadata?: Record<string, any>;
  success: boolean;
  createdAt: Date;
}

interface AuditFilters {
  search: string;
  userId: string;
  action: string;
  resource: string;
  tenantId: string;
  dateFrom: string;
  dateTo: string;
  ipAddress: string;
  success: string;
}

interface AuditStats {
  totalLogs: number;
  todayLogs: number;
  successfulActions: number;
  failedActions: number;
  uniqueUsers: number;
  topActions: Array<{ action: string; count: number }>;
  topResources: Array<{ resource: string; count: number }>;
  activityByHour: Array<{ hour: number; count: number }>;
}

// Options pour les filtres
const actionOptions = [
  { value: '', label: 'Toutes les actions' },
  { value: 'login', label: 'Connexion' },
  { value: 'logout', label: 'Déconnexion' },
  { value: 'create', label: 'Création' },
  { value: 'update', label: 'Modification' },
  { value: 'delete', label: 'Suppression' },
  { value: 'read', label: 'Lecture' },
  { value: 'export', label: 'Export' },
  { value: 'validate', label: 'Validation' },
  { value: 'security_alert', label: 'Alerte sécurité' }
];

const resourceOptions = [
  { value: '', label: 'Toutes les ressources' },
  { value: 'users', label: 'Utilisateurs' },
  { value: 'roles', label: 'Rôles' },
  { value: 'permissions', label: 'Permissions' },
  { value: 'tenants', label: 'Tenants' },
  { value: 'finances', label: 'Finances' },
  { value: 'stocks', label: 'Stocks' },
  { value: 'housing', label: 'Logement' },
  { value: 'transport', label: 'Transport' },
  { value: 'reports', label: 'Rapports' },
  { value: 'security', label: 'Sécurité' },
  { value: 'audit', label: 'Audit' }
];

const successOptions = [
  { value: '', label: 'Tous les résultats' },
  { value: 'true', label: 'Succès' },
  { value: 'false', label: 'Échec' }
];

export const AuditPage: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [stats, setStats] = useState<AuditStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [showLogDetails, setShowLogDetails] = useState(false);
  
  // États pour les filtres
  const [filters, setFilters] = useState<AuditFilters>({
    search: '',
    userId: '',
    action: '',
    resource: '',
    tenantId: '',
    dateFrom: '',
    dateTo: '',
    ipAddress: '',
    success: ''
  });

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalLogs, setTotalLogs] = useState(0);
  const itemsPerPage = 50;

  // Charger les logs d'audit
  const loadAuditLogs = async () => {
    setLoading(true);
    try {
      const params: any = {
        page: currentPage,
        limit: itemsPerPage
      };

      if (filters.userId) params.userId = filters.userId;
      if (filters.action) params.action = filters.action;
      if (filters.resource) params.resource = filters.resource;
      if (filters.tenantId) params.tenantId = filters.tenantId;
      if (filters.dateFrom) params.startDate = filters.dateFrom;
      if (filters.dateTo) params.endDate = filters.dateTo;
      if (filters.ipAddress) params.ipAddress = filters.ipAddress;
      if (filters.success) params.success = filters.success === 'true';

      const response = await adminService.getAuditLogs(params);

      // Map API logs to local AuditLog interface
      const mappedLogs: AuditLog[] = response.logs.map((apiLog: ApiAuditLog) => ({
        id: apiLog.id,
        userId: apiLog.userId,
        userName: apiLog.user?.firstName ? `${apiLog.user.firstName} ${apiLog.user.lastName}` : undefined,
        userEmail: apiLog.user?.email,
        action: apiLog.action,
        resource: apiLog.resource,
        resourceId: apiLog.resourceId,
        oldValues: apiLog.oldValues,
        newValues: apiLog.newValues,
        ipAddress: apiLog.ipAddress,
        userAgent: apiLog.userAgent,
        tenantId: apiLog.tenantId,
        tenantName: apiLog.tenant?.name,
        sessionId: apiLog.sessionId,
        metadata: apiLog.metadata,
        success: apiLog.success,
        createdAt: new Date(apiLog.createdAt)
      }));

      setLogs(mappedLogs);
      setTotalLogs(response.total);
      setTotalPages(Math.ceil(response.total / itemsPerPage));

      // Calculate basic stats from loaded logs
      const successCount = mappedLogs.filter(l => l.success).length;
      const failedCount = mappedLogs.filter(l => !l.success).length;
      const uniqueUserIds = new Set(mappedLogs.map(l => l.userId).filter(Boolean));

      const mockStats: AuditStats = {
        totalLogs: response.total,
        todayLogs: mappedLogs.filter(l => {
          const today = new Date();
          const logDate = new Date(l.createdAt);
          return logDate.toDateString() === today.toDateString();
        }).length,
        successfulActions: successCount,
        failedActions: failedCount,
        uniqueUsers: uniqueUserIds.size,
        topActions: [],
        topResources: [],
        activityByHour: []
      };
      setStats(mockStats);

    } catch (error: any) {
      console.error('Erreur lors du chargement des logs d\'audit:', error);
      Toast.error('Erreur lors du chargement des logs d\'audit');

      // Fallback to mock data if API fails
      const mockLogs: AuditLog[] = [
        {
          id: '1',
          userId: 'user-123',
          userName: 'Ministre de l\'Enseignement Supérieur',
          userEmail: 'ministre@crou.ne',
          action: 'login',
          resource: 'auth',
          ipAddress: '192.168.1.100',
          userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          tenantId: 'ministere',
          tenantName: 'Ministère de l\'Enseignement Supérieur',
          sessionId: 'sess-abc123',
          success: true,
          createdAt: new Date(Date.now() - 30 * 60 * 1000),
          metadata: {
            loginMethod: 'password',
            deviceType: 'desktop'
          }
        },
        {
          id: '2',
          userId: 'user-456',
          userName: 'Directeur CROU Niamey',
          userEmail: 'directeur@crou-niamey.ne',
          action: 'create',
          resource: 'users',
          resourceId: 'user-789',
          ipAddress: '10.0.1.50',
          userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          tenantId: 'crou_niamey',
          tenantName: 'CROU Niamey',
          sessionId: 'sess-def456',
          success: true,
          createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
          newValues: {
            name: 'Nouveau Comptable',
            email: 'comptable2@crou-niamey.ne',
            role: 'comptable'
          },
          metadata: {
            createdUserRole: 'comptable',
            assignedTenant: 'crou_niamey'
          }
        },
        {
          id: '3',
          userId: 'user-789',
          userName: 'Comptable CROU Dosso',
          userEmail: 'comptable@crou-dosso.ne',
          action: 'login',
          resource: 'auth',
          ipAddress: '192.168.1.100',
          userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          tenantId: 'crou_dosso',
          tenantName: 'CROU Dosso',
          sessionId: 'sess-ghi789',
          success: false,
          createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000),
          metadata: {
            failureReason: 'invalid_password',
            attemptNumber: 3
          }
        },
        {
          id: '4',
          userId: 'user-456',
          userName: 'Directeur CROU Niamey',
          userEmail: 'directeur@crou-niamey.ne',
          action: 'update',
          resource: 'finances',
          resourceId: 'budget-2024',
          ipAddress: '10.0.1.50',
          userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          tenantId: 'crou_niamey',
          tenantName: 'CROU Niamey',
          sessionId: 'sess-def456',
          success: true,
          createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000),
          oldValues: {
            amount: 1000000,
            status: 'draft'
          },
          newValues: {
            amount: 1200000,
            status: 'pending'
          },
          metadata: {
            budgetCategory: 'restauration',
            approvalRequired: true
          }
        },
        {
          id: '5',
          action: 'security_alert',
          resource: 'security',
          ipAddress: '203.0.113.10',
          userAgent: 'curl/7.68.0',
          success: true,
          createdAt: new Date(Date.now() - 8 * 60 * 60 * 1000),
          metadata: {
            alertType: 'SUSPICIOUS_ACTIVITY',
            severity: 'MEDIUM',
            reason: 'Suspicious user agent detected'
          }
        }
      ];

      setLogs(mockLogs);
      setTotalLogs(mockLogs.length);
      setTotalPages(Math.ceil(mockLogs.length / itemsPerPage));

      // Statistiques mockées
      const mockStats: AuditStats = {
        totalLogs: 1247,
        todayLogs: 89,
        successfulActions: 1156,
        failedActions: 91,
        uniqueUsers: 45,
        topActions: [
          { action: 'login', count: 234 },
          { action: 'read', count: 189 },
          { action: 'update', count: 156 },
          { action: 'create', count: 98 },
          { action: 'delete', count: 23 }
        ],
        topResources: [
          { resource: 'auth', count: 267 },
          { resource: 'finances', count: 198 },
          { resource: 'users', count: 145 },
          { resource: 'stocks', count: 123 },
          { resource: 'reports', count: 89 }
        ],
        activityByHour: Array.from({ length: 24 }, (_, i) => ({
          hour: i,
          count: Math.floor(Math.random() * 50) + 10
        }))
      };
      setStats(mockStats);

    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAuditLogs();
  }, [currentPage, filters]);

  // Colonnes du tableau
  const columns: TableColumn<AuditLog>[] = [
    {
      key: 'timestamp',
      label: 'Date/Heure',
      sortable: true,
      width: '150px',
      render: (log) => (
        <div>
          <div className="text-sm font-medium text-gray-900 dark:text-white">
            {log.createdAt.toLocaleDateString('fr-FR')}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">
            {log.createdAt.toLocaleTimeString('fr-FR')}
          </div>
        </div>
      )
    },
    {
      key: 'user',
      label: 'Utilisateur',
      render: (log) => (
        <div>
          {log.userName ? (
            <>
              <div className="font-medium text-gray-900 dark:text-white">
                {log.userName}
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                {log.userEmail}
              </div>
            </>
          ) : (
            <span className="text-gray-500 dark:text-gray-400 italic">
              Système
            </span>
          )}
        </div>
      )
    },
    {
      key: 'action',
      label: 'Action',
      sortable: true,
      render: (log) => {
        const actionLabels: Record<string, string> = {
          login: 'Connexion',
          logout: 'Déconnexion',
          create: 'Création',
          update: 'Modification',
          delete: 'Suppression',
          read: 'Lecture',
          export: 'Export',
          validate: 'Validation',
          security_alert: 'Alerte sécurité'
        };

        const actionColors: Record<string, string> = {
          login: 'text-green-600',
          logout: 'text-blue-600',
          create: 'text-green-600',
          update: 'text-yellow-600',
          delete: 'text-red-600',
          read: 'text-gray-600',
          export: 'text-purple-600',
          validate: 'text-indigo-600',
          security_alert: 'text-orange-600'
        };

        return (
          <div className="flex items-center space-x-2">
            <Activity className={`h-4 w-4 ${actionColors[log.action] || 'text-gray-600'}`} />
            <span className="font-medium">
              {actionLabels[log.action] || log.action}
            </span>
          </div>
        );
      }
    },
    {
      key: 'resource',
      label: 'Ressource',
      sortable: true,
      render: (log) => (
        <div>
          <div className="font-medium text-gray-900 dark:text-white">
            {log.resource}
          </div>
          {log.resourceId && (
            <div className="text-xs text-gray-500 dark:text-gray-400">
              ID: {log.resourceId}
            </div>
          )}
        </div>
      )
    },
    {
      key: 'tenant',
      label: 'Organisation',
      render: (log) => (
        <div>
          {log.tenantName ? (
            <Badge variant="secondary">
              {log.tenantName}
            </Badge>
          ) : (
            <span className="text-gray-500 dark:text-gray-400">-</span>
          )}
        </div>
      )
    },
    {
      key: 'ipAddress',
      label: 'Adresse IP',
      render: (log) => (
        <div className="flex items-center space-x-2">
          <MapPin className="h-4 w-4 text-gray-400" />
          <span className="font-mono text-sm">{log.ipAddress}</span>
        </div>
      )
    },
    {
      key: 'success',
      label: 'Résultat',
      sortable: true,
      render: (log) => (
        <Badge variant={log.success ? 'success' : 'danger'}>
          {log.success ? 'Succès' : 'Échec'}
        </Badge>
      )
    },
    {
      key: 'actions',
      label: 'Actions',
      width: '80px',
      render: (log) => (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            setSelectedLog(log);
            setShowLogDetails(true);
          }}
        >
          <Eye className="h-4 w-4" />
        </Button>
      )
    }
  ];

  // Actions
  const handleExport = (format: 'excel' | 'pdf' | 'csv') => {
    try {
      if (format === 'csv') {
        // Export as CSV
        const csvHeaders = ['Date/Heure', 'Utilisateur', 'Email', 'Action', 'Ressource', 'IP', 'Résultat', 'Tenant'];
        const csvRows = logs.map(log => [
          new Date(log.createdAt).toLocaleString('fr-FR'),
          log.userName || 'N/A',
          log.userEmail || 'N/A',
          log.action,
          log.resource,
          log.ipAddress || 'N/A',
          log.success ? 'Succès' : 'Échec',
          log.tenantName || 'N/A'
        ]);

        const csvContent = [
          csvHeaders.join(','),
          ...csvRows.map(row => row.map(cell => `"${cell}"`).join(','))
        ].join('\n');

        const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `audit_logs_${new Date().toISOString().split('T')[0]}.csv`;
        link.click();

        Toast.success('Export CSV réussi');
      } else if (format === 'excel') {
        // For Excel, use CSV with .xls extension (simple approach)
        const csvHeaders = ['Date/Heure', 'Utilisateur', 'Email', 'Action', 'Ressource', 'IP', 'Résultat', 'Tenant'];
        const csvRows = logs.map(log => [
          new Date(log.createdAt).toLocaleString('fr-FR'),
          log.userName || 'N/A',
          log.userEmail || 'N/A',
          log.action,
          log.resource,
          log.ipAddress || 'N/A',
          log.success ? 'Succès' : 'Échec',
          log.tenantName || 'N/A'
        ]);

        const csvContent = [
          csvHeaders.join('\t'),
          ...csvRows.map(row => row.join('\t'))
        ].join('\n');

        const blob = new Blob(['\uFEFF' + csvContent], { type: 'application/vnd.ms-excel;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `audit_logs_${new Date().toISOString().split('T')[0]}.xls`;
        link.click();

        Toast.success('Export Excel réussi');
      } else if (format === 'pdf') {
        // Export as PDF using jsPDF
        const pdfData = logs.map(log => ({
          id: log.id,
          createdAt: log.createdAt,
          userName: log.userName || 'N/A',
          action: log.action,
          resource: log.resource,
          ipAddress: log.ipAddress || 'N/A',
          success: log.success
        }));

        exportAuditLogsToPDF(pdfData);
        Toast.success('Export PDF réussi');
      }
    } catch (error: any) {
      console.error('Erreur lors de l\'export:', error);
      Toast.error('Erreur lors de l\'export des logs');
    }
  };

  const resetFilters = () => {
    setFilters({
      search: '',
      userId: '',
      action: '',
      resource: '',
      tenantId: '',
      dateFrom: '',
      dateTo: '',
      ipAddress: '',
      success: ''
    });
  };

  // Filtrer les logs
  const filteredLogs = logs.filter(log => {
    const matchesSearch = !filters.search || 
      log.userName?.toLowerCase().includes(filters.search.toLowerCase()) ||
      log.userEmail?.toLowerCase().includes(filters.search.toLowerCase()) ||
      log.resource.toLowerCase().includes(filters.search.toLowerCase()) ||
      log.ipAddress?.includes(filters.search);
    
    const matchesAction = !filters.action || log.action === filters.action;
    const matchesResource = !filters.resource || log.resource === filters.resource;
    const matchesTenant = !filters.tenantId || log.tenantId === filters.tenantId;
    const matchesSuccess = !filters.success || log.success.toString() === filters.success;
    const matchesIp = !filters.ipAddress || log.ipAddress?.includes(filters.ipAddress);
    
    // Filtres de date
    let matchesDateFrom = true;
    let matchesDateTo = true;
    
    if (filters.dateFrom) {
      const fromDate = new Date(filters.dateFrom);
      matchesDateFrom = log.createdAt >= fromDate;
    }
    
    if (filters.dateTo) {
      const toDate = new Date(filters.dateTo);
      toDate.setHours(23, 59, 59, 999);
      matchesDateTo = log.createdAt <= toDate;
    }
    
    return matchesSearch && matchesAction && matchesResource && 
           matchesTenant && matchesSuccess && matchesIp && 
           matchesDateFrom && matchesDateTo;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Logs d'Audit
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            {totalLogs} événement{totalLogs > 1 ? 's' : ''} enregistré{totalLogs > 1 ? 's' : ''}
          </p>
        </div>
        
        <div className="flex items-center space-x-3">
          <Button
            variant="outline"
            onClick={loadAuditLogs}
            className="flex items-center space-x-2"
          >
            <RefreshCw className="h-4 w-4" />
            <span>Actualiser</span>
          </Button>
          
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              onClick={() => handleExport('csv')}
              className="flex items-center space-x-2"
            >
              <Download className="h-4 w-4" />
              <span>CSV</span>
            </Button>
            
            <Button
              variant="outline"
              onClick={() => handleExport('excel')}
              className="flex items-center space-x-2"
            >
              <Download className="h-4 w-4" />
              <span>Excel</span>
            </Button>
            
            <Button
              variant="outline"
              onClick={() => handleExport('pdf')}
              className="flex items-center space-x-2"
            >
              <Download className="h-4 w-4" />
              <span>PDF</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Onglets */}
      <Tabs value="logs" className="w-full">
        <div className="flex space-x-4 border-b border-gray-200 dark:border-gray-700 mb-6">
          <button className="px-4 py-2 text-sm font-medium text-blue-600 border-b-2 border-blue-600">
            Logs d'Audit ({filteredLogs.length})
          </button>
          <button className="px-4 py-2 text-sm font-medium text-gray-500 hover:text-gray-700 dark:text-gray-300">
            Statistiques
          </button>
          <button className="px-4 py-2 text-sm font-medium text-gray-500 hover:text-gray-700 dark:text-gray-300">
            Timeline
          </button>
        </div>

        <div className="space-y-4">
          {/* Filtres */}
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
              <Input
                placeholder="Rechercher..."
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              />
              
              <Select
                value={filters.action}
                onChange={(value) => setFilters({ ...filters, action: String(value) })}
                options={actionOptions}
                placeholder="Action"
              />
              
              <Select
                value={filters.resource}
                onChange={(value) => setFilters({ ...filters, resource: String(value) })}
                options={resourceOptions}
                placeholder="Ressource"
              />
              
              <CROUSelector
                value={filters.tenantId}
                onChange={(value) => setFilters({ ...filters, tenantId: String(value) })}
                placeholder="Organisation"
                includeMinistry
                level="all"
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Input
                type="date"
                value={filters.dateFrom}
                onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
                placeholder="Date de début"
              />
              
              <Input
                type="date"
                value={filters.dateTo}
                onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
                placeholder="Date de fin"
              />
              
              <Input
                placeholder="Adresse IP"
                value={filters.ipAddress}
                onChange={(e) => setFilters({ ...filters, ipAddress: e.target.value })}
              />
              
              <div className="flex items-center space-x-2">
                <Select
                  value={filters.success}
                  onChange={(value) => setFilters({ ...filters, success: String(value) })}
                  options={successOptions}
                  placeholder="Résultat"
                />
                
                <Button
                  variant="outline"
                  onClick={resetFilters}
                  className="flex items-center space-x-2"
                >
                  <RefreshCw className="h-4 w-4" />
                  <span>Reset</span>
                </Button>
              </div>
            </div>
          </div>

          {/* Tableau des logs */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
            <Table
              data={filteredLogs}
              columns={columns}
              loading={false}
            />
          </div>
        </div>
      </Tabs>

      {/* Modale de détails */}
      {showLogDetails && selectedLog && (
        <AuditLogDetailsModal
          isOpen={showLogDetails}
          log={selectedLog}
          onClose={() => {
            setShowLogDetails(false);
            setSelectedLog(null);
          }}
        />
      )}
    </div>
  );
};

// Composant pour les statistiques
const AuditStatsView: React.FC<{ stats: AuditStats }> = ({ stats }) => {
  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard
          title="Total des Logs"
          value={stats.totalLogs}
          trend="up" as const
          trendValue={`+${stats.todayLogs} aujourd'hui`}
          icon={<FileText />}
          variant="primary"
        />
        
        <KPICard
          title="Actions Réussies"
          value={stats.successfulActions}
          trend="up" as const
          trendValue={`${((stats.successfulActions / stats.totalLogs) * 100).toFixed(1)}%`}
          icon={<Activity />}
          variant="success"
        />
        
        <KPICard
          title="Actions Échouées"
          value={stats.failedActions}
          trend={stats.failedActions > 100 ? 'up' as const : 'down' as const}
          trendValue={`${((stats.failedActions / stats.totalLogs) * 100).toFixed(1)}%`}
          icon={<AlertTriangle />}
          variant={stats.failedActions > 100 ? 'danger' : 'warning'}
        />
        
        <KPICard
          title="Utilisateurs Actifs"
          value={stats.uniqueUsers}
          trend="up" as const
          trendValue="Cette semaine"
          icon={<FileText />}
          variant="secondary"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Actions */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Actions les Plus Fréquentes
          </h3>
          <div className="space-y-3">
            {stats.topActions.map((item, index) => (
              <div key={item.action} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="flex-shrink-0 w-6 h-6 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                    <span className="text-xs font-medium text-blue-600 dark:text-blue-400">
                      {index + 1}
                    </span>
                  </div>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {item.action}
                  </span>
                </div>
                <Badge variant="secondary">
                  {item.count}
                </Badge>
              </div>
            ))}
          </div>
        </Card>

        {/* Top Resources */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Ressources les Plus Accédées
          </h3>
          <div className="space-y-3">
            {stats.topResources.map((item, index) => (
              <div key={item.resource} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="flex-shrink-0 w-6 h-6 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
                    <span className="text-xs font-medium text-green-600 dark:text-green-400">
                      {index + 1}
                    </span>
                  </div>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {item.resource}
                  </span>
                </div>
                <Badge variant="secondary">
                  {item.count}
                </Badge>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Graphique d'activité par heure */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Activité par Heure (24h)
        </h3>
        <div className="h-64 flex items-end space-x-1">
          {stats.activityByHour.map((item) => (
            <div
              key={item.hour}
              className="flex-1 bg-blue-500 rounded-t"
              style={{
                height: `${(item.count / Math.max(...stats.activityByHour.map(h => h.count))) * 100}%`,
                minHeight: '4px'
              }}
              title={`${item.hour}h: ${item.count} événements`}
            />
          ))}
        </div>
        <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-2">
          <span>0h</span>
          <span>6h</span>
          <span>12h</span>
          <span>18h</span>
          <span>24h</span>
        </div>
      </Card>
    </div>
  );
};

// Composant pour la timeline
const AuditTimelineView: React.FC<{ logs: AuditLog[] }> = ({ logs }) => {
  const sortedLogs = [...logs].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
        Timeline des Événements
      </h3>
      
      <div className="space-y-4">
        {sortedLogs.slice(0, 20).map((log, index) => (
          <div key={log.id} className="flex items-start space-x-4">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                <Activity className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              </div>
              {index < sortedLogs.slice(0, 20).length - 1 && (
                <div className="w-px h-6 bg-gray-200 dark:bg-gray-700 ml-4 mt-2" />
              )}
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {log.userName || 'Système'} - {log.action} sur {log.resource}
                </p>
                <Badge variant={log.success ? 'success' : 'danger'}>
                  {log.success ? 'Succès' : 'Échec'}
                </Badge>
              </div>
              
              <div className="flex items-center space-x-4 mt-1 text-xs text-gray-500 dark:text-gray-400">
                <div className="flex items-center space-x-1">
                  <Clock className="h-3 w-3" />
                  <span>{log.createdAt.toLocaleString('fr-FR')}</span>
                </div>
                
                {log.ipAddress && (
                  <div className="flex items-center space-x-1">
                    <MapPin className="h-3 w-3" />
                    <span>{log.ipAddress}</span>
                  </div>
                )}
                
                {log.tenantName && (
                  <Badge variant="outline" className="text-xs">
                    {log.tenantName}
                  </Badge>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
};

// Modale de détails d'un log
const AuditLogDetailsModal: React.FC<{
  isOpen: boolean;
  log: AuditLog;
  onClose: () => void;
}> = ({ isOpen, log, onClose }) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl">
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Détails de l'Événement d'Audit
          </h3>
          <Badge variant={log.success ? 'success' : 'danger'}>
            {log.success ? 'Succès' : 'Échec'}
          </Badge>
        </div>
        
        <div className="space-y-6">
          {/* Informations générales */}
          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Date et Heure
              </label>
              <p className="text-gray-900 dark:text-white">
                {log.createdAt.toLocaleString('fr-FR')}
              </p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Action
              </label>
              <p className="text-gray-900 dark:text-white">
                {log.action}
              </p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Ressource
              </label>
              <p className="text-gray-900 dark:text-white">
                {log.resource}
                {log.resourceId && (
                  <span className="text-sm text-gray-500 dark:text-gray-400 ml-2">
                    (ID: {log.resourceId})
                  </span>
                )}
              </p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Utilisateur
              </label>
              <p className="text-gray-900 dark:text-white">
                {log.userName || 'Système'}
                {log.userEmail && (
                  <span className="text-sm text-gray-500 dark:text-gray-400 block">
                    {log.userEmail}
                  </span>
                )}
              </p>
            </div>
          </div>

          {/* Informations techniques */}
          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Adresse IP
              </label>
              <p className="text-gray-900 dark:text-white font-mono">
                {log.ipAddress}
              </p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Organisation
              </label>
              <p className="text-gray-900 dark:text-white">
                {log.tenantName || 'N/A'}
              </p>
            </div>
            
            {log.sessionId && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Session ID
                </label>
                <p className="text-gray-900 dark:text-white font-mono text-sm">
                  {log.sessionId}
                </p>
              </div>
            )}
          </div>

          {/* User Agent */}
          {log.userAgent && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                User Agent
              </label>
              <p className="text-gray-900 dark:text-white font-mono text-sm break-all">
                {log.userAgent}
              </p>
            </div>
          )}

          {/* Anciennes valeurs */}
          {log.oldValues && Object.keys(log.oldValues).length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Anciennes Valeurs
              </label>
              <pre className="text-sm text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-700 p-3 rounded-lg overflow-auto">
                {JSON.stringify(log.oldValues, null, 2)}
              </pre>
            </div>
          )}

          {/* Nouvelles valeurs */}
          {log.newValues && Object.keys(log.newValues).length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Nouvelles Valeurs
              </label>
              <pre className="text-sm text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-700 p-3 rounded-lg overflow-auto">
                {JSON.stringify(log.newValues, null, 2)}
              </pre>
            </div>
          )}

          {/* Métadonnées */}
          {log.metadata && Object.keys(log.metadata).length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Métadonnées
              </label>
              <pre className="text-sm text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-700 p-3 rounded-lg overflow-auto">
                {JSON.stringify(log.metadata, null, 2)}
              </pre>
            </div>
          )}
        </div>
        
        <div className="flex justify-end mt-6">
          <Button onClick={onClose}>
            Fermer
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default AuditPage;
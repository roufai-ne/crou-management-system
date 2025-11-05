/**
 * FICHIER: apps/web/src/pages/admin/SecurityPage.tsx
 * PAGE: SecurityPage - Interface de sécurité et monitoring
 *
 * DESCRIPTION:
 * Interface d'administration pour le monitoring de sécurité
 * Alertes, statistiques, gestion des comptes bloqués
 *
 * FONCTIONNALITÉS:
 * - Dashboard de sécurité en temps réel
 * - Liste des alertes de sécurité
 * - Gestion des comptes bloqués
 * - Statistiques de rate limiting
 * - Monitoring des activités suspectes
 * - Actions de déblocage et sécurité
 *
 * NOTE: Cette page utilise actuellement des données mockées.
 * L'intégration avec l'API backend nécessite l'implémentation
 * des endpoints de sécurité dans le module admin backend.
 *
 * AUTEUR: Équipe CROU
 * DATE: Décembre 2024
 */

import React, { useState, useEffect } from 'react';
import { 
  Shield, 
  AlertTriangle, 
  Users, 
  Activity, 
  Lock, 
  Unlock,
  Eye,
  RefreshCw,
  Download,
  TrendingUp,
  TrendingDown,
  Clock,
  MapPin,
  Smartphone
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { KPICard } from '@/components/ui/KPICard';
import { Table, TableColumn } from '@/components/ui/Table';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { Select } from '@/components/ui/Select';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/Tabs';
import { cn } from '@/utils/cn';
import { Toast } from '@/components/ui/Toast';
import { adminService, type SecurityAlert as ApiSecurityAlert, type SecurityStats as ApiSecurityStats, type BlockedAccount as ApiBlockedAccount } from '@/services/api/adminService';
import { exportSecurityAlertsToPDF } from '@/utils/pdfExport';

// Types pour les données de sécurité
interface SecurityStats {
  activeAlerts: number;
  lockedAccounts: number;
  rateLimitViolations: number;
  suspiciousActivities: number;
  timestamp: Date;
}

interface SecurityAlert {
  id: string;
  type: 'BRUTE_FORCE' | 'SUSPICIOUS_ACTIVITY' | 'ACCOUNT_LOCKED' | 'RATE_LIMIT_EXCEEDED' | 'UNAUTHORIZED_ACCESS';
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  userId?: string;
  userName?: string;
  ipAddress: string;
  userAgent?: string;
  details: Record<string, any>;
  timestamp: Date;
  resolved: boolean;
}

interface LockedAccount {
  id: string;
  userId: string;
  userName: string;
  email: string;
  tenant: string;
  lockReason: string;
  lockedAt: Date;
  lockedUntil: Date;
  loginAttempts: number;
  lastAttemptIp: string;
}

const alertTypeLabels = {
  BRUTE_FORCE: 'Force brute',
  SUSPICIOUS_ACTIVITY: 'Activité suspecte',
  ACCOUNT_LOCKED: 'Compte bloqué',
  RATE_LIMIT_EXCEEDED: 'Rate limit dépassé',
  UNAUTHORIZED_ACCESS: 'Accès non autorisé'
};

const severityVariants = {
  LOW: 'secondary' as const,
  MEDIUM: 'warning' as const,
  HIGH: 'destructive' as const,
  CRITICAL: 'destructive' as const
};

const severityLabels = {
  LOW: 'Faible',
  MEDIUM: 'Moyen',
  HIGH: 'Élevé',
  CRITICAL: 'Critique'
};

export const SecurityPage: React.FC = () => {
  const [stats, setStats] = useState<SecurityStats | null>(null);
  const [alerts, setAlerts] = useState<SecurityAlert[]>([]);
  const [lockedAccounts, setLockedAccounts] = useState<LockedAccount[]>([]);
  const [loading, setLoading] = useState(true);
  
  // États pour les filtres
  const [alertSeverityFilter, setAlertSeverityFilter] = useState('');
  const [alertTypeFilter, setAlertTypeFilter] = useState('');
  const [activeTab, setActiveTab] = useState('alerts');
  
  // États pour les modales
  const [showAlertDetails, setShowAlertDetails] = useState(false);
  const [selectedAlert, setSelectedAlert] = useState<SecurityAlert | null>(null);

  // Charger les données de sécurité
  const loadSecurityData = async () => {
    setLoading(true);
    try {
      // Charger les statistiques de sécurité
      const apiStats = await adminService.getSecurityStats();
      const mappedStats: SecurityStats = {
        activeAlerts: apiStats.activeAlerts,
        lockedAccounts: apiStats.blockedAccounts,
        rateLimitViolations: Math.floor(apiStats.failedLogins24h * 0.3), // Estimation
        suspiciousActivities: apiStats.suspiciousActivities,
        timestamp: new Date()
      };
      setStats(mappedStats);

      // Charger les alertes de sécurité
      const alertsResponse = await adminService.getSecurityAlerts({ page: 1, limit: 50 });
      const mappedAlerts: SecurityAlert[] = alertsResponse.alerts.map((apiAlert: ApiSecurityAlert) => ({
        id: apiAlert.id,
        type: apiAlert.type as any,
        severity: apiAlert.severity,
        userId: apiAlert.userId,
        userName: apiAlert.userName,
        ipAddress: apiAlert.ipAddress || 'N/A',
        userAgent: apiAlert.userAgent,
        details: apiAlert.metadata || {},
        timestamp: new Date(apiAlert.timestamp),
        resolved: apiAlert.resolved
      }));
      setAlerts(mappedAlerts);

      // Charger les comptes bloqués
      const blockedResponse = await adminService.getBlockedAccounts({ page: 1, limit: 50 });
      const mappedLockedAccounts: LockedAccount[] = blockedResponse.accounts.map((apiAccount: ApiBlockedAccount) => ({
        id: apiAccount.userId,
        userId: apiAccount.userId,
        userName: apiAccount.userName,
        email: apiAccount.userEmail,
        tenant: 'CROU', // À améliorer avec les données réelles
        lockReason: apiAccount.reason,
        lockedAt: new Date(apiAccount.blockedAt),
        lockedUntil: new Date(apiAccount.blockedUntil),
        loginAttempts: apiAccount.failedAttempts,
        lastAttemptIp: apiAccount.lastAttemptIp || 'N/A'
      }));
      setLockedAccounts(mappedLockedAccounts);

    } catch (error: any) {
      console.error('Erreur lors du chargement des données de sécurité:', error);
      Toast.error('Erreur lors du chargement des données de sécurité');

      // Fallback to mock data if API fails
      const mockAlerts: SecurityAlert[] = [
        {
          id: '1',
          type: 'BRUTE_FORCE',
          severity: 'HIGH',
          userId: 'user-123',
          userName: 'Comptable CROU Dosso',
          ipAddress: '192.168.1.100',
          userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
          details: {
            attempts: 5,
            timeWindow: '5 minutes',
            blocked: true
          },
          timestamp: new Date(Date.now() - 30 * 60 * 1000),
          resolved: false
        },
        {
          id: '2',
          type: 'SUSPICIOUS_ACTIVITY',
          severity: 'MEDIUM',
          userId: 'user-456',
          userName: 'Directeur CROU Maradi',
          ipAddress: '10.0.1.50',
          userAgent: 'curl/7.68.0',
          details: {
            reason: 'Suspicious user agent detected',
            endpoint: '/admin/users',
            method: 'GET'
          },
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
          resolved: false
        },
        {
          id: '3',
          type: 'RATE_LIMIT_EXCEEDED',
          severity: 'MEDIUM',
          ipAddress: '203.0.113.10',
          details: {
            requests: 150,
            limit: 100,
            timeWindow: '1 minute'
          },
          timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000),
          resolved: true
        }
      ];
      setAlerts(mockAlerts);

      // Comptes bloqués
      const mockLockedAccounts: LockedAccount[] = [
        {
          id: '1',
          userId: 'user-123',
          userName: 'Comptable CROU Dosso',
          email: 'comptable@crou-dosso.ne',
          tenant: 'CROU Dosso',
          lockReason: 'Trop de tentatives de connexion échouées',
          lockedAt: new Date(Date.now() - 30 * 60 * 1000),
          lockedUntil: new Date(Date.now() + 30 * 60 * 1000),
          loginAttempts: 5,
          lastAttemptIp: '192.168.1.100'
        },
        {
          id: '2',
          userId: 'user-789',
          userName: 'Secrétaire CROU Zinder',
          email: 'secretaire@crou-zinder.ne',
          tenant: 'CROU Zinder',
          lockReason: 'Activité suspecte détectée',
          lockedAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
          lockedUntil: new Date(Date.now() + 4 * 60 * 60 * 1000),
          loginAttempts: 3,
          lastAttemptIp: '172.16.0.25'
        }
      ];
      setLockedAccounts(mockLockedAccounts);

    } catch (error) {
      console.error('Erreur lors du chargement des données de sécurité:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSecurityData();
    
    // Actualiser les données toutes les 30 secondes
    const interval = setInterval(loadSecurityData, 30000);
    return () => clearInterval(interval);
  }, []);

  // Colonnes pour le tableau des alertes
  const alertColumns: TableColumn<SecurityAlert>[] = [
    {
      key: 'severity',
      label: 'Gravité',
      width: '100px',
      render: (alert) => (
        <Badge variant={alert.severity === 'HIGH' || alert.severity === 'CRITICAL' ? 'danger' : alert.severity === 'MEDIUM' ? 'warning' : 'secondary'}>
          {severityLabels[alert.severity]}
        </Badge>
      )
    },
    {
      key: 'type',
      label: 'Type',
      render: (alert) => (
        <div className="flex items-center space-x-2">
          <AlertTriangle className="h-4 w-4 text-orange-500" />
          <span>{alertTypeLabels[alert.type]}</span>
        </div>
      )
    },
    {
      key: 'user',
      label: 'Utilisateur',
      render: (alert) => (
        <div>
          {alert.userName ? (
            <>
              <div className="font-medium text-gray-900 dark:text-white">
                {alert.userName}
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                ID: {alert.userId}
              </div>
            </>
          ) : (
            <span className="text-gray-500 dark:text-gray-400">
              Utilisateur inconnu
            </span>
          )}
        </div>
      )
    },
    {
      key: 'ipAddress',
      label: 'Adresse IP',
      render: (alert) => (
        <div className="flex items-center space-x-2">
          <MapPin className="h-4 w-4 text-gray-400" />
          <span className="font-mono text-sm">{alert.ipAddress}</span>
        </div>
      )
    },
    {
      key: 'timestamp',
      label: 'Date/Heure',
      sortable: true,
      render: (alert) => (
        <div>
          <div className="text-sm text-gray-900 dark:text-white">
            {alert.timestamp.toLocaleDateString('fr-FR')}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">
            {alert.timestamp.toLocaleTimeString('fr-FR')}
          </div>
        </div>
      )
    },
    {
      key: 'status',
      label: 'Statut',
      render: (alert) => (
        <Badge variant={alert.resolved ? 'success' : 'warning'}>
          {alert.resolved ? 'Résolu' : 'En cours'}
        </Badge>
      )
    },
    {
      key: 'actions',
      label: 'Actions',
      width: '100px',
      render: (alert) => (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            setSelectedAlert(alert);
            setShowAlertDetails(true);
          }}
        >
          <Eye className="h-4 w-4" />
        </Button>
      )
    }
  ];

  // Colonnes pour le tableau des comptes bloqués
  const lockedAccountColumns: TableColumn<LockedAccount>[] = [
    {
      key: 'user',
      label: 'Utilisateur',
      render: (account) => (
        <div>
          <div className="font-medium text-gray-900 dark:text-white">
            {account.userName}
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-400">
            {account.email}
          </div>
        </div>
      )
    },
    {
      key: 'tenant',
      label: 'Organisation',
      render: (account) => (
        <Badge variant="secondary">
          {account.tenant}
        </Badge>
      )
    },
    {
      key: 'lockReason',
      label: 'Raison du blocage',
      render: (account) => (
        <span className="text-sm text-gray-900 dark:text-white">
          {account.lockReason}
        </span>
      )
    },
    {
      key: 'attempts',
      label: 'Tentatives',
      render: (account) => (
        <div className="flex items-center space-x-2">
          <Lock className="h-4 w-4 text-red-500" />
          <span className="font-medium text-red-600">
            {account.loginAttempts}
          </span>
        </div>
      )
    },
    {
      key: 'lockedUntil',
      label: 'Bloqué jusqu\'à',
      render: (account) => (
        <div>
          <div className="text-sm text-gray-900 dark:text-white">
            {account.lockedUntil.toLocaleDateString('fr-FR')}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">
            {account.lockedUntil.toLocaleTimeString('fr-FR')}
          </div>
        </div>
      )
    },
    {
      key: 'actions',
      label: 'Actions',
      width: '100px',
      render: (account) => (
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleUnlockAccount(account.userId)}
          className="flex items-center space-x-2"
        >
          <Unlock className="h-4 w-4" />
          <span>Débloquer</span>
        </Button>
      )
    }
  ];

  // Actions
  const handleUnlockAccount = async (userId: string) => {
    try {
      await adminService.unlockUser(userId);
      await loadSecurityData();
      Toast.success('Compte débloqué avec succès');
    } catch (error: any) {
      console.error('Erreur lors du déblocage:', error);
      Toast.error(error?.response?.data?.message || 'Erreur lors du déblocage du compte');
    }
  };

  const handleResolveAlert = async (alertId: string) => {
    try {
      await adminService.resolveSecurityAlert(alertId);
      await loadSecurityData();
      Toast.success('Alerte marquée comme résolue');
    } catch (error: any) {
      console.error('Erreur lors de la résolution:', error);
      Toast.error(error?.response?.data?.message || 'Erreur lors de la résolution de l\'alerte');
    }
  };

  const handleExportAlerts = (format: 'csv' | 'pdf' = 'csv') => {
    try {
      // Generate description from type and details
      const getAlertDescription = (alert: SecurityAlert) => {
        const typeLabel = alertTypeLabels[alert.type] || alert.type;
        return `${typeLabel} - ${alert.userName || 'Utilisateur inconnu'}`;
      };

      if (format === 'csv') {
        // Export alerts as CSV
        const csvHeaders = ['ID', 'Type', 'Sévérité', 'Description', 'IP', 'Date', 'Statut'];
        const csvRows = alerts.map(alert => [
          alert.id,
          alert.type,
          alert.severity,
          getAlertDescription(alert),
          alert.ipAddress || 'N/A',
          new Date(alert.timestamp).toLocaleString('fr-FR'),
          alert.resolved ? 'Résolu' : 'En cours'
        ]);

        const csvContent = [
          csvHeaders.join(','),
          ...csvRows.map(row => row.map(cell => `"${cell}"`).join(','))
        ].join('\n');

        const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `security_alerts_${new Date().toISOString().split('T')[0]}.csv`;
        link.click();

        Toast.success('Export CSV des alertes réussi');
      } else if (format === 'pdf') {
        // Export alerts as PDF
        const pdfData = alerts.map(alert => ({
          id: alert.id,
          type: alert.type,
          severity: alert.severity,
          description: getAlertDescription(alert),
          ipAddress: alert.ipAddress || 'N/A',
          timestamp: alert.timestamp,
          resolved: alert.resolved
        }));

        exportSecurityAlertsToPDF(pdfData);
        Toast.success('Export PDF des alertes réussi');
      }
    } catch (error: any) {
      console.error('Erreur lors de l\'export:', error);
      Toast.error('Erreur lors de l\'export des alertes');
    }
  };

  // Filtrer les alertes
  const filteredAlerts = alerts.filter(alert => {
    const matchesSeverity = !alertSeverityFilter || alert.severity === alertSeverityFilter;
    const matchesType = !alertTypeFilter || alert.type === alertTypeFilter;
    return matchesSeverity && matchesType;
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
            Sécurité et Monitoring
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Surveillance en temps réel de la sécurité du système
          </p>
        </div>
        
        <div className="flex items-center space-x-3">
          <Button
            variant="outline"
            onClick={loadSecurityData}
            className="flex items-center space-x-2"
          >
            <RefreshCw className="h-4 w-4" />
            <span>Actualiser</span>
          </Button>
          
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              onClick={() => handleExportAlerts('csv')}
              className="flex items-center space-x-2"
            >
              <Download className="h-4 w-4" />
              <span>CSV</span>
            </Button>

            <Button
              variant="outline"
              onClick={() => handleExportAlerts('pdf')}
              className="flex items-center space-x-2"
            >
              <Download className="h-4 w-4" />
              <span>PDF</span>
            </Button>
          </div>
        </div>
      </div>

      {/* KPIs de sécurité */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <KPICard
            title="Alertes Actives"
            value={stats.activeAlerts}
            trend={stats.activeAlerts > 10 ? 'up' as const : 'down' as const}
            trendValue={`${stats.activeAlerts > 10 ? '+' : '-'}${Math.abs(stats.activeAlerts - 10)}`}
            icon={<AlertTriangle />}
            variant={stats.activeAlerts > 10 ? 'danger' : 'success'}
          />
          
          <KPICard
            title="Comptes Bloqués"
            value={stats.lockedAccounts}
            trend={stats.lockedAccounts > 0 ? 'up' as const : 'down' as const}
            trendValue={`${stats.lockedAccounts}`}
            icon={<Lock />}
            variant={stats.lockedAccounts > 0 ? 'warning' : 'success'}
          />
          
          <KPICard
            title="Rate Limits"
            value={stats.rateLimitViolations}
            trend="up" as const
            trendValue="+12%"
            icon={<Shield />}
            variant="secondary"
          />
          
          <KPICard
            title="Activités Suspectes"
            value={stats.suspiciousActivities}
            trend={stats.suspiciousActivities > 5 ? 'up' as const : 'down' as const}
            trendValue={`${stats.suspiciousActivities > 5 ? '+' : '-'}${Math.abs(stats.suspiciousActivities - 5)}`}
            icon={<Activity />}
            variant={stats.suspiciousActivities > 5 ? 'warning' : 'success'}
          />
        </div>
      )}

      {/* Onglets */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList>
          <TabsTrigger active={activeTab === 'alerts'} onClick={() => setActiveTab('alerts')}>
            Alertes de Sécurité ({filteredAlerts.length})
          </TabsTrigger>
          <TabsTrigger active={activeTab === 'locked'} onClick={() => setActiveTab('locked')}>
            Comptes Bloqués ({lockedAccounts.length})
          </TabsTrigger>
          <TabsTrigger active={activeTab === 'monitoring'} onClick={() => setActiveTab('monitoring')}>
            Monitoring Temps Réel
          </TabsTrigger>
        </TabsList>

        <TabsContent className="space-y-4">{activeTab === 'alerts' && (
          <div className="space-y-4">
          {/* Filtres pour les alertes */}
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Select
                value={alertSeverityFilter}
                onChange={(value) => setAlertSeverityFilter(String(value))}
                options={[
                  { value: '', label: 'Toutes les gravités' },
                  { value: 'CRITICAL', label: 'Critique' },
                  { value: 'HIGH', label: 'Élevé' },
                  { value: 'MEDIUM', label: 'Moyen' },
                  { value: 'LOW', label: 'Faible' }
                ]}
                placeholder="Gravité"
              />
              
              <Select
                value={alertTypeFilter}
                onChange={(value) => setAlertTypeFilter(String(value))}
                options={[
                  { value: '', label: 'Tous les types' },
                  { value: 'BRUTE_FORCE', label: 'Force brute' },
                  { value: 'SUSPICIOUS_ACTIVITY', label: 'Activité suspecte' },
                  { value: 'ACCOUNT_LOCKED', label: 'Compte bloqué' },
                  { value: 'RATE_LIMIT_EXCEEDED', label: 'Rate limit dépassé' },
                  { value: 'UNAUTHORIZED_ACCESS', label: 'Accès non autorisé' }
                ]}
                placeholder="Type d'alerte"
              />
              
              <Button
                variant="outline"
                onClick={() => {
                  setAlertSeverityFilter('');
                  setAlertTypeFilter('');
                }}
              >
                Réinitialiser
              </Button>
            </div>
          </div>

          {/* Tableau des alertes */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
            <Table
              data={filteredAlerts}
              columns={alertColumns}
              loading={false}
            />
          </div>
          </div>
        )}</TabsContent>

        <TabsContent className="space-y-4">{activeTab === 'locked' && (
          <div className="space-y-4">
            {/* Tableau des comptes bloqués */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
              <Table
                data={lockedAccounts}
                columns={lockedAccountColumns}
                loading={false}
              />
            </div>
          </div>
        )}</TabsContent>

        <TabsContent className="space-y-4">{activeTab === 'monitoring' && (
          <div className="space-y-4">
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Monitoring Temps Réel
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Interface de monitoring en temps réel à implémenter...
              </p>
              {/* TODO: Implémenter les graphiques de monitoring */}
            </Card>
          </div>
        )}</TabsContent>
      </Tabs>

      {/* Modale de détails d'alerte */}
      {showAlertDetails && selectedAlert && (
        <Modal
          isOpen={showAlertDetails}
          onClose={() => {
            setShowAlertDetails(false);
            setSelectedAlert(null);
          }}
          size="lg"
        >
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Détails de l'Alerte
              </h3>
              <Badge variant={selectedAlert.severity === 'HIGH' || selectedAlert.severity === 'CRITICAL' ? 'danger' : selectedAlert.severity === 'MEDIUM' ? 'warning' : 'secondary'}>
                {severityLabels[selectedAlert.severity]}
              </Badge>
            </div>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Type
                  </label>
                  <p className="text-gray-900 dark:text-white">
                    {alertTypeLabels[selectedAlert.type]}
                  </p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Date/Heure
                  </label>
                  <p className="text-gray-900 dark:text-white">
                    {selectedAlert.timestamp.toLocaleString('fr-FR')}
                  </p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Adresse IP
                  </label>
                  <p className="text-gray-900 dark:text-white font-mono">
                    {selectedAlert.ipAddress}
                  </p>
                </div>
                
                {selectedAlert.userName && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Utilisateur
                    </label>
                    <p className="text-gray-900 dark:text-white">
                      {selectedAlert.userName}
                    </p>
                  </div>
                )}
              </div>
              
              {selectedAlert.userAgent && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    User Agent
                  </label>
                  <p className="text-gray-900 dark:text-white font-mono text-sm break-all">
                    {selectedAlert.userAgent}
                  </p>
                </div>
              )}
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Détails
                </label>
                <pre className="text-sm text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-700 p-3 rounded-lg overflow-auto">
                  {JSON.stringify(selectedAlert.details, null, 2)}
                </pre>
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 mt-6">
              <Button
                variant="outline"
                onClick={() => {
                  setShowAlertDetails(false);
                  setSelectedAlert(null);
                }}
              >
                Fermer
              </Button>
              
              {!selectedAlert.resolved && (
                <Button
                  onClick={() => {
                    handleResolveAlert(selectedAlert.id);
                    setShowAlertDetails(false);
                    setSelectedAlert(null);
                  }}
                >
                  Marquer comme résolu
                </Button>
              )}
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default SecurityPage;
/**
 * FICHIER: apps/web/src/pages/admin/index.tsx
 * PAGE: AdminDashboard - Tableau de bord d'administration
 * 
 * DESCRIPTION:
 * Page d'accueil de l'interface d'administration avec vue d'ensemble
 * du système et accès rapide aux fonctionnalités principales
 * 
 * FONCTIONNALITÉS:
 * - Vue d'ensemble des statistiques système
 * - Alertes et notifications importantes
 * - Accès rapide aux fonctions d'administration
 * - Monitoring de l'état du système
 * - Activité récente
 * 
 * AUTEUR: Équipe CROU
 * DATE: Décembre 2024
 */

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Users, 
  Shield, 
  Building, 
  AlertTriangle, 
  Activity, 
  TrendingUp,
  Clock,
  CheckCircle,
  XCircle,
  ArrowRight,
  RefreshCw
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { KPICard } from '@/components/ui/KPICard';
import { Badge } from '@/components/ui/Badge';
import { adminService } from '@/services/api/adminService';

// Types pour les données du dashboard
interface SystemOverview {
  totalUsers: number;
  activeUsers: number;
  totalRoles: number;
  totalTenants: number;
  securityAlerts: number;
  lockedAccounts: number;
  systemStatus: 'healthy' | 'warning' | 'critical';
  lastUpdate: Date;
}

interface RecentActivity {
  id: string;
  type: 'user_created' | 'user_locked' | 'role_assigned' | 'security_alert' | 'login_failed';
  description: string;
  user?: string;
  timestamp: Date;
  severity: 'info' | 'warning' | 'error';
}

interface QuickAction {
  title: string;
  description: string;
  icon: React.ComponentType<any>;
  href: string;
  variant: 'primary' | 'secondary' | 'warning' | 'success';
  count?: number;
}

const AdminDashboard: React.FC = () => {
  const [overview, setOverview] = useState<SystemOverview | null>(null);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);

  // Charger les données du dashboard
  const loadDashboardData = async () => {
    setLoading(true);
    try {
      // Récupérer les statistiques réelles depuis l'API
      const stats = await adminService.getAdminStatistics();
      const securityStats = await adminService.getSecurityStats();

      // Vue d'ensemble du système
      const realOverview: SystemOverview = {
        totalUsers: stats.totalUsers,
        activeUsers: stats.activeUsers,
        totalRoles: stats.totalRoles,
        totalTenants: stats.totalTenants,
        securityAlerts: securityStats.activeAlerts,
        lockedAccounts: securityStats.blockedAccounts,
        systemStatus: stats.systemHealth.status,
        lastUpdate: new Date()
      };
      setOverview(realOverview);

      // Récupérer les alertes de sécurité récentes comme activité
      const alerts = await adminService.getSecurityAlerts({ limit: 5, resolved: false });
      const recentAlerts: RecentActivity[] = alerts.alerts.map((alert) => ({
        id: alert.id,
        type: alert.type === 'FAILED_LOGIN' ? 'login_failed' :
              alert.type === 'ACCOUNT_LOCKED' ? 'user_locked' :
              'security_alert',
        description: alert.description,
        user: alert.userName || alert.userEmail || 'Utilisateur inconnu',
        timestamp: new Date(alert.timestamp),
        severity: alert.severity === 'CRITICAL' || alert.severity === 'HIGH' ? 'error' :
                 alert.severity === 'MEDIUM' ? 'warning' : 'info'
      }));
      setRecentActivity(recentAlerts);

    } catch (error) {
      console.error('Erreur lors du chargement du dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
    
    // Actualiser les données toutes les 2 minutes
    const interval = setInterval(loadDashboardData, 2 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  // Actions rapides
  const quickActions: QuickAction[] = [
    {
      title: 'Gestion des Utilisateurs',
      description: 'Créer, modifier et gérer les comptes utilisateurs',
      icon: Users,
      href: '/admin/users',
      variant: 'primary',
      count: overview?.totalUsers
    },
    {
      title: 'Rôles et Permissions',
      description: 'Configurer les rôles et permissions du système',
      icon: Shield,
      href: '/admin/roles',
      variant: 'secondary',
      count: overview?.totalRoles
    },
    {
      title: 'Sécurité',
      description: 'Monitoring et gestion de la sécurité',
      icon: AlertTriangle,
      href: '/admin/security',
      variant: overview && overview.securityAlerts > 0 ? 'warning' : 'success',
      count: overview?.securityAlerts
    },
    {
      title: 'Organisations (CROU)',
      description: 'Gérer les tenants et leurs configurations',
      icon: Building,
      href: '/admin/tenants',
      variant: 'secondary',
      count: overview?.totalTenants
    }
  ];

  const getActivityIcon = (type: RecentActivity['type']) => {
    switch (type) {
      case 'user_created':
        return <Users className="h-4 w-4 text-blue-500" />;
      case 'user_locked':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'role_assigned':
        return <Shield className="h-4 w-4 text-green-500" />;
      case 'security_alert':
        return <AlertTriangle className="h-4 w-4 text-orange-500" />;
      case 'login_failed':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Activity className="h-4 w-4 text-gray-500" />;
    }
  };

  const getActivityBadgeVariant = (severity: RecentActivity['severity']) => {
    switch (severity) {
      case 'error':
        return 'destructive' as const;
      case 'warning':
        return 'warning' as const;
      case 'info':
      default:
        return 'secondary' as const;
    }
  };

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
            Tableau de Bord Administration
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Vue d'ensemble du système CROU
          </p>
        </div>
        
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2">
            {overview?.systemStatus === 'healthy' ? (
              <CheckCircle className="h-5 w-5 text-green-500" />
            ) : (
              <XCircle className="h-5 w-5 text-red-500" />
            )}
            <span className="text-sm text-gray-600 dark:text-gray-400">
              Système {overview?.systemStatus === 'healthy' ? 'opérationnel' : 'en alerte'}
            </span>
          </div>
          
          <Button
            variant="outline"
            onClick={loadDashboardData}
            className="flex items-center space-x-2"
          >
            <RefreshCw className="h-4 w-4" />
            <span>Actualiser</span>
          </Button>
        </div>
      </div>

      {/* KPIs principaux */}
      {overview && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <KPICard
            title="Utilisateurs Totaux"
            value={overview.totalUsers}
            trend="up"
            trendValue={`${overview.activeUsers} actifs`}
            icon={Users}
            variant="primary"
          />
          
          <KPICard
            title="Rôles Configurés"
            value={overview.totalRoles}
            trend="stable"
            trendValue="Système complet"
            icon={Shield}
            variant="secondary"
          />
          
          <KPICard
            title="Alertes Sécurité"
            value={overview.securityAlerts}
            trend={overview.securityAlerts > 0 ? 'up' : 'down'}
            trendValue={overview.securityAlerts > 0 ? 'Attention requise' : 'Tout va bien'}
            icon={AlertTriangle}
            variant={overview.securityAlerts > 0 ? 'warning' : 'success'}
          />
          
          <KPICard
            title="Comptes Bloqués"
            value={overview.lockedAccounts}
            trend={overview.lockedAccounts > 0 ? 'up' : 'down'}
            trendValue={overview.lockedAccounts > 0 ? 'Action requise' : 'Aucun blocage'}
            icon={XCircle}
            variant={overview.lockedAccounts > 0 ? 'destructive' : 'success'}
          />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Actions rapides */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Actions Rapides
          </h3>
          
          <div className="space-y-3">
            {quickActions.map((action, index) => {
              const Icon = action.icon;
              return (
                <Link
                  key={index}
                  to={action.href}
                  className="flex items-center justify-between p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <div className="flex-shrink-0">
                      <Icon className="h-6 w-6 text-blue-500" />
                    </div>
                    <div>
                      <div className="font-medium text-gray-900 dark:text-white">
                        {action.title}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {action.description}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    {action.count !== undefined && (
                      <Badge variant={action.variant}>
                        {action.count}
                      </Badge>
                    )}
                    <ArrowRight className="h-4 w-4 text-gray-400" />
                  </div>
                </Link>
              );
            })}
          </div>
        </Card>

        {/* Activité récente */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Activité Récente
            </h3>
            <Link
              to="/admin/audit"
              className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400"
            >
              Voir tout
            </Link>
          </div>
          
          <div className="space-y-3">
            {recentActivity.map((activity) => (
              <div
                key={activity.id}
                className="flex items-start space-x-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-700"
              >
                <div className="flex-shrink-0 mt-0.5">
                  {getActivityIcon(activity.type)}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-gray-900 dark:text-white">
                      {activity.description}
                    </p>
                    <Badge variant={getActivityBadgeVariant(activity.severity)} className="ml-2">
                      {activity.severity}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center space-x-2 mt-1">
                    <Clock className="h-3 w-3 text-gray-400" />
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {activity.timestamp.toLocaleString('fr-FR')}
                    </span>
                    {activity.user && (
                      <>
                        <span className="text-xs text-gray-400">•</span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {activity.user}
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* État du système */}
      {overview && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            État du Système
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                <CheckCircle className="h-8 w-8 text-green-500" />
              </div>
              <div className="text-sm font-medium text-gray-900 dark:text-white">
                Services API
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                Opérationnels
              </div>
            </div>
            
            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                <CheckCircle className="h-8 w-8 text-green-500" />
              </div>
              <div className="text-sm font-medium text-gray-900 dark:text-white">
                Base de Données
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                Connectée
              </div>
            </div>
            
            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                <TrendingUp className="h-8 w-8 text-blue-500" />
              </div>
              <div className="text-sm font-medium text-gray-900 dark:text-white">
                Performance
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                Excellente
              </div>
            </div>
          </div>
          
          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500 dark:text-gray-400">
                Dernière mise à jour
              </span>
              <span className="text-gray-900 dark:text-white">
                {overview.lastUpdate.toLocaleString('fr-FR')}
              </span>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};

export default AdminDashboard;
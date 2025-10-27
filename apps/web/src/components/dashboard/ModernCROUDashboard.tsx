/**
 * FICHIER: apps/web/src/components/dashboard/ModernCROUDashboard.tsx
 * COMPOSANT: ModernCROUDashboard - Dashboard moderne pour CROU local
 *
 * DESCRIPTION:
 * Dashboard moderne avec KPIs dynamiques et données en temps réel
 * Interface utilisateur améliorée avec animations et interactions
 * Support des métriques financières, stocks, logement et transport
 *
 * FONCTIONNALITÉS:
 * - KPIs dynamiques avec données réelles
 * - Graphiques interactifs et responsifs
 * - Alertes critiques en temps réel
 * - Filtres et paramètres personnalisables
 * - Actions rapides et navigation
 *
 * AUTEUR: Équipe CROU
 * DATE: Décembre 2024
 */

import React, { useState, useEffect } from 'react';
import { Container, Card, Badge, Button, Grid, Section, KPICard, KPIGrid, CardHeader, CardTitle, CardContent } from '@/components/ui';
import { 
  BanknotesIcon, 
  HomeModernIcon, 
  TruckIcon, 
  CubeIcon,
  ChartBarIcon,
  UserGroupIcon,
  CurrencyDollarIcon,
  ExclamationTriangleIcon,
  DocumentArrowDownIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  MinusIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '@/stores/auth';
import { 
  useFinancialMetrics, 
  useStocksMetrics, 
  useHousingMetrics, 
  useTransportMetrics,
  useAlerts 
} from '@/hooks/useDashboard';

export const ModernCROUDashboard: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Hooks pour les métriques
  const financialMetrics = useFinancialMetrics();
  const stocksMetrics = useStocksMetrics();
  const housingMetrics = useHousingMetrics();
  const transportMetrics = useTransportMetrics();
  const { alerts, criticalAlerts, totalAlerts } = useAlerts();

  // Fonction de refresh
  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await Promise.all([
        financialMetrics.loadMetrics(),
        stocksMetrics.loadMetrics(),
        housingMetrics.loadMetrics(),
        transportMetrics.loadMetrics()
      ]);
    } finally {
      setIsRefreshing(false);
    }
  };

  // KPIs financiers
  const financialKPIs = [
    {
      title: 'Budget Total',
      value: financialMetrics.metrics.totalBudget,
      change: '+5.2%',
      trend: 'up' as const,
      icon: <CurrencyDollarIcon className="h-6 w-6" />,
      color: 'primary' as const,
      format: 'currency' as const
    },
    {
      title: 'Dépenses',
      value: financialMetrics.metrics.totalSpent,
      change: '+2.1%',
      trend: 'up' as const,
      icon: <ChartBarIcon className="h-6 w-6" />,
      color: 'warning' as const,
      format: 'currency' as const
    },
    {
      title: 'Recettes',
      value: financialMetrics.metrics.totalRevenue,
      change: '+8.3%',
      trend: 'up' as const,
      icon: <BanknotesIcon className="h-6 w-6" />,
      color: 'success' as const,
      format: 'currency' as const
    },
    {
      title: 'Solde',
      value: financialMetrics.metrics.balance,
      change: '+12.5%',
      trend: 'up' as const,
      icon: <ArrowTrendingUpIcon className="h-6 w-6" />,
      color: 'success' as const,
      format: 'currency' as const
    }
  ];

  // KPIs stocks
  const stocksKPIs = [
    {
      title: 'Articles en Stock',
      value: stocksMetrics.metrics.totalItems,
      change: '+23',
      trend: 'up' as const,
      icon: <CubeIcon className="h-6 w-6" />,
      color: 'info' as const,
      format: 'number' as const
    },
    {
      title: 'Valeur Stock',
      value: stocksMetrics.metrics.totalValue,
      change: '+8.1%',
      trend: 'up' as const,
      icon: <CurrencyDollarIcon className="h-6 w-6" />,
      color: 'primary' as const,
      format: 'currency' as const
    },
    {
      title: 'Alertes Stock',
      value: stocksMetrics.metrics.lowStockAlerts,
      change: '-3',
      trend: 'down' as const,
      icon: <ExclamationTriangleIcon className="h-6 w-6" />,
      color: 'danger' as const,
      format: 'number' as const
    },
    {
      title: 'Commandes en Cours',
      value: stocksMetrics.metrics.pendingOrders,
      change: '+2',
      trend: 'up' as const,
      icon: <DocumentArrowDownIcon className="h-6 w-6" />,
      color: 'warning' as const,
      format: 'number' as const
    }
  ];

  // KPIs logement
  const housingKPIs = [
    {
      title: 'Chambres Disponibles',
      value: housingMetrics.metrics.availableRooms,
      change: '+12',
      trend: 'up' as const,
      icon: <HomeModernIcon className="h-6 w-6" />,
      color: 'success' as const,
      format: 'number' as const
    },
    {
      title: 'Résidents Actuels',
      value: housingMetrics.metrics.occupiedRooms,
      change: '+45',
      trend: 'up' as const,
      icon: <UserGroupIcon className="h-6 w-6" />,
      color: 'primary' as const,
      format: 'number' as const
    },
    {
      title: 'Taux d\'Occupation',
      value: housingMetrics.metrics.occupancyRate,
      change: '+2.1%',
      trend: 'up' as const,
      icon: <ChartBarIcon className="h-6 w-6" />,
      color: 'success' as const,
      format: 'percentage' as const
    },
    {
      title: 'Maintenance en Cours',
      value: housingMetrics.metrics.maintenancePending,
      change: '-2',
      trend: 'down' as const,
      icon: <ExclamationTriangleIcon className="h-6 w-6" />,
      color: 'warning' as const,
      format: 'number' as const
    }
  ];

  // KPIs transport
  const transportKPIs = [
    {
      title: 'Véhicules Actifs',
      value: transportMetrics.metrics.activeVehicles,
      change: '+1',
      trend: 'up' as const,
      icon: <TruckIcon className="h-6 w-6" />,
      color: 'primary' as const,
      format: 'number' as const
    },
    {
      title: 'Kilométrage Total',
      value: transportMetrics.metrics.totalKm,
      change: '+5.2%',
      trend: 'up' as const,
      icon: <ChartBarIcon className="h-6 w-6" />,
      color: 'info' as const,
      format: 'number' as const
    },
    {
      title: 'Coût Carburant',
      value: transportMetrics.metrics.fuelCost,
      change: '+3.1%',
      trend: 'up' as const,
      icon: <CurrencyDollarIcon className="h-6 w-6" />,
      color: 'warning' as const,
      format: 'currency' as const
    },
    {
      title: 'Efficacité',
      value: transportMetrics.metrics.efficiency,
      change: '+1.2%',
      trend: 'up' as const,
      icon: <ArrowTrendingUpIcon className="h-6 w-6" />,
      color: 'success' as const,
      format: 'percentage' as const
    }
  ];

  const tabs = [
    { id: 'overview', label: 'Vue d\'ensemble', icon: ChartBarIcon },
    { id: 'financial', label: 'Finances', icon: BanknotesIcon },
    { id: 'stocks', label: 'Stocks', icon: CubeIcon },
    { id: 'housing', label: 'Logement', icon: HomeModernIcon },
    { id: 'transport', label: 'Transport', icon: TruckIcon }
  ];

  return (
    <div className="space-y-8">
      {/* Header avec titre et actions */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Dashboard CROU {user?.crouId || 'Local'}
          </h1>
          <p className="text-lg text-gray-600 mt-2">
            Vue d'ensemble des opérations et performances
          </p>
        </div>
        <div className="flex items-center gap-4">
          {totalAlerts > 0 && (
            <Badge variant="danger" className="text-lg px-4 py-2">
              {totalAlerts} Alerte{totalAlerts > 1 ? 's' : ''}
            </Badge>
          )}
          <Button
            variant="outline"
            leftIcon={<ArrowPathIcon className="h-4 w-4" />}
            onClick={handleRefresh}
            loading={isRefreshing}
          >
            Actualiser
          </Button>
        </div>
      </div>

      {/* Alertes critiques */}
      {criticalAlerts.length > 0 && (
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="text-red-800 flex items-center gap-2">
              <ExclamationTriangleIcon className="h-5 w-5" />
              Alertes Critiques
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {criticalAlerts.map((alert) => (
                <div key={alert.id} className="flex items-center gap-3 p-3 bg-white rounded-lg border border-red-200">
                  <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                  <div className="flex-1">
                    <p className="font-medium text-red-900">{alert.title}</p>
                    <p className="text-sm text-red-700">{alert.message}</p>
                  </div>
                  <Badge variant="danger" className="text-xs">
                    {alert.module}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Navigation par boutons */}
      <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg mb-8">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === tab.id
                ? 'bg-white text-primary-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            <tab.icon className="h-4 w-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Contenu conditionnel */}
      {activeTab === 'overview' && (
        <div className="space-y-8">
          {/* KPIs principaux */}
          <Section title="Indicateurs Clés de Performance">
            <KPIGrid kpis={financialKPIs} columns={4} />
          </Section>

          {/* KPIs par module */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <Section title="Stocks & Approvisionnement">
              <KPIGrid kpis={stocksKPIs} columns={2} />
            </Section>
            <Section title="Logement Universitaire">
              <KPIGrid kpis={housingKPIs} columns={2} />
            </Section>
          </div>

          <Section title="Transport & Mobilité">
            <KPIGrid kpis={transportKPIs} columns={4} />
          </Section>
        </div>
      )}

      {activeTab === 'financial' && (
        <div className="space-y-8">
          <Section title="Métriques Financières">
            <KPIGrid kpis={financialKPIs} columns={4} />
          </Section>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <Card>
              <CardHeader>
                <CardTitle>Évolution Mensuelle</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {financialMetrics.metrics.monthlyTrend.map((month, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <span className="font-medium">{month.month}</span>
                      <div className="flex items-center gap-4 text-sm">
                        <span className="text-green-600">+{month.revenue.toLocaleString()} XOF</span>
                        <span className="text-red-600">-{month.spent.toLocaleString()} XOF</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Utilisation du Budget</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span>Utilisation</span>
                    <span className="font-bold">{financialMetrics.metrics.budgetUtilization}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${financialMetrics.metrics.budgetUtilization}%` }}
                    ></div>
                  </div>
                  <div className="text-sm text-gray-600">
                    {financialMetrics.metrics.totalSpent.toLocaleString()} XOF sur {financialMetrics.metrics.totalBudget.toLocaleString()} XOF
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {activeTab === 'stocks' && (
        <div className="space-y-8">
          <Section title="Dashboard Stocks">
            <KPIGrid kpis={stocksKPIs} columns={4} />
          </Section>
          <div className="text-center py-12">
            <CubeIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Module Stocks en Développement
            </h3>
            <p className="text-gray-600">
              Le dashboard détaillé des stocks sera disponible dans la prochaine version.
            </p>
          </div>
        </div>
      )}

      {activeTab === 'housing' && (
        <div className="space-y-8">
          <Section title="Dashboard Logement">
            <KPIGrid kpis={housingKPIs} columns={4} />
          </Section>
          <div className="text-center py-12">
            <HomeModernIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Module Logement en Développement
            </h3>
            <p className="text-gray-600">
              Le dashboard détaillé du logement sera disponible dans la prochaine version.
            </p>
          </div>
        </div>
      )}

      {activeTab === 'transport' && (
        <div className="space-y-8">
          <Section title="Dashboard Transport">
            <KPIGrid kpis={transportKPIs} columns={4} />
          </Section>
          <div className="text-center py-12">
            <TruckIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Module Transport en Développement
            </h3>
            <p className="text-gray-600">
              Le dashboard détaillé du transport sera disponible dans la prochaine version.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default ModernCROUDashboard;

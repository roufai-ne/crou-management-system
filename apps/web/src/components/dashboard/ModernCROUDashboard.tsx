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
  Banknote,
  Home,
  Truck,
  Package,
  BarChart3,
  Users,
  DollarSign,
  AlertTriangle,
  FileDown,
  TrendingUp,
  TrendingDown,
  Minus,
  RefreshCw,
  Activity,
  Bell
} from 'lucide-react';
import { IconWrapper, IconWithBackground, IconDecorative } from '@/components/ui/IconWrapper';
import { ModernKPICard, ModernKPIGrid } from '@/components/ui/ModernKPICard';
import ModernTabs, { Tab } from '@/components/ui/ModernTabs';
import ModernChart from '@/components/ui/ModernChart';
import ModernStatsCard from '@/components/ui/ModernStatsCard';
import ModernProgressRing from '@/components/ui/ModernProgressRing';
import { useAuth } from '@/stores/auth';
import {
  useFinancialMetrics,
  useStocksMetrics,
  useHousingMetrics,
  useTransportMetrics,
  useAlerts
} from '@/hooks/useDashboard';
import { StocksDashboard } from './StocksDashboard';
import { HousingDashboard } from './HousingDashboard';
import { TransportDashboard } from './TransportDashboard';

export const ModernCROUDashboard: React.FC = () => {
  const { user, hasPermission } = useAuth();
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Hooks pour les métriques - only load if user has permission
  const financialMetrics = useFinancialMetrics();
  const stocksMetrics = useStocksMetrics();
  const housingMetrics = useHousingMetrics();
  const transportMetrics = useTransportMetrics();
  const { criticalAlerts, totalAlerts } = useAlerts();

  // Fonction de refresh - only refresh modules user has access to
  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      const promises = [];
      if (hasPermission('financial:read')) promises.push(financialMetrics.loadMetrics());
      if (hasPermission('stocks:read')) promises.push(stocksMetrics.loadMetrics());
      if (hasPermission('housing:read')) promises.push(housingMetrics.loadMetrics());
      if (hasPermission('transport:read')) promises.push(transportMetrics.loadMetrics());
      await Promise.all(promises);
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
      icon: <IconWrapper icon={DollarSign} size="lg" variant="primary" strokeWidth={2.5} />,
      color: 'primary' as const,
      format: 'currency' as const
    },
    {
      title: 'Dépenses',
      value: financialMetrics.metrics.totalSpent,
      change: '+2.1%',
      trend: 'up' as const,
      icon: <IconWrapper icon={BarChart3} size="lg" variant="warning" strokeWidth={2.5} />,
      color: 'warning' as const,
      format: 'currency' as const
    },
    {
      title: 'Recettes',
      value: financialMetrics.metrics.totalRevenue,
      change: '+8.3%',
      trend: 'up' as const,
      icon: <IconWrapper icon={Banknote} size="lg" variant="success" strokeWidth={2.5} />,
      color: 'success' as const,
      format: 'currency' as const
    },
    {
      title: 'Solde',
      value: financialMetrics.metrics.balance,
      change: '+12.5%',
      trend: 'up' as const,
      icon: <IconWrapper icon={TrendingUp} size="lg" variant="gradient-crou" strokeWidth={2.5} />,
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
      icon: <IconWrapper icon={Package} size="lg" variant="info" strokeWidth={2.5} />,
      color: 'info' as const,
      format: 'number' as const
    },
    {
      title: 'Valeur Stock',
      value: stocksMetrics.metrics.totalValue,
      change: '+8.1%',
      trend: 'up' as const,
      icon: <IconWrapper icon={DollarSign} size="lg" variant="gradient-primary" strokeWidth={2.5} />,
      color: 'primary' as const,
      format: 'currency' as const
    },
    {
      title: 'Alertes Stock',
      value: stocksMetrics.metrics.lowStockAlerts,
      change: '-3',
      trend: 'down' as const,
      icon: <IconWrapper icon={AlertTriangle} size="lg" variant="danger" strokeWidth={2.5} />,
      color: 'danger' as const,
      format: 'number' as const
    },
    {
      title: 'Commandes en Cours',
      value: stocksMetrics.metrics.pendingOrders,
      change: '+2',
      trend: 'up' as const,
      icon: <IconWrapper icon={FileDown} size="lg" variant="warning" strokeWidth={2.5} />,
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
      icon: <IconWrapper icon={Home} size="lg" variant="success" strokeWidth={2.5} />,
      color: 'success' as const,
      format: 'number' as const
    },
    {
      title: 'Résidents Actuels',
      value: housingMetrics.metrics.occupiedRooms,
      change: '+45',
      trend: 'up' as const,
      icon: <IconWrapper icon={Users} size="lg" variant="gradient-crou" strokeWidth={2.5} />,
      color: 'primary' as const,
      format: 'number' as const
    },
    {
      title: 'Taux d\'Occupation',
      value: housingMetrics.metrics.occupancyRate,
      change: '+2.1%',
      trend: 'up' as const,
      icon: <IconWrapper icon={BarChart3} size="lg" variant="success" strokeWidth={2.5} />,
      color: 'success' as const,
      format: 'percentage' as const
    },
    {
      title: 'Maintenance en Cours',
      value: housingMetrics.metrics.maintenancePending,
      change: '-2',
      trend: 'down' as const,
      icon: <IconWrapper icon={AlertTriangle} size="lg" variant="warning" strokeWidth={2.5} />,
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
      icon: <IconWrapper icon={Truck} size="lg" variant="gradient-accent" strokeWidth={2.5} />,
      color: 'primary' as const,
      format: 'number' as const
    },
    {
      title: 'Kilométrage Total',
      value: transportMetrics.metrics.totalKm,
      change: '+5.2%',
      trend: 'up' as const,
      icon: <IconWrapper icon={BarChart3} size="lg" variant="info" strokeWidth={2.5} />,
      color: 'info' as const,
      format: 'number' as const
    },
    {
      title: 'Coût Carburant',
      value: transportMetrics.metrics.fuelCost,
      change: '+3.1%',
      trend: 'up' as const,
      icon: <IconWrapper icon={DollarSign} size="lg" variant="warning" strokeWidth={2.5} />,
      color: 'warning' as const,
      format: 'currency' as const
    },
    {
      title: 'Efficacité',
      value: transportMetrics.metrics.efficiency,
      change: '+1.2%',
      trend: 'up' as const,
      icon: <IconWrapper icon={TrendingUp} size="lg" variant="success" strokeWidth={2.5} />,
      color: 'success' as const,
      format: 'percentage' as const
    }
  ];

  // Filter tabs based on permissions
  const allTabs = [
    { id: 'overview', label: 'Vue d\'ensemble', icon: BarChart3, permission: null },
    { id: 'financial', label: 'Finances', icon: Banknote, permission: 'financial:read' },
    { id: 'stocks', label: 'Stocks', icon: Package, permission: 'stocks:read' },
    { id: 'housing', label: 'Logement', icon: Home, permission: 'housing:read' },
    { id: 'transport', label: 'Transport', icon: Truck, permission: 'transport:read' }
  ];

  // Configuration des tabs pour ModernTabs
  const dashboardTabs: Tab[] = allTabs
    .filter(tab => !tab.permission || hasPermission(tab.permission))
    .map(tab => ({
      id: tab.id,
      label: tab.label,
      icon: tab.icon,
      badge: tab.id === 'overview' && totalAlerts > 0 ? totalAlerts.toString() : undefined,
      content: renderTabContent(tab.id),
    }));

  // Fonction pour rendre le contenu de chaque onglet
  function renderTabContent(tabId: string) {
    switch (tabId) {
      case 'overview':
        return <OverviewContent />;
      case 'financial':
        return <FinancialContent />;
      case 'stocks':
        return <StocksDashboard />;
      case 'housing':
        return <HousingDashboard />;
      case 'transport':
        return <TransportDashboard />;
      default:
        return null;
    }
  }

  // Composant Vue d'ensemble
  const OverviewContent = () => (
    <div className="space-y-8">
      {/* Alertes critiques */}
      {criticalAlerts.length > 0 && (
        <Card className="border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20">
          <CardHeader>
            <CardTitle className="text-red-800 dark:text-red-300 flex items-center gap-2">
              <IconWrapper icon={AlertTriangle} size="md" variant="danger" strokeWidth={2.5} />
              Alertes Critiques
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {criticalAlerts.map((alert) => (
                <div key={alert.id} className="flex items-center gap-3 p-3 bg-white dark:bg-gray-800 rounded-lg border border-red-200 dark:border-red-800">
                  <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                  <div className="flex-1">
                    <p className="font-medium text-red-900 dark:text-red-300">{alert.title}</p>
                    <p className="text-sm text-red-700 dark:text-red-400">{alert.message}</p>
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

      {/* KPIs en cartes modernes */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {hasPermission('financial:read') && (
          <ModernStatsCard
            title="Revenus Totaux"
            value={`${(financialMetrics.metrics.totalRevenue || 0).toLocaleString()} FCFA`}
            change={8.3}
            changeLabel="vs mois dernier"
            icon={DollarSign}
            iconColor="bg-emerald-500"
            sparklineData={[85000, 92000, 88000, 95000, 98000, 105000]}
            variant="gradient-crou"
          />
        )}
        {hasPermission('stocks:read') && (
          <ModernStatsCard
            title="Valeur Stock"
            value={`${(stocksMetrics.metrics.totalValue || 0).toLocaleString()} FCFA`}
            change={5.1}
            changeLabel="vs semaine dernière"
            icon={Package}
            iconColor="bg-blue-500"
            sparklineData={[450000, 460000, 455000, 470000, 465000, 480000]}
          />
        )}
        {hasPermission('housing:read') && (
          <ModernStatsCard
            title="Taux d'Occupation"
            value="92%"
            change={2.5}
            changeLabel="vs mois dernier"
            icon={Home}
            iconColor="bg-orange-500"
            sparklineData={[85, 87, 89, 90, 91, 92]}
          />
        )}
        {hasPermission('transport:read') && (
          <ModernStatsCard
            title="Véhicules Actifs"
            value={`${transportMetrics.metrics.activeVehicles || 0}`}
            change={0}
            changeLabel="stable"
            icon={Truck}
            iconColor="bg-purple-500"
            sparklineData={[12, 12, 11, 12, 12, 12]}
          />
        )}
      </div>

      {/* Anneaux de progression */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          📊 Indicateurs Clés
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {hasPermission('financial:read') && (
            <ModernProgressRing
              percentage={75}
              label="Budget Consommé"
              variant="gradient-crou"
              animated
              size="md"
            />
          )}
          {hasPermission('housing:read') && (
            <ModernProgressRing
              percentage={92}
              label="Chambres Occupées"
              variant="success"
              animated
              size="md"
            />
          )}
          {hasPermission('stocks:read') && (
            <ModernProgressRing
              percentage={65}
              label="Stock Optimal"
              variant="warning"
              animated
              size="md"
            />
          )}
          {hasPermission('transport:read') && (
            <ModernProgressRing
              percentage={88}
              label="Disponibilité Flotte"
              variant="default"
              animated
              size="md"
            />
          )}
        </div>
      </div>

      {/* Graphiques */}
      {hasPermission('financial:read') && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ModernChart
            type="line"
            title="Évolution des Revenus (6 mois)"
            labels={['Juin', 'Juillet', 'Août', 'Sept', 'Oct', 'Nov']}
            datasets={[
              {
                label: '2024',
                data: [850000, 920000, 880000, 950000, 980000, 1050000],
                borderColor: '#059669',
                backgroundColor: 'rgba(5, 150, 105, 0.1)',
              },
            ]}
            height={300}
            variant="gradient-crou"
          />
          <ModernChart
            type="doughnut"
            title="Répartition des Dépenses"
            labels={['Logement', 'Restauration', 'Transport', 'Administration']}
            datasets={[
              {
                data: [40, 30, 20, 10],
              },
            ]}
            height={300}
            showLegend
          />
        </div>
      )}
    </div>
  );

  // Composant Finance
  const FinancialContent = () => (
    <div className="space-y-6">
      <ModernKPIGrid
        columns={4}
        cards={financialKPIs.map(kpi => ({
          title: kpi.title,
          value: kpi.value,
          valueType: kpi.format,
          icon: kpi.icon.props.icon,
          variant: kpi.color === 'success' ? 'gradient-primary' : 'default',
          trend: {
            direction: kpi.trend,
            value: kpi.change,
            label: 'vs mois précédent',
          },
        }))}
      />
      <ModernChart
        type="bar"
        title="Budget vs Dépenses (12 mois)"
        labels={['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc']}
        datasets={[
          {
            label: 'Budget',
            data: [120000, 120000, 120000, 120000, 120000, 120000, 130000, 130000, 130000, 130000, 130000, 130000],
            backgroundColor: 'rgba(5, 150, 105, 0.7)',
          },
          {
            label: 'Dépenses',
            data: [85000, 92000, 88000, 95000, 98000, 105000, 110000, 108000, 115000, 118000, 120000, 125000],
            backgroundColor: 'rgba(234, 88, 12, 0.7)',
          },
        ]}
        height={400}
      />
    </div>
  );

  return (
    <div className="space-y-8">
      {/* Header avec titre et actions */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Dashboard CROU {user?.crouId || 'Local'}
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400 mt-2">
            Vue d'ensemble des opérations et performances
          </p>
        </div>
        <div className="flex items-center gap-4">
          {totalAlerts > 0 && (
            <Badge variant="danger" className="text-lg px-4 py-2 flex items-center gap-2">
              <Bell className="w-4 h-4" />
              {totalAlerts} Alerte{totalAlerts > 1 ? 's' : ''}
            </Badge>
          )}
          <Button
            variant="outline"
            leftIcon={<IconWrapper icon={RefreshCw} size="sm" strokeWidth={2.5} />}
            onClick={handleRefresh}
            loading={isRefreshing}
          >
            Actualiser
          </Button>
        </div>
      </div>

      {/* Navigation ModernTabs */}
      <ModernTabs
        tabs={dashboardTabs}
        variant="pills"
        size="md"
      />
    </div>
  );
};

export default ModernCROUDashboard;

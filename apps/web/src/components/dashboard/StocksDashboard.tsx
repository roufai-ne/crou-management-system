/**
 * FICHIER: apps/web/src/components/dashboard/StocksDashboard.tsx
 * COMPOSANT: StocksDashboard - Dashboard pour la gestion des stocks
 *
 * DESCRIPTION:
 * Composant de dashboard spécialisé pour la gestion des stocks
 * Affichage des KPIs, alertes et statistiques en temps réel
 * Interface moderne avec graphiques et métriques
 *
 * FONCTIONNALITÉS:
 * - KPIs de stock en temps réel
 * - Alertes critiques et warnings
 * - Top catégories de produits
 * - Mouvements récents
 * - Graphiques de tendances
 *
 * AUTEUR: Équipe CROU
 * DATE: Décembre 2024
 */

import React from 'react';
import { Container, Card, Badge, Button, Grid, Section, KPICard, KPIGrid } from '@/components/ui';
import { 
  CubeIcon, 
  ExclamationTriangleIcon, 
  ChartBarIcon, 
  CurrencyDollarIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  ClockIcon
} from '@heroicons/react/24/outline';
import { useStocksStatistics } from '@/hooks/useStocks';

export const StocksDashboard: React.FC = () => {
  const {
    totalItems,
    totalValue,
    lowStockItems,
    criticalAlerts,
    topCategories,
    recentMovements
  } = useStocksStatistics();

  // KPIs principaux
  const kpis = [
    {
      title: 'Articles en Stock',
      value: totalItems,
      change: '+12',
      trend: 'up' as const,
      icon: <CubeIcon className="h-6 w-6" />,
      color: 'primary' as const,
      format: 'number' as const
    },
    {
      title: 'Valeur Totale',
      value: totalValue,
      change: '+8.5%',
      trend: 'up' as const,
      icon: <CurrencyDollarIcon className="h-6 w-6" />,
      color: 'success' as const,
      format: 'currency' as const
    },
    {
      title: 'Stock Bas',
      value: lowStockItems,
      change: lowStockItems > 0 ? `+${lowStockItems}` : '0',
      trend: lowStockItems > 0 ? 'down' as const : 'stable' as const,
      icon: <ExclamationTriangleIcon className="h-6 w-6" />,
      color: lowStockItems > 0 ? 'danger' as const : 'success' as const,
      format: 'number' as const
    },
    {
      title: 'Alertes Critiques',
      value: criticalAlerts.length,
      change: criticalAlerts.length > 0 ? `+${criticalAlerts.length}` : '0',
      trend: criticalAlerts.length > 0 ? 'down' as const : 'stable' as const,
      icon: <ExclamationTriangleIcon className="h-6 w-6" />,
      color: criticalAlerts.length > 0 ? 'danger' as const : 'success' as const,
      format: 'number' as const
    }
  ];

  return (
    <Container size="xl" className="py-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Dashboard Stocks</h2>
            <p className="text-gray-600">Vue d'ensemble de la gestion des stocks</p>
          </div>
          <div className="flex items-center gap-4">
            {criticalAlerts.length > 0 && (
              <Badge variant="danger" className="text-lg px-4 py-2">
                {criticalAlerts.length} Alerte{criticalAlerts.length > 1 ? 's' : ''} Critique{criticalAlerts.length > 1 ? 's' : ''}
              </Badge>
            )}
            <Button
              variant="outline"
              leftIcon={<ClockIcon className="h-4 w-4" />}
              onClick={() => window.location.href = '/stocks'}
            >
              Voir Détails
            </Button>
          </div>
        </div>
      </div>

      {/* KPIs principaux */}
      <Section title="Indicateurs Clés" className="mb-8">
        <KPIGrid kpis={kpis} columns={4} />
      </Section>

      <Grid cols={2} gap={8} className="mb-8">
        {/* Top catégories */}
        <Card>
          <Card.Header>
            <Card.Title>Top Catégories</Card.Title>
          </Card.Header>
          <Card.Content>
            {topCategories.length > 0 ? (
              <div className="space-y-4">
                {topCategories.map((category, index) => (
                  <div key={category.category} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                        <span className="text-sm font-medium text-primary-600">
                          {index + 1}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 capitalize">
                          {category.category}
                        </p>
                        <p className="text-sm text-gray-500">
                          {category.count} article{category.count > 1 ? 's' : ''}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-gray-900">
                        {category.value.toLocaleString()} XOF
                      </p>
                      <p className="text-sm text-gray-500">
                        {category.percentage.toFixed(1)}%
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <CubeIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">Aucune donnée disponible</p>
              </div>
            )}
          </Card.Content>
        </Card>

        {/* Mouvements récents */}
        <Card>
          <Card.Header>
            <Card.Title>Mouvements Récents</Card.Title>
          </Card.Header>
          <Card.Content>
            {recentMovements.length > 0 ? (
              <div className="space-y-4">
                {recentMovements.map((movement) => (
                  <div key={movement.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className={`w-2 h-2 rounded-full ${
                        movement.type === 'entree' ? 'bg-green-500' : 'bg-red-500'
                      }`}></div>
                      <div>
                        <p className="font-medium text-gray-900">
                          {movement.stockItem?.libelle || 'Article inconnu'}
                        </p>
                        <p className="text-sm text-gray-500">
                          {new Date(movement.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`font-medium ${
                        movement.type === 'entree' ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {movement.type === 'entree' ? '+' : '-'}{movement.quantite}
                      </p>
                      <p className="text-sm text-gray-500 capitalize">
                        {movement.type}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <ClockIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">Aucun mouvement récent</p>
              </div>
            )}
          </Card.Content>
        </Card>
      </Grid>

      {/* Alertes critiques */}
      {criticalAlerts.length > 0 && (
        <Card className="border-red-200 bg-red-50">
          <Card.Header>
            <Card.Title className="text-red-800 flex items-center gap-2">
              <ExclamationTriangleIcon className="h-5 w-5" />
              Alertes Critiques
            </Card.Title>
          </Card.Header>
          <Card.Content>
            <div className="space-y-3">
              {criticalAlerts.map((alert) => (
                <div key={alert.id} className="flex items-center gap-3 p-3 bg-white rounded-lg border border-red-200">
                  <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-800">{alert.message}</p>
                    <p className="text-sm text-gray-500">
                      {alert.stockItem?.libelle} - Quantité: {alert.quantiteActuelle}
                    </p>
                  </div>
                  <Badge variant="danger" className="text-xs">
                    Critique
                  </Badge>
                </div>
              ))}
            </div>
          </Card.Content>
        </Card>
      )}
    </Container>
  );
};

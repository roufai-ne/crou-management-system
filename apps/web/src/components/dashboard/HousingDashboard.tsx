/**
 * FICHIER: apps/web/src/components/dashboard/HousingDashboard.tsx
 * COMPOSANT: HousingDashboard - Dashboard pour la gestion des logements
 *
 * DESCRIPTION:
 * Composant de dashboard spécialisé pour la gestion des logements
 * Affichage des KPIs, métriques et statistiques en temps réel
 * Interface moderne avec graphiques et indicateurs
 *
 * FONCTIONNALITÉS:
 * - KPIs de logement en temps réel
 * - Taux d'occupation par cité
 * - Revenus et paiements
 * - Maintenance et alertes
 * - Graphiques de tendances
 *
 * AUTEUR: Équipe CROU
 * DATE: Décembre 2024
 */

import React from 'react';
import { Container, Card, Badge, Button, Grid, Section, KPICard, KPIGrid } from '@/components/ui';
import { 
  HomeModernIcon, 
  UserGroupIcon, 
  CurrencyDollarIcon, 
  WrenchScrewdriverIcon,
  ChartBarIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  ClockIcon
} from '@heroicons/react/24/outline';
import { useHousingStatistics } from '@/hooks/useHousing';

export const HousingDashboard: React.FC = () => {
  const {
    totalComplexes,
    totalRooms,
    availableRooms,
    occupiedRooms,
    maintenanceRooms,
    totalResidents,
    monthlyRevenue,
    occupancyRate,
    pendingMaintenance,
    overduePayments,
    topComplexes,
    roomTypeDistribution
  } = useHousingStatistics();

  // KPIs principaux
  const kpis = [
    {
      title: 'Cités Universitaires',
      value: totalComplexes,
      change: '+2',
      trend: 'up' as const,
      icon: <HomeModernIcon className="h-6 w-6" />,
      color: 'primary' as const,
      format: 'number' as const
    },
    {
      title: 'Chambres Total',
      value: totalRooms,
      change: `+${availableRooms} disponibles`,
      trend: 'up' as const,
      icon: <ChartBarIcon className="h-6 w-6" />,
      color: 'info' as const,
      format: 'number' as const
    },
    {
      title: 'Taux d\'Occupation',
      value: occupancyRate,
      change: '+5.2%',
      trend: 'up' as const,
      icon: <UserGroupIcon className="h-6 w-6" />,
      color: 'success' as const,
      format: 'percentage' as const
    },
    {
      title: 'Revenus Mensuels',
      value: monthlyRevenue,
      change: '+12.3%',
      trend: 'up' as const,
      icon: <CurrencyDollarIcon className="h-6 w-6" />,
      color: 'success' as const,
      format: 'currency' as const
    }
  ];

  // KPIs secondaires
  const secondaryKpis = [
    {
      title: 'Résidents Actifs',
      value: totalResidents,
      change: '+15',
      trend: 'up' as const,
      icon: <UserGroupIcon className="h-5 w-5" />,
      color: 'primary' as const,
      format: 'number' as const
    },
    {
      title: 'Maintenance en Cours',
      value: pendingMaintenance,
      change: pendingMaintenance > 0 ? `+${pendingMaintenance}` : '0',
      trend: pendingMaintenance > 0 ? 'down' as const : 'stable' as const,
      icon: <WrenchScrewdriverIcon className="h-5 w-5" />,
      color: pendingMaintenance > 0 ? 'warning' as const : 'success' as const,
      format: 'number' as const
    },
    {
      title: 'Paiements en Retard',
      value: overduePayments,
      change: overduePayments > 0 ? `+${overduePayments}` : '0',
      trend: overduePayments > 0 ? 'down' as const : 'stable' as const,
      icon: <CurrencyDollarIcon className="h-5 w-5" />,
      color: overduePayments > 0 ? 'danger' as const : 'success' as const,
      format: 'number' as const
    },
    {
      title: 'Chambres en Maintenance',
      value: maintenanceRooms,
      change: maintenanceRooms > 0 ? `+${maintenanceRooms}` : '0',
      trend: maintenanceRooms > 0 ? 'down' as const : 'stable' as const,
      icon: <WrenchScrewdriverIcon className="h-5 w-5" />,
      color: maintenanceRooms > 0 ? 'warning' as const : 'success' as const,
      format: 'number' as const
    }
  ];

  return (
    <Container size="xl" className="py-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Dashboard Logements</h2>
            <p className="text-gray-600 dark:text-gray-400">Vue d'ensemble de la gestion des logements universitaires</p>
          </div>
          <div className="flex items-center gap-4">
            {overduePayments > 0 && (
              <Badge variant="danger" className="text-lg px-4 py-2">
                {overduePayments} Paiement{overduePayments > 1 ? 's' : ''} en Retard
              </Badge>
            )}
            <Button
              variant="outline"
              leftIcon={<ClockIcon className="h-4 w-4" />}
              onClick={() => window.location.href = '/housing'}
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

      {/* KPIs secondaires */}
      <Section title="Métriques Détaillées" className="mb-8">
        <KPIGrid kpis={secondaryKpis} columns={4} />
      </Section>

      <Grid cols={2} gap={8} className="mb-8">
        {/* Top cités par occupation */}
        <Card>
          <Card.Header>
            <Card.Title>Top Cités par Occupation</Card.Title>
          </Card.Header>
          <Card.Content>
            {topComplexes.length > 0 ? (
              <div className="space-y-4">
                {topComplexes.map((complex, index) => (
                  <div key={complex.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                        <span className="text-sm font-medium text-primary-600">
                          {index + 1}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">{complex.name}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {complex.revenue.toLocaleString()} XOF/mois
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-gray-900 dark:text-white">
                        {complex.occupancyRate.toFixed(1)}%
                      </p>
                      <div className="w-20 bg-gray-200 rounded-full h-2 mt-1">
                        <div 
                          className="bg-primary-600 h-2 rounded-full"
                          style={{ width: `${complex.occupancyRate}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <HomeModernIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 dark:text-gray-400">Aucune donnée disponible</p>
              </div>
            )}
          </Card.Content>
        </Card>

        {/* Répartition par type de chambre */}
        <Card>
          <Card.Header>
            <Card.Title>Répartition par Type de Chambre</Card.Title>
          </Card.Header>
          <Card.Content>
            {Object.keys(roomTypeDistribution).length > 0 ? (
              <div className="space-y-4">
                {Object.entries(roomTypeDistribution).map(([type, data]) => {
                  const typeLabels = {
                    single: 'Simple',
                    double: 'Double',
                    triple: 'Triple',
                    quadruple: 'Quadruple'
                  };
                  const occupancyRate = data.count > 0 ? (data.occupied / data.count) * 100 : 0;
                  
                  return (
                    <div key={type} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">{typeLabels[type as keyof typeof typeLabels]}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {data.occupied}/{data.count} chambres
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-gray-900 dark:text-white">
                          {occupancyRate.toFixed(1)}%
                        </p>
                        <div className="w-20 bg-gray-200 rounded-full h-2 mt-1">
                          <div 
                            className="bg-primary-600 h-2 rounded-full"
                            style={{ width: `${occupancyRate}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8">
                <ChartBarIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 dark:text-gray-400">Aucune donnée disponible</p>
              </div>
            )}
          </Card.Content>
        </Card>
      </Grid>

      {/* Alertes et notifications */}
      {(overduePayments > 0 || pendingMaintenance > 0) && (
        <Card className="border-orange-200 bg-orange-50">
          <Card.Header>
            <Card.Title className="text-orange-800 flex items-center gap-2">
              <WrenchScrewdriverIcon className="h-5 w-5" />
              Alertes et Notifications
            </Card.Title>
          </Card.Header>
          <Card.Content>
            <div className="space-y-3">
              {overduePayments > 0 && (
                <div className="flex items-center gap-3 p-3 bg-white rounded-lg border border-orange-200">
                  <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-800">
                      {overduePayments} paiement{overduePayments > 1 ? 's' : ''} en retard
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Action requise pour le recouvrement
                    </p>
                  </div>
                  <Badge variant="warning" className="text-xs">
                    Urgent
                  </Badge>
                </div>
              )}
              
              {pendingMaintenance > 0 && (
                <div className="flex items-center gap-3 p-3 bg-white rounded-lg border border-orange-200">
                  <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-800">
                      {pendingMaintenance} demande{pendingMaintenance > 1 ? 's' : ''} de maintenance en attente
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Planification des interventions requise
                    </p>
                  </div>
                  <Badge variant="warning" className="text-xs">
                    À traiter
                  </Badge>
                </div>
              )}
            </div>
          </Card.Content>
        </Card>
      )}
    </Container>
  );
};

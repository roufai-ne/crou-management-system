/**
 * FICHIER: apps/web/src/components/dashboard/TransportDashboard.tsx
 * COMPOSANT: TransportDashboard - Dashboard pour la gestion du transport
 *
 * DESCRIPTION:
 * Composant de dashboard spécialisé pour la gestion du transport
 * Affichage des KPIs, métriques et statistiques en temps réel
 * Interface moderne avec graphiques et indicateurs
 *
 * FONCTIONNALITÉS:
 * - KPIs de transport en temps réel
 * - Performance du parc de véhicules
 * - Efficacité des routes
 * - Maintenance et alertes
 * - Graphiques de tendances
 *
 * AUTEUR: Équipe CROU
 * DATE: Décembre 2024
 */

import React from 'react';
import { Container, Card, Badge, Button, Grid, Section, KPICard, KPIGrid } from '@/components/ui';
import { 
  TruckIcon, 
  UserGroupIcon, 
  MapIcon, 
  WrenchScrewdriverIcon, 
  ClockIcon,
  ChartBarIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import { useTransportStatistics } from '@/hooks/useTransport';

export const TransportDashboard: React.FC = () => {
  const {
    totalVehicles,
    activeVehicles,
    maintenanceVehicles,
    totalDrivers,
    activeDrivers,
    totalRoutes,
    totalTrips,
    completedTrips,
    totalMileage,
    maintenanceCost,
    averageEfficiency,
    topRoutes,
    vehicleTypeDistribution,
    maintenanceAlerts
  } = useTransportStatistics();

  // KPIs principaux
  const kpis = [
    {
      title: 'Véhicules Actifs',
      value: activeVehicles,
      change: `+${totalVehicles - activeVehicles} total`,
      trend: 'up' as const,
      icon: <TruckIcon className="h-6 w-6" />,
      color: 'primary' as const,
      format: 'number' as const
    },
    {
      title: 'Chauffeurs Actifs',
      value: activeDrivers,
      change: `+${totalDrivers - activeDrivers} total`,
      trend: 'up' as const,
      icon: <UserGroupIcon className="h-6 w-6" />,
      color: 'success' as const,
      format: 'number' as const
    },
    {
      title: 'Routes Actives',
      value: totalRoutes,
      change: `${totalMileage.toLocaleString()} km`,
      trend: 'up' as const,
      icon: <MapIcon className="h-6 w-6" />,
      color: 'info' as const,
      format: 'number' as const
    },
    {
      title: 'Trajets Terminés',
      value: completedTrips,
      change: `${((completedTrips / totalTrips) * 100).toFixed(1)}%`,
      trend: 'up' as const,
      icon: <ClockIcon className="h-6 w-6" />,
      color: 'success' as const,
      format: 'number' as const
    }
  ];

  // KPIs secondaires
  const secondaryKpis = [
    {
      title: 'Kilométrage Total',
      value: totalMileage,
      change: '+5.2%',
      trend: 'up' as const,
      icon: <ChartBarIcon className="h-5 w-5" />,
      color: 'primary' as const,
      format: 'number' as const
    },
    {
      title: 'Efficacité Moyenne',
      value: averageEfficiency,
      change: '+2.1%',
      trend: 'up' as const,
      icon: <ArrowTrendingUpIcon className="h-5 w-5" />,
      color: 'success' as const,
      format: 'number' as const
    },
    {
      title: 'Coût Maintenance',
      value: maintenanceCost,
      change: '+8.3%',
      trend: 'up' as const,
      icon: <WrenchScrewdriverIcon className="h-5 w-5" />,
      color: 'warning' as const,
      format: 'currency' as const
    },
    {
      title: 'Véhicules en Maintenance',
      value: maintenanceVehicles,
      change: maintenanceVehicles > 0 ? `+${maintenanceVehicles}` : '0',
      trend: maintenanceVehicles > 0 ? 'down' as const : 'stable' as const,
      icon: <WrenchScrewdriverIcon className="h-5 w-5" />,
      color: maintenanceVehicles > 0 ? 'warning' as const : 'success' as const,
      format: 'number' as const
    }
  ];

  return (
    <Container size="xl" className="py-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Dashboard Transport</h2>
            <p className="text-gray-600 dark:text-gray-400">Vue d'ensemble de la gestion du transport étudiant</p>
          </div>
          <div className="flex items-center gap-4">
            {maintenanceAlerts.length > 0 && (
              <Badge variant="warning" className="text-lg px-4 py-2">
                {maintenanceAlerts.length} Alerte{maintenanceAlerts.length > 1 ? 's' : ''} Maintenance
              </Badge>
            )}
            <Button
              variant="outline"
              leftIcon={<ClockIcon className="h-4 w-4" />}
              onClick={() => window.location.href = '/transport'}
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
        {/* Top routes par performance */}
        <Card>
          <Card.Header>
            <Card.Title>Top Routes par Performance</Card.Title>
          </Card.Header>
          <Card.Content>
            {topRoutes.length > 0 ? (
              <div className="space-y-4">
                {topRoutes.map((route, index) => (
                  <div key={route.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                        <span className="text-sm font-medium text-primary-600">
                          {index + 1}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">{route.name}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {route.distance} km - {route.passengerCount} passagers
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-gray-900 dark:text-white">
                        {route.tripCount} trajets
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {route.passengerCount} passagers
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <MapIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 dark:text-gray-400">Aucune donnée disponible</p>
              </div>
            )}
          </Card.Content>
        </Card>

        {/* Répartition par type de véhicule */}
        <Card>
          <Card.Header>
            <Card.Title>Répartition par Type de Véhicule</Card.Title>
          </Card.Header>
          <Card.Content>
            {Object.keys(vehicleTypeDistribution).length > 0 ? (
              <div className="space-y-4">
                {Object.entries(vehicleTypeDistribution).map(([type, data]) => {
                  const typeLabels = {
                    bus: 'Bus',
                    minibus: 'Minibus',
                    van: 'Van',
                    car: 'Voiture'
                  };
                  const activeRate = data.count > 0 ? (data.active / data.count) * 100 : 0;
                  
                  return (
                    <div key={type} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">{typeLabels[type as keyof typeof typeLabels]}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {data.active}/{data.count} actifs
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-gray-900 dark:text-white">
                          {activeRate.toFixed(1)}%
                        </p>
                        <div className="w-20 bg-gray-200 rounded-full h-2 mt-1">
                          <div 
                            className="bg-primary-600 h-2 rounded-full"
                            style={{ width: `${activeRate}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8">
                <TruckIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 dark:text-gray-400">Aucune donnée disponible</p>
              </div>
            )}
          </Card.Content>
        </Card>
      </Grid>

      {/* Alertes de maintenance */}
      {maintenanceAlerts.length > 0 && (
        <Card className="border-orange-200 bg-orange-50">
          <Card.Header>
            <Card.Title className="text-orange-800 flex items-center gap-2">
              <WrenchScrewdriverIcon className="h-5 w-5" />
              Alertes de Maintenance
            </Card.Title>
          </Card.Header>
          <Card.Content>
            <div className="space-y-3">
              {maintenanceAlerts.map((vehicle) => (
                <div key={vehicle.id} className="flex items-center gap-3 p-3 bg-white rounded-lg border border-orange-200">
                  <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-800">
                      {vehicle.plateNumber} - {vehicle.make} {vehicle.model}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Maintenance prévue: {vehicle.nextMaintenanceDate ? 
                        new Date(vehicle.nextMaintenanceDate).toLocaleDateString() : 'N/A'}
                    </p>
                  </div>
                  <Badge variant="warning" className="text-xs">
                    À planifier
                  </Badge>
                </div>
              ))}
            </div>
          </Card.Content>
        </Card>
      )}

      {/* Statistiques de performance */}
      <Card className="mt-8">
        <Card.Header>
          <Card.Title>Statistiques de Performance</Card.Title>
        </Card.Header>
        <Card.Content>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-primary-600 mb-2">
                {totalMileage.toLocaleString()}
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Kilomètres parcourus</p>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-success-600 mb-2">
                {averageEfficiency.toFixed(1)}
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Efficacité moyenne (km/L)</p>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-warning-600 mb-2">
                {maintenanceCost.toLocaleString()}
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Coût maintenance (XOF)</p>
            </div>
          </div>
        </Card.Content>
      </Card>
    </Container>
  );
};

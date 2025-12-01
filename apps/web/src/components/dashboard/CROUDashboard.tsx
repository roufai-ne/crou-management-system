/**
 * FICHIER: apps/web/src/components/dashboard/CROUDashboard.tsx
 * COMPOSANT: CROUDashboard - Vue dashboard niveau CROU local
 *
 * DESCRIPTION:
 * Dashboard spécialisé pour un centre CROU spécifique
 * Vue détaillée des opérations locales
 * Suivi quotidien des activités et performances
 *
 * FONCTIONNALITÉS:
 * - KPIs locaux détaillés
 * - Suivi opérationnel quotidien
 * - Gestion des stocks et logements
 * - Planification transport
 * - Tableaux de bord par service
 *
 * AUTEUR: Équipe CROU
 * DATE: Décembre 2024
 */

import React, { useState, useMemo } from 'react';
import {
  Container,
  Grid,
  Section,
  Divider,
  KPICard,
  KPIGrid,
  LineChart,
  BarChart,
  PieChart,
  GaugeChart,
  Table,
  Card,
  Button,
  Select,
  DateInput,
  Badge,
  Tabs
} from '@/components/ui';
import { useAuth } from '@/stores/auth';
import { useDashboardData, useDashboardFilters, useAlerts } from '@/hooks/useDashboard';
import {
  HomeIcon,
  TruckIcon,
  CubeIcon,
  CurrencyDollarIcon,
  UsersIcon,
  ClockIcon,
  CalendarDaysIcon,
  BuildingOfficeIcon
} from '@heroicons/react/24/outline';

interface DailyOperation {
  id: string;
  type: 'meal' | 'housing' | 'transport' | 'maintenance';
  title: string;
  status: 'completed' | 'in_progress' | 'pending' | 'cancelled';
  time: string;
  responsible: string;
  participants?: number;
  notes?: string;
}

interface ServiceMetrics {
  id: string;
  service: string;
  budget: number;
  used: number;
  remaining: number;
  efficiency: number;
  satisfaction: number;
  alerts: number;
}

export const CROUDashboard: React.FC = () => {
  const { user } = useAuth();
  const { filters, updateFilters } = useDashboardFilters();
  const { data, loading, refetch } = useDashboardData(filters);
  const { alerts, urgentAlerts } = useAlerts(filters);
  const [selectedPeriod, setSelectedPeriod] = useState<'today' | 'week' | 'month'>('today');

  // Opérations quotidiennes simulées
  const dailyOperations: DailyOperation[] = useMemo(() => [
    {
      id: '1',
      type: 'meal',
      title: 'Service petit-déjeuner',
      status: 'completed',
      time: '07:00',
      responsible: 'Chef Cuisine',
      participants: 850,
      notes: 'Service normal'
    },
    {
      id: '2',
      type: 'transport',
      title: 'Navette Campus - Ville',
      status: 'in_progress',
      time: '08:30',
      responsible: 'Chauffeur A',
      participants: 45
    },
    {
      id: '3',
      type: 'housing',
      title: 'Attribution chambres nouveaux',
      status: 'pending',
      time: '09:00',
      responsible: 'Service Logement',
      participants: 12
    },
    {
      id: '4',
      type: 'meal',
      title: 'Service déjeuner',
      status: 'pending',
      time: '12:00',
      responsible: 'Chef Cuisine',
      participants: 1200
    },
    {
      id: '5',
      type: 'maintenance',
      title: 'Réparation chauffage Bloc C',
      status: 'in_progress',
      time: '14:00',
      responsible: 'Technicien',
      notes: 'Pièces commandées'
    }
  ], []);

  // Métriques par service
  const serviceMetrics: ServiceMetrics[] = useMemo(() => [
    {
      id: 'restauration',
      service: 'Restauration',
      budget: 800000000,
      used: 620000000,
      remaining: 180000000,
      efficiency: 88,
      satisfaction: 92,
      alerts: 1
    },
    {
      id: 'logement',
      service: 'Logement',
      budget: 450000000,
      used: 320000000,
      remaining: 130000000,
      efficiency: 85,
      satisfaction: 89,
      alerts: 2
    },
    {
      id: 'transport',
      service: 'Transport',
      budget: 180000000,
      used: 145000000,
      remaining: 35000000,
      efficiency: 81,
      satisfaction: 87,
      alerts: 0
    },
    {
      id: 'maintenance',
      service: 'Maintenance',
      budget: 120000000,
      used: 95000000,
      remaining: 25000000,
      efficiency: 79,
      satisfaction: 85,
      alerts: 3
    }
  ], []);

  const getOperationIcon = (type: string) => {
    switch (type) {
      case 'meal': return '🍽️';
      case 'housing': return '🏠';
      case 'transport': return '🚌';
      case 'maintenance': return '🔧';
      default: return '📋';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'success';
      case 'in_progress': return 'warning';
      case 'pending': return 'info';
      case 'cancelled': return 'danger';
      default: return 'secondary';
    }
  };

  const dashboardTabs = [
    {
      id: 'overview',
      label: 'Vue d\'ensemble',
      icon: <HomeIcon className="h-5 w-5" />,
      content: (
        <Grid cols={1} gap={6}>
          {/* KPIs Principaux */}
          <Section title={`Performance ${user?.tenant?.name || 'CROU'}`} variant="elevated">
            <KPIGrid
              data={[
                {
                  title: 'Budget Mensuel',
                  value: data?.globalKPIs?.executedBudget || 2450000000,
                  target: data?.globalKPIs?.totalBudget || 3500000000,
                  format: 'currency',
                  trend: 'up',
                  change: 5.2,
                  icon: <CurrencyDollarIcon className="h-6 w-6" />
                },
                {
                  title: 'Étudiants Logés',
                  value: data?.globalKPIs?.housedStudents || 4675,
                  target: data?.globalKPIs?.totalStudents || 5500,
                  format: 'number',
                  trend: 'up',
                  change: 3.8,
                  icon: <UsersIcon className="h-6 w-6" />
                },
                {
                  title: 'Taux Occupation',
                  value: data?.globalKPIs?.occupancyRate || 85,
                  target: 90,
                  format: 'percentage',
                  trend: 'stable',
                  change: 1.2,
                  icon: <HomeIcon className="h-6 w-6" />
                },
                {
                  title: 'Satisfaction',
                  value: data?.globalKPIs?.satisfaction || 89,
                  target: 85,
                  format: 'percentage',
                  trend: 'up',
                  change: 2.5,
                  icon: <BuildingOfficeIcon className="h-6 w-6" />
                }
              ]}
              cols={4}
              responsive={{ sm: 1, md: 2, lg: 4 }}
            />
          </Section>

          <Divider />

          {/* Opérations du jour */}
          <Section
            title={`Opérations du Jour - ${new Date().toLocaleDateString('fr-FR')}`}
            action={
              <Select
                options={[
                  { value: 'today', label: 'Aujourd\'hui' },
                  { value: 'week', label: 'Cette semaine' },
                  { value: 'month', label: 'Ce mois' }
                ]}
                value={selectedPeriod}
                onChange={setSelectedPeriod}
              />
            }
          >
            <Grid cols={1} gap={3}>
              {dailyOperations.map(operation => (
                <Card key={operation.id} variant="outline">
                  <Card.Content className="flex items-center gap-4 p-4">
                    <div className="text-2xl">{getOperationIcon(operation.type)}</div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium">{operation.title}</h4>
                        <Badge variant={getStatusColor(operation.status) as any}>
                          {operation.status === 'completed' ? 'Terminé' :
                           operation.status === 'in_progress' ? 'En cours' :
                           operation.status === 'pending' ? 'En attente' : 'Annulé'}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                        <span className="flex items-center gap-1">
                          <ClockIcon className="h-4 w-4" />
                          {operation.time}
                        </span>
                        <span>{operation.responsible}</span>
                        {operation.participants && (
                          <span className="flex items-center gap-1">
                            <UsersIcon className="h-4 w-4" />
                            {operation.participants} participants
                          </span>
                        )}
                      </div>
                      {operation.notes && (
                        <p className="text-sm text-gray-500 mt-1">{operation.notes}</p>
                      )}
                    </div>
                  </Card.Content>
                </Card>
              ))}
            </Grid>
          </Section>

          <Divider />

          {/* Métriques par service */}
          <Section title="Performance par Service">
            <Grid cols={2} gap={6} responsive={{ sm: 1, lg: 2 }}>
              <Table
                data={serviceMetrics}
                columns={[
                  {
                    header: 'Service',
                    accessorKey: 'service',
                    cell: ({ value }) => (
                      <span className="font-medium">{value}</span>
                    )
                  },
                  {
                    header: 'Budget',
                    accessorKey: 'budget',
                    cell: ({ value }) => (
                      <span className="text-xs">
                        {new Intl.NumberFormat('fr-FR', {
                          style: 'currency',
                          currency: 'XOF',
                          notation: 'compact'
                        }).format(value)}
                      </span>
                    )
                  },
                  {
                    header: 'Utilisé',
                    accessorKey: 'used',
                    cell: ({ value, row }) => (
                      <div>
                        <div className="text-xs">
                          {new Intl.NumberFormat('fr-FR', {
                            style: 'currency',
                            currency: 'XOF',
                            notation: 'compact'
                          }).format(value)}
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
                          <div
                            className="bg-blue-600 h-1.5 rounded-full"
                            style={{ width: `${(value / row.original.budget) * 100}%` }}
                          />
                        </div>
                      </div>
                    )
                  },
                  {
                    header: 'Efficacité',
                    accessorKey: 'efficiency',
                    cell: ({ value }) => (
                      <Badge variant={value >= 85 ? 'success' : value >= 75 ? 'warning' : 'danger'}>
                        {value}%
                      </Badge>
                    )
                  },
                  {
                    header: 'Satisfaction',
                    accessorKey: 'satisfaction',
                    cell: ({ value }) => (
                      <Badge variant={value >= 90 ? 'success' : value >= 85 ? 'warning' : 'danger'}>
                        {value}%
                      </Badge>
                    )
                  },
                  {
                    header: 'Alertes',
                    accessorKey: 'alerts',
                    cell: ({ value }) => (
                      <Badge variant={value === 0 ? 'success' : value <= 2 ? 'warning' : 'danger'}>
                        {value}
                      </Badge>
                    )
                  }
                ]}
                compact
              />

              <div className="space-y-4">
                {serviceMetrics.map(service => (
                  <GaugeChart
                    key={service.service}
                    value={service.efficiency}
                    target={85}
                    title={`${service.service} - Efficacité`}
                    unit="%"
                    size="sm"
                    segments={[
                      { min: 0, max: 60, color: 'red', label: 'Faible' },
                      { min: 60, max: 80, color: 'orange', label: 'Moyen' },
                      { min: 80, max: 100, color: 'green', label: 'Bon' }
                    ]}
                  />
                ))}
              </div>
            </Grid>
          </Section>
        </Grid>
      )
    },
    {
      id: 'services',
      label: 'Services',
      icon: <BuildingOfficeIcon className="h-5 w-5" />,
      content: (
        <Grid cols={2} gap={6} responsive={{ sm: 1, lg: 2 }}>
          {/* Restauration */}
          <Card>
            <Card.Header>
              <Card.Title>🍽️ Restauration</Card.Title>
            </Card.Header>
            <Card.Content>
              <div className="space-y-4">
                <KPICard
                  title="Repas servis aujourd'hui"
                  value={2850}
                  target={3000}
                  format="number"
                  trend="up"
                  change={5.2}
                  size="sm"
                />
                <KPICard
                  title="Satisfaction repas"
                  value={92}
                  target={90}
                  format="percentage"
                  trend="up"
                  change={1.5}
                  size="sm"
                />
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  <p>• Petit-déjeuner: 850 repas</p>
                  <p>• Déjeuner: 1200 repas (prévisionnel)</p>
                  <p>• Dîner: 800 repas (prévisionnel)</p>
                </div>
              </div>
            </Card.Content>
          </Card>

          {/* Logement */}
          <Card>
            <Card.Header>
              <Card.Title>🏠 Logement</Card.Title>
            </Card.Header>
            <Card.Content>
              <div className="space-y-4">
                <KPICard
                  title="Taux d'occupation"
                  value={85}
                  target={90}
                  format="percentage"
                  trend="stable"
                  change={0.8}
                  size="sm"
                />
                <KPICard
                  title="Chambres disponibles"
                  value={125}
                  target={100}
                  format="number"
                  trend="down"
                  change={-2.3}
                  size="sm"
                />
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  <p>• Nouvelles attributions: 12</p>
                  <p>• Libérations: 8</p>
                  <p>• En maintenance: 15</p>
                </div>
              </div>
            </Card.Content>
          </Card>

          {/* Transport */}
          <Card>
            <Card.Header>
              <Card.Title>🚌 Transport</Card.Title>
            </Card.Header>
            <Card.Content>
              <div className="space-y-4">
                <KPICard
                  title="Véhicules opérationnels"
                  value={38}
                  target={45}
                  format="number"
                  trend="up"
                  change={2.7}
                  size="sm"
                />
                <KPICard
                  title="Trajets aujourd'hui"
                  value={125}
                  target={150}
                  format="number"
                  trend="stable"
                  change={1.2}
                  size="sm"
                />
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  <p>• Campus ↔ Ville: 85 trajets</p>
                  <p>• Circuits internes: 40 trajets</p>
                  <p>• En maintenance: 7 véhicules</p>
                </div>
              </div>
            </Card.Content>
          </Card>

          {/* Stocks */}
          <Card>
            <Card.Header>
              <Card.Title>📦 Stocks & Approvisionnement</Card.Title>
            </Card.Header>
            <Card.Content>
              <div className="space-y-4">
                <KPICard
                  title="Valeur stock total"
                  value={95000000}
                  target={120000000}
                  format="currency"
                  trend="down"
                  change={-3.2}
                  size="sm"
                />
                <KPICard
                  title="Articles en rupture"
                  value={8}
                  target={0}
                  format="number"
                  trend="up"
                  change={14.3}
                  size="sm"
                />
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  <p>• Denrées alimentaires: 75%</p>
                  <p>• Produits d'entretien: 60%</p>
                  <p>• Équipements: 40%</p>
                </div>
              </div>
            </Card.Content>
          </Card>
        </Grid>
      )
    },
    {
      id: 'planning',
      label: 'Planning',
      icon: <CalendarDaysIcon className="h-5 w-5" />,
      content: (
        <Grid cols={1} gap={6}>
          <Section title="Planning de la Semaine">
            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
              <div className="grid grid-cols-7 divide-x divide-gray-200">
                {['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].map(day => (
                  <div key={day} className="p-3 bg-gray-50 text-center font-medium text-sm">
                    {day}
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-7 divide-x divide-gray-200 min-h-[200px]">
                {Array.from({ length: 7 }, (_, i) => (
                  <div key={i} className="p-2 space-y-1">
                    <div className="text-xs font-medium text-gray-600 dark:text-gray-400">
                      {new Date(Date.now() + i * 24 * 60 * 60 * 1000).getDate()}
                    </div>
                    {i === 0 && (
                      <div className="text-xs bg-blue-100 text-blue-800 p-1 rounded">
                        Réunion équipe
                      </div>
                    )}
                    {i === 2 && (
                      <div className="text-xs bg-green-100 text-green-800 p-1 rounded">
                        Livraison stocks
                      </div>
                    )}
                    {i === 4 && (
                      <div className="text-xs bg-orange-100 text-orange-800 p-1 rounded">
                        Maintenance
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </Section>
        </Grid>
      )
    }
  ];

  return (
    <div>
      {/* En-tête spécifique CROU */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              CROU {user?.tenant?.name || 'Local'}
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              Tableau de bord opérationnel • {new Date().toLocaleDateString('fr-FR')}
            </p>
          </div>

          <div className="flex items-center gap-3">
            {urgentAlerts.length > 0 && (
              <Badge variant="danger" className="animate-pulse">
                {urgentAlerts.length} alerte{urgentAlerts.length > 1 ? 's' : ''} urgente{urgentAlerts.length > 1 ? 's' : ''}
              </Badge>
            )}
            <Button
              variant="outline"
              onClick={refetch}
              loading={loading}
            >
              Actualiser
            </Button>
          </div>
        </div>
      </div>

      {/* Contenu principal */}
      <Tabs
        tabs={dashboardTabs}
        defaultTab="overview"
        variant="card"
        lazy
      />
    </div>
  );
};

export default CROUDashboard;

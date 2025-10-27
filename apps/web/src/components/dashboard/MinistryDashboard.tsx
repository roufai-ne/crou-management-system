/**
 * FICHIER: apps/web/src/components/dashboard/MinistryDashboard.tsx
 * COMPOSANT: MinistryDashboard - Vue dashboard niveau Ministère
 *
 * DESCRIPTION:
 * Dashboard consolidé pour le niveau Ministère
 * Vue d'ensemble de tous les 8 CROUs du Niger
 * Comparaisons et analyses multi-centres
 *
 * FONCTIONNALITÉS:
 * - Vue consolidée tous CROUs
 * - Comparaisons inter-CROUs
 * - Classements et performances
 * - Filtres par CROU et période
 * - Exports et rapports détaillés
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
  Table,
  Card,
  Button,
  Select,
  DateInput,
  Badge,
  CROUSelector,
  Tabs
} from '@/components/ui';
import { useDashboardData, useDashboardFilters, useKPIs } from '@/hooks/useDashboard';
import {
  ChartBarIcon,
  DocumentArrowDownIcon,
  FunnelIcon,
  ArrowPathIcon,
  ExclamationTriangleIcon,
  TrophyIcon
} from '@heroicons/react/24/outline';

// Liste des 8 CROUs du Niger
const NIGER_CROUS = [
  { id: 'niamey', name: 'CROU Niamey', region: 'Niamey' },
  { id: 'maradi', name: 'CROU Maradi', region: 'Maradi' },
  { id: 'zinder', name: 'CROU Zinder', region: 'Zinder' },
  { id: 'tahoua', name: 'CROU Tahoua', region: 'Tahoua' },
  { id: 'dosso', name: 'CROU Dosso', region: 'Dosso' },
  { id: 'diffa', name: 'CROU Diffa', region: 'Diffa' },
  { id: 'tillaberi', name: 'CROU Tillabéri', region: 'Tillabéri' },
  { id: 'agadez', name: 'CROU Agadez', region: 'Agadez' }
];

interface CROUPerformance {
  crouId: string;
  name: string;
  budget: number;
  executionRate: number;
  students: number;
  housingRate: number;
  satisfaction: number;
  efficiency: number;
  rank: number;
  trend: 'up' | 'down' | 'stable';
  alerts: number;
}

export const MinistryDashboard: React.FC = () => {
  const { filters, updateFilters, resetFilters } = useDashboardFilters();
  const { data, loading, refetch } = useDashboardData(filters);
  const [selectedComparison, setSelectedComparison] = useState<'budget' | 'students' | 'satisfaction'>('budget');
  const [viewMode, setViewMode] = useState<'overview' | 'comparison' | 'ranking'>('overview');

  // Données simulées pour la comparaison des CROUs
  const crouPerformances: CROUPerformance[] = useMemo(() => [
    {
      crouId: 'niamey',
      name: 'CROU Niamey',
      budget: 8500000000,
      executionRate: 78,
      students: 12500,
      housingRate: 85,
      satisfaction: 92,
      efficiency: 88,
      rank: 1,
      trend: 'up',
      alerts: 2
    },
    {
      crouId: 'maradi',
      name: 'CROU Maradi',
      budget: 4200000000,
      executionRate: 82,
      students: 8200,
      housingRate: 87,
      satisfaction: 90,
      efficiency: 85,
      rank: 2,
      trend: 'up',
      alerts: 1
    },
    {
      crouId: 'zinder',
      name: 'CROU Zinder',
      budget: 3800000000,
      executionRate: 75,
      students: 7500,
      housingRate: 80,
      satisfaction: 88,
      efficiency: 82,
      rank: 3,
      trend: 'stable',
      alerts: 3
    },
    {
      crouId: 'tahoua',
      name: 'CROU Tahoua',
      budget: 2900000000,
      executionRate: 80,
      students: 5800,
      housingRate: 83,
      satisfaction: 89,
      efficiency: 86,
      rank: 4,
      trend: 'up',
      alerts: 1
    },
    {
      crouId: 'dosso',
      name: 'CROU Dosso',
      budget: 2100000000,
      executionRate: 77,
      students: 4200,
      housingRate: 78,
      satisfaction: 86,
      efficiency: 81,
      rank: 5,
      trend: 'stable',
      alerts: 2
    },
    {
      crouId: 'diffa',
      name: 'CROU Diffa',
      budget: 1800000000,
      executionRate: 72,
      students: 3500,
      housingRate: 75,
      satisfaction: 84,
      efficiency: 79,
      rank: 6,
      trend: 'down',
      alerts: 4
    },
    {
      crouId: 'tillaberi',
      name: 'CROU Tillabéri',
      budget: 1600000000,
      executionRate: 74,
      students: 3100,
      housingRate: 76,
      satisfaction: 85,
      efficiency: 80,
      rank: 7,
      trend: 'stable',
      alerts: 2
    },
    {
      crouId: 'agadez',
      name: 'CROU Agadez',
      budget: 1400000000,
      executionRate: 70,
      students: 2800,
      housingRate: 72,
      satisfaction: 82,
      efficiency: 77,
      rank: 8,
      trend: 'down',
      alerts: 3
    }
  ], []);

  const dashboardTabs = [
    {
      id: 'overview',
      label: 'Vue d\'ensemble',
      icon: <ChartBarIcon className="h-5 w-5" />,
      content: (
        <Grid cols={1} gap={6}>
          {/* KPIs Consolidés */}
          <Section title="Performance Nationale" variant="elevated">
            <KPIGrid
              data={[
                {
                  title: 'Budget Total National',
                  value: data?.globalKPIs?.totalBudget || 25000000000,
                  target: 30000000000,
                  format: 'currency',
                  trend: 'up',
                  change: 5.2,
                  icon: <ChartBarIcon className="h-6 w-6" />
                },
                {
                  title: 'Étudiants Totaux',
                  value: data?.globalKPIs?.totalStudents || 45000,
                  target: 50000,
                  format: 'number',
                  trend: 'up',
                  change: 3.8,
                },
                {
                  title: 'Taux d\'Exécution Moyen',
                  value: data?.globalKPIs?.executionRate || 75,
                  target: 80,
                  format: 'percentage',
                  trend: 'stable',
                  change: 0.5,
                },
                {
                  title: 'Satisfaction Nationale',
                  value: data?.globalKPIs?.satisfaction || 88,
                  target: 90,
                  format: 'percentage',
                  trend: 'up',
                  change: 2.1,
                }
              ]}
              cols={4}
              responsive={{ sm: 1, md: 2, lg: 4 }}
            />
          </Section>

          <Divider />

          {/* Comparaison par CROU */}
          <Section
            title="Performance par CROU"
            action={
              <Select
                options={[
                  { value: 'budget', label: 'Budget' },
                  { value: 'students', label: 'Étudiants' },
                  { value: 'satisfaction', label: 'Satisfaction' }
                ]}
                value={selectedComparison}
                onChange={setSelectedComparison}
              />
            }
          >
            <BarChart
              data={crouPerformances}
              xField="name"
              yField={selectedComparison}
              format={selectedComparison === 'budget' ? 'currency' :
                     selectedComparison === 'students' ? 'number' : 'percentage'}
              title={`Comparaison ${selectedComparison === 'budget' ? 'Budgétaire' :
                                    selectedComparison === 'students' ? 'Étudiants' : 'Satisfaction'}`}
              variant="card"
              colors={['#3B82F6', '#10B981', '#F59E0B', '#EF4444']}
            />
          </Section>

          <Divider />

          {/* Évolution nationale */}
          <Grid cols={2} gap={6} responsive={{ sm: 1, lg: 2 }}>
            <LineChart
              data={data?.evolution || []}
              xField="period"
              yField="budget"
              format="currency"
              title="Évolution Budgétaire Nationale"
              variant="card"
            />
            <LineChart
              data={data?.evolution || []}
              xField="period"
              yField="students"
              format="number"
              title="Évolution Population Étudiante"
              variant="card"
            />
          </Grid>
        </Grid>
      )
    },
    {
      id: 'comparison',
      label: 'Comparaison CROUs',
      icon: <FunnelIcon className="h-5 w-5" />,
      content: (
        <Grid cols={1} gap={6}>
          <Section title="Tableau Comparatif des CROUs">
            <Table
              data={crouPerformances}
              columns={[
                {
                  header: 'Rang',
                  accessorKey: 'rank',
                  cell: ({ value }) => (
                    <div className="flex items-center gap-2">
                      {value <= 3 && <TrophyIcon className={`h-4 w-4 ${
                        value === 1 ? 'text-yellow-500' :
                        value === 2 ? 'text-gray-400' : 'text-amber-600'
                      }`} />}
                      <span className="font-semibold">{value}</span>
                    </div>
                  )
                },
                {
                  header: 'CROU',
                  accessorKey: 'name',
                  cell: ({ value, row }) => (
                    <div>
                      <div className="font-medium">{value}</div>
                      <div className="text-sm text-gray-500">
                        {NIGER_CROUS.find(c => c.id === row.original.crouId)?.region}
                      </div>
                    </div>
                  )
                },
                {
                  header: 'Budget',
                  accessorKey: 'budget',
                  cell: ({ value }) => (
                    <span className="text-sm">
                      {new Intl.NumberFormat('fr-FR', {
                        style: 'currency',
                        currency: 'XOF',
                        notation: 'compact'
                      }).format(value)}
                    </span>
                  )
                },
                {
                  header: 'Taux Exécution',
                  accessorKey: 'executionRate',
                  cell: ({ value }) => (
                    <Badge variant={value >= 80 ? 'success' : value >= 70 ? 'warning' : 'danger'}>
                      {value}%
                    </Badge>
                  )
                },
                {
                  header: 'Étudiants',
                  accessorKey: 'students',
                  cell: ({ value }) => (
                    <span className="text-sm">
                      {new Intl.NumberFormat('fr-FR').format(value)}
                    </span>
                  )
                },
                {
                  header: 'Taux Logement',
                  accessorKey: 'housingRate',
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
                  header: 'Efficacité',
                  accessorKey: 'efficiency',
                  cell: ({ value }) => (
                    <div className="flex items-center gap-2">
                      <div className="w-16 bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${
                            value >= 85 ? 'bg-green-500' :
                            value >= 75 ? 'bg-yellow-500' : 'bg-red-500'
                          }`}
                          style={{ width: `${value}%` }}
                        />
                      </div>
                      <span className="text-sm text-gray-600">{value}%</span>
                    </div>
                  )
                },
                {
                  header: 'Alertes',
                  accessorKey: 'alerts',
                  cell: ({ value }) => (
                    <div className="flex items-center gap-1">
                      {value > 0 && <ExclamationTriangleIcon className="h-4 w-4 text-orange-500" />}
                      <Badge variant={value === 0 ? 'success' : value <= 2 ? 'warning' : 'danger'}>
                        {value}
                      </Badge>
                    </div>
                  )
                }
              ]}
              sortable
              pagination={{ pageSize: 10 }}
            />
          </Section>
        </Grid>
      )
    },
    {
      id: 'ranking',
      label: 'Classements',
      icon: <TrophyIcon className="h-5 w-5" />,
      content: (
        <Grid cols={2} gap={6} responsive={{ sm: 1, lg: 2 }}>
          {/* Top Performers */}
          <Card>
            <Card.Header>
              <Card.Title>🏆 Meilleurs Performances</Card.Title>
            </Card.Header>
            <Card.Content>
              <div className="space-y-4">
                {crouPerformances.slice(0, 3).map((crou, index) => (
                  <div key={crou.crouId} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-white ${
                        index === 0 ? 'bg-yellow-500' :
                        index === 1 ? 'bg-gray-400' : 'bg-amber-600'
                      }`}>
                        {index + 1}
                      </div>
                      <div>
                        <div className="font-medium">{crou.name}</div>
                        <div className="text-sm text-gray-500">Efficacité: {crou.efficiency}%</div>
                      </div>
                    </div>
                    <Badge variant="success">{crou.satisfaction}% satisfaction</Badge>
                  </div>
                ))}
              </div>
            </Card.Content>
          </Card>

          {/* CROUs nécessitant attention */}
          <Card>
            <Card.Header>
              <Card.Title>⚠️ Attention Requise</Card.Title>
            </Card.Header>
            <Card.Content>
              <div className="space-y-4">
                {crouPerformances
                  .filter(crou => crou.alerts > 2 || crou.executionRate < 75)
                  .map(crou => (
                    <div key={crou.crouId} className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <ExclamationTriangleIcon className="h-6 w-6 text-orange-500" />
                        <div>
                          <div className="font-medium">{crou.name}</div>
                          <div className="text-sm text-gray-500">
                            {crou.alerts} alertes • {crou.executionRate}% exécution
                          </div>
                        </div>
                      </div>
                      <Badge variant="warning">Action requise</Badge>
                    </div>
                  ))
                }
              </div>
            </Card.Content>
          </Card>

          {/* Évolution tendances */}
          <Card className="col-span-full">
            <Card.Header>
              <Card.Title>📈 Tendances par CROU</Card.Title>
            </Card.Header>
            <Card.Content>
              <BarChart
                data={crouPerformances}
                xField="name"
                yField="efficiency"
                format="percentage"
                title="Indice d'Efficacité par CROU"
                colors={crouPerformances.map(crou =>
                  crou.trend === 'up' ? '#10B981' :
                  crou.trend === 'down' ? '#EF4444' : '#6B7280'
                )}
              />
            </Card.Content>
          </Card>
        </Grid>
      )
    }
  ];

  return (
    <div>
      {/* Contrôles et filtres */}
      <div className="mb-6 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="flex items-center gap-4">
          <h2 className="text-xl font-semibold text-gray-900">Dashboard Ministère</h2>
          <Badge variant="info" className="text-xs">
            Vue consolidée • 8 CROUs
          </Badge>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <CROUSelector
            value={filters.crouId}
            onChange={(crouId) => updateFilters({ crouId })}
            placeholder="Filtrer par CROU"
            allowClear
            className="w-48"
          />

          <div className="flex gap-2">
            <DateInput
              value={filters.startDate}
              onChange={(date) => updateFilters({ startDate: date })}
              placeholder="Date début"
            />
            <DateInput
              value={filters.endDate}
              onChange={(date) => updateFilters({ endDate: date })}
              placeholder="Date fin"
            />
          </div>

          <Button
            variant="outline"
            onClick={refetch}
            leftIcon={<ArrowPathIcon className="h-4 w-4" />}
            loading={loading}
          >
            Actualiser
          </Button>

          <Button
            variant="primary"
            leftIcon={<DocumentArrowDownIcon className="h-4 w-4" />}
          >
            Exporter
          </Button>
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

export default MinistryDashboard;

/**
 * FICHIER: apps/web/src/pages/housing/AvailabilityDashboard.tsx
 * PAGE: AvailabilityDashboard - Dashboard disponibilité logements temps réel
 *
 * DESCRIPTION:
 * Dashboard temps réel de disponibilité des logements
 * KPI Cards, DataTable cités, graphiques évolution
 * Export Excel/PDF et refresh auto
 *
 * FONCTIONNALITÉS:
 * - KPI Cards (total/occupés/disponibles par genre)
 * - DataTable cités filtrables
 * - Graphiques recharts (Line/Pie/Bar)
 * - Filtres avancés (année/cité/genre)
 * - Export Excel/PDF
 * - Refresh auto 30s ou manuel
 *
 * AUTEUR: Équipe CROU
 * DATE: Janvier 2025
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  Container,
  Card,
  CardBody,
  CardHeader,
  Button,
  Badge,
  DataTable,
  TableColumn,
  Select,
  KPICard,
  KPIGrid,
  Alert
} from '@/components/ui';
import {
  ArrowPathIcon,
  ArrowDownTrayIcon,
  HomeModernIcon,
  UserGroupIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';
import { LineChart, Line, PieChart, Pie, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import { housingReportService, RoomAvailability, GlobalStatistics } from '@/services/api/housingReportService';

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

export const AvailabilityDashboard: React.FC = () => {
  // États
  const [availability, setAvailability] = useState<RoomAvailability[]>([]);
  const [genderStats, setGenderStats] = useState<any>(null);
  const [globalStats, setGlobalStats] = useState<GlobalStatistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  // Filtres
  const [filters, setFilters] = useState({
    genderRestriction: 'all',
    housingId: 'all',
    year: new Date().getFullYear()
  });

  // Charger données
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Disponibilité
      const availabilityResult = await housingReportService.getAvailability({
        genderRestriction: filters.genderRestriction !== 'all' ? filters.genderRestriction : undefined
      });
      setAvailability(availabilityResult.data);

      // Stats par genre
      const genderResult = await housingReportService.getAvailabilityByGender();
      setGenderStats(genderResult.data);

      // Stats globales
      const globalResult = await housingReportService.getGlobalStatistics();
      setGlobalStats(globalResult.data);

      setLastRefresh(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur chargement données');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Auto-refresh 30s
  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(() => {
        loadData();
      }, 30000);

      return () => clearInterval(interval);
    }
  }, [autoRefresh, loadData]);

  // Export Excel (simulé)
  const handleExportExcel = () => {
    // Générer CSV
    const headers = ['Cité', 'Chambre', 'Genre', 'Total lits', 'Occupés', 'Disponibles', 'Taux %'];
    const rows = availability.map(room => [
      room.housingName,
      room.roomNumber,
      room.genderRestriction,
      room.totalBeds,
      room.occupiedBeds,
      room.availableBeds,
      room.occupancyRate.toFixed(1)
    ]);

    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `disponibilite-logements-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  // Export PDF (simulé)
  const handleExportPDF = () => {
    alert('Export PDF - Fonctionnalité à implémenter avec jsPDF');
  };

  // KPI Cards data
  const kpiData = globalStats ? [
    {
      title: 'Total Lits',
      value: globalStats.occupancy.totalBeds,
      icon: HomeModernIcon,
      trend: { value: 0, label: '' },
      color: 'blue' as const
    },
    {
      title: 'Occupés',
      value: globalStats.occupancy.occupiedBeds,
      icon: UserGroupIcon,
      trend: { value: 0, label: '' },
      color: 'green' as const
    },
    {
      title: 'Disponibles',
      value: globalStats.occupancy.availableBeds,
      icon: CheckCircleIcon,
      trend: { value: 0, label: '' },
      color: 'orange' as const
    },
    {
      title: 'Taux Occupation',
      value: `${globalStats.occupancy.globalOccupancyRate.toFixed(1)}%`,
      icon: HomeModernIcon,
      trend: { value: 0, label: '' },
      color: 'purple' as const
    }
  ] : [];

  // Données graphiques
  const pieData = genderStats ? [
    { name: 'Hommes Disponibles', value: genderStats.male.availableBeds },
    { name: 'Femmes Disponibles', value: genderStats.female.availableBeds },
    { name: 'Hommes Occupés', value: genderStats.male.occupiedBeds },
    { name: 'Femmes Occupés', value: genderStats.female.occupiedBeds }
  ] : [];

  const barData = genderStats ? [
    {
      name: 'Hommes',
      'Disponibles': genderStats.male.availableBeds,
      'Occupés': genderStats.male.occupiedBeds,
      'Réservés': genderStats.male.reservedBeds
    },
    {
      name: 'Femmes',
      'Disponibles': genderStats.female.availableBeds,
      'Occupés': genderStats.female.occupiedBeds,
      'Réservés': genderStats.female.reservedBeds
    }
  ] : [];

  const lineData = globalStats?.trends.map(trend => ({
    name: `${trend.month}/${trend.year}`,
    demandes: trend.count
  })) || [];

  // Colonnes tableau
  const columns: TableColumn<RoomAvailability>[] = [
    {
      key: 'housingName',
      label: 'Cité',
      render: (room) => (
        <div>
          <p className="font-medium">{room.housingName}</p>
          <p className="text-sm text-gray-500">Chambre {room.roomNumber}</p>
        </div>
      )
    },
    {
      key: 'genderRestriction',
      label: 'Genre',
      render: (room) => {
        const colors: Record<string, any> = {
          HOMMES: 'info',
          FEMMES: 'danger',
          MIXTE: 'default'
        };
        return <Badge variant={colors[room.genderRestriction]}>{room.genderRestriction}</Badge>;
      }
    },
    {
      key: 'totalBeds',
      label: 'Capacité',
      render: (room) => <span className="font-medium">{room.totalBeds}</span>
    },
    {
      key: 'occupiedBeds',
      label: 'Occupés',
      render: (room) => <span className="text-green-600">{room.occupiedBeds}</span>
    },
    {
      key: 'availableBeds',
      label: 'Disponibles',
      render: (room) => <span className="text-blue-600 font-semibold">{room.availableBeds}</span>
    },
    {
      key: 'occupancyRate',
      label: 'Taux occupation',
      render: (room) => (
        <div className="flex items-center gap-2">
          <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div
              className={`h-2 rounded-full ${
                room.occupancyRate > 80 ? 'bg-red-500' : room.occupancyRate > 50 ? 'bg-orange-500' : 'bg-green-500'
              }`}
              style={{ width: `${room.occupancyRate}%` }}
            />
          </div>
          <span className="text-sm font-medium">{room.occupancyRate.toFixed(0)}%</span>
        </div>
      )
    },
    {
      key: 'loyerMensuel',
      label: 'Loyer',
      render: (room) => <span className="text-sm">{room.loyerMensuel.toLocaleString()} FCFA</span>
    }
  ];

  return (
    <Container className="py-6">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Dashboard Disponibilité Logements
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Dernière mise à jour: {lastRefresh.toLocaleTimeString('fr-FR')}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            leftIcon={<ArrowPathIcon className="h-5 w-5" />}
            onClick={loadData}
            disabled={loading}
          >
            Actualiser
          </Button>
          <Button
            variant="outline"
            leftIcon={<ArrowDownTrayIcon className="h-5 w-5" />}
            onClick={handleExportExcel}
          >
            Export Excel
          </Button>
          <Button
            variant="outline"
            leftIcon={<ArrowDownTrayIcon className="h-5 w-5" />}
            onClick={handleExportPDF}
          >
            Export PDF
          </Button>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              className="rounded"
            />
            <span className="text-sm">Auto-refresh (30s)</span>
          </label>
        </div>
      </div>

      {error && <Alert variant="danger" className="mb-6">{error}</Alert>}

      {/* KPI Cards */}
      <KPIGrid className="mb-6">
        {kpiData.map((kpi, idx) => (
          <KPICard key={idx} {...kpi} />
        ))}
      </KPIGrid>

      {/* Sous-KPI Genre */}
      {genderStats && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <Card>
            <CardBody>
              <div className="flex items-center gap-3">
                <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-lg">
                  <UserGroupIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Disponibles Hommes</p>
                  <p className="text-2xl font-bold text-blue-600">{genderStats.male.availableBeds}</p>
                  <p className="text-xs text-gray-500">{genderStats.male.roomCount} chambres</p>
                </div>
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardBody>
              <div className="flex items-center gap-3">
                <div className="p-3 bg-pink-100 dark:bg-pink-900 rounded-lg">
                  <UserGroupIcon className="h-6 w-6 text-pink-600 dark:text-pink-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Disponibles Femmes</p>
                  <p className="text-2xl font-bold text-pink-600">{genderStats.female.availableBeds}</p>
                  <p className="text-xs text-gray-500">{genderStats.female.roomCount} chambres</p>
                </div>
              </div>
            </CardBody>
          </Card>
        </div>
      )}

      {/* Graphiques */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* LineChart Évolution */}
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold">Évolution des demandes (12 mois)</h3>
          </CardHeader>
          <CardBody>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={lineData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="demandes" stroke="#3B82F6" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardBody>
        </Card>

        {/* PieChart Répartition */}
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold">Répartition par genre</h3>
          </CardHeader>
          <CardBody>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(entry) => `${entry.name}: ${entry.value}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardBody>
        </Card>

        {/* BarChart Comparatif Genre */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <h3 className="text-lg font-semibold">Comparatif par genre</h3>
          </CardHeader>
          <CardBody>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={barData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="Disponibles" stackId="a" fill="#10B981" />
                <Bar dataKey="Occupés" stackId="a" fill="#3B82F6" />
                <Bar dataKey="Réservés" stackId="a" fill="#F59E0B" />
              </BarChart>
            </ResponsiveContainer>
          </CardBody>
        </Card>
      </div>

      {/* Filtres */}
      <Card className="mb-6">
        <CardBody>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Select
              label="Genre"
              value={filters.genderRestriction}
              onChange={(e) => setFilters({ ...filters, genderRestriction: e.target.value })}
              options={[
                { value: 'all', label: 'Tous' },
                { value: 'HOMMES', label: 'Hommes' },
                { value: 'FEMMES', label: 'Femmes' },
                { value: 'MIXTE', label: 'Mixte' }
              ]}
            />
            <Select
              label="Année"
              value={filters.year.toString()}
              onChange={(e) => setFilters({ ...filters, year: parseInt(e.target.value) })}
              options={[
                { value: '2025', label: '2025' },
                { value: '2024', label: '2024' },
                { value: '2023', label: '2023' }
              ]}
            />
            <div className="flex items-end">
              <Button
                variant="outline"
                onClick={() => setFilters({ genderRestriction: 'all', housingId: 'all', year: new Date().getFullYear() })}
                className="w-full"
              >
                Réinitialiser filtres
              </Button>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* DataTable Cités */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold">Disponibilité par chambre</h3>
        </CardHeader>
        <CardBody>
          <DataTable
            columns={columns}
            data={availability}
            loading={loading}
          />
        </CardBody>
      </Card>
    </Container>
  );
};

export default AvailabilityDashboard;

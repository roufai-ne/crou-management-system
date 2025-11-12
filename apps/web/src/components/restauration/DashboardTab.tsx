/**
 * FICHIER: apps/web/src/components/restauration/DashboardTab.tsx
 * COMPOSANT: DashboardTab - Dashboard du module Restauration
 *
 * DESCRIPTION:
 * Dashboard principal avec KPIs, statistiques et indicateurs en temps réel
 * Affiche les services en cours, alertes de denrées et graphiques
 *
 * FONCTIONNALITÉS:
 * - KPIs globaux (restaurants, services, tickets, denrées)
 * - Services en cours en temps réel
 * - Alertes de denrées (stock bas, périmés)
 * - Graphiques de fréquentation et recettes
 * - Actions rapides
 *
 * AUTEUR: Équipe CROU
 * DATE: Janvier 2025
 */

import React, { useEffect } from 'react';
import { Card, Badge, Button } from '@/components/ui';
import {
  BuildingStorefrontIcon,
  TicketIcon,
  CakeIcon,
  CubeIcon,
  ExclamationTriangleIcon,
  ClockIcon,
  UserGroupIcon,
  CurrencyDollarIcon,
  PlusIcon,
  EyeIcon
} from '@heroicons/react/24/outline';
import { useRestaurationStatistics, useServiceEnCours, useDenreeAlerts } from '@/hooks/useRestauration';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export const DashboardTab: React.FC = () => {
  const {
    statistics,
    loading: statsLoading,
    error: statsError,
    loadStatistics
  } = useRestaurationStatistics();

  const {
    servicesEnCours,
    loading: servicesLoading,
    loadServicesEnCours
  } = useServiceEnCours();

  const {
    alertesCritiques,
    alertesAvertissement,
    denreesPerimerSoon,
    loading: alertesLoading,
    loadAlerts
  } = useDenreeAlerts();

  useEffect(() => {
    loadStatistics();
    loadServicesEnCours();
    loadAlerts();
  }, []);

  if (statsLoading || servicesLoading || alertesLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement du dashboard...</p>
        </div>
      </div>
    );
  }

  if (statsError) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <ExclamationTriangleIcon className="h-12 w-12 text-red-500 mx-auto" />
          <p className="mt-4 text-red-600">Erreur: {statsError}</p>
        </div>
      </div>
    );
  }

  const kpis = [
    {
      label: 'Restaurants Actifs',
      value: statistics?.restaurantsActifs || 0,
      total: statistics?.totalRestaurants || 0,
      icon: <BuildingStorefrontIcon className="h-8 w-8 text-blue-600" />,
      bgColor: 'bg-blue-50',
      change: statistics?.evolutionRestaurants || 0
    },
    {
      label: 'Services Aujourd\'hui',
      value: statistics?.servicesAujourdhui || 0,
      total: statistics?.servicesTotal || 0,
      icon: <CakeIcon className="h-8 w-8 text-green-600" />,
      bgColor: 'bg-green-50',
      change: statistics?.evolutionServices || 0
    },
    {
      label: 'Tickets Émis',
      value: statistics?.ticketsEmisAujourdhui || 0,
      total: statistics?.ticketsTotal || 0,
      icon: <TicketIcon className="h-8 w-8 text-purple-600" />,
      bgColor: 'bg-purple-50',
      change: statistics?.evolutionTickets || 0
    },
    {
      label: 'Denrées Disponibles',
      value: statistics?.denreesDisponibles || 0,
      total: statistics?.totalDenrees || 0,
      icon: <CubeIcon className="h-8 w-8 text-orange-600" />,
      bgColor: 'bg-orange-50',
      change: statistics?.evolutionDenrees || 0
    }
  ];

  const financialKpis = [
    {
      label: 'Recettes Aujourd\'hui',
      value: `${(statistics?.recettesAujourdhui || 0).toLocaleString()} XOF`,
      icon: <CurrencyDollarIcon className="h-6 w-6 text-green-600" />,
      change: statistics?.evolutionRecettes || 0
    },
    {
      label: 'Rationnaires Servis',
      value: (statistics?.rationnairesServis || 0).toLocaleString(),
      icon: <UserGroupIcon className="h-6 w-6 text-blue-600" />,
      change: statistics?.evolutionRationnaires || 0
    },
    {
      label: 'Taux Fréquentation',
      value: `${statistics?.tauxFrequentationMoyen || 0}%`,
      icon: <ChartBarIcon className="h-6 w-6 text-purple-600" />,
      change: statistics?.evolutionFrequentation || 0
    }
  ];

  return (
    <div className="space-y-6">
      {/* KPIs Principaux */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpis.map((kpi, index) => (
          <Card key={index}>
            <Card.Content className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-600">{kpi.label}</p>
                  <div className="mt-2 flex items-baseline">
                    <p className="text-3xl font-bold text-gray-900">{kpi.value}</p>
                    {kpi.total > 0 && (
                      <p className="ml-2 text-sm text-gray-500">/ {kpi.total}</p>
                    )}
                  </div>
                  {kpi.change !== 0 && (
                    <p className={`text-sm mt-2 ${kpi.change > 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {kpi.change > 0 ? '+' : ''}{kpi.change}% vs hier
                    </p>
                  )}
                </div>
                <div className={`${kpi.bgColor} p-3 rounded-lg`}>
                  {kpi.icon}
                </div>
              </div>
            </Card.Content>
          </Card>
        ))}
      </div>

      {/* KPIs Financiers */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {financialKpis.map((kpi, index) => (
          <Card key={index}>
            <Card.Content className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">{kpi.label}</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{kpi.value}</p>
                  {kpi.change !== 0 && (
                    <p className={`text-xs mt-1 ${kpi.change > 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {kpi.change > 0 ? '+' : ''}{kpi.change}% vs hier
                    </p>
                  )}
                </div>
                {kpi.icon}
              </div>
            </Card.Content>
          </Card>
        ))}
      </div>

      {/* Services En Cours */}
      <Card>
        <Card.Header>
          <div className="flex items-center justify-between">
            <Card.Title className="flex items-center gap-2">
              <ClockIcon className="h-5 w-5 text-green-600" />
              Services En Cours ({servicesEnCours?.length || 0})
            </Card.Title>
            <Button size="sm" variant="outline" leftIcon={<PlusIcon className="h-4 w-4" />}>
              Démarrer Service
            </Button>
          </div>
        </Card.Header>
        <Card.Content>
          {servicesEnCours && servicesEnCours.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {servicesEnCours.map((service: any) => (
                <div
                  key={service.id}
                  className="border border-green-200 bg-green-50 rounded-lg p-4"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="font-semibold text-gray-900">{service.restaurant?.nom}</p>
                      <p className="text-sm text-gray-600">{service.menu?.titre}</p>
                    </div>
                    <Badge variant="success">En cours</Badge>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Type:</span>
                      <span className="font-medium">{service.typeRepas}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Démarré:</span>
                      <span className="font-medium">
                        {new Date(service.heureDebut).toLocaleTimeString('fr-FR', {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Servis:</span>
                      <span className="font-medium">{service.nombreServis || 0}</span>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full mt-3"
                    leftIcon={<EyeIcon className="h-4 w-4" />}
                  >
                    Voir Détails
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <ClockIcon className="h-12 w-12 mx-auto mb-3 text-gray-400" />
              <p>Aucun service en cours actuellement</p>
            </div>
          )}
        </Card.Content>
      </Card>

      {/* Alertes Denrées */}
      {(alertesCritiques?.length > 0 || alertesAvertissement?.length > 0 || denreesPerimerSoon?.length > 0) && (
        <Card>
          <Card.Header>
            <Card.Title className="flex items-center gap-2 text-red-600">
              <ExclamationTriangleIcon className="h-5 w-5" />
              Alertes Denrées ({(alertesCritiques?.length || 0) + (alertesAvertissement?.length || 0) + (denreesPerimerSoon?.length || 0)})
            </Card.Title>
          </Card.Header>
          <Card.Content>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Alertes Critiques */}
              {alertesCritiques && alertesCritiques.length > 0 && (
                <div>
                  <h4 className="font-semibold text-red-700 mb-3">Critiques ({alertesCritiques.length})</h4>
                  <div className="space-y-2">
                    {alertesCritiques.slice(0, 3).map((alerte: any) => (
                      <div key={alerte.id} className="bg-red-50 border border-red-200 rounded p-3">
                        <p className="font-medium text-sm">{alerte.nomDenree}</p>
                        <p className="text-xs text-red-600 mt-1">
                          Stock: {alerte.quantiteRestante} {alerte.unite}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Avertissements */}
              {alertesAvertissement && alertesAvertissement.length > 0 && (
                <div>
                  <h4 className="font-semibold text-yellow-700 mb-3">Avertissements ({alertesAvertissement.length})</h4>
                  <div className="space-y-2">
                    {alertesAvertissement.slice(0, 3).map((alerte: any) => (
                      <div key={alerte.id} className="bg-yellow-50 border border-yellow-200 rounded p-3">
                        <p className="font-medium text-sm">{alerte.nomDenree}</p>
                        <p className="text-xs text-yellow-600 mt-1">
                          Stock: {alerte.quantiteRestante} {alerte.unite}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Péremption Proche */}
              {denreesPerimerSoon && denreesPerimerSoon.length > 0 && (
                <div>
                  <h4 className="font-semibold text-orange-700 mb-3">Péremption proche ({denreesPerimerSoon.length})</h4>
                  <div className="space-y-2">
                    {denreesPerimerSoon.slice(0, 3).map((denree: any) => (
                      <div key={denree.id} className="bg-orange-50 border border-orange-200 rounded p-3">
                        <p className="font-medium text-sm">{denree.nomDenree}</p>
                        <p className="text-xs text-orange-600 mt-1">
                          Expire: {new Date(denree.datePeremption).toLocaleDateString()}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </Card.Content>
        </Card>
      )}

      {/* Graphiques */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Fréquentation 7 derniers jours */}
        <Card>
          <Card.Header>
            <Card.Title>Fréquentation - 7 derniers jours</Card.Title>
          </Card.Header>
          <Card.Content>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={statistics?.frequentation7Jours || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="rationnaires" fill="#3b82f6" name="Rationnaires" />
              </BarChart>
            </ResponsiveContainer>
          </Card.Content>
        </Card>

        {/* Recettes 7 derniers jours */}
        <Card>
          <Card.Header>
            <Card.Title>Recettes - 7 derniers jours</Card.Title>
          </Card.Header>
          <Card.Content>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={statistics?.recettes7Jours || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="recettes" stroke="#10b981" name="Recettes (XOF)" />
              </LineChart>
            </ResponsiveContainer>
          </Card.Content>
        </Card>
      </div>

      {/* Actions Rapides */}
      <Card>
        <Card.Header>
          <Card.Title>Actions Rapides</Card.Title>
        </Card.Header>
        <Card.Content>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Button
              variant="outline"
              className="h-20"
              leftIcon={<DocumentTextIcon className="h-5 w-5" />}
            >
              Créer Menu
            </Button>
            <Button
              variant="outline"
              className="h-20"
              leftIcon={<TicketIcon className="h-5 w-5" />}
            >
              Émettre Tickets
            </Button>
            <Button
              variant="outline"
              className="h-20"
              leftIcon={<CakeIcon className="h-5 w-5" />}
            >
              Démarrer Service
            </Button>
            <Button
              variant="outline"
              className="h-20"
              leftIcon={<CubeIcon className="h-5 w-5" />}
            >
              Allouer Denrées
            </Button>
          </div>
        </Card.Content>
      </Card>
    </div>
  );
};

export default DashboardTab;

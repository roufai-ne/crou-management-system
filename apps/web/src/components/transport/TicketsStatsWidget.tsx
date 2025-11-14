/**
 * FICHIER: apps/web/src/components/transport/TicketsStatsWidget.tsx
 * COMPOSANT: TicketsStatsWidget - Widget de statistiques pour tickets transport
 *
 * DESCRIPTION:
 * Widget réutilisable affichant les statistiques des tickets de transport
 * Utilisable dans le dashboard principal ou la page transport
 *
 * FONCTIONNALITÉS:
 * - Statistiques en temps réel
 * - Graphiques et KPIs
 * - Répartition par circuit
 * - Évolution mensuelle
 * - Export et filtres
 *
 * AUTEUR: Équipe CROU - Module Transport
 * DATE: Janvier 2025
 */

import React, { useEffect } from 'react';
import { Card, Badge, Button, Select } from '@/components/ui';
import {
  TicketIcon,
  CheckCircleIcon,
  XCircleIcon,
  BanknotesIcon,
  ChartBarIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon
} from '@heroicons/react/24/outline';
import { useTransportTicketStatistics } from '@/hooks/useTransportTickets';
import { CategorieTicketTransport } from '@/services/api/transportTicketService';

interface TicketsStatsWidgetProps {
  annee?: number;
  mois?: number;
  compact?: boolean;
  showCharts?: boolean;
  className?: string;
}

export const TicketsStatsWidget: React.FC<TicketsStatsWidgetProps> = ({
  annee = new Date().getFullYear(),
  mois,
  compact = false,
  showCharts = true,
  className = ''
}) => {
  const { statistics, loading, error, refresh } = useTransportTicketStatistics({ annee, mois });

  useEffect(() => {
    // Refresh toutes les 30 secondes
    const interval = setInterval(refresh, 30000);
    return () => clearInterval(interval);
  }, [refresh]);

  if (loading && !statistics) {
    return (
      <Card className={className}>
        <Card.Content className="p-6">
          <div className="text-center text-gray-500 dark:text-gray-400">Chargement des statistiques...</div>
        </Card.Content>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={className}>
        <Card.Content className="p-6">
          <div className="text-center text-red-600">Erreur: {error}</div>
        </Card.Content>
      </Card>
    );
  }

  if (!statistics) return null;

  const tauxUtilisation = statistics.totalEmis > 0
    ? ((statistics.totalUtilises / statistics.totalEmis) * 100).toFixed(1)
    : 0;

  const tauxActivite = statistics.totalEmis > 0
    ? ((statistics.totalActifs / statistics.totalEmis) * 100).toFixed(1)
    : 0;

  if (compact) {
    return (
      <Card className={className}>
        <Card.Header>
          <Card.Title className="flex items-center gap-2">
            <TicketIcon className="h-5 w-5" />
            Tickets Transport
          </Card.Title>
        </Card.Header>
        <Card.Content>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center">
              <p className="text-3xl font-bold text-green-600">{statistics.totalActifs}</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Actifs</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-blue-600">{statistics.totalUtilises}</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Utilisés</p>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">Recettes:</span>
              <span className="font-bold">{statistics.recettesTotales.toLocaleString()} XOF</span>
            </div>
          </div>
        </Card.Content>
      </Card>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* KPIs Principaux */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <Card.Content className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Émis</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{statistics.totalEmis}</p>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="info" size="sm">
                    {statistics.totalPayants} payants
                  </Badge>
                  <Badge variant="secondary" size="sm">
                    {statistics.totalGratuits} gratuits
                  </Badge>
                </div>
              </div>
              <TicketIcon className="h-8 w-8 text-blue-600" />
            </div>
          </Card.Content>
        </Card>

        <Card>
          <Card.Content className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Tickets Actifs</p>
                <p className="text-2xl font-bold text-green-600">{statistics.totalActifs}</p>
                <p className="text-xs text-gray-500 mt-1">{tauxActivite}% du total</p>
              </div>
              <CheckCircleIcon className="h-8 w-8 text-green-600" />
            </div>
          </Card.Content>
        </Card>

        <Card>
          <Card.Content className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Utilisés</p>
                <p className="text-2xl font-bold text-blue-600">{statistics.totalUtilises}</p>
                <p className="text-xs text-gray-500 mt-1">{tauxUtilisation}% du total</p>
              </div>
              <ArrowTrendingUpIcon className="h-8 w-8 text-blue-600" />
            </div>
          </Card.Content>
        </Card>

        <Card>
          <Card.Content className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Recettes</p>
                <p className="text-2xl font-bold text-purple-600">
                  {statistics.recettesTotales.toLocaleString()}
                </p>
                <p className="text-xs text-gray-500 mt-1">XOF</p>
              </div>
              <BanknotesIcon className="h-8 w-8 text-purple-600" />
            </div>
          </Card.Content>
        </Card>
      </div>

      {/* KPIs Secondaires */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <Card.Content className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Expirés</p>
                <p className="text-xl font-bold text-yellow-600">{statistics.totalExpires}</p>
              </div>
              <XCircleIcon className="h-6 w-6 text-yellow-600" />
            </div>
          </Card.Content>
        </Card>

        <Card>
          <Card.Content className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Annulés</p>
                <p className="text-xl font-bold text-red-600">{statistics.totalAnnules}</p>
              </div>
              <XCircleIcon className="h-6 w-6 text-red-600" />
            </div>
          </Card.Content>
        </Card>

        <Card>
          <Card.Content className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Taux d'utilisation</p>
                <p className="text-xl font-bold text-indigo-600">{tauxUtilisation}%</p>
              </div>
              <ChartBarIcon className="h-6 w-6 text-indigo-600" />
            </div>
          </Card.Content>
        </Card>
      </div>

      {showCharts && (
        <>
          {/* Répartition par circuit */}
          {statistics.ticketsParCircuit && statistics.ticketsParCircuit.length > 0 && (
            <Card>
              <Card.Header>
                <Card.Title className="flex items-center gap-2">
                  <ChartBarIcon className="h-5 w-5" />
                  Répartition par Circuit
                </Card.Title>
              </Card.Header>
              <Card.Content>
                <div className="space-y-3">
                  {statistics.ticketsParCircuit.slice(0, 5).map((item, index) => {
                    const percentage = statistics.totalEmis > 0
                      ? ((item.count / statistics.totalEmis) * 100).toFixed(1)
                      : 0;

                    return (
                      <div key={item.circuitId} className="space-y-1">
                        <div className="flex items-center justify-between text-sm">
                          <span className="font-medium text-gray-700 dark:text-gray-300">{item.circuitNom}</span>
                          <span className="text-gray-600 dark:text-gray-400">
                            {item.count} tickets ({percentage}%)
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Card.Content>
            </Card>
          )}

          {/* Évolution mensuelle */}
          {statistics.evolutionMensuelle && statistics.evolutionMensuelle.length > 0 && (
            <Card>
              <Card.Header>
                <Card.Title className="flex items-center gap-2">
                  <ArrowTrendingUpIcon className="h-5 w-5" />
                  Évolution Mensuelle
                </Card.Title>
              </Card.Header>
              <Card.Content>
                <div className="space-y-3">
                  {statistics.evolutionMensuelle.slice(-6).map((item, index) => {
                    const tauxMois = item.emis > 0
                      ? ((item.utilises / item.emis) * 100).toFixed(0)
                      : 0;

                    return (
                      <div key={item.mois} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-gray-700 dark:text-gray-300">{item.mois}</span>
                          <div className="flex items-center gap-4 text-sm">
                            <span className="text-blue-600">
                              {item.emis} émis
                            </span>
                            <span className="text-green-600">
                              {item.utilises} utilisés
                            </span>
                            <Badge variant={Number(tauxMois) >= 70 ? 'success' : 'warning'}>
                              {tauxMois}%
                            </Badge>
                          </div>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-green-600 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${tauxMois}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Card.Content>
            </Card>
          )}
        </>
      )}

      {/* Légende */}
      <Card>
        <Card.Content className="p-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-green-600"></div>
              <span className="text-gray-700 dark:text-gray-300">Actif</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-blue-600"></div>
              <span className="text-gray-700 dark:text-gray-300">Utilisé</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-yellow-600"></div>
              <span className="text-gray-700 dark:text-gray-300">Expiré</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-600"></div>
              <span className="text-gray-700 dark:text-gray-300">Annulé</span>
            </div>
          </div>
        </Card.Content>
      </Card>
    </div>
  );
};

export default TicketsStatsWidget;

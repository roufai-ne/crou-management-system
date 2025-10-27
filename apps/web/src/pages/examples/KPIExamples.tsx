/**
 * FICHIER: apps\web\src\pages\examples\KPIExamples.tsx
 * PAGE: Exemples d'utilisation du composant KPICard
 * 
 * DESCRIPTION:
 * Page de démonstration du composant KPICard avec cas d'usage CROU
 * Exemples pratiques de tableaux de bord et indicateurs de performance
 * Intégration avec données temps réel et comparaisons
 * 
 * SECTIONS:
 * - Tableau de bord principal avec KPI essentiels
 * - Indicateurs financiers avec tendances
 * - Métriques opérationnelles et satisfaction
 * - Comparaisons temporelles et objectifs
 * - KPI par centre CROU
 * - Alertes et seuils de performance
 * 
 * AUTEUR: Équipe CROU
 * DATE: Décembre 2024
 */

import React, { useState, useEffect } from 'react';
import { 
  CurrencyEuroIcon,
  UserIcon,
  HomeIcon,
  ChartBarIcon,
  TrendingUpIcon,
  StarIcon,
  ClockIcon,
  ShoppingCartIcon,
  AcademicCapIcon,
  BuildingOfficeIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ArrowPathIcon,
  CalendarIcon
} from '@heroicons/react/24/outline';
import { KPICard, KPIGrid, KPIComparison } from '@/components/ui/KPICard';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { cn } from '@/utils/cn';
import type { KPITrend, KPITarget } from '@/components/ui/KPICard';

// Types pour les données
interface CROUCenter {
  id: string;
  name: string;
  city: string;
  students: number;
  revenue: number;
  satisfaction: number;
  occupancy: number;
}

interface KPIData {
  revenue: {
    current: number;
    target: number;
    trend: KPITrend;
    history: Array<{ period: string; value: number; trend?: KPITrend }>;
  };
  students: {
    current: number;
    trend: KPITrend;
    newRegistrations: number;
    retention: number;
  };
  satisfaction: {
    current: number;
    target: number;
    trend: KPITrend;
    responses: number;
    averageRating: number;
  };
  operations: {
    occupancy: number;
    occupancyTarget: number;
    mealsServed: number;
    efficiency: number;
    waitTime: number;
  };
}

const KPIExamples: React.FC = () => {
  // États pour la gestion des données
  const [selectedPeriod, setSelectedPeriod] = useState('month');
  const [selectedCenter, setSelectedCenter] = useState('all');
  const [isLoading, setIsLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(new Date());
  
  // Données simulées des centres CROU
  const crouCenters: CROUCenter[] = [
    {
      id: 'paris',
      name: 'CROU de Paris',
      city: 'Paris',
      students: 4250,
      revenue: 385000,
      satisfaction: 88.5,
      occupancy: 82.3
    },
    {
      id: 'lyon',
      name: 'CROU de Lyon',
      city: 'Lyon',
      students: 2840,
      revenue: 245000,
      satisfaction: 91.2,
      occupancy: 78.9
    },
    {
      id: 'marseille',
      name: 'CROU de Marseille',
      city: 'Marseille',
      students: 2150,
      revenue: 198000,
      satisfaction: 85.7,
      occupancy: 75.4
    },
    {
      id: 'toulouse',
      name: 'CROU de Toulouse',
      city: 'Toulouse',
      students: 1980,
      revenue: 175000,
      satisfaction: 89.3,
      occupancy: 81.2
    },
    {
      id: 'bordeaux',
      name: 'CROU de Bordeaux',
      city: 'Bordeaux',
      students: 1650,
      revenue: 142000,
      satisfaction: 87.8,
      occupancy: 79.6
    }
  ];
  
  // Données KPI simulées
  const [kpiData, setKpiData] = useState<KPIData>({
    revenue: {
      current: 1250000,
      target: 1400000,
      trend: { direction: 'up', value: 12.5, period: 'vs mois dernier', valueType: 'percentage' },
      history: [
        { period: 'Décembre 2024', value: 1250000, trend: { direction: 'up', value: 12.5, valueType: 'percentage' } },
        { period: 'Novembre 2024', value: 1110000, trend: { direction: 'down', value: 5.2, valueType: 'percentage' } },
        { period: 'Octobre 2024', value: 1175000, trend: { direction: 'up', value: 8.1, valueType: 'percentage' } },
        { period: 'Septembre 2024', value: 1085000, trend: { direction: 'stable', value: 0.5, valueType: 'percentage' } }
      ]
    },
    students: {
      current: 15420,
      trend: { direction: 'up', value: 8.2, period: 'vs année dernière', valueType: 'percentage' },
      newRegistrations: 1247,
      retention: 94.2
    },
    satisfaction: {
      current: 87.5,
      target: 90,
      trend: { direction: 'up', value: 3.2, period: 'vs trimestre', valueType: 'percentage' },
      responses: 2847,
      averageRating: 4.4
    },
    operations: {
      occupancy: 78.3,
      occupancyTarget: 85,
      mealsServed: 28470,
      efficiency: 92.1,
      waitTime: 4.2
    }
  });
  
  // Options de période
  const periodOptions = [
    { label: 'Ce mois', value: 'month' },
    { label: 'Ce trimestre', value: 'quarter' },
    { label: 'Cette année', value: 'year' }
  ];
  
  // Options de centre
  const centerOptions = [
    { label: 'Tous les centres', value: 'all' },
    ...crouCenters.map(center => ({
      label: center.name,
      value: center.id
    }))
  ];
  
  // Simulation de mise à jour des données
  const refreshData = async () => {
    setIsLoading(true);
    
    // Simuler un appel API
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Générer de nouvelles données aléatoirement
    setKpiData(prev => ({
      ...prev,
      revenue: {
        ...prev.revenue,
        current: prev.revenue.current + Math.floor(Math.random() * 20000 - 10000),
        trend: {
          ...prev.revenue.trend,
          value: Math.random() * 20,
          direction: Math.random() > 0.5 ? 'up' : 'down'
        }
      }
    }));
    
    setLastUpdate(new Date());
    setIsLoading(false);
  };
  
  // KPI principaux
  const mainKPIs = [
    {
      key: 'revenue',
      title: 'Chiffre d\'affaires',
      value: kpiData.revenue.current,
      type: 'currency' as const,
      description: 'Revenus de tous les restaurants',
      trend: kpiData.revenue.trend,
      target: {
        current: kpiData.revenue.current,
        target: kpiData.revenue.target,
        label: 'Objectif mensuel'
      },
      metadata: [
        { label: 'Transactions', value: 28470, type: 'count' as const },
        { label: 'Panier moyen', value: 43.89, type: 'currency' as const }
      ],
      icon: <CurrencyEuroIcon className="h-5 w-5" />,
      variant: kpiData.revenue.current >= kpiData.revenue.target * 0.9 ? 'success' as const : 'warning' as const,
      onClick: () => console.log('Détails revenus')
    },
    {
      key: 'students',
      title: 'Étudiants actifs',
      value: kpiData.students.current,
      type: 'number' as const,
      description: 'Étudiants inscrits et actifs',
      trend: kpiData.students.trend,
      metadata: [
        { label: 'Nouveaux', value: kpiData.students.newRegistrations, type: 'count' as const },
        { label: 'Rétention', value: kpiData.students.retention, type: 'percentage' as const }
      ],
      icon: <AcademicCapIcon className="h-5 w-5" />,
      onClick: () => console.log('Détails étudiants')
    },
    {
      key: 'satisfaction',
      title: 'Satisfaction',
      value: kpiData.satisfaction.current,
      type: 'percentage' as const,
      description: 'Note moyenne de satisfaction',
      trend: kpiData.satisfaction.trend,
      target: {
        current: kpiData.satisfaction.current,
        target: kpiData.satisfaction.target,
        label: 'Objectif qualité'
      },
      metadata: [
        { label: 'Réponses', value: kpiData.satisfaction.responses, type: 'count' as const },
        { label: 'Note /5', value: kpiData.satisfaction.averageRating, type: 'number' as const }
      ],
      icon: <StarIcon className="h-5 w-5" />,
      variant: 'primary' as const,
      onClick: () => console.log('Détails satisfaction')
    },
    {
      key: 'occupancy',
      title: 'Taux d\'occupation',
      value: kpiData.operations.occupancy,
      type: 'percentage' as const,
      description: 'Occupation des résidences',
      trend: { direction: 'down' as const, value: 5.1, period: 'vs mois dernier', valueType: 'percentage' as const },
      target: {
        current: kpiData.operations.occupancy,
        target: kpiData.operations.occupancyTarget,
        label: 'Objectif occupation'
      },
      metadata: [
        { label: 'Chambres occupées', value: 3420, type: 'count' as const },
        { label: 'Liste d\'attente', value: 156, type: 'count' as const }
      ],
      icon: <HomeIcon className="h-5 w-5" />,
      variant: kpiData.operations.occupancy >= kpiData.operations.occupancyTarget * 0.9 ? 'success' as const : 'warning' as const,
      onClick: () => console.log('Détails logement')
    }
  ];
  
  // KPI opérationnels
  const operationalKPIs = [
    {
      key: 'meals',
      title: 'Repas servis',
      value: kpiData.operations.mealsServed,
      type: 'count' as const,
      trend: { direction: 'up' as const, value: 15.3, valueType: 'percentage' as const },
      icon: <ShoppingCartIcon className="h-5 w-5" />
    },
    {
      key: 'efficiency',
      title: 'Efficacité',
      value: kpiData.operations.efficiency,
      type: 'percentage' as const,
      trend: { direction: 'up' as const, value: 3.7, valueType: 'percentage' as const },
      icon: <ChartBarIcon className="h-5 w-5" />
    },
    {
      key: 'waitTime',
      title: 'Temps d\'attente',
      value: kpiData.operations.waitTime,
      renderValue: (value) => `${value} min`,
      trend: { direction: 'down' as const, value: 12.3, valueType: 'percentage' as const, inverse: true },
      variant: 'success' as const,
      icon: <ClockIcon className="h-5 w-5" />
    }
  ];
  
  // Calcul des totaux pour les centres sélectionnés
  const getFilteredCenters = () => {
    return selectedCenter === 'all' ? crouCenters : crouCenters.filter(c => c.id === selectedCenter);
  };
  
  const filteredCenters = getFilteredCenters();
  const totalStudents = filteredCenters.reduce((sum, center) => sum + center.students, 0);
  const totalRevenue = filteredCenters.reduce((sum, center) => sum + center.revenue, 0);
  const avgSatisfaction = filteredCenters.reduce((sum, center) => sum + center.satisfaction, 0) / filteredCenters.length;
  const avgOccupancy = filteredCenters.reduce((sum, center) => sum + center.occupancy, 0) / filteredCenters.length;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* En-tête */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-4">
            Tableau de bord CROU
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
            Indicateurs de performance clés et métriques opérationnelles en temps réel.
          </p>
        </div>

        {/* Barre d'outils */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm mb-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <Select
                value={selectedPeriod}
                onChange={(value) => setSelectedPeriod(value as string)}
                options={periodOptions}
                className="w-40"
              />
              
              <Select
                value={selectedCenter}
                onChange={(value) => setSelectedCenter(value as string)}
                options={centerOptions}
                className="w-48"
              />
            </div>
            
            <div className="flex items-center gap-4">
              <div className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-2">
                <CalendarIcon className="h-4 w-4" />
                Mis à jour: {lastUpdate.toLocaleTimeString('fr-FR')}
              </div>
              
              <Button
                variant="outline"
                size="sm"
                onClick={refreshData}
                disabled={isLoading}
              >
                <ArrowPathIcon className={cn('h-4 w-4 mr-2', isLoading && 'animate-spin')} />
                Actualiser
              </Button>
            </div>
          </div>
        </div>

        <div className="space-y-8">
          {/* KPI principaux */}
          <section>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
                Indicateurs principaux
              </h2>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                {selectedCenter === 'all' ? 'Tous les centres' : crouCenters.find(c => c.id === selectedCenter)?.name}
              </div>
            </div>
            
            <KPIGrid 
              kpis={mainKPIs.map(kpi => ({ ...kpi, loading: isLoading }))} 
              columns={2} 
              gap="lg" 
            />
          </section>

          {/* Métriques opérationnelles */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-6">
              Métriques opérationnelles
            </h2>
            
            <KPIGrid 
              kpis={operationalKPIs.map(kpi => ({ ...kpi, loading: isLoading }))} 
              columns={3} 
              gap="md" 
            />
          </section>

          {/* Comparaisons et tendances */}
          <section className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <KPIComparison
              title="Évolution du chiffre d'affaires"
              data={kpiData.revenue.history}
              type="currency"
              primaryPeriod="Décembre 2024"
            />
            
            <div className="space-y-6">
              <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
                  <ExclamationTriangleIcon className="h-5 w-5 text-warning-600" />
                  Alertes et seuils
                </h3>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-warning-50 dark:bg-warning-900/20 rounded-lg border border-warning-200 dark:border-warning-800">
                    <div>
                      <div className="font-medium text-warning-800 dark:text-warning-200">
                        Taux d'occupation faible
                      </div>
                      <div className="text-sm text-warning-600 dark:text-warning-400">
                        78.3% - En dessous de l'objectif (85%)
                      </div>
                    </div>
                    <ExclamationTriangleIcon className="h-5 w-5 text-warning-600" />
                  </div>
                  
                  <div className="flex items-center justify-between p-3 bg-success-50 dark:bg-success-900/20 rounded-lg border border-success-200 dark:border-success-800">
                    <div>
                      <div className="font-medium text-success-800 dark:text-success-200">
                        Satisfaction élevée
                      </div>
                      <div className="text-sm text-success-600 dark:text-success-400">
                        87.5% - Proche de l'objectif (90%)
                      </div>
                    </div>
                    <CheckCircleIcon className="h-5 w-5 text-success-600" />
                  </div>
                </div>
              </div>
              
              <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                  Résumé par centre
                </h3>
                
                <div className="space-y-3">
                  {filteredCenters.map((center) => (
                    <div key={center.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <div>
                        <div className="font-medium text-gray-900 dark:text-gray-100">
                          {center.city}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          {center.students.toLocaleString('fr-FR')} étudiants
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium text-gray-900 dark:text-gray-100">
                          {(center.revenue / 1000).toFixed(0)}k FCFA
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          {center.satisfaction}% satisfaction
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* Vue d'ensemble par centre */}
          {selectedCenter === 'all' && (
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-6">
                Performance par centre CROU
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {crouCenters.map((center) => (
                  <div key={center.id} className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                        {center.city}
                      </h3>
                      <BuildingOfficeIcon className="h-5 w-5 text-primary-600" />
                    </div>
                    
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600 dark:text-gray-400">Étudiants</span>
                        <span className="font-medium">{center.students.toLocaleString('fr-FR')}</span>
                      </div>
                      
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600 dark:text-gray-400">Revenus</span>
                        <span className="font-medium">{(center.revenue / 1000).toFixed(0)}k FCFA</span>
                      </div>
                      
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600 dark:text-gray-400">Satisfaction</span>
                        <span className={cn(
                          'font-medium',
                          center.satisfaction >= 90 ? 'text-success-600' :
                          center.satisfaction >= 85 ? 'text-warning-600' : 'text-danger-600'
                        )}>
                          {center.satisfaction}%
                        </span>
                      </div>
                      
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600 dark:text-gray-400">Occupation</span>
                        <span className={cn(
                          'font-medium',
                          center.occupancy >= 85 ? 'text-success-600' :
                          center.occupancy >= 75 ? 'text-warning-600' : 'text-danger-600'
                        )}>
                          {center.occupancy}%
                        </span>
                      </div>
                    </div>
                    
                    <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                      <Button
                        size="sm"
                        variant="outline"
                        className="w-full"
                        onClick={() => setSelectedCenter(center.id)}
                      >
                        Voir les détails
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
};

export default KPIExamples;

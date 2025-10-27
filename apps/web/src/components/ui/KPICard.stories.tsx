/**
 * FICHIER: apps\web\src\components\ui\KPICard.stories.tsx
 * STORYBOOK: Stories pour le composant KPICard
 * 
 * DESCRIPTION:
 * Documentation interactive du composant KPICard avec exemples d'utilisation
 * Démontre les indicateurs de tendance, objectifs et formatage
 * Cas d'usage spécifiques au contexte CROU
 * 
 * STORIES:
 * - KPI de base avec différents types de données
 * - KPI avec indicateurs de tendance
 * - KPI avec objectifs et progression
 * - Grilles de KPI pour tableaux de bord
 * - Comparaisons de périodes
 * - Exemples CROU (revenus, étudiants, satisfaction)
 * 
 * AUTEUR: Équipe CROU
 * DATE: Décembre 2024
 */

import type { Meta, StoryObj } from '@storybook/react';
import React, { useState } from 'react';
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
  BuildingOfficeIcon
} from '@heroicons/react/24/outline';
import { KPICard, KPIGrid, KPIComparison } from './KPICard';
import type { KPITrend, KPITarget } from './KPICard';

// Configuration Meta
const meta: Meta<typeof KPICard> = {
  title: 'Components/Data Display/KPICard',
  component: KPICard,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Composant carte KPI pour afficher les indicateurs de performance avec tendances et objectifs.'
      }
    }
  },
  argTypes: {
    type: {
      control: 'select',
      options: ['currency', 'number', 'percentage', 'count', 'custom'],
      description: 'Type de données pour le formatage'
    },
    variant: {
      control: 'select',
      options: ['default', 'primary', 'success', 'warning', 'danger'],
      description: 'Variante de couleur'
    },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
      description: 'Taille de la carte'
    },
    loading: {
      control: 'boolean',
      description: 'État de chargement'
    },
    clickable: {
      control: 'boolean',
      description: 'Carte cliquable'
    }
  }
};

export default meta;
type Story = StoryObj<typeof KPICard>;

// Stories de base
export const DefaultKPI: Story = {
  args: {
    title: 'Chiffre d\'affaires',
    value: 125000,
    type: 'currency',
    description: 'Revenus mensuels des restaurants'
  }
};

export const KPITypes: Story = {
  render: () => (
    <div className="grid grid-cols-2 gap-6 max-w-4xl">
      <KPICard
        title="Budget total"
        value={1250000}
        type="currency"
        description="Budget annuel alloué"
        icon={<CurrencyEuroIcon className="h-5 w-5" />}
      />
      
      <KPICard
        title="Étudiants inscrits"
        value={15420}
        type="number"
        description="Nombre total d'étudiants"
        icon={<UserIcon className="h-5 w-5" />}
      />
      
      <KPICard
        title="Taux de satisfaction"
        value={87.5}
        type="percentage"
        description="Satisfaction des étudiants"
        icon={<StarIcon className="h-5 w-5" />}
      />
      
      <KPICard
        title="Repas servis"
        value={2847}
        type="count"
        description="Repas du jour"
        icon={<ShoppingCartIcon className="h-5 w-5" />}
      />
    </div>
  )
};

export const KPIWithTrends: Story = {
  render: () => {
    const upTrend: KPITrend = {
      direction: 'up',
      value: 12.5,
      period: 'vs mois dernier',
      valueType: 'percentage'
    };
    
    const downTrend: KPITrend = {
      direction: 'down',
      value: 8.2,
      period: 'vs année dernière',
      valueType: 'percentage'
    };
    
    const stableTrend: KPITrend = {
      direction: 'stable',
      value: 0.1,
      period: 'vs trimestre',
      valueType: 'percentage'
    };
    
    const inverseTrend: KPITrend = {
      direction: 'down',
      value: 15.3,
      period: 'vs mois dernier',
      valueType: 'percentage',
      inverse: true // Baisse = positif pour les coûts
    };
    
    return (
      <div className="grid grid-cols-2 gap-6 max-w-4xl">
        <KPICard
          title="Revenus"
          value={125000}
          type="currency"
          trend={upTrend}
          variant="success"
          icon={<TrendingUpIcon className="h-5 w-5" />}
        />
        
        <KPICard
          title="Fréquentation"
          value={8420}
          type="number"
          trend={downTrend}
          variant="warning"
          icon={<UserIcon className="h-5 w-5" />}
        />
        
        <KPICard
          title="Satisfaction"
          value={85.2}
          type="percentage"
          trend={stableTrend}
          icon={<StarIcon className="h-5 w-5" />}
        />
        
        <KPICard
          title="Coûts opérationnels"
          value={45000}
          type="currency"
          trend={inverseTrend}
          variant="success"
          icon={<ChartBarIcon className="h-5 w-5" />}
        />
      </div>
    );
  }
};

export const KPIWithTargets: Story = {
  render: () => {
    const target1: KPITarget = {
      current: 85000,
      target: 100000,
      label: 'Objectif mensuel'
    };
    
    const target2: KPITarget = {
      current: 1250,
      target: 1000,
      label: 'Objectif dépassé'
    };
    
    const target3: KPITarget = {
      current: 45,
      target: 100,
      label: 'En cours'
    };
    
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl">
        <KPICard
          title="Revenus Q4"
          value={85000}
          type="currency"
          target={target1}
          trend={{
            direction: 'up',
            value: 8.5,
            period: 'vs Q3',
            valueType: 'percentage'
          }}
          icon={<CurrencyEuroIcon className="h-5 w-5" />}
        />
        
        <KPICard
          title="Nouveaux étudiants"
          value={1250}
          type="count"
          target={target2}
          variant="success"
          trend={{
            direction: 'up',
            value: 25,
            period: 'vs objectif',
            valueType: 'percentage'
          }}
          icon={<AcademicCapIcon className="h-5 w-5" />}
        />
        
        <KPICard
          title="Taux d'occupation"
          value={45}
          type="percentage"
          target={target3}
          variant="warning"
          trend={{
            direction: 'down',
            value: 12,
            period: 'vs mois dernier',
            valueType: 'percentage'
          }}
          icon={<HomeIcon className="h-5 w-5" />}
        />
      </div>
    );
  }
};

export const KPIWithMetadata: Story = {
  args: {
    title: 'Performance restaurant',
    value: 125000,
    type: 'currency',
    description: 'Chiffre d\'affaires mensuel',
    trend: {
      direction: 'up',
      value: 15.2,
      period: 'vs mois dernier',
      valueType: 'percentage'
    },
    target: {
      current: 125000,
      target: 150000,
      label: 'Objectif mensuel'
    },
    metadata: [
      { label: 'Transactions', value: 2847, type: 'count' },
      { label: 'Panier moyen', value: 43.89, type: 'currency' },
      { label: 'Taux de retour', value: 12.5, type: 'percentage' },
      { label: 'Nouveaux clients', value: 156, type: 'count' }
    ],
    icon: <ChartBarIcon className="h-5 w-5" />
  }
};

export const KPISizes: Story = {
  render: () => (
    <div className="flex items-start gap-6">
      <KPICard
        title="Petit KPI"
        value={1250}
        type="count"
        size="sm"
        trend={{
          direction: 'up',
          value: 5.2,
          valueType: 'percentage'
        }}
      />
      
      <KPICard
        title="KPI moyen"
        value={125000}
        type="currency"
        size="md"
        trend={{
          direction: 'up',
          value: 12.5,
          period: 'vs mois dernier',
          valueType: 'percentage'
        }}
        target={{
          current: 125000,
          target: 150000
        }}
      />
      
      <KPICard
        title="Grand KPI"
        value={87.5}
        type="percentage"
        size="lg"
        description="Satisfaction globale des étudiants"
        trend={{
          direction: 'up',
          value: 3.2,
          period: 'vs trimestre',
          valueType: 'percentage'
        }}
        metadata={[
          { label: 'Réponses', value: 1247 },
          { label: 'Note moyenne', value: 4.2 }
        ]}
        icon={<StarIcon className="h-5 w-5" />}
      />
    </div>
  )
};

export const KPIStates: Story = {
  render: () => (
    <div className="grid grid-cols-2 gap-6 max-w-4xl">
      <KPICard
        title="KPI en chargement"
        value={0}
        type="currency"
        loading
        description="Données en cours de récupération"
      />
      
      <KPICard
        title="KPI avec erreur"
        value={0}
        type="currency"
        error="Impossible de charger les données"
        description="Erreur de connexion"
      />
      
      <KPICard
        title="KPI cliquable"
        value={125000}
        type="currency"
        description="Cliquez pour plus de détails"
        onClick={() => alert('KPI cliqué!')}
        trend={{
          direction: 'up',
          value: 8.5,
          valueType: 'percentage'
        }}
        icon={<ChartBarIcon className="h-5 w-5" />}
      />
      
      <KPICard
        title="KPI personnalisé"
        value="Excellent"
        renderValue={(value) => (
          <div className="flex items-center gap-2">
            <StarIcon className="h-6 w-6 text-yellow-500" />
            <span className="text-2xl font-bold text-yellow-600">{value}</span>
          </div>
        )}
        description="Évaluation qualitative"
      />
    </div>
  )
};

export const InteractiveKPI: Story = {
  render: () => {
    const [selectedPeriod, setSelectedPeriod] = useState('month');
    
    const data = {
      month: { value: 125000, trend: { direction: 'up' as const, value: 12.5 } },
      quarter: { value: 350000, trend: { direction: 'up' as const, value: 8.2 } },
      year: { value: 1200000, trend: { direction: 'down' as const, value: 3.1 } }
    };
    
    const periods = [
      { key: 'month', label: 'Ce mois' },
      { key: 'quarter', label: 'Ce trimestre' },
      { key: 'year', label: 'Cette année' }
    ];
    
    const currentData = data[selectedPeriod as keyof typeof data];
    
    return (
      <div className="space-y-6 max-w-md">
        <div className="flex gap-2">
          {periods.map((period) => (
            <button
              key={period.key}
              onClick={() => setSelectedPeriod(period.key)}
              className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                selectedPeriod === period.key
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              {period.label}
            </button>
          ))}
        </div>
        
        <KPICard
          title="Chiffre d'affaires"
          value={currentData.value}
          type="currency"
          description={`Revenus pour ${periods.find(p => p.key === selectedPeriod)?.label.toLowerCase()}`}
          trend={{
            ...currentData.trend,
            period: 'vs période précédente',
            valueType: 'percentage'
          }}
          target={{
            current: currentData.value,
            target: currentData.value * 1.2,
            label: 'Objectif'
          }}
          icon={<CurrencyEuroIcon className="h-5 w-5" />}
        />
      </div>
    );
  }
};

// Stories pour KPIGrid
export const KPIGridExample: Story = {
  render: () => {
    const kpis = [
      {
        key: 'revenue',
        title: 'Chiffre d\'affaires',
        value: 1250000,
        type: 'currency' as const,
        trend: { direction: 'up' as const, value: 12.5, valueType: 'percentage' as const },
        icon: <CurrencyEuroIcon className="h-5 w-5" />
      },
      {
        key: 'students',
        title: 'Étudiants actifs',
        value: 15420,
        type: 'number' as const,
        trend: { direction: 'up' as const, value: 8.2, valueType: 'percentage' as const },
        icon: <UserIcon className="h-5 w-5" />
      },
      {
        key: 'satisfaction',
        title: 'Satisfaction',
        value: 87.5,
        type: 'percentage' as const,
        trend: { direction: 'stable' as const, value: 0.1, valueType: 'percentage' as const },
        icon: <StarIcon className="h-5 w-5" />
      },
      {
        key: 'occupancy',
        title: 'Taux d\'occupation',
        value: 78.3,
        type: 'percentage' as const,
        trend: { direction: 'down' as const, value: 5.1, valueType: 'percentage' as const },
        target: { current: 78.3, target: 85, label: 'Objectif' },
        icon: <HomeIcon className="h-5 w-5" />
      },
      {
        key: 'meals',
        title: 'Repas servis',
        value: 28470,
        type: 'count' as const,
        trend: { direction: 'up' as const, value: 15.3, valueType: 'percentage' as const },
        icon: <ShoppingCartIcon className="h-5 w-5" />
      },
      {
        key: 'efficiency',
        title: 'Efficacité opérationnelle',
        value: 92.1,
        type: 'percentage' as const,
        trend: { direction: 'up' as const, value: 3.7, valueType: 'percentage' as const },
        icon: <ChartBarIcon className="h-5 w-5" />
      }
    ];
    
    return (
      <div className="space-y-8 max-w-6xl">
        <div>
          <h3 className="text-lg font-semibold mb-4">Tableau de bord CROU</h3>
          <KPIGrid kpis={kpis} columns={3} gap="md" />
        </div>
        
        <div>
          <h3 className="text-lg font-semibold mb-4">Vue compacte (2 colonnes)</h3>
          <KPIGrid kpis={kpis.slice(0, 4)} columns={2} gap="sm" />
        </div>
      </div>
    );
  }
};

// Stories pour KPIComparison
export const KPIComparisonExample: Story = {
  render: () => {
    const revenueData = [
      {
        period: 'Décembre 2024',
        value: 125000,
        trend: { direction: 'up' as const, value: 12.5, valueType: 'percentage' as const }
      },
      {
        period: 'Novembre 2024',
        value: 110000,
        trend: { direction: 'down' as const, value: 5.2, valueType: 'percentage' as const }
      },
      {
        period: 'Octobre 2024',
        value: 115000,
        trend: { direction: 'up' as const, value: 8.1, valueType: 'percentage' as const }
      },
      {
        period: 'Septembre 2024',
        value: 105000,
        trend: { direction: 'stable' as const, value: 0.5, valueType: 'percentage' as const }
      }
    ];
    
    const studentData = [
      {
        period: 'Q4 2024',
        value: 15420,
        trend: { direction: 'up' as const, value: 3.2, valueType: 'percentage' as const }
      },
      {
        period: 'Q3 2024',
        value: 14950,
        trend: { direction: 'up' as const, value: 5.8, valueType: 'percentage' as const }
      },
      {
        period: 'Q2 2024',
        value: 14120,
        trend: { direction: 'down' as const, value: 2.1, valueType: 'percentage' as const }
      },
      {
        period: 'Q1 2024',
        value: 14420,
        trend: { direction: 'up' as const, value: 1.8, valueType: 'percentage' as const }
      }
    ];
    
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-6xl">
        <KPIComparison
          title="Évolution du chiffre d'affaires"
          data={revenueData}
          type="currency"
          primaryPeriod="Décembre 2024"
        />
        
        <KPIComparison
          title="Évolution des inscriptions"
          data={studentData}
          type="number"
          primaryPeriod="Q4 2024"
        />
      </div>
    );
  }
};

// Exemple complet CROU
export const CROUDashboard: Story = {
  render: () => {
    const mainKPIs = [
      {
        key: 'revenue',
        title: 'Chiffre d\'affaires mensuel',
        value: 1250000,
        type: 'currency' as const,
        description: 'Revenus de tous les restaurants',
        trend: { 
          direction: 'up' as const, 
          value: 12.5, 
          period: 'vs mois dernier',
          valueType: 'percentage' as const 
        },
        target: {
          current: 1250000,
          target: 1400000,
          label: 'Objectif mensuel'
        },
        metadata: [
          { label: 'Transactions', value: 28470, type: 'count' as const },
          { label: 'Panier moyen', value: 43.89, type: 'currency' as const }
        ],
        icon: <CurrencyEuroIcon className="h-5 w-5" />,
        variant: 'success' as const,
        onClick: () => console.log('Détails revenus')
      },
      {
        key: 'students',
        title: 'Étudiants actifs',
        value: 15420,
        type: 'number' as const,
        description: 'Étudiants inscrits et actifs',
        trend: { 
          direction: 'up' as const, 
          value: 8.2, 
          period: 'vs année dernière',
          valueType: 'percentage' as const 
        },
        metadata: [
          { label: 'Nouveaux', value: 1247, type: 'count' as const },
          { label: 'Taux de rétention', value: 94.2, type: 'percentage' as const }
        ],
        icon: <AcademicCapIcon className="h-5 w-5" />,
        onClick: () => console.log('Détails étudiants')
      },
      {
        key: 'satisfaction',
        title: 'Satisfaction globale',
        value: 87.5,
        type: 'percentage' as const,
        description: 'Note moyenne de satisfaction',
        trend: { 
          direction: 'up' as const, 
          value: 3.2, 
          period: 'vs trimestre',
          valueType: 'percentage' as const 
        },
        target: {
          current: 87.5,
          target: 90,
          label: 'Objectif qualité'
        },
        metadata: [
          { label: 'Réponses', value: 2847, type: 'count' as const },
          { label: 'Note moyenne', value: 4.4, type: 'number' as const }
        ],
        icon: <StarIcon className="h-5 w-5" />,
        variant: 'primary' as const,
        onClick: () => console.log('Détails satisfaction')
      },
      {
        key: 'occupancy',
        title: 'Taux d\'occupation',
        value: 78.3,
        type: 'percentage' as const,
        description: 'Occupation des résidences',
        trend: { 
          direction: 'down' as const, 
          value: 5.1, 
          period: 'vs mois dernier',
          valueType: 'percentage' as const 
        },
        target: {
          current: 78.3,
          target: 85,
          label: 'Objectif occupation'
        },
        metadata: [
          { label: 'Chambres occupées', value: 3420, type: 'count' as const },
          { label: 'Liste d\'attente', value: 156, type: 'count' as const }
        ],
        icon: <HomeIcon className="h-5 w-5" />,
        variant: 'warning' as const,
        onClick: () => console.log('Détails logement')
      }
    ];
    
    return (
      <div className="space-y-8 max-w-7xl">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            Tableau de bord CROU
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Indicateurs de performance clés - Décembre 2024
          </p>
        </div>
        
        <KPIGrid kpis={mainKPIs} columns={2} gap="lg" />
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <KPIComparison
            title="Évolution trimestrielle"
            data={[
              { period: 'Q4 2024', value: 1250000, trend: { direction: 'up', value: 12.5, valueType: 'percentage' } },
              { period: 'Q3 2024', value: 1100000, trend: { direction: 'up', value: 8.2, valueType: 'percentage' } },
              { period: 'Q2 2024', value: 1020000, trend: { direction: 'down', value: 3.1, valueType: 'percentage' } },
              { period: 'Q1 2024', value: 1050000, trend: { direction: 'stable', value: 0.5, valueType: 'percentage' } }
            ]}
            type="currency"
            primaryPeriod="Q4 2024"
          />
          
          <div className="space-y-4">
            <KPICard
              title="Efficacité opérationnelle"
              value={92.1}
              type="percentage"
              size="sm"
              trend={{ direction: 'up', value: 3.7, valueType: 'percentage' }}
              icon={<ChartBarIcon className="h-4 w-4" />}
            />
            
            <KPICard
              title="Temps d'attente moyen"
              value={4.2}
              renderValue={(value) => `${value} min`}
              size="sm"
              trend={{ direction: 'down', value: 12.3, valueType: 'percentage', inverse: true }}
              variant="success"
              icon={<ClockIcon className="h-4 w-4" />}
            />
            
            <KPICard
              title="CROU actifs"
              value={8}
              type="count"
              size="sm"
              description="Sur 8 centres régionaux"
              icon={<BuildingOfficeIcon className="h-4 w-4" />}
            />
          </div>
        </div>
      </div>
    );
  }
};

// Export des stories
export {
  DefaultKPI,
  KPITypes,
  KPIWithTrends,
  KPIWithTargets,
  KPIWithMetadata,
  KPISizes,
  KPIStates,
  InteractiveKPI,
  KPIGridExample,
  KPIComparisonExample,
  CROUDashboard
};

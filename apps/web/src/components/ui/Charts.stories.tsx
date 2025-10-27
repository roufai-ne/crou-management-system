/**
 * FICHIER: apps\web\src\components\ui\Charts.stories.tsx
 * STORYBOOK: Stories pour les composants Charts
 *
 * DESCRIPTION:
 * Documentation interactive des composants de visualisation
 * Exemples d'utilisation avec données CROU réalistes
 *
 * STORIES:
 * - LineChart: Évolutions temporelles
 * - BarChart: Comparaisons entre CROU
 * - PieChart: Répartitions budgétaires
 * - AreaChart: Tendances cumulatives
 * - GaugeChart: Indicateurs de performance
 * - Exemples d'intégration dashboard
 *
 * AUTEUR: Équipe CROU
 * DATE: Décembre 2024
 */

import type { Meta, StoryObj } from '@storybook/react';
import React from 'react';
import {
  LineChart,
  BarChart,
  PieChart,
  AreaChart,
  GaugeChart,
  CHART_COLORS
} from './Charts';

// Configuration Meta pour LineChart
const lineChartMeta: Meta<typeof LineChart> = {
  title: 'Components/Charts/LineChart',
  component: LineChart,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: 'Graphique linéaire pour l\'évolution temporelle des données CROU.'
      }
    }
  },
  argTypes: {
    format: {
      control: 'select',
      options: ['currency', 'percentage', 'number'],
      description: 'Format des valeurs'
    },
    variant: {
      control: 'select',
      options: ['default', 'card', 'minimal'],
      description: 'Variante visuelle'
    },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg', 'xl'],
      description: 'Taille du graphique'
    },
    showLegend: {
      control: 'boolean',
      description: 'Afficher la légende'
    },
    showGrid: {
      control: 'boolean',
      description: 'Afficher la grille'
    }
  }
};

export default lineChartMeta;

// Données d'exemple pour les stories
const budgetEvolutionData = [
  { mois: 'Jan', prevu: 2000000, realise: 1800000 },
  { mois: 'Fév', prevu: 2000000, realise: 1950000 },
  { mois: 'Mar', prevu: 2200000, realise: 2100000 },
  { mois: 'Avr', prevu: 2200000, realise: 2050000 },
  { mois: 'Mai', prevu: 2400000, realise: 2300000 },
  { mois: 'Jun', prevu: 2400000, realise: 2450000 },
  { mois: 'Jul', prevu: 2600000, realise: 2500000 },
  { mois: 'Aoû', prevu: 2600000, realise: 2580000 },
  { mois: 'Sep', prevu: 2800000, realise: 2700000 },
  { mois: 'Oct', prevu: 2800000, realise: 2750000 },
  { mois: 'Nov', prevu: 3000000, realise: 2900000 },
  { mois: 'Déc', prevu: 3000000, realise: 2950000 }
];

const crouComparisonData = [
  { crou: 'Niamey', etudiants: 1245, budget: 2500000 },
  { crou: 'Dosso', etudiants: 876, budget: 1800000 },
  { crou: 'Tillabéri', etudiants: 654, budget: 1400000 },
  { crou: 'Tahoua', etudiants: 543, budget: 1200000 },
  { crou: 'Zinder', etudiants: 789, budget: 1600000 },
  { crou: 'Maradi', etudiants: 678, budget: 1450000 },
  { crou: 'Agadez', etudiants: 321, budget: 800000 },
  { crou: 'Diffa', etudiants: 234, budget: 650000 }
];

const depensesRepartitionData = [
  { categorie: 'Logement', montant: 8500000 },
  { categorie: 'Restauration', montant: 6200000 },
  { categorie: 'Transport', montant: 2800000 },
  { categorie: 'Maintenance', montant: 1900000 },
  { categorie: 'Administration', montant: 1200000 },
  { categorie: 'Autres', montant: 800000 }
];

const occupationCumuleeData = [
  { mois: 'Jan', niamey: 1100, dosso: 800, total: 1900 },
  { mois: 'Fév', niamey: 1150, dosso: 820, total: 1970 },
  { mois: 'Mar', niamey: 1200, dosso: 850, total: 2050 },
  { mois: 'Avr', niamey: 1245, dosso: 876, total: 2121 },
  { mois: 'Mai', niamey: 1245, dosso: 876, total: 2121 },
  { mois: 'Jun', niamey: 1200, dosso: 850, total: 2050 }
];

type LineStory = StoryObj<typeof LineChart>;

// Stories pour LineChart
export const EvolutionBudgetaire: LineStory = {
  args: {
    data: budgetEvolutionData,
    xField: 'mois',
    yField: 'realise',
    secondaryYField: 'prevu',
    title: 'Évolution Budgétaire 2024',
    description: 'Comparaison budget prévu vs réalisé',
    format: 'currency',
    showLegend: true,
    showGrid: true
  }
};

export const TendanceOccupation: LineStory = {
  args: {
    data: [
      { mois: 'Jan', taux: 78 },
      { mois: 'Fév', taux: 82 },
      { mois: 'Mar', taux: 85 },
      { mois: 'Avr', taux: 89 },
      { mois: 'Mai', taux: 91 },
      { mois: 'Jun', taux: 88 }
    ],
    xField: 'mois',
    yField: 'taux',
    title: 'Taux d\'Occupation des Logements',
    description: 'Évolution mensuelle du taux d\'occupation',
    format: 'percentage',
    colors: CHART_COLORS.success,
    variant: 'card'
  }
};

// Stories pour BarChart
const barChartMeta: Meta<typeof BarChart> = {
  title: 'Components/Charts/BarChart',
  component: BarChart
};

export const ComparaisonCROU: StoryObj<typeof BarChart> = {
  args: {
    data: crouComparisonData,
    xField: 'crou',
    yField: 'etudiants',
    title: 'Nombre d\'Étudiants par CROU',
    description: 'Comparaison des effectifs par centre régional',
    format: 'number',
    colors: CHART_COLORS.crou,
    variant: 'card'
  }
};

export const BudgetsParCROU: StoryObj<typeof BarChart> = {
  args: {
    data: crouComparisonData,
    xField: 'crou',
    yField: 'budget',
    title: 'Budget Alloué par CROU',
    description: 'Répartition budgétaire 2024',
    format: 'currency',
    orientation: 'horizontal',
    colors: CHART_COLORS.primary
  }
};

// Stories pour PieChart
const pieChartMeta: Meta<typeof PieChart> = {
  title: 'Components/Charts/PieChart',
  component: PieChart
};

export const RepartitionDepenses: StoryObj<typeof PieChart> = {
  args: {
    data: depensesRepartitionData,
    nameField: 'categorie',
    valueField: 'montant',
    title: 'Répartition des Dépenses',
    description: 'Ventilation par catégorie de dépenses',
    format: 'currency',
    showPercentage: true,
    colors: CHART_COLORS.crou,
    variant: 'card'
  }
};

export const DonutChart: StoryObj<typeof PieChart> = {
  args: {
    data: [
      { statut: 'Occupé', nombre: 1245 },
      { statut: 'Libre', nombre: 255 },
      { statut: 'Maintenance', nombre: 50 }
    ],
    nameField: 'statut',
    valueField: 'nombre',
    title: 'Statut des Chambres',
    description: 'Répartition par statut d\'occupation',
    format: 'number',
    showPercentage: true,
    innerRadius: 40,
    outerRadius: 80,
    colors: [CHART_COLORS.success[0], CHART_COLORS.neutral[2], CHART_COLORS.warning[0]]
  }
};

// Stories pour AreaChart
const areaChartMeta: Meta<typeof AreaChart> = {
  title: 'Components/Charts/AreaChart',
  component: AreaChart
};

export const OccupationCumulee: StoryObj<typeof AreaChart> = {
  args: {
    data: occupationCumuleeData,
    xField: 'mois',
    yField: 'total',
    title: 'Occupation Cumulée',
    description: 'Évolution de l\'occupation totale',
    format: 'number',
    colors: CHART_COLORS.primary,
    fillOpacity: 0.4
  }
};

// Stories pour GaugeChart
const gaugeChartMeta: Meta<typeof GaugeChart> = {
  title: 'Components/Charts/GaugeChart',
  component: GaugeChart
};

export const PerformanceBudget: StoryObj<typeof GaugeChart> = {
  args: {
    value: 85,
    min: 0,
    max: 100,
    target: 90,
    unit: '%',
    title: 'Performance Budgétaire',
    description: 'Taux d\'exécution du budget',
    format: 'percentage'
  }
};

export const TauxOccupation: StoryObj<typeof GaugeChart> = {
  args: {
    value: 92,
    min: 0,
    max: 100,
    target: 85,
    unit: '%',
    title: 'Taux d\'Occupation',
    description: 'Occupation des logements étudiants',
    segments: [
      { min: 0, max: 60, color: CHART_COLORS.danger[0], label: 'Faible' },
      { min: 60, max: 80, color: CHART_COLORS.warning[0], label: 'Moyen' },
      { min: 80, max: 100, color: CHART_COLORS.success[0], label: 'Bon' }
    ]
  }
};

// Dashboard complet avec plusieurs graphiques
export const DashboardCROU: StoryObj<typeof LineChart> = {
  render: () => (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-6 bg-gray-50 dark:bg-gray-900">
      <div className="lg:col-span-2">
        <LineChart
          data={budgetEvolutionData}
          xField="mois"
          yField="realise"
          secondaryYField="prevu"
          title="Évolution Budgétaire 2024"
          description="Suivi mensuel budget prévu vs réalisé"
          format="currency"
          variant="card"
          size="lg"
        />
      </div>

      <BarChart
        data={crouComparisonData.slice(0, 5)}
        xField="crou"
        yField="etudiants"
        title="Top 5 CROU - Étudiants"
        description="Nombre d'étudiants logés"
        format="number"
        colors={CHART_COLORS.crou}
        variant="card"
      />

      <PieChart
        data={depensesRepartitionData}
        nameField="categorie"
        valueField="montant"
        title="Répartition des Dépenses"
        description="Ventilation par catégorie"
        format="currency"
        showPercentage
        variant="card"
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <GaugeChart
          value={85}
          target={90}
          title="Budget"
          description="Taux d'exécution"
          unit="%"
          variant="card"
          size="sm"
        />

        <GaugeChart
          value={92}
          target={85}
          title="Occupation"
          description="Taux d'occupation"
          unit="%"
          variant="card"
          size="sm"
          segments={[
            { min: 0, max: 60, color: CHART_COLORS.danger[0], label: 'Faible' },
            { min: 60, max: 80, color: CHART_COLORS.warning[0], label: 'Moyen' },
            { min: 80, max: 100, color: CHART_COLORS.success[0], label: 'Bon' }
          ]}
        />
      </div>

      <AreaChart
        data={occupationCumuleeData}
        xField="mois"
        yField="total"
        title="Évolution Occupation"
        description="Tendance sur 6 mois"
        format="number"
        variant="card"
        colors={CHART_COLORS.success}
      />
    </div>
  ),
  parameters: {
    layout: 'fullscreen'
  }
};

// États de chargement et d'erreur
export const ChargementEtErreurs: StoryObj<typeof LineChart> = {
  render: () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6">
      <LineChart
        data={[]}
        xField="mois"
        yField="valeur"
        title="État de Chargement"
        loading={true}
        variant="card"
      />

      <BarChart
        data={[]}
        xField="crou"
        yField="valeur"
        title="État d'Erreur"
        error="Impossible de charger les données"
        variant="card"
      />

      <PieChart
        data={[]}
        nameField="nom"
        valueField="valeur"
        title="Données Vides"
        description="Aucune donnée disponible"
        variant="card"
      />

      <GaugeChart
        value={0}
        title="Gauge Vide"
        loading={true}
        variant="card"
      />
    </div>
  )
};

// Export des stories par composant
export {
  EvolutionBudgetaire,
  TendanceOccupation,
  ComparaisonCROU,
  BudgetsParCROU,
  RepartitionDepenses,
  DonutChart,
  OccupationCumulee,
  PerformanceBudget,
  TauxOccupation,
  DashboardCROU,
  ChargementEtErreurs
};

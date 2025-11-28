# ⚡ Sprint 5 - Quick Start Guide
## Data Visualization & Charts

> Guide de démarrage rapide pour utiliser les composants de visualisation Sprint 5

---

## 🎯 Composants Sprint 5

| Composant | Usage | Fichier |
|-----------|-------|---------|
| **ModernChart** | Graphiques Chart.js | `ModernChart.tsx` |
| **ModernStatsCard** | KPI avec sparklines | `ModernStatsCard.tsx` |
| **ModernProgressRing** | Anneaux de progression | `ModernProgressRing.tsx` |
| **ModernTimeline** | Timeline événements | `ModernTimeline.tsx` |

---

## 📊 ModernChart - Graphiques Chart.js

### Import
```tsx
import ModernChart from '@/components/ui/ModernChart';
```

### Usage Rapide

**Line Chart (Revenues)**
```tsx
<ModernChart
  type="line"
  title="Revenus 2024"
  labels={['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun']}
  datasets={[
    {
      label: '2024',
      data: [12000, 19000, 15000, 25000, 22000, 30000],
      borderColor: '#059669',
      backgroundColor: 'rgba(5, 150, 105, 0.1)',
    }
  ]}
  height={300}
/>
```

**Bar Chart (Étudiants)**
```tsx
<ModernChart
  type="bar"
  title="Étudiants par Faculté"
  labels={['Sciences', 'Lettres', 'Droit', 'Médecine']}
  datasets={[
    {
      label: 'Inscrits',
      data: [450, 320, 280, 190],
    }
  ]}
  variant="gradient-crou"
/>
```

**Pie Chart (Distribution)**
```tsx
<ModernChart
  type="pie"
  title="Types de Chambres"
  labels={['Simple', 'Double', 'Triple']}
  datasets={[
    {
      data: [35, 45, 20],
    }
  ]}
  showLegend={true}
/>
```

**Area Chart (Tendances)**
```tsx
<ModernChart
  type="area"
  title="Taux d'Occupation"
  labels={['Jan', 'Fév', 'Mar', 'Avr', 'Mai']}
  datasets={[
    {
      label: 'Occupation %',
      data: [75, 82, 88, 92, 95],
      borderColor: '#059669',
      backgroundColor: 'rgba(5, 150, 105, 0.2)',
      fill: true,
    }
  ]}
/>
```

### Props

| Prop | Type | Défaut | Description |
|------|------|--------|-------------|
| `type` | `'line' \| 'bar' \| 'pie' \| 'doughnut' \| 'area'` | - | Type de graphique |
| `labels` | `string[]` | - | Labels de l'axe X |
| `datasets` | `ChartDataset[]` | - | Données des séries |
| `title` | `string` | - | Titre du graphique |
| `height` | `number` | 300 | Hauteur en pixels |
| `showLegend` | `boolean` | true | Afficher la légende |
| `showGrid` | `boolean` | true | Afficher la grille |
| `variant` | `'default' \| 'gradient-crou'` | 'default' | Style visuel |
| `options` | `ChartOptions` | - | Options Chart.js custom |

### Couleurs CROU Auto

Si vous ne spécifiez pas `backgroundColor`, les couleurs CROU sont appliquées automatiquement :
- #059669 (Vert CROU)
- #ea580c (Orange CROU)
- #3b82f6 (Bleu)
- #8b5cf6 (Violet)
- #ef4444 (Rouge)
- #f59e0b (Amber)
- #06b6d4 (Cyan)
- #ec4899 (Rose)

---

## 📈 ModernStatsCard - KPI avec Sparklines

### Import
```tsx
import ModernStatsCard from '@/components/ui/ModernStatsCard';
import { DollarSign, Users, Home, TrendingUp } from 'lucide-react';
```

### Usage Rapide

**Revenue Card**
```tsx
<ModernStatsCard
  title="Revenus Totaux"
  value="12.5M FCFA"
  change={12.5}
  changeLabel="vs mois dernier"
  icon={DollarSign}
  iconColor="bg-emerald-500"
  sparklineData={[10000, 12000, 11500, 13000, 12500, 15000]}
/>
```

**Students Card**
```tsx
<ModernStatsCard
  title="Étudiants Inscrits"
  value="1,247"
  change={8.2}
  changeLabel="vs année dernière"
  icon={Users}
  iconColor="bg-blue-500"
  sparklineData={[1100, 1150, 1180, 1200, 1230, 1247]}
  variant="gradient-crou"
/>
```

**Occupancy Card**
```tsx
<ModernStatsCard
  title="Taux d'Occupation"
  value="92%"
  change={-2.3}
  changeLabel="vs semaine dernière"
  icon={Home}
  iconColor="bg-orange-500"
  sparklineData={[95, 94, 93, 92, 91, 92]}
/>
```

### Props

| Prop | Type | Défaut | Description |
|------|------|--------|-------------|
| `title` | `string` | - | Titre de la carte |
| `value` | `string` | - | Valeur principale (KPI) |
| `change` | `number` | - | Changement en % |
| `changeLabel` | `string` | - | Label du changement |
| `icon` | `LucideIcon` | - | Icône Lucide |
| `iconColor` | `string` | 'bg-emerald-500' | Couleur de l'icône |
| `sparklineData` | `number[]` | - | Données sparkline (6 points) |
| `variant` | `'default' \| 'gradient-crou'` | 'default' | Style visuel |

### Tendances

- **Positif** (vert) : `change > 0` → TrendingUp
- **Négatif** (rouge) : `change < 0` → TrendingDown
- **Neutre** (gris) : `change === 0` → Minus

---

## 🔄 ModernProgressRing - Anneaux de Progression

### Import
```tsx
import ModernProgressRing from '@/components/ui/ModernProgressRing';
```

### Usage Rapide

**Budget Consumption**
```tsx
<ModernProgressRing
  percentage={75}
  size="lg"
  label="Budget Consommé"
  variant="gradient-crou"
  animated
  duration={1000}
/>
```

**Room Capacity**
```tsx
<ModernProgressRing
  percentage={92}
  size="md"
  label="Chambres Occupées"
  variant="success"
  showPercentage
  showIcon
/>
```

**Stock Level Warning**
```tsx
<ModernProgressRing
  percentage={15}
  size="sm"
  label="Stock Restant"
  variant="error"
  animated={false}
/>
```

### Props

| Prop | Type | Défaut | Description |
|------|------|--------|-------------|
| `percentage` | `number` | - | Pourcentage (0-100) |
| `size` | `'sm' \| 'md' \| 'lg'` | 'md' | Taille du ring |
| `strokeWidth` | `number` | Auto | Épaisseur du trait |
| `label` | `string` | - | Label sous le ring |
| `showPercentage` | `boolean` | true | Afficher % au centre |
| `showIcon` | `boolean` | true | Afficher Check/X |
| `variant` | `'default' \| 'gradient-crou' \| 'success' \| 'warning' \| 'error'` | 'default' | Style visuel |
| `animated` | `boolean` | true | Animation au montage |
| `duration` | `number` | 1000 | Durée animation (ms) |

### Tailles

- **sm** : 80x80px, strokeWidth 6
- **md** : 120x120px, strokeWidth 8
- **lg** : 160x160px, strokeWidth 10

### Icônes Auto

- `100%` → Check (vert)
- `0%` → X (rouge)
- Autre → Pourcentage

---

## 📅 ModernTimeline - Timeline Événements

### Import
```tsx
import ModernTimeline, { TimelineEvent } from '@/components/ui/ModernTimeline';
import { DollarSign, User, Home, AlertTriangle } from 'lucide-react';
```

### Usage Rapide

**Payment History**
```tsx
const paymentEvents: TimelineEvent[] = [
  {
    id: '1',
    title: 'Paiement reçu',
    description: 'Frais de logement - Chambre 204',
    timestamp: new Date('2024-11-24T10:30:00'),
    icon: DollarSign,
    status: 'success',
    metadata: {
      Montant: '50,000 FCFA',
      Étudiant: 'Amadou Diallo',
    },
  },
  {
    id: '2',
    title: 'Paiement en attente',
    description: 'Frais de restauration - Novembre',
    timestamp: new Date('2024-11-24T09:15:00'),
    icon: AlertTriangle,
    status: 'warning',
    metadata: {
      Montant: '25,000 FCFA',
    },
  },
];

<ModernTimeline events={paymentEvents} variant="gradient-crou" />
```

**Reservation Timeline**
```tsx
const reservationEvents: TimelineEvent[] = [
  {
    id: '1',
    title: 'Réservation confirmée',
    description: 'Chambre 204 - Cité Universitaire A',
    timestamp: Date.now() - 2 * 60 * 60 * 1000, // Il y a 2h
    icon: Home,
    status: 'success',
  },
  {
    id: '2',
    title: 'Demande reçue',
    description: 'Nouvel étudiant - Amadou Diallo',
    timestamp: Date.now() - 5 * 60 * 60 * 1000, // Il y a 5h
    icon: User,
    status: 'info',
  },
];

<ModernTimeline events={reservationEvents} showIcons />
```

### Props

| Prop | Type | Défaut | Description |
|------|------|--------|-------------|
| `events` | `TimelineEvent[]` | - | Liste des événements |
| `variant` | `'default' \| 'gradient-crou'` | 'default' | Style visuel |
| `showIcons` | `boolean` | true | Afficher les icônes |

### TimelineEvent Interface

```typescript
interface TimelineEvent {
  id: string;
  title: string;
  description: string;
  timestamp: Date | number;
  icon?: LucideIcon;
  status?: 'success' | 'error' | 'warning' | 'info' | 'default';
  metadata?: Record<string, any>;
}
```

### Statuts & Couleurs

| Status | Couleur | Usage |
|--------|---------|-------|
| `success` | Vert | Paiement reçu, opération réussie |
| `error` | Rouge | Échec, erreur, rejet |
| `warning` | Jaune | En attente, alerte |
| `info` | Bleu | Information, en cours |
| `default` | Gris | Neutre, aucun statut |

### Timestamps Intelligents

- **< 1h** : "Il y a X minutes"
- **< 24h** : "Il y a X heures"
- **< 7j** : "Il y a X jours"
- **> 7j** : "24 Nov 2024 à 10:30"

---

## 🎨 Variantes Communes

Tous les composants supportent 2 variantes :

### Default
```tsx
variant="default"
```
- Couleurs standards CROU (Vert #059669)
- Fond blanc
- Bordures subtiles

### Gradient CROU
```tsx
variant="gradient-crou"
```
- Gradient Vert → Orange
- Fond dégradé
- Effet premium

---

## 📦 Cas d'Usage Fréquents

### Dashboard Finance
```tsx
import ModernChart from '@/components/ui/ModernChart';
import ModernStatsCard from '@/components/ui/ModernStatsCard';
import ModernTimeline from '@/components/ui/ModernTimeline';
import { DollarSign, TrendingUp, CreditCard } from 'lucide-react';

function FinanceDashboard() {
  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <ModernStatsCard
          title="Revenus Totaux"
          value="12.5M FCFA"
          change={12.5}
          changeLabel="vs mois dernier"
          icon={DollarSign}
          iconColor="bg-emerald-500"
          sparklineData={[10000, 12000, 11500, 13000, 12500, 15000]}
        />
        <ModernStatsCard
          title="Paiements en Attente"
          value="250K FCFA"
          change={-5.2}
          changeLabel="vs mois dernier"
          icon={CreditCard}
          iconColor="bg-orange-500"
          sparklineData={[300, 280, 260, 270, 255, 250]}
        />
        <ModernStatsCard
          title="Croissance"
          value="+18.2%"
          change={3.1}
          changeLabel="vs trimestre précédent"
          icon={TrendingUp}
          iconColor="bg-blue-500"
          sparklineData={[12, 13, 15, 16, 17, 18]}
          variant="gradient-crou"
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ModernChart
          type="line"
          title="Évolution des Revenus 2024"
          labels={['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun']}
          datasets={[
            {
              label: '2024',
              data: [12000, 19000, 15000, 25000, 22000, 30000],
              borderColor: '#059669',
            },
            {
              label: '2023',
              data: [10000, 15000, 13000, 20000, 18000, 23000],
              borderColor: '#ea580c',
            }
          ]}
          height={300}
        />
        
        <ModernChart
          type="pie"
          title="Répartition des Revenus"
          labels={['Logements', 'Restauration', 'Transport']}
          datasets={[{ data: [45, 35, 20] }]}
          height={300}
        />
      </div>

      {/* Timeline */}
      <ModernTimeline
        events={[
          {
            id: '1',
            title: 'Paiement reçu',
            description: 'Frais de logement - Chambre 204',
            timestamp: Date.now() - 30 * 60 * 1000,
            icon: DollarSign,
            status: 'success',
            metadata: { Montant: '50,000 FCFA' },
          },
          // ... autres événements
        ]}
        variant="gradient-crou"
      />
    </div>
  );
}
```

### Dashboard Logements
```tsx
import ModernProgressRing from '@/components/ui/ModernProgressRing';
import ModernChart from '@/components/ui/ModernChart';

function LogementsDashboard() {
  return (
    <div className="space-y-6">
      {/* Occupancy Rings */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <ModernProgressRing
          percentage={92}
          label="Cité A"
          variant="success"
          animated
        />
        <ModernProgressRing
          percentage={85}
          label="Cité B"
          variant="gradient-crou"
          animated
        />
        <ModernProgressRing
          percentage={78}
          label="Cité C"
          variant="default"
          animated
        />
        <ModernProgressRing
          percentage={95}
          label="Cité D"
          variant="warning"
          animated
        />
      </div>

      {/* Occupancy Trend */}
      <ModernChart
        type="area"
        title="Tendance d'Occupation 2024"
        labels={['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun']}
        datasets={[
          {
            label: 'Taux d\'occupation %',
            data: [75, 78, 82, 88, 90, 92],
            borderColor: '#059669',
            backgroundColor: 'rgba(5, 150, 105, 0.2)',
            fill: true,
          }
        ]}
        height={300}
      />
    </div>
  );
}
```

---

## ⚡ Performance Tips

### Chart.js Optimization
```tsx
// Utilisez useMemo pour les données statiques
const chartData = useMemo(() => ({
  labels: ['Jan', 'Fév', 'Mar'],
  datasets: [{ data: [10, 20, 30] }],
}), []);

<ModernChart type="line" {...chartData} />
```

### Sparkline Caching
```tsx
// Mettez en cache les sparklineData
const sparklineData = useMemo(() => [10, 12, 11, 13, 12, 15], []);

<ModernStatsCard sparklineData={sparklineData} />
```

### Timeline Pagination
```tsx
// Limitez le nombre d'événements affichés
const recentEvents = events.slice(0, 10);

<ModernTimeline events={recentEvents} />
```

---

## 🎯 Checklist d'Utilisation

- [ ] Chart.js installé : `pnpm add chart.js react-chartjs-2`
- [ ] Composants importés depuis `@/components/ui/`
- [ ] Données formatées correctement (arrays, timestamps)
- [ ] Variante choisie (default ou gradient-crou)
- [ ] Labels et titres en français
- [ ] Couleurs CROU respectées
- [ ] Responsive layouts (grid cols)
- [ ] Performance optimisée (useMemo si nécessaire)

---

## 📚 Documentation Complète

Pour plus de détails, consultez :
- **DESIGN-SPRINT5-COMPLETE.md** - Documentation complète Sprint 5
- **Demo Page** : `/examples/sprint5` - Exemples interactifs
- **DESIGN-SPRINTS-RECAP.md** - Vue d'ensemble de tous les sprints

---

## 🚀 Prochaines Étapes

Après avoir maîtrisé Sprint 5, vous pouvez :
1. **Intégrer dans les modules** - Finance, Logements, Transport
2. **Créer des dashboards** - Combinaison des composants
3. **Ajouter des tests** - Vitest + React Testing Library
4. **Continuer Sprint 6** - Navigation & Layout Patterns

---

**Équipe CROU Niger**  
Sprint 5 : Data Visualization & Charts  
Version : 1.0.0  
Date : 24 Novembre 2024

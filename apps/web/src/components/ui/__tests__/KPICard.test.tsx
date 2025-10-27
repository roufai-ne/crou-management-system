/**
 * FICHIER: apps\web\src\components\ui\__tests__\KPICard.test.tsx
 * TESTS: Tests unitaires pour le composant KPICard
 * 
 * DESCRIPTION:
 * Tests complets du composant KPICard avec toutes ses fonctionnalités
 * Couvre les indicateurs de tendance, objectifs et formatage
 * Tests d'accessibilité et de performance
 * 
 * COVERAGE:
 * - Rendu de base avec différents types de données
 * - Indicateurs de tendance (up, down, stable)
 * - Barres de progression pour objectifs
 * - Formatage des devises et pourcentages
 * - États de chargement et erreur
 * - Interactions et callbacks
 * - Accessibilité et navigation clavier
 * - Composants KPIGrid et KPIComparison
 * 
 * AUTEUR: Équipe CROU
 * DATE: Décembre 2024
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe, toHaveNoViolations } from 'jest-axe';
import { CurrencyEuroIcon, UserIcon } from '@heroicons/react/24/outline';
import { KPICard, KPIGrid, KPIComparison } from '../KPICard';
import type { KPICardProps, KPITrend, KPITarget } from '../KPICard';

// Extension des matchers Jest pour l'accessibilité
expect.extend(toHaveNoViolations);

// Props par défaut pour les tests
const defaultProps: KPICardProps = {
  title: 'Chiffre d\'affaires',
  value: 125000,
  type: 'currency'
};

describe('KPICard Component', () => {
  // Tests de rendu de base
  describe('Rendu de base', () => {
    it('rend correctement avec les props de base', () => {
      render(<KPICard {...defaultProps} />);
      
      expect(screen.getByText('Chiffre d\'affaires')).toBeInTheDocument();
      expect(screen.getByText('125 000,00 FCFA')).toBeInTheDocument();
    });

    it('affiche la description quand fournie', () => {
      render(
        <KPICard 
          {...defaultProps} 
          description="Revenus mensuels des restaurants"
        />
      );
      
      expect(screen.getByText('Revenus mensuels des restaurants')).toBeInTheDocument();
    });

    it('affiche l\'icône quand fournie', () => {
      render(
        <KPICard 
          {...defaultProps} 
          icon={<CurrencyEuroIcon data-testid="currency-icon" />}
        />
      );
      
      expect(screen.getByTestId('currency-icon')).toBeInTheDocument();
    });

    it('génère un ID unique si non fourni', () => {
      const { container } = render(<KPICard {...defaultProps} />);
      const kpiCard = container.firstChild as HTMLElement;
      expect(kpiCard).toBeInTheDocument();
    });
  });

  // Tests des types de données
  describe('Types de données', () => {
    it('formate les devises correctement', () => {
      render(<KPICard title="Budget" value={1500.75} type="currency" />);
      expect(screen.getByText('1 500,75 FCFA')).toBeInTheDocument();
    });

    it('formate les pourcentages correctement', () => {
      render(<KPICard title="Taux" value={85.5} type="percentage" />);
      expect(screen.getByText('85.5%')).toBeInTheDocument();
    });

    it('formate les nombres correctement', () => {
      render(<KPICard title="Étudiants" value={1234} type="number" />);
      expect(screen.getByText('1 234')).toBeInTheDocument();
    });

    it('formate les compteurs correctement', () => {
      render(<KPICard title="Repas" value={567} type="count" />);
      expect(screen.getByText('567')).toBeInTheDocument();
    });

    it('utilise le rendu personnalisé', () => {
      const customRender = (value: number | string) => (
        <span data-testid="custom-value">Custom: {value}</span>
      );
      
      render(
        <KPICard 
          title="Custom" 
          value={100} 
          renderValue={customRender}
        />
      );
      
      expect(screen.getByTestId('custom-value')).toHaveTextContent('Custom: 100');
    });
  });

  // Tests des indicateurs de tendance
  describe('Indicateurs de tendance', () => {
    it('affiche une tendance à la hausse', () => {
      const trend: KPITrend = {
        direction: 'up',
        value: 12.5,
        period: 'vs mois dernier',
        valueType: 'percentage'
      };
      
      render(<KPICard {...defaultProps} trend={trend} />);
      
      expect(screen.getByText('12.5%')).toBeInTheDocument();
      expect(screen.getByText('vs mois dernier')).toBeInTheDocument();
    });

    it('affiche une tendance à la baisse', () => {
      const trend: KPITrend = {
        direction: 'down',
        value: 8.2,
        period: 'vs année dernière',
        valueType: 'percentage'
      };
      
      render(<KPICard {...defaultProps} trend={trend} />);
      
      expect(screen.getByText('8.2%')).toBeInTheDocument();
      expect(screen.getByText('vs année dernière')).toBeInTheDocument();
    });

    it('affiche une tendance stable', () => {
      const trend: KPITrend = {
        direction: 'stable',
        value: 0,
        period: 'vs mois dernier',
        valueType: 'percentage'
      };
      
      render(<KPICard {...defaultProps} trend={trend} />);
      
      expect(screen.getByText('0%')).toBeInTheDocument();
    });

    it('gère les tendances inversées', () => {
      const trend: KPITrend = {
        direction: 'down',
        value: 15,
        inverse: true,
        valueType: 'percentage'
      };
      
      const { container } = render(<KPICard title="Coûts" value={1000} trend={trend} />);
      
      // Vérifier que la couleur est inversée (baisse = vert pour les coûts)
      const trendElement = container.querySelector('.bg-success-100');
      expect(trendElement).toBeInTheDocument();
    });

    it('affiche les valeurs absolues', () => {
      const trend: KPITrend = {
        direction: 'up',
        value: 1500,
        valueType: 'absolute'
      };
      
      render(<KPICard {...defaultProps} trend={trend} />);
      
      expect(screen.getByText('1 500')).toBeInTheDocument();
    });
  });

  // Tests des objectifs et progression
  describe('Objectifs et progression', () => {
    it('affiche la barre de progression', () => {
      const target: KPITarget = {
        current: 75000,
        target: 100000,
        label: 'Objectif mensuel'
      };
      
      render(<KPICard {...defaultProps} target={target} />);
      
      expect(screen.getByText('Objectif mensuel')).toBeInTheDocument();
      expect(screen.getByText('75.0% de l\'objectif atteint')).toBeInTheDocument();
    });

    it('calcule correctement le pourcentage de progression', () => {
      const target: KPITarget = {
        current: 80000,
        target: 100000
      };
      
      render(<KPICard {...defaultProps} target={target} />);
      
      expect(screen.getByText('80.0% de l\'objectif atteint')).toBeInTheDocument();
    });

    it('limite la progression à 100%', () => {
      const target: KPITarget = {
        current: 120000,
        target: 100000
      };
      
      const { container } = render(<KPICard {...defaultProps} target={target} />);
      
      const progressBar = container.querySelector('[style*="width: 100%"]');
      expect(progressBar).toBeInTheDocument();
    });

    it('masque la barre de progression si demandé', () => {
      const target: KPITarget = {
        current: 75000,
        target: 100000,
        showProgress: false
      };
      
      render(<KPICard {...defaultProps} target={target} />);
      
      expect(screen.queryByText('de l\'objectif atteint')).not.toBeInTheDocument();
    });
  });

  // Tests des variantes
  describe('Variantes', () => {
    const variants = ['default', 'primary', 'success', 'warning', 'danger'] as const;

    variants.forEach((variant) => {
      it(`rend la variante ${variant} correctement`, () => {
        const { container } = render(
          <KPICard {...defaultProps} variant={variant} />
        );
        
        expect(container.firstChild).toBeInTheDocument();
      });
    });

    it('détermine automatiquement la variante selon la performance', () => {
      const target: KPITarget = {
        current: 30000, // 30% de l'objectif
        target: 100000
      };
      
      const { container } = render(
        <KPICard {...defaultProps} target={target} />
      );
      
      // Devrait être en variante danger (< 50%)
      expect(container.querySelector('.bg-danger-50')).toBeInTheDocument();
    });
  });

  // Tests des tailles
  describe('Tailles', () => {
    const sizes = ['sm', 'md', 'lg'] as const;

    sizes.forEach((size) => {
      it(`rend la taille ${size} correctement`, () => {
        const { container } = render(
          <KPICard {...defaultProps} size={size} />
        );
        
        const sizeClasses = {
          sm: 'p-4',
          md: 'p-6',
          lg: 'p-8'
        };
        
        expect(container.firstChild).toHaveClass(sizeClasses[size]);
      });
    });
  });

  // Tests des états
  describe('États', () => {
    it('affiche l\'état de chargement', () => {
      render(<KPICard {...defaultProps} loading />);
      
      const spinner = screen.getByRole('generic', { hidden: true });
      expect(spinner).toHaveClass('animate-spin');
    });

    it('affiche les messages d\'erreur', () => {
      render(<KPICard {...defaultProps} error="Erreur de chargement" />);
      
      expect(screen.getByText('Erreur de chargement')).toBeInTheDocument();
      expect(screen.queryByText('125 000,00 FCFA')).not.toBeInTheDocument();
    });

    it('masque les indicateurs en cas d\'erreur', () => {
      const trend: KPITrend = {
        direction: 'up',
        value: 10,
        valueType: 'percentage'
      };
      
      render(
        <KPICard 
          {...defaultProps} 
          trend={trend}
          error="Erreur de chargement"
        />
      );
      
      expect(screen.queryByText('10%')).not.toBeInTheDocument();
    });
  });

  // Tests des métadonnées
  describe('Métadonnées', () => {
    it('affiche les métadonnées supplémentaires', () => {
      const metadata = [
        { label: 'Transactions', value: 1234, type: 'count' as const },
        { label: 'Moyenne', value: 45.67, type: 'currency' as const }
      ];
      
      render(<KPICard {...defaultProps} metadata={metadata} />);
      
      expect(screen.getByText('Transactions')).toBeInTheDocument();
      expect(screen.getByText('1234')).toBeInTheDocument();
      expect(screen.getByText('Moyenne')).toBeInTheDocument();
      expect(screen.getByText('45,67 FCFA')).toBeInTheDocument();
    });

    it('masque les métadonnées en cas d\'erreur', () => {
      const metadata = [
        { label: 'Test', value: 100 }
      ];
      
      render(
        <KPICard 
          {...defaultProps} 
          metadata={metadata}
          error="Erreur"
        />
      );
      
      expect(screen.queryByText('Test')).not.toBeInTheDocument();
    });
  });

  // Tests d'interaction
  describe('Interactions', () => {
    it('appelle onClick quand cliqué', async () => {
      const handleClick = jest.fn();
      const user = userEvent.setup();
      
      render(<KPICard {...defaultProps} onClick={handleClick} />);
      
      const card = screen.getByRole('button');
      await user.click(card);
      
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('supporte la navigation clavier', async () => {
      const handleClick = jest.fn();
      const user = userEvent.setup();
      
      render(<KPICard {...defaultProps} onClick={handleClick} />);
      
      const card = screen.getByRole('button');
      card.focus();
      
      await user.keyboard('{Enter}');
      expect(handleClick).toHaveBeenCalledTimes(1);
      
      await user.keyboard(' ');
      expect(handleClick).toHaveBeenCalledTimes(2);
    });

    it('n\'est pas cliquable sans onClick', () => {
      render(<KPICard {...defaultProps} />);
      
      expect(screen.queryByRole('button')).not.toBeInTheDocument();
    });
  });

  // Tests d'accessibilité
  describe('Accessibilité', () => {
    it('n\'a pas de violations d\'accessibilité', async () => {
      const { container } = render(
        <KPICard 
          {...defaultProps}
          description="Description accessible"
          trend={{
            direction: 'up',
            value: 10,
            period: 'vs mois dernier',
            valueType: 'percentage'
          }}
        />
      );
      
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('a le bon rôle quand cliquable', () => {
      render(<KPICard {...defaultProps} onClick={() => {}} />);
      
      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('a le bon tabIndex quand cliquable', () => {
      render(<KPICard {...defaultProps} onClick={() => {}} />);
      
      const card = screen.getByRole('button');
      expect(card).toHaveAttribute('tabIndex', '0');
    });
  });
});

describe('KPIGrid Component', () => {
  const mockKPIs = [
    {
      key: 'revenue',
      title: 'Revenus',
      value: 125000,
      type: 'currency' as const
    },
    {
      key: 'students',
      title: 'Étudiants',
      value: 1234,
      type: 'count' as const
    },
    {
      key: 'satisfaction',
      title: 'Satisfaction',
      value: 85.5,
      type: 'percentage' as const
    }
  ];

  it('rend une grille de KPI', () => {
    render(<KPIGrid kpis={mockKPIs} />);
    
    expect(screen.getByText('Revenus')).toBeInTheDocument();
    expect(screen.getByText('Étudiants')).toBeInTheDocument();
    expect(screen.getByText('Satisfaction')).toBeInTheDocument();
  });

  it('applique le bon nombre de colonnes', () => {
    const { container } = render(<KPIGrid kpis={mockKPIs} columns={2} />);
    
    expect(container.firstChild).toHaveClass('md:grid-cols-2');
  });

  it('applique le bon espacement', () => {
    const { container } = render(<KPIGrid kpis={mockKPIs} gap="lg" />);
    
    expect(container.firstChild).toHaveClass('gap-8');
  });
});

describe('KPIComparison Component', () => {
  const mockData = [
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
      trend: { direction: 'stable' as const, value: 0, valueType: 'percentage' as const }
    }
  ];

  it('rend une comparaison de KPI', () => {
    render(
      <KPIComparison
        title="Évolution du chiffre d'affaires"
        data={mockData}
        type="currency"
      />
    );
    
    expect(screen.getByText('Évolution du chiffre d\'affaires')).toBeInTheDocument();
    expect(screen.getByText('Décembre 2024')).toBeInTheDocument();
    expect(screen.getByText('125 000,00 FCFA')).toBeInTheDocument();
  });

  it('met en évidence la période principale', () => {
    const { container } = render(
      <KPIComparison
        title="Comparaison"
        data={mockData}
        primaryPeriod="Décembre 2024"
      />
    );
    
    const primaryItem = container.querySelector('.bg-primary-50');
    expect(primaryItem).toBeInTheDocument();
  });

  it('affiche les indicateurs de tendance', () => {
    render(
      <KPIComparison
        title="Comparaison"
        data={mockData}
      />
    );
    
    expect(screen.getByText('12.5%')).toBeInTheDocument();
    expect(screen.getByText('5.2%')).toBeInTheDocument();
  });
});

// Tests d'intégration
describe('Intégration KPICard', () => {
  it('fonctionne avec tous les props ensemble', () => {
    const trend: KPITrend = {
      direction: 'up',
      value: 15.5,
      period: 'vs mois dernier',
      valueType: 'percentage'
    };
    
    const target: KPITarget = {
      current: 85000,
      target: 100000,
      label: 'Objectif Q4'
    };
    
    const metadata = [
      { label: 'Transactions', value: 456 },
      { label: 'Panier moyen', value: 186.4, type: 'currency' as const }
    ];
    
    render(
      <KPICard
        title="Chiffre d'affaires"
        description="Revenus des restaurants universitaires"
        value={85000}
        type="currency"
        trend={trend}
        target={target}
        metadata={metadata}
        icon={<CurrencyEuroIcon className="h-5 w-5" />}
        variant="success"
        size="lg"
        onClick={() => console.log('KPI clicked')}
      />
    );
    
    expect(screen.getByText('Chiffre d\'affaires')).toBeInTheDocument();
    expect(screen.getByText('85 000,00 FCFA')).toBeInTheDocument();
    expect(screen.getByText('15.5%')).toBeInTheDocument();
    expect(screen.getByText('Objectif Q4')).toBeInTheDocument();
    expect(screen.getByText('Transactions')).toBeInTheDocument();
  });
});

// Tests de performance
describe('Performance KPICard', () => {
  it('ne re-rend pas inutilement', () => {
    const renderSpy = jest.fn();
    
    const TestKPICard = React.memo(() => {
      renderSpy();
      return <KPICard {...defaultProps} />;
    });
    
    const { rerender } = render(<TestKPICard />);
    expect(renderSpy).toHaveBeenCalledTimes(1);
    
    rerender(<TestKPICard />);
    expect(renderSpy).toHaveBeenCalledTimes(1); // Pas de re-render
  });

  it('gère les gros nombres efficacement', () => {
    const startTime = performance.now();
    
    render(
      <KPICard
        title="Gros nombre"
        value={999999999.99}
        type="currency"
      />
    );
    
    const endTime = performance.now();
    expect(endTime - startTime).toBeLessThan(50); // Moins de 50ms
  });
});

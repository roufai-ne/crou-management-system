/**
 * FICHIER: apps\web\src\components\ui\__tests__\Tabs.test.tsx
 * TESTS: Tests unitaires pour le composant Tabs
 *
 * DESCRIPTION:
 * Tests complets du composant Tabs
 * Couverture des fonctionnalités, accessibilité et navigation clavier
 *
 * AUTEUR: Équipe CROU
 * DATE: Décembre 2024
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Tabs, type TabItem } from '../Tabs';

// Mock des icônes
jest.mock('@heroicons/react/24/outline', () => ({
  ChartBarIcon: () => <span data-testid="chart-icon" />,
  UserGroupIcon: () => <span data-testid="user-icon" />,
  CogIcon: () => <span data-testid="settings-icon" />
}));

describe('Tabs', () => {
  const defaultTabs: TabItem[] = [
    {
      id: 'tab1',
      label: 'Premier onglet',
      content: <div>Contenu du premier onglet</div>
    },
    {
      id: 'tab2',
      label: 'Deuxième onglet',
      content: <div>Contenu du deuxième onglet</div>
    },
    {
      id: 'tab3',
      label: 'Troisième onglet',
      content: <div>Contenu du troisième onglet</div>,
      disabled: true
    }
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendu de base', () => {
    test('doit afficher tous les onglets', () => {
      render(<Tabs tabs={defaultTabs} />);

      expect(screen.getByRole('tab', { name: /premier onglet/i })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: /deuxième onglet/i })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: /troisième onglet/i })).toBeInTheDocument();
    });

    test('doit afficher le contenu de l\'onglet par défaut', () => {
      render(<Tabs tabs={defaultTabs} defaultTab="tab1" />);

      expect(screen.getByText('Contenu du premier onglet')).toBeInTheDocument();
      expect(screen.queryByText('Contenu du deuxième onglet')).not.toBeInTheDocument();
    });

    test('doit sélectionner le premier onglet valide par défaut', () => {
      render(<Tabs tabs={defaultTabs} />);

      const firstTab = screen.getByRole('tab', { name: /premier onglet/i });
      expect(firstTab).toHaveAttribute('aria-selected', 'true');
    });

    test('ne doit rien afficher pour une liste vide', () => {
      const { container } = render(<Tabs tabs={[]} />);
      expect(container.firstChild).toBeNull();
    });

    test('doit afficher les icônes dans les onglets', () => {
      const tabsWithIcons: TabItem[] = [
        {
          id: 'tab1',
          label: 'Dashboard',
          icon: <span data-testid="chart-icon" />,
          content: <div>Dashboard content</div>
        }
      ];

      render(<Tabs tabs={tabsWithIcons} />);

      expect(screen.getByTestId('chart-icon')).toBeInTheDocument();
    });

    test('doit afficher les badges dans les onglets', () => {
      const tabsWithBadges: TabItem[] = [
        {
          id: 'tab1',
          label: 'Notifications',
          badge: 5,
          content: <div>Notifications content</div>
        }
      ];

      render(<Tabs tabs={tabsWithBadges} />);

      expect(screen.getByText('5')).toBeInTheDocument();
    });
  });

  describe('Navigation', () => {
    test('doit changer d\'onglet au clic', async () => {
      render(<Tabs tabs={defaultTabs} />);

      await userEvent.click(screen.getByRole('tab', { name: /deuxième onglet/i }));

      expect(screen.getByText('Contenu du deuxième onglet')).toBeInTheDocument();
      expect(screen.queryByText('Contenu du premier onglet')).not.toBeInTheDocument();
    });

    test('doit appeler onTabChange lors du changement', async () => {
      const handleTabChange = jest.fn();
      render(<Tabs tabs={defaultTabs} onTabChange={handleTabChange} />);

      await userEvent.click(screen.getByRole('tab', { name: /deuxième onglet/i }));

      expect(handleTabChange).toHaveBeenCalledWith('tab2');
    });

    test('ne doit pas permettre la sélection d\'un onglet désactivé', async () => {
      const handleTabChange = jest.fn();
      render(<Tabs tabs={defaultTabs} onTabChange={handleTabChange} />);

      await userEvent.click(screen.getByRole('tab', { name: /troisième onglet/i }));

      expect(handleTabChange).not.toHaveBeenCalledWith('tab3');
    });

    test('doit supporter le mode contrôlé', () => {
      const { rerender } = render(
        <Tabs tabs={defaultTabs} activeTab="tab1" onTabChange={jest.fn()} />
      );

      expect(screen.getByText('Contenu du premier onglet')).toBeInTheDocument();

      rerender(
        <Tabs tabs={defaultTabs} activeTab="tab2" onTabChange={jest.fn()} />
      );

      expect(screen.getByText('Contenu du deuxième onglet')).toBeInTheDocument();
    });
  });

  describe('Navigation clavier', () => {
    test('doit naviguer avec les flèches droite/gauche', async () => {
      render(<Tabs tabs={defaultTabs} />);

      const firstTab = screen.getByRole('tab', { name: /premier onglet/i });
      firstTab.focus();

      await userEvent.keyboard('{ArrowRight}');

      const secondTab = screen.getByRole('tab', { name: /deuxième onglet/i });
      expect(secondTab).toHaveFocus();
      expect(secondTab).toHaveAttribute('aria-selected', 'true');
    });

    test('doit naviguer avec les flèches haut/bas', async () => {
      render(<Tabs tabs={defaultTabs} />);

      const firstTab = screen.getByRole('tab', { name: /premier onglet/i });
      firstTab.focus();

      await userEvent.keyboard('{ArrowDown}');

      const secondTab = screen.getByRole('tab', { name: /deuxième onglet/i });
      expect(secondTab).toHaveFocus();
    });

    test('doit aller au début avec Home', async () => {
      render(<Tabs tabs={defaultTabs} />);

      const secondTab = screen.getByRole('tab', { name: /deuxième onglet/i });
      await userEvent.click(secondTab);
      secondTab.focus();

      await userEvent.keyboard('{Home}');

      const firstTab = screen.getByRole('tab', { name: /premier onglet/i });
      expect(firstTab).toHaveFocus();
      expect(firstTab).toHaveAttribute('aria-selected', 'true');
    });

    test('doit aller à la fin avec End', async () => {
      render(<Tabs tabs={defaultTabs} />);

      const firstTab = screen.getByRole('tab', { name: /premier onglet/i });
      firstTab.focus();

      await userEvent.keyboard('{End}');

      // Doit aller au dernier onglet non-désactivé
      const secondTab = screen.getByRole('tab', { name: /deuxième onglet/i });
      expect(secondTab).toHaveFocus();
      expect(secondTab).toHaveAttribute('aria-selected', 'true');
    });

    test('doit ignorer les onglets désactivés lors de la navigation', async () => {
      render(<Tabs tabs={defaultTabs} />);

      const secondTab = screen.getByRole('tab', { name: /deuxième onglet/i });
      await userEvent.click(secondTab);
      secondTab.focus();

      await userEvent.keyboard('{ArrowRight}');

      // Doit revenir au premier onglet car le troisième est désactivé
      const firstTab = screen.getByRole('tab', { name: /premier onglet/i });
      expect(firstTab).toHaveFocus();
    });
  });

  describe('Orientation verticale', () => {
    test('doit appliquer les bonnes classes pour l\'orientation verticale', () => {
      const { container } = render(
        <Tabs tabs={defaultTabs} orientation="vertical" />
      );

      expect(container.firstChild).toHaveClass('flex-row');
    });

    test('doit naviguer correctement en mode vertical', async () => {
      render(<Tabs tabs={defaultTabs} orientation="vertical" />);

      const firstTab = screen.getByRole('tab', { name: /premier onglet/i });
      firstTab.focus();

      // En mode vertical, les flèches haut/bas changent d'onglet
      await userEvent.keyboard('{ArrowDown}');

      const secondTab = screen.getByRole('tab', { name: /deuxième onglet/i });
      expect(secondTab).toHaveFocus();
    });
  });

  describe('Variantes', () => {
    test('doit appliquer la variante pills', () => {
      render(<Tabs tabs={defaultTabs} variant="pills" />);

      const tabList = screen.getByRole('tablist');
      expect(tabList).toHaveClass('p-1', 'bg-gray-100');
    });

    test('doit appliquer la variante underline', () => {
      render(<Tabs tabs={defaultTabs} variant="underline" />);

      const firstTab = screen.getByRole('tab', { name: /premier onglet/i });
      expect(firstTab).toHaveClass('border-b');
    });

    test('doit appliquer la variante cards', () => {
      render(<Tabs tabs={defaultTabs} variant="cards" />);

      const tabList = screen.getByRole('tablist');
      expect(tabList).toHaveClass('gap-2');
    });
  });

  describe('Tailles', () => {
    test('doit appliquer la petite taille', () => {
      render(<Tabs tabs={defaultTabs} size="sm" />);

      const firstTab = screen.getByRole('tab', { name: /premier onglet/i });
      expect(firstTab).toHaveClass('px-3', 'py-1.5', 'text-sm');
    });

    test('doit appliquer la grande taille', () => {
      render(<Tabs tabs={defaultTabs} size="lg" />);

      const firstTab = screen.getByRole('tab', { name: /premier onglet/i });
      expect(firstTab).toHaveClass('px-6', 'py-3', 'text-base');
    });
  });

  describe('Lazy loading', () => {
    test('doit charger seulement l\'onglet actif en mode lazy', () => {
      render(<Tabs tabs={defaultTabs} lazy defaultTab="tab1" />);

      expect(screen.getByText('Contenu du premier onglet')).toBeInTheDocument();
      expect(screen.queryByText('Contenu du deuxième onglet')).not.toBeInTheDocument();
    });

    test('doit charger le contenu au premier clic en mode lazy', async () => {
      render(<Tabs tabs={defaultTabs} lazy defaultTab="tab1" />);

      await userEvent.click(screen.getByRole('tab', { name: /deuxième onglet/i }));

      expect(screen.getByText('Contenu du deuxième onglet')).toBeInTheDocument();
    });

    test('doit garder le contenu monté avec keepMounted', async () => {
      render(<Tabs tabs={defaultTabs} lazy keepMounted defaultTab="tab1" />);

      await userEvent.click(screen.getByRole('tab', { name: /deuxième onglet/i }));
      await userEvent.click(screen.getByRole('tab', { name: /premier onglet/i }));

      // Les deux contenus doivent être présents mais un seul visible
      expect(screen.getByText('Contenu du premier onglet')).toBeInTheDocument();
      expect(screen.getByText('Contenu du deuxième onglet')).toBeInTheDocument();
    });
  });

  describe('État désactivé', () => {
    test('doit désactiver tous les onglets', () => {
      render(<Tabs tabs={defaultTabs} disabled />);

      const tabs = screen.getAllByRole('tab');
      tabs.forEach(tab => {
        expect(tab).toBeDisabled();
      });
    });

    test('ne doit pas permettre la navigation quand désactivé', async () => {
      const handleTabChange = jest.fn();
      render(<Tabs tabs={defaultTabs} disabled onTabChange={handleTabChange} />);

      await userEvent.click(screen.getByRole('tab', { name: /deuxième onglet/i }));

      expect(handleTabChange).not.toHaveBeenCalled();
    });
  });

  describe('Accessibilité', () => {
    test('doit avoir les attributs ARIA appropriés', () => {
      render(<Tabs tabs={defaultTabs} />);

      const tabList = screen.getByRole('tablist');
      expect(tabList).toHaveAttribute('aria-orientation', 'horizontal');

      const firstTab = screen.getByRole('tab', { name: /premier onglet/i });
      expect(firstTab).toHaveAttribute('aria-selected', 'true');
      expect(firstTab).toHaveAttribute('aria-controls');

      const tabPanel = screen.getByRole('tabpanel');
      expect(tabPanel).toHaveAttribute('aria-labelledby');
    });

    test('doit avoir les bons indices de tabulation', () => {
      render(<Tabs tabs={defaultTabs} />);

      const firstTab = screen.getByRole('tab', { name: /premier onglet/i });
      const secondTab = screen.getByRole('tab', { name: /deuxième onglet/i });

      expect(firstTab).toHaveAttribute('tabIndex', '0');
      expect(secondTab).toHaveAttribute('tabIndex', '-1');
    });

    test('doit supporter aria-label personnalisé', () => {
      render(
        <Tabs
          tabs={defaultTabs}
          aria-label="Navigation principale"
        />
      );

      const tabList = screen.getByRole('tablist');
      expect(tabList).toHaveAttribute('aria-label', 'Navigation principale');
    });

    test('doit supporter les descriptions d\'onglets', () => {
      const tabsWithDescriptions: TabItem[] = [
        {
          id: 'tab1',
          label: 'Onglet 1',
          description: 'Description de l\'onglet 1',
          content: <div>Contenu 1</div>
        }
      ];

      render(<Tabs tabs={tabsWithDescriptions} />);

      const tab = screen.getByRole('tab', { name: /onglet 1/i });
      expect(tab).toHaveAttribute('aria-describedby');
    });
  });

  describe('Gestion d\'erreurs', () => {
    test('doit gérer un activeTab invalide en mode contrôlé', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      render(
        <Tabs
          tabs={defaultTabs}
          activeTab="invalid-tab"
          onTabChange={jest.fn()}
        />
      );

      // Doit quand même afficher le composant sans erreur
      expect(screen.getByRole('tablist')).toBeInTheDocument();

      consoleSpy.mockRestore();
    });

    test('doit gérer les onglets sans contenu', () => {
      const tabsWithoutContent: TabItem[] = [
        {
          id: 'tab1',
          label: 'Onglet sans contenu',
          content: null
        }
      ];

      render(<Tabs tabs={tabsWithoutContent} />);

      expect(screen.getByRole('tab')).toBeInTheDocument();
      expect(screen.getByRole('tabpanel')).toBeInTheDocument();
    });
  });
});

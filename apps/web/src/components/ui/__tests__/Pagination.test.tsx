/**
 * FICHIER: apps\web\src\components\ui\__tests__\Pagination.test.tsx
 * TESTS: Tests unitaires pour le composant Pagination
 *
 * DESCRIPTION:
 * Tests complets du composant Pagination
 * Couverture des fonctionnalités, accessibilité et interactions
 *
 * AUTEUR: Équipe CROU
 * DATE: Décembre 2024
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Pagination } from '../Pagination';

// Mock des icônes
jest.mock('@heroicons/react/24/outline', () => ({
  ChevronLeftIcon: () => <span data-testid="chevron-left-icon" />,
  ChevronRightIcon: () => <span data-testid="chevron-right-icon" />,
  ChevronDoubleLeftIcon: () => <span data-testid="chevron-double-left-icon" />,
  ChevronDoubleRightIcon: () => <span data-testid="chevron-double-right-icon" />,
  EllipsisHorizontalIcon: () => <span data-testid="ellipsis-icon" />
}));

describe('Pagination', () => {
  const defaultProps = {
    currentPage: 1,
    totalPages: 10,
    onPageChange: jest.fn()
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendu de base', () => {
    test('doit afficher la pagination avec les boutons de base', () => {
      render(<Pagination {...defaultProps} />);

      expect(screen.getByRole('button', { name: /premier/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /précédent/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /suivant/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /dernier/i })).toBeInTheDocument();
    });

    test('doit afficher les numéros de page', () => {
      render(<Pagination {...defaultProps} />);

      expect(screen.getByRole('button', { name: /page 1/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /page 2/i })).toBeInTheDocument();
    });

    test('doit marquer la page actuelle comme active', () => {
      render(<Pagination {...defaultProps} currentPage={3} />);

      const currentPageButton = screen.getByRole('button', { name: /page 3/i });
      expect(currentPageButton).toHaveAttribute('aria-current', 'page');
    });

    test('ne doit pas afficher la pagination pour une seule page sans info', () => {
      const { container } = render(
        <Pagination
          currentPage={1}
          totalPages={1}
          showInfo={false}
          onPageChange={jest.fn()}
        />
      );

      expect(container.firstChild).toBeNull();
    });

    test('doit afficher les informations de résultats', () => {
      render(
        <Pagination
          {...defaultProps}
          totalItems={100}
          pageSize={10}
          showInfo
        />
      );

      expect(screen.getByText(/affichage de 1 à 10 sur 100 résultats/i)).toBeInTheDocument();
    });
  });

  describe('Navigation', () => {
    test('doit appeler onPageChange au clic sur une page', async () => {
      const handlePageChange = jest.fn();
      render(<Pagination {...defaultProps} onPageChange={handlePageChange} />);

      await userEvent.click(screen.getByRole('button', { name: /page 2/i }));

      expect(handlePageChange).toHaveBeenCalledWith(2);
    });

    test('doit naviguer avec les boutons précédent/suivant', async () => {
      const handlePageChange = jest.fn();
      render(
        <Pagination
          {...defaultProps}
          currentPage={5}
          onPageChange={handlePageChange}
        />
      );

      await userEvent.click(screen.getByRole('button', { name: /précédent/i }));
      expect(handlePageChange).toHaveBeenCalledWith(4);

      await userEvent.click(screen.getByRole('button', { name: /suivant/i }));
      expect(handlePageChange).toHaveBeenCalledWith(6);
    });

    test('doit naviguer avec les boutons premier/dernier', async () => {
      const handlePageChange = jest.fn();
      render(
        <Pagination
          {...defaultProps}
          currentPage={5}
          onPageChange={handlePageChange}
        />
      );

      await userEvent.click(screen.getByRole('button', { name: /premier/i }));
      expect(handlePageChange).toHaveBeenCalledWith(1);

      await userEvent.click(screen.getByRole('button', { name: /dernier/i }));
      expect(handlePageChange).toHaveBeenCalledWith(10);
    });

    test('doit désactiver les boutons appropriés à la première page', () => {
      render(<Pagination {...defaultProps} currentPage={1} />);

      expect(screen.getByRole('button', { name: /premier/i })).toBeDisabled();
      expect(screen.getByRole('button', { name: /précédent/i })).toBeDisabled();
      expect(screen.getByRole('button', { name: /suivant/i })).not.toBeDisabled();
      expect(screen.getByRole('button', { name: /dernier/i })).not.toBeDisabled();
    });

    test('doit désactiver les boutons appropriés à la dernière page', () => {
      render(<Pagination {...defaultProps} currentPage={10} />);

      expect(screen.getByRole('button', { name: /premier/i })).not.toBeDisabled();
      expect(screen.getByRole('button', { name: /précédent/i })).not.toBeDisabled();
      expect(screen.getByRole('button', { name: /suivant/i })).toBeDisabled();
      expect(screen.getByRole('button', { name: /dernier/i })).toBeDisabled();
    });
  });

  describe('Sélecteur de taille de page', () => {
    test('doit afficher le sélecteur de taille de page', () => {
      render(
        <Pagination
          {...defaultProps}
          showPageSize
          pageSize={10}
          onPageSizeChange={jest.fn()}
        />
      );

      expect(screen.getByRole('combobox')).toBeInTheDocument();
      expect(screen.getByDisplayValue('10')).toBeInTheDocument();
    });

    test('doit appeler onPageSizeChange lors du changement', async () => {
      const handlePageSizeChange = jest.fn();
      render(
        <Pagination
          {...defaultProps}
          showPageSize
          pageSize={10}
          onPageSizeChange={handlePageSizeChange}
        />
      );

      const select = screen.getByRole('combobox');
      await userEvent.selectOptions(select, '25');

      expect(handlePageSizeChange).toHaveBeenCalledWith(25);
    });

    test('ne doit pas afficher le sélecteur sans onPageSizeChange', () => {
      render(
        <Pagination
          {...defaultProps}
          showPageSize
          pageSize={10}
        />
      );

      expect(screen.queryByRole('combobox')).not.toBeInTheDocument();
    });
  });

  describe('Ellipses intelligentes', () => {
    test('doit afficher des ellipses pour beaucoup de pages', () => {
      render(
        <Pagination
          currentPage={50}
          totalPages={100}
          onPageChange={jest.fn()}
        />
      );

      const ellipses = screen.getAllByTestId('ellipsis-icon');
      expect(ellipses.length).toBeGreaterThan(0);
    });

    test('doit afficher toutes les pages pour un petit nombre', () => {
      render(
        <Pagination
          currentPage={3}
          totalPages={5}
          onPageChange={jest.fn()}
        />
      );

      for (let i = 1; i <= 5; i++) {
        expect(screen.getByRole('button', { name: new RegExp(`page ${i}`, 'i') })).toBeInTheDocument();
      }
    });
  });

  describe('Variantes et tailles', () => {
    test('doit appliquer la variante minimal', () => {
      const { container } = render(
        <Pagination
          {...defaultProps}
          variant="minimal"
        />
      );

      expect(container.firstChild).toHaveClass('flex');
    });

    test('doit appliquer la taille small', () => {
      render(
        <Pagination
          {...defaultProps}
          size="sm"
        />
      );

      // Les boutons doivent avoir la classe de taille appropriée
      const firstButton = screen.getByRole('button', { name: /premier/i });
      expect(firstButton).toHaveClass('h-6');
    });

    test('doit appliquer la variante compact', () => {
      render(
        <Pagination
          {...defaultProps}
          variant="compact"
        />
      );

      expect(screen.getByRole('button', { name: /premier/i })).toBeInTheDocument();
    });
  });

  describe('État désactivé', () => {
    test('doit désactiver tous les contrôles', () => {
      render(<Pagination {...defaultProps} disabled />);

      const buttons = screen.getAllByRole('button');
      buttons.forEach(button => {
        expect(button).toBeDisabled();
      });
    });

    test('ne doit pas appeler onPageChange quand désactivé', async () => {
      const handlePageChange = jest.fn();
      render(
        <Pagination
          {...defaultProps}
          disabled
          onPageChange={handlePageChange}
        />
      );

      await userEvent.click(screen.getByRole('button', { name: /page 2/i }));

      expect(handlePageChange).not.toHaveBeenCalled();
    });
  });

  describe('Navigation clavier', () => {
    test('doit supporter la navigation clavier', async () => {
      const handlePageChange = jest.fn();
      render(<Pagination {...defaultProps} onPageChange={handlePageChange} />);

      const pageButton = screen.getByRole('button', { name: /page 2/i });
      pageButton.focus();

      await userEvent.keyboard('{Enter}');
      expect(handlePageChange).toHaveBeenCalledWith(2);
    });

    test('doit supporter la touche espace', async () => {
      const handlePageChange = jest.fn();
      render(<Pagination {...defaultProps} onPageChange={handlePageChange} />);

      const pageButton = screen.getByRole('button', { name: /page 2/i });
      pageButton.focus();

      await userEvent.keyboard(' ');
      expect(handlePageChange).toHaveBeenCalledWith(2);
    });
  });

  describe('Libellés personnalisés', () => {
    test('doit utiliser les libellés personnalisés', () => {
      const customLabels = {
        previous: 'Précédente',
        next: 'Suivante',
        first: 'Début',
        last: 'Fin',
        showingResults: 'Montrant',
        of: 'de',
        results: 'éléments'
      };

      render(
        <Pagination
          {...defaultProps}
          totalItems={100}
          pageSize={10}
          showInfo
          labels={customLabels}
        />
      );

      expect(screen.getByRole('button', { name: /précédente/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /suivante/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /début/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /fin/i })).toBeInTheDocument();
      expect(screen.getByText(/montrant 1 à 10 de 100 éléments/i)).toBeInTheDocument();
    });
  });

  describe('Accessibilité', () => {
    test('doit avoir les attributs ARIA appropriés', () => {
      render(<Pagination {...defaultProps} />);

      const currentPage = screen.getByRole('button', { name: /page 1/i });
      expect(currentPage).toHaveAttribute('aria-current', 'page');

      const nextButton = screen.getByRole('button', { name: /suivant/i });
      expect(nextButton).toHaveAttribute('aria-label');
    });

    test('doit supporter le focus visible', () => {
      render(<Pagination {...defaultProps} />);

      const pageButton = screen.getByRole('button', { name: /page 1/i });
      pageButton.focus();

      expect(pageButton).toHaveFocus();
    });
  });

  describe('Cas limites', () => {
    test('doit gérer totalPages = 0', () => {
      const { container } = render(
        <Pagination
          currentPage={1}
          totalPages={0}
          onPageChange={jest.fn()}
        />
      );

      expect(container.firstChild).toBeNull();
    });

    test('doit gérer currentPage > totalPages', () => {
      const handlePageChange = jest.fn();
      render(
        <Pagination
          currentPage={15}
          totalPages={10}
          onPageChange={handlePageChange}
        />
      );

      // Doit quand même afficher la pagination
      expect(screen.getByRole('button', { name: /dernier/i })).toBeInTheDocument();
    });

    test('doit calculer correctement les informations pour la dernière page incomplète', () => {
      render(
        <Pagination
          currentPage={5}
          totalPages={5}
          totalItems={47}
          pageSize={10}
          showInfo
          onPageChange={jest.fn()}
        />
      );

      expect(screen.getByText(/affichage de 41 à 47 sur 47 résultats/i)).toBeInTheDocument();
    });
  });
});

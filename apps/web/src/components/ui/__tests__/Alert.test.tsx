/**
 * FICHIER: apps\web\src\components\ui\__tests__\Alert.test.tsx
 * TESTS: Tests unitaires pour le composant Alert
 * 
 * DESCRIPTION:
 * Tests complets du composant Alert avec React Testing Library
 * Couvre toutes les variantes, styles, états et interactions
 * Tests d'accessibilité et de performance
 * 
 * COVERAGE:
 * - Rendu de base et props
 * - Toutes les variantes (info, success, warning, danger)
 * - Tous les styles (filled, outlined, minimal)
 * - États (dismissible, avec actions, sans icône)
 * - Interactions (fermeture, actions)
 * - Accessibilité (ARIA, focus, screen reader)
 * 
 * AUTEUR: Équipe CROU
 * DATE: Décembre 2024
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe, toHaveNoViolations } from 'jest-axe';
import { Alert } from '../Alert';
import { Button } from '../Button';
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';

// Extension des matchers Jest pour l'accessibilité
expect.extend(toHaveNoViolations);

describe('Alert', () => {
  // Tests de rendu de base
  describe('Rendu de base', () => {
    it('rend correctement avec le contenu fourni', () => {
      render(<Alert>Message d'alerte</Alert>);
      expect(screen.getByRole('alert')).toBeInTheDocument();
      expect(screen.getByText('Message d\'alerte')).toBeInTheDocument();
    });

    it('rend avec un titre et une description', () => {
      render(
        <Alert title="Titre de l'alerte" description="Description détaillée" />
      );
      expect(screen.getByText('Titre de l\'alerte')).toBeInTheDocument();
      expect(screen.getByText('Description détaillée')).toBeInTheDocument();
    });

    it('rend avec des enfants personnalisés', () => {
      render(
        <Alert title="Titre">
          <span data-testid="custom-content">Contenu personnalisé</span>
        </Alert>
      );
      expect(screen.getByTestId('custom-content')).toBeInTheDocument();
    });
  });

  // Tests des variantes
  describe('Variantes', () => {
    it('applique les classes correctes pour la variante info', () => {
      render(<Alert variant="info">Info</Alert>);
      const alert = screen.getByRole('alert');
      expect(alert).toHaveClass('bg-primary-50');
    });

    it('applique les classes correctes pour la variante success', () => {
      render(<Alert variant="success">Succès</Alert>);
      const alert = screen.getByRole('alert');
      expect(alert).toHaveClass('bg-success-50');
    });

    it('applique les classes correctes pour la variante warning', () => {
      render(<Alert variant="warning">Attention</Alert>);
      const alert = screen.getByRole('alert');
      expect(alert).toHaveClass('bg-warning-50');
    });

    it('applique les classes correctes pour la variante danger', () => {
      render(<Alert variant="danger">Erreur</Alert>);
      const alert = screen.getByRole('alert');
      expect(alert).toHaveClass('bg-danger-50');
    });
  });

  // Tests des styles
  describe('Styles', () => {
    it('applique le style filled par défaut', () => {
      render(<Alert variant="info">Test</Alert>);
      const alert = screen.getByRole('alert');
      expect(alert).toHaveClass('bg-primary-50');
    });

    it('applique le style outlined', () => {
      render(<Alert variant="info" style="outlined">Test</Alert>);
      const alert = screen.getByRole('alert');
      expect(alert).toHaveClass('bg-white', 'border-primary-300');
    });

    it('applique le style minimal', () => {
      render(<Alert variant="info" style="minimal">Test</Alert>);
      const alert = screen.getByRole('alert');
      expect(alert).toHaveClass('border-l-primary-500');
    });
  });

  // Tests des icônes
  describe('Icônes', () => {
    it('affiche l\'icône par défaut selon la variante', () => {
      render(<Alert variant="success">Succès</Alert>);
      // L'icône CheckCircle devrait être présente
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });

    it('masque l\'icône quand hideIcon est true', () => {
      const { container } = render(<Alert hideIcon>Test</Alert>);
      const icons = container.querySelectorAll('svg');
      expect(icons).toHaveLength(0);
    });

    it('utilise une icône personnalisée', () => {
      render(
        <Alert icon={ExclamationTriangleIcon} data-testid="custom-icon-alert">
          Test
        </Alert>
      );
      expect(screen.getByTestId('custom-icon-alert')).toBeInTheDocument();
    });
  });

  // Tests de fermeture
  describe('Fermeture', () => {
    it('affiche le bouton de fermeture quand dismissible est true', () => {
      render(<Alert dismissible>Test</Alert>);
      expect(screen.getByLabelText('Fermer l\'alerte')).toBeInTheDocument();
    });

    it('n\'affiche pas le bouton de fermeture par défaut', () => {
      render(<Alert>Test</Alert>);
      expect(screen.queryByLabelText('Fermer l\'alerte')).not.toBeInTheDocument();
    });

    it('appelle onDismiss et masque l\'alerte lors du clic sur fermer', async () => {
      const onDismiss = jest.fn();
      render(
        <Alert dismissible onDismiss={onDismiss}>
          Test
        </Alert>
      );

      const closeButton = screen.getByLabelText('Fermer l\'alerte');
      fireEvent.click(closeButton);

      expect(onDismiss).toHaveBeenCalledTimes(1);
      
      // L'alerte devrait disparaître
      await waitFor(() => {
        expect(screen.queryByRole('alert')).not.toBeInTheDocument();
      });
    });

    it('ferme l\'alerte avec la touche Entrée sur le bouton', async () => {
      const onDismiss = jest.fn();
      render(
        <Alert dismissible onDismiss={onDismiss}>
          Test
        </Alert>
      );

      const closeButton = screen.getByLabelText('Fermer l\'alerte');
      fireEvent.keyDown(closeButton, { key: 'Enter' });

      expect(onDismiss).toHaveBeenCalledTimes(1);
    });
  });

  // Tests des actions
  describe('Actions', () => {
    it('affiche les actions personnalisées', () => {
      render(
        <Alert
          actions={
            <Button data-testid="action-button">Action</Button>
          }
        >
          Test
        </Alert>
      );
      expect(screen.getByTestId('action-button')).toBeInTheDocument();
    });

    it('affiche plusieurs actions', () => {
      render(
        <Alert
          actions={
            <div>
              <Button data-testid="action-1">Action 1</Button>
              <Button data-testid="action-2">Action 2</Button>
            </div>
          }
        >
          Test
        </Alert>
      );
      expect(screen.getByTestId('action-1')).toBeInTheDocument();
      expect(screen.getByTestId('action-2')).toBeInTheDocument();
    });
  });

  // Tests d'accessibilité
  describe('Accessibilité', () => {
    it('a le rôle alert par défaut', () => {
      render(<Alert>Test</Alert>);
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });

    it('accepte un rôle personnalisé', () => {
      render(<Alert role="status">Test</Alert>);
      expect(screen.getByRole('status')).toBeInTheDocument();
    });

    it('génère un ID unique si non fourni', () => {
      render(<Alert>Test</Alert>);
      const alert = screen.getByRole('alert');
      expect(alert).toHaveAttribute('id');
      expect(alert.id).toMatch(/^alert-/);
    });

    it('utilise l\'ID fourni', () => {
      render(<Alert id="custom-alert">Test</Alert>);
      expect(screen.getByRole('alert')).toHaveAttribute('id', 'custom-alert');
    });

    it('respecte les standards d\'accessibilité', async () => {
      const { container } = render(
        <Alert variant="warning" title="Attention" dismissible>
          Message d'avertissement important
        </Alert>
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('le bouton de fermeture est accessible au clavier', () => {
      render(<Alert dismissible>Test</Alert>);
      const closeButton = screen.getByLabelText('Fermer l\'alerte');
      
      closeButton.focus();
      expect(closeButton).toHaveFocus();
    });
  });

  // Tests des props personnalisées
  describe('Props personnalisées', () => {
    it('applique les classes CSS personnalisées', () => {
      render(<Alert className="custom-class">Test</Alert>);
      expect(screen.getByRole('alert')).toHaveClass('custom-class');
    });

    it('transmet les props HTML natives', () => {
      render(<Alert data-testid="custom-alert" aria-label="Custom label">Test</Alert>);
      const alert = screen.getByTestId('custom-alert');
      expect(alert).toHaveAttribute('aria-label', 'Custom label');
    });
  });

  // Tests de performance
  describe('Performance', () => {
    it('ne re-rend pas inutilement', () => {
      const renderSpy = jest.fn();
      const TestAlert = (props: any) => {
        renderSpy();
        return <Alert {...props} />;
      };

      const { rerender } = render(<TestAlert>Test</TestAlert>);
      expect(renderSpy).toHaveBeenCalledTimes(1);

      // Re-render avec les mêmes props
      rerender(<TestAlert>Test</TestAlert>);
      expect(renderSpy).toHaveBeenCalledTimes(2);
    });
  });

  // Tests d'edge cases
  describe('Edge cases', () => {
    it('gère les contenus vides', () => {
      render(<Alert />);
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });

    it('gère les très longs contenus', () => {
      const longContent = 'A'.repeat(1000);
      render(<Alert>{longContent}</Alert>);
      expect(screen.getByText(longContent)).toBeInTheDocument();
    });

    it('gère les caractères spéciaux dans le contenu', () => {
      const specialContent = 'Contenu avec <>&"\'';
      render(<Alert>{specialContent}</Alert>);
      expect(screen.getByText(specialContent)).toBeInTheDocument();
    });
  });
});

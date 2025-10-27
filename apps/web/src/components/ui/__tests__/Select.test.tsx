/**
 * FICHIER: apps\web\src\components\ui\__tests__\Select.test.tsx
 * TESTS: Tests unitaires pour les composants Select
 * 
 * DESCRIPTION:
 * Tests complets des composants Select, CROUSelector et RoleSelector
 * Couvre toutes les fonctionnalités avancées et interactions
 * Tests d'accessibilité et de performance
 * 
 * COVERAGE:
 * - Select: single/multi-select, recherche, création, validation
 * - CROUSelector: filtrage CROU, permissions, régions
 * - RoleSelector: rôles ministère/CROU, permissions
 * - Accessibilité: ARIA, focus, keyboard navigation
 * - Interactions: sélection, recherche, création d'options
 * 
 * AUTEUR: Équipe CROU
 * DATE: Décembre 2024
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe, toHaveNoViolations } from 'jest-axe';
import { BuildingOfficeIcon } from '@heroicons/react/24/outline';
import { Select } from '../Select';
import { CROUSelector, RoleSelector } from '../CROUSelector';

// Extension des matchers Jest pour l'accessibilité
expect.extend(toHaveNoViolations);

// Mock du contexte d'authentification
const mockUser = {
  id: '1',
  name: 'Test User',
  email: 'test@crou.gov.ne',
  role: 'directeur' as const,
  level: 'crou' as const,
  crouId: 'niamey',
  permissions: ['dashboard:read', 'financial:read'],
  isActive: true,
  profile: {}
};

jest.mock('@/stores/auth', () => ({
  useAuth: () => ({
    user: mockUser,
    isAuthenticated: true,
    hasPermission: (permission: string) => mockUser.permissions.includes(permission)
  })
}));

// Options de test
const testOptions = [
  { value: 'option1', label: 'Option 1', description: 'Description 1' },
  { value: 'option2', label: 'Option 2', description: 'Description 2' },
  { value: 'option3', label: 'Option 3', disabled: true },
  { value: 'option4', label: 'Option 4', group: 'Groupe A' },
  { value: 'option5', label: 'Option 5', group: 'Groupe B' }
];

describe('Select Component', () => {
  // Tests de rendu de base
  describe('Rendu de base', () => {
    it('rend correctement avec les options de base', () => {
      render(
        <Select
          options={testOptions}
          placeholder="Sélectionner une option"
        />
      );
      
      expect(screen.getByText('Sélectionner une option')).toBeInTheDocument();
    });

    it('affiche le label quand fourni', () => {
      render(
        <Select
          options={testOptions}
          label="Sélection test"
        />
      );
      
      expect(screen.getByText('Sélection test')).toBeInTheDocument();
    });

    it('affiche l\'astérisque pour les champs requis', () => {
      render(
        <Select
          options={testOptions}
          label="Champ requis"
          required
        />
      );
      
      const label = screen.getByText('Champ requis');
      expect(label).toHaveClass('after:content-[\'*\']');
    });
  });

  // Tests de sélection simple
  describe('Sélection simple', () => {
    it('permet de sélectionner une option', async () => {
      const handleChange = jest.fn();
      const user = userEvent.setup();
      
      render(
        <Select
          options={testOptions}
          onChange={handleChange}
          placeholder="Sélectionner"
        />
      );
      
      // Ouvrir le dropdown
      await user.click(screen.getByText('Sélectionner'));
      
      // Sélectionner une option
      await user.click(screen.getByText('Option 1'));
      
      expect(handleChange).toHaveBeenCalledWith('option1');
    });

    it('affiche la valeur sélectionnée', () => {
      render(
        <Select
          options={testOptions}
          value="option1"
        />
      );
      
      expect(screen.getByText('Option 1')).toBeInTheDocument();
    });

    it('ne permet pas de sélectionner les options désactivées', async () => {
      const handleChange = jest.fn();
      const user = userEvent.setup();
      
      render(
        <Select
          options={testOptions}
          onChange={handleChange}
        />
      );
      
      await user.click(screen.getByRole('button'));
      
      const disabledOption = screen.getByText('Option 3');
      expect(disabledOption.closest('[role="option"]')).toHaveClass('opacity-50');
      
      await user.click(disabledOption);
      expect(handleChange).not.toHaveBeenCalled();
    });
  });

  // Tests de multi-sélection
  describe('Multi-sélection', () => {
    it('permet de sélectionner plusieurs options', async () => {
      const handleChange = jest.fn();
      const user = userEvent.setup();
      
      render(
        <Select
          options={testOptions}
          onChange={handleChange}
          multiple
          placeholder="Multi-select"
        />
      );
      
      await user.click(screen.getByText('Multi-select'));
      await user.click(screen.getByText('Option 1'));
      
      expect(handleChange).toHaveBeenCalledWith(['option1']);
      
      // Sélectionner une deuxième option
      await user.click(screen.getByText('Option 2'));
      expect(handleChange).toHaveBeenCalledWith(['option1', 'option2']);
    });

    it('affiche les tags pour les valeurs sélectionnées', () => {
      render(
        <Select
          options={testOptions}
          value={['option1', 'option2']}
          multiple
        />
      );
      
      expect(screen.getByText('Option 1')).toBeInTheDocument();
      expect(screen.getByText('Option 2')).toBeInTheDocument();
    });

    it('permet de supprimer des tags individuellement', async () => {
      const handleChange = jest.fn();
      const user = userEvent.setup();
      
      render(
        <Select
          options={testOptions}
          value={['option1', 'option2']}
          onChange={handleChange}
          multiple
        />
      );
      
      // Trouver et cliquer sur le bouton de suppression du premier tag
      const removeButtons = screen.getAllByRole('button');
      const removeButton = removeButtons.find(button => 
        button.closest('span')?.textContent?.includes('Option 1')
      );
      
      if (removeButton) {
        await user.click(removeButton);
        expect(handleChange).toHaveBeenCalledWith(['option2']);
      }
    });
  });

  // Tests de recherche
  describe('Recherche', () => {
    it('filtre les options selon la recherche', async () => {
      const user = userEvent.setup();
      
      render(
        <Select
          options={testOptions}
          searchable
          placeholder="Rechercher"
        />
      );
      
      const input = screen.getByPlaceholderText('Rechercher');
      await user.type(input, 'Option 1');
      
      // Vérifier que seule "Option 1" est visible
      expect(screen.getByText('Option 1')).toBeInTheDocument();
      expect(screen.queryByText('Option 2')).not.toBeInTheDocument();
    });

    it('affiche un message quand aucune option ne correspond', async () => {
      const user = userEvent.setup();
      
      render(
        <Select
          options={testOptions}
          searchable
          noOptionsText="Aucun résultat"
        />
      );
      
      const input = screen.getByRole('combobox');
      await user.type(input, 'inexistant');
      
      expect(screen.getByText('Aucun résultat')).toBeInTheDocument();
    });

    it('utilise une fonction de filtrage personnalisée', async () => {
      const customFilter = jest.fn((option, query) => 
        option.value.toString().includes(query)
      );
      const user = userEvent.setup();
      
      render(
        <Select
          options={testOptions}
          searchable
          filterFunction={customFilter}
        />
      );
      
      const input = screen.getByRole('combobox');
      await user.type(input, '1');
      
      expect(customFilter).toHaveBeenCalled();
    });
  });

  // Tests de création d'options
  describe('Création d\'options', () => {
    it('permet de créer de nouvelles options', async () => {
      const handleCreate = jest.fn().mockResolvedValue({
        value: 'new-option',
        label: 'Nouvelle Option'
      });
      const handleChange = jest.fn();
      const user = userEvent.setup();
      
      render(
        <Select
          options={testOptions}
          searchable
          creatable
          onCreateOption={handleCreate}
          onChange={handleChange}
        />
      );
      
      const input = screen.getByRole('combobox');
      await user.type(input, 'Nouvelle Option');
      
      // Vérifier que l'option de création apparaît
      expect(screen.getByText('Créer "Nouvelle Option"')).toBeInTheDocument();
      
      // Cliquer sur l'option de création
      await user.click(screen.getByText('Créer "Nouvelle Option"'));
      
      await waitFor(() => {
        expect(handleCreate).toHaveBeenCalledWith('Nouvelle Option');
        expect(handleChange).toHaveBeenCalledWith('new-option');
      });
    });
  });

  // Tests d'états
  describe('États', () => {
    it('affiche l\'état de chargement', () => {
      render(
        <Select
          options={testOptions}
          loading
          loadingText="Chargement des options..."
        />
      );
      
      // Vérifier la présence du spinner
      const spinner = screen.getByRole('button').querySelector('.animate-spin');
      expect(spinner).toBeInTheDocument();
    });

    it('gère l\'état désactivé', () => {
      render(
        <Select
          options={testOptions}
          disabled
        />
      );
      
      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
      expect(button).toHaveClass('opacity-50');
    });

    it('affiche les messages d\'erreur', () => {
      render(
        <Select
          options={testOptions}
          error="Sélection requise"
        />
      );
      
      const errorMessage = screen.getByRole('alert');
      expect(errorMessage).toHaveTextContent('Sélection requise');
    });

    it('affiche le texte d\'aide', () => {
      render(
        <Select
          options={testOptions}
          helperText="Choisissez une option dans la liste"
        />
      );
      
      expect(screen.getByText('Choisissez une option dans la liste')).toBeInTheDocument();
    });
  });

  // Tests d'accessibilité
  describe('Accessibilité', () => {
    it('n\'a pas de violations d\'accessibilité', async () => {
      const { container } = render(
        <Select
          options={testOptions}
          label="Sélection accessible"
        />
      );
      
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('supporte la navigation au clavier', async () => {
      const user = userEvent.setup();
      
      render(
        <Select
          options={testOptions}
          label="Navigation clavier"
        />
      );
      
      const button = screen.getByRole('button');
      
      // Focus et ouverture avec Enter
      button.focus();
      await user.keyboard('{Enter}');
      
      // Navigation avec les flèches
      await user.keyboard('{ArrowDown}');
      await user.keyboard('{Enter}');
      
      // Le dropdown devrait se fermer après sélection
      await waitFor(() => {
        expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
      });
    });
  });
});

describe('CROUSelector Component', () => {
  // Tests de rendu des CROU
  describe('Rendu des CROU', () => {
    it('affiche tous les CROU par défaut', async () => {
      const user = userEvent.setup();
      
      render(<CROUSelector />);
      
      await user.click(screen.getByRole('button'));
      
      expect(screen.getByText(/CROU Niamey/)).toBeInTheDocument();
      expect(screen.getByText(/CROU Dosso/)).toBeInTheDocument();
      expect(screen.getByText(/CROU Maradi/)).toBeInTheDocument();
    });

    it('inclut l\'option Ministère quand demandé', async () => {
      const user = userEvent.setup();
      
      render(<CROUSelector includeMinistry />);
      
      await user.click(screen.getByRole('button'));
      
      expect(screen.getByText('Ministère de l\'Enseignement Supérieur')).toBeInTheDocument();
    });

    it('exclut les CROU spécifiés', async () => {
      const user = userEvent.setup();
      
      render(<CROUSelector excludeCROUs={['niamey', 'dosso']} />);
      
      await user.click(screen.getByRole('button'));
      
      expect(screen.queryByText(/CROU Niamey/)).not.toBeInTheDocument();
      expect(screen.queryByText(/CROU Dosso/)).not.toBeInTheDocument();
      expect(screen.getByText(/CROU Maradi/)).toBeInTheDocument();
    });

    it('affiche les régions dans les labels', async () => {
      const user = userEvent.setup();
      
      render(<CROUSelector showRegions />);
      
      await user.click(screen.getByRole('button'));
      
      expect(screen.getByText(/CROU Niamey - Niamey/)).toBeInTheDocument();
    });

    it('affiche les codes CROU', async () => {
      const user = userEvent.setup();
      
      render(<CROUSelector showCodes />);
      
      await user.click(screen.getByRole('button'));
      
      expect(screen.getByText(/CROU Niamey \(NIA\)/)).toBeInTheDocument();
    });
  });

  // Tests de filtrage par accès utilisateur
  describe('Filtrage par accès utilisateur', () => {
    it('filtre selon l\'accès utilisateur CROU', async () => {
      const user = userEvent.setup();
      
      render(<CROUSelector filterByUserAccess />);
      
      await user.click(screen.getByRole('button'));
      
      // L'utilisateur mock est du CROU Niamey, donc seul Niamey devrait être visible
      expect(screen.getByText(/CROU Niamey/)).toBeInTheDocument();
      expect(screen.queryByText(/CROU Dosso/)).not.toBeInTheDocument();
    });
  });

  // Tests de recherche personnalisée
  describe('Recherche personnalisée', () => {
    it('recherche dans les codes CROU', async () => {
      const user = userEvent.setup();
      
      render(<CROUSelector searchable />);
      
      const input = screen.getByRole('combobox');
      await user.type(input, 'NIA');
      
      expect(screen.getByText(/CROU Niamey/)).toBeInTheDocument();
      expect(screen.queryByText(/CROU Dosso/)).not.toBeInTheDocument();
    });

    it('recherche dans les régions', async () => {
      const user = userEvent.setup();
      
      render(<CROUSelector searchable />);
      
      const input = screen.getByRole('combobox');
      await user.type(input, 'Dosso');
      
      expect(screen.getByText(/CROU Dosso/)).toBeInTheDocument();
      expect(screen.queryByText(/CROU Niamey/)).not.toBeInTheDocument();
    });
  });
});

describe('RoleSelector Component', () => {
  // Tests de rendu des rôles
  describe('Rendu des rôles', () => {
    it('affiche tous les rôles par défaut', async () => {
      const user = userEvent.setup();
      
      render(<RoleSelector />);
      
      await user.click(screen.getByRole('button'));
      
      expect(screen.getByText('Ministre/Directeur Général')).toBeInTheDocument();
      expect(screen.getByText('Directeur CROU')).toBeInTheDocument();
    });

    it('filtre les rôles par niveau ministère', async () => {
      const user = userEvent.setup();
      
      render(<RoleSelector level="ministry" />);
      
      await user.click(screen.getByRole('button'));
      
      expect(screen.getByText('Ministre/Directeur Général')).toBeInTheDocument();
      expect(screen.queryByText('Directeur CROU')).not.toBeInTheDocument();
    });

    it('filtre les rôles par niveau CROU', async () => {
      const user = userEvent.setup();
      
      render(<RoleSelector level="crou" />);
      
      await user.click(screen.getByRole('button'));
      
      expect(screen.getByText('Directeur CROU')).toBeInTheDocument();
      expect(screen.queryByText('Ministre/Directeur Général')).not.toBeInTheDocument();
    });

    it('affiche les descriptions des rôles', async () => {
      const user = userEvent.setup();
      
      render(<RoleSelector showDescriptions />);
      
      await user.click(screen.getByRole('button'));
      
      expect(screen.getByText('Supervision générale et validation finale')).toBeInTheDocument();
    });

    it('masque les descriptions quand demandé', async () => {
      const user = userEvent.setup();
      
      render(<RoleSelector showDescriptions={false} />);
      
      await user.click(screen.getByRole('button'));
      
      expect(screen.queryByText('Supervision générale et validation finale')).not.toBeInTheDocument();
    });
  });

  // Tests de filtrage par permissions
  describe('Filtrage par permissions', () => {
    it('filtre les rôles selon les permissions requises', async () => {
      const user = userEvent.setup();
      
      render(<RoleSelector requiredPermissions={['financial:write']} />);
      
      await user.click(screen.getByRole('button'));
      
      // Seuls les rôles avec permission financial:write devraient être visibles
      expect(screen.getByText('Directeur Affaires Financières')).toBeInTheDocument();
      expect(screen.getByText('Chef Financier')).toBeInTheDocument();
      expect(screen.queryByText('Contrôleur Budgétaire')).not.toBeInTheDocument();
    });
  });
});

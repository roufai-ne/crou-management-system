/**
 * FICHIER: apps\web\src\components\ui\Pagination.stories.tsx
 * STORYBOOK: Stories pour le composant Pagination
 *
 * DESCRIPTION:
 * Documentation interactive du composant Pagination
 * Exemples d'utilisation et variations pour le design system CROU
 *
 * STORIES:
 * - Pagination basique avec différentes configurations
 * - Variantes et tailles
 * - États et interactions
 * - Exemples d'intégration avec tables
 *
 * AUTEUR: Équipe CROU
 * DATE: Décembre 2024
 */

import type { Meta, StoryObj } from '@storybook/react';
import React, { useState } from 'react';
import { Pagination } from './Pagination';
import { Table } from './Table';

// Configuration Meta
const meta: Meta<typeof Pagination> = {
  title: 'Components/Navigation/Pagination',
  component: Pagination,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Composant de pagination complet avec navigation intelligente et sélecteur de taille de page.'
      }
    }
  },
  argTypes: {
    currentPage: {
      control: { type: 'number', min: 1 },
      description: 'Page actuelle (1-indexed)'
    },
    totalPages: {
      control: { type: 'number', min: 1 },
      description: 'Nombre total de pages'
    },
    totalItems: {
      control: { type: 'number', min: 0 },
      description: 'Nombre total d\'éléments'
    },
    pageSize: {
      control: { type: 'number', min: 1 },
      description: 'Taille de page actuelle'
    },
    variant: {
      control: 'select',
      options: ['default', 'minimal', 'compact'],
      description: 'Variante visuelle'
    },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
      description: 'Taille des boutons'
    },
    showPageSize: {
      control: 'boolean',
      description: 'Afficher le sélecteur de taille de page'
    },
    showInfo: {
      control: 'boolean',
      description: 'Afficher les informations détaillées'
    },
    disabled: {
      control: 'boolean',
      description: 'État désactivé'
    },
    siblingCount: {
      control: { type: 'number', min: 0, max: 3 },
      description: 'Nombre de pages à afficher autour de la page actuelle'
    }
  }
};

export default meta;
type Story = StoryObj<typeof Pagination>;

// Histoire basique
export const Default: Story = {
  args: {
    currentPage: 1,
    totalPages: 10,
    totalItems: 250,
    pageSize: 25,
    showPageSize: true,
    showInfo: true
  }
};

// Pagination interactive
export const Interactive: Story = {
  render: () => {
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const totalItems = 157;
    const totalPages = Math.ceil(totalItems / pageSize);

    return (
      <div className="w-full max-w-4xl space-y-4">
        <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
          <h3 className="text-lg font-semibold mb-2">Pagination Interactive</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            Cliquez sur les boutons pour naviguer entre les pages
          </p>
        </div>

        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={totalItems}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
          onPageSizeChange={setPageSize}
          showPageSize
          showInfo
        />

        <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded text-sm">
          <strong>État actuel:</strong> Page {currentPage} sur {totalPages},
          {pageSize} éléments par page
        </div>
      </div>
    );
  }
};

// Différentes tailles
export const Sizes: Story = {
  render: () => (
    <div className="space-y-8 w-full max-w-4xl">
      <div>
        <h3 className="text-sm font-medium mb-4">Petite taille</h3>
        <Pagination
          currentPage={3}
          totalPages={10}
          totalItems={100}
          pageSize={10}
          size="sm"
          onPageChange={() => {}}
          showInfo
        />
      </div>

      <div>
        <h3 className="text-sm font-medium mb-4">Taille moyenne (défaut)</h3>
        <Pagination
          currentPage={5}
          totalPages={15}
          totalItems={300}
          pageSize={20}
          size="md"
          onPageChange={() => {}}
          showInfo
        />
      </div>

      <div>
        <h3 className="text-sm font-medium mb-4">Grande taille</h3>
        <Pagination
          currentPage={2}
          totalPages={8}
          totalItems={200}
          pageSize={25}
          size="lg"
          onPageChange={() => {}}
          showInfo
        />
      </div>
    </div>
  )
};

// Différentes variantes
export const Variants: Story = {
  render: () => (
    <div className="space-y-8 w-full max-w-4xl">
      <div>
        <h3 className="text-sm font-medium mb-4">Variante par défaut</h3>
        <Pagination
          currentPage={4}
          totalPages={12}
          totalItems={240}
          pageSize={20}
          variant="default"
          onPageChange={() => {}}
          showPageSize
          showInfo
        />
      </div>

      <div>
        <h3 className="text-sm font-medium mb-4">Variante minimale</h3>
        <Pagination
          currentPage={6}
          totalPages={15}
          totalItems={450}
          pageSize={30}
          variant="minimal"
          onPageChange={() => {}}
          showPageSize
          showInfo
        />
      </div>

      <div>
        <h3 className="text-sm font-medium mb-4">Variante compacte</h3>
        <Pagination
          currentPage={3}
          totalPages={8}
          totalItems={160}
          pageSize={20}
          variant="compact"
          onPageChange={() => {}}
          showPageSize
          showInfo
        />
      </div>
    </div>
  )
};

// États particuliers
export const SpecialStates: Story = {
  render: () => (
    <div className="space-y-8 w-full max-w-4xl">
      <div>
        <h3 className="text-sm font-medium mb-4">Page unique (pas de pagination)</h3>
        <Pagination
          currentPage={1}
          totalPages={1}
          totalItems={8}
          pageSize={10}
          onPageChange={() => {}}
          showInfo
        />
      </div>

      <div>
        <h3 className="text-sm font-medium mb-4">Première page</h3>
        <Pagination
          currentPage={1}
          totalPages={20}
          totalItems={500}
          pageSize={25}
          onPageChange={() => {}}
          showInfo
        />
      </div>

      <div>
        <h3 className="text-sm font-medium mb-4">Dernière page</h3>
        <Pagination
          currentPage={20}
          totalPages={20}
          totalItems={500}
          pageSize={25}
          onPageChange={() => {}}
          showInfo
        />
      </div>

      <div>
        <h3 className="text-sm font-medium mb-4">État désactivé</h3>
        <Pagination
          currentPage={5}
          totalPages={10}
          totalItems={250}
          pageSize={25}
          onPageChange={() => {}}
          disabled
          showPageSize
          showInfo
        />
      </div>
    </div>
  )
};

// Avec beaucoup de pages
export const ManyPages: Story = {
  render: () => {
    const [currentPage, setCurrentPage] = useState(50);
    const totalPages = 100;
    const totalItems = 2500;
    const pageSize = 25;

    return (
      <div className="space-y-8 w-full max-w-4xl">
        <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
          <h3 className="text-lg font-semibold mb-2">Pagination avec beaucoup de pages</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Navigation intelligente avec ellipses pour 100 pages
          </p>
        </div>

        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={totalItems}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
          showInfo
          siblingCount={2}
        />

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <button
            onClick={() => setCurrentPage(1)}
            className="p-2 bg-blue-100 hover:bg-blue-200 rounded text-blue-800"
          >
            Aller au début
          </button>
          <button
            onClick={() => setCurrentPage(25)}
            className="p-2 bg-blue-100 hover:bg-blue-200 rounded text-blue-800"
          >
            Aller à la page 25
          </button>
          <button
            onClick={() => setCurrentPage(75)}
            className="p-2 bg-blue-100 hover:bg-blue-200 rounded text-blue-800"
          >
            Aller à la page 75
          </button>
          <button
            onClick={() => setCurrentPage(100)}
            className="p-2 bg-blue-100 hover:bg-blue-200 rounded text-blue-800"
          >
            Aller à la fin
          </button>
        </div>
      </div>
    );
  }
};

// Exemple d'intégration avec une table
export const WithTable: Story = {
  render: () => {
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);

    // Données simulées
    const generateData = (page: number, size: number) => {
      const startIndex = (page - 1) * size;
      return Array.from({ length: size }, (_, i) => ({
        id: startIndex + i + 1,
        nom: `Étudiant ${startIndex + i + 1}`,
        crou: ['CROU Niamey', 'CROU Dosso', 'CROU Zinder'][Math.floor(Math.random() * 3)],
        chambre: `${Math.floor(Math.random() * 200) + 1}`,
        statut: ['Actif', 'Inactif', 'En attente'][Math.floor(Math.random() * 3)]
      }));
    };

    const totalItems = 157;
    const totalPages = Math.ceil(totalItems / pageSize);
    const data = generateData(currentPage, Math.min(pageSize, totalItems - (currentPage - 1) * pageSize));

    const columns = [
      { key: 'id', header: 'ID', sortable: true },
      { key: 'nom', header: 'Nom de l\'étudiant', sortable: true },
      { key: 'crou', header: 'CROU', sortable: true },
      { key: 'chambre', header: 'Chambre', sortable: false },
      { key: 'statut', header: 'Statut', sortable: true }
    ];

    return (
      <div className="w-full max-w-6xl space-y-4">
        <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
          <h3 className="text-lg font-semibold mb-2">Table avec Pagination</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Exemple d'intégration de la pagination avec une table de données
          </p>
        </div>

        <Table
          data={data}
          columns={columns}
          className="border border-gray-200 dark:border-gray-700"
        />

        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={totalItems}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
          onPageSizeChange={(newSize) => {
            setPageSize(newSize);
            setCurrentPage(1); // Reset à la première page
          }}
          showPageSize
          showInfo
          pageSizeOptions={[5, 10, 25, 50]}
        />
      </div>
    );
  }
};

// Pagination avec libellés personnalisés
export const CustomLabels: Story = {
  render: () => {
    const [currentPage, setCurrentPage] = useState(3);
    const totalPages = 8;
    const totalItems = 200;
    const pageSize = 25;

    return (
      <div className="w-full max-w-4xl space-y-4">
        <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
          <h3 className="text-lg font-semibold mb-2">Libellés Personnalisés</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Pagination avec des textes personnalisés
          </p>
        </div>

        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={totalItems}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
          showInfo
          labels={{
            previous: '← Précédente',
            next: 'Suivante →',
            first: '⏮ Début',
            last: 'Fin ⏭',
            page: 'Page',
            showingResults: 'Montrant',
            of: 'de',
            results: 'étudiants'
          }}
        />
      </div>
    );
  }
};

// Export des stories
export {
  Default,
  Interactive,
  Sizes,
  Variants,
  SpecialStates,
  ManyPages,
  WithTable,
  CustomLabels
};

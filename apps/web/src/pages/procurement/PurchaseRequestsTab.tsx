/**
 * FICHIER: apps/web/src/pages/procurement/PurchaseRequestsTab.tsx
 * COMPOSANT: PurchaseRequestsTab - Demandes d'achat (À IMPLÉMENTER)
 */

import React from 'react';
import { Card, Button } from '@/components/ui';
import { PlusIcon } from '@heroicons/react/24/outline';

export const PurchaseRequestsTab: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Demandes d'Achat
          </h2>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Fonctionnalité à implémenter
          </p>
        </div>
        <Button variant="primary" leftIcon={<PlusIcon className="h-4 w-4" />}>
          Nouvelle Demande
        </Button>
      </div>

      <Card>
        <Card.Content>
          <div className="text-center py-12 text-gray-500">
            Module en développement
          </div>
        </Card.Content>
      </Card>
    </div>
  );
};

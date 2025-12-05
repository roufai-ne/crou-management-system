/**
 * FICHIER: apps/web/src/pages/procurement/ReceptionsTab.tsx
 * COMPOSANT: ReceptionsTab - Réceptions de marchandises (À IMPLÉMENTER)
 */

import React from 'react';
import { Card, Button } from '@/components/ui';
import { TruckIcon } from '@heroicons/react/24/outline';

interface ReceptionsTabProps {
  tenantId?: string;
}

export const ReceptionsTab: React.FC<ReceptionsTabProps> = ({ tenantId }) => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Réceptions
          </h2>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Fonctionnalité à implémenter
          </p>
        </div>
        <Button variant="primary" leftIcon={<TruckIcon className="h-4 w-4" />}>
          Nouvelle Réception
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

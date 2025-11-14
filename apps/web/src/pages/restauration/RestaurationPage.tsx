/**
 * FICHIER: apps/web/src/pages/restauration/RestaurationPage.tsx
 * PAGE: RestaurationPage - Gestion de la restauration universitaire
 *
 * DESCRIPTION:
 * Page principale pour la gestion de la restauration universitaire
 * Interface complète avec Dashboard, Restaurants, Menus, Tickets, Repas et Denrées
 * Support multi-tenant avec permissions granulaires
 *
 * FONCTIONNALITÉS:
 * - Dashboard avec KPIs et statistiques
 * - Gestion des restaurants
 * - Planification des menus
 * - Émission et gestion des tickets repas
 * - Suivi des services de repas
 * - Gestion des denrées alimentaires
 * - Alertes et rapports
 *
 * AUTEUR: Équipe CROU
 * DATE: Janvier 2025
 */

import React, { useState } from 'react';
import { Container, Tabs } from '@/components/ui';
import {
  ChartBarIcon,
  BuildingStorefrontIcon,
  DocumentTextIcon,
  TicketIcon,
  CakeIcon,
  CubeIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '@/stores/auth';
import { DashboardTab } from '@/components/restauration/DashboardTab';
import { RestaurantsTab } from '@/components/restauration/RestaurantsTab';
import { MenusTab } from '@/components/restauration/MenusTab';
import { TicketsRestaurationTab } from '@/components/restauration/TicketsRestaurationTab';
import { RepasTab } from '@/components/restauration/RepasTab';
import { DenreesTab } from '@/components/restauration/DenreesTab';

export const RestaurationPage: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');

  const tabs = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: <ChartBarIcon className="h-4 w-4" />,
      content: <DashboardTab />
    },
    {
      id: 'restaurants',
      label: 'Restaurants',
      icon: <BuildingStorefrontIcon className="h-4 w-4" />,
      content: <RestaurantsTab />
    },
    {
      id: 'menus',
      label: 'Menus',
      icon: <DocumentTextIcon className="h-4 w-4" />,
      content: <MenusTab />
    },
    {
      id: 'tickets',
      label: 'Tickets Repas',
      icon: <TicketIcon className="h-4 w-4" />,
      content: <TicketsRestaurationTab />
    },
    {
      id: 'repas',
      label: 'Services Repas',
      icon: <CakeIcon className="h-4 w-4" />,
      content: <RepasTab />
    },
    {
      id: 'denrees',
      label: 'Denrées',
      icon: <CubeIcon className="h-4 w-4" />,
      content: <DenreesTab />
    }
  ];

  return (
    <Container size="xl" className="py-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Gestion de la Restauration</h1>
            <p className="text-lg text-gray-600 mt-2">
              Restauration universitaire et tickets repas CROU
            </p>
          </div>
        </div>
      </div>

      {/* Tabs de navigation */}
      <Tabs
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        variant="pills"
        className="space-y-8"
      />
    </Container>
  );
};

export default RestaurationPage;

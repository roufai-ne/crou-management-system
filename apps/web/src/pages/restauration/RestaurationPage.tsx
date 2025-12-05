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
import { Container } from '@/components/ui';
import ModernTabs, { Tab } from '@/components/ui/ModernTabs';
import {
  ChartBarIcon,
  BuildingStorefrontIcon,
  DocumentTextIcon,
  TicketIcon,
  CakeIcon,
  CubeIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '@/stores/auth';
import { useTenantFilter } from '@/hooks/useTenantFilter';
import { TenantFilter } from '@/components/common/TenantFilter';
import { DashboardTab } from '@/components/restauration/DashboardTab';
import { RestaurantsTab } from '@/components/restauration/RestaurantsTab';
import { MenusTab } from '@/components/restauration/MenusTab';
import { TicketsRestaurationTab } from '@/components/restauration/TicketsRestaurationTab';
import { RepasTab } from '@/components/restauration/RepasTab';
import { DenreesTab } from '@/components/restauration/DenreesTab';

export const RestaurationPage: React.FC = () => {
  const { user } = useAuth();
  const { selectedTenantId, setSelectedTenantId, effectiveTenantId, canFilterTenant } = useTenantFilter();
  const [activeTab, setActiveTab] = useState('dashboard');

  const tabs = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: ChartBarIcon,
      content: <DashboardTab tenantId={effectiveTenantId} />
    },
    {
      id: 'restaurants',
      label: 'Restaurants',
      icon: BuildingStorefrontIcon,
      content: <RestaurantsTab tenantId={effectiveTenantId} />
    },
    {
      id: 'menus',
      label: 'Menus',
      icon: DocumentTextIcon,
      content: <MenusTab tenantId={effectiveTenantId} />
    },
    {
      id: 'tickets',
      label: 'Tickets Repas',
      icon: TicketIcon,
      content: <TicketsRestaurationTab tenantId={effectiveTenantId} />
    },
    {
      id: 'repas',
      label: 'Services Repas',
      icon: CakeIcon,
      content: <RepasTab tenantId={effectiveTenantId} />
    },
    {
      id: 'denrees',
      label: 'Denrées',
      icon: CubeIcon,
      content: <DenreesTab tenantId={effectiveTenantId} />
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
          {/* Filtre Tenant pour admins ministère */}
          {canFilterTenant && (
            <div className="ml-4">
              <TenantFilter
                value={selectedTenantId}
                onChange={setSelectedTenantId}
                showAllOption={true}
              />
            </div>
          )}
        </div>
      </div>

      {/* Tabs de navigation */}
      <ModernTabs
        tabs={tabs}
        defaultTab="dashboard"
        variant="pills"
        animated
      />
    </Container>
  );
};

export default RestaurationPage;

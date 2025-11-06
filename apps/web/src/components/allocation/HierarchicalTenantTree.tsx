/**
 * FICHIER: apps/web/src/components/allocation/HierarchicalTenantTree.tsx
 * COMPOSANT: HierarchicalTenantTree - Arbre hiérarchique des tenants
 *
 * DESCRIPTION:
 * Arbre interactif affichant la hiérarchie complète
 * Ministry → Regions → CROUs avec possibilité d'expansion/collapse
 *
 * AUTEUR: Équipe CROU
 * DATE: Janvier 2025
 */

import React, { useState, useMemo } from 'react';
import {
  ChevronRightIcon,
  ChevronDownIcon,
  BuildingOfficeIcon,
  MagnifyingGlassIcon
} from '@heroicons/react/24/outline';

export interface TenantHierarchy {
  ministry: { id: string; name: string } | null;
  regions: Array<{
    id: string;
    name: string;
    crous: Array<{ id: string; name: string }>;
  }>;
}

interface HierarchicalTenantTreeProps {
  hierarchy: TenantHierarchy | null;
  selectedTenantId?: string;
  onSelectTenant?: (tenantId: string, level: 'ministry' | 'region' | 'crou') => void;
  showSearch?: boolean;
  loading?: boolean;
  className?: string;
}

export const HierarchicalTenantTree: React.FC<HierarchicalTenantTreeProps> = ({
  hierarchy,
  selectedTenantId,
  onSelectTenant,
  showSearch = true,
  loading = false,
  className = ''
}) => {
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set(['ministry']));
  const [searchQuery, setSearchQuery] = useState('');

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!hierarchy) {
    return (
      <div className="text-center py-12">
        <BuildingOfficeIcon className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">Aucune hiérarchie</h3>
      </div>
    );
  }

  return (
    <div className={`hierarchical-tenant-tree ${className}`}>
      <div className="text-lg font-semibold text-gray-900 mb-4">
        Hiérarchie des organismes
      </div>
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <p className="text-sm text-gray-600">Arbre hiérarchique à implémenter</p>
      </div>
    </div>
  );
};

export default HierarchicalTenantTree;

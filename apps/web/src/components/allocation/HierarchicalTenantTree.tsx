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

  // Toggle expansion d'un nœud
  const toggleNode = (nodeId: string) => {
    setExpandedNodes(prev => {
      const next = new Set(prev);
      if (next.has(nodeId)) {
        next.delete(nodeId);
      } else {
        next.add(nodeId);
      }
      return next;
    });
  };

  // Filtrer la hiérarchie selon la recherche
  const filteredHierarchy = useMemo(() => {
    if (!hierarchy || !searchQuery.trim()) return hierarchy;

    const query = searchQuery.toLowerCase();
    const filtered: TenantHierarchy = {
      ministry: hierarchy.ministry,
      regions: hierarchy.regions.map(region => ({
        ...region,
        crous: region.crous.filter(crou =>
          crou.name.toLowerCase().includes(query) ||
          region.name.toLowerCase().includes(query)
        )
      })).filter(region =>
        region.name.toLowerCase().includes(query) ||
        region.crous.length > 0
      )
    };

    return filtered;
  }, [hierarchy, searchQuery]);

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
        <p className="mt-1 text-sm text-gray-500">Aucune donnée hiérarchique disponible</p>
      </div>
    );
  }

  const isSelected = (id: string) => selectedTenantId === id;
  const isExpanded = (id: string) => expandedNodes.has(id);

  return (
    <div className={`hierarchical-tenant-tree ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">
          Hiérarchie des organismes
        </h3>
      </div>

      {/* Search Bar */}
      {showSearch && (
        <div className="mb-4">
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher un organisme..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
        </div>
      )}

      {/* Tree */}
      <div className="bg-white rounded-lg border border-gray-200">
        {/* Ministry Level */}
        {filteredHierarchy.ministry && (
          <div className="border-b border-gray-200 last:border-b-0">
            <div
              onClick={() => {
                toggleNode('ministry');
                onSelectTenant?.(filteredHierarchy.ministry!.id, 'ministry');
              }}
              className={`
                flex items-center p-3 hover:bg-gray-50 cursor-pointer transition-colors
                ${isSelected(filteredHierarchy.ministry.id) ? 'bg-primary-50' : ''}
              `}
            >
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleNode('ministry');
                }}
                className="mr-2 p-1 hover:bg-gray-200 rounded"
              >
                {isExpanded('ministry') ? (
                  <ChevronDownIcon className="h-4 w-4 text-gray-600" />
                ) : (
                  <ChevronRightIcon className="h-4 w-4 text-gray-600" />
                )}
              </button>

              <BuildingOfficeIcon className="h-5 w-5 text-purple-600 mr-3" />

              <div className="flex-1">
                <span className="font-medium text-gray-900">
                  {filteredHierarchy.ministry.name}
                </span>
                <span className="ml-2 px-2 py-0.5 text-xs font-medium bg-purple-100 text-purple-800 rounded">
                  Ministère
                </span>
              </div>

              <span className="text-sm text-gray-500">
                {filteredHierarchy.regions.length} région(s)
              </span>
            </div>

            {/* Regions Level */}
            {isExpanded('ministry') && filteredHierarchy.regions.length > 0 && (
              <div className="pl-6 bg-gray-50">
                {filteredHierarchy.regions.map((region) => (
                  <div key={region.id} className="border-t border-gray-200">
                    <div
                      onClick={() => {
                        toggleNode(`region-${region.id}`);
                        onSelectTenant?.(region.id, 'region');
                      }}
                      className={`
                        flex items-center p-3 hover:bg-gray-100 cursor-pointer transition-colors
                        ${isSelected(region.id) ? 'bg-primary-50' : ''}
                      `}
                    >
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleNode(`region-${region.id}`);
                        }}
                        className="mr-2 p-1 hover:bg-gray-200 rounded"
                      >
                        {isExpanded(`region-${region.id}`) ? (
                          <ChevronDownIcon className="h-4 w-4 text-gray-600" />
                        ) : (
                          <ChevronRightIcon className="h-4 w-4 text-gray-600" />
                        )}
                      </button>

                      <BuildingOfficeIcon className="h-5 w-5 text-blue-600 mr-3" />

                      <div className="flex-1">
                        <span className="font-medium text-gray-900">
                          {region.name}
                        </span>
                        <span className="ml-2 px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-800 rounded">
                          Région
                        </span>
                      </div>

                      <span className="text-sm text-gray-500">
                        {region.crous.length} CROU(s)
                      </span>
                    </div>

                    {/* CROUs Level */}
                    {isExpanded(`region-${region.id}`) && region.crous.length > 0 && (
                      <div className="pl-6 bg-gray-100">
                        {region.crous.map((crou) => (
                          <div
                            key={crou.id}
                            onClick={() => onSelectTenant?.(crou.id, 'crou')}
                            className={`
                              flex items-center p-3 hover:bg-gray-200 cursor-pointer transition-colors border-t border-gray-300
                              ${isSelected(crou.id) ? 'bg-primary-100' : ''}
                            `}
                          >
                            <div className="w-6 mr-2" /> {/* Spacer pour alignement */}

                            <BuildingOfficeIcon className="h-5 w-5 text-green-600 mr-3" />

                            <div className="flex-1">
                              <span className="font-medium text-gray-900">
                                {crou.name}
                              </span>
                              <span className="ml-2 px-2 py-0.5 text-xs font-medium bg-green-100 text-green-800 rounded">
                                CROU
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Empty State si recherche sans résultats */}
        {searchQuery && filteredHierarchy.regions.length === 0 && (
          <div className="text-center py-8 px-4">
            <MagnifyingGlassIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">Aucun résultat</h3>
            <p className="mt-1 text-sm text-gray-500">
              Aucun organisme ne correspond à "{searchQuery}"
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default HierarchicalTenantTree;

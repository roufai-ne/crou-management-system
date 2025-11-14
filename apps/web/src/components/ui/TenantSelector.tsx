/**
 * FICHIER: apps/web/src/components/ui/TenantSelector.tsx
 * COMPOSANT: TenantSelector - Sélecteur hiérarchique de tenants
 *
 * DESCRIPTION:
 * Composant pour sélectionner un tenant dans la hiérarchie à 3 niveaux
 * Support navigation Ministère → CROU → Services
 *
 * FONCTIONNALITÉS:
 * - Affichage hiérarchique (arbre ou liste déroulante)
 * - Filtrage par niveau
 * - Indication du niveau actuel
 * - Support multi-sélection (optionnel)
 *
 * AUTEUR: Équipe CROU
 * DATE: Décembre 2024
 */

import React, { useState, useEffect } from 'react';
import { ChevronDownIcon, ChevronRightIcon, BuildingOfficeIcon } from '@heroicons/react/24/outline';

// ================================================================================================
// TYPES
// ================================================================================================

export interface Tenant {
  id: string;
  name: string;
  code: string;
  type: 'ministere' | 'crou' | 'service';
  level: number; // 0=Ministère, 1=CROU, 2=Service
  parentId?: string | null;
  path: string;
  serviceType?: string | null;
  isActive?: boolean;
}

export interface TenantSelectorProps {
  /**
   * Tenant actuellement sélectionné
   */
  value?: string;

  /**
   * Callback lors du changement de sélection
   */
  onChange: (tenantId: string, tenant: Tenant) => void;

  /**
   * Liste des tenants disponibles
   */
  tenants: Tenant[];

  /**
   * Limiter la sélection à certains niveaux
   */
  allowedLevels?: number[]; // Ex: [0, 1] pour seulement Ministère et CROU

  /**
   * Limiter la sélection à certains types
   */
  allowedTypes?: Array<'ministere' | 'crou' | 'service'>;

  /**
   * Mode d'affichage
   */
  mode?: 'dropdown' | 'tree';

  /**
   * Afficher le chemin complet (breadcrumb)
   */
  showPath?: boolean;

  /**
   * Placeholder
   */
  placeholder?: string;

  /**
   * Disabled
   */
  disabled?: boolean;

  /**
   * Classe CSS personnalisée
   */
  className?: string;
}

// ================================================================================================
// COMPOSANT TENANT NODE (pour mode tree)
// ================================================================================================

interface TenantNodeProps {
  tenant: Tenant;
  children?: Tenant[];
  selected?: boolean;
  onSelect: (tenant: Tenant) => void;
  expandedNodes: Set<string>;
  toggleExpand: (tenantId: string) => void;
  allowedLevels?: number[];
  allowedTypes?: Array<'ministere' | 'crou' | 'service'>;
}

const TenantNode: React.FC<TenantNodeProps> = ({
  tenant,
  children = [],
  selected,
  onSelect,
  expandedNodes,
  toggleExpand,
  allowedLevels,
  allowedTypes
}) => {
  const hasChildren = children.length > 0;
  const isExpanded = expandedNodes.has(tenant.id);
  const isSelectable =
    (!allowedLevels || allowedLevels.includes(tenant.level)) &&
    (!allowedTypes || allowedTypes.includes(tenant.type));

  return (
    <div className="tenant-node">
      <div
        className={`tenant-node-header flex items-center py-2 px-3 cursor-pointer hover:bg-gray-50 rounded ${
          selected ? 'bg-primary-50 text-primary-700 font-medium' : ''
        } ${!isSelectable ? 'opacity-50 cursor-not-allowed' : ''}`}
        onClick={() => {
          if (isSelectable) {
            onSelect(tenant);
          }
        }}
      >
        {hasChildren && (
          <button
            className="mr-2 p-1 hover:bg-gray-200 rounded"
            onClick={(e) => {
              e.stopPropagation();
              toggleExpand(tenant.id);
            }}
          >
            {isExpanded ? (
              <ChevronDownIcon className="w-4 h-4" />
            ) : (
              <ChevronRightIcon className="w-4 h-4" />
            )}
          </button>
        )}

        {!hasChildren && <div className="w-7" />}

        <BuildingOfficeIcon className="w-5 h-5 mr-2 text-gray-400" />

        <div className="flex-1">
          <div className="text-sm font-medium">{tenant.name}</div>
          <div className="text-xs text-gray-500 dark:text-gray-400">
            {tenant.type === 'ministere' && 'Ministère (Niveau 0)'}
            {tenant.type === 'crou' && `CROU (Niveau 1)`}
            {tenant.type === 'service' && `Service ${tenant.serviceType || ''} (Niveau 2)`}
          </div>
        </div>
      </div>

      {hasChildren && isExpanded && (
        <div className="ml-6 border-l-2 border-gray-200 pl-2">
          {children.map((child) => {
            const childChildren = children.filter((t) => t.parentId === child.id);
            return (
              <TenantNode
                key={child.id}
                tenant={child}
                children={childChildren}
                selected={selected}
                onSelect={onSelect}
                expandedNodes={expandedNodes}
                toggleExpand={toggleExpand}
                allowedLevels={allowedLevels}
                allowedTypes={allowedTypes}
              />
            );
          })}
        </div>
      )}
    </div>
  );
};

// ================================================================================================
// COMPOSANT PRINCIPAL
// ================================================================================================

export const TenantSelector: React.FC<TenantSelectorProps> = ({
  value,
  onChange,
  tenants,
  allowedLevels,
  allowedTypes,
  mode = 'dropdown',
  showPath = false,
  placeholder = 'Sélectionner un tenant...',
  disabled = false,
  className = ''
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  const [selectedTenant, setSelectedTenant] = useState<Tenant | undefined>();

  // Trouver le tenant sélectionné
  useEffect(() => {
    if (value) {
      const tenant = tenants.find((t) => t.id === value);
      setSelectedTenant(tenant);

      // Auto-expand parents for tree mode
      if (tenant && mode === 'tree') {
        const pathSegments = tenant.path.split('/');
        const newExpanded = new Set<string>(expandedNodes);

        // Find and expand all parents
        pathSegments.forEach((_, index) => {
          const parentPath = pathSegments.slice(0, index + 1).join('/');
          const parentTenant = tenants.find((t) => t.path === parentPath);
          if (parentTenant) {
            newExpanded.add(parentTenant.id);
          }
        });

        setExpandedNodes(newExpanded);
      }
    }
  }, [value, tenants, mode]);

  // Organiser tenants en hiérarchie
  const rootTenants = tenants.filter((t) => t.level === 0);

  const toggleExpand = (tenantId: string) => {
    setExpandedNodes((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(tenantId)) {
        newSet.delete(tenantId);
      } else {
        newSet.add(tenantId);
      }
      return newSet;
    });
  };

  const handleSelect = (tenant: Tenant) => {
    setSelectedTenant(tenant);
    onChange(tenant.id, tenant);
    setIsOpen(false);
  };

  // Filtrer les tenants selon allowedLevels et allowedTypes
  const filteredTenants = tenants.filter((tenant) => {
    const levelAllowed = !allowedLevels || allowedLevels.includes(tenant.level);
    const typeAllowed = !allowedTypes || allowedTypes.includes(tenant.type);
    return levelAllowed && typeAllowed;
  });

  // Render dropdown mode
  if (mode === 'dropdown') {
    return (
      <div className={`tenant-selector relative ${className}`}>
        <button
          type="button"
          className="w-full flex items-center justify-between px-4 py-2 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
          onClick={() => !disabled && setIsOpen(!isOpen)}
          disabled={disabled}
        >
          <span className="flex items-center">
            <BuildingOfficeIcon className="w-5 h-5 mr-2 text-gray-400" />
            {selectedTenant ? (
              <span>
                {selectedTenant.name}
                {showPath && selectedTenant.path && (
                  <span className="text-xs text-gray-500 ml-2">({selectedTenant.path})</span>
                )}
              </span>
            ) : (
              <span className="text-gray-500 dark:text-gray-400">{placeholder}</span>
            )}
          </span>
          <ChevronDownIcon className={`w-5 h-5 text-gray-400 transition-transform ${isOpen ? 'transform rotate-180' : ''}`} />
        </button>

        {isOpen && !disabled && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />
            <div className="absolute z-20 mt-1 w-full bg-white border border-gray-300 rounded-md shadow-lg max-h-96 overflow-auto">
              {filteredTenants.length === 0 ? (
                <div className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">Aucun tenant disponible</div>
              ) : (
                filteredTenants.map((tenant) => {
                  const isSelected = selectedTenant?.id === tenant.id;
                  return (
                    <button
                      key={tenant.id}
                      type="button"
                      className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 flex items-center ${
                        isSelected ? 'bg-primary-50 text-primary-700 font-medium' : 'text-gray-700'
                      }`}
                      onClick={() => handleSelect(tenant)}
                    >
                      <BuildingOfficeIcon className="w-4 h-4 mr-2 text-gray-400" />
                      <div>
                        <div>{tenant.name}</div>
                        {showPath && (
                          <div className="text-xs text-gray-500 dark:text-gray-400">{tenant.path}</div>
                        )}
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </>
        )}
      </div>
    );
  }

  // Render tree mode
  return (
    <div className={`tenant-selector-tree border border-gray-300 rounded-md p-3 bg-white ${className}`}>
      {filteredTenants.length === 0 ? (
        <div className="text-sm text-gray-500 dark:text-gray-400">Aucun tenant disponible</div>
      ) : (
        rootTenants.map((rootTenant) => {
          const children = tenants.filter((t) => t.parentId === rootTenant.id);
          return (
            <TenantNode
              key={rootTenant.id}
              tenant={rootTenant}
              children={children}
              selected={selectedTenant?.id === rootTenant.id}
              onSelect={handleSelect}
              expandedNodes={expandedNodes}
              toggleExpand={toggleExpand}
              allowedLevels={allowedLevels}
              allowedTypes={allowedTypes}
            />
          );
        })
      )}
    </div>
  );
};

export default TenantSelector;

/**
 * FICHIER: apps/web/src/components/allocation/BudgetFlowDiagram.tsx
 * COMPOSANT: BudgetFlowDiagram - Diagramme du flux budgétaire
 *
 * DESCRIPTION:
 * Visualisation du flux budgétaire à travers la hiérarchie
 * Ministry ’ Regions ’ CROUs avec montants et pourcentages
 *
 * FONCTIONNALITÉS:
 * - Affichage hiérarchique du flux
 * - Barres de progression
 * - Statistiques par niveau
 * - Support drill-down
 *
 * AUTEUR: Équipe CROU
 * DATE: Janvier 2025
 */

import React from 'react';
import {
  BanknotesIcon,
  ArrowDownIcon,
  ChartBarIcon,
  BuildingOfficeIcon
} from '@heroicons/react/24/outline';
import { AllocationUtils } from '@/services/api/allocationService';

// ================================================================================================
// TYPES
// ================================================================================================

interface BudgetFlowData {
  budgetId: string;
  exercice: number;

  ministryAllocation?: {
    tenantId: string;
    tenantName: string;
    montantTotal: number;
    montantAlloue: number;
    montantDisponible: number;
  };

  regionalAllocations?: Array<{
    allocationId: string;
    tenantId: string;
    tenantName: string;
    montantAlloue: number;
    montantUtilise: number;
    montantDisponible: number;
    crouCount: number;
  }>;

  crouAllocations?: Array<{
    allocationId: string;
    tenantId: string;
    tenantName: string;
    regionId: string;
    regionName: string;
    montantAlloue: number;
    montantUtilise: number;
    montantDisponible: number;
  }>;

  totalAlloue: number;
  totalUtilise: number;
  totalDisponible: number;
}

interface BudgetFlowDiagramProps {
  /**
   * Données du flux budgétaire
   */
  data: BudgetFlowData | null;

  /**
   * État de chargement
   */
  loading?: boolean;

  /**
   * Callback pour drill-down
   */
  onSelectRegion?: (regionId: string) => void;

  /**
   * Callback pour drill-down CROU
   */
  onSelectCROU?: (crouId: string) => void;

  /**
   * Classe CSS personnalisée
   */
  className?: string;
}

// ================================================================================================
// COMPOSANTS HELPER
// ================================================================================================

const ProgressBar: React.FC<{
  value: number;
  max: number;
  color?: string;
  showPercentage?: boolean;
}> = ({ value, max, color = 'bg-primary-600', showPercentage = true }) => {
  const percentage = max > 0 ? Math.round((value / max) * 100) : 0;

  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-1">
        <span className="text-xs text-gray-600">
          {AllocationUtils.formatCurrency(value)} / {AllocationUtils.formatCurrency(max)}
        </span>
        {showPercentage && (
          <span className="text-xs font-medium text-gray-900">{percentage}%</span>
        )}
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div
          className={`${color} h-2 rounded-full transition-all duration-300`}
          style={{ width: `${Math.min(percentage, 100)}%` }}
        />
      </div>
    </div>
  );
};

const FlowCard: React.FC<{
  title: string;
  icon: React.ReactNode;
  montantTotal: number;
  montantAlloue: number;
  montantDisponible: number;
  children?: React.ReactNode;
}> = ({ title, icon, montantTotal, montantAlloue, montantDisponible, children }) => {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
      <div className="flex items-center space-x-2 mb-3">
        {icon}
        <h3 className="font-semibold text-gray-900">{title}</h3>
      </div>

      <div className="space-y-3">
        <div>
          <div className="text-xs text-gray-500 mb-1">Total</div>
          <div className="text-lg font-bold text-gray-900">
            {AllocationUtils.formatCurrency(montantTotal)}
          </div>
        </div>

        <div>
          <div className="text-xs text-gray-500 mb-1">Alloué</div>
          <ProgressBar
            value={montantAlloue}
            max={montantTotal}
            color="bg-blue-600"
          />
        </div>

        <div>
          <div className="text-xs text-gray-500 mb-1">Disponible</div>
          <div className="text-sm font-medium text-green-600">
            {AllocationUtils.formatCurrency(montantDisponible)}
          </div>
        </div>
      </div>

      {children && (
        <div className="mt-4 pt-4 border-t border-gray-100">
          {children}
        </div>
      )}
    </div>
  );
};

// ================================================================================================
// COMPOSANT PRINCIPAL
// ================================================================================================

export const BudgetFlowDiagram: React.FC<BudgetFlowDiagramProps> = ({
  data,
  loading = false,
  onSelectRegion,
  onSelectCROU,
  className = ''
}) => {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-12">
        <ChartBarIcon className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">Aucune donnée</h3>
        <p className="mt-1 text-sm text-gray-500">
          Sélectionnez un budget pour voir le flux budgétaire
        </p>
      </div>
    );
  }

  const tauxAllocation = data.totalAlloue > 0
    ? Math.round((data.totalAlloue / (data.ministryAllocation?.montantTotal || 1)) * 100)
    : 0;

  const tauxUtilisation = data.totalAlloue > 0
    ? Math.round((data.totalUtilise / data.totalAlloue) * 100)
    : 0;

  return (
    <div className={`budget-flow-diagram space-y-6 ${className}`}>
      {/* En-tête avec statistiques globales */}
      <div className="bg-gradient-to-r from-primary-50 to-blue-50 rounded-lg p-6 border border-primary-200">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center">
            <BanknotesIcon className="w-6 h-6 mr-2 text-primary-600" />
            Flux budgétaire - Exercice {data.exercice}
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-lg p-4">
            <div className="text-xs text-gray-500 mb-1">Total alloué</div>
            <div className="text-xl font-bold text-gray-900">
              {AllocationUtils.formatCurrency(data.totalAlloue)}
            </div>
            <div className="text-xs text-gray-600 mt-1">
              {tauxAllocation}% du budget total
            </div>
          </div>

          <div className="bg-white rounded-lg p-4">
            <div className="text-xs text-gray-500 mb-1">Total utilisé</div>
            <div className="text-xl font-bold text-blue-600">
              {AllocationUtils.formatCurrency(data.totalUtilise)}
            </div>
            <div className="text-xs text-gray-600 mt-1">
              {tauxUtilisation}% d'utilisation
            </div>
          </div>

          <div className="bg-white rounded-lg p-4">
            <div className="text-xs text-gray-500 mb-1">Disponible</div>
            <div className="text-xl font-bold text-green-600">
              {AllocationUtils.formatCurrency(data.totalDisponible)}
            </div>
            <div className="text-xs text-gray-600 mt-1">
              Prêt à être alloué
            </div>
          </div>
        </div>
      </div>

      {/* Niveau Ministère */}
      {data.ministryAllocation && (
        <div>
          <FlowCard
            title={`Ministère - ${data.ministryAllocation.tenantName}`}
            icon={<BuildingOfficeIcon className="w-5 h-5 text-purple-600" />}
            montantTotal={data.ministryAllocation.montantTotal}
            montantAlloue={data.ministryAllocation.montantAlloue}
            montantDisponible={data.ministryAllocation.montantDisponible}
          />
        </div>
      )}

      {/* Flèche de flux */}
      {data.regionalAllocations && data.regionalAllocations.length > 0 && (
        <div className="flex justify-center">
          <ArrowDownIcon className="w-6 h-6 text-gray-400" />
        </div>
      )}

      {/* Niveau Régions */}
      {data.regionalAllocations && data.regionalAllocations.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
            <BuildingOfficeIcon className="w-4 h-4 mr-2 text-blue-600" />
            Régions ({data.regionalAllocations.length})
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {data.regionalAllocations.map((region) => (
              <div
                key={region.allocationId}
                className={`bg-white rounded-lg border border-gray-200 p-4 transition-all ${
                  onSelectRegion ? 'cursor-pointer hover:border-blue-500 hover:shadow-md' : ''
                }`}
                onClick={() => onSelectRegion?.(region.tenantId)}
              >
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-gray-900">{region.tenantName}</h4>
                  <span className="text-xs text-gray-500">{region.crouCount} CROUs</span>
                </div>

                <div className="space-y-2">
                  <div>
                    <div className="text-xs text-gray-500">Alloué</div>
                    <div className="text-sm font-semibold text-gray-900">
                      {AllocationUtils.formatCurrency(region.montantAlloue)}
                    </div>
                  </div>

                  <ProgressBar
                    value={region.montantUtilise}
                    max={region.montantAlloue}
                    color="bg-blue-500"
                    showPercentage={false}
                  />

                  <div className="flex justify-between text-xs">
                    <span className="text-gray-600">Utilisé</span>
                    <span className="font-medium text-gray-900">
                      {AllocationUtils.formatCurrency(region.montantUtilise)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Flèche de flux */}
      {data.crouAllocations && data.crouAllocations.length > 0 && (
        <div className="flex justify-center">
          <ArrowDownIcon className="w-6 h-6 text-gray-400" />
        </div>
      )}

      {/* Niveau CROUs */}
      {data.crouAllocations && data.crouAllocations.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
            <BuildingOfficeIcon className="w-4 h-4 mr-2 text-green-600" />
            CROUs ({data.crouAllocations.length})
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            {data.crouAllocations.map((crou) => (
              <div
                key={crou.allocationId}
                className={`bg-white rounded-lg border border-gray-200 p-3 transition-all ${
                  onSelectCROU ? 'cursor-pointer hover:border-green-500 hover:shadow' : ''
                }`}
                onClick={() => onSelectCROU?.(crou.tenantId)}
              >
                <div className="mb-2">
                  <h4 className="font-medium text-sm text-gray-900">{crou.tenantName}</h4>
                  <p className="text-xs text-gray-500">{crou.regionName}</p>
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-600">Alloué</span>
                    <span className="font-medium">
                      {AllocationUtils.formatCurrency(crou.montantAlloue)}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-600">Utilisé</span>
                    <span className="font-medium text-blue-600">
                      {AllocationUtils.formatCurrency(crou.montantUtilise)}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-600">Disponible</span>
                    <span className="font-medium text-green-600">
                      {AllocationUtils.formatCurrency(crou.montantDisponible)}
                    </span>
                  </div>
                </div>

                <div className="mt-2">
                  <div className="w-full bg-gray-200 rounded-full h-1.5">
                    <div
                      className="bg-green-600 h-1.5 rounded-full"
                      style={{
                        width: `${Math.min(
                          Math.round((crou.montantUtilise / crou.montantAlloue) * 100),
                          100
                        )}%`
                      }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default BudgetFlowDiagram;

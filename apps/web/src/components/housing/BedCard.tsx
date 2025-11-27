/**
 * FICHIER: apps/web/src/components/housing/BedCard.tsx
 * COMPOSANT: Carte d'affichage d'un lit
 *
 * DESCRIPTION:
 * Carte visuelle pour afficher les informations d'un lit
 * Avec statut coloré, actions contextuelles, et indicateurs visuels
 *
 * FONCTIONNALITÉS:
 * - Affichage du numéro et statut du lit
 * - Icône de statut colorée (🟢 🔴 🟠 ⚫)
 * - Actions rapides : Maintenance, Disponible, Hors service
 * - Menu contextuel pour actions avancées
 * - Indication visuelle de l'occupation
 *
 * AUTEUR: Équipe CROU
 * DATE: Janvier 2025
 */

import React, { useState } from 'react';
import { Bed, BedStatus } from '@/services/api/bedService';
import { Button } from '@/components/ui/Button';
import { Dropdown } from '@/components/ui/Dropdown';
import { Badge } from '@/components/ui/Badge';

interface BedCardProps {
  bed: Bed;
  roomNumber?: string;
  onStatusChange?: (bedId: string, newStatus: BedStatus) => void;
  onEdit?: (bed: Bed) => void;
  onDelete?: (bedId: string) => void;
  compact?: boolean;
  selectable?: boolean;
  selected?: boolean;
  onSelect?: (bed: Bed) => void;
}

export const BedCard: React.FC<BedCardProps> = ({
  bed,
  roomNumber,
  onStatusChange,
  onEdit,
  onDelete,
  compact = false,
  selectable = false,
  selected = false,
  onSelect
}) => {
  const [showActions, setShowActions] = useState(false);

  // Obtenir la couleur du badge selon le statut
  const getStatusBadgeVariant = (status: BedStatus): 'success' | 'error' | 'warning' | 'default' => {
    switch (status) {
      case 'available':
        return 'success';
      case 'occupied':
        return 'error';
      case 'maintenance':
        return 'warning';
      case 'out_of_service':
        return 'default';
      default:
        return 'default';
    }
  };

  // Obtenir l'icône du statut
  const getStatusIcon = (status: BedStatus): string => {
    switch (status) {
      case 'available':
        return '🟢';
      case 'occupied':
        return '🔴';
      case 'maintenance':
        return '🟠';
      case 'out_of_service':
        return '⚫';
      default:
        return '⚪';
    }
  };

  // Obtenir le label du statut
  const getStatusLabel = (status: BedStatus): string => {
    switch (status) {
      case 'available':
        return 'Disponible';
      case 'occupied':
        return 'Occupé';
      case 'maintenance':
        return 'En maintenance';
      case 'out_of_service':
        return 'Hors service';
      default:
        return status;
    }
  };

  const handleStatusAction = (newStatus: BedStatus) => {
    if (onStatusChange) {
      onStatusChange(bed.id, newStatus);
    }
    setShowActions(false);
  };

  const handleCardClick = () => {
    if (selectable && onSelect) {
      onSelect(bed);
    }
  };

  const bedNumber = roomNumber ? `${roomNumber}-${bed.number}` : bed.number;

  // Mode compact
  if (compact) {
    return (
      <div
        className={`
          relative p-3 border rounded-lg cursor-pointer transition-all
          ${selected ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'border-gray-200 dark:border-gray-700'}
          ${selectable ? 'hover:border-blue-400 hover:shadow-md' : ''}
          ${bed.status === 'available' ? 'bg-white dark:bg-gray-800' : 'bg-gray-50 dark:bg-gray-900'}
        `}
        onClick={handleCardClick}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="text-2xl">{getStatusIcon(bed.status)}</span>
            <div>
              <div className="font-semibold text-gray-900 dark:text-white">
                Lit {bedNumber}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                {getStatusLabel(bed.status)}
              </div>
            </div>
          </div>
          {selected && (
            <svg className="w-5 h-5 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
          )}
        </div>
      </div>
    );
  }

  // Mode complet
  return (
    <div
      className={`
        relative bg-white dark:bg-gray-800 border rounded-lg shadow-sm overflow-hidden
        ${selected ? 'border-blue-500 ring-2 ring-blue-200 dark:ring-blue-800' : 'border-gray-200 dark:border-gray-700'}
        ${selectable ? 'cursor-pointer hover:shadow-md' : ''}
      `}
      onClick={selectable ? handleCardClick : undefined}
    >
      {/* En-tête */}
      <div className="p-4 border-b border-gray-100 dark:border-gray-700">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <div className="text-4xl">{getStatusIcon(bed.status)}</div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Lit {bedNumber}
              </h3>
              <Badge variant={getStatusBadgeVariant(bed.status)}>
                {getStatusLabel(bed.status)}
              </Badge>
            </div>
          </div>

          {/* Actions */}
          {!selectable && (onStatusChange || onEdit || onDelete) && (
            <Dropdown
              trigger={
                <Button variant="ghost" size="sm">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                  </svg>
                </Button>
              }
            >
              <div className="py-1">
                {onEdit && (
                  <button
                    onClick={() => onEdit(bed)}
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    ✏️ Modifier
                  </button>
                )}
                {onStatusChange && bed.status !== 'available' && (
                  <button
                    onClick={() => handleStatusAction('available')}
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    🟢 Rendre disponible
                  </button>
                )}
                {onStatusChange && bed.status !== 'maintenance' && (
                  <button
                    onClick={() => handleStatusAction('maintenance')}
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    🟠 En maintenance
                  </button>
                )}
                {onStatusChange && bed.status !== 'out_of_service' && (
                  <button
                    onClick={() => handleStatusAction('out_of_service')}
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    ⚫ Hors service
                  </button>
                )}
                {onDelete && (
                  <>
                    <div className="border-t border-gray-100 dark:border-gray-700 my-1"></div>
                    <button
                      onClick={() => onDelete(bed.id)}
                      className="block w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                    >
                      🗑️ Supprimer
                    </button>
                  </>
                )}
              </div>
            </Dropdown>
          )}
        </div>
      </div>

      {/* Corps */}
      <div className="p-4 space-y-3">
        {/* Description */}
        {bed.description && (
          <div>
            <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
              Description
            </div>
            <div className="text-sm text-gray-700 dark:text-gray-300">
              {bed.description}
            </div>
          </div>
        )}

        {/* Notes */}
        {bed.notes && (
          <div>
            <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
              Notes
            </div>
            <div className="text-sm text-gray-700 dark:text-gray-300 italic">
              {bed.notes}
            </div>
          </div>
        )}

        {/* Métadonnées */}
        <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 pt-2 border-t border-gray-100 dark:border-gray-700">
          <span>Créé le {new Date(bed.createdAt).toLocaleDateString()}</span>
          {!bed.isActive && (
            <Badge variant="default" size="sm">Inactif</Badge>
          )}
        </div>
      </div>

      {/* Indicateur de sélection */}
      {selected && selectable && (
        <div className="absolute top-2 right-2">
          <div className="bg-blue-500 rounded-full p-1">
            <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                clipRule="evenodd"
              />
            </svg>
          </div>
        </div>
      )}
    </div>
  );
};

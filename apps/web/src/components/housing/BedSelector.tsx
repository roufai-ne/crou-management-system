/**
 * FICHIER: apps/web/src/components/housing/BedSelector.tsx
 * COMPOSANT: Sélecteur de lit pour attribution
 *
 * DESCRIPTION:
 * Composant de sélection de lit lors de la création d'une occupation
 * Affiche les lits disponibles d'une chambre avec sélection interactive
 *
 * FONCTIONNALITÉS:
 * - Affichage des lits disponibles d'une chambre
 * - Vue en grille avec statuts visuels
 * - Sélection simple d'un lit
 * - Filtrage par statut (disponibles uniquement par défaut)
 * - Informations détaillées au survol
 *
 * AUTEUR: Équipe CROU
 * DATE: Janvier 2025
 */

import React, { useState, useEffect } from 'react';
import { Bed, BedStatus } from '@/services/api/bedService';
import { useBeds } from '@/hooks/useBeds';
import { BedCard } from './BedCard';
import { Alert } from '@/components/ui/Alert';

interface BedSelectorProps {
  roomId: string;
  roomNumber?: string;
  selectedBedId?: string;
  onSelect: (bed: Bed) => void;
  showOnlyAvailable?: boolean;
  compact?: boolean;
}

export const BedSelector: React.FC<BedSelectorProps> = ({
  roomId,
  roomNumber,
  selectedBedId,
  onSelect,
  showOnlyAvailable = true,
  compact = false
}) => {
  const {
    beds,
    loading,
    error,
    loadBedsByRoom,
    loadStatsByRoom,
    stats
  } = useBeds();

  const [selectedBed, setSelectedBed] = useState<Bed | null>(null);
  const [filterStatus, setFilterStatus] = useState<'all' | 'available'>(
    showOnlyAvailable ? 'available' : 'all'
  );

  // Charger les lits de la chambre
  useEffect(() => {
    if (roomId) {
      loadBedsByRoom(roomId);
      loadStatsByRoom(roomId);
    }
  }, [roomId]);

  // Pré-sélectionner un lit si fourni
  useEffect(() => {
    if (selectedBedId && beds.length > 0) {
      const bed = beds.find(b => b.id === selectedBedId);
      if (bed) {
        setSelectedBed(bed);
      }
    }
  }, [selectedBedId, beds]);

  // Filtrer les lits
  const filteredBeds = beds.filter(bed => {
    if (filterStatus === 'available') {
      return bed.status === 'available' && bed.isActive;
    }
    return bed.isActive;
  });

  // Obtenir le nombre de lits par statut
  const availableCount = beds.filter(b => b.status === 'available').length;
  const occupiedCount = beds.filter(b => b.status === 'occupied').length;
  const maintenanceCount = beds.filter(b => b.status === 'maintenance').length;

  // Gérer la sélection
  const handleSelect = (bed: Bed) => {
    // Ne permettre la sélection que des lits disponibles
    if (bed.status !== 'available' || !bed.isActive) {
      return;
    }

    setSelectedBed(bed);
    onSelect(bed);
  };

  return (
    <div className="space-y-4">
      {/* En-tête avec statistiques */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
          Sélectionner un lit{roomNumber && ` - Chambre ${roomNumber}`}
        </h3>

        {/* Statistiques rapides */}
        <div className="flex items-center space-x-4 text-sm">
          <div className="flex items-center space-x-2">
            <span className="text-xl">🟢</span>
            <span className="text-gray-700 dark:text-gray-300">
              {availableCount} disponible{availableCount > 1 ? 's' : ''}
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-xl">🔴</span>
            <span className="text-gray-700 dark:text-gray-300">
              {occupiedCount} occupé{occupiedCount > 1 ? 's' : ''}
            </span>
          </div>
          {maintenanceCount > 0 && (
            <div className="flex items-center space-x-2">
              <span className="text-xl">🟠</span>
              <span className="text-gray-700 dark:text-gray-300">
                {maintenanceCount} en maintenance
              </span>
            </div>
          )}
        </div>

        {/* Filtre */}
        {!showOnlyAvailable && (
          <div className="mt-3 flex items-center space-x-2">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Afficher:
            </span>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as 'all' | 'available')}
              className="px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="all">Tous les lits</option>
              <option value="available">Disponibles uniquement</option>
            </select>
          </div>
        )}
      </div>

      {/* Erreur */}
      {error && (
        <Alert variant="error">
          {error}
        </Alert>
      )}

      {/* Loading */}
      {loading && (
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500"></div>
          <p className="text-gray-600 dark:text-gray-400 mt-3 text-sm">
            Chargement des lits...
          </p>
        </div>
      )}

      {/* Aucun lit disponible */}
      {!loading && filteredBeds.length === 0 && (
        <div className="text-center py-8 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700">
          <span className="text-4xl mb-3 block">😞</span>
          <p className="text-gray-600 dark:text-gray-400">
            {filterStatus === 'available'
              ? 'Aucun lit disponible dans cette chambre'
              : 'Aucun lit dans cette chambre'}
          </p>
        </div>
      )}

      {/* Grille de sélection des lits */}
      {!loading && filteredBeds.length > 0 && (
        <div className={compact ? 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3' : 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4'}>
          {filteredBeds.map((bed) => (
            <BedCard
              key={bed.id}
              bed={bed}
              roomNumber={roomNumber}
              compact={compact}
              selectable={bed.status === 'available'}
              selected={selectedBed?.id === bed.id}
              onSelect={handleSelect}
            />
          ))}
        </div>
      )}

      {/* Lit sélectionné */}
      {selectedBed && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <span className="text-2xl">✓</span>
              <div>
                <div className="font-semibold text-blue-900 dark:text-blue-100">
                  Lit sélectionné
                </div>
                <div className="text-sm text-blue-700 dark:text-blue-300">
                  {roomNumber ? `${roomNumber}-${selectedBed.number}` : `Lit ${selectedBed.number}`}
                  {selectedBed.description && ` - ${selectedBed.description}`}
                </div>
              </div>
            </div>
            <button
              onClick={() => {
                setSelectedBed(null);
                onSelect(null as any);
              }}
              className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200 text-sm font-medium"
            >
              Changer
            </button>
          </div>
        </div>
      )}

      {/* Aide */}
      {!loading && filteredBeds.length > 0 && !selectedBed && (
        <div className="text-center text-sm text-gray-500 dark:text-gray-400">
          Cliquez sur un lit disponible (🟢) pour le sélectionner
        </div>
      )}
    </div>
  );
};

/**
 * FICHIER: apps/web/src/components/housing/BedsTab.tsx
 * COMPOSANT: Onglet de gestion des lits
 *
 * DESCRIPTION:
 * Onglet principal pour la gestion des lits dans le module Housing
 * Affichage en grille, filtres, statistiques, et actions de gestion
 *
 * FONCTIONNALITÉS:
 * - Liste des lits avec filtres (statut, chambre, complexe)
 * - Statistiques temps réel (disponibles, occupés, maintenance)
 * - Génération automatique de lits pour une chambre
 * - Changement de statut en masse
 * - Création, modification, suppression de lits
 * - Vue en grille ou liste
 *
 * AUTEUR: Équipe CROU
 * DATE: Janvier 2025
 */

import React, { useState, useEffect } from 'react';
import { useBeds } from '@/hooks/useBeds';
import { BedCard } from './BedCard';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Alert } from '@/components/ui/Alert';
import { BedStatus } from '@/services/api/bedService';

interface BedsTabProps {
  roomId?: string;
  complexId?: string;
}

export const BedsTab: React.FC<BedsTabProps> = ({ roomId, complexId }) => {
  const {
    beds,
    stats,
    loading,
    error,
    total,
    loadBeds,
    loadBedsByRoom,
    loadBedsByComplex,
    loadGlobalStats,
    loadStatsByRoom,
    loadStatsByComplex,
    generateBedsForRoom,
    setMaintenance,
    setAvailable,
    setOutOfService,
    deleteBed,
    refresh
  } = useBeds();

  // État local
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [filterStatus, setFilterStatus] = useState<BedStatus | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [generateRoomId, setGenerateRoomId] = useState('');
  const [generateCapacity, setGenerateCapacity] = useState(4);

  // Charger les données au montage
  useEffect(() => {
    if (roomId) {
      loadBedsByRoom(roomId);
      loadStatsByRoom(roomId);
    } else if (complexId) {
      loadBedsByComplex(complexId);
      loadStatsByComplex(complexId);
    } else {
      loadBeds();
      loadGlobalStats();
    }
  }, [roomId, complexId]);

  // Filtrer les lits
  const filteredBeds = beds.filter(bed => {
    // Filtre par statut
    if (filterStatus !== 'all' && bed.status !== filterStatus) {
      return false;
    }

    // Filtre par recherche (numéro ou description)
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        bed.number.toLowerCase().includes(query) ||
        bed.description?.toLowerCase().includes(query)
      );
    }

    return true;
  });

  // Gérer le changement de statut
  const handleStatusChange = async (bedId: string, newStatus: BedStatus) => {
    try {
      switch (newStatus) {
        case 'maintenance':
          await setMaintenance(bedId, 'Maintenance programmée');
          break;
        case 'available':
          await setAvailable(bedId);
          break;
        case 'out_of_service':
          await setOutOfService(bedId, 'Hors service');
          break;
      }
      await refresh();
    } catch (err) {
      console.error('Error changing status:', err);
    }
  };

  // Générer les lits
  const handleGenerateBeds = async () => {
    if (!generateRoomId || generateCapacity < 1) {
      return;
    }

    try {
      await generateBedsForRoom(generateRoomId, generateCapacity);
      setShowGenerateModal(false);
      setGenerateRoomId('');
      setGenerateCapacity(4);
      await refresh();
    } catch (err) {
      console.error('Error generating beds:', err);
    }
  };

  // Gérer la suppression
  const handleDelete = async (bedId: string) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer ce lit ?')) {
      await deleteBed(bedId);
    }
  };

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Gestion des Lits
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {total} lit{total > 1 ? 's' : ''} au total
          </p>
        </div>

        <div className="flex items-center space-x-2">
          {/* Toggle vue */}
          <div className="flex border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden">
            <button
              onClick={() => setViewMode('grid')}
              className={`px-3 py-2 text-sm ${
                viewMode === 'grid'
                  ? 'bg-blue-500 text-white'
                  : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300'
              }`}
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM11 13a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-2 text-sm ${
                viewMode === 'list'
                  ? 'bg-blue-500 text-white'
                  : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300'
              }`}
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          </div>

          <Button variant="primary" onClick={() => setShowGenerateModal(true)}>
            ➕ Générer des lits
          </Button>
        </div>
      </div>

      {/* Statistiques */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="text-sm font-medium text-gray-500 dark:text-gray-400">Total</div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
              {stats.total}
            </div>
          </div>

          <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border border-green-200 dark:border-green-800">
            <div className="flex items-center justify-between">
              <div className="text-sm font-medium text-green-700 dark:text-green-300">
                Disponibles
              </div>
              <span className="text-2xl">🟢</span>
            </div>
            <div className="text-2xl font-bold text-green-900 dark:text-green-100 mt-1">
              {stats.available}
            </div>
          </div>

          <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg border border-red-200 dark:border-red-800">
            <div className="flex items-center justify-between">
              <div className="text-sm font-medium text-red-700 dark:text-red-300">
                Occupés
              </div>
              <span className="text-2xl">🔴</span>
            </div>
            <div className="text-2xl font-bold text-red-900 dark:text-red-100 mt-1">
              {stats.occupied}
            </div>
          </div>

          <div className="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-lg border border-orange-200 dark:border-orange-800">
            <div className="flex items-center justify-between">
              <div className="text-sm font-medium text-orange-700 dark:text-orange-300">
                Maintenance
              </div>
              <span className="text-2xl">🟠</span>
            </div>
            <div className="text-2xl font-bold text-orange-900 dark:text-orange-100 mt-1">
              {stats.maintenance}
            </div>
          </div>

          <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Taux d'occupation
              </div>
              <span className="text-2xl">📊</span>
            </div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
              {stats.occupancyRate}%
            </div>
          </div>
        </div>
      )}

      {/* Filtres */}
      <div className="flex items-center space-x-4 bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
        {/* Recherche */}
        <div className="flex-1">
          <Input
            type="text"
            placeholder="Rechercher par numéro ou description..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full"
          />
        </div>

        {/* Filtre statut */}
        <div className="flex items-center space-x-2">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Statut:</span>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as BedStatus | 'all')}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value="all">Tous</option>
            <option value="available">🟢 Disponibles</option>
            <option value="occupied">🔴 Occupés</option>
            <option value="maintenance">🟠 Maintenance</option>
            <option value="out_of_service">⚫ Hors service</option>
          </select>
        </div>
      </div>

      {/* Erreur */}
      {error && (
        <Alert variant="error">
          {error}
        </Alert>
      )}

      {/* Loading */}
      {loading && (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          <p className="text-gray-600 dark:text-gray-400 mt-4">Chargement des lits...</p>
        </div>
      )}

      {/* Liste des lits */}
      {!loading && filteredBeds.length === 0 && (
        <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          <p className="text-gray-600 dark:text-gray-400">Aucun lit trouvé</p>
        </div>
      )}

      {!loading && filteredBeds.length > 0 && (
        <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4' : 'space-y-4'}>
          {filteredBeds.map((bed) => (
            <BedCard
              key={bed.id}
              bed={bed}
              onStatusChange={handleStatusChange}
              onDelete={handleDelete}
              compact={viewMode === 'list'}
            />
          ))}
        </div>
      )}

      {/* Modal de génération */}
      {showGenerateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Générer des lits automatiquement
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  ID de la chambre
                </label>
                <Input
                  type="text"
                  placeholder="UUID de la chambre"
                  value={generateRoomId}
                  onChange={(e) => setGenerateRoomId(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Nombre de lits (capacité)
                </label>
                <Input
                  type="number"
                  min="1"
                  max="20"
                  value={generateCapacity}
                  onChange={(e) => setGenerateCapacity(parseInt(e.target.value))}
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Les lits seront nommés A, B, C, D... jusqu'à la capacité indiquée
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end space-x-3 mt-6">
              <Button
                variant="outline"
                onClick={() => {
                  setShowGenerateModal(false);
                  setGenerateRoomId('');
                  setGenerateCapacity(4);
                }}
              >
                Annuler
              </Button>
              <Button
                variant="primary"
                onClick={handleGenerateBeds}
                disabled={!generateRoomId || generateCapacity < 1}
              >
                Générer {generateCapacity} lit{generateCapacity > 1 ? 's' : ''}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

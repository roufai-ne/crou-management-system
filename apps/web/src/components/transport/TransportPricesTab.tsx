/**
 * FICHIER: apps/web/src/components/transport/TransportPricesTab.tsx
 * COMPOSANT: TransportPricesTab - Gestion des tarifs de tickets transport
 *
 * DESCRIPTION:
 * Interface admin pour gérer les tarifs configurables
 * CRUD complet + activation/désactivation + définition par défaut
 *
 * AUTEUR: Équipe CROU - Module Transport
 * DATE: Janvier 2025
 */

import React, { useState } from 'react';
import { useTransportPrices } from '@/hooks/useTransportPrices';
import {
  TicketPriceCategory,
  CreatePriceRequest,
  UpdatePriceRequest,
  TransportTicketPrice
} from '@/services/api/transportPriceService';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import toast from 'react-hot-toast';
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  CheckCircleIcon,
  XCircleIcon,
  StarIcon
} from '@heroicons/react/24/outline';
import { StarIcon as StarSolidIcon } from '@heroicons/react/24/solid';

// ========================================
// INTERFACES
// ========================================

interface PriceFormData {
  category: TicketPriceCategory;
  name: string;
  description: string;
  amount: number;
  isDefault: boolean;
  displayOrder: number;
  conditions: {
    requiresProof: boolean;
    proofType: string;
    notes: string;
  };
}

// ========================================
// COMPOSANT PRINCIPAL
// ========================================

export const TransportPricesTab: React.FC = () => {
  const {
    prices,
    statistics,
    loading,
    createPrice,
    updatePrice,
    setAsDefault,
    activatePrice,
    deactivatePrice,
    deletePrice,
    refresh
  } = useTransportPrices();

  const [showModal, setShowModal] = useState(false);
  const [editingPrice, setEditingPrice] = useState<TransportTicketPrice | null>(null);
  const [formData, setFormData] = useState<PriceFormData>(getInitialFormData());

  // ========================================
  // HANDLERS
  // ========================================

  function getInitialFormData(): PriceFormData {
    return {
      category: TicketPriceCategory.STANDARD,
      name: '',
      description: '',
      amount: 0,
      isDefault: false,
      displayOrder: 0,
      conditions: {
        requiresProof: false,
        proofType: '',
        notes: ''
      }
    };
  }

  const handleOpenCreate = () => {
    setEditingPrice(null);
    setFormData(getInitialFormData());
    setShowModal(true);
  };

  const handleOpenEdit = (price: TransportTicketPrice) => {
    setEditingPrice(price);
    setFormData({
      category: price.category,
      name: price.name,
      description: price.description || '',
      amount: price.amount,
      isDefault: price.isDefault,
      displayOrder: price.displayOrder,
      conditions: {
        requiresProof: price.conditions?.requiresProof || false,
        proofType: price.conditions?.proofType || '',
        notes: price.conditions?.notes || ''
      }
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (editingPrice) {
        const updateData: UpdatePriceRequest = {
          name: formData.name,
          description: formData.description,
          amount: formData.amount,
          isDefault: formData.isDefault,
          displayOrder: formData.displayOrder,
          conditions: formData.conditions
        };
        await updatePrice(editingPrice.id, updateData);
      } else {
        const createData: CreatePriceRequest = {
          category: formData.category,
          name: formData.name,
          description: formData.description,
          amount: formData.amount,
          isDefault: formData.isDefault,
          displayOrder: formData.displayOrder,
          conditions: formData.conditions
        };
        await createPrice(createData);
      }
      setShowModal(false);
    } catch (error) {
      console.error('Erreur soumission formulaire:', error);
    }
  };

  const handleSetDefault = async (id: string) => {
    if (window.confirm('Définir ce tarif comme tarif par défaut ?')) {
      try {
        await setAsDefault(id);
      } catch (error) {
        console.error('Erreur définition défaut:', error);
      }
    }
  };

  const handleToggleActive = async (price: TransportTicketPrice) => {
    try {
      if (price.isActive) {
        await deactivatePrice(price.id);
      } else {
        await activatePrice(price.id);
      }
    } catch (error) {
      console.error('Erreur activation/désactivation:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce tarif ? Cette action est irréversible.')) {
      try {
        await deletePrice(id);
      } catch (error) {
        console.error('Erreur suppression:', error);
      }
    }
  };

  // ========================================
  // HELPERS
  // ========================================

  const getCategoryLabel = (category: TicketPriceCategory): string => {
    const labels: Record<TicketPriceCategory, string> = {
      [TicketPriceCategory.STANDARD]: 'Standard',
      [TicketPriceCategory.BOURSIER]: 'Boursier',
      [TicketPriceCategory.REDUIT]: 'Réduit',
      [TicketPriceCategory.PERSONNEL]: 'Personnel',
      [TicketPriceCategory.EXTERNE]: 'Externe'
    };
    return labels[category];
  };

  const getCategoryColor = (category: TicketPriceCategory): string => {
    const colors: Record<TicketPriceCategory, string> = {
      [TicketPriceCategory.STANDARD]: 'blue',
      [TicketPriceCategory.BOURSIER]: 'green',
      [TicketPriceCategory.REDUIT]: 'yellow',
      [TicketPriceCategory.PERSONNEL]: 'purple',
      [TicketPriceCategory.EXTERNE]: 'gray'
    };
    return colors[category];
  };

  const formatAmount = (amount: number): string => {
    return `${amount.toLocaleString('fr-FR')} XOF`;
  };

  // ========================================
  // RENDER
  // ========================================

  if (loading && prices.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        <span className="ml-3 text-gray-600">Chargement des tarifs...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header avec statistiques */}
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Gestion des Tarifs</h2>
          <p className="mt-1 text-sm text-gray-600">
            Configurez les différents tarifs de tickets transport
          </p>
        </div>
        <Button onClick={handleOpenCreate} disabled={loading}>
          <PlusIcon className="h-5 w-5 mr-2" />
          Nouveau Tarif
        </Button>
      </div>

      {/* Statistiques */}
      {statistics && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-sm font-medium text-gray-600">Total Tarifs</div>
            <div className="mt-2 text-3xl font-bold text-gray-900">
              {statistics.summary.totalPrices}
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-sm font-medium text-gray-600">Tarifs Actifs</div>
            <div className="mt-2 text-3xl font-bold text-green-600">
              {statistics.summary.activePrices}
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-sm font-medium text-gray-600">Tickets Émis</div>
            <div className="mt-2 text-3xl font-bold text-blue-600">
              {statistics.summary.totalTickets.toLocaleString('fr-FR')}
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-sm font-medium text-gray-600">Revenu Total</div>
            <div className="mt-2 text-3xl font-bold text-purple-600">
              {formatAmount(statistics.summary.totalRevenue)}
            </div>
          </div>
        </div>
      )}

      {/* Liste des tarifs */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Tarif
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Catégorie
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Montant
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Tickets Émis
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Revenu
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Statut
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {prices.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                  Aucun tarif configuré. Créez votre premier tarif.
                </td>
              </tr>
            ) : (
              prices.map((price) => (
                <tr key={price.id} className={!price.isActive ? 'bg-gray-50' : ''}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {price.isDefault && (
                        <StarSolidIcon className="h-5 w-5 text-yellow-400 mr-2" />
                      )}
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {price.name}
                        </div>
                        {price.description && (
                          <div className="text-sm text-gray-500">
                            {price.description}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Badge color={getCategoryColor(price.category)}>
                      {getCategoryLabel(price.category)}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-semibold text-gray-900">
                      {formatAmount(price.amount)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {price.totalTicketsIssued.toLocaleString('fr-FR')}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {formatAmount(price.totalRevenue)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Badge color={price.isActive ? 'green' : 'gray'}>
                      {price.isActive ? 'Actif' : 'Inactif'}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end space-x-2">
                      {!price.isDefault && price.isActive && (
                        <button
                          onClick={() => handleSetDefault(price.id)}
                          className="text-yellow-600 hover:text-yellow-900"
                          title="Définir par défaut"
                        >
                          <StarIcon className="h-5 w-5" />
                        </button>
                      )}
                      <button
                        onClick={() => handleToggleActive(price)}
                        className={`${
                          price.isActive
                            ? 'text-red-600 hover:text-red-900'
                            : 'text-green-600 hover:text-green-900'
                        }`}
                        title={price.isActive ? 'Désactiver' : 'Activer'}
                      >
                        {price.isActive ? (
                          <XCircleIcon className="h-5 w-5" />
                        ) : (
                          <CheckCircleIcon className="h-5 w-5" />
                        )}
                      </button>
                      <button
                        onClick={() => handleOpenEdit(price)}
                        className="text-blue-600 hover:text-blue-900"
                        title="Modifier"
                      >
                        <PencilIcon className="h-5 w-5" />
                      </button>
                      {price.totalTicketsIssued === 0 && !price.isDefault && (
                        <button
                          onClick={() => handleDelete(price.id)}
                          className="text-red-600 hover:text-red-900"
                          title="Supprimer"
                        >
                          <TrashIcon className="h-5 w-5" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal Création/Édition */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editingPrice ? 'Modifier le Tarif' : 'Nouveau Tarif'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Catégorie */}
          {!editingPrice && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Catégorie *
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value as TicketPriceCategory })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                required
              >
                {Object.values(TicketPriceCategory).map((cat) => (
                  <option key={cat} value={cat}>
                    {getCategoryLabel(cat)}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Nom */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nom du Tarif *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="Ex: Tarif Standard Étudiants"
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              rows={2}
              placeholder="Description optionnelle"
            />
          </div>

          {/* Montant */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Montant (XOF) *
            </label>
            <input
              type="number"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              min="0"
              step="1"
              required
            />
          </div>

          {/* Ordre d'affichage */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Ordre d'affichage
            </label>
            <input
              type="number"
              value={formData.displayOrder}
              onChange={(e) => setFormData({ ...formData, displayOrder: parseInt(e.target.value) || 0 })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              min="0"
            />
            <p className="mt-1 text-xs text-gray-500">
              Les tarifs sont affichés par ordre croissant (0 = premier)
            </p>
          </div>

          {/* Tarif par défaut */}
          <div className="flex items-center">
            <input
              type="checkbox"
              id="isDefault"
              checked={formData.isDefault}
              onChange={(e) => setFormData({ ...formData, isDefault: e.target.checked })}
              className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
            />
            <label htmlFor="isDefault" className="ml-2 block text-sm text-gray-900">
              Définir comme tarif par défaut
            </label>
          </div>

          {/* Conditions */}
          <div className="border-t pt-4">
            <h4 className="text-sm font-medium text-gray-900 mb-3">Conditions d'application</h4>

            <div className="space-y-3">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="requiresProof"
                  checked={formData.conditions.requiresProof}
                  onChange={(e) => setFormData({
                    ...formData,
                    conditions: { ...formData.conditions, requiresProof: e.target.checked }
                  })}
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                />
                <label htmlFor="requiresProof" className="ml-2 block text-sm text-gray-900">
                  Justificatif requis
                </label>
              </div>

              {formData.conditions.requiresProof && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Type de justificatif
                  </label>
                  <input
                    type="text"
                    value={formData.conditions.proofType}
                    onChange={(e) => setFormData({
                      ...formData,
                      conditions: { ...formData.conditions, proofType: e.target.value }
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="Ex: Certificat de scolarité, Carte d'étudiant"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notes
                </label>
                <textarea
                  value={formData.conditions.notes}
                  onChange={(e) => setFormData({
                    ...formData,
                    conditions: { ...formData.conditions, notes: e.target.value }
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  rows={2}
                  placeholder="Notes internes sur ce tarif"
                />
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-3 pt-4 border-t">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setShowModal(false)}
            >
              Annuler
            </Button>
            <Button type="submit" disabled={loading}>
              {editingPrice ? 'Enregistrer' : 'Créer'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default TransportPricesTab;

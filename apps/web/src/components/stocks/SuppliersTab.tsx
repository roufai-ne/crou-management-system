/**
 * FICHIER: apps/web/src/components/stocks/SuppliersTab.tsx
 * COMPONENT: SuppliersTab - Gestion des fournisseurs
 *
 * DESCRIPTION:
 * Composant pour la gestion des fournisseurs dans la page stocks
 *
 * AUTEUR: Équipe CROU
 * DATE: Janvier 2025
 */

import React, { useState, useEffect } from 'react';
import { Card, Button, Table, Modal, Input, NativeSelect, Badge } from '@/components/ui';
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
  StarIcon,
  CheckBadgeIcon
} from '@heroicons/react/24/outline';
import {
  StarIcon as StarIconSolid,
  CheckBadgeIcon as CheckBadgeIconSolid
} from '@heroicons/react/24/solid';
import {
  suppliersService,
  Supplier,
  SupplierType,
  SupplierStatus,
  CreateSupplierRequest,
  UpdateSupplierRequest
} from '@/services/api/suppliersService';

interface SuppliersTabProps {
  onError?: (error: string) => void;
}

export const SuppliersTab: React.FC<SuppliersTabProps> = ({ onError }) => {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<SupplierType | 'all'>('all');
  const [filterStatus, setFilterStatus] = useState<SupplierStatus | 'all'>('all');

  // Form state
  const [formData, setFormData] = useState<Partial<CreateSupplierRequest>>({
    code: '',
    nom: '',
    type: SupplierType.FOURNISSEUR,
    status: SupplierStatus.ACTIF,
    devise: 'XOF',
    delaiPaiement: 30
  });

  // Load suppliers
  useEffect(() => {
    loadSuppliers();
  }, [searchTerm, filterType, filterStatus]);

  const loadSuppliers = async () => {
    try {
      setLoading(true);
      const filters: any = {};
      if (searchTerm) filters.search = searchTerm;
      if (filterType !== 'all') filters.type = filterType;
      if (filterStatus !== 'all') filters.status = filterStatus;

      const result = await suppliersService.getSuppliers(filters);
      setSuppliers(result.suppliers);
    } catch (error: any) {
      console.error('Erreur chargement fournisseurs:', error);
      onError?.(error.message || 'Erreur lors du chargement des fournisseurs');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    try {
      if (!formData.code || !formData.nom || !formData.type) {
        onError?.('Veuillez remplir tous les champs obligatoires');
        return;
      }

      await suppliersService.createSupplier(formData as CreateSupplierRequest);
      setIsCreateModalOpen(false);
      resetForm();
      loadSuppliers();
    } catch (error: any) {
      console.error('Erreur création fournisseur:', error);
      onError?.(error.message || 'Erreur lors de la création du fournisseur');
    }
  };

  const handleUpdate = async () => {
    try {
      if (!selectedSupplier) return;

      await suppliersService.updateSupplier(selectedSupplier.id, formData as UpdateSupplierRequest);
      setIsEditModalOpen(false);
      setSelectedSupplier(null);
      resetForm();
      loadSuppliers();
    } catch (error: any) {
      console.error('Erreur modification fournisseur:', error);
      onError?.(error.message || 'Erreur lors de la modification du fournisseur');
    }
  };

  const handleDelete = async (supplier: Supplier) => {
    if (!confirm(`Êtes-vous sûr de vouloir supprimer le fournisseur "${supplier.nom}" ?`)) {
      return;
    }

    try {
      await suppliersService.deleteSupplier(supplier.id);
      loadSuppliers();
    } catch (error: any) {
      console.error('Erreur suppression fournisseur:', error);
      onError?.(error.message || 'Erreur lors de la suppression du fournisseur');
    }
  };

  const openEditModal = (supplier: Supplier) => {
    setSelectedSupplier(supplier);
    setFormData({
      code: supplier.code,
      nom: supplier.nom,
      nomCommercial: supplier.nomCommercial,
      type: supplier.type,
      status: supplier.status,
      description: supplier.description,
      adresse: supplier.adresse,
      ville: supplier.ville,
      email: supplier.email,
      telephone: supplier.telephone,
      contactPrincipal: supplier.contactPrincipal,
      emailContact: supplier.emailContact,
      telephoneContact: supplier.telephoneContact,
      delaiPaiement: supplier.delaiPaiement,
      devise: supplier.devise,
      isPreference: supplier.isPreference,
      isCertifie: supplier.isCertifie,
      notes: supplier.notes
    });
    setIsEditModalOpen(true);
  };

  const openViewModal = async (supplier: Supplier) => {
    try {
      const detailedSupplier = await suppliersService.getSupplier(supplier.id);
      setSelectedSupplier(detailedSupplier);
      setIsViewModalOpen(true);
    } catch (error: any) {
      console.error('Erreur chargement détails:', error);
      onError?.(error.message || 'Erreur lors du chargement des détails');
    }
  };

  const resetForm = () => {
    setFormData({
      code: '',
      nom: '',
      type: SupplierType.FOURNISSEUR,
      status: SupplierStatus.ACTIF,
      devise: 'XOF',
      delaiPaiement: 30
    });
  };

  const getStatusBadge = (status: SupplierStatus) => {
    const variants: Record<SupplierStatus, 'success' | 'warning' | 'danger' | 'info'> = {
      [SupplierStatus.ACTIF]: 'success',
      [SupplierStatus.INACTIF]: 'warning',
      [SupplierStatus.SUSPENDU]: 'danger',
      [SupplierStatus.BLOQUE]: 'danger'
    };
    return <Badge variant={variants[status]}>{status.toUpperCase()}</Badge>;
  };

  const getTypeLabel = (type: SupplierType) => {
    const labels: Record<SupplierType, string> = {
      [SupplierType.FOURNISSEUR]: 'Fournisseur',
      [SupplierType.PRESTATAIRE]: 'Prestataire',
      [SupplierType.FABRICANT]: 'Fabricant',
      [SupplierType.DISTRIBUTEUR]: 'Distributeur',
      [SupplierType.GROSSISTE]: 'Grossiste',
      [SupplierType.IMPORTATEUR]: 'Importateur'
    };
    return labels[type];
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Fournisseurs</h3>
        <Button
          leftIcon={<PlusIcon className="h-4 w-4" />}
          onClick={() => setIsCreateModalOpen(true)}
        >
          Nouveau Fournisseur
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <Card.Content>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input
              type="search"
              placeholder="Rechercher un fournisseur..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <NativeSelect
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as SupplierType | 'all')}
            >
              <option value="all">Tous les types</option>
              {Object.values(SupplierType).map(type => (
                <option key={type} value={type}>{getTypeLabel(type)}</option>
              ))}
            </NativeSelect>
            <NativeSelect
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as SupplierStatus | 'all')}
            >
              <option value="all">Tous les statuts</option>
              {Object.values(SupplierStatus).map(status => (
                <option key={status} value={status}>{status.toUpperCase()}</option>
              ))}
            </NativeSelect>
          </div>
        </Card.Content>
      </Card>

      {/* Table */}
      <Card>
        <Card.Header>
          <Card.Title>Liste des Fournisseurs ({suppliers.length})</Card.Title>
        </Card.Header>
        <Card.Content>
          {loading ? (
            <div className="text-center py-8">Chargement...</div>
          ) : suppliers.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              Aucun fournisseur trouvé
            </div>
          ) : (
            <Table>
              <Table.Header>
                <Table.Row>
                  <Table.Head>Code</Table.Head>
                  <Table.Head>Nom</Table.Head>
                  <Table.Head>Type</Table.Head>
                  <Table.Head>Contact</Table.Head>
                  <Table.Head>Note</Table.Head>
                  <Table.Head>Statut</Table.Head>
                  <Table.Head className="text-right">Actions</Table.Head>
                </Table.Row>
              </Table.Header>
              <Table.Body>
                {suppliers.map((supplier) => (
                  <Table.Row key={supplier.id}>
                    <Table.Cell className="font-mono">{supplier.code}</Table.Cell>
                    <Table.Cell>
                      <div>
                        <div className="font-medium">{supplier.nom}</div>
                        <div className="text-sm text-gray-500">{supplier.nomCommercial}</div>
                      </div>
                    </Table.Cell>
                    <Table.Cell>
                      <Badge variant="info">{getTypeLabel(supplier.type)}</Badge>
                    </Table.Cell>
                    <Table.Cell>
                      <div className="text-sm">
                        {supplier.telephone && <div>{supplier.telephone}</div>}
                        {supplier.email && <div className="text-gray-500">{supplier.email}</div>}
                      </div>
                    </Table.Cell>
                    <Table.Cell>
                      <div className="flex items-center gap-2">
                        {supplier.noteMoyenne ? (
                          <>
                            <StarIconSolid className="h-4 w-4 text-yellow-400" />
                            <span>{supplier.noteMoyenne.toFixed(1)}</span>
                          </>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                        {supplier.isPreference && (
                          <StarIconSolid className="h-4 w-4 text-blue-500" title="Fournisseur préféré" />
                        )}
                        {supplier.isCertifie && (
                          <CheckBadgeIconSolid className="h-4 w-4 text-green-500" title="Certifié" />
                        )}
                      </div>
                    </Table.Cell>
                    <Table.Cell>{getStatusBadge(supplier.status)}</Table.Cell>
                    <Table.Cell className="text-right">
                      <div className="flex gap-2 justify-end">
                        <Button
                          size="sm"
                          variant="ghost"
                          leftIcon={<EyeIcon className="h-4 w-4" />}
                          onClick={() => openViewModal(supplier)}
                        >
                          Voir
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          leftIcon={<PencilIcon className="h-4 w-4" />}
                          onClick={() => openEditModal(supplier)}
                        >
                          Modifier
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          leftIcon={<TrashIcon className="h-4 w-4" />}
                          onClick={() => handleDelete(supplier)}
                          className="text-red-600 hover:text-red-700"
                        >
                          Supprimer
                        </Button>
                      </div>
                    </Table.Cell>
                  </Table.Row>
                ))}
              </Table.Body>
            </Table>
          )}
        </Card.Content>
      </Card>

      {/* Create Modal */}
      <Modal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} title="Nouveau Fournisseur" size="lg">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Code *"
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value })}
              required
            />
            <Input
              label="Nom *"
              value={formData.nom}
              onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
              required
            />
          </div>
          <Input
            label="Nom Commercial"
            value={formData.nomCommercial || ''}
            onChange={(e) => setFormData({ ...formData, nomCommercial: e.target.value })}
          />
          <NativeSelect
            label="Type *"
            value={formData.type}
            onChange={(e) => setFormData({ ...formData, type: e.target.value as SupplierType })}
            required
          >
            {Object.values(SupplierType).map(type => (
              <option key={type} value={type}>{getTypeLabel(type)}</option>
            ))}
          </NativeSelect>
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Téléphone"
              type="tel"
              value={formData.telephone || ''}
              onChange={(e) => setFormData({ ...formData, telephone: e.target.value })}
            />
            <Input
              label="Email"
              type="email"
              value={formData.email || ''}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
          </div>
          <Input
            label="Adresse"
            value={formData.adresse || ''}
            onChange={(e) => setFormData({ ...formData, adresse: e.target.value })}
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Ville"
              value={formData.ville || ''}
              onChange={(e) => setFormData({ ...formData, ville: e.target.value })}
            />
            <Input
              label="Contact Principal"
              value={formData.contactPrincipal || ''}
              onChange={(e) => setFormData({ ...formData, contactPrincipal: e.target.value })}
            />
          </div>
          <div className="flex gap-4">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.isPreference || false}
                onChange={(e) => setFormData({ ...formData, isPreference: e.target.checked })}
                className="rounded"
              />
              <span>Fournisseur préféré</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.isCertifie || false}
                onChange={(e) => setFormData({ ...formData, isCertifie: e.target.checked })}
                className="rounded"
              />
              <span>Certifié</span>
            </label>
          </div>
        </div>
        <Modal.Footer>
          <Button variant="outline" onClick={() => setIsCreateModalOpen(false)}>Annuler</Button>
          <Button onClick={handleCreate}>Créer</Button>
        </Modal.Footer>
      </Modal>

      {/* Edit Modal - Similar to Create */}
      <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title="Modifier Fournisseur" size="lg">
        <div className="space-y-4">
          {/* Same form fields as create */}
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Code"
              value={formData.code}
              disabled
            />
            <Input
              label="Nom *"
              value={formData.nom}
              onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
            />
          </div>
          <Input
            label="Nom Commercial"
            value={formData.nomCommercial || ''}
            onChange={(e) => setFormData({ ...formData, nomCommercial: e.target.value })}
          />
          <NativeSelect
            label="Type *"
            value={formData.type}
            onChange={(e) => setFormData({ ...formData, type: e.target.value as SupplierType })}
          >
            {Object.values(SupplierType).map(type => (
              <option key={type} value={type}>{getTypeLabel(type)}</option>
            ))}
          </NativeSelect>
          <NativeSelect
            label="Statut"
            value={formData.status}
            onChange={(e) => setFormData({ ...formData, status: e.target.value as SupplierStatus })}
          >
            {Object.values(SupplierStatus).map(status => (
              <option key={status} value={status}>{status.toUpperCase()}</option>
            ))}
          </NativeSelect>
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Téléphone"
              type="tel"
              value={formData.telephone || ''}
              onChange={(e) => setFormData({ ...formData, telephone: e.target.value })}
            />
            <Input
              label="Email"
              type="email"
              value={formData.email || ''}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
          </div>
          <div className="flex gap-4">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.isPreference || false}
                onChange={(e) => setFormData({ ...formData, isPreference: e.target.checked })}
                className="rounded"
              />
              <span>Fournisseur préféré</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.isCertifie || false}
                onChange={(e) => setFormData({ ...formData, isCertifie: e.target.checked })}
                className="rounded"
              />
              <span>Certifié</span>
            </label>
          </div>
        </div>
        <Modal.Footer>
          <Button variant="outline" onClick={() => setIsEditModalOpen(false)}>Annuler</Button>
          <Button onClick={handleUpdate}>Enregistrer</Button>
        </Modal.Footer>
      </Modal>

      {/* View Modal */}
      <Modal isOpen={isViewModalOpen} onClose={() => setIsViewModalOpen(false)} title="Détails Fournisseur" size="lg">
        {selectedSupplier && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700">Code</label>
                <p className="mt-1 font-mono">{selectedSupplier.code}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Nom</label>
                <p className="mt-1">{selectedSupplier.nom}</p>
              </div>
            </div>
            {selectedSupplier.nomCommercial && (
              <div>
                <label className="text-sm font-medium text-gray-700">Nom Commercial</label>
                <p className="mt-1">{selectedSupplier.nomCommercial}</p>
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700">Type</label>
                <p className="mt-1">{getTypeLabel(selectedSupplier.type)}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Statut</label>
                <p className="mt-1">{getStatusBadge(selectedSupplier.status)}</p>
              </div>
            </div>
            {selectedSupplier.description && (
              <div>
                <label className="text-sm font-medium text-gray-700">Description</label>
                <p className="mt-1 text-gray-600">{selectedSupplier.description}</p>
              </div>
            )}
            <div className="border-t pt-4">
              <h4 className="font-medium mb-3">Coordonnées</h4>
              <div className="space-y-2">
                {selectedSupplier.adresse && <p><span className="font-medium">Adresse:</span> {selectedSupplier.adresse}</p>}
                {selectedSupplier.ville && <p><span className="font-medium">Ville:</span> {selectedSupplier.ville}</p>}
                {selectedSupplier.telephone && <p><span className="font-medium">Téléphone:</span> {selectedSupplier.telephone}</p>}
                {selectedSupplier.email && <p><span className="font-medium">Email:</span> {selectedSupplier.email}</p>}
              </div>
            </div>
            {(selectedSupplier.contactPrincipal || selectedSupplier.emailContact) && (
              <div className="border-t pt-4">
                <h4 className="font-medium mb-3">Contact Principal</h4>
                <div className="space-y-2">
                  {selectedSupplier.contactPrincipal && <p><span className="font-medium">Nom:</span> {selectedSupplier.contactPrincipal}</p>}
                  {selectedSupplier.emailContact && <p><span className="font-medium">Email:</span> {selectedSupplier.emailContact}</p>}
                  {selectedSupplier.telephoneContact && <p><span className="font-medium">Téléphone:</span> {selectedSupplier.telephoneContact}</p>}
                </div>
              </div>
            )}
            {selectedSupplier.noteMoyenne && (
              <div className="border-t pt-4">
                <h4 className="font-medium mb-3">Évaluation</h4>
                <div className="flex items-center gap-2">
                  <StarIconSolid className="h-5 w-5 text-yellow-400" />
                  <span className="text-lg font-medium">{selectedSupplier.noteMoyenne.toFixed(1)} / 5</span>
                </div>
              </div>
            )}
          </div>
        )}
        <Modal.Footer>
          <Button onClick={() => setIsViewModalOpen(false)}>Fermer</Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

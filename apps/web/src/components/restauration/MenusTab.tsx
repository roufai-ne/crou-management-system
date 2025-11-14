/**
 * FICHIER: apps/web/src/components/restauration/MenusTab.tsx
 * COMPOSANT: MenusTab - Gestion des menus
 *
 * DESCRIPTION:
 * Gestion complète des menus avec composition des plats
 * Planification, publication et validation des menus
 *
 * FONCTIONNALITÉS:
 * - Liste des menus avec filtres
 * - Création de menus avec composition de plats
 * - Calcul automatique des besoins en denrées
 * - Workflow de validation (BROUILLON → PUBLIE → VALIDE)
 * - Calendrier de planification
 *
 * AUTEUR: Équipe CROU
 * DATE: Janvier 2025
 */

import React, { useState } from 'react';
import { Card, Badge, Button, Table, Modal, Input, Select, DateInput, useConfirmDialog } from '@/components/ui';
import {
  PlusIcon,
  MagnifyingGlassIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
  CheckIcon,
  DocumentTextIcon,
  CalendarIcon
} from '@heroicons/react/24/outline';
import { useMenus } from '@/hooks/useRestauration';
import { Menu, MenuStatus, TypeRepas } from '@/services/api/restaurationService';
import { TableSkeleton } from './skeletons';
import toast from 'react-hot-toast';

export const MenusTab: React.FC = () => {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedMenu, setSelectedMenu] = useState<Menu | null>(null);

  const {
    menus,
    loading,
    error,
    filters,
    setFilters,
    createMenu,
    publishMenu,
    validateMenu,
    deleteMenu,
    refresh
  } = useMenus();

  const { ConfirmDialog, confirm } = useConfirmDialog();

  const handlePublish = async (menuId: string) => {
    const confirmed = await confirm({
      title: 'Publier ce menu ?',
      message: 'Le menu sera visible pour tous les restaurants et pourra être utilisé pour les services.',
      variant: 'info',
      confirmText: 'Publier',
      cancelText: 'Annuler',
    });

    if (!confirmed) return;

    try {
      await publishMenu(menuId);
      toast.success('Menu publié avec succès');
      refresh();
    } catch (err) {
      console.error('Erreur publication menu:', err);
      toast.error('Erreur lors de la publication du menu');
    }
  };

  const handleValidate = async (menuId: string) => {
    const confirmed = await confirm({
      title: 'Valider ce menu ?',
      message: 'Cette action est irréversible. Le menu sera définitivement validé et ne pourra plus être modifié.',
      variant: 'warning',
      confirmText: 'Valider',
      cancelText: 'Annuler',
    });

    if (!confirmed) return;

    try {
      await validateMenu(menuId);
      toast.success('Menu validé avec succès');
      refresh();
    } catch (err) {
      console.error('Erreur validation menu:', err);
      toast.error('Erreur lors de la validation du menu');
    }
  };

  const handleDelete = async (menuId: string) => {
    const confirmed = await confirm({
      title: 'Supprimer ce menu ?',
      message: 'Cette action est irréversible. Toutes les données du menu seront définitivement supprimées.',
      variant: 'danger',
      confirmText: 'Supprimer',
      cancelText: 'Annuler',
    });

    if (!confirmed) return;

    try {
      await deleteMenu(menuId);
      toast.success('Menu supprimé avec succès');
      refresh();
    } catch (err) {
      console.error('Erreur suppression menu:', err);
      toast.error('Erreur lors de la suppression du menu');
    }
  };

  const getStatusBadge = (status: MenuStatus) => {
    switch (status) {
      case MenuStatus.BROUILLON:
        return <Badge variant="secondary">Brouillon</Badge>;
      case MenuStatus.PUBLIE:
        return <Badge variant="primary">Publié</Badge>;
      case MenuStatus.VALIDE:
        return <Badge variant="success">Validé</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getTypeRepasLabel = (type: TypeRepas) => {
    switch (type) {
      case TypeRepas.PETIT_DEJEUNER:
        return 'Petit Déjeuner';
      case TypeRepas.DEJEUNER:
        return 'Déjeuner';
      case TypeRepas.DINER:
        return 'Dîner';
      case TypeRepas.GOUTER:
        return 'Goûter';
      default:
        return type;
    }
  };

  const columns = [
    {
      key: 'titre',
      label: 'Menu',
      render: (menu: Menu) => (
        <div>
          <p className="font-medium">{menu.titre}</p>
          <p className="text-sm text-gray-500 dark:text-gray-400">{menu.restaurant?.nom}</p>
        </div>
      )
    },
    {
      key: 'date',
      label: 'Date',
      render: (menu: Menu) => (
        <div>
          <p className="font-medium">{new Date(menu.dateMenu).toLocaleDateString()}</p>
          <p className="text-sm text-gray-500 dark:text-gray-400">{getTypeRepasLabel(menu.typeRepas)}</p>
        </div>
      )
    },
    {
      key: 'plats',
      label: 'Plats',
      render: (menu: Menu) => (
        <div>
          <p className="font-medium">{menu.plats?.length || 0} plat(s)</p>
          {menu.plats && menu.plats.length > 0 && (
            <p className="text-sm text-gray-500 dark:text-gray-400">{menu.plats[0].nom}</p>
          )}
        </div>
      )
    },
    {
      key: 'couts',
      label: 'Coûts',
      render: (menu: Menu) => (
        <div className="text-right">
          <p className="font-medium">{(menu.coutMatierePremiere || 0).toLocaleString()} XOF</p>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {(menu.coutUnitaire || 0).toLocaleString()} XOF/pers
          </p>
        </div>
      )
    },
    {
      key: 'rationnaires',
      label: 'Rationnaires',
      render: (menu: Menu) => (
        <div className="text-right">
          <p className="font-medium">{menu.nombreRationnaires || 0}</p>
        </div>
      )
    },
    {
      key: 'status',
      label: 'Statut',
      render: (menu: Menu) => getStatusBadge(menu.status)
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (menu: Menu) => (
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            leftIcon={<EyeIcon className="h-4 w-4" />}
            onClick={() => {
              setSelectedMenu(menu);
              setIsDetailModalOpen(true);
            }}
          >
            Voir
          </Button>
          {menu.status === MenuStatus.BROUILLON && (
            <Button
              size="sm"
              variant="outline"
              leftIcon={<CheckIcon className="h-4 w-4" />}
              onClick={() => handlePublish(menu.id)}
            >
              Publier
            </Button>
          )}
          {menu.status === MenuStatus.PUBLIE && (
            <Button
              size="sm"
              variant="primary"
              leftIcon={<CheckIcon className="h-4 w-4" />}
              onClick={() => handleValidate(menu.id)}
            >
              Valider
            </Button>
          )}
          {menu.status === MenuStatus.BROUILLON && (
            <Button
              size="sm"
              variant="outline"
              leftIcon={<TrashIcon className="h-4 w-4" />}
              className="text-red-600 hover:text-red-700"
              onClick={() => handleDelete(menu.id)}
            >
              Supprimer
            </Button>
          )}
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6">
      {/* Filtres et actions */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex flex-col sm:flex-row gap-4 flex-1">
          <Input
            placeholder="Rechercher un menu..."
            value={filters.search || ''}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            leftIcon={<MagnifyingGlassIcon className="h-4 w-4" />}
            className="w-full sm:w-80"
          />
          <Select
            value={filters.status || ''}
            onChange={(value) => setFilters({ ...filters, status: String(value) })}
            options={[
              { value: '', label: 'Tous les statuts' },
              { value: MenuStatus.BROUILLON, label: 'Brouillon' },
              { value: MenuStatus.PUBLIE, label: 'Publié' },
              { value: MenuStatus.VALIDE, label: 'Validé' }
            ]}
            className="w-full sm:w-48"
          />
          <Select
            value={filters.typeRepas || ''}
            onChange={(value) => setFilters({ ...filters, typeRepas: String(value) })}
            options={[
              { value: '', label: 'Tous les types' },
              { value: TypeRepas.PETIT_DEJEUNER, label: 'Petit Déjeuner' },
              { value: TypeRepas.DEJEUNER, label: 'Déjeuner' },
              { value: TypeRepas.DINER, label: 'Dîner' },
              { value: TypeRepas.GOUTER, label: 'Goûter' }
            ]}
            className="w-full sm:w-48"
          />
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            leftIcon={<CalendarIcon className="h-4 w-4" />}
          >
            Calendrier
          </Button>
          <Button
            onClick={() => setIsCreateModalOpen(true)}
            leftIcon={<PlusIcon className="h-4 w-4" />}
          >
            Nouveau Menu
          </Button>
        </div>
      </div>

      {/* Tableau des menus */}
      <Card>
        <Card.Header>
          <Card.Title className="flex items-center gap-2">
            <DocumentTextIcon className="h-5 w-5" />
            Menus ({menus?.length || 0})
          </Card.Title>
        </Card.Header>
        <Card.Content>
          {loading ? (
            <TableSkeleton rows={6} columns={7} />
          ) : (
            <Table
              data={menus || []}
              columns={columns}
              emptyMessage="Aucun menu trouvé"
            />
          )}
        </Card.Content>
      </Card>

      {/* Modal Détails */}
      <Modal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        title="Détails du Menu"
        size="xl"
      >
        {selectedMenu && (
          <div className="space-y-6">
            {/* En-tête */}
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-2xl font-bold">{selectedMenu.titre}</h3>
                <p className="text-gray-600 mt-1">
                  {selectedMenu.restaurant?.nom} - {new Date(selectedMenu.dateMenu).toLocaleDateString()} - {getTypeRepasLabel(selectedMenu.typeRepas)}
                </p>
              </div>
              {getStatusBadge(selectedMenu.status)}
            </div>

            {/* Description */}
            {selectedMenu.description && (
              <div>
                <h4 className="font-semibold mb-2">Description</h4>
                <p className="text-gray-700 dark:text-gray-300">{selectedMenu.description}</p>
              </div>
            )}

            {/* Plats */}
            {selectedMenu.plats && selectedMenu.plats.length > 0 && (
              <div>
                <h4 className="font-semibold mb-3">Composition du Menu</h4>
                <div className="space-y-3">
                  {selectedMenu.plats.map((plat: any, index: number) => (
                    <Card key={index}>
                      <Card.Content className="p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h5 className="font-semibold">{plat.nom}</h5>
                            {plat.description && (
                              <p className="text-sm text-gray-600 mt-1">{plat.description}</p>
                            )}
                            {plat.categorieApport && (
                              <Badge variant="secondary" className="mt-2">{plat.categorieApport}</Badge>
                            )}
                          </div>
                        </div>

                        {/* Ingrédients */}
                        {plat.ingredients && plat.ingredients.length > 0 && (
                          <div className="mt-3">
                            <p className="text-sm font-medium text-gray-700 mb-2">Ingrédients:</p>
                            <div className="bg-gray-50 rounded p-3">
                              <table className="w-full text-sm">
                                <thead>
                                  <tr className="text-left text-gray-600 dark:text-gray-400">
                                    <th>Denrée</th>
                                    <th className="text-right">Quantité/pers</th>
                                    <th className="text-right">Coût unitaire</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {plat.ingredients.map((ing: any, idx: number) => (
                                    <tr key={idx} className="border-t border-gray-200 dark:border-gray-700">
                                      <td className="py-1">{ing.nomDenree}</td>
                                      <td className="text-right">{ing.quantiteUnitaire} {ing.unite}</td>
                                      <td className="text-right">{ing.coutUnitaire.toLocaleString()} XOF</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        )}
                      </Card.Content>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Informations financières */}
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-blue-50 p-4 rounded">
                <p className="text-sm text-gray-600 dark:text-gray-400">Coût Matière Première</p>
                <p className="text-2xl font-bold text-blue-700">
                  {(selectedMenu.coutMatierePremiere || 0).toLocaleString()} XOF
                </p>
              </div>
              <div className="bg-green-50 p-4 rounded">
                <p className="text-sm text-gray-600 dark:text-gray-400">Coût Unitaire</p>
                <p className="text-2xl font-bold text-green-700">
                  {(selectedMenu.coutUnitaire || 0).toLocaleString()} XOF
                </p>
              </div>
              <div className="bg-purple-50 p-4 rounded">
                <p className="text-sm text-gray-600 dark:text-gray-400">Rationnaires</p>
                <p className="text-2xl font-bold text-purple-700">
                  {selectedMenu.nombreRationnaires || 0}
                </p>
              </div>
            </div>

            {/* Besoins en denrées */}
            {selectedMenu.besoinsDenrees && selectedMenu.besoinsDenrees.length > 0 && (
              <div>
                <h4 className="font-semibold mb-3">Besoins en Denrées</h4>
                <Card>
                  <Card.Content className="p-4">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-left text-gray-600 border-b">
                          <th className="pb-2">Denrée</th>
                          <th className="text-right pb-2">Quantité Nécessaire</th>
                          <th className="text-right pb-2">Stock Disponible</th>
                          <th className="text-right pb-2">Statut</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedMenu.besoinsDenrees.map((besoin: any, index: number) => (
                          <tr key={index} className="border-b">
                            <td className="py-2">{besoin.nomDenree || besoin.stockId}</td>
                            <td className="text-right">{besoin.quantiteTotale.toLocaleString()}</td>
                            <td className="text-right">{besoin.stockDisponible.toLocaleString()}</td>
                            <td className="text-right">
                              {besoin.suffisant ? (
                                <Badge variant="success">Suffisant</Badge>
                              ) : (
                                <Badge variant="danger">Insuffisant</Badge>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </Card.Content>
                </Card>
              </div>
            )}

            <div className="flex justify-end gap-3 pt-4">
              <Button
                variant="outline"
                onClick={() => setIsDetailModalOpen(false)}
              >
                Fermer
              </Button>
              {selectedMenu.status === MenuStatus.BROUILLON && (
                <>
                  <Button
                    variant="outline"
                    leftIcon={<PencilIcon className="h-4 w-4" />}
                  >
                    Modifier
                  </Button>
                  <Button
                    variant="primary"
                    leftIcon={<CheckIcon className="h-4 w-4" />}
                    onClick={() => {
                      handlePublish(selectedMenu.id);
                      setIsDetailModalOpen(false);
                    }}
                  >
                    Publier
                  </Button>
                </>
              )}
              {selectedMenu.status === MenuStatus.PUBLIE && (
                <Button
                  variant="primary"
                  leftIcon={<CheckIcon className="h-4 w-4" />}
                  onClick={() => {
                    handleValidate(selectedMenu.id);
                    setIsDetailModalOpen(false);
                  }}
                >
                  Valider
                </Button>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* ConfirmDialog */}
      <ConfirmDialog />
    </div>
  );
};

export default MenusTab;

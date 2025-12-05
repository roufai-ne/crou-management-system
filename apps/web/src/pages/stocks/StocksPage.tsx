/**
 * FICHIER: apps/web/src/pages/stocks/StocksPage.tsx
 * PAGE: StocksPage - Gestion des stocks et inventaire
 *
 * DESCRIPTION:
 * Page principale pour la gestion des stocks et inventaires
 * Interface complète avec CRUD, mouvements et alertes
 * Support multi-tenant avec permissions granulaires
 *
 * FONCTIONNALITÉS:
 * - Gestion des articles de stock
 * - Mouvements d'entrée/sortie
 * - Alertes de stock bas
 * - Gestion des fournisseurs
 * - Rapports d'inventaire
 * - Valorisation des stocks
 *
 * AUTEUR: Équipe CROU
 * DATE: Décembre 2024
 */

import React, { useState, useEffect, useMemo } from 'react';
import { Container, Card, Badge, Button, DataTable as Table, Modal, Input, Select, DateInput, Tabs } from '@/components/ui';
import {
  PlusIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  DocumentArrowDownIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
  ExclamationTriangleIcon,
  CubeIcon,
  TruckIcon,
  UserGroupIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '@/stores/auth';
import { useTenantFilter } from '@/hooks/useTenantFilter';
import { TenantFilter } from '@/components/common/TenantFilter';
import { useStockItems, useStockMovements, useStockAlerts, useStocksStatistics } from '@/hooks/useStocks';
import { StockItem, CreateStockItemRequest, StockMovement, StockAlert } from '@/services/api/stocksService';
import { ExportButton } from '@/components/reports/ExportButton';
import { SuppliersTab } from '@/components/stocks/SuppliersTab';
import ModernPagination from '@/components/ui/ModernPagination';
import { toast } from '@/components/ui/Toaster';

export const StocksPage: React.FC = () => {
  const { user } = useAuth();

  // Hook de filtrage tenant
  const {
    selectedTenantId,
    setSelectedTenantId,
    effectiveTenantId,
    canFilterTenant
  } = useTenantFilter();

  const [activeTab, setActiveTab] = useState('items');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isMovementModalOpen, setIsMovementModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<StockItem | null>(null);
  
  // État du formulaire de création d'article
  const [formData, setFormData] = useState<Partial<CreateStockItemRequest>>({
    code: '',
    libelle: '',
    description: '',
    type: 'centralise',
    category: '',
    unit: '',
    quantiteInitiale: 0,
    seuilMinimum: 0,
    seuilMaximum: 0,
    prixUnitaire: 0
  });

  // État du formulaire de mouvement
  const [movementFormData, setMovementFormData] = useState({
    stockId: '',
    type: 'entree' as 'entree' | 'sortie' | 'ajustement' | 'transfert',
    quantite: 0,
    prixUnitaire: 0,
    reference: '',
    description: '',
    motif: '',
    date: new Date().toISOString().split('T')[0]
  });
  
  // États de pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [movementsPage, setMovementsPage] = useState(1);
  const [movementsPageSize, setMovementsPageSize] = useState(10);

  // Hooks pour la gestion des données
  const {
    items: stockItems = [],
    loading: itemsLoading,
    error: itemsError,
    filters = { search: '', type: 'all', category: 'all', status: 'all' },
    createItem,
    updateItem,
    deleteItem,
    refresh,
    updateFilters
  } = useStockItems(effectiveTenantId);

  const {
    movements = [],
    loading: movementsLoading,
    error: movementsError,
    createMovement,
    refresh: refreshMovements
  } = useStockMovements(effectiveTenantId);

  const {
    alerts = [],
    criticalAlerts = [],
    warningAlerts = [],
    unreadAlerts = [],
    markAsRead
  } = useStockAlerts(effectiveTenantId);

  const {
    totalItems = 0,
    totalValue = 0,
    lowStockItems = 0,
    topCategories = []
  } = useStocksStatistics();

  // Pagination des articles
  const paginatedItems = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    return stockItems.slice(startIndex, endIndex);
  }, [stockItems, currentPage, pageSize]);

  const totalPages = Math.ceil(stockItems.length / pageSize);

  // Pagination des mouvements
  const paginatedMovements = useMemo(() => {
    const startIndex = (movementsPage - 1) * movementsPageSize;
    const endIndex = startIndex + movementsPageSize;
    return movements.slice(startIndex, endIndex);
  }, [movements, movementsPage, movementsPageSize]);

  const totalMovementsPages = Math.ceil(movements.length / movementsPageSize);

  // Réinitialiser la page lors du changement de filtres
  useEffect(() => {
    setCurrentPage(1);
  }, [filters.search, filters.category]);

  // Remplir le formulaire lors de l'édition
  useEffect(() => {
    if (isEditModalOpen && selectedItem) {
      setFormData({
        code: selectedItem.code || '',
        libelle: selectedItem.libelle || '',
        description: selectedItem.description || '',
        category: selectedItem.category || '',
        type: selectedItem.type || 'centralise',
        quantiteInitiale: selectedItem.quantiteActuelle || 0,
        unit: selectedItem.unit || '',
        seuilMinimum: selectedItem.seuilMinimum || 0,
        seuilMaximum: selectedItem.seuilMaximum || 0,
        prixUnitaire: selectedItem.prixUnitaire || 0
      });
    }
  }, [isEditModalOpen, selectedItem]);

  // Gestion de la création d'article
  const handleCreateItem = async () => {
    try {
      // Validation basique
      if (!formData.libelle || !formData.category || !formData.unit) {
        toast.warning('Champs obligatoires manquants', {
          description: 'Veuillez remplir Libellé, Catégorie et Unité'
        });
        return;
      }

      if (formData.quantiteInitiale && formData.quantiteInitiale < 0) {
        toast.warning('Quantité invalide', {
          description: 'La quantité initiale ne peut pas être négative'
        });
        return;
      }

      if (formData.seuilMinimum && formData.seuilMaximum && formData.seuilMinimum > formData.seuilMaximum) {
        toast.warning('Seuils invalides', {
          description: 'Le seuil minimum ne peut pas être supérieur au seuil maximum'
        });
        return;
      }
      
      await createItem(formData as CreateStockItemRequest);
      setIsCreateModalOpen(false);
      
      // Réinitialiser le formulaire
      setFormData({
        code: '',
        libelle: '',
        description: '',
        type: 'centralise',
        category: '',
        unit: '',
        quantiteInitiale: 0,
        seuilMinimum: 0,
        seuilMaximum: 0,
        prixUnitaire: 0
      });

      toast.success('Article créé avec succès!', {
        description: `${formData.libelle} a été ajouté à l'inventaire`
      });
      refresh();
    } catch (err: any) {
      console.error('Erreur lors de la création de l\'article:', err);
      toast.error('Erreur lors de la création', {
        description: err.message || 'Une erreur inconnue est survenue'
      });
    }
  };

  // Gestion de l'édition d'article
  const handleEditItem = async () => {
    try {
      if (!selectedItem?.id) {
        toast.warning('Aucun article sélectionné');
        return;
      }

      // Validation basique
      if (!formData.libelle || !formData.category || !formData.unit) {
        toast.warning('Champs obligatoires manquants', {
          description: 'Veuillez remplir Libellé, Catégorie et Unité'
        });
        return;
      }

      if (formData.seuilMinimum && formData.seuilMaximum && formData.seuilMinimum > formData.seuilMaximum) {
        toast.warning('Seuils invalides', {
          description: 'Le seuil minimum ne peut pas être supérieur au seuil maximum'
        });
        return;
      }

      // Ne pas envoyer quantiteInitiale dans l'édition (utiliser les mouvements)
      const { quantiteInitiale, ...updateData } = formData;
      
      await updateItem(selectedItem.id, updateData);
      setIsEditModalOpen(false);
      setSelectedItem(null);
      
      toast.success('Article modifié avec succès!', {
        description: `${formData.libelle} a été mis à jour`
      });
      refresh();
    } catch (err: any) {
      console.error('Erreur lors de la modification:', err);
      toast.error('Erreur lors de la modification', {
        description: err.message || 'Une erreur inconnue est survenue'
      });
    }
  };

  // Gestion de la suppression d'article
  const handleDeleteItem = async (itemId: string, itemName: string) => {
    const confirmDelete = window.confirm(
      `Êtes-vous sûr de vouloir supprimer l'article "${itemName}" ?\n\nCette action est irréversible et supprimera également tous les mouvements associés.`
    );

    if (!confirmDelete) return;

    try {
      await deleteItem(itemId);
      toast.success('Article supprimé avec succès!', {
        description: `${itemName} a été retiré de l'inventaire`
      });
      refresh();
    } catch (err: any) {
      console.error('Erreur lors de la suppression:', err);
      toast.error('Erreur lors de la suppression', {
        description: err.message || 'Une erreur inconnue est survenue'
      });
    }
  };

  // Gestion des mouvements de stock
  const handleCreateMovement = async () => {
    try {
      // Validation
      if (!movementFormData.stockId) {
        toast.warning('Veuillez sélectionner un article');
        return;
      }
      if (!movementFormData.quantite || movementFormData.quantite <= 0) {
        toast.warning('La quantité doit être supérieure à 0');
        return;
      }
      if (!movementFormData.date) {
        toast.warning('Veuillez sélectionner une date');
        return;
      }

      // Préparer les données du mouvement
      const movementData = {
        stockId: movementFormData.stockId,
        type: movementFormData.type,
        quantite: movementFormData.quantite,
        prixUnitaire: movementFormData.prixUnitaire || undefined,
        reference: movementFormData.reference || undefined,
        description: movementFormData.description || undefined,
        motif: movementFormData.motif || undefined,
        date: movementFormData.date
      };

      await createMovement(movementData);
      setIsMovementModalOpen(false);

      // Réinitialiser le formulaire
      setMovementFormData({
        stockId: '',
        type: 'entree',
        quantite: 0,
        prixUnitaire: 0,
        reference: '',
        description: '',
        motif: '',
        date: new Date().toISOString().split('T')[0]
      });

      const article = stockItems.find(item => item.id === movementFormData.stockId);
      toast.success('Mouvement enregistré avec succès!', {
        description: `${movementFormData.type === 'entree' ? 'Entrée' : 'Sortie'} de ${movementFormData.quantite} ${article?.unit || ''} - ${article?.libelle || ''}`
      });
      refresh();
      refreshMovements();
    } catch (err: any) {
      console.error('Erreur lors de la création du mouvement:', err);
      toast.error('Erreur lors de la création du mouvement', {
        description: err.message || 'Une erreur inconnue est survenue'
      });
    }
  };

  // Colonnes du tableau des articles
  const itemColumns = [
    {
      key: 'code',
      label: 'Code',
      render: (item: StockItem) => (
        <div>
          <p className="font-medium">{item.code}</p>
          <p className="text-sm text-gray-500 dark:text-gray-400">{item.libelle}</p>
        </div>
      )
    },
    {
      key: 'category',
      label: 'Catégorie',
      render: (item: StockItem) => (
        <Badge variant="secondary">{item.category}</Badge>
      )
    },
    {
      key: 'quantite',
      label: 'Quantité',
      render: (item: StockItem) => (
        <div className="text-right">
          <p className="font-medium">{item.quantiteActuelle} {item.unit}</p>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Disponible: {item.quantiteDisponible}
          </p>
        </div>
      )
    },
    {
      key: 'valeur',
      label: 'Valeur',
      render: (item: StockItem) => (
        <div className="text-right">
          <p className="font-medium">{item.valeurStock.toLocaleString()} XOF</p>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {item.prixUnitaire.toLocaleString()} XOF/u
          </p>
        </div>
      )
    },
    {
      key: 'status',
      label: 'Statut',
      render: (item: StockItem) => {
        const getStatusBadge = (status: string) => {
          switch (status) {
            case 'disponible':
              return <Badge variant="success">Disponible</Badge>;
            case 'stock_bas':
              return <Badge variant="warning">Stock bas</Badge>;
            case 'rupture':
              return <Badge variant="danger">Rupture</Badge>;
            default:
              return <Badge variant="secondary">{status}</Badge>;
          }
        };
        return getStatusBadge(item.status);
      }
    }
  ];

  // Colonnes du tableau des mouvements
  const movementColumns = [
    {
      key: 'date',
      label: 'Date',
      render: (movement: StockMovement) => (
        <div>
          <p className="font-medium">
            {new Date(movement.createdAt).toLocaleDateString()}
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {new Date(movement.createdAt).toLocaleTimeString()}
          </p>
        </div>
      )
    },
    {
      key: 'type',
      label: 'Type',
      render: (movement: StockMovement) => (
        <Badge variant={movement.type === 'entree' ? 'success' : 'warning'}>
          {movement.type === 'entree' ? 'Entrée' : 'Sortie'}
        </Badge>
      )
    },
    {
      key: 'item',
      label: 'Article',
      render: (movement: StockMovement) => (
        <div>
          <p className="font-medium">{movement.stock?.libelle || movement.stockItem?.libelle || 'N/A'}</p>
          <p className="text-sm text-gray-500 dark:text-gray-400">{movement.stock?.code || movement.stockItem?.code || 'N/A'}</p>
        </div>
      )
    },
    {
      key: 'quantite',
      label: 'Quantité',
      render: (movement: StockMovement) => (
        <div className="text-right">
          <p className="font-medium">{movement.quantite} {movement.stock?.unit || movement.stockItem?.unit || ''}</p>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {movement.prixUnitaire ? movement.prixUnitaire.toLocaleString() : '0'} XOF/u
          </p>
        </div>
      )
    },
    {
      key: 'reference',
      label: 'Référence',
      render: (movement: StockMovement) => movement.reference || '-'
    }
  ];

  const tabs = [
    { 
      id: 'items', 
      label: 'Articles', 
      icon: <CubeIcon className="h-4 w-4" />,
      content: (
        <div className="space-y-6">
          {/* Filtre Tenant */}
          {canFilterTenant && (
            <div className="mb-4">
              <TenantFilter
                value={selectedTenantId}
                onChange={setSelectedTenantId}
                showAllOption={true}
              />
            </div>
          )}

          {/* Filtres et actions */}
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div className="flex flex-col sm:flex-row gap-4 flex-1">
              <Input
                placeholder="Rechercher un article..."
                value={filters.search}
                onChange={(e) => updateFilters({ search: e.target.value })}
                leftIcon={<MagnifyingGlassIcon className="h-4 w-4" />}
                className="w-full sm:w-80"
              />
              <Select
                value={filters.category || ''}
                onChange={(value) => updateFilters({ category: String(value) })}
                options={[
                  { value: '', label: 'Toutes les catégories' },
                  { value: 'cereales', label: 'Céréales' },
                  { value: 'denrees', label: 'Denrées' },
                  { value: 'fournitures', label: 'Fournitures' },
                  { value: 'equipements', label: 'Équipements' },
                  { value: 'vehicules', label: 'Véhicules' },
                  { value: 'maintenance', label: 'Maintenance' }
                ]}
                className="w-full sm:w-48"
              />
            </div>
            <Button
              onClick={() => setIsCreateModalOpen(true)}
              leftIcon={<PlusIcon className="h-4 w-4" />}
            >
              Nouvel Article
            </Button>
          </div>

          {/* Tableau des articles */}
          <Card>
            <Card.Header>
              <Card.Title>Articles en Stock ({stockItems.length})</Card.Title>
            </Card.Header>
            <Card.Content>
              <div className="overflow-x-auto -mx-6 sm:mx-0">
                <div className="inline-block min-w-full align-middle">
                  <Table
                    data={paginatedItems}
                    columns={itemColumns}
                    loading={itemsLoading}
                    emptyMessage="Aucun article trouvé"
                    actions={(item) => (
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedItem(item);
                            setIsEditModalOpen(true);
                          }}
                          title="Voir/Modifier l'article"
                        >
                          <EyeIcon className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedItem(item);
                            setIsEditModalOpen(true);
                          }}
                          title="Modifier l'article"
                        >
                          <PencilIcon className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteItem(item.id, item.libelle);
                          }}
                          title="Supprimer l'article"
                          className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  />
                </div>
              </div>
              
              {/* Pagination */}
              {stockItems.length > 0 && (
                <div className="mt-6 flex justify-center">
                  <ModernPagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={setCurrentPage}
                    pageSize={pageSize}
                    totalItems={stockItems.length}
                    pageSizeOptions={[5, 10, 20, 50]}
                    onPageSizeChange={(newSize) => {
                      setPageSize(newSize);
                      setCurrentPage(1);
                    }}
                    showPageSize
                    showTotal
                    showFirstLast
                    variant="default"
                    size="md"
                  />
                </div>
              )}
            </Card.Content>
          </Card>
        </div>
      )
    },
    { 
      id: 'movements', 
      label: 'Mouvements', 
      icon: <TruckIcon className="h-4 w-4" />,
      content: (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Mouvements de Stock</h3>
            <Button
              onClick={() => setIsMovementModalOpen(true)}
              leftIcon={<PlusIcon className="h-4 w-4" />}
            >
              Nouveau Mouvement
            </Button>
          </div>

          <Card>
            <Card.Header>
              <Card.Title>Historique des Mouvements</Card.Title>
            </Card.Header>
            <Card.Content>
              <Table
                data={paginatedMovements}
                columns={movementColumns}
                loading={movementsLoading}
                emptyMessage="Aucun mouvement trouvé"
              />
              
              {/* Pagination des mouvements */}
              {movements.length > 0 && (
                <div className="mt-6 flex justify-center">
                  <ModernPagination
                    currentPage={movementsPage}
                    totalPages={totalMovementsPages}
                    onPageChange={setMovementsPage}
                    pageSize={movementsPageSize}
                    totalItems={movements.length}
                    pageSizeOptions={[5, 10, 20, 50]}
                    onPageSizeChange={(newSize) => {
                      setMovementsPageSize(newSize);
                      setMovementsPage(1);
                    }}
                    showPageSize
                    showTotal
                    showFirstLast
                    variant="default"
                    size="md"
                  />
                </div>
              )}
            </Card.Content>
          </Card>
        </div>
      )
    },
    { 
      id: 'alerts', 
      label: 'Alertes', 
      icon: <ExclamationTriangleIcon className="h-4 w-4" />,
      content: (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">
              Alertes de Stock ({alerts.length})
            </h3>
            {unreadAlerts.length > 0 && (
              <Button
                onClick={() => unreadAlerts.forEach((alert: any) => markAsRead(alert.id))}
                variant="outline"
                size="sm"
              >
                Marquer tout comme lu
              </Button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Alertes critiques */}
            <Card>
              <Card.Header>
                <Card.Title className="text-red-600">
                  Alertes Critiques ({criticalAlerts.length})
                </Card.Title>
              </Card.Header>
              <Card.Content>
                <div className="space-y-3">
                  {criticalAlerts.map((alert: any) => (
                    <div
                      key={alert.id}
                      className={`p-3 rounded-lg border-l-4 ${
                        alert.isRead ? 'bg-gray-50 border-gray-300' : 'bg-red-50 border-red-500'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-medium text-red-800">{alert.item?.libelle || 'N/A'}</p>
                          <p className="text-sm text-red-600">
                            Stock: {alert.currentStock || 0} {alert.item?.unit || ''}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            {new Date(alert.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => markAsRead(alert.id)}
                        >
                          Marquer lu
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </Card.Content>
            </Card>

            {/* Alertes d'avertissement */}
            <Card>
              <Card.Header>
                <Card.Title className="text-yellow-600">
                  Avertissements ({warningAlerts.length})
                </Card.Title>
              </Card.Header>
              <Card.Content>
                <div className="space-y-3">
                  {warningAlerts.map((alert: any) => (
                    <div
                      key={alert.id}
                      className={`p-3 rounded-lg border-l-4 ${
                        alert.isRead ? 'bg-gray-50 border-gray-300' : 'bg-yellow-50 border-yellow-500'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-medium text-yellow-800">{alert.item?.libelle || 'N/A'}</p>
                          <p className="text-sm text-yellow-600">
                            Stock: {alert.currentStock || 0} {alert.item?.unit || ''}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            {new Date(alert.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => markAsRead(alert.id)}
                        >
                          Marquer lu
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </Card.Content>
            </Card>
          </div>
        </div>
      )
    },
    {
      id: 'suppliers',
      label: 'Fournisseurs',
      icon: <UserGroupIcon className="h-4 w-4" />,
      content: <SuppliersTab />
    }
  ];

  return (
    <Container size="xl" className="py-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Gestion des Stocks</h1>
            <p className="text-lg text-gray-600 mt-2">
              Inventaire et gestion des approvisionnements CROU
            </p>
          </div>
          <div className="flex items-center gap-4">
            {unreadAlerts.length > 0 && (
              <Badge variant="danger" className="text-lg px-4 py-2">
                {unreadAlerts.length} Alerte{unreadAlerts.length > 1 ? 's' : ''}
              </Badge>
            )}
            <ExportButton module="stocks" />
            <Button
              variant="primary"
              leftIcon={<PlusIcon className="h-4 w-4" />}
              onClick={() => setIsCreateModalOpen(true)}
            >
              Nouvel Article
            </Button>
          </div>
        </div>
      </div>

      {/* Tabs de navigation */}
      <Tabs
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        variant="pills"
        className="space-y-8"
      />

      {/* Modales */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => {
          setIsCreateModalOpen(false);
          setFormData({
            code: '',
            libelle: '',
            description: '',
            category: '',
            type: 'centralise',
            quantiteInitiale: 0,
            unit: '',
            seuilMinimum: 0,
            seuilMaximum: 0,
            prixUnitaire: 0
          });
        }}
        title="Nouvel Article"
        size="lg"
      >
        <div className="space-y-4">
          <Input
            label="Code Article"
            placeholder="Ex: RIZ001 (optionnel, sera généré automatiquement)"
            value={formData.code}
            onChange={(e) => setFormData({ ...formData, code: e.target.value })}
          />
          <Input
            label="Libellé"
            placeholder="Ex: Riz parfumé 50kg"
            value={formData.libelle}
            onChange={(e) => setFormData({ ...formData, libelle: e.target.value })}
            required
          />
          <Input
            label="Description"
            placeholder="Description de l'article"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          />
          <Select
            label="Catégorie"
            options={[
              { value: 'cereales', label: 'Céréales' },
              { value: 'denrees', label: 'Denrées' },
              { value: 'fournitures', label: 'Fournitures' },
              { value: 'equipements', label: 'Équipements' },
              { value: 'vehicules', label: 'Véhicules' },
              { value: 'maintenance', label: 'Maintenance' }
            ]}
            value={formData.category}
            onChange={(value) => setFormData({ ...formData, category: value as string })}
            required
          />
          <Select
            label="Type"
            options={[
              { value: 'centralise', label: 'Centralisé' },
              { value: 'local', label: 'Local' }
            ]}
            value={formData.type}
            onChange={(value) => setFormData({ ...formData, type: value as 'centralise' | 'local' })}
            required
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Quantité Initiale"
              type="number"
              placeholder="0"
              value={formData.quantiteInitiale?.toString()}
              onChange={(e) => setFormData({ ...formData, quantiteInitiale: Number(e.target.value) })}
              required
            />
            <Select
              label="Unité"
              options={[
                { value: 'kg', label: 'Kilogrammes (kg)' },
                { value: 'tonne', label: 'Tonnes' },
                { value: 'litre', label: 'Litres' },
                { value: 'unite', label: 'Unités' },
                { value: 'carton', label: 'Cartons' },
                { value: 'sac', label: 'Sacs' },
                { value: 'bouteille', label: 'Bouteilles' }
              ]}
              value={formData.unit}
              onChange={(value) => setFormData({ ...formData, unit: value as string })}
              required
            />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <Input
              label="Seuil Minimum"
              type="number"
              placeholder="0"
              value={formData.seuilMinimum?.toString()}
              onChange={(e) => setFormData({ ...formData, seuilMinimum: Number(e.target.value) })}
              required
            />
            <Input
              label="Seuil Maximum"
              type="number"
              placeholder="0"
              value={formData.seuilMaximum?.toString()}
              onChange={(e) => setFormData({ ...formData, seuilMaximum: Number(e.target.value) })}
              required
            />
            <Input
              label="Prix Unitaire (XOF)"
              type="number"
              placeholder="0"
              value={formData.prixUnitaire?.toString()}
              onChange={(e) => setFormData({ ...formData, prixUnitaire: Number(e.target.value) })}
              required
            />
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <Button
              variant="outline"
              onClick={() => setIsCreateModalOpen(false)}
            >
              Annuler
            </Button>
            <Button
              variant="primary"
              onClick={handleCreateItem}
            >
              Créer l'Article
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedItem(null);
        }}
        title={`Modifier l'Article ${selectedItem?.code ? `- ${selectedItem.code}` : ''}`}
        size="lg"
      >
        <div className="space-y-4">
          <Input
            label="Code Article"
            placeholder="Ex: RIZ001"
            value={formData.code}
            onChange={(e) => setFormData({ ...formData, code: e.target.value })}
            disabled
            helpText="Le code ne peut pas être modifié"
          />
          <Input
            label="Libellé"
            placeholder="Ex: Riz parfumé 50kg"
            value={formData.libelle}
            onChange={(e) => setFormData({ ...formData, libelle: e.target.value })}
            required
          />
          <Input
            label="Description"
            placeholder="Description de l'article"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          />
          <Select
            label="Catégorie"
            options={[
              { value: 'cereales', label: 'Céréales' },
              { value: 'denrees', label: 'Denrées' },
              { value: 'fournitures', label: 'Fournitures' },
              { value: 'equipements', label: 'Équipements' },
              { value: 'vehicules', label: 'Véhicules' },
              { value: 'maintenance', label: 'Maintenance' }
            ]}
            value={formData.category}
            onChange={(value) => setFormData({ ...formData, category: value as string })}
            required
          />
          <Select
            label="Type"
            options={[
              { value: 'centralise', label: 'Centralisé' },
              { value: 'local', label: 'Local' }
            ]}
            value={formData.type}
            onChange={(value) => setFormData({ ...formData, type: value as 'centralise' | 'local' })}
            required
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Quantité Actuelle"
              type="number"
              placeholder="0"
              value={formData.quantiteInitiale?.toString()}
              onChange={(e) => setFormData({ ...formData, quantiteInitiale: Number(e.target.value) })}
              disabled
              helpText="Utilisez les mouvements pour modifier la quantité"
            />
            <Select
              label="Unité"
              options={[
                { value: 'kg', label: 'Kilogrammes (kg)' },
                { value: 'tonne', label: 'Tonnes' },
                { value: 'litre', label: 'Litres' },
                { value: 'unite', label: 'Unités' },
                { value: 'carton', label: 'Cartons' },
                { value: 'sac', label: 'Sacs' },
                { value: 'bouteille', label: 'Bouteilles' }
              ]}
              value={formData.unit}
              onChange={(value) => setFormData({ ...formData, unit: value as string })}
              required
            />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <Input
              label="Seuil Minimum"
              type="number"
              placeholder="0"
              value={formData.seuilMinimum?.toString()}
              onChange={(e) => setFormData({ ...formData, seuilMinimum: Number(e.target.value) })}
              required
            />
            <Input
              label="Seuil Maximum"
              type="number"
              placeholder="0"
              value={formData.seuilMaximum?.toString()}
              onChange={(e) => setFormData({ ...formData, seuilMaximum: Number(e.target.value) })}
              required
            />
            <Input
              label="Prix Unitaire (XOF)"
              type="number"
              placeholder="0"
              value={formData.prixUnitaire?.toString()}
              onChange={(e) => setFormData({ ...formData, prixUnitaire: Number(e.target.value) })}
              required
            />
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <Button
              variant="outline"
              onClick={() => {
                setIsEditModalOpen(false);
                setSelectedItem(null);
              }}
            >
              Annuler
            </Button>
            <Button
              variant="primary"
              onClick={handleEditItem}
            >
              Enregistrer les Modifications
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={isMovementModalOpen}
        onClose={() => setIsMovementModalOpen(false)}
        title="Nouveau Mouvement"
        size="lg"
      >
        <div className="space-y-4">
          <Select
            label="Type de Mouvement"
            options={[
              { value: 'entree', label: 'Entrée' },
              { value: 'sortie', label: 'Sortie' },
              { value: 'ajustement', label: 'Ajustement' },
              { value: 'transfert', label: 'Transfert' }
            ]}
            value={movementFormData.type}
            onChange={(value) => setMovementFormData({ ...movementFormData, type: value as 'entree' | 'sortie' | 'ajustement' | 'transfert' })}
            required
          />
          <Select
            label="Article"
            options={stockItems.map(item => ({
              value: item.id,
              label: `${item.code} - ${item.libelle}`
            }))}
            value={movementFormData.stockId}
            onChange={(value) => setMovementFormData({ ...movementFormData, stockId: value as string })}
            required
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Quantité"
              type="number"
              placeholder="0"
              value={movementFormData.quantite.toString()}
              onChange={(e) => setMovementFormData({ ...movementFormData, quantite: Number(e.target.value) })}
              required
            />
            <Input
              label="Prix Unitaire (XOF)"
              type="number"
              placeholder="0"
              value={movementFormData.prixUnitaire.toString()}
              onChange={(e) => setMovementFormData({ ...movementFormData, prixUnitaire: Number(e.target.value) })}
            />
          </div>
          <Input
            label="Référence"
            placeholder="Ex: Facture, Bon de sortie"
            value={movementFormData.reference}
            onChange={(e) => setMovementFormData({ ...movementFormData, reference: e.target.value })}
          />
          <Input
            label="Motif"
            placeholder="Motif du mouvement"
            value={movementFormData.motif}
            onChange={(e) => setMovementFormData({ ...movementFormData, motif: e.target.value })}
          />
          <Input
            label="Description"
            placeholder="Description optionnelle"
            value={movementFormData.description}
            onChange={(e) => setMovementFormData({ ...movementFormData, description: e.target.value })}
          />
          <Input
            label="Date du Mouvement"
            type="date"
            value={movementFormData.date}
            onChange={(e) => setMovementFormData({ ...movementFormData, date: e.target.value })}
            required
          />
          <div className="flex justify-end gap-3 pt-4">
            <Button
              variant="outline"
              onClick={() => setIsMovementModalOpen(false)}
            >
              Annuler
            </Button>
            <Button
              variant="primary"
              onClick={handleCreateMovement}
            >
              Enregistrer le Mouvement
            </Button>
          </div>
        </div>
      </Modal>
    </Container>
  );
};

export default StocksPage;
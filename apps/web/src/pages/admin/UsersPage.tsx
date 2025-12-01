/**
 * FICHIER: apps/web/src/pages/admin/UsersPage.tsx
 * PAGE: UsersPage - Gestion des utilisateurs
 * 
 * DESCRIPTION:
 * Interface d'administration pour la gestion des utilisateurs
 * CRUD complet avec filtres, recherche et actions en lot
 * 
 * FONCTIONNALITÉS:
 * - Liste des utilisateurs avec pagination
 * - Recherche et filtres avancés
 * - Création/modification d'utilisateurs
 * - Gestion des rôles et permissions
 * - Actions en lot (activation/désactivation)
 * - Déblocage de comptes
 * - Historique des connexions
 * 
 * AUTEUR: Équipe CROU
 * DATE: Décembre 2024
 */

import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  Filter, 
  MoreHorizontal, 
  Edit, 
  Trash2, 
  Lock, 
  Unlock,
  Eye,
  UserCheck,
  UserX,
  Download,
  RefreshCw
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Table, TableColumn } from '@/components/ui/Table';
import { Modal } from '@/components/ui/Modal';
import { Badge } from '@/components/ui/Badge';
import { CROUSelector } from '@/components/ui/CROUSelector';
import { Dropdown } from '@/components/ui/Dropdown';
import { Checkbox } from '@/components/ui/Checkbox';
import { Toast } from '@/components/ui/Toast';
import { useTenantFilter } from '@/stores/tenantFilter';
import { useTenantFilterEffect } from '@/hooks/useTenantFilterEffect';
import { adminService, type User as ApiUser, CreateUserRequest, UpdateUserRequest } from '@/services/api/adminService';
import { UserCreateModal, UserEditModal, UserDetailsModal } from '@/components/admin/UserModals';
import { exportUsersToPDF } from '@/utils/pdfExport';

// Types pour les utilisateurs
interface User {
  id: string;
  email: string;
  name: string;
  role: {
    id: string;
    name: string;
    tenantType: 'ministere' | 'crou' | 'both';
  };
  tenant: {
    id: string;
    name: string;
    type: 'ministere' | 'crou';
  };
  status: 'active' | 'inactive' | 'suspended' | 'pending';
  lastLoginAt: string | null;
  lastLoginIp: string | null;
  loginAttempts: number;
  lockedUntil: string | null;
  createdAt: string;
  updatedAt: string;
}

interface UserFilters {
  search: string;
  status: string;
  role: string;
  tenant: string;
  locked: string;
}

const statusOptions = [
  { value: '', label: 'Tous les statuts' },
  { value: 'active', label: 'Actif' },
  { value: 'inactive', label: 'Inactif' },
  { value: 'suspended', label: 'Suspendu' },
  { value: 'pending', label: 'En attente' }
];

const lockedOptions = [
  { value: '', label: 'Tous' },
  { value: 'locked', label: 'Bloqués' },
  { value: 'unlocked', label: 'Non bloqués' }
];

export const UsersPage: React.FC = () => {
  const { selectedTenantId } = useTenantFilter();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [filters, setFilters] = useState<UserFilters>({
    search: '',
    status: '',
    role: '',
    tenant: '',
    locked: ''
  });
  
  // États pour les modales
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);
  const [itemsPerPage, setItemsPerPage] = useState(20);

  // Charger les utilisateurs
  const loadUsers = async () => {
    setLoading(true);
    try {
      const params: any = {
        page: currentPage,
        limit: itemsPerPage
      };

      if (filters.search) params.search = filters.search;
      if (filters.status) params.isActive = filters.status === 'active';
      if (filters.role) params.role = filters.role;
      if (filters.tenant) params.tenantId = filters.tenant;

      const response = await adminService.getUsers(params);

      // Map API users to local User interface
      const mappedUsers: User[] = response.users.map((apiUser: ApiUser) => ({
        id: apiUser.id,
        email: apiUser.email,
        name: `${apiUser.firstName} ${apiUser.lastName}`,
        role: {
          id: apiUser.role.id,
          name: apiUser.role.name,
          tenantType: 'both' as const // Default, can be enhanced later
        },
        tenant: apiUser.tenant ? {
          id: apiUser.tenant.id,
          name: apiUser.tenant.name,
          type: apiUser.tenant.type
        } : {
          id: apiUser.tenantId,
          name: 'Inconnu',
          type: 'crou' as const
        },
        status: apiUser.isActive ? 'active' as const : 'inactive' as const,
        lastLoginAt: apiUser.lastLoginAt || null,
        lastLoginIp: null, // Not available from API yet
        loginAttempts: 0, // Not available from API yet
        lockedUntil: null, // Not available from API yet
        createdAt: apiUser.createdAt,
        updatedAt: apiUser.updatedAt
      }));

      setUsers(mappedUsers);
      setTotalUsers(response.total);
      setTotalPages(Math.ceil(response.total / itemsPerPage));
    } catch (error) {
      console.error('Erreur lors du chargement des utilisateurs:', error);
    } finally {
      setLoading(false);
    }
  };

  // Recharger quand le tenant change
  useTenantFilterEffect(() => {
    loadUsers();
  });

  useEffect(() => {
    loadUsers();
  }, [currentPage, filters]);

  // Colonnes du tableau
  const columns: TableColumn<User>[] = [
    {
      key: 'select',
      label: '',
      width: '50px',
      render: (user) => (
        <Checkbox
          checked={selectedUsers.includes(user.id)}
          onChange={(checked) => {
            if (checked) {
              setSelectedUsers([...selectedUsers, user.id]);
            } else {
              setSelectedUsers(selectedUsers.filter(id => id !== user.id));
            }
          }}
        />
      )
    },
    {
      key: 'name',
      label: 'Utilisateur',
      sortable: true,
      render: (user) => (
        <div>
          <div className="font-medium text-gray-900 dark:text-white">
            {user.name}
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-400">
            {user.email}
          </div>
        </div>
      )
    },
    {
      key: 'role',
      label: 'Rôle',
      sortable: true,
      render: (user) => (
        <Badge variant="secondary">
          {user.role.name}
        </Badge>
      )
    },
    {
      key: 'tenant',
      label: 'Organisation',
      sortable: true,
      render: (user) => (
        <div>
          <div className="font-medium text-gray-900 dark:text-white">
            {user.tenant.name}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">
            {user.tenant.type === 'ministere' ? 'Ministère' : 'CROU'}
          </div>
        </div>
      )
    },
    {
      key: 'status',
      label: 'Statut',
      sortable: true,
      render: (user) => {
        const isLocked = user.lockedUntil && new Date(user.lockedUntil) > new Date();
        
        if (isLocked) {
          return <Badge variant="danger">Bloqué</Badge>;
        }
        
        const statusVariants = {
          active: 'success' as const,
          inactive: 'secondary' as const,
          suspended: 'danger' as const,
          pending: 'warning' as const
        };
        
        const statusLabels = {
          active: 'Actif',
          inactive: 'Inactif',
          suspended: 'Suspendu',
          pending: 'En attente'
        };
        
        return (
          <Badge variant={statusVariants[user.status]}>
            {statusLabels[user.status]}
          </Badge>
        );
      }
    },
    {
      key: 'lastLogin',
      label: 'Dernière connexion',
      sortable: true,
      render: (user) => (
        <div>
          {user.lastLoginAt ? (
            <>
              <div className="text-sm text-gray-900 dark:text-white">
                {new Date(user.lastLoginAt).toLocaleDateString('fr-FR')}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                {new Date(user.lastLoginAt).toLocaleTimeString('fr-FR')}
              </div>
              {user.lastLoginIp && (
                <div className="text-xs text-gray-400 dark:text-gray-500">
                  {user.lastLoginIp}
                </div>
              )}
            </>
          ) : (
            <span className="text-sm text-gray-500 dark:text-gray-400">
              Jamais connecté
            </span>
          )}
        </div>
      )
    },
    {
      key: 'actions',
      label: 'Actions',
      width: '120px',
      render: (user) => (
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setSelectedUser(user);
              setShowDetailsModal(true);
            }}
          >
            <Eye className="h-4 w-4" />
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setSelectedUser(user);
              setShowEditModal(true);
            }}
          >
            <Edit className="h-4 w-4" />
          </Button>
          
          {user.lockedUntil && new Date(user.lockedUntil) > new Date() && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleUnlockUser(user.id)}
            >
              <Unlock className="h-4 w-4" />
            </Button>
          )}
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleToggleUserStatus(user.id, user.status)}
          >
            {user.status === 'active' ? <UserX className="h-4 w-4" /> : <UserCheck className="h-4 w-4" />}
          </Button>
        </div>
      )
    }
  ];

  // Actions sur les utilisateurs
  const handleUnlockUser = async (userId: string) => {
    try {
      // Note: Unlock functionality will need to be added to the backend API
      // For now, we'll use the toggle status endpoint
      await adminService.toggleUserStatus(userId, true);
      await loadUsers();
      Toast.success('Utilisateur débloqué avec succès');
    } catch (error: any) {
      console.error('Erreur lors du déblocage:', error);
      Toast.error(error?.message || 'Erreur lors du déblocage');
    }
  };

  const handleToggleUserStatus = async (userId: string, currentStatus: string) => {
    try {
      const newIsActive = currentStatus !== 'active';
      await adminService.toggleUserStatus(userId, newIsActive);
      await loadUsers();
      Toast.success(`Utilisateur ${newIsActive ? 'activé' : 'désactivé'} avec succès`);
    } catch (error: any) {
      console.error('Erreur lors du changement de statut:', error);
      Toast.error(error?.message || 'Erreur lors du changement de statut');
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer cet utilisateur ?')) {
      try {
        await adminService.deleteUser(userId);
        await loadUsers();
        Toast.success('Utilisateur supprimé avec succès');
      } catch (error: any) {
        console.error('Erreur lors de la suppression:', error);
        Toast.error(error?.message || 'Erreur lors de la suppression');
      }
    }
  };

  const handleBulkAction = async (action: string) => {
    if (selectedUsers.length === 0) return;

    try {
      // Execute bulk action for all selected users
      const promises = selectedUsers.map(userId => {
        switch (action) {
          case 'activate':
            return adminService.toggleUserStatus(userId, true);
          case 'deactivate':
            return adminService.toggleUserStatus(userId, false);
          case 'delete':
            return adminService.deleteUser(userId);
          default:
            return Promise.resolve();
        }
      });

      await Promise.all(promises);
      await loadUsers();
      setSelectedUsers([]);
      Toast.success(`Action en lot exécutée sur ${selectedUsers.length} utilisateur(s)`);
    } catch (error: any) {
      console.error('Erreur lors de l\'action en lot:', error);
      Toast.error(error?.message || 'Erreur lors de l\'action en lot');
    }
  };

  const handleExport = (format: 'csv' | 'pdf' = 'csv') => {
    try {
      if (format === 'csv') {
        // Export users as CSV
        const csvHeaders = ['ID', 'Email', 'Nom', 'Rôle', 'Organisation', 'Statut', 'Dernière connexion', 'Créé le'];
        const csvRows = users.map(user => [
          user.id,
          user.email,
          user.name,
          user.role.name,
          user.tenant.name,
          user.status,
          user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleString('fr-FR') : 'Jamais',
          new Date(user.createdAt).toLocaleString('fr-FR')
        ]);

        const csvContent = [
          csvHeaders.join(','),
          ...csvRows.map(row => row.map(cell => `"${cell}"`).join(','))
        ].join('\n');

        const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `utilisateurs_${new Date().toISOString().split('T')[0]}.csv`;
        link.click();

        Toast.success('Export CSV des utilisateurs réussi');
      } else if (format === 'pdf') {
        // Export users as PDF
        const pdfData = users.map(user => ({
          email: user.email,
          name: user.name,
          role: user.role,
          tenant: user.tenant,
          status: user.status,
          createdAt: user.createdAt
        }));

        exportUsersToPDF(pdfData);
        Toast.success('Export PDF des utilisateurs réussi');
      }
    } catch (error: any) {
      console.error('Erreur lors de l\'export:', error);
      Toast.error('Erreur lors de l\'export des utilisateurs');
    }
  };

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Gestion des Utilisateurs
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            {totalUsers} utilisateur{totalUsers > 1 ? 's' : ''} au total
          </p>
        </div>
        
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              onClick={() => handleExport('csv')}
              className="flex items-center space-x-2"
            >
              <Download className="h-4 w-4" />
              <span>CSV</span>
            </Button>

            <Button
              variant="outline"
              onClick={() => handleExport('pdf')}
              className="flex items-center space-x-2"
            >
              <Download className="h-4 w-4" />
              <span>PDF</span>
            </Button>
          </div>
          
          <Button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center space-x-2"
          >
            <Plus className="h-4 w-4" />
            <span>Nouvel utilisateur</span>
          </Button>
        </div>
      </div>

      {/* Filtres */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div>
            <Input
              placeholder="Rechercher un utilisateur..."
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              className="w-full"
            />
          </div>
          
          <Select
            value={filters.status}
            onChange={(value) => setFilters({ ...filters, status: String(value) })}
            options={statusOptions}
            placeholder="Statut"
          />
          
          <Select
            value={filters.locked}
            onChange={(value) => setFilters({ ...filters, locked: String(value) })}
            options={lockedOptions}
            placeholder="Blocage"
          />
          
          <CROUSelector
            value={filters.tenant}
            onChange={(value) => setFilters({ ...filters, tenant: String(value) })}
            placeholder="Organisation"
            includeMinistry
            level="all"
          />
          
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              onClick={() => setFilters({
                search: '',
                status: '',
                role: '',
                tenant: '',
                locked: ''
              })}
              className="flex items-center space-x-2"
            >
              <RefreshCw className="h-4 w-4" />
              <span>Réinitialiser</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Actions en lot */}
      {selectedUsers.length > 0 && (
        <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
          <div className="flex items-center justify-between">
            <span className="text-sm text-blue-700 dark:text-blue-300">
              {selectedUsers.length} utilisateur{selectedUsers.length > 1 ? 's' : ''} sélectionné{selectedUsers.length > 1 ? 's' : ''}
            </span>
            
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleBulkAction('activate')}
              >
                Activer
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleBulkAction('deactivate')}
              >
                Désactiver
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleBulkAction('unlock')}
              >
                Débloquer
              </Button>
              <Button
                variant="danger"
                size="sm"
                onClick={() => handleBulkAction('delete')}
              >
                Supprimer
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Tableau des utilisateurs */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        <Table
          data={users}
          columns={columns}
          loading={loading}
          pagination={{
            page: currentPage,
            limit: itemsPerPage,
            total: totalUsers,
            onPageChange: setCurrentPage,
            onLimitChange: (limit: number) => setItemsPerPage(limit)
          }}
          selectable
          selectedItems={selectedUsers.map(id => users.find(u => u.id === id)).filter(Boolean) as User[]}
          onSelectionChange={(selected: User[]) => setSelectedUsers(selected.map(u => u.id))}
        />
      </div>

      {/* Modales */}
      {showCreateModal && (
        <UserCreateModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false);
            loadUsers();
          }}
        />
      )}

      {showEditModal && selectedUser && (
        <UserEditModal
          isOpen={showEditModal}
          user={{
            id: selectedUser.id,
            email: selectedUser.email,
            firstName: selectedUser.name.split(' ')[0],
            lastName: selectedUser.name.split(' ').slice(1).join(' '),
            phone: '',
            tenantId: selectedUser.tenant.id,
            tenant: selectedUser.tenant,
            role: {
              id: selectedUser.role.id,
              name: selectedUser.role.name,
              description: '',
              permissions: [],
              isSystem: false,
              createdAt: selectedUser.createdAt,
              updatedAt: selectedUser.updatedAt
            },
            permissions: [],
            isActive: selectedUser.status === 'active',
            lastLoginAt: selectedUser.lastLoginAt || undefined,
            createdAt: selectedUser.createdAt,
            updatedAt: selectedUser.updatedAt
          } as ApiUser}
          onClose={() => {
            setShowEditModal(false);
            setSelectedUser(null);
          }}
          onSuccess={() => {
            setShowEditModal(false);
            setSelectedUser(null);
            loadUsers();
          }}
        />
      )}

      {showDetailsModal && selectedUser && (
        <UserDetailsModal
          isOpen={showDetailsModal}
          user={{
            id: selectedUser.id,
            email: selectedUser.email,
            firstName: selectedUser.name.split(' ')[0],
            lastName: selectedUser.name.split(' ').slice(1).join(' '),
            phone: '',
            tenantId: selectedUser.tenant.id,
            tenant: selectedUser.tenant,
            role: {
              id: selectedUser.role.id,
              name: selectedUser.role.name,
              description: '',
              permissions: [],
              isSystem: false,
              createdAt: selectedUser.createdAt,
              updatedAt: selectedUser.updatedAt
            },
            permissions: [],
            isActive: selectedUser.status === 'active',
            lastLoginAt: selectedUser.lastLoginAt || undefined,
            createdAt: selectedUser.createdAt,
            updatedAt: selectedUser.updatedAt
          } as ApiUser}
          onClose={() => {
            setShowDetailsModal(false);
            setSelectedUser(null);
          }}
        />
      )}
    </div>
  );
};
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
      // TODO: Remplacer par l'appel API réel
      const mockUsers: User[] = [
        {
          id: '1',
          email: 'ministre@crou.ne',
          name: 'Ministre de l\'Enseignement Supérieur',
          role: {
            id: 'role-1',
            name: 'Ministre',
            tenantType: 'ministere'
          },
          tenant: {
            id: 'ministere',
            name: 'Ministère de l\'Enseignement Supérieur',
            type: 'ministere'
          },
          status: 'active',
          lastLoginAt: '2024-12-06T10:30:00Z',
          lastLoginIp: '192.168.1.100',
          loginAttempts: 0,
          lockedUntil: null,
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-12-06T10:30:00Z'
        },
        {
          id: '2',
          email: 'directeur@crou-niamey.ne',
          name: 'Directeur CROU Niamey',
          role: {
            id: 'role-2',
            name: 'Directeur CROU',
            tenantType: 'crou'
          },
          tenant: {
            id: 'crou_niamey',
            name: 'CROU Niamey',
            type: 'crou'
          },
          status: 'active',
          lastLoginAt: '2024-12-06T09:15:00Z',
          lastLoginIp: '10.0.1.50',
          loginAttempts: 0,
          lockedUntil: null,
          createdAt: '2024-01-15T00:00:00Z',
          updatedAt: '2024-12-06T09:15:00Z'
        },
        {
          id: '3',
          email: 'comptable@crou-dosso.ne',
          name: 'Comptable CROU Dosso',
          role: {
            id: 'role-3',
            name: 'Comptable',
            tenantType: 'crou'
          },
          tenant: {
            id: 'crou_dosso',
            name: 'CROU Dosso',
            type: 'crou'
          },
          status: 'suspended',
          lastLoginAt: '2024-12-05T14:20:00Z',
          lastLoginIp: '10.0.2.25',
          loginAttempts: 5,
          lockedUntil: '2024-12-06T15:00:00Z',
          createdAt: '2024-02-01T00:00:00Z',
          updatedAt: '2024-12-05T14:20:00Z'
        }
      ];

      setUsers(mockUsers);
      setTotalUsers(mockUsers.length);
      setTotalPages(Math.ceil(mockUsers.length / itemsPerPage));
    } catch (error) {
      console.error('Erreur lors du chargement des utilisateurs:', error);
    } finally {
      setLoading(false);
    }
  };

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
      // TODO: Appel API pour débloquer l'utilisateur
      console.log('Déblocage utilisateur:', userId);
      await loadUsers();
      // Toast de succès
    } catch (error) {
      console.error('Erreur lors du déblocage:', error);
      // Toast d'erreur
    }
  };

  const handleToggleUserStatus = async (userId: string, currentStatus: string) => {
    try {
      const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
      // TODO: Appel API pour changer le statut
      console.log('Changement statut:', userId, newStatus);
      await loadUsers();
      // Toast de succès
    } catch (error) {
      console.error('Erreur lors du changement de statut:', error);
      // Toast d'erreur
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer cet utilisateur ?')) {
      try {
        // TODO: Appel API pour supprimer l'utilisateur
        console.log('Suppression utilisateur:', userId);
        await loadUsers();
        // Toast de succès
      } catch (error) {
        console.error('Erreur lors de la suppression:', error);
        // Toast d'erreur
      }
    }
  };

  const handleBulkAction = async (action: string) => {
    if (selectedUsers.length === 0) return;

    try {
      // TODO: Appel API pour l'action en lot
      console.log('Action en lot:', action, selectedUsers);
      await loadUsers();
      setSelectedUsers([]);
      // Toast de succès
    } catch (error) {
      console.error('Erreur lors de l\'action en lot:', error);
      // Toast d'erreur
    }
  };

  const handleExport = () => {
    // TODO: Implémenter l'export des utilisateurs
    console.log('Export des utilisateurs');
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
          <Button
            variant="outline"
            onClick={handleExport}
            className="flex items-center space-x-2"
          >
            <Download className="h-4 w-4" />
            <span>Exporter</span>
          </Button>
          
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
          user={selectedUser}
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
          user={selectedUser}
          onClose={() => {
            setShowDetailsModal(false);
            setSelectedUser(null);
          }}
        />
      )}
    </div>
  );
};

// Composants de modales (à implémenter)
const UserCreateModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}> = ({ isOpen, onClose, onSuccess }) => {
  // TODO: Implémenter le formulaire de création
  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg">
      <div className="p-6">
        <h3 className="text-lg font-semibold mb-4">Créer un nouvel utilisateur</h3>
        <p>Formulaire de création à implémenter...</p>
        <div className="flex justify-end space-x-3 mt-6">
          <Button variant="outline" onClick={onClose}>
            Annuler
          </Button>
          <Button onClick={onSuccess}>
            Créer
          </Button>
        </div>
      </div>
    </Modal>
  );
};

const UserEditModal: React.FC<{
  isOpen: boolean;
  user: User;
  onClose: () => void;
  onSuccess: () => void;
}> = ({ isOpen, user, onClose, onSuccess }) => {
  // TODO: Implémenter le formulaire de modification
  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg">
      <div className="p-6">
        <h3 className="text-lg font-semibold mb-4">Modifier l'utilisateur</h3>
        <p>Formulaire de modification pour {user.name}...</p>
        <div className="flex justify-end space-x-3 mt-6">
          <Button variant="outline" onClick={onClose}>
            Annuler
          </Button>
          <Button onClick={onSuccess}>
            Sauvegarder
          </Button>
        </div>
      </div>
    </Modal>
  );
};

const UserDetailsModal: React.FC<{
  isOpen: boolean;
  user: User;
  onClose: () => void;
}> = ({ isOpen, user, onClose }) => {
  // TODO: Implémenter l'affichage des détails
  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg">
      <div className="p-6">
        <h3 className="text-lg font-semibold mb-4">Détails de l'utilisateur</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Nom
            </label>
            <p className="text-gray-900 dark:text-white">{user.name}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Email
            </label>
            <p className="text-gray-900 dark:text-white">{user.email}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Rôle
            </label>
            <p className="text-gray-900 dark:text-white">{user.role.name}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Organisation
            </label>
            <p className="text-gray-900 dark:text-white">{user.tenant.name}</p>
          </div>
        </div>
        <div className="flex justify-end mt-6">
          <Button onClick={onClose}>
            Fermer
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default UsersPage;
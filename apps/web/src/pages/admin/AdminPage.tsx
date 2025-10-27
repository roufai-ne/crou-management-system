/**
 * FICHIER: apps/web/src/pages/admin/AdminPage.tsx
 * PAGE: AdminPage - Administration système
 *
 * DESCRIPTION:
 * Page principale pour l'administration du système CROU
 * Interface complète pour la gestion des utilisateurs, rôles, permissions
 * Support multi-tenant avec audit et statistiques
 *
 * FONCTIONNALITÉS:
 * - Gestion des utilisateurs (CRUD)
 * - Gestion des rôles et permissions
 * - Gestion des tenants
 * - Audit et logs système
 * - Statistiques administratives
 * - Configuration système
 *
 * AUTEUR: Équipe CROU
 * DATE: Décembre 2024
 */

import React, { useState } from 'react';
import { Container, Card, Badge, Button, Table, Modal, Input, Select, Tabs } from '@/components/ui';
import { 
  UserGroupIcon,
  ShieldCheckIcon,
  BuildingOfficeIcon,
  DocumentTextIcon,
  ChartBarIcon,
  CogIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
  MagnifyingGlassIcon,
  FunnelIcon
} from '@heroicons/react/24/outline';
import { useAdminUsers, useAdminRoles, useAdminPermissions, useAdminTenants, useAdminAudit, useAdminStatistics } from '@/hooks/useAdmin';
import { ExportButton } from '@/components/reports/ExportButton';

export const AdminPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState('users');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [modalType, setModalType] = useState<'user' | 'role' | 'tenant' | 'permission'>('user');
  
  const { users = [], loading: usersLoading, error: usersError, createUser, updateUser, deleteUser, toggleUserStatus } = useAdminUsers();
  const { roles = [], loading: rolesLoading, error: rolesError, createRole, updateRole, deleteRole } = useAdminRoles();
  const { permissions = [], loading: permissionsLoading, error: permissionsError, createPermission, updatePermission, deletePermission } = useAdminPermissions();
  const { tenants = [], loading: tenantsLoading, error: tenantsError, createTenant, updateTenant, deleteTenant } = useAdminTenants();
  const { auditLogs = [], loading: auditLoading, error: auditError } = useAdminAudit();
  const { statistics, loading: statsLoading, error: statsError } = useAdminStatistics();

  // Gestion de la création d'élément
  const handleCreateItem = async (data: any) => {
    try {
      switch (modalType) {
        case 'user':
          await createUser(data);
          break;
        case 'role':
          await createRole(data);
          break;
        case 'tenant':
          await createTenant(data);
          break;
        case 'permission':
          await createPermission(data);
          break;
      }
      setIsCreateModalOpen(false);
    } catch (err) {
      console.error('Erreur lors de la création:', err);
    }
  };

  // Gestion de la modification d'élément
  const handleUpdateItem = async (data: any) => {
    try {
      switch (modalType) {
        case 'user':
          await updateUser(selectedItem.id, data);
          break;
        case 'role':
          await updateRole(selectedItem.id, data);
          break;
        case 'tenant':
          await updateTenant(selectedItem.id, data);
          break;
        case 'permission':
          await updatePermission(selectedItem.id, data);
          break;
      }
      setIsEditModalOpen(false);
    } catch (err) {
      console.error('Erreur lors de la modification:', err);
    }
  };

  // Colonnes du tableau des utilisateurs
  const userColumns = [
    {
      key: 'user',
      label: 'Utilisateur',
      render: (user: any) => (
        <div>
          <p className="font-medium">{user.firstName} {user.lastName}</p>
          <p className="text-sm text-gray-500">{user.email}</p>
        </div>
      )
    },
    {
      key: 'role',
      label: 'Rôle',
      render: (user: any) => (
        <Badge variant="secondary">{user.role?.name || 'Aucun'}</Badge>
      )
    },
    {
      key: 'tenant',
      label: 'Tenant',
      render: (user: any) => (
        <div>
          <p className="font-medium">{user.tenant?.name || 'Ministère'}</p>
          <p className="text-sm text-gray-500">{user.tenant?.type || 'Global'}</p>
        </div>
      )
    },
    {
      key: 'status',
      label: 'Statut',
      render: (user: any) => (
        <Badge variant={user.isActive ? 'success' : 'danger'}>
          {user.isActive ? 'Actif' : 'Inactif'}
        </Badge>
      )
    },
    {
      key: 'lastLogin',
      label: 'Dernière connexion',
      render: (user: any) => (
        <div>
          <p className="font-medium">
            {user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleDateString() : 'Jamais'}
          </p>
          <p className="text-sm text-gray-500">
            {user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleTimeString() : ''}
          </p>
        </div>
      )
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (user: any) => (
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            leftIcon={<EyeIcon className="h-4 w-4" />}
            onClick={() => {
              setSelectedItem(user);
              setModalType('user');
              setIsEditModalOpen(true);
            }}
          >
            Voir
          </Button>
          <Button
            size="sm"
            variant="outline"
            leftIcon={<PencilIcon className="h-4 w-4" />}
            onClick={() => {
              setSelectedItem(user);
              setModalType('user');
              setIsEditModalOpen(true);
            }}
          >
            Modifier
          </Button>
          <Button
            size="sm"
            variant="outline"
            leftIcon={<TrashIcon className="h-4 w-4" />}
            onClick={() => deleteUser(user.id)}
          >
            Supprimer
          </Button>
        </div>
      )
    }
  ];

  const tabs = [
    { 
      id: 'users', 
      label: 'Utilisateurs', 
      icon: <UserGroupIcon className="h-4 w-4" />,
      content: (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Gestion des Utilisateurs</h3>
            <Button
              onClick={() => {
                setModalType('user');
                setIsCreateModalOpen(true);
              }}
              leftIcon={<PlusIcon className="h-4 w-4" />}
            >
              Nouvel Utilisateur
            </Button>
          </div>

          <Card>
            <Card.Header>
              <Card.Title>Liste des Utilisateurs ({users.length})</Card.Title>
            </Card.Header>
            <Card.Content>
              <Table
                data={users}
                columns={userColumns}
                loading={usersLoading}
                emptyMessage="Aucun utilisateur trouvé"
                onRowClick={(item) => {
                  setSelectedItem(item);
                  setModalType('user');
                  setIsEditModalOpen(true);
                }}
              />
            </Card.Content>
          </Card>
        </div>
      )
    },
    { 
      id: 'roles', 
      label: 'Rôles', 
      icon: <ShieldCheckIcon className="h-4 w-4" />,
      content: (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Gestion des Rôles</h3>
            <Button
              onClick={() => {
                setModalType('role');
                setIsCreateModalOpen(true);
              }}
              leftIcon={<PlusIcon className="h-4 w-4" />}
            >
              Nouveau Rôle
            </Button>
          </div>

          <Card>
            <Card.Header>
              <Card.Title>Liste des Rôles ({roles.length})</Card.Title>
            </Card.Header>
            <Card.Content>
              <div className="text-center py-12">
                <ShieldCheckIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Module Rôles en Développement
                </h3>
                <p className="text-gray-600">
                  La gestion des rôles sera disponible dans la prochaine version.
                </p>
              </div>
            </Card.Content>
          </Card>
        </div>
      )
    },
    { 
      id: 'tenants', 
      label: 'Tenants', 
      icon: <BuildingOfficeIcon className="h-4 w-4" />,
      content: (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Gestion des Tenants</h3>
            <Button
              onClick={() => {
                setModalType('tenant');
                setIsCreateModalOpen(true);
              }}
              leftIcon={<PlusIcon className="h-4 w-4" />}
            >
              Nouveau Tenant
            </Button>
          </div>

          <Card>
            <Card.Header>
              <Card.Title>Liste des Tenants ({tenants.length})</Card.Title>
            </Card.Header>
            <Card.Content>
              <div className="text-center py-12">
                <BuildingOfficeIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Module Tenants en Développement
                </h3>
                <p className="text-gray-600">
                  La gestion des tenants sera disponible dans la prochaine version.
                </p>
              </div>
            </Card.Content>
          </Card>
        </div>
      )
    },
    { 
      id: 'permissions', 
      label: 'Permissions', 
      icon: <ShieldCheckIcon className="h-4 w-4" />,
      content: (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Gestion des Permissions</h3>
            <Button
              onClick={() => {
                setModalType('permission');
                setIsCreateModalOpen(true);
              }}
              leftIcon={<PlusIcon className="h-4 w-4" />}
            >
              Nouvelle Permission
            </Button>
          </div>

          <Card>
            <Card.Header>
              <Card.Title>Liste des Permissions ({permissions.length})</Card.Title>
            </Card.Header>
            <Card.Content>
              <div className="text-center py-12">
                <ShieldCheckIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Module Permissions en Développement
                </h3>
                <p className="text-gray-600">
                  La gestion des permissions sera disponible dans la prochaine version.
                </p>
              </div>
            </Card.Content>
          </Card>
        </div>
      )
    },
    { 
      id: 'audit', 
      label: 'Audit', 
      icon: <DocumentTextIcon className="h-4 w-4" />,
      content: (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Logs d'Audit</h3>
            <div className="flex items-center gap-2">
              <Input
                placeholder="Rechercher dans les logs..."
                leftIcon={<MagnifyingGlassIcon className="h-4 w-4" />}
                className="w-64"
              />
              <Button
                variant="outline"
                leftIcon={<FunnelIcon className="h-4 w-4" />}
              >
                Filtrer
              </Button>
            </div>
          </div>

          <Card>
            <Card.Header>
              <Card.Title>Logs d'Audit ({auditLogs.length})</Card.Title>
            </Card.Header>
            <Card.Content>
              <div className="text-center py-12">
                <DocumentTextIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Module Audit en Développement
                </h3>
                <p className="text-gray-600">
                  Les logs d'audit seront disponibles dans la prochaine version.
                </p>
              </div>
            </Card.Content>
          </Card>
        </div>
      )
    },
    { 
      id: 'statistics', 
      label: 'Statistiques', 
      icon: <ChartBarIcon className="h-4 w-4" />,
      content: (
        <div className="space-y-6">
          <h3 className="text-lg font-semibold">Statistiques Système</h3>
          
          {statistics && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card>
                <Card.Header>
                  <Card.Title>Utilisateurs</Card.Title>
                </Card.Header>
                <Card.Content>
                  <div className="text-center">
                    <p className="text-3xl font-bold text-primary-600">{statistics.totalUsers}</p>
                    <p className="text-sm text-gray-500">Total</p>
                    <p className="text-lg font-medium text-green-600">{statistics.activeUsers}</p>
                    <p className="text-sm text-gray-500">Actifs</p>
                  </div>
                </Card.Content>
              </Card>

              <Card>
                <Card.Header>
                  <Card.Title>Rôles</Card.Title>
                </Card.Header>
                <Card.Content>
                  <div className="text-center">
                    <p className="text-3xl font-bold text-primary-600">{statistics.totalRoles}</p>
                    <p className="text-sm text-gray-500">Total</p>
                    <p className="text-lg font-medium text-green-600">{statistics.activeRoles}</p>
                    <p className="text-sm text-gray-500">Actifs</p>
                  </div>
                </Card.Content>
              </Card>

              <Card>
                <Card.Header>
                  <Card.Title>Tenants</Card.Title>
                </Card.Header>
                <Card.Content>
                  <div className="text-center">
                    <p className="text-3xl font-bold text-primary-600">{statistics.totalTenants}</p>
                    <p className="text-sm text-gray-500">Total</p>
                    <p className="text-lg font-medium text-green-600">{statistics.activeTenants}</p>
                    <p className="text-sm text-gray-500">Actifs</p>
                  </div>
                </Card.Content>
              </Card>

              <Card>
                <Card.Header>
                  <Card.Title>Permissions</Card.Title>
                </Card.Header>
                <Card.Content>
                  <div className="text-center">
                    <p className="text-3xl font-bold text-primary-600">{statistics.totalPermissions}</p>
                    <p className="text-sm text-gray-500">Total</p>
                    <p className="text-lg font-medium text-blue-600">{statistics.modulePermissions}</p>
                    <p className="text-sm text-gray-500">Par module</p>
                  </div>
                </Card.Content>
              </Card>

              <Card>
                <Card.Header>
                  <Card.Title>Connexions</Card.Title>
                </Card.Header>
                <Card.Content>
                  <div className="text-center">
                    <p className="text-3xl font-bold text-primary-600">{statistics.todayLogins}</p>
                    <p className="text-sm text-gray-500">Aujourd'hui</p>
                    <p className="text-lg font-medium text-green-600">{statistics.thisWeekLogins}</p>
                    <p className="text-sm text-gray-500">Cette semaine</p>
                  </div>
                </Card.Content>
              </Card>

              <Card>
                <Card.Header>
                  <Card.Title>Audit</Card.Title>
                </Card.Header>
                <Card.Content>
                  <div className="text-center">
                    <p className="text-3xl font-bold text-primary-600">{statistics.todayAuditLogs}</p>
                    <p className="text-sm text-gray-500">Aujourd'hui</p>
                    <p className="text-lg font-medium text-orange-600">{statistics.failedActions}</p>
                    <p className="text-sm text-gray-500">Échecs</p>
                  </div>
                </Card.Content>
              </Card>
            </div>
          )}
        </div>
      )
    },
    { 
      id: 'settings', 
      label: 'Configuration', 
      icon: <CogIcon className="h-4 w-4" />,
      content: (
        <div className="space-y-6">
          <h3 className="text-lg font-semibold">Configuration Système</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <Card.Header>
                <Card.Title>Paramètres Généraux</Card.Title>
              </Card.Header>
              <Card.Content>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nom du système
                    </label>
                    <Input
                      placeholder="Système CROU"
                      defaultValue="Système CROU"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Version
                    </label>
                    <Input
                      placeholder="1.0.0"
                      defaultValue="1.0.0"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Environnement
                    </label>
                    <Select
                      options={[
                        { value: 'development', label: 'Développement' },
                        { value: 'staging', label: 'Staging' },
                        { value: 'production', label: 'Production' }
                      ]}
                      defaultValue="development"
                    />
                  </div>
                </div>
              </Card.Content>
            </Card>

            <Card>
              <Card.Header>
                <Card.Title>Paramètres de Sécurité</Card.Title>
              </Card.Header>
              <Card.Content>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Durée de session (minutes)
                    </label>
                    <Input
                      type="number"
                      placeholder="30"
                      defaultValue="30"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tentatives de connexion max
                    </label>
                    <Input
                      type="number"
                      placeholder="5"
                      defaultValue="5"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Durée de blocage (minutes)
                    </label>
                    <Input
                      type="number"
                      placeholder="15"
                      defaultValue="15"
                    />
                  </div>
                </div>
              </Card.Content>
            </Card>

            <Card>
              <Card.Header>
                <Card.Title>Paramètres de Notification</Card.Title>
              </Card.Header>
              <Card.Content>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">
                      Notifications email
                    </span>
                    <input type="checkbox" defaultChecked className="rounded" />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">
                      Notifications push
                    </span>
                    <input type="checkbox" className="rounded" />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">
                      Notifications SMS
                    </span>
                    <input type="checkbox" className="rounded" />
                  </div>
                </div>
              </Card.Content>
            </Card>

            <Card>
              <Card.Header>
                <Card.Title>Paramètres de Sauvegarde</Card.Title>
              </Card.Header>
              <Card.Content>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Fréquence de sauvegarde
                    </label>
                    <Select
                      options={[
                        { value: 'daily', label: 'Quotidienne' },
                        { value: 'weekly', label: 'Hebdomadaire' },
                        { value: 'monthly', label: 'Mensuelle' }
                      ]}
                      defaultValue="daily"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Rétention (jours)
                    </label>
                    <Input
                      type="number"
                      placeholder="30"
                      defaultValue="30"
                    />
                  </div>
                  <Button variant="outline" className="w-full">
                    Lancer une sauvegarde maintenant
                  </Button>
                </div>
              </Card.Content>
            </Card>
          </div>
        </div>
      )
    }
  ];

  return (
    <Container size="xl" className="py-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Administration</h1>
            <p className="text-lg text-gray-600 mt-2">
              Gestion des utilisateurs, permissions et configuration système
            </p>
          </div>
          <div className="flex items-center gap-4">
            <ExportButton module="admin" />
            <Button
              variant="primary"
              leftIcon={<PlusIcon className="h-4 w-4" />}
              onClick={() => {
                setModalType('user');
                setIsCreateModalOpen(true);
              }}
            >
              Nouvel Utilisateur
            </Button>
          </div>
        </div>
      </div>

      {/* Statistiques rapides */}
      {statistics && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <Card.Content>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Utilisateurs</p>
                  <p className="text-2xl font-bold text-gray-900">{statistics.totalUsers}</p>
                  <p className="text-sm text-gray-500">{statistics.activeUsers} actifs</p>
                </div>
                <UserGroupIcon className="h-8 w-8 text-primary-600" />
              </div>
            </Card.Content>
          </Card>
          <Card>
            <Card.Content>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Rôles</p>
                  <p className="text-2xl font-bold text-gray-900">{statistics.totalRoles}</p>
                  <p className="text-sm text-gray-500">{statistics.activeRoles} actifs</p>
                </div>
                <ShieldCheckIcon className="h-8 w-8 text-primary-600" />
              </div>
            </Card.Content>
          </Card>
          <Card>
            <Card.Content>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Tenants</p>
                  <p className="text-2xl font-bold text-gray-900">{statistics.totalTenants}</p>
                  <p className="text-sm text-gray-500">{statistics.activeTenants} actifs</p>
                </div>
                <BuildingOfficeIcon className="h-8 w-8 text-primary-600" />
              </div>
            </Card.Content>
          </Card>
          <Card>
            <Card.Content>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Permissions</p>
                  <p className="text-2xl font-bold text-gray-900">{statistics.totalPermissions}</p>
                  <p className="text-sm text-gray-500">{statistics.modulePermissions} par module</p>
                </div>
                <ShieldCheckIcon className="h-8 w-8 text-primary-600" />
              </div>
            </Card.Content>
          </Card>
        </div>
      )}

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
        onClose={() => setIsCreateModalOpen(false)}
        title={`Nouveau ${modalType}`}
        size="lg"
      >
        <div className="space-y-4">
          <Input
            label="Nom"
            placeholder="Ex: John Doe"
            required
          />
          <Input
            label="Email"
            type="email"
            placeholder="Ex: john.doe@crou.gov"
            required
          />
          <Input
            label="Téléphone"
            placeholder="Ex: +227 90 12 34 56"
            required
          />
          <Select
            label="Rôle"
            options={[
              { value: 'admin', label: 'Administrateur' },
              { value: 'user', label: 'Utilisateur' },
              { value: 'viewer', label: 'Observateur' }
            ]}
            required
          />
          <div className="flex justify-end gap-3 pt-4">
            <Button
              variant="outline"
              onClick={() => setIsCreateModalOpen(false)}
            >
              Annuler
            </Button>
            <Button
              variant="primary"
              onClick={() => handleCreateItem({})}
            >
              Créer
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title={`Modifier ${modalType}`}
        size="lg"
      >
        <div className="space-y-4">
          <Input
            label="Nom"
            placeholder="Ex: John Doe"
            required
          />
          <Input
            label="Email"
            type="email"
            placeholder="Ex: john.doe@crou.gov"
            required
          />
          <Input
            label="Téléphone"
            placeholder="Ex: +227 90 12 34 56"
            required
          />
          <Select
            label="Rôle"
            options={[
              { value: 'admin', label: 'Administrateur' },
              { value: 'user', label: 'Utilisateur' },
              { value: 'viewer', label: 'Observateur' }
            ]}
            required
          />
          <div className="flex justify-end gap-3 pt-4">
            <Button
              variant="outline"
              onClick={() => setIsEditModalOpen(false)}
            >
              Annuler
            </Button>
            <Button
              variant="primary"
              onClick={() => handleUpdateItem({})}
            >
              Modifier
            </Button>
          </div>
        </div>
      </Modal>
    </Container>
  );
};

export default AdminPage;
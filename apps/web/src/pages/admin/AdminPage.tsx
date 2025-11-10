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

import React, { useState, useMemo } from 'react';
import { Container, Card, Badge, Button, DataTable, Modal, Input, Select, Tabs } from '@/components/ui';
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
import { useAuth } from '@/stores/auth';

export const AdminPage: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('users');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [modalType, setModalType] = useState<'user' | 'role' | 'tenant' | 'permission'>('user');
  
  const {
    users = [],
    loading: usersLoading,
    error: usersError,
    pagination: usersPagination,
    updatePagination: updateUsersPagination,
    createUser,
    updateUser,
    deleteUser,
    toggleUserStatus
  } = useAdminUsers();
  const { roles = [], loading: rolesLoading, error: rolesError, createRole, updateRole, deleteRole } = useAdminRoles();
  const { permissions = [], loading: permissionsLoading, error: permissionsError } = useAdminPermissions();
  const { tenants = [], loading: tenantsLoading, error: tenantsError, createTenant, updateTenant, deleteTenant } = useAdminTenants();
  const {
    auditLogs = [],
    loading: auditLoading,
    error: auditError,
    pagination: auditPagination,
    updatePagination: updateAuditPagination
  } = useAdminAudit();
  const { statistics, loading: statsLoading, error: statsError } = useAdminStatistics();

  // États pour les formulaires
  const [formData, setFormData] = useState<any>({});
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);

  // Hiérarchie des rôles (constante partagée)
  const roleHierarchy: Record<string, number> = {
    'Super Admin': 100,
    'Admin Ministère': 80,
    'Directeur CROU': 60,
    'Comptable': 40,
    'Gestionnaire Stocks': 30,
    'Gestionnaire Logement': 30,
    'Gestionnaire Transport': 30,
    'Utilisateur': 10
  };

  // Filtrage hiérarchique des rôles disponibles
  const availableRoles = useMemo(() => {
    if (!user || !roles) return [];

    const userRole = user.role as any;
    const userRoleName = userRole?.name || '';
    const currentUserLevel = roleHierarchy[userRoleName] || 0;

    // Super Admin peut tout voir
    if (userRoleName === 'Super Admin') {
      return roles;
    }

    // Filtrer pour ne montrer que les rôles de niveau inférieur
    return roles.filter((role: any) => {
      const roleLevel = roleHierarchy[role.name] || 0;
      return roleLevel < currentUserLevel;
    });
  }, [user, roles]);

  // Filtrage hiérarchique des utilisateurs affichés
  const visibleUsers = useMemo(() => {
    if (!user || !users) return [];

    const userRole = user.role as any;
    const userRoleName = userRole?.name || '';
    const currentUserLevel = roleHierarchy[userRoleName] || 0;

    // Super Admin et Admin Ministère peuvent voir tous les utilisateurs
    if (['Super Admin', 'Admin Ministère'].includes(userRoleName)) {
      return users;
    }

    // Les autres ne peuvent voir que les utilisateurs de niveau inférieur
    return users.filter((targetUser: any) => {
      const targetRoleName = targetUser.role?.name || '';
      const targetLevel = roleHierarchy[targetRoleName] || 0;
      return targetLevel < currentUserLevel;
    });
  }, [user, users]);

  // Réinitialiser le formulaire lors de l'ouverture des modals
  const openCreateModal = (type: 'user' | 'role' | 'tenant' | 'permission') => {
    setModalType(type);
    setFormData({});
    setSelectedPermissions([]);
    setIsCreateModalOpen(true);
  };

  const openEditModal = (type: 'user' | 'role' | 'tenant' | 'permission', item: any) => {
    setModalType(type);
    setSelectedItem(item);

    // Préparer les données du formulaire selon le type
    if (type === 'user') {
      // Pour les utilisateurs, extraire roleId et tenantId depuis les objets role et tenant
      setFormData({
        ...item,
        roleId: item.role?.id || item.roleId || '',
        tenantId: item.tenant?.id || item.tenantId || ''
      });
    } else if (type === 'role' && Array.isArray(item.permissions)) {
      setFormData(item);
      setSelectedPermissions(item.permissions.map((p: any) => p.id));
    } else {
      setFormData(item);
    }

    setIsEditModalOpen(true);
  };

  // Gestion de la création d'élément
  const handleCreateItem = async () => {
    try {
      const dataToSend = { ...formData };

      // Pour les rôles, ajouter les permissions sélectionnées
      if (modalType === 'role') {
        dataToSend.permissions = selectedPermissions;
      }

      switch (modalType) {
        case 'user':
          await createUser(dataToSend);
          break;
        case 'role':
          await createRole(dataToSend);
          break;
        case 'tenant':
          await createTenant(dataToSend);
          break;
        case 'permission':
          // Permissions creation not yet implemented
          console.warn('Permission creation not yet implemented');
          break;
      }
      setIsCreateModalOpen(false);
      setFormData({});
      setSelectedPermissions([]);
    } catch (err) {
      console.error('Erreur lors de la création:', err);
      alert('Erreur lors de la création. Vérifiez les champs requis.');
    }
  };

  // Gestion de la modification d'élément
  const handleUpdateItem = async () => {
    try {
      if (!selectedItem) return;

      const dataToSend = { ...formData };

      // Pour les rôles, ajouter les permissions sélectionnées
      if (modalType === 'role') {
        dataToSend.permissions = selectedPermissions;
      }

      switch (modalType) {
        case 'user':
          await updateUser(selectedItem.id, dataToSend);
          break;
        case 'role':
          await updateRole(selectedItem.id, dataToSend);
          break;
        case 'tenant':
          await updateTenant(selectedItem.id, dataToSend);
          break;
        case 'permission':
          // Permissions update not yet implemented
          console.warn('Permission update not yet implemented');
          break;
      }
      setIsEditModalOpen(false);
      setFormData({});
      setSelectedPermissions([]);
      setSelectedItem(null);
    } catch (err) {
      console.error('Erreur lors de la modification:', err);
      alert('Erreur lors de la modification. Vérifiez les champs requis.');
    }
  };

  // Colonnes du tableau des rôles
  const roleColumns = [
    {
      key: 'name',
      label: 'Nom du Rôle',
      render: (role: any) => (
        <div>
          <p className="font-medium">{role.name}</p>
          <p className="text-sm text-gray-500">{role.description || 'Aucune description'}</p>
        </div>
      )
    },
    {
      key: 'type',
      label: 'Type',
      render: (role: any) => (
        <Badge variant="secondary" className="capitalize">
          {role.tenantType || 'Global'}
        </Badge>
      )
    },
    {
      key: 'permissions',
      label: 'Permissions',
      render: (role: any) => (
        <Badge variant="info">{Array.isArray(role.permissions) ? role.permissions.length : 0} permissions</Badge>
      )
    },
    {
      key: 'users',
      label: 'Utilisateurs',
      render: (role: any) => (
        <span className="text-sm text-gray-600">{role.userCount || role.users?.length || role.userCount || 0} utilisateurs</span>
      )
    },
    {
      key: 'status',
      label: 'Statut',
      render: (role: any) => (
        <Badge variant={role.isActive !== false ? 'success' : 'danger'}>
          {role.isActive !== false ? 'Actif' : 'Inactif'}
        </Badge>
      )
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (role: any) => (
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            leftIcon={<EyeIcon className="h-4 w-4" />}
            onClick={() => openEditModal('role', role)}
          >
            Voir
          </Button>
        </div>
      )
    }
  ];

  // Colonnes du tableau des tenants
  const tenantColumns = [
    {
      key: 'name',
      label: 'Nom du Tenant',
      render: (tenant: any) => (
        <div>
          <p className="font-medium">{tenant.name}</p>
          <p className="text-sm text-gray-500">Code: {tenant.code}</p>
        </div>
      )
    },
    {
      key: 'type',
      label: 'Type',
      render: (tenant: any) => (
        <div>
          <Badge variant="secondary" className="capitalize">{tenant.type}</Badge>
          {tenant.serviceType && (
            <p className="text-xs text-gray-500 mt-1 capitalize">{tenant.serviceType}</p>
          )}
        </div>
      )
    },
    {
      key: 'hierarchy',
      label: 'Hiérarchie',
      render: (tenant: any) => (
        <div>
          <p className="text-sm text-gray-600">{tenant.parent?.name || 'Niveau 0 (Racine)'}</p>
          {tenant.level !== undefined && (
            <p className="text-xs text-gray-400">Niveau {tenant.level}</p>
          )}
        </div>
      )
    },
    {
      key: 'region',
      label: 'Région',
      render: (tenant: any) => (
        <span className="text-sm text-gray-600">{tenant.region || '-'}</span>
      )
    },
    {
      key: 'status',
      label: 'Statut',
      render: (tenant: any) => (
        <Badge variant={tenant.isActive ? 'success' : 'danger'}>
          {tenant.isActive ? 'Actif' : 'Inactif'}
        </Badge>
      )
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (tenant: any) => (
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            leftIcon={<EyeIcon className="h-4 w-4" />}
            onClick={() => openEditModal('tenant', tenant)}
          >
            Voir
          </Button>
        </div>
      )
    }
  ];

  // Colonnes du tableau des permissions
  const permissionColumns = [
    {
      key: 'resource',
      label: 'Ressource',
      key: 'resource',
      label: 'Ressource',
      render: (permission: any) => (
        <div>
          <p className="font-medium">{permission.resource}</p>
          <p className="text-sm text-gray-500">{permission.description || 'Aucune description'}</p>
        </div>
      )
    },
    {
      key: 'actions',
      label: 'Actions',
      key: 'actions',
      label: 'Actions',
      render: (permission: any) => (
        <div className="flex flex-wrap gap-1">
          {(Array.isArray(permission.actions) ? permission.actions : [permission.action]).map((action: string, index: number) => (
            <Badge key={index} variant="info">{action}</Badge>
          ))}
        </div>
      )
    },
    {
      key: 'status',
      label: 'Statut',
      key: 'status',
      label: 'Statut',
      render: (permission: any) => (
        <Badge variant={permission.isActive ? 'success' : 'danger'}>
          {permission.isActive ? 'Actif' : 'Inactif'}
        </Badge>
      )
    }
  ];

  // Colonnes du tableau des logs d'audit
  const auditColumns = [
    {
      key: 'user',
      label: 'Utilisateur',
      render: (log: any) => (
        <div>
          <p className="font-medium">{log.userName || 'Inconnu'}</p>
          <p className="text-sm text-gray-500">{log.userEmail}</p>
        </div>
      )
    },
    {
      key: 'action',
      label: 'Action',
      render: (log: any) => (
        <Badge variant="secondary">{log.action}</Badge>
      )
    },
    {
      key: 'resource',
      label: 'Ressource',
      render: (log: any) => (
        <div>
          <p className="font-medium">{log.resource}</p>
          <p className="text-sm text-gray-500">{log.resourceId?.substring(0, 8)}</p>
        </div>
      )
    },
    {
      key: 'timestamp',
      label: 'Date',
      render: (log: any) => (
        <div>
          <p className="font-medium">
            {new Date(log.createdAt).toLocaleDateString()}
          </p>
          <p className="text-sm text-gray-500">
            {new Date(log.createdAt).toLocaleTimeString()}
          </p>
        </div>
      )
    },
    {
      key: 'ip',
      label: 'IP',
      render: (log: any) => (
        <span className="text-sm font-mono">{log.ipAddress || 'N/A'}</span>
      )
    }
  ];

  // Colonnes du tableau des utilisateurs
  const userColumns = [
    {
      key: 'user',
      label: 'Utilisateur',
      render: (user: any) => (
        <div>
          <p className="font-medium">{user.name || `${user.firstName || ''} ${user.lastName || ''}`.trim()}</p>
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
        <Badge variant={user.status === 'active' || user.isActive ? 'success' : 'danger'}>
          {user.status === 'active' || user.isActive ? 'Actif' : 'Inactif'}
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
      render: (targetUser: any) => {
        // Vérifier si l'utilisateur connecté peut modifier/supprimer cet utilisateur
        const currentUserRole = (user?.role as any)?.name || '';
        const targetRoleName = targetUser.role?.name || '';
        const currentUserLevel = roleHierarchy[currentUserRole] || 0;
        const targetLevel = roleHierarchy[targetRoleName] || 0;

        // Peut modifier/supprimer seulement si le niveau cible est inférieur
        const canModify = currentUserRole === 'Super Admin' || targetLevel < currentUserLevel;

        return (
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              leftIcon={<EyeIcon className="h-4 w-4" />}
              onClick={() => openEditModal('user', targetUser)}
            >
              Voir
            </Button>
            <Button
              size="sm"
              variant="outline"
              leftIcon={<PencilIcon className="h-4 w-4" />}
              onClick={() => openEditModal('user', targetUser)}
              disabled={!canModify}
              title={!canModify ? `Vous ne pouvez pas modifier un utilisateur avec le rôle "${targetRoleName}"` : ''}
            >
              Modifier
            </Button>
            <Button
              size="sm"
              variant="outline"
              leftIcon={<TrashIcon className="h-4 w-4" />}
              onClick={() => deleteUser(targetUser.id)}
              disabled={!canModify}
              title={!canModify ? `Vous ne pouvez pas supprimer un utilisateur avec le rôle "${targetRoleName}"` : ''}
            >
              Supprimer
            </Button>
          </div>
        );
      }
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
              onClick={() => openCreateModal('user')}
              leftIcon={<PlusIcon className="h-4 w-4" />}
            >
              Nouvel Utilisateur
            </Button>
          </div>

          <Card>
            <Card.Header>
              <Card.Title>Liste des Utilisateurs ({usersPagination?.total || 0})</Card.Title>
            </Card.Header>
            <Card.Content>
              <DataTable
                data={visibleUsers || []}
                columns={userColumns}
                loading={usersLoading}
                emptyMessage="Aucun utilisateur trouvé"
                onRowClick={(item) => openEditModal('user', item)}
                pagination={usersPagination ? {
                  page: usersPagination.page,
                  limit: usersPagination.limit,
                  total: usersPagination.total,
                  onPageChange: (page) => updateUsersPagination({ page }),
                  onLimitChange: (limit) => updateUsersPagination({ limit, page: 1 })
                } : undefined}
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
              onClick={() => openCreateModal('role')}
              leftIcon={<PlusIcon className="h-4 w-4" />}
            >
              Nouveau Rôle
            </Button>
          </div>

          <Card>
            <Card.Header>
              <Card.Title>Liste des Rôles ({(roles || []).length})</Card.Title>
            </Card.Header>
            <Card.Content>
              <DataTable
                data={roles || []}
                columns={roleColumns}
                loading={rolesLoading}
                emptyMessage="Aucun rôle trouvé"
                onRowClick={(item) => openEditModal('role', item)}
              />
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
              onClick={() => openCreateModal('tenant')}
              leftIcon={<PlusIcon className="h-4 w-4" />}
            >
              Nouveau Tenant
            </Button>
          </div>

          <Card>
            <Card.Header>
              <Card.Title>Liste des Tenants ({(tenants || []).length})</Card.Title>
            </Card.Header>
            <Card.Content>
              <DataTable
                data={tenants || []}
                columns={tenantColumns}
                loading={tenantsLoading}
                emptyMessage="Aucun tenant trouvé"
                onRowClick={(item) => openEditModal('tenant', item)}
              />
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
              onClick={() => openCreateModal('permission')}
              leftIcon={<PlusIcon className="h-4 w-4" />}
            >
              Nouvelle Permission
            </Button>
          </div>

          <Card>
            <Card.Header>
              <Card.Title>Liste des Permissions ({(permissions || []).length})</Card.Title>
            </Card.Header>
            <Card.Content>
              <DataTable
                data={permissions || []}
                columns={permissionColumns}
                loading={permissionsLoading}
                emptyMessage="Aucune permission trouvée"
                onRowClick={(item) => openEditModal('permission', item)}
              />
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
              <Card.Title>Logs d'Audit ({auditPagination?.total || 0})</Card.Title>
            </Card.Header>
            <Card.Content>
              <DataTable
                data={auditLogs || []}
                columns={auditColumns}
                loading={auditLoading}
                emptyMessage="Aucun log d'audit trouvé"
                pagination={auditPagination ? {
                  page: auditPagination.page,
                  limit: auditPagination.limit,
                  total: auditPagination.total,
                  onPageChange: (page) => updateAuditPagination({ page }),
                  onLimitChange: (limit) => updateAuditPagination({ limit, page: 1 })
                } : undefined}
              />
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
        title={`Nouveau ${modalType === 'user' ? 'utilisateur' : modalType === 'role' ? 'rôle' : modalType === 'tenant' ? 'tenant' : 'permission'}`}
        size="lg"
      >
        <div className="space-y-4">
          {modalType === 'user' && (
            <>
              <Input
                label="Nom"
                placeholder="Ex: John Doe"
                value={formData.name || ''}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                required
              />
              <Input
                label="Email"
                type="email"
                placeholder="Ex: john.doe@crou.gov"
                value={formData.email || ''}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                required
              />
              <Input
                label="Téléphone"
                placeholder="Ex: +227 90 12 34 56"
                value={formData.phone || ''}
                onChange={(e) => setFormData({...formData, phone: e.target.value})}
              />
              <Select
                label="Rôle"
                options={(availableRoles || []).map(r => ({ value: r.id, label: r.name }))}
                value={formData.roleId || ''}
                onChange={(value) => setFormData({...formData, roleId: value})}
                required
              />
              <Select
                label="Tenant"
                options={(tenants || []).map(t => ({ value: t.id, label: t.name }))}
                value={formData.tenantId || ''}
                onChange={(value) => setFormData({...formData, tenantId: value})}
                required
              />
            </>
          )}

          {modalType === 'role' && (
            <>
              <Input
                label="Nom du rôle"
                placeholder="Ex: Gestionnaire"
                value={formData.name || ''}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                required
              />
              <Input
                label="Description"
                placeholder="Description du rôle"
                value={formData.description || ''}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
              />
              <div className="border rounded p-4">
                <label className="block text-sm font-medium mb-2">Permissions</label>
                <div className="max-h-48 overflow-y-auto space-y-2">
                  {(permissions || []).map(perm => (
                    <label key={perm.id} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        className="rounded"
                        checked={selectedPermissions.includes(perm.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedPermissions([...selectedPermissions, perm.id]);
                          } else {
                            setSelectedPermissions(selectedPermissions.filter(id => id !== perm.id));
                          }
                        }}
                      />
                      <span className="text-sm">{perm.resource} ({perm.actions.join(', ')})</span>
                    </label>
                  ))}
                </div>
              </div>
            </>
          )}

          {modalType === 'tenant' && (
            <>
              <Input
                label="Nom du tenant"
                placeholder="Ex: CROU Niamey"
                value={formData.name || ''}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                required
              />
              <Input
                label="Code"
                placeholder="Ex: CROU-NIA"
                value={formData.code || ''}
                onChange={(e) => setFormData({...formData, code: e.target.value})}
                required
              />
              <Select
                label="Type"
                options={[
                  { value: 'ministere', label: 'Ministère' },
                  { value: 'crou', label: 'CROU' },
                  { value: 'service', label: 'Service' }
                ]}
                value={formData.type || ''}
                onChange={(value) => setFormData({...formData, type: value})}
                required
              />
              <Select
                label="Tenant Parent"
                options={[{ value: '', label: 'Aucun' }, ...(tenants || []).map(t => ({ value: t.id, label: t.name }))]}
                value={formData.parentId || ''}
                onChange={(value) => setFormData({...formData, parentId: value})}
              />
              <Input
                label="Région"
                placeholder="Ex: Niamey, Dosso, Maradi"
                value={formData.region || ''}
                onChange={(e) => setFormData({...formData, region: e.target.value})}
              />
              {formData.type === 'service' && (
                <Select
                  label="Type de Service"
                  options={[
                    { value: 'financial', label: 'Financier' },
                    { value: 'stocks', label: 'Stocks' },
                    { value: 'transport', label: 'Transport' },
                    { value: 'logement', label: 'Logement' },
                    { value: 'restauration', label: 'Restauration' }
                  ]}
                  value={formData.serviceType || ''}
                  onChange={(value) => setFormData({...formData, serviceType: value})}
                />
              )}
            </>
          )}

          {modalType === 'permission' && (
            <>
              <Input
                label="Ressource"
                placeholder="Ex: users, financial, reports"
                value={formData.resource || ''}
                onChange={(value) => setFormData({...formData, resource: value})}
                required
              />
              <div className="border rounded p-4">
                <label className="block text-sm font-medium mb-2">Actions autorisées *</label>
                <div className="space-y-2">
                  {['read', 'write', 'validate', 'delete', 'export'].map(action => (
                    <label key={action} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        className="rounded"
                        checked={(formData.actions || []).includes(action)}
                        onChange={(e) => {
                          const currentActions = formData.actions || [];
                          if (e.target.checked) {
                            setFormData({...formData, actions: [...currentActions, action]});
                          } else {
                            setFormData({...formData, actions: currentActions.filter((a: string) => a !== action)});
                          }
                        }}
                      />
                      <span className="text-sm capitalize">{action}</span>
                    </label>
                  ))}
                </div>
              </div>
              <Input
                label="Description"
                placeholder="Description de la permission"
                value={formData.description || ''}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
              />
            </>
          )}

          <div className="flex justify-end gap-3 pt-4">
            <Button variant="outline" onClick={() => setIsCreateModalOpen(false)}>
              Annuler
            </Button>
            <Button variant="primary" onClick={handleCreateItem}>
              Créer
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title={`Modifier ${modalType === 'user' ? "l'utilisateur" : modalType === 'role' ? 'le rôle' : modalType === 'tenant' ? 'le tenant' : 'la permission'}`}
        size="lg"
      >
        <div className="space-y-4">
          {modalType === 'user' && selectedItem && (
            <>
              <Input
                label="Nom"
                placeholder="Ex: John Doe"
                value={formData.name || ''}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                required
              />
              <Input
                label="Email"
                type="email"
                placeholder="Ex: john.doe@crou.gov"
                value={formData.email || ''}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                required
              />
              <Input
                label="Téléphone"
                placeholder="Ex: +227 90 12 34 56"
                value={formData.phone || ''}
                onChange={(e) => setFormData({...formData, phone: e.target.value})}
              />
              <Select
                label="Rôle"
                options={(availableRoles || []).map(r => ({ value: r.id, label: r.name }))}
                value={formData.roleId || ''}
                onChange={(value) => setFormData({...formData, roleId: value})}
                required
              />
              <Select
                label="Tenant"
                options={(tenants || []).map(t => ({ value: t.id, label: t.name }))}
                value={formData.tenantId || ''}
                onChange={(value) => setFormData({...formData, tenantId: value})}
                required
              />
              <Select
                label="Statut"
                options={[
                  { value: 'active', label: 'Actif' },
                  { value: 'inactive', label: 'Inactif' },
                  { value: 'suspended', label: 'Suspendu' }
                ]}
                value={formData.status || ''}
                onChange={(value) => setFormData({...formData, status: value})}
                required
              />
            </>
          )}

          {modalType === 'role' && selectedItem && (
            <>
              <Input
                label="Nom du rôle"
                placeholder="Ex: Gestionnaire"
                value={formData.name || ''}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                required
              />
              <Input
                label="Description"
                placeholder="Description du rôle"
                value={formData.description || ''}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
              />
              <div className="border rounded p-4">
                <label className="block text-sm font-medium mb-2">Permissions</label>
                <div className="max-h-48 overflow-y-auto space-y-2">
                  {(permissions || []).map(perm => (
                    <label key={perm.id} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        className="rounded"
                        checked={selectedPermissions.includes(perm.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedPermissions([...selectedPermissions, perm.id]);
                          } else {
                            setSelectedPermissions(selectedPermissions.filter(id => id !== perm.id));
                          }
                        }}
                      />
                      <span className="text-sm">{perm.resource} ({perm.actions.join(', ')})</span>
                    </label>
                  ))}
                </div>
              </div>
            </>
          )}

          {modalType === 'tenant' && selectedItem && (
            <>
              <Input
                label="Nom du tenant"
                placeholder="Ex: CROU Niamey"
                value={formData.name || ''}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                required
              />
              <Input
                label="Code"
                placeholder="Ex: CROU-NIA"
                value={formData.code || ''}
                onChange={(e) => setFormData({...formData, code: e.target.value})}
                required
              />
              <Select
                label="Type"
                options={[
                  { value: 'ministere', label: 'Ministère' },
                  { value: 'crou', label: 'CROU' },
                  { value: 'service', label: 'Service' }
                ]}
                value={formData.type || ''}
                onChange={(value) => setFormData({...formData, type: value})}
                required
              />
              <Select
                label="Tenant Parent"
                options={[{ value: '', label: 'Aucun' }, ...(tenants || []).map(t => ({ value: t.id, label: t.name }))]}
                value={formData.parentId || ''}
                onChange={(value) => setFormData({...formData, parentId: value})}
              />
              <Input
                label="Région"
                placeholder="Ex: Niamey, Dosso, Maradi"
                value={formData.region || ''}
                onChange={(e) => setFormData({...formData, region: e.target.value})}
              />
              {formData.type === 'service' && (
                <Select
                  label="Type de Service"
                  options={[
                    { value: 'financial', label: 'Financier' },
                    { value: 'stocks', label: 'Stocks' },
                    { value: 'transport', label: 'Transport' },
                    { value: 'logement', label: 'Logement' },
                    { value: 'restauration', label: 'Restauration' }
                  ]}
                  value={formData.serviceType || ''}
                  onChange={(value) => setFormData({...formData, serviceType: value})}
                />
              )}
              <Select
                label="Statut"
                options={[
                  { value: 'active', label: 'Actif' },
                  { value: 'inactive', label: 'Inactif' }
                ]}
                value={formData.isActive !== undefined ? (formData.isActive ? 'active' : 'inactive') : ''}
                onChange={(value) => setFormData({...formData, isActive: value === 'active'})}
                required
              />
            </>
          )}

          {modalType === 'permission' && selectedItem && (
            <>
              <Input
                label="Ressource"
                placeholder="Ex: users, financial, reports"
                value={formData.resource || ''}
                onChange={(value) => setFormData({...formData, resource: value})}
                required
              />
              <div className="border rounded p-4">
                <label className="block text-sm font-medium mb-2">Actions autorisées *</label>
                <div className="space-y-2">
                  {['read', 'write', 'validate', 'delete', 'export'].map(action => (
                    <label key={action} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        className="rounded"
                        checked={(formData.actions || []).includes(action)}
                        onChange={(e) => {
                          const currentActions = formData.actions || [];
                          if (e.target.checked) {
                            setFormData({...formData, actions: [...currentActions, action]});
                          } else {
                            setFormData({...formData, actions: currentActions.filter((a: string) => a !== action)});
                          }
                        }}
                      />
                      <span className="text-sm capitalize">{action}</span>
                    </label>
                  ))}
                </div>
              </div>
              <Input
                label="Description"
                placeholder="Description de la permission"
                value={formData.description || ''}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
              />
            </>
          )}

          <div className="flex justify-end gap-3 pt-4">
            <Button variant="outline" onClick={() => setIsEditModalOpen(false)}>
              Annuler
            </Button>
            <Button variant="primary" onClick={handleUpdateItem}>
              Modifier
            </Button>
          </div>
        </div>
      </Modal>
    </Container>
  );
};

export default AdminPage;
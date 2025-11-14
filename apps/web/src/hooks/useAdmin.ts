/**
 * FICHIER: apps/web/src/hooks/useAdmin.ts
 * HOOKS: Hooks personnalisés pour la gestion administrative
 *
 * DESCRIPTION:
 * Hooks React personnalisés pour la gestion administrative
 * Simplification de l'utilisation du store Zustand
 * Gestion automatique du chargement et des erreurs
 *
 * FONCTIONNALITÉS:
 * - Hooks pour utilisateurs, rôles, permissions
 * - Hooks pour tenants et audit
 * - Gestion automatique du chargement
 * - Filtres et pagination
 * - Cache et synchronisation
 *
 * AUTEUR: Équipe CROU
 * DATE: Décembre 2024
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '@/stores/auth';
import { useAdmin } from '@/stores/admin';
import { CreateUserRequest, UpdateUserRequest, User, UserRole, Permission, Tenant } from '@/services/api/adminService';

// Hook pour la gestion des utilisateurs
export const useAdminUsers = () => {
  const { user } = useAuth();
  const {
    users,
    usersLoading: loading,
    usersError: error,
    filters,
    pagination,
    loadUsers,
    createUser,
    updateUser,
    deleteUser,
    toggleUserStatus,
    resetUserPassword,
    setUserFilters,
    setUserPagination
  } = useAdmin();

  // Extraire les filtres et pagination pour users
  // Note: Ne pas utiliser useMemo ici car cela casse le système de sélecteurs Zustand
  const userFilters = filters?.users;
  const userPagination = pagination?.users;

  console.log('🎣 HOOK useAdminUsers - filters:', filters);
  console.log('🎣 HOOK useAdminUsers - pagination:', pagination);
  console.log('🎣 HOOK useAdminUsers - userFilters:', userFilters);
  console.log('🎣 HOOK useAdminUsers - userPagination:', userPagination);

  // Charger les utilisateurs au montage
  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  // Fonctions de gestion avec rechargement automatique
  const handleCreateUser = useCallback(async (data: CreateUserRequest) => {
    await createUser(data);
    await loadUsers(); // Recharger après création
  }, [createUser, loadUsers]);

  const handleUpdateUser = useCallback(async (id: string, data: UpdateUserRequest) => {
    await updateUser(id, data);
    await loadUsers(); // Recharger après mise à jour
  }, [updateUser, loadUsers]);

  const handleDeleteUser = useCallback(async (id: string) => {
    await deleteUser(id);
    await loadUsers(); // Recharger après suppression
  }, [deleteUser, loadUsers]);

  const handleToggleUserStatus = useCallback(async (id: string, isActive: boolean) => {
    await toggleUserStatus(id, isActive);
    await loadUsers(); // Recharger après changement de statut
  }, [toggleUserStatus, loadUsers]);

  const handleResetPassword = useCallback(async (id: string, newPassword: string) => {
    await resetUserPassword(id, newPassword);
  }, [resetUserPassword]);

  const updateFilters = useCallback((newFilters: Partial<typeof userFilters>) => {
    setUserFilters(newFilters);
    // Recharger avec les nouveaux filtres
    setTimeout(() => loadUsers(), 0);
  }, [setUserFilters, loadUsers, userFilters]);

  // Nouvelle fonction updatePagination qui recharge automatiquement
  const updatePagination = useCallback((newPagination: Partial<typeof userPagination>) => {
    setUserPagination(newPagination);
    // Recharger avec la nouvelle pagination
    setTimeout(() => loadUsers(), 0);
  }, [setUserPagination, loadUsers, userPagination]);

  const resetFilters = useCallback(() => {
    setUserFilters({
      search: '',
      role: 'all',
      isActive: 'all',
      tenantId: 'all'
    });
  }, [setUserFilters]);

  // Forcer users à être un tableau
  const safeUsers = Array.isArray(users) ? users : [];

  return {
    users: safeUsers,
    loading,
    error,
    filters: userFilters,
    pagination: userPagination,
    createUser: handleCreateUser,
    updateUser: handleUpdateUser,
    deleteUser: handleDeleteUser,
    toggleUserStatus: handleToggleUserStatus,
    resetPassword: handleResetPassword,
    updateFilters,
    updatePagination,
    resetFilters,
    refresh: loadUsers
  };
};

// Hook pour la gestion des rôles
export const useAdminRoles = () => {
  const {
    roles,
    rolesLoading: loading,
    rolesError: error,
    loadRoles,
    createRole,
    updateRole,
    deleteRole
  } = useAdmin();

  // Debug: vérifier le type de roles
  useEffect(() => {
    console.log('[useAdminRoles] roles type:', typeof roles, 'isArray:', Array.isArray(roles), 'value:', roles);
  }, [roles]);

  // Charger les rôles au montage
  useEffect(() => {
    loadRoles();
  }, [loadRoles]);

  // Fonctions de gestion
  const handleCreateRole = useCallback(async (data: { name: string; description: string; permissions: string[] }) => {
    await createRole(data);
  }, [createRole]);

  const handleUpdateRole = useCallback(async (id: string, data: { name?: string; description?: string; permissions?: string[] }) => {
    await updateRole(id, data);
  }, [updateRole]);

  const handleDeleteRole = useCallback(async (id: string) => {
    await deleteRole(id);
  }, [deleteRole]);

  // Forcer roles à être un tableau
  const safeRoles = Array.isArray(roles) ? roles : [];

  return {
    roles: safeRoles,
    loading,
    error,
    createRole: handleCreateRole,
    updateRole: handleUpdateRole,
    deleteRole: handleDeleteRole,
    refresh: loadRoles
  };
};

// Hook pour la gestion des permissions
export const useAdminPermissions = () => {
  const {
    permissions,
    permissionsLoading: loading,
    permissionsError: error,
    loadPermissions,
    loadPermissionsByModule
  } = useAdmin();

  // Charger les permissions au montage
  useEffect(() => {
    loadPermissions();
  }, [loadPermissions]);

  // Fonctions de gestion
  const handleLoadPermissionsByModule = useCallback(async (module: string) => {
    return await loadPermissionsByModule(module);
  }, [loadPermissionsByModule]);

  // Forcer permissions à être un tableau
  const safePermissions = Array.isArray(permissions) ? permissions : [];

  return {
    permissions: safePermissions,
    loading,
    error,
    loadPermissionsByModule: handleLoadPermissionsByModule,
    refresh: loadPermissions
  };
};

// Hook pour la gestion des tenants
export const useAdminTenants = () => {
  const {
    tenants,
    tenantsLoading: loading,
    tenantsError: error,
    loadTenants,
    createTenant,
    updateTenant,
    deleteTenant
  } = useAdmin();

  // Charger les tenants au montage
  useEffect(() => {
    loadTenants();
  }, [loadTenants]);

  // Fonctions de gestion
  const handleCreateTenant = useCallback(async (data: any) => {
    await createTenant(data);
  }, [createTenant]);

  const handleUpdateTenant = useCallback(async (id: string, data: any) => {
    await updateTenant(id, data);
  }, [updateTenant]);

  const handleDeleteTenant = useCallback(async (id: string) => {
    await deleteTenant(id);
  }, [deleteTenant]);

  // Forcer tenants à être un tableau
  const safeTenants = Array.isArray(tenants) ? tenants : [];

  return {
    tenants: safeTenants,
    loading,
    error,
    createTenant: handleCreateTenant,
    updateTenant: handleUpdateTenant,
    deleteTenant: handleDeleteTenant,
    refresh: loadTenants
  };
};

// Hook pour la gestion de l'audit
export const useAdminAudit = () => {
  const {
    auditLogs,
    auditLoading: loading,
    auditError: error,
    filters,
    pagination,
    loadAuditLogs,
    setAuditFilters,
    setAuditPagination
  } = useAdmin();

  // Extraire les filtres et pagination pour audit
  const auditFilters = filters?.audit;
  const auditPagination = pagination?.audit;

  // Charger les logs d'audit au montage
  useEffect(() => {
    loadAuditLogs();
  }, [loadAuditLogs]);

  // Fonctions de gestion
  const updateFilters = useCallback((newFilters: Partial<typeof auditFilters>) => {
    setAuditFilters(newFilters);
  }, [setAuditFilters, auditFilters]);

  const updatePagination = useCallback((newPagination: Partial<typeof auditPagination>) => {
    setAuditPagination(newPagination);
  }, [setAuditPagination, auditPagination]);

  const resetFilters = useCallback(() => {
    setAuditFilters({
      userId: 'all',
      action: 'all',
      resource: 'all',
      dateFrom: '',
      dateTo: ''
    });
  }, [setAuditFilters]);

  // Forcer auditLogs à être un tableau
  const safeAuditLogs = Array.isArray(auditLogs) ? auditLogs : [];

  return {
    auditLogs: safeAuditLogs,
    loading,
    error,
    filters: auditFilters,
    pagination: auditPagination,
    updateFilters,
    updatePagination,
    resetFilters,
    refresh: loadAuditLogs
  };
};

// Hook pour les statistiques administratives
export const useAdminStatistics = () => {
  const {
    statistics,
    statisticsLoading: loading,
    statisticsError: error,
    loadStatistics
  } = useAdmin();

  // Charger les statistiques au montage
  useEffect(() => {
    loadStatistics();
  }, [loadStatistics]);

  return {
    statistics,
    loading,
    error,
    refresh: loadStatistics
  };
};

// Hook pour la gestion des utilisateurs avec recherche
export const useUserSearch = () => {
  const { users, loading, error, updateFilters, filters } = useAdminUsers();
  const [searchTerm, setSearchTerm] = useState('');

  // Effectuer la recherche
  const search = useCallback((term: string) => {
    setSearchTerm(term);
    updateFilters({ search: term });
  }, [updateFilters]);

  // Filtrer les utilisateurs localement pour une recherche instantanée
  const filteredUsers = users.filter(user => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      user.firstName.toLowerCase().includes(term) ||
      user.lastName.toLowerCase().includes(term) ||
      user.email.toLowerCase().includes(term) ||
      user.role.name.toLowerCase().includes(term)
    );
  });

  return {
    users: filteredUsers,
    loading,
    error,
    searchTerm,
    search,
    clearSearch: () => search('')
  };
};

// Hook pour la gestion des permissions par module
export const useModulePermissions = (module: string) => {
  const { permissions, loading, error, loadPermissionsByModule } = useAdminPermissions();
  const [modulePermissions, setModulePermissions] = useState<Permission[]>([]);

  // Charger les permissions du module
  useEffect(() => {
    if (module) {
      loadPermissionsByModule(module).then(setModulePermissions);
    }
  }, [module, loadPermissionsByModule]);

  return {
    permissions: modulePermissions,
    loading,
    error,
    refresh: () => loadPermissionsByModule(module).then(setModulePermissions)
  };
};

// Hook pour la gestion des utilisateurs par tenant
export const useTenantUsers = (tenantId: string) => {
  const { users, loading, error, updateFilters } = useAdminUsers();
  const [tenantUsers, setTenantUsers] = useState<User[]>([]);

  // Filtrer les utilisateurs par tenant
  useEffect(() => {
    if (tenantId) {
      const filtered = users.filter(user => user.tenantId === tenantId);
      setTenantUsers(filtered);
    }
  }, [users, tenantId]);

  return {
    users: tenantUsers,
    loading,
    error,
    refresh: () => updateFilters({ tenantId })
  };
};

// Hook pour la gestion des rôles avec permissions
export const useRoleWithPermissions = (roleId: string) => {
  const { roles, loading: rolesLoading, error: rolesError } = useAdminRoles();
  const { permissions, loading: permissionsLoading, error: permissionsError } = useAdminPermissions();
  const [role, setRole] = useState<UserRole | null>(null);

  // Trouver le rôle et ses permissions
  useEffect(() => {
    if (roleId && roles.length > 0) {
      const foundRole = roles.find(r => r.id === roleId);
      if (foundRole) {
        setRole(foundRole);
      }
    }
  }, [roleId, roles]);

  return {
    role,
    permissions,
    loading: rolesLoading || permissionsLoading,
    error: rolesError || permissionsError
  };
};

// Hook pour la gestion des statistiques en temps réel
export const useRealtimeStatistics = () => {
  const { statistics, loading, error, refresh } = useAdminStatistics();
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Rafraîchir les statistiques
  const refreshStats = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await refresh();
    } finally {
      setIsRefreshing(false);
    }
  }, [refresh]);

  // Rafraîchir automatiquement toutes les 30 secondes
  useEffect(() => {
    const interval = setInterval(refreshStats, 30000);
    return () => clearInterval(interval);
  }, [refreshStats]);

  return {
    statistics,
    loading: loading || isRefreshing,
    error,
    refresh: refreshStats
  };
};

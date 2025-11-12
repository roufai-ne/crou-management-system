/**
 * FICHIER: apps/web/src/stores/admin.ts
 * STORE: AdminStore - Store Zustand pour la gestion administrative
 *
 * DESCRIPTION:
 * Store centralisé pour la gestion de l'état administratif
 * Gestion des utilisateurs, rôles, permissions et tenants
 * Support multi-tenant avec cache intelligent
 *
 * FONCTIONNALITÉS:
 * - Gestion des utilisateurs (CRUD)
 * - Gestion des rôles et permissions
 * - Gestion des tenants
 * - Audit et logs
 * - Statistiques administratives
 * - Cache et synchronisation
 *
 * AUTEUR: Équipe CROU
 * DATE: Décembre 2024
 */

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import {
  User,
  CreateUserRequest,
  UpdateUserRequest,
  Role,
  Permission,
  Tenant,
  CreateTenantRequest,
  UpdateTenantRequest,
  AuditLog,
  AdminStatistics,
  adminService
} from '@/services/api/adminService';

// Interface pour l'état administratif
interface AdminState {
  // Utilisateurs
  users: User[];
  usersLoading: boolean;
  usersError: string | null;
  
  // Rôles
  roles: Role[];
  rolesLoading: boolean;
  rolesError: string | null;
  
  // Permissions
  permissions: Permission[];
  permissionsLoading: boolean;
  permissionsError: string | null;
  
  // Tenants
  tenants: Tenant[];
  tenantsLoading: boolean;
  tenantsError: string | null;
  
  // Audit
  auditLogs: AuditLog[];
  auditLoading: boolean;
  auditError: string | null;
  
  // Statistiques
  statistics: AdminStatistics | null;
  statisticsLoading: boolean;
  statisticsError: string | null;
  
  // Configuration système
  systemConfig: any;
  configLoading: boolean;
  configError: string | null;
  
  // Filtres et pagination
  filters: {
    users: {
      search: string;
      role: string;
      isActive: string;
      tenantId: string;
    };
    audit: {
      userId: string;
      action: string;
      resource: string;
      dateFrom: string;
      dateTo: string;
    };
  };
  
  pagination: {
    users: {
      page: number;
      limit: number;
      total: number;
    };
    audit: {
      page: number;
      limit: number;
      total: number;
    };
  };
  
  // Cache
  lastFetch: number | null;
  cacheExpiry: number; // 5 minutes
}

// Interface pour les actions
interface AdminActions {
  // Utilisateurs
  loadUsers: (filters?: Partial<AdminState['filters']['users']>) => Promise<void>;
  createUser: (data: CreateUserRequest) => Promise<User>;
  updateUser: (id: string, data: UpdateUserRequest) => Promise<User>;
  deleteUser: (id: string) => Promise<void>;
  toggleUserStatus: (id: string, isActive: boolean) => Promise<User>;
  resetUserPassword: (id: string, newPassword: string) => Promise<void>;
  
  // Rôles
  loadRoles: () => Promise<void>;
  createRole: (data: { name: string; description: string; permissions: string[] }) => Promise<Role>;
  updateRole: (id: string, data: { name?: string; description?: string; permissions?: string[] }) => Promise<Role>;
  deleteRole: (id: string) => Promise<void>;
  
  // Permissions
  loadPermissions: () => Promise<void>;
  loadPermissionsByModule: (module: string) => Promise<Permission[]>;
  
  // Tenants
  loadTenants: () => Promise<void>;
  createTenant: (data: CreateTenantRequest) => Promise<Tenant>;
  updateTenant: (id: string, data: UpdateTenantRequest) => Promise<Tenant>;
  deleteTenant: (id: string) => Promise<void>;
  
  // Audit
  loadAuditLogs: (filters?: Partial<AdminState['filters']['audit']>) => Promise<void>;
  
  // Statistiques
  loadStatistics: () => Promise<void>;
  
  // Configuration
  loadSystemConfig: () => Promise<void>;
  updateSystemConfig: (data: any) => Promise<void>;
  
  // Filtres et pagination
  setUserFilters: (filters: Partial<AdminState['filters']['users']>) => void;
  setAuditFilters: (filters: Partial<AdminState['filters']['audit']>) => void;
  setUserPagination: (pagination: Partial<AdminState['pagination']['users']>) => void;
  setAuditPagination: (pagination: Partial<AdminState['pagination']['audit']>) => void;
  
  // Cache et synchronisation
  refreshAll: () => Promise<void>;
  clearCache: () => void;
  
  // Utilitaires
  getUserById: (id: string) => User | undefined;
  getRoleById: (id: string) => Role | undefined;
  getTenantById: (id: string) => Tenant | undefined;
  getUsersByRole: (roleId: string) => User[];
  getUsersByTenant: (tenantId: string) => User[];
  getActiveUsers: () => User[];
  getInactiveUsers: () => User[];
}

// Store principal
export const useAdmin = create<AdminState & AdminActions>()(
  devtools(
    persist(
      (set, get) => ({
        // État initial
        users: [],
        usersLoading: false,
        usersError: null,
        
        roles: [],
        rolesLoading: false,
        rolesError: null,
        
        permissions: [],
        permissionsLoading: false,
        permissionsError: null,
        
        tenants: [],
        tenantsLoading: false,
        tenantsError: null,
        
        auditLogs: [],
        auditLoading: false,
        auditError: null,
        
        statistics: null,
        statisticsLoading: false,
        statisticsError: null,
        
        systemConfig: null,
        configLoading: false,
        configError: null,
        
        filters: {
          users: {
            search: '',
            role: 'all',
            isActive: 'all',
            tenantId: 'all'
          },
          audit: {
            userId: 'all',
            action: 'all',
            resource: 'all',
            dateFrom: '',
            dateTo: ''
          }
        },
        
        pagination: {
          users: {
            page: 1,
            limit: 10,
            total: 0
          },
          audit: {
            page: 1,
            limit: 10,
            total: 0
          }
        },
        
        lastFetch: null,
        cacheExpiry: 5 * 60 * 1000, // 5 minutes
        
        // Actions pour les utilisateurs
        loadUsers: async (filters = {}) => {
          set({ usersLoading: true, usersError: null });
          
          try {
            const currentFilters = { ...get().filters.users, ...filters };
            const response = await adminService.getUsers({
              ...currentFilters,
              page: get().pagination.users.page,
              limit: get().pagination.users.limit
            });
            
            set({
              users: response.users,
              pagination: {
                ...get().pagination,
                users: {
                  ...get().pagination.users,
                  total: response.total
                }
              },
              usersLoading: false,
              lastFetch: Date.now()
            });
          } catch (error: any) {
            set({
              usersLoading: false,
              usersError: error.message || 'Erreur lors du chargement des utilisateurs'
            });
          }
        },
        
        createUser: async (data: CreateUserRequest) => {
          try {
            const newUser = await adminService.createUser(data);
            set(state => ({
              users: [...state.users, newUser]
            }));
            return newUser;
          } catch (error: any) {
            set({ usersError: error.message || 'Erreur lors de la création de l\'utilisateur' });
            throw error;
          }
        },
        
        updateUser: async (id: string, data: UpdateUserRequest) => {
          try {
            const updatedUser = await adminService.updateUser(id, data);
            set(state => ({
              users: state.users.map(user => user.id === id ? updatedUser : user)
            }));
            return updatedUser;
          } catch (error: any) {
            set({ usersError: error.message || 'Erreur lors de la mise à jour de l\'utilisateur' });
            throw error;
          }
        },
        
        deleteUser: async (id: string) => {
          try {
            await adminService.deleteUser(id);
            set(state => ({
              users: state.users.filter(user => user.id !== id)
            }));
          } catch (error: any) {
            set({ usersError: error.message || 'Erreur lors de la suppression de l\'utilisateur' });
            throw error;
          }
        },
        
        toggleUserStatus: async (id: string, isActive: boolean) => {
          try {
            const updatedUser = await adminService.toggleUserStatus(id, isActive);
            set(state => ({
              users: state.users.map(user => user.id === id ? updatedUser : user)
            }));
            return updatedUser;
          } catch (error: any) {
            set({ usersError: error.message || 'Erreur lors du changement de statut' });
            throw error;
          }
        },
        
        resetUserPassword: async (id: string, newPassword: string) => {
          try {
            await adminService.resetUserPassword(id, newPassword);
          } catch (error: any) {
            set({ usersError: error.message || 'Erreur lors de la réinitialisation du mot de passe' });
            throw error;
          }
        },
        
        // Actions pour les rôles
        loadRoles: async () => {
          set({ rolesLoading: true, rolesError: null });
          
          try {
            const roles = await adminService.getRoles();
            set({
              roles,
              rolesLoading: false,
              lastFetch: Date.now()
            });
          } catch (error: any) {
            set({
              rolesLoading: false,
              rolesError: error.message || 'Erreur lors du chargement des rôles'
            });
          }
        },
        
        createRole: async (data: { name: string; description: string; permissions: string[] }) => {
          try {
            const newRole = await adminService.createRole(data);
            set(state => ({
              roles: [...state.roles, newRole]
            }));
            return newRole;
          } catch (error: any) {
            set({ rolesError: error.message || 'Erreur lors de la création du rôle' });
            throw error;
          }
        },
        
        updateRole: async (id: string, data: { name?: string; description?: string; permissions?: string[] }) => {
          try {
            const updatedRole = await adminService.updateRole(id, data);
            set(state => ({
              roles: state.roles.map(role => role.id === id ? updatedRole : role)
            }));
            return updatedRole;
          } catch (error: any) {
            set({ rolesError: error.message || 'Erreur lors de la mise à jour du rôle' });
            throw error;
          }
        },
        
        deleteRole: async (id: string) => {
          try {
            await adminService.deleteRole(id);
            set(state => ({
              roles: state.roles.filter(role => role.id !== id)
            }));
          } catch (error: any) {
            set({ rolesError: error.message || 'Erreur lors de la suppression du rôle' });
            throw error;
          }
        },
        
        // Actions pour les permissions
        loadPermissions: async () => {
          set({ permissionsLoading: true, permissionsError: null });
          
          try {
            const permissions = await adminService.getPermissions();
            set({
              permissions,
              permissionsLoading: false,
              lastFetch: Date.now()
            });
          } catch (error: any) {
            set({
              permissionsLoading: false,
              permissionsError: error.message || 'Erreur lors du chargement des permissions'
            });
          }
        },
        
        loadPermissionsByModule: async (module: string) => {
          try {
            const permissions = await adminService.getPermissionsByModule(module);
            return permissions;
          } catch (error: any) {
            set({ permissionsError: error.message || 'Erreur lors du chargement des permissions du module' });
            throw error;
          }
        },
        
        // Actions pour les tenants
        loadTenants: async () => {
          set({ tenantsLoading: true, tenantsError: null });
          
          try {
            const tenants = await adminService.getTenants();
            set({
              tenants,
              tenantsLoading: false,
              lastFetch: Date.now()
            });
          } catch (error: any) {
            set({
              tenantsLoading: false,
              tenantsError: error.message || 'Erreur lors du chargement des tenants'
            });
          }
        },
        
        createTenant: async (data: CreateTenantRequest) => {
          try {
            const newTenant = await adminService.createTenant(data);
            set(state => ({
              tenants: [...state.tenants, newTenant]
            }));
            return newTenant;
          } catch (error: any) {
            set({ tenantsError: error.message || 'Erreur lors de la création du tenant' });
            throw error;
          }
        },
        
        updateTenant: async (id: string, data: UpdateTenantRequest) => {
          try {
            const updatedTenant = await adminService.updateTenant(id, data);
            set(state => ({
              tenants: state.tenants.map(tenant => tenant.id === id ? updatedTenant : tenant)
            }));
            return updatedTenant;
          } catch (error: any) {
            set({ tenantsError: error.message || 'Erreur lors de la mise à jour du tenant' });
            throw error;
          }
        },
        
        deleteTenant: async (id: string) => {
          try {
            await adminService.deleteTenant(id);
            set(state => ({
              tenants: state.tenants.filter(tenant => tenant.id !== id)
            }));
          } catch (error: any) {
            set({ tenantsError: error.message || 'Erreur lors de la suppression du tenant' });
            throw error;
          }
        },
        
        // Actions pour l'audit
        loadAuditLogs: async (filters = {}) => {
          set({ auditLoading: true, auditError: null });
          
          try {
            const currentFilters = { ...get().filters.audit, ...filters };
            const response = await adminService.getAuditLogs({
              ...currentFilters,
              page: get().pagination.audit.page,
              limit: get().pagination.audit.limit
            });
            
            set({
              auditLogs: response.logs,
              pagination: {
                ...get().pagination,
                audit: {
                  ...get().pagination.audit,
                  total: response.total
                }
              },
              auditLoading: false,
              lastFetch: Date.now()
            });
          } catch (error: any) {
            set({
              auditLoading: false,
              auditError: error.message || 'Erreur lors du chargement des logs d\'audit'
            });
          }
        },
        
        // Actions pour les statistiques
        loadStatistics: async () => {
          set({ statisticsLoading: true, statisticsError: null });
          
          try {
            const statistics = await adminService.getAdminStatistics();
            set({
              statistics,
              statisticsLoading: false,
              lastFetch: Date.now()
            });
          } catch (error: any) {
            set({
              statisticsLoading: false,
              statisticsError: error.message || 'Erreur lors du chargement des statistiques'
            });
          }
        },
        
        // Actions pour la configuration
        loadSystemConfig: async () => {
          set({ configLoading: true, configError: null });
          
          try {
            const config = await adminService.getSystemConfig();
            set({
              systemConfig: config,
              configLoading: false,
              lastFetch: Date.now()
            });
          } catch (error: any) {
            set({
              configLoading: false,
              configError: error.message || 'Erreur lors du chargement de la configuration'
            });
          }
        },
        
        updateSystemConfig: async (data: any) => {
          try {
            await adminService.updateSystemConfig(data);
            await get().loadSystemConfig();
          } catch (error: any) {
            set({ configError: error.message || 'Erreur lors de la mise à jour de la configuration' });
            throw error;
          }
        },
        
        // Actions pour les filtres et pagination
        setUserFilters: (filters: Partial<AdminState['filters']['users']>) => {
          set(state => ({
            filters: {
              ...state.filters,
              users: { ...state.filters.users, ...filters }
            }
          }));
        },
        
        setAuditFilters: (filters: Partial<AdminState['filters']['audit']>) => {
          set(state => ({
            filters: {
              ...state.filters,
              audit: { ...state.filters.audit, ...filters }
            }
          }));
        },
        
        setUserPagination: (pagination: Partial<AdminState['pagination']['users']>) => {
          set(state => ({
            pagination: {
              ...state.pagination,
              users: { ...state.pagination.users, ...pagination }
            }
          }));
        },
        
        setAuditPagination: (pagination: Partial<AdminState['pagination']['audit']>) => {
          set(state => ({
            pagination: {
              ...state.pagination,
              audit: { ...state.pagination.audit, ...pagination }
            }
          }));
        },
        
        // Actions pour le cache et la synchronisation
        refreshAll: async () => {
          set({ lastFetch: null }); // Forcer le rechargement
          await Promise.all([
            get().loadUsers(),
            get().loadRoles(),
            get().loadPermissions(),
            get().loadTenants(),
            get().loadAuditLogs(),
            get().loadStatistics(),
            get().loadSystemConfig()
          ]);
        },
        
        clearCache: () => {
          set({
            users: [],
            roles: [],
            permissions: [],
            tenants: [],
            auditLogs: [],
            statistics: null,
            systemConfig: null,
            lastFetch: null
          });
        },
        
        // Utilitaires
        getUserById: (id: string) => {
          return get().users.find(user => user.id === id);
        },
        
        getRoleById: (id: string) => {
          return get().roles.find(role => role.id === id);
        },
        
        getTenantById: (id: string) => {
          return get().tenants.find(tenant => tenant.id === id);
        },
        
        getUsersByRole: (roleId: string) => {
          return get().users.filter(user => user.role.id === roleId);
        },
        
        getUsersByTenant: (tenantId: string) => {
          return get().users.filter(user => user.tenantId === tenantId);
        },
        
        getActiveUsers: () => {
          return get().users.filter(user => user.isActive);
        },
        
        getInactiveUsers: () => {
          return get().users.filter(user => !user.isActive);
        }
      }),
      {
        name: 'crou-admin-storage',
        partialize: (state) => ({
          users: state.users,
          roles: state.roles,
          permissions: state.permissions,
          tenants: state.tenants,
          statistics: state.statistics,
          systemConfig: state.systemConfig,
          lastFetch: state.lastFetch
        })
      }
    ),
    { name: 'AdminStore' }
  )
);

// Hooks spécialisés pour une utilisation plus facile
export const useAdminUsers = () => useAdmin(state => ({
  users: state.users,
  loading: state.usersLoading,
  error: state.usersError,
  filters: state.filters.users,
  pagination: state.pagination.users,
  loadUsers: state.loadUsers,
  createUser: state.createUser,
  updateUser: state.updateUser,
  deleteUser: state.deleteUser,
  toggleUserStatus: state.toggleUserStatus,
  resetUserPassword: state.resetUserPassword,
  setUserFilters: state.setUserFilters,
  setUserPagination: state.setUserPagination
}));

export const useAdminRoles = () => useAdmin(state => ({
  roles: state.roles,
  loading: state.rolesLoading,
  error: state.rolesError,
  loadRoles: state.loadRoles,
  createRole: state.createRole,
  updateRole: state.updateRole,
  deleteRole: state.deleteRole
}));

export const useAdminPermissions = () => useAdmin(state => ({
  permissions: state.permissions,
  loading: state.permissionsLoading,
  error: state.permissionsError,
  loadPermissions: state.loadPermissions,
  loadPermissionsByModule: state.loadPermissionsByModule
}));

export const useAdminTenants = () => useAdmin(state => ({
  tenants: state.tenants,
  loading: state.tenantsLoading,
  error: state.tenantsError,
  loadTenants: state.loadTenants,
  createTenant: state.createTenant,
  updateTenant: state.updateTenant,
  deleteTenant: state.deleteTenant
}));

export const useAdminAudit = () => useAdmin(state => ({
  auditLogs: state.auditLogs,
  loading: state.auditLoading,
  error: state.auditError,
  filters: state.filters.audit,
  pagination: state.pagination.audit,
  loadAuditLogs: state.loadAuditLogs,
  setAuditFilters: state.setAuditFilters,
  setAuditPagination: state.setAuditPagination
}));

export const useAdminStatistics = () => useAdmin(state => ({
  statistics: state.statistics,
  loading: state.statisticsLoading,
  error: state.statisticsError,
  loadStatistics: state.loadStatistics
}));

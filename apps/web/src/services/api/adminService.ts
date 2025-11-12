/**
 * FICHIER: apps/web/src/services/api/adminService.ts
 * SERVICE: AdminService - Service pour la gestion administrative
 *
 * DESCRIPTION:
 * Service pour la gestion des utilisateurs, permissions, tenants
 * et configuration système du CROU
 *
 * FONCTIONNALITÉS:
 * - Gestion des utilisateurs (CRUD)
 * - Gestion des permissions et rôles
 * - Gestion des tenants (CROU)
 * - Configuration système
 * - Audit et logs
 * - Statistiques administratives
 *
 * AUTEUR: Équipe CROU
 * DATE: Décembre 2024
 */

import { apiClient } from './apiClient';

// Types pour les utilisateurs
export enum UserStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  SUSPENDED = 'suspended',
  PENDING = 'pending'
}

export interface User {
  id: string;
  email: string;
  name: string;
  firstName?: string; // Optionnel, séparé de name
  lastName?: string; // Optionnel, séparé de name
  phone?: string;
  avatar?: string;
  department?: string;
  status: UserStatus;
  isActive: boolean; // Calculé depuis status === 'active'
  roleId: string;
  role?: Role; // Relation chargée
  tenantId: string;
  tenant?: Tenant; // Relation chargée
  lastLoginAt?: string;
  loginAttempts?: number;
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
  updatedBy?: string;
}

export interface CreateUserRequest {
  email: string;
  name: string;
  firstName?: string;
  lastName?: string;
  password: string;
  roleId: string;
  tenantId: string;
  phone?: string;
  department?: string;
  status?: UserStatus;
}

export interface UpdateUserRequest {
  email?: string;
  name?: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  department?: string;
  roleId?: string;
  tenantId?: string;
  status?: UserStatus;
  isActive?: boolean;
}

export interface Role {
  id: string;
  name: string;
  description?: string;
  tenantType?: string;
  permissions?: Permission[];
  users?: User[]; // Liste des utilisateurs (chargée avec includeUsers=true)
  userCount?: number; // Nombre d'utilisateurs (toujours retourné par l'API)
  permissionCount?: number; // Nombre de permissions (toujours retourné par l'API)
  isSystem?: boolean;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface Permission {
  id: string;
  resource: string; // Ressource protégée (ex: 'financial', 'users', 'reports')
  actions: string[]; // Actions autorisées (ex: ['read', 'write', 'validate'])
  description?: string;
  conditions?: PermissionCondition[] | null;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
  createdBy?: string;
  updatedBy?: string;
}

export interface PermissionCondition {
  field: string;
  operator: 'eq' | 'in' | 'gt' | 'lt' | 'gte' | 'lte' | 'contains';
  value: any;
}

// Types pour les tenants
export enum TenantType {
  MINISTERE = 'ministere',
  CROU = 'crou',
  SERVICE = 'service'
}

export enum ServiceType {
  FINANCIAL = 'financial',
  STOCKS = 'stocks',
  TRANSPORT = 'transport',
  LOGEMENT = 'logement',
  RESTAURATION = 'restauration'
}

export interface Tenant {
  id: string;
  name: string;
  code: string;
  type: TenantType;
  region?: string | null;
  config?: Record<string, any> | null;
  isActive: boolean;
  // Hiérarchie
  parentId?: string | null;
  parent?: Tenant | null;
  children?: Tenant[];
  path?: string;
  level?: number;
  serviceType?: ServiceType | null;
  // Relations
  users?: User[];
  // Audit
  createdAt: string;
  updatedAt: string;
}

export interface CreateTenantRequest {
  name: string;
  code: string;
  type: TenantType;
  region?: string;
  config?: Record<string, any>;
  parentId?: string | null;
  serviceType?: ServiceType;
}

export interface UpdateTenantRequest {
  name?: string;
  code?: string;
  region?: string;
  config?: Record<string, any>;
  isActive?: boolean;
  parentId?: string | null;
  serviceType?: ServiceType;
}

// Types pour l'audit
export interface AuditLog {
  id: string;
  userId: string;
  user?: User; // Populated on fetch
  tenantId: string;
  action: string;
  resource: string;
  resourceId: string;
  oldValues?: Record<string, any>;
  newValues?: Record<string, any>;
  ipAddress: string;
  userAgent: string;
  createdAt: string;
}

// Types pour les statistiques
export interface AdminStatistics {
  totalUsers: number;
  activeUsers: number;
  inactiveUsers: number;
  totalTenants: number;
  activeTenants: number;
  totalRoles: number;
  totalPermissions: number;
  recentLogins: number;
  systemHealth: {
    status: 'healthy' | 'warning' | 'critical';
    uptime: number;
    memoryUsage: number;
    diskUsage: number;
    lastBackup: string;
  };
  activityStats: {
    today: number;
    thisWeek: number;
    thisMonth: number;
    topActions: Array<{
      action: string;
      count: number;
    }>;
  };
}

class AdminService {
  private baseUrl = '/admin';

  // === GESTION DES UTILISATEURS ===

  /**
   * Récupère la liste des utilisateurs
   */
  async getUsers(params?: {
    tenantId?: string;
    role?: string;
    isActive?: boolean;
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<{
    users: User[];
    total: number;
    page: number;
    limit: number;
  }> {
    try {
      const queryParams = new URLSearchParams();
      if (params?.tenantId) queryParams.append('tenantId', params.tenantId);
      if (params?.role) queryParams.append('role', params.role);
      if (params?.isActive !== undefined) queryParams.append('isActive', params.isActive.toString());
      if (params?.search) queryParams.append('search', params.search);
      if (params?.page) queryParams.append('page', params.page.toString());
      if (params?.limit) queryParams.append('limit', params.limit.toString());

      const response = await apiClient.get(`${this.baseUrl}/users?${queryParams.toString()}`);
      const data = response.data?.data || response.data;
      return {
        users: Array.isArray(data.users) ? data.users : [],
        total: data.total || 0,
        page: data.page || 1,
        limit: data.limit || 50
      };
    } catch (error) {
      console.error('Erreur lors de la récupération des utilisateurs:', error);
      return { users: [], total: 0, page: 1, limit: 50 };
    }
  }

  /**
   * Récupère un utilisateur par ID
   */
  async getUser(id: string): Promise<User> {
    try {
      const response = await apiClient.get(`${this.baseUrl}/users/${id}`);
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la récupération de l\'utilisateur:', error);
      throw error;
    }
  }

  /**
   * Crée un nouvel utilisateur
   */
  async createUser(data: CreateUserRequest): Promise<User> {
    try {
      const response = await apiClient.post(`${this.baseUrl}/users`, data);
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la création de l\'utilisateur:', error);
      throw error;
    }
  }

  /**
   * Met à jour un utilisateur
   */
  async updateUser(id: string, data: UpdateUserRequest): Promise<User> {
    try {
      const response = await apiClient.put(`${this.baseUrl}/users/${id}`, data);
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la mise à jour de l\'utilisateur:', error);
      throw error;
    }
  }

  /**
   * Supprime un utilisateur
   */
  async deleteUser(id: string): Promise<void> {
    try {
      await apiClient.delete(`${this.baseUrl}/users/${id}`);
    } catch (error) {
      console.error('Erreur lors de la suppression de l\'utilisateur:', error);
      throw error;
    }
  }

  /**
   * Active/désactive un utilisateur
   */
  async toggleUserStatus(id: string, isActive: boolean): Promise<User> {
    try {
      const response = await apiClient.patch(`${this.baseUrl}/users/${id}/status`, { isActive });
      return response.data;
    } catch (error) {
      console.error('Erreur lors du changement de statut:', error);
      throw error;
    }
  }

  /**
   * Réinitialise le mot de passe d'un utilisateur
   */
  async resetUserPassword(id: string, newPassword: string): Promise<void> {
    try {
      await apiClient.post(`${this.baseUrl}/users/${id}/reset-password`, { newPassword });
    } catch (error) {
      console.error('Erreur lors de la réinitialisation du mot de passe:', error);
      throw error;
    }
  }

  // === GESTION DES RÔLES ===

  /**
   * Récupère la liste des rôles
   */
  async getRoles(): Promise<Role[]> {
    try {
      // Inclure les permissions et les utilisateurs pour afficher les compteurs
      const response = await apiClient.get(`${this.baseUrl}/roles?includePermissions=true&includeUsers=true`);
      // Le backend retourne { success: true, data: { roles: [...], total: ... } }
      const data = response.data?.data || response.data;
      if (Array.isArray(data.roles)) {
        return data.roles;
      }
      if (Array.isArray(data)) {
        return data;
      }
      return [];
    } catch (error) {
      console.error('Erreur lors de la récupération des rôles:', error);
      return [];
    }
  }

  /**
   * Récupère un rôle par ID
   */
  async getRole(id: string): Promise<Role> {
    try {
      const response = await apiClient.get(`${this.baseUrl}/roles/${id}`);
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la récupération du rôle:', error);
      throw error;
    }
  }

  /**
   * Crée un nouveau rôle
   */
  async createRole(data: {
    name: string;
    description: string;
    permissions: string[];
  }): Promise<Role> {
    try {
      const response = await apiClient.post(`${this.baseUrl}/roles`, data);
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la création du rôle:', error);
      throw error;
    }
  }

  /**
   * Met à jour un rôle
   */
  async updateRole(id: string, data: {
    name?: string;
    description?: string;
    permissions?: string[];
  }): Promise<Role> {
    try {
      const response = await apiClient.put(`${this.baseUrl}/roles/${id}`, data);
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la mise à jour du rôle:', error);
      throw error;
    }
  }

  /**
   * Supprime un rôle
   */
  async deleteRole(id: string): Promise<void> {
    try {
      await apiClient.delete(`${this.baseUrl}/roles/${id}`);
    } catch (error) {
      console.error('Erreur lors de la suppression du rôle:', error);
      throw error;
    }
  }

  // === GESTION DES PERMISSIONS ===

  /**
   * Récupère la liste des permissions
   */
  async getPermissions(): Promise<Permission[]> {
    try {
      const response = await apiClient.get(`${this.baseUrl}/permissions`);
      // Le backend retourne { success: true, data: { permissions: [...], total: ... } }
      const data = response.data?.data || response.data;
      if (Array.isArray(data.permissions)) {
        return data.permissions;
      }
      if (Array.isArray(data)) {
        return data;
      }
      return [];
    } catch (error) {
      console.error('Erreur lors de la récupération des permissions:', error);
      return [];
    }
  }

  /**
   * Récupère les permissions par module
   */
  async getPermissionsByModule(module: string): Promise<Permission[]> {
    try {
      const response = await apiClient.get(`${this.baseUrl}/permissions/module/${module}`);
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la récupération des permissions du module:', error);
      throw error;
    }
  }

  /**
   * Crée une nouvelle permission
   */
  async createPermission(data: { resource: string; actions: string[]; description?: string }): Promise<Permission> {
    try {
      const response = await apiClient.post(`${this.baseUrl}/permissions`, data);
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la création de la permission:', error);
      throw error;
    }
  }

  /**
   * Met à jour une permission
   */
  async updatePermission(id: string, data: { resource?: string; actions?: string[]; description?: string; isActive?: boolean }): Promise<Permission> {
    try {
      const response = await apiClient.put(`${this.baseUrl}/permissions/${id}`, data);
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la mise à jour de la permission:', error);
      throw error;
    }
  }

  /**
   * Supprime une permission
   */
  async deletePermission(id: string): Promise<void> {
    try {
      await apiClient.delete(`${this.baseUrl}/permissions/${id}`);
    } catch (error) {
      console.error('Erreur lors de la suppression de la permission:', error);
      throw error;
    }
  }

  // === GESTION DES TENANTS ===

  /**
   * Récupère la liste des tenants
   */
  async getTenants(): Promise<Tenant[]> {
    try {
      const response = await apiClient.get(`${this.baseUrl}/tenants`);
      // Le backend retourne { success: true, data: { tenants: [...], total: ..., summary: ... } }
      const data = response.data?.data || response.data;
      if (Array.isArray(data.tenants)) {
        return data.tenants;
      }
      if (Array.isArray(data)) {
        return data;
      }
      return [];
    } catch (error) {
      console.error('Erreur lors de la récupération des tenants:', error);
      return [];
    }
  }

  /**
   * Récupère un tenant par ID
   */
  async getTenant(id: string): Promise<Tenant> {
    try {
      const response = await apiClient.get(`${this.baseUrl}/tenants/${id}`);
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la récupération du tenant:', error);
      throw error;
    }
  }

  /**
   * Crée un nouveau tenant
   */
  async createTenant(data: CreateTenantRequest): Promise<Tenant> {
    try {
      const response = await apiClient.post(`${this.baseUrl}/tenants`, data);
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la création du tenant:', error);
      throw error;
    }
  }

  /**
   * Met à jour un tenant
   */
  async updateTenant(id: string, data: UpdateTenantRequest): Promise<Tenant> {
    try {
      const response = await apiClient.put(`${this.baseUrl}/tenants/${id}`, data);
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la mise à jour du tenant:', error);
      throw error;
    }
  }

  /**
   * Supprime un tenant
   */
  async deleteTenant(id: string): Promise<void> {
    try {
      await apiClient.delete(`${this.baseUrl}/tenants/${id}`);
    } catch (error) {
      console.error('Erreur lors de la suppression du tenant:', error);
      throw error;
    }
  }

  // === AUDIT ET LOGS ===

  /**
   * Récupère les logs d'audit
   */
  async getAuditLogs(params?: {
    userId?: string;
    tenantId?: string;
    action?: string;
    resource?: string;
    dateFrom?: string;
    dateTo?: string;
    page?: number;
    limit?: number;
  }): Promise<{
    logs: AuditLog[];
    total: number;
    page: number;
    limit: number;
  }> {
    try {
      const queryParams = new URLSearchParams();
      if (params?.userId) queryParams.append('userId', params.userId);
      if (params?.tenantId) queryParams.append('tenantId', params.tenantId);
      if (params?.action) queryParams.append('action', params.action);
      if (params?.resource) queryParams.append('resource', params.resource);
      if (params?.dateFrom) queryParams.append('dateFrom', params.dateFrom);
      if (params?.dateTo) queryParams.append('dateTo', params.dateTo);
      if (params?.page) queryParams.append('page', params.page.toString());
      if (params?.limit) queryParams.append('limit', params.limit.toString());

      const response = await apiClient.get(`${this.baseUrl}/audit-logs?${queryParams.toString()}`);
      const data = response.data?.data || response.data;
      return {
        logs: Array.isArray(data.logs) ? data.logs : [],
        total: data.total || 0,
        page: data.page || 1,
        limit: data.limit || 50
      };
    } catch (error) {
      console.error('Erreur lors de la récupération des logs d\'audit:', error);
      return { logs: [], total: 0, page: 1, limit: 50 };
    }
  }

  // === STATISTIQUES ===

  /**
   * Récupère les statistiques administratives
   */
  async getAdminStatistics(): Promise<AdminStatistics> {
    try {
      const response = await apiClient.get(`${this.baseUrl}/statistics`);
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la récupération des statistiques:', error);
      throw error;
    }
  }

  // === CONFIGURATION SYSTÈME ===

  /**
   * Récupère la configuration système
   */
  async getSystemConfig(): Promise<{
    version: string;
    environment: string;
    features: Record<string, boolean>;
    limits: Record<string, number>;
    maintenance: {
      isActive: boolean;
      message?: string;
      startTime?: string;
      endTime?: string;
    };
  }> {
    try {
      const response = await apiClient.get(`${this.baseUrl}/system/config`);
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la récupération de la configuration:', error);
      throw error;
    }
  }

  /**
   * Met à jour la configuration système
   */
  async updateSystemConfig(data: {
    features?: Record<string, boolean>;
    limits?: Record<string, number>;
    maintenance?: {
      isActive: boolean;
      message?: string;
      startTime?: string;
      endTime?: string;
    };
  }): Promise<void> {
    try {
      await apiClient.put(`${this.baseUrl}/system/config`, data);
    } catch (error) {
      console.error('Erreur lors de la mise à jour de la configuration:', error);
      throw error;
    }
  }

  // === UTILITAIRES ===

  /**
   * Vérifie la disponibilité d'un email
   */
  async checkEmailAvailability(email: string): Promise<{ available: boolean }> {
    try {
      const response = await apiClient.get(`${this.baseUrl}/users/check-email?email=${encodeURIComponent(email)}`);
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la vérification de l\'email:', error);
      throw error;
    }
  }

  /**
   * Exporte les données utilisateurs
   */
  async exportUsers(format: 'excel' | 'csv', tenantId?: string): Promise<Blob> {
    try {
      const params = tenantId ? `?tenantId=${tenantId}` : '';
      const response = await apiClient.get(`${this.baseUrl}/users/export/${format}${params}`, {
        responseType: 'blob'
      });
      return response.data;
    } catch (error) {
      console.error('Erreur lors de l\'export des utilisateurs:', error);
      throw error;
    }
  }

  /**
   * Importe des utilisateurs
   */
  async importUsers(file: File, tenantId: string): Promise<{
    success: number;
    errors: Array<{
      row: number;
      error: string;
    }>;
  }> {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('tenantId', tenantId);

      const response = await apiClient.post(`${this.baseUrl}/users/import`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      return response.data;
    } catch (error) {
      console.error('Erreur lors de l\'import des utilisateurs:', error);
      throw error;
    }
  }

  // ==================== Méthodes de Sécurité ====================

  /**
   * Récupère les alertes de sécurité
   */
  async getSecurityAlerts(params?: {
    severity?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    type?: string;
    resolved?: boolean;
    page?: number;
    limit?: number;
  }): Promise<{
    alerts: SecurityAlert[];
    total: number;
    page: number;
    limit: number;
  }> {
    try {
      const queryParams = new URLSearchParams();
      if (params?.severity) queryParams.append('severity', params.severity);
      if (params?.type) queryParams.append('type', params.type);
      if (params?.resolved !== undefined) queryParams.append('resolved', params.resolved.toString());
      if (params?.page) queryParams.append('page', params.page.toString());
      if (params?.limit) queryParams.append('limit', params.limit.toString());

      const response = await apiClient.get(`${this.baseUrl}/security/alerts?${queryParams.toString()}`);
      return response.data.data;
    } catch (error) {
      console.error('Erreur lors de la récupération des alertes:', error);
      throw error;
    }
  }

  /**
   * Résout une alerte de sécurité
   */
  async resolveSecurityAlert(alertId: string, notes?: string): Promise<void> {
    try {
      await apiClient.post(`${this.baseUrl}/security/alerts/${alertId}/resolve`, { notes });
    } catch (error) {
      console.error('Erreur lors de la résolution de l\'alerte:', error);
      throw error;
    }
  }

  /**
   * Récupère les statistiques de sécurité
   */
  async getSecurityStats(): Promise<SecurityStats> {
    try {
      const response = await apiClient.get(`${this.baseUrl}/security/stats`);
      return response.data.data;
    } catch (error) {
      console.error('Erreur lors de la récupération des statistiques de sécurité:', error);
      throw error;
    }
  }

  /**
   * Débloque un compte utilisateur
   */
  async unlockUser(userId: string, reason?: string): Promise<void> {
    try {
      await apiClient.post(`${this.baseUrl}/security/users/${userId}/unlock`, { reason });
    } catch (error) {
      console.error('Erreur lors du déblocage du compte:', error);
      throw error;
    }
  }

  /**
   * Récupère la liste des comptes bloqués
   */
  async getBlockedAccounts(params?: {
    page?: number;
    limit?: number;
  }): Promise<{
    accounts: BlockedAccount[];
    total: number;
    page: number;
    limit: number;
  }> {
    try {
      const queryParams = new URLSearchParams();
      if (params?.page) queryParams.append('page', params.page.toString());
      if (params?.limit) queryParams.append('limit', params.limit.toString());

      const response = await apiClient.get(`${this.baseUrl}/security/blocked-accounts?${queryParams.toString()}`);
      return response.data.data;
    } catch (error) {
      console.error('Erreur lors de la récupération des comptes bloqués:', error);
      throw error;
    }
  }
}

// Types pour la sécurité
export interface SecurityAlert {
  id: string;
  type: 'FAILED_LOGIN' | 'SUSPICIOUS_ACTIVITY' | 'RATE_LIMIT' | 'UNAUTHORIZED_ACCESS' | 'ACCOUNT_LOCKED';
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  description: string;
  userId?: string;
  userName?: string;
  userEmail?: string;
  ipAddress?: string;
  userAgent?: string;
  timestamp: string;
  resolved: boolean;
  resolvedAt?: string;
  resolvedBy?: string;
  metadata?: Record<string, any>;
}

export interface SecurityStats {
  activeAlerts: number;
  totalAlerts: number;
  resolvedAlerts: number;
  blockedAccounts: number;
  failedLogins24h: number;
  suspiciousActivities: number;
}

export interface BlockedAccount {
  userId: string;
  userName: string;
  userEmail: string;
  blockedAt: string;
  blockedUntil: string;
  reason: string;
  failedAttempts: number;
  lastAttemptIp?: string;
}

export const adminService = new AdminService();

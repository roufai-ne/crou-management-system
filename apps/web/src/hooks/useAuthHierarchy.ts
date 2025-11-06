/**
 * FICHIER: apps/web/src/hooks/useAuthHierarchy.ts
 * HOOKS: Hooks d'authentification avec support hiérarchie à 3 niveaux
 *
 * DESCRIPTION:
 * Hooks React personnalisés pour faciliter l'utilisation de la hiérarchie
 * organisationnelle à 3 niveaux (Ministry → Region → CROU)
 *
 * FONCTIONNALITÉS:
 * - Accès facile au niveau hiérarchique
 * - Vérifications de permissions par niveau
 * - Helpers pour la navigation hiérarchique
 * - Guards pour les composants
 *
 * AUTEUR: Équipe CROU
 * DATE: Janvier 2025
 */

import { useAuth, type HierarchyLevel } from '@/stores/auth';

// ================================================================================================
// HOOKS DE BASE
// ================================================================================================

/**
 * Hook pour accéder au niveau hiérarchique de l'utilisateur
 *
 * @example
 * const { level, isMinistry, isRegion, isCrou } = useHierarchyLevel();
 * if (isMinistry) { ... }
 */
export const useHierarchyLevel = () => {
  const getHierarchyLevel = useAuth((state) => state.getHierarchyLevel);
  const isMinistryLevel = useAuth((state) => state.isMinistryLevel);
  const isRegionLevel = useAuth((state) => state.isRegionLevel);
  const isCrouLevel = useAuth((state) => state.isCrouLevel);

  return {
    level: getHierarchyLevel(),
    isMinistry: isMinistryLevel(),
    isRegion: isRegionLevel(),
    isCrou: isCrouLevel()
  };
};

/**
 * Hook pour obtenir les identifiants de tous les niveaux hiérarchiques
 *
 * @example
 * const { ministryId, regionId, crouId } = useTenantIds();
 */
export const useTenantIds = () => {
  const getTenantIds = useAuth((state) => state.getTenantIds);
  return getTenantIds();
};

/**
 * Hook pour obtenir les informations du tenant actuel
 *
 * @example
 * const { tenantId, tenantName, tenantCode, hierarchyLevel } = useCurrentTenant();
 */
export const useCurrentTenant = () => {
  const user = useAuth((state) => state.user);

  if (!user) {
    return {
      tenantId: null,
      tenantName: null,
      tenantCode: null,
      tenantPath: null,
      hierarchyLevel: null
    };
  }

  return {
    tenantId: user.tenantId,
    tenantName: user.tenantName,
    tenantCode: user.tenantCode,
    tenantPath: user.tenantPath,
    hierarchyLevel: user.hierarchyLevel
  };
};

// ================================================================================================
// HOOKS DE PERMISSIONS HIÉRARCHIQUES
// ================================================================================================

/**
 * Hook pour vérifier si l'utilisateur peut accéder à un niveau hiérarchique
 *
 * @example
 * const canAccessRegion = useCanAccessLevel('region');
 * if (!canAccessRegion) return <AccessDenied />;
 */
export const useCanAccessLevel = (level: HierarchyLevel): boolean => {
  const canAccessLevel = useAuth((state) => state.canAccessLevel);
  return canAccessLevel(level);
};

/**
 * Hook pour vérifier si l'utilisateur peut gérer un tenant
 *
 * @example
 * const canManage = useCanManageTenant(tenantId, 'region');
 */
export const useCanManageTenant = (
  tenantId: string,
  tenantLevel: HierarchyLevel
): boolean => {
  const canManageTenant = useAuth((state) => state.canManageTenant);
  return canManageTenant(tenantId, tenantLevel);
};

/**
 * Hook pour vérifier les permissions d'allocations budgétaires
 *
 * @example
 * const { canCreate, canValidate, canView } = useAllocationPermissions();
 */
export const useAllocationPermissions = () => {
  const user = useAuth((state) => state.user);

  return {
    canCreate: user?.canManageAllocations || false,
    canValidate: user?.canValidateAllocations || false,
    canView: user?.canManageAllocations || user?.canValidateAllocations || false,
    canManageBudget: user?.canManageBudget || false,
    canViewAllTenants: user?.canViewAllTenants || false
  };
};

// ================================================================================================
// HOOKS DE NAVIGATION HIÉRARCHIQUE
// ================================================================================================

/**
 * Hook pour déterminer les niveaux accessibles pour les allocations
 * basé sur le niveau hiérarchique de l'utilisateur
 *
 * @example
 * const { sourceLevel, allowedTargetLevels } = useAllocationLevels();
 * // Ministry → sourceLevel = 'ministry', allowedTargetLevels = ['region']
 * // Region → sourceLevel = 'region', allowedTargetLevels = ['crou']
 * // CROU → sourceLevel = 'crou', allowedTargetLevels = []
 */
export const useAllocationLevels = () => {
  const user = useAuth((state) => state.user);

  if (!user) {
    return {
      sourceLevel: null,
      allowedTargetLevels: [] as HierarchyLevel[]
    };
  }

  const sourceLevel = user.hierarchyLevel;

  // Mapping des niveaux cibles autorisés selon le niveau source
  const targetLevelsMap: Record<HierarchyLevel, HierarchyLevel[]> = {
    ministry: ['region'],
    region: ['crou'],
    crou: [] // CROU ne peut pas allouer vers le bas
  };

  return {
    sourceLevel,
    allowedTargetLevels: targetLevelsMap[sourceLevel] || []
  };
};

/**
 * Hook pour obtenir le chemin hiérarchique complet
 *
 * @example
 * const breadcrumb = useHierarchyBreadcrumb();
 * // ['Ministère de l Enseignement', 'Région Île-de-France', 'CROU de Paris']
 */
export const useHierarchyBreadcrumb = () => {
  const user = useAuth((state) => state.user);

  if (!user || !user.tenantPath) {
    return [];
  }

  // Parse le chemin (ex: "/ministere/region-ile-de-france/crou-paris")
  const segments = user.tenantPath
    .split('/')
    .filter(Boolean)
    .map((segment) => {
      // Capitaliser et formater
      return segment
        .split('-')
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
    });

  return segments;
};

// ================================================================================================
// HOOKS DE GUARDS
// ================================================================================================

/**
 * Hook pour protéger une route/composant par niveau hiérarchique
 * Retourne true si l'accès est autorisé, false sinon
 *
 * @example
 * const canAccess = useHierarchyGuard(['ministry', 'region']);
 * if (!canAccess) return <Navigate to="/unauthorized" />;
 */
export const useHierarchyGuard = (allowedLevels: HierarchyLevel[]): boolean => {
  const user = useAuth((state) => state.user);

  if (!user) return false;

  return allowedLevels.includes(user.hierarchyLevel);
};

/**
 * Hook pour protéger une route/composant par permissions
 *
 * @example
 * const canAccess = usePermissionGuard(['allocations:manage', 'budget:manage']);
 * if (!canAccess) return <AccessDenied />;
 */
export const usePermissionGuard = (requiredPermissions: string[]): boolean => {
  const hasAnyPermission = useAuth((state) => state.hasAnyPermission);
  return hasAnyPermission(requiredPermissions);
};

// ================================================================================================
// HOOKS UTILITAIRES
// ================================================================================================

/**
 * Hook pour obtenir le label lisible du niveau hiérarchique
 *
 * @example
 * const levelLabel = useLevelLabel(); // "Ministère" | "Région" | "CROU"
 */
export const useLevelLabel = (): string => {
  const { level } = useHierarchyLevel();

  const labels: Record<HierarchyLevel, string> = {
    ministry: 'Ministère',
    region: 'Région',
    crou: 'CROU'
  };

  return level ? labels[level] : 'Inconnu';
};

/**
 * Hook pour vérifier si l'utilisateur est au niveau le plus élevé
 *
 * @example
 * const isTopLevel = useIsTopLevel(); // true si Ministry
 */
export const useIsTopLevel = (): boolean => {
  const { isMinistry } = useHierarchyLevel();
  return isMinistry;
};

/**
 * Hook pour vérifier si l'utilisateur est au niveau le plus bas
 *
 * @example
 * const isBottomLevel = useIsBottomLevel(); // true si CROU
 */
export const useIsBottomLevel = (): boolean => {
  const { isCrou } = useHierarchyLevel();
  return isCrou;
};

/**
 * Hook combiné avec toutes les informations hiérarchiques
 *
 * @example
 * const hierarchy = useHierarchyInfo();
 * console.log(hierarchy.level, hierarchy.tenantName, hierarchy.canManageBudget);
 */
export const useHierarchyInfo = () => {
  const { level, isMinistry, isRegion, isCrou } = useHierarchyLevel();
  const { tenantId, tenantName, tenantCode, tenantPath } = useCurrentTenant();
  const { ministryId, regionId, crouId } = useTenantIds();
  const { canCreate, canValidate, canManageBudget } = useAllocationPermissions();
  const levelLabel = useLevelLabel();
  const breadcrumb = useHierarchyBreadcrumb();

  return {
    // Niveau
    level,
    levelLabel,
    isMinistry,
    isRegion,
    isCrou,

    // Tenant actuel
    tenantId,
    tenantName,
    tenantCode,
    tenantPath,

    // Hiérarchie complète
    ministryId,
    regionId,
    crouId,

    // Permissions
    canCreate,
    canValidate,
    canManageBudget,

    // Helpers
    breadcrumb,
    isTopLevel: isMinistry,
    isBottomLevel: isCrou
  };
};

// ================================================================================================
// EXPORTS
// ================================================================================================

export default {
  useHierarchyLevel,
  useTenantIds,
  useCurrentTenant,
  useCanAccessLevel,
  useCanManageTenant,
  useAllocationPermissions,
  useAllocationLevels,
  useHierarchyBreadcrumb,
  useHierarchyGuard,
  usePermissionGuard,
  useLevelLabel,
  useIsTopLevel,
  useIsBottomLevel,
  useHierarchyInfo
};

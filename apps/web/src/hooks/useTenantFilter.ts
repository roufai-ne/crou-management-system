/**
 * FICHIER: apps/web/src/hooks/useTenantFilter.ts
 * HOOK: useTenantFilter - Hook pour gérer le filtrage par tenant
 *
 * DESCRIPTION:
 * Hook React pour gérer la sélection et le filtrage par tenant
 * Utilisé dans les pages de listes pour permettre aux admins de filtrer par tenant
 *
 * FONCTIONNALITÉS:
 * - Gestion de l'état du tenant sélectionné
 * - Calcul du tenant effectif pour les requêtes API
 * - Détection automatique des droits de filtrage
 * - Réinitialisation automatique si l'utilisateur change
 *
 * USAGE:
 * ```tsx
 * const {
 *   selectedTenantId,
 *   setSelectedTenantId,
 *   effectiveTenantId,
 *   canFilterTenant,
 *   isFilteringAll
 * } = useTenantFilter();
 *
 * // Dans une requête API
 * const { data } = useQuery({
 *   queryKey: ['budgets', effectiveTenantId],
 *   queryFn: () => financialService.getBudgets({
 *     tenantId: effectiveTenantId
 *   })
 * });
 * ```
 *
 * AUTEUR: Équipe CROU
 * DATE: Décembre 2025
 */

import { useState, useEffect } from 'react';
import { useAuth } from '@/stores/auth';

export interface UseTenantFilterReturn {
  /** ID du tenant actuellement sélectionné dans l'UI ('current', 'all', ou un UUID) */
  selectedTenantId: string;

  /** Fonction pour changer le tenant sélectionné */
  setSelectedTenantId: (tenantId: string) => void;

  /** ID du tenant effectif à utiliser dans les requêtes API (undefined si 'all') */
  effectiveTenantId: string | undefined;

  /** Indique si l'utilisateur peut filtrer par tenant (admin ministère) */
  canFilterTenant: boolean;

  /** Indique si on filtre sur "tous les tenants" */
  isFilteringAll: boolean;

  /** ID du tenant de l'utilisateur connecté */
  currentUserTenantId: string | undefined;
}

/**
 * Hook pour gérer le filtrage par tenant
 *
 * @returns Objet contenant l'état et les méthodes de gestion du filtrage tenant
 */
export const useTenantFilter = (): UseTenantFilterReturn => {
  const { user, isMinistryLevel } = useAuth();

  // État du tenant sélectionné ('current', 'all', ou un UUID de tenant)
  const [selectedTenantId, setSelectedTenantId] = useState<string>('current');

  // Réinitialiser au tenant de l'utilisateur si l'utilisateur change ou s'il n'est pas admin
  useEffect(() => {
    if (user?.tenantId && !isMinistryLevel()) {
      setSelectedTenantId('current');
    }
  }, [user?.tenantId, isMinistryLevel]);

  // Calculer le tenant effectif pour les requêtes API
  const effectiveTenantId = (() => {
    // Si l'utilisateur filtre sur "tous les tenants"
    if (selectedTenantId === 'all') {
      return undefined; // undefined = pas de filtre, le backend renverra tous les tenants
    }

    // Si l'utilisateur filtre sur "son tenant" ou n'est pas admin
    if (selectedTenantId === 'current' || !isMinistryLevel()) {
      return user?.tenantId;
    }

    // Sinon, c'est un UUID de tenant spécifique
    return selectedTenantId;
  })();

  // L'utilisateur peut filtrer s'il est au niveau ministère
  const canFilterTenant = isMinistryLevel();

  // On filtre sur "tous les tenants" si sélection = 'all'
  const isFilteringAll = selectedTenantId === 'all';

  return {
    selectedTenantId,
    setSelectedTenantId,
    effectiveTenantId,
    canFilterTenant,
    isFilteringAll,
    currentUserTenantId: user?.tenantId
  };
};

/**
 * Hook version simplifiée qui retourne directement le tenantId à utiliser
 *
 * @returns tenantId à passer aux requêtes API (undefined si filtrage "tous")
 */
export const useEffectiveTenantId = (): string | undefined => {
  const { effectiveTenantId } = useTenantFilter();
  return effectiveTenantId;
};

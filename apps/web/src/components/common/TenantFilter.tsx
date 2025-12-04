/**
 * FICHIER: apps/web/src/components/common/TenantFilter.tsx
 * COMPOSANT: TenantFilter - Filtre tenant pour les listes
 *
 * DESCRIPTION:
 * Wrapper autour de TenantSelector pour les pages de listes
 * S'affiche uniquement pour les utilisateurs ayant les droits de filtrage (admins ministère)
 * Version simplifiée et stylisée pour l'intégration dans les barres de filtres
 *
 * USAGE:
 * ```tsx
 * <TenantFilter
 *   value={selectedTenantId}
 *   onChange={setSelectedTenantId}
 *   showAllOption={true}
 * />
 * ```
 *
 * AUTEUR: Équipe CROU
 * DATE: Décembre 2025
 */

import React from 'react';
import { TenantSelector, TenantSelectorProps } from './TenantSelector';
import { useAuth } from '@/stores/auth';

export type TenantFilterProps = Omit<TenantSelectorProps, 'label'> & {
  /** Afficher l'option "Tous les tenants" */
  showAllOption?: boolean;

  /** Afficher même si l'utilisateur n'est pas admin (mode lecture seule) */
  forceShow?: boolean;
};

/**
 * Composant de filtre tenant pour les pages de listes
 * S'affiche uniquement pour les utilisateurs avec droits de filtrage
 */
export const TenantFilter: React.FC<TenantFilterProps> = ({
  value,
  onChange,
  showAllOption = true,
  forceShow = false,
  ...otherProps
}) => {
  const { isMinistryLevel } = useAuth();

  // Ne rien afficher si l'utilisateur n'est pas admin ministère
  // (sauf si forceShow est activé)
  if (!isMinistryLevel() && !forceShow) {
    return null;
  }

  return (
    <div className="tenant-filter">
      <TenantSelector
        value={value}
        onChange={onChange}
        showHierarchy={true}
        showAllOption={showAllOption}
        label="Filtrer par tenant"
        disabled={!isMinistryLevel()}
        {...otherProps}
      />
    </div>
  );
};

export default TenantFilter;

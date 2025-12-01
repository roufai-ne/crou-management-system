/**
 * FICHIER: apps/web/src/hooks/useTenantFilterEffect.ts
 * HOOK: Hook pour écouter les changements du tenant filter
 *
 * DESCRIPTION:
 * Hook qui force le rechargement des données quand le tenant change
 *
 * AUTEUR: Équipe CROU
 * DATE: Janvier 2025
 */

import { useEffect, useRef } from 'react';
import { useTenantFilter } from '@/stores/tenantFilter';

/**
 * Hook qui exécute un callback quand le tenant sélectionné change
 */
export const useTenantFilterEffect = (callback: (tenantId: string | null) => void) => {
  const { selectedTenantId, version } = useTenantFilter();
  const previousVersionRef = useRef<number>(version);
  const isFirstRenderRef = useRef(true);

  useEffect(() => {
    // Ignorer le premier render pour éviter un double chargement
    if (isFirstRenderRef.current) {
      isFirstRenderRef.current = false;
      previousVersionRef.current = version;
      return;
    }

    // Exécuter le callback seulement si la version a vraiment changé
    if (previousVersionRef.current !== version) {
      previousVersionRef.current = version;
      callback(selectedTenantId);
    }
  }, [version, selectedTenantId, callback]);
};

/**
 * FICHIER: apps/web/src/stores/tenantFilter.ts
 * STORE: Zustand store pour le filtrage par tenant
 *
 * DESCRIPTION:
 * Store global pour gérer le tenant sélectionné
 * Permet à tous les composants de réagir aux changements de tenant
 *
 * AUTEUR: Équipe CROU
 * DATE: Janvier 2025
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface TenantFilterState {
  selectedTenantId: string | null;
  version: number; // Ajout d'un compteur pour forcer les re-renders
  setSelectedTenantId: (tenantId: string | null) => void;
  clearSelectedTenantId: () => void;
}

export const useTenantFilter = create<TenantFilterState>()(
  persist(
    (set) => ({
      selectedTenantId: null,
      version: 0,
      
      setSelectedTenantId: (tenantId: string | null) => {
        set((state) => ({ 
          selectedTenantId: tenantId,
          version: state.version + 1 // Incrémenter pour forcer un re-render
        }));
      },
      
      clearSelectedTenantId: () => {
        set((state) => ({ 
          selectedTenantId: null,
          version: state.version + 1
        }));
      },
    }),
    {
      name: 'tenant-filter-storage',
      // Synchroniser avec localStorage
      partialize: (state) => ({ 
        selectedTenantId: state.selectedTenantId,
        version: state.version 
      }),
    }
  )
);

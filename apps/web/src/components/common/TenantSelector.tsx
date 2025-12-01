/**
 * FICHIER: apps/web/src/components/common/TenantSelector.tsx
 * COMPOSANT: TenantSelector - Sélecteur de tenant pour filtrage
 *
 * DESCRIPTION:
 * Permet aux administrateurs ministériels de sélectionner un CROU spécifique
 * pour filtrer toutes les données de l'application
 *
 * AUTEUR: Équipe CROU
 * DATE: Janvier 2025
 */

import React, { useState, useEffect } from 'react';
import { ChevronDown, Building2, CheckCircle2 } from 'lucide-react';
import { useAuth } from '@/stores/auth';
import { useTenantFilter } from '@/stores/tenantFilter';
import { adminService, Tenant } from '@/services/api/adminService';

interface TenantSelectorProps {
  onTenantChange?: (tenantId: string | null) => void;
  className?: string;
}

export const TenantSelector: React.FC<TenantSelectorProps> = ({ onTenantChange, className = '' }) => {
  const { user, hasExtendedAccess } = useAuth();
  const { selectedTenantId, setSelectedTenantId } = useTenantFilter();
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [initialized, setInitialized] = useState(false);

  // Charger la liste des tenants si l'utilisateur a un accès étendu
  useEffect(() => {
    if (hasExtendedAccess() && !initialized) {
      fetchTenants();
      setInitialized(true);
    }
  }, [hasExtendedAccess, initialized]);

  const fetchTenants = async () => {
    try {
      setLoading(true);
      console.log('🔍 TenantSelector: Chargement des tenants...');
      const allTenants = await adminService.getTenants();
      console.log('✅ TenantSelector: Tenants reçus:', allTenants);
      
      // Filtrer pour ne garder que les CROUs
      const crouList = allTenants.filter(
        (t: Tenant) => t.type === 'crou'
      );
      console.log('✅ TenantSelector: CROUs filtrés:', crouList);
      setTenants(crouList);
    } catch (error) {
      console.error('❌ TenantSelector: Erreur chargement tenants:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTenantSelect = (tenantId: string | null) => {
    // Utiliser le store Zustand qui gère automatiquement la persistance
    setSelectedTenantId(tenantId);
    setIsOpen(false);
    
    // Notifier le parent (optionnel)
    onTenantChange?.(tenantId);
  };

  // Ne pas afficher si l'utilisateur n'a pas d'accès étendu
  if (!hasExtendedAccess()) {
    return null;
  }

  const selectedTenant = tenants.find(t => t.id === selectedTenantId);

  return (
    <div className={`relative ${className}`}>
      {/* Bouton de sélection */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-white dark:bg-gray-800 border-2 border-indigo-200 dark:border-indigo-700 rounded-xl text-indigo-700 dark:text-indigo-300 hover:border-indigo-400 dark:hover:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-sm hover:shadow-md min-w-[240px]"
        disabled={loading}
      >
        <Building2 className="w-4 h-4 text-indigo-500" />
        <span className="flex-1 text-left truncate">
          {loading ? 'Chargement...' : selectedTenant ? selectedTenant.name : 'Tous les CROUs'}
        </span>
        <ChevronDown
          className={`w-4 h-4 text-indigo-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {/* Dropdown menu */}
      {isOpen && (
        <>
          {/* Overlay */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />

          {/* Menu */}
          <div className="absolute left-0 right-0 mt-2 bg-white dark:bg-gray-800 rounded-xl shadow-2xl border-2 border-indigo-100 dark:border-indigo-800 py-2 z-50 max-h-96 overflow-y-auto">
            {/* Option "Tous" */}
            <button
              onClick={() => handleTenantSelect(null)}
              className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors ${
                !selectedTenantId ? 'bg-indigo-50 dark:bg-indigo-900/30' : ''
              }`}
            >
              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                !selectedTenantId
                  ? 'border-indigo-600 bg-indigo-600'
                  : 'border-gray-300 dark:border-gray-600'
              }`}>
                {!selectedTenantId && <CheckCircle2 className="w-4 h-4 text-white" />}
              </div>
              <div className="flex-1 text-left">
                <div className={`font-semibold ${
                  !selectedTenantId
                    ? 'text-indigo-700 dark:text-indigo-300'
                    : 'text-gray-700 dark:text-gray-300'
                }`}>
                  Tous les CROUs
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  Vue d'ensemble nationale
                </div>
              </div>
            </button>

            {/* Séparateur */}
            <div className="border-t border-indigo-100 dark:border-indigo-800 my-2" />

            {/* Liste des CROUs */}
            {tenants.map((tenant) => (
              <button
                key={tenant.id}
                onClick={() => handleTenantSelect(tenant.id)}
                className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors ${
                  selectedTenantId === tenant.id ? 'bg-indigo-50 dark:bg-indigo-900/30' : ''
                }`}
              >
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                  selectedTenantId === tenant.id
                    ? 'border-indigo-600 bg-indigo-600'
                    : 'border-gray-300 dark:border-gray-600'
                }`}>
                  {selectedTenantId === tenant.id && <CheckCircle2 className="w-4 h-4 text-white" />}
                </div>
                <div className="flex-1 text-left">
                  <div className={`font-semibold ${
                    selectedTenantId === tenant.id
                      ? 'text-indigo-700 dark:text-indigo-300'
                      : 'text-gray-700 dark:text-gray-300'
                  }`}>
                    {tenant.name}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    Code: {tenant.code}
                  </div>
                </div>
              </button>
            ))}

            {/* Message si aucun CROU */}
            {tenants.length === 0 && !loading && (
              <div className="px-4 py-6 text-center text-sm text-gray-500 dark:text-gray-400">
                Aucun CROU disponible
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

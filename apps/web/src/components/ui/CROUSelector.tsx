/**
 * FICHIER: apps\web\src\components\ui\CROUSelector.tsx
 * COMPOSANT: CROUSelector - Sélecteur spécialisé pour les CROU
 * 
 * DESCRIPTION:
 * Composant spécialisé pour la sélection des centres CROU
 * Intègre la liste des 8 CROU du Niger avec leurs informations
 * Support des filtres par région et type d'accès
 * 
 * FONCTIONNALITÉS:
 * - Liste complète des 8 CROU du Niger
 * - Filtrage par région géographique
 * - Filtrage par niveau d'accès utilisateur
 * - Affichage des informations détaillées (région, code)
 * - Support multi-select pour les vues ministérielles
 * - Icônes et descriptions contextuelles
 * 
 * DONNÉES CROU:
 * - CROU Niamey (Région de Niamey)
 * - CROU Dosso (Région de Dosso)
 * - CROU Maradi (Région de Maradi)
 * - CROU Tahoua (Région de Tahoua)
 * - CROU Tillabéri (Région de Tillabéri)
 * - CROU Zinder (Région de Zinder)
 * - CROU Agadez (Région d'Agadez)
 * - CROU Diffa (Région de Diffa)
 * 
 * PROPS:
 * - level: Niveau d'accès ('all', 'ministry', 'local')
 * - excludeCROUs: CROU à exclure de la liste
 * - includeMinistry: Inclure l'option "Ministère"
 * - showRegions: Afficher les régions dans les labels
 * - showCodes: Afficher les codes CROU
 * - filterByUserAccess: Filtrer selon l'accès utilisateur
 * 
 * USAGE:
 * <CROUSelector
 *   value={selectedCrou}
 *   onChange={setSelectedCrou}
 *   level="all"
 *   multiple
 *   searchable
 * />
 * 
 * AUTEUR: Équipe CROU
 * DATE: Décembre 2024
 */

import React, { useMemo } from 'react';
import { BuildingOfficeIcon, GlobeAltIcon } from '@heroicons/react/24/outline';
import { Select, type SelectProps, type SelectOption } from './Select';
import { useAuth } from '@/stores/auth';

// Données des CROU du Niger
const CROU_DATA = [
  {
    id: 'niamey',
    name: 'CROU Niamey',
    code: 'NIA',
    region: 'Niamey',
    description: 'Centre Régional des Œuvres Universitaires de Niamey',
    isCapital: true
  },
  {
    id: 'dosso',
    name: 'CROU Dosso',
    code: 'DOS',
    region: 'Dosso',
    description: 'Centre Régional des Œuvres Universitaires de Dosso',
    isCapital: false
  },
  {
    id: 'maradi',
    name: 'CROU Maradi',
    code: 'MAR',
    region: 'Maradi',
    description: 'Centre Régional des Œuvres Universitaires de Maradi',
    isCapital: false
  },
  {
    id: 'tahoua',
    name: 'CROU Tahoua',
    code: 'TAH',
    region: 'Tahoua',
    description: 'Centre Régional des Œuvres Universitaires de Tahoua',
    isCapital: false
  },
  {
    id: 'tillaberi',
    name: 'CROU Tillabéri',
    code: 'TIL',
    region: 'Tillabéri',
    description: 'Centre Régional des Œuvres Universitaires de Tillabéri',
    isCapital: false
  },
  {
    id: 'zinder',
    name: 'CROU Zinder',
    code: 'ZIN',
    region: 'Zinder',
    description: 'Centre Régional des Œuvres Universitaires de Zinder',
    isCapital: false
  },
  {
    id: 'agadez',
    name: 'CROU Agadez',
    code: 'AGA',
    region: 'Agadez',
    description: 'Centre Régional des Œuvres Universitaires d\'Agadez',
    isCapital: false
  },
  {
    id: 'diffa',
    name: 'CROU Diffa',
    code: 'DIF',
    region: 'Diffa',
    description: 'Centre Régional des Œuvres Universitaires de Diffa',
    isCapital: false
  }
];

// Interface des props spécifiques au CROUSelector
export interface CROUSelectorProps extends Omit<SelectProps, 'options'> {
  /** Niveau d'accès pour filtrer les CROU */
  level?: 'all' | 'ministry' | 'local';
  
  /** CROU à exclure de la liste */
  excludeCROUs?: string[];
  
  /** Inclure l'option "Ministère" */
  includeMinistry?: boolean;
  
  /** Afficher les régions dans les labels */
  showRegions?: boolean;
  
  /** Afficher les codes CROU */
  showCodes?: boolean;
  
  /** Filtrer selon l'accès utilisateur connecté */
  filterByUserAccess?: boolean;
  
  /** Grouper par région */
  groupByRegion?: boolean;
  
  /** Afficher uniquement les CROU actifs */
  activeOnly?: boolean;
}

// Composant CROUSelector
export const CROUSelector: React.FC<CROUSelectorProps> = ({
  level = 'all',
  excludeCROUs = [],
  includeMinistry = false,
  showRegions = true,
  showCodes = false,
  filterByUserAccess = false,
  groupByRegion = false,
  activeOnly = true,
  placeholder = 'Sélectionner un CROU',
  ...props
}) => {
  const { user } = useAuth();

  // Construction des options CROU
  const crouOptions = useMemo((): SelectOption[] => {
    let filteredCROUs = CROU_DATA;

    // Filtrage par CROU exclus
    if (excludeCROUs.length > 0) {
      filteredCROUs = filteredCROUs.filter(crou => !excludeCROUs.includes(crou.id));
    }

    // Filtrage par accès utilisateur
    if (filterByUserAccess && user) {
      if (user.level === 'crou' && user.crouId) {
        // Utilisateur CROU : seulement son CROU
        filteredCROUs = filteredCROUs.filter(crou => crou.id === user.crouId);
      } else if (user.level === 'ministere') {
        // Utilisateur ministère : tous les CROU selon le niveau demandé
        switch (level) {
          case 'local':
            // Aucun CROU pour le niveau local si utilisateur ministère
            filteredCROUs = [];
            break;
          case 'ministry':
          case 'all':
          default:
            // Tous les CROU disponibles
            break;
        }
      }
    }

    // Construction des options
    const options: SelectOption[] = [];

    // Option Ministère si demandée
    if (includeMinistry && (level === 'all' || level === 'ministry')) {
      options.push({
        value: 'ministere',
        label: 'Ministère de l\'Enseignement Supérieur',
        description: 'Vue consolidée nationale',
        icon: <GlobeAltIcon className="h-4 w-4" />,
        group: groupByRegion ? 'National' : undefined
      });
    }

    // Options CROU
    filteredCROUs.forEach(crou => {
      let label = crou.name;
      
      if (showRegions && showCodes) {
        label = `${crou.name} (${crou.code}) - ${crou.region}`;
      } else if (showRegions) {
        label = `${crou.name} - ${crou.region}`;
      } else if (showCodes) {
        label = `${crou.name} (${crou.code})`;
      }

      options.push({
        value: crou.id,
        label,
        description: crou.description,
        icon: <BuildingOfficeIcon className="h-4 w-4" />,
        group: groupByRegion ? crou.region : undefined
      });
    });

    return options;
  }, [
    level,
    excludeCROUs,
    includeMinistry,
    showRegions,
    showCodes,
    filterByUserAccess,
    groupByRegion,
    user
  ]);

  // Fonction de filtrage personnalisée pour la recherche
  const customFilterFunction = (option: SelectOption, query: string): boolean => {
    const searchText = query.toLowerCase().trim();
    if (!searchText) return true;

    // Recherche dans le label
    if (option.label.toLowerCase().includes(searchText)) return true;

    // Recherche dans la description
    if (option.description && option.description.toLowerCase().includes(searchText)) return true;

    // Recherche dans les données CROU
    if (option.value !== 'ministere') {
      const crouData = CROU_DATA.find(crou => crou.id === option.value);
      if (crouData) {
        return (
          crouData.name.toLowerCase().includes(searchText) ||
          crouData.code.toLowerCase().includes(searchText) ||
          crouData.region.toLowerCase().includes(searchText)
        );
      }
    }

    return false;
  };

  // Messages personnalisés
  const noOptionsText = filterByUserAccess && user?.level === 'crou' 
    ? 'Aucun CROU accessible avec vos permissions'
    : 'Aucun CROU disponible';

  return (
    <Select
      options={crouOptions}
      placeholder={placeholder}
      filterFunction={customFilterFunction}
      noOptionsText={noOptionsText}
      {...props}
    />
  );
};

// Composant RoleSelector pour la sélection des rôles
export interface RoleSelectorProps extends Omit<SelectProps, 'options'> {
  /** Niveau des rôles à afficher */
  level?: 'ministry' | 'crou' | 'all';
  
  /** Permissions requises pour filtrer les rôles */
  requiredPermissions?: string[];
  
  /** Afficher les descriptions des rôles */
  showDescriptions?: boolean;
}

// Données des rôles avec descriptions
const ROLE_DATA = {
  ministry: [
    {
      id: 'ministre',
      name: 'Ministre/Directeur Général',
      description: 'Supervision générale et validation finale',
      permissions: ['all']
    },
    {
      id: 'directeur_finances',
      name: 'Directeur Affaires Financières',
      description: 'Gestion budgétaire et validation financière',
      permissions: ['financial:read', 'financial:write', 'financial:validate']
    },
    {
      id: 'resp_appro',
      name: 'Responsable Approvisionnements',
      description: 'Achats centralisés et gestion des contrats',
      permissions: ['stocks:read', 'stocks:write', 'stocks:validate']
    },
    {
      id: 'controleur',
      name: 'Contrôleur Budgétaire',
      description: 'Audit et contrôle des opérations',
      permissions: ['dashboard:read', 'reports:read', 'reports:export']
    }
  ],
  crou: [
    {
      id: 'directeur',
      name: 'Directeur CROU',
      description: 'Direction générale du centre régional',
      permissions: ['dashboard:read', 'dashboard:write', 'financial:read', 'financial:write']
    },
    {
      id: 'secretaire',
      name: 'Secrétaire Administratif',
      description: 'Gestion administrative et logement',
      permissions: ['housing:read', 'housing:write', 'reports:read']
    },
    {
      id: 'chef_financier',
      name: 'Chef Financier',
      description: 'Gestion financière locale',
      permissions: ['financial:read', 'financial:write', 'financial:validate']
    },
    {
      id: 'comptable',
      name: 'Comptable',
      description: 'Comptabilité et états financiers',
      permissions: ['financial:read', 'financial:write']
    },
    {
      id: 'intendant',
      name: 'Intendant',
      description: 'Gestion des stocks et approvisionnements',
      permissions: ['stocks:read', 'stocks:write', 'stocks:validate']
    },
    {
      id: 'magasinier',
      name: 'Magasinier',
      description: 'Gestion des stocks opérationnels',
      permissions: ['stocks:read', 'stocks:write']
    },
    {
      id: 'chef_transport',
      name: 'Chef Transport',
      description: 'Gestion du parc automobile',
      permissions: ['transport:read', 'transport:write', 'transport:validate']
    },
    {
      id: 'chef_logement',
      name: 'Chef Logement',
      description: 'Gestion des cités universitaires',
      permissions: ['housing:read', 'housing:write', 'housing:validate']
    },
    {
      id: 'chef_restauration',
      name: 'Chef Restauration',
      description: 'Gestion de la restauration universitaire',
      permissions: ['stocks:read', 'stocks:write', 'reports:read']
    }
  ]
};

export const RoleSelector: React.FC<RoleSelectorProps> = ({
  level = 'all',
  requiredPermissions = [],
  showDescriptions = true,
  placeholder = 'Sélectionner un rôle',
  ...props
}) => {
  // Construction des options de rôles
  const roleOptions = useMemo((): SelectOption[] => {
    const options: SelectOption[] = [];

    // Fonction pour vérifier si un rôle a les permissions requises
    const hasRequiredPermissions = (rolePermissions: string[]): boolean => {
      if (requiredPermissions.length === 0) return true;
      if (rolePermissions.includes('all')) return true;
      
      return requiredPermissions.some(perm => rolePermissions.includes(perm));
    };

    // Ajouter les rôles ministériels
    if (level === 'all' || level === 'ministry') {
      ROLE_DATA.ministry.forEach(role => {
        if (hasRequiredPermissions(role.permissions)) {
          options.push({
            value: role.id,
            label: role.name,
            description: showDescriptions ? role.description : undefined,
            group: 'Ministère'
          });
        }
      });
    }

    // Ajouter les rôles CROU
    if (level === 'all' || level === 'crou') {
      ROLE_DATA.crou.forEach(role => {
        if (hasRequiredPermissions(role.permissions)) {
          options.push({
            value: role.id,
            label: role.name,
            description: showDescriptions ? role.description : undefined,
            group: 'CROU'
          });
        }
      });
    }

    return options;
  }, [level, requiredPermissions, showDescriptions]);

  return (
    <Select
      options={roleOptions}
      placeholder={placeholder}
      {...props}
    />
  );
};

export default CROUSelector;

/**
 * FICHIER: apps/web/src/pages/admin/RolesPage.tsx
 * PAGE: RolesPage - Gestion des rôles et permissions
 * 
 * DESCRIPTION:
 * Interface d'administration pour la gestion des rôles et permissions
 * Matrice de permissions, assignation de rôles, gestion granulaire
 * 
 * FONCTIONNALITÉS:
 * - Liste des rôles avec permissions associées
 * - Matrice de permissions interactive
 * - Création/modification de rôles
 * - Assignation de permissions granulaires
 * - Prévisualisation des accès par rôle
 * - Gestion des rôles système vs personnalisés
 * 
 * AUTEUR: Équipe CROU
 * DATE: Décembre 2024
 */

import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  Shield, 
  Users, 
  Edit, 
  Trash2, 
  Eye,
  Check,
  X,
  Settings,
  Lock,
  AlertTriangle
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Table, TableColumn } from '@/components/ui/Table';
import { Modal } from '@/components/ui/Modal';
import { Badge } from '@/components/ui/Badge';
import { Checkbox } from '@/components/ui/Checkbox';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/Tabs';
import { cn } from '@/utils/cn';
import { Card } from '@/components/ui/Card';
import { adminService, type UserRole as ApiRole } from '@/services/api/adminService';
import { RoleCreateModal, RoleEditModal } from '@/components/admin/RoleModals';

// Types pour les rôles et permissions
interface Permission {
  id: string;
  resource: string;
  actions: string[];
  description: string;
  category: string;
}

interface Role {
  id: string;
  name: string;
  description: string;
  tenantType: 'ministere' | 'crou' | 'both';
  isSystemRole: boolean;
  permissions: Permission[];
  userCount: number;
  createdAt: string;
  updatedAt: string;
}

// Ressources et actions disponibles
const RESOURCES = [
  {
    category: 'Utilisateurs',
    resources: [
      { key: 'users', label: 'Utilisateurs', actions: ['read', 'write', 'delete'] },
      { key: 'roles', label: 'Rôles', actions: ['read', 'write', 'delete'] },
      { key: 'permissions', label: 'Permissions', actions: ['read', 'write'] }
    ]
  },
  {
    category: 'Administration',
    resources: [
      { key: 'tenants', label: 'Tenants', actions: ['read', 'write', 'delete'] },
      { key: 'audit', label: 'Logs d\'audit', actions: ['read', 'export'] },
      { key: 'security', label: 'Sécurité', actions: ['read', 'write'] },
      { key: 'stats', label: 'Statistiques', actions: ['read', 'export'] }
    ]
  },
  {
    category: 'Modules Métiers',
    resources: [
      { key: 'dashboard', label: 'Tableau de bord', actions: ['read'] },
      { key: 'finances', label: 'Finances', actions: ['read', 'write', 'validate'] },
      { key: 'stocks', label: 'Stocks', actions: ['read', 'write', 'validate'] },
      { key: 'housing', label: 'Logement', actions: ['read', 'write', 'validate'] },
      { key: 'transport', label: 'Transport', actions: ['read', 'write', 'validate'] },
      { key: 'reports', label: 'Rapports', actions: ['read', 'write', 'export'] }
    ]
  }
];

const ACTION_LABELS = {
  read: 'Lecture',
  write: 'Écriture',
  delete: 'Suppression',
  validate: 'Validation',
  export: 'Export'
};

const tenantTypeOptions = [
  { value: '', label: 'Tous les types' },
  { value: 'ministere', label: 'Ministère' },
  { value: 'crou', label: 'CROU' },
  { value: 'both', label: 'Les deux' }
];

export const RolesPage: React.FC = () => {
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [tenantTypeFilter, setTenantTypeFilter] = useState('');
  const [activeTab, setActiveTab] = useState('roles');
  
  // États pour les modales
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPermissionsModal, setShowPermissionsModal] = useState(false);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);

  // Charger les rôles
  const loadRoles = async () => {
    setLoading(true);
    try {
      const apiRoles = await adminService.getRoles();

      // Map API roles to local Role interface
      const mappedRoles: Role[] = apiRoles.map((apiRole: ApiRole) => ({
        id: apiRole.id,
        name: apiRole.name,
        description: apiRole.description,
        tenantType: 'both' as const, // Default, can be enhanced later
        isSystemRole: apiRole.isSystem,
        permissions: apiRole.permissions.map(perm => ({
          id: perm.id,
          resource: perm.resource || perm.module,
          actions: [perm.action],
          description: perm.description,
          category: perm.module
        })),
        userCount: 0, // Not available from API yet
        createdAt: apiRole.createdAt,
        updatedAt: apiRole.updatedAt
      }));

      setRoles(mappedRoles);
    } catch (error) {
      console.error('Erreur lors du chargement des rôles:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRoles();
  }, []);

  // Filtrer les rôles
  const filteredRoles = roles.filter(role => {
    const matchesSearch = role.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         role.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTenantType = !tenantTypeFilter || role.tenantType === tenantTypeFilter || role.tenantType === 'both';
    
    return matchesSearch && matchesTenantType;
  });

  // Colonnes du tableau
  const columns: TableColumn<Role>[] = [
    {
      key: 'name',
      label: 'Rôle',
      sortable: true,
      render: (role) => (
        <div className="flex items-center space-x-3">
          <div className="flex-shrink-0">
            <Shield className="h-8 w-8 text-blue-500" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-medium text-gray-900 dark:text-white">
                {role.name}
              </span>
              {role.isSystemRole && (
                <Badge variant="secondary" className="text-xs">
                  <Lock className="h-3 w-3 mr-1" />
                  Système
                </Badge>
              )}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              {role.description}
            </div>
          </div>
        </div>
      )
    },
    {
      key: 'tenantType',
      label: 'Type',
      sortable: true,
      render: (role) => {
        const typeLabels = {
          ministere: 'Ministère',
          crou: 'CROU',
          both: 'Les deux'
        };
        
        const typeVariants = {
          ministere: 'primary' as const,
          crou: 'secondary' as const,
          both: 'success' as const
        };
        
        return (
          <Badge variant={typeVariants[role.tenantType]}>
            {typeLabels[role.tenantType]}
          </Badge>
        );
      }
    },
    {
      key: 'permissions',
      label: 'Permissions',
      render: (role) => (
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-600 dark:text-gray-400">
            {role.permissions.length} permission{role.permissions.length > 1 ? 's' : ''}
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setSelectedRole(role);
              setShowPermissionsModal(true);
            }}
          >
            <Eye className="h-4 w-4" />
          </Button>
        </div>
      )
    },
    {
      key: 'userCount',
      label: 'Utilisateurs',
      sortable: true,
      render: (role) => (
        <div className="flex items-center space-x-2">
          <Users className="h-4 w-4 text-gray-400" />
          <span className="text-sm text-gray-900 dark:text-white">
            {role.userCount}
          </span>
        </div>
      )
    },
    {
      key: 'actions',
      label: 'Actions',
      width: '120px',
      render: (role) => (
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setSelectedRole(role);
              setShowPermissionsModal(true);
            }}
          >
            <Eye className="h-4 w-4" />
          </Button>
          
          {!role.isSystemRole && (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSelectedRole(role);
                  setShowEditModal(true);
                }}
              >
                <Edit className="h-4 w-4" />
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleDeleteRole(role.id)}
                className="text-red-600 hover:text-red-700"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </>
          )}
        </div>
      )
    }
  ];

  // Actions sur les rôles
  const handleDeleteRole = async (roleId: string) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer ce rôle ?')) {
      try {
        await adminService.deleteRole(roleId);
        await loadRoles();
      } catch (error) {
        console.error('Erreur lors de la suppression:', error);
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Gestion des Rôles et Permissions
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            {roles.length} rôle{roles.length > 1 ? 's' : ''} configuré{roles.length > 1 ? 's' : ''}
          </p>
        </div>
        
        <Button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center space-x-2"
        >
          <Plus className="h-4 w-4" />
          <span>Nouveau rôle</span>
        </Button>
      </div>

      {/* Onglets */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList>
          <TabsTrigger active={activeTab === 'roles'} onClick={() => setActiveTab('roles')}>Rôles</TabsTrigger>
          <TabsTrigger active={activeTab === 'matrix'} onClick={() => setActiveTab('matrix')}>Matrice de permissions</TabsTrigger>
        </TabsList>

        <TabsContent className="space-y-6">{activeTab === 'roles' && (
          <div className="space-y-6">
          {/* Filtres */}
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Input
                placeholder="Rechercher un rôle..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              
              <Select
                value={tenantTypeFilter}
                onChange={(value) => setTenantTypeFilter(String(value))}
                options={tenantTypeOptions}
                placeholder="Type de tenant"
              />
              
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setSearchTerm('');
                    setTenantTypeFilter('');
                  }}
                >
                  Réinitialiser
                </Button>
              </div>
            </div>
          </div>

          {/* Tableau des rôles */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
            <Table
              data={filteredRoles}
              columns={columns}
              loading={loading}
            />
          </div>
          </div>
        )}</TabsContent>

        <TabsContent>{activeTab === 'matrix' && (
          <div className="space-y-6">
            <PermissionsMatrix roles={roles} />
          </div>
        )}</TabsContent>
      </Tabs>

      {/* Modales */}
      {showCreateModal && (
        <RoleCreateModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false);
            loadRoles();
          }}
        />
      )}

      {showEditModal && selectedRole && (
        <RoleEditModal
          isOpen={showEditModal}
          role={{
            id: selectedRole.id,
            name: selectedRole.name,
            description: selectedRole.description,
            permissions: selectedRole.permissions.map(perm => ({
              id: perm.id,
              name: `${perm.resource}:${perm.actions[0]}`,
              description: perm.description,
              module: perm.category,
              action: perm.actions[0],
              resource: perm.resource,
              createdAt: selectedRole.createdAt,
              updatedAt: selectedRole.updatedAt
            })),
            isSystem: selectedRole.isSystemRole,
            createdAt: selectedRole.createdAt,
            updatedAt: selectedRole.updatedAt
          } as ApiRole}
          onClose={() => {
            setShowEditModal(false);
            setSelectedRole(null);
          }}
          onSuccess={() => {
            setShowEditModal(false);
            setSelectedRole(null);
            loadRoles();
          }}
        />
      )}

      {showPermissionsModal && selectedRole && (
        <RolePermissionsModal
          isOpen={showPermissionsModal}
          role={selectedRole}
          onClose={() => {
            setShowPermissionsModal(false);
            setSelectedRole(null);
          }}
        />
      )}
    </div>
  );
};

// Composant de matrice de permissions
const PermissionsMatrix: React.FC<{ roles: Role[] }> = ({ roles }) => {
  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Matrice de Permissions
        </h3>
        
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">
                  Ressource / Action
                </th>
                {roles.map(role => (
                  <th key={role.id} className="text-center py-3 px-4 font-medium text-gray-900 dark:text-white min-w-[120px]">
                    <div className="flex flex-col items-center space-y-1">
                      <span className="text-sm">{role.name}</span>
                      <Badge 
                        variant={role.tenantType === 'ministere' ? 'primary' : 'secondary'}
                        className="text-xs"
                      >
                        {role.tenantType === 'ministere' ? 'MIN' : 'CROU'}
                      </Badge>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {RESOURCES.map(category => (
                <React.Fragment key={category.category}>
                  <tr className="bg-gray-50 dark:bg-gray-700">
                    <td colSpan={roles.length + 1} className="py-2 px-4 font-medium text-gray-700 dark:text-gray-300">
                      {category.category}
                    </td>
                  </tr>
                  {category.resources.map(resource => 
                    resource.actions.map(action => (
                      <tr key={`${resource.key}-${action}`} className="border-b border-gray-100 dark:border-gray-800">
                        <td className="py-2 px-4 text-sm text-gray-900 dark:text-white">
                          <div className="flex items-center space-x-2">
                            <span>{resource.label}</span>
                            <Badge variant="outline" className="text-xs">
                              {ACTION_LABELS[action as keyof typeof ACTION_LABELS]}
                            </Badge>
                          </div>
                        </td>
                        {roles.map(role => (
                          <td key={role.id} className="py-2 px-4 text-center">
                            {/* TODO: Vérifier si le rôle a cette permission */}
                            <div className="flex justify-center">
                              {Math.random() > 0.5 ? (
                                <Check className="h-4 w-4 text-green-500" />
                              ) : (
                                <X className="h-4 w-4 text-gray-300" />
                              )}
                            </div>
                          </td>
                        ))}
                      </tr>
                    ))
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};


const RolePermissionsModal: React.FC<{
  isOpen: boolean;
  role: Role;
  onClose: () => void;
}> = ({ isOpen, role, onClose }) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl">
      <div className="p-6">
        <h3 className="text-lg font-semibold mb-4">
          Permissions du rôle : {role.name}
        </h3>
        
        <div className="space-y-4">
          {RESOURCES.map(category => (
            <Card key={category.category} className="p-4">
              <h4 className="font-medium text-gray-900 dark:text-white mb-3">
                {category.category}
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {category.resources.map(resource => (
                  <div key={resource.key} className="space-y-2">
                    <div className="font-medium text-sm text-gray-700 dark:text-gray-300">
                      {resource.label}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {resource.actions.map(action => (
                        <Badge key={action} variant="outline" className="text-xs">
                          {ACTION_LABELS[action as keyof typeof ACTION_LABELS]}
                        </Badge>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          ))}
        </div>
        
        <div className="flex justify-end mt-6">
          <Button onClick={onClose}>
            Fermer
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default RolesPage;
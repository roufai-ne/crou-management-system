/**
 * FICHIER: apps/web/src/pages/admin/TenantsPage.tsx
 * PAGE: TenantsPage - Gestion des tenants (organisations CROU)
 * 
 * DESCRIPTION:
 * Interface d'administration pour la gestion des tenants/organisations
 * Configuration des CROU et du Ministère
 * 
 * FONCTIONNALITÉS:
 * - Liste des tenants avec informations détaillées
 * - Configuration des paramètres par tenant
 * - Gestion des utilisateurs par tenant
 * - Statistiques d'utilisation par organisation
 * - Activation/désactivation des tenants
 * - Configuration des modules autorisés
 * 
 * AUTEUR: Équipe CROU
 * DATE: Décembre 2024
 */

import React, { useState, useEffect } from 'react';
import { 
  Building, 
  Users, 
  Settings, 
  BarChart3, 
  MapPin, 
  Phone, 
  Mail,
  Calendar,
  Activity,
  CheckCircle,
  XCircle,
  Edit,
  Eye,
  RefreshCw,
  Plus
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { KPICard } from '@/components/ui/KPICard';
import { Table, TableColumn } from '@/components/ui/Table';
import { Modal } from '@/components/ui/Modal';
import { Badge } from '@/components/ui/Badge';
import { Tabs } from '@/components/ui/Tabs';
import { adminService, type Tenant as ApiTenant } from '@/services/api/adminService';
import { Toast } from '@/components/ui/Toast';

// Types pour les tenants
interface Tenant {
  id: string;
  name: string;
  type: 'ministere' | 'ministry' | 'region' | 'crou';
  code: string;
  region?: string;
  parentId?: string; // ID du tenant parent (pour hiérarchie à 3 niveaux)
  path?: string; // Chemin hiérarchique (ex: "/ministere/region-idf/crou-paris")
  hierarchyLevel?: number; // 0=ministry, 1=region, 2=crou
  address?: string;
  phone?: string;
  email?: string;
  isActive: boolean;
  userCount: number;
  lastActivity: Date;
  createdAt: Date;
  config: {
    allowedModules: string[];
    customSettings: Record<string, any>;
    dataRetentionDays: number;
  };
  stats: {
    totalUsers: number;
    activeUsers: number;
    totalLogins: number;
    lastLogin: Date;
  };
}

interface TenantModule {
  key: string;
  name: string;
  description: string;
  icon: React.ComponentType<any>;
  required: boolean;
}

// Modules disponibles
const availableModules: TenantModule[] = [
  {
    key: 'dashboard',
    name: 'Tableau de bord',
    description: 'Vue d\'ensemble et indicateurs',
    icon: BarChart3,
    required: true
  },
  {
    key: 'finances',
    name: 'Finances',
    description: 'Gestion financière et budgétaire',
    icon: Activity,
    required: false
  },
  {
    key: 'stocks',
    name: 'Stocks',
    description: 'Gestion des stocks et approvisionnements',
    icon: Activity,
    required: false
  },
  {
    key: 'housing',
    name: 'Logement',
    description: 'Gestion des logements étudiants',
    icon: Building,
    required: false
  },
  {
    key: 'transport',
    name: 'Transport',
    description: 'Gestion du transport étudiant',
    icon: Activity,
    required: false
  },
  {
    key: 'reports',
    name: 'Rapports',
    description: 'Génération de rapports',
    icon: Activity,
    required: false
  }
];

export const TenantsPage: React.FC = () => {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null);
  const [showTenantDetails, setShowTenantDetails] = useState(false);
  const [showTenantConfig, setShowTenantConfig] = useState(false);
  const [showCreateTenant, setShowCreateTenant] = useState(false);

  // Charger les tenants
  const loadTenants = async () => {
    setLoading(true);
    try {
      const apiTenants = await adminService.getTenants();

      // Map API tenants to local Tenant interface
      const mappedTenants: Tenant[] = apiTenants.map((apiTenant: ApiTenant) => ({
        id: apiTenant.id,
        name: apiTenant.name,
        type: apiTenant.type,
        code: apiTenant.id.substring(0, 3).toUpperCase(),
        region: apiTenant.region,
        address: apiTenant.address,
        phone: apiTenant.phone,
        email: apiTenant.email,
        isActive: apiTenant.isActive,
        userCount: 0, // Not available from API yet
        lastActivity: new Date(apiTenant.updatedAt),
        createdAt: new Date(apiTenant.createdAt),
        config: {
          allowedModules: Object.entries(apiTenant.config.features)
            .filter(([_, enabled]) => enabled)
            .map(([module, _]) => module),
          customSettings: {},
          dataRetentionDays: 1095 // Default 3 years
        },
        stats: {
          totalUsers: 0,
          activeUsers: 0,
          totalLogins: 0,
          lastLogin: new Date(apiTenant.updatedAt)
        }
      }));

      setTenants(mappedTenants);
    } catch (error) {
      console.error('Erreur lors du chargement des tenants:', error);
      Toast.error('Erreur lors du chargement des tenants');

      // Fallback to mock data if API fails
      const mockTenants: Tenant[] = [
        {
          id: 'ministere',
          name: 'Ministère de l\'Enseignement Supérieur',
          type: 'ministere',
          code: 'MIN',
          address: 'Niamey, Niger',
          phone: '+227 20 72 35 46',
          email: 'contact@mesrs.ne',
          isActive: true,
          userCount: 4,
          lastActivity: new Date(Date.now() - 30 * 60 * 1000),
          createdAt: new Date('2024-01-01'),
          config: {
            allowedModules: ['dashboard', 'finances', 'stocks', 'housing', 'transport', 'reports'],
            customSettings: {
              canAccessAllTenants: true,
              reportingLevel: 'national'
            },
            dataRetentionDays: 2555 // 7 ans
          },
          stats: {
            totalUsers: 4,
            activeUsers: 4,
            totalLogins: 156,
            lastLogin: new Date(Date.now() - 30 * 60 * 1000)
          }
        },
        {
          id: 'crou_niamey',
          name: 'CROU Niamey',
          type: 'crou',
          code: 'NIA',
          region: 'Région de Niamey',
          address: 'Université Abdou Moumouni, Niamey',
          phone: '+227 20 73 28 91',
          email: 'contact@crou-niamey.ne',
          isActive: true,
          userCount: 9,
          lastActivity: new Date(Date.now() - 15 * 60 * 1000),
          createdAt: new Date('2024-01-15'),
          config: {
            allowedModules: ['dashboard', 'finances', 'stocks', 'housing', 'transport'],
            customSettings: {
              studentCapacity: 15000,
              housingCapacity: 3000
            },
            dataRetentionDays: 1095 // 3 ans
          },
          stats: {
            totalUsers: 9,
            activeUsers: 8,
            totalLogins: 234,
            lastLogin: new Date(Date.now() - 15 * 60 * 1000)
          }
        },
        {
          id: 'crou_dosso',
          name: 'CROU Dosso',
          type: 'crou',
          code: 'DOS',
          region: 'Région de Dosso',
          address: 'Université de Dosso',
          phone: '+227 20 65 12 34',
          email: 'contact@crou-dosso.ne',
          isActive: true,
          userCount: 8,
          lastActivity: new Date(Date.now() - 2 * 60 * 60 * 1000),
          createdAt: new Date('2024-01-20'),
          config: {
            allowedModules: ['dashboard', 'finances', 'stocks', 'housing'],
            customSettings: {
              studentCapacity: 8000,
              housingCapacity: 1500
            },
            dataRetentionDays: 1095
          },
          stats: {
            totalUsers: 8,
            activeUsers: 6,
            totalLogins: 189,
            lastLogin: new Date(Date.now() - 2 * 60 * 60 * 1000)
          }
        },
        {
          id: 'crou_maradi',
          name: 'CROU Maradi',
          type: 'crou',
          code: 'MAR',
          region: 'Région de Maradi',
          address: 'Université de Maradi',
          phone: '+227 20 41 23 45',
          email: 'contact@crou-maradi.ne',
          isActive: false,
          userCount: 7,
          lastActivity: new Date(Date.now() - 24 * 60 * 60 * 1000),
          createdAt: new Date('2024-02-01'),
          config: {
            allowedModules: ['dashboard', 'finances', 'stocks'],
            customSettings: {
              studentCapacity: 6000,
              housingCapacity: 1000
            },
            dataRetentionDays: 1095
          },
          stats: {
            totalUsers: 7,
            activeUsers: 0,
            totalLogins: 98,
            lastLogin: new Date(Date.now() - 24 * 60 * 60 * 1000)
          }
        }
      ];

      setTenants(mockTenants);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTenants();
  }, []);

  // Colonnes du tableau
  const columns: TableColumn<Tenant>[] = [
    {
      key: 'name',
      label: 'Organisation',
      sortable: true,
      render: (tenant) => (
        <div className="flex items-center space-x-3">
          <div className="flex-shrink-0">
            <Building className={`h-8 w-8 ${tenant.type === 'ministere' ? 'text-blue-600' : 'text-green-600'}`} />
          </div>
          <div>
            <div className="font-medium text-gray-900 dark:text-white">
              {tenant.name}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              {tenant.code} • {tenant.region || 'National'}
            </div>
          </div>
        </div>
      )
    },
    {
      key: 'type',
      label: 'Type',
      sortable: true,
      render: (tenant) => {
        const typeLabels = {
          ministere: 'Ministère',
          ministry: 'Ministère',
          region: 'Région',
          crou: 'CROU'
        };
        const typeVariants: Record<string, 'primary' | 'secondary' | 'info'> = {
          ministere: 'primary',
          ministry: 'primary',
          region: 'info',
          crou: 'secondary'
        };
        return (
          <Badge variant={typeVariants[tenant.type] || 'secondary'}>
            {typeLabels[tenant.type] || tenant.type}
          </Badge>
        );
      }
    },
    {
      key: 'users',
      label: 'Utilisateurs',
      sortable: true,
      render: (tenant) => (
        <div className="flex items-center space-x-2">
          <Users className="h-4 w-4 text-gray-400" />
          <span className="font-medium text-gray-900 dark:text-white">
            {tenant.stats.activeUsers}/{tenant.stats.totalUsers}
          </span>
          <span className="text-sm text-gray-500 dark:text-gray-400">
            actifs
          </span>
        </div>
      )
    },
    {
      key: 'modules',
      label: 'Modules',
      render: (tenant) => (
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-900 dark:text-white">
            {tenant.config.allowedModules.length}
          </span>
          <span className="text-sm text-gray-500 dark:text-gray-400">
            module{tenant.config.allowedModules.length > 1 ? 's' : ''}
          </span>
        </div>
      )
    },
    {
      key: 'lastActivity',
      label: 'Dernière Activité',
      sortable: true,
      render: (tenant) => (
        <div>
          <div className="text-sm text-gray-900 dark:text-white">
            {tenant.lastActivity.toLocaleDateString('fr-FR')}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">
            {tenant.lastActivity.toLocaleTimeString('fr-FR')}
          </div>
        </div>
      )
    },
    {
      key: 'status',
      label: 'Statut',
      sortable: true,
      render: (tenant) => (
        <div className="flex items-center space-x-2">
          {tenant.isActive ? (
            <CheckCircle className="h-4 w-4 text-green-500" />
          ) : (
            <XCircle className="h-4 w-4 text-red-500" />
          )}
          <Badge variant={tenant.isActive ? 'success' : 'destructive'}>
            {tenant.isActive ? 'Actif' : 'Inactif'}
          </Badge>
        </div>
      )
    },
    {
      key: 'actions',
      label: 'Actions',
      width: '120px',
      render: (tenant) => (
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setSelectedTenant(tenant);
              setShowTenantDetails(true);
            }}
          >
            <Eye className="h-4 w-4" />
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setSelectedTenant(tenant);
              setShowTenantConfig(true);
            }}
          >
            <Settings className="h-4 w-4" />
          </Button>
        </div>
      )
    }
  ];

  // Actions
  const handleToggleTenantStatus = async (tenantId: string, currentStatus: boolean) => {
    try {
      await adminService.updateTenant(tenantId, { isActive: !currentStatus });
      await loadTenants();
      Toast.success(`Tenant ${!currentStatus ? 'activé' : 'désactivé'} avec succès`);
    } catch (error: any) {
      console.error('Erreur lors du changement de statut:', error);
    }
  };

  // Statistiques globales
  const globalStats = {
    totalTenants: tenants.length,
    activeTenants: tenants.filter(t => t.isActive).length,
    totalUsers: tenants.reduce((sum, t) => sum + t.stats.totalUsers, 0),
    activeUsers: tenants.reduce((sum, t) => sum + t.stats.activeUsers, 0)
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Gestion des Tenants
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            {globalStats.totalTenants} organisation{globalStats.totalTenants > 1 ? 's' : ''} configurée{globalStats.totalTenants > 1 ? 's' : ''}
          </p>
        </div>
        
        <div className="flex items-center space-x-3">
          <Button
            variant="outline"
            onClick={loadTenants}
            className="flex items-center space-x-2"
          >
            <RefreshCw className="h-4 w-4" />
            <span>Actualiser</span>
          </Button>
          
          <Button
            className="flex items-center space-x-2"
            onClick={() => setShowCreateTenant(true)}
          >
            <Plus className="h-4 w-4" />
            <span>Nouveau Tenant</span>
          </Button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard
          title="Total Tenants"
          value={globalStats.totalTenants}
          trend="stable"
          trendValue={`${globalStats.activeTenants} actifs`}
          icon={Building}
          variant="primary"
        />
        
        <KPICard
          title="Tenants Actifs"
          value={globalStats.activeTenants}
          trend={globalStats.activeTenants === globalStats.totalTenants ? 'up' : 'down'}
          trendValue={`${((globalStats.activeTenants / globalStats.totalTenants) * 100).toFixed(0)}%`}
          icon={CheckCircle}
          variant="success"
        />
        
        <KPICard
          title="Total Utilisateurs"
          value={globalStats.totalUsers}
          trend="up"
          trendValue={`${globalStats.activeUsers} actifs`}
          icon={Users}
          variant="secondary"
        />
        
        <KPICard
          title="Taux d'Activité"
          value={`${((globalStats.activeUsers / globalStats.totalUsers) * 100).toFixed(0)}%`}
          trend={globalStats.activeUsers > globalStats.totalUsers * 0.8 ? 'up' : 'down'}
          trendValue="Utilisateurs actifs"
          icon={Activity}
          variant="secondary"
        />
      </div>

      {/* Onglets */}
      <Tabs defaultValue="list" className="w-full">
        <Tabs.List>
          <Tabs.Trigger value="list">
            Liste des Tenants
          </Tabs.Trigger>
          <Tabs.Trigger value="overview">
            Vue d'Ensemble
          </Tabs.Trigger>
        </Tabs.List>

        <Tabs.Content value="list" className="space-y-4">
          {/* Tableau des tenants */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
            <Table
              data={tenants}
              columns={columns}
              loading={false}
            />
          </div>
        </Tabs.Content>

        <Tabs.Content value="overview" className="space-y-6">
          <TenantsOverview tenants={tenants} />
        </Tabs.Content>
      </Tabs>

      {/* Modales */}
      {showTenantDetails && selectedTenant && (
        <TenantDetailsModal
          isOpen={showTenantDetails}
          tenant={selectedTenant}
          onClose={() => {
            setShowTenantDetails(false);
            setSelectedTenant(null);
          }}
        />
      )}

      {showTenantConfig && selectedTenant && (
        <TenantConfigModal
          isOpen={showTenantConfig}
          tenant={selectedTenant}
          onClose={() => {
            setShowTenantConfig(false);
            setSelectedTenant(null);
          }}
          onSave={() => {
            setShowTenantConfig(false);
            setSelectedTenant(null);
            loadTenants();
          }}
        />
      )}

      {showCreateTenant && (
        <TenantCreateModal
          isOpen={showCreateTenant}
          onClose={() => setShowCreateTenant(false)}
          onSave={() => {
            setShowCreateTenant(false);
            loadTenants();
          }}
        />
      )}
    </div>
  );
};

// Composant de vue d'ensemble
const TenantsOverview: React.FC<{ tenants: Tenant[] }> = ({ tenants }) => {
  const crouTenants = tenants.filter(t => t.type === 'crou');
  const ministereTenant = tenants.find(t => t.type === 'ministere');

  return (
    <div className="space-y-6">
      {/* Ministère */}
      {ministereTenant && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Ministère de l'Enseignement Supérieur
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Utilisateurs
              </div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {ministereTenant.stats.totalUsers}
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                {ministereTenant.stats.activeUsers} actifs
              </div>
            </div>
            
            <div>
              <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Modules Autorisés
              </div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {ministereTenant.config.allowedModules.length}
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                Accès complet
              </div>
            </div>
            
            <div>
              <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Dernière Activité
              </div>
              <div className="text-sm text-gray-900 dark:text-white">
                {ministereTenant.lastActivity.toLocaleString('fr-FR')}
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* CROU */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Centres Régionaux des Œuvres Universitaires (CROU)
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {crouTenants.map((tenant) => (
            <div
              key={tenant.id}
              className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg"
            >
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-medium text-gray-900 dark:text-white">
                  {tenant.name}
                </h4>
                <Badge variant={tenant.isActive ? 'success' : 'destructive'}>
                  {tenant.isActive ? 'Actif' : 'Inactif'}
                </Badge>
              </div>
              
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-gray-500 dark:text-gray-400">Région:</span>
                  <span className="text-gray-900 dark:text-white">{tenant.region}</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-gray-500 dark:text-gray-400">Utilisateurs:</span>
                  <span className="text-gray-900 dark:text-white">
                    {tenant.stats.activeUsers}/{tenant.stats.totalUsers}
                  </span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-gray-500 dark:text-gray-400">Modules:</span>
                  <span className="text-gray-900 dark:text-white">
                    {tenant.config.allowedModules.length}
                  </span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-gray-500 dark:text-gray-400">Connexions:</span>
                  <span className="text-gray-900 dark:text-white">
                    {tenant.stats.totalLogins}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};

// Modale de création d'un tenant
const TenantCreateModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
}> = ({ isOpen, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    name: '',
    type: 'crou' as 'ministere' | 'region' | 'crou',
    code: '',
    region: '',
    parentId: '',
    address: '',
    phone: '',
    email: '',
    allowedModules: ['dashboard'] as string[],
  });
  const [creating, setCreating] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);

    try {
      // Préparer les données pour l'API
      const tenantData = {
        name: formData.name,
        type: formData.type,
        code: formData.code,
        region: formData.region || undefined,
        parentId: formData.parentId || undefined,
        address: formData.address || undefined,
        phone: formData.phone || undefined,
        email: formData.email || undefined,
        isActive: true,
        config: {
          features: formData.allowedModules.reduce((acc, module) => ({
            ...acc,
            [module]: true
          }), {} as Record<string, boolean>),
          settings: {}
        }
      };

      await adminService.createTenant(tenantData);

      Toast.success('Tenant créé avec succès');
      onSave();
    } catch (error: any) {
      Toast.error(error.message || 'Erreur lors de la création du tenant');
    } finally {
      setCreating(false);
    }
  };

  const toggleModule = (moduleKey: string) => {
    setFormData(prev => ({
      ...prev,
      allowedModules: prev.allowedModules.includes(moduleKey)
        ? prev.allowedModules.filter(m => m !== moduleKey)
        : [...prev.allowedModules, moduleKey]
    }));
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg">
      <form onSubmit={handleSubmit} className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
          Créer un nouveau tenant
        </h3>

        <div className="space-y-4">
          {/* Informations de base */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Nom <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                placeholder="CROU Niamey"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Code <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                placeholder="CROU-NIA"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Type <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                required
              >
                <option value="crou">CROU</option>
                <option value="region">Région</option>
                <option value="ministere">Ministère</option>
              </select>
            </div>

            {formData.type === 'crou' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Région
                </label>
                <input
                  type="text"
                  value={formData.region}
                  onChange={(e) => setFormData({ ...formData, region: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  placeholder="Niamey"
                />
              </div>
            )}
          </div>

          {/* Contact */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Email
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                placeholder="contact@crou-niamey.ne"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Téléphone
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                placeholder="+227 XX XX XX XX"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Adresse
            </label>
            <input
              type="text"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              placeholder="Adresse complète"
            />
          </div>

          {/* Modules autorisés */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Modules autorisés
            </label>
            <div className="grid grid-cols-2 gap-2">
              {availableModules.map((module) => (
                <label
                  key={module.key}
                  className={`
                    flex items-center p-3 border rounded-lg cursor-pointer transition-colors
                    ${formData.allowedModules.includes(module.key)
                      ? 'border-primary-500 bg-primary-50'
                      : 'border-gray-300 hover:bg-gray-50'
                    }
                    ${module.required ? 'opacity-50 cursor-not-allowed' : ''}
                  `}
                >
                  <input
                    type="checkbox"
                    checked={formData.allowedModules.includes(module.key)}
                    onChange={() => !module.required && toggleModule(module.key)}
                    disabled={module.required}
                    className="mr-2"
                  />
                  <div className="flex-1">
                    <div className="font-medium text-sm">{module.name}</div>
                    <div className="text-xs text-gray-500">{module.description}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>
        </div>

        <div className="flex justify-end space-x-3 mt-6">
          <Button type="button" variant="outline" onClick={onClose} disabled={creating}>
            Annuler
          </Button>
          <Button type="submit" disabled={creating}>
            {creating ? 'Création en cours...' : 'Créer le tenant'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

// Modale de détails d'un tenant
const TenantDetailsModal: React.FC<{
  isOpen: boolean;
  tenant: Tenant;
  onClose: () => void;
}> = ({ isOpen, tenant, onClose }) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg">
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Détails du Tenant
          </h3>
          <Badge variant={tenant.isActive ? 'success' : 'destructive'}>
            {tenant.isActive ? 'Actif' : 'Inactif'}
          </Badge>
        </div>
        
        <div className="space-y-6">
          {/* Informations générales */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Nom
              </label>
              <p className="text-gray-900 dark:text-white">{tenant.name}</p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Code
              </label>
              <p className="text-gray-900 dark:text-white">{tenant.code}</p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Type
              </label>
              <p className="text-gray-900 dark:text-white">
                {tenant.type === 'ministere' ? 'Ministère' : 'CROU'}
              </p>
            </div>
            
            {tenant.region && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Région
                </label>
                <p className="text-gray-900 dark:text-white">{tenant.region}</p>
              </div>
            )}
          </div>

          {/* Contact */}
          <div className="grid grid-cols-1 gap-4">
            {tenant.address && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Adresse
                </label>
                <p className="text-gray-900 dark:text-white">{tenant.address}</p>
              </div>
            )}
            
            <div className="grid grid-cols-2 gap-4">
              {tenant.phone && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Téléphone
                  </label>
                  <p className="text-gray-900 dark:text-white">{tenant.phone}</p>
                </div>
              )}
              
              {tenant.email && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Email
                  </label>
                  <p className="text-gray-900 dark:text-white">{tenant.email}</p>
                </div>
              )}
            </div>
          </div>

          {/* Statistiques */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Statistiques d'Utilisation
            </label>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  Utilisateurs Totaux
                </div>
                <div className="text-lg font-semibold text-gray-900 dark:text-white">
                  {tenant.stats.totalUsers}
                </div>
              </div>
              
              <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  Utilisateurs Actifs
                </div>
                <div className="text-lg font-semibold text-gray-900 dark:text-white">
                  {tenant.stats.activeUsers}
                </div>
              </div>
              
              <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  Total Connexions
                </div>
                <div className="text-lg font-semibold text-gray-900 dark:text-white">
                  {tenant.stats.totalLogins}
                </div>
              </div>
              
              <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  Dernière Connexion
                </div>
                <div className="text-sm text-gray-900 dark:text-white">
                  {tenant.stats.lastLogin.toLocaleString('fr-FR')}
                </div>
              </div>
            </div>
          </div>

          {/* Modules autorisés */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Modules Autorisés
            </label>
            <div className="flex flex-wrap gap-2">
              {tenant.config.allowedModules.map((moduleKey) => {
                const module = availableModules.find(m => m.key === moduleKey);
                return (
                  <Badge key={moduleKey} variant="secondary">
                    {module?.name || moduleKey}
                  </Badge>
                );
              })}
            </div>
          </div>
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

// Modale de configuration d'un tenant
const TenantConfigModal: React.FC<{
  isOpen: boolean;
  tenant: Tenant;
  onClose: () => void;
  onSave: () => void;
}> = ({ isOpen, tenant, onClose, onSave }) => {
  const [config, setConfig] = useState({
    allowedModules: tenant.config.allowedModules,
    dataRetentionDays: tenant.config.dataRetentionDays,
    customSettings: tenant.config.customSettings
  });
  const [saving, setSaving] = useState(false);

  const toggleModule = (moduleKey: string) => {
    // Dashboard est toujours requis
    const module = availableModules.find(m => m.key === moduleKey);
    if (module?.required) return;

    setConfig(prev => ({
      ...prev,
      allowedModules: prev.allowedModules.includes(moduleKey)
        ? prev.allowedModules.filter(m => m !== moduleKey)
        : [...prev.allowedModules, moduleKey]
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Préparer les données de configuration
      const updateData = {
        config: {
          features: config.allowedModules.reduce((acc, module) => ({
            ...acc,
            [module]: true
          }), {} as Record<string, boolean>),
          settings: {
            ...config.customSettings,
            dataRetentionDays: config.dataRetentionDays
          }
        }
      };

      await adminService.updateTenant(tenant.id, updateData);

      Toast.success('Configuration mise à jour avec succès');
      onSave();
    } catch (error: any) {
      Toast.error(error.message || 'Erreur lors de la sauvegarde');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg">
      <div className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
          Configuration : {tenant.name}
        </h3>

        <div className="space-y-6">
          {/* Modules autorisés */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Modules Autorisés
            </label>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
              Sélectionnez les modules accessibles pour ce tenant
            </p>
            <div className="grid grid-cols-2 gap-3">
              {availableModules.map((module) => (
                <label
                  key={module.key}
                  className={`
                    flex items-start p-3 border rounded-lg cursor-pointer transition-colors
                    ${config.allowedModules.includes(module.key)
                      ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                      : 'border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                    }
                    ${module.required ? 'opacity-50 cursor-not-allowed' : ''}
                  `}
                >
                  <input
                    type="checkbox"
                    checked={config.allowedModules.includes(module.key)}
                    onChange={() => toggleModule(module.key)}
                    disabled={module.required}
                    className="mt-0.5 mr-3"
                  />
                  <div className="flex-1">
                    <div className="flex items-center">
                      <module.icon className="h-4 w-4 mr-2" />
                      <span className="font-medium text-sm text-gray-900 dark:text-white">
                        {module.name}
                      </span>
                      {module.required && (
                        <Badge variant="primary" className="ml-2 text-xs">Requis</Badge>
                      )}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {module.description}
                    </div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Rétention des données */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Rétention des données (jours)
            </label>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
              Durée de conservation des données avant archivage automatique
            </p>
            <select
              value={config.dataRetentionDays}
              onChange={(e) => setConfig({ ...config, dataRetentionDays: parseInt(e.target.value) })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            >
              <option value={365}>1 an (365 jours)</option>
              <option value={730}>2 ans (730 jours)</option>
              <option value={1095}>3 ans (1095 jours) - Recommandé</option>
              <option value={1825}>5 ans (1825 jours)</option>
              <option value={2555}>7 ans (2555 jours) - Légal</option>
            </select>
          </div>

          {/* Paramètres spécifiques CROU */}
          {tenant.type === 'crou' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Paramètres spécifiques CROU
              </label>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
                    Capacité d'accueil étudiants
                  </label>
                  <input
                    type="number"
                    value={config.customSettings.studentCapacity || 0}
                    onChange={(e) => setConfig({
                      ...config,
                      customSettings: {
                        ...config.customSettings,
                        studentCapacity: parseInt(e.target.value) || 0
                      }
                    })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    placeholder="Ex: 15000"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
                    Capacité logement
                  </label>
                  <input
                    type="number"
                    value={config.customSettings.housingCapacity || 0}
                    onChange={(e) => setConfig({
                      ...config,
                      customSettings: {
                        ...config.customSettings,
                        housingCapacity: parseInt(e.target.value) || 0
                      }
                    })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    placeholder="Ex: 3000"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Paramètres spécifiques Ministère */}
          {tenant.type === 'ministere' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Paramètres niveau Ministère
              </label>
              <div className="space-y-3">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={config.customSettings.canAccessAllTenants || false}
                    onChange={(e) => setConfig({
                      ...config,
                      customSettings: {
                        ...config.customSettings,
                        canAccessAllTenants: e.target.checked
                      }
                    })}
                    className="mr-2"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    Accès en lecture à tous les CROUs
                  </span>
                </label>
                <div>
                  <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
                    Niveau de reporting
                  </label>
                  <select
                    value={config.customSettings.reportingLevel || 'national'}
                    onChange={(e) => setConfig({
                      ...config,
                      customSettings: {
                        ...config.customSettings,
                        reportingLevel: e.target.value
                      }
                    })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  >
                    <option value="national">National (tous CROUs)</option>
                    <option value="regional">Régional (par région)</option>
                    <option value="individual">Individuel (par CROU)</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Résumé */}
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <div className="flex items-start">
              <Activity className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 mr-2" />
              <div className="flex-1">
                <h4 className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-1">
                  Résumé de la configuration
                </h4>
                <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
                  <li>• {config.allowedModules.length} modules activés</li>
                  <li>• Rétention: {Math.floor(config.dataRetentionDays / 365)} an(s)</li>
                  {tenant.type === 'crou' && config.customSettings.studentCapacity && (
                    <li>• Capacité: {config.customSettings.studentCapacity.toLocaleString()} étudiants</li>
                  )}
                </ul>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end space-x-3 mt-6">
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Annuler
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? 'Sauvegarde en cours...' : 'Sauvegarder'}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default TenantsPage;
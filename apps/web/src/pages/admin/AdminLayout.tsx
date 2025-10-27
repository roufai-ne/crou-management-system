/**
 * FICHIER: apps/web/src/pages/admin/AdminLayout.tsx
 * COMPOSANT: AdminLayout - Layout pour l'interface d'administration
 * 
 * DESCRIPTION:
 * Layout spécialisé pour les pages d'administration avec navigation
 * et contrôles d'accès intégrés
 * 
 * FONCTIONNALITÉS:
 * - Navigation latérale pour l'administration
 * - Contrôle d'accès par permissions
 * - Breadcrumb et titre de page
 * - Responsive design
 * - Indicateurs de statut système
 * 
 * AUTEUR: Équipe CROU
 * DATE: Décembre 2024
 */

import React from 'react';
import { Outlet, NavLink, useLocation } from 'react-router-dom';
import { 
  Users, 
  Shield, 
  Building, 
  BarChart3, 
  FileText, 
  Settings,
  AlertTriangle,
  Activity
} from 'lucide-react';
import { cn } from '@/utils/cn';

interface AdminLayoutProps {
  children?: React.ReactNode;
}

const adminNavItems = [
  {
    path: '/admin/users',
    label: 'Utilisateurs',
    icon: Users,
    permission: 'users.read'
  },
  {
    path: '/admin/roles',
    label: 'Rôles & Permissions',
    icon: Shield,
    permission: 'roles.read'
  },
  {
    path: '/admin/tenants',
    label: 'Tenants (CROU)',
    icon: Building,
    permission: 'tenants.read'
  },
  {
    path: '/admin/audit',
    label: 'Logs d\'Audit',
    icon: FileText,
    permission: 'audit.read'
  },
  {
    path: '/admin/security',
    label: 'Sécurité',
    icon: AlertTriangle,
    permission: 'security.read'
  },
  {
    path: '/admin/stats',
    label: 'Statistiques',
    icon: BarChart3,
    permission: 'stats.read'
  },
  {
    path: '/admin/settings',
    label: 'Paramètres',
    icon: Settings,
    permission: 'admin.write'
  }
];

export const AdminLayout: React.FC<AdminLayoutProps> = ({ children }) => {
  const location = useLocation();

  // TODO: Récupérer les permissions de l'utilisateur depuis le store d'auth
  const userPermissions = ['users.read', 'users.write', 'roles.read', 'tenants.read', 'audit.read', 'security.read', 'stats.read', 'admin.write'];

  const hasPermission = (permission: string) => {
    return userPermissions.includes(permission) || userPermissions.includes('admin.write');
  };

  const filteredNavItems = adminNavItems.filter(item => hasPermission(item.permission));

  const currentPageTitle = adminNavItems.find(item => 
    location.pathname.startsWith(item.path)
  )?.label || 'Administration';

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Administration CROU
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                {currentPageTitle}
              </p>
            </div>
            
            {/* Indicateurs de statut */}
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 text-sm">
                <Activity className="h-4 w-4 text-green-500" />
                <span className="text-gray-600 dark:text-gray-400">Système opérationnel</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Navigation latérale */}
        <nav className="w-64 bg-white dark:bg-gray-800 shadow-sm border-r border-gray-200 dark:border-gray-700 min-h-screen">
          <div className="p-4">
            <div className="space-y-2">
              {filteredNavItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname.startsWith(item.path);
                
                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    className={cn(
                      'flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                      isActive
                        ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                    )}
                  >
                    <Icon className="h-5 w-5" />
                    <span>{item.label}</span>
                  </NavLink>
                );
              })}
            </div>
          </div>
        </nav>

        {/* Contenu principal */}
        <main className="flex-1 p-6">
          {children || <Outlet />}
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
/**
 * FICHIER: apps\web\src\components\layout\MainLayout.tsx
 * COMPOSANT: MainLayout - Layout principal de l'application CROU
 *
 * DESCRIPTION:
 * Layout principal avec sidebar navigation et header
 * Responsive avec menu mobile
 * Gestion des permissions d'accès par module
 * Sélecteur vue Ministère/CROU selon profil utilisateur
 *
 * STRUCTURE:
 * - Header fixe avec logo et actions utilisateur
 * - Sidebar fixe avec navigation modules
 * - Zone de contenu principale responsive
 * - Menu mobile avec overlay
 *
 * PROPS:
 * - children: ReactNode - Contenu des pages
 *
 * USAGE:
 * <MainLayout>
 *   <DashboardPage />
 * </MainLayout>
 *
 * AUTEUR: Équipe CROU
 * DATE: Décembre 2024
 */

import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  BarChart3,
  Banknote,
  Package,
  Home,
  Truck,
  UtensilsCrossed,
  FileText,
  Settings,
  Menu,
  X,
  Bell,
  User,
  LogOut,
  ChevronDown,
  ShoppingCart,
  HelpCircle
} from 'lucide-react';
import { IconWrapper } from '@/components/ui/IconWrapper';

import { useAuth } from '@/stores/auth';
import { cn } from '@/utils/cn';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { Header } from './Header';

// Types
interface NavigationItem {
  name: string;
  href: string;
  icon: any; // LucideIcon type
  permission?: string;
  roles?: string[];
  badge?: number;
}

// Configuration navigation selon modules PRD avec Lucide icons
const navigation: NavigationItem[] = [
  {
    name: 'Tableau de Bord',
    href: '/dashboard',
    icon: BarChart3,
    permission: 'dashboard:read'
  },
  {
    name: 'Demande Logement',
    href: '/housing/apply',
    icon: Home,
    roles: ['Etudiant']
  },
  {
    name: 'Gestion Financière',
    href: '/financial',
    icon: Banknote,
    permission: 'financial:read'
  },
  {
    name: 'Stocks & Approvisionnement',
    href: '/stocks',
    icon: Package,
    permission: 'stocks:read'
  },
  {
    name: 'Achats',
    href: '/procurement',
    icon: ShoppingCart,
    permission: 'procurement:read'
  },
  {
    name: 'Logement Universitaire',
    href: '/housing',
    icon: Home,
    permission: 'housing:read'
  },
  {
    name: 'Transport',
    href: '/transport',
    icon: Truck,
    permission: 'transport:read'
  },
  {
    name: 'Restauration',
    href: '/restauration',
    icon: UtensilsCrossed,
    permission: 'restauration:read'
  },
  {
    name: 'Aide',
    href: '/faq',
    icon: HelpCircle,
    permission: 'dashboard:read'
  },
  {
    name: 'Rapports',
    href: '/reports',
    icon: FileText,
    permission: 'reports:read'
  },
  {
    name: 'Administration',
    href: '/admin',
    icon: Settings,
    permission: 'admin:read'
  }
];

// Props interface
interface MainLayoutProps {
  children: React.ReactNode;
}

// Composant principal MainLayout
export const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const auth = useAuth();
  const { user, hasPermission } = auth || {};
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Vérification de sécurité
  if (!auth) {
    return <div>Chargement du layout...</div>;
  }

  // Filtrer la navigation selon les permissions et rôles
  const allowedNavigation = navigation.filter(item => {
    // Si des rôles sont spécifiés, l'utilisateur doit avoir l'un d'eux
    if (item.roles && item.roles.length > 0) {
      return user?.role && item.roles.includes(user.role);
    }

    // Sinon, vérification standard des permissions
    if (item.permission && hasPermission) {
      return hasPermission(item.permission) || hasPermission('all');
    }

    return true;
  });

  // Vérifier si une route est active
  const isActiveRoute = (href: string) => {
    return location.pathname.startsWith(href);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 font-sans text-gray-900 dark:text-gray-100">
      {/* Header - Composant séparé */}
      <Header onMenuClick={() => setSidebarOpen(true)} />

      {/* Sidebar Desktop - GAUCHE de l'écran - commence sous le header */}
      <div className="hidden lg:flex w-64 flex-col fixed top-16 bottom-0 left-0 z-40 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-r border-gray-200 dark:border-gray-700 shadow-sm transition-all duration-300">
        <div className="flex flex-col flex-grow overflow-y-auto">
          {/* Navigation */}
          <nav className="flex-1 px-3 py-4 space-y-1">
            {allowedNavigation.map((item) => {
              const isActive = isActiveRoute(item.href);

              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={cn(
                    'group relative flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-xl transition-all duration-200',
                    isActive
                      ? 'bg-gradient-to-r from-emerald-600 to-emerald-500 text-white shadow-lg shadow-emerald-500/20'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-emerald-600 dark:hover:text-emerald-400'
                  )}
                  onClick={() => setSidebarOpen(false)}
                >
                  <IconWrapper
                    icon={item.icon}
                    size="md"
                    strokeWidth={isActive ? 2.5 : 2}
                    className={isActive ? 'text-white' : 'group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors'}
                  />
                  <span className="flex-1">{item.name}</span>
                  {item.badge && (
                    <span className={cn(
                      'px-2 py-0.5 text-xs font-medium rounded-full transition-all',
                      isActive
                        ? 'bg-white/20 backdrop-blur-sm text-white'
                        : 'bg-red-100 text-red-600 dark:bg-red-900/20 dark:text-red-400'
                    )}>
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Sidebar Mobile - Overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 flex z-50 lg:hidden">
          <div className="fixed inset-0 backdrop-blur-sm bg-black/20 dark:bg-black/40 transition-opacity" onClick={() => setSidebarOpen(false)} />

          <div className="relative flex-1 flex flex-col max-w-xs w-full bg-white dark:bg-gray-900 shadow-2xl animate-in slide-in-from-left duration-300">
            {/* Bouton fermeture */}
            <div className="absolute top-0 right-0 -mr-12 pt-4">
              <button
                type="button"
                className="ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white bg-black/20 backdrop-blur-sm"
                onClick={() => setSidebarOpen(false)}
              >
                <X className="h-6 w-6 text-white" strokeWidth={2.5} />
              </button>
            </div>

            {/* Contenu mobile */}
            <div className="flex-1 h-0 pt-5 pb-4 overflow-y-auto">
              <nav className="px-4 space-y-2">
                {allowedNavigation.map((item) => {
                  const isActive = isActiveRoute(item.href);

                  return (
                    <Link
                      key={item.name}
                      to={item.href}
                      className={cn(
                        'group relative flex items-center gap-3 px-3 py-3 text-base font-medium rounded-xl transition-all duration-200',
                        isActive
                          ? 'bg-gradient-to-r from-emerald-600 to-emerald-500 text-white shadow-lg shadow-emerald-500/20'
                          : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'
                      )}
                      onClick={() => setSidebarOpen(false)}
                    >
                      <IconWrapper
                        icon={item.icon}
                        size="md"
                        strokeWidth={isActive ? 2.5 : 2}
                        className={isActive ? 'text-white' : 'group-hover:text-emerald-600 dark:group-hover:text-emerald-400'}
                      />
                      <span className="flex-1">{item.name}</span>
                      {item.badge && (
                        <span className={cn(
                          'px-2 py-0.5 text-xs font-medium rounded-full',
                          isActive
                            ? 'bg-white/20 backdrop-blur-sm text-white'
                            : 'bg-red-100 text-red-600 dark:bg-red-900/20 dark:text-red-400'
                        )}>
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </nav>
            </div>
          </div>
        </div>
      )}

      {/* Zone de contenu - Commence sous le header avec padding pour la sidebar */}
      <main className="pt-16 lg:pl-64 min-h-screen transition-all duration-300">
        <div className="p-4 sm:p-6 lg:p-8 animate-in fade-in duration-500">
          {children}
        </div>
      </main>
    </div>
  );
};

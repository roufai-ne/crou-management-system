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
 * - Sidebar fixe avec navigation modules
 * - Header avec profil utilisateur et notifications
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
// Utilisation des icônes de secours si Heroicons ne fonctionne pas
import {
  ChartBarIcon,
  BanknotesIcon,
  CubeIcon,
  HomeModernIcon,
  TruckIcon,
  DocumentTextIcon,
  CogIcon,
  Bars3Icon,
  XMarkIcon,
  BellIcon,
  UserCircleIcon,
  ArrowRightOnRectangleIcon,
  ChevronDownIcon
} from '@/components/ui/IconFallback';

// Icônes solides (même fallback pour l'instant)
const ChartBarSolid = ChartBarIcon;
const BanknotesSolid = BanknotesIcon;
const CubeSolid = CubeIcon;
const HomeModernSolid = HomeModernIcon;
const TruckSolid = TruckIcon;
const DocumentTextSolid = DocumentTextIcon;
const CogSolid = CogIcon;

import { useAuth } from '@/stores/auth';
import { cn } from '@/utils/cn';
import { ThemeToggle } from '@/components/ui/ThemeToggle';

// Types
interface NavigationItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  iconSolid: React.ComponentType<{ className?: string }>;
  permission: string;
  badge?: number;
}

// Configuration navigation selon modules PRD
const navigation: NavigationItem[] = [
  {
    name: 'Tableau de Bord',
    href: '/dashboard',
    icon: ChartBarIcon,
    iconSolid: ChartBarSolid,
    permission: 'dashboard:read'
  },
  {
    name: 'Gestion Financière',
    href: '/financial',
    icon: BanknotesIcon,
    iconSolid: BanknotesSolid,
    permission: 'financial:read'
  },
  {
    name: 'Stocks & Approvisionnement',
    href: '/stocks',
    icon: CubeIcon,
    iconSolid: CubeSolid,
    permission: 'stocks:read'
  },
  {
    name: 'Logement Universitaire',
    href: '/housing',
    icon: HomeModernIcon,
    iconSolid: HomeModernSolid,
    permission: 'housing:read'
  },
  {
    name: 'Transport',
    href: '/transport',
    icon: TruckIcon,
    iconSolid: TruckSolid,
    permission: 'transport:read'
  },
  {
    name: 'Rapports',
    href: '/reports',
    icon: DocumentTextIcon,
    iconSolid: DocumentTextSolid,
    permission: 'reports:read'
  },
  {
    name: 'Administration',
    href: '/admin',
    icon: CogIcon,
    iconSolid: CogSolid,
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
  const { user, logout, hasPermission } = auth || {};
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);

  // Vérification de sécurité
  if (!auth) {
    return <div>Chargement du layout...</div>;
  }

  // Filtrer la navigation selon les permissions
  const allowedNavigation = navigation.filter(item =>
    hasPermission(item.permission as any) || hasPermission('all')
  );

  // Vérifier si une route est active
  const isActiveRoute = (href: string) => {
    return location.pathname.startsWith(href);
  };

  return (
    <div className="min-h-screen bg-gradient-soft dark:bg-gradient-soft-dark">
      {/* Sidebar Desktop */}
      <div className="flex w-64 flex-col fixed inset-y-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-lg border-r border-gray-200/50 dark:border-gray-700/50">
        <div className="flex flex-col flex-grow pt-5 pb-4 overflow-y-auto">
          {/* Logo CROU */}
          <div className="flex items-center flex-shrink-0 px-4">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">C</span>
              </div>
              <div className="ml-3">
                <h1 className="text-lg font-semibold text-gray-900">CROU</h1>
                <p className="text-xs text-gray-500">
                  {user?.level === 'ministere' ? 'Ministère' : user?.crouId || 'Local'}
                </p>
              </div>
            </div>
          </div>

          {/* Sélecteur de vue (si autorisé) */}
          {(user?.level === 'ministere' || hasPermission('all')) && (
            <div className="mt-6 px-4">
              <select className="w-full form-input text-sm">
                <option value="ministere">Vue Ministère</option>
                <option value="crou">Vue CROU Locale</option>
              </select>
            </div>
          )}

          {/* Navigation */}
          <nav className="mt-8 flex-1 px-2 space-y-1">
            {allowedNavigation.map((item) => {
              const isActive = isActiveRoute(item.href);
              const Icon = isActive ? item.iconSolid : item.icon;
              
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={cn(
                    'group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors duration-200',
                    isActive 
                      ? 'bg-primary-100 text-primary-900' 
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  )}
                  onClick={() => setSidebarOpen(false)}
                >
                  <Icon 
                    className={cn(
                      'mr-3 flex-shrink-0 h-5 w-5',
                      isActive ? 'text-primary-600' : 'text-gray-400 group-hover:text-gray-500'
                    )} 
                  />
                  {item.name}
                  {item.badge && (
                    <span className="ml-auto bg-red-100 text-red-800 text-xs font-medium px-2 py-0.5 rounded-full">
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Informations utilisateur */}
          <div className="flex-shrink-0 px-4 py-3 border-t border-gray-200">
            <div className="flex items-center text-sm">
              <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                <UserCircleIcon className="w-5 h-5 text-gray-600" />
              </div>
              <div className="ml-3 flex-1 min-w-0">
                <p className="font-medium text-gray-900 truncate">{user ? `${user.firstName} ${user.lastName}` : 'Invité'}</p>
                <p className="text-gray-500 truncate capitalize">{user?.role?.replace('_', ' ') || 'guest'}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Sidebar Mobile - Overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 flex z-40 lg:hidden">
          <div className="fixed inset-0 backdrop-blur-md bg-black/20 dark:bg-black/40" onClick={() => setSidebarOpen(false)} />

          <div className="relative flex-1 flex flex-col max-w-xs w-full bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl">
            {/* Bouton fermeture */}
            <div className="absolute top-0 right-0 -mr-12 pt-2">
              <button
                type="button"
                className="ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
                onClick={() => setSidebarOpen(false)}
              >
                <XMarkIcon className="h-6 w-6 text-white" />
              </button>
            </div>

            {/* Contenu identique au desktop */}
            <div className="flex-1 h-0 pt-5 pb-4 overflow-y-auto">
              <div className="flex-shrink-0 flex items-center px-4">
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
                    <span className="text-white font-bold text-sm">C</span>
                  </div>
                  <div className="ml-3">
                    <h1 className="text-lg font-semibold text-gray-900">CROU</h1>
                    <p className="text-xs text-gray-500">
                      {user?.level === 'ministere' ? 'Ministère' : user?.crouId || 'Local'}
                    </p>
                  </div>
                </div>
              </div>
              
              <nav className="mt-8 px-2 space-y-1">
                {allowedNavigation.map((item) => {
                  const isActive = isActiveRoute(item.href);
                  const Icon = isActive ? item.iconSolid : item.icon;
                  
                  return (
                    <Link
                      key={item.name}
                      to={item.href}
                      className={cn(
                        'group flex items-center px-2 py-2 text-base font-medium rounded-md',
                        isActive 
                          ? 'bg-primary-100 text-primary-900' 
                          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                      )}
                      onClick={() => setSidebarOpen(false)}
                    >
                      <Icon 
                        className={cn(
                          'mr-4 flex-shrink-0 h-5 w-5',
                          isActive ? 'text-primary-600' : 'text-gray-400 group-hover:text-gray-500'
                        )} 
                      />
                      {item.name}
                      {item.badge && (
                        <span className="ml-auto bg-red-100 text-red-800 text-xs font-medium px-2 py-0.5 rounded-full">
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </nav>
            </div>
            
            <div className="flex-shrink-0 px-4 py-3 border-t border-gray-200">
              <div className="flex items-center text-sm">
                <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                  <UserCircleIcon className="w-5 h-5 text-gray-600" />
                </div>
                <div className="ml-3">
                    <p className="font-medium text-gray-900">{user ? `${user.firstName} ${user.lastName}` : 'Invité'}</p>
                    <p className="text-gray-500 capitalize">{user?.role?.replace('_', ' ') || 'guest'}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Contenu principal */}
      <div className="lg:pl-64 flex flex-col flex-1">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-white/80 dark:bg-gray-900/80 backdrop-blur-lg border-b border-gray-200/50 dark:border-gray-700/50 px-4 py-3">
          <div className="flex justify-between items-center">
            {/* Menu mobile */}
            <button
              type="button"
              className="lg:hidden p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-500"
              onClick={() => setSidebarOpen(true)}
            >
              <Bars3Icon className="h-5 w-5" />
            </button>

            {/* Actions header */}
            <div className="flex items-center space-x-4">
              {/* Theme toggle */}
              <ThemeToggle variant="icon" size="sm" />
              
              {/* Notifications */}
              <button className="p-2 text-gray-400 hover:text-gray-500">
                <BellIcon className="h-5 w-5" />
              </button>

              {/* Profil dropdown */}
              <div className="relative">
                <button
                  className="flex items-center space-x-2 text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                  onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                >
                  <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                    <UserCircleIcon className="w-5 h-5 text-gray-600" />
                  </div>
                  <span className="hidden sm:block font-medium text-gray-700">{user?.name}</span>
                  <ChevronDownIcon className="w-4 h-4 text-gray-400" />
                </button>

                {profileDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 ring-1 ring-black ring-opacity-5">
                    <button
                      onClick={async () => {
                        await logout();
                        setProfileDropdownOpen(false);
                        navigate('/auth/login');
                      }}
                      className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                    >
                      <ArrowRightOnRectangleIcon className="w-4 h-4 mr-3" />
                      Se déconnecter
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Zone de contenu */}
      <main className="ml-64 p-6">
        {children}
      </main>
    </div>
  );
};

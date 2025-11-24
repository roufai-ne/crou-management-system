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
  ShoppingCart
} from 'lucide-react';
import { IconWrapper } from '@/components/ui/IconWrapper';

import { useAuth } from '@/stores/auth';
import { cn } from '@/utils/cn';
import { ThemeToggle } from '@/components/ui/ThemeToggle';

// Types
interface NavigationItem {
  name: string;
  href: string;
  icon: any; // LucideIcon type
  permission: string;
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
    <div className="min-h-screen w-screen overflow-x-hidden bg-gradient-soft dark:bg-gradient-soft-dark">
      {/* Header fixe en haut - toute la largeur */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 shadow-sm">
        <div className="h-16 px-4 lg:px-6 flex items-center justify-between w-full">
          {/* Partie GAUCHE - Logo + Menu + Sélecteur */}
          <div className="flex items-center gap-4">
            {/* Menu mobile button */}
            <button
              type="button"
              className="lg:hidden p-2 -ml-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"
              onClick={() => setSidebarOpen(true)}
              aria-label="Ouvrir le menu"
            >
              <Menu className="h-6 w-6" />
            </button>

            {/* Logo CROU */}
            <Link to="/dashboard" className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-emerald-600 to-orange-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">C</span>
              </div>
              <div>
                <h1 className="text-lg font-bold text-gray-900 dark:text-white whitespace-nowrap">CROU Niger</h1>
                <p className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
                  {user?.level === 'ministere' ? 'Vue Ministère' : `CROU ${user?.crouId || 'Local'}`}
                </p>
              </div>
            </Link>

            {/* Sélecteur de vue (si autorisé) */}
            {(user?.level === 'ministere' || hasPermission('all')) && (
              <select 
                className="ml-2 form-select text-sm py-2 px-3 border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 rounded-lg focus:border-emerald-500 focus:ring-emerald-500"
                defaultValue="ministere"
              >
                <option value="ministere">Vue Ministère</option>
                <option value="crou">Vue CROU Locale</option>
              </select>
            )}
          </div>

          {/* SPACER - pousse à droite */}
          <div className="flex-1"></div>

          {/* Partie DROITE - Actions */}
          <div className="flex items-center gap-3">
            {/* Theme toggle */}
            <ThemeToggle variant="icon" size="sm" />

            {/* Notifications */}
            <button 
              className="p-2 rounded-md text-gray-400 hover:text-gray-500 dark:text-gray-400 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
              aria-label="Notifications"
            >
              <Bell className="h-5 w-5" />
            </button>

            {/* Profil dropdown */}
            <div className="relative">
              <button
                className="flex items-center gap-2 p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
                onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                aria-label="Menu profil"
              >
                <div className="w-9 h-9 bg-gradient-to-br from-emerald-600 to-orange-600 rounded-full flex items-center justify-center">
                  <User className="w-5 h-5 text-white" />
                </div>
                <span className="hidden md:block font-medium text-gray-700 dark:text-gray-300 pr-2">
                  {user?.firstName}
                </span>
                <ChevronDown className="hidden md:block w-4 h-4 text-gray-400" />
              </button>

              {/* Dropdown menu */}
              {profileDropdownOpen && (
                <>
                  {/* Overlay pour fermer le dropdown */}
                  <div 
                    className="fixed inset-0 z-10" 
                    onClick={() => setProfileDropdownOpen(false)}
                  />
                  
                  <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-800 rounded-lg shadow-xl py-1 ring-1 ring-black/5 dark:ring-white/10 z-20">
                    <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {user?.firstName} {user?.lastName}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {user?.email}
                      </p>
                    </div>
                    
                    <Link
                      to="/profile"
                      onClick={() => setProfileDropdownOpen(false)}
                      className="flex items-center px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-emerald-50 dark:hover:bg-emerald-900/20"
                    >
                      <User className="w-4 h-4 mr-3" />
                      Mon profil
                    </Link>
                    
                    <div className="border-t border-gray-100 dark:border-gray-700 my-1" />
                    
                    <button
                      onClick={async () => {
                        await logout();
                        setProfileDropdownOpen(false);
                        navigate('/auth/login');
                      }}
                      className="flex items-center px-4 py-2.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 w-full text-left"
                    >
                      <LogOut className="w-4 h-4 mr-3" />
                      Se déconnecter
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Sidebar Desktop - GAUCHE de l'écran - commence sous le header */}
      <div className="hidden lg:flex w-64 flex-col fixed top-16 bottom-0 left-0 z-40 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 shadow-sm">
        <div className="flex flex-col flex-grow overflow-y-auto">
          {/* Navigation */}
          <nav className="flex-1 px-2 py-4 space-y-1">
            {allowedNavigation.map((item) => {
              const isActive = isActiveRoute(item.href);

              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={cn(
                    'group relative flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200',
                    isActive
                      ? 'bg-gradient-crou text-white shadow-button-primary'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 hover:scale-[1.02]'
                  )}
                  onClick={() => setSidebarOpen(false)}
                >
                  <IconWrapper
                    icon={item.icon}
                    size="md"
                    strokeWidth={isActive ? 2.5 : 2}
                    className={isActive ? 'text-white' : ''}
                  />
                  <span className="flex-1">{item.name}</span>
                  {item.badge && (
                    <span className={cn(
                      'px-2 py-0.5 text-xs font-medium rounded-full transition-all',
                      isActive
                        ? 'bg-white/20 backdrop-blur-sm text-white animate-pulse'
                        : 'bg-danger-100 text-danger-800 dark:bg-danger-900/20 dark:text-danger-400'
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
          <div className="fixed inset-0 backdrop-blur-md bg-black/20 dark:bg-black/40" onClick={() => setSidebarOpen(false)} />

          <div className="relative flex-1 flex flex-col max-w-xs w-full bg-white dark:bg-gray-900">
            {/* Bouton fermeture */}
            <div className="absolute top-0 right-0 -mr-12 pt-2">
              <button
                type="button"
                className="ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
                onClick={() => setSidebarOpen(false)}
              >
                <X className="h-6 w-6 text-white" strokeWidth={2.5} />
              </button>
            </div>

            {/* Contenu mobile */}
            <div className="flex-1 h-0 pt-5 pb-4 overflow-y-auto">
              <nav className="px-2 space-y-1">
                {allowedNavigation.map((item) => {
                  const isActive = isActiveRoute(item.href);

                  return (
                    <Link
                      key={item.name}
                      to={item.href}
                      className={cn(
                        'group relative flex items-center gap-3 px-3 py-2.5 text-base font-medium rounded-lg transition-all duration-200',
                        isActive
                          ? 'bg-gradient-crou text-white shadow-button-primary'
                          : 'text-gray-700 hover:bg-gray-100 hover:scale-[1.02]'
                      )}
                      onClick={() => setSidebarOpen(false)}
                    >
                      <IconWrapper
                        icon={item.icon}
                        size="md"
                        strokeWidth={isActive ? 2.5 : 2}
                        className={isActive ? 'text-white' : ''}
                      />
                      <span className="flex-1">{item.name}</span>
                      {item.badge && (
                        <span className={cn(
                          'px-2 py-0.5 text-xs font-medium rounded-full',
                          isActive
                            ? 'bg-white/20 backdrop-blur-sm text-white animate-pulse'
                            : 'bg-danger-100 text-danger-800'
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
      <main className="pt-16 lg:pl-64 min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="p-4 sm:p-6 lg:p-8">
          {children}
        </div>
      </main>
    </div>
  );
};

/**
 * FICHIER: apps\web\src\components\layout\Header.tsx
 * COMPOSANT: Header - Header principal de l'application
 *
 * DESCRIPTION:
 * Header fixe avec logo, sélecteur de vue, notifications et profil utilisateur
 * Design moderne avec glassmorphism et backdrop blur
 *
 * AUTEUR: Équipe CROU
 * DATE: Décembre 2024
 */

import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Menu, Bell, User, LogOut, ChevronDown } from 'lucide-react';
import { useAuth } from '@/stores/auth';
import { ThemeToggle } from '@/components/ui/ThemeToggle';

interface HeaderProps {
  onMenuClick: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onMenuClick }) => {
  const { user, logout, hasPermission } = useAuth();
  const navigate = useNavigate();
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-white via-indigo-50/30 to-white dark:from-gray-900 dark:via-indigo-900/10 dark:to-gray-900 border-b border-indigo-100 dark:border-indigo-900/20 transition-all duration-300 backdrop-blur-xl">
      <div className="w-full px-4 lg:px-6">
        <div className="h-16 flex items-center justify-between gap-4 w-full">

          {/* Section GAUCHE - Logo & Navigation Mobile */}
          <div className="flex items-center gap-4 lg:gap-6 flex-shrink-0">
            {/* Bouton Menu Mobile */}
            <button
              type="button"
              className="lg:hidden -ml-2 p-2 rounded-lg bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 transition-colors shadow-sm"
              onClick={onMenuClick}
              aria-label="Ouvrir le menu"
            >
              <Menu className="h-5 w-5" strokeWidth={2} />
            </button>

            {/* Logo CROU - Compact et moderne */}
            <Link
              to="/dashboard"
              className="flex items-center gap-3 group flex-shrink-0"
            >
              <div className="relative">
                <div className="w-9 h-9 bg-gradient-to-br from-indigo-600 to-indigo-500 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20 group-hover:shadow-indigo-500/30 transition-all duration-300 group-hover:scale-105">
                  <span className="text-white font-bold text-base">C</span>
                </div>
              </div>
              <div className="hidden sm:block">
                <h1 className="text-base font-bold text-gray-900 dark:text-white tracking-tight group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                  CROU Niger
                </h1>
                <p className="text-[10px] text-gray-500 dark:text-gray-400 font-medium -mt-0.5">
                  {user?.level === 'ministere' ? 'Vue Ministère' : `CROU ${user?.crouId || 'Local'}`}
                </p>
              </div>
            </Link>

            {/* Sélecteur de vue - Style Breadcrumb Premium */}
            {(user?.level === 'ministere' || hasPermission('all')) && (
              <div className="hidden md:block ml-2 border-l border-indigo-100 dark:border-indigo-800/50 pl-6">
                <div className="relative group">
                  <select
                    className="appearance-none pl-9 pr-8 py-1.5 text-xs font-semibold bg-indigo-50 dark:bg-indigo-900/30 border border-indigo-200 dark:border-indigo-800 rounded-xl text-indigo-700 dark:text-indigo-300 hover:border-indigo-400 dark:hover:border-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all cursor-pointer shadow-sm hover:shadow-md"
                    defaultValue="ministere"
                  >
                    <option value="ministere">Vue Ministère</option>
                    <option value="crou">Vue CROU Locale</option>
                  </select>
                  <div className="absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-indigo-500 dark:text-indigo-400">
                    <span className="text-xs">🏛️</span>
                  </div>
                  <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-indigo-400 group-hover:text-indigo-600 transition-colors pointer-events-none" />
                </div>
              </div>
            )}
          </div>

          {/* Spacer pour forcer l'alignement à droite */}
          <div className="flex-1"></div>

          {/* Section DROITE - Actions utilisateur */}
          <div className="flex items-center gap-3 lg:gap-4">
            {/* Search Bar (Desktop) - Style Premium */}
            <div className="hidden lg:flex items-center relative">
              <div className="relative group">
                <input
                  type="text"
                  placeholder="Rechercher..."
                  className="w-48 pl-9 pr-10 py-1.5 text-sm bg-indigo-50/50 dark:bg-gray-800 border border-indigo-100 dark:border-gray-700 rounded-xl text-gray-700 dark:text-gray-300 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:w-64 transition-all duration-300"
                />
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-indigo-400 group-hover:text-indigo-600 transition-colors pointer-events-none">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                  <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-bold text-indigo-400 bg-white dark:bg-gray-700 border border-indigo-100 dark:border-gray-600 rounded shadow-sm">⌘K</kbd>
                </div>
              </div>
            </div>

            {/* Theme Toggle - Style Amber */}
            <div className="hidden sm:block">
              <div className="bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800 shadow-sm hover:shadow-md transition-all duration-200">
                <ThemeToggle variant="icon" size="sm" />
              </div>
            </div>

            {/* Notifications - Style Danger Gradient */}
            <button
              className="relative p-2 rounded-xl bg-gradient-to-br from-red-500 to-red-600 text-white shadow-md hover:shadow-lg hover:from-red-600 hover:to-red-700 transition-all duration-200 group"
              aria-label="Notifications"
            >
              <Bell className="h-5 w-5 group-hover:scale-110 transition-transform duration-200" strokeWidth={2} />
              {/* Badge notification animé */}
              <span className="absolute -top-1 -right-1 flex h-4 w-4">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-4 w-4 bg-yellow-400 text-[10px] font-bold text-red-900 items-center justify-center">3</span>
              </span>
            </button>

            {/* Séparateur vertical */}
            <div className="hidden sm:block w-px h-6 bg-gradient-to-b from-transparent via-indigo-200 dark:via-indigo-800 to-transparent"></div>

            {/* Profil utilisateur - Style Gradient Primary */}
            <div className="relative">
              <button
                className="flex items-center gap-3 pl-1 pr-3 py-1 rounded-xl bg-gradient-to-r from-indigo-50 to-indigo-100 dark:from-indigo-900/30 dark:to-indigo-800/30 border border-indigo-200 dark:border-indigo-800 shadow-md hover:shadow-lg transition-all duration-200 group"
                onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                aria-label="Menu profil"
              >
                {/* Avatar avec gradient 3 couleurs */}
                <div className="relative">
                  <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 via-indigo-600 to-indigo-700 rounded-lg flex items-center justify-center ring-2 ring-white dark:ring-gray-800 shadow-lg group-hover:scale-105 transition-transform duration-200">
                    <span className="text-xs font-bold text-white">
                      {user?.firstName?.charAt(0) || 'U'}
                    </span>
                  </div>
                  {/* Indicateur en ligne */}
                  <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-green-500 rounded-full ring-2 ring-white dark:ring-gray-800"></span>
                </div>

                {/* Nom utilisateur */}
                <div className="hidden lg:flex flex-col items-start mr-1">
                  <span className="text-xs font-bold text-indigo-900 dark:text-indigo-100 leading-tight group-hover:text-indigo-700 dark:group-hover:text-indigo-300 transition-colors">
                    {user?.firstName}
                  </span>
                  <span className="text-[10px] font-medium text-indigo-500 dark:text-indigo-400 leading-tight">
                    {user?.role === 'Super Admin' ? 'Super Admin' : user?.role === 'admin' ? 'Admin' : 'Utilisateur'}
                  </span>
                </div>

                <ChevronDown className={`hidden lg:block w-3.5 h-3.5 text-indigo-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-300 transition-transform duration-200 ${profileDropdownOpen ? 'rotate-180' : ''}`} strokeWidth={2.5} />
              </button>

              {/* Dropdown menu - Design Premium */}
              {profileDropdownOpen && (
                <>
                  {/* Overlay */}
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setProfileDropdownOpen(false)}
                  />

                  {/* Menu dropdown */}
                  <div className="absolute right-0 mt-3 w-72 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border-2 border-indigo-100 dark:border-indigo-900 py-2 z-20 animate-in fade-in slide-in-from-top-2 duration-200 origin-top-right ring-1 ring-black/5">
                    {/* En-tête du profil */}
                    <div className="px-5 py-4 border-b border-indigo-50 dark:border-indigo-800/50 bg-gradient-to-br from-indigo-50 to-indigo-100/50 dark:from-indigo-900/20 dark:to-indigo-800/10">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 via-indigo-600 to-indigo-700 rounded-xl flex items-center justify-center shadow-lg ring-2 ring-white dark:ring-gray-800">
                          <span className="text-lg font-bold text-white">
                            {user?.firstName?.charAt(0) || 'U'}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-gray-900 dark:text-white truncate">
                            {user?.firstName} {user?.lastName}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5 font-medium">
                            {user?.email}
                          </p>
                          <div className="mt-2 inline-flex items-center px-2.5 py-0.5 rounded-md text-[10px] font-bold bg-white dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-300 border border-indigo-100 dark:border-indigo-800 shadow-sm">
                            {user?.role || 'Utilisateur'}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="p-2 space-y-1">
                      <Link
                        to="/profile"
                        onClick={() => setProfileDropdownOpen(false)}
                        className="flex items-center gap-3 px-3 py-2.5 text-sm text-gray-700 dark:text-gray-300 rounded-xl hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition-colors group"
                      >
                        <div className="p-2 rounded-lg bg-indigo-50 dark:bg-indigo-900/20 text-indigo-500 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                          <User className="w-4 h-4" strokeWidth={2.5} />
                        </div>
                        <div className="flex flex-col">
                          <span className="font-semibold group-hover:text-indigo-700 dark:group-hover:text-indigo-300 transition-colors">Mon profil</span>
                          <span className="text-[10px] text-gray-400">Gérer votre compte</span>
                        </div>
                      </Link>
                    </div>

                    {/* Séparateur */}
                    <div className="border-t border-indigo-50 dark:border-indigo-800/50 my-1 mx-4" />

                    {/* Déconnexion */}
                    <div className="p-2">
                      <button
                        onClick={async () => {
                          await logout();
                          setProfileDropdownOpen(false);
                          navigate('/auth/login');
                        }}
                        className="flex items-center gap-3 px-3 py-2.5 text-sm text-red-600 dark:text-red-400 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20 w-full text-left transition-colors group"
                      >
                        <div className="p-2 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-500 group-hover:text-red-600 transition-colors">
                          <LogOut className="w-4 h-4" strokeWidth={2.5} />
                        </div>
                        <span className="font-semibold group-hover:text-red-700 dark:group-hover:text-red-300 transition-colors">Se déconnecter</span>
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

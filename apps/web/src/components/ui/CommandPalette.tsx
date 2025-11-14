/**
 * FICHIER: apps\web\src\components\ui\CommandPalette.tsx
 * COMPOSANT: CommandPalette - Palette de commandes (Cmd+K)
 *
 * DESCRIPTION:
 * Command palette moderne inspiré de Spotlight/Raycast
 * Navigation rapide, recherche globale, actions rapides
 * Raccourcis clavier intégrés
 *
 * FONCTIONNALITÉS:
 * - Recherche fuzzy dans toute l'app
 * - Navigation rapide vers pages
 * - Actions rapides (créer, éditer, exporter)
 * - Raccourcis clavier (Cmd+K, Ctrl+K)
 * - Historique des recherches
 * - Groupes de commandes
 * - Dark mode support
 *
 * USAGE:
 * // Dans App.tsx ou MainLayout
 * import { CommandPalette } from '@/components/ui/CommandPalette';
 * <CommandPalette />
 *
 * RACCOURCIS:
 * - Cmd+K / Ctrl+K: Ouvrir
 * - Esc: Fermer
 * - ↑↓: Naviguer
 * - Enter: Exécuter
 *
 * AUTEUR: Équipe CROU
 * DATE: Décembre 2024
 */

import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Command } from 'cmdk';
import {
  MagnifyingGlassIcon,
  HomeIcon,
  BanknotesIcon,
  CubeIcon,
  HomeModernIcon,
  TruckIcon,
  DocumentTextIcon,
  CogIcon,
  UserGroupIcon,
  PlusIcon,
  ArrowRightIcon,
  ClockIcon,
  CommandLineIcon
} from '@heroicons/react/24/outline';
import { cn } from '@/utils/cn';

// Types
export interface CommandItem {
  id: string;
  label: string;
  description?: string;
  icon?: React.ReactNode;
  keywords?: string[];
  group?: string;
  action: () => void;
  shortcut?: string[];
}

export interface CommandGroup {
  heading: string;
  items: CommandItem[];
}

// Configuration des commandes par défaut
const useDefaultCommands = (): CommandGroup[] => {
  const navigate = useNavigate();

  return useMemo(() => [
    {
      heading: 'Navigation',
      items: [
        {
          id: 'nav-dashboard',
          label: 'Tableau de Bord',
          description: 'Vue d\'ensemble des KPIs',
          icon: <HomeIcon className="w-4 h-4" />,
          keywords: ['home', 'accueil', 'dashboard'],
          action: () => navigate('/dashboard')
        },
        {
          id: 'nav-financial',
          label: 'Gestion Financière',
          description: 'Budgets et dépenses',
          icon: <BanknotesIcon className="w-4 h-4" />,
          keywords: ['budget', 'finance', 'argent'],
          action: () => navigate('/financial')
        },
        {
          id: 'nav-stocks',
          label: 'Stocks & Approvisionnement',
          description: 'Gestion des stocks',
          icon: <CubeIcon className="w-4 h-4" />,
          keywords: ['stock', 'inventaire', 'magasin'],
          action: () => navigate('/stocks')
        },
        {
          id: 'nav-housing',
          label: 'Logement Universitaire',
          description: 'Gestion des logements',
          icon: <HomeModernIcon className="w-4 h-4" />,
          keywords: ['logement', 'residence', 'chambre'],
          action: () => navigate('/housing')
        },
        {
          id: 'nav-transport',
          label: 'Transport',
          description: 'Gestion des transports',
          icon: <TruckIcon className="w-4 h-4" />,
          keywords: ['transport', 'bus', 'vehicule'],
          action: () => navigate('/transport')
        },
        {
          id: 'nav-reports',
          label: 'Rapports',
          description: 'Rapports et statistiques',
          icon: <DocumentTextIcon className="w-4 h-4" />,
          keywords: ['rapport', 'stats', 'analyse'],
          action: () => navigate('/reports')
        },
        {
          id: 'nav-admin',
          label: 'Administration',
          description: 'Paramètres système',
          icon: <CogIcon className="w-4 h-4" />,
          keywords: ['admin', 'config', 'settings'],
          action: () => navigate('/admin')
        }
      ]
    },
    {
      heading: 'Actions Rapides',
      items: [
        {
          id: 'action-new-budget',
          label: 'Créer un Budget',
          description: 'Nouveau budget annuel',
          icon: <PlusIcon className="w-4 h-4" />,
          keywords: ['créer', 'nouveau', 'budget'],
          action: () => navigate('/financial/budgets/new')
        },
        {
          id: 'action-new-expense',
          label: 'Nouvelle Dépense',
          description: 'Enregistrer une dépense',
          icon: <PlusIcon className="w-4 h-4" />,
          keywords: ['créer', 'dépense', 'paiement'],
          action: () => navigate('/financial/expenses/new')
        },
        {
          id: 'action-new-housing',
          label: 'Ajouter un Logement',
          description: 'Nouveau logement étudiant',
          icon: <PlusIcon className="w-4 h-4" />,
          keywords: ['créer', 'logement', 'chambre'],
          action: () => navigate('/housing/new')
        },
        {
          id: 'action-new-user',
          label: 'Créer un Utilisateur',
          description: 'Nouveau compte utilisateur',
          icon: <UserGroupIcon className="w-4 h-4" />,
          keywords: ['créer', 'user', 'compte'],
          action: () => navigate('/admin/users/new')
        }
      ]
    }
  ], [navigate]);
};

// Composant principal
export const CommandPalette: React.FC<{
  additionalCommands?: CommandGroup[];
}> = ({ additionalCommands = [] }) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [recentSearches, setRecentSearches] = useState<string[]>([]);

  const defaultCommands = useDefaultCommands();
  const allCommands = [...defaultCommands, ...additionalCommands];

  // Raccourci clavier Cmd+K / Ctrl+K
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  // Charger l'historique depuis localStorage
  useEffect(() => {
    const stored = localStorage.getItem('commandPaletteHistory');
    if (stored) {
      try {
        setRecentSearches(JSON.parse(stored));
      } catch (e) {
        console.error('Failed to parse command palette history', e);
      }
    }
  }, []);

  // Sauvegarder dans l'historique
  const addToHistory = (search: string) => {
    if (!search.trim()) return;

    const updated = [search, ...recentSearches.filter(s => s !== search)].slice(0, 5);
    setRecentSearches(updated);
    localStorage.setItem('commandPaletteHistory', JSON.stringify(updated));
  };

  // Handler pour exécuter une commande
  const runCommand = (item: CommandItem) => {
    addToHistory(item.label);
    setOpen(false);
    setSearch('');
    item.action();
  };

  return (
    <Command.Dialog
      open={open}
      onOpenChange={setOpen}
      label="Command Palette"
      className="fixed inset-0 z-50"
    >
      {/* Overlay */}
      <div className="fixed inset-0 bg-black/20 dark:bg-black/40 backdrop-blur-md" />

      {/* Dialog */}
      <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl">
        <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl rounded-xl shadow-2xl border border-gray-200/50 dark:border-gray-700/50 overflow-hidden">
          {/* Input */}
          <div className="flex items-center border-b border-gray-200 dark:border-gray-700 px-4">
            <MagnifyingGlassIcon className="w-5 h-5 text-gray-400 mr-3" />
            <Command.Input
              value={search}
              onValueChange={setSearch}
              placeholder="Rechercher ou taper une commande..."
              className="w-full bg-transparent py-4 text-base text-gray-900 dark:text-gray-100 placeholder-gray-500 outline-none"
            />
            <kbd className="hidden sm:inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-gray-500 bg-gray-100 dark:bg-gray-700 dark:text-gray-400 rounded">
              ESC
            </kbd>
          </div>

          {/* Liste de commandes */}
          <Command.List className="max-h-96 overflow-y-auto p-2">
            <Command.Empty className="py-8 text-center text-sm text-gray-500 dark:text-gray-400">
              Aucun résultat trouvé
            </Command.Empty>

            {/* Historique récent */}
            {!search && recentSearches.length > 0 && (
              <Command.Group heading="Récents" className="mb-2">
                <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 px-3 py-2 flex items-center gap-2">
                  <ClockIcon className="w-3 h-3" />
                  Récents
                </div>
                {recentSearches.map((item, index) => (
                  <Command.Item
                    key={`recent-${index}`}
                    value={item}
                    className={cn(
                      'flex items-center gap-3 px-3 py-2.5 rounded-lg',
                      'text-sm text-gray-700 dark:text-gray-300',
                      'data-[selected=true]:bg-primary-50 dark:data-[selected=true]:bg-primary-900/20',
                      'data-[selected=true]:text-primary-900 dark:data-[selected=true]:text-primary-100',
                      'cursor-pointer transition-colors'
                    )}
                  >
                    <ClockIcon className="w-4 h-4 opacity-50" />
                    <span>{item}</span>
                  </Command.Item>
                ))}
              </Command.Group>
            )}

            {/* Groupes de commandes */}
            {allCommands.map((group) => (
              <Command.Group key={group.heading} heading={group.heading} className="mb-2">
                <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 px-3 py-2 flex items-center gap-2">
                  <CommandLineIcon className="w-3 h-3" />
                  {group.heading}
                </div>
                {group.items.map((item) => (
                  <Command.Item
                    key={item.id}
                    value={item.label}
                    keywords={item.keywords}
                    onSelect={() => runCommand(item)}
                    className={cn(
                      'flex items-center gap-3 px-3 py-2.5 rounded-lg',
                      'text-sm text-gray-700 dark:text-gray-300',
                      'data-[selected=true]:bg-primary-50 dark:data-[selected=true]:bg-primary-900/20',
                      'data-[selected=true]:text-primary-900 dark:data-[selected=true]:text-primary-100',
                      'cursor-pointer transition-colors'
                    )}
                  >
                    {item.icon && (
                      <div className="flex-shrink-0 opacity-70">
                        {item.icon}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="font-medium">{item.label}</div>
                      {item.description && (
                        <div className="text-xs opacity-70 truncate">
                          {item.description}
                        </div>
                      )}
                    </div>
                    <ArrowRightIcon className="w-4 h-4 opacity-50 flex-shrink-0" />
                  </Command.Item>
                ))}
              </Command.Group>
            ))}
          </Command.List>

          {/* Footer avec raccourcis */}
          <div className="border-t border-gray-200 dark:border-gray-700 px-4 py-2 flex items-center justify-between text-xs text-gray-500 bg-gray-50/50 dark:bg-gray-900/50">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 bg-white dark:bg-gray-800 rounded border border-gray-300 dark:border-gray-600">↑↓</kbd>
                Naviguer
              </span>
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 bg-white dark:bg-gray-800 rounded border border-gray-300 dark:border-gray-600">Enter</kbd>
                Sélectionner
              </span>
            </div>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-white dark:bg-gray-800 rounded border border-gray-300 dark:border-gray-600">Cmd</kbd>
              <kbd className="px-1.5 py-0.5 bg-white dark:bg-gray-800 rounded border border-gray-300 dark:border-gray-600">K</kbd>
              pour ouvrir
            </span>
          </div>
        </div>
      </div>
    </Command.Dialog>
  );
};

export default CommandPalette;

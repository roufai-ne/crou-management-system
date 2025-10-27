/**
 * FICHIER: apps\web\src\components\financial\TransactionTable.tsx
 * COMPOSANT: TransactionTable - Tableau des transactions
 * 
 * DESCRIPTION:
 * Tableau pour afficher et gérer les transactions financières
 * Filtres, tri, pagination et actions contextuelles
 * Intégration avec l'API et les permissions
 * 
 * FONCTIONNALITÉS:
 * - Affichage des transactions avec filtres
 * - Actions contextuelles selon les permissions
 * - Tri et pagination
 * - Indicateurs visuels (statuts, types)
 * - Design responsive et accessible
 * 
 * AUTEUR: Équipe CROU
 * DATE: Décembre 2024
 */

import React, { useState } from 'react';
import { Table } from '@/components/ui/Table';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { 
  Eye, 
  Edit, 
  CheckCircle, 
  XCircle, 
  Search,
  Filter,
  Download,
  Plus
} from 'lucide-react';
import { formatCurrency, formatDate } from '@/utils/formatters';
import { useAuth } from '@/stores/auth';

// Interface pour les données de transaction
interface TransactionData {
  id: string;
  libelle: string;
  type: 'depense' | 'recette' | 'engagement' | 'ajustement' | 'virement';
  category: string;
  montant: number;
  date: string;
  status: 'draft' | 'submitted' | 'approved' | 'rejected' | 'executed' | 'cancelled';
  beneficiaire?: string;
  budget?: {
    id: string;
    libelle: string;
  };
  createdBy: string;
  createdAt: string;
}

interface TransactionTableProps {
  transactions: TransactionData[];
  loading?: boolean;
  onView?: (id: string) => void;
  onEdit?: (id: string) => void;
  onValidate?: (id: string) => void;
  onReject?: (id: string) => void;
  onExport?: () => void;
  onAdd?: () => void;
  className?: string;
}

export function TransactionTable({
  transactions,
  loading = false,
  onView,
  onEdit,
  onValidate,
  onReject,
  onExport,
  onAdd,
  className
}: TransactionTableProps) {
  const { hasPermission } = useAuth();
  
  // État local pour les filtres
  const [filters, setFilters] = useState({
    search: '',
    type: '',
    status: '',
    dateFrom: '',
    dateTo: ''
  });

  // Configuration des types
  const typeConfig = {
    depense: { label: 'Dépense', color: 'red', icon: '↓' },
    recette: { label: 'Recette', color: 'green', icon: '↑' },
    engagement: { label: 'Engagement', color: 'orange', icon: '⏳' },
    ajustement: { label: 'Ajustement', color: 'blue', icon: '↔' },
    virement: { label: 'Virement', color: 'purple', icon: '↔' }
  };

  // Configuration des statuts
  const statusConfig = {
    draft: { label: 'Brouillon', color: 'gray' },
    submitted: { label: 'Soumis', color: 'blue' },
    approved: { label: 'Approuvé', color: 'green' },
    rejected: { label: 'Rejeté', color: 'red' },
    executed: { label: 'Exécuté', color: 'green' },
    cancelled: { label: 'Annulé', color: 'gray' }
  };

  // Filtrer les transactions
  const filteredTransactions = transactions.filter(transaction => {
    const matchesSearch = !filters.search || 
      transaction.libelle.toLowerCase().includes(filters.search.toLowerCase()) ||
      transaction.beneficiaire?.toLowerCase().includes(filters.search.toLowerCase());
    
    const matchesType = !filters.type || transaction.type === filters.type;
    const matchesStatus = !filters.status || transaction.status === filters.status;
    
    const matchesDateFrom = !filters.dateFrom || new Date(transaction.date) >= new Date(filters.dateFrom);
    const matchesDateTo = !filters.dateTo || new Date(transaction.date) <= new Date(filters.dateTo);
    
    return matchesSearch && matchesType && matchesStatus && matchesDateFrom && matchesDateTo;
  });

  // Colonnes du tableau
  const columns = [
    {
      key: 'libelle',
      label: 'Libellé',
      render: (transaction: TransactionData) => (
        <div className="space-y-1">
          <p className="font-medium text-gray-900 line-clamp-1">
            {transaction.libelle}
          </p>
          {transaction.beneficiaire && (
            <p className="text-sm text-gray-500">
              {transaction.beneficiaire}
            </p>
          )}
        </div>
      )
    },
    {
      key: 'type',
      label: 'Type',
      render: (transaction: TransactionData) => {
        const config = typeConfig[transaction.type];
        return (
          <div className="flex items-center gap-2">
            <span className="text-lg">{config.icon}</span>
            <Badge variant={config.color as any}>
              {config.label}
            </Badge>
          </div>
        );
      }
    },
    {
      key: 'montant',
      label: 'Montant',
      render: (transaction: TransactionData) => {
        const isExpense = ['depense', 'engagement'].includes(transaction.type);
        const amount = isExpense ? -transaction.montant : transaction.montant;
        return (
          <span className={`font-semibold ${
            isExpense ? 'text-red-600' : 'text-green-600'
          }`}>
            {formatCurrency(Math.abs(amount))}
          </span>
        );
      }
    },
    {
      key: 'date',
      label: 'Date',
      render: (transaction: TransactionData) => (
        <span className="text-sm text-gray-600">
          {formatDate(transaction.date)}
        </span>
      )
    },
    {
      key: 'status',
      label: 'Statut',
      render: (transaction: TransactionData) => {
        const config = statusConfig[transaction.status];
        return (
          <Badge variant={config.color as any}>
            {config.label}
          </Badge>
        );
      }
    },
    {
      key: 'budget',
      label: 'Budget',
      render: (transaction: TransactionData) => (
        transaction.budget ? (
          <span className="text-sm text-blue-600">
            {transaction.budget.libelle}
          </span>
        ) : (
          <span className="text-sm text-gray-400">-</span>
        )
      )
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (transaction: TransactionData) => (
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onView?.(transaction.id)}
          >
            <Eye className="w-4 h-4" />
          </Button>

          {transaction.status === 'draft' && hasPermission('financial:write') && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onEdit?.(transaction.id)}
            >
              <Edit className="w-4 h-4" />
            </Button>
          )}

          {transaction.status === 'submitted' && hasPermission('financial:validate') && (
            <div className="flex gap-1">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onValidate?.(transaction.id)}
              >
                <CheckCircle className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onReject?.(transaction.id)}
              >
                <XCircle className="w-4 h-4" />
              </Button>
            </div>
          )}
        </div>
      )
    }
  ];

  return (
    <div className={className}>
      {/* En-tête avec filtres */}
      <div className="mb-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">
            Transactions ({filteredTransactions.length})
          </h2>
          
          <div className="flex items-center gap-2">
            {hasPermission('financial:write') && (
              <Button onClick={onAdd}>
                <Plus className="w-4 h-4 mr-2" />
                Nouvelle transaction
              </Button>
            )}
            
            <Button variant="outline" onClick={onExport}>
              <Download className="w-4 h-4 mr-2" />
              Exporter
            </Button>
          </div>
        </div>

        {/* Filtres */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 p-4 bg-gray-50 rounded-lg">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Rechercher..."
              value={filters.search}
              onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
              className="pl-10"
            />
          </div>

          <Select
            value={filters.type}
            onValueChange={(value) => setFilters(prev => ({ ...prev, type: value }))}
          >
            <option value="">Tous les types</option>
            {Object.entries(typeConfig).map(([value, config]) => (
              <option key={value} value={value}>
                {config.label}
              </option>
            ))}
          </Select>

          <Select
            value={filters.status}
            onValueChange={(value) => setFilters(prev => ({ ...prev, status: value }))}
          >
            <option value="">Tous les statuts</option>
            {Object.entries(statusConfig).map(([value, config]) => (
              <option key={value} value={value}>
                {config.label}
              </option>
            ))}
          </Select>

          <Input
            type="date"
            placeholder="Date de début"
            value={filters.dateFrom}
            onChange={(e) => setFilters(prev => ({ ...prev, dateFrom: e.target.value }))}
          />

          <Input
            type="date"
            placeholder="Date de fin"
            value={filters.dateTo}
            onChange={(e) => setFilters(prev => ({ ...prev, dateTo: e.target.value }))}
          />
        </div>
      </div>

      {/* Tableau */}
      <Table
        data={filteredTransactions}
        columns={columns}
        loading={loading}
        emptyMessage="Aucune transaction trouvée"
        className="min-h-[400px]"
      />

      {/* Résumé */}
      {filteredTransactions.length > 0 && (
        <div className="mt-4 p-4 bg-gray-50 rounded-lg">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="text-center">
              <p className="text-gray-600">Total des dépenses</p>
              <p className="text-lg font-semibold text-red-600">
                {formatCurrency(
                  filteredTransactions
                    .filter(t => ['depense', 'engagement'].includes(t.type))
                    .reduce((sum, t) => sum + t.montant, 0)
                )}
              </p>
            </div>
            <div className="text-center">
              <p className="text-gray-600">Total des recettes</p>
              <p className="text-lg font-semibold text-green-600">
                {formatCurrency(
                  filteredTransactions
                    .filter(t => t.type === 'recette')
                    .reduce((sum, t) => sum + t.montant, 0)
                )}
              </p>
            </div>
            <div className="text-center">
              <p className="text-gray-600">Solde net</p>
              <p className={`text-lg font-semibold ${
                filteredTransactions.reduce((sum, t) => {
                  const amount = ['depense', 'engagement'].includes(t.type) ? -t.montant : t.montant;
                  return sum + amount;
                }, 0) >= 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {formatCurrency(
                  filteredTransactions.reduce((sum, t) => {
                    const amount = ['depense', 'engagement'].includes(t.type) ? -t.montant : t.montant;
                    return sum + amount;
                  }, 0)
                )}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

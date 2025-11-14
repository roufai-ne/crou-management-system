/**
 * FICHIER: apps\web\src\components\financial\BudgetCard.tsx
 * COMPOSANT: BudgetCard - Carte de budget
 * 
 * DESCRIPTION:
 * Composant pour afficher les informations d'un budget
 * Actions rapides et indicateurs visuels
 * Intégration avec l'API et les permissions
 * 
 * FONCTIONNALITÉS:
 * - Affichage des métriques budgétaires
 * - Indicateurs visuels (taux d'exécution, alertes)
 * - Actions contextuelles selon les permissions
 * - Design responsive et accessible
 * 
 * AUTEUR: Équipe CROU
 * DATE: Décembre 2024
 */

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Progress } from '@/components/ui/Progress';
import { 
  Eye, 
  Edit, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  DollarSign
} from 'lucide-react';
import { formatCurrency } from '@/utils/formatters';
import { useAuth } from '@/stores/auth';

// Interface pour les données de budget
interface BudgetData {
  id: string;
  libelle: string;
  type: 'national' | 'crou' | 'service';
  exercice: number;
  montantInitial: number;
  montantRealise: number;
  montantEngage: number;
  montantDisponible: number;
  tauxExecution: number;
  status: 'draft' | 'submitted' | 'approved' | 'rejected' | 'active' | 'closed';
  canBeModified: boolean;
  canBeSubmitted: boolean;
  canBeApproved: boolean;
  isInAlert: boolean;
  createdAt: string;
  updatedAt: string;
}

interface BudgetCardProps {
  budget: BudgetData;
  onView?: (id: string) => void;
  onEdit?: (id: string) => void;
  onValidate?: (id: string) => void;
  onReject?: (id: string) => void;
  className?: string;
}

export function BudgetCard({ 
  budget, 
  onView, 
  onEdit, 
  onValidate, 
  onReject,
  className 
}: BudgetCardProps) {
  const { hasPermission } = useAuth();

  // Configuration des statuts
  const statusConfig = {
    draft: { label: 'Brouillon', color: 'gray', icon: Edit },
    submitted: { label: 'Soumis', color: 'blue', icon: Eye },
    approved: { label: 'Approuvé', color: 'green', icon: CheckCircle },
    rejected: { label: 'Rejeté', color: 'red', icon: XCircle },
    active: { label: 'Actif', color: 'green', icon: CheckCircle },
    closed: { label: 'Clôturé', color: 'gray', icon: XCircle }
  };

  // Configuration des types
  const typeConfig = {
    national: { label: 'National', color: 'purple' },
    crou: { label: 'CROU', color: 'blue' },
    service: { label: 'Service', color: 'orange' }
  };

  const currentStatus = statusConfig[budget.status];
  const currentType = typeConfig[budget.type];
  const StatusIcon = currentStatus.icon;

  // Calculer les indicateurs
  const executionRate = budget.tauxExecution;
  const isOverBudget = executionRate > 100;
  const isNearLimit = executionRate > 90;
  const isLowExecution = executionRate < 30;

  // Déterminer la couleur de la barre de progression
  const getProgressColor = () => {
    if (isOverBudget) return 'red';
    if (isNearLimit) return 'orange';
    if (isLowExecution) return 'yellow';
    return 'green';
  };

  // Déterminer l'icône de tendance
  const getTrendIcon = () => {
    if (isOverBudget) return TrendingUp;
    if (isNearLimit) return AlertTriangle;
    return TrendingDown;
  };

  const TrendIcon = getTrendIcon();

  return (
    <Card className={`hover:shadow-lg transition-shadow duration-200 ${className}`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="text-lg font-semibold line-clamp-2">
              {budget.libelle}
            </CardTitle>
            <div className="flex items-center gap-2">
              <Badge variant={currentType.color as any}>
                {currentType.label}
              </Badge>
              <Badge variant={currentStatus.color as any}>
                <StatusIcon className="w-3 h-3 mr-1" />
                {currentStatus.label}
              </Badge>
            </div>
          </div>
          
          {budget.isInAlert && (
            <AlertTriangle className="w-5 h-5 text-orange-500" />
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Métriques financières */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <p className="text-sm text-gray-600 dark:text-gray-400">Montant initial</p>
            <p className="text-lg font-semibold text-gray-900 dark:text-white">
              {formatCurrency(budget.montantInitial)}
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-sm text-gray-600 dark:text-gray-400">Disponible</p>
            <p className="text-lg font-semibold text-green-600">
              {formatCurrency(budget.montantDisponible)}
            </p>
          </div>
        </div>

        {/* Barre de progression du taux d'exécution */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Taux d'exécution
            </span>
            <div className="flex items-center gap-1">
              <TrendIcon className={`w-4 h-4 ${
                isOverBudget ? 'text-red-500' : 
                isNearLimit ? 'text-orange-500' : 
                'text-green-500'
              }`} />
              <span className={`text-sm font-semibold ${
                isOverBudget ? 'text-red-600' : 
                isNearLimit ? 'text-orange-600' : 
                'text-green-600'
              }`}>
                {executionRate.toFixed(1)}%
              </span>
            </div>
          </div>
          <Progress 
            value={Math.min(executionRate, 100)} 
            className="h-2"
            color={getProgressColor()}
          />
        </div>

        {/* Détails des montants */}
        <div className="grid grid-cols-3 gap-2 text-xs">
          <div className="text-center p-2 bg-gray-50 rounded">
            <p className="text-gray-600 dark:text-gray-400">Réalisé</p>
            <p className="font-semibold text-green-600">
              {formatCurrency(budget.montantRealise)}
            </p>
          </div>
          <div className="text-center p-2 bg-gray-50 rounded">
            <p className="text-gray-600 dark:text-gray-400">Engagé</p>
            <p className="font-semibold text-orange-600">
              {formatCurrency(budget.montantEngage)}
            </p>
          </div>
          <div className="text-center p-2 bg-gray-50 rounded">
            <p className="text-gray-600 dark:text-gray-400">Exercice</p>
            <p className="font-semibold text-blue-600">
              {budget.exercice}
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 pt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onView?.(budget.id)}
            className="flex-1"
          >
            <Eye className="w-4 h-4 mr-1" />
            Voir
          </Button>

          {budget.canBeModified && hasPermission('financial:write') && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onEdit?.(budget.id)}
            >
              <Edit className="w-4 h-4" />
            </Button>
          )}

          {budget.canBeSubmitted && hasPermission('financial:write') && (
            <Button
              variant="default"
              size="sm"
              onClick={() => onValidate?.(budget.id)}
            >
              <CheckCircle className="w-4 h-4 mr-1" />
              Soumettre
            </Button>
          )}

          {budget.canBeApproved && hasPermission('financial:validate') && (
            <div className="flex gap-1">
              <Button
                variant="default"
                size="sm"
                onClick={() => onValidate?.(budget.id)}
              >
                <CheckCircle className="w-4 h-4" />
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => onReject?.(budget.id)}
              >
                <XCircle className="w-4 h-4" />
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

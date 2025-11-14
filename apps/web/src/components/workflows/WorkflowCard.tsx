/**
 * FICHIER: apps\web\src\components\workflows\WorkflowCard.tsx
 * COMPOSANT: WorkflowCard - Carte de workflow
 * 
 * DESCRIPTION:
 * Composant pour afficher les informations d'un workflow
 * Actions rapides et indicateurs visuels
 * Intégration avec l'API et les permissions
 * 
 * FONCTIONNALITÉS:
 * - Affichage des métriques de workflow
 * - Indicateurs visuels (statut, étapes)
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
  Play, 
  Pause,
  Settings,
  Users,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle
} from 'lucide-react';
import { useAuth } from '@/stores/auth';

// Interface pour les données de workflow
interface WorkflowData {
  id: string;
  name: string;
  description: string;
  module: 'financial' | 'stocks' | 'housing' | 'transport' | 'reports';
  type: 'sequential' | 'parallel' | 'conditional';
  status: 'draft' | 'active' | 'inactive' | 'archived';
  entityType: string;
  triggerEvent: string;
  steps: Array<{
    id: string;
    name: string;
    order: number;
    type: 'approval' | 'automatic' | 'notification' | 'condition';
    priority: 'low' | 'medium' | 'high' | 'critical';
    role: string;
    isRequired: boolean;
    canSkip: boolean;
    canReject: boolean;
    canDelegate: boolean;
  }>;
  instances: Array<{
    id: string;
    status: 'pending' | 'in_progress' | 'completed' | 'rejected' | 'cancelled' | 'expired';
    priority: 'low' | 'medium' | 'high' | 'critical';
    createdAt: string;
    completedAt?: string;
  }>;
  createdAt: string;
  updatedAt: string;
}

interface WorkflowCardProps {
  workflow: WorkflowData;
  onView?: (id: string) => void;
  onEdit?: (id: string) => void;
  onActivate?: (id: string) => void;
  onDeactivate?: (id: string) => void;
  onConfigure?: (id: string) => void;
  className?: string;
}

export function WorkflowCard({ 
  workflow, 
  onView, 
  onEdit, 
  onActivate, 
  onDeactivate,
  onConfigure,
  className 
}: WorkflowCardProps) {
  const { hasPermission } = useAuth();

  // Configuration des modules
  const moduleConfig = {
    financial: { label: 'Financier', color: 'blue', icon: '💰' },
    stocks: { label: 'Stocks', color: 'green', icon: '📦' },
    housing: { label: 'Logement', color: 'purple', icon: '🏠' },
    transport: { label: 'Transport', color: 'orange', icon: '🚗' },
    reports: { label: 'Rapports', color: 'gray', icon: '📊' }
  };

  // Configuration des types
  const typeConfig = {
    sequential: { label: 'Séquentiel', color: 'blue', icon: '→' },
    parallel: { label: 'Parallèle', color: 'green', icon: '∥' },
    conditional: { label: 'Conditionnel', color: 'purple', icon: '?' }
  };

  // Configuration des statuts
  const statusConfig = {
    draft: { label: 'Brouillon', color: 'gray', icon: Edit },
    active: { label: 'Actif', color: 'green', icon: CheckCircle },
    inactive: { label: 'Inactif', color: 'orange', icon: Pause },
    archived: { label: 'Archivé', color: 'gray', icon: XCircle }
  };

  const currentModule = moduleConfig[workflow.module];
  const currentType = typeConfig[workflow.type];
  const currentStatus = statusConfig[workflow.status];
  const StatusIcon = currentStatus.icon;

  // Calculer les métriques
  const totalSteps = workflow.steps.length;
  const totalInstances = workflow.instances.length;
  const completedInstances = workflow.instances.filter(i => i.status === 'completed').length;
  const inProgressInstances = workflow.instances.filter(i => i.status === 'in_progress').length;
  const rejectedInstances = workflow.instances.filter(i => i.status === 'rejected').length;
  
  const completionRate = totalInstances > 0 ? (completedInstances / totalInstances) * 100 : 0;
  const rejectionRate = totalInstances > 0 ? (rejectedInstances / totalInstances) * 100 : 0;

  // Obtenir les étapes dans l'ordre
  const orderedSteps = workflow.steps.sort((a, b) => a.order - b.order);

  return (
    <Card className={`hover:shadow-lg transition-shadow duration-200 ${className}`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="text-lg font-semibold line-clamp-2">
              {workflow.name}
            </CardTitle>
            <p className="text-sm text-gray-600 line-clamp-2">
              {workflow.description}
            </p>
            <div className="flex items-center gap-2">
              <Badge variant={currentModule.color as any}>
                <span className="mr-1">{currentModule.icon}</span>
                {currentModule.label}
              </Badge>
              <Badge variant={currentType.color as any}>
                {currentType.icon} {currentType.label}
              </Badge>
              <Badge variant={currentStatus.color as any}>
                <StatusIcon className="w-3 h-3 mr-1" />
                {currentStatus.label}
              </Badge>
            </div>
          </div>
          
          {workflow.status === 'active' && inProgressInstances > 0 && (
            <AlertTriangle className="w-5 h-5 text-orange-500" />
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Métriques */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <p className="text-sm text-gray-600 dark:text-gray-400">Étapes</p>
            <p className="text-lg font-semibold text-gray-900 dark:text-white">
              {totalSteps}
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-sm text-gray-600 dark:text-gray-400">Instances</p>
            <p className="text-lg font-semibold text-blue-600">
              {totalInstances}
            </p>
          </div>
        </div>

        {/* Barre de progression du taux de completion */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Taux de completion
            </span>
            <span className="text-sm font-semibold text-green-600">
              {completionRate.toFixed(1)}%
            </span>
          </div>
          <Progress 
            value={completionRate} 
            className="h-2"
            color="green"
          />
        </div>

        {/* Détails des instances */}
        <div className="grid grid-cols-3 gap-2 text-xs">
          <div className="text-center p-2 bg-gray-50 rounded">
            <p className="text-gray-600 dark:text-gray-400">En cours</p>
            <p className="font-semibold text-blue-600">
              {inProgressInstances}
            </p>
          </div>
          <div className="text-center p-2 bg-gray-50 rounded">
            <p className="text-gray-600 dark:text-gray-400">Terminées</p>
            <p className="font-semibold text-green-600">
              {completedInstances}
            </p>
          </div>
          <div className="text-center p-2 bg-gray-50 rounded">
            <p className="text-gray-600 dark:text-gray-400">Rejetées</p>
            <p className="font-semibold text-red-600">
              {rejectedInstances}
            </p>
          </div>
        </div>

        {/* Étapes du workflow */}
        <div className="space-y-2">
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Étapes du workflow</p>
          <div className="space-y-1">
            {orderedSteps.slice(0, 3).map((step, index) => (
              <div key={step.id} className="flex items-center gap-2 text-xs">
                <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-semibold">
                  {step.order}
                </div>
                <span className="flex-1 text-gray-700 dark:text-gray-300">{step.name}</span>
                <Badge variant={step.priority === 'high' ? 'red' : step.priority === 'medium' ? 'orange' : 'green'}>
                  {step.priority}
                </Badge>
              </div>
            ))}
            {totalSteps > 3 && (
              <div className="text-xs text-gray-500 text-center">
                +{totalSteps - 3} autres étapes
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 pt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onView?.(workflow.id)}
            className="flex-1"
          >
            <Eye className="w-4 h-4 mr-1" />
            Voir
          </Button>

          {workflow.status === 'draft' && hasPermission('workflows:write') && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onEdit?.(workflow.id)}
            >
              <Edit className="w-4 h-4" />
            </Button>
          )}

          {workflow.status === 'draft' && hasPermission('workflows:write') && (
            <Button
              variant="default"
              size="sm"
              onClick={() => onActivate?.(workflow.id)}
            >
              <Play className="w-4 h-4 mr-1" />
              Activer
            </Button>
          )}

          {workflow.status === 'active' && hasPermission('workflows:write') && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onDeactivate?.(workflow.id)}
            >
              <Pause className="w-4 h-4" />
            </Button>
          )}

          {hasPermission('workflows:write') && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onConfigure?.(workflow.id)}
            >
              <Settings className="w-4 h-4" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

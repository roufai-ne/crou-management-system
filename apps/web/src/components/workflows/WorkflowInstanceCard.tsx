/**
 * FICHIER: apps\web\src\components\workflows\WorkflowInstanceCard.tsx
 * COMPOSANT: WorkflowInstanceCard - Carte d'instance de workflow
 * 
 * DESCRIPTION:
 * Composant pour afficher les informations d'une instance de workflow
 * Actions rapides et indicateurs visuels
 * Intégration avec l'API et les permissions
 * 
 * FONCTIONNALITÉS:
 * - Affichage des métriques d'instance
 * - Indicateurs visuels (statut, priorité, progression)
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
  CheckCircle, 
  XCircle,
  Clock,
  User,
  ArrowRight,
  AlertTriangle,
  Users,
  MessageSquare
} from 'lucide-react';
import { formatDate, formatDuration } from '@/utils/formatters';
import { useAuth } from '@/stores/auth';

// Interface pour les données d'instance
interface WorkflowInstanceData {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'in_progress' | 'completed' | 'rejected' | 'cancelled' | 'expired';
  priority: 'low' | 'medium' | 'high' | 'critical';
  entityType: string;
  entityId: string;
  workflow: {
    id: string;
    name: string;
    module: string;
  };
  currentStep: {
    id: string;
    name: string;
    order: number;
    type: string;
    role: string;
  } | null;
  assignedTo: string;
  delegatedTo: string | null;
  initiatedBy: string;
  createdAt: string;
  startedAt: string;
  completedAt: string | null;
  expiredAt: string | null;
  actions: Array<{
    id: string;
    type: string;
    title: string;
    comment: string;
    userName: string;
    createdAt: string;
  }>;
}

interface WorkflowInstanceCardProps {
  instance: WorkflowInstanceData;
  onView?: (id: string) => void;
  onApprove?: (id: string) => void;
  onReject?: (id: string) => void;
  onDelegate?: (id: string) => void;
  onComment?: (id: string) => void;
  className?: string;
}

export function WorkflowInstanceCard({ 
  instance, 
  onView, 
  onApprove, 
  onReject, 
  onDelegate,
  onComment,
  className 
}: WorkflowInstanceCardProps) {
  const { hasPermission, user } = useAuth();

  // Configuration des statuts
  const statusConfig = {
    pending: { label: 'En attente', color: 'gray', icon: Clock },
    in_progress: { label: 'En cours', color: 'blue', icon: ArrowRight },
    completed: { label: 'Terminée', color: 'green', icon: CheckCircle },
    rejected: { label: 'Rejetée', color: 'red', icon: XCircle },
    cancelled: { label: 'Annulée', color: 'gray', icon: XCircle },
    expired: { label: 'Expirée', color: 'orange', icon: AlertTriangle }
  };

  // Configuration des priorités
  const priorityConfig = {
    low: { label: 'Faible', color: 'green' },
    medium: { label: 'Moyenne', color: 'blue' },
    high: { label: 'Élevée', color: 'orange' },
    critical: { label: 'Critique', color: 'red' }
  };

  const currentStatus = statusConfig[instance.status];
  const currentPriority = priorityConfig[instance.priority];
  const StatusIcon = currentStatus.icon;

  // Calculer les métriques
  const isAssignedToMe = instance.assignedTo === user?.id || instance.delegatedTo === user?.id;
  const canTakeAction = isAssignedToMe && instance.status === 'in_progress';
  const isExpired = instance.expiredAt && new Date() > new Date(instance.expiredAt);
  const isUrgent = instance.priority === 'critical' || isExpired;

  // Calculer la durée
  const startDate = new Date(instance.startedAt);
  const endDate = instance.completedAt ? new Date(instance.completedAt) : new Date();
  const duration = endDate.getTime() - startDate.getTime();
  const durationText = formatDuration(duration, { format: 'short' });

  // Obtenir la dernière action
  const lastAction = instance.actions[instance.actions.length - 1];

  return (
    <Card className={`hover:shadow-lg transition-shadow duration-200 ${
      isUrgent ? 'border-red-200 bg-red-50' : ''
    } ${className}`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="text-lg font-semibold line-clamp-2">
              {instance.title}
            </CardTitle>
            <p className="text-sm text-gray-600 line-clamp-2">
              {instance.description}
            </p>
            <div className="flex items-center gap-2">
              <Badge variant={currentStatus.color as any}>
                <StatusIcon className="w-3 h-3 mr-1" />
                {currentStatus.label}
              </Badge>
              <Badge variant={currentPriority.color as any}>
                {currentPriority.label}
              </Badge>
              {isAssignedToMe && (
                <Badge variant="blue">
                  <User className="w-3 h-3 mr-1" />
                  Assigné à moi
                </Badge>
              )}
            </div>
          </div>
          
          {isUrgent && (
            <AlertTriangle className="w-5 h-5 text-red-500" />
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Informations du workflow */}
        <div className="space-y-2">
          <p className="text-sm font-medium text-gray-700">Workflow</p>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">{instance.workflow.name}</span>
            <Badge variant="gray">
              {instance.workflow.module}
            </Badge>
          </div>
        </div>

        {/* Étape actuelle */}
        {instance.currentStep && (
          <div className="space-y-2">
            <p className="text-sm font-medium text-gray-700">Étape actuelle</p>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-semibold text-xs">
                {instance.currentStep.order}
              </div>
              <span className="text-sm text-gray-700">{instance.currentStep.name}</span>
              {instance.currentStep.role && (
                <Badge variant="gray">
                  {instance.currentStep.role}
                </Badge>
              )}
            </div>
          </div>
        )}

        {/* Métriques temporelles */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <p className="text-sm text-gray-600">Durée</p>
            <p className="text-sm font-semibold text-gray-900">
              {durationText}
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-sm text-gray-600">Créée le</p>
            <p className="text-sm font-semibold text-gray-900">
              {formatDate(instance.createdAt, { format: 'short' })}
            </p>
          </div>
        </div>

        {/* Délai d'expiration */}
        {instance.expiredAt && (
          <div className="p-3 bg-orange-50 rounded-lg">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-orange-600" />
              <span className="text-sm text-orange-800">
                Expire le {formatDate(instance.expiredAt, { format: 'short' })}
              </span>
            </div>
          </div>
        )}

        {/* Dernière action */}
        {lastAction && (
          <div className="space-y-2">
            <p className="text-sm font-medium text-gray-700">Dernière action</p>
            <div className="flex items-center gap-2 text-xs">
              <Users className="w-4 h-4 text-gray-400" />
              <span className="text-gray-600">{lastAction.userName}</span>
              <span className="text-gray-500">•</span>
              <span className="text-gray-600">{lastAction.title}</span>
              <span className="text-gray-500">•</span>
              <span className="text-gray-500">
                {formatDate(lastAction.createdAt, { format: 'short' })}
              </span>
            </div>
            {lastAction.comment && (
              <p className="text-xs text-gray-600 italic">
                "{lastAction.comment}"
              </p>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-2 pt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onView?.(instance.id)}
            className="flex-1"
          >
            <Eye className="w-4 h-4 mr-1" />
            Voir
          </Button>

          {canTakeAction && (
            <>
              <Button
                variant="default"
                size="sm"
                onClick={() => onApprove?.(instance.id)}
              >
                <CheckCircle className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onReject?.(instance.id)}
              >
                <XCircle className="w-4 h-4" />
              </Button>
            </>
          )}

          {canTakeAction && hasPermission('workflows:delegate') && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onDelegate?.(instance.id)}
            >
              <Users className="w-4 h-4" />
            </Button>
          )}

          {canTakeAction && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onComment?.(instance.id)}
            >
              <MessageSquare className="w-4 h-4" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

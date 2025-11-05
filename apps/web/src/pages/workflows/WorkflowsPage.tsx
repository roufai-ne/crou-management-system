/**
 * FICHIER: apps\web\src\pages\workflows\WorkflowsPage.tsx
 * PAGE: Page principale du module workflows
 * 
 * DESCRIPTION:
 * Page principale pour la gestion des workflows de validation
 * Workflows, instances, actions
 * Intégration complète avec l'API
 * 
 * AUTEUR: Équipe CROU
 * DATE: Décembre 2024
 */

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import { Badge } from '@/components/ui/Badge';
import { 
  Workflow, 
  Users, 
  TrendingUp, 
  Clock,
  Plus,
  Eye,
  Edit,
  Play,
  Pause,
  Settings,
  CheckCircle,
  XCircle,
  AlertTriangle,
  BarChart3,
  FileText
} from 'lucide-react';
import { WorkflowCard } from '@/components/workflows/WorkflowCard';
import { WorkflowInstanceCard } from '@/components/workflows/WorkflowInstanceCard';
import { useAuth } from '@/stores/auth';
import toast from 'react-hot-toast';
import { workflowService } from '@/services/api/workflowService';

export default function WorkflowsPage() {
  const { hasPermission } = useAuth();
  const [activeTab, setActiveTab] = useState('workflows');

  // Données mockées pour la démonstration
  const workflows = [
    {
      id: '1',
      name: 'Validation Budget CROU',
      description: 'Workflow de validation des budgets pour les CROU',
      module: 'financial' as const,
      type: 'sequential' as const,
      status: 'active' as const,
      entityType: 'Budget',
      triggerEvent: 'create',
      steps: [
        { id: '1', name: 'Soumission', order: 1, type: 'approval', priority: 'medium', role: 'comptable', isRequired: true, canSkip: false, canReject: true, canDelegate: true },
        { id: '2', name: 'Validation Chef Financier', order: 2, type: 'approval', priority: 'high', role: 'chef_financier', isRequired: true, canSkip: false, canReject: true, canDelegate: true },
        { id: '3', name: 'Approbation Directeur', order: 3, type: 'approval', priority: 'critical', role: 'directeur', isRequired: true, canSkip: false, canReject: true, canDelegate: false }
      ],
      instances: [
        { id: '1', status: 'completed', priority: 'high', createdAt: '2024-12-01', completedAt: '2024-12-02' },
        { id: '2', status: 'in_progress', priority: 'medium', createdAt: '2024-12-03' },
        { id: '3', status: 'rejected', priority: 'low', createdAt: '2024-12-04', completedAt: '2024-12-05' }
      ],
      createdAt: '2024-11-01',
      updatedAt: '2024-12-01'
    },
    {
      id: '2',
      name: 'Validation Commande Stocks',
      description: 'Workflow de validation des commandes de stocks',
      module: 'stocks' as const,
      type: 'parallel' as const,
      status: 'active' as const,
      entityType: 'Commande',
      triggerEvent: 'create',
      steps: [
        { id: '1', name: 'Validation Magasinier', order: 1, type: 'approval', priority: 'medium', role: 'magasinier', isRequired: true, canSkip: false, canReject: true, canDelegate: true },
        { id: '2', name: 'Validation Intendant', order: 2, type: 'approval', priority: 'high', role: 'intendant', isRequired: true, canSkip: false, canReject: true, canDelegate: true }
      ],
      instances: [
        { id: '4', status: 'in_progress', priority: 'medium', createdAt: '2024-12-05' },
        { id: '5', status: 'completed', priority: 'low', createdAt: '2024-12-04', completedAt: '2024-12-05' }
      ],
      createdAt: '2024-11-15',
      updatedAt: '2024-12-01'
    }
  ];

  const instances = [
    {
      id: '1',
      title: 'Budget CROU Niamey 2024',
      description: 'Budget annuel pour le CROU de Niamey',
      status: 'in_progress' as const,
      priority: 'high' as const,
      entityType: 'Budget',
      entityId: 'budget-1',
      workflow: { id: '1', name: 'Validation Budget CROU', module: 'financial' },
      currentStep: { id: '2', name: 'Validation Chef Financier', order: 2, type: 'approval', role: 'chef_financier' },
      assignedTo: 'user-1',
      delegatedTo: null,
      initiatedBy: 'user-2',
      createdAt: '2024-12-01T10:00:00Z',
      startedAt: '2024-12-01T10:30:00Z',
      completedAt: null,
      expiredAt: '2024-12-08T10:30:00Z',
      actions: [
        { id: '1', type: 'start', title: 'Démarrage', comment: '', userName: 'Comptable', createdAt: '2024-12-01T10:30:00Z' },
        { id: '2', type: 'approve', title: 'Approbation', comment: 'Budget validé', userName: 'Comptable', createdAt: '2024-12-01T11:00:00Z' }
      ]
    },
    {
      id: '2',
      title: 'Commande Matériel Bureau',
      description: 'Commande de matériel de bureau pour le CROU',
      status: 'pending' as const,
      priority: 'medium' as const,
      entityType: 'Commande',
      entityId: 'commande-1',
      workflow: { id: '2', name: 'Validation Commande Stocks', module: 'stocks' },
      currentStep: null,
      assignedTo: 'user-3',
      delegatedTo: null,
      initiatedBy: 'user-4',
      createdAt: '2024-12-05T14:00:00Z',
      startedAt: '2024-12-05T14:00:00Z',
      completedAt: null,
      expiredAt: null,
      actions: [
        { id: '3', type: 'start', title: 'Démarrage', comment: '', userName: 'Magasinier', createdAt: '2024-12-05T14:00:00Z' }
      ]
    }
  ];

  // Calculer les KPIs
  const totalWorkflows = workflows.length;
  const activeWorkflows = workflows.filter(w => w.status === 'active').length;
  const totalInstances = instances.length;
  const pendingInstances = instances.filter(i => i.status === 'pending' || i.status === 'in_progress').length;
  const completedInstances = instances.filter(i => i.status === 'completed').length;
  const rejectedInstances = instances.filter(i => i.status === 'rejected').length;

  // Handlers
  const handleCreateWorkflow = () => {
    console.log('Créer un workflow');
  };

  const handleViewWorkflow = (id: string) => {
    console.log('Voir le workflow:', id);
  };

  const handleEditWorkflow = (id: string) => {
    console.log('Modifier le workflow:', id);
  };

  const handleActivateWorkflow = async (id: string) => {
    try {
      await workflowService.activateWorkflow(id);
      toast.success('Workflow activé avec succès');
    } catch (error: any) {
      toast.error(error.message || 'Erreur lors de l\'activation');
    }
  };

  const handleDeactivateWorkflow = async (id: string) => {
    try {
      await workflowService.deactivateWorkflow(id);
      toast.success('Workflow désactivé avec succès');
    } catch (error: any) {
      toast.error(error.message || 'Erreur lors de la désactivation');
    }
  };

  const handleConfigureWorkflow = (id: string) => {
    console.log('Configurer le workflow:', id);
  };

  const handleViewInstance = (id: string) => {
    console.log('Voir l\'instance:', id);
  };

  const handleApproveInstance = async (id: string) => {
    try {
      await workflowService.approveInstance(id);
      toast.success('Instance approuvée avec succès');
    } catch (error: any) {
      toast.error(error.message || 'Erreur lors de l\'approbation');
    }
  };

  const handleRejectInstance = async (id: string) => {
    try {
      await workflowService.rejectInstance(id, 'Instance rejetée');
      toast.success('Instance rejetée');
    } catch (error: any) {
      toast.error(error.message || 'Erreur lors du rejet');
    }
  };

  const handleDelegateInstance = (id: string) => {
    console.log('Déléguer l\'instance:', id);
  };

  const handleCommentInstance = (id: string) => {
    console.log('Commenter l\'instance:', id);
  };

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Workflows de Validation</h1>
          <p className="text-gray-600 mt-1">
            Gestion des circuits d'approbation multiniveaux
          </p>
        </div>
        {hasPermission('workflows:write') && (
          <Button onClick={handleCreateWorkflow}>
            <Plus className="w-4 h-4 mr-2" />
            Nouveau workflow
          </Button>
        )}
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total des workflows</CardTitle>
            <Workflow className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalWorkflows}</div>
            <p className="text-xs text-muted-foreground">
              {activeWorkflows} actifs
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Instances en cours</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{pendingInstances}</div>
            <p className="text-xs text-muted-foreground">
              En attente de validation
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Instances terminées</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{completedInstances}</div>
            <p className="text-xs text-muted-foreground">
              {rejectedInstances} rejetées
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taux de completion</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {totalInstances > 0 ? ((completedInstances / totalInstances) * 100).toFixed(1) : 0}%
            </div>
            <p className="text-xs text-muted-foreground">
              Sur {totalInstances} instances
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Contenu principal */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="workflows">Workflows</TabsTrigger>
          <TabsTrigger value="instances">Mes instances</TabsTrigger>
          <TabsTrigger value="all-instances">Toutes les instances</TabsTrigger>
          <TabsTrigger value="reports">Rapports</TabsTrigger>
        </TabsList>

        <TabsContent value="workflows" className="space-y-4">
          {workflows.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Workflow className="h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun workflow</h3>
                <p className="text-gray-500 text-center mb-4">
                  Commencez par créer votre premier workflow
                </p>
                {hasPermission('workflows:write') && (
                  <Button onClick={handleCreateWorkflow}>
                    <Plus className="w-4 h-4 mr-2" />
                    Créer un workflow
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {workflows.map((workflow) => (
                <WorkflowCard
                  key={workflow.id}
                  workflow={workflow}
                  onView={handleViewWorkflow}
                  onEdit={handleEditWorkflow}
                  onActivate={handleActivateWorkflow}
                  onDeactivate={handleDeactivateWorkflow}
                  onConfigure={handleConfigureWorkflow}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="instances" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Mes instances assignées</CardTitle>
            </CardHeader>
            <CardContent>
              {instances.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">Aucune instance assignée</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {instances.map((instance) => (
                    <WorkflowInstanceCard
                      key={instance.id}
                      instance={instance}
                      onView={handleViewInstance}
                      onApprove={handleApproveInstance}
                      onReject={handleRejectInstance}
                      onDelegate={handleDelegateInstance}
                      onComment={handleCommentInstance}
                    />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="all-instances" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Toutes les instances</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {instances.map((instance) => (
                  <WorkflowInstanceCard
                    key={instance.id}
                    instance={instance}
                    onView={handleViewInstance}
                    onApprove={handleApproveInstance}
                    onReject={handleRejectInstance}
                    onDelegate={handleDelegateInstance}
                    onComment={handleCommentInstance}
                  />
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reports" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Rapports de Workflows</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <Button variant="outline" className="h-20 flex flex-col items-center justify-center">
                  <BarChart3 className="h-6 w-6 mb-2" />
                  Performance des workflows
                </Button>
                <Button variant="outline" className="h-20 flex flex-col items-center justify-center">
                  <Clock className="h-6 w-6 mb-2" />
                  Temps de traitement
                </Button>
                <Button variant="outline" className="h-20 flex flex-col items-center justify-center">
                  <FileText className="h-6 w-6 mb-2" />
                  Rapport détaillé
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

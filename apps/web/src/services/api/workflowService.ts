/**
 * FICHIER: apps/web/src/services/api/workflowService.ts
 * SERVICE: API Workflow
 *
 * DESCRIPTION:
 * Service pour gérer les workflows et leurs instances
 *
 * AUTEUR: Équipe CROU
 * DATE: Janvier 2025
 */

import { apiClient } from './apiClient';

const BASE_URL = '/workflows';

export interface Workflow {
  id: string;
  name: string;
  description?: string;
  module: string;
  type: 'sequential' | 'parallel';
  status: 'active' | 'inactive' | 'draft';
  entityType: string;
  triggerEvent: string;
  steps: WorkflowStep[];
  instances?: WorkflowInstance[];
  createdAt: string;
  updatedAt: string;
}

export interface WorkflowStep {
  id: string;
  name: string;
  order: number;
  type: 'approval' | 'review' | 'notification';
  priority: 'low' | 'medium' | 'high' | 'critical';
  role: string;
  isRequired: boolean;
  canSkip: boolean;
  canReject: boolean;
  canDelegate: boolean;
}

export interface WorkflowInstance {
  id: string;
  title: string;
  description?: string;
  status: 'pending' | 'in_progress' | 'completed' | 'rejected' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'critical';
  entityType: string;
  entityId: string;
  workflow: {
    id: string;
    name: string;
    module: string;
  };
  currentStep?: {
    id: string;
    name: string;
    order: number;
    type: string;
    role: string;
  };
  assignedTo?: string;
  delegatedTo?: string | null;
  initiatedBy: string;
  createdAt: string;
  startedAt?: string;
  completedAt?: string | null;
  expiredAt?: string | null;
  actions: WorkflowAction[];
}

export interface WorkflowAction {
  id: string;
  type: 'start' | 'approve' | 'reject' | 'delegate' | 'comment' | 'cancel';
  title: string;
  comment?: string;
  userName: string;
  createdAt: string;
}

export interface ExecuteActionPayload {
  action: 'approve' | 'reject' | 'delegate' | 'cancel';
  comment?: string;
  delegateTo?: string;
}

class WorkflowService {
  /**
   * Récupérer tous les workflows
   */
  async getWorkflows(): Promise<Workflow[]> {
    const response = await apiClient.get(BASE_URL);
    return response.data.data?.workflows || [];
  }

  /**
   * Récupérer un workflow par ID
   */
  async getWorkflow(id: string): Promise<Workflow> {
    const response = await apiClient.get(`${BASE_URL}/${id}`);
    return response.data.data?.workflow;
  }

  /**
   * Créer un nouveau workflow
   */
  async createWorkflow(data: Partial<Workflow>): Promise<Workflow> {
    const response = await apiClient.post(BASE_URL, data);
    return response.data.data?.workflow;
  }

  /**
   * Mettre à jour un workflow
   */
  async updateWorkflow(id: string, data: Partial<Workflow>): Promise<Workflow> {
    const response = await apiClient.put(`${BASE_URL}/${id}`, data);
    return response.data.data?.workflow;
  }

  /**
   * Supprimer un workflow
   */
  async deleteWorkflow(id: string): Promise<void> {
    await apiClient.delete(`${BASE_URL}/${id}`);
  }

  /**
   * Activer un workflow
   */
  async activateWorkflow(id: string): Promise<void> {
    await apiClient.put(`${BASE_URL}/${id}`, { status: 'active' });
  }

  /**
   * Désactiver un workflow
   */
  async deactivateWorkflow(id: string): Promise<void> {
    await apiClient.put(`${BASE_URL}/${id}`, { status: 'inactive' });
  }

  /**
   * Démarrer une instance de workflow
   */
  async startInstance(workflowId: string, data: {
    entityType: string;
    entityId: string;
    title: string;
    description?: string;
    priority?: 'low' | 'medium' | 'high' | 'critical';
  }): Promise<WorkflowInstance> {
    const response = await apiClient.post(`${BASE_URL}/${workflowId}/instances`, data);
    return response.data.data?.instance;
  }

  /**
   * Récupérer une instance de workflow
   */
  async getInstance(instanceId: string): Promise<WorkflowInstance> {
    const response = await apiClient.get(`${BASE_URL}/instances/${instanceId}`);
    return response.data.data?.instance;
  }

  /**
   * Approuver une instance
   */
  async approveInstance(instanceId: string, comment?: string): Promise<void> {
    await apiClient.post(`${BASE_URL}/instances/${instanceId}/actions`, {
      action: 'approve',
      comment
    });
  }

  /**
   * Rejeter une instance
   */
  async rejectInstance(instanceId: string, comment: string): Promise<void> {
    await apiClient.post(`${BASE_URL}/instances/${instanceId}/actions`, {
      action: 'reject',
      comment
    });
  }

  /**
   * Annuler une instance
   */
  async cancelInstance(instanceId: string, comment?: string): Promise<void> {
    await apiClient.post(`${BASE_URL}/instances/${instanceId}/actions`, {
      action: 'cancel',
      comment
    });
  }

  /**
   * Déléguer une instance
   */
  async delegateInstance(instanceId: string, delegateTo: string, comment?: string): Promise<void> {
    await apiClient.post(`${BASE_URL}/instances/${instanceId}/actions`, {
      action: 'delegate',
      delegateTo,
      comment
    });
  }

  /**
   * Exécuter une action sur une instance
   */
  async executeAction(instanceId: string, payload: ExecuteActionPayload): Promise<void> {
    await apiClient.post(`${BASE_URL}/instances/${instanceId}/actions`, payload);
  }
}

export const workflowService = new WorkflowService();

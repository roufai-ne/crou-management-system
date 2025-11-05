/**
 * FICHIER: apps/web/src/pages/financial/TransactionsTab.tsx
 * PAGE: TransactionsTab - Onglet de gestion des transactions
 *
 * DESCRIPTION:
 * Onglet complet pour la gestion des transactions financières
 * Liste, création, édition, workflow de validation
 * Statistiques et filtres avancés
 *
 * AUTEUR: Équipe CROU
 * DATE: Janvier 2025
 */

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Grid, KPICard } from '@/components/ui';
import { TransactionTable } from '@/components/financial/TransactionTable';
import { TransactionForm, TransactionFormData } from '@/components/financial/TransactionForm';
import { TransactionDetailModal } from '@/components/financial/TransactionDetailModal';
import { financialService } from '@/services/financialService';
import { useAuth } from '@/stores/auth';
import {
  TrendingUp,
  TrendingDown,
  Activity,
  DollarSign,
  Plus,
  Download
} from 'lucide-react';
import { formatCurrency } from '@/utils/formatters';
import { toast } from 'react-toastify';

export function TransactionsTab() {
  const { user } = useAuth();

  // États
  const [transactions, setTransactions] = useState<any[]>([]);
  const [budgets, setBudgets] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<any>(null);

  // Charger les données initiales
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    if (!user) return;

    try {
      setLoading(true);

      // Charger transactions, budgets et stats en parallèle
      const [transactionsData, budgetsData, statsData] = await Promise.all([
        financialService.getTransactions('', {
          exercice: new Date().getFullYear()
        }),
        financialService.getBudgets(user, {
          exercice: new Date().getFullYear(),
          statuts: ['active', 'approved']
        }),
        financialService.getTransactionStats()
      ]);

      // S'assurer que les données sont des tableaux
      setTransactions(Array.isArray(transactionsData) ? transactionsData : []);
      setBudgets(Array.isArray(budgetsData) ? budgetsData : []);
      setStats(statsData);
    } catch (error) {
      console.error('Erreur chargement données:', error);
      toast.error('Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  };

  // Créer une transaction
  const handleCreate = async (data: TransactionFormData) => {
    try {
      setSubmitting(true);
      await financialService.createTransaction({
        ...data,
        crouId: user?.crouId,
        createdBy: user?.id || 'unknown',
        statut: 'draft'
      } as any);

      // Recharger les données
      await loadData();

      // Fermer le modal
      setShowCreateModal(false);

      toast.success('Transaction créée avec succès');
    } catch (error: any) {
      console.error('Erreur création transaction:', error);
      toast.error(error.message || 'Erreur lors de la création de la transaction');
    } finally {
      setSubmitting(false);
    }
  };

  // Éditer une transaction
  const handleEdit = async (data: TransactionFormData) => {
    if (!selectedTransaction) return;

    try {
      setSubmitting(true);
      await financialService.updateTransaction(selectedTransaction.id, data as any);

      // Recharger les données
      await loadData();

      // Fermer le modal
      setShowEditModal(false);
      setSelectedTransaction(null);

      toast.success('Transaction modifiée avec succès');
    } catch (error: any) {
      console.error('Erreur mise à jour transaction:', error);
      toast.error(error.message || 'Erreur lors de la mise à jour de la transaction');
    } finally {
      setSubmitting(false);
    }
  };

  // Voir les détails
  const handleView = async (id: string) => {
    try {
      const transaction = await financialService.getTransaction(id);
      setSelectedTransaction(transaction);
      setShowDetailModal(true);
    } catch (error) {
      console.error('Erreur chargement transaction:', error);
      alert('Erreur lors du chargement de la transaction');
    }
  };

  // Ouvrir le modal d'édition
  const handleEditClick = async (id: string) => {
    try {
      const transaction = await financialService.getTransaction(id);
      setSelectedTransaction(transaction);
      setShowDetailModal(false);
      setShowEditModal(true);
    } catch (error) {
      console.error('Erreur chargement transaction:', error);
      alert('Erreur lors du chargement de la transaction');
    }
  };

  // Supprimer une transaction
  const handleDelete = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette transaction ?')) {
      return;
    }

    try {
      setSubmitting(true);
      await financialService.deleteTransaction(id);

      // Recharger les données
      await loadData();

      // Fermer le modal de détail si ouvert
      if (showDetailModal) {
        setShowDetailModal(false);
        setSelectedTransaction(null);
      }

      toast.success('Transaction supprimée avec succès');
    } catch (error: any) {
      console.error('Erreur suppression transaction:', error);
      toast.error(error.message || 'Erreur lors de la suppression de la transaction');
    } finally {
      setSubmitting(false);
    }
  };

  // Soumettre une transaction
  const handleSubmit = async (id: string) => {
    try {
      setSubmitting(true);
      await financialService.submitTransaction(id);

      // Recharger les données
      await loadData();

      // Recharger la transaction dans le modal
      if (showDetailModal) {
        const transaction = await financialService.getTransaction(id);
        setSelectedTransaction(transaction);
      }

      toast.success('Transaction soumise avec succès');
    } catch (error: any) {
      console.error('Erreur soumission transaction:', error);
      toast.error(error.message || 'Erreur lors de la soumission de la transaction');
    } finally {
      setSubmitting(false);
    }
  };

  // Approuver une transaction
  const handleApprove = async (id: string) => {
    try {
      setSubmitting(true);
      await financialService.approveTransaction(id);

      // Recharger les données
      await loadData();

      // Recharger la transaction dans le modal
      if (showDetailModal) {
        const transaction = await financialService.getTransaction(id);
        setSelectedTransaction(transaction);
      }

      toast.success('Transaction approuvée avec succès');
    } catch (error: any) {
      console.error('Erreur approbation transaction:', error);
      toast.error(error.message || 'Erreur lors de l\'approbation de la transaction');
    } finally {
      setSubmitting(false);
    }
  };

  // Rejeter une transaction
  const handleReject = async (id: string, reason: string) => {
    try {
      setSubmitting(true);
      await financialService.rejectTransaction(id, reason);

      // Recharger les données
      await loadData();

      // Recharger la transaction dans le modal
      if (showDetailModal) {
        const transaction = await financialService.getTransaction(id);
        setSelectedTransaction(transaction);
      }

      toast.success('Transaction rejetée avec succès');
    } catch (error: any) {
      console.error('Erreur rejet transaction:', error);
      toast.error(error.message || 'Erreur lors du rejet de la transaction');
    } finally {
      setSubmitting(false);
    }
  };

  // Exécuter une transaction
  const handleExecute = async (id: string) => {
    try {
      setSubmitting(true);
      await financialService.executeTransaction(id);

      // Recharger les données
      await loadData();

      // Recharger la transaction dans le modal
      if (showDetailModal) {
        const transaction = await financialService.getTransaction(id);
        setSelectedTransaction(transaction);
      }

      toast.success('Transaction exécutée avec succès');
    } catch (error: any) {
      console.error('Erreur exécution transaction:', error);
      toast.error(error.message || 'Erreur lors de l\'exécution de la transaction');
    } finally {
      setSubmitting(false);
    }
  };

  // Exporter les transactions
  const handleExport = () => {
    // TODO: Implémenter l'export
    alert('Fonction d\'export à implémenter');
  };

  // Calculer les statistiques locales
  const calculateLocalStats = () => {
    const totalDepenses = transactions
      .filter(t => ['depense', 'engagement'].includes(t.type) && t.status === 'executed')
      .reduce((sum, t) => sum + t.montant, 0);

    const totalRecettes = transactions
      .filter(t => t.type === 'recette' && t.status === 'executed')
      .reduce((sum, t) => sum + t.montant, 0);

    const enAttente = transactions.filter(t => t.status === 'submitted').length;

    return {
      totalDepenses,
      totalRecettes,
      solde: totalRecettes - totalDepenses,
      enAttente
    };
  };

  const localStats = calculateLocalStats();

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <Grid cols={4} gap={6}>
        <KPICard
          title="Dépenses totales"
          value={formatCurrency(localStats.totalDepenses)}
          change="+0%"
          trend="neutral"
          icon={<TrendingDown className="h-6 w-6" />}
        />
        <KPICard
          title="Recettes totales"
          value={formatCurrency(localStats.totalRecettes)}
          change="+0%"
          trend="neutral"
          icon={<TrendingUp className="h-6 w-6" />}
        />
        <KPICard
          title="Solde net"
          value={formatCurrency(localStats.solde)}
          change="+0%"
          trend={localStats.solde >= 0 ? 'up' : 'down'}
          icon={<DollarSign className="h-6 w-6" />}
        />
        <KPICard
          title="En attente"
          value={localStats.enAttente.toString()}
          change="+0%"
          trend="neutral"
          icon={<Activity className="h-6 w-6" />}
        />
      </Grid>

      {/* Tableau des transactions */}
      <Card>
        <Card.Content className="p-0">
          <TransactionTable
            transactions={transactions}
            loading={loading}
            onView={handleView}
            onEdit={handleEditClick}
            onValidate={handleApprove}
            onReject={(id) => {
              // Ouvrir le modal de détail avec le formulaire de rejet
              handleView(id);
            }}
            onExport={handleExport}
            onAdd={() => setShowCreateModal(true)}
          />
        </Card.Content>
      </Card>

      {/* Modal de création */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        size="lg"
        title="Nouvelle transaction"
      >
        <TransactionForm
          budgets={budgets}
          onSubmit={handleCreate}
          onCancel={() => setShowCreateModal(false)}
          loading={submitting}
          mode="create"
        />
      </Modal>

      {/* Modal d'édition */}
      <Modal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setSelectedTransaction(null);
        }}
        size="lg"
        title="Modifier la transaction"
      >
        {selectedTransaction && (
          <TransactionForm
            initialData={selectedTransaction}
            budgets={budgets}
            onSubmit={handleEdit}
            onCancel={() => {
              setShowEditModal(false);
              setSelectedTransaction(null);
            }}
            loading={submitting}
            mode="edit"
          />
        )}
      </Modal>

      {/* Modal de détail */}
      <TransactionDetailModal
        isOpen={showDetailModal}
        onClose={() => {
          setShowDetailModal(false);
          setSelectedTransaction(null);
        }}
        transaction={selectedTransaction}
        onEdit={handleEditClick}
        onDelete={handleDelete}
        onSubmit={handleSubmit}
        onApprove={handleApprove}
        onReject={handleReject}
        onExecute={handleExecute}
        loading={submitting}
      />
    </div>
  );
}

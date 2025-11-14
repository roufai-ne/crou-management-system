/**
 * FICHIER: apps/web/src/components/financial/TransactionDetailModal.tsx
 * COMPOSANT: TransactionDetailModal - Modal de détail de transaction
 *
 * DESCRIPTION:
 * Modal pour afficher les détails complets d'une transaction
 * Actions de workflow (soumettre, approuver, rejeter, exécuter)
 * Historique et informations complètes
 *
 * AUTEUR: Équipe CROU
 * DATE: Janvier 2025
 */

import React, { useState } from 'react';
import { Modal, ModalBody, ModalFooter, ModalHeader } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import {
  CheckCircle,
  XCircle,
  Send,
  Edit,
  Trash2,
  FileText,
  Calendar,
  DollarSign,
  User,
  Building,
  Tag
} from 'lucide-react';
import { formatCurrency, formatDate } from '@/utils/formatters';
import { useAuth } from '@/stores/auth';

// Interface pour les données de transaction
interface TransactionData {
  id: string;
  libelle: string;
  description?: string;
  type: 'depense' | 'recette' | 'engagement' | 'ajustement' | 'virement';
  category: string;
  montant: number;
  date: string;
  status: 'draft' | 'submitted' | 'approved' | 'rejected' | 'executed' | 'cancelled';
  beneficiaire?: string;
  fournisseur?: string;
  pieceJustificative?: string;
  budget?: {
    id: string;
    libelle: string;
  };
  createdBy: string;
  createdAt: string;
  updatedAt?: string;
  approvedBy?: string;
  approvedAt?: string;
  rejectionReason?: string;
}

export interface TransactionDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  transaction: TransactionData | null;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
  onSubmit?: (id: string) => void;
  onApprove?: (id: string) => void;
  onReject?: (id: string, reason: string) => void;
  onExecute?: (id: string) => void;
  loading?: boolean;
}

export function TransactionDetailModal({
  isOpen,
  onClose,
  transaction,
  onEdit,
  onDelete,
  onSubmit,
  onApprove,
  onReject,
  onExecute,
  loading = false
}: TransactionDetailModalProps) {
  const { hasPermission } = useAuth();
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  if (!transaction) return null;

  // Configuration des types
  const typeConfig: Record<string, { label: string; color: string; icon: string }> = {
    depense: { label: 'Dépense', color: 'red', icon: '↓' },
    recette: { label: 'Recette', color: 'green', icon: '↑' },
    engagement: { label: 'Engagement', color: 'orange', icon: '⏳' },
    ajustement: { label: 'Ajustement', color: 'blue', icon: '↔' },
    virement: { label: 'Virement', color: 'purple', icon: '↔' }
  };

  // Configuration des statuts
  const statusConfig: Record<string, { label: string; color: string }> = {
    draft: { label: 'Brouillon', color: 'gray' },
    submitted: { label: 'Soumis', color: 'blue' },
    approved: { label: 'Approuvé', color: 'green' },
    rejected: { label: 'Rejeté', color: 'red' },
    executed: { label: 'Exécuté', color: 'green' },
    cancelled: { label: 'Annulé', color: 'gray' }
  };

  const currentType = typeConfig[transaction.type];
  const currentStatus = statusConfig[transaction.status];

  const handleReject = () => {
    if (rejectReason.trim() && onReject) {
      onReject(transaction.id, rejectReason);
      setShowRejectModal(false);
      setRejectReason('');
    }
  };

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose} size="lg">
        <ModalHeader onClose={onClose}>
          <div className="flex items-center justify-between w-full">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Détail de la transaction
            </h2>
            <div className="flex items-center gap-2">
              <Badge variant={currentType.color as any}>
                {currentType.icon} {currentType.label}
              </Badge>
              <Badge variant={currentStatus.color as any}>{currentStatus.label}</Badge>
            </div>
          </div>
        </ModalHeader>

        <ModalBody>
          <div className="space-y-6">
            {/* Informations principales */}
            <Card>
              <Card.Header>
                <Card.Title>Informations générales</Card.Title>
              </Card.Header>
              <Card.Content>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-500 flex items-center gap-2">
                        <FileText className="w-4 h-4" />
                        Libellé
                      </label>
                      <p className="mt-1 text-base text-gray-900 dark:text-white">{transaction.libelle}</p>
                    </div>

                    <div>
                      <label className="text-sm font-medium text-gray-500 flex items-center gap-2">
                        <DollarSign className="w-4 h-4" />
                        Montant
                      </label>
                      <p
                        className={`mt-1 text-base font-semibold ${
                          ['depense', 'engagement'].includes(transaction.type)
                            ? 'text-red-600'
                            : 'text-green-600'
                        }`}
                      >
                        {formatCurrency(transaction.montant)}
                      </p>
                    </div>
                  </div>

                  {transaction.description && (
                    <div>
                      <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Description</label>
                      <p className="mt-1 text-base text-gray-900 dark:text-white">{transaction.description}</p>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-500 flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        Date
                      </label>
                      <p className="mt-1 text-base text-gray-900 dark:text-white">
                        {formatDate(transaction.date)}
                      </p>
                    </div>

                    <div>
                      <label className="text-sm font-medium text-gray-500 flex items-center gap-2">
                        <Tag className="w-4 h-4" />
                        Catégorie
                      </label>
                      <p className="mt-1 text-base text-gray-900 capitalize">
                        {transaction.category}
                      </p>
                    </div>
                  </div>

                  {transaction.budget && (
                    <div>
                      <label className="text-sm font-medium text-gray-500 flex items-center gap-2">
                        <Building className="w-4 h-4" />
                        Budget
                      </label>
                      <p className="mt-1 text-base text-blue-600">
                        {transaction.budget.libelle}
                      </p>
                    </div>
                  )}
                </div>
              </Card.Content>
            </Card>

            {/* Parties prenantes */}
            {(transaction.beneficiaire || transaction.fournisseur) && (
              <Card>
                <Card.Header>
                  <Card.Title>Parties prenantes</Card.Title>
                </Card.Header>
                <Card.Content>
                  <div className="grid grid-cols-2 gap-4">
                    {transaction.beneficiaire && (
                      <div>
                        <label className="text-sm font-medium text-gray-500 flex items-center gap-2">
                          <User className="w-4 h-4" />
                          Bénéficiaire
                        </label>
                        <p className="mt-1 text-base text-gray-900 dark:text-white">{transaction.beneficiaire}</p>
                      </div>
                    )}

                    {transaction.fournisseur && (
                      <div>
                        <label className="text-sm font-medium text-gray-500 flex items-center gap-2">
                          <Building className="w-4 h-4" />
                          Fournisseur
                        </label>
                        <p className="mt-1 text-base text-gray-900 dark:text-white">{transaction.fournisseur}</p>
                      </div>
                    )}
                  </div>
                </Card.Content>
              </Card>
            )}

            {/* Justificatifs */}
            {transaction.pieceJustificative && (
              <Card>
                <Card.Header>
                  <Card.Title>Documents justificatifs</Card.Title>
                </Card.Header>
                <Card.Content>
                  <div>
                    <label className="text-sm font-medium text-gray-500 flex items-center gap-2">
                      <FileText className="w-4 h-4" />
                      Pièce justificative
                    </label>
                    <p className="mt-1 text-base text-gray-900 dark:text-white">
                      {transaction.pieceJustificative}
                    </p>
                  </div>
                </Card.Content>
              </Card>
            )}

            {/* Historique */}
            <Card>
              <Card.Header>
                <Card.Title>Historique</Card.Title>
              </Card.Header>
              <Card.Content>
                <div className="space-y-3">
                  <div className="flex items-start gap-3 text-sm">
                    <div className="w-2 h-2 mt-1.5 rounded-full bg-blue-500" />
                    <div className="flex-1">
                      <p className="text-gray-900 dark:text-white">
                        Créé par <span className="font-medium">{transaction.createdBy}</span>
                      </p>
                      <p className="text-gray-500 dark:text-gray-400">{formatDate(transaction.createdAt)}</p>
                    </div>
                  </div>

                  {transaction.updatedAt && (
                    <div className="flex items-start gap-3 text-sm">
                      <div className="w-2 h-2 mt-1.5 rounded-full bg-orange-500" />
                      <div className="flex-1">
                        <p className="text-gray-900 dark:text-white">Dernière modification</p>
                        <p className="text-gray-500 dark:text-gray-400">{formatDate(transaction.updatedAt)}</p>
                      </div>
                    </div>
                  )}

                  {transaction.approvedAt && transaction.approvedBy && (
                    <div className="flex items-start gap-3 text-sm">
                      <div className="w-2 h-2 mt-1.5 rounded-full bg-green-500" />
                      <div className="flex-1">
                        <p className="text-gray-900 dark:text-white">
                          Approuvé par <span className="font-medium">{transaction.approvedBy}</span>
                        </p>
                        <p className="text-gray-500 dark:text-gray-400">{formatDate(transaction.approvedAt)}</p>
                      </div>
                    </div>
                  )}

                  {transaction.status === 'rejected' && transaction.rejectionReason && (
                    <div className="flex items-start gap-3 text-sm">
                      <div className="w-2 h-2 mt-1.5 rounded-full bg-red-500" />
                      <div className="flex-1">
                        <p className="text-gray-900 font-medium">Raison du rejet</p>
                        <p className="text-red-600">{transaction.rejectionReason}</p>
                      </div>
                    </div>
                  )}
                </div>
              </Card.Content>
            </Card>
          </div>
        </ModalBody>

        <ModalFooter align="between">
          <div className="flex items-center gap-2">
            {/* Actions selon le statut */}
            {transaction.status === 'draft' && hasPermission('financial:write') && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onEdit?.(transaction.id)}
                  disabled={loading}
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Modifier
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onSubmit?.(transaction.id)}
                  disabled={loading}
                >
                  <Send className="w-4 h-4 mr-2" />
                  Soumettre
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onDelete?.(transaction.id)}
                  disabled={loading}
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Supprimer
                </Button>
              </>
            )}

            {transaction.status === 'submitted' && hasPermission('financial:validate') && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onApprove?.(transaction.id)}
                  disabled={loading}
                  className="text-green-600 hover:text-green-700"
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Approuver
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowRejectModal(true)}
                  disabled={loading}
                  className="text-red-600 hover:text-red-700"
                >
                  <XCircle className="w-4 h-4 mr-2" />
                  Rejeter
                </Button>
              </>
            )}

            {transaction.status === 'approved' && hasPermission('financial:execute') && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onExecute?.(transaction.id)}
                disabled={loading}
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Exécuter
              </Button>
            )}
          </div>

          <Button variant="outline" onClick={onClose}>
            Fermer
          </Button>
        </ModalFooter>
      </Modal>

      {/* Modal de rejet */}
      <Modal
        isOpen={showRejectModal}
        onClose={() => setShowRejectModal(false)}
        size="sm"
        title="Rejeter la transaction"
      >
        <ModalBody>
          <div className="space-y-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Veuillez indiquer la raison du rejet de cette transaction.
            </p>
            <textarea
              value={rejectReason}
              onChange={e => setRejectReason(e.target.value)}
              placeholder="Raison du rejet..."
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
        </ModalBody>
        <ModalFooter>
          <Button variant="outline" onClick={() => setShowRejectModal(false)}>
            Annuler
          </Button>
          <Button
            onClick={handleReject}
            disabled={!rejectReason.trim() || loading}
            className="bg-red-600 hover:bg-red-700"
          >
            Confirmer le rejet
          </Button>
        </ModalFooter>
      </Modal>
    </>
  );
}

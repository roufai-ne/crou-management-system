/**
 * FICHIER: apps/web/src/pages/examples/Sprint3Demo.tsx
 * PAGE: Démonstration des composants Sprint 3
 * 
 * DESCRIPTION:
 * Page de démonstration complète des composants créés dans Sprint 3:
 * - ModernTable avec tri/filtres/pagination
 * - ModernModal avec animations
 * - ModernDrawer (4 positions)
 * - ModernToast (5 variantes + actions)
 * - LoadingSkeleton (5 types)
 * 
 * AUTEUR: Équipe CROU
 * DATE: Décembre 2024
 */

import React, { useState } from 'react';
import { ModernTable, Column } from '@/components/ui/ModernTable';
import { ModernModal } from '@/components/ui/ModernModal';
import { ModernDrawer } from '@/components/ui/ModernDrawer';
import { ModernToaster, modernToast } from '@/components/ui/ModernToast';
import {
  TableSkeleton,
  CardSkeleton,
  ListSkeleton,
  FormSkeleton,
  DashboardSkeleton
} from '@/components/ui/LoadingSkeleton';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { User, Mail, Phone, MapPin, Calendar } from 'lucide-react';

interface Student {
  id: string;
  nom: string;
  prenom: string;
  email: string;
  telephone: string;
  ville: string;
  statut: 'actif' | 'inactif' | 'suspendu';
  dateInscription: string;
}

export default function Sprint3Demo() {
  // États pour les modals/drawers
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [drawerPosition, setDrawerPosition] = useState<'left' | 'right' | 'top' | 'bottom'>('right');
  const [modalSize, setModalSize] = useState<'sm' | 'md' | 'lg' | 'xl' | 'full'>('md');

  // État pour skeleton demo
  const [isLoading, setIsLoading] = useState(false);
  const [skeletonType, setSkeletonType] = useState<'table' | 'card' | 'list' | 'form' | 'dashboard'>('table');

  // Données de démonstration pour la table
  const students: Student[] = [
    {
      id: '001',
      nom: 'Diallo',
      prenom: 'Amadou',
      email: 'amadou.diallo@crou.ne',
      telephone: '+227 90 12 34 56',
      ville: 'Niamey',
      statut: 'actif',
      dateInscription: '2024-09-15'
    },
    {
      id: '002',
      nom: 'Sani',
      prenom: 'Fati',
      email: 'fati.sani@crou.ne',
      telephone: '+227 91 23 45 67',
      ville: 'Zinder',
      statut: 'actif',
      dateInscription: '2024-09-10'
    },
    {
      id: '003',
      nom: 'Moussa',
      prenom: 'Ibrahim',
      email: 'ibrahim.moussa@crou.ne',
      telephone: '+227 92 34 56 78',
      ville: 'Maradi',
      statut: 'suspendu',
      dateInscription: '2024-08-20'
    },
    {
      id: '004',
      nom: 'Halima',
      prenom: 'Aïcha',
      email: 'aicha.halima@crou.ne',
      telephone: '+227 93 45 67 89',
      ville: 'Niamey',
      statut: 'actif',
      dateInscription: '2024-09-18'
    },
    {
      id: '005',
      nom: 'Abdoulaye',
      prenom: 'Issoufou',
      email: 'issoufou.abdoulaye@crou.ne',
      telephone: '+227 94 56 78 90',
      ville: 'Tahoua',
      statut: 'inactif',
      dateInscription: '2024-07-05'
    },
    {
      id: '006',
      nom: 'Mariama',
      prenom: 'Hadiza',
      email: 'hadiza.mariama@crou.ne',
      telephone: '+227 95 67 89 01',
      ville: 'Dosso',
      statut: 'actif',
      dateInscription: '2024-09-12'
    }
  ];

  // Configuration des colonnes
  const columns: Column<Student>[] = [
    {
      key: 'id',
      header: 'ID',
      width: '80px'
    },
    {
      key: 'nom',
      header: 'Nom',
      sortable: true,
      filterable: true,
      width: '150px'
    },
    {
      key: 'prenom',
      header: 'Prénom',
      sortable: true,
      filterable: true,
      width: '150px'
    },
    {
      key: 'email',
      header: 'Email',
      filterable: true,
      render: (value) => (
        <div className="flex items-center gap-2">
          <Mail className="w-4 h-4 text-gray-400" strokeWidth={2} />
          <span className="text-sm">{value}</span>
        </div>
      )
    },
    {
      key: 'ville',
      header: 'Ville',
      sortable: true,
      filterable: true,
      width: '120px',
      render: (value) => (
        <div className="flex items-center gap-2">
          <MapPin className="w-4 h-4 text-gray-400" strokeWidth={2} />
          <span className="text-sm">{value}</span>
          <span className="text-sm">{new Date(value).toLocaleDateString('fr-FR')}</span>
        </div>
      )
    }
  ];

  // État pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedRows, setSelectedRows] = useState<Student[]>([]);

  // Handlers pour skeleton demo
  const simulateLoading = () => {
    setIsLoading(true);
    setTimeout(() => setIsLoading(false), 3000);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <ModernToaster />

      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
          <h1 className="text-3xl font-bold bg-gradient-crou bg-clip-text text-transparent mb-2">
            Sprint 3 - Démonstration Complète
          </h1>
          <p className="text-gray-600">
            Tables, Modals, Drawers, Toasts et Skeletons modernes avec identité Niger
          </p>
        </div>

        {/* Section 1: ModernTable */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">1. ModernTable</h2>
          <p className="text-gray-600 mb-6">
            Table avec tri sur colonnes, filtres inline, pagination et sélection de lignes
          </p>

          <ModernTable
            data={students}
            columns={columns}
            selectable
            onSelectionChange={setSelectedRows}
            variant="gradient-crou"
            pagination={{
              pageSize: 4,
              currentPage,
              onPageChange: setCurrentPage
            }}
          />

          {selectedRows.length > 0 && (
            <div className="mt-4 p-4 bg-primary-50 rounded-lg border border-primary-200">
              <p className="text-sm font-medium text-primary-900">
                {selectedRows.length} ligne(s) sélectionnée(s)
              </p>
            </div>
          )}
        </div>

        {/* Section 2: ModernModal */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">2. ModernModal</h2>
          <p className="text-gray-600 mb-6">
            Modal avec animations Framer Motion, backdrop blur et 5 tailles
          </p>

          <div className="flex flex-wrap gap-3 mb-4">
            {(['sm', 'md', 'lg', 'xl', 'full'] as const).map((size) => (
              <Button
                key={size}
                variant="outline"
                onClick={() => {
                  setModalSize(size);
                  setIsModalOpen(true);
                }}
              >
                Modal {size.toUpperCase()}
              </Button>
            ))}
          </div>

          <ModernModal
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            title="Détails de l'étudiant"
            size={modalSize}
            footer={
              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setIsModalOpen(false)}>
                  Annuler
                </Button>
                <Button variant="gradient" onClick={() => setIsModalOpen(false)}>
                  Confirmer
                </Button>
              </div>
            }
          >
            <div className="space-y-4">
              <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                <div className="w-16 h-16 bg-gradient-crou rounded-full flex items-center justify-center">
                  <User className="w-8 h-8 text-white" strokeWidth={2} />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Amadou Diallo</h3>
                  <p className="text-sm text-gray-600">Étudiant CROU Niamey</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">Email</label>
                  <p className="text-sm text-gray-900">amadou.diallo@crou.ne</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Téléphone</label>
                  <p className="text-sm text-gray-900">+227 90 12 34 56</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Ville</label>
                  <p className="text-sm text-gray-900">Niamey</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Statut</label>
                  <Badge variant="success">Actif</Badge>
                </div>
              </div>
            </div>
          </ModernModal>
        </div>

        {/* Section 3: ModernDrawer */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">3. ModernDrawer</h2>
          <p className="text-gray-600 mb-6">
            Drawer avec 4 positions (left/right/top/bottom) et animations directionnelles
          </p>

          <div className="flex flex-wrap gap-3 mb-4">
            {(['left', 'right', 'top', 'bottom'] as const).map((pos) => (
              <Button
                key={pos}
                variant="outline"
                onClick={() => {
                  setDrawerPosition(pos);
                  setIsDrawerOpen(true);
                }}
              >
                Drawer {pos}
              </Button>
            ))}
          </div>

          <ModernDrawer
            isOpen={isDrawerOpen}
            onClose={() => setIsDrawerOpen(false)}
            title="Menu de navigation"
            position={drawerPosition}
            size="md"
            footer={
              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setIsDrawerOpen(false)} className="flex-1">
                  Fermer
                </Button>
                <Button variant="gradient" className="flex-1">
                  Appliquer
                </Button>
              </div>
            }
          >
            <div className="space-y-4">
              <p className="text-gray-600">
                Ce drawer s'ouvre depuis la position <strong>{drawerPosition}</strong>.
              </p>

              <div className="space-y-2">
                {['Dashboard', 'Finances', 'Logements', 'Transport', 'Stocks'].map((item) => (
                  <button
                    key={item}
                    className="w-full text-left px-4 py-3 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>
          </ModernDrawer>
        </div>

        {/* Section 4: ModernToast */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">4. ModernToast</h2>
          <p className="text-gray-600 mb-6">
            Notifications avec 5 variantes, boutons d'action et support des promesses
          </p>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <Button
              variant="primary"
              onClick={() => modernToast.success('Opération réussie avec succès!')}
            >
              Success Toast
            </Button>

            <Button
              variant="danger"
              onClick={() => modernToast.error('Une erreur est survenue!')}
            >
              Error Toast
            </Button>

            <Button
              variant="warning"
              onClick={() => modernToast.warning('Attention: action à confirmer')}
            >
              Warning Toast
            </Button>

            <Button
              variant="outline"
              onClick={() => modernToast.info('Information importante à lire')}
            >
              Info Toast
            </Button>

            <Button
              variant="gradient"
              onClick={() => modernToast.gradientCrou('Niger CROU - Opération validée!')}
            >
              Gradient CROU Toast
            </Button>

            <Button
              variant="outline"
              onClick={() => modernToast.withAction(
                'Étudiant supprimé',
                'Annuler',
                () => alert('Action annulée!')
              )}
            >
              Toast avec Action
            </Button>
          </div>
        </div>

        {/* Section 5: LoadingSkeleton */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">5. LoadingSkeleton</h2>
          <p className="text-gray-600 mb-6">
            Skeletons avec effet shimmer pour 5 types de contenu
          </p>

          <div className="flex flex-wrap gap-3 mb-6">
            {(['table', 'card', 'list', 'form', 'dashboard'] as const).map((type) => (
              <Button
                key={type}
                variant={skeletonType === type ? 'gradient' : 'outline'}
                onClick={() => setSkeletonType(type)}
              >
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </Button>
            ))}

            <Button
              variant="primary"
              onClick={simulateLoading}
              disabled={isLoading}
            >
              {isLoading ? 'Chargement...' : 'Simuler Chargement'}
            </Button>
          </div>

          <div className="border border-gray-200 rounded-lg p-6 bg-gray-50">
            {isLoading ? (
              <>
                {skeletonType === 'table' && <TableSkeleton rows={5} columns={4} />}
                {skeletonType === 'card' && <CardSkeleton withImage rows={3} />}
                {skeletonType === 'list' && <ListSkeleton items={5} />}
                {skeletonType === 'form' && <FormSkeleton fields={4} />}
                {skeletonType === 'dashboard' && <DashboardSkeleton />}
              </>
            ) : (
              <div className="text-center py-12 text-gray-500">
                Cliquez sur "Simuler Chargement" pour voir le skeleton {skeletonType}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gradient-crou rounded-xl shadow-sm p-8 text-white text-center">
          <h3 className="text-xl font-bold mb-2">Sprint 3 Complété ✅</h3>
          <p className="opacity-90">
            Tous les composants sont fonctionnels et prêts à l'utilisation
          </p>
        </div>
      </div>
    </div>
  );
}

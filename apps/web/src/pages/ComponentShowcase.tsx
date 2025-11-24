import React from 'react';
import { 
  Plus, 
  Save, 
  Trash2, 
  Download, 
  Upload, 
  Search,
  Check,
  X,
  AlertCircle,
  Info,
  Bell,
  Settings,
  ChevronRight
} from 'lucide-react';
import { ModernButton, ModernIconButton, ModernButtonGroup } from '@/components/ui/ModernButton';
import { ModernBadge, ModernBadgeGroup, StatusBadge, CounterBadge } from '@/components/ui/ModernBadge';

/**
 * ComponentShowcase - Démonstration des composants Button et Badge
 * 
 * Page de test pour valider les nouveaux composants modernes
 * avec identité Niger (Vert #059669 + Orange #ea580c)
 */
const ComponentShowcase: React.FC = () => {
  const [loading, setLoading] = React.useState(false);
  
  const handleClick = () => {
    setLoading(true);
    setTimeout(() => setLoading(false), 2000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-8">
      <div className="max-w-7xl mx-auto space-y-12">
        {/* Header */}
        <div className="text-center space-y-3">
          <h1 className="text-4xl font-bold bg-gradient-crou bg-clip-text text-transparent">
            Composants Modernes CROU
          </h1>
          <p className="text-gray-600 text-lg">
            Système de design avec identité Niger • Sprint 1 Phase Finale
          </p>
        </div>

        {/* ============================================ */}
        {/* BUTTONS */}
        {/* ============================================ */}
        <section className="bg-white rounded-2xl shadow-card-hover p-8 space-y-8">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Boutons Modernes</h2>
            <p className="text-gray-600">Variants avec gradient Niger et effets hover</p>
          </div>

          {/* Button Variants */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-800">Variants</h3>
            <div className="flex flex-wrap gap-3">
              <ModernButton variant="primary">Primary</ModernButton>
              <ModernButton variant="accent">Accent</ModernButton>
              <ModernButton variant="gradient-crou">Gradient CROU</ModernButton>
              <ModernButton variant="outline">Outline</ModernButton>
              <ModernButton variant="ghost">Ghost</ModernButton>
              <ModernButton variant="danger">Danger</ModernButton>
            </div>
          </div>

          {/* Button Sizes */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-800">Tailles</h3>
            <div className="flex flex-wrap items-center gap-3">
              <ModernButton variant="gradient-crou" size="sm">Small</ModernButton>
              <ModernButton variant="gradient-crou" size="md">Medium</ModernButton>
              <ModernButton variant="gradient-crou" size="lg">Large</ModernButton>
            </div>
          </div>

          {/* Buttons with Icons */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-800">Avec Icônes</h3>
            <div className="flex flex-wrap gap-3">
              <ModernButton variant="gradient-crou" icon={Plus} iconPosition="left">
                Ajouter
              </ModernButton>
              <ModernButton variant="primary" icon={Save} iconPosition="left">
                Sauvegarder
              </ModernButton>
              <ModernButton variant="accent" icon={Download} iconPosition="left">
                Télécharger
              </ModernButton>
              <ModernButton variant="outline" icon={Search} iconPosition="left">
                Rechercher
              </ModernButton>
              <ModernButton variant="danger" icon={Trash2} iconPosition="left">
                Supprimer
              </ModernButton>
              <ModernButton variant="ghost" icon={ChevronRight} iconPosition="right">
                Suivant
              </ModernButton>
            </div>
          </div>

          {/* Loading State */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-800">État de Chargement</h3>
            <div className="flex flex-wrap gap-3">
              <ModernButton variant="gradient-crou" loading={loading} onClick={handleClick}>
                {loading ? 'Chargement...' : 'Cliquer pour charger'}
              </ModernButton>
              <ModernButton variant="primary" loading>
                Sauvegarde en cours...
              </ModernButton>
            </div>
          </div>

          {/* Icon Buttons */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-800">Boutons Icône</h3>
            <div className="flex flex-wrap items-center gap-3">
              <ModernIconButton icon={Plus} variant="gradient-crou" aria-label="Ajouter" />
              <ModernIconButton icon={Settings} variant="primary" aria-label="Paramètres" />
              <ModernIconButton icon={Bell} variant="accent" aria-label="Notifications" />
              <ModernIconButton icon={Search} variant="outline" aria-label="Rechercher" />
              <ModernIconButton icon={Trash2} variant="danger" size="sm" aria-label="Supprimer" />
            </div>
          </div>

          {/* Button Groups */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-800">Groupes de Boutons</h3>
            <div className="space-y-3">
              <ModernButtonGroup>
                <ModernButton variant="outline">Jour</ModernButton>
                <ModernButton variant="outline">Semaine</ModernButton>
                <ModernButton variant="gradient-crou">Mois</ModernButton>
                <ModernButton variant="outline">Année</ModernButton>
              </ModernButtonGroup>
              
              <ModernButtonGroup orientation="vertical">
                <ModernButton variant="outline" icon={Download}>Export PDF</ModernButton>
                <ModernButton variant="outline" icon={Download}>Export Excel</ModernButton>
                <ModernButton variant="outline" icon={Download}>Export CSV</ModernButton>
              </ModernButtonGroup>
            </div>
          </div>

          {/* Full Width */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-800">Largeur Pleine</h3>
            <ModernButton variant="gradient-crou" icon={Upload} fullWidth>
              Téléverser un fichier
            </ModernButton>
          </div>
        </section>

        {/* ============================================ */}
        {/* BADGES */}
        {/* ============================================ */}
        <section className="bg-white rounded-2xl shadow-card-hover p-8 space-y-8">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Badges Modernes</h2>
            <p className="text-gray-600">Variants avec effets glow et points indicateurs</p>
          </div>

          {/* Badge Variants */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-800">Variants</h3>
            <ModernBadgeGroup>
              <ModernBadge variant="primary">Primary</ModernBadge>
              <ModernBadge variant="accent">Accent</ModernBadge>
              <ModernBadge variant="gradient-crou">Gradient CROU</ModernBadge>
              <ModernBadge variant="success">Success</ModernBadge>
              <ModernBadge variant="warning">Warning</ModernBadge>
              <ModernBadge variant="danger">Danger</ModernBadge>
              <ModernBadge variant="info">Info</ModernBadge>
              <ModernBadge variant="neutral">Neutral</ModernBadge>
            </ModernBadgeGroup>
          </div>

          {/* Badge Sizes */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-800">Tailles</h3>
            <ModernBadgeGroup>
              <ModernBadge variant="gradient-crou" size="sm">Small</ModernBadge>
              <ModernBadge variant="gradient-crou" size="md">Medium</ModernBadge>
              <ModernBadge variant="gradient-crou" size="lg">Large</ModernBadge>
            </ModernBadgeGroup>
          </div>

          {/* Badges with Glow */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-800">Avec Effet Glow</h3>
            <ModernBadgeGroup>
              <ModernBadge variant="primary" glow>Primary Glow</ModernBadge>
              <ModernBadge variant="accent" glow>Accent Glow</ModernBadge>
              <ModernBadge variant="gradient-crou" glow>CROU Glow</ModernBadge>
              <ModernBadge variant="success" glow>Success Glow</ModernBadge>
              <ModernBadge variant="danger" glow>Danger Glow</ModernBadge>
            </ModernBadgeGroup>
          </div>

          {/* Outline Badges */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-800">Style Outline</h3>
            <ModernBadgeGroup>
              <ModernBadge variant="primary" outline>Primary</ModernBadge>
              <ModernBadge variant="accent" outline>Accent</ModernBadge>
              <ModernBadge variant="gradient-crou" outline>CROU</ModernBadge>
              <ModernBadge variant="success" outline>Success</ModernBadge>
              <ModernBadge variant="danger" outline>Danger</ModernBadge>
            </ModernBadgeGroup>
          </div>

          {/* Badges with Icons */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-800">Avec Icônes</h3>
            <ModernBadgeGroup>
              <ModernBadge variant="success" icon={Check}>Validé</ModernBadge>
              <ModernBadge variant="danger" icon={X}>Rejeté</ModernBadge>
              <ModernBadge variant="warning" icon={AlertCircle}>Attention</ModernBadge>
              <ModernBadge variant="info" icon={Info}>Information</ModernBadge>
              <ModernBadge variant="gradient-crou" icon={ChevronRight} iconPosition="right">
                Continuer
              </ModernBadge>
            </ModernBadgeGroup>
          </div>

          {/* Badges with Dot */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-800">Avec Point Indicateur</h3>
            <ModernBadgeGroup>
              <ModernBadge variant="success" dot>En ligne</ModernBadge>
              <ModernBadge variant="warning" dot>Occupé</ModernBadge>
              <ModernBadge variant="danger" dot>Hors ligne</ModernBadge>
              <ModernBadge variant="gradient-crou" dot glow>Actif</ModernBadge>
            </ModernBadgeGroup>
          </div>

          {/* Status Badges */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-800">Badges de Statut (Preset)</h3>
            <ModernBadgeGroup>
              <StatusBadge status="pending" />
              <StatusBadge status="processing" />
              <StatusBadge status="approved" />
              <StatusBadge status="rejected" />
              <StatusBadge status="completed" glow />
            </ModernBadgeGroup>
          </div>

          {/* Counter Badges */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-800">Badges Compteur</h3>
            <ModernBadgeGroup>
              <CounterBadge count={3} variant="danger" />
              <CounterBadge count={12} variant="primary" />
              <CounterBadge count={99} variant="accent" />
              <CounterBadge count={150} variant="gradient-crou" max={99} />
            </ModernBadgeGroup>
          </div>
        </section>

        {/* ============================================ */}
        {/* REAL WORLD EXAMPLES */}
        {/* ============================================ */}
        <section className="bg-white rounded-2xl shadow-card-hover p-8 space-y-8">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Exemples Réels</h2>
            <p className="text-gray-600">Utilisation dans des contextes CROU</p>
          </div>

          {/* Card Example 1: Demande d'hébergement */}
          <div className="border-2 border-gray-200 rounded-xl p-6 space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Demande d'Hébergement #12345</h3>
                <p className="text-sm text-gray-600 mt-1">Étudiant: Amadou Diallo • Chambre: B204</p>
              </div>
              <StatusBadge status="pending" />
            </div>
            
            <ModernBadgeGroup spacing="tight">
              <ModernBadge variant="gradient-crou" size="sm">Prioritaire</ModernBadge>
              <ModernBadge variant="info" size="sm">1ère année</ModernBadge>
              <ModernBadge variant="neutral" size="sm">CROU Niamey</ModernBadge>
            </ModernBadgeGroup>

            <div className="flex gap-2 pt-2">
              <ModernButton variant="gradient-crou" size="sm" icon={Check}>
                Approuver
              </ModernButton>
              <ModernButton variant="outline" size="sm" icon={X}>
                Rejeter
              </ModernButton>
              <ModernButton variant="ghost" size="sm" icon={Info}>
                Détails
              </ModernButton>
            </div>
          </div>

          {/* Card Example 2: Ticket de restauration */}
          <div className="border-2 border-gray-200 rounded-xl p-6 space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Ticket Restauration #98765</h3>
                <p className="text-sm text-gray-600 mt-1">Type: Déjeuner • Restaurant: RU Niamey</p>
              </div>
              <StatusBadge status="completed" glow />
            </div>
            
            <div className="flex items-center gap-4">
              <ModernBadge variant="success" icon={Check}>Validé</ModernBadge>
              <ModernBadge variant="gradient-crou" outline>250 FCFA</ModernBadge>
              <ModernBadge variant="neutral" size="sm">Subvention 80%</ModernBadge>
            </div>

            <div className="flex gap-2 pt-2">
              <ModernButton variant="outline" size="sm" icon={Download}>
                Télécharger PDF
              </ModernButton>
              <ModernButton variant="ghost" size="sm" icon={Info}>
                Historique
              </ModernButton>
            </div>
          </div>

          {/* Card Example 3: Notifications */}
          <div className="border-2 border-gray-200 rounded-xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Centre de Notifications</h3>
              <ModernIconButton icon={Bell} variant="gradient-crou" aria-label="Notifications" />
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <CounterBadge count={5} variant="danger" />
                <span className="text-sm text-gray-700">Demandes en attente de validation</span>
              </div>
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <CounterBadge count={12} variant="primary" />
                <span className="text-sm text-gray-700">Nouveaux tickets de transport</span>
              </div>
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <CounterBadge count={3} variant="accent" />
                <span className="text-sm text-gray-700">Rapports à approuver</span>
              </div>
            </div>

            <ModernButton variant="gradient-crou" icon={Check} fullWidth>
              Tout marquer comme lu
            </ModernButton>
          </div>
        </section>

        {/* Footer */}
        <div className="text-center text-gray-500 text-sm py-4">
          <p>Sprint 1 - Phase Finale • Design System CROU Niger</p>
        </div>
      </div>
    </div>
  );
};

export default ComponentShowcase;

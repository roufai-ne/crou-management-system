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
  ChevronRight,
  Mail
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';

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
              <Button variant="primary">Primary</Button>
              <Button variant="warning">Accent</Button>
              <Button variant="gradient">Gradient CROU</Button>
              <Button variant="outline">Outline</Button>
              <Button variant="ghost">Ghost</Button>
              <Button variant="danger">Danger</Button>
            </div>
          </div>

          {/* Button Sizes */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-800">Tailles</h3>
            <div className="flex flex-wrap items-center gap-3">
              <Button variant="gradient" size="sm">Small</Button>
              <Button variant="gradient" size="md">Medium</Button>
              <Button variant="gradient" size="lg">Large</Button>
            </div>
          </div>

          {/* Buttons with Icons */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-800">Avec Icônes</h3>
            <div className="flex flex-wrap gap-3">
              <Button variant="gradient" leftIcon={<Plus className="w-4 h-4" />}>
                Ajouter
              </Button>
              <Button variant="primary" leftIcon={<Save className="w-4 h-4" />}>
                Sauvegarder
              </Button>
              <Button variant="warning" leftIcon={<Download className="w-4 h-4" />}>
                Télécharger
              </Button>
              <Button variant="outline" leftIcon={<Search className="w-4 h-4" />}>
                Rechercher
              </Button>
              <Button variant="danger" leftIcon={<Trash2 className="w-4 h-4" />}>
                Supprimer
              </Button>
              <Button variant="ghost" rightIcon={<ChevronRight className="w-4 h-4" />}>
                Suivant
              </Button>
            </div>
          </div>

          {/* Loading State */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-800">État de Chargement</h3>
            <div className="flex flex-wrap gap-3">
              <Button variant="gradient" loading={loading} onClick={handleClick}>
                {loading ? 'Chargement...' : 'Cliquer pour charger'}
              </Button>
              <Button variant="primary" loading>
                Sauvegarde en cours...
              </Button>
            </div>
          </div>

          {/* Icon Buttons */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-800">Boutons Icône</h3>
            <div className="flex flex-wrap items-center gap-3">
              <Button iconOnly variant="gradient" aria-label="Ajouter"><Plus className="w-5 h-5" /></Button>
              <Button iconOnly variant="primary" aria-label="Paramètres"><Settings className="w-5 h-5" /></Button>
              <Button iconOnly variant="warning" aria-label="Notifications"><Bell className="w-5 h-5" /></Button>
              <Button iconOnly variant="outline" aria-label="Rechercher"><Search className="w-5 h-5" /></Button>
              <Button iconOnly variant="danger" size="sm" aria-label="Supprimer"><Trash2 className="w-4 h-4" /></Button>
            </div>
          </div>

          {/* Button Groups */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-800">Groupes de Boutons</h3>
            <div className="space-y-3">
              <div className="flex flex-wrap gap-2">
                <Button variant="outline">Jour</Button>
                <Button variant="outline">Semaine</Button>
                <Button variant="gradient">Mois</Button>
                <Button variant="outline">Année</Button>
              </div>

              <div className="flex flex-col gap-2 w-48">
                <Button variant="outline" leftIcon={<Download className="w-4 h-4" />}>Export PDF</Button>
                <Button variant="outline" leftIcon={<Download className="w-4 h-4" />}>Export Excel</Button>
                <Button variant="outline" leftIcon={<Download className="w-4 h-4" />}>Export CSV</Button>
              </div>
            </div>
          </div>

          {/* Full Width */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-800">Largeur Pleine</h3>
            <Button variant="gradient" leftIcon={<Upload className="w-4 h-4" />} fullWidth>
              Téléverser un fichier
            </Button>
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
            <div className="flex flex-wrap gap-2">
              <Badge variant="primary">Primary</Badge>
              <Badge variant="accent">Accent</Badge>
              <Badge variant="gradient">Gradient CROU</Badge>
              <Badge variant="success">Success</Badge>
              <Badge variant="warning">Warning</Badge>
              <Badge variant="danger">Danger</Badge>
              <Badge variant="info">Info</Badge>
              <Badge variant="neutral">Neutral</Badge>
            </div>
          </div>

          {/* Badge Sizes */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-800">Tailles</h3>
            <div className="flex flex-wrap gap-2">
              <Badge variant="gradient" size="sm">Small</Badge>
              <Badge variant="gradient" size="md">Medium</Badge>
              <Badge variant="gradient" size="lg">Large</Badge>
            </div>
          </div>

          {/* Badges with Glow */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-800">Avec Effet Glow</h3>
            <div className="flex flex-wrap gap-2">
              <Badge variant="primary" glow>Primary Glow</Badge>
              <Badge variant="accent" glow>Accent Glow</Badge>
              <Badge variant="gradient" glow>CROU Glow</Badge>
              <Badge variant="success" glow>Success Glow</Badge>
              <Badge variant="danger" glow>Danger Glow</Badge>
            </div>
          </div>

          {/* Outline Badges */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-800">Style Outline</h3>
            <div className="flex flex-wrap gap-2">
              <Badge variant="primary" outline>Primary</Badge>
              <Badge variant="accent" outline>Accent</Badge>
              <Badge variant="gradient" outline>CROU</Badge>
              <Badge variant="success" outline>Success</Badge>
              <Badge variant="danger" outline>Danger</Badge>
            </div>
          </div>

          {/* Badges with Icons */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-800">Avec Icônes</h3>
            <div className="flex flex-wrap gap-2">
              <Badge variant="success" icon={Check}>Validé</Badge>
              <Badge variant="danger" icon={X}>Rejeté</Badge>
              <Badge variant="warning" icon={AlertCircle}>Attention</Badge>
              <Badge variant="info" icon={Info}>Information</Badge>
              <Badge variant="gradient" icon={ChevronRight} iconPosition="right">
                Continuer
              </Badge>
            </div>
          </div>

          {/* Badges with Dot */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-800">Avec Point Indicateur</h3>
            <div className="flex flex-wrap gap-2">
              <Badge variant="success" dot>En ligne</Badge>
              <Badge variant="warning" dot>Occupé</Badge>
              <Badge variant="danger" dot>Hors ligne</Badge>
              <Badge variant="gradient" dot glow>Actif</Badge>
            </div>
          </div>

          {/* Status Badges */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-800">Badges de Statut (Preset)</h3>
            <div className="flex flex-wrap gap-2">
              <Badge variant="warning" dot>En attente</Badge>
              <Badge variant="info" dot>En cours</Badge>
              <Badge variant="success" dot>Approuvé</Badge>
              <Badge variant="danger" dot>Rejeté</Badge>
              <Badge variant="gradient" dot glow>Terminé</Badge>
            </div>
          </div>

          {/* Counter Badges */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-800">Badges Compteur</h3>
            <div className="flex flex-wrap gap-2">
              <Badge variant="danger" size="sm" rounded>3</Badge>
              <Badge variant="primary" size="sm" rounded>12</Badge>
              <Badge variant="accent" size="sm" rounded>99</Badge>
              <Badge variant="gradient" size="sm" rounded>99+</Badge>
            </div>
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
              <Badge variant="warning" dot>En attente</Badge>
            </div>

            <div className="flex flex-wrap gap-1">
              <Badge variant="gradient" size="sm">Prioritaire</Badge>
              <Badge variant="info" size="sm">1ère année</Badge>
              <Badge variant="neutral" size="sm">CROU Niamey</Badge>
            </div>

            <div className="flex gap-2 pt-2">
              <Button variant="gradient" size="sm" leftIcon={<Check className="w-3 h-3" />}>
                Approuver
              </Button>
              <Button variant="outline" size="sm" leftIcon={<X className="w-3 h-3" />}>
                Rejeter
              </Button>
              <Button variant="ghost" size="sm" leftIcon={<Info className="w-3 h-3" />}>
                Détails
              </Button>
            </div>
          </div>

          {/* Card Example 2: Ticket de restauration */}
          <div className="border-2 border-gray-200 rounded-xl p-6 space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Ticket Restauration #98765</h3>
                <p className="text-sm text-gray-600 mt-1">Type: Déjeuner • Restaurant: RU Niamey</p>
              </div>
              <Badge variant="gradient" dot glow>Terminé</Badge>
            </div>

            <div className="flex items-center gap-4">
              <Badge variant="success" icon={Check}>Validé</Badge>
              <Badge variant="gradient" outline>250 FCFA</Badge>
              <Badge variant="neutral" size="sm">Subvention 80%</Badge>
            </div>

            <div className="flex gap-2 pt-2">
              <Button variant="outline" size="sm" leftIcon={<Download className="w-3 h-3" />}>
                Télécharger PDF
              </Button>
              <Button variant="ghost" size="sm" leftIcon={<Info className="w-3 h-3" />}>
                Historique
              </Button>
            </div>
          </div>

          {/* Card Example 3: Notifications */}
          <div className="border-2 border-gray-200 rounded-xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Centre de Notifications</h3>
              <Button iconOnly variant="gradient" aria-label="Notifications"><Bell className="w-5 h-5" /></Button>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <Badge variant="danger" size="sm" rounded>5</Badge>
                <span className="text-sm text-gray-700">Demandes en attente de validation</span>
              </div>
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <Badge variant="primary" size="sm" rounded>12</Badge>
                <span className="text-sm text-gray-700">Nouveaux tickets de transport</span>
              </div>
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <Badge variant="accent" size="sm" rounded>3</Badge>
                <span className="text-sm text-gray-700">Rapports à approuver</span>
              </div>
            </div>

            <Button variant="gradient" leftIcon={<Check className="w-4 h-4" />} fullWidth>
              Tout marquer comme lu
            </Button>
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

import React from 'react';
import { Users, Package, DollarSign, Home, Truck, BarChart3, TrendingUp, Award } from 'lucide-react';
import { ModernKPICard, ModernKPIGrid } from '@/components/ui/ModernKPICard';
import { KPICard } from '@/components/ui/KPICard';
import { IconWrapper } from '@/components/ui/IconWrapper';

/**
 * Page de comparaison Avant/Après pour les KPI Cards
 * Démontre l'amélioration visuelle du Sprint 1
 */
const KPIComparison: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto space-y-12">
        
        {/* Header */}
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-4">
            <span className="bg-gradient-crou bg-clip-text text-transparent">
              KPI Cards - Avant/Après
            </span>
          </h1>
          <p className="text-gray-600 text-lg">
            Sprint 1 : Transformation visuelle avec identité Niger 🇳🇪
          </p>
        </div>

        {/* AVANT : KPI Cards Classiques */}
        <section>
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              ❌ AVANT : Design Classique
            </h2>
            <p className="text-gray-600">
              Cartes blanches simples, icônes Heroicons (stroke 1.5), pas de gradients
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <KPICard
              title="Total Étudiants"
              value={1245}
              type="number"
              icon={<IconWrapper icon={Users} size="lg" variant="primary" />}
              trend={{
                direction: 'up',
                value: 12,
                valueType: 'percentage',
                period: 'vs mois dernier'
              }}
              variant="default"
            />
            <KPICard
              title="Commandes Actives"
              value={87}
              type="number"
              icon={<IconWrapper icon={Package} size="lg" variant="warning" />}
              trend={{
                direction: 'up',
                value: 5,
                valueType: 'absolute',
                period: 'cette semaine'
              }}
              variant="default"
            />
            <KPICard
              title="Budget Disponible"
              value={245000000}
              type="currency"
              icon={<IconWrapper icon={DollarSign} size="lg" variant="success" />}
              trend={{
                direction: 'up',
                value: 85,
                valueType: 'percentage',
                period: 'utilisé'
              }}
              variant="default"
            />
            <KPICard
              title="Établissements"
              value={12}
              type="number"
              icon={<IconWrapper icon={Home} size="lg" variant="info" />}
              description="Tous actifs"
              variant="default"
            />
          </div>
        </section>

        {/* APRÈS : ModernKPICard */}
        <section>
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              ✅ APRÈS : Design Moderne CROU
            </h2>
            <p className="text-gray-600">
              Gradients signature, glow effects, icône décorative, animations fluides
            </p>
          </div>

          <ModernKPIGrid
            columns={4}
            cards={[
              {
                title: 'Total Étudiants',
                value: 1245,
                valueType: 'number',
                icon: Users,
                variant: 'gradient-crou',
                trend: {
                  direction: 'up',
                  value: '+12%',
                  label: 'vs mois dernier'
                },
                glow: true
              },
              {
                title: 'Commandes Actives',
                value: 87,
                valueType: 'number',
                icon: Package,
                variant: 'gradient-accent',
                trend: {
                  direction: 'up',
                  value: '+5',
                  label: 'cette semaine'
                },
                glow: true
              },
              {
                title: 'Budget Disponible',
                value: '245M',
                icon: DollarSign,
                variant: 'gradient-primary',
                trend: {
                  direction: 'up',
                  value: '85%',
                  label: 'utilisé'
                },
                glow: true
              },
              {
                title: 'Établissements',
                value: 12,
                valueType: 'number',
                icon: Home,
                variant: 'gradient-crou',
                trend: {
                  direction: 'stable',
                  value: 'Tous actifs'
                },
                glow: true
              }
            ]}
          />
        </section>

        {/* Variantes de Couleurs */}
        <section>
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              🎨 Variantes de Couleurs
            </h2>
            <p className="text-gray-600">
              Différentes combinaisons de gradients CROU
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <ModernKPICard
              title="Variant: gradient-crou"
              value={1245}
              icon={Award}
              variant="gradient-crou"
              trend={{ direction: 'up', value: '+12%', label: 'Vert → Orange' }}
              glow={true}
            />
            <ModernKPICard
              title="Variant: gradient-primary"
              value={87}
              icon={TrendingUp}
              variant="gradient-primary"
              trend={{ direction: 'up', value: '+5%', label: 'Vert → Vert foncé' }}
              glow={true}
            />
            <ModernKPICard
              title="Variant: gradient-accent"
              value={245}
              icon={BarChart3}
              variant="gradient-accent"
              trend={{ direction: 'up', value: '+8%', label: 'Orange → Orange foncé' }}
              glow={true}
            />
          </div>
        </section>

        {/* Avec/Sans Glow */}
        <section>
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              💫 Effet Glow (Hover pour voir)
            </h2>
            <p className="text-gray-600">
              Comparaison avec et sans effet glow au survol
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <p className="text-sm text-gray-600 mb-3 font-medium">Sans Glow</p>
              <ModernKPICard
                title="Total Véhicules"
                value={24}
                icon={Truck}
                variant="gradient-accent"
                trend={{ direction: 'up', value: '+2' }}
                glow={false}
              />
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-3 font-medium">Avec Glow ✨</p>
              <ModernKPICard
                title="Total Véhicules"
                value={24}
                icon={Truck}
                variant="gradient-accent"
                trend={{ direction: 'up', value: '+2' }}
                glow={true}
              />
            </div>
          </div>
        </section>

        {/* États de Tendance */}
        <section>
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              📈 États de Tendance
            </h2>
            <p className="text-gray-600">
              Indicateurs de hausse, baisse et stabilité
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <ModernKPICard
              title="Hausse (Up)"
              value={1245}
              icon={TrendingUp}
              variant="gradient-primary"
              trend={{ direction: 'up', value: '+12.5%', label: 'En croissance' }}
              glow={true}
            />
            <ModernKPICard
              title="Baisse (Down)"
              value={87}
              icon={TrendingUp}
              variant="gradient-accent"
              trend={{ direction: 'down', value: '-5.2%', label: 'En baisse' }}
              glow={true}
            />
            <ModernKPICard
              title="Stable"
              value={245}
              icon={BarChart3}
              variant="gradient-crou"
              trend={{ direction: 'stable', value: '0%', label: 'Stable' }}
              glow={true}
            />
          </div>
        </section>

        {/* Loading State */}
        <section>
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              ⏳ État de Chargement
            </h2>
            <p className="text-gray-600">
              Animation de chargement pendant fetch des données
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <ModernKPICard
              title="Chargement..."
              value={0}
              icon={Users}
              variant="gradient-crou"
              loading={true}
            />
            <ModernKPICard
              title="Chargement..."
              value={0}
              icon={Package}
              variant="gradient-primary"
              loading={true}
            />
            <ModernKPICard
              title="Chargement..."
              value={0}
              icon={DollarSign}
              variant="gradient-accent"
              loading={true}
            />
            <ModernKPICard
              title="Chargement..."
              value={0}
              icon={Home}
              variant="gradient-crou"
              loading={true}
            />
          </div>
        </section>

        {/* Résumé des Améliorations */}
        <section className="bg-white rounded-xl shadow-card p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            ✨ Résumé des Améliorations Sprint 1
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold text-lg text-gray-900 mb-3">Avant</h3>
              <ul className="space-y-2 text-gray-600">
                <li>❌ Fond blanc simple</li>
                <li>❌ Icônes Heroicons thin (stroke 1.5)</li>
                <li>❌ Pas de profondeur visuelle</li>
                <li>❌ Aucun gradient</li>
                <li>❌ Pas d'identité Niger</li>
                <li>❌ Shadow standard grise</li>
                <li>❌ Pas d'icône décorative</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-lg text-gray-900 mb-3">Après</h3>
              <ul className="space-y-2 text-gray-600">
                <li>✅ Icône décorative en background (gradient)</li>
                <li>✅ Badge coloré avec gradient + glow effect</li>
                <li>✅ Valeur avec gradient CROU (Vert→Orange)</li>
                <li>✅ Indicateur de tendance avec Lucide</li>
                <li>✅ Shadow colorée avec hover effect</li>
                <li>✅ Identité Niger forte (🇳🇪)</li>
                <li>✅ Animations fluides (scale, glow)</li>
              </ul>
            </div>
          </div>
        </section>

        {/* Footer */}
        <div className="text-center py-8 border-t border-gray-200">
          <p className="text-gray-600">
            <span className="font-semibold bg-gradient-crou bg-clip-text text-transparent">
              ModernKPICard
            </span>
            {' '}• Sprint 1 : Design System CROU • Inspiré du drapeau Niger 🇳🇪
          </p>
        </div>

      </div>
    </div>
  );
};

export default KPIComparison;

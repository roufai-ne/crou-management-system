import React from 'react';
import { 
  Home, Users, Building2, Package, TrendingUp, 
  Calendar, Award, Activity, DollarSign 
} from 'lucide-react';
import { IconWrapper, IconWithBackground, IconDecorative } from '@/components/ui/IconWrapper';

/**
 * Page de démonstration du nouveau système de design CROU
 * Sprint 1 : Foundations Visuelles
 */
const DesignShowcase: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto space-y-12">
        
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">
            <span className="bg-gradient-crou bg-clip-text text-transparent">
              Design System CROU
            </span>
          </h1>
          <p className="text-gray-600 text-lg">
            Sprint 1 : Palette Niger modernisée • Iconographie Lucide • Gradients signature
          </p>
        </div>

        {/* Palette de Couleurs */}
        <section>
          <h2 className="text-2xl font-bold mb-6">🎨 Palette de Couleurs</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            
            {/* Vert Principal */}
            <div className="bg-white rounded-xl shadow-card p-6 text-center">
              <div className="w-20 h-20 bg-primary-600 rounded-lg mx-auto mb-4 shadow-button-primary"></div>
              <h3 className="font-semibold text-gray-900">Primary</h3>
              <p className="text-sm text-gray-600 mt-1">#059669</p>
              <p className="text-xs text-gray-500 mt-2">Vert moderne CROU</p>
            </div>

            {/* Orange Accent */}
            <div className="bg-white rounded-xl shadow-card p-6 text-center">
              <div className="w-20 h-20 bg-accent-600 rounded-lg mx-auto mb-4 shadow-button-accent"></div>
              <h3 className="font-semibold text-gray-900">Accent</h3>
              <p className="text-sm text-gray-600 mt-1">#ea580c</p>
              <p className="text-xs text-gray-500 mt-2">Orange moderne CROU</p>
            </div>

            {/* Success */}
            <div className="bg-white rounded-xl shadow-card p-6 text-center">
              <div className="w-20 h-20 bg-success-600 rounded-lg mx-auto mb-4"></div>
              <h3 className="font-semibold text-gray-900">Success</h3>
              <p className="text-sm text-gray-600 mt-1">#16a34a</p>
              <p className="text-xs text-gray-500 mt-2">Vert drapeau Niger</p>
            </div>

            {/* Info */}
            <div className="bg-white rounded-xl shadow-card p-6 text-center">
              <div className="w-20 h-20 bg-info-600 rounded-lg mx-auto mb-4"></div>
              <h3 className="font-semibold text-gray-900">Info</h3>
              <p className="text-sm text-gray-600 mt-1">#0891b2</p>
              <p className="text-xs text-gray-500 mt-2">Cyan moderne</p>
            </div>
          </div>
        </section>

        {/* Gradients Signature */}
        <section>
          <h2 className="text-2xl font-bold mb-6">✨ Gradients Signature CROU</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Gradient CROU */}
            <div className="relative h-40 bg-gradient-crou rounded-xl shadow-card-glow-crou p-6 overflow-hidden">
              <IconDecorative icon={Award} size={100} opacity={0.15} className="top-4 right-4" />
              <div className="relative z-10">
                <h3 className="text-white font-bold text-xl mb-2">Gradient CROU</h3>
                <p className="text-white/90 text-sm">Vert → Orange</p>
                <p className="text-white/70 text-xs mt-2">Identité Niger</p>
              </div>
            </div>

            {/* Gradient Primary */}
            <div className="relative h-40 bg-gradient-primary rounded-xl shadow-card-glow-green p-6 overflow-hidden">
              <IconDecorative icon={TrendingUp} size={100} opacity={0.15} className="top-4 right-4" />
              <div className="relative z-10">
                <h3 className="text-white font-bold text-xl mb-2">Gradient Primary</h3>
                <p className="text-white/90 text-sm">Vert clair → Vert</p>
                <p className="text-white/70 text-xs mt-2">Principal moderne</p>
              </div>
            </div>

            {/* Gradient Accent */}
            <div className="relative h-40 bg-gradient-accent rounded-xl shadow-card-glow-orange p-6 overflow-hidden">
              <IconDecorative icon={Activity} size={100} opacity={0.15} className="top-4 right-4" />
              <div className="relative z-10">
                <h3 className="text-white font-bold text-xl mb-2">Gradient Accent</h3>
                <p className="text-white/90 text-sm">Orange → Orange foncé</p>
                <p className="text-white/70 text-xs mt-2">Accent moderne</p>
              </div>
            </div>
          </div>
        </section>

        {/* Système d'Icônes */}
        <section>
          <h2 className="text-2xl font-bold mb-6">🎯 Système d'Icônes (Lucide)</h2>
          
          {/* IconWrapper Simple */}
          <div className="bg-white rounded-xl shadow-card p-8 mb-6">
            <h3 className="font-semibold text-lg mb-4">IconWrapper - Tailles et Variantes</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              
              {/* Tailles */}
              <div>
                <p className="text-sm font-medium text-gray-700 mb-3">Tailles</p>
                <div className="flex items-center gap-4">
                  <IconWrapper icon={Home} size="sm" variant="primary" />
                  <IconWrapper icon={Home} size="md" variant="primary" />
                  <IconWrapper icon={Home} size="lg" variant="primary" />
                  <IconWrapper icon={Home} size="xl" variant="primary" />
                </div>
              </div>

              {/* Couleurs */}
              <div>
                <p className="text-sm font-medium text-gray-700 mb-3">Couleurs</p>
                <div className="flex items-center gap-4">
                  <IconWrapper icon={Users} size="lg" variant="primary" />
                  <IconWrapper icon={Users} size="lg" variant="accent" />
                  <IconWrapper icon={Users} size="lg" variant="success" />
                  <IconWrapper icon={Users} size="lg" variant="info" />
                </div>
              </div>

              {/* Gradients */}
              <div>
                <p className="text-sm font-medium text-gray-700 mb-3">Gradients</p>
                <div className="flex items-center gap-4">
                  <IconWrapper icon={TrendingUp} size="xl" variant="gradient-crou" />
                  <IconWrapper icon={TrendingUp} size="xl" variant="gradient-primary" />
                  <IconWrapper icon={TrendingUp} size="xl" variant="gradient-accent" />
                </div>
              </div>

              {/* Animations */}
              <div>
                <p className="text-sm font-medium text-gray-700 mb-3">Animations</p>
                <div className="flex items-center gap-4">
                  <IconWrapper icon={Activity} size="lg" variant="primary" animate="pulse" />
                  <IconWrapper icon={Activity} size="lg" variant="accent" animate="bounce" />
                  <IconWrapper icon={Activity} size="lg" variant="success" animate="scale" />
                </div>
              </div>
            </div>
          </div>

          {/* IconWithBackground */}
          <div className="bg-white rounded-xl shadow-card p-8">
            <h3 className="font-semibold text-lg mb-4">IconWithBackground - Badges avec Glow</h3>
            <div className="flex flex-wrap gap-6">
              <IconWithBackground 
                icon={Award} 
                size="lg"
                background="gradient-crou"
                rounded="full"
                padding="lg"
                glow={true}
              />
              <IconWithBackground 
                icon={Building2} 
                size="lg"
                background="primary"
                rounded="lg"
                padding="md"
              />
              <IconWithBackground 
                icon={Package} 
                size="lg"
                background="accent"
                rounded="md"
                padding="md"
              />
              <IconWithBackground 
                icon={Calendar} 
                size="lg"
                background="success"
                rounded="full"
                padding="lg"
              />
              <IconWithBackground 
                icon={DollarSign} 
                size="lg"
                background="info"
                rounded="lg"
                padding="md"
              />
              <IconWithBackground 
                icon={TrendingUp} 
                size="lg"
                background="gradient-primary"
                rounded="full"
                padding="lg"
                glow={true}
              />
              <IconWithBackground 
                icon={Activity} 
                size="lg"
                background="gradient-accent"
                rounded="full"
                padding="lg"
                glow={true}
              />
            </div>
          </div>
        </section>

        {/* KPI Cards Modernes (Preview) */}
        <section>
          <h2 className="text-2xl font-bold mb-6">📊 KPI Cards Modernes (Preview)</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            
            {/* Card 1 */}
            <div className="relative bg-white rounded-xl shadow-card hover:shadow-card-hover transition-all p-6 overflow-hidden group">
              <IconDecorative 
                icon={Users} 
                size={140}
                opacity={0.05}
                className="top-4 right-4"
                gradient={true}
              />
              <div className="relative z-10">
                <IconWithBackground 
                  icon={Users} 
                  size="lg"
                  background="gradient-crou"
                  rounded="lg"
                  glow={true}
                />
                <h3 className="text-sm font-medium text-gray-600 mt-4">Total Étudiants</h3>
                <p className="text-3xl font-bold bg-gradient-crou bg-clip-text text-transparent mt-2">
                  1,245
                </p>
                <div className="flex items-center mt-2 text-sm">
                  <IconWrapper icon={TrendingUp} size="sm" variant="success" />
                  <span className="text-success-600 ml-1 font-medium">+12%</span>
                  <span className="text-gray-500 ml-1">vs mois dernier</span>
                </div>
              </div>
            </div>

            {/* Card 2 */}
            <div className="relative bg-white rounded-xl shadow-card hover:shadow-card-hover transition-all p-6 overflow-hidden group">
              <IconDecorative 
                icon={Package} 
                size={140}
                opacity={0.05}
                className="top-4 right-4"
                gradient={true}
              />
              <div className="relative z-10">
                <IconWithBackground 
                  icon={Package} 
                  size="lg"
                  background="gradient-accent"
                  rounded="lg"
                  glow={true}
                />
                <h3 className="text-sm font-medium text-gray-600 mt-4">Commandes Actives</h3>
                <p className="text-3xl font-bold bg-gradient-accent bg-clip-text text-transparent mt-2">
                  87
                </p>
                <div className="flex items-center mt-2 text-sm">
                  <IconWrapper icon={Activity} size="sm" variant="accent" />
                  <span className="text-accent-600 ml-1 font-medium">+5</span>
                  <span className="text-gray-500 ml-1">cette semaine</span>
                </div>
              </div>
            </div>

            {/* Card 3 */}
            <div className="relative bg-white rounded-xl shadow-card hover:shadow-card-hover transition-all p-6 overflow-hidden group">
              <IconDecorative 
                icon={DollarSign} 
                size={140}
                opacity={0.05}
                className="top-4 right-4"
                gradient={true}
              />
              <div className="relative z-10">
                <IconWithBackground 
                  icon={DollarSign} 
                  size="lg"
                  background="gradient-primary"
                  rounded="lg"
                  glow={true}
                />
                <h3 className="text-sm font-medium text-gray-600 mt-4">Budget Disponible</h3>
                <p className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent mt-2">
                  245M
                </p>
                <div className="flex items-center mt-2 text-sm">
                  <IconWrapper icon={TrendingUp} size="sm" variant="success" />
                  <span className="text-success-600 ml-1 font-medium">85%</span>
                  <span className="text-gray-500 ml-1">utilisé</span>
                </div>
              </div>
            </div>

            {/* Card 4 */}
            <div className="relative bg-white rounded-xl shadow-card hover:shadow-card-hover transition-all p-6 overflow-hidden group">
              <IconDecorative 
                icon={Building2} 
                size={140}
                opacity={0.05}
                className="top-4 right-4"
                gradient={true}
              />
              <div className="relative z-10">
                <IconWithBackground 
                  icon={Building2} 
                  size="lg"
                  background="gradient-crou"
                  rounded="lg"
                  glow={true}
                />
                <h3 className="text-sm font-medium text-gray-600 mt-4">Établissements</h3>
                <p className="text-3xl font-bold bg-gradient-crou bg-clip-text text-transparent mt-2">
                  12
                </p>
                <div className="flex items-center mt-2 text-sm">
                  <IconWrapper icon={Activity} size="sm" variant="info" />
                  <span className="text-info-600 ml-1 font-medium">Tous actifs</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Shadows & Effects */}
        <section>
          <h2 className="text-2xl font-bold mb-6">💫 Shadows & Effects</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-xl shadow-card-glow-green p-6 text-center">
              <IconWrapper icon={TrendingUp} size="2xl" variant="gradient-primary" />
              <p className="mt-4 font-medium text-gray-900">Card Glow Green</p>
              <p className="text-sm text-gray-600">shadow-card-glow-green</p>
            </div>
            <div className="bg-white rounded-xl shadow-card-glow-orange p-6 text-center">
              <IconWrapper icon={Activity} size="2xl" variant="gradient-accent" />
              <p className="mt-4 font-medium text-gray-900">Card Glow Orange</p>
              <p className="text-sm text-gray-600">shadow-card-glow-orange</p>
            </div>
            <div className="bg-white rounded-xl shadow-card-glow-crou p-6 text-center">
              <IconWrapper icon={Award} size="2xl" variant="gradient-crou" />
              <p className="mt-4 font-medium text-gray-900">Card Glow CROU</p>
              <p className="text-sm text-gray-600">shadow-card-glow-crou</p>
            </div>
          </div>
        </section>

        {/* Footer */}
        <div className="text-center py-8 border-t border-gray-200">
          <p className="text-gray-600">
            <span className="font-semibold bg-gradient-crou bg-clip-text text-transparent">
              Design System CROU
            </span>
            {' '}• Sprint 1 : Foundations Visuelles • Inspiré du drapeau Niger 🇳🇪
          </p>
        </div>

      </div>
    </div>
  );
};

export default DesignShowcase;

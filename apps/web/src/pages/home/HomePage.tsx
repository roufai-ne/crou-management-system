/**
 * FICHIER: apps/web/src/pages/home/HomePage.tsx
 * PAGE: HomePage - Page d'accueil publique CROU
 *
 * DESCRIPTION:
 * Page d'accueil présentant les services du CROU Niger
 * Carousel de services avec ModernCarousel
 * Statistiques et KPIs publics
 * Call-to-action pour inscription
 *
 * SECTIONS:
 * - Hero avec carousel de services
 * - Nos services (4 cartes)
 * - Statistiques CROU
 * - Témoignages étudiants
 * - Call-to-action inscription
 *
 * AUTEUR: Équipe CROU
 * DATE: Novembre 2024
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { Home, Package, Bus, CreditCard, Users, Building, CheckCircle, ArrowRight } from 'lucide-react';
import ModernCarousel, { CarouselItem } from '@/components/ui/ModernCarousel';
import ModernButton from '@/components/ui/ModernButton';

export const HomePage: React.FC = () => {
  // Carousel items - Services du CROU
  const carouselItems: CarouselItem[] = [
    {
      id: 'logement',
      content: (
        <div className="relative w-full h-[500px] bg-gradient-to-br from-emerald-600 to-emerald-800">
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-8 text-white">
            <Home className="w-20 h-20 mb-6 animate-bounce" />
            <h2 className="text-5xl font-bold mb-4">Logement Universitaire</h2>
            <p className="text-xl mb-6 max-w-2xl text-emerald-100">
              Des chambres modernes et confortables dans nos cités universitaires
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <div className="bg-white/20 backdrop-blur-sm px-6 py-3 rounded-full">
                <span className="text-2xl font-bold">3 Types</span>
                <span className="text-sm block text-emerald-100">de chambres</span>
              </div>
              <div className="bg-white/20 backdrop-blur-sm px-6 py-3 rounded-full">
                <span className="text-2xl font-bold">25,000 FCFA</span>
                <span className="text-sm block text-emerald-100">dès</span>
              </div>
              <div className="bg-white/20 backdrop-blur-sm px-6 py-3 rounded-full">
                <span className="text-2xl font-bold">WiFi</span>
                <span className="text-sm block text-emerald-100">inclus</span>
              </div>
            </div>
          </div>
        </div>
      ),
      alt: 'Logement Universitaire CROU',
    },
    {
      id: 'restauration',
      content: (
        <div className="relative w-full h-[500px] bg-gradient-to-br from-orange-600 to-orange-800">
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-8 text-white">
            <Package className="w-20 h-20 mb-6 animate-bounce" />
            <h2 className="text-5xl font-bold mb-4">Restauration Universitaire</h2>
            <p className="text-xl mb-6 max-w-2xl text-orange-100">
              Des repas équilibrés et variés pour les étudiants
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <div className="bg-white/20 backdrop-blur-sm px-6 py-3 rounded-full">
                <span className="text-2xl font-bold">3 Repas</span>
                <span className="text-sm block text-orange-100">par jour</span>
              </div>
              <div className="bg-white/20 backdrop-blur-sm px-6 py-3 rounded-full">
                <span className="text-2xl font-bold">20,000 FCFA</span>
                <span className="text-sm block text-orange-100">dès</span>
              </div>
              <div className="bg-white/20 backdrop-blur-sm px-6 py-3 rounded-full">
                <span className="text-2xl font-bold">Varié</span>
                <span className="text-sm block text-orange-100">& équilibré</span>
              </div>
            </div>
          </div>
        </div>
      ),
      alt: 'Restauration Universitaire CROU',
    },
    {
      id: 'transport',
      content: (
        <div className="relative w-full h-[500px] bg-gradient-to-br from-blue-600 to-blue-800">
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-8 text-white">
            <Bus className="w-20 h-20 mb-6 animate-bounce" />
            <h2 className="text-5xl font-bold mb-4">Transport Universitaire</h2>
            <p className="text-xl mb-6 max-w-2xl text-blue-100">
              Navettes gratuites pour faciliter vos déplacements
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <div className="bg-white/20 backdrop-blur-sm px-6 py-3 rounded-full">
                <span className="text-2xl font-bold">30 min</span>
                <span className="text-sm block text-blue-100">fréquence</span>
              </div>
              <div className="bg-white/20 backdrop-blur-sm px-6 py-3 rounded-full">
                <span className="text-2xl font-bold">10,000 FCFA</span>
                <span className="text-sm block text-blue-100">carte annuelle</span>
              </div>
              <div className="bg-white/20 backdrop-blur-sm px-6 py-3 rounded-full">
                <span className="text-2xl font-bold">5 Lignes</span>
                <span className="text-sm block text-blue-100">disponibles</span>
              </div>
            </div>
          </div>
        </div>
      ),
      alt: 'Transport Universitaire CROU',
    },
    {
      id: 'inscription',
      content: (
        <div className="relative w-full h-[500px] bg-gradient-to-br from-purple-600 to-purple-800">
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-8 text-white">
            <CreditCard className="w-20 h-20 mb-6 animate-bounce" />
            <h2 className="text-5xl font-bold mb-4">Inscription Simplifiée</h2>
            <p className="text-xl mb-6 max-w-2xl text-purple-100">
              Inscrivez-vous en ligne en quelques clics
            </p>
            <div className="flex flex-wrap gap-4 justify-center mb-8">
              <div className="bg-white/20 backdrop-blur-sm px-6 py-3 rounded-full">
                <span className="text-2xl font-bold">100% En ligne</span>
              </div>
              <div className="bg-white/20 backdrop-blur-sm px-6 py-3 rounded-full">
                <span className="text-2xl font-bold">Paiement sécurisé</span>
              </div>
              <div className="bg-white/20 backdrop-blur-sm px-6 py-3 rounded-full">
                <span className="text-2xl font-bold">Confirmation rapide</span>
              </div>
            </div>
            <Link to="/register">
              <ModernButton
                variant="outline"
                size="lg"
                className="border-2 border-white text-white hover:bg-white hover:text-purple-600"
              >
                Commencer maintenant
                <ArrowRight className="ml-2 w-5 h-5" />
              </ModernButton>
            </Link>
          </div>
        </div>
      ),
      alt: 'Inscription en ligne CROU',
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section avec Carousel */}
      <section className="bg-white">
        <ModernCarousel
          items={carouselItems}
          autoPlay
          interval={5000}
          showIndicators
          showControls
          loop
          variant="gradient-crou"
          aspectRatio="16/9"
        />
      </section>

      {/* Nos Services */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">Nos Services</h2>
          <p className="text-xl text-gray-600">
            Le CROU Niger accompagne les étudiants dans leur vie universitaire
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Service Logement */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 hover:shadow-xl transition-shadow">
            <div className="w-14 h-14 bg-gradient-to-r from-emerald-600 to-emerald-700 rounded-xl flex items-center justify-center mb-4">
              <Home className="w-7 h-7 text-white" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Logement</h3>
            <p className="text-gray-600 mb-4">
              Chambres modernes dans nos cités universitaires avec WiFi et sécurité 24/7
            </p>
            <ul className="space-y-2">
              <li className="flex items-center text-sm text-gray-700">
                <CheckCircle className="w-4 h-4 text-emerald-600 mr-2" />
                Simple, Double, Triple
              </li>
              <li className="flex items-center text-sm text-gray-700">
                <CheckCircle className="w-4 h-4 text-emerald-600 mr-2" />
                Dès 25,000 FCFA/an
              </li>
            </ul>
          </div>

          {/* Service Restauration */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 hover:shadow-xl transition-shadow">
            <div className="w-14 h-14 bg-gradient-to-r from-orange-600 to-orange-700 rounded-xl flex items-center justify-center mb-4">
              <Package className="w-7 h-7 text-white" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Restauration</h3>
            <p className="text-gray-600 mb-4">
              Repas équilibrés et variés dans nos restaurants universitaires
            </p>
            <ul className="space-y-2">
              <li className="flex items-center text-sm text-gray-700">
                <CheckCircle className="w-4 h-4 text-orange-600 mr-2" />
                2 ou 3 repas/jour
              </li>
              <li className="flex items-center text-sm text-gray-700">
                <CheckCircle className="w-4 h-4 text-orange-600 mr-2" />
                Dès 20,000 FCFA/mois
              </li>
            </ul>
          </div>

          {/* Service Transport */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 hover:shadow-xl transition-shadow">
            <div className="w-14 h-14 bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl flex items-center justify-center mb-4">
              <Bus className="w-7 h-7 text-white" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Transport</h3>
            <p className="text-gray-600 mb-4">
              Navettes gratuites entre campus, cités et centre-ville
            </p>
            <ul className="space-y-2">
              <li className="flex items-center text-sm text-gray-700">
                <CheckCircle className="w-4 h-4 text-blue-600 mr-2" />
                Départs toutes les 30min
              </li>
              <li className="flex items-center text-sm text-gray-700">
                <CheckCircle className="w-4 h-4 text-blue-600 mr-2" />
                Carte 10,000 FCFA/an
              </li>
            </ul>
          </div>

          {/* Service Administration */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 hover:shadow-xl transition-shadow">
            <div className="w-14 h-14 bg-gradient-to-r from-purple-600 to-purple-700 rounded-xl flex items-center justify-center mb-4">
              <CreditCard className="w-7 h-7 text-white" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Inscription</h3>
            <p className="text-gray-600 mb-4">
              Inscription en ligne simple et rapide pour tous les services
            </p>
            <ul className="space-y-2">
              <li className="flex items-center text-sm text-gray-700">
                <CheckCircle className="w-4 h-4 text-purple-600 mr-2" />
                100% en ligne
              </li>
              <li className="flex items-center text-sm text-gray-700">
                <CheckCircle className="w-4 h-4 text-purple-600 mr-2" />
                Paiement sécurisé
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* Statistiques CROU */}
      <section className="py-16 bg-gradient-to-r from-emerald-600 to-orange-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-white mb-4">CROU en Chiffres</h2>
            <p className="text-xl text-emerald-100">
              Notre impact sur la vie étudiante au Niger
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-white/20 rounded-full mb-4">
                <Users className="w-8 h-8 text-white" />
              </div>
              <div className="text-5xl font-bold text-white mb-2">12,450</div>
              <div className="text-emerald-100">Étudiants inscrits</div>
            </div>
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-white/20 rounded-full mb-4">
                <Building className="w-8 h-8 text-white" />
              </div>
              <div className="text-5xl font-bold text-white mb-2">8</div>
              <div className="text-emerald-100">Cités universitaires</div>
            </div>
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-white/20 rounded-full mb-4">
                <Package className="w-8 h-8 text-white" />
              </div>
              <div className="text-5xl font-bold text-white mb-2">450K</div>
              <div className="text-emerald-100">Repas servis/mois</div>
            </div>
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-white/20 rounded-full mb-4">
                <Bus className="w-8 h-8 text-white" />
              </div>
              <div className="text-5xl font-bold text-white mb-2">25</div>
              <div className="text-emerald-100">Véhicules de transport</div>
            </div>
          </div>
        </div>
      </section>

      {/* Témoignages */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">Témoignages</h2>
          <p className="text-xl text-gray-600">
            Ce que nos étudiants disent de nos services
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 bg-gradient-to-r from-emerald-600 to-emerald-700 rounded-full flex items-center justify-center text-white font-bold text-xl">
                A
              </div>
              <div className="ml-4">
                <div className="font-semibold text-gray-900">Aminata Diallo</div>
                <div className="text-sm text-gray-600">Faculté des Sciences</div>
              </div>
            </div>
            <p className="text-gray-700 italic">
              "Le CROU m'a vraiment facilité la vie. Je peux me concentrer sur mes études sans me soucier du logement et de la restauration."
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 bg-gradient-to-r from-orange-600 to-orange-700 rounded-full flex items-center justify-center text-white font-bold text-xl">
                I
              </div>
              <div className="ml-4">
                <div className="font-semibold text-gray-900">Ibrahim Souley</div>
                <div className="text-sm text-gray-600">Faculté de Droit</div>
              </div>
            </div>
            <p className="text-gray-700 italic">
              "Les navettes sont ponctuelles et gratuites. C'est un vrai plus pour les étudiants qui habitent loin du campus."
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-blue-700 rounded-full flex items-center justify-center text-white font-bold text-xl">
                F
              </div>
              <div className="ml-4">
                <div className="font-semibold text-gray-900">Fatouma Mamane</div>
                <div className="text-sm text-gray-600">Faculté de Médecine</div>
              </div>
            </div>
            <p className="text-gray-700 italic">
              "L'inscription en ligne est simple et rapide. J'ai pu tout faire depuis chez moi sans me déplacer."
            </p>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-16 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Rejoignez le CROU Niger
          </h2>
          <p className="text-xl text-gray-600 mb-8">
            Inscrivez-vous dès maintenant pour bénéficier de tous nos services
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/register">
              <ModernButton
                variant="gradient-crou"
                size="lg"
              >
                S'inscrire maintenant
                <ArrowRight className="ml-2 w-5 h-5" />
              </ModernButton>
            </Link>
            <Link to="/help">
              <ModernButton
                variant="outline"
                size="lg"
              >
                En savoir plus
              </ModernButton>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-lg font-bold mb-4">CROU Niger</h3>
              <p className="text-gray-400 text-sm">
                Centre Régional des Œuvres Universitaires du Niger
              </p>
            </div>
            <div>
              <h3 className="text-lg font-bold mb-4">Services</h3>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><a href="#" className="hover:text-white">Logement</a></li>
                <li><a href="#" className="hover:text-white">Restauration</a></li>
                <li><a href="#" className="hover:text-white">Transport</a></li>
                <li><a href="#" className="hover:text-white">Inscription</a></li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-bold mb-4">Liens utiles</h3>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><Link to="/help" className="hover:text-white">FAQ</Link></li>
                <li><a href="#" className="hover:text-white">Contact</a></li>
                <li><a href="#" className="hover:text-white">Mentions légales</a></li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-bold mb-4">Contact</h3>
              <p className="text-sm text-gray-400 mb-2">
                Niamey, Niger<br />
                Email: contact@crou.ne<br />
                Tél: +227 XX XX XX XX
              </p>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-sm text-gray-400">
            <p>&copy; 2024 CROU Niger. Tous droits réservés.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default HomePage;

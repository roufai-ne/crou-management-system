/**
 * FICHIER: apps/web/src/pages/help/FAQPage.tsx
 * PAGE: FAQPage - Foire aux Questions CROU
 *
 * DESCRIPTION:
 * Page d'aide avec questions fréquentes organisées par catégorie
 * Utilise ModernAccordion pour une navigation intuitive
 * Support recherche et filtrage par module
 *
 * CATÉGORIES:
 * - Inscription et Services
 * - Logement Universitaire
 * - Restauration
 * - Transport
 * - Finance et Paiement
 * - Technique et Compte
 *
 * AUTEUR: Équipe CROU
 * DATE: Novembre 2024
 */

import React, { useState } from 'react';
import { Search, HelpCircle, User, Home, Package, Bus, CreditCard, Settings, Mail, Phone, MapPin } from 'lucide-react';
import ModernAccordion, { AccordionItem } from '@/components/ui/ModernAccordion';
import { Input } from '@/components/ui/Input';
import ModernTabs, { Tab } from '@/components/ui/ModernTabs';

export const FAQPage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');

  // Questions par catégorie
  const inscriptionFAQ: AccordionItem[] = [
    {
      id: 'inscription-1',
      title: 'Comment m\'inscrire aux services du CROU ?',
      icon: User,
      content: (
        <div className="space-y-3">
          <p>Pour vous inscrire aux services du CROU Niger, suivez ces étapes :</p>
          <ol className="list-decimal ml-5 space-y-2">
            <li><strong>Connexion</strong> : Connectez-vous avec vos identifiants universitaires</li>
            <li><strong>Formulaire</strong> : Remplissez le formulaire d'inscription en ligne</li>
            <li><strong>Documents</strong> : Téléchargez les documents requis (photo, CNI, certificat)</li>
            <li><strong>Services</strong> : Choisissez les services souhaités (logement, restauration, transport)</li>
            <li><strong>Paiement</strong> : Effectuez le paiement des frais d'inscription</li>
            <li><strong>Confirmation</strong> : Recevez votre confirmation par email</li>
          </ol>
          <div className="mt-4 p-3 bg-emerald-50 rounded-lg border border-emerald-200">
            <p className="text-sm text-emerald-800">
              💡 <strong>Astuce</strong> : L'inscription en ligne est disponible du 1er juillet au 30 septembre de chaque année.
            </p>
          </div>
        </div>
      ),
    },
    {
      id: 'inscription-2',
      title: 'Quels documents sont nécessaires pour l\'inscription ?',
      icon: User,
      content: (
        <div className="space-y-3">
          <p>Documents obligatoires pour l'inscription :</p>
          <ul className="list-disc ml-5 space-y-2">
            <li><strong>Photo d'identité récente</strong> (format JPG/PNG, max 2MB)</li>
            <li><strong>Carte d'identité nationale</strong> (recto-verso, format PDF ou image)</li>
            <li><strong>Certificat d'inscription</strong> délivré par votre faculté</li>
            <li><strong>Attestation de bourse</strong> (si boursier)</li>
            <li><strong>Justificatif de paiement</strong> des frais universitaires</li>
          </ul>
          <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-sm text-blue-800">
              📄 Tous les documents doivent être au format PDF ou image (JPG, PNG) et ne pas dépasser 5MB chacun.
            </p>
          </div>
        </div>
      ),
    },
    {
      id: 'inscription-3',
      title: 'Puis-je modifier mon inscription après validation ?',
      icon: User,
      content: (
        <div className="space-y-3">
          <p>Oui, certaines modifications sont possibles :</p>
          <ul className="list-disc ml-5 space-y-2">
            <li><strong>Avant le paiement</strong> : Toutes les informations sont modifiables</li>
            <li><strong>Après le paiement</strong> : Contactez le service administratif pour :
              <ul className="list-circle ml-5 mt-1">
                <li>Changement de type de logement (sous réserve de disponibilité)</li>
                <li>Modification de formule restauration</li>
                <li>Ajout/suppression de services</li>
              </ul>
            </li>
            <li><strong>Informations personnelles</strong> : Rendez-vous au bureau avec justificatifs</li>
          </ul>
          <div className="mt-4 p-3 bg-orange-50 rounded-lg border border-orange-200">
            <p className="text-sm text-orange-800">
              ⚠️ Les remboursements ne sont possibles que dans les 15 jours suivant le paiement.
            </p>
          </div>
        </div>
      ),
    },
  ];

  const logementFAQ: AccordionItem[] = [
    {
      id: 'logement-1',
      title: 'Quelle est la procédure de réservation de chambre ?',
      icon: Home,
      content: (
        <div className="space-y-3">
          <p>Étapes pour réserver une chambre universitaire :</p>
          <ol className="list-decimal ml-5 space-y-2">
            <li><strong>Vérification</strong> : Consultez la disponibilité sur votre espace étudiant</li>
            <li><strong>Choix</strong> : Sélectionnez la cité et le type de chambre souhaités</li>
            <li><strong>Réservation</strong> : Validez votre choix (réservation valable 48h)</li>
            <li><strong>Paiement</strong> : Payez les frais de logement dans les 48h</li>
            <li><strong>Attribution</strong> : Recevez votre numéro de chambre par email</li>
            <li><strong>Installation</strong> : Présentez-vous au bureau de la cité avec :
              <ul className="list-circle ml-5 mt-1">
                <li>Confirmation de paiement</li>
                <li>Carte d'étudiant</li>
                <li>Pièce d'identité</li>
              </ul>
            </li>
          </ol>
        </div>
      ),
    },
    {
      id: 'logement-2',
      title: 'Quelles sont les différences entre les types de chambres ?',
      icon: Home,
      content: (
        <div className="space-y-4">
          <div className="p-4 bg-emerald-50 rounded-lg border border-emerald-200">
            <h4 className="font-semibold text-emerald-900 mb-2">Chambre Simple - 50,000 FCFA/an</h4>
            <ul className="text-sm text-emerald-800 space-y-1">
              <li>• 1 occupant</li>
              <li>• Lit simple, bureau, armoire</li>
              <li>• Plus de tranquillité pour étudier</li>
              <li>• Disponibilité limitée</li>
            </ul>
          </div>
          <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
            <h4 className="font-semibold text-blue-900 mb-2">Chambre Double - 35,000 FCFA/an</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• 2 occupants</li>
              <li>• 2 lits, 2 bureaux, 2 armoires</li>
              <li>• Bon compromis prix/confort</li>
              <li>• Type le plus courant</li>
            </ul>
          </div>
          <div className="p-4 bg-orange-50 rounded-lg border border-orange-200">
            <h4 className="font-semibold text-orange-900 mb-2">Chambre Triple - 25,000 FCFA/an</h4>
            <ul className="text-sm text-orange-800 space-y-1">
              <li>• 3 occupants</li>
              <li>• 3 lits, 3 bureaux, 3 armoires</li>
              <li>• Option la plus économique</li>
              <li>• Vie communautaire</li>
            </ul>
          </div>
          <p className="text-sm text-gray-600 mt-3">
            Toutes les chambres disposent d'un accès WiFi, d'une salle de bain commune par étage et d'une cuisine collective.
          </p>
        </div>
      ),
    },
    {
      id: 'logement-3',
      title: 'Que faire en cas de problème dans ma chambre ?',
      icon: Home,
      content: (
        <div className="space-y-3">
          <p>En cas de problème technique ou autre :</p>
          <ol className="list-decimal ml-5 space-y-2">
            <li><strong>Signalement immédiat</strong> : Contactez le gardien de la cité</li>
            <li><strong>Ticket en ligne</strong> : Créez un ticket de maintenance sur votre espace</li>
            <li><strong>Urgences</strong> : Pour les urgences (fuite d'eau, électricité), appelez le numéro d'urgence affiché</li>
            <li><strong>Suivi</strong> : Suivez l'évolution de votre demande en ligne</li>
          </ol>
          <div className="mt-4 p-3 bg-red-50 rounded-lg border border-red-200">
            <p className="text-sm text-red-800">
              🚨 <strong>Urgences 24/7</strong> : +227 XX XX XX XX
            </p>
          </div>
        </div>
      ),
    },
  ];

  const restaurationFAQ: AccordionItem[] = [
    {
      id: 'restauration-1',
      title: 'Comment fonctionne le service de restauration ?',
      icon: Package,
      content: (
        <div className="space-y-3">
          <p>Le service de restauration universitaire fonctionne avec un système de tickets :</p>
          <ul className="list-disc ml-5 space-y-2">
            <li><strong>Ticket Restaurant</strong> : Carte rechargeable à commander lors de l'inscription</li>
            <li><strong>Horaires</strong> :
              <ul className="list-circle ml-5 mt-1">
                <li>Petit-déjeuner : 7h00 - 9h00</li>
                <li>Déjeuner : 12h00 - 14h30</li>
                <li>Dîner : 19h00 - 21h00</li>
              </ul>
            </li>
            <li><strong>Formules disponibles</strong> :
              <ul className="list-circle ml-5 mt-1">
                <li>Basic : 2 repas/jour (déjeuner + dîner) - 20,000 FCFA/mois</li>
                <li>Premium : 3 repas/jour - 30,000 FCFA/mois</li>
              </ul>
            </li>
          </ul>
        </div>
      ),
    },
    {
      id: 'restauration-2',
      title: 'Puis-je inviter quelqu\'un au restaurant ?',
      icon: Package,
      content: (
        <div className="space-y-3">
          <p>Oui, vous pouvez inviter des personnes externes :</p>
          <ul className="list-disc ml-5 space-y-2">
            <li><strong>Ticket visiteur</strong> : Achetez un ticket visiteur à l'entrée (2,000 FCFA/repas)</li>
            <li><strong>Limite</strong> : Maximum 2 invités par repas</li>
            <li><strong>Condition</strong> : Vous devez être présent avec vos invités</li>
          </ul>
          <p className="text-sm text-gray-600 mt-3">
            Les tickets visiteurs sont valables uniquement pour le repas du jour et ne sont pas remboursables.
          </p>
        </div>
      ),
    },
  ];

  const transportFAQ: AccordionItem[] = [
    {
      id: 'transport-1',
      title: 'Quels sont les services de transport disponibles ?',
      icon: Bus,
      content: (
        <div className="space-y-3">
          <p>Le CROU propose des navettes gratuites :</p>
          <ul className="list-disc ml-5 space-y-2">
            <li><strong>Campus ↔ Cités Universitaires</strong> :
              <ul className="list-circle ml-5 mt-1">
                <li>Départs toutes les 30 minutes</li>
                <li>Premier départ : 6h30</li>
                <li>Dernier départ : 21h00</li>
              </ul>
            </li>
            <li><strong>Campus ↔ Centre-ville</strong> :
              <ul className="list-circle ml-5 mt-1">
                <li>Départs toutes les heures</li>
                <li>Service de 7h00 à 19h00</li>
              </ul>
            </li>
          </ul>
          <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-sm text-blue-800">
              🚌 Carte de transport obligatoire : 10,000 FCFA/an (incluse dans l'abonnement transport)
            </p>
          </div>
        </div>
      ),
    },
    {
      id: 'transport-2',
      title: 'Comment obtenir ma carte de transport ?',
      icon: Bus,
      content: (
        <div className="space-y-3">
          <p>Pour obtenir votre carte de transport :</p>
          <ol className="list-decimal ml-5 space-y-2">
            <li>Cochez "Service Transport" lors de votre inscription</li>
            <li>Payez les frais d'abonnement (10,000 FCFA/an)</li>
            <li>Prenez une photo lors de votre inscription</li>
            <li>Retirez votre carte au bureau du CROU sous 72h</li>
          </ol>
          <p className="text-sm text-gray-600 mt-3">
            La carte est nominative et non transférable. En cas de perte, des frais de 2,000 FCFA s'appliquent pour un duplicata.
          </p>
        </div>
      ),
    },
  ];

  const paiementFAQ: AccordionItem[] = [
    {
      id: 'paiement-1',
      title: 'Quels modes de paiement sont acceptés ?',
      icon: CreditCard,
      content: (
        <div className="space-y-4">
          <p>Le CROU accepte plusieurs modes de paiement :</p>
          <div className="grid gap-3">
            <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
              <h4 className="font-semibold text-gray-900 mb-1">💵 Espèces</h4>
              <p className="text-sm text-gray-600">Paiement au guichet du CROU (8h-17h, lundi-vendredi)</p>
            </div>
            <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
              <h4 className="font-semibold text-gray-900 mb-1">🏦 Virement bancaire</h4>
              <p className="text-sm text-gray-600">
                Banque : Banque Atlantique Niger<br />
                IBAN : NE XX XXXX XXXX XXXX XXXX XXXX<br />
                Code BIC : BATLNENN
              </p>
            </div>
            <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
              <h4 className="font-semibold text-gray-900 mb-1">📱 Mobile Money</h4>
              <p className="text-sm text-gray-600">Orange Money et Moov Money (frais de 1% appliqués)</p>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 'paiement-2',
      title: 'Comment obtenir un reçu de paiement ?',
      icon: CreditCard,
      content: (
        <div className="space-y-3">
          <p>Après chaque paiement :</p>
          <ul className="list-disc ml-5 space-y-2">
            <li><strong>Paiement en ligne</strong> : Reçu automatique par email + téléchargeable sur votre espace</li>
            <li><strong>Paiement au guichet</strong> : Reçu papier remis immédiatement</li>
            <li><strong>Virement bancaire</strong> : Reçu disponible sous 48h sur votre espace</li>
          </ul>
          <p className="text-sm text-gray-600 mt-3">
            Conservez tous vos reçus. Ils sont nécessaires pour toute réclamation.
          </p>
        </div>
      ),
    },
    {
      id: 'paiement-3',
      title: 'Que faire si mon paiement n\'apparaît pas ?',
      icon: CreditCard,
      content: (
        <div className="space-y-3">
          <p>Si votre paiement n'est pas visible sur votre compte :</p>
          <ol className="list-decimal ml-5 space-y-2">
            <li><strong>Délai</strong> : Attendez 24-48h (délais bancaires)</li>
            <li><strong>Vérification</strong> : Vérifiez que le montant a bien été débité</li>
            <li><strong>Preuve</strong> : Préparez votre preuve de paiement (reçu, relevé bancaire)</li>
            <li><strong>Contact</strong> : Contactez le service financier avec :
              <ul className="list-circle ml-5 mt-1">
                <li>Votre numéro étudiant</li>
                <li>Date et montant du paiement</li>
                <li>Copie du justificatif</li>
              </ul>
            </li>
          </ol>
          <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-sm text-blue-800">
              📧 Email : finance@crou.ne<br />
              📞 Tél : +227 XX XX XX XX
            </p>
          </div>
        </div>
      ),
    },
  ];

  const techniqueFAQ: AccordionItem[] = [
    {
      id: 'technique-1',
      title: 'J\'ai oublié mon mot de passe, que faire ?',
      icon: Settings,
      content: (
        <div className="space-y-3">
          <p>Pour réinitialiser votre mot de passe :</p>
          <ol className="list-decimal ml-5 space-y-2">
            <li>Cliquez sur "Mot de passe oublié" sur la page de connexion</li>
            <li>Entrez votre numéro étudiant ou email</li>
            <li>Consultez votre email pour le lien de réinitialisation</li>
            <li>Créez un nouveau mot de passe (min. 8 caractères)</li>
            <li>Connectez-vous avec vos nouveaux identifiants</li>
          </ol>
          <div className="mt-4 p-3 bg-orange-50 rounded-lg border border-orange-200">
            <p className="text-sm text-orange-800">
              ⏰ Le lien de réinitialisation expire après 1 heure. Si expiré, recommencez la procédure.
            </p>
          </div>
        </div>
      ),
    },
    {
      id: 'technique-2',
      title: 'Comment mettre à jour mes informations personnelles ?',
      icon: Settings,
      content: (
        <div className="space-y-3">
          <p>Pour modifier vos informations :</p>
          <ol className="list-decimal ml-5 space-y-2">
            <li>Connectez-vous à votre espace étudiant</li>
            <li>Accédez à "Mon Profil"</li>
            <li>Modifiez les informations autorisées :
              <ul className="list-circle ml-5 mt-1">
                <li>Numéro de téléphone</li>
                <li>Adresse email secondaire</li>
                <li>Adresse postale</li>
              </ul>
            </li>
            <li>Sauvegardez les modifications</li>
          </ol>
          <p className="text-sm text-gray-600 mt-3">
            <strong>Note</strong> : Les informations d'état civil (nom, prénom, date de naissance) ne peuvent être modifiées qu'au bureau avec justificatifs.
          </p>
        </div>
      ),
    },
  ];

  // Configuration des onglets
  const faqTabs: Tab[] = [
    {
      id: 'inscription',
      label: 'Inscription',
      icon: User,
      badge: inscriptionFAQ.length.toString(),
      content: (
        <ModernAccordion
          items={inscriptionFAQ}
          mode="single"
          variant="default"
        />
      ),
    },
    {
      id: 'logement',
      label: 'Logement',
      icon: Home,
      badge: logementFAQ.length.toString(),
      content: (
        <ModernAccordion
          items={logementFAQ}
          mode="single"
          variant="default"
        />
      ),
    },
    {
      id: 'restauration',
      label: 'Restauration',
      icon: Package,
      badge: restaurationFAQ.length.toString(),
      content: (
        <ModernAccordion
          items={restaurationFAQ}
          mode="single"
          variant="default"
        />
      ),
    },
    {
      id: 'transport',
      label: 'Transport',
      icon: Bus,
      badge: transportFAQ.length.toString(),
      content: (
        <ModernAccordion
          items={transportFAQ}
          mode="single"
          variant="default"
        />
      ),
    },
    {
      id: 'paiement',
      label: 'Paiement',
      icon: CreditCard,
      badge: paiementFAQ.length.toString(),
      content: (
        <ModernAccordion
          items={paiementFAQ}
          mode="single"
          variant="default"
        />
      ),
    },
    {
      id: 'technique',
      label: 'Technique',
      icon: Settings,
      badge: techniqueFAQ.length.toString(),
      content: (
        <ModernAccordion
          items={techniqueFAQ}
          mode="single"
          variant="default"
        />
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-emerald-600 to-orange-600 rounded-full mb-4">
            <HelpCircle className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Foire Aux Questions
          </h1>
          <p className="text-lg text-gray-600">
            Trouvez rapidement les réponses à vos questions sur les services du CROU
          </p>
        </div>

        {/* Recherche */}
        <div className="mb-8">
          <Input
            placeholder="Rechercher une question..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            icon={Search}
            iconPosition="left"
            className="max-w-2xl mx-auto"
          />
        </div>

        {/* FAQ par catégories avec Tabs */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <ModernTabs
            tabs={faqTabs}
            variant="pills"
            size="md"
          />
        </div>

        {/* Besoin d'aide supplémentaire */}
        <div className="mt-8 bg-gradient-to-r from-emerald-600 to-orange-600 rounded-xl shadow-lg p-8 text-white">
          <h2 className="text-2xl font-bold mb-4">Vous ne trouvez pas de réponse ?</h2>
          <p className="text-emerald-100 mb-6">
            Notre équipe est là pour vous aider. Contactez-nous par les moyens suivants :
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-3 p-4 bg-white/10 rounded-lg backdrop-blur-sm">
              <Mail className="w-6 h-6" />
              <div>
                <div className="text-sm text-emerald-100">Email</div>
                <div className="font-semibold">contact@crou.ne</div>
              </div>
            </div>
            <div className="flex items-center gap-3 p-4 bg-white/10 rounded-lg backdrop-blur-sm">
              <Phone className="w-6 h-6" />
              <div>
                <div className="text-sm text-emerald-100">Téléphone</div>
                <div className="font-semibold">+227 XX XX XX XX</div>
              </div>
            </div>
            <div className="flex items-center gap-3 p-4 bg-white/10 rounded-lg backdrop-blur-sm">
              <MapPin className="w-6 h-6" />
              <div>
                <div className="text-sm text-emerald-100">Adresse</div>
                <div className="font-semibold">Niamey, Niger</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FAQPage;

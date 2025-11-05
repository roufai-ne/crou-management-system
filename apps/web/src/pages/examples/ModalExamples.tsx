/**
 * FICHIER: apps\web\src\pages\examples\ModalExamples.tsx
 * PAGE: Exemples d'utilisation des composants Modal du système de design CROU
 * 
 * DESCRIPTION:
 * Page de démonstration complète des composants modal
 * Exemples pratiques dans le contexte CROU
 * 
 * EXEMPLES:
 * - Modals de base avec différentes configurations
 * - Formulaires dans des modals
 * - AlertDialogs pour confirmations
 * - DrawerModals pour navigation
 * - Cas d'usage spécifiques CROU
 * 
 * AUTEUR: Équipe CROU
 * DATE: Décembre 2024
 */

import React, { useState } from 'react';
import {
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
  AlertDialog,
  DrawerModal
} from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';

const ModalExamples: React.FC = () => {
  // États pour les différents modals
  const [basicModal, setBasicModal] = useState(false);
  const [formModal, setFormModal] = useState(false);
  const [confirmModal, setConfirmModal] = useState(false);
  const [infoModal, setInfoModal] = useState(false);
  const [successModal, setSuccessModal] = useState(false);
  const [warningModal, setWarningModal] = useState(false);
  const [errorModal, setErrorModal] = useState(false);
  const [drawerLeft, setDrawerLeft] = useState(false);
  const [drawerRight, setDrawerRight] = useState(false);
  const [drawerTop, setDrawerTop] = useState(false);
  const [drawerBottom, setDrawerBottom] = useState(false);
  const [studentModal, setStudentModal] = useState(false);
  const [reservationModal, setReservationModal] = useState(false);
  const [deleteModal, setDeleteModal] = useState(false);
  
  // États pour les formulaires
  const [formData, setFormData] = useState({
    nom: '',
    prenom: '',
    email: '',
    telephone: '',
    formation: '',
    annee: '',
    message: ''
  });
  
  const [reservationData, setReservationData] = useState({
    restaurant: '',
    date: '',
    heure: '',
    personnes: '1',
    regime: ''
  });
  
  const [loading, setLoading] = useState(false);
  
  // Données d'exemple
  const studentData = {
    id: 'ETU001',
    nom: 'Martin',
    prenom: 'Dubois',
    email: 'martin.dubois@etudiant.univ-example.fr',
    telephone: '06 12 34 56 78',
    formation: 'Master Informatique',
    annee: '2ème année',
    statut: 'Boursier',
    residence: 'Résidence Universitaire A',
    chambre: '205',
    dateInscription: '15/09/2024'
  };
  
  const restaurants = [
    { value: 'ru-centre', label: 'RU Centre-ville' },
    { value: 'ru-campus', label: 'RU Campus Sciences' },
    { value: 'ru-lettres', label: 'RU Lettres et Sciences Humaines' }
  ];
  
  const formations = [
    { value: 'licence-info', label: 'Licence Informatique' },
    { value: 'master-info', label: 'Master Informatique' },
    { value: 'licence-math', label: 'Licence Mathématiques' },
    { value: 'master-math', label: 'Master Mathématiques' }
  ];
  
  const regimes = [
    { value: 'normal', label: 'Normal' },
    { value: 'vegetarien', label: 'Végétarien' },
    { value: 'vegan', label: 'Végan' },
    { value: 'sans-gluten', label: 'Sans gluten' }
  ];
  
  // Handlers
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    // Simulation d'une requête
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    console.log('Données du formulaire:', formData);
    setLoading(false);
    setFormModal(false);
    setSuccessModal(true);
  };
  
  const handleReservationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    // Simulation d'une requête
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    console.log('Données de réservation:', reservationData);
    setLoading(false);
    setReservationModal(false);
    setSuccessModal(true);
  };
  
  const handleDelete = async () => {
    setLoading(true);
    
    // Simulation d'une requête de suppression
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    console.log('Étudiant supprimé');
    setLoading(false);
    setDeleteModal(false);
    setSuccessModal(true);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-4">
          Composants Modal
        </h1>
        <p className="text-lg text-gray-600 dark:text-gray-400">
          Exemples d'utilisation des modals, dialogs et drawers dans le contexte CROU
        </p>
      </div>

      <div className="space-y-8">
        {/* Modals de base */}
        <Card>
          <CardHeader>
            <h2 className="text-xl font-semibold">Modals de base</h2>
            <p className="text-gray-600 dark:text-gray-400">
              Modals simples avec différentes configurations
            </p>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4">
              <Button onClick={() => setBasicModal(true)}>
                Modal basique
              </Button>
              
              <Button onClick={() => setFormModal(true)}>
                Modal avec formulaire
              </Button>
              
              <Button onClick={() => setStudentModal(true)}>
                Détails étudiant
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* AlertDialogs */}
        <Card>
          <CardHeader>
            <h2 className="text-xl font-semibold">AlertDialogs</h2>
            <p className="text-gray-600 dark:text-gray-400">
              Dialogs de confirmation et d'information
            </p>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4">
              <Button variant="outline" onClick={() => setInfoModal(true)}>
                Information
              </Button>
              
              <Button variant="primary" onClick={() => setSuccessModal(true)}>
                Succès
              </Button>
              
              <Button variant="warning" onClick={() => setWarningModal(true)}>
                Avertissement
              </Button>
              
              <Button variant="danger" onClick={() => setDeleteModal(true)}>
                Suppression
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* DrawerModals */}
        <Card>
          <CardHeader>
            <h2 className="text-xl font-semibold">DrawerModals</h2>
            <p className="text-gray-600 dark:text-gray-400">
              Panneaux latéraux pour navigation et actions
            </p>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4">
              <Button onClick={() => setDrawerLeft(true)}>
                Drawer Gauche
              </Button>
              
              <Button onClick={() => setDrawerRight(true)}>
                Drawer Droite
              </Button>
              
              <Button onClick={() => setDrawerTop(true)}>
                Drawer Haut
              </Button>
              
              <Button onClick={() => setDrawerBottom(true)}>
                Drawer Bas
              </Button>
              
              <Button onClick={() => setReservationModal(true)}>
                Réservation repas
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Cas d'usage CROU */}
        <Card>
          <CardHeader>
            <h2 className="text-xl font-semibold">Cas d'usage CROU</h2>
            <p className="text-gray-600 dark:text-gray-400">
              Exemples spécifiques aux besoins du CROU
            </p>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                <h3 className="font-semibold mb-2">Gestion des étudiants</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                  Consultation et modification des informations étudiants
                </p>
                <Button size="sm" onClick={() => setStudentModal(true)}>
                  Voir exemple
                </Button>
              </div>
              
              <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                <h3 className="font-semibold mb-2">Réservations repas</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                  Système de réservation pour les restaurants universitaires
                </p>
                <Button size="sm" onClick={() => setReservationModal(true)}>
                  Réserver
                </Button>
              </div>
              
              <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                <h3 className="font-semibold mb-2">Actions critiques</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                  Confirmations pour les actions irréversibles
                </p>
                <Button size="sm" variant="danger" onClick={() => setDeleteModal(true)}>
                  Supprimer
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Modal basique */}
      <Modal isOpen={basicModal} onClose={() => setBasicModal(false)}>
        <ModalHeader 
          title="Modal basique"
          subtitle="Exemple de modal simple"
          onClose={() => setBasicModal(false)}
        />
        <ModalBody>
          <p className="mb-4">
            Ceci est un exemple de modal basique avec un en-tête, un corps et un pied de page.
          </p>
          <p>
            Les modals sont utiles pour afficher des informations importantes ou 
            demander une confirmation à l'utilisateur sans quitter la page actuelle.
          </p>
        </ModalBody>
        <ModalFooter>
          <Button variant="outline" onClick={() => setBasicModal(false)}>
            Fermer
          </Button>
          <Button onClick={() => setBasicModal(false)}>
            Compris
          </Button>
        </ModalFooter>
      </Modal>

      {/* Modal avec formulaire */}
      <Modal isOpen={formModal} onClose={() => setFormModal(false)} size="lg">
        <ModalHeader 
          title="Nouveau contact étudiant"
          subtitle="Ajouter les informations d'un nouvel étudiant"
          onClose={() => setFormModal(false)}
        />
        
        <form onSubmit={handleFormSubmit}>
          <ModalBody>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Nom"
                value={formData.nom}
                onChange={(e) => setFormData(prev => ({ ...prev, nom: e.target.value }))}
                required
              />
              
              <Input
                label="Prénom"
                value={formData.prenom}
                onChange={(e) => setFormData(prev => ({ ...prev, prenom: e.target.value }))}
                required
              />
              
              <Input
                label="Email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                required
              />
              
              <Input
                label="Téléphone"
                type="tel"
                value={formData.telephone}
                onChange={(e) => setFormData(prev => ({ ...prev, telephone: e.target.value }))}
              />
              
              <Select
                label="Formation"
                value={formData.formation}
                onValueChange={(value) => setFormData(prev => ({ ...prev, formation: value }))}
                options={formations}
                placeholder="Sélectionner une formation"
                required
              />
              
              <Select
                label="Année d'études"
                value={formData.annee}
                onValueChange={(value) => setFormData(prev => ({ ...prev, annee: value }))}
                options={[
                  { value: '1', label: '1ère année' },
                  { value: '2', label: '2ème année' },
                  { value: '3', label: '3ème année' }
                ]}
                placeholder="Sélectionner l'année"
                required
              />
            </div>
            
            <div className="mt-4">
              <Input
                label="Message ou remarques"
                multiline
                rows={3}
                value={formData.message}
                onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
                placeholder="Informations complémentaires..."
              />
            </div>
          </ModalBody>
          
          <ModalFooter>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setFormModal(false)}
              disabled={loading}
            >
              Annuler
            </Button>
            <Button type="submit" loading={loading}>
              Enregistrer
            </Button>
          </ModalFooter>
        </form>
      </Modal>

      {/* Modal détails étudiant */}
      <Modal isOpen={studentModal} onClose={() => setStudentModal(false)} size="lg">
        <ModalHeader 
          title="Détails de l'étudiant"
          subtitle={`${studentData.prenom} ${studentData.nom} - ${studentData.id}`}
          onClose={() => setStudentModal(false)}
        />
        <ModalBody>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-3 flex items-center gap-2">
                Informations personnelles
                <Badge variant="success" size="sm">{studentData.statut}</Badge>
              </h4>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Email:</span>
                  <span className="font-medium">{studentData.email}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Téléphone:</span>
                  <span className="font-medium">{studentData.telephone}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Inscription:</span>
                  <span className="font-medium">{studentData.dateInscription}</span>
                </div>
              </div>
            </div>
            
            <div>
              <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">
                Formation
              </h4>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Formation:</span>
                  <span className="font-medium">{studentData.formation}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Année:</span>
                  <span className="font-medium">{studentData.annee}</span>
                </div>
              </div>
            </div>
            
            <div className="md:col-span-2">
              <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">
                Logement
              </h4>
              <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <p className="font-medium">{studentData.residence}</p>
                <p className="text-gray-600 dark:text-gray-400">Chambre {studentData.chambre}</p>
              </div>
            </div>
          </div>
        </ModalBody>
        <ModalFooter>
          <Button variant="outline" onClick={() => setStudentModal(false)}>
            Fermer
          </Button>
          <Button>
            Modifier
          </Button>
        </ModalFooter>
      </Modal>

      {/* AlertDialogs */}
      <AlertDialog
        isOpen={infoModal}
        onClose={() => setInfoModal(false)}
        type="info"
        title="Information"
        message="Votre demande a été enregistrée avec succès. Vous recevrez une confirmation par email."
      />

      <AlertDialog
        isOpen={successModal}
        onClose={() => setSuccessModal(false)}
        type="success"
        title="Opération réussie"
        message="L'action a été effectuée avec succès."
      />

      <AlertDialog
        isOpen={warningModal}
        onClose={() => setWarningModal(false)}
        type="warning"
        title="Attention"
        message="Cette action modifiera définitivement les données. Êtes-vous sûr de vouloir continuer ?"
        confirmText="Continuer"
        onConfirm={() => setWarningModal(false)}
      />

      <AlertDialog
        isOpen={deleteModal}
        onClose={() => setDeleteModal(false)}
        type="error"
        title="Confirmer la suppression"
        message="Êtes-vous sûr de vouloir supprimer cet étudiant ? Cette action est irréversible et supprimera toutes les données associées."
        confirmText="Supprimer définitivement"
        cancelText="Annuler"
        onConfirm={handleDelete}
        loading={loading}
      />

      {/* DrawerModals */}
      <DrawerModal
        isOpen={drawerLeft}
        onClose={() => setDrawerLeft(false)}
        position="left"
        title="Navigation"
      >
        <div className="p-6">
          <nav className="space-y-2">
            <a href="#" className="block p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded">
              Tableau de bord
            </a>
            <a href="#" className="block p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded">
              Étudiants
            </a>
            <a href="#" className="block p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded">
              Restaurants
            </a>
            <a href="#" className="block p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded">
              Réservations
            </a>
            <a href="#" className="block p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded">
              Paramètres
            </a>
          </nav>
        </div>
      </DrawerModal>

      <DrawerModal
        isOpen={drawerRight}
        onClose={() => setDrawerRight(false)}
        position="right"
        title="Filtres"
        size="sm"
      >
        <div className="p-6 space-y-4">
          <Select
            label="Formation"
            options={formations}
            placeholder="Toutes les formations"
          />
          
          <Select
            label="Année"
            options={[
              { value: '1', label: '1ère année' },
              { value: '2', label: '2ème année' },
              { value: '3', label: '3ème année' }
            ]}
            placeholder="Toutes les années"
          />
          
          <Select
            label="Statut"
            options={[
              { value: 'boursier', label: 'Boursier' },
              { value: 'non-boursier', label: 'Non boursier' }
            ]}
            placeholder="Tous les statuts"
          />
          
          <div className="flex gap-2 pt-4">
            <Button size="sm" className="flex-1">
              Appliquer
            </Button>
            <Button size="sm" variant="outline" className="flex-1">
              Réinitialiser
            </Button>
          </div>
        </div>
      </DrawerModal>

      <DrawerModal
        isOpen={drawerTop}
        onClose={() => setDrawerTop(false)}
        position="top"
        title="Notifications"
      >
        <div className="p-6">
          <div className="space-y-3">
            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded">
              <p className="font-medium text-blue-900 dark:text-blue-100">Nouvelle réservation</p>
              <p className="text-sm text-blue-700 dark:text-blue-300">Martin Dubois a réservé pour demain</p>
            </div>
            
            <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded">
              <p className="font-medium text-green-900 dark:text-green-100">Inscription validée</p>
              <p className="text-sm text-green-700 dark:text-green-300">Sophie Martin est maintenant inscrite</p>
            </div>
          </div>
        </div>
      </DrawerModal>

      <DrawerModal
        isOpen={drawerBottom}
        onClose={() => setDrawerBottom(false)}
        position="bottom"
        title="Actions rapides"
      >
        <div className="p-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Button size="sm" className="h-16 flex-col">
              <span className="text-lg mb-1">👥</span>
              Nouvel étudiant
            </Button>
            
            <Button size="sm" className="h-16 flex-col" variant="outline">
              <span className="text-lg mb-1">🍽️</span>
              Réservation
            </Button>
            
            <Button size="sm" className="h-16 flex-col" variant="outline">
              <span className="text-lg mb-1">📊</span>
              Rapport
            </Button>
            
            <Button size="sm" className="h-16 flex-col" variant="outline">
              <span className="text-lg mb-1">⚙️</span>
              Paramètres
            </Button>
          </div>
        </div>
      </DrawerModal>

      {/* Modal réservation repas */}
      <DrawerModal
        isOpen={reservationModal}
        onClose={() => setReservationModal(false)}
        position="right"
        title="Réservation repas"
        size="md"
      >
        <form onSubmit={handleReservationSubmit}>
          <div className="p-6 space-y-4">
            <Select
              label="Restaurant"
              value={reservationData.restaurant}
              onValueChange={(value) => setReservationData(prev => ({ ...prev, restaurant: value }))}
              options={restaurants}
              placeholder="Choisir un restaurant"
              required
            />
            
            <Input
              label="Date"
              type="date"
              value={reservationData.date}
              onChange={(e) => setReservationData(prev => ({ ...prev, date: e.target.value }))}
              required
            />
            
            <Input
              label="Heure"
              type="time"
              value={reservationData.heure}
              onChange={(e) => setReservationData(prev => ({ ...prev, heure: e.target.value }))}
              required
            />
            
            <Select
              label="Nombre de personnes"
              value={reservationData.personnes}
              onValueChange={(value) => setReservationData(prev => ({ ...prev, personnes: value }))}
              options={[
                { value: '1', label: '1 personne' },
                { value: '2', label: '2 personnes' },
                { value: '3', label: '3 personnes' },
                { value: '4', label: '4 personnes' }
              ]}
              required
            />
            
            <Select
              label="Régime alimentaire"
              value={reservationData.regime}
              onValueChange={(value) => setReservationData(prev => ({ ...prev, regime: value }))}
              options={regimes}
              placeholder="Régime standard"
            />
            
            <div className="flex gap-2 pt-4">
              <Button 
                type="button" 
                variant="outline" 
                className="flex-1"
                onClick={() => setReservationModal(false)}
                disabled={loading}
              >
                Annuler
              </Button>
              <Button type="submit" className="flex-1" loading={loading}>
                Réserver
              </Button>
            </div>
          </div>
        </form>
      </DrawerModal>
    </div>
  );
};

export default ModalExamples;

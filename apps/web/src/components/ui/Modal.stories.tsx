/**
 * FICHIER: apps\web\src\components\ui\Modal.stories.tsx
 * STORYBOOK: Stories pour les composants Modal du système de design CROU
 * 
 * DESCRIPTION:
 * Stories Storybook pour tous les composants modal
 * Démonstration des différents types et configurations
 * 
 * STORIES:
 * - Modal de base avec différentes tailles
 * - Dialog avec header, body et footer
 * - AlertDialog pour confirmations
 * - DrawerModal pour panneaux latéraux
 * - Exemples d'usage dans le contexte CROU
 * 
 * AUTEUR: Équipe CROU
 * DATE: Décembre 2024
 */

import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { 
  Modal, 
  ModalHeader, 
  ModalBody, 
  ModalFooter,
  AlertDialog,
  DrawerModal
} from './Modal';
import { Button } from './Button';
import { Input } from './Input';

const meta: Meta<typeof Modal> = {
  title: 'Components/Modal',
  component: Modal,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Composants modal pour les overlays et dialogs du système CROU'
      }
    }
  },
  tags: ['autodocs']
};

export default meta;
type Story = StoryObj<typeof Modal>;

// Template pour les modals avec état
const ModalTemplate = (args: any) => {
  const [isOpen, setIsOpen] = useState(false);
  
  return (
    <>
      <Button onClick={() => setIsOpen(true)}>
        Ouvrir le modal
      </Button>
      
      <Modal
        {...args}
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
      >
        {args.children}
      </Modal>
    </>
  );
};

// Modal de base
export const Default: Story = {
  render: ModalTemplate,
  args: {
    children: (
      <>
        <ModalHeader 
          title="Modal par défaut"
          subtitle="Exemple de modal basique"
          onClose={() => {}}
        />
        <ModalBody>
          <p>Ceci est le contenu du modal par défaut.</p>
        </ModalBody>
        <ModalFooter>
          <Button variant="outline">Annuler</Button>
          <Button>Confirmer</Button>
        </ModalFooter>
      </>
    )
  }
};

// Différentes tailles
export const Sizes: Story = {
  render: () => {
    const [openModal, setOpenModal] = useState<string | null>(null);
    
    const sizes = [
      { key: 'sm', label: 'Petit (sm)' },
      { key: 'md', label: 'Moyen (md)' },
      { key: 'lg', label: 'Grand (lg)' },
      { key: 'xl', label: 'Très grand (xl)' }
    ];
    
    return (
      <div className="flex gap-4">
        {sizes.map(({ key, label }) => (
          <div key={key}>
            <Button onClick={() => setOpenModal(key)}>
              {label}
            </Button>
            
            <Modal
              isOpen={openModal === key}
              onClose={() => setOpenModal(null)}
              size={key as any}
            >
              <ModalHeader 
                title={`Modal ${label}`}
                onClose={() => setOpenModal(null)}
              />
              <ModalBody>
                <p>Contenu du modal de taille {key}.</p>
                <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. 
                   Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.</p>
              </ModalBody>
              <ModalFooter>
                <Button onClick={() => setOpenModal(null)}>Fermer</Button>
              </ModalFooter>
            </Modal>
          </div>
        ))}
      </div>
    );
  }
};

// Modal avec formulaire
export const WithForm: Story = {
  render: () => {
    const [isOpen, setIsOpen] = useState(false);
    const [formData, setFormData] = useState({
      nom: '',
      email: '',
      message: ''
    });
    
    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      console.log('Données du formulaire:', formData);
      setIsOpen(false);
    };
    
    return (
      <>
        <Button onClick={() => setIsOpen(true)}>
          Nouveau message
        </Button>
        
        <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} size="lg">
          <ModalHeader 
            title="Nouveau message"
            subtitle="Envoyer un message à l'équipe CROU"
            onClose={() => setIsOpen(false)}
          />
          
          <form onSubmit={handleSubmit}>
            <ModalBody>
              <div className="space-y-4">
                <Input
                  label="Nom complet"
                  value={formData.nom}
                  onChange={(e) => setFormData(prev => ({ ...prev, nom: e.target.value }))}
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
                  label="Message"
                  multiline
                  rows={4}
                  value={formData.message}
                  onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
                  required
                />
              </div>
            </ModalBody>
            
            <ModalFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setIsOpen(false)}
              >
                Annuler
              </Button>
              <Button type="submit">
                Envoyer
              </Button>
            </ModalFooter>
          </form>
        </Modal>
      </>
    );
  }
};

// AlertDialog
export const AlertDialogs: Story = {
  render: () => {
    const [openAlert, setOpenAlert] = useState<string | null>(null);
    
    const alerts = [
      { 
        key: 'info', 
        label: 'Information',
        type: 'info' as const,
        title: 'Information',
        message: 'Votre demande a été enregistrée avec succès.'
      },
      { 
        key: 'success', 
        label: 'Succès',
        type: 'success' as const,
        title: 'Opération réussie',
        message: 'Les modifications ont été sauvegardées.'
      },
      { 
        key: 'warning', 
        label: 'Avertissement',
        type: 'warning' as const,
        title: 'Attention',
        message: 'Cette action ne peut pas être annulée.'
      },
      { 
        key: 'error', 
        label: 'Erreur',
        type: 'error' as const,
        title: 'Erreur critique',
        message: 'Une erreur est survenue lors de la suppression.'
      }
    ];
    
    return (
      <div className="flex gap-4">
        {alerts.map(({ key, label, type, title, message }) => (
          <div key={key}>
            <Button 
              variant={type === 'error' ? 'danger' : type === 'warning' ? 'warning' : 'outline'}
              onClick={() => setOpenAlert(key)}
            >
              {label}
            </Button>
            
            <AlertDialog
              isOpen={openAlert === key}
              onClose={() => setOpenAlert(null)}
              type={type}
              title={title}
              message={message}
              onConfirm={() => {
                console.log(`Action confirmée pour ${key}`);
                setOpenAlert(null);
              }}
            />
          </div>
        ))}
      </div>
    );
  }
};

// DrawerModal
export const DrawerModals: Story = {
  render: () => {
    const [openDrawer, setOpenDrawer] = useState<string | null>(null);
    
    const drawers = [
      { key: 'left', label: 'Gauche', position: 'left' as const },
      { key: 'right', label: 'Droite', position: 'right' as const },
      { key: 'top', label: 'Haut', position: 'top' as const },
      { key: 'bottom', label: 'Bas', position: 'bottom' as const }
    ];
    
    return (
      <div className="flex gap-4">
        {drawers.map(({ key, label, position }) => (
          <div key={key}>
            <Button onClick={() => setOpenDrawer(key)}>
              Drawer {label}
            </Button>
            
            <DrawerModal
              isOpen={openDrawer === key}
              onClose={() => setOpenDrawer(null)}
              position={position}
              title={`Panneau ${label}`}
            >
              <div className="p-6">
                <h3 className="text-lg font-semibold mb-4">
                  Contenu du drawer
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  Ceci est un panneau latéral qui s'ouvre depuis le {label.toLowerCase()}.
                </p>
                
                <div className="space-y-4">
                  <Input label="Champ de saisie" />
                  <Input label="Autre champ" />
                  
                  <div className="flex gap-2 pt-4">
                    <Button size="sm">Action</Button>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => setOpenDrawer(null)}
                    >
                      Fermer
                    </Button>
                  </div>
                </div>
              </div>
            </DrawerModal>
          </div>
        ))}
      </div>
    );
  }
};

// Modal de confirmation de suppression (cas d'usage CROU)
export const DeleteConfirmation: Story = {
  render: () => {
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    
    const handleDelete = async () => {
      setLoading(true);
      // Simulation d'une requête
      await new Promise(resolve => setTimeout(resolve, 2000));
      setLoading(false);
      setIsOpen(false);
      console.log('Élément supprimé');
    };
    
    return (
      <>
        <Button variant="danger" onClick={() => setIsOpen(true)}>
          Supprimer l'étudiant
        </Button>
        
        <AlertDialog
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
          type="error"
          title="Confirmer la suppression"
          message="Êtes-vous sûr de vouloir supprimer cet étudiant ? Cette action est irréversible et supprimera toutes les données associées."
          confirmText="Supprimer définitivement"
          cancelText="Annuler"
          onConfirm={handleDelete}
          loading={loading}
        />
      </>
    );
  }
};

// Modal de détails étudiant (cas d'usage CROU)
export const StudentDetails: Story = {
  render: () => {
    const [isOpen, setIsOpen] = useState(false);
    
    const studentData = {
      nom: 'Martin Dubois',
      email: 'martin.dubois@etudiant.univ-example.fr',
      telephone: '06 12 34 56 78',
      formation: 'Master Informatique',
      annee: '2ème année',
      statut: 'Boursier',
      residence: 'Résidence Universitaire A - Chambre 205'
    };
    
    return (
      <>
        <Button onClick={() => setIsOpen(true)}>
          Voir les détails de l'étudiant
        </Button>
        
        <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} size="lg">
          <ModalHeader 
            title="Détails de l'étudiant"
            subtitle={studentData.nom}
            onClose={() => setIsOpen(false)}
          />
          
          <ModalBody>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">
                  Informations personnelles
                </h4>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">Email:</span>
                    <span className="ml-2">{studentData.email}</span>
                  </div>
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">Téléphone:</span>
                    <span className="ml-2">{studentData.telephone}</span>
                  </div>
                </div>
              </div>
              
              <div>
                <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">
                  Formation
                </h4>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">Formation:</span>
                    <span className="ml-2">{studentData.formation}</span>
                  </div>
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">Année:</span>
                    <span className="ml-2">{studentData.annee}</span>
                  </div>
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">Statut:</span>
                    <span className="ml-2">{studentData.statut}</span>
                  </div>
                </div>
              </div>
              
              <div className="md:col-span-2">
                <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">
                  Logement
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {studentData.residence}
                </p>
              </div>
            </div>
          </ModalBody>
          
          <ModalFooter>
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              Fermer
            </Button>
            <Button>
              Modifier
            </Button>
          </ModalFooter>
        </Modal>
      </>
    );
  }
};

/**
 * FICHIER: apps\web\src\pages\examples\BadgeExamples.tsx
 * PAGE: Exemples d'utilisation du composant Badge
 * 
 * DESCRIPTION:
 * Page de démonstration du composant Badge avec cas d'usage CROU
 * Exemples pratiques de statuts, étiquettes et indicateurs
 * Intégration dans des interfaces utilisateur réelles
 * 
 * SECTIONS:
 * - Badges de base avec variantes et styles
 * - Statuts étudiants et administratifs
 * - Notifications et compteurs
 * - Workflow et progression
 * - Groupes de badges organisés
 * - Cas d'usage CROU spécifiques
 * 
 * AUTEUR: Équipe CROU
 * DATE: Décembre 2024
 */

import React, { useState, useEffect } from 'react';
import { 
  CheckIcon,
  XMarkIcon,
  UserIcon,
  BellIcon,
  ExclamationTriangleIcon,
  StarIcon,
  ClockIcon,
  AcademicCapIcon,
  HomeIcon,
  CurrencyEuroIcon,
  ShoppingCartIcon,
  BuildingOfficeIcon,
  DocumentTextIcon,
  ChartBarIcon,
  Cog6ToothIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline';
import { 
  Badge, 
  StatusBadge, 
  StudentStatusBadge, 
  WorkflowStatusBadge, 
  BadgeGroup 
} from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { cn } from '@/utils/cn';

// Types pour les données
interface Student {
  id: number;
  name: string;
  status: 'enrolled' | 'graduated' | 'suspended' | 'transferred' | 'dropout' | 'exchange';
  scholarship: boolean;
  housing: boolean;
  notifications: number;
  preferences: string[];
}

interface Notification {
  id: number;
  type: 'info' | 'warning' | 'success' | 'error';
  title: string;
  message: string;
  isNew: boolean;
  timestamp: Date;
}

interface WorkflowItem {
  id: number;
  title: string;
  status: 'not_started' | 'in_progress' | 'review' | 'approved' | 'completed' | 'cancelled' | 'on_hold';
  progress?: number;
  assignee: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
}

const BadgeExamples: React.FC = () => {
  // États pour les données simulées
  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: 1,
      type: 'warning',
      title: 'Maintenance programmée',
      message: 'Maintenance des serveurs prévue ce soir de 22h à 2h',
      isNew: true,
      timestamp: new Date()
    },
    {
      id: 2,
      type: 'success',
      title: 'Demande approuvée',
      message: 'Votre demande de bourse a été approuvée',
      isNew: true,
      timestamp: new Date(Date.now() - 3600000)
    },
    {
      id: 3,
      type: 'info',
      title: 'Nouveau menu',
      message: 'Le menu de la semaine prochaine est disponible',
      isNew: false,
      timestamp: new Date(Date.now() - 7200000)
    }
  ]);
  
  const [students] = useState<Student[]>([
    {
      id: 1,
      name: 'Marie Dupont',
      status: 'enrolled',
      scholarship: true,
      housing: true,
      notifications: 3,
      preferences: ['Végétarien', 'Sans gluten', 'Bio']
    },
    {
      id: 2,
      name: 'Jean Martin',
      status: 'exchange',
      scholarship: false,
      housing: false,
      notifications: 1,
      preferences: ['Halal', 'Sans lactose']
    },
    {
      id: 3,
      name: 'Sophie Bernard',
      status: 'graduated',
      scholarship: true,
      housing: false,
      notifications: 0,
      preferences: ['Végétalien', 'Sans gluten', 'Bio', 'Local']
    },
    {
      id: 4,
      name: 'Pierre Durand',
      status: 'suspended',
      scholarship: false,
      housing: true,
      notifications: 5,
      preferences: ['Standard']
    }
  ]);
  
  const [workflowItems, setWorkflowItems] = useState<WorkflowItem[]>([
    {
      id: 1,
      title: 'Demande de logement - Marie D.',
      status: 'in_progress',
      progress: 75,
      assignee: 'Admin Logement',
      priority: 'high'
    },
    {
      id: 2,
      title: 'Validation bourse - Jean M.',
      status: 'review',
      progress: 90,
      assignee: 'Service Financier',
      priority: 'medium'
    },
    {
      id: 3,
      title: 'Réclamation restaurant - Sophie B.',
      status: 'completed',
      assignee: 'Chef de service',
      priority: 'low'
    },
    {
      id: 4,
      title: 'Transfert dossier - Pierre D.',
      status: 'on_hold',
      assignee: 'Secrétariat',
      priority: 'urgent'
    }
  ]);
  
  // Simulation de notifications en temps réel
  useEffect(() => {
    const interval = setInterval(() => {
      if (Math.random() > 0.8) {
        const newNotification: Notification = {
          id: Date.now(),
          type: ['info', 'warning', 'success'][Math.floor(Math.random() * 3)] as any,
          title: 'Nouvelle notification',
          message: 'Une nouvelle notification est arrivée',
          isNew: true,
          timestamp: new Date()
        };
        
        setNotifications(prev => [newNotification, ...prev.slice(0, 4)]);
      }
    }, 10000);
    
    return () => clearInterval(interval);
  }, []);
  
  // Gestionnaires d'événements
  const markNotificationAsRead = (id: number) => {
    setNotifications(prev => 
      prev.map(notif => 
        notif.id === id ? { ...notif, isNew: false } : notif
      )
    );
  };
  
  const updateWorkflowStatus = (id: number, newStatus: WorkflowItem['status']) => {
    setWorkflowItems(prev =>
      prev.map(item =>
        item.id === id ? { ...item, status: newStatus } : item
      )
    );
  };
  
  // Configuration des badges de priorité
  const getPriorityBadge = (priority: string) => {
    const config = {
      low: { variant: 'gray' as const, text: 'Faible' },
      medium: { variant: 'primary' as const, text: 'Moyenne' },
      high: { variant: 'warning' as const, text: 'Élevée' },
      urgent: { variant: 'danger' as const, text: 'Urgente', pulse: true }
    };
    
    const { variant, text, pulse } = config[priority as keyof typeof config];
    return <Badge variant={variant} size="xs" pulse={pulse}>{text}</Badge>;
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* En-tête */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-4">
            Composant Badge - Exemples CROU
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
            Démonstration du composant Badge avec des cas d'usage réels pour les statuts, notifications et indicateurs CROU.
          </p>
        </div>

        <div className="space-y-12">
          {/* Section 1: Variantes et styles de base */}
          <section className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-6 flex items-center gap-2">
              <StarIcon className="h-6 w-6 text-primary-600" />
              Variantes et styles
            </h2>
            
            <div className="space-y-8">
              {/* Variantes de couleur */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">
                  Variantes de couleur
                </h3>
                <div className="flex flex-wrap gap-4">
                  <Badge variant="primary">Primary</Badge>
                  <Badge variant="secondary">Secondary</Badge>
                  <Badge variant="success">Success</Badge>
                  <Badge variant="warning">Warning</Badge>
                  <Badge variant="danger">Danger</Badge>
                  <Badge variant="gray">Gray</Badge>
                  <Badge variant="info">Info</Badge>
                </div>
              </div>
              
              {/* Styles visuels */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">
                  Styles visuels
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <h4 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-3">Filled</h4>
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="primary" style="filled">Primary</Badge>
                      <Badge variant="success" style="filled">Success</Badge>
                      <Badge variant="danger" style="filled">Danger</Badge>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-3">Outline</h4>
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="primary" style="outline">Primary</Badge>
                      <Badge variant="success" style="outline">Success</Badge>
                      <Badge variant="danger" style="outline">Danger</Badge>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-3">Soft</h4>
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="primary" style="soft">Primary</Badge>
                      <Badge variant="success" style="soft">Success</Badge>
                      <Badge variant="danger" style="soft">Danger</Badge>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Tailles */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">
                  Tailles disponibles
                </h3>
                <div className="flex items-center gap-4">
                  <Badge size="xs" variant="primary">XS</Badge>
                  <Badge size="sm" variant="primary">SM</Badge>
                  <Badge size="md" variant="primary">MD</Badge>
                  <Badge size="lg" variant="primary">LG</Badge>
                </div>
              </div>
            </div>
          </section>

          {/* Section 2: Gestion des étudiants */}
          <section className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-6 flex items-center gap-2">
              <AcademicCapIcon className="h-6 w-6 text-primary-600" />
              Gestion des étudiants
            </h2>
            
            <div className="space-y-6">
              {students.map((student) => (
                <div key={student.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                        {student.name}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        ID: {student.id.toString().padStart(6, '0')}
                      </p>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <StudentStatusBadge status={student.status} />
                      {student.notifications > 0 && (
                        <div className="relative">
                          <BellIcon className="h-5 w-5 text-gray-600" />
                          <Badge 
                            count={student.notifications} 
                            variant="danger" 
                            size="xs" 
                            className="absolute -top-2 -right-2" 
                          />
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <h4 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                        Services
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {student.scholarship && (
                          <Badge 
                            variant="success" 
                            size="sm"
                            leftIcon={<CurrencyEuroIcon className="h-3 w-3" />}
                          >
                            Boursier
                          </Badge>
                        )}
                        {student.housing && (
                          <Badge 
                            variant="primary" 
                            size="sm"
                            leftIcon={<HomeIcon className="h-3 w-3" />}
                          >
                            Logé
                          </Badge>
                        )}
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                        Préférences alimentaires
                      </h4>
                      <BadgeGroup
                        badges={student.preferences.map((pref, index) => ({
                          key: `${student.id}-${index}`,
                          content: pref,
                          props: { 
                            variant: 'gray' as const, 
                            size: 'xs' as const 
                          }
                        }))}
                        maxVisible={3}
                        spacing="sm"
                      />
                    </div>
                    
                    <div className="flex items-center justify-end">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => console.log(`Voir profil de ${student.name}`)}
                      >
                        Voir le profil
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Section 3: Centre de notifications */}
          <section className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-6 flex items-center gap-2">
              <BellIcon className="h-6 w-6 text-primary-600" />
              Centre de notifications
              {notifications.filter(n => n.isNew).length > 0 && (
                <Badge 
                  count={notifications.filter(n => n.isNew).length} 
                  variant="danger" 
                  size="sm" 
                />
              )}
            </h2>
            
            <div className="space-y-4">
              {notifications.map((notification) => (
                <div 
                  key={notification.id}
                  className={cn(
                    'flex items-start gap-4 p-4 rounded-lg border transition-colors',
                    notification.isNew 
                      ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
                      : 'bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600'
                  )}
                >
                  <div className="flex-shrink-0">
                    {notification.type === 'warning' && (
                      <Badge 
                        iconOnly={<ExclamationTriangleIcon className="h-4 w-4" />}
                        variant="warning"
                        size="sm"
                      />
                    )}
                    {notification.type === 'success' && (
                      <Badge 
                        iconOnly={<CheckIcon className="h-4 w-4" />}
                        variant="success"
                        size="sm"
                      />
                    )}
                    {notification.type === 'info' && (
                      <Badge 
                        iconOnly={<InformationCircleIcon className="h-4 w-4" />}
                        variant="info"
                        size="sm"
                      />
                    )}
                    {notification.type === 'error' && (
                      <Badge 
                        iconOnly={<XMarkIcon className="h-4 w-4" />}
                        variant="danger"
                        size="sm"
                      />
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-medium text-gray-900 dark:text-gray-100">
                        {notification.title}
                      </h3>
                      {notification.isNew && (
                        <Badge variant="primary" size="xs">Nouveau</Badge>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                      {notification.message}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-500">
                      {notification.timestamp.toLocaleString('fr-FR')}
                    </p>
                  </div>
                  
                  {notification.isNew && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => markNotificationAsRead(notification.id)}
                    >
                      Marquer comme lu
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </section>

          {/* Section 4: Workflow et tâches */}
          <section className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-6 flex items-center gap-2">
              <ChartBarIcon className="h-6 w-6 text-primary-600" />
              Workflow et tâches administratives
            </h2>
            
            <div className="space-y-4">
              {workflowItems.map((item) => (
                <div key={item.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-1">
                        {item.title}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Assigné à: {item.assignee}
                      </p>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {getPriorityBadge(item.priority)}
                      <WorkflowStatusBadge 
                        status={item.status} 
                        progress={item.progress}
                      />
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex gap-2">
                      <Button
                        size="xs"
                        variant="outline"
                        onClick={() => updateWorkflowStatus(item.id, 'in_progress')}
                        disabled={item.status === 'completed' || item.status === 'cancelled'}
                      >
                        Démarrer
                      </Button>
                      <Button
                        size="xs"
                        variant="outline"
                        onClick={() => updateWorkflowStatus(item.id, 'completed')}
                        disabled={item.status === 'completed' || item.status === 'cancelled'}
                      >
                        Terminer
                      </Button>
                      <Button
                        size="xs"
                        variant="outline"
                        onClick={() => updateWorkflowStatus(item.id, 'on_hold')}
                        disabled={item.status === 'completed' || item.status === 'cancelled'}
                      >
                        Suspendre
                      </Button>
                    </div>
                    
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      ID: {item.id}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Section 5: Exemples interactifs */}
          <section className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-6 flex items-center gap-2">
              <Cog6ToothIcon className="h-6 w-6 text-primary-600" />
              Exemples interactifs
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Badges avec compteurs */}
              <div className="space-y-4">
                <h3 className="font-medium text-gray-900 dark:text-gray-100">
                  Badges avec compteurs
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Messages non lus</span>
                    <Badge count={12} variant="danger" />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Tâches en cours</span>
                    <Badge count={5} variant="warning" />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Demandes approuvées</span>
                    <Badge count={23} variant="success" />
                  </div>
                </div>
              </div>
              
              {/* Badges avec points d'indication */}
              <div className="space-y-4">
                <h3 className="font-medium text-gray-900 dark:text-gray-100">
                  Indicateurs d'état
                </h3>
                <div className="space-y-3">
                  <Badge dot dotColor="success">Serveur en ligne</Badge>
                  <Badge dot dotColor="warning" pulse>Maintenance en cours</Badge>
                  <Badge dot dotColor="danger">Service indisponible</Badge>
                  <Badge dot dotColor="primary">Mise à jour disponible</Badge>
                </div>
              </div>
              
              {/* Badges avec icônes */}
              <div className="space-y-4">
                <h3 className="font-medium text-gray-900 dark:text-gray-100">
                  Badges avec icônes
                </h3>
                <div className="space-y-3">
                  <Badge 
                    leftIcon={<UserIcon className="h-3 w-3" />}
                    variant="primary"
                  >
                    1,247 utilisateurs
                  </Badge>
                  <Badge 
                    leftIcon={<BuildingOfficeIcon className="h-3 w-3" />}
                    variant="info"
                  >
                    8 centres CROU
                  </Badge>
                  <Badge 
                    leftIcon={<DocumentTextIcon className="h-3 w-3" />}
                    variant="gray"
                  >
                    156 documents
                  </Badge>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default BadgeExamples;

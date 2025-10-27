/**
 * FICHIER: apps\web\src\pages\examples\CardExamples.tsx
 * PAGE: Exemples d'utilisation de la famille de composants Card
 * 
 * DESCRIPTION:
 * Page de démonstration de la famille Card avec cas d'usage CROU
 * Exemples pratiques d'organisation de contenu avec cartes
 * Intégration dans des interfaces utilisateur réelles
 * 
 * SECTIONS:
 * - Cartes de base avec variantes et tailles
 * - Cartes complètes avec en-têtes et actions
 * - StatCard pour tableaux de bord
 * - InfoCard pour notifications et informations
 * - ActionCard pour actions utilisateur
 * - Cas d'usage CROU spécifiques
 * 
 * AUTEUR: Équipe CROU
 * DATE: Décembre 2024
 */

import React, { useState, useEffect } from 'react';
import { 
  UserIcon,
  CogIcon,
  CheckIcon,
  XMarkIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  ChartBarIcon,
  CurrencyEuroIcon,
  AcademicCapIcon,
  HomeIcon,
  BellIcon,
  StarIcon,
  ClockIcon,
  DocumentTextIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
  HeartIcon,
  ShareIcon,
  BookmarkIcon,
  CalendarIcon,
  MapPinIcon,
  PhoneIcon,
  EnvelopeIcon
} from '@heroicons/react/24/outline';
import { 
  Card, 
  CardHeader, 
  CardBody, 
  CardFooter, 
  CardActions,
  CardImage,
  StatCard,
  InfoCard,
  ActionCard
} from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { cn } from '@/utils/cn';

// Types pour les données
interface Student {
  id: number;
  name: string;
  level: string;
  status: 'enrolled' | 'graduated' | 'suspended' | 'exchange';
  scholarship: boolean;
  housing: boolean;
  avatar: string;
  email: string;
  phone: string;
  lastActivity: string;
}

interface Restaurant {
  id: number;
  name: string;
  location: string;
  rating: number;
  capacity: number;
  image: string;
  specialties: string[];
  openHours: string;
  isOpen: boolean;
}

interface Notification {
  id: number;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  timestamp: Date;
  isRead: boolean;
  action?: string;
}

const CardExamples: React.FC = () => {
  // États pour les données simulées
  const [selectedCard, setSelectedCard] = useState<string | null>(null);
  const [favoriteRestaurants, setFavoriteRestaurants] = useState<number[]>([1, 3]);
  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: 1,
      type: 'warning',
      title: 'Maintenance programmée',
      message: 'Le service de réservation sera indisponible demain de 2h à 6h.',
      timestamp: new Date(),
      isRead: false,
      action: 'Programmer rappel'
    },
    {
      id: 2,
      type: 'success',
      title: 'Demande approuvée',
      message: 'Votre demande de bourse a été approuvée.',
      timestamp: new Date(Date.now() - 3600000),
      isRead: false
    },
    {
      id: 3,
      type: 'info',
      title: 'Nouveau menu',
      message: 'Le menu de la semaine prochaine est disponible.',
      timestamp: new Date(Date.now() - 7200000),
      isRead: true
    }
  ]);
  
  // Données simulées
  const students: Student[] = [
    {
      id: 1,
      name: 'Marie Dupont',
      level: 'L3 Informatique',
      status: 'enrolled',
      scholarship: true,
      housing: true,
      avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face',
      email: 'marie.dupont@etudiant.fr',
      phone: '06 12 34 56 78',
      lastActivity: '2024-12-15'
    },
    {
      id: 2,
      name: 'Jean Martin',
      level: 'M1 Économie',
      status: 'exchange',
      scholarship: false,
      housing: false,
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
      email: 'jean.martin@etudiant.fr',
      phone: '06 98 76 54 32',
      lastActivity: '2024-12-14'
    },
    {
      id: 3,
      name: 'Sophie Bernard',
      level: 'L2 Lettres',
      status: 'enrolled',
      scholarship: true,
      housing: true,
      avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face',
      email: 'sophie.bernard@etudiant.fr',
      phone: '06 11 22 33 44',
      lastActivity: '2024-12-15'
    }
  ];
  
  const restaurants: Restaurant[] = [
    {
      id: 1,
      name: 'Restaurant Central',
      location: 'Campus Principal',
      rating: 4.2,
      capacity: 300,
      image: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=400&h=200&fit=crop',
      specialties: ['Cuisine traditionnelle', 'Végétarien', 'Halal'],
      openHours: '11h30 - 14h00 / 18h30 - 21h00',
      isOpen: true
    },
    {
      id: 2,
      name: 'Cafétéria Sciences',
      location: 'Bâtiment Sciences',
      rating: 3.8,
      capacity: 150,
      image: 'https://images.unsplash.com/photo-1567521464027-f127ff144326?w=400&h=200&fit=crop',
      specialties: ['Snacking', 'Sandwichs', 'Salades'],
      openHours: '8h00 - 16h00',
      isOpen: true
    },
    {
      id: 3,
      name: 'Restaurant Lettres',
      location: 'Campus Lettres',
      rating: 4.5,
      capacity: 200,
      image: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=400&h=200&fit=crop',
      specialties: ['Bio', 'Local', 'Végétalien'],
      openHours: '12h00 - 14h30 / 19h00 - 21h30',
      isOpen: false
    }
  ];
  
  // Statistiques simulées
  const stats = [
    {
      title: 'Étudiants inscrits',
      value: '1,247',
      change: { value: 8.2, type: 'increase' as const, period: 'vs année dernière' },
      icon: <AcademicCapIcon className="h-6 w-6" />
    },
    {
      title: 'Chiffre d\'affaires',
      value: '125,000 FCFA',
      change: { value: 12.5, type: 'increase' as const, period: 'vs mois dernier' },
      icon: <CurrencyEuroIcon className="h-6 w-6" />,
      iconColor: 'bg-success-100 text-success-600 dark:bg-success-900/20 dark:text-success-400'
    },
    {
      title: 'Taux d\'occupation',
      value: '78.3%',
      change: { value: 5.1, type: 'decrease' as const, period: 'vs mois dernier' },
      icon: <HomeIcon className="h-6 w-6" />,
      iconColor: 'bg-warning-100 text-warning-600 dark:bg-warning-900/20 dark:text-warning-400'
    },
    {
      title: 'Satisfaction',
      value: '4.2/5',
      change: { value: 0.3, type: 'increase' as const, period: 'vs trimestre' },
      icon: <StarIcon className="h-6 w-6" />,
      description: 'Basé sur 2,847 avis'
    }
  ];
  
  // Gestionnaires d'événements
  const toggleFavorite = (restaurantId: number) => {
    setFavoriteRestaurants(prev => 
      prev.includes(restaurantId)
        ? prev.filter(id => id !== restaurantId)
        : [...prev, restaurantId]
    );
  };
  
  const markNotificationAsRead = (notificationId: number) => {
    setNotifications(prev =>
      prev.map(notif =>
        notif.id === notificationId ? { ...notif, isRead: true } : notif
      )
    );
  };
  
  const getStatusBadge = (status: Student['status']) => {
    const config = {
      enrolled: { variant: 'success' as const, text: 'Inscrit' },
      exchange: { variant: 'warning' as const, text: 'Échange' },
      graduated: { variant: 'primary' as const, text: 'Diplômé' },
      suspended: { variant: 'danger' as const, text: 'Suspendu' }
    };
    
    const { variant, text } = config[status];
    return <Badge variant={variant} size="sm">{text}</Badge>;
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* En-tête */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-4">
            Famille de composants Card
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
            Démonstration des composants Card avec des cas d'usage réels pour l'organisation de contenu CROU.
          </p>
        </div>

        <div className="space-y-12">
          {/* Section 1: Variantes de base */}
          <section className="space-y-6">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
              <DocumentTextIcon className="h-6 w-6 text-primary-600" />
              Variantes et tailles de base
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card variant="elevated">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                  Elevated
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Carte avec ombre portée pour créer une élévation visuelle.
                </p>
              </Card>
              
              <Card variant="outlined">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                  Outlined
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Carte avec bordure simple sans ombre.
                </p>
              </Card>
              
              <Card variant="filled">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                  Filled
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Carte avec fond coloré et contenu contrasté.
                </p>
              </Card>
            </div>
            
            {/* Cartes interactives */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">
                Cartes interactives sélectionnables
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {['Option A', 'Option B', 'Option C'].map((option, index) => (
                  <Card
                    key={option}
                    variant="outlined"
                    selected={selectedCard === option}
                    onClick={() => setSelectedCard(selectedCard === option ? null : option)}
                  >
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium text-gray-900 dark:text-gray-100">
                        {option}
                      </h4>
                      {selectedCard === option && (
                        <CheckIcon className="h-5 w-5 text-primary-600" />
                      )}
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      Description de l'option {option.slice(-1)}
                    </p>
                  </Card>
                ))}
              </div>
            </div>
          </section>

          {/* Section 2: Tableau de bord avec StatCard */}
          <section className="space-y-6">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
              <ChartBarIcon className="h-6 w-6 text-primary-600" />
              Tableau de bord - Statistiques
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {stats.map((stat, index) => (
                <StatCard
                  key={index}
                  title={stat.title}
                  value={stat.value}
                  change={stat.change}
                  icon={stat.icon}
                  iconColor={stat.iconColor}
                  description={stat.description}
                  onClick={() => console.log(`Voir détails: ${stat.title}`)}
                />
              ))}
            </div>
          </section>

          {/* Section 3: Profils étudiants */}
          <section className="space-y-6">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
              <AcademicCapIcon className="h-6 w-6 text-primary-600" />
              Profils étudiants
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {students.map((student) => (
                <Card key={student.id} variant="elevated">
                  <CardHeader
                    title={student.name}
                    subtitle={student.level}
                    avatar={
                      <img
                        src={student.avatar}
                        alt={student.name}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                    }
                    action={
                      <Button size="sm" variant="ghost">
                        <PencilIcon className="h-4 w-4" />
                      </Button>
                    }
                  />
                  
                  <CardBody>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600 dark:text-gray-400">Statut:</span>
                        {getStatusBadge(student.status)}
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600 dark:text-gray-400">Bourse:</span>
                        <Badge 
                          variant={student.scholarship ? 'primary' : 'gray'} 
                          size="sm"
                        >
                          {student.scholarship ? 'Boursier' : 'Non boursier'}
                        </Badge>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600 dark:text-gray-400">Logement:</span>
                        <Badge 
                          variant={student.housing ? 'success' : 'gray'} 
                          size="sm"
                        >
                          {student.housing ? 'Logé' : 'Non logé'}
                        </Badge>
                      </div>
                      
                      <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
                        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                          <EnvelopeIcon className="h-4 w-4" />
                          <span className="truncate">{student.email}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 mt-1">
                          <PhoneIcon className="h-4 w-4" />
                          <span>{student.phone}</span>
                        </div>
                      </div>
                    </div>
                  </CardBody>
                  
                  <CardFooter>
                    <CardActions>
                      <Button size="sm" variant="outline">
                        <EnvelopeIcon className="h-4 w-4 mr-1" />
                        Contacter
                      </Button>
                      <Button size="sm">
                        <EyeIcon className="h-4 w-4 mr-1" />
                        Profil
                      </Button>
                    </CardActions>
                  </CardFooter>
                </Card>
              ))}
            </div>
          </section>

          {/* Section 4: Restaurants */}
          <section className="space-y-6">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
              <HomeIcon className="h-6 w-6 text-primary-600" />
              Restaurants universitaires
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {restaurants.map((restaurant) => (
                <Card key={restaurant.id} variant="outlined" size="sm">
                  <CardImage
                    src={restaurant.image}
                    alt={restaurant.name}
                    aspectRatio="video"
                  />
                  
                  <div className="p-4">
                    <CardHeader
                      title={restaurant.name}
                      subtitle={restaurant.location}
                      action={
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => toggleFavorite(restaurant.id)}
                        >
                          <HeartIcon 
                            className={cn(
                              'h-5 w-5',
                              favoriteRestaurants.includes(restaurant.id)
                                ? 'fill-red-500 text-red-500'
                                : 'text-gray-400'
                            )}
                          />
                        </Button>
                      }
                      className="mb-3"
                    />
                    
                    <CardBody spacing="sm">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-1">
                          <StarIcon className="h-4 w-4 text-yellow-500" />
                          <span className="text-sm font-medium">{restaurant.rating}/5</span>
                        </div>
                        <Badge 
                          variant={restaurant.isOpen ? 'success' : 'danger'} 
                          size="xs"
                          dot
                          dotColor={restaurant.isOpen ? 'success' : 'danger'}
                        >
                          {restaurant.isOpen ? 'Ouvert' : 'Fermé'}
                        </Badge>
                      </div>
                      
                      <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                        <div className="flex items-center gap-1">
                          <UserIcon className="h-4 w-4" />
                          <span>{restaurant.capacity} places</span>
                        </div>
                        <div className="flex items-center gap-1 mt-1">
                          <ClockIcon className="h-4 w-4" />
                          <span>{restaurant.openHours}</span>
                        </div>
                      </div>
                      
                      <div className="flex flex-wrap gap-1">
                        {restaurant.specialties.slice(0, 2).map((specialty, index) => (
                          <Badge key={index} variant="gray" size="xs">
                            {specialty}
                          </Badge>
                        ))}
                        {restaurant.specialties.length > 2 && (
                          <Badge variant="gray" size="xs">
                            +{restaurant.specialties.length - 2}
                          </Badge>
                        )}
                      </div>
                    </CardBody>
                    
                    <CardFooter align="between">
                      <Button size="sm" variant="outline">
                        <MapPinIcon className="h-4 w-4 mr-1" />
                        Localiser
                      </Button>
                      <Button size="sm">
                        Voir menu
                      </Button>
                    </CardFooter>
                  </div>
                </Card>
              ))}
            </div>
          </section>

          {/* Section 5: Notifications avec InfoCard */}
          <section className="space-y-6">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
              <BellIcon className="h-6 w-6 text-primary-600" />
              Centre de notifications
            </h2>
            
            <div className="space-y-4 max-w-3xl">
              {notifications.map((notification) => (
                <InfoCard
                  key={notification.id}
                  type={notification.type}
                  title={notification.title}
                  content={
                    <div>
                      <p className="mb-2">{notification.message}</p>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500">
                          {notification.timestamp.toLocaleString('fr-FR')}
                        </span>
                        {!notification.isRead && (
                          <Badge variant="primary" size="xs">Nouveau</Badge>
                        )}
                      </div>
                    </div>
                  }
                  icon={
                    notification.type === 'warning' ? <ExclamationTriangleIcon className="h-5 w-5" /> :
                    notification.type === 'success' ? <CheckIcon className="h-5 w-5" /> :
                    notification.type === 'error' ? <XMarkIcon className="h-5 w-5" /> :
                    <InformationCircleIcon className="h-5 w-5" />
                  }
                  action={
                    <div className="flex gap-2">
                      {notification.action && (
                        <Button size="sm" variant="outline">
                          {notification.action}
                        </Button>
                      )}
                      {!notification.isRead && (
                        <Button 
                          size="sm" 
                          variant="ghost"
                          onClick={() => markNotificationAsRead(notification.id)}
                        >
                          Marquer lu
                        </Button>
                      )}
                    </div>
                  }
                  className={cn(
                    !notification.isRead && 'ring-1 ring-primary-200 dark:ring-primary-800'
                  )}
                />
              ))}
            </div>
          </section>

          {/* Section 6: Actions rapides avec ActionCard */}
          <section className="space-y-6">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
              <CogIcon className="h-6 w-6 text-primary-600" />
              Actions rapides
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <ActionCard
                title="Nouvelle inscription"
                description="Inscrire un nouvel étudiant dans le système CROU."
                icon={<PlusIcon className="h-6 w-6" />}
                primaryAction={<Button>Inscrire</Button>}
                secondaryActions={[
                  <Button key="import" variant="outline" size="sm">Importer</Button>
                ]}
              />
              
              <ActionCard
                title="Gérer les menus"
                description="Modifier et publier les menus de la semaine prochaine."
                icon={<DocumentTextIcon className="h-6 w-6" />}
                primaryAction={<Button variant="outline">Gérer</Button>}
                secondaryActions={[
                  <Button key="preview" variant="ghost" size="sm">Aperçu</Button>
                ]}
              />
              
              <ActionCard
                title="Rapports mensuels"
                description="Générer les rapports de performance et statistiques."
                icon={<ChartBarIcon className="h-6 w-6" />}
                primaryAction={<Button variant="outline">Générer</Button>}
                secondaryActions={[
                  <Button key="history" variant="ghost" size="sm">Historique</Button>
                ]}
              />
              
              <ActionCard
                title="Maintenance système"
                description="Planifier une maintenance du système de réservation."
                icon={<CogIcon className="h-6 w-6" />}
                primaryAction={<Button variant="warning">Planifier</Button>}
              />
              
              <ActionCard
                title="Support étudiant"
                description="Accéder aux outils de support et assistance étudiante."
                icon={<UserIcon className="h-6 w-6" />}
                primaryAction={<Button>Accéder</Button>}
                secondaryActions={[
                  <Button key="faq" variant="outline" size="sm">FAQ</Button>
                ]}
              />
              
              <ActionCard
                title="Service indisponible"
                description="Ce service est temporairement indisponible pour maintenance."
                icon={<ExclamationTriangleIcon className="h-6 w-6" />}
                primaryAction={<Button disabled>Indisponible</Button>}
                disabled
              />
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default CardExamples;

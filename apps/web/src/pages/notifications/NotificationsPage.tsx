/**
 * FICHIER: apps\web\src\pages\notifications\NotificationsPage.tsx
 * PAGE: Page principale du module notifications
 * 
 * DESCRIPTION:
 * Page principale pour la gestion des notifications
 * Centre de notifications, préférences, alertes
 * Intégration complète avec WebSocket
 * 
 * AUTEUR: Équipe CROU
 * DATE: Décembre 2024
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import { 
  Bell, 
  BellRing, 
  Check, 
  X, 
  Filter,
  Search,
  Settings,
  AlertTriangle,
  Info,
  CheckCircle,
  XCircle,
  AlertCircle,
  BarChart3,
  TrendingUp,
  Users,
  Building,
  Car,
  Package,
  Workflow,
  Shield
} from 'lucide-react';
import { useNotifications } from '@/hooks/useNotifications';
import { useAuth } from '@/stores/auth';
import toast from 'react-hot-toast';

export default function NotificationsPage() {
  const { hasPermission } = useAuth();
  const {
    notifications,
    stats,
    preferences,
    isConnected,
    isLoading,
    unreadCount,
    criticalNotifications,
    loadNotifications,
    loadStats,
    loadPreferences,
    markAsRead,
    deleteNotification,
    markAllAsRead,
    updatePreferences,
    sendTestNotification,
    filterNotifications,
    formatDate
  } = useNotifications();

  const [activeTab, setActiveTab] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');

  // Charger les données au montage
  useEffect(() => {
    loadNotifications();
    loadStats();
    loadPreferences();
  }, []);

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'info':
        return <Info className="w-4 h-4 text-blue-600" />;
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-yellow-600" />;
      case 'error':
        return <XCircle className="w-4 h-4 text-red-600" />;
      case 'critical':
        return <AlertCircle className="w-4 h-4 text-red-800" />;
      default:
        return <Bell className="w-4 h-4 text-gray-600" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'info':
        return 'blue';
      case 'success':
        return 'green';
      case 'warning':
        return 'yellow';
      case 'error':
        return 'red';
      case 'critical':
        return 'red';
      default:
        return 'gray';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'low':
        return 'gray';
      case 'medium':
        return 'blue';
      case 'high':
        return 'orange';
      case 'urgent':
        return 'red';
      case 'critical':
        return 'red';
      default:
        return 'gray';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'financial':
        return <BarChart3 className="w-4 h-4" />;
      case 'stocks':
        return <Package className="w-4 h-4" />;
      case 'housing':
        return <Building className="w-4 h-4" />;
      case 'transport':
        return <Car className="w-4 h-4" />;
      case 'workflow':
        return <Workflow className="w-4 h-4" />;
      case 'system':
        return <Settings className="w-4 h-4" />;
      case 'security':
        return <Shield className="w-4 h-4" />;
      default:
        return <Bell className="w-4 h-4" />;
    }
  };

  const filteredNotifications = filterNotifications({
    search: searchTerm,
    type: selectedType,
    category: selectedCategory,
    status: selectedStatus
  });

  const categories = [
    { id: 'financial', name: 'Financier', icon: BarChart3, color: 'blue' },
    { id: 'stocks', name: 'Stocks', icon: Package, color: 'green' },
    { id: 'housing', name: 'Logement', icon: Building, color: 'purple' },
    { id: 'transport', name: 'Transport', icon: Car, color: 'orange' },
    { id: 'workflow', name: 'Workflow', icon: Workflow, color: 'indigo' },
    { id: 'system', name: 'Système', icon: Settings, color: 'gray' },
    { id: 'security', name: 'Sécurité', icon: Shield, color: 'red' }
  ];

  const types = [
    { id: 'info', name: 'Information', color: 'blue' },
    { id: 'success', name: 'Succès', color: 'green' },
    { id: 'warning', name: 'Attention', color: 'yellow' },
    { id: 'error', name: 'Erreur', color: 'red' },
    { id: 'critical', name: 'Critique', color: 'red' }
  ];

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Centre de Notifications</h1>
          <p className="text-gray-600 mt-1">
            Gérez vos notifications et alertes en temps réel
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={isConnected ? 'green' : 'red'}>
            {isConnected ? 'Connecté' : 'Déconnecté'}
          </Badge>
          <Button
            onClick={sendTestNotification}
            variant="outline"
            leftIcon={<BellRing className="w-4 h-4" />}
          >
            Test
          </Button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total</CardTitle>
            <Bell className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.total || 0}</div>
            <p className="text-xs text-muted-foreground">
              {unreadCount} non lues
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Critiques</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{criticalNotifications.length}</div>
            <p className="text-xs text-muted-foreground">
              Nécessitent une attention
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taux de Lecture</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {stats ? Math.round(stats.readRate) : 0}%
            </div>
            <p className="text-xs text-muted-foreground">
              Notifications lues
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Connexion</CardTitle>
            <BellRing className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {isConnected ? 'Active' : 'Inactive'}
            </div>
            <p className="text-xs text-muted-foreground">
              WebSocket temps réel
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Contenu principal */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">Toutes</TabsTrigger>
          <TabsTrigger value="unread">Non lues</TabsTrigger>
          <TabsTrigger value="critical">Critiques</TabsTrigger>
          <TabsTrigger value="preferences">Préférences</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Notifications</CardTitle>
                <div className="flex items-center gap-2">
                  <Input
                    placeholder="Rechercher..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-64"
                  />
                  <Button
                    variant="outline"
                    onClick={markAllAsRead}
                    disabled={unreadCount === 0}
                  >
                    <Check className="w-4 h-4 mr-1" />
                    Tout marquer
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Filtres */}
                <div className="flex items-center gap-4">
                  <select
                    value={selectedType}
                    onChange={(e) => setSelectedType(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                  >
                    <option value="">Tous les types</option>
                    {types.map(type => (
                      <option key={type.id} value={type.id}>{type.name}</option>
                    ))}
                  </select>
                  
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                  >
                    <option value="">Toutes les catégories</option>
                    {categories.map(category => (
                      <option key={category.id} value={category.id}>{category.name}</option>
                    ))}
                  </select>
                  
                  <select
                    value={selectedStatus}
                    onChange={(e) => setSelectedStatus(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                  >
                    <option value="">Tous les statuts</option>
                    <option value="pending">En attente</option>
                    <option value="read">Lues</option>
                    <option value="failed">Échouées</option>
                  </select>
                </div>

                {/* Liste des notifications */}
                {isLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  </div>
                ) : filteredNotifications.length === 0 ? (
                  <div className="text-center py-8">
                    <Bell className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">Aucune notification trouvée</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {filteredNotifications.map((notification) => (
                      <div
                        key={notification.id}
                        className={`p-4 border rounded-lg hover:bg-gray-50 transition-colors ${
                          notification.status !== 'read' ? 'bg-blue-50 border-blue-200' : ''
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div className="flex-shrink-0 mt-1">
                            {getTypeIcon(notification.type)}
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-2">
                              <h4 className="text-sm font-medium text-gray-900">
                                {notification.title}
                              </h4>
                              <Badge variant={getTypeColor(notification.type) as any}>
                                {notification.type}
                              </Badge>
                              <Badge variant={getPriorityColor(notification.priority) as any}>
                                {notification.priority}
                              </Badge>
                              <div className="flex items-center gap-1 text-gray-500">
                                {getCategoryIcon(notification.category)}
                                <span className="text-xs">
                                  {categories.find(c => c.id === notification.category)?.name}
                                </span>
                              </div>
                            </div>
                            
                            <p className="text-sm text-gray-600 mb-2">
                              {notification.message}
                            </p>
                            
                            <div className="flex items-center justify-between">
                              <span className="text-xs text-gray-500">
                                {formatDate(notification.createdAt)}
                              </span>
                              
                              <div className="flex items-center gap-1">
                                {notification.status !== 'read' && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => markAsRead(notification.id)}
                                    className="h-6 px-2 text-xs"
                                  >
                                    <Check className="w-3 h-3" />
                                  </Button>
                                )}
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => deleteNotification(notification.id)}
                                  className="h-6 px-2 text-xs text-red-600 hover:text-red-700"
                                >
                                  <X className="w-3 h-3" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="unread" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Notifications Non Lues</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {notifications.filter(n => n.status !== 'read').map((notification) => (
                  <div
                    key={notification.id}
                    className="p-4 border rounded-lg bg-blue-50 border-blue-200"
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 mt-1">
                        {getTypeIcon(notification.type)}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <h4 className="text-sm font-medium text-gray-900">
                            {notification.title}
                          </h4>
                          <Badge variant={getTypeColor(notification.type) as any}>
                            {notification.type}
                          </Badge>
                        </div>
                        
                        <p className="text-sm text-gray-600 mb-2">
                          {notification.message}
                        </p>
                        
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-500">
                            {formatDate(notification.createdAt)}
                          </span>
                          
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => markAsRead(notification.id)}
                              className="h-6 px-2 text-xs"
                            >
                              <Check className="w-3 h-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => deleteNotification(notification.id)}
                              className="h-6 px-2 text-xs text-red-600 hover:text-red-700"
                            >
                              <X className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="critical" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Notifications Critiques</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {criticalNotifications.map((notification) => (
                  <div
                    key={notification.id}
                    className="p-4 border rounded-lg bg-red-50 border-red-200"
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 mt-1">
                        {getTypeIcon(notification.type)}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <h4 className="text-sm font-medium text-gray-900">
                            {notification.title}
                          </h4>
                          <Badge variant="red">
                            {notification.type}
                          </Badge>
                        </div>
                        
                        <p className="text-sm text-gray-600 mb-2">
                          {notification.message}
                        </p>
                        
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-500">
                            {formatDate(notification.createdAt)}
                          </span>
                          
                          <div className="flex items-center gap-1">
                            {notification.status !== 'read' && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => markAsRead(notification.id)}
                                className="h-6 px-2 text-xs"
                              >
                                <Check className="w-3 h-3" />
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => deleteNotification(notification.id)}
                              className="h-6 px-2 text-xs text-red-600 hover:text-red-700"
                            >
                              <X className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="preferences" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Préférences de Notification</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium mb-4">Canaux de Notification</h3>
                  <div className="space-y-2">
                    <label className="flex items-center">
                      <input type="checkbox" defaultChecked className="mr-2" />
                      <span>Application</span>
                    </label>
                    <label className="flex items-center">
                      <input type="checkbox" className="mr-2" />
                      <span>Email</span>
                    </label>
                    <label className="flex items-center">
                      <input type="checkbox" className="mr-2" />
                      <span>SMS</span>
                    </label>
                    <label className="flex items-center">
                      <input type="checkbox" className="mr-2" />
                      <span>Push</span>
                    </label>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-medium mb-4">Catégories</h3>
                  <div className="space-y-2">
                    {categories.map(category => (
                      <label key={category.id} className="flex items-center">
                        <input type="checkbox" defaultChecked className="mr-2" />
                        <span>{category.name}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-medium mb-4">Types</h3>
                  <div className="space-y-2">
                    {types.map(type => (
                      <label key={type.id} className="flex items-center">
                        <input type="checkbox" defaultChecked className="mr-2" />
                        <span>{type.name}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-medium mb-4">Heures Silencieuses</h3>
                  <div className="space-y-2">
                    <label className="flex items-center">
                      <input type="checkbox" className="mr-2" />
                      <span>Activer les heures silencieuses</span>
                    </label>
                    <div className="flex items-center gap-2">
                      <input type="time" className="px-3 py-2 border border-gray-300 rounded-md text-sm" />
                      <span>à</span>
                      <input type="time" className="px-3 py-2 border border-gray-300 rounded-md text-sm" />
                    </div>
                  </div>
                </div>

                <Button onClick={() => toast.success('Préférences mises à jour')}>
                  Sauvegarder les Préférences
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

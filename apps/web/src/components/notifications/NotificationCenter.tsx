/**
 * FICHIER: apps\web\src\components\notifications\NotificationCenter.tsx
 * COMPOSANT: NotificationCenter - Centre de notifications
 * 
 * DESCRIPTION:
 * Composant pour l'affichage et la gestion des notifications
 * Interface utilisateur moderne et intuitive
 * 
 * FONCTIONNALITÉS:
 * - Affichage des notifications en temps réel
 * - Filtrage et recherche
 * - Actions sur les notifications
 * - Préférences utilisateur
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
  AlertCircle
} from 'lucide-react';
import { useAuth } from '@/stores/auth';
import { useApi } from '@/hooks/useApi';
import toast from 'react-hot-toast';

// Types pour les notifications
interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error' | 'critical';
  category: 'financial' | 'stocks' | 'housing' | 'transport' | 'workflow' | 'system' | 'security';
  priority: 'low' | 'medium' | 'high' | 'urgent' | 'critical';
  status: 'pending' | 'sent' | 'delivered' | 'read' | 'failed';
  createdAt: string;
  readAt?: string;
  data?: any;
}

interface NotificationStats {
  total: number;
  unread: number;
  byType: { [key: string]: number };
  byCategory: { [key: string]: number };
}

export function NotificationCenter() {
  const { user, hasPermission } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [stats, setStats] = useState<NotificationStats | null>(null);
  const [activeTab, setActiveTab] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  // Charger les notifications
  useEffect(() => {
    if (isOpen) {
      loadNotifications();
      loadStats();
    }
  }, [isOpen]);

  const loadNotifications = async () => {
    try {
      setIsLoading(true);
      const { data } = await useApi().apiClient.get('/notifications', {
        params: { limit: 50 }
      });
      setNotifications(data.data);
    } catch (error) {
      console.error('Erreur chargement notifications:', error);
      toast.error('Erreur lors du chargement des notifications');
    } finally {
      setIsLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const { data } = await useApi().apiClient.get('/notifications/stats');
      setStats(data.data);
    } catch (error) {
      console.error('Erreur chargement statistiques:', error);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      await useApi().apiClient.put(`/notifications/${notificationId}/read`);
      setNotifications(prev => 
        prev.map(n => 
          n.id === notificationId 
            ? { ...n, status: 'read', readAt: new Date().toISOString() }
            : n
        )
      );
      toast.success('Notification marquée comme lue');
    } catch (error) {
      console.error('Erreur marquage notification:', error);
      toast.error('Erreur lors du marquage');
    }
  };

  const deleteNotification = async (notificationId: string) => {
    try {
      await useApi().apiClient.delete(`/notifications/${notificationId}`);
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
      toast.success('Notification supprimée');
    } catch (error) {
      console.error('Erreur suppression notification:', error);
      toast.error('Erreur lors de la suppression');
    }
  };

  const markAllAsRead = async () => {
    try {
      const unreadNotifications = notifications.filter(n => n.status !== 'read');
      await Promise.all(
        unreadNotifications.map(n => 
          useApi().apiClient.put(`/notifications/${n.id}/read`)
        )
      );
      setNotifications(prev => 
        prev.map(n => ({ ...n, status: 'read', readAt: new Date().toISOString() }))
      );
      toast.success('Toutes les notifications marquées comme lues');
    } catch (error) {
      console.error('Erreur marquage multiple:', error);
      toast.error('Erreur lors du marquage multiple');
    }
  };

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
        return <Bell className="w-4 h-4 text-gray-600 dark:text-gray-400" />;
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

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'À l\'instant';
    if (minutes < 60) return `Il y a ${minutes} min`;
    if (hours < 24) return `Il y a ${hours}h`;
    if (days < 7) return `Il y a ${days}j`;
    return date.toLocaleDateString();
  };

  const filteredNotifications = notifications.filter(notification => {
    const matchesTab = activeTab === 'all' || 
      (activeTab === 'unread' && notification.status !== 'read') ||
      (activeTab === 'read' && notification.status === 'read') ||
      (activeTab === notification.type) ||
      (activeTab === notification.category);
    
    const matchesSearch = searchTerm === '' || 
      notification.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      notification.message.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesTab && matchesSearch;
  });

  const unreadCount = notifications.filter(n => n.status !== 'read').length;

  return (
    <div className="relative">
      {/* Bouton de notification */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className="relative"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <Badge 
            variant="red" 
            className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
          >
            {unreadCount}
          </Badge>
        )}
      </Button>

      {/* Centre de notifications */}
      {isOpen && (
        <div className="absolute right-0 top-12 w-96 bg-white rounded-lg shadow-xl border z-50">
          <Card className="border-0 shadow-none">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-semibold">
                  Notifications
                </CardTitle>
                <div className="flex items-center gap-2">
                  {unreadCount > 0 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={markAllAsRead}
                    >
                      <Check className="w-4 h-4 mr-1" />
                      Tout marquer
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsOpen(false)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              
              {/* Recherche */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Rechercher..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </CardHeader>

            <CardContent className="p-0">
              {/* Onglets */}
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="all">Toutes</TabsTrigger>
                  <TabsTrigger value="unread">Non lues</TabsTrigger>
                  <TabsTrigger value="critical">Critiques</TabsTrigger>
                  <TabsTrigger value="system">Système</TabsTrigger>
                </TabsList>

                <TabsContent value={activeTab} className="mt-0">
                  <div className="max-h-96 overflow-y-auto">
                    {isLoading ? (
                      <div className="flex items-center justify-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                      </div>
                    ) : filteredNotifications.length === 0 ? (
                      <div className="text-center py-8">
                        <Bell className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-500 dark:text-gray-400">Aucune notification</p>
                      </div>
                    ) : (
                      <div className="space-y-1">
                        {filteredNotifications.map((notification) => (
                          <div
                            key={notification.id}
                            className={`p-3 border-b hover:bg-gray-50 transition-colors ${
                              notification.status !== 'read' ? 'bg-blue-50' : ''
                            }`}
                          >
                            <div className="flex items-start gap-3">
                              <div className="flex-shrink-0 mt-1">
                                {getTypeIcon(notification.type)}
                              </div>
                              
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <h4 className="text-sm font-medium text-gray-900 truncate">
                                    {notification.title}
                                  </h4>
                                  <Badge variant={getTypeColor(notification.type) as any}>
                                    {notification.type}
                                  </Badge>
                                  <Badge variant={getPriorityColor(notification.priority) as any}>
                                    {notification.priority}
                                  </Badge>
                                </div>
                                
                                <p className="text-sm text-gray-600 mb-2">
                                  {notification.message}
                                </p>
                                
                                <div className="flex items-center justify-between">
                                  <span className="text-xs text-gray-500 dark:text-gray-400">
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
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

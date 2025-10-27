/**
 * FICHIER: apps\web\src\hooks\useNotifications.ts
 * HOOK: useNotifications - Hook pour les notifications
 * 
 * DESCRIPTION:
 * Hook personnalisé pour la gestion des notifications
 * Intégration WebSocket et API
 * 
 * FONCTIONNALITÉS:
 * - Connexion WebSocket
 * - Gestion des notifications temps réel
 * - Actions sur les notifications
 * - Préférences utilisateur
 * 
 * AUTEUR: Équipe CROU
 * DATE: Décembre 2024
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
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

interface NotificationPreferences {
  channels: { [key: string]: boolean };
  categories: { [key: string]: boolean };
  types: { [key: string]: boolean };
  quietHours: {
    enabled: boolean;
    start: string;
    end: string;
    timezone: string;
  };
  frequency: {
    immediate: boolean;
    digest: boolean;
    digestFrequency: 'hourly' | 'daily' | 'weekly';
  };
}

export function useNotifications() {
  const { user, accessToken } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [stats, setStats] = useState<NotificationStats | null>(null);
  const [preferences, setPreferences] = useState<NotificationPreferences | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const socketRef = useRef<Socket | null>(null);

  // Connexion WebSocket
  useEffect(() => {
    if (user && accessToken) {
      connectWebSocket();
    }

    return () => {
      disconnectWebSocket();
    };
  }, [user, accessToken]);

  // Connexion WebSocket
  const connectWebSocket = useCallback(() => {
    try {
      const socket = io(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'}/notifications`, {
        auth: {
          token: accessToken
        },
        transports: ['websocket']
      });

      socket.on('connect', () => {
        setIsConnected(true);
        console.log('WebSocket connecté');
      });

      socket.on('disconnect', () => {
        setIsConnected(false);
        console.log('WebSocket déconnecté');
      });

      socket.on('notification', (notification: Notification) => {
        setNotifications(prev => [notification, ...prev]);
        
        // Afficher une notification toast
        toast.success(notification.title, {
          description: notification.message,
          duration: 5000
        });
      });

      socket.on('notification:test:response', (data: any) => {
        console.log('Test de notification reçu:', data);
      });

      socketRef.current = socket;

    } catch (error) {
      console.error('Erreur connexion WebSocket:', error);
    }
  }, [accessToken]);

  // Déconnexion WebSocket
  const disconnectWebSocket = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
      setIsConnected(false);
    }
  }, []);

  // Charger les notifications
  const loadNotifications = useCallback(async (options: {
    limit?: number;
    offset?: number;
    status?: string;
    type?: string;
    category?: string;
  } = {}) => {
    try {
      setIsLoading(true);
      const { data } = await useApi().apiClient.get('/notifications', {
        params: options
      });
      setNotifications(data.data);
    } catch (error) {
      console.error('Erreur chargement notifications:', error);
      toast.error('Erreur lors du chargement des notifications');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Charger les statistiques
  const loadStats = useCallback(async () => {
    try {
      const { data } = await useApi().apiClient.get('/notifications/stats');
      setStats(data.data);
    } catch (error) {
      console.error('Erreur chargement statistiques:', error);
    }
  }, []);

  // Charger les préférences
  const loadPreferences = useCallback(async () => {
    try {
      const { data } = await useApi().apiClient.get('/notifications/preferences');
      setPreferences(data.data);
    } catch (error) {
      console.error('Erreur chargement préférences:', error);
    }
  }, []);

  // Marquer comme lu
  const markAsRead = useCallback(async (notificationId: string) => {
    try {
      await useApi().apiClient.put(`/notifications/${notificationId}/read`);
      setNotifications(prev => 
        prev.map(n => 
          n.id === notificationId 
            ? { ...n, status: 'read', readAt: new Date().toISOString() }
            : n
        )
      );
    } catch (error) {
      console.error('Erreur marquage notification:', error);
      toast.error('Erreur lors du marquage');
    }
  }, []);

  // Supprimer une notification
  const deleteNotification = useCallback(async (notificationId: string) => {
    try {
      await useApi().apiClient.delete(`/notifications/${notificationId}`);
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
    } catch (error) {
      console.error('Erreur suppression notification:', error);
      toast.error('Erreur lors de la suppression');
    }
  }, []);

  // Marquer toutes comme lues
  const markAllAsRead = useCallback(async () => {
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
  }, [notifications]);

  // Mettre à jour les préférences
  const updatePreferences = useCallback(async (newPreferences: Partial<NotificationPreferences>) => {
    try {
      await useApi().apiClient.put('/notifications/preferences', newPreferences);
      setPreferences(prev => prev ? { ...prev, ...newPreferences } : null);
      toast.success('Préférences mises à jour');
    } catch (error) {
      console.error('Erreur mise à jour préférences:', error);
      toast.error('Erreur lors de la mise à jour');
    }
  }, []);

  // Envoyer un test de notification
  const sendTestNotification = useCallback(async () => {
    try {
      if (socketRef.current) {
        socketRef.current.emit('notification:test', {
          message: 'Test de notification depuis le frontend'
        });
      }
    } catch (error) {
      console.error('Erreur test notification:', error);
    }
  }, []);

  // Obtenir les notifications non lues
  const unreadNotifications = notifications.filter(n => n.status !== 'read');
  const unreadCount = unreadNotifications.length;

  // Obtenir les notifications critiques
  const criticalNotifications = notifications.filter(n => 
    n.type === 'critical' || n.priority === 'critical'
  );

  // Obtenir les notifications par catégorie
  const getNotificationsByCategory = useCallback((category: string) => {
    return notifications.filter(n => n.category === category);
  }, [notifications]);

  // Obtenir les notifications par type
  const getNotificationsByType = useCallback((type: string) => {
    return notifications.filter(n => n.type === type);
  }, [notifications]);

  // Filtrer les notifications
  const filterNotifications = useCallback((filters: {
    search?: string;
    type?: string;
    category?: string;
    status?: string;
    priority?: string;
  }) => {
    return notifications.filter(notification => {
      if (filters.search) {
        const searchTerm = filters.search.toLowerCase();
        if (!notification.title.toLowerCase().includes(searchTerm) &&
            !notification.message.toLowerCase().includes(searchTerm)) {
          return false;
        }
      }

      if (filters.type && notification.type !== filters.type) {
        return false;
      }

      if (filters.category && notification.category !== filters.category) {
        return false;
      }

      if (filters.status && notification.status !== filters.status) {
        return false;
      }

      if (filters.priority && notification.priority !== filters.priority) {
        return false;
      }

      return true;
    });
  }, [notifications]);

  // Formater la date
  const formatDate = useCallback((dateString: string) => {
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
  }, []);

  return {
    // État
    notifications,
    stats,
    preferences,
    isConnected,
    isLoading,
    unreadCount,
    criticalNotifications,
    
    // Actions
    loadNotifications,
    loadStats,
    loadPreferences,
    markAsRead,
    deleteNotification,
    markAllAsRead,
    updatePreferences,
    sendTestNotification,
    
    // Utilitaires
    getNotificationsByCategory,
    getNotificationsByType,
    filterNotifications,
    formatDate,
    
    // WebSocket
    socket: socketRef.current
  };
}

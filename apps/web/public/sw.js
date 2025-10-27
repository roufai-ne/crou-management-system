/**
 * FICHIER: apps\web\public\sw.js
 * SERVICE WORKER: Service Worker pour PWA
 * 
 * DESCRIPTION:
 * Service Worker pour les capacités PWA offline
 * Cache intelligent et synchronisation différée
 * 
 * FONCTIONNALITÉS:
 * - Cache des ressources statiques
 * - Cache des données API
 * - Synchronisation différée
 * - Gestion des mises à jour
 * - Notifications push
 * 
 * AUTEUR: Équipe CROU
 * DATE: Décembre 2024
 */

const CACHE_NAME = 'crou-pwa-v1';
const API_CACHE_NAME = 'crou-api-v1';
const STATIC_CACHE_NAME = 'crou-static-v1';

// Ressources à mettre en cache
const STATIC_RESOURCES = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.ico',
  '/assets/',
  '/static/'
];

// Routes API à mettre en cache
const API_ROUTES = [
  '/api/auth/profile',
  '/api/dashboard',
  '/api/financial',
  '/api/stocks',
  '/api/housing',
  '/api/transport',
  '/api/notifications'
];

// Configuration du cache
const CACHE_CONFIG = {
  // Cache des ressources statiques
  static: {
    strategy: 'cacheFirst',
    maxAge: 86400000, // 24 heures
    maxEntries: 100
  },
  // Cache des données API
  api: {
    strategy: 'networkFirst',
    maxAge: 300000, // 5 minutes
    maxEntries: 50
  },
  // Cache des images
  images: {
    strategy: 'cacheFirst',
    maxAge: 2592000000, // 30 jours
    maxEntries: 200
  }
};

// Installation du Service Worker
self.addEventListener('install', (event) => {
  console.log('Service Worker: Installation en cours...');
  
  event.waitUntil(
    Promise.all([
      // Cache des ressources statiques
      caches.open(STATIC_CACHE_NAME).then((cache) => {
        return cache.addAll(STATIC_RESOURCES);
      }),
      // Cache des routes API
      caches.open(API_CACHE_NAME).then((cache) => {
        return cache.addAll(API_ROUTES.map(route => new Request(route, { method: 'GET' })));
      })
    ]).then(() => {
      console.log('Service Worker: Installation terminée');
      return self.skipWaiting();
    })
  );
});

// Activation du Service Worker
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activation en cours...');
  
  event.waitUntil(
    Promise.all([
      // Nettoyer les anciens caches
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME && 
                cacheName !== API_CACHE_NAME && 
                cacheName !== STATIC_CACHE_NAME) {
              console.log('Service Worker: Suppression ancien cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      }),
      // Prendre le contrôle de tous les clients
      self.clients.claim()
    ]).then(() => {
      console.log('Service Worker: Activation terminée');
    })
  );
});

// Gestion des requêtes
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Ignorer les requêtes non-HTTP
  if (!request.url.startsWith('http')) {
    return;
  }
  
  // Stratégie de cache selon le type de ressource
  if (isStaticResource(request)) {
    event.respondWith(handleStaticResource(request));
  } else if (isAPIRequest(request)) {
    event.respondWith(handleAPIRequest(request));
  } else if (isImageRequest(request)) {
    event.respondWith(handleImageRequest(request));
  } else {
    event.respondWith(handleOtherRequest(request));
  }
});

// Vérifier si c'est une ressource statique
function isStaticResource(request) {
  return request.method === 'GET' && 
         (request.url.includes('/assets/') || 
          request.url.includes('/static/') ||
          request.url.endsWith('.js') ||
          request.url.endsWith('.css') ||
          request.url.endsWith('.html'));
}

// Vérifier si c'est une requête API
function isAPIRequest(request) {
  return request.url.includes('/api/') && request.method === 'GET';
}

// Vérifier si c'est une requête d'image
function isImageRequest(request) {
  return request.method === 'GET' && 
         (request.url.endsWith('.jpg') || 
          request.url.endsWith('.jpeg') || 
          request.url.endsWith('.png') || 
          request.url.endsWith('.gif') || 
          request.url.endsWith('.webp') || 
          request.url.endsWith('.svg'));
}

// Gérer les ressources statiques
async function handleStaticResource(request) {
  try {
    const cache = await caches.open(STATIC_CACHE_NAME);
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
      console.log('Service Worker: Ressource statique depuis le cache:', request.url);
      return cachedResponse;
    }
    
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.error('Service Worker: Erreur ressource statique:', error);
    return new Response('Ressource non disponible', { status: 404 });
  }
}

// Gérer les requêtes API
async function handleAPIRequest(request) {
  try {
    const cache = await caches.open(API_CACHE_NAME);
    const cachedResponse = await cache.match(request);
    
    // Essayer d'abord le réseau
    try {
      const networkResponse = await fetch(request);
      
      if (networkResponse.ok) {
        // Mettre à jour le cache
        cache.put(request, networkResponse.clone());
        console.log('Service Worker: Données API depuis le réseau:', request.url);
        return networkResponse;
      }
    } catch (networkError) {
      console.log('Service Worker: Réseau indisponible, utilisation du cache');
    }
    
    // Utiliser le cache si le réseau échoue
    if (cachedResponse) {
      console.log('Service Worker: Données API depuis le cache:', request.url);
      return cachedResponse;
    }
    
    // Retourner une réponse d'erreur si pas de cache
    return new Response(JSON.stringify({
      error: 'Données non disponibles hors ligne',
      offline: true
    }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('Service Worker: Erreur requête API:', error);
    return new Response(JSON.stringify({
      error: 'Erreur de récupération des données',
      offline: true
    }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// Gérer les requêtes d'images
async function handleImageRequest(request) {
  try {
    const cache = await caches.open(STATIC_CACHE_NAME);
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
      console.log('Service Worker: Image depuis le cache:', request.url);
      return cachedResponse;
    }
    
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.error('Service Worker: Erreur image:', error);
    return new Response('Image non disponible', { status: 404 });
  }
}

// Gérer les autres requêtes
async function handleOtherRequest(request) {
  try {
    return await fetch(request);
  } catch (error) {
    console.error('Service Worker: Erreur requête:', error);
    return new Response('Ressource non disponible', { status: 404 });
  }
}

// Gestion des messages du client
self.addEventListener('message', (event) => {
  const { type, data } = event.data;
  
  switch (type) {
    case 'SKIP_WAITING':
      self.skipWaiting();
      break;
      
    case 'CACHE_CLEAR':
      clearCaches().then(() => {
        event.ports[0].postMessage({ success: true });
      });
      break;
      
    case 'CACHE_STATUS':
      getCacheStatus().then((status) => {
        event.ports[0].postMessage({ status });
      });
      break;
      
    case 'SYNC_DATA':
      syncData(data).then(() => {
        event.ports[0].postMessage({ success: true });
      });
      break;
      
    default:
      console.log('Service Worker: Message non reconnu:', type);
  }
});

// Nettoyer les caches
async function clearCaches() {
  const cacheNames = await caches.keys();
  await Promise.all(
    cacheNames.map(cacheName => caches.delete(cacheName))
  );
  console.log('Service Worker: Caches nettoyés');
}

// Obtenir le statut des caches
async function getCacheStatus() {
  const cacheNames = await caches.keys();
  const status = {};
  
  for (const cacheName of cacheNames) {
    const cache = await caches.open(cacheName);
    const keys = await cache.keys();
    status[cacheName] = keys.length;
  }
  
  return status;
}

// Synchroniser les données
async function syncData(data) {
  try {
    // TODO: Implémenter la synchronisation des données
    console.log('Service Worker: Synchronisation des données:', data);
  } catch (error) {
    console.error('Service Worker: Erreur synchronisation:', error);
  }
}

// Gestion des notifications push
self.addEventListener('push', (event) => {
  if (event.data) {
    const data = event.data.json();
    
    const options = {
      body: data.body,
      icon: '/favicon.ico',
      badge: '/favicon.ico',
      tag: data.tag || 'crou-notification',
      data: data.data || {},
      actions: data.actions || []
    };
    
    event.waitUntil(
      self.registration.showNotification(data.title, options)
    );
  }
});

// Gestion des clics sur les notifications
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  const urlToOpen = event.notification.data?.url || '/';
  
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then((clientList) => {
      // Ouvrir une nouvelle fenêtre si aucune n'est ouverte
      if (clientList.length === 0) {
        return clients.openWindow(urlToOpen);
      }
      
      // Focus sur la fenêtre existante
      const client = clientList[0];
      if (client.focus) {
        client.focus();
      }
      
      // Naviguer vers l'URL si nécessaire
      if (client.url !== urlToOpen) {
        client.navigate(urlToOpen);
      }
    })
  );
});

// Gestion des notifications fermées
self.addEventListener('notificationclose', (event) => {
  console.log('Service Worker: Notification fermée:', event.notification.tag);
});

// Gestion des erreurs
self.addEventListener('error', (event) => {
  console.error('Service Worker: Erreur:', event.error);
});

// Gestion des promesses rejetées
self.addEventListener('unhandledrejection', (event) => {
  console.error('Service Worker: Promesse rejetée:', event.reason);
});

console.log('Service Worker: Chargé et prêt');

/**
 * FICHIER: apps\web\src\pages\offline\OfflinePage.tsx
 * PAGE: Page des capacités PWA offline
 * 
 * DESCRIPTION:
 * Page pour la gestion des capacités PWA offline
 * Configuration, monitoring et tests
 * 
 * AUTEUR: Équipe CROU
 * DATE: Décembre 2024
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import { 
  Wifi, 
  WifiOff, 
  RefreshCw, 
  AlertTriangle, 
  CheckCircle, 
  Clock,
  Database,
  Settings,
  BarChart3,
  TrendingUp,
  Shield,
  Zap,
  Download,
  Upload,
  Trash2,
  TestTube
} from 'lucide-react';
import { useOffline } from '@/hooks/useOffline';
import { useNotifications } from '@/hooks/useNotifications';
import { OfflineBanner } from '@/components/offline/OfflineBanner';
import { OfflineIndicator } from '@/components/offline/OfflineIndicator';
import toast from 'react-hot-toast';

export default function OfflinePage() {
  const {
    isOnline,
    isSyncing,
    pendingCount,
    lastSync,
    errors,
    cacheStats,
    forceSync,
    clearSyncQueue,
    clearCache,
    clearErrors,
    getSyncStatus,
    getPendingData,
    getCacheStatistics,
    getSyncProgress,
    getTimeSinceLastSync,
    getConnectionStatus,
    getPerformanceMetrics
  } = useOffline();

  const { sendTestNotification } = useNotifications();
  const [activeTab, setActiveTab] = useState('status');
  const [isServiceWorkerRegistered, setIsServiceWorkerRegistered] = useState(false);
  const [serviceWorkerVersion, setServiceWorkerVersion] = useState('');

  // Vérifier l'état du Service Worker
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then((registration) => {
        setIsServiceWorkerRegistered(true);
        setServiceWorkerVersion(registration.active?.scriptURL || '');
      });
    }
  }, []);

  const handleForceSync = async () => {
    try {
      await forceSync();
      toast.success('Synchronisation démarrée');
    } catch (error) {
      toast.error('Erreur lors de la synchronisation');
    }
  };

  const handleClearQueue = async () => {
    try {
      await clearSyncQueue();
      toast.success('File de synchronisation vidée');
    } catch (error) {
      toast.error('Erreur lors du vidage de la file');
    }
  };

  const handleClearCache = async () => {
    try {
      await clearCache();
      toast.success('Cache vidé');
    } catch (error) {
      toast.error('Erreur lors du vidage du cache');
    }
  };

  const handleClearErrors = () => {
    clearErrors();
    toast.success('Erreurs effacées');
  };

  const handleTestNotification = async () => {
    try {
      await sendTestNotification();
      toast.success('Notification de test envoyée');
    } catch (error) {
      toast.error('Erreur lors de l\'envoi de la notification');
    }
  };

  const handleTestOfflineMode = () => {
    // Simuler le mode hors ligne
    toast.info('Test du mode hors ligne - Vérifiez les fonctionnalités');
  };

  const handleTestSync = () => {
    // Tester la synchronisation
    toast.info('Test de synchronisation - Vérifiez les logs');
  };

  const getStatusIcon = () => {
    if (isSyncing) {
      return <RefreshCw className="w-5 h-5 animate-spin text-blue-600" />;
    } else if (isOnline) {
      return <Wifi className="w-5 h-5 text-green-600" />;
    } else {
      return <WifiOff className="w-5 h-5 text-red-600" />;
    }
  };

  const getStatusColor = () => {
    if (isSyncing) return 'blue';
    if (isOnline) return 'green';
    return 'red';
  };

  const getStatusText = () => {
    if (isSyncing) return 'Synchronisation en cours';
    if (isOnline) return 'En ligne';
    return 'Hors ligne';
  };

  const getProgressPercentage = () => {
    return getSyncProgress();
  };

  const getTimeSinceLastSyncText = () => {
    return getTimeSinceLastSync();
  };

  const pendingData = getPendingData();
  const cacheStats = getCacheStatistics();
  const performanceMetrics = getPerformanceMetrics();

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Capacités PWA Offline</h1>
          <p className="text-gray-600 mt-1">
            Gestion des capacités offline et synchronisation
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={getStatusColor() as any}>
            {getStatusText()}
          </Badge>
          <Button
            onClick={handleForceSync}
            disabled={isSyncing || !isOnline}
            leftIcon={<RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />}
          >
            {isSyncing ? 'Sync...' : 'Synchroniser'}
          </Button>
        </div>
      </div>

      {/* Bannière de statut */}
      <OfflineBanner />

      {/* Contenu principal */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="status">Statut</TabsTrigger>
          <TabsTrigger value="cache">Cache</TabsTrigger>
          <TabsTrigger value="sync">Synchronisation</TabsTrigger>
          <TabsTrigger value="settings">Configuration</TabsTrigger>
          <TabsTrigger value="tests">Tests</TabsTrigger>
        </TabsList>

        <TabsContent value="status" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Statut de connexion */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Connexion</CardTitle>
                {getStatusIcon()}
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {getStatusText()}
                </div>
                <p className="text-xs text-muted-foreground">
                  {isOnline ? 'Connexion active' : 'Mode hors ligne'}
                </p>
              </CardContent>
            </Card>

            {/* Données en attente */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">En Attente</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600">
                  {pendingCount}
                </div>
                <p className="text-xs text-muted-foreground">
                  Données à synchroniser
                </p>
              </CardContent>
            </Card>

            {/* Dernière synchronisation */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Dernière Sync</CardTitle>
                <CheckCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {lastSync ? getTimeSinceLastSyncText() : 'Jamais'}
                </div>
                <p className="text-xs text-muted-foreground">
                  {lastSync ? 'Synchronisation réussie' : 'Aucune synchronisation'}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Service Worker */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5" />
                Service Worker
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">État</span>
                  <Badge variant={isServiceWorkerRegistered ? 'green' : 'red'}>
                    {isServiceWorkerRegistered ? 'Actif' : 'Inactif'}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Version</span>
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {serviceWorkerVersion || 'Non disponible'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Cache</span>
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {cacheStats.size} entrées
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="cache" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="w-5 h-5" />
                Gestion du Cache
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Statistiques du cache */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {cacheStats.size}
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Entrées</p>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {cacheStats.entries.length}
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Clés</p>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-600">
                      {performanceMetrics.cacheHitRate}%
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Taux de succès</p>
                  </div>
                </div>

                {/* Clés du cache */}
                <div>
                  <h4 className="text-sm font-medium mb-2">Clés du Cache</h4>
                  <div className="max-h-40 overflow-y-auto bg-gray-50 rounded p-2">
                    {cacheStats.entries.length > 0 ? (
                      cacheStats.entries.map((key, index) => (
                        <div key={index} className="text-xs text-gray-600 py-1">
                          {key}
                        </div>
                      ))
                    ) : (
                      <div className="text-xs text-gray-500 text-center py-4">
                        Aucune clé dans le cache
                      </div>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <Button
                    onClick={handleClearCache}
                    variant="outline"
                    leftIcon={<Trash2 className="w-4 h-4" />}
                  >
                    Vider le Cache
                  </Button>
                  <Button
                    onClick={() => window.location.reload()}
                    variant="outline"
                    leftIcon={<RefreshCw className="w-4 h-4" />}
                  >
                    Actualiser
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sync" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="w-5 h-5" />
                Synchronisation
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Barre de progression */}
                {isSyncing && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span>Synchronisation en cours...</span>
                      <span>{getProgressPercentage()}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${getProgressPercentage()}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Données en attente */}
                <div>
                  <h4 className="text-sm font-medium mb-2">
                    Données en Attente ({pendingData.length})
                  </h4>
                  <div className="max-h-40 overflow-y-auto bg-gray-50 rounded p-2">
                    {pendingData.length > 0 ? (
                      pendingData.map((data, index) => (
                        <div key={index} className="text-xs text-gray-600 py-1 border-b">
                          <div className="font-medium">{data.type.toUpperCase()}</div>
                          <div className="text-gray-500 dark:text-gray-400">{data.endpoint}</div>
                          <div className="text-gray-400">
                            Tentatives: {data.retryCount}/{data.maxRetries}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-xs text-gray-500 text-center py-4">
                        Aucune donnée en attente
                      </div>
                    )}
                  </div>
                </div>

                {/* Erreurs */}
                {errors.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium mb-2 text-red-600">
                      Erreurs ({errors.length})
                    </h4>
                    <div className="max-h-40 overflow-y-auto bg-red-50 rounded p-2">
                      {errors.map((error, index) => (
                        <div key={index} className="text-xs text-red-600 py-1">
                          {error}
                        </div>
                      ))}
                    </div>
                    <Button
                      onClick={handleClearErrors}
                      variant="outline"
                      size="sm"
                      className="mt-2"
                    >
                      Effacer les Erreurs
                    </Button>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-2">
                  <Button
                    onClick={handleForceSync}
                    disabled={isSyncing || !isOnline}
                    leftIcon={<RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />}
                  >
                    {isSyncing ? 'Sync...' : 'Synchroniser'}
                  </Button>
                  <Button
                    onClick={handleClearQueue}
                    disabled={pendingCount === 0}
                    variant="outline"
                    leftIcon={<Trash2 className="w-4 h-4" />}
                  >
                    Vider la File
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5" />
                Configuration PWA
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-sm font-medium mb-2">Cache</h4>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">TTL par défaut</span>
                        <span className="text-sm text-gray-600 dark:text-gray-400">5 minutes</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Taille maximale</span>
                        <span className="text-sm text-gray-600 dark:text-gray-400">1000 entrées</span>
                      </div>
                    </div>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium mb-2">Synchronisation</h4>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Intervalle</span>
                        <span className="text-sm text-gray-600 dark:text-gray-400">30 secondes</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Tentatives max</span>
                        <span className="text-sm text-gray-600 dark:text-gray-400">3</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-medium mb-2">Notifications</h4>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Push notifications</span>
                      <Badge variant="green">Activé</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Service Worker</span>
                      <Badge variant={isServiceWorkerRegistered ? 'green' : 'red'}>
                        {isServiceWorkerRegistered ? 'Actif' : 'Inactif'}
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tests" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TestTube className="w-5 h-5" />
                Tests PWA
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Button
                    onClick={handleTestNotification}
                    variant="outline"
                    leftIcon={<Zap className="w-4 h-4" />}
                    className="h-20"
                  >
                    <div className="text-center">
                      <div className="font-medium">Test Notification</div>
                      <div className="text-xs text-gray-600 dark:text-gray-400">Envoyer une notification de test</div>
                    </div>
                  </Button>

                  <Button
                    onClick={handleTestOfflineMode}
                    variant="outline"
                    leftIcon={<WifiOff className="w-4 h-4" />}
                    className="h-20"
                  >
                    <div className="text-center">
                      <div className="font-medium">Test Mode Offline</div>
                      <div className="text-xs text-gray-600 dark:text-gray-400">Simuler le mode hors ligne</div>
                    </div>
                  </Button>

                  <Button
                    onClick={handleTestSync}
                    variant="outline"
                    leftIcon={<RefreshCw className="w-4 h-4" />}
                    className="h-20"
                  >
                    <div className="text-center">
                      <div className="font-medium">Test Synchronisation</div>
                      <div className="text-xs text-gray-600 dark:text-gray-400">Tester la synchronisation</div>
                    </div>
                  </Button>

                  <Button
                    onClick={() => window.location.reload()}
                    variant="outline"
                    leftIcon={<Download className="w-4 h-4" />}
                    className="h-20"
                  >
                    <div className="text-center">
                      <div className="font-medium">Recharger PWA</div>
                      <div className="text-xs text-gray-600 dark:text-gray-400">Actualiser l'application</div>
                    </div>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Indicateur flottant */}
      <OfflineIndicator />
    </div>
  );
}

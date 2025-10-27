/**
 * FICHIER: apps\web\src\components\offline\OfflineIndicator.tsx
 * COMPOSANT: OfflineIndicator - Indicateur de statut offline
 * 
 * DESCRIPTION:
 * Composant pour afficher le statut de connexion
 * Indicateur visuel et actions de synchronisation
 * 
 * FONCTIONNALITÉS:
 * - Indicateur de statut de connexion
 * - Boutons de synchronisation
 * - Informations sur les données en attente
 * - Notifications de statut
 * 
 * AUTEUR: Équipe CROU
 * DATE: Décembre 2024
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { 
  Wifi, 
  WifiOff, 
  RefreshCw, 
  AlertTriangle, 
  CheckCircle, 
  Clock,
  Database,
  Trash2,
  Settings
} from 'lucide-react';
import { useOffline } from '@/hooks/useOffline';
import { useNotifications } from '@/hooks/useNotifications';
import toast from 'react-hot-toast';

export function OfflineIndicator() {
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
    getSyncProgress,
    getTimeSinceLastSync,
    getConnectionStatus
  } = useOffline();

  const { sendTestNotification } = useNotifications();
  const [isExpanded, setIsExpanded] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  // Afficher une notification lors du changement de statut
  useEffect(() => {
    if (!isOnline) {
      toast.error('Connexion perdue - Mode hors ligne activé', {
        duration: 5000
      });
    } else if (lastSync) {
      toast.success('Connexion rétablie - Synchronisation en cours', {
        duration: 3000
      });
    }
  }, [isOnline, lastSync]);

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

  const getStatusIcon = () => {
    if (isSyncing) {
      return <RefreshCw className="w-4 h-4 animate-spin text-blue-600" />;
    } else if (isOnline) {
      return <Wifi className="w-4 h-4 text-green-600" />;
    } else {
      return <WifiOff className="w-4 h-4 text-red-600" />;
    }
  };

  const getStatusColor = () => {
    if (isSyncing) return 'blue';
    if (isOnline) return 'green';
    return 'red';
  };

  const getStatusText = () => {
    if (isSyncing) return 'Synchronisation...';
    if (isOnline) return 'En ligne';
    return 'Hors ligne';
  };

  const getProgressPercentage = () => {
    return getSyncProgress();
  };

  const getTimeSinceLastSyncText = () => {
    return getTimeSinceLastSync();
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {/* Indicateur compact */}
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsExpanded(!isExpanded)}
          className={`flex items-center gap-2 ${
            isOnline ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
          }`}
        >
          {getStatusIcon()}
          <span className="text-sm font-medium">{getStatusText()}</span>
          {pendingCount > 0 && (
            <Badge variant="orange" className="ml-1">
              {pendingCount}
            </Badge>
          )}
        </Button>

        {/* Bouton de synchronisation */}
        {isOnline && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleForceSync}
            disabled={isSyncing}
            className="flex items-center gap-1"
          >
            <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
          </Button>
        )}
      </div>

      {/* Panneau détaillé */}
      {isExpanded && (
        <Card className="w-80 mt-2 shadow-lg">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-semibold">
                Statut de Connexion
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowDetails(!showDetails)}
              >
                <Settings className="w-4 h-4" />
              </Button>
            </div>
          </CardHeader>

          <CardContent className="space-y-4">
            {/* Statut principal */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {getStatusIcon()}
                <span className="font-medium">{getStatusText()}</span>
              </div>
              <Badge variant={getStatusColor() as any}>
                {getStatusText()}
              </Badge>
            </div>

            {/* Informations de synchronisation */}
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
            {pendingCount > 0 && (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-orange-600" />
                  <span className="text-sm">Données en attente</span>
                </div>
                <Badge variant="orange">{pendingCount}</Badge>
              </div>
            )}

            {/* Dernière synchronisation */}
            {lastSync && (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span className="text-sm">Dernière sync</span>
                </div>
                <span className="text-sm text-gray-600">
                  {getTimeSinceLastSyncText()}
                </span>
              </div>
            )}

            {/* Erreurs */}
            {errors.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-red-600" />
                  <span className="text-sm font-medium text-red-600">
                    Erreurs ({errors.length})
                  </span>
                </div>
                <div className="max-h-20 overflow-y-auto">
                  {errors.map((error, index) => (
                    <div key={index} className="text-xs text-red-600 bg-red-50 p-2 rounded">
                      {error}
                    </div>
                  ))}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleClearErrors}
                  className="w-full"
                >
                  Effacer les erreurs
                </Button>
              </div>
            )}

            {/* Détails avancés */}
            {showDetails && (
              <div className="space-y-3 pt-3 border-t">
                <div className="space-y-2">
                  <h4 className="text-sm font-medium">Cache</h4>
                  <div className="flex items-center justify-between text-sm">
                    <span>Entrées</span>
                    <span>{cacheStats.size}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span>Clés</span>
                    <span>{cacheStats.entries.length}</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="text-sm font-medium">Actions</h4>
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleClearQueue}
                      disabled={pendingCount === 0}
                      className="flex items-center gap-1"
                    >
                      <Trash2 className="w-3 h-3" />
                      Vider file
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleClearCache}
                      className="flex items-center gap-1"
                    >
                      <Database className="w-3 h-3" />
                      Vider cache
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="text-sm font-medium">Test</h4>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={sendTestNotification}
                    className="w-full"
                  >
                    Tester notification
                  </Button>
                </div>
              </div>
            )}

            {/* Actions principales */}
            <div className="flex gap-2 pt-3 border-t">
              {isOnline && (
                <Button
                  onClick={handleForceSync}
                  disabled={isSyncing}
                  className="flex-1"
                  leftIcon={<RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />}
                >
                  {isSyncing ? 'Sync...' : 'Synchroniser'}
                </Button>
              )}
              <Button
                variant="outline"
                onClick={() => setIsExpanded(false)}
                className="flex-1"
              >
                Fermer
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

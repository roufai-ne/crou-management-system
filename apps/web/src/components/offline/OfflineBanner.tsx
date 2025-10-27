/**
 * FICHIER: apps\web\src\components\offline\OfflineBanner.tsx
 * COMPOSANT: OfflineBanner - Bannière de statut offline
 * 
 * DESCRIPTION:
 * Bannière pour afficher le statut de connexion
 * Affichage en haut de page avec informations
 * 
 * FONCTIONNALITÉS:
 * - Bannière de statut de connexion
 * - Informations sur la synchronisation
 * - Actions de synchronisation
 * - Design responsive
 * 
 * AUTEUR: Équipe CROU
 * DATE: Décembre 2024
 */

import React from 'react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { 
  Wifi, 
  WifiOff, 
  RefreshCw, 
  AlertTriangle, 
  CheckCircle, 
  Clock,
  X
} from 'lucide-react';
import { useOffline } from '@/hooks/useOffline';
import { useNotifications } from '@/hooks/useNotifications';
import toast from 'react-hot-toast';

interface OfflineBannerProps {
  onClose?: () => void;
  showCloseButton?: boolean;
  className?: string;
}

export function OfflineBanner({ 
  onClose, 
  showCloseButton = true, 
  className = '' 
}: OfflineBannerProps) {
  const {
    isOnline,
    isSyncing,
    pendingCount,
    lastSync,
    errors,
    forceSync,
    getSyncProgress,
    getTimeSinceLastSync
  } = useOffline();

  const { sendTestNotification } = useNotifications();

  const handleForceSync = async () => {
    try {
      await forceSync();
      toast.success('Synchronisation démarrée');
    } catch (error) {
      toast.error('Erreur lors de la synchronisation');
    }
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

  const getStatusText = () => {
    if (isSyncing) return 'Synchronisation en cours...';
    if (isOnline) return 'Connexion rétablie';
    return 'Connexion perdue - Mode hors ligne';
  };

  const getStatusColor = () => {
    if (isSyncing) return 'blue';
    if (isOnline) return 'green';
    return 'red';
  };

  const getBackgroundColor = () => {
    if (isSyncing) return 'bg-blue-50 border-blue-200';
    if (isOnline) return 'bg-green-50 border-green-200';
    return 'bg-red-50 border-red-200';
  };

  const getTextColor = () => {
    if (isSyncing) return 'text-blue-800';
    if (isOnline) return 'text-green-800';
    return 'text-red-800';
  };

  const getProgressPercentage = () => {
    return getSyncProgress();
  };

  const getTimeSinceLastSyncText = () => {
    return getTimeSinceLastSync();
  };

  // Ne pas afficher si en ligne et pas de synchronisation
  if (isOnline && !isSyncing && pendingCount === 0) {
    return null;
  }

  return (
    <div className={`w-full ${className}`}>
      <div className={`border-l-4 ${getBackgroundColor()} p-4 rounded-r-lg shadow-sm`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {getStatusIcon()}
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className={`font-medium ${getTextColor()}`}>
                  {getStatusText()}
                </span>
                <Badge variant={getStatusColor() as any}>
                  {getStatusText()}
                </Badge>
              </div>
              
              {/* Informations supplémentaires */}
              <div className="mt-1 space-y-1">
                {/* Données en attente */}
                {pendingCount > 0 && (
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="w-3 h-3 text-orange-600" />
                    <span className="text-gray-600">
                      {pendingCount} donnée{pendingCount > 1 ? 's' : ''} en attente de synchronisation
                    </span>
                  </div>
                )}

                {/* Dernière synchronisation */}
                {lastSync && (
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle className="w-3 h-3 text-green-600" />
                    <span className="text-gray-600">
                      Dernière synchronisation: {getTimeSinceLastSyncText()}
                    </span>
                  </div>
                )}

                {/* Erreurs */}
                {errors.length > 0 && (
                  <div className="flex items-center gap-2 text-sm">
                    <AlertTriangle className="w-3 h-3 text-red-600" />
                    <span className="text-red-600">
                      {errors.length} erreur{errors.length > 1 ? 's' : ''} de synchronisation
                    </span>
                  </div>
                )}

                {/* Barre de progression */}
                {isSyncing && (
                  <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${getProgressPercentage()}%` }}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            {/* Bouton de synchronisation */}
            {isOnline && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleForceSync}
                disabled={isSyncing}
                className="flex items-center gap-1"
              >
                <RefreshCw className={`w-3 h-3 ${isSyncing ? 'animate-spin' : ''}`} />
                {isSyncing ? 'Sync...' : 'Sync'}
              </Button>
            )}

            {/* Bouton de test */}
            <Button
              variant="ghost"
              size="sm"
              onClick={sendTestNotification}
              className="flex items-center gap-1"
            >
              Test
            </Button>

            {/* Bouton de fermeture */}
            {showCloseButton && onClose && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="flex items-center gap-1"
              >
                <X className="w-3 h-3" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

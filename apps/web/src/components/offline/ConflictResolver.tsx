/**
 * FICHIER: apps\web\src\components\offline\ConflictResolver.tsx
 * COMPOSANT: ConflictResolver - Résolveur de conflits
 * 
 * DESCRIPTION:
 * Composant pour la résolution des conflits de synchronisation
 * Interface utilisateur pour la gestion des conflits
 * 
 * FONCTIONNALITÉS:
 * - Affichage des conflits
 * - Résolution manuelle
 * - Comparaison des données
 * - Historique des résolutions
 * 
 * AUTEUR: Équipe CROU
 * DATE: Décembre 2024
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  RefreshCw, 
  Eye,
  EyeOff,
  GitMerge,
  Server,
  Monitor,
  Clock,
  User
} from 'lucide-react';
import { syncService } from '@/services/sync.service';
import { logger } from '@/utils/logger';
import toast from 'react-hot-toast';

// Types pour les conflits
interface ConflictResolution {
  id: string;
  serverData: any;
  clientData: any;
  resolution: 'server' | 'client' | 'merge' | 'manual';
  resolvedAt: Date;
  resolvedBy: string;
}

interface ConflictData {
  id: string;
  type: 'create' | 'update' | 'delete';
  endpoint: string;
  data: any;
  timestamp: Date;
  retryCount: number;
  maxRetries: number;
  priority: 'low' | 'medium' | 'high' | 'critical';
  conflictResolution?: 'server' | 'client' | 'merge' | 'manual';
  metadata?: any;
}

export function ConflictResolver() {
  const [conflicts, setConflicts] = useState<ConflictResolution[]>([]);
  const [selectedConflict, setSelectedConflict] = useState<ConflictResolution | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [isResolving, setIsResolving] = useState(false);

  // Charger les conflits
  useEffect(() => {
    loadConflicts();
  }, []);

  const loadConflicts = () => {
    try {
      const conflictResolutions = syncService.getConflictResolutions();
      setConflicts(conflictResolutions);
    } catch (error) {
      logger.error('Erreur chargement conflits:', error);
    }
  };

  const handleResolveConflict = async (conflict: ConflictResolution, resolution: 'server' | 'client' | 'merge') => {
    try {
      setIsResolving(true);
      
      // Mettre à jour la résolution
      conflict.resolution = resolution;
      conflict.resolvedAt = new Date();
      conflict.resolvedBy = 'user';
      
      // Appliquer la résolution
      await applyResolution(conflict);
      
      // Mettre à jour l'état
      setConflicts(prev => 
        prev.map(c => c.id === conflict.id ? conflict : c)
      );
      
      toast.success('Conflit résolu avec succès');
      
    } catch (error) {
      logger.error('Erreur résolution conflit:', error);
      toast.error('Erreur lors de la résolution du conflit');
    } finally {
      setIsResolving(false);
    }
  };

  const applyResolution = async (conflict: ConflictResolution) => {
    try {
      let resolvedData;
      
      switch (conflict.resolution) {
        case 'server':
          resolvedData = conflict.serverData;
          break;
        case 'client':
          resolvedData = conflict.clientData;
          break;
        case 'merge':
          resolvedData = mergeData(conflict.serverData, conflict.clientData);
          break;
        default:
          throw new Error('Résolution non supportée');
      }
      
      // TODO: Appliquer la résolution au service de synchronisation
      logger.info('Résolution appliquée:', resolvedData);
      
    } catch (error) {
      logger.error('Erreur application résolution:', error);
      throw error;
    }
  };

  const mergeData = (serverData: any, clientData: any): any => {
    // Stratégie de fusion simple - le client gagne pour les champs modifiés
    return { ...serverData, ...clientData };
  };

  const getResolutionIcon = (resolution: string) => {
    switch (resolution) {
      case 'server':
        return <Server className="w-4 h-4 text-blue-600" />;
      case 'client':
        return <Monitor className="w-4 h-4 text-green-600" />;
      case 'merge':
        return <GitMerge className="w-4 h-4 text-purple-600" />;
      case 'manual':
        return <User className="w-4 h-4 text-orange-600" />;
      default:
        return <AlertTriangle className="w-4 h-4 text-gray-600 dark:text-gray-400" />;
    }
  };

  const getResolutionColor = (resolution: string) => {
    switch (resolution) {
      case 'server':
        return 'blue';
      case 'client':
        return 'green';
      case 'merge':
        return 'purple';
      case 'manual':
        return 'orange';
      default:
        return 'gray';
    }
  };

  const getResolutionText = (resolution: string) => {
    switch (resolution) {
      case 'server':
        return 'Serveur';
      case 'client':
        return 'Client';
      case 'merge':
        return 'Fusion';
      case 'manual':
        return 'Manuel';
      default:
        return 'Inconnu';
    }
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('fr-FR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  const formatJson = (data: any) => {
    return JSON.stringify(data, null, 2);
  };

  const getFieldDifferences = (serverData: any, clientData: any) => {
    const differences: string[] = [];
    
    // Comparer les champs
    const allKeys = new Set([...Object.keys(serverData), ...Object.keys(clientData)]);
    
    for (const key of allKeys) {
      if (serverData[key] !== clientData[key]) {
        differences.push(key);
      }
    }
    
    return differences;
  };

  return (
    <div className="space-y-4">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Résolution des Conflits</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {conflicts.length} conflit{conflicts.length > 1 ? 's' : ''} à résoudre
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={loadConflicts}
          leftIcon={<RefreshCw className="w-4 h-4" />}
        >
          Actualiser
        </Button>
      </div>

      {/* Liste des conflits */}
      {conflicts.length === 0 ? (
        <Card>
          <CardContent className="text-center py-8">
            <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400">Aucun conflit à résoudre</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {conflicts.map((conflict) => (
            <Card key={conflict.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base font-medium">
                    Conflit #{conflict.id.slice(-8)}
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <Badge variant={getResolutionColor(conflict.resolution) as any}>
                      {getResolutionText(conflict.resolution)}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedConflict(conflict)}
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent>
                <div className="space-y-4">
                  {/* Informations de base */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="text-sm font-medium mb-2">Données Serveur</h4>
                      <div className="bg-blue-50 p-3 rounded text-xs font-mono max-h-32 overflow-y-auto">
                        {formatJson(conflict.serverData)}
                      </div>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium mb-2">Données Client</h4>
                      <div className="bg-green-50 p-3 rounded text-xs font-mono max-h-32 overflow-y-auto">
                        {formatJson(conflict.clientData)}
                      </div>
                    </div>
                  </div>

                  {/* Différences */}
                  <div>
                    <h4 className="text-sm font-medium mb-2">Champs Différents</h4>
                    <div className="flex flex-wrap gap-2">
                      {getFieldDifferences(conflict.serverData, conflict.clientData).map((field) => (
                        <Badge key={field} variant="orange">
                          {field}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {/* Métadonnées */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">Résolu le:</span>
                      <p className="font-medium">{formatDate(conflict.resolvedAt)}</p>
                    </div>
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">Résolu par:</span>
                      <p className="font-medium">{conflict.resolvedBy}</p>
                    </div>
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">Statut:</span>
                      <p className="font-medium">
                        {conflict.resolution === 'manual' ? 'En attente' : 'Résolu'}
                      </p>
                    </div>
                  </div>

                  {/* Actions */}
                  {conflict.resolution === 'manual' && (
                    <div className="flex gap-2 pt-4 border-t">
                      <Button
                        onClick={() => handleResolveConflict(conflict, 'server')}
                        disabled={isResolving}
                        variant="outline"
                        size="sm"
                        leftIcon={<Server className="w-4 h-4" />}
                      >
                        Utiliser Serveur
                      </Button>
                      <Button
                        onClick={() => handleResolveConflict(conflict, 'client')}
                        disabled={isResolving}
                        variant="outline"
                        size="sm"
                        leftIcon={<Monitor className="w-4 h-4" />}
                      >
                        Utiliser Client
                      </Button>
                      <Button
                        onClick={() => handleResolveConflict(conflict, 'merge')}
                        disabled={isResolving}
                        variant="outline"
                        size="sm"
                        leftIcon={<GitMerge className="w-4 h-4" />}
                      >
                        Fusionner
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Détails du conflit sélectionné */}
      {selectedConflict && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Détails du Conflit</CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedConflict(null)}
              >
                <XCircle className="w-4 h-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Comparaison détaillée */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="text-sm font-medium mb-2">Serveur</h4>
                  <div className="bg-blue-50 p-4 rounded text-xs font-mono max-h-64 overflow-y-auto">
                    {formatJson(selectedConflict.serverData)}
                  </div>
                </div>
                <div>
                  <h4 className="text-sm font-medium mb-2">Client</h4>
                  <div className="bg-green-50 p-4 rounded text-xs font-mono max-h-64 overflow-y-auto">
                    {formatJson(selectedConflict.clientData)}
                  </div>
                </div>
              </div>

              {/* Actions de résolution */}
              <div className="flex gap-2 pt-4 border-t">
                <Button
                  onClick={() => handleResolveConflict(selectedConflict, 'server')}
                  disabled={isResolving}
                  leftIcon={<Server className="w-4 h-4" />}
                >
                  Utiliser Serveur
                </Button>
                <Button
                  onClick={() => handleResolveConflict(selectedConflict, 'client')}
                  disabled={isResolving}
                  leftIcon={<Monitor className="w-4 h-4" />}
                >
                  Utiliser Client
                </Button>
                <Button
                  onClick={() => handleResolveConflict(selectedConflict, 'merge')}
                  disabled={isResolving}
                  leftIcon={<GitMerge className="w-4 h-4" />}
                >
                  Fusionner
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

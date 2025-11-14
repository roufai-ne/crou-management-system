/**
 * FICHIER: apps/web/src/components/transport/ScanTicketQR.tsx
 * COMPOSANT: ScanTicketQR - Composant de scan QR code pour tickets transport
 *
 * DESCRIPTION:
 * Composant réutilisable pour scanner les QR codes des tickets transport
 * Support caméra, saisie manuelle, validation en temps réel
 *
 * FONCTIONNALITÉS:
 * - Scan QR code via caméra (si disponible)
 * - Saisie manuelle du numéro ou QR code
 * - Validation instantanée du ticket
 * - Affichage des détails du ticket
 * - Confirmation d'utilisation
 *
 * AUTEUR: Équipe CROU - Module Transport
 * DATE: Janvier 2025
 */

import React, { useState, useEffect, useRef } from 'react';
import { Card, Badge, Button, Input, Modal } from '@/components/ui';
import {
  QrCodeIcon,
  MagnifyingGlassIcon,
  CheckCircleIcon,
  XCircleIcon,
  CameraIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import {
  TicketTransport,
  TicketTransportStatus,
  CategorieTicketTransport,
  TicketTransportValidationResult
} from '@/services/api/transportTicketService';

interface ScanTicketQRProps {
  onTicketScanned?: (ticket: TicketTransport) => void;
  onTicketValidated?: (ticket: TicketTransport) => void;
  onCancel?: () => void;
  searchTicket: (identifier: string) => Promise<TicketTransport | null>;
  validateTicket: (ticketId: string) => Promise<TicketTransportValidationResult>;
  useTicket: (ticketId: string) => Promise<TicketTransport | null>;
  showModal?: boolean;
}

export const ScanTicketQR: React.FC<ScanTicketQRProps> = ({
  onTicketScanned,
  onTicketValidated,
  onCancel,
  searchTicket,
  validateTicket,
  useTicket,
  showModal = false
}) => {
  const [searchInput, setSearchInput] = useState('');
  const [scanning, setScanning] = useState(false);
  const [loading, setLoading] = useState(false);
  const [ticket, setTicket] = useState<TicketTransport | null>(null);
  const [validation, setValidation] = useState<TicketTransportValidationResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [cameraAvailable, setCameraAvailable] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  /**
   * Vérifier la disponibilité de la caméra
   */
  useEffect(() => {
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      setCameraAvailable(true);
    }
  }, []);

  /**
   * Nettoyer le stream vidéo
   */
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  /**
   * Démarrer la caméra
   */
  const startCamera = async () => {
    if (!cameraAvailable) {
      setError('Caméra non disponible sur cet appareil');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        setScanning(true);
        setError(null);
      }
    } catch (err) {
      console.error('Erreur caméra:', err);
      setError('Impossible d\'accéder à la caméra');
      setCameraAvailable(false);
    }
  };

  /**
   * Arrêter la caméra
   */
  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setScanning(false);
  };

  /**
   * Rechercher un ticket
   */
  const handleSearch = async () => {
    if (!searchInput.trim()) {
      setError('Veuillez saisir un numéro ou QR code');
      return;
    }

    setLoading(true);
    setError(null);
    setTicket(null);
    setValidation(null);

    try {
      const foundTicket = await searchTicket(searchInput);

      if (foundTicket) {
        setTicket(foundTicket);
        onTicketScanned?.(foundTicket);

        // Valider automatiquement
        const validationResult = await validateTicket(foundTicket.id);
        setValidation(validationResult);

        if (!validationResult.valide) {
          setError(validationResult.raison || 'Ticket invalide');
        }
      } else {
        setError('Ticket non trouvé');
      }
    } catch (err: any) {
      setError(err?.message || 'Erreur lors de la recherche');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Valider l'utilisation du ticket
   */
  const handleValidateUse = async () => {
    if (!ticket || !validation?.valide) return;

    setLoading(true);
    setError(null);

    try {
      const usedTicket = await useTicket(ticket.id);
      if (usedTicket) {
        onTicketValidated?.(usedTicket);
        setTicket(usedTicket);
        // Reset after 2 seconds
        setTimeout(() => {
          handleReset();
        }, 2000);
      }
    } catch (err: any) {
      setError(err?.message || 'Erreur lors de la validation');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Réinitialiser le formulaire
   */
  const handleReset = () => {
    setSearchInput('');
    setTicket(null);
    setValidation(null);
    setError(null);
    stopCamera();
  };

  /**
   * Obtenir le badge de statut
   */
  const getStatutBadge = (statut: TicketTransportStatus) => {
    switch (statut) {
      case TicketTransportStatus.ACTIF:
        return <Badge variant="success">Actif</Badge>;
      case TicketTransportStatus.UTILISE:
        return <Badge variant="secondary">Utilisé</Badge>;
      case TicketTransportStatus.EXPIRE:
        return <Badge variant="warning">Expiré</Badge>;
      case TicketTransportStatus.ANNULE:
        return <Badge variant="danger">Annulé</Badge>;
      default:
        return <Badge variant="secondary">{statut}</Badge>;
    }
  };

  const content = (
    <div className="space-y-6">
      {/* Zone de scan */}
      {scanning ? (
        <div className="relative">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            className="w-full h-64 bg-black rounded-lg"
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-48 h-48 border-4 border-blue-500 rounded-lg"></div>
          </div>
          <Button
            variant="outline"
            onClick={stopCamera}
            className="absolute top-2 right-2 bg-white dark:bg-gray-800"
          >
            Arrêter
          </Button>
        </div>
      ) : (
        <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600">
          <QrCodeIcon className="h-24 w-24 mx-auto text-gray-400 mb-4" />
          <p className="text-gray-600 mb-4">Scannez le QR Code ou saisissez le numéro</p>
          {cameraAvailable && (
            <Button variant="outline" onClick={startCamera} leftIcon={<CameraIcon className="h-5 w-5" />}>
              Activer la Caméra
            </Button>
          )}
        </div>
      )}

      {/* Saisie manuelle */}
      <div className="flex gap-2">
        <Input
          placeholder="Ex: TKT-TRANS-2025-000001 ou QR-TRANS-..."
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          onKeyPress={(e) => {
            if (e.key === 'Enter') {
              handleSearch();
            }
          }}
          disabled={loading}
          className="flex-1"
        />
        <Button
          variant="primary"
          onClick={handleSearch}
          disabled={loading || !searchInput.trim()}
          leftIcon={<MagnifyingGlassIcon className="h-5 w-5" />}
        >
          Rechercher
        </Button>
      </div>

      {/* Erreur */}
      {error && (
        <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-lg">
          <XCircleIcon className="h-5 w-5 text-red-600 flex-shrink-0" />
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {/* Détails du ticket */}
      {ticket && (
        <Card>
          <Card.Content className="p-4 space-y-3">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Numéro de ticket</p>
                <p className="font-mono text-lg font-bold">{ticket.numeroTicket}</p>
              </div>
              {getStatutBadge(ticket.status)}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Circuit</p>
                <p className="text-sm">{ticket.circuitNom || ticket.circuitId}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Catégorie</p>
                <p className="text-sm">
                  {ticket.categorie === CategorieTicketTransport.GRATUIT ? 'Gratuit' : 'Payant'}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Date voyage</p>
                <p className="text-sm">{new Date(ticket.dateVoyage).toLocaleDateString()}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Date expiration</p>
                <p className="text-sm">{new Date(ticket.dateExpiration).toLocaleDateString()}</p>
              </div>
            </div>

            <div>
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Tarif</p>
              <p className="text-lg font-bold">
                {ticket.tarif === 0 ? 'Gratuit' : `${ticket.tarif.toLocaleString()} XOF`}
              </p>
            </div>

            {ticket.dateUtilisation && (
              <div className="bg-gray-50 border border-gray-200 rounded p-3">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Déjà utilisé le:</p>
                <p className="text-sm">
                  {new Date(ticket.dateUtilisation).toLocaleDateString()} à{' '}
                  {new Date(ticket.dateUtilisation).toLocaleTimeString('fr-FR', {
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
              </div>
            )}

            {/* Résultat validation */}
            {validation && (
              <div
                className={`flex items-center gap-2 p-3 rounded-lg ${
                  validation.valide
                    ? 'bg-green-50 border border-green-200'
                    : 'bg-red-50 border border-red-200'
                }`}
              >
                {validation.valide ? (
                  <>
                    <CheckCircleIcon className="h-5 w-5 text-green-600 flex-shrink-0" />
                    <p className="text-sm font-medium text-green-800">Ticket valide</p>
                  </>
                ) : (
                  <>
                    <ExclamationTriangleIcon className="h-5 w-5 text-red-600 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-red-800">Ticket invalide</p>
                      <p className="text-xs text-red-700">{validation.raison}</p>
                    </div>
                  </>
                )}
              </div>
            )}
          </Card.Content>
        </Card>
      )}

      {/* Actions */}
      <div className="flex justify-end gap-3">
        {ticket && (
          <Button variant="outline" onClick={handleReset}>
            Nouveau Scan
          </Button>
        )}
        {onCancel && (
          <Button variant="outline" onClick={onCancel}>
            Annuler
          </Button>
        )}
        {ticket && validation?.valide && (
          <Button
            variant="primary"
            onClick={handleValidateUse}
            disabled={loading || ticket.status !== TicketTransportStatus.ACTIF}
            leftIcon={<CheckCircleIcon className="h-5 w-5" />}
          >
            Valider l'Utilisation
          </Button>
        )}
      </div>
    </div>
  );

  if (showModal) {
    return (
      <Modal isOpen={true} onClose={onCancel || (() => {})} title="Scanner un Ticket" size="lg">
        {content}
      </Modal>
    );
  }

  return <div className="max-w-2xl mx-auto">{content}</div>;
};

export default ScanTicketQR;

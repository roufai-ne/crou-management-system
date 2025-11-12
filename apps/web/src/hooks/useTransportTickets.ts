/**
 * FICHIER: apps/web/src/hooks/useTransportTickets.ts
 * HOOK: useTransportTickets - Hook personnalisé pour la gestion des tickets transport
 *
 * DESCRIPTION:
 * Hook React pour gérer l'état et les opérations des tickets de transport
 * Gestion du cache, filtres, pagination et refresh automatique
 *
 * FONCTIONNALITÉS:
 * - État local des tickets
 * - Filtres et recherche
 * - CRUD complet
 * - Gestion des erreurs
 * - Refresh automatique
 *
 * AUTEUR: Équipe CROU - Module Transport
 * DATE: Janvier 2025
 */

import { useState, useEffect, useCallback } from 'react';
import {
  transportTicketService,
  TicketTransport,
  TicketTransportFilters,
  CreateTicketTransportRequest,
  CreateTicketsTransportBatchRequest,
  UtiliserTicketTransportRequest,
  AnnulerTicketTransportRequest,
  BatchCreateResult,
  TicketTransportStatistics
} from '@/services/api/transportTicketService';
import toast from 'react-hot-toast';

export const useTransportTickets = (initialFilters?: TicketTransportFilters) => {
  const [tickets, setTickets] = useState<TicketTransport[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<TicketTransportFilters>(initialFilters || {});

  /**
   * Charger les tickets
   */
  const fetchTickets = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await transportTicketService.getTickets(filters);
      setTickets(result.data);
      setTotal(result.total);
    } catch (err: any) {
      const errorMsg = err?.response?.data?.error || 'Erreur lors du chargement des tickets';
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  /**
   * Créer un ticket individuel
   */
  const createTicket = async (data: CreateTicketTransportRequest): Promise<TicketTransport | null> => {
    try {
      const ticket = await transportTicketService.createTicket(data);
      toast.success('Ticket créé avec succès');
      await fetchTickets();
      return ticket;
    } catch (err: any) {
      const errorMsg = err?.response?.data?.error || 'Erreur lors de la création du ticket';
      toast.error(errorMsg);
      throw err;
    }
  };

  /**
   * Créer un lot de tickets
   */
  const createTicketsBatch = async (data: CreateTicketsTransportBatchRequest): Promise<BatchCreateResult | null> => {
    try {
      const result = await transportTicketService.createTicketsBatch(data);
      toast.success(`${result.total} ticket(s) créé(s) avec succès`);
      await fetchTickets();
      return result;
    } catch (err: any) {
      const errorMsg = err?.response?.data?.error || 'Erreur lors de la création du lot de tickets';
      toast.error(errorMsg);
      throw err;
    }
  };

  /**
   * Utiliser/valider un ticket
   */
  const utiliserTicket = async (
    ticketId: string,
    data: UtiliserTicketTransportRequest
  ): Promise<TicketTransport | null> => {
    try {
      const ticket = await transportTicketService.utiliserTicket(ticketId, data);
      toast.success('Ticket validé avec succès');
      await fetchTickets();
      return ticket;
    } catch (err: any) {
      const errorMsg = err?.response?.data?.error || 'Erreur lors de la validation du ticket';
      toast.error(errorMsg);
      throw err;
    }
  };

  /**
   * Annuler un ticket
   */
  const annulerTicket = async (
    ticketId: string,
    data: AnnulerTicketTransportRequest
  ): Promise<TicketTransport | null> => {
    try {
      const ticket = await transportTicketService.annulerTicket(ticketId, data);
      toast.success('Ticket annulé avec succès');
      await fetchTickets();
      return ticket;
    } catch (err: any) {
      const errorMsg = err?.response?.data?.error || 'Erreur lors de l\'annulation du ticket';
      toast.error(errorMsg);
      throw err;
    }
  };

  /**
   * Rechercher un ticket par numéro
   */
  const searchByNumero = async (numeroTicket: string): Promise<TicketTransport | null> => {
    try {
      const ticket = await transportTicketService.getTicketByNumero(numeroTicket);
      return ticket;
    } catch (err: any) {
      const errorMsg = err?.response?.data?.error || 'Ticket non trouvé';
      toast.error(errorMsg);
      return null;
    }
  };

  /**
   * Rechercher un ticket par QR code
   */
  const searchByQRCode = async (qrCode: string): Promise<TicketTransport | null> => {
    try {
      const ticket = await transportTicketService.getTicketByQRCode(qrCode);
      return ticket;
    } catch (err: any) {
      const errorMsg = err?.response?.data?.error || 'Ticket non trouvé';
      toast.error(errorMsg);
      return null;
    }
  };

  /**
   * Vérifier la validité d'un ticket
   */
  const verifierValidite = async (ticketId: string) => {
    try {
      return await transportTicketService.verifierValidite(ticketId);
    } catch (err: any) {
      const errorMsg = err?.response?.data?.error || 'Erreur lors de la vérification';
      toast.error(errorMsg);
      return { valide: false, raison: errorMsg };
    }
  };

  /**
   * Télécharger le PDF d'un ticket
   */
  const downloadTicketPDF = async (ticketId: string) => {
    try {
      const blob = await transportTicketService.downloadTicketPDF(ticketId);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `ticket-transport-${ticketId}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast.success('PDF téléchargé avec succès');
    } catch (err: any) {
      const errorMsg = err?.response?.data?.error || 'Erreur lors du téléchargement';
      toast.error(errorMsg);
    }
  };

  /**
   * Exporter les tickets
   */
  const exportTickets = async (format: 'csv' | 'excel' = 'csv') => {
    try {
      const blob = await transportTicketService.exportTickets(filters, format);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `tickets-transport-${Date.now()}.${format === 'csv' ? 'csv' : 'xlsx'}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast.success('Export réussi');
    } catch (err: any) {
      const errorMsg = err?.response?.data?.error || 'Erreur lors de l\'export';
      toast.error(errorMsg);
    }
  };

  /**
   * Rafraîchir les données
   */
  const refresh = useCallback(() => {
    fetchTickets();
  }, [fetchTickets]);

  // Charger les tickets au montage et quand les filtres changent
  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  return {
    tickets,
    total,
    loading,
    error,
    filters,
    setFilters,
    createTicket,
    createTicketsBatch,
    utiliserTicket,
    annulerTicket,
    searchByNumero,
    searchByQRCode,
    verifierValidite,
    downloadTicketPDF,
    exportTickets,
    refresh
  };
};

/**
 * Hook pour les statistiques des tickets transport
 */
export const useTransportTicketStatistics = (filters?: { annee?: number; mois?: number }) => {
  const [statistics, setStatistics] = useState<TicketTransportStatistics | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStatistics = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const stats = await transportTicketService.getStatistics(filters);
      setStatistics(stats);
    } catch (err: any) {
      const errorMsg = err?.response?.data?.error || 'Erreur lors du chargement des statistiques';
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchStatistics();
  }, [fetchStatistics]);

  return {
    statistics,
    loading,
    error,
    refresh: fetchStatistics
  };
};

export default useTransportTickets;

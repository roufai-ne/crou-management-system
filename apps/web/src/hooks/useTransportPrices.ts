/**
 * FICHIER: apps/web/src/hooks/useTransportPrices.ts
 * HOOK: useTransportPrices - Hook pour la gestion des tarifs transport
 *
 * DESCRIPTION:
 * Hook React personnalisé pour gérer les tarifs de tickets transport
 * Gère le state, les appels API et les erreurs
 *
 * AUTEUR: Équipe CROU - Module Transport
 * DATE: Janvier 2025
 */

import { useState, useEffect, useCallback } from 'react';
import {
  transportPriceService,
  TransportTicketPrice,
  CreatePriceRequest,
  UpdatePriceRequest,
  PriceStatistics
} from '@/services/api/transportPriceService';
import toast from 'react-hot-toast';

export const useTransportPrices = (autoLoad = true) => {
  const [prices, setPrices] = useState<TransportTicketPrice[]>([]);
  const [activePrices, setActivePrices] = useState<TransportTicketPrice[]>([]);
  const [defaultPrice, setDefaultPrice] = useState<TransportTicketPrice | null>(null);
  const [statistics, setStatistics] = useState<PriceStatistics | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Charger tous les tarifs
   */
  const loadPrices = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await transportPriceService.getAllPrices();
      setPrices(data);
    } catch (err: any) {
      const message = err.response?.data?.message || 'Erreur lors du chargement des tarifs';
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Charger les tarifs actifs uniquement
   */
  const loadActivePrices = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await transportPriceService.getActivePrices();
      setActivePrices(data);
    } catch (err: any) {
      const message = err.response?.data?.message || 'Erreur lors du chargement des tarifs actifs';
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Charger le tarif par défaut
   */
  const loadDefaultPrice = useCallback(async () => {
    try {
      const data = await transportPriceService.getDefaultPrice();
      setDefaultPrice(data);
    } catch (err: any) {
      console.error('Erreur chargement tarif défaut:', err);
    }
  }, []);

  /**
   * Charger les statistiques
   */
  const loadStatistics = useCallback(async () => {
    try {
      const data = await transportPriceService.getStatistics();
      setStatistics(data);
    } catch (err: any) {
      console.error('Erreur chargement statistiques:', err);
    }
  }, []);

  /**
   * Créer un nouveau tarif
   */
  const createPrice = useCallback(async (data: CreatePriceRequest) => {
    try {
      setLoading(true);
      const newPrice = await transportPriceService.createPrice(data);
      toast.success('Tarif créé avec succès');
      await loadPrices();
      await loadActivePrices();
      return newPrice;
    } catch (err: any) {
      const message = err.response?.data?.message || 'Erreur lors de la création du tarif';
      toast.error(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [loadPrices, loadActivePrices]);

  /**
   * Mettre à jour un tarif
   */
  const updatePrice = useCallback(async (id: string, data: UpdatePriceRequest) => {
    try {
      setLoading(true);
      const updatedPrice = await transportPriceService.updatePrice(id, data);
      toast.success('Tarif mis à jour avec succès');
      await loadPrices();
      await loadActivePrices();
      return updatedPrice;
    } catch (err: any) {
      const message = err.response?.data?.message || 'Erreur lors de la mise à jour du tarif';
      toast.error(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [loadPrices, loadActivePrices]);

  /**
   * Définir un tarif comme défaut
   */
  const setAsDefault = useCallback(async (id: string) => {
    try {
      setLoading(true);
      await transportPriceService.setAsDefault(id);
      toast.success('Tarif défini par défaut');
      await loadPrices();
      await loadDefaultPrice();
    } catch (err: any) {
      const message = err.response?.data?.message || 'Erreur lors de la définition du tarif par défaut';
      toast.error(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [loadPrices, loadDefaultPrice]);

  /**
   * Activer un tarif
   */
  const activatePrice = useCallback(async (id: string) => {
    try {
      setLoading(true);
      await transportPriceService.activatePrice(id);
      toast.success('Tarif activé');
      await loadPrices();
      await loadActivePrices();
    } catch (err: any) {
      const message = err.response?.data?.message || 'Erreur lors de l\'activation du tarif';
      toast.error(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [loadPrices, loadActivePrices]);

  /**
   * Désactiver un tarif
   */
  const deactivatePrice = useCallback(async (id: string) => {
    try {
      setLoading(true);
      await transportPriceService.deactivatePrice(id);
      toast.success('Tarif désactivé');
      await loadPrices();
      await loadActivePrices();
    } catch (err: any) {
      const message = err.response?.data?.message || 'Erreur lors de la désactivation du tarif';
      toast.error(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [loadPrices, loadActivePrices]);

  /**
   * Supprimer un tarif
   */
  const deletePrice = useCallback(async (id: string) => {
    try {
      setLoading(true);
      await transportPriceService.deletePrice(id);
      toast.success('Tarif supprimé');
      await loadPrices();
      await loadActivePrices();
    } catch (err: any) {
      const message = err.response?.data?.message || 'Erreur lors de la suppression du tarif';
      toast.error(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [loadPrices, loadActivePrices]);

  /**
   * Rafraîchir toutes les données
   */
  const refresh = useCallback(async () => {
    await Promise.all([
      loadPrices(),
      loadActivePrices(),
      loadDefaultPrice(),
      loadStatistics()
    ]);
  }, [loadPrices, loadActivePrices, loadDefaultPrice, loadStatistics]);

  // Chargement initial
  useEffect(() => {
    if (autoLoad) {
      refresh();
    }
  }, [autoLoad, refresh]);

  return {
    prices,
    activePrices,
    defaultPrice,
    statistics,
    loading,
    error,
    loadPrices,
    loadActivePrices,
    loadDefaultPrice,
    loadStatistics,
    createPrice,
    updatePrice,
    setAsDefault,
    activatePrice,
    deactivatePrice,
    deletePrice,
    refresh
  };
};

export default useTransportPrices;

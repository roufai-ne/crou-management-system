/**
 * FICHIER: apps/web/src/hooks/useBeds.ts
 * HOOK: Gestion des lits (Beds)
 *
 * DESCRIPTION:
 * Hook React pour gérer l'état et les opérations sur les lits
 * Fournit les méthodes CRUD, filtres, et gestion des statuts
 *
 * FONCTIONNALITÉS:
 * - Chargement des lits (global, par chambre, par complexe)
 * - Création et modification de lits
 * - Changement de statut (maintenance, disponible, hors service)
 * - Auto-génération de lits pour une chambre
 * - Statistiques temps réel
 * - Gestion du cache et rechargement
 *
 * AUTEUR: Équipe CROU
 * DATE: Janvier 2025
 */

import { useState, useEffect, useCallback } from 'react';
import { bedService, Bed, BedStatus, BedFilters, BedStats, CreateBedDTO, UpdateBedDTO } from '@/services/api/bedService';
import { useAuth } from '@/stores/auth';

export interface UseBedsResult {
  // État
  beds: Bed[];
  stats: BedStats | null;
  loading: boolean;
  error: string | null;

  // Pagination
  total: number;
  page: number;
  limit: number;

  // Actions CRUD
  loadBeds: (filters?: BedFilters) => Promise<void>;
  loadBedsByRoom: (roomId: string) => Promise<void>;
  loadBedsByComplex: (complexId: string) => Promise<void>;
  createBed: (data: CreateBedDTO) => Promise<Bed | null>;
  updateBed: (id: string, data: UpdateBedDTO) => Promise<Bed | null>;
  deleteBed: (id: string) => Promise<boolean>;

  // Actions spécifiques
  generateBedsForRoom: (roomId: string, capacity: number) => Promise<Bed[] | null>;
  setMaintenance: (id: string, notes?: string) => Promise<Bed | null>;
  setAvailable: (id: string) => Promise<Bed | null>;
  setOutOfService: (id: string, reason?: string) => Promise<Bed | null>;

  // Statistiques
  loadGlobalStats: () => Promise<void>;
  loadStatsByComplex: (complexId: string) => Promise<void>;
  loadStatsByRoom: (roomId: string) => Promise<void>;

  // Utilitaires
  refresh: () => Promise<void>;
  setPage: (page: number) => void;
  setLimit: (limit: number) => void;
}

export function useBeds(initialFilters?: BedFilters): UseBedsResult {
  const { user } = useAuth();

  // État
  const [beds, setBeds] = useState<Bed[]>([]);
  const [stats, setStats] = useState<BedStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Pagination
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(initialFilters?.page || 1);
  const [limit, setLimit] = useState(initialFilters?.limit || 20);

  // Filtres actuels
  const [currentFilters, setCurrentFilters] = useState<BedFilters | undefined>(initialFilters);

  /**
   * Charger les lits avec filtres
   */
  const loadBeds = useCallback(async (filters?: BedFilters) => {
    setLoading(true);
    setError(null);

    try {
      const filterParams = { ...filters, page, limit };
      setCurrentFilters(filterParams);

      const response = await bedService.getAll(filterParams);
      setBeds(response.data);
      setTotal(response.total);
    } catch (err: any) {
      setError(err.message || 'Erreur lors du chargement des lits');
      console.error('Error loading beds:', err);
    } finally {
      setLoading(false);
    }
  }, [page, limit]);

  /**
   * Charger les lits d'une chambre
   */
  const loadBedsByRoom = useCallback(async (roomId: string) => {
    setLoading(true);
    setError(null);

    try {
      const bedsData = await bedService.getByRoom(roomId);
      setBeds(bedsData);
      setTotal(bedsData.length);
    } catch (err: any) {
      setError(err.message || 'Erreur lors du chargement des lits de la chambre');
      console.error('Error loading room beds:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Charger les lits d'un complexe
   */
  const loadBedsByComplex = useCallback(async (complexId: string) => {
    setLoading(true);
    setError(null);

    try {
      const bedsData = await bedService.getByComplex(complexId);
      setBeds(bedsData);
      setTotal(bedsData.length);
    } catch (err: any) {
      setError(err.message || 'Erreur lors du chargement des lits du complexe');
      console.error('Error loading complex beds:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Créer un nouveau lit
   */
  const createBed = useCallback(async (data: CreateBedDTO): Promise<Bed | null> => {
    setLoading(true);
    setError(null);

    try {
      const newBed = await bedService.create({
        ...data,
        createdBy: user?.id || 'system'
      });

      // Rafraîchir la liste
      await refresh();

      return newBed;
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la création du lit');
      console.error('Error creating bed:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, [user]);

  /**
   * Modifier un lit
   */
  const updateBed = useCallback(async (id: string, data: UpdateBedDTO): Promise<Bed | null> => {
    setLoading(true);
    setError(null);

    try {
      const updatedBed = await bedService.update(id, {
        ...data,
        updatedBy: user?.id || 'system'
      });

      // Mettre à jour localement
      setBeds(prevBeds =>
        prevBeds.map(bed => bed.id === id ? updatedBed : bed)
      );

      return updatedBed;
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la modification du lit');
      console.error('Error updating bed:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, [user]);

  /**
   * Supprimer un lit
   */
  const deleteBed = useCallback(async (id: string): Promise<boolean> => {
    setLoading(true);
    setError(null);

    try {
      await bedService.delete(id);

      // Retirer localement
      setBeds(prevBeds => prevBeds.filter(bed => bed.id !== id));
      setTotal(prev => prev - 1);

      return true;
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la suppression du lit');
      console.error('Error deleting bed:', err);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Générer automatiquement des lits pour une chambre
   */
  const generateBedsForRoom = useCallback(async (roomId: string, capacity: number): Promise<Bed[] | null> => {
    setLoading(true);
    setError(null);

    try {
      const generatedBeds = await bedService.generateForRoom(roomId, capacity);

      // Rafraîchir la liste
      await refresh();

      return generatedBeds;
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la génération des lits');
      console.error('Error generating beds:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Mettre un lit en maintenance
   */
  const setMaintenance = useCallback(async (id: string, notes?: string): Promise<Bed | null> => {
    setLoading(true);
    setError(null);

    try {
      const updatedBed = await bedService.setMaintenance(id, notes);

      // Mettre à jour localement
      setBeds(prevBeds =>
        prevBeds.map(bed => bed.id === id ? updatedBed : bed)
      );

      return updatedBed;
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la mise en maintenance');
      console.error('Error setting maintenance:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Rendre un lit disponible
   */
  const setAvailable = useCallback(async (id: string): Promise<Bed | null> => {
    setLoading(true);
    setError(null);

    try {
      const updatedBed = await bedService.setAvailable(id);

      // Mettre à jour localement
      setBeds(prevBeds =>
        prevBeds.map(bed => bed.id === id ? updatedBed : bed)
      );

      return updatedBed;
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la mise à disposition');
      console.error('Error setting available:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Mettre un lit hors service
   */
  const setOutOfService = useCallback(async (id: string, reason?: string): Promise<Bed | null> => {
    setLoading(true);
    setError(null);

    try {
      const updatedBed = await bedService.setOutOfService(id, reason);

      // Mettre à jour localement
      setBeds(prevBeds =>
        prevBeds.map(bed => bed.id === id ? updatedBed : bed)
      );

      return updatedBed;
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la mise hors service');
      console.error('Error setting out of service:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Charger les statistiques globales
   */
  const loadGlobalStats = useCallback(async () => {
    try {
      const statsData = await bedService.getGlobalStats();
      setStats(statsData);
    } catch (err: any) {
      console.error('Error loading global stats:', err);
    }
  }, []);

  /**
   * Charger les statistiques par complexe
   */
  const loadStatsByComplex = useCallback(async (complexId: string) => {
    try {
      const statsData = await bedService.getStatsByComplex(complexId);
      setStats(statsData);
    } catch (err: any) {
      console.error('Error loading complex stats:', err);
    }
  }, []);

  /**
   * Charger les statistiques par chambre
   */
  const loadStatsByRoom = useCallback(async (roomId: string) => {
    try {
      const statsData = await bedService.getStatsByRoom(roomId);
      setStats(statsData);
    } catch (err: any) {
      console.error('Error loading room stats:', err);
    }
  }, []);

  /**
   * Rafraîchir les données
   */
  const refresh = useCallback(async () => {
    if (currentFilters) {
      await loadBeds(currentFilters);
    }
  }, [currentFilters, loadBeds]);

  // Charger les lits au montage
  useEffect(() => {
    if (initialFilters) {
      loadBeds(initialFilters);
    }
  }, []);

  return {
    // État
    beds,
    stats,
    loading,
    error,

    // Pagination
    total,
    page,
    limit,

    // Actions CRUD
    loadBeds,
    loadBedsByRoom,
    loadBedsByComplex,
    createBed,
    updateBed,
    deleteBed,

    // Actions spécifiques
    generateBedsForRoom,
    setMaintenance,
    setAvailable,
    setOutOfService,

    // Statistiques
    loadGlobalStats,
    loadStatsByComplex,
    loadStatsByRoom,

    // Utilitaires
    refresh,
    setPage,
    setLimit
  };
}

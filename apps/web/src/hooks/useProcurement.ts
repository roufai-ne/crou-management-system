import { useState, useEffect, useCallback } from 'react';
import { procurementService, type PurchaseOrder, type PurchaseOrderFilters } from '@/services/api/procurementService';

export const useProcurement = () => {
  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchOrders = useCallback(async (filters?: PurchaseOrderFilters) => {
    setLoading(true);
    setError(null);
    try {
      const response = await procurementService.getPurchaseOrders(filters);
      setOrders(response.data.orders);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors du chargement des bons de commande');
      console.error('Error fetching purchase orders:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const createOrder = useCallback(async (data: any) => {
    setLoading(true);
    setError(null);
    try {
      const response = await procurementService.createPurchaseOrder(data);
      const newOrder = response.data.order;
      setOrders(prev => [newOrder, ...prev]);
      return newOrder;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la création du bon de commande');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const submitOrder = useCallback(async (orderId: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await procurementService.submitPurchaseOrder(orderId);
      const updatedOrder = response.data.order;
      setOrders(prev => prev.map(o => o.id === orderId ? updatedOrder : o));
      return updatedOrder;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la soumission');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const approveOrder = useCallback(async (orderId: string, comment?: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await procurementService.approvePurchaseOrder(orderId, comment);
      const updatedOrder = response.data.order;
      setOrders(prev => prev.map(o => o.id === orderId ? updatedOrder : o));
      return updatedOrder;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de l\'approbation');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const markAsOrdered = useCallback(async (orderId: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await procurementService.markAsOrdered(orderId);
      const updatedOrder = response.data.order;
      setOrders(prev => prev.map(o => o.id === orderId ? updatedOrder : o));
      return updatedOrder;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors du marquage commandé');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const receiveOrder = useCallback(async (orderId: string, data: any) => {
    setLoading(true);
    setError(null);
    try {
      const response = await procurementService.receivePurchaseOrder(orderId, data);
      const updatedOrder = response.data.order;
      setOrders(prev => prev.map(o => o.id === orderId ? updatedOrder : o));
      return updatedOrder;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la réception');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const cancelOrder = useCallback(async (orderId: string, reason?: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await procurementService.cancelPurchaseOrder(orderId, reason || 'Annulation');
      const updatedOrder = response.data.order;
      setOrders(prev => prev.map(o => o.id === orderId ? updatedOrder : o));
      return updatedOrder;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de l\'annulation');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  return {
    orders,
    loading,
    error,
    fetchOrders,
    createOrder,
    submitOrder,
    approveOrder,
    markAsOrdered,
    receiveOrder,
    cancelOrder,
  };
};

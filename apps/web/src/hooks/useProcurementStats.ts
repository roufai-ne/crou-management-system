import { useState, useEffect } from 'react';
import { procurementService, type PurchaseOrder } from '@/services/api/procurementService';

export interface ProcurementStats {
  totalOrders: number;
  pendingOrders: number;
  approvedOrders: number;
  totalEngaged: number;
  awaitingReception: number;
  receptionRate: number;
  averageProcessingTime: number;
  ordersThisMonth: number;
  ordersLastMonth: number;
  trend: 'up' | 'down' | 'stable';
}

export const useProcurementStats = () => {
  const [stats, setStats] = useState<ProcurementStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      setError(null);
      try {
        // Récupérer tous les BCs pour calculer les stats
        const response = await procurementService.getPurchaseOrders();
        const orders = response.data.orders;
        
        const now = new Date();
        const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

        // Calculs des statistiques
        const totalOrders = orders.length;
        const pendingOrders = orders.filter((o: PurchaseOrder) => o.status === 'SUBMITTED').length;
        const approvedOrders = orders.filter((o: PurchaseOrder) => o.status === 'APPROVED' || o.status === 'ORDERED').length;
        const totalEngaged = orders
          .filter((o: PurchaseOrder) => ['APPROVED', 'ORDERED', 'PARTIALLY_RECEIVED', 'FULLY_RECEIVED'].includes(o.status))
          .reduce((sum: number, o: PurchaseOrder) => sum + (o.montantTTC || 0), 0);
        
        const awaitingReception = orders.filter((o: PurchaseOrder) => 
          o.status === 'ORDERED' || o.status === 'PARTIALLY_RECEIVED'
        ).length;
        
        const receivedOrders = orders.filter((o: PurchaseOrder) => 
          o.status === 'FULLY_RECEIVED' || o.status === 'CLOSED'
        ).length;
        const receptionRate = totalOrders > 0 ? (receivedOrders / totalOrders) * 100 : 0;

        // Calcul du temps moyen de traitement (en jours)
        const processedOrders = orders.filter((o: PurchaseOrder) => 
          o.dateApprobation && o.createdAt
        );
        const averageProcessingTime = processedOrders.length > 0
          ? processedOrders.reduce((sum: number, o: PurchaseOrder) => {
              const created = new Date(o.createdAt);
              const approved = new Date(o.dateApprobation!);
              const days = Math.floor((approved.getTime() - created.getTime()) / (1000 * 60 * 60 * 24));
              return sum + days;
            }, 0) / processedOrders.length
          : 0;

        // Tendance mensuelle
        const ordersThisMonth = orders.filter((o: PurchaseOrder) => {
          const created = new Date(o.createdAt);
          return created >= thisMonthStart;
        }).length;

        const ordersLastMonth = orders.filter((o: PurchaseOrder) => {
          const created = new Date(o.createdAt);
          return created >= lastMonthStart && created <= lastMonthEnd;
        }).length;

        let trend: 'up' | 'down' | 'stable' = 'stable';
        if (ordersThisMonth > ordersLastMonth) {
          trend = 'up';
        } else if (ordersThisMonth < ordersLastMonth) {
          trend = 'down';
        }

        setStats({
          totalOrders,
          pendingOrders,
          approvedOrders,
          totalEngaged,
          awaitingReception,
          receptionRate,
          averageProcessingTime,
          ordersThisMonth,
          ordersLastMonth,
          trend,
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erreur lors du chargement des statistiques');
        console.error('Error fetching procurement stats:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  return { stats, loading, error };
};

import { useState, useCallback } from 'react';
import type { PurchaseOrderStatus } from '@/types/procurement';

export interface PurchaseOrderFilters {
  status?: PurchaseOrderStatus[];
  supplierId?: string;
  budgetId?: string;
  dateRange?: {
    start: string;
    end: string;
  };
  amountRange?: {
    min: number;
    max: number;
  };
  search?: string;
}

export const useProcurementFilters = () => {
  const [filters, setFilters] = useState<PurchaseOrderFilters>({});

  const updateFilter = useCallback(<K extends keyof PurchaseOrderFilters>(
    key: K,
    value: PurchaseOrderFilters[K]
  ) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  }, []);

  const clearFilter = useCallback((key: keyof PurchaseOrderFilters) => {
    setFilters(prev => {
      const newFilters = { ...prev };
      delete newFilters[key];
      return newFilters;
    });
  }, []);

  const clearAllFilters = useCallback(() => {
    setFilters({});
  }, []);

  const hasActiveFilters = Object.keys(filters).length > 0;

  return {
    filters,
    updateFilter,
    clearFilter,
    clearAllFilters,
    hasActiveFilters
  };
};

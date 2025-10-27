import { useState, useEffect } from 'react';

export interface UseApiOptions {
  immediate?: boolean;
}

export interface UseApiResult<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  execute: () => Promise<void>;
}

export const useApi = <T = any>(
  apiCall: () => Promise<T>,
  options: UseApiOptions = {}
): UseApiResult<T> => {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const execute = async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await apiCall();
      setData(result);
    } catch (err: any) {
      setError(err.message || 'Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (options.immediate) {
      execute();
    }
  }, []);

  return { data, loading, error, execute };
};

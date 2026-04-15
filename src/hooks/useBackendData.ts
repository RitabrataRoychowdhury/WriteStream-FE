// Generic hook that tries real API and falls back to mock data on failure
import { useState, useEffect, useCallback, useRef } from 'react';

interface UseBackendDataOptions<T> {
  fetchFn: () => Promise<T>;
  mockFn: () => T;
  intervalMs?: number;
}

export function useBackendData<T>({ fetchFn, mockFn, intervalMs = 3000 }: UseBackendDataOptions<T>) {
  const [data, setData] = useState<T>(() => mockFn());
  const [isLive, setIsLive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const failCount = useRef(0);

  const refresh = useCallback(async () => {
    try {
      const result = await fetchFn();
      setData(result);
      setIsLive(true);
      setError(null);
      failCount.current = 0;
    } catch (err) {
      failCount.current++;
      // After 2 consecutive failures, switch to mock and slow down retries
      if (failCount.current >= 2) {
        setIsLive(false);
        setData(mockFn());
      }
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  }, [fetchFn, mockFn]);

  useEffect(() => {
    refresh();
    const id = setInterval(refresh, intervalMs);
    return () => clearInterval(id);
  }, [refresh, intervalMs]);

  return { data, isLive, error, refresh };
}

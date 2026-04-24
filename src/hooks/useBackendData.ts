// Generic hook that tries real API and falls back to mock data on failure
import { useState, useEffect, useCallback, useRef } from 'react';

interface UseBackendDataOptions<T> {
  fetchFn: () => Promise<T>;
  mockFn: () => T;
  intervalMs?: number;
  /** Once we've fallen back to mock, slow down retries to this many ms. */
  fallbackIntervalMs?: number;
}

export function useBackendData<T>({ fetchFn, mockFn, intervalMs = 3000, fallbackIntervalMs = 30_000 }: UseBackendDataOptions<T>) {
  const [data, setData] = useState<T>(() => mockFn());
  const [isLive, setIsLive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const failCount = useRef(0);
  const liveRef = useRef(false);

  const refresh = useCallback(async () => {
    try {
      const result = await fetchFn();
      setData(result);
      setIsLive(true);
      liveRef.current = true;
      setError(null);
      failCount.current = 0;
    } catch (err) {
      failCount.current++;
      // After 2 consecutive failures, switch to mock and slow down retries
      if (failCount.current >= 2) {
        setIsLive(false);
        liveRef.current = false;
        setData(mockFn());
      }
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  }, [fetchFn, mockFn]);

  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout>;

    const tick = async () => {
      if (cancelled) return;
      await refresh();
      if (cancelled) return;
      const next = liveRef.current ? intervalMs : fallbackIntervalMs;
      timer = setTimeout(tick, next);
    };

    tick();
    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [refresh, intervalMs, fallbackIntervalMs]);

  return { data, isLive, error, refresh };
}

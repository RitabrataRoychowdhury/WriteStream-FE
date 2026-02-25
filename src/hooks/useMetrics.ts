import { useState, useEffect, useCallback } from 'react';
import { generateMockMetrics, type SystemMetrics } from '@/mocks/mockData';

export function useMetrics(intervalMs = 2000) {
  const [metrics, setMetrics] = useState<SystemMetrics>(() => generateMockMetrics());

  useEffect(() => {
    const id = setInterval(() => {
      setMetrics(generateMockMetrics());
    }, intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);

  const refresh = useCallback(() => {
    setMetrics(generateMockMetrics());
  }, []);

  return { metrics, refresh };
}

import { useState, useEffect, useCallback } from 'react';
import { listSinks, enableSink, disableSink, type SinkInfo } from '@/api/services';

export function useSinks(intervalMs = 5000) {
  const [sinks, setSinks] = useState<SinkInfo[]>([]);
  const [isLive, setIsLive] = useState(false);

  const refresh = useCallback(async () => {
    try {
      const res = await listSinks();
      if (res.ok) {
        setSinks(res.data.sinks);
        setIsLive(true);
      }
    } catch {
      setIsLive(false);
    }
  }, []);

  useEffect(() => {
    refresh();
    const id = setInterval(refresh, intervalMs);
    return () => clearInterval(id);
  }, [refresh, intervalMs]);

  const toggle = useCallback(async (name: string, enabled: boolean) => {
    try {
      if (enabled) {
        await enableSink(name);
      } else {
        await disableSink(name);
      }
      await refresh();
    } catch (err) {
      console.error('Failed to toggle sink:', err);
    }
  }, [refresh]);

  return { sinks, isLive, refresh, toggle };
}

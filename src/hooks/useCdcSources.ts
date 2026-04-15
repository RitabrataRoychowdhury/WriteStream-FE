import { useState, useEffect, useCallback } from 'react';
import {
  listCdcSources,
  startCdcSource,
  stopCdcSource,
  pauseCdcSource,
  resumeCdcSource,
  type CdcSource,
} from '@/api/services';

export function useCdcSources(intervalMs = 5000) {
  const [sources, setSources] = useState<CdcSource[]>([]);
  const [isLive, setIsLive] = useState(false);

  const refresh = useCallback(async () => {
    try {
      const res = await listCdcSources();
      if (res.ok) {
        setSources(res.data.sources);
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

  const action = useCallback(async (name: string, act: 'start' | 'stop' | 'pause' | 'resume') => {
    const fns = { start: startCdcSource, stop: stopCdcSource, pause: pauseCdcSource, resume: resumeCdcSource };
    try {
      await fns[act](name);
      await refresh();
    } catch (err) {
      console.error(`Failed to ${act} source:`, err);
    }
  }, [refresh]);

  return { sources, isLive, refresh, action };
}

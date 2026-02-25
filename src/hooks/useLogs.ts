import { useState, useEffect, useCallback, useRef } from 'react';
import { generateLogEntry, type LogEntry, type LogLevel } from '@/mocks/mockData';

export function useLogs(maxEntries = 200) {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [paused, setPaused] = useState(false);
  const pausedRef = useRef(paused);
  pausedRef.current = paused;

  useEffect(() => {
    // Generate initial batch
    const initial = Array.from({ length: 20 }, () => generateLogEntry());
    setLogs(initial);

    const id = setInterval(() => {
      if (!pausedRef.current) {
        setLogs(prev => {
          const newEntry = generateLogEntry();
          const updated = [...prev, newEntry];
          return updated.length > maxEntries ? updated.slice(-maxEntries) : updated;
        });
      }
    }, 500);
    return () => clearInterval(id);
  }, [maxEntries]);

  const clear = useCallback(() => setLogs([]), []);
  const toggle = useCallback(() => setPaused(p => !p), []);

  return { logs, paused, toggle, clear };
}

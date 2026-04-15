import { useState, useEffect, useRef, useCallback } from 'react';
import { createViewWebSocket } from '@/api/client';

interface UseViewWebSocketOptions {
  viewName: string;
  key: string | number;
  enabled?: boolean;
}

export function useViewWebSocket({ viewName, key, enabled = true }: UseViewWebSocketOptions) {
  const [messages, setMessages] = useState<Record<string, unknown>[]>([]);
  const [connected, setConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);

  const disconnect = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
      setConnected(false);
    }
  }, []);

  useEffect(() => {
    if (!enabled || !viewName) return;

    try {
      const ws = createViewWebSocket(viewName, key);
      wsRef.current = ws;

      ws.onopen = () => setConnected(true);
      ws.onclose = () => setConnected(false);
      ws.onerror = () => setConnected(false);
      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          setMessages(prev => [...prev.slice(-99), data]);
        } catch {
          // ignore non-JSON messages
        }
      };

      return () => {
        ws.close();
        wsRef.current = null;
      };
    } catch {
      setConnected(false);
    }
  }, [viewName, key, enabled]);

  const clear = useCallback(() => setMessages([]), []);

  return { messages, connected, disconnect, clear };
}

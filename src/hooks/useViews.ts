import { useState, useEffect, useCallback } from 'react';
import {
  listViews,
  createView,
  deleteView,
  snapshotView,
  type ViewInfo,
  type CreateViewPayload,
} from '@/api/services';

export function useViews(intervalMs = 5000) {
  const [views, setViews] = useState<ViewInfo[]>([]);
  const [isLive, setIsLive] = useState(false);

  const refresh = useCallback(async () => {
    try {
      const res = await listViews();
      if (res.ok) {
        setViews(res.data.views);
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

  const create = useCallback(async (payload: CreateViewPayload) => {
    try {
      await createView(payload);
      await refresh();
      return true;
    } catch {
      return false;
    }
  }, [refresh]);

  const remove = useCallback(async (name: string) => {
    try {
      await deleteView(name);
      await refresh();
      return true;
    } catch {
      return false;
    }
  }, [refresh]);

  const snapshot = useCallback(async (name: string) => {
    try {
      const res = await snapshotView(name);
      return res.ok ? res.data.message : null;
    } catch {
      return null;
    }
  }, []);

  return { views, isLive, refresh, create, remove, snapshot };
}

// Hook that integrates real Prometheus + admin API metrics with mock fallback
import { useState, useEffect, useCallback, useRef } from 'react';
import { fetchParsedMetrics, listSinks, listViews, listCdcSources } from '@/api/services';
import type { SinkInfo, ViewInfo, CdcSource, ParsedMetrics } from '@/api/services';
import { generateMockMetrics, type SystemMetrics } from '@/mocks/mockData';

export interface LiveDashboardData {
  // From Prometheus
  prometheus: ParsedMetrics | null;
  // From admin API
  sinks: SinkInfo[];
  views: ViewInfo[];
  cdcSources: CdcSource[];
  // Computed TPS history (deltas between polls)
  tpsHistory: { time: string; tps: number }[];
  // Connection status
  isLive: boolean;
  // Mock fallback
  mockMetrics: SystemMetrics;
}

export function useLiveMetrics(intervalMs = 3000) {
  const [state, setState] = useState<LiveDashboardData>({
    prometheus: null,
    sinks: [],
    views: [],
    cdcSources: [],
    tpsHistory: [],
    isLive: false,
    mockMetrics: generateMockMetrics(),
  });

  const prevIngested = useRef<number | null>(null);
  const failCount = useRef(0);

  const poll = useCallback(async () => {
    try {
      const [promResult, sinksResult, viewsResult, cdcResult] = await Promise.all([
        fetchParsedMetrics(),
        listSinks(),
        listViews(),
        listCdcSources(),
      ]);

      const now = new Date().toLocaleTimeString();
      let tpsDelta = 0;
      if (prevIngested.current !== null) {
        tpsDelta = Math.max(0, (promResult.eventsIngested - prevIngested.current) / (intervalMs / 1000));
      }
      prevIngested.current = promResult.eventsIngested;

      setState(prev => ({
        prometheus: promResult,
        sinks: sinksResult.ok ? sinksResult.data.sinks : prev.sinks,
        views: viewsResult.ok ? viewsResult.data.views : prev.views,
        cdcSources: cdcResult.ok ? cdcResult.data.sources : prev.cdcSources,
        tpsHistory: [...prev.tpsHistory.slice(-29), { time: now, tps: tpsDelta }],
        isLive: true,
        mockMetrics: prev.mockMetrics,
      }));
      failCount.current = 0;
    } catch {
      failCount.current++;
      // Fall back to mock right away on first failure so the UI never shows
      // a misleading "Live" state with all-zero values.
      setState(prev => ({
        ...prev,
        isLive: false,
        mockMetrics: generateMockMetrics(),
      }));
    }
  }, [intervalMs]);

  useEffect(() => {
    poll();
    const id = setInterval(poll, intervalMs);
    return () => clearInterval(id);
  }, [poll, intervalMs]);

  return state;
}

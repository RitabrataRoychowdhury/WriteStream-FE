// Typed service functions for all WriteStream admin API endpoints

import { adminGet, adminPost, adminPut, adminDelete, postEvent, fetchPrometheusMetrics } from './client';
import { parsePrometheus, getMetricValue, getHistogramPercentile, type PrometheusMetric } from './prometheus';

// ─── Types ───────────────────────────────────────────────────

export interface SinkInfo {
  name: string;
  status: 'Enabled' | 'Disabled' | 'CircuitBroken';
  last_acknowledged_sequence: number;
  error_count: number;
}

export interface ViewInfo {
  name: string;
  entry_count: number;
  subscriber_count: number;
  memory_usage_bytes: number;
}

export interface ViewStats {
  name: string;
  entry_count: number;
  update_rate: number;
  subscriber_count: number;
  memory_usage_bytes: number;
}

export interface CdcSource {
  name: string;
  source_type: string;
  status: string;
  enabled: boolean;
  events_per_second: number;
  replication_lag_ms: number;
  total_events: number;
}

export interface CreateViewPayload {
  name: string;
  keys: string[];
  aggregations: { name: string; agg_type: string; field?: string }[];
  ttl_seconds: number;
  persist: boolean;
}

export interface ParsedMetrics {
  eventsIngested: number;
  walWrites: number;
  sinkEventsWritten: Record<string, number>;
  walWriteLatencyP99: number;
  walWriteLatencyP50: number;
  backpressureEvents: number;
  cdcEventsRead: Record<string, number>;
  raw: PrometheusMetric[];
}

// ─── Sinks ───────────────────────────────────────────────────

export const listSinks = () => adminGet<{ sinks: SinkInfo[] }>('/sinks');
export const enableSink = (name: string) => adminPost(`/sinks/${name}/enable`);
export const disableSink = (name: string) => adminPost(`/sinks/${name}/disable`);
export const getSinkStats = (name: string) => adminGet(`/sinks/${name}/stats`);

// ─── Views ───────────────────────────────────────────────────

export const listViews = () => adminGet<{ views: ViewInfo[] }>('/views');
export const getViewStats = (name: string) => adminGet<ViewStats>(`/views/${name}/stats`);
export const createView = (payload: CreateViewPayload) => adminPost('/views', payload);
export const updateView = (name: string, payload: CreateViewPayload) => adminPut(`/views/${name}`, payload);
export const deleteView = (name: string) => adminDelete(`/views/${name}`);
export const snapshotView = (name: string) =>
  adminPost<{ success: boolean; message: string }>(`/views/${name}/snapshot`);

// ─── CDC Sources ─────────────────────────────────────────────

export const listCdcSources = () => adminGet<{ sources: CdcSource[] }>('/cdc/sources');
export const getCdcSourceStatus = (name: string) => adminGet(`/cdc/sources/${name}/status`);
export const startCdcSource = (name: string) => adminPost(`/cdc/sources/${name}/start`);
export const stopCdcSource = (name: string) => adminPost(`/cdc/sources/${name}/stop`);
export const pauseCdcSource = (name: string) => adminPost(`/cdc/sources/${name}/pause`);
export const resumeCdcSource = (name: string) => adminPost(`/cdc/sources/${name}/resume`);

// ─── Events ──────────────────────────────────────────────────

export const ingestEvent = (key: string, payload: Record<string, unknown>) => postEvent(key, payload);

// ─── Health ──────────────────────────────────────────────────

export const checkHealth = () => adminGet<{ status: string }>('/../health');

// ─── Prometheus Metrics ──────────────────────────────────────

export async function fetchParsedMetrics(): Promise<ParsedMetrics> {
  const text = await fetchPrometheusMetrics();
  const raw = parsePrometheus(text);

  const sinkNames = ['postgres', 'clickhouse', 'mysql-sink'];
  const sinkEventsWritten: Record<string, number> = {};
  for (const sink of sinkNames) {
    sinkEventsWritten[sink] = getMetricValue(raw, 'writestream_sink_events_written_total', { sink });
  }

  const cdcEventsRead: Record<string, number> = {};
  const cdcMetrics = raw.filter(m => m.name === 'writestream_cdc_events_read_total');
  for (const m of cdcMetrics) {
    cdcEventsRead[m.labels.source || 'unknown'] = m.value;
  }

  return {
    eventsIngested: getMetricValue(raw, 'writestream_events_ingested_total'),
    walWrites: getMetricValue(raw, 'writestream_wal_writes_total'),
    sinkEventsWritten,
    walWriteLatencyP99: getHistogramPercentile(raw, 'writestream_wal_write_latency_seconds', 99) * 1000,
    walWriteLatencyP50: getHistogramPercentile(raw, 'writestream_wal_write_latency_seconds', 50) * 1000,
    backpressureEvents: getMetricValue(raw, 'writestream_backpressure_events_total'),
    cdcEventsRead,
    raw,
  };
}

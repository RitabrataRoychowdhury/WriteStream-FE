import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { loadGrafanaConfig, type GrafanaConfig } from '@/lib/grafanaConfig';

/**
 * Grafana Alertmanager v2 alert shape (subset).
 * https://grafana.com/docs/grafana/latest/developers/http_api/alerting_provisioning/
 */
export interface GrafanaAlert {
  id: string;
  fingerprint: string;
  status: 'firing' | 'resolved' | 'pending' | 'silenced';
  severity: 'critical' | 'warning' | 'info' | 'none';
  labels: Record<string, string>;
  annotations: Record<string, string>;
  startsAt: string;        // ISO
  updatedAt: string;       // ISO
  endsAt?: string;
  generatorURL?: string;
  receiver?: string;
  /** Title we render — usually labels.alertname or annotations.summary */
  title: string;
  /** Body — annotations.description or annotations.summary */
  description: string;
  /** Component category derived from labels (sink, wal, cdc, ...) */
  source: 'sink' | 'wal' | 'cdc' | 'view' | 'host' | 'pipeline' | 'unknown';
}

function severityFromLabels(labels: Record<string, string>): GrafanaAlert['severity'] {
  const raw = (labels.severity || labels.priority || '').toLowerCase();
  if (raw === 'critical' || raw === 'crit' || raw === 'page') return 'critical';
  if (raw === 'warning' || raw === 'warn')  return 'warning';
  if (raw === 'info' || raw === 'notice')   return 'info';
  return 'none';
}

function sourceFromLabels(labels: Record<string, string>): GrafanaAlert['source'] {
  const t = (labels.component || labels.subsystem || labels.service || '').toLowerCase();
  if (t.includes('sink')) return 'sink';
  if (t.includes('wal')) return 'wal';
  if (t.includes('cdc')) return 'cdc';
  if (t.includes('view')) return 'view';
  if (t.includes('host') || t.includes('node')) return 'host';
  if (t.includes('pipeline') || t.includes('ingest')) return 'pipeline';
  return 'unknown';
}

function normalizeAlert(raw: any, idx: number): GrafanaAlert {
  const labels = raw.labels || {};
  const annotations = raw.annotations || {};
  const status = (raw.status?.state || raw.state || 'firing').toLowerCase() as GrafanaAlert['status'];
  return {
    id: raw.fingerprint || `${labels.alertname || 'alert'}-${idx}`,
    fingerprint: raw.fingerprint || '',
    status,
    severity: severityFromLabels(labels),
    labels,
    annotations,
    startsAt: raw.startsAt || new Date().toISOString(),
    updatedAt: raw.updatedAt || raw.startsAt || new Date().toISOString(),
    endsAt: raw.endsAt,
    generatorURL: raw.generatorURL,
    receiver: raw.receivers?.[0]?.name,
    title: labels.alertname || annotations.summary || 'Untitled alert',
    description: annotations.description || annotations.summary || '',
    source: sourceFromLabels(labels),
  };
}

/* ─────────────── Mock fallback ─────────────── */

function nowMinus(min: number) {
  return new Date(Date.now() - min * 60_000).toISOString();
}

const MOCK_ALERTS: GrafanaAlert[] = [
  {
    id: 'mock-1', fingerprint: 'abc123',
    status: 'firing', severity: 'critical',
    labels: { alertname: 'SinkCircuitBreakerOpen', component: 'sink', sink: 'clickhouse-analytics', cluster: 'prod-eu' },
    annotations: {
      summary: 'ClickHouse sink circuit breaker is open',
      description: 'Sink "clickhouse-analytics" tripped its circuit breaker after 14 consecutive write failures. Backpressure is propagating to upstream shards.',
    },
    startsAt: nowMinus(7), updatedAt: nowMinus(1),
    title: 'SinkCircuitBreakerOpen',
    description: 'Sink "clickhouse-analytics" tripped its circuit breaker after 14 consecutive write failures. Backpressure is propagating to upstream shards.',
    source: 'sink',
    receiver: 'pagerduty-prod',
  },
  {
    id: 'mock-2', fingerprint: 'def456',
    status: 'firing', severity: 'warning',
    labels: { alertname: 'WalFsyncLatencyHigh', component: 'wal', sequencer: 'seq-03', cluster: 'prod-eu' },
    annotations: {
      summary: 'WAL fsync p99 above 25 ms',
      description: 'WAL fsync p99 latency on sequencer seq-03 has been above 25 ms for 6 minutes. Disk likely under contention.',
    },
    startsAt: nowMinus(12), updatedAt: nowMinus(2),
    title: 'WalFsyncLatencyHigh',
    description: 'WAL fsync p99 latency on sequencer seq-03 has been above 25 ms for 6 minutes. Disk likely under contention.',
    source: 'wal',
    receiver: 'slack-ops',
  },
  {
    id: 'mock-3', fingerprint: 'ghi789',
    status: 'firing', severity: 'warning',
    labels: { alertname: 'CdcReplicationLag', component: 'cdc', source: 'etl_postgres_cdc' },
    annotations: {
      summary: 'Postgres CDC replication lag > 30s',
      description: 'Source etl_postgres_cdc replication lag is 47.2s. Most recent commit_lsn is behind primary.',
    },
    startsAt: nowMinus(25), updatedAt: nowMinus(3),
    title: 'CdcReplicationLag',
    description: 'Source etl_postgres_cdc replication lag is 47.2s. Most recent commit_lsn is behind primary.',
    source: 'cdc',
    receiver: 'slack-data',
  },
  {
    id: 'mock-4', fingerprint: 'jkl012',
    status: 'silenced', severity: 'info',
    labels: { alertname: 'ReactiveViewMemoryGrowth', component: 'view', view: 'account_balances' },
    annotations: {
      summary: 'View memory usage trending up',
      description: 'Memory for view "account_balances" grew 18% in 1h. Likely benign — TTL eviction will catch up.',
    },
    startsAt: nowMinus(95), updatedAt: nowMinus(40),
    title: 'ReactiveViewMemoryGrowth',
    description: 'Memory for view "account_balances" grew 18% in 1h. Likely benign — TTL eviction will catch up.',
    source: 'view',
    receiver: 'email-team',
  },
  {
    id: 'mock-5', fingerprint: 'mno345',
    status: 'resolved', severity: 'critical',
    labels: { alertname: 'IngestionRateDropped', component: 'pipeline' },
    annotations: {
      summary: 'Ingestion TPS dropped below 100k',
      description: 'Auto-resolved after upstream HTTP source resumed traffic.',
    },
    startsAt: nowMinus(180), updatedAt: nowMinus(120), endsAt: nowMinus(120),
    title: 'IngestionRateDropped',
    description: 'Auto-resolved after upstream HTTP source resumed traffic.',
    source: 'pipeline',
    receiver: 'pagerduty-prod',
  },
  {
    id: 'mock-6', fingerprint: 'pqr678',
    status: 'resolved', severity: 'warning',
    labels: { alertname: 'HostMemoryPressure', component: 'host', host: 'ws-node-04' },
    annotations: {
      summary: 'Memory pressure on ws-node-04',
      description: 'Resolved after shard rebalance moved 18 partitions off ws-node-04.',
    },
    startsAt: nowMinus(360), updatedAt: nowMinus(300), endsAt: nowMinus(300),
    title: 'HostMemoryPressure',
    description: 'Resolved after shard rebalance moved 18 partitions off ws-node-04.',
    source: 'host',
    receiver: 'slack-ops',
  },
];

/* ─────────────── Hook ─────────────── */

interface UseGrafanaAlertsOptions {
  intervalMs?: number;
}

export function useGrafanaAlerts({ intervalMs = 15_000 }: UseGrafanaAlertsOptions = {}) {
  const [cfg] = useState<GrafanaConfig>(() => loadGrafanaConfig());
  const [alerts, setAlerts] = useState<GrafanaAlert[]>(MOCK_ALERTS);
  const [isLive, setIsLive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const failCount = useRef(0);

  const fetchAlerts = useCallback(async () => {
    setLoading(true);
    try {
      const url = `${cfg.baseUrl.replace(/\/$/, '')}/api/alertmanager/grafana/api/v2/alerts`;
      const res = await fetch(url, {
        headers: cfg.apiToken ? { Authorization: `Bearer ${cfg.apiToken}` } : undefined,
      });
      if (!res.ok) throw new Error(`Grafana ${res.status}`);
      const raw = await res.json();
      const list = Array.isArray(raw) ? raw : raw.data ?? [];
      const normalized = list.map(normalizeAlert);
      setAlerts(normalized);
      setIsLive(true);
      setError(null);
      failCount.current = 0;
    } catch (err) {
      failCount.current++;
      if (failCount.current >= 2) {
        setIsLive(false);
        setAlerts(MOCK_ALERTS);
      }
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [cfg]);

  useEffect(() => {
    fetchAlerts();
    const id = setInterval(fetchAlerts, intervalMs);
    return () => clearInterval(id);
  }, [fetchAlerts, intervalMs]);

  const summary = useMemo(() => {
    const firing = alerts.filter(a => a.status === 'firing');
    return {
      total: alerts.length,
      firing: firing.length,
      critical: firing.filter(a => a.severity === 'critical').length,
      warning: firing.filter(a => a.severity === 'warning').length,
      info:    firing.filter(a => a.severity === 'info').length,
      silenced: alerts.filter(a => a.status === 'silenced').length,
      resolved: alerts.filter(a => a.status === 'resolved').length,
    };
  }, [alerts]);

  return { alerts, summary, isLive, loading, error, refresh: fetchAlerts, cfg };
}
// Grafana configuration with env defaults + per-browser localStorage overrides.

export interface GrafanaDashboardLink {
  id: string;
  title: string;
  description: string;
  uid: string;        // Grafana dashboard UID
  panelId?: number;   // Optional: deep-link to a single panel (kiosk view)
  category: 'overview' | 'sinks' | 'wal' | 'cdc' | 'views' | 'custom';
}

export interface GrafanaConfig {
  baseUrl: string;
  apiToken: string;          // Optional: needed for Alerting API
  primaryDashboardUid: string;
  dashboards: GrafanaDashboardLink[];
  orgId?: number;
  theme?: 'light' | 'dark';
}

const STORAGE_KEY = 'ws-grafana-config-v1';

const ENV_BASE = (import.meta.env.VITE_GRAFANA_URL as string | undefined)?.replace(/\/$/, '') || 'http://localhost:3000';
const ENV_TOKEN = (import.meta.env.VITE_GRAFANA_API_TOKEN as string | undefined) || '';
const ENV_PRIMARY = (import.meta.env.VITE_GRAFANA_PRIMARY_UID as string | undefined) || 'writestream-overview';

const DEFAULT_DASHBOARDS: GrafanaDashboardLink[] = [
  { id: 'overview',  title: 'WriteStream Overview',     description: 'Top-line throughput, latency and saturation.', uid: ENV_PRIMARY,             category: 'overview' },
  { id: 'sinks',     title: 'Sink Pipeline',            description: 'Per-sink TPS, lag, error rate and circuit state.', uid: 'writestream-sinks',  category: 'sinks' },
  { id: 'wal',       title: 'WAL Engine',               description: 'Segment count, fsync latency and compaction.',     uid: 'writestream-wal',    category: 'wal' },
  { id: 'cdc',       title: 'CDC Sources',              description: 'Replication lag, snapshot status, events/sec.',    uid: 'writestream-cdc',    category: 'cdc' },
  { id: 'views',     title: 'Reactive Views',           description: 'Subscriber count, update rate, memory usage.',     uid: 'writestream-views',  category: 'views' },
  { id: 'host',      title: 'Host & Runtime',           description: 'CPU, memory, GC, file descriptors per node.',      uid: 'writestream-host',   category: 'custom' },
];

export function loadGrafanaConfig(): GrafanaConfig {
  const base: GrafanaConfig = {
    baseUrl: ENV_BASE,
    apiToken: ENV_TOKEN,
    primaryDashboardUid: ENV_PRIMARY,
    dashboards: DEFAULT_DASHBOARDS,
    orgId: 1,
  };
  if (typeof window === 'undefined') return base;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return base;
    const stored = JSON.parse(raw) as Partial<GrafanaConfig>;
    return {
      ...base,
      ...stored,
      dashboards: stored.dashboards?.length ? stored.dashboards : base.dashboards,
    };
  } catch {
    return base;
  }
}

export function saveGrafanaConfig(cfg: GrafanaConfig) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(cfg));
}

export function resetGrafanaConfig() {
  localStorage.removeItem(STORAGE_KEY);
}

/** Build an iframe URL for a dashboard or panel in kiosk mode. */
export function buildDashboardUrl(cfg: GrafanaConfig, dash: GrafanaDashboardLink, opts?: { kiosk?: boolean; from?: string; to?: string; refresh?: string; theme?: 'light' | 'dark' }) {
  const base = cfg.baseUrl.replace(/\/$/, '');
  const params = new URLSearchParams();
  if (opts?.from) params.set('from', opts.from);
  if (opts?.to) params.set('to', opts.to);
  if (opts?.refresh) params.set('refresh', opts.refresh);
  if (opts?.kiosk) params.set('kiosk', 'tv');
  if (opts?.theme || cfg.theme) params.set('theme', (opts?.theme || cfg.theme) as string);
  if (cfg.orgId) params.set('orgId', String(cfg.orgId));

  if (dash.panelId !== undefined) {
    params.set('viewPanel', String(dash.panelId));
  }
  const slug = dash.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  return `${base}/d/${dash.uid}/${slug}?${params.toString()}`;
}

export function buildAlertingUrl(cfg: GrafanaConfig) {
  return `${cfg.baseUrl.replace(/\/$/, '')}/alerting/list`;
}

export function buildAlertSilenceUrl(cfg: GrafanaConfig) {
  return `${cfg.baseUrl.replace(/\/$/, '')}/alerting/silences`;
}
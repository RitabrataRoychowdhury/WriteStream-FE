import { useEffect, useMemo, useRef, useState } from 'react';
import { ExternalLink, RefreshCw, Settings2, Maximize2, Minimize2, Wifi, WifiOff, Layers, AlertTriangle, Save, RotateCcw } from 'lucide-react';
import { TiltCard } from '@/components/shared/TiltCard';
import { ScrollReveal } from '@/components/shared/ScrollReveal';
import { FloatingShape } from '@/components/shared/FloatingShape';
import { useTheme } from '@/hooks/useTheme';
import {
  loadGrafanaConfig,
  saveGrafanaConfig,
  resetGrafanaConfig,
  buildDashboardUrl,
  buildAlertingUrl,
  type GrafanaConfig,
  type GrafanaDashboardLink,
} from '@/lib/grafanaConfig';
import { cn } from '@/lib/utils';

const REFRESH_OPTIONS = ['off', '5s', '10s', '30s', '1m', '5m'];
const RANGE_OPTIONS: Array<{ label: string; from: string; to: string }> = [
  { label: 'Last 15m', from: 'now-15m', to: 'now' },
  { label: 'Last 1h',  from: 'now-1h',  to: 'now' },
  { label: 'Last 6h',  from: 'now-6h',  to: 'now' },
  { label: 'Last 24h', from: 'now-24h', to: 'now' },
  { label: 'Last 7d',  from: 'now-7d',  to: 'now' },
];

const CATEGORY_BADGE: Record<GrafanaDashboardLink['category'], string> = {
  overview: 'text-primary',
  sinks:    'text-ws-sink',
  wal:      'text-ws-wal',
  cdc:      'text-ws-source',
  views:    'text-ws-reactive',
  custom:   'text-muted-foreground',
};

export default function GrafanaPage() {
  const { theme } = useTheme();
  const [cfg, setCfg] = useState<GrafanaConfig>(() => loadGrafanaConfig());
  const [activeId, setActiveId] = useState<string>(() => loadGrafanaConfig().dashboards[0]?.id ?? 'overview');
  const [refresh, setRefresh] = useState('30s');
  const [range, setRange] = useState(RANGE_OPTIONS[1]);
  const [kiosk, setKiosk] = useState(true);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [reachable, setReachable] = useState<boolean | null>(null);
  const [iframeKey, setIframeKey] = useState(0);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);

  const active = useMemo(
    () => cfg.dashboards.find(d => d.id === activeId) ?? cfg.dashboards[0],
    [cfg.dashboards, activeId]
  );

  const iframeSrc = useMemo(() => {
    if (!active) return '';
    return buildDashboardUrl(cfg, active, {
      kiosk,
      from: range.from,
      to: range.to,
      refresh: refresh === 'off' ? undefined : refresh,
      theme,
    });
  }, [cfg, active, kiosk, range, refresh, theme]);

  // Liveness check (HEAD on /api/health is CORS-friendly more often than not).
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`${cfg.baseUrl.replace(/\/$/, '')}/api/health`, { mode: 'no-cors' });
        if (!cancelled) setReachable(res.type === 'opaque' || res.ok);
      } catch {
        if (!cancelled) setReachable(false);
      }
    })();
    return () => { cancelled = true; };
  }, [cfg.baseUrl]);

  return (
    <div className="relative space-y-6">
      {/* Ambient depth */}
      <FloatingShape variant="gradient-orb" size={420} className="-top-24 -right-32" delay={120} />
      <FloatingShape variant="dot-grid"     size={220} className="top-40 -left-16" delay={500} color="hsl(var(--ws-wal) / 0.18)" />

      {/* ── Header ───────────────────────────────────────────────── */}
      <ScrollReveal>
        <header className="flex flex-wrap items-end justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <span className="editorial-eyebrow">Observability · Grafana</span>
              {reachable === true && (
                <span className="status-pill text-ws-success"><Wifi className="h-3 w-3" /> Reachable</span>
              )}
              {reachable === false && (
                <span className="status-pill text-ws-warning"><WifiOff className="h-3 w-3" /> Unreachable — check URL</span>
              )}
            </div>
            <h1 className="editorial-heading text-4xl md:text-5xl text-gradient">
              Grafana Workspace
            </h1>
            <p className="text-muted-foreground max-w-2xl">
              Live dashboards embedded directly from your Grafana instance, with deep links to every panel.
              Configure your base URL once and everything below adapts.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <a
              href={buildAlertingUrl(cfg)}
              target="_blank"
              rel="noreferrer"
              className="chip hover:bg-accent transition-colors"
            >
              <AlertTriangle className="h-3 w-3" />
              Alert rules
              <ExternalLink className="h-3 w-3" />
            </a>
            <button
              onClick={() => setSettingsOpen(o => !o)}
              className="ghost-border inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm hover:bg-secondary/60 transition-colors btn-magnetic"
            >
              <Settings2 className="h-4 w-4" />
              <span>Settings</span>
            </button>
          </div>
        </header>
      </ScrollReveal>

      {settingsOpen && (
        <SettingsPanel
          cfg={cfg}
          onClose={() => setSettingsOpen(false)}
          onSave={(next) => {
            saveGrafanaConfig(next);
            setCfg(next);
            setSettingsOpen(false);
            setIframeKey(k => k + 1);
          }}
          onReset={() => {
            resetGrafanaConfig();
            const fresh = loadGrafanaConfig();
            setCfg(fresh);
            setActiveId(fresh.dashboards[0]?.id ?? 'overview');
            setIframeKey(k => k + 1);
          }}
        />
      )}

      <div className="grid grid-cols-1 lg:grid-cols-[280px_minmax(0,1fr)] gap-5">
        {/* ── Sidebar of dashboards ─────────────────────────────── */}
        <ScrollReveal direction="left">
          <aside className="surface-low ghost-border rounded-2xl p-3 space-y-1 h-fit lg:sticky lg:top-4">
            <div className="px-3 py-2 flex items-center justify-between">
              <span className="label-editorial">Dashboards</span>
              <Layers className="h-3.5 w-3.5 text-muted-foreground" />
            </div>
            {cfg.dashboards.map(d => {
              const isActive = d.id === activeId;
              return (
                <button
                  key={d.id}
                  onClick={() => setActiveId(d.id)}
                  className={cn(
                    'group w-full text-left rounded-xl px-3 py-2.5 transition-all duration-200 relative',
                    isActive
                      ? 'surface-high text-foreground'
                      : 'hover:surface-mid text-muted-foreground hover:text-foreground'
                  )}
                >
                  {isActive && (
                    <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-6 rounded-r-full bg-gradient-to-b from-primary to-primary-glow" />
                  )}
                  <div className="flex items-center justify-between gap-2">
                    <span className={cn('text-[13px] font-medium', isActive && 'text-foreground')}>{d.title}</span>
                    <span className={cn('text-[10px] uppercase tracking-wider font-mono', CATEGORY_BADGE[d.category])}>
                      {d.category}
                    </span>
                  </div>
                  <p className="text-[11px] text-muted-foreground/80 mt-0.5 leading-relaxed line-clamp-2">{d.description}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="font-mono text-[10px] text-muted-foreground/70">uid:{d.uid.slice(0, 14)}</span>
                    <a
                      href={buildDashboardUrl(cfg, d, { theme })}
                      target="_blank"
                      rel="noreferrer"
                      onClick={e => e.stopPropagation()}
                      className="ml-auto opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-primary transition-opacity"
                      title="Open in Grafana"
                    >
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                </button>
              );
            })}
          </aside>
        </ScrollReveal>

        {/* ── Embedded dashboard ────────────────────────────────── */}
        <ScrollReveal delay={120}>
          <TiltCard className="overflow-hidden" intensity={0.3}>
            {/* Toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 border-b border-border/40">
              <div className="flex items-center gap-3 min-w-0">
                <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary/20 to-primary-glow/10 flex items-center justify-center">
                  <span className="text-[10px] font-mono font-bold text-primary">G</span>
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-semibold truncate">{active?.title ?? 'No dashboard selected'}</div>
                  <div className="text-[11px] text-muted-foreground font-mono truncate">{active?.uid}</div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-1.5">
                <SegmentedSelect
                  label="Range"
                  value={range.label}
                  options={RANGE_OPTIONS.map(r => r.label)}
                  onChange={(label) => setRange(RANGE_OPTIONS.find(r => r.label === label)!)}
                />
                <SegmentedSelect
                  label="Refresh"
                  value={refresh}
                  options={REFRESH_OPTIONS}
                  onChange={setRefresh}
                />
                <button
                  onClick={() => setKiosk(k => !k)}
                  title={kiosk ? 'Show Grafana chrome' : 'Kiosk mode (clean)'}
                  className="ghost-border rounded-lg p-2 text-muted-foreground hover:text-foreground hover:bg-secondary/60 transition-colors"
                >
                  {kiosk ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
                </button>
                <button
                  onClick={() => setIframeKey(k => k + 1)}
                  title="Reload"
                  className="ghost-border rounded-lg p-2 text-muted-foreground hover:text-foreground hover:bg-secondary/60 transition-colors"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                </button>
                {active && (
                  <a
                    href={buildDashboardUrl(cfg, active, { theme })}
                    target="_blank"
                    rel="noreferrer"
                    className="ghost-border rounded-lg p-2 text-muted-foreground hover:text-foreground hover:bg-secondary/60 transition-colors"
                    title="Open in Grafana"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                )}
              </div>
            </div>

            {/* Iframe */}
            <div className="relative bg-canvas-bg/40" style={{ height: 'calc(100vh - 280px)', minHeight: 520 }}>
              {reachable === false && (
                <div className="absolute inset-0 flex items-center justify-center z-10 backdrop-blur-sm bg-background/60">
                  <div className="surface-bright ghost-border rounded-2xl p-6 max-w-md text-center space-y-3">
                    <WifiOff className="h-8 w-8 text-ws-warning mx-auto" />
                    <h3 className="font-semibold">Can't reach Grafana</h3>
                    <p className="text-sm text-muted-foreground">
                      Tried <span className="font-mono">{cfg.baseUrl}</span>. The iframe will still attempt to load — many setups respond despite a failed health probe.
                    </p>
                    <button
                      onClick={() => setSettingsOpen(true)}
                      className="text-sm text-primary hover:underline inline-flex items-center gap-1"
                    >
                      Update Grafana URL <ExternalLink className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              )}
              <iframe
                key={iframeKey}
                ref={iframeRef}
                src={iframeSrc}
                title={active?.title ?? 'Grafana dashboard'}
                className="w-full h-full border-0 block"
                allow="fullscreen"
                loading="lazy"
              />
            </div>

            {/* Footer hint */}
            <div className="px-4 py-2.5 border-t border-border/30 flex items-center justify-between text-[11px] text-muted-foreground">
              <span>
                Embed mode requires Grafana <code className="font-mono text-foreground/80">allow_embedding = true</code> and (for unauth) <code className="font-mono text-foreground/80">[auth.anonymous]</code> enabled.
              </span>
              <span className="font-mono">{kiosk ? 'kiosk=tv' : 'full chrome'}</span>
            </div>
          </TiltCard>
        </ScrollReveal>
      </div>
    </div>
  );
}

/* ─────────────── Sub-components ─────────────── */

function SegmentedSelect({
  label, value, options, onChange,
}: { label: string; value: string; options: string[]; onChange: (v: string) => void }) {
  return (
    <label className="ghost-border rounded-lg flex items-center gap-1.5 pl-2.5 pr-1 py-1 text-[11px]">
      <span className="text-muted-foreground uppercase tracking-wider">{label}</span>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className="bg-transparent text-foreground font-mono text-[11px] outline-none cursor-pointer"
      >
        {options.map(o => <option key={o} value={o} className="bg-popover text-popover-foreground">{o}</option>)}
      </select>
    </label>
  );
}

function SettingsPanel({
  cfg, onSave, onReset, onClose,
}: {
  cfg: GrafanaConfig;
  onSave: (cfg: GrafanaConfig) => void;
  onReset: () => void;
  onClose: () => void;
}) {
  const [draft, setDraft] = useState<GrafanaConfig>(cfg);

  return (
    <ScrollReveal>
      <div className="surface-low ghost-border rounded-2xl p-5 space-y-4 animate-fade-in">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold">Grafana connection</h3>
            <p className="text-xs text-muted-foreground">Stored in your browser. Defaults from <code className="font-mono">VITE_GRAFANA_URL</code>.</p>
          </div>
          <button onClick={onClose} className="text-xs text-muted-foreground hover:text-foreground">Close</button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Base URL">
            <input
              value={draft.baseUrl}
              onChange={e => setDraft({ ...draft, baseUrl: e.target.value })}
              placeholder="http://localhost:3000"
              className="w-full bg-transparent border-b-2 border-border focus:border-primary px-0 py-1.5 outline-none font-mono text-sm transition-colors"
            />
          </Field>
          <Field label="Primary dashboard UID">
            <input
              value={draft.primaryDashboardUid}
              onChange={e => setDraft({ ...draft, primaryDashboardUid: e.target.value })}
              placeholder="writestream-overview"
              className="w-full bg-transparent border-b-2 border-border focus:border-primary px-0 py-1.5 outline-none font-mono text-sm transition-colors"
            />
          </Field>
          <Field label="Org ID (optional)">
            <input
              type="number"
              value={draft.orgId ?? 1}
              onChange={e => setDraft({ ...draft, orgId: Number(e.target.value) || undefined })}
              className="w-full bg-transparent border-b-2 border-border focus:border-primary px-0 py-1.5 outline-none font-mono text-sm transition-colors"
            />
          </Field>
          <Field label="API token (for alerts)">
            <input
              type="password"
              value={draft.apiToken}
              onChange={e => setDraft({ ...draft, apiToken: e.target.value })}
              placeholder="glsa_..."
              className="w-full bg-transparent border-b-2 border-border focus:border-primary px-0 py-1.5 outline-none font-mono text-sm transition-colors"
            />
          </Field>
        </div>

        <div className="flex items-center justify-end gap-2 pt-2">
          <button
            onClick={onReset}
            className="ghost-border inline-flex items-center gap-2 rounded-lg px-3 py-2 text-xs text-muted-foreground hover:text-foreground hover:bg-secondary/60 transition-colors"
          >
            <RotateCcw className="h-3 w-3" /> Reset
          </button>
          <button
            onClick={() => onSave(draft)}
            className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-semibold bg-primary text-primary-foreground hover:opacity-90 transition-opacity btn-magnetic"
          >
            <Save className="h-3 w-3" /> Save & reload
          </button>
        </div>
      </div>
    </ScrollReveal>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-1">
      <span className="label-editorial">{label}</span>
      {children}
    </label>
  );
}
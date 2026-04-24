import { useMemo, useState } from 'react';
import {
  AlertTriangle, AlertCircle, Bell, BellOff, CheckCircle2, ChevronRight, ExternalLink,
  Filter, RefreshCw, Search, Wifi, WifiOff, X, Clock,
} from 'lucide-react';
import { TiltCard } from '@/components/shared/TiltCard';
import { ScrollReveal } from '@/components/shared/ScrollReveal';
import { FloatingShape } from '@/components/shared/FloatingShape';
import { useGrafanaAlerts, type GrafanaAlert } from '@/hooks/useGrafanaAlerts';
import { buildAlertingUrl, buildAlertSilenceUrl } from '@/lib/grafanaConfig';
import { cn } from '@/lib/utils';

type StatusFilter = 'all' | 'firing' | 'silenced' | 'resolved';
type SeverityFilter = 'all' | 'critical' | 'warning' | 'info';

const SEVERITY_TOKEN: Record<GrafanaAlert['severity'], { color: string; bg: string; label: string }> = {
  critical: { color: 'text-ws-error',   bg: 'bg-ws-error/10',   label: 'Critical' },
  warning:  { color: 'text-ws-warning', bg: 'bg-ws-warning/10', label: 'Warning' },
  info:     { color: 'text-ws-info',    bg: 'bg-ws-info/10',    label: 'Info' },
  none:     { color: 'text-muted-foreground', bg: 'bg-muted/30', label: 'None' },
};

const SOURCE_LABEL: Record<GrafanaAlert['source'], string> = {
  sink: 'Sink', wal: 'WAL', cdc: 'CDC', view: 'View', host: 'Host', pipeline: 'Pipeline', unknown: 'System',
};

function timeAgo(iso: string) {
  const ms = Date.now() - new Date(iso).getTime();
  const m = Math.floor(ms / 60_000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}

export default function AlertsPage() {
  const { alerts, summary, isLive, loading, refresh, cfg } = useGrafanaAlerts({ intervalMs: 15_000 });
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [severityFilter, setSeverityFilter] = useState<SeverityFilter>('all');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<GrafanaAlert | null>(null);

  const filtered = useMemo(() => {
    return alerts.filter(a => {
      if (statusFilter !== 'all' && a.status !== statusFilter) return false;
      if (severityFilter !== 'all' && a.severity !== severityFilter) return false;
      if (search) {
        const hay = [a.title, a.description, a.receiver, ...Object.values(a.labels)].join(' ').toLowerCase();
        if (!hay.includes(search.toLowerCase())) return false;
      }
      return true;
    }).sort((a, b) => {
      // Firing > silenced > resolved, then severity, then recency
      const statusOrder = { firing: 0, pending: 1, silenced: 2, resolved: 3 } as const;
      const sevOrder    = { critical: 0, warning: 1, info: 2, none: 3 } as const;
      const sd = statusOrder[a.status] - statusOrder[b.status];
      if (sd !== 0) return sd;
      const vd = sevOrder[a.severity] - sevOrder[b.severity];
      if (vd !== 0) return vd;
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    });
  }, [alerts, statusFilter, severityFilter, search]);

  return (
    <div className="relative space-y-7">
      <FloatingShape variant="gradient-orb" size={360} className="-top-16 right-0" delay={0} color="hsl(var(--ws-error) / 0.1)" />
      <FloatingShape variant="dot-grid"     size={200} className="top-72 -left-12" delay={300} color="hsl(var(--ws-warning) / 0.18)" />

      {/* ── Header ─────────────────────────────────────────────── */}
      <ScrollReveal>
        <header className="flex flex-wrap items-end justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <span className="editorial-eyebrow">Notifications · Grafana Alerting</span>
              {isLive
                ? <span className="status-pill text-ws-success"><Wifi className="h-3 w-3" /> Live</span>
                : <span className="status-pill text-muted-foreground"><WifiOff className="h-3 w-3" /> Mock data</span>}
            </div>
            <h1 className="editorial-heading text-4xl md:text-5xl text-gradient">Alert Inbox</h1>
            <p className="text-muted-foreground max-w-2xl">
              Notifications from your Grafana Alerting receivers. Filter, triage, and jump straight to the source dashboard or silence rule.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <a
              href={buildAlertSilenceUrl(cfg)}
              target="_blank" rel="noreferrer"
              className="chip hover:bg-accent transition-colors"
            >
              <BellOff className="h-3 w-3" /> Silences <ExternalLink className="h-3 w-3" />
            </a>
            <a
              href={buildAlertingUrl(cfg)}
              target="_blank" rel="noreferrer"
              className="chip hover:bg-accent transition-colors"
            >
              <Bell className="h-3 w-3" /> Alert rules <ExternalLink className="h-3 w-3" />
            </a>
            <button
              onClick={refresh}
              disabled={loading}
              className="ghost-border inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm hover:bg-secondary/60 transition-colors btn-magnetic"
            >
              <RefreshCw className={cn('h-4 w-4', loading && 'animate-spin')} />
              <span>Refresh</span>
            </button>
          </div>
        </header>
      </ScrollReveal>

      {/* ── Summary tiles ──────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[
          { label: 'Critical firing', value: summary.critical, color: 'text-ws-error',   icon: AlertCircle, pulse: summary.critical > 0 },
          { label: 'Warning firing',  value: summary.warning,  color: 'text-ws-warning', icon: AlertTriangle },
          { label: 'Info firing',     value: summary.info,     color: 'text-ws-info',    icon: Bell },
          { label: 'Silenced',        value: summary.silenced, color: 'text-muted-foreground', icon: BellOff },
          { label: 'Resolved (24h)',  value: summary.resolved, color: 'text-ws-success', icon: CheckCircle2 },
        ].map((tile, i) => (
          <ScrollReveal key={tile.label} delay={i * 60}>
            <TiltCard intensity={0.4} className="p-5">
              <div className="flex items-start justify-between">
                <span className="label-editorial">{tile.label}</span>
                <tile.icon className={cn('h-4 w-4', tile.color)} />
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className={cn('font-mono text-3xl font-bold tabular-nums', tile.color)}>{tile.value}</span>
                {tile.pulse && (
                  <span className="kinetic-pulse h-2.5 w-2.5 rounded-full bg-ws-error" />
                )}
              </div>
            </TiltCard>
          </ScrollReveal>
        ))}
      </div>

      {/* ── Filter bar ─────────────────────────────────────────── */}
      <ScrollReveal>
        <div className="surface-low ghost-border rounded-2xl p-3 flex flex-wrap items-center gap-2">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search alerts, labels, receiver…"
              className="w-full bg-transparent pl-9 pr-3 py-2 text-sm outline-none placeholder:text-muted-foreground/60"
            />
          </div>

          <Filter className="h-3.5 w-3.5 text-muted-foreground ml-2" />
          <Pills
            value={statusFilter}
            onChange={v => setStatusFilter(v as StatusFilter)}
            options={[
              { v: 'all', label: 'All' },
              { v: 'firing', label: `Firing (${summary.firing})` },
              { v: 'silenced', label: 'Silenced' },
              { v: 'resolved', label: 'Resolved' },
            ]}
          />
          <Pills
            value={severityFilter}
            onChange={v => setSeverityFilter(v as SeverityFilter)}
            options={[
              { v: 'all', label: 'Any' },
              { v: 'critical', label: 'Critical', tone: 'text-ws-error' },
              { v: 'warning',  label: 'Warning',  tone: 'text-ws-warning' },
              { v: 'info',     label: 'Info',     tone: 'text-ws-info' },
            ]}
          />
        </div>
      </ScrollReveal>

      {/* ── Alerts list ────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_360px] gap-5">
        <ScrollReveal>
          <div className="space-y-2.5">
            {filtered.length === 0 && (
              <div className="surface-low ghost-border rounded-2xl p-12 text-center">
                <CheckCircle2 className="h-10 w-10 text-ws-success mx-auto mb-3" />
                <h3 className="font-semibold">All clear</h3>
                <p className="text-sm text-muted-foreground">No alerts match the current filters.</p>
              </div>
            )}
            {filtered.map(alert => (
              <AlertRow
                key={alert.id}
                alert={alert}
                active={selected?.id === alert.id}
                onClick={() => setSelected(alert)}
              />
            ))}
          </div>
        </ScrollReveal>

        {/* Detail panel */}
        <div className="lg:sticky lg:top-4 h-fit">
          {selected ? (
            <AlertDetail alert={selected} onClose={() => setSelected(null)} />
          ) : (
            <div className="surface-low ghost-border rounded-2xl p-8 text-center text-sm text-muted-foreground">
              Select an alert to see its labels, annotations, receiver, and Grafana deep-link.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─────────────── Sub-components ─────────────── */

function Pills<T extends string>({
  value, onChange, options,
}: { value: T; onChange: (v: T) => void; options: Array<{ v: T; label: string; tone?: string }> }) {
  return (
    <div className="flex items-center gap-1 surface-mid rounded-lg p-1">
      {options.map(o => (
        <button
          key={o.v}
          onClick={() => onChange(o.v)}
          className={cn(
            'rounded-md px-2.5 py-1 text-[11px] font-medium transition-colors',
            value === o.v ? 'surface-bright text-foreground shadow-sm' : cn('text-muted-foreground hover:text-foreground', o.tone),
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

function AlertRow({ alert, active, onClick }: { alert: GrafanaAlert; active: boolean; onClick: () => void }) {
  const sev = SEVERITY_TOKEN[alert.severity];
  const isFiring = alert.status === 'firing';

  return (
    <button
      onClick={onClick}
      className={cn(
        'group w-full text-left surface-bright ghost-border rounded-2xl p-4 transition-all duration-200 relative overflow-hidden',
        'hover:shadow-elevated hover:-translate-y-0.5 hover:border-primary/30',
        active && 'border-primary/40 shadow-elevated'
      )}
    >
      {/* Severity rail */}
      <span className={cn('absolute left-0 top-0 bottom-0 w-1', sev.color.replace('text-', 'bg-'))} />

      <div className="flex items-start gap-4 pl-2">
        <div className={cn('mt-0.5 h-9 w-9 rounded-xl flex items-center justify-center shrink-0', sev.bg)}>
          {alert.severity === 'critical' && <AlertCircle className={cn('h-4 w-4', sev.color, isFiring && 'animate-pulse')} />}
          {alert.severity === 'warning' && <AlertTriangle className={cn('h-4 w-4', sev.color)} />}
          {alert.severity === 'info' && <Bell className={cn('h-4 w-4', sev.color)} />}
          {alert.severity === 'none' && <Bell className={cn('h-4 w-4', sev.color)} />}
        </div>

        <div className="min-w-0 flex-1 space-y-1.5">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-semibold text-[14px] truncate">{alert.title}</h3>
            <span className={cn('status-pill', sev.color)}>{sev.label}</span>
            <span className="chip">{SOURCE_LABEL[alert.source]}</span>
            {alert.status === 'silenced' && <span className="status-pill text-muted-foreground"><BellOff className="h-3 w-3" /> Silenced</span>}
            {alert.status === 'resolved' && <span className="status-pill text-ws-success"><CheckCircle2 className="h-3 w-3" /> Resolved</span>}
          </div>
          <p className="text-sm text-muted-foreground line-clamp-2">{alert.description}</p>
          <div className="flex items-center gap-3 text-[11px] text-muted-foreground/80 font-mono">
            <span className="inline-flex items-center gap-1"><Clock className="h-3 w-3" /> started {timeAgo(alert.startsAt)}</span>
            {alert.receiver && <span>→ {alert.receiver}</span>}
            {Object.entries(alert.labels).slice(0, 3).map(([k, v]) => (
              <span key={k} className="opacity-80">{k}=<span className="text-foreground/80">{v}</span></span>
            ))}
          </div>
        </div>

        <ChevronRight className="h-4 w-4 text-muted-foreground/60 group-hover:text-foreground transition-colors mt-2" />
      </div>
    </button>
  );
}

function AlertDetail({ alert, onClose }: { alert: GrafanaAlert; onClose: () => void }) {
  const sev = SEVERITY_TOKEN[alert.severity];
  return (
    <TiltCard intensity={0.2} className="p-5 space-y-5 animate-scale-in">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1.5 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={cn('status-pill', sev.color)}>{sev.label}</span>
            <span className="chip">{SOURCE_LABEL[alert.source]}</span>
            <span className="text-[11px] text-muted-foreground font-mono">{alert.status}</span>
          </div>
          <h2 className="font-semibold text-lg leading-tight">{alert.title}</h2>
        </div>
        <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X className="h-4 w-4" /></button>
      </div>

      <p className="text-sm text-foreground/90 leading-relaxed">{alert.description}</p>

      <div className="grid grid-cols-2 gap-3 text-[12px]">
        <Stat label="Started"  value={timeAgo(alert.startsAt)} />
        <Stat label="Updated"  value={timeAgo(alert.updatedAt)} />
        {alert.endsAt && <Stat label="Resolved" value={timeAgo(alert.endsAt)} />}
        {alert.receiver && <Stat label="Receiver" value={alert.receiver} mono />}
      </div>

      <div className="space-y-2">
        <div className="label-editorial">Labels</div>
        <div className="flex flex-wrap gap-1.5">
          {Object.entries(alert.labels).map(([k, v]) => (
            <span key={k} className="font-mono text-[11px] surface-mid rounded-md px-2 py-1">
              <span className="text-muted-foreground">{k}</span>=<span className="text-foreground">{v}</span>
            </span>
          ))}
        </div>
      </div>

      {Object.keys(alert.annotations).length > 0 && (
        <div className="space-y-2">
          <div className="label-editorial">Annotations</div>
          <div className="space-y-1.5 text-[12px]">
            {Object.entries(alert.annotations).map(([k, v]) => (
              <div key={k} className="surface-mid rounded-md px-2.5 py-1.5">
                <span className="font-mono text-[10px] text-muted-foreground uppercase tracking-wider">{k}</span>
                <p className="text-foreground/90">{v}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {alert.generatorURL && (
        <a
          href={alert.generatorURL}
          target="_blank" rel="noreferrer"
          className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
        >
          Open in Grafana <ExternalLink className="h-3 w-3" />
        </a>
      )}
    </TiltCard>
  );
}

function Stat({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="surface-mid rounded-lg p-2.5">
      <div className="label-editorial">{label}</div>
      <div className={cn('text-foreground mt-0.5', mono && 'font-mono text-[12px]')}>{value}</div>
    </div>
  );
}
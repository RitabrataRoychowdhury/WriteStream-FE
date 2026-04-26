import { useLiveMetrics } from '@/hooks/useLiveMetrics';
import { useMetrics } from '@/hooks/useMetrics';
import { KpiSpark } from '@/components/shared/KpiSpark';
import { SankeyFlow, type SankeyTarget } from '@/components/shared/SankeyFlow';
import { PyramidBars } from '@/components/shared/PyramidBars';
import { GaugeChart } from '@/components/shared/GaugeChart';
import { StatusDot } from '@/components/shared/StatusDot';
import { TiltCard } from '@/components/shared/TiltCard';
import { ScrollReveal } from '@/components/shared/ScrollReveal';
import { FloatingShape } from '@/components/shared/FloatingShape';
import { Activity, Zap, Clock, HardDrive, Radio, Database, Eye, Wifi, WifiOff, Calendar, GitBranch } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';
import type { ComponentStatus } from '@/mocks/mockData';

export default function DashboardPage() {
  const live = useLiveMetrics(3000);
  const { metrics: mockMetrics } = useMetrics(2000);
  const navigate = useNavigate();

  // Use live data if connected, mock otherwise
  const isLive = live.isLive;
  const prom = live.prometheus;

  // Derived values — live or mock
  const totalEventsIngested = isLive && prom ? prom.eventsIngested : mockMetrics.totalEventsIngested;
  const currentTps = isLive && live.tpsHistory.length > 0
    ? live.tpsHistory[live.tpsHistory.length - 1].tps
    : mockMetrics.currentTps;
  const e2eLatencyP99 = isLive && prom ? prom.walWriteLatencyP99 : mockMetrics.e2eLatencyP99Ms;
  const backpressure = isLive && prom ? prom.backpressureEvents : 0;

  const tpsHistory = isLive && live.tpsHistory.length > 5
    ? live.tpsHistory
    : mockMetrics.tpsHistory;

  // Sinks
  const sinkCards = isLive && live.sinks.length > 0
    ? live.sinks.map(s => ({
        name: s.name,
        status: (s.status === 'Enabled' ? 'healthy' : s.status === 'CircuitBroken' ? 'down' : 'disabled') as ComponentStatus,
        tps: prom?.sinkEventsWritten[s.name] ?? 0,
        lastSeq: s.last_acknowledged_sequence,
        errorCount: s.error_count,
        backpressure: s.status === 'CircuitBroken',
      }))
    : mockMetrics.sinks.map(s => ({
        name: s.name,
        status: s.status,
        tps: s.tps,
        lastSeq: 0,
        errorCount: 0,
        backpressure: s.backpressure,
      }));

  // Sources
  const sourceCards = isLive && live.cdcSources.length > 0
    ? live.cdcSources.map(s => ({
        name: s.name,
        status: (s.status === 'streaming' ? 'healthy' : s.status === 'stopped' ? 'disabled' : 'degraded') as ComponentStatus,
        tps: s.events_per_second,
        latencyP99: s.replication_lag_ms,
        errorRate: 0,
      }))
    : mockMetrics.sources.map(s => ({
        name: s.name,
        status: s.status,
        tps: s.tps,
        latencyP99: s.latencyP99Ms,
        errorRate: s.errorRate,
      }));

  // Views
  const viewsSummary = isLive && live.views.length > 0
    ? {
        activeViews: live.views.length,
        wsConnections: live.views.reduce((s, v) => s + v.subscriber_count, 0),
        totalEntries: live.views.reduce((s, v) => s + v.entry_count, 0),
      }
    : {
        activeViews: mockMetrics.reactive.activeViews,
        wsConnections: mockMetrics.reactive.wsConnections,
        totalEntries: mockMetrics.reactive.totalEntries,
      };

  // Build sankey targets from sources (left) -> sinks (right)
  // Total represents total throughput flowing through the system
  const colorPalette = ['ws-source', 'ws-hotpath', 'ws-wal', 'ws-shard', 'ws-sink', 'ws-reactive', 'ws-info'];

  const sinkFlowTargets: SankeyTarget[] = (() => {
    const list = isLive && live.sinks.length > 0
      ? live.sinks.map((s, i) => ({
          id: s.name,
          label: s.name,
          value: prom?.sinkEventsWritten[s.name] ?? Math.max(1, s.last_acknowledged_sequence),
          colorVar: colorPalette[i % colorPalette.length],
          sublabel: s.status === 'Enabled' ? 'streaming' : s.status,
        }))
      : mockMetrics.sinks.map((s, i) => ({
          id: s.name,
          label: s.name,
          value: Math.max(1, Math.round(s.tps)),
          colorVar: colorPalette[i % colorPalette.length],
          sublabel: `${(s.tps / 1000).toFixed(1)}K /s`,
        }));
    return list.slice(0, 6);
  })();

  const totalThroughput = sinkFlowTargets.reduce((s, t) => s + t.value, 0);

  // Sparkline series — uses tps history for primary KPIs
  const tpsSeries = tpsHistory.slice(-20).map(h => h.tps);
  const latencySeries = isLive && live.tpsHistory.length > 5
    ? live.tpsHistory.slice(-20).map((_, i) => e2eLatencyP99 * (0.85 + 0.3 * Math.sin(i / 2)))
    : mockMetrics.tpsHistory.slice(-20).map((_, i) => mockMetrics.e2eLatencyP99Ms * (0.85 + 0.3 * Math.sin(i / 2)));
  const ingestSeries = tpsHistory.slice(-20).map((h, i) => h.tps * (0.9 + i * 0.005));

  // Pyramid: source vs sink throughput buckets
  const pyramidRows = (() => {
    const len = Math.min(sourceCards.length, sinkFlowTargets.length, 6);
    const rows: { bucket: string; left: number; right: number }[] = [];
    for (let i = 0; i < len; i++) {
      rows.push({
        bucket: `T${i + 1}`,
        left: Math.round(sourceCards[i]?.tps ?? 0),
        right: Math.round(sinkFlowTargets[i]?.value ?? 0),
      });
    }
    return rows.length > 0 ? rows : [
      { bucket: 'T1', left: 1200, right: 1100 },
      { bucket: 'T2', left: 980, right: 950 },
      { bucket: 'T3', left: 760, right: 720 },
      { bucket: 'T4', left: 540, right: 510 },
    ];
  })();

  return (
    <div className="space-y-8 max-w-[1500px] mx-auto relative">
      <FloatingShape variant="gradient-orb" size={240} className="top-0 -right-20 opacity-50" delay={0} />
      <FloatingShape variant="ring" size={80} className="top-40 -left-10 opacity-30" delay={1200} />

      {/* Header */}
      <ScrollReveal>
        <div className="flex items-end justify-between gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
              <span className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground font-semibold">Operations Theatre</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-foreground tracking-tight font-display">
              Stream <span className="text-gradient">Performance</span>
            </h1>
            <p className="text-sm text-muted-foreground mt-2 font-light max-w-xl">
              Real-time telemetry across sources, sinks, and reactive views — visualized cinematically.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="hidden md:flex items-center gap-2 px-3.5 py-2 rounded-xl border border-border/40 text-[11px] text-muted-foreground bg-card/40">
              <Calendar className="h-3.5 w-3.5" />
              <span className="font-medium">Last 24h</span>
            </div>
            <div className="hidden md:flex items-center gap-2 px-3.5 py-2 rounded-xl text-[11px] font-medium" style={{
              background: isLive ? 'hsl(var(--ws-success) / 0.08)' : 'hsl(var(--ws-warning) / 0.08)',
              boxShadow: `inset 0 0 0 1px hsl(var(--${isLive ? 'ws-success' : 'ws-warning'}) / 0.2)`,
              color: `hsl(var(--${isLive ? 'ws-success' : 'ws-warning'}))`,
            }}>
              {isLive ? <Wifi className="h-3.5 w-3.5" /> : <WifiOff className="h-3.5 w-3.5" />}
              <span>{isLive ? 'Live backend' : 'Mock data'}</span>
            </div>
          </div>
        </div>
      </ScrollReveal>

      {/* Top: KPI row (left, 3 cards) + Demographics-style pyramid (right) */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
        {/* Left side: section header + 3 KPI cards */}
        <div className="lg:col-span-3 space-y-4">
          <ScrollReveal>
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-foreground font-display">Key Performance Metrics</h2>
              <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground border border-border/30 rounded-lg px-2.5 py-1">
                <Calendar className="h-3 w-3" />
                <span>Last 24h</span>
              </div>
            </div>
          </ScrollReveal>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <ScrollReveal delay={0}>
              <KpiSpark
                title="Sequencer"
                subtitle="Throughput / sec"
                value={`${(currentTps / 1000).toFixed(0)}K`}
                delta={{ value: '+6.2%', positive: true }}
                icon={<Zap className="h-4 w-4" />}
                colorVar="ws-hotpath"
                series={tpsSeries.length > 1 ? tpsSeries : [10, 14, 12, 18, 22, 19, 25, 28, 24, 30]}
                onOpen={() => navigate('/pipeline')}
              />
            </ScrollReveal>
            <ScrollReveal delay={80}>
              <KpiSpark
                title="Ingest Path"
                subtitle="Events / sec"
                value={totalEventsIngested >= 1_000_000 ? `${(totalEventsIngested / 1_000_000).toFixed(1)}M` : `${(totalEventsIngested / 1000).toFixed(0)}K`}
                delta={{ value: '+2.6%', positive: true }}
                icon={<Activity className="h-4 w-4" />}
                colorVar="ws-source"
                series={ingestSeries.length > 1 ? ingestSeries : [5, 8, 12, 9, 14, 18, 16, 22, 26, 30]}
                onOpen={() => navigate('/sources')}
              />
            </ScrollReveal>
            <ScrollReveal delay={160}>
              <KpiSpark
                title="WAL Latency"
                subtitle="P99 ms"
                value={`${e2eLatencyP99.toFixed(1)}ms`}
                delta={{ value: backpressure > 0 ? `${backpressure}` : '-3.4%', positive: backpressure === 0 }}
                icon={<Clock className="h-4 w-4" />}
                colorVar="ws-wal"
                series={latencySeries.length > 1 ? latencySeries : [20, 18, 22, 19, 24, 21, 17, 19, 22, 18]}
                onOpen={() => navigate('/operations')}
              />
            </ScrollReveal>
          </div>

          {/* Sankey flow — full width under KPIs */}
          <ScrollReveal delay={120}>
            <div className="rounded-2xl border border-border/40 p-5 md:p-6 mt-2 relative overflow-hidden"
              style={{ background: 'linear-gradient(165deg, hsl(var(--surface-elevated)) 0%, hsl(var(--surface-2)) 100%)' }}>
              <div className="pointer-events-none absolute -bottom-20 -left-10 h-40 w-40 rounded-full opacity-20 blur-3xl"
                style={{ background: 'hsl(var(--ws-hotpath) / 0.5)' }} />
              <div className="relative flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-base font-semibold text-foreground font-display">Throughput Distribution</h3>
                  <p className="text-[11px] text-muted-foreground mt-0.5">Events ingested → routed to active sinks</p>
                </div>
                <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground border border-border/30 rounded-lg px-2.5 py-1">
                  <Calendar className="h-3 w-3" />
                  <span>Last 24h</span>
                </div>
              </div>
              <SankeyFlow
                sourceLabel="Total Events"
                sourceValue={totalThroughput >= 1_000_000 ? `${(totalThroughput / 1_000_000).toFixed(1)}M` : totalThroughput >= 1000 ? `${(totalThroughput / 1000).toFixed(1)}K` : `${totalThroughput}`}
                sourceSublabel={`${sinkFlowTargets.length} sinks`}
                targets={sinkFlowTargets}
                height={360}
              />
            </div>
          </ScrollReveal>
        </div>

        {/* Right side: pyramid + readmission-style gauge */}
        <div className="lg:col-span-2 space-y-5">
          <ScrollReveal delay={80}>
            <div className="rounded-2xl border border-border/40 p-5 md:p-6 relative overflow-hidden"
              style={{ background: 'linear-gradient(165deg, hsl(var(--surface-elevated)) 0%, hsl(var(--surface-2)) 100%)' }}>
              <div className="pointer-events-none absolute -top-16 -right-16 h-40 w-40 rounded-full opacity-20 blur-3xl"
                style={{ background: 'hsl(var(--ws-source) / 0.5)' }} />
              <div className="relative flex items-center justify-between mb-4">
                <h3 className="text-base font-semibold text-foreground font-display">Source / Sink Balance</h3>
                <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground border border-border/30 rounded-lg px-2.5 py-1">
                  <Calendar className="h-3 w-3" />
                  <span>Last 24h</span>
                </div>
              </div>
              <PyramidBars
                rows={pyramidRows}
                leftLabel="Source TPS"
                rightLabel="Sink TPS"
                leftColorVar="ws-source"
                rightColorVar="ws-sink"
                height={290}
              />
            </div>
          </ScrollReveal>

          <ScrollReveal delay={160}>
            <div className="rounded-2xl border border-border/40 p-5 md:p-6 relative overflow-hidden"
              style={{ background: 'linear-gradient(165deg, hsl(var(--surface-elevated)) 0%, hsl(var(--surface-2)) 100%)' }}>
              <div className="pointer-events-none absolute -bottom-16 -right-12 h-40 w-40 rounded-full opacity-25 blur-3xl"
                style={{ background: 'hsl(var(--ws-warning) / 0.55)' }} />
              <div className="relative flex items-center justify-between mb-2">
                <h3 className="text-base font-semibold text-foreground font-display">Backpressure Monitor</h3>
                <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground border border-border/30 rounded-lg px-2.5 py-1">
                  <span>24h</span>
                </div>
              </div>
              <div className="relative flex items-center justify-center py-2">
                <GaugeChart
                  value={Math.min(currentTps, 250000)}
                  max={250000}
                  color="hsl(var(--ws-warning))"
                  size={180}
                />
              </div>
              <div className="relative text-center mt-2">
                <div className="text-[11px] text-muted-foreground">Saturation</div>
                <div className="text-2xl font-bold text-foreground font-display tabular-nums mt-0.5">
                  {((currentTps / 250000) * 100).toFixed(0)}%
                </div>
                <div className="text-[10px] text-muted-foreground/80 mt-1">
                  {backpressure > 0 ? `${backpressure} events buffered` : 'No backpressure'}
                </div>
              </div>
              <button
                onClick={() => navigate('/operations')}
                className="relative mt-4 w-full text-[11px] flex items-center justify-between px-3 py-2 rounded-lg border border-border/40 text-muted-foreground hover:text-foreground hover:border-border/60 hover:bg-secondary/40 transition-all"
              >
                <span>Review backpressure events</span>
                <span className="text-primary">See more →</span>
              </button>
            </div>
          </ScrollReveal>
        </div>
      </div>

      {/* Sources + Reactive Views */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3 space-y-5">
          <ScrollReveal>
            <div className="flex items-center gap-2.5">
              <div className="flex items-center justify-center h-7 w-7 rounded-lg bg-ws-source/10">
                <Radio className="h-3.5 w-3.5 text-ws-source" />
              </div>
              <h3 className="text-sm font-semibold text-foreground font-display">Sources</h3>
              <span className="text-[10px] text-muted-foreground ml-auto font-mono">{sourceCards.length} active</span>
            </div>
          </ScrollReveal>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {sourceCards.map((s, i) => (
              <ScrollReveal key={s.name} delay={i * 80}>
                <TiltCard className="p-5" glowColor="hsl(var(--ws-source) / 0.06)" intensity={0.5}>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-sm font-semibold text-foreground">{s.name}</span>
                    <StatusDot status={s.status} />
                  </div>
                  <div className="space-y-3 text-xs">
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">TPS</span>
                      <span className="font-mono font-bold text-ws-source">{s.tps >= 1000 ? `${(s.tps / 1000).toFixed(1)}K` : s.tps.toFixed(0)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">{isLive ? 'Replication Lag' : 'Latency P99'}</span>
                      <span className="font-mono text-foreground">{s.latencyP99.toFixed(1)}ms</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Error Rate</span>
                      <span className={cn('font-mono', s.errorRate > 0.001 ? 'text-ws-error' : 'text-foreground')}>
                        {(s.errorRate * 100).toFixed(3)}%
                      </span>
                    </div>
                  </div>
                </TiltCard>
              </ScrollReveal>
            ))}
          </div>
        </div>

        <div className="lg:col-span-2 space-y-5">
          <ScrollReveal>
            <div className="flex items-center gap-2.5">
              <div className="flex items-center justify-center h-7 w-7 rounded-lg bg-ws-reactive/10">
                <Eye className="h-3.5 w-3.5 text-ws-reactive" />
              </div>
              <h3 className="text-sm font-semibold text-foreground font-display">Reactive Views</h3>
            </div>
          </ScrollReveal>
          <ScrollReveal delay={100}>
            <TiltCard className="p-6 md:p-8" glowColor="hsl(var(--ws-reactive) / 0.06)" intensity={0.4}>
              <div className="space-y-7">
                {[
                  { label: 'Active Views', value: viewsSummary.activeViews },
                  { label: 'WebSocket Connections', value: viewsSummary.wsConnections },
                  { label: 'Total Entries', value: viewsSummary.totalEntries.toLocaleString() },
                ].map((item, i) => (
                  <div key={item.label}>
                    <span className="section-label">{item.label}</span>
                    <div className="text-4xl font-bold font-mono text-ws-reactive mt-2 leading-none">{item.value}</div>
                    {i < 2 && <div className="h-px bg-gradient-to-r from-transparent via-border to-transparent mt-6" />}
                  </div>
                ))}
              </div>
            </TiltCard>
          </ScrollReveal>
        </div>
      </div>

      {/* Sinks */}
      <div className="space-y-5">
        <ScrollReveal>
          <div className="flex items-center gap-2.5">
            <div className="flex items-center justify-center h-7 w-7 rounded-lg bg-ws-sink/10">
              <Database className="h-3.5 w-3.5 text-ws-sink" />
            </div>
            <h3 className="text-sm font-semibold text-foreground font-display">Sinks</h3>
            <span className="text-[10px] text-muted-foreground ml-auto font-mono">{sinkCards.length} configured</span>
          </div>
        </ScrollReveal>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {sinkCards.map((s, i) => (
            <ScrollReveal key={s.name} delay={i * 80}>
              <TiltCard className="p-5" glowColor="hsl(var(--ws-sink) / 0.06)" intensity={0.5}>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm font-semibold text-foreground">{s.name}</span>
                  <div className="flex items-center gap-2">
                    {s.backpressure && (
                      <span className="text-[10px] px-2 py-0.5 rounded-lg bg-ws-warning/10 text-ws-warning font-semibold border border-ws-warning/15">BP</span>
                    )}
                    <StatusDot status={s.status} />
                  </div>
                </div>
                <div className="space-y-3 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">{isLive ? 'Total Written' : 'Write TPS'}</span>
                    <span className="font-mono font-bold text-ws-sink">
                      {isLive ? s.tps.toLocaleString() : `${(s.tps / 1000).toFixed(1)}K`}
                    </span>
                  </div>
                  {isLive && (
                    <>
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Last Seq</span>
                        <span className="font-mono text-foreground">{s.lastSeq.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Errors</span>
                        <span className={cn('font-mono', s.errorCount > 0 ? 'text-ws-error' : 'text-foreground')}>{s.errorCount}</span>
                      </div>
                    </>
                  )}
                </div>
              </TiltCard>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </div>
  );
}

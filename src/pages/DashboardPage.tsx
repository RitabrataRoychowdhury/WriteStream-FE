import { useLiveMetrics } from '@/hooks/useLiveMetrics';
import { useMetrics } from '@/hooks/useMetrics';
import { MetricCard } from '@/components/shared/MetricCard';
import { MiniSparkline } from '@/components/shared/MiniSparkline';
import { GaugeChart } from '@/components/shared/GaugeChart';
import { StatusDot } from '@/components/shared/StatusDot';
import { TiltCard } from '@/components/shared/TiltCard';
import { ScrollReveal } from '@/components/shared/ScrollReveal';
import { FloatingShape } from '@/components/shared/FloatingShape';
import { Activity, Zap, Clock, HardDrive, Radio, Database, Eye, ArrowUpRight, Wifi, WifiOff } from 'lucide-react';
import { cn } from '@/lib/utils';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import type { ComponentStatus } from '@/mocks/mockData';

export default function DashboardPage() {
  const live = useLiveMetrics(3000);
  const { metrics: mockMetrics } = useMetrics(2000);

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

  return (
    <div className="space-y-10 max-w-[1400px] mx-auto relative">
      <FloatingShape variant="gradient-orb" size={200} className="top-0 -right-20 opacity-60" delay={0} />
      <FloatingShape variant="ring" size={80} className="top-40 -left-10 opacity-40" delay={1200} />
      <FloatingShape variant="dot-grid" size={100} className="top-[500px] right-10 opacity-30" delay={2400} />

      {/* Header */}
      <ScrollReveal>
        <div className="flex items-end justify-between">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <div className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
              <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground font-semibold">Real-time Monitoring</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-foreground tracking-tight font-display">
              Metrics <span className="text-gradient">Dashboard</span>
            </h1>
            <p className="text-sm text-muted-foreground mt-2 font-light max-w-md">System performance overview with live telemetry from all pipeline components.</p>
          </div>
          <div className="hidden md:flex items-center gap-2 px-4 py-2.5 rounded-2xl glass-card text-xs text-muted-foreground">
            <div className="flex items-center justify-center h-6 w-6 rounded-lg" style={{ background: isLive ? 'hsl(var(--ws-success) / 0.1)' : 'hsl(var(--ws-warning) / 0.1)' }}>
              {isLive ? <Wifi className="h-3.5 w-3.5 text-ws-success" /> : <WifiOff className="h-3.5 w-3.5 text-ws-warning" />}
            </div>
            <span className="font-medium">{isLive ? 'Connected to backend' : 'Using mock data'}</span>
          </div>
        </div>
      </ScrollReveal>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <ScrollReveal delay={0}>
          <MetricCard title="Events Ingested" value={totalEventsIngested.toLocaleString()} icon={<Activity className="h-4 w-4" />} color="text-primary" glowColor="hsl(var(--primary) / 0.08)">
            <MiniSparkline data={tpsHistory.map(h => h.tps)} />
          </MetricCard>
        </ScrollReveal>
        <ScrollReveal delay={80}>
          <MetricCard title="Current TPS" value={`${(currentTps / 1000).toFixed(0)}K`} subtitle="/sec" icon={<Zap className="h-4 w-4" />} color="text-ws-hotpath" glowColor="hsl(var(--ws-hotpath) / 0.08)">
            <GaugeChart value={currentTps} max={250000} color="hsl(var(--ws-hotpath))" />
          </MetricCard>
        </ScrollReveal>
        <ScrollReveal delay={160}>
          <MetricCard title="E2E Latency P99" value={`${e2eLatencyP99.toFixed(1)}`} subtitle="ms" icon={<Clock className="h-4 w-4" />} color="text-ws-wal" glowColor="hsl(var(--ws-wal) / 0.08)" />
        </ScrollReveal>
        <ScrollReveal delay={240}>
          <MetricCard title="Backpressure Events" value={backpressure.toLocaleString()} icon={<HardDrive className="h-4 w-4" />} color="text-ws-wal" glowColor="hsl(var(--ws-wal) / 0.08)">
            {backpressure > 0 && (
              <span className="text-[10px] text-ws-warning font-medium mt-2 block">⚠ Backpressure detected</span>
            )}
          </MetricCard>
        </ScrollReveal>
      </div>

      {/* Throughput chart */}
      <ScrollReveal delay={100}>
        <TiltCard className="p-6 md:p-8" intensity={0.3}>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-base font-semibold text-foreground font-display">Throughput History</h3>
              <p className="text-xs text-muted-foreground mt-0.5">Events processed per second</p>
            </div>
            <span className="text-[10px] font-mono text-muted-foreground bg-secondary/50 px-3 py-1.5 rounded-lg border border-border/30">
              {isLive ? 'live' : 'mock'} · 30s window
            </span>
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={tpsHistory}>
              <defs>
                <linearGradient id="tpsGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.2} />
                  <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="time" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} tickFormatter={v => `${(v/1000).toFixed(0)}K`} width={40} />
              <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 14, fontSize: 12, boxShadow: 'var(--shadow-floating)', padding: '10px 14px' }} />
              <Area type="monotone" dataKey="tps" stroke="hsl(var(--primary))" fill="url(#tpsGrad)" strokeWidth={2} dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </TiltCard>
      </ScrollReveal>

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

import { useMetrics } from '@/hooks/useMetrics';
import { MetricCard } from '@/components/shared/MetricCard';
import { MiniSparkline } from '@/components/shared/MiniSparkline';
import { GaugeChart } from '@/components/shared/GaugeChart';
import { StatusDot } from '@/components/shared/StatusDot';
import { TiltCard } from '@/components/shared/TiltCard';
import { ScrollReveal } from '@/components/shared/ScrollReveal';
import { FloatingShape } from '@/components/shared/FloatingShape';
import { Activity, Zap, Clock, HardDrive, Radio, Database, Eye, ArrowUpRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

export default function DashboardPage() {
  const { metrics } = useMetrics(2000);

  return (
    <div className="space-y-10 max-w-[1400px] mx-auto relative">
      {/* Floating decorative elements */}
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
            <div className="flex items-center justify-center h-6 w-6 rounded-lg bg-ws-success/10">
              <ArrowUpRight className="h-3.5 w-3.5 text-ws-success" />
            </div>
            <span className="font-medium">All systems nominal</span>
          </div>
        </div>
      </ScrollReveal>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <ScrollReveal delay={0}>
          <MetricCard title="Events Ingested" value={metrics.totalEventsIngested.toLocaleString()} icon={<Activity className="h-4 w-4" />} color="text-primary" glowColor="hsl(var(--primary) / 0.08)">
            <MiniSparkline data={metrics.tpsHistory.map(h => h.tps)} />
          </MetricCard>
        </ScrollReveal>
        <ScrollReveal delay={80}>
          <MetricCard title="Current TPS" value={`${(metrics.currentTps / 1000).toFixed(0)}K`} subtitle="/sec" icon={<Zap className="h-4 w-4" />} color="text-ws-hotpath" glowColor="hsl(var(--ws-hotpath) / 0.08)">
            <GaugeChart value={metrics.currentTps} max={250000} color="hsl(var(--ws-hotpath))" />
          </MetricCard>
        </ScrollReveal>
        <ScrollReveal delay={160}>
          <MetricCard title="E2E Latency P99" value={`${metrics.e2eLatencyP99Ms.toFixed(1)}`} subtitle="ms" icon={<Clock className="h-4 w-4" />} color="text-ws-wal" glowColor="hsl(var(--ws-wal) / 0.08)" />
        </ScrollReveal>
        <ScrollReveal delay={240}>
          <MetricCard title="WAL Disk Usage" value={`${metrics.walDiskUsagePercent.toFixed(0)}%`} icon={<HardDrive className="h-4 w-4" />} color="text-ws-wal" glowColor="hsl(var(--ws-wal) / 0.08)">
            <div className="mt-4 h-2 rounded-full bg-secondary/40 overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-700 ease-out"
                style={{
                  width: `${metrics.walDiskUsagePercent}%`,
                  background: metrics.walDiskUsagePercent > 80
                    ? 'hsl(var(--ws-error))'
                    : metrics.walDiskUsagePercent > 60
                      ? 'hsl(var(--ws-warning))'
                      : 'linear-gradient(90deg, hsl(var(--ws-wal)), hsl(var(--primary)))'
                }}
              />
            </div>
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
            <span className="text-[10px] font-mono text-muted-foreground bg-secondary/50 px-3 py-1.5 rounded-lg border border-border/30">30s window</span>
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={metrics.tpsHistory}>
              <defs>
                <linearGradient id="tpsGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.2} />
                  <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="time" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} tickFormatter={v => `${(v/1000).toFixed(0)}K`} width={40} />
              <Tooltip
                contentStyle={{
                  background: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: 14,
                  fontSize: 12,
                  boxShadow: 'var(--shadow-floating)',
                  padding: '10px 14px',
                }}
              />
              <Area type="monotone" dataKey="tps" stroke="hsl(var(--primary))" fill="url(#tpsGrad)" strokeWidth={2} dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </TiltCard>
      </ScrollReveal>

      {/* Sources + Reactive Views — asymmetric */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3 space-y-5">
          <ScrollReveal>
            <div className="flex items-center gap-2.5">
              <div className="flex items-center justify-center h-7 w-7 rounded-lg bg-ws-source/10">
                <Radio className="h-3.5 w-3.5 text-ws-source" />
              </div>
              <h3 className="text-sm font-semibold text-foreground font-display">Sources</h3>
              <span className="text-[10px] text-muted-foreground ml-auto font-mono">{metrics.sources.length} active</span>
            </div>
          </ScrollReveal>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {metrics.sources.map((s, i) => (
              <ScrollReveal key={s.name} delay={i * 80}>
                <TiltCard className="p-5" glowColor="hsl(var(--ws-source) / 0.06)" intensity={0.5}>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-sm font-semibold text-foreground">{s.name}</span>
                    <StatusDot status={s.status} />
                  </div>
                  <div className="space-y-3 text-xs">
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">TPS</span>
                      <span className="font-mono font-bold text-ws-source">{(s.tps / 1000).toFixed(1)}K</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Latency P99</span>
                      <span className="font-mono text-foreground">{s.latencyP99Ms.toFixed(1)}ms</span>
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
                  { label: 'Active Views', value: metrics.reactive.activeViews },
                  { label: 'WebSocket Connections', value: metrics.reactive.wsConnections },
                  { label: 'Updates / sec', value: `${(metrics.reactive.updatesPerSec / 1000).toFixed(1)}K` },
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
            <span className="text-[10px] text-muted-foreground ml-auto font-mono">{metrics.sinks.length} configured</span>
          </div>
        </ScrollReveal>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {metrics.sinks.map((s, i) => (
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
                    <span className="text-muted-foreground">Write TPS</span>
                    <span className="font-mono font-bold text-ws-sink">{(s.tps / 1000).toFixed(1)}K</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Latency P99</span>
                    <span className="font-mono text-foreground">{s.latencyP99Ms.toFixed(1)}ms</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Buffer</span>
                    <span className="font-mono text-foreground">{(s.bufferUtilization * 100).toFixed(0)}%</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-secondary/40 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${s.bufferUtilization * 100}%`,
                        background: s.bufferUtilization > 0.8
                          ? 'hsl(var(--ws-error))'
                          : 'linear-gradient(90deg, hsl(var(--ws-sink)), hsl(var(--ws-shard)))'
                      }}
                    />
                  </div>
                </div>
              </TiltCard>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </div>
  );
}

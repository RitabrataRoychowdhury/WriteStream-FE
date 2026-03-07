import { useMetrics } from '@/hooks/useMetrics';
import { MetricCard } from '@/components/shared/MetricCard';
import { MiniSparkline } from '@/components/shared/MiniSparkline';
import { GaugeChart } from '@/components/shared/GaugeChart';
import { StatusDot } from '@/components/shared/StatusDot';
import { Activity, Zap, Clock, HardDrive, Radio, Database, Eye, ArrowUpRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

export default function DashboardPage() {
  const { metrics } = useMetrics(2000);

  return (
    <div className="space-y-8 max-w-[1400px] mx-auto">
      {/* Header — asymmetric */}
      <div className="flex items-end justify-between animate-fade-in">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight font-display">
            Metrics Dashboard
          </h1>
          <p className="text-sm text-muted-foreground mt-1 font-light">Real-time system performance overview</p>
        </div>
        <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl surface-card text-xs text-muted-foreground">
          <ArrowUpRight className="h-3.5 w-3.5 text-ws-success" />
          <span className="font-medium">All systems nominal</span>
        </div>
      </div>

      {/* KPI Cards — staggered grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 perspective-container stagger-children">
        <MetricCard title="Events Ingested" value={metrics.totalEventsIngested.toLocaleString()} icon={<Activity className="h-4 w-4" />} color="text-primary">
          <MiniSparkline data={metrics.tpsHistory.map(h => h.tps)} />
        </MetricCard>
        <MetricCard title="Current TPS" value={`${(metrics.currentTps / 1000).toFixed(0)}K`} subtitle="/sec" icon={<Zap className="h-4 w-4" />} color="text-ws-hotpath">
          <GaugeChart value={metrics.currentTps} max={250000} color="hsl(var(--ws-hotpath))" />
        </MetricCard>
        <MetricCard title="E2E Latency P99" value={`${metrics.e2eLatencyP99Ms.toFixed(1)}`} subtitle="ms" icon={<Clock className="h-4 w-4" />} color="text-ws-wal" />
        <MetricCard title="WAL Disk Usage" value={`${metrics.walDiskUsagePercent.toFixed(0)}%`} icon={<HardDrive className="h-4 w-4" />} color="text-ws-wal">
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
      </div>

      {/* Throughput chart — large asymmetric card */}
      <div className="card-float p-6 relative overflow-hidden animate-fade-in" style={{ animationDelay: '200ms' }}>
        <div className="absolute inset-0 shimmer pointer-events-none opacity-50" />
        <div className="flex items-center justify-between mb-5 relative z-10">
          <h3 className="text-sm font-semibold text-foreground font-display">Throughput History</h3>
          <span className="text-[10px] font-mono text-muted-foreground bg-secondary/50 px-2.5 py-1 rounded-lg">30s window</span>
        </div>
        <div className="relative z-10">
          <ResponsiveContainer width="100%" height={240}>
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
        </div>
      </div>

      {/* Sources + Sinks — asymmetric two-column */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Sources — 3 cols */}
        <div className="lg:col-span-3 space-y-4">
          <div className="flex items-center gap-2.5">
            <div className="flex items-center justify-center h-7 w-7 rounded-lg bg-ws-source/10">
              <Radio className="h-3.5 w-3.5 text-ws-source" />
            </div>
            <h3 className="text-sm font-semibold text-foreground font-display">Sources</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 perspective-container stagger-children">
            {metrics.sources.map((s) => (
              <div key={s.name} className="card-3d p-5 group">
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
              </div>
            ))}
          </div>
        </div>

        {/* Reactive Views — 2 cols, tall single card */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center gap-2.5">
            <div className="flex items-center justify-center h-7 w-7 rounded-lg bg-ws-reactive/10">
              <Eye className="h-3.5 w-3.5 text-ws-reactive" />
            </div>
            <h3 className="text-sm font-semibold text-foreground font-display">Reactive Views</h3>
          </div>
          <div className="card-float p-6 space-y-6">
            <div>
              <span className="section-label">Active Views</span>
              <div className="text-4xl font-bold font-mono text-ws-reactive mt-2 leading-none">{metrics.reactive.activeViews}</div>
            </div>
            <div className="h-px bg-gradient-to-r from-transparent via-border to-transparent" />
            <div>
              <span className="section-label">WebSocket Connections</span>
              <div className="text-4xl font-bold font-mono text-ws-reactive mt-2 leading-none">{metrics.reactive.wsConnections}</div>
            </div>
            <div className="h-px bg-gradient-to-r from-transparent via-border to-transparent" />
            <div>
              <span className="section-label">Updates / sec</span>
              <div className="text-4xl font-bold font-mono text-ws-reactive mt-2 leading-none">{(metrics.reactive.updatesPerSec / 1000).toFixed(1)}K</div>
            </div>
          </div>
        </div>
      </div>

      {/* Sinks — full width */}
      <div className="space-y-4 animate-fade-in" style={{ animationDelay: '300ms' }}>
        <div className="flex items-center gap-2.5">
          <div className="flex items-center justify-center h-7 w-7 rounded-lg bg-ws-sink/10">
            <Database className="h-3.5 w-3.5 text-ws-sink" />
          </div>
          <h3 className="text-sm font-semibold text-foreground font-display">Sinks</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 perspective-container stagger-children">
          {metrics.sinks.map((s) => (
            <div key={s.name} className="card-3d p-5 group">
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
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

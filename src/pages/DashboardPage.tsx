import { useMetrics } from '@/hooks/useMetrics';
import { MetricCard } from '@/components/shared/MetricCard';
import { MiniSparkline } from '@/components/shared/MiniSparkline';
import { GaugeChart } from '@/components/shared/GaugeChart';
import { StatusDot } from '@/components/shared/StatusDot';
import { Activity, Zap, Clock, HardDrive, Radio, Database, Eye, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

export default function DashboardPage() {
  const { metrics } = useMetrics(2000);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground tracking-tight">Metrics Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Real-time system performance</p>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <TrendingUp className="h-3.5 w-3.5 text-ws-success" />
          <span className="font-medium">All systems nominal</span>
        </div>
      </div>

      {/* Top KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard title="Events Ingested" value={metrics.totalEventsIngested.toLocaleString()} icon={<Activity className="h-4 w-4" />} color="text-primary">
          <MiniSparkline data={metrics.tpsHistory.map(h => h.tps)} />
        </MetricCard>
        <MetricCard title="Current TPS" value={`${(metrics.currentTps / 1000).toFixed(0)}K`} subtitle="/sec" icon={<Zap className="h-4 w-4" />} color="text-ws-hotpath">
          <GaugeChart value={metrics.currentTps} max={250000} color="hsl(var(--ws-hotpath))" />
        </MetricCard>
        <MetricCard title="E2E Latency P99" value={`${metrics.e2eLatencyP99Ms.toFixed(1)}`} subtitle="ms" icon={<Clock className="h-4 w-4" />} color="text-ws-wal" />
        <MetricCard title="WAL Disk Usage" value={`${metrics.walDiskUsagePercent.toFixed(0)}%`} icon={<HardDrive className="h-4 w-4" />} color="text-ws-wal">
          <div className="mt-3 h-2 rounded-full bg-secondary/50 overflow-hidden">
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

      {/* TPS History Chart */}
      <div className="glass-card p-5 relative overflow-hidden">
        <div className="absolute inset-0 shimmer pointer-events-none" />
        <h3 className="text-sm font-semibold text-foreground mb-4 relative">Throughput History</h3>
        <div className="relative">
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={metrics.tpsHistory}>
              <defs>
                <linearGradient id="tpsGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="time" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} tickFormatter={v => `${(v/1000).toFixed(0)}K`} width={40} />
              <Tooltip
                contentStyle={{
                  background: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: 10,
                  fontSize: 12,
                  boxShadow: '0 8px 32px hsl(var(--glass-shadow))'
                }}
              />
              <Area type="monotone" dataKey="tps" stroke="hsl(var(--primary))" fill="url(#tpsGrad)" strokeWidth={2} dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Sources */}
      <div>
        <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
          <div className="flex items-center justify-center h-6 w-6 rounded-md bg-ws-source/10">
            <Radio className="h-3.5 w-3.5 text-ws-source" />
          </div>
          Sources
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {metrics.sources.map((s, i) => (
            <div key={s.name} className="glass-card-hover p-4" style={{ animationDelay: `${i * 50}ms` }}>
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-semibold text-foreground">{s.name}</span>
                <StatusDot status={s.status} />
              </div>
              <div className="space-y-2 text-xs">
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

      {/* Sinks */}
      <div>
        <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
          <div className="flex items-center justify-center h-6 w-6 rounded-md bg-ws-sink/10">
            <Database className="h-3.5 w-3.5 text-ws-sink" />
          </div>
          Sinks
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {metrics.sinks.map((s, i) => (
            <div key={s.name} className="glass-card-hover p-4" style={{ animationDelay: `${i * 50}ms` }}>
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-semibold text-foreground">{s.name}</span>
                <div className="flex items-center gap-2">
                  {s.backpressure && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-ws-warning/15 text-ws-warning font-semibold border border-ws-warning/20">BP</span>
                  )}
                  <StatusDot status={s.status} />
                </div>
              </div>
              <div className="space-y-2 text-xs">
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

      {/* Reactive Views */}
      <div>
        <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
          <div className="flex items-center justify-center h-6 w-6 rounded-md bg-ws-reactive/10">
            <Eye className="h-3.5 w-3.5 text-ws-reactive" />
          </div>
          Reactive Views
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="glass-card p-4 group">
            <span className="text-[11px] text-muted-foreground font-semibold uppercase tracking-wider">Active Views</span>
            <div className="text-3xl font-bold font-mono text-ws-reactive mt-2">{metrics.reactive.activeViews}</div>
          </div>
          <div className="glass-card p-4 group">
            <span className="text-[11px] text-muted-foreground font-semibold uppercase tracking-wider">WebSocket Connections</span>
            <div className="text-3xl font-bold font-mono text-ws-reactive mt-2">{metrics.reactive.wsConnections}</div>
          </div>
          <div className="glass-card p-4 group">
            <span className="text-[11px] text-muted-foreground font-semibold uppercase tracking-wider">Updates/sec</span>
            <div className="text-3xl font-bold font-mono text-ws-reactive mt-2">{(metrics.reactive.updatesPerSec / 1000).toFixed(1)}K</div>
          </div>
        </div>
      </div>
    </div>
  );
}

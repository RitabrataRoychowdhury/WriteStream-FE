import { useMetrics } from '@/hooks/useMetrics';
import { MetricCard } from '@/components/shared/MetricCard';
import { MiniSparkline } from '@/components/shared/MiniSparkline';
import { GaugeChart } from '@/components/shared/GaugeChart';
import { StatusDot } from '@/components/shared/StatusDot';
import { Activity, Zap, Clock, HardDrive, Radio, Database, Eye } from 'lucide-react';
import { cn } from '@/lib/utils';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';

export default function DashboardPage() {
  const { metrics } = useMetrics(2000);

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-xl font-semibold text-foreground">Metrics Dashboard</h1>
        <p className="text-sm text-muted-foreground">Real-time system performance overview</p>
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
          <div className="mt-3 h-2 rounded-full bg-secondary overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-700 ease-out"
              style={{
                width: `${metrics.walDiskUsagePercent}%`,
                background: metrics.walDiskUsagePercent > 80 ? 'hsl(var(--ws-error))' : metrics.walDiskUsagePercent > 60 ? 'hsl(var(--ws-warning))' : 'hsl(var(--ws-wal))'
              }}
            />
          </div>
        </MetricCard>
      </div>

      {/* TPS History Chart */}
      <div className="glass-card p-5">
        <h3 className="text-sm font-medium text-foreground mb-4">Throughput History</h3>
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={metrics.tpsHistory}>
            <defs>
              <linearGradient id="tpsGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis dataKey="time" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} tickFormatter={v => `${(v/1000).toFixed(0)}K`} />
            <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 12 }} />
            <Area type="monotone" dataKey="tps" stroke="hsl(var(--primary))" fill="url(#tpsGrad)" strokeWidth={2} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Sources */}
      <div>
        <h3 className="text-sm font-medium text-foreground mb-3 flex items-center gap-2"><Radio className="h-4 w-4 text-ws-source" /> Sources</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {metrics.sources.map(s => (
            <div key={s.name} className="glass-card-hover p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-foreground">{s.name}</span>
                <StatusDot status={s.status} />
              </div>
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between"><span className="text-muted-foreground">TPS</span><span className="font-mono font-semibold text-ws-source">{(s.tps / 1000).toFixed(1)}K</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Latency P99</span><span className="font-mono text-foreground">{s.latencyP99Ms.toFixed(1)}ms</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Error Rate</span><span className="font-mono text-foreground">{(s.errorRate * 100).toFixed(3)}%</span></div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Sinks */}
      <div>
        <h3 className="text-sm font-medium text-foreground mb-3 flex items-center gap-2"><Database className="h-4 w-4 text-ws-sink" /> Sinks</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {metrics.sinks.map(s => (
            <div key={s.name} className="glass-card-hover p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-foreground">{s.name}</span>
                <div className="flex items-center gap-2">
                  {s.backpressure && <span className="text-[10px] px-1.5 py-0.5 rounded bg-ws-warning/20 text-ws-warning font-medium">BP</span>}
                  <StatusDot status={s.status} />
                </div>
              </div>
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between"><span className="text-muted-foreground">Write TPS</span><span className="font-mono font-semibold text-ws-sink">{(s.tps / 1000).toFixed(1)}K</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Latency P99</span><span className="font-mono text-foreground">{s.latencyP99Ms.toFixed(1)}ms</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Buffer</span><span className="font-mono text-foreground">{(s.bufferUtilization * 100).toFixed(0)}%</span></div>
                <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
                  <div className="h-full rounded-full transition-all duration-500" style={{ width: `${s.bufferUtilization * 100}%`, background: s.bufferUtilization > 0.8 ? 'hsl(var(--ws-error))' : 'hsl(var(--ws-sink))' }} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Reactive Views */}
      <div>
        <h3 className="text-sm font-medium text-foreground mb-3 flex items-center gap-2"><Eye className="h-4 w-4 text-ws-reactive" /> Reactive Views</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="glass-card p-4">
            <span className="text-xs text-muted-foreground">Active Views</span>
            <div className="text-2xl font-bold font-mono text-ws-reactive mt-1">{metrics.reactive.activeViews}</div>
          </div>
          <div className="glass-card p-4">
            <span className="text-xs text-muted-foreground">WebSocket Connections</span>
            <div className="text-2xl font-bold font-mono text-ws-reactive mt-1">{metrics.reactive.wsConnections}</div>
          </div>
          <div className="glass-card p-4">
            <span className="text-xs text-muted-foreground">Updates/sec</span>
            <div className="text-2xl font-bold font-mono text-ws-reactive mt-1">{(metrics.reactive.updatesPerSec / 1000).toFixed(1)}K</div>
          </div>
        </div>
      </div>
    </div>
  );
}

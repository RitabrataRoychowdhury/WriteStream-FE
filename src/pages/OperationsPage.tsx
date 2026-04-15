import { useState } from 'react';
import { useMetrics } from '@/hooks/useMetrics';
import { useSinks } from '@/hooks/useSinks';
import { useCdcSources } from '@/hooks/useCdcSources';
import { useViews } from '@/hooks/useViews';
import { checkHealth } from '@/api/services';
import { Button } from '@/components/ui/button';
import { StatusDot } from '@/components/shared/StatusDot';
import { TiltCard } from '@/components/shared/TiltCard';
import { ScrollReveal } from '@/components/shared/ScrollReveal';
import { FloatingShape } from '@/components/shared/FloatingShape';
import { generateWALSegments, generateAlerts, type WALSegment, type Alert } from '@/mocks/mockData';
import { AlertTriangle, CheckCircle2, BellOff, Play, Pause, RotateCcw, Settings, Heart, Wifi, WifiOff, Camera, Square } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';
import type { ComponentStatus } from '@/mocks/mockData';

export default function OperationsPage() {
  const { metrics } = useMetrics(5000);
  const { sinks, isLive: sinksLive, toggle: toggleSink } = useSinks(5000);
  const { sources: cdcSources, isLive: cdcLive, action: cdcAction } = useCdcSources(5000);
  const { views, isLive: viewsLive, snapshot } = useViews(10000);
  const [walSegments] = useState<WALSegment[]>(() => generateWALSegments());
  const [alerts, setAlerts] = useState<Alert[]>(() => generateAlerts());
  const [activeTab, setActiveTab] = useState<'health' | 'sinks' | 'cdc' | 'snapshots' | 'alerts'>('health');
  const [healthStatus, setHealthStatus] = useState<string | null>(null);

  const isLive = sinksLive || cdcLive || viewsLive;

  const runHealthCheck = async () => {
    try {
      const res = await checkHealth();
      setHealthStatus(res.ok ? 'healthy' : `error (${res.status})`);
      toast({ title: 'Health Check', description: res.ok ? 'Backend is healthy' : `Status: ${res.status}` });
    } catch {
      setHealthStatus('unreachable');
      toast({ title: 'Health Check', description: 'Backend unreachable', variant: 'destructive' });
    }
  };

  const handleSnapshot = async (name: string) => {
    const msg = await snapshot(name);
    toast({ title: 'Snapshot', description: msg || 'Failed to trigger snapshot' });
  };

  const tabs = [
    { id: 'health' as const, label: 'Health' },
    { id: 'sinks' as const, label: 'Sink Control', badge: sinks.filter(s => s.status === 'CircuitBroken').length },
    { id: 'cdc' as const, label: 'CDC Control' },
    { id: 'snapshots' as const, label: 'Snapshots' },
    { id: 'alerts' as const, label: 'Alerts', badge: alerts.filter(a => !a.acknowledged).length },
  ];

  return (
    <div className="space-y-8 max-w-[1400px] mx-auto relative">
      <FloatingShape variant="gradient-orb" size={170} className="top-0 -right-16 opacity-40" delay={0} />

      <ScrollReveal>
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
            <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground font-semibold">Administration</span>
            {isLive ? <Wifi className="h-3 w-3 text-ws-success" /> : <WifiOff className="h-3 w-3 text-ws-warning" />}
          </div>
          <h1 className="text-3xl font-bold text-foreground tracking-tight font-display">
            <span className="text-gradient">Operations</span>
          </h1>
          <p className="text-sm text-muted-foreground mt-2 font-light">System health, sink/CDC control, snapshots, and alerts.</p>
        </div>
      </ScrollReveal>

      {/* Tabs */}
      <ScrollReveal delay={60}>
        <div className="flex gap-1.5 p-1 rounded-xl bg-secondary/30 border border-border/30 w-fit">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'px-4 py-2 text-sm rounded-lg transition-all font-medium',
                activeTab === tab.id ? 'bg-background text-foreground shadow-sm border border-border/40' : 'text-muted-foreground hover:text-foreground'
              )}
            >
              {tab.label}
              {tab.badge ? (
                <span className="ml-2 inline-flex h-5 w-5 items-center justify-center rounded-full bg-ws-error/20 text-[10px] font-bold text-ws-error">{tab.badge}</span>
              ) : null}
            </button>
          ))}
        </div>
      </ScrollReveal>

      {/* Health */}
      {activeTab === 'health' && (
        <ScrollReveal>
          <TiltCard className="p-6 space-y-5" intensity={0.3}>
            <div className="flex items-center gap-2.5">
              <Heart className="h-4 w-4 text-ws-success" />
              <h3 className="text-sm font-semibold text-foreground font-display">System Health</h3>
            </div>
            <div className="flex items-center gap-4">
              <Button size="sm" className="gap-1.5" onClick={runHealthCheck}>
                <Heart className="h-3 w-3" /> Run Health Check
              </Button>
              {healthStatus && (
                <span className={cn('text-sm font-mono font-semibold',
                  healthStatus === 'healthy' ? 'text-ws-success' : 'text-ws-error'
                )}>
                  {healthStatus === 'healthy' ? '✓ Healthy' : `✗ ${healthStatus}`}
                </span>
              )}
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="glass-card p-3">
                <span className="text-[10px] text-muted-foreground block uppercase tracking-wider">Backend</span>
                <span className={cn('text-sm font-semibold mt-1 block', isLive ? 'text-ws-success' : 'text-ws-warning')}>{isLive ? 'Connected' : 'Disconnected'}</span>
              </div>
              <div className="glass-card p-3">
                <span className="text-[10px] text-muted-foreground block uppercase tracking-wider">Sinks</span>
                <span className="text-sm font-mono font-semibold text-foreground mt-1 block">{sinks.length || metrics.sinks.length}</span>
              </div>
              <div className="glass-card p-3">
                <span className="text-[10px] text-muted-foreground block uppercase tracking-wider">CDC Sources</span>
                <span className="text-sm font-mono font-semibold text-foreground mt-1 block">{cdcSources.length || metrics.sources.filter(s => s.type.startsWith('cdc')).length}</span>
              </div>
              <div className="glass-card p-3">
                <span className="text-[10px] text-muted-foreground block uppercase tracking-wider">Views</span>
                <span className="text-sm font-mono font-semibold text-foreground mt-1 block">{views.length || metrics.reactive.activeViews}</span>
              </div>
            </div>
            <div className="text-xs text-muted-foreground border-t border-border/20 pt-4">
              <p><strong>DLQ:</strong> Dead Letter Queue files are stored in <code className="font-mono bg-secondary/40 px-1 rounded">data/dlq/</code>. DLQ inspection requires file system access (no API endpoint yet).</p>
            </div>
          </TiltCard>
        </ScrollReveal>
      )}

      {/* Sink Control */}
      {activeTab === 'sinks' && (
        <div className="space-y-4">
          {(sinksLive ? sinks : metrics.sinks).map((sink, i) => {
            const s = sinksLive
              ? { name: (sink as any).name, status: ((sink as any).status === 'Enabled' ? 'healthy' : (sink as any).status === 'CircuitBroken' ? 'down' : 'disabled') as ComponentStatus, enabled: (sink as any).status === 'Enabled', circuitBroken: (sink as any).status === 'CircuitBroken' }
              : { name: (sink as any).name, status: (sink as any).status as ComponentStatus, enabled: (sink as any).enabled, circuitBroken: false };
            return (
              <ScrollReveal key={s.name} delay={i * 60}>
                <TiltCard className="p-5" intensity={0.3}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <StatusDot status={s.status} />
                      <span className="text-sm font-semibold text-foreground">{s.name}</span>
                      {s.circuitBroken && <span className="text-[10px] px-2 py-0.5 rounded-lg bg-ws-error/10 text-ws-error border border-ws-error/15 font-medium flex items-center gap-1"><AlertTriangle className="h-3 w-3" /> Circuit Broken</span>}
                    </div>
                    <div className="flex items-center gap-2">
                      <Button size="sm" variant="outline" className="h-7 text-xs gap-1" onClick={() => sinksLive && toggleSink(s.name, true)}>Enable</Button>
                      <Button size="sm" variant="outline" className="h-7 text-xs gap-1" onClick={() => sinksLive && toggleSink(s.name, false)}>Disable</Button>
                    </div>
                  </div>
                </TiltCard>
              </ScrollReveal>
            );
          })}
        </div>
      )}

      {/* CDC Control */}
      {activeTab === 'cdc' && (
        <div className="space-y-4">
          {(cdcLive ? cdcSources : metrics.sources.filter(s => s.type.startsWith('cdc'))).map((source, i) => {
            const s = cdcLive
              ? { name: (source as any).name, status: ((source as any).status === 'streaming' ? 'healthy' : 'degraded') as ComponentStatus, tps: (source as any).events_per_second, lag: (source as any).replication_lag_ms }
              : { name: (source as any).name, status: (source as any).status as ComponentStatus, tps: (source as any).tps, lag: (source as any).latencyP99Ms };
            return (
              <ScrollReveal key={s.name} delay={i * 60}>
                <TiltCard className="p-5 space-y-4" intensity={0.3}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <StatusDot status={s.status} />
                      <span className="text-sm font-semibold text-foreground">{s.name}</span>
                    </div>
                    <div className="flex items-center gap-3 text-xs font-mono text-muted-foreground">
                      <span>{s.tps.toFixed(1)} evt/s</span>
                      <span>Lag: {s.lag.toFixed(0)}ms</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button size="sm" variant="outline" className="h-7 text-xs gap-1" onClick={() => cdcLive && cdcAction(s.name, 'start')}><Play className="h-3 w-3" /> Start</Button>
                    <Button size="sm" variant="outline" className="h-7 text-xs gap-1" onClick={() => cdcLive && cdcAction(s.name, 'stop')}><Square className="h-3 w-3" /> Stop</Button>
                    <Button size="sm" variant="outline" className="h-7 text-xs gap-1" onClick={() => cdcLive && cdcAction(s.name, 'pause')}><Pause className="h-3 w-3" /> Pause</Button>
                    <Button size="sm" variant="outline" className="h-7 text-xs gap-1" onClick={() => cdcLive && cdcAction(s.name, 'resume')}><RotateCcw className="h-3 w-3" /> Resume</Button>
                    {!cdcLive && <span className="text-[10px] text-muted-foreground ml-2">Requires backend</span>}
                  </div>
                </TiltCard>
              </ScrollReveal>
            );
          })}
        </div>
      )}

      {/* Snapshots */}
      {activeTab === 'snapshots' && (
        <div className="space-y-4">
          <ScrollReveal>
            <TiltCard className="p-6 space-y-4" intensity={0.2}>
              <h3 className="text-sm font-semibold text-foreground font-display flex items-center gap-2">
                <Camera className="h-4 w-4 text-ws-reactive" /> View Snapshots
              </h3>
              <p className="text-xs text-muted-foreground">Trigger a point-in-time snapshot for persistent views.</p>
              <div className="space-y-3">
                {(viewsLive ? views : [{ name: 'account_balances' }, { name: 'order_stats' }]).map(v => (
                  <div key={v.name} className="flex items-center justify-between py-3 border-b border-border/20 last:border-0">
                    <span className="text-sm font-mono text-foreground">{v.name}</span>
                    <Button size="sm" variant="outline" className="h-7 text-xs gap-1" onClick={() => handleSnapshot(v.name)}>
                      <Camera className="h-3 w-3" /> Snapshot
                    </Button>
                  </div>
                ))}
              </div>
            </TiltCard>
          </ScrollReveal>
        </div>
      )}

      {/* Alerts */}
      {activeTab === 'alerts' && (
        <div className="space-y-3">
          {alerts.map((alert, i) => (
            <ScrollReveal key={alert.id} delay={i * 40}>
              <TiltCard
                className={cn('overflow-hidden border-l-4', alert.severity === 'critical' ? 'border-l-ws-error' : alert.severity === 'warning' ? 'border-l-ws-warning' : 'border-l-ws-info')}
                intensity={0.2}
              >
                <div className="p-5">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <AlertTriangle className={cn('h-4 w-4 mt-0.5', alert.severity === 'critical' ? 'text-ws-error' : alert.severity === 'warning' ? 'text-ws-warning' : 'text-ws-info')} />
                      <div>
                        <div className="text-sm font-semibold text-foreground">{alert.title}</div>
                        <div className="text-xs text-muted-foreground mt-1">{alert.message}</div>
                        <div className="text-[10px] text-muted-foreground/50 mt-2 font-mono">{alert.component} · {new Date(alert.timestamp).toLocaleTimeString()}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      {alert.acknowledged ? (
                        <span className="text-[10px] text-ws-success flex items-center gap-1 font-medium"><CheckCircle2 className="h-3 w-3" /> Acknowledged</span>
                      ) : (
                        <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => setAlerts(a => a.map(al => al.id === alert.id ? { ...al, acknowledged: true } : al))}>Acknowledge</Button>
                      )}
                    </div>
                  </div>
                </div>
              </TiltCard>
            </ScrollReveal>
          ))}
        </div>
      )}
    </div>
  );
}

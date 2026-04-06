import { useState } from 'react';
import { useMetrics } from '@/hooks/useMetrics';
import { Button } from '@/components/ui/button';
import { StatusDot } from '@/components/shared/StatusDot';
import { TiltCard } from '@/components/shared/TiltCard';
import { ScrollReveal } from '@/components/shared/ScrollReveal';
import { FloatingShape } from '@/components/shared/FloatingShape';
import { generateWALSegments, generateAlerts, type WALSegment, type Alert } from '@/mocks/mockData';
import { AlertTriangle, CheckCircle2, BellOff, Trash2, Play, Pause, RotateCcw, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function OperationsPage() {
  const { metrics } = useMetrics(5000);
  const [walSegments] = useState<WALSegment[]>(() => generateWALSegments());
  const [alerts, setAlerts] = useState<Alert[]>(() => generateAlerts());
  const [activeTab, setActiveTab] = useState<'wal' | 'alerts' | 'checkpoint' | 'cdc'>('wal');

  const tabs = [
    { id: 'wal' as const, label: 'WAL Management' },
    { id: 'alerts' as const, label: 'Alerts', badge: alerts.filter(a => !a.acknowledged).length },
    { id: 'checkpoint' as const, label: 'Checkpoint' },
    { id: 'cdc' as const, label: 'CDC Management' },
  ];

  return (
    <div className="space-y-8 max-w-[1400px] mx-auto relative">
      <FloatingShape variant="gradient-orb" size={170} className="top-0 -right-16 opacity-40" delay={0} />

      {/* Header */}
      <ScrollReveal>
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
            <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground font-semibold">Administration</span>
          </div>
          <h1 className="text-3xl font-bold text-foreground tracking-tight font-display">
            <span className="text-gradient">Operations</span>
          </h1>
          <p className="text-sm text-muted-foreground mt-2 font-light">System administration, WAL management, and alerting.</p>
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
                activeTab === tab.id
                  ? 'bg-background text-foreground shadow-sm border border-border/40'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              {tab.label}
              {tab.badge ? (
                <span className="ml-2 inline-flex h-5 w-5 items-center justify-center rounded-full bg-ws-error/20 text-[10px] font-bold text-ws-error">
                  {tab.badge}
                </span>
              ) : null}
            </button>
          ))}
        </div>
      </ScrollReveal>

      {/* WAL Management */}
      {activeTab === 'wal' && (
        <div className="space-y-5">
          <ScrollReveal delay={80}>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { label: 'Segments', value: metrics.wal.segmentCount, color: 'text-ws-wal' },
                { label: 'Disk Usage', value: `${metrics.wal.diskUsageGB.toFixed(1)} GB`, color: 'text-foreground' },
                { label: 'Fsync Latency', value: `${metrics.wal.fsyncLatencyMs.toFixed(2)}ms`, color: 'text-foreground' },
                { label: 'Oldest Segment', value: metrics.wal.oldestSegmentAge, color: 'text-foreground' },
              ].map(stat => (
                <TiltCard key={stat.label} className="p-5" glowColor="hsl(var(--ws-wal) / 0.05)" intensity={0.4}>
                  <span className="text-[10px] text-muted-foreground uppercase tracking-wider">{stat.label}</span>
                  <div className={`text-2xl font-bold font-mono ${stat.color} mt-2`}>{stat.value}</div>
                </TiltCard>
              ))}
            </div>
          </ScrollReveal>

          <div className="flex items-center gap-2">
            <Button size="sm" variant="destructive" className="gap-1.5"><Trash2 className="h-3 w-3" /> Compact WAL</Button>
          </div>

          <TiltCard className="overflow-hidden" intensity={0.2}>
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border/30">
                  <th className="text-left p-4 text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Segment ID</th>
                  <th className="text-left p-4 text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Size</th>
                  <th className="text-left p-4 text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Age</th>
                  <th className="text-left p-4 text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Seq Range</th>
                  <th className="text-left p-4 text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Status</th>
                </tr>
              </thead>
              <tbody>
                {walSegments.map(seg => (
                  <tr key={seg.id} className="border-b border-border/20 hover:bg-secondary/10 transition-colors">
                    <td className="p-4 font-mono text-foreground">{seg.id}</td>
                    <td className="p-4 font-mono text-foreground">{seg.size}</td>
                    <td className="p-4 text-muted-foreground">{seg.age}</td>
                    <td className="p-4 font-mono text-muted-foreground">{seg.seqStart.toLocaleString()} – {seg.seqEnd.toLocaleString()}</td>
                    <td className="p-4">
                      <span className={cn('text-[10px] px-2 py-0.5 rounded-lg font-medium border',
                        seg.status === 'active' ? 'bg-ws-success/10 text-ws-success border-ws-success/15' :
                        seg.status === 'compactable' ? 'bg-ws-warning/10 text-ws-warning border-ws-warning/15' :
                        'bg-secondary text-muted-foreground border-border/30'
                      )}>{seg.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </TiltCard>
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
                        <>
                          <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => setAlerts(a => a.map(al => al.id === alert.id ? { ...al, acknowledged: true } : al))}>Acknowledge</Button>
                          <Button size="sm" variant="ghost" className="h-7 w-7 p-0"><BellOff className="h-3 w-3" /></Button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </TiltCard>
            </ScrollReveal>
          ))}
        </div>
      )}

      {/* Checkpoint */}
      {activeTab === 'checkpoint' && (
        <ScrollReveal>
          <TiltCard className="p-6 space-y-5" intensity={0.3}>
            <div className="flex items-center gap-2.5">
              <div className="flex items-center justify-center h-7 w-7 rounded-lg bg-ws-success/10">
                <Settings className="h-3.5 w-3.5 text-ws-success" />
              </div>
              <h3 className="text-sm font-semibold text-foreground font-display">Checkpoint Status</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="glass-card p-4">
                <span className="text-[10px] text-muted-foreground uppercase tracking-wider block">Current Sequence</span>
                <span className="text-2xl font-mono font-bold text-foreground mt-2 block">1,400,000</span>
              </div>
              <div className="glass-card p-4">
                <span className="text-[10px] text-muted-foreground uppercase tracking-wider block">Safe Truncation Point</span>
                <span className="text-2xl font-mono font-bold text-ws-success mt-2 block">1,285,000</span>
              </div>
            </div>
            <div className="space-y-2">
              <span className="section-label">Per-Sink Acknowledged</span>
              {metrics.sinks.map(s => (
                <div key={s.name} className="flex items-center justify-between py-2 border-b border-border/20 last:border-b-0">
                  <span className="text-xs text-foreground font-medium">{s.name}</span>
                  <span className="text-xs font-mono text-muted-foreground">{(1400000 - Math.floor(Math.random() * 100000)).toLocaleString()}</span>
                </div>
              ))}
            </div>
          </TiltCard>
        </ScrollReveal>
      )}

      {/* CDC Management */}
      {activeTab === 'cdc' && (
        <div className="space-y-4">
          {metrics.sources.filter(s => s.type.startsWith('cdc')).map((source, i) => (
            <ScrollReveal key={source.name} delay={i * 60}>
              <TiltCard className="p-5 space-y-4" glowColor="hsl(var(--ws-source) / 0.05)" intensity={0.3}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <StatusDot status={source.status} />
                    <span className="text-sm font-semibold text-foreground">{source.name}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-lg bg-ws-success/10 text-ws-success border border-ws-success/15 font-medium">Streaming</span>
                  </div>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {[
                    { label: 'Events/sec', value: `${(source.tps / 1000).toFixed(1)}K`, bold: true },
                    { label: 'Replication Lag', value: `${source.extra.replicationLagMs}ms` },
                    { label: 'Position', value: (source.extra.position || source.extra.lsn) as string, small: true },
                    { label: 'Error Rate', value: `${(source.errorRate * 100).toFixed(3)}%` },
                  ].map(stat => (
                    <div key={stat.label} className="glass-card p-3">
                      <span className="text-[10px] text-muted-foreground block uppercase tracking-wider">{stat.label}</span>
                      <span className={cn('font-mono mt-1 block', stat.bold ? 'text-sm font-semibold text-foreground' : stat.small ? 'text-[10px] text-foreground' : 'text-sm text-foreground')}>{stat.value}</span>
                    </div>
                  ))}
                </div>
                <div className="flex items-center gap-2 pt-3 border-t border-border/20">
                  <Button size="sm" variant="outline" className="gap-1.5 h-7 text-xs"><Play className="h-3 w-3" /> Start</Button>
                  <Button size="sm" variant="outline" className="gap-1.5 h-7 text-xs"><Pause className="h-3 w-3" /> Pause</Button>
                  <Button size="sm" variant="outline" className="gap-1.5 h-7 text-xs"><RotateCcw className="h-3 w-3" /> Reset Position</Button>
                </div>
              </TiltCard>
            </ScrollReveal>
          ))}
        </div>
      )}
    </div>
  );
}

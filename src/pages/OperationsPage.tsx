import { useState } from 'react';
import { useMetrics } from '@/hooks/useMetrics';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { StatusDot } from '@/components/shared/StatusDot';
import { generateWALSegments, generateAlerts, type WALSegment, type Alert } from '@/mocks/mockData';
import { HardDrive, AlertTriangle, CheckCircle2, Bell, BellOff, Trash2, Play, Pause, RotateCcw } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function OperationsPage() {
  const { metrics } = useMetrics(5000);
  const [walSegments] = useState<WALSegment[]>(() => generateWALSegments());
  const [alerts, setAlerts] = useState<Alert[]>(() => generateAlerts());
  const [activeTab, setActiveTab] = useState<'wal' | 'alerts' | 'checkpoint' | 'cdc'>('wal');

  const tabs = [
    { id: 'wal' as const, label: 'WAL Management' },
    { id: 'alerts' as const, label: 'Alerts' },
    { id: 'checkpoint' as const, label: 'Checkpoint' },
    { id: 'cdc' as const, label: 'CDC Management' },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-xl font-semibold text-foreground">Operations</h1>
        <p className="text-sm text-muted-foreground">System administration and management</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-border/50 pb-px">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn('px-4 py-2 text-sm rounded-t-lg transition-colors', activeTab === tab.id ? 'bg-card text-foreground font-medium border border-border/50 border-b-transparent' : 'text-muted-foreground hover:text-foreground')}
          >
            {tab.label}
            {tab.id === 'alerts' && alerts.filter(a => !a.acknowledged).length > 0 && (
              <span className="ml-2 inline-flex h-5 w-5 items-center justify-center rounded-full bg-ws-error/20 text-[10px] font-bold text-ws-error">
                {alerts.filter(a => !a.acknowledged).length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* WAL Management */}
      {activeTab === 'wal' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div className="glass-card p-4">
              <span className="text-xs text-muted-foreground">Segments</span>
              <div className="text-2xl font-bold font-mono text-ws-wal mt-1">{metrics.wal.segmentCount}</div>
            </div>
            <div className="glass-card p-4">
              <span className="text-xs text-muted-foreground">Disk Usage</span>
              <div className="text-2xl font-bold font-mono text-foreground mt-1">{metrics.wal.diskUsageGB.toFixed(1)} GB</div>
            </div>
            <div className="glass-card p-4">
              <span className="text-xs text-muted-foreground">Fsync Latency</span>
              <div className="text-2xl font-bold font-mono text-foreground mt-1">{metrics.wal.fsyncLatencyMs.toFixed(2)}ms</div>
            </div>
            <div className="glass-card p-4">
              <span className="text-xs text-muted-foreground">Oldest Segment</span>
              <div className="text-2xl font-bold font-mono text-foreground mt-1">{metrics.wal.oldestSegmentAge}</div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button size="sm" variant="destructive" className="gap-1.5"><Trash2 className="h-3 w-3" /> Compact WAL</Button>
          </div>

          <div className="glass-card overflow-hidden">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border/50">
                  <th className="text-left p-3 text-muted-foreground font-medium">Segment ID</th>
                  <th className="text-left p-3 text-muted-foreground font-medium">Size</th>
                  <th className="text-left p-3 text-muted-foreground font-medium">Age</th>
                  <th className="text-left p-3 text-muted-foreground font-medium">Seq Range</th>
                  <th className="text-left p-3 text-muted-foreground font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {walSegments.map(seg => (
                  <tr key={seg.id} className="border-b border-border/30 hover:bg-secondary/20">
                    <td className="p-3 font-mono text-foreground">{seg.id}</td>
                    <td className="p-3 font-mono text-foreground">{seg.size}</td>
                    <td className="p-3 text-muted-foreground">{seg.age}</td>
                    <td className="p-3 font-mono text-muted-foreground">{seg.seqStart.toLocaleString()} - {seg.seqEnd.toLocaleString()}</td>
                    <td className="p-3">
                      <span className={cn('text-[10px] px-2 py-0.5 rounded font-medium',
                        seg.status === 'active' ? 'bg-ws-success/20 text-ws-success' :
                        seg.status === 'compactable' ? 'bg-ws-warning/20 text-ws-warning' :
                        'bg-secondary text-muted-foreground'
                      )}>{seg.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Alerts */}
      {activeTab === 'alerts' && (
        <div className="space-y-3">
          {alerts.map(alert => (
            <div key={alert.id} className={cn('glass-card p-4 border-l-4', alert.severity === 'critical' ? 'border-l-ws-error' : alert.severity === 'warning' ? 'border-l-ws-warning' : 'border-l-ws-info')}>
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <AlertTriangle className={cn('h-4 w-4 mt-0.5', alert.severity === 'critical' ? 'text-ws-error' : alert.severity === 'warning' ? 'text-ws-warning' : 'text-ws-info')} />
                  <div>
                    <div className="text-sm font-medium text-foreground">{alert.title}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">{alert.message}</div>
                    <div className="text-[10px] text-muted-foreground/60 mt-1">{alert.component} · {new Date(alert.timestamp).toLocaleTimeString()}</div>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  {alert.acknowledged ? (
                    <span className="text-[10px] text-ws-success flex items-center gap-1"><CheckCircle2 className="h-3 w-3" /> Ack</span>
                  ) : (
                    <>
                      <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => setAlerts(a => a.map(al => al.id === alert.id ? { ...al, acknowledged: true } : al))}>Acknowledge</Button>
                      <Button size="sm" variant="ghost" className="h-7 w-7 p-0"><BellOff className="h-3 w-3" /></Button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Checkpoint */}
      {activeTab === 'checkpoint' && (
        <div className="space-y-4">
          <div className="glass-card p-5 space-y-4">
            <h3 className="text-sm font-semibold text-foreground">Checkpoint Status</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <span className="text-xs text-muted-foreground block mb-1">Current Sequence</span>
                <span className="text-lg font-mono font-bold text-foreground">1,400,000</span>
              </div>
              <div>
                <span className="text-xs text-muted-foreground block mb-1">Safe Truncation Point</span>
                <span className="text-lg font-mono font-bold text-ws-success">1,285,000</span>
              </div>
            </div>
            <div className="space-y-2">
              <span className="text-xs text-muted-foreground block">Per-Sink Acknowledged</span>
              {metrics.sinks.map(s => (
                <div key={s.name} className="flex items-center justify-between py-1.5">
                  <span className="text-xs text-foreground">{s.name}</span>
                  <span className="text-xs font-mono text-muted-foreground">{(1400000 - Math.floor(Math.random() * 100000)).toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* CDC Management */}
      {activeTab === 'cdc' && (
        <div className="space-y-3">
          {metrics.sources.filter(s => s.type.startsWith('cdc')).map(source => (
            <div key={source.name} className="glass-card p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <StatusDot status={source.status} />
                  <span className="text-sm font-medium text-foreground">{source.name}</span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-ws-success/20 text-ws-success font-medium">Streaming</span>
                </div>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div><span className="text-muted-foreground block">Events/sec</span><span className="font-mono font-semibold text-foreground">{(source.tps / 1000).toFixed(1)}K</span></div>
                <div><span className="text-muted-foreground block">Replication Lag</span><span className="font-mono text-foreground">{source.extra.replicationLagMs}ms</span></div>
                <div><span className="text-muted-foreground block">Position</span><span className="font-mono text-foreground text-[10px]">{source.extra.position || source.extra.lsn}</span></div>
                <div><span className="text-muted-foreground block">Error Rate</span><span className="font-mono text-foreground">{(source.errorRate * 100).toFixed(3)}%</span></div>
              </div>
              <div className="flex items-center gap-2 pt-2 border-t border-border/30">
                <Button size="sm" variant="outline" className="gap-1.5 h-7 text-xs"><Play className="h-3 w-3" /> Start</Button>
                <Button size="sm" variant="outline" className="gap-1.5 h-7 text-xs"><Pause className="h-3 w-3" /> Pause</Button>
                <Button size="sm" variant="outline" className="gap-1.5 h-7 text-xs"><RotateCcw className="h-3 w-3" /> Reset Position</Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

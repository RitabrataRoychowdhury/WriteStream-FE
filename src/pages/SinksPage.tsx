import { useSinks } from '@/hooks/useSinks';
import { useMetrics } from '@/hooks/useMetrics';
import { StatusDot } from '@/components/shared/StatusDot';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { TiltCard } from '@/components/shared/TiltCard';
import { ScrollReveal } from '@/components/shared/ScrollReveal';
import { FloatingShape } from '@/components/shared/FloatingShape';
import { Database, Plus, Wifi, WifiOff, AlertTriangle } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import type { ComponentStatus } from '@/mocks/mockData';

export default function SinksPage() {
  const { sinks: liveSinks, isLive, toggle } = useSinks(5000);
  const { metrics: mockMetrics } = useMetrics(3000);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [showYamlPreview, setShowYamlPreview] = useState(false);
  const [newSink, setNewSink] = useState({
    type: 'postgresql', host: '', port: '5432', user: '', password: '', database: '', table: '', pool_size: '8', batch_size: '5000', batch_timeout_ms: '100',
  });

  const sinks = isLive && liveSinks.length > 0
    ? liveSinks.map(s => ({
        name: s.name,
        status: (s.status === 'Enabled' ? 'healthy' : s.status === 'CircuitBroken' ? 'down' : 'disabled') as ComponentStatus,
        enabled: s.status === 'Enabled',
        lastSeq: s.last_acknowledged_sequence,
        errorCount: s.error_count,
        circuitBroken: s.status === 'CircuitBroken',
      }))
    : mockMetrics.sinks.map(s => ({
        name: s.name,
        status: s.status,
        enabled: s.enabled,
        lastSeq: 0,
        errorCount: 0,
        circuitBroken: false,
      }));

  const generateYaml = () => {
    const s = newSink;
    return `sinks:\n  - name: ${s.type}_sink\n    type: ${s.type}\n    connection:\n      host: "${s.host}"\n      port: ${s.port}\n      user: "${s.user}"\n      password: "${s.password}"\n      database: "${s.database}"\n      table: "${s.table}"\n    pool_size: ${s.pool_size}\n    batch_size: ${s.batch_size}\n    batch_timeout_ms: ${s.batch_timeout_ms}`;
  };

  return (
    <div className="space-y-8 max-w-[1400px] mx-auto relative">
      <FloatingShape variant="gradient-orb" size={160} className="top-10 -right-12 opacity-50" delay={300} />
      <FloatingShape variant="dot-grid" size={90} className="top-[400px] -left-6 opacity-25" delay={1800} />

      {/* Header */}
      <ScrollReveal>
        <div className="flex items-end justify-between">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <div className="h-1.5 w-1.5 rounded-full bg-ws-sink animate-pulse" />
              <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground font-semibold">Downstream</span>
              {isLive ? <Wifi className="h-3 w-3 text-ws-success" /> : <WifiOff className="h-3 w-3 text-ws-warning" />}
            </div>
            <h1 className="text-3xl font-bold text-foreground tracking-tight font-display">
              Sinks <span className="text-gradient">Configuration</span>
            </h1>
            <p className="text-sm text-muted-foreground mt-2 font-light">Manage downstream database sinks. Enable/disable via the admin API.</p>
          </div>
          <div className="flex items-center gap-3">
            <Button size="sm" variant="outline" className="gap-1.5" onClick={() => setShowYamlPreview(!showYamlPreview)}>
              <Plus className="h-3.5 w-3.5" /> New Sink Config
            </Button>
            <div className="hidden md:flex items-center gap-2 px-4 py-2.5 rounded-2xl glass-card text-xs text-muted-foreground">
              <Database className="h-3.5 w-3.5 text-ws-sink" />
              <span className="font-mono font-bold text-foreground">{sinks.length}</span>
              <span>configured</span>
            </div>
          </div>
        </div>
      </ScrollReveal>

      {/* YAML generator */}
      {showYamlPreview && (
        <ScrollReveal>
          <TiltCard className="p-6 space-y-5" intensity={0.2}>
            <h3 className="text-sm font-semibold text-foreground font-display">Generate Sink Config (YAML)</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-4">
                <div>
                  <label className="section-label mb-1.5 block">Sink Type</label>
                  <select value={newSink.type} onChange={e => setNewSink(s => ({ ...s, type: e.target.value }))} className="h-9 w-full rounded-lg border border-border/40 bg-background/80 px-3 text-sm text-foreground">
                    <option value="postgresql">PostgreSQL</option>
                    <option value="mysql">MySQL</option>
                    <option value="clickhouse">ClickHouse</option>
                    <option value="kafka">Kafka</option>
                  </select>
                </div>
                {[
                  { label: 'Host', key: 'host' }, { label: 'Port', key: 'port' },
                  { label: 'User', key: 'user' }, { label: 'Database', key: 'database' },
                  { label: 'Table', key: 'table' }, { label: 'Pool Size', key: 'pool_size' },
                  { label: 'Batch Size', key: 'batch_size' }, { label: 'Batch Timeout (ms)', key: 'batch_timeout_ms' },
                ].map(f => (
                  <div key={f.key}>
                    <label className="section-label mb-1.5 block">{f.label}</label>
                    <Input value={(newSink as Record<string, string>)[f.key]} onChange={e => setNewSink(s => ({ ...s, [f.key]: e.target.value }))} className="h-9 text-sm bg-background/80 border-border/40" />
                  </div>
                ))}
              </div>
              <div>
                <label className="section-label mb-1.5 block">YAML Config Preview</label>
                <pre className="text-xs font-mono bg-background/60 rounded-xl p-4 text-muted-foreground border border-border/30 whitespace-pre overflow-auto h-full min-h-[300px]">{generateYaml()}</pre>
              </div>
            </div>
          </TiltCard>
        </ScrollReveal>
      )}

      {/* Sink Cards */}
      <div className="space-y-4">
        {sinks.map((sink, i) => {
          const isExpanded = expanded === sink.name;
          return (
            <ScrollReveal key={sink.name} delay={i * 60}>
              <TiltCard className="overflow-hidden" glowColor="hsl(var(--ws-sink) / 0.05)" intensity={0.3}>
                <div className="flex items-center justify-between p-5 cursor-pointer" onClick={() => setExpanded(isExpanded ? null : sink.name)}>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center h-7 w-7 rounded-lg bg-ws-sink/10">
                      <Database className="h-3.5 w-3.5 text-ws-sink" />
                    </div>
                    <StatusDot status={sink.status} />
                    <span className="text-sm font-semibold text-foreground">{sink.name}</span>
                    {sink.circuitBroken && (
                      <span className="text-[10px] px-2 py-0.5 rounded-lg bg-ws-error/10 text-ws-error font-semibold border border-ws-error/15 flex items-center gap-1">
                        <AlertTriangle className="h-3 w-3" /> Circuit Broken
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-5">
                    {isLive && (
                      <div className="text-right">
                        <div className="text-xs font-mono text-muted-foreground">Seq: {sink.lastSeq.toLocaleString()}</div>
                        <div className="text-[10px] text-muted-foreground">Errors: {sink.errorCount}</div>
                      </div>
                    )}
                    <Switch
                      checked={sink.enabled}
                      onCheckedChange={(checked) => isLive && toggle(sink.name, checked)}
                    />
                  </div>
                </div>

                {isExpanded && (
                  <div className="border-t border-border/30 p-5 space-y-4" style={{ background: 'hsl(var(--secondary) / 0.15)' }}>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      <div className="glass-card p-3">
                        <span className="text-[10px] text-muted-foreground block uppercase tracking-wider">Status</span>
                        <span className={cn('text-sm font-semibold mt-1 block', sink.status === 'healthy' ? 'text-ws-success' : sink.status === 'down' ? 'text-ws-error' : 'text-muted-foreground')}>
                          {sink.enabled ? (sink.circuitBroken ? 'Circuit Broken' : 'Enabled') : 'Disabled'}
                        </span>
                      </div>
                      <div className="glass-card p-3">
                        <span className="text-[10px] text-muted-foreground block uppercase tracking-wider">Last Acknowledged Seq</span>
                        <span className="text-sm font-mono font-semibold text-foreground mt-1 block">{sink.lastSeq.toLocaleString()}</span>
                      </div>
                      <div className="glass-card p-3">
                        <span className="text-[10px] text-muted-foreground block uppercase tracking-wider">Error Count</span>
                        <span className={cn('text-sm font-mono font-semibold mt-1 block', sink.errorCount > 0 ? 'text-ws-error' : 'text-foreground')}>{sink.errorCount}</span>
                      </div>
                    </div>
                    {!isLive && <p className="text-[10px] text-muted-foreground">Connect to the backend to enable/disable sinks via the admin API.</p>}
                  </div>
                )}
              </TiltCard>
            </ScrollReveal>
          );
        })}
      </div>
    </div>
  );
}

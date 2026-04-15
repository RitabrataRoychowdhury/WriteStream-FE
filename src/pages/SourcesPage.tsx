import { useState } from 'react';
import { useCdcSources } from '@/hooks/useCdcSources';
import { useMetrics } from '@/hooks/useMetrics';
import { StatusDot } from '@/components/shared/StatusDot';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { TiltCard } from '@/components/shared/TiltCard';
import { ScrollReveal } from '@/components/shared/ScrollReveal';
import { FloatingShape } from '@/components/shared/FloatingShape';
import { Radio, ChevronDown, ChevronRight, CheckCircle2, XCircle, Zap, Plus, Wifi, WifiOff, Play, Pause, Square, RotateCcw } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ComponentStatus } from '@/mocks/mockData';

export default function SourcesPage() {
  const { sources: liveSources, isLive, action } = useCdcSources(5000);
  const { metrics: mockMetrics } = useMetrics(3000);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [showYamlPreview, setShowYamlPreview] = useState(false);
  const [newSource, setNewSource] = useState({
    name: '', type: 'postgresql', host: '', port: '5432', user: '', password: '', database: '',
    publication_name: '', slot_name: '', server_id: '', include_tables: '', snapshot_mode: 'initial',
  });

  // Merge live + mock
  const sources = isLive && liveSources.length > 0
    ? liveSources.map(s => ({
        name: s.name,
        type: s.source_type,
        status: (s.status === 'streaming' ? 'healthy' : s.status === 'stopped' ? 'disabled' : 'degraded') as ComponentStatus,
        enabled: s.enabled,
        tps: s.events_per_second,
        latencyP99Ms: s.replication_lag_ms,
        totalEvents: s.total_events,
      }))
    : mockMetrics.sources.map(s => ({
        name: s.name,
        type: s.type.replace('cdc_', ''),
        status: s.status,
        enabled: s.enabled,
        tps: s.tps,
        latencyP99Ms: s.latencyP99Ms,
        totalEvents: 0,
      }));

  const totalTps = sources.reduce((sum, s) => sum + s.tps, 0);

  const generateYaml = () => {
    const s = newSource;
    let yaml = `cdc_sources:\n  - name: ${s.name || '<name>'}\n    type: ${s.type}\n    connection:\n      host: "${s.host}"\n      port: ${s.port}\n      user: "${s.user}"\n      password: "${s.password}"\n      database: "${s.database}"`;
    if (s.type === 'postgresql') {
      yaml += `\n    publication_name: "${s.publication_name || 'writestream_pub'}"\n    slot_name: "${s.slot_name || 'writestream_slot'}"`;
    }
    if (s.type === 'mysql') {
      yaml += `\n    server_id: ${s.server_id || '1001'}`;
    }
    if (s.include_tables) {
      yaml += `\n    include_tables:\n${s.include_tables.split(',').map(t => `      - "${t.trim()}"`).join('\n')}`;
    }
    yaml += `\n    snapshot:\n      mode: ${s.snapshot_mode}`;
    return yaml;
  };

  return (
    <div className="space-y-8 max-w-[1400px] mx-auto relative">
      <FloatingShape variant="gradient-orb" size={180} className="top-0 -right-16 opacity-50" delay={0} />
      <FloatingShape variant="ring" size={60} className="top-60 -left-8 opacity-30" delay={1500} />

      {/* Header */}
      <ScrollReveal>
        <div className="flex items-end justify-between">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <div className="h-1.5 w-1.5 rounded-full bg-ws-source animate-pulse" />
              <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground font-semibold">Data Ingestion</span>
              {isLive ? <Wifi className="h-3 w-3 text-ws-success" /> : <WifiOff className="h-3 w-3 text-ws-warning" />}
            </div>
            <h1 className="text-3xl font-bold text-foreground tracking-tight font-display">
              Sources <span className="text-gradient">Configuration</span>
            </h1>
            <p className="text-sm text-muted-foreground mt-2 font-light">Manage data ingestion sources and CDC connections.</p>
          </div>
          <div className="flex items-center gap-3">
            <Button size="sm" variant="outline" className="gap-1.5" onClick={() => setShowYamlPreview(!showYamlPreview)}>
              <Plus className="h-3.5 w-3.5" /> New Source Config
            </Button>
            <div className="hidden md:flex items-center gap-4 px-4 py-2.5 rounded-2xl glass-card text-xs">
              <div className="flex items-center gap-2">
                <Zap className="h-3.5 w-3.5 text-ws-source" />
                <span className="font-mono font-bold text-foreground">{totalTps >= 1000 ? `${(totalTps / 1000).toFixed(0)}K` : totalTps.toFixed(0)}</span>
                <span className="text-muted-foreground">total events/s</span>
              </div>
            </div>
          </div>
        </div>
      </ScrollReveal>

      {/* New source YAML config generator */}
      {showYamlPreview && (
        <ScrollReveal>
          <TiltCard className="p-6 space-y-5" intensity={0.2}>
            <h3 className="text-sm font-semibold text-foreground font-display">Generate Source Config (YAML)</h3>
            <p className="text-xs text-muted-foreground">Source creation requires adding this to your YAML config file and restarting. The admin API only supports start/stop/pause/resume of existing sources.</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-4">
                <div>
                  <label className="section-label mb-1.5 block">Source Name</label>
                  <Input value={newSource.name} onChange={e => setNewSource(s => ({ ...s, name: e.target.value }))} placeholder="e.g. my_postgres_cdc" className="h-9 text-sm bg-background/80 border-border/40" />
                </div>
                <div>
                  <label className="section-label mb-1.5 block">Type</label>
                  <select value={newSource.type} onChange={e => setNewSource(s => ({ ...s, type: e.target.value }))} className="h-9 w-full rounded-lg border border-border/40 bg-background/80 px-3 text-sm text-foreground">
                    <option value="postgresql">PostgreSQL</option>
                    <option value="mysql">MySQL</option>
                    <option value="mongodb">MongoDB</option>
                  </select>
                </div>
                {[
                  { label: 'Host', key: 'host', placeholder: '10.0.1.50' },
                  { label: 'Port', key: 'port', placeholder: '5432' },
                  { label: 'User', key: 'user', placeholder: 'replicator' },
                  { label: 'Database', key: 'database', placeholder: 'mydb' },
                  { label: 'Include Tables (comma-separated)', key: 'include_tables', placeholder: 'users, orders' },
                ].map(f => (
                  <div key={f.key}>
                    <label className="section-label mb-1.5 block">{f.label}</label>
                    <Input value={(newSource as Record<string, string>)[f.key]} onChange={e => setNewSource(s => ({ ...s, [f.key]: e.target.value }))} placeholder={f.placeholder} className="h-9 text-sm bg-background/80 border-border/40" />
                  </div>
                ))}
                <div>
                  <label className="section-label mb-1.5 block">Snapshot Mode</label>
                  <select value={newSource.snapshot_mode} onChange={e => setNewSource(s => ({ ...s, snapshot_mode: e.target.value }))} className="h-9 w-full rounded-lg border border-border/40 bg-background/80 px-3 text-sm text-foreground">
                    <option value="never">never</option>
                    <option value="initial">initial</option>
                    <option value="always">always</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="section-label mb-1.5 block">YAML Config Preview</label>
                <pre className="text-xs font-mono bg-background/60 rounded-xl p-4 text-muted-foreground border border-border/30 whitespace-pre overflow-auto h-full min-h-[300px]">{generateYaml()}</pre>
              </div>
            </div>
          </TiltCard>
        </ScrollReveal>
      )}

      {/* Source Cards */}
      <div className="space-y-4">
        {sources.map((source, i) => {
          const isExpanded = expanded === source.name;
          return (
            <ScrollReveal key={source.name} delay={i * 60}>
              <TiltCard className="overflow-hidden" glowColor="hsl(var(--ws-source) / 0.05)" intensity={0.3}>
                <div className="flex items-center justify-between p-5">
                  <div className="flex items-center gap-3">
                    <button onClick={() => setExpanded(isExpanded ? null : source.name)} className="text-muted-foreground hover:text-foreground transition-colors">
                      {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                    </button>
                    <StatusDot status={source.status} />
                    <span className="text-sm font-semibold text-foreground">{source.name}</span>
                    <span className="text-[10px] text-muted-foreground capitalize px-2 py-0.5 rounded-lg bg-secondary/60 border border-border/30 font-mono">{source.type}</span>
                  </div>
                  <div className="flex items-center gap-5">
                    <div className="text-right">
                      <div className="text-xs font-mono font-bold text-ws-source">
                        {source.tps >= 1000 ? `${(source.tps / 1000).toFixed(1)}K` : source.tps.toFixed(1)} /s
                      </div>
                      <div className="text-[10px] text-muted-foreground">Lag: {source.latencyP99Ms.toFixed(1)}ms</div>
                    </div>
                    <Switch checked={source.enabled} />
                  </div>
                </div>

                {isExpanded && (
                  <div className="border-t border-border/30 p-5 space-y-5" style={{ background: 'hsl(var(--secondary) / 0.15)' }}>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {[
                        { label: 'Status', value: source.status, color: source.status === 'healthy' ? 'text-ws-success' : 'text-ws-warning' },
                        { label: 'Events/sec', value: source.tps.toFixed(1), color: 'text-ws-source' },
                        { label: 'Replication Lag', value: `${source.latencyP99Ms.toFixed(0)}ms`, color: 'text-foreground' },
                        { label: 'Total Events', value: source.totalEvents.toLocaleString(), color: 'text-foreground' },
                      ].map(stat => (
                        <div key={stat.label} className="glass-card p-3">
                          <span className="text-[10px] text-muted-foreground block uppercase tracking-wider">{stat.label}</span>
                          <span className={`text-sm font-mono font-semibold ${stat.color} mt-1 block`}>{stat.value}</span>
                        </div>
                      ))}
                    </div>

                    {/* Actions — these call real API when live */}
                    <div className="flex items-center gap-2 pt-3 border-t border-border/20">
                      <Button size="sm" variant="outline" className="gap-1.5 h-7 text-xs" onClick={() => isLive && action(source.name, 'start')}>
                        <Play className="h-3 w-3" /> Start
                      </Button>
                      <Button size="sm" variant="outline" className="gap-1.5 h-7 text-xs" onClick={() => isLive && action(source.name, 'stop')}>
                        <Square className="h-3 w-3" /> Stop
                      </Button>
                      <Button size="sm" variant="outline" className="gap-1.5 h-7 text-xs" onClick={() => isLive && action(source.name, 'pause')}>
                        <Pause className="h-3 w-3" /> Pause
                      </Button>
                      <Button size="sm" variant="outline" className="gap-1.5 h-7 text-xs" onClick={() => isLive && action(source.name, 'resume')}>
                        <RotateCcw className="h-3 w-3" /> Resume
                      </Button>
                      {!isLive && <span className="text-[10px] text-muted-foreground ml-2">Actions require backend connection</span>}
                    </div>
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

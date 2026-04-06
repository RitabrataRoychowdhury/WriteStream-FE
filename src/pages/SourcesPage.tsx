import { useState } from 'react';
import { useMetrics } from '@/hooks/useMetrics';
import { StatusDot } from '@/components/shared/StatusDot';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { TiltCard } from '@/components/shared/TiltCard';
import { ScrollReveal } from '@/components/shared/ScrollReveal';
import { FloatingShape } from '@/components/shared/FloatingShape';
import { Radio, ChevronDown, ChevronRight, CheckCircle2, XCircle, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SourceConfig {
  host: string;
  port: string;
  user: string;
  password: string;
  tables: string;
}

export default function SourcesPage() {
  const { metrics } = useMetrics(3000);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [testResults, setTestResults] = useState<Record<string, 'success' | 'failed' | null>>({});
  const [configs, setConfigs] = useState<Record<string, SourceConfig>>({
    'MySQL CDC': { host: '10.0.1.50', port: '3306', user: 'replicator', password: '••••••••', tables: 'users, orders, payments' },
    'PostgreSQL CDC': { host: '10.0.1.51', port: '5432', user: 'replicator', password: '••••••••', tables: 'accounts, transactions' },
  });

  const testConnection = (name: string) => {
    setTestResults(prev => ({ ...prev, [name]: null }));
    setTimeout(() => {
      setTestResults(prev => ({ ...prev, [name]: Math.random() > 0.2 ? 'success' : 'failed' }));
    }, 1500);
  };

  const totalTps = metrics.sources.reduce((sum, s) => sum + s.tps, 0);

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
            </div>
            <h1 className="text-3xl font-bold text-foreground tracking-tight font-display">
              Sources <span className="text-gradient">Configuration</span>
            </h1>
            <p className="text-sm text-muted-foreground mt-2 font-light">Manage data ingestion sources and CDC connections.</p>
          </div>
          <div className="hidden md:flex items-center gap-4 px-4 py-2.5 rounded-2xl glass-card text-xs">
            <div className="flex items-center gap-2">
              <Zap className="h-3.5 w-3.5 text-ws-source" />
              <span className="font-mono font-bold text-foreground">{(totalTps / 1000).toFixed(0)}K</span>
              <span className="text-muted-foreground">total events/s</span>
            </div>
          </div>
        </div>
      </ScrollReveal>

      {/* Source Cards */}
      <div className="space-y-4">
        {metrics.sources.map((source, i) => {
          const isExpanded = expanded === source.name;
          const config = configs[source.name];
          const hasCdcConfig = source.type === 'cdc_mysql' || source.type === 'cdc_postgres';

          return (
            <ScrollReveal key={source.name} delay={i * 60}>
              <TiltCard className="overflow-hidden" glowColor="hsl(var(--ws-source) / 0.05)" intensity={0.3}>
                <div className="flex items-center justify-between p-5">
                  <div className="flex items-center gap-3">
                    {hasCdcConfig ? (
                      <button onClick={() => setExpanded(isExpanded ? null : source.name)} className="text-muted-foreground hover:text-foreground transition-colors">
                        {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                      </button>
                    ) : (
                      <div className="flex items-center justify-center h-7 w-7 rounded-lg bg-ws-source/10">
                        <Radio className="h-3.5 w-3.5 text-ws-source" />
                      </div>
                    )}
                    <StatusDot status={source.status} />
                    <span className="text-sm font-semibold text-foreground">{source.name}</span>
                    <span className="text-[10px] text-muted-foreground capitalize px-2 py-0.5 rounded-lg bg-secondary/60 border border-border/30 font-mono">{source.type.replace('_', ' ')}</span>
                  </div>
                  <div className="flex items-center gap-5">
                    <div className="text-right">
                      <div className="text-xs font-mono font-bold text-ws-source">{(source.tps / 1000).toFixed(1)}K /s</div>
                      <div className="text-[10px] text-muted-foreground">P99: {source.latencyP99Ms.toFixed(1)}ms</div>
                    </div>
                    <Switch checked={source.enabled} />
                  </div>
                </div>

                {isExpanded && config && (
                  <div className="border-t border-border/30 p-5 space-y-5" style={{ background: 'hsl(var(--secondary) / 0.15)' }}>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {[
                        { label: 'Host', value: config.host, key: 'host' as const },
                        { label: 'Port', value: config.port, key: 'port' as const },
                        { label: 'User', value: config.user, key: 'user' as const },
                      ].map(field => (
                        <div key={field.key}>
                          <label className="section-label mb-1.5 block">{field.label}</label>
                          <Input value={field.value} onChange={e => setConfigs(c => ({ ...c, [source.name]: { ...config, [field.key]: e.target.value } }))} className="h-9 text-sm bg-background/80 border-border/40" />
                        </div>
                      ))}
                      <div>
                        <label className="section-label mb-1.5 block">Password</label>
                        <Input type="password" value={config.password} onChange={e => setConfigs(c => ({ ...c, [source.name]: { ...config, password: e.target.value } }))} className="h-9 text-sm bg-background/80 border-border/40" />
                      </div>
                    </div>
                    <div>
                      <label className="section-label mb-1.5 block">Table Filters</label>
                      <Input value={config.tables} onChange={e => setConfigs(c => ({ ...c, [source.name]: { ...config, tables: e.target.value } }))} className="h-9 text-sm bg-background/80 border-border/40" />
                    </div>
                    <div className="flex items-center gap-3">
                      <Button size="sm" onClick={() => testConnection(source.name)} className="gap-1.5">Test Connection</Button>
                      <Button size="sm" variant="outline">Save</Button>
                      {testResults[source.name] === 'success' && <span className="flex items-center gap-1.5 text-xs text-ws-success font-medium"><CheckCircle2 className="h-3.5 w-3.5" /> Connected</span>}
                      {testResults[source.name] === 'failed' && <span className="flex items-center gap-1.5 text-xs text-ws-error font-medium"><XCircle className="h-3.5 w-3.5" /> Failed</span>}
                    </div>

                    {/* Extra metrics */}
                    <div className="grid grid-cols-3 gap-4 pt-4 border-t border-border/20">
                      {Object.entries(source.extra).map(([k, v]) => (
                        <div key={k} className="glass-card p-3">
                          <span className="text-[10px] text-muted-foreground block uppercase tracking-wider">{k.replace(/([A-Z])/g, ' $1')}</span>
                          <span className="text-sm font-mono font-semibold text-foreground mt-1 block">{v}</span>
                        </div>
                      ))}
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

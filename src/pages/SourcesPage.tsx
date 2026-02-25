import { useState } from 'react';
import { useMetrics } from '@/hooks/useMetrics';
import { StatusDot } from '@/components/shared/StatusDot';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Radio, ChevronDown, ChevronRight, CheckCircle2, XCircle } from 'lucide-react';
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

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-xl font-semibold text-foreground">Sources Configuration</h1>
        <p className="text-sm text-muted-foreground">Manage data ingestion sources</p>
      </div>

      <div className="space-y-3">
        {metrics.sources.map(source => {
          const isExpanded = expanded === source.name;
          const config = configs[source.name];
          const hasCdcConfig = source.type === 'cdc_mysql' || source.type === 'cdc_postgres';

          return (
            <div key={source.name} className="glass-card overflow-hidden">
              <div className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3">
                  {hasCdcConfig ? (
                    <button onClick={() => setExpanded(isExpanded ? null : source.name)} className="text-muted-foreground hover:text-foreground">
                      {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                    </button>
                  ) : <Radio className="h-4 w-4 text-ws-source" />}
                  <StatusDot status={source.status} />
                  <span className="text-sm font-medium text-foreground">{source.name}</span>
                  <span className="text-xs text-muted-foreground capitalize px-2 py-0.5 rounded bg-secondary">{source.type.replace('_', ' ')}</span>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-xs font-mono text-muted-foreground">
                    {(source.tps / 1000).toFixed(1)}K /s
                  </div>
                  <Switch checked={source.enabled} />
                </div>
              </div>

              {isExpanded && config && (
                <div className="border-t border-border/50 p-4 bg-secondary/20 space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-muted-foreground mb-1 block">Host</label>
                      <Input value={config.host} onChange={e => setConfigs(c => ({ ...c, [source.name]: { ...config, host: e.target.value } }))} className="h-8 text-sm bg-background" />
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground mb-1 block">Port</label>
                      <Input value={config.port} onChange={e => setConfigs(c => ({ ...c, [source.name]: { ...config, port: e.target.value } }))} className="h-8 text-sm bg-background" />
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground mb-1 block">User</label>
                      <Input value={config.user} onChange={e => setConfigs(c => ({ ...c, [source.name]: { ...config, user: e.target.value } }))} className="h-8 text-sm bg-background" />
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground mb-1 block">Password</label>
                      <Input type="password" value={config.password} onChange={e => setConfigs(c => ({ ...c, [source.name]: { ...config, password: e.target.value } }))} className="h-8 text-sm bg-background" />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">Table Filters</label>
                    <Input value={config.tables} onChange={e => setConfigs(c => ({ ...c, [source.name]: { ...config, tables: e.target.value } }))} className="h-8 text-sm bg-background" />
                  </div>
                  <div className="flex items-center gap-3">
                    <Button size="sm" onClick={() => testConnection(source.name)}>Test Connection</Button>
                    <Button size="sm" variant="outline">Save</Button>
                    {testResults[source.name] === 'success' && <span className="flex items-center gap-1 text-xs text-ws-success"><CheckCircle2 className="h-3.5 w-3.5" /> Connected</span>}
                    {testResults[source.name] === 'failed' && <span className="flex items-center gap-1 text-xs text-ws-error"><XCircle className="h-3.5 w-3.5" /> Failed</span>}
                  </div>
                  {/* Extra metrics */}
                  <div className="grid grid-cols-3 gap-3 pt-2 border-t border-border/30">
                    {Object.entries(source.extra).map(([k, v]) => (
                      <div key={k}>
                        <span className="text-[10px] text-muted-foreground block">{k.replace(/([A-Z])/g, ' $1')}</span>
                        <span className="text-xs font-mono text-foreground">{v}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

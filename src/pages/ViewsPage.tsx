import { useState } from 'react';
import { useMetrics } from '@/hooks/useMetrics';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Eye, Plus, Trash2, Camera, RefreshCw } from 'lucide-react';

interface ReactiveView {
  name: string;
  keys: string;
  aggregations: string;
  ttlHours: number;
  persistence: boolean;
  entries: number;
  memoryMB: number;
}

const initialViews: ReactiveView[] = [
  { name: 'account_balances', keys: 'account_id, currency', aggregations: 'sum(amount), count()', ttlHours: 24, persistence: true, entries: 142000, memoryMB: 256 },
  { name: 'order_stats', keys: 'merchant_id', aggregations: 'sum(total), avg(total), count()', ttlHours: 48, persistence: true, entries: 89000, memoryMB: 128 },
  { name: 'user_sessions', keys: 'user_id', aggregations: 'max(last_seen), count()', ttlHours: 1, persistence: false, entries: 53000, memoryMB: 64 },
];

export default function ViewsPage() {
  const { metrics } = useMetrics(5000);
  const [views, setViews] = useState(initialViews);
  const [showCreate, setShowCreate] = useState(false);
  const [newView, setNewView] = useState({ name: '', keys: '', aggregations: '', ttlHours: 24 });

  const yamlPreview = (v: ReactiveView | typeof newView) => `view:
  name: ${v.name || '<name>'}
  keys: [${v.keys || ''}]
  aggregations: [${v.aggregations || ''}]
  ttl: ${('ttlHours' in v ? v.ttlHours : 24)}h
  persistence: ${'persistence' in v ? v.persistence : true}`;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Reactive Views</h1>
          <p className="text-sm text-muted-foreground">Manage real-time materialized views</p>
        </div>
        <Button size="sm" className="gap-1.5" onClick={() => setShowCreate(!showCreate)}>
          <Plus className="h-3.5 w-3.5" /> Create View
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
        <div className="glass-card p-4">
          <span className="text-xs text-muted-foreground">Active Views</span>
          <div className="text-2xl font-bold font-mono text-ws-reactive mt-1">{metrics.reactive.activeViews}</div>
        </div>
        <div className="glass-card p-4">
          <span className="text-xs text-muted-foreground">Total Entries</span>
          <div className="text-2xl font-bold font-mono text-foreground mt-1">{(metrics.reactive.totalEntries / 1000).toFixed(0)}K</div>
        </div>
        <div className="glass-card p-4">
          <span className="text-xs text-muted-foreground">Memory Usage</span>
          <div className="text-2xl font-bold font-mono text-foreground mt-1">{metrics.reactive.memoryUsageMB.toFixed(0)} MB</div>
        </div>
        <div className="glass-card p-4">
          <span className="text-xs text-muted-foreground">WS Subscribers</span>
          <div className="text-2xl font-bold font-mono text-foreground mt-1">{metrics.reactive.wsConnections}</div>
        </div>
      </div>

      {/* Create Form */}
      {showCreate && (
        <div className="glass-card p-5 space-y-4 animate-scale-in">
          <h3 className="text-sm font-semibold text-foreground">Create New View</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">View Name</label>
                <Input value={newView.name} onChange={e => setNewView(v => ({ ...v, name: e.target.value }))} placeholder="e.g. account_balances" className="h-8 text-sm bg-background" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Keys</label>
                <Input value={newView.keys} onChange={e => setNewView(v => ({ ...v, keys: e.target.value }))} placeholder="e.g. account_id, currency" className="h-8 text-sm bg-background" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Aggregations</label>
                <Input value={newView.aggregations} onChange={e => setNewView(v => ({ ...v, aggregations: e.target.value }))} placeholder="e.g. sum(amount), count()" className="h-8 text-sm bg-background" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">TTL (hours)</label>
                <Input type="number" value={newView.ttlHours} onChange={e => setNewView(v => ({ ...v, ttlHours: Number(e.target.value) }))} className="h-8 text-sm bg-background" />
              </div>
              <Button size="sm" onClick={() => { setViews(vs => [...vs, { ...newView, persistence: true, entries: 0, memoryMB: 0 }]); setShowCreate(false); }}>Create</Button>
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">YAML Preview</label>
              <pre className="text-xs font-mono bg-background rounded-lg p-3 text-muted-foreground border border-border/50 whitespace-pre overflow-auto h-full min-h-[160px]">{yamlPreview(newView)}</pre>
            </div>
          </div>
        </div>
      )}

      {/* Views List */}
      <div className="space-y-3">
        {views.map(view => (
          <div key={view.name} className="glass-card-hover p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Eye className="h-4 w-4 text-ws-reactive" />
                <span className="text-sm font-semibold font-mono text-foreground">{view.name}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Button size="sm" variant="ghost" className="h-7 w-7 p-0" title="Force Snapshot"><Camera className="h-3.5 w-3.5" /></Button>
                <Button size="sm" variant="ghost" className="h-7 w-7 p-0" title="Refresh"><RefreshCw className="h-3.5 w-3.5" /></Button>
                <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-ws-error" title="Delete" onClick={() => setViews(vs => vs.filter(v => v.name !== view.name))}><Trash2 className="h-3.5 w-3.5" /></Button>
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div><span className="text-muted-foreground block">Keys</span><span className="font-mono text-foreground">{view.keys}</span></div>
              <div><span className="text-muted-foreground block">Entries</span><span className="font-mono text-foreground">{view.entries.toLocaleString()}</span></div>
              <div><span className="text-muted-foreground block">Memory</span><span className="font-mono text-foreground">{view.memoryMB} MB</span></div>
              <div><span className="text-muted-foreground block">TTL</span><span className="font-mono text-foreground">{view.ttlHours}h</span></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

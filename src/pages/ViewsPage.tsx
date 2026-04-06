import { useState } from 'react';
import { useMetrics } from '@/hooks/useMetrics';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { TiltCard } from '@/components/shared/TiltCard';
import { ScrollReveal } from '@/components/shared/ScrollReveal';
import { FloatingShape } from '@/components/shared/FloatingShape';
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
    <div className="space-y-8 max-w-[1400px] mx-auto relative">
      <FloatingShape variant="gradient-orb" size={200} className="top-0 -right-20 opacity-50" delay={0} color="hsl(var(--ws-reactive) / 0.1)" />
      <FloatingShape variant="ring" size={70} className="top-80 -left-8 opacity-30" delay={2000} />

      {/* Header */}
      <ScrollReveal>
        <div className="flex items-end justify-between">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <div className="h-1.5 w-1.5 rounded-full bg-ws-reactive animate-pulse" />
              <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground font-semibold">Materialized</span>
            </div>
            <h1 className="text-3xl font-bold text-foreground tracking-tight font-display">
              Reactive <span className="text-gradient">Views</span>
            </h1>
            <p className="text-sm text-muted-foreground mt-2 font-light">Manage real-time materialized views with live subscriptions.</p>
          </div>
          <Button size="sm" className="gap-1.5" onClick={() => setShowCreate(!showCreate)}>
            <Plus className="h-3.5 w-3.5" /> Create View
          </Button>
        </div>
      </ScrollReveal>

      {/* Stats */}
      <ScrollReveal delay={60}>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'Active Views', value: metrics.reactive.activeViews, color: 'text-ws-reactive' },
            { label: 'Total Entries', value: `${(metrics.reactive.totalEntries / 1000).toFixed(0)}K`, color: 'text-foreground' },
            { label: 'Memory Usage', value: `${metrics.reactive.memoryUsageMB.toFixed(0)} MB`, color: 'text-foreground' },
            { label: 'WS Subscribers', value: metrics.reactive.wsConnections, color: 'text-foreground' },
          ].map((stat, idx) => (
            <TiltCard key={stat.label} className="p-5" glowColor="hsl(var(--ws-reactive) / 0.05)" intensity={0.4}>
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider">{stat.label}</span>
              <div className={`text-2xl font-bold font-mono ${stat.color} mt-2`}>{stat.value}</div>
            </TiltCard>
          ))}
        </div>
      </ScrollReveal>

      {/* Create Form */}
      {showCreate && (
        <ScrollReveal>
          <TiltCard className="p-6 space-y-5" intensity={0.2}>
            <h3 className="text-sm font-semibold text-foreground font-display">Create New View</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-4">
                {[
                  { label: 'View Name', value: newView.name, key: 'name', placeholder: 'e.g. account_balances' },
                  { label: 'Keys', value: newView.keys, key: 'keys', placeholder: 'e.g. account_id, currency' },
                  { label: 'Aggregations', value: newView.aggregations, key: 'aggregations', placeholder: 'e.g. sum(amount), count()' },
                ].map(field => (
                  <div key={field.key}>
                    <label className="section-label mb-1.5 block">{field.label}</label>
                    <Input value={field.value} onChange={e => setNewView(v => ({ ...v, [field.key]: e.target.value }))} placeholder={field.placeholder} className="h-9 text-sm bg-background/80 border-border/40" />
                  </div>
                ))}
                <div>
                  <label className="section-label mb-1.5 block">TTL (hours)</label>
                  <Input type="number" value={newView.ttlHours} onChange={e => setNewView(v => ({ ...v, ttlHours: Number(e.target.value) }))} className="h-9 text-sm bg-background/80 border-border/40" />
                </div>
                <Button size="sm" onClick={() => { setViews(vs => [...vs, { ...newView, persistence: true, entries: 0, memoryMB: 0 }]); setShowCreate(false); }}>Create</Button>
              </div>
              <div>
                <label className="section-label mb-1.5 block">YAML Preview</label>
                <pre className="text-xs font-mono bg-background/60 rounded-xl p-4 text-muted-foreground border border-border/30 whitespace-pre overflow-auto h-full min-h-[180px]">{yamlPreview(newView)}</pre>
              </div>
            </div>
          </TiltCard>
        </ScrollReveal>
      )}

      {/* Views List */}
      <div className="space-y-4">
        {views.map((view, i) => (
          <ScrollReveal key={view.name} delay={i * 60}>
            <TiltCard className="p-5" glowColor="hsl(var(--ws-reactive) / 0.05)" intensity={0.4}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2.5">
                  <div className="flex items-center justify-center h-7 w-7 rounded-lg bg-ws-reactive/10">
                    <Eye className="h-3.5 w-3.5 text-ws-reactive" />
                  </div>
                  <span className="text-sm font-semibold font-mono text-foreground">{view.name}</span>
                  {view.persistence && <span className="text-[10px] px-2 py-0.5 rounded-lg bg-ws-success/10 text-ws-success border border-ws-success/15 font-medium">Persistent</span>}
                </div>
                <div className="flex items-center gap-1.5">
                  <Button size="sm" variant="ghost" className="h-7 w-7 p-0" title="Force Snapshot"><Camera className="h-3.5 w-3.5" /></Button>
                  <Button size="sm" variant="ghost" className="h-7 w-7 p-0" title="Refresh"><RefreshCw className="h-3.5 w-3.5" /></Button>
                  <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-ws-error" title="Delete" onClick={() => setViews(vs => vs.filter(v => v.name !== view.name))}><Trash2 className="h-3.5 w-3.5" /></Button>
                </div>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                {[
                  { label: 'Keys', value: view.keys },
                  { label: 'Entries', value: view.entries.toLocaleString() },
                  { label: 'Memory', value: `${view.memoryMB} MB` },
                  { label: 'TTL', value: `${view.ttlHours}h` },
                ].map(item => (
                  <div key={item.label}>
                    <span className="text-muted-foreground block text-[10px] uppercase tracking-wider">{item.label}</span>
                    <span className="font-mono text-foreground font-medium mt-1 block">{item.value}</span>
                  </div>
                ))}
              </div>
            </TiltCard>
          </ScrollReveal>
        ))}
      </div>
    </div>
  );
}

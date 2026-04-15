import { useState } from 'react';
import { useViews } from '@/hooks/useViews';
import { useViewWebSocket } from '@/hooks/useViewWebSocket';
import { useMetrics } from '@/hooks/useMetrics';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { TiltCard } from '@/components/shared/TiltCard';
import { ScrollReveal } from '@/components/shared/ScrollReveal';
import { FloatingShape } from '@/components/shared/FloatingShape';
import { Eye, Plus, Trash2, Camera, RefreshCw, Wifi, WifiOff, Radio } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';

const AGG_TYPES = ['sum', 'count', 'min', 'max', 'avg', 'last'];

export default function ViewsPage() {
  const { views: liveViews, isLive, create, remove, snapshot } = useViews(5000);
  const { metrics: mockMetrics } = useMetrics(5000);
  const [showCreate, setShowCreate] = useState(false);
  const [newView, setNewView] = useState({ name: '', keys: '', ttl_seconds: '3600', persist: true });
  const [aggregations, setAggregations] = useState([{ name: '', agg_type: 'sum', field: '' }]);
  const [wsViewName, setWsViewName] = useState('');
  const [wsKey, setWsKey] = useState('0');
  const [wsEnabled, setWsEnabled] = useState(false);
  const { messages: wsMessages, connected: wsConnected } = useViewWebSocket({
    viewName: wsViewName,
    key: wsKey,
    enabled: wsEnabled,
  });

  // Use live views or mock fallback
  const views = isLive && liveViews.length > 0
    ? liveViews.map(v => ({
        name: v.name,
        entry_count: v.entry_count,
        subscriber_count: v.subscriber_count,
        memory_usage_bytes: v.memory_usage_bytes,
      }))
    : [
        { name: 'account_balances', entry_count: 50, subscriber_count: 0, memory_usage_bytes: 6400 },
        { name: 'order_stats', entry_count: 89, subscriber_count: 2, memory_usage_bytes: 12800 },
        { name: 'user_sessions', entry_count: 23, subscriber_count: 1, memory_usage_bytes: 3200 },
      ];

  const handleCreate = async () => {
    const payload = {
      name: newView.name,
      keys: newView.keys.split(',').map(k => k.trim()).filter(Boolean),
      aggregations: aggregations.filter(a => a.name).map(a => ({
        name: a.name,
        agg_type: a.agg_type,
        ...(a.field ? { field: a.field } : {}),
      })),
      ttl_seconds: Number(newView.ttl_seconds),
      persist: newView.persist,
    };
    const ok = await create(payload);
    if (ok) {
      setShowCreate(false);
      toast({ title: 'View created', description: `"${newView.name}" created successfully.` });
    } else {
      toast({ title: 'Failed', description: 'Could not create view. Check backend connection.', variant: 'destructive' });
    }
  };

  const handleSnapshot = async (name: string) => {
    const msg = await snapshot(name);
    if (msg) {
      toast({ title: 'Snapshot', description: msg });
    } else {
      toast({ title: 'Failed', description: 'Could not trigger snapshot.', variant: 'destructive' });
    }
  };

  const handleDelete = async (name: string) => {
    if (isLive) {
      await remove(name);
    }
  };

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
              {isLive ? <Wifi className="h-3 w-3 text-ws-success" /> : <WifiOff className="h-3 w-3 text-ws-warning" />}
            </div>
            <h1 className="text-3xl font-bold text-foreground tracking-tight font-display">
              Reactive <span className="text-gradient">Views</span>
            </h1>
            <p className="text-sm text-muted-foreground mt-2 font-light">Manage real-time materialized views. Create, delete, and subscribe via WebSocket.</p>
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
            { label: 'Active Views', value: views.length, color: 'text-ws-reactive' },
            { label: 'Total Entries', value: views.reduce((s, v) => s + v.entry_count, 0).toLocaleString(), color: 'text-foreground' },
            { label: 'Memory Usage', value: `${(views.reduce((s, v) => s + v.memory_usage_bytes, 0) / 1024).toFixed(1)} KB`, color: 'text-foreground' },
            { label: 'WS Subscribers', value: views.reduce((s, v) => s + v.subscriber_count, 0), color: 'text-foreground' },
          ].map((stat) => (
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
                <div>
                  <label className="section-label mb-1.5 block">View Name</label>
                  <Input value={newView.name} onChange={e => setNewView(v => ({ ...v, name: e.target.value }))} placeholder="e.g. account_balances" className="h-9 text-sm bg-background/80 border-border/40" />
                </div>
                <div>
                  <label className="section-label mb-1.5 block">Keys (comma-separated)</label>
                  <Input value={newView.keys} onChange={e => setNewView(v => ({ ...v, keys: e.target.value }))} placeholder="e.g. user_id, currency" className="h-9 text-sm bg-background/80 border-border/40" />
                </div>
                <div>
                  <label className="section-label mb-1.5 block">Aggregations</label>
                  {aggregations.map((agg, idx) => (
                    <div key={idx} className="flex gap-2 mb-2">
                      <Input value={agg.name} onChange={e => { const a = [...aggregations]; a[idx].name = e.target.value; setAggregations(a); }} placeholder="name" className="h-8 text-xs bg-background/80 border-border/40 flex-1" />
                      <select value={agg.agg_type} onChange={e => { const a = [...aggregations]; a[idx].agg_type = e.target.value; setAggregations(a); }} className="h-8 rounded-lg border border-border/40 bg-background/80 px-2 text-xs text-foreground">
                        {AGG_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                      <Input value={agg.field} onChange={e => { const a = [...aggregations]; a[idx].field = e.target.value; setAggregations(a); }} placeholder="field" className="h-8 text-xs bg-background/80 border-border/40 flex-1" />
                    </div>
                  ))}
                  <Button size="sm" variant="ghost" className="text-xs h-7" onClick={() => setAggregations(a => [...a, { name: '', agg_type: 'sum', field: '' }])}>+ Add</Button>
                </div>
                <div className="flex gap-4">
                  <div className="flex-1">
                    <label className="section-label mb-1.5 block">TTL (seconds)</label>
                    <Input type="number" value={newView.ttl_seconds} onChange={e => setNewView(v => ({ ...v, ttl_seconds: e.target.value }))} className="h-9 text-sm bg-background/80 border-border/40" />
                  </div>
                  <div className="flex items-end gap-2 pb-1">
                    <label className="text-xs text-muted-foreground">Persist</label>
                    <input type="checkbox" checked={newView.persist} onChange={e => setNewView(v => ({ ...v, persist: e.target.checked }))} />
                  </div>
                </div>
                <Button size="sm" onClick={handleCreate} disabled={!newView.name}>Create</Button>
              </div>
              <div>
                <label className="section-label mb-1.5 block">API Payload Preview</label>
                <pre className="text-xs font-mono bg-background/60 rounded-xl p-4 text-muted-foreground border border-border/30 whitespace-pre overflow-auto h-full min-h-[200px]">
                  {JSON.stringify({
                    name: newView.name || '<name>',
                    keys: newView.keys.split(',').map(k => k.trim()).filter(Boolean),
                    aggregations: aggregations.filter(a => a.name),
                    ttl_seconds: Number(newView.ttl_seconds),
                    persist: newView.persist,
                  }, null, 2)}
                </pre>
              </div>
            </div>
          </TiltCard>
        </ScrollReveal>
      )}

      {/* WebSocket Subscription */}
      <ScrollReveal delay={80}>
        <TiltCard className="p-5" intensity={0.2}>
          <div className="flex items-center gap-2.5 mb-4">
            <Radio className="h-4 w-4 text-ws-reactive" />
            <h3 className="text-sm font-semibold text-foreground font-display">Live Subscription (WebSocket)</h3>
            {wsConnected && <span className="text-[10px] px-2 py-0.5 rounded-lg bg-ws-success/10 text-ws-success border border-ws-success/15 font-medium">Connected</span>}
          </div>
          <div className="flex gap-3 items-end mb-4">
            <div className="flex-1">
              <label className="section-label mb-1 block">View Name</label>
              <Input value={wsViewName} onChange={e => setWsViewName(e.target.value)} placeholder="e.g. account_balances_total_balance" className="h-9 text-sm bg-background/80 border-border/40" />
            </div>
            <div className="w-24">
              <label className="section-label mb-1 block">Key</label>
              <Input value={wsKey} onChange={e => setWsKey(e.target.value)} placeholder="0" className="h-9 text-sm bg-background/80 border-border/40" />
            </div>
            <Button size="sm" variant={wsEnabled ? 'destructive' : 'default'} onClick={() => setWsEnabled(!wsEnabled)}>
              {wsEnabled ? 'Disconnect' : 'Subscribe'}
            </Button>
          </div>
          {wsMessages.length > 0 && (
            <div className="max-h-40 overflow-auto rounded-xl border border-border/30 p-3 bg-background/60 font-mono text-xs space-y-1">
              {wsMessages.slice(-20).map((msg, i) => (
                <div key={i} className="text-foreground/80">{JSON.stringify(msg)}</div>
              ))}
            </div>
          )}
          {wsEnabled && wsMessages.length === 0 && (
            <p className="text-xs text-muted-foreground">Waiting for messages... Ensure the view exists and events are flowing.</p>
          )}
        </TiltCard>
      </ScrollReveal>

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
                </div>
                <div className="flex items-center gap-1.5">
                  <Button size="sm" variant="ghost" className="h-7 w-7 p-0" title="Force Snapshot" onClick={() => handleSnapshot(view.name)}>
                    <Camera className="h-3.5 w-3.5" />
                  </Button>
                  <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-ws-error" title="Delete" onClick={() => handleDelete(view.name)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
                <div>
                  <span className="text-muted-foreground block text-[10px] uppercase tracking-wider">Entries</span>
                  <span className="font-mono text-foreground font-medium mt-1 block">{view.entry_count.toLocaleString()}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[10px] uppercase tracking-wider">Memory</span>
                  <span className="font-mono text-foreground font-medium mt-1 block">{(view.memory_usage_bytes / 1024).toFixed(1)} KB</span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[10px] uppercase tracking-wider">Subscribers</span>
                  <span className="font-mono text-foreground font-medium mt-1 block">{view.subscriber_count}</span>
                </div>
              </div>
            </TiltCard>
          </ScrollReveal>
        ))}
      </div>
    </div>
  );
}

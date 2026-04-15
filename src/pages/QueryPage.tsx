import { useState, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { ScrollReveal } from '@/components/shared/ScrollReveal';
import { TiltCard } from '@/components/shared/TiltCard';
import { FloatingShape } from '@/components/shared/FloatingShape';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Play, Clock, Copy, Check, Terminal, Send, Wifi, WifiOff } from 'lucide-react';
import { ingestEvent } from '@/api/services';
import { useViews } from '@/hooks/useViews';
import { toast } from '@/hooks/use-toast';

export default function QueryPage() {
  const { views, isLive: viewsLive } = useViews(10000);
  const [eventKey, setEventKey] = useState('user-123');
  const [eventPayload, setEventPayload] = useState('{\n  "amount": 100,\n  "account_id": "acc-1",\n  "currency": "USD"\n}');
  const [lastResult, setLastResult] = useState<{ event_id: string; status: string } | null>(null);
  const [sending, setSending] = useState(false);
  const [batchCount, setBatchCount] = useState('10');
  const [batchMode, setBatchMode] = useState(false);
  const [copied, setCopied] = useState(false);
  const [sendHistory, setSendHistory] = useState<{ key: string; event_id: string; time: string }[]>([]);

  const handleSend = useCallback(async () => {
    try {
      const payload = JSON.parse(eventPayload);
      setSending(true);

      if (batchMode) {
        const count = Number(batchCount);
        const start = performance.now();
        const results: string[] = [];
        for (let i = 0; i < count; i++) {
          const k = `${eventKey}-${i}`;
          try {
            const res = await ingestEvent(k, payload);
            if (res.ok) results.push(res.data.event_id);
          } catch {
            // If backend not available, show mock result
            results.push(`mock-${Date.now()}-${i}`);
          }
        }
        const elapsed = performance.now() - start;
        toast({ title: `Batch sent: ${results.length} events`, description: `Completed in ${elapsed.toFixed(0)}ms` });
        setSendHistory(prev => [...results.map((id, i) => ({
          key: `${eventKey}-${i}`,
          event_id: id,
          time: new Date().toLocaleTimeString(),
        })), ...prev].slice(0, 50));
      } else {
        try {
          const res = await ingestEvent(eventKey, payload);
          if (res.ok) {
            setLastResult(res.data);
            setSendHistory(prev => [{ key: eventKey, event_id: res.data.event_id, time: new Date().toLocaleTimeString() }, ...prev].slice(0, 50));
          } else {
            toast({ title: 'Error', description: `HTTP ${res.status}`, variant: 'destructive' });
          }
        } catch {
          // Mock result when backend unavailable
          const mockId = `mock-${Date.now()}`;
          setLastResult({ event_id: mockId, status: 'accepted (mock)' });
          setSendHistory(prev => [{ key: eventKey, event_id: mockId, time: new Date().toLocaleTimeString() }, ...prev].slice(0, 50));
        }
      }
    } catch (err) {
      toast({ title: 'Invalid JSON', description: 'Check your payload format.', variant: 'destructive' });
    } finally {
      setSending(false);
    }
  }, [eventKey, eventPayload, batchMode, batchCount]);

  const handleCopy = useCallback(() => {
    if (lastResult) {
      navigator.clipboard.writeText(JSON.stringify(lastResult, null, 2));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [lastResult]);

  return (
    <div className="h-full flex flex-col gap-5 max-w-[1400px] mx-auto relative">
      <FloatingShape variant="gradient-orb" size={140} className="top-0 -right-14 opacity-40" delay={0} />

      {/* Header */}
      <ScrollReveal>
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
            <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground font-semibold">Explorer</span>
          </div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight font-display">
            Event <span className="text-gradient">Ingestor</span> & Query
          </h1>
          <p className="text-xs text-muted-foreground mt-1 font-light">Send events to WriteStream and query reactive views</p>
        </div>
      </ScrollReveal>

      <div className="flex-1 flex gap-5 min-h-0">
        {/* Event sender */}
        <div className="flex-1 flex flex-col gap-4 min-h-0">
          <TiltCard className="p-5 space-y-4" intensity={0.2}>
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-foreground font-display flex items-center gap-2">
                <Send className="h-4 w-4 text-primary" /> Ingest Event
              </h3>
              <div className="flex items-center gap-2">
                <label className="text-xs text-muted-foreground flex items-center gap-1.5">
                  <input type="checkbox" checked={batchMode} onChange={e => setBatchMode(e.target.checked)} />
                  Batch
                </label>
                {batchMode && (
                  <Input value={batchCount} onChange={e => setBatchCount(e.target.value)} className="h-7 w-16 text-xs bg-background/80 border-border/40" placeholder="count" />
                )}
              </div>
            </div>

            <div>
              <label className="section-label mb-1.5 block">Event Key</label>
              <Input value={eventKey} onChange={e => setEventKey(e.target.value)} placeholder="user-123" className="h-9 text-sm bg-background/80 border-border/40 font-mono" />
            </div>

            <div>
              <label className="section-label mb-1.5 block">Payload (JSON)</label>
              <textarea
                value={eventPayload}
                onChange={e => setEventPayload(e.target.value)}
                rows={6}
                spellCheck={false}
                className="w-full px-4 py-3 bg-background/60 rounded-xl text-xs font-mono text-foreground resize-none focus:outline-none border border-border/30 leading-relaxed caret-primary"
              />
            </div>

            <div className="flex items-center gap-3">
              <Button size="sm" className="gap-1.5" onClick={handleSend} disabled={sending}>
                <Play className="h-3 w-3" /> {sending ? 'Sending...' : batchMode ? `Send ${batchCount} Events` : 'Send Event'}
              </Button>
              <span className="text-[10px] text-muted-foreground font-mono">POST /events</span>
            </div>
          </TiltCard>

          {/* Response */}
          {lastResult && (
            <TiltCard className="p-5" intensity={0.2}>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <Terminal className="h-4 w-4 text-muted-foreground" /> Response
                </h3>
                <button onClick={handleCopy} className="p-1.5 rounded-lg hover:bg-secondary/50 text-muted-foreground hover:text-foreground transition-colors">
                  {copied ? <Check className="h-3 w-3 text-ws-success" /> : <Copy className="h-3 w-3" />}
                </button>
              </div>
              <pre className="text-xs font-mono bg-background/60 rounded-lg p-3 text-foreground/80">{JSON.stringify(lastResult, null, 2)}</pre>
            </TiltCard>
          )}

          {/* Registered views */}
          {views.length > 0 && (
            <TiltCard className="p-5" intensity={0.2}>
              <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                Registered Views
                {viewsLive ? <Wifi className="h-3 w-3 text-ws-success" /> : <WifiOff className="h-3 w-3 text-ws-warning" />}
              </h3>
              <div className="space-y-2">
                {views.map(v => (
                  <div key={v.name} className="flex items-center justify-between py-2 border-b border-border/20 last:border-0 text-xs">
                    <span className="font-mono text-foreground font-medium">{v.name}</span>
                    <span className="text-muted-foreground">{v.entry_count} entries</span>
                  </div>
                ))}
              </div>
            </TiltCard>
          )}
        </div>

        {/* History sidebar */}
        <div className="w-56 rounded-2xl border border-border/40 overflow-hidden flex flex-col shrink-0" style={{ background: 'hsl(var(--surface-elevated))' }}>
          <div className="px-4 py-3 border-b border-border/20">
            <span className="text-xs font-semibold text-foreground">Send History</span>
          </div>
          <div className="flex-1 overflow-y-auto">
            {sendHistory.length === 0 && (
              <div className="p-4 text-[10px] text-muted-foreground text-center">No events sent yet</div>
            )}
            {sendHistory.map((h, i) => (
              <div key={i} className="px-4 py-3 border-b border-border/10 text-[10px]">
                <div className="font-mono text-foreground truncate">{h.key}</div>
                <div className="text-muted-foreground truncate mt-0.5">{h.event_id}</div>
                <div className="text-muted-foreground/50 mt-0.5">{h.time}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

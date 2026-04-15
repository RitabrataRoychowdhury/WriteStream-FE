import { useState, useRef, useEffect, useCallback } from 'react';
import { useLogs } from '@/hooks/useLogs';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollReveal } from '@/components/shared/ScrollReveal';
import { TiltCard } from '@/components/shared/TiltCard';
import { Pause, Play, Trash2, Download, Search, Terminal, Wifi, WifiOff, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { LogLevel } from '@/mocks/mockData';
import { fetchParsedMetrics } from '@/api/services';

const levelColors: Record<LogLevel, string> = {
  DEBUG: 'text-muted-foreground',
  INFO: 'text-ws-info',
  WARN: 'text-ws-warning',
  ERROR: 'text-ws-error',
};

const levelBg: Record<LogLevel, string> = {
  DEBUG: 'bg-muted-foreground/10 border-muted-foreground/15',
  INFO: 'bg-ws-info/10 border-ws-info/15',
  WARN: 'bg-ws-warning/10 border-ws-warning/15',
  ERROR: 'bg-ws-error/10 border-ws-error/15',
};

const levelDot: Record<LogLevel, string> = {
  DEBUG: 'bg-muted-foreground',
  INFO: 'bg-ws-info',
  WARN: 'bg-ws-warning',
  ERROR: 'bg-ws-error',
};

interface MetricsLogEntry {
  id: string;
  timestamp: string;
  level: LogLevel;
  component: string;
  message: string;
}

export default function LogsPage() {
  const { logs, paused, toggle, clear } = useLogs();
  const [search, setSearch] = useState('');
  const [levelFilter, setLevelFilter] = useState<LogLevel | null>(null);
  const [componentFilter, setComponentFilter] = useState<string | null>(null);
  const [autoScroll, setAutoScroll] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [metricsLogs, setMetricsLogs] = useState<MetricsLogEntry[]>([]);
  const [isLive, setIsLive] = useState(false);

  // Try to generate log entries from Prometheus metrics
  const fetchMetricsAsLogs = useCallback(async () => {
    try {
      const prom = await fetchParsedMetrics();
      const now = new Date().toISOString();
      const entries: MetricsLogEntry[] = [];
      const id = Date.now();

      entries.push({
        id: `${id}-ingested`,
        timestamp: now,
        level: 'INFO',
        component: 'metrics',
        message: `Events ingested: ${prom.eventsIngested.toLocaleString()} | WAL writes: ${prom.walWrites.toLocaleString()}`,
      });

      for (const [sink, count] of Object.entries(prom.sinkEventsWritten)) {
        entries.push({
          id: `${id}-sink-${sink}`,
          timestamp: now,
          level: 'INFO',
          component: `sink.${sink}`,
          message: `Events written: ${count.toLocaleString()}`,
        });
      }

      if (prom.backpressureEvents > 0) {
        entries.push({
          id: `${id}-bp`,
          timestamp: now,
          level: 'WARN',
          component: 'backpressure',
          message: `Backpressure events total: ${prom.backpressureEvents}`,
        });
      }

      if (prom.walWriteLatencyP99 > 10) {
        entries.push({
          id: `${id}-latency`,
          timestamp: now,
          level: 'WARN',
          component: 'wal',
          message: `WAL write latency P99: ${prom.walWriteLatencyP99.toFixed(2)}ms (elevated)`,
        });
      }

      setMetricsLogs(prev => [...prev, ...entries].slice(-200));
      setIsLive(true);
    } catch {
      setIsLive(false);
    }
  }, []);

  useEffect(() => {
    fetchMetricsAsLogs();
    const id = setInterval(fetchMetricsAsLogs, 2000);
    return () => clearInterval(id);
  }, [fetchMetricsAsLogs]);

  // Combine: live metrics logs first, then mock logs as fallback
  const allLogs = isLive ? metricsLogs : logs;

  const filtered = allLogs.filter(l => {
    if (levelFilter && l.level !== levelFilter) return false;
    if (componentFilter && l.component !== componentFilter) return false;
    if (search && !l.message.toLowerCase().includes(search.toLowerCase()) && !l.component.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  useEffect(() => {
    if (autoScroll && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [filtered.length, autoScroll]);

  const components = [...new Set(allLogs.map(l => l.component))].sort();
  const levels: LogLevel[] = ['DEBUG', 'INFO', 'WARN', 'ERROR'];

  const exportLogs = () => {
    const text = filtered.map(l => `${l.timestamp} [${l.level}] [${l.component}] ${l.message}`).join('\n');
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `writestream-logs-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="h-full flex flex-col gap-5 max-w-[1400px] mx-auto">
      {/* Header */}
      <ScrollReveal>
        <div className="flex items-end justify-between">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <div className={cn('h-1.5 w-1.5 rounded-full', isLive ? 'bg-ws-success animate-pulse' : paused ? 'bg-ws-warning' : 'bg-ws-success animate-pulse')} />
              <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground font-semibold">
                {isLive ? 'Live Metrics' : paused ? 'Paused' : 'Streaming'}
              </span>
              {isLive ? <Wifi className="h-3 w-3 text-ws-success" /> : <WifiOff className="h-3 w-3 text-ws-warning" />}
            </div>
            <h1 className="text-3xl font-bold text-foreground tracking-tight font-display">
              Log <span className="text-gradient">Viewer</span>
            </h1>
            <p className="text-sm text-muted-foreground mt-1 font-light">
              {isLive ? 'Showing parsed Prometheus metrics as log entries (refreshing every 2s)' : `${filtered.length} mock entries`}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {!isLive && (
              <Button size="sm" variant="outline" onClick={toggle} className="gap-1.5">
                {paused ? <Play className="h-3 w-3" /> : <Pause className="h-3 w-3" />}
                {paused ? 'Resume' : 'Pause'}
              </Button>
            )}
            <Button size="sm" variant="outline" onClick={() => { clear(); setMetricsLogs([]); }} className="gap-1.5"><Trash2 className="h-3 w-3" /> Clear</Button>
            <Button size="sm" variant="outline" onClick={exportLogs} className="gap-1.5"><Download className="h-3 w-3" /> Export</Button>
          </div>
        </div>
      </ScrollReveal>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search logs..." className="h-9 text-sm pl-9 bg-background/80 border-border/40" />
        </div>
        <div className="flex gap-1.5">
          {levels.map(l => (
            <button
              key={l}
              onClick={() => setLevelFilter(levelFilter === l ? null : l)}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all border',
                levelFilter === l
                  ? `${levelBg[l]} ${levelColors[l]}`
                  : 'border-transparent text-muted-foreground hover:text-foreground hover:bg-secondary/40'
              )}
            >
              <div className={cn('h-1.5 w-1.5 rounded-full', levelDot[l])} />
              {l}
            </button>
          ))}
        </div>
        {components.length > 1 && (
          <select
            value={componentFilter || ''}
            onChange={e => setComponentFilter(e.target.value || null)}
            className="h-9 rounded-lg border border-border/40 bg-background/80 px-3 text-xs text-foreground"
          >
            <option value="">All Components</option>
            {components.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        )}
      </div>

      {/* Log Display */}
      <div ref={scrollRef} className="flex-1 rounded-2xl border border-border/40 overflow-auto font-mono text-xs p-1 min-h-0" style={{ background: 'hsl(var(--surface-elevated))' }}>
        <div className="flex items-center gap-2 px-3 py-2 border-b border-border/20 mb-1 sticky top-0 z-10" style={{ background: 'hsl(var(--surface-elevated))' }}>
          <Terminal className="h-3 w-3 text-muted-foreground" />
          <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Output</span>
          {isLive && <span className="text-[10px] text-ws-success ml-auto">● Live from Prometheus</span>}
        </div>
        {filtered.map(entry => (
          <div key={entry.id} className={cn(
            'flex items-start gap-2 px-3 py-1.5 rounded-lg transition-colors',
            'hover:bg-secondary/20',
            entry.level === 'ERROR' && 'bg-ws-error/[0.03]'
          )}>
            <span className="text-muted-foreground/50 shrink-0 w-[175px] select-all">{entry.timestamp.replace('T', ' ').slice(0, 23)}</span>
            <span className={cn('shrink-0 w-12 font-semibold', levelColors[entry.level])}>{entry.level}</span>
            <span className="text-ws-wal shrink-0 w-[120px] truncate">{entry.component}</span>
            <span className="text-foreground/90">{entry.message}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

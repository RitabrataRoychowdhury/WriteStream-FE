import { useState, useRef, useEffect } from 'react';
import { useLogs } from '@/hooks/useLogs';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollReveal } from '@/components/shared/ScrollReveal';
import { Pause, Play, Trash2, Download, Search, Terminal } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { LogLevel } from '@/mocks/mockData';

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

export default function LogsPage() {
  const { logs, paused, toggle, clear } = useLogs();
  const [search, setSearch] = useState('');
  const [levelFilter, setLevelFilter] = useState<LogLevel | null>(null);
  const [componentFilter, setComponentFilter] = useState<string | null>(null);
  const [autoScroll, setAutoScroll] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  const filtered = logs.filter(l => {
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

  const components = [...new Set(logs.map(l => l.component))].sort();
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
              <div className={cn('h-1.5 w-1.5 rounded-full', paused ? 'bg-ws-warning' : 'bg-ws-success animate-pulse')} />
              <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground font-semibold">{paused ? 'Paused' : 'Streaming'}</span>
            </div>
            <h1 className="text-3xl font-bold text-foreground tracking-tight font-display">
              Log <span className="text-gradient">Viewer</span>
            </h1>
            <p className="text-sm text-muted-foreground mt-1 font-light">{filtered.length} entries</p>
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" onClick={toggle} className="gap-1.5">
              {paused ? <Play className="h-3 w-3" /> : <Pause className="h-3 w-3" />}
              {paused ? 'Resume' : 'Pause'}
            </Button>
            <Button size="sm" variant="outline" onClick={clear} className="gap-1.5"><Trash2 className="h-3 w-3" /> Clear</Button>
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
        <select
          value={componentFilter || ''}
          onChange={e => setComponentFilter(e.target.value || null)}
          className="h-9 rounded-lg border border-border/40 bg-background/80 px-3 text-xs text-foreground"
        >
          <option value="">All Components</option>
          {components.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      {/* Log Display */}
      <div ref={scrollRef} className="flex-1 rounded-2xl border border-border/40 overflow-auto font-mono text-xs p-1 min-h-0" style={{ background: 'hsl(var(--surface-elevated))' }}>
        <div className="flex items-center gap-2 px-3 py-2 border-b border-border/20 mb-1 sticky top-0 z-10" style={{ background: 'hsl(var(--surface-elevated))' }}>
          <Terminal className="h-3 w-3 text-muted-foreground" />
          <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Output</span>
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

import { useState, useRef, useEffect } from 'react';
import { useLogs } from '@/hooks/useLogs';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Pause, Play, Trash2, Download, Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { LogLevel } from '@/mocks/mockData';

const levelColors: Record<LogLevel, string> = {
  DEBUG: 'text-muted-foreground',
  INFO: 'text-ws-info',
  WARN: 'text-ws-warning',
  ERROR: 'text-ws-error',
};

const levelBg: Record<LogLevel, string> = {
  DEBUG: 'bg-muted-foreground/10',
  INFO: 'bg-ws-info/10',
  WARN: 'bg-ws-warning/10',
  ERROR: 'bg-ws-error/10',
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
    <div className="h-full flex flex-col gap-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Log Viewer</h1>
          <p className="text-sm text-muted-foreground">{filtered.length} entries {paused ? '(paused)' : '(streaming)'}</p>
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

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search logs..." className="h-8 text-sm pl-8 bg-background" />
        </div>
        <div className="flex gap-1">
          {levels.map(l => (
            <button
              key={l}
              onClick={() => setLevelFilter(levelFilter === l ? null : l)}
              className={cn('px-2.5 py-1 rounded text-xs font-medium transition-colors', levelFilter === l ? `${levelBg[l]} ${levelColors[l]}` : 'text-muted-foreground hover:text-foreground hover:bg-secondary/50')}
            >
              {l}
            </button>
          ))}
        </div>
        <select
          value={componentFilter || ''}
          onChange={e => setComponentFilter(e.target.value || null)}
          className="h-8 rounded-md border border-input bg-background px-2 text-xs text-foreground"
        >
          <option value="">All Components</option>
          {components.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      {/* Log Display */}
      <div ref={scrollRef} className="flex-1 glass-card overflow-auto font-mono text-xs p-1 min-h-0">
        {filtered.map(entry => (
          <div key={entry.id} className="flex items-start gap-2 px-3 py-1 hover:bg-secondary/30 rounded">
            <span className="text-muted-foreground/60 shrink-0 w-[180px]">{entry.timestamp.replace('T', ' ').slice(0, 23)}</span>
            <span className={cn('shrink-0 w-12 font-semibold', levelColors[entry.level])}>{entry.level}</span>
            <span className="text-ws-wal shrink-0 w-[120px] truncate">{entry.component}</span>
            <span className="text-foreground">{entry.message}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

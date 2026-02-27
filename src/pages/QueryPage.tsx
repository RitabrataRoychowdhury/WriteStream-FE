import { useState, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { Play, Clock, Database, Radio, Eye, Layers, HardDrive, Trash2, Copy, Check } from 'lucide-react';

type QueryTarget = 'postgresql' | 'mysql' | 'clickhouse' | 'mongodb' | 'kafka' | 'reactive_views' | 'shards' | 'wal' | 'cdc';

interface QueryResult {
  columns: string[];
  rows: Record<string, string | number>[];
  executionTimeMs: number;
  rowCount: number;
  target: QueryTarget;
}

interface QueryHistoryItem {
  id: string;
  query: string;
  target: QueryTarget;
  timestamp: string;
  executionTimeMs: number;
  rowCount: number;
}

const TARGET_OPTIONS: { value: QueryTarget; label: string; icon: React.ElementType; color: string }[] = [
  { value: 'postgresql', label: 'PostgreSQL', icon: Database, color: 'var(--ws-sink)' },
  { value: 'mysql', label: 'MySQL', icon: Database, color: 'var(--ws-sink)' },
  { value: 'clickhouse', label: 'ClickHouse', icon: Database, color: 'var(--ws-sink)' },
  { value: 'mongodb', label: 'MongoDB', icon: Database, color: 'var(--ws-sink)' },
  { value: 'kafka', label: 'Kafka Broker', icon: Radio, color: 'var(--ws-source)' },
  { value: 'reactive_views', label: 'Reactive Views', icon: Eye, color: 'var(--ws-reactive)' },
  { value: 'shards', label: 'Shards', icon: Layers, color: 'var(--ws-shard)' },
  { value: 'wal', label: 'WAL', icon: HardDrive, color: 'var(--ws-wal)' },
  { value: 'cdc', label: 'CDC Streams', icon: Database, color: 'var(--ws-source)' },
];

const EXAMPLE_QUERIES: Record<QueryTarget, string> = {
  postgresql: 'SELECT * FROM users ORDER BY created_at DESC LIMIT 100;',
  mysql: 'SELECT * FROM orders WHERE status = "active" LIMIT 50;',
  clickhouse: 'SELECT toDate(event_time) as day, count() FROM events GROUP BY day ORDER BY day DESC LIMIT 30;',
  mongodb: 'db.users.find({ status: "active" }).sort({ createdAt: -1 }).limit(50)',
  kafka: 'CONSUME FROM events_topic LIMIT 20;',
  reactive_views: 'SELECT * FROM account_balances WHERE balance > 1000;',
  shards: 'SELECT shard_id, count(*) as events, avg(processing_time_ms) FROM shard_metrics GROUP BY shard_id;',
  wal: 'SELECT segment_id, size_bytes, seq_start, seq_end, status FROM wal_segments ORDER BY seq_start DESC LIMIT 20;',
  cdc: 'SELECT source, table_name, operation, lag_ms FROM cdc_events ORDER BY timestamp DESC LIMIT 50;',
};

function generateMockResults(target: QueryTarget, query: string): QueryResult {
  const startTime = performance.now();
  const rand = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;

  let columns: string[] = [];
  let rows: Record<string, string | number>[] = [];

  switch (target) {
    case 'postgresql':
    case 'mysql':
      columns = ['id', 'name', 'email', 'status', 'created_at'];
      rows = Array.from({ length: rand(5, 15) }, (_, i) => ({
        id: 1000 + i,
        name: ['Alice', 'Bob', 'Charlie', 'Diana', 'Eve'][i % 5],
        email: `user${i}@example.com`,
        status: ['active', 'inactive', 'pending'][i % 3],
        created_at: new Date(Date.now() - rand(0, 86400000 * 30)).toISOString().slice(0, 19),
      }));
      break;
    case 'clickhouse':
      columns = ['day', 'event_count', 'avg_latency_ms', 'p99_latency_ms'];
      rows = Array.from({ length: rand(10, 20) }, (_, i) => ({
        day: new Date(Date.now() - i * 86400000).toISOString().slice(0, 10),
        event_count: rand(100000, 500000),
        avg_latency_ms: +(Math.random() * 20 + 5).toFixed(2),
        p99_latency_ms: +(Math.random() * 100 + 40).toFixed(2),
      }));
      break;
    case 'mongodb':
      columns = ['_id', 'username', 'status', 'loginCount', 'lastSeen'];
      rows = Array.from({ length: rand(5, 10) }, (_, i) => ({
        _id: `6${rand(10000, 99999)}a${rand(1000, 9999)}`,
        username: `user_${rand(100, 999)}`,
        status: ['active', 'idle', 'offline'][i % 3],
        loginCount: rand(1, 200),
        lastSeen: new Date(Date.now() - rand(0, 3600000 * 48)).toISOString().slice(0, 19),
      }));
      break;
    case 'kafka':
      columns = ['offset', 'partition', 'key', 'value', 'timestamp'];
      rows = Array.from({ length: rand(8, 20) }, (_, i) => ({
        offset: 1000000 + i,
        partition: rand(0, 11),
        key: `evt-${rand(10000, 99999)}`,
        value: JSON.stringify({ type: ['insert', 'update', 'delete'][i % 3], table: 'users' }).slice(0, 40),
        timestamp: new Date(Date.now() - i * 100).toISOString().slice(11, 23),
      }));
      break;
    case 'reactive_views':
      columns = ['account_id', 'currency', 'balance', 'tx_count', 'last_updated'];
      rows = Array.from({ length: rand(5, 12) }, (_, i) => ({
        account_id: `ACC-${rand(1000, 9999)}`,
        currency: ['USD', 'EUR', 'GBP', 'JPY'][i % 4],
        balance: +(Math.random() * 50000 + 100).toFixed(2),
        tx_count: rand(10, 500),
        last_updated: new Date(Date.now() - rand(0, 60000)).toISOString().slice(11, 23),
      }));
      break;
    case 'shards':
      columns = ['shard_id', 'events', 'avg_processing_ms', 'buffer_pct', 'backpressure'];
      rows = Array.from({ length: 4 }, (_, i) => ({
        shard_id: i + 1,
        events: rand(10000, 50000),
        avg_processing_ms: +(Math.random() * 5 + 0.5).toFixed(2),
        buffer_pct: rand(20, 85),
        backpressure: rand(0, 1) ? 'false' : 'true',
      }));
      break;
    case 'wal':
      columns = ['segment_id', 'size_mb', 'seq_start', 'seq_end', 'status', 'age'];
      rows = Array.from({ length: rand(8, 14) }, (_, i) => ({
        segment_id: `segment-${String(i + 1).padStart(4, '0')}`,
        size_mb: +(Math.random() * 200 + 50).toFixed(1),
        seq_start: i * 100000 + 1,
        seq_end: (i + 1) * 100000,
        status: i < 2 ? 'compactable' : i === 13 ? 'active' : 'sealed',
        age: i === 0 ? '12s' : `${i}m ${rand(0, 59)}s`,
      }));
      break;
    case 'cdc':
      columns = ['source', 'table', 'operation', 'lag_ms', 'position', 'timestamp'];
      rows = Array.from({ length: rand(8, 15) }, (_, i) => ({
        source: ['mysql_cdc', 'pg_cdc'][i % 2],
        table: ['users', 'orders', 'payments', 'products'][i % 4],
        operation: ['INSERT', 'UPDATE', 'DELETE'][i % 3],
        lag_ms: rand(50, 500),
        position: i % 2 === 0 ? `mysql-bin.000${rand(100, 200)}:${rand(10000, 99999)}` : `0/${rand(1, 9)}A${rand(1000, 9999)}`,
        timestamp: new Date(Date.now() - i * rand(100, 2000)).toISOString().slice(11, 23),
      }));
      break;
  }

  return {
    columns,
    rows,
    executionTimeMs: +(performance.now() - startTime + Math.random() * 50).toFixed(2),
    rowCount: rows.length,
    target,
  };
}

export default function QueryPage() {
  const [target, setTarget] = useState<QueryTarget>('postgresql');
  const [query, setQuery] = useState(EXAMPLE_QUERIES.postgresql);
  const [result, setResult] = useState<QueryResult | null>(null);
  const [running, setRunning] = useState(false);
  const [history, setHistory] = useState<QueryHistoryItem[]>([]);
  const [copied, setCopied] = useState(false);

  const handleTargetChange = useCallback((t: QueryTarget) => {
    setTarget(t);
    setQuery(EXAMPLE_QUERIES[t]);
  }, []);

  const handleRun = useCallback(() => {
    if (!query.trim()) return;
    setRunning(true);
    setTimeout(() => {
      const res = generateMockResults(target, query);
      setResult(res);
      setHistory(prev => [{
        id: Date.now().toString(36),
        query: query.slice(0, 80),
        target,
        timestamp: new Date().toLocaleTimeString(),
        executionTimeMs: res.executionTimeMs,
        rowCount: res.rowCount,
      }, ...prev].slice(0, 20));
      setRunning(false);
    }, 300 + Math.random() * 400);
  }, [query, target]);

  const handleCopyResult = useCallback(() => {
    if (!result) return;
    const text = [result.columns.join('\t'), ...result.rows.map(r => result.columns.map(c => String(r[c] ?? '')).join('\t'))].join('\n');
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [result]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault();
      handleRun();
    }
  }, [handleRun]);

  const selectedTarget = TARGET_OPTIONS.find(t => t.value === target)!;

  return (
    <div className="h-full flex flex-col gap-3">
      {/* Header */}
      <div>
        <h1 className="text-lg font-semibold text-foreground">Query Explorer</h1>
        <p className="text-xs text-muted-foreground">Query data across all WriteStream targets — databases, Kafka, reactive views, shards, WAL, CDCs</p>
      </div>

      {/* Target selector */}
      <div className="flex flex-wrap gap-1.5">
        {TARGET_OPTIONS.map(opt => {
          const Icon = opt.icon;
          const active = target === opt.value;
          return (
            <button
              key={opt.value}
              onClick={() => handleTargetChange(opt.value)}
              className={cn(
                'flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs transition-all border',
                active
                  ? 'border-primary/40 bg-primary/10 text-foreground font-medium'
                  : 'border-transparent text-muted-foreground hover:text-foreground hover:bg-secondary/30'
              )}
            >
              <Icon className="h-3 w-3" style={{ color: active ? `hsl(${opt.color})` : undefined }} />
              {opt.label}
            </button>
          );
        })}
      </div>

      {/* Query input + results */}
      <div className="flex-1 flex gap-3 min-h-0">
        <div className="flex-1 flex flex-col gap-3 min-h-0">
          {/* Query editor */}
          <div className="glass-card overflow-hidden">
            <div className="flex items-center justify-between px-3 py-1.5 border-b border-border/30">
              <div className="flex items-center gap-2">
                <selectedTarget.icon className="h-3.5 w-3.5" style={{ color: `hsl(${selectedTarget.color})` }} />
                <span className="text-xs font-medium text-foreground">{selectedTarget.label}</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-[10px] text-muted-foreground font-mono">⌘+Enter to run</span>
                <button
                  onClick={handleRun}
                  disabled={running}
                  className={cn(
                    'flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium transition-colors',
                    running ? 'bg-secondary text-muted-foreground' : 'bg-primary text-primary-foreground hover:bg-primary/90'
                  )}
                >
                  <Play className="h-3 w-3" />
                  {running ? 'Running...' : 'Run'}
                </button>
              </div>
            </div>
            <textarea
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              rows={4}
              spellCheck={false}
              className="w-full px-3 py-2 bg-transparent text-xs font-mono text-foreground resize-none focus:outline-none leading-relaxed caret-primary"
              placeholder={`Enter your ${selectedTarget.label} query...`}
            />
          </div>

          {/* Results */}
          {result && (
            <div className="flex-1 glass-card overflow-hidden flex flex-col min-h-0">
              <div className="flex items-center justify-between px-3 py-1.5 border-b border-border/30">
                <div className="flex items-center gap-3">
                  <span className="text-xs text-foreground font-medium">{result.rowCount} rows</span>
                  <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                    <Clock className="h-2.5 w-2.5" />
                    {result.executionTimeMs.toFixed(1)}ms
                  </span>
                </div>
                <button onClick={handleCopyResult} className="p-1 rounded hover:bg-secondary/50 text-muted-foreground hover:text-foreground">
                  {copied ? <Check className="h-3 w-3 text-ws-success" /> : <Copy className="h-3 w-3" />}
                </button>
              </div>
              <div className="flex-1 overflow-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-border/30">
                      {result.columns.map(col => (
                        <th key={col} className="px-3 py-1.5 text-left text-[10px] uppercase tracking-wider text-muted-foreground font-semibold bg-secondary/20 sticky top-0">{col}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {result.rows.map((row, i) => (
                      <tr key={i} className="border-b border-border/20 hover:bg-secondary/10 transition-colors">
                        {result.columns.map(col => (
                          <td key={col} className="px-3 py-1.5 font-mono text-foreground whitespace-nowrap">{String(row[col] ?? '')}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {!result && (
            <div className="flex-1 glass-card flex items-center justify-center text-muted-foreground text-sm">
              Run a query to see results
            </div>
          )}
        </div>

        {/* History sidebar */}
        <div className="w-56 glass-card overflow-hidden flex flex-col shrink-0">
          <div className="px-3 py-2 border-b border-border/30 flex items-center justify-between">
            <span className="text-xs font-medium text-foreground">History</span>
            {history.length > 0 && (
              <button onClick={() => setHistory([])} className="p-0.5 rounded hover:bg-secondary/50 text-muted-foreground">
                <Trash2 className="h-3 w-3" />
              </button>
            )}
          </div>
          <div className="flex-1 overflow-y-auto">
            {history.length === 0 && (
              <div className="p-3 text-[10px] text-muted-foreground text-center">No queries yet</div>
            )}
            {history.map(h => {
              const opt = TARGET_OPTIONS.find(t => t.value === h.target)!;
              return (
                <button
                  key={h.id}
                  onClick={() => { setTarget(h.target); setQuery(EXAMPLE_QUERIES[h.target]); }}
                  className="w-full px-3 py-2 text-left border-b border-border/20 hover:bg-secondary/20 transition-colors"
                >
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <opt.icon className="h-2.5 w-2.5" style={{ color: `hsl(${opt.color})` }} />
                    <span className="text-[10px] text-muted-foreground">{opt.label}</span>
                    <span className="text-[10px] text-muted-foreground/60 ml-auto">{h.timestamp}</span>
                  </div>
                  <p className="text-[10px] font-mono text-foreground/70 truncate">{h.query}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[9px] text-muted-foreground">{h.rowCount} rows</span>
                    <span className="text-[9px] text-muted-foreground">{h.executionTimeMs.toFixed(0)}ms</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

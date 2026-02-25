import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Gauge, Play, Square, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BenchmarkResult {
  id: string;
  type: string;
  duration: string;
  avgTps: number;
  p99LatencyMs: number;
  totalEvents: number;
  timestamp: string;
}

const historicalResults: BenchmarkResult[] = [
  { id: '1', type: 'Pure WAL', duration: '30s', avgTps: 1_250_000, p99LatencyMs: 0.8, totalEvents: 37_500_000, timestamp: '2024-02-20 14:30' },
  { id: '2', type: 'Single Sink (PG)', duration: '60s', avgTps: 185_000, p99LatencyMs: 12.5, totalEvents: 11_100_000, timestamp: '2024-02-20 14:15' },
  { id: '3', type: 'Multi-Sink', duration: '60s', avgTps: 145_000, p99LatencyMs: 85.0, totalEvents: 8_700_000, timestamp: '2024-02-20 13:45' },
];

export default function BenchmarksPage() {
  const [testType, setTestType] = useState('pure_wal');
  const [duration, setDuration] = useState('30');
  const [targetTps, setTargetTps] = useState('200000');
  const [payloadSize, setPayloadSize] = useState('256');
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState<BenchmarkResult[]>(historicalResults);

  const runBenchmark = () => {
    setRunning(true);
    setProgress(0);
    const dur = Number(duration) * 1000;
    const start = Date.now();
    const id = setInterval(() => {
      const elapsed = Date.now() - start;
      const pct = Math.min((elapsed / dur) * 100, 100);
      setProgress(pct);
      if (pct >= 100) {
        clearInterval(id);
        setRunning(false);
        setResults(prev => [{
          id: String(Date.now()),
          type: testType === 'pure_wal' ? 'Pure WAL' : testType === 'single_sink' ? 'Single Sink' : 'Multi-Sink',
          duration: `${duration}s`,
          avgTps: Math.floor(Math.random() * 500000 + 100000),
          p99LatencyMs: Math.random() * 50 + 1,
          totalEvents: Math.floor(Math.random() * 50000000),
          timestamp: new Date().toLocaleString(),
        }, ...prev]);
      }
    }, 100);
  };

  const testTypes = [
    { value: 'pure_wal', label: 'Pure WAL' },
    { value: 'single_sink', label: 'Single Sink' },
    { value: 'multi_sink', label: 'Multi-Sink' },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-xl font-semibold text-foreground">Performance Benchmarks</h1>
        <p className="text-sm text-muted-foreground">Run and compare benchmark tests</p>
      </div>

      {/* Benchmark Config */}
      <div className="glass-card p-5 space-y-4">
        <h3 className="text-sm font-semibold text-foreground">Configure Benchmark</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Test Type</label>
            <div className="flex gap-1">
              {testTypes.map(t => (
                <button
                  key={t.value}
                  onClick={() => setTestType(t.value)}
                  className={cn('px-3 py-1.5 rounded text-xs font-medium transition-colors', testType === t.value ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground hover:text-foreground')}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Duration (seconds)</label>
            <Input value={duration} onChange={e => setDuration(e.target.value)} className="h-8 text-sm bg-background" />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Target TPS</label>
            <Input value={targetTps} onChange={e => setTargetTps(e.target.value)} className="h-8 text-sm bg-background" />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Payload Size (bytes)</label>
            <Input value={payloadSize} onChange={e => setPayloadSize(e.target.value)} className="h-8 text-sm bg-background" />
          </div>
        </div>

        {running && (
          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Running benchmark...</span>
              <span className="font-mono text-foreground">{progress.toFixed(0)}%</span>
            </div>
            <div className="h-2 rounded-full bg-secondary overflow-hidden">
              <div className="h-full rounded-full bg-primary transition-all duration-100" style={{ width: `${progress}%` }} />
            </div>
          </div>
        )}

        <Button size="sm" className="gap-1.5" onClick={runBenchmark} disabled={running}>
          {running ? <><Square className="h-3 w-3" /> Running...</> : <><Play className="h-3 w-3" /> Run Benchmark</>}
        </Button>
      </div>

      {/* Results */}
      <div className="glass-card overflow-hidden">
        <div className="p-4 border-b border-border/50">
          <h3 className="text-sm font-semibold text-foreground flex items-center gap-2"><Clock className="h-4 w-4 text-muted-foreground" /> Benchmark History</h3>
        </div>
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-border/50">
              <th className="text-left p-3 text-muted-foreground font-medium">Type</th>
              <th className="text-left p-3 text-muted-foreground font-medium">Duration</th>
              <th className="text-right p-3 text-muted-foreground font-medium">Avg TPS</th>
              <th className="text-right p-3 text-muted-foreground font-medium">P99 Latency</th>
              <th className="text-right p-3 text-muted-foreground font-medium">Total Events</th>
              <th className="text-right p-3 text-muted-foreground font-medium">Timestamp</th>
            </tr>
          </thead>
          <tbody>
            {results.map(r => (
              <tr key={r.id} className="border-b border-border/30 hover:bg-secondary/20">
                <td className="p-3 font-medium text-foreground">{r.type}</td>
                <td className="p-3 text-muted-foreground">{r.duration}</td>
                <td className="p-3 text-right font-mono font-semibold text-primary">{r.avgTps.toLocaleString()}</td>
                <td className="p-3 text-right font-mono text-foreground">{r.p99LatencyMs.toFixed(1)}ms</td>
                <td className="p-3 text-right font-mono text-muted-foreground">{r.totalEvents.toLocaleString()}</td>
                <td className="p-3 text-right text-muted-foreground">{r.timestamp}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { TiltCard } from '@/components/shared/TiltCard';
import { ScrollReveal } from '@/components/shared/ScrollReveal';
import { FloatingShape } from '@/components/shared/FloatingShape';
import { Play, Square, Clock, Gauge, Trophy } from 'lucide-react';
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
    { value: 'pure_wal', label: 'Pure WAL', color: 'text-ws-wal' },
    { value: 'single_sink', label: 'Single Sink', color: 'text-ws-sink' },
    { value: 'multi_sink', label: 'Multi-Sink', color: 'text-ws-hotpath' },
  ];

  const bestTps = results.length > 0 ? Math.max(...results.map(r => r.avgTps)) : 0;

  return (
    <div className="space-y-8 max-w-[1400px] mx-auto relative">
      <FloatingShape variant="gradient-orb" size={200} className="top-0 -right-20 opacity-50" delay={0} color="hsl(var(--ws-hotpath) / 0.08)" />
      <FloatingShape variant="ring" size={60} className="top-[500px] -left-6 opacity-30" delay={2200} />

      {/* Header */}
      <ScrollReveal>
        <div className="flex items-end justify-between">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <div className="h-1.5 w-1.5 rounded-full bg-ws-hotpath animate-pulse" />
              <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground font-semibold">Performance</span>
            </div>
            <h1 className="text-3xl font-bold text-foreground tracking-tight font-display">
              <span className="text-gradient">Benchmarks</span>
            </h1>
            <p className="text-sm text-muted-foreground mt-2 font-light">Run and compare throughput benchmarks across pipeline modes.</p>
          </div>
          {bestTps > 0 && (
            <div className="hidden md:flex items-center gap-2 px-4 py-2.5 rounded-2xl glass-card text-xs">
              <Trophy className="h-3.5 w-3.5 text-ws-warning" />
              <span className="text-muted-foreground">Best:</span>
              <span className="font-mono font-bold text-foreground">{bestTps.toLocaleString()}</span>
              <span className="text-muted-foreground">TPS</span>
            </div>
          )}
        </div>
      </ScrollReveal>

      {/* Config */}
      <ScrollReveal delay={60}>
        <TiltCard className="p-6 space-y-5" intensity={0.2}>
          <div className="flex items-center gap-2.5">
            <div className="flex items-center justify-center h-7 w-7 rounded-lg bg-primary/10">
              <Gauge className="h-3.5 w-3.5 text-primary" />
            </div>
            <h3 className="text-sm font-semibold text-foreground font-display">Configure Benchmark</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <div>
              <label className="section-label mb-2 block">Test Type</label>
              <div className="flex gap-1.5">
                {testTypes.map(t => (
                  <button
                    key={t.value}
                    onClick={() => setTestType(t.value)}
                    className={cn(
                      'px-3 py-2 rounded-lg text-xs font-medium transition-all border',
                      testType === t.value
                        ? 'bg-primary/10 text-foreground border-primary/30'
                        : 'border-transparent text-muted-foreground hover:text-foreground hover:bg-secondary/40'
                    )}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>
            {[
              { label: 'Duration (seconds)', value: duration, setter: setDuration },
              { label: 'Target TPS', value: targetTps, setter: setTargetTps },
              { label: 'Payload Size (bytes)', value: payloadSize, setter: setPayloadSize },
            ].map(field => (
              <div key={field.label}>
                <label className="section-label mb-2 block">{field.label}</label>
                <Input value={field.value} onChange={e => field.setter(e.target.value)} className="h-9 text-sm bg-background/80 border-border/40" />
              </div>
            ))}
          </div>

          {running && (
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Running benchmark...</span>
                <span className="font-mono font-bold text-foreground">{progress.toFixed(0)}%</span>
              </div>
              <div className="h-2.5 rounded-full bg-secondary/40 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-100"
                  style={{
                    width: `${progress}%`,
                    background: 'linear-gradient(90deg, hsl(var(--primary)), hsl(var(--ws-hotpath)))',
                  }}
                />
              </div>
            </div>
          )}

          <Button size="sm" className="gap-1.5" onClick={runBenchmark} disabled={running}>
            {running ? <><Square className="h-3 w-3" /> Running...</> : <><Play className="h-3 w-3" /> Run Benchmark</>}
          </Button>
        </TiltCard>
      </ScrollReveal>

      {/* Results */}
      <ScrollReveal delay={120}>
        <TiltCard className="overflow-hidden" intensity={0.2}>
          <div className="p-5 border-b border-border/30">
            <div className="flex items-center gap-2.5">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <h3 className="text-sm font-semibold text-foreground font-display">Benchmark History</h3>
              <span className="text-[10px] text-muted-foreground ml-auto font-mono">{results.length} runs</span>
            </div>
          </div>
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border/30">
                {['Type', 'Duration', 'Avg TPS', 'P99 Latency', 'Total Events', 'Timestamp'].map(h => (
                  <th key={h} className={cn('p-4 text-[10px] uppercase tracking-wider text-muted-foreground font-semibold', h === 'Type' || h === 'Duration' ? 'text-left' : 'text-right')}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {results.map(r => (
                <tr key={r.id} className="border-b border-border/20 hover:bg-secondary/10 transition-colors">
                  <td className="p-4 font-medium text-foreground">{r.type}</td>
                  <td className="p-4 text-muted-foreground">{r.duration}</td>
                  <td className="p-4 text-right">
                    <span className={cn('font-mono font-bold', r.avgTps === bestTps ? 'text-ws-success' : 'text-primary')}>{r.avgTps.toLocaleString()}</span>
                  </td>
                  <td className="p-4 text-right font-mono text-foreground">{r.p99LatencyMs.toFixed(1)}ms</td>
                  <td className="p-4 text-right font-mono text-muted-foreground">{r.totalEvents.toLocaleString()}</td>
                  <td className="p-4 text-right text-muted-foreground">{r.timestamp}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </TiltCard>
      </ScrollReveal>
    </div>
  );
}

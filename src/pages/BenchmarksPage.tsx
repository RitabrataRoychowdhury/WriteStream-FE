import { useState, useCallback, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { TiltCard } from '@/components/shared/TiltCard';
import { ScrollReveal } from '@/components/shared/ScrollReveal';
import { FloatingShape } from '@/components/shared/FloatingShape';
import { Play, Square, Clock, Gauge, Trophy, Wifi, WifiOff } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ingestEvent, fetchParsedMetrics } from '@/api/services';

interface BenchmarkResult {
  id: string;
  type: string;
  duration: string;
  avgTps: number;
  p99LatencyMs: number;
  totalEvents: number;
  timestamp: string;
  live: boolean;
}

const historicalResults: BenchmarkResult[] = [
  { id: '1', type: 'Pure WAL', duration: '30s', avgTps: 1_250_000, p99LatencyMs: 0.8, totalEvents: 37_500_000, timestamp: '2024-02-20 14:30', live: false },
  { id: '2', type: 'Single Sink (PG)', duration: '60s', avgTps: 185_000, p99LatencyMs: 12.5, totalEvents: 11_100_000, timestamp: '2024-02-20 14:15', live: false },
  { id: '3', type: 'Multi-Sink', duration: '60s', avgTps: 145_000, p99LatencyMs: 85.0, totalEvents: 8_700_000, timestamp: '2024-02-20 13:45', live: false },
];

export default function BenchmarksPage() {
  const [eventCount, setEventCount] = useState('1000');
  const [payloadSize, setPayloadSize] = useState('256');
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState<BenchmarkResult[]>(historicalResults);
  const [isLive, setIsLive] = useState(false);
  const abortRef = useRef(false);

  // Check if backend is reachable
  useEffect(() => {
    fetchParsedMetrics().then(() => setIsLive(true)).catch(() => setIsLive(false));
  }, []);

  const runBenchmark = useCallback(async () => {
    const count = Number(eventCount);
    if (count <= 0) return;
    setRunning(true);
    setProgress(0);
    abortRef.current = false;

    const payload: Record<string, unknown> = {
      benchmark: true,
      data: 'x'.repeat(Number(payloadSize)),
    };

    const start = performance.now();
    let sent = 0;
    let errors = 0;

    // Send events in parallel batches
    const batchSize = Math.min(50, count);
    const batches = Math.ceil(count / batchSize);

    for (let b = 0; b < batches && !abortRef.current; b++) {
      const remaining = count - sent;
      const thisBatch = Math.min(batchSize, remaining);
      const promises = [];

      for (let i = 0; i < thisBatch; i++) {
        promises.push(
          ingestEvent(`bench-${Date.now()}-${sent + i}`, payload).catch(() => { errors++; })
        );
      }

      await Promise.all(promises);
      sent += thisBatch;
      setProgress((sent / count) * 100);
    }

    const elapsed = performance.now() - start;
    const elapsedSec = elapsed / 1000;

    // Also fetch prometheus metrics for p99
    let p99 = 0;
    try {
      const prom = await fetchParsedMetrics();
      p99 = prom.walWriteLatencyP99;
    } catch {
      p99 = elapsed / count;
    }

    setResults(prev => [{
      id: String(Date.now()),
      type: `HTTP Burst (${count})`,
      duration: `${elapsedSec.toFixed(1)}s`,
      avgTps: Math.floor(sent / elapsedSec),
      p99LatencyMs: p99,
      totalEvents: sent,
      timestamp: new Date().toLocaleString(),
      live: isLive,
    }, ...prev]);

    setRunning(false);
  }, [eventCount, payloadSize, isLive]);

  const bestTps = results.length > 0 ? Math.max(...results.map(r => r.avgTps)) : 0;

  return (
    <div className="space-y-8 max-w-[1400px] mx-auto relative">
      <FloatingShape variant="gradient-orb" size={200} className="top-0 -right-20 opacity-50" delay={0} color="hsl(var(--ws-hotpath) / 0.08)" />
      <FloatingShape variant="ring" size={60} className="top-[500px] -left-6 opacity-30" delay={2200} />

      <ScrollReveal>
        <div className="flex items-end justify-between">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <div className="h-1.5 w-1.5 rounded-full bg-ws-hotpath animate-pulse" />
              <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground font-semibold">Performance</span>
              {isLive ? <Wifi className="h-3 w-3 text-ws-success" /> : <WifiOff className="h-3 w-3 text-ws-warning" />}
            </div>
            <h1 className="text-3xl font-bold text-foreground tracking-tight font-display">
              <span className="text-gradient">Benchmarks</span>
            </h1>
            <p className="text-sm text-muted-foreground mt-2 font-light">
              {isLive ? 'Send real HTTP event bursts and measure backend throughput.' : 'Connect backend to run live benchmarks. Showing historical mock data.'}
            </p>
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
            <Gauge className="h-4 w-4 text-primary" />
            <h3 className="text-sm font-semibold text-foreground font-display">Configure Benchmark</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            <div>
              <label className="section-label mb-2 block">Event Count</label>
              <div className="flex gap-1.5">
                {['100', '1000', '10000'].map(v => (
                  <button
                    key={v}
                    onClick={() => setEventCount(v)}
                    className={cn(
                      'px-3 py-2 rounded-lg text-xs font-medium transition-all border',
                      eventCount === v ? 'bg-primary/10 text-foreground border-primary/30' : 'border-transparent text-muted-foreground hover:text-foreground hover:bg-secondary/40'
                    )}
                  >
                    {Number(v).toLocaleString()}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="section-label mb-2 block">Custom Count</label>
              <Input value={eventCount} onChange={e => setEventCount(e.target.value)} className="h-9 text-sm bg-background/80 border-border/40" />
            </div>
            <div>
              <label className="section-label mb-2 block">Payload Size (bytes)</label>
              <Input value={payloadSize} onChange={e => setPayloadSize(e.target.value)} className="h-9 text-sm bg-background/80 border-border/40" />
            </div>
          </div>

          {running && (
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Sending events...</span>
                <span className="font-mono font-bold text-foreground">{progress.toFixed(0)}%</span>
              </div>
              <div className="h-2.5 rounded-full bg-secondary/40 overflow-hidden">
                <div className="h-full rounded-full transition-all duration-100" style={{ width: `${progress}%`, background: 'linear-gradient(90deg, hsl(var(--primary)), hsl(var(--ws-hotpath)))' }} />
              </div>
            </div>
          )}

          <div className="flex items-center gap-3">
            <Button size="sm" className="gap-1.5" onClick={runBenchmark} disabled={running}>
              {running ? <><Square className="h-3 w-3" /> Running...</> : <><Play className="h-3 w-3" /> Run Benchmark</>}
            </Button>
            {!isLive && <span className="text-xs text-muted-foreground">Backend not connected — events will be sent but may fail</span>}
          </div>
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
                {['Type', 'Duration', 'Avg TPS', 'P99 Latency', 'Total Events', 'Source', 'Timestamp'].map(h => (
                  <th key={h} className={cn('p-4 text-[10px] uppercase tracking-wider text-muted-foreground font-semibold', h === 'Type' || h === 'Duration' || h === 'Source' ? 'text-left' : 'text-right')}>{h}</th>
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
                  <td className="p-4">
                    <span className={cn('text-[10px] px-2 py-0.5 rounded-lg font-medium border', r.live ? 'bg-ws-success/10 text-ws-success border-ws-success/15' : 'bg-secondary text-muted-foreground border-border/30')}>{r.live ? 'live' : 'mock'}</span>
                  </td>
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

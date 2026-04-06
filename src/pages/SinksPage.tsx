import { useMetrics } from '@/hooks/useMetrics';
import { StatusDot } from '@/components/shared/StatusDot';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { TiltCard } from '@/components/shared/TiltCard';
import { ScrollReveal } from '@/components/shared/ScrollReveal';
import { FloatingShape } from '@/components/shared/FloatingShape';
import { Database, Play, Square, RotateCcw, Droplets } from 'lucide-react';
import { useState } from 'react';

export default function SinksPage() {
  const { metrics } = useMetrics(3000);
  const [expanded, setExpanded] = useState<string | null>(null);

  return (
    <div className="space-y-8 max-w-[1400px] mx-auto relative">
      <FloatingShape variant="gradient-orb" size={160} className="top-10 -right-12 opacity-50" delay={300} />
      <FloatingShape variant="dot-grid" size={90} className="top-[400px] -left-6 opacity-25" delay={1800} />

      {/* Header */}
      <ScrollReveal>
        <div className="flex items-end justify-between">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <div className="h-1.5 w-1.5 rounded-full bg-ws-sink animate-pulse" />
              <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground font-semibold">Downstream</span>
            </div>
            <h1 className="text-3xl font-bold text-foreground tracking-tight font-display">
              Sinks <span className="text-gradient">Configuration</span>
            </h1>
            <p className="text-sm text-muted-foreground mt-2 font-light">Manage downstream database sinks and write performance.</p>
          </div>
          <div className="hidden md:flex items-center gap-2 px-4 py-2.5 rounded-2xl glass-card text-xs text-muted-foreground">
            <Database className="h-3.5 w-3.5 text-ws-sink" />
            <span className="font-mono font-bold text-foreground">{metrics.sinks.length}</span>
            <span>configured</span>
          </div>
        </div>
      </ScrollReveal>

      {/* Sink Cards */}
      <div className="space-y-4">
        {metrics.sinks.map((sink, i) => {
          const isExpanded = expanded === sink.name;
          return (
            <ScrollReveal key={sink.name} delay={i * 60}>
              <TiltCard className="overflow-hidden" glowColor="hsl(var(--ws-sink) / 0.05)" intensity={0.3}>
                <div
                  className="flex items-center justify-between p-5 cursor-pointer"
                  onClick={() => setExpanded(isExpanded ? null : sink.name)}
                >
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center h-7 w-7 rounded-lg bg-ws-sink/10">
                      <Database className="h-3.5 w-3.5 text-ws-sink" />
                    </div>
                    <StatusDot status={sink.status} />
                    <span className="text-sm font-semibold text-foreground">{sink.name}</span>
                    {sink.backpressure && (
                      <span className="text-[10px] px-2 py-0.5 rounded-lg bg-ws-warning/10 text-ws-warning font-semibold border border-ws-warning/15">
                        Backpressure
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-5">
                    <div className="text-right">
                      <div className="text-xs font-mono font-bold text-ws-sink">{(sink.tps / 1000).toFixed(1)}K /s</div>
                      <div className="text-[10px] text-muted-foreground">Buffer: {(sink.bufferUtilization * 100).toFixed(0)}%</div>
                    </div>
                    <Switch checked={sink.enabled} />
                  </div>
                </div>

                {isExpanded && (
                  <div className="border-t border-border/30 p-5 space-y-5" style={{ background: 'hsl(var(--secondary) / 0.15)' }}>
                    {/* Stats row */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {[
                        { label: 'Write TPS', value: `${(sink.tps / 1000).toFixed(1)}K`, color: 'text-ws-sink' },
                        { label: 'Batch Size', value: sink.batchSize.toLocaleString(), color: 'text-foreground' },
                        { label: 'Latency P99', value: `${sink.latencyP99Ms.toFixed(1)}ms`, color: 'text-foreground' },
                        { label: 'Buffer', value: `${(sink.bufferUtilization * 100).toFixed(0)}%`, color: 'text-foreground' },
                      ].map(stat => (
                        <div key={stat.label} className="glass-card p-3">
                          <span className="text-[10px] text-muted-foreground block uppercase tracking-wider">{stat.label}</span>
                          <span className={`text-sm font-mono font-semibold ${stat.color} mt-1 block`}>{stat.value}</span>
                        </div>
                      ))}
                    </div>

                    {/* Buffer bar */}
                    <div className="h-2 rounded-full bg-secondary/40 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${sink.bufferUtilization * 100}%`,
                          background: sink.bufferUtilization > 0.8
                            ? 'hsl(var(--ws-error))'
                            : 'linear-gradient(90deg, hsl(var(--ws-sink)), hsl(var(--ws-shard)))',
                        }}
                      />
                    </div>

                    {/* Config inputs */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="section-label mb-1.5 block">Batch Size</label>
                        <Input defaultValue={sink.batchSize} className="h-9 text-sm bg-background/80 border-border/40" />
                      </div>
                      <div>
                        <label className="section-label mb-1.5 block">Pool Size</label>
                        <Input defaultValue="8" className="h-9 text-sm bg-background/80 border-border/40" />
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 pt-3 border-t border-border/20">
                      <Button size="sm" variant="outline" className="gap-1.5"><Play className="h-3 w-3" /> Start</Button>
                      <Button size="sm" variant="outline" className="gap-1.5"><Square className="h-3 w-3" /> Stop</Button>
                      <Button size="sm" variant="outline" className="gap-1.5"><RotateCcw className="h-3 w-3" /> Restart</Button>
                      <Button size="sm" variant="outline" className="gap-1.5"><Droplets className="h-3 w-3" /> Drain</Button>
                      <div className="flex-1" />
                      <Button size="sm">Save</Button>
                    </div>
                  </div>
                )}
              </TiltCard>
            </ScrollReveal>
          );
        })}
      </div>
    </div>
  );
}

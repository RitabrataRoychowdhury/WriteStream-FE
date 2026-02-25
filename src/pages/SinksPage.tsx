import { useMetrics } from '@/hooks/useMetrics';
import { StatusDot } from '@/components/shared/StatusDot';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Database, Play, Square, RotateCcw, Droplets } from 'lucide-react';
import { useState } from 'react';

export default function SinksPage() {
  const { metrics } = useMetrics(3000);
  const [expanded, setExpanded] = useState<string | null>(null);

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-xl font-semibold text-foreground">Sinks Configuration</h1>
        <p className="text-sm text-muted-foreground">Manage downstream database sinks</p>
      </div>

      <div className="space-y-3">
        {metrics.sinks.map(sink => {
          const isExpanded = expanded === sink.name;
          return (
            <div key={sink.name} className="glass-card overflow-hidden">
              <div className="flex items-center justify-between p-4 cursor-pointer" onClick={() => setExpanded(isExpanded ? null : sink.name)}>
                <div className="flex items-center gap-3">
                  <Database className="h-4 w-4 text-ws-sink" />
                  <StatusDot status={sink.status} />
                  <span className="text-sm font-medium text-foreground">{sink.name}</span>
                  {sink.backpressure && <span className="text-[10px] px-1.5 py-0.5 rounded bg-ws-warning/20 text-ws-warning font-medium">Backpressure</span>}
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-xs font-mono text-muted-foreground">{(sink.tps / 1000).toFixed(1)}K /s</div>
                  <Switch checked={sink.enabled} />
                </div>
              </div>

              {isExpanded && (
                <div className="border-t border-border/50 p-4 bg-secondary/20 space-y-4">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div>
                      <span className="text-[10px] text-muted-foreground block">Write TPS</span>
                      <span className="text-sm font-mono font-semibold text-ws-sink">{(sink.tps / 1000).toFixed(1)}K</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-muted-foreground block">Batch Size</span>
                      <span className="text-sm font-mono text-foreground">{sink.batchSize.toLocaleString()}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-muted-foreground block">Latency P99</span>
                      <span className="text-sm font-mono text-foreground">{sink.latencyP99Ms.toFixed(1)}ms</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-muted-foreground block">Buffer</span>
                      <span className="text-sm font-mono text-foreground">{(sink.bufferUtilization * 100).toFixed(0)}%</span>
                    </div>
                  </div>

                  <div className="h-2 rounded-full bg-secondary overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-500" style={{ width: `${sink.bufferUtilization * 100}%`, background: sink.bufferUtilization > 0.8 ? 'hsl(var(--ws-error))' : 'hsl(var(--ws-sink))' }} />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-muted-foreground mb-1 block">Batch Size</label>
                      <Input defaultValue={sink.batchSize} className="h-8 text-sm bg-background" />
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground mb-1 block">Pool Size</label>
                      <Input defaultValue="8" className="h-8 text-sm bg-background" />
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-2 border-t border-border/30">
                    <Button size="sm" variant="outline" className="gap-1.5"><Play className="h-3 w-3" /> Start</Button>
                    <Button size="sm" variant="outline" className="gap-1.5"><Square className="h-3 w-3" /> Stop</Button>
                    <Button size="sm" variant="outline" className="gap-1.5"><RotateCcw className="h-3 w-3" /> Restart</Button>
                    <Button size="sm" variant="outline" className="gap-1.5"><Droplets className="h-3 w-3" /> Drain</Button>
                    <div className="flex-1" />
                    <Button size="sm">Save</Button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

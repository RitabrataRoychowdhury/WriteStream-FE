import { useState, useRef, useCallback, useEffect } from 'react';
import { useMetrics } from '@/hooks/useMetrics';
import { StatusDot } from '@/components/shared/StatusDot';
import { X, ZoomIn, ZoomOut, Maximize2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ComponentStatus } from '@/mocks/mockData';

// Node definitions for the DAG
interface DagNode {
  id: string;
  label: string;
  x: number;
  y: number;
  color: string;
  group: string;
}

interface DagEdge {
  from: string;
  to: string;
}

const NODES: DagNode[] = [
  // Sources
  { id: 'http', label: 'HTTP API', x: 80, y: 60, color: 'var(--ws-source)', group: 'source' },
  { id: 'kafka_in', label: 'Kafka', x: 230, y: 60, color: 'var(--ws-source)', group: 'source' },
  { id: 'mysql_cdc', label: 'MySQL CDC', x: 380, y: 60, color: 'var(--ws-source)', group: 'source' },
  { id: 'pg_cdc', label: 'PG CDC', x: 530, y: 60, color: 'var(--ws-source)', group: 'source' },
  // Sequencer
  { id: 'sequencer', label: 'Sequencer', x: 305, y: 180, color: 'var(--ws-hotpath)', group: 'hotpath' },
  // WAL
  { id: 'wal', label: 'WAL', x: 305, y: 280, color: 'var(--ws-wal)', group: 'wal' },
  // Shards
  { id: 'shard1', label: 'Shard 1', x: 105, y: 380, color: 'var(--ws-shard)', group: 'shard' },
  { id: 'shard2', label: 'Shard 2', x: 305, y: 380, color: 'var(--ws-shard)', group: 'shard' },
  { id: 'shard3', label: 'Shard 3', x: 505, y: 380, color: 'var(--ws-shard)', group: 'shard' },
  // Sinks
  { id: 'pg_sink', label: 'PostgreSQL', x: 40, y: 500, color: 'var(--ws-sink)', group: 'sink' },
  { id: 'mysql_sink', label: 'MySQL', x: 190, y: 500, color: 'var(--ws-sink)', group: 'sink' },
  { id: 'ch_sink', label: 'ClickHouse', x: 340, y: 500, color: 'var(--ws-sink)', group: 'sink' },
  { id: 'kafka_out', label: 'Kafka Out', x: 490, y: 500, color: 'var(--ws-sink)', group: 'sink' },
  // Reactive
  { id: 'reactive', label: 'Reactive Views', x: 640, y: 440, color: 'var(--ws-reactive)', group: 'reactive' },
];

const EDGES: DagEdge[] = [
  { from: 'http', to: 'sequencer' },
  { from: 'kafka_in', to: 'sequencer' },
  { from: 'mysql_cdc', to: 'sequencer' },
  { from: 'pg_cdc', to: 'sequencer' },
  { from: 'sequencer', to: 'wal' },
  { from: 'wal', to: 'shard1' },
  { from: 'wal', to: 'shard2' },
  { from: 'wal', to: 'shard3' },
  { from: 'shard1', to: 'pg_sink' },
  { from: 'shard1', to: 'mysql_sink' },
  { from: 'shard2', to: 'ch_sink' },
  { from: 'shard3', to: 'kafka_out' },
  { from: 'shard3', to: 'reactive' },
];

const NODE_W = 130;
const NODE_H = 52;

function getNodeMetrics(nodeId: string, metrics: ReturnType<typeof useMetrics>['metrics']) {
  const m = metrics;
  switch (nodeId) {
    case 'http': return { tps: m.sources[0]?.tps, status: m.sources[0]?.status || 'healthy' as ComponentStatus, latency: m.sources[0]?.latencyP99Ms };
    case 'kafka_in': return { tps: m.sources[1]?.tps, status: m.sources[1]?.status || 'healthy' as ComponentStatus, latency: m.sources[1]?.latencyP99Ms };
    case 'mysql_cdc': return { tps: m.sources[2]?.tps, status: m.sources[2]?.status || 'healthy' as ComponentStatus, latency: m.sources[2]?.latencyP99Ms };
    case 'pg_cdc': return { tps: m.sources[3]?.tps, status: m.sources[3]?.status || 'healthy' as ComponentStatus, latency: m.sources[3]?.latencyP99Ms };
    case 'sequencer': return { tps: m.sequencer.tps, status: 'healthy' as ComponentStatus, latency: null };
    case 'wal': return { tps: m.wal.writeTps, status: 'healthy' as ComponentStatus, latency: m.wal.fsyncLatencyMs };
    case 'shard1': return { tps: m.shards[0]?.tps, status: 'healthy' as ComponentStatus, latency: null };
    case 'shard2': return { tps: m.shards[1]?.tps, status: 'healthy' as ComponentStatus, latency: null };
    case 'shard3': return { tps: m.shards[2]?.tps, status: 'healthy' as ComponentStatus, latency: null };
    case 'pg_sink': return { tps: m.sinks[0]?.tps, status: m.sinks[0]?.status || 'healthy' as ComponentStatus, latency: m.sinks[0]?.latencyP99Ms };
    case 'mysql_sink': return { tps: m.sinks[1]?.tps, status: m.sinks[1]?.status || 'healthy' as ComponentStatus, latency: m.sinks[1]?.latencyP99Ms };
    case 'ch_sink': return { tps: m.sinks[2]?.tps, status: m.sinks[2]?.status || 'healthy' as ComponentStatus, latency: m.sinks[2]?.latencyP99Ms };
    case 'kafka_out': return { tps: m.sinks[3]?.tps, status: m.sinks[3]?.status || 'healthy' as ComponentStatus, latency: m.sinks[3]?.latencyP99Ms };
    case 'reactive': return { tps: m.reactive.updatesPerSec, status: 'healthy' as ComponentStatus, latency: null };
    default: return { tps: 0, status: 'healthy' as ComponentStatus, latency: null };
  }
}

function formatTps(n: number | undefined): string {
  if (!n) return '0';
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(0)}K`;
  return String(Math.floor(n));
}

export default function PipelinePage() {
  const { metrics } = useMetrics(1500);
  const [selected, setSelected] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const dragging = useRef(false);
  const lastMouse = useRef({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('[data-node]')) return;
    dragging.current = true;
    lastMouse.current = { x: e.clientX, y: e.clientY };
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!dragging.current) return;
    const dx = e.clientX - lastMouse.current.x;
    const dy = e.clientY - lastMouse.current.y;
    lastMouse.current = { x: e.clientX, y: e.clientY };
    setPan(p => ({ x: p.x + dx, y: p.y + dy }));
  }, []);

  const handleMouseUp = useCallback(() => { dragging.current = false; }, []);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    setZoom(z => Math.max(0.4, Math.min(2, z - e.deltaY * 0.001)));
  }, []);

  const resetView = useCallback(() => { setZoom(1); setPan({ x: 0, y: 0 }); }, []);

  const selectedNode = selected ? NODES.find(n => n.id === selected) : null;
  const selectedMetrics = selected ? getNodeMetrics(selected, metrics) : null;

  return (
    <div className="h-full flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Pipeline Overview</h1>
          <p className="text-sm text-muted-foreground">Real-time data flow visualization</p>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={() => setZoom(z => Math.min(2, z + 0.2))} className="p-2 rounded-md hover:bg-secondary/50 text-muted-foreground hover:text-foreground transition-colors"><ZoomIn className="h-4 w-4" /></button>
          <button onClick={() => setZoom(z => Math.max(0.4, z - 0.2))} className="p-2 rounded-md hover:bg-secondary/50 text-muted-foreground hover:text-foreground transition-colors"><ZoomOut className="h-4 w-4" /></button>
          <button onClick={resetView} className="p-2 rounded-md hover:bg-secondary/50 text-muted-foreground hover:text-foreground transition-colors"><Maximize2 className="h-4 w-4" /></button>
        </div>
      </div>

      <div className="flex-1 flex gap-4 min-h-0">
        {/* DAG Canvas */}
        <div
          ref={containerRef}
          className="flex-1 glass-card overflow-hidden cursor-grab active:cursor-grabbing relative"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onWheel={handleWheel}
        >
          <svg
            width="100%"
            height="100%"
            viewBox="0 0 780 580"
            style={{ transform: `scale(${zoom}) translate(${pan.x / zoom}px, ${pan.y / zoom}px)` }}
            className="transition-transform duration-100"
          >
            <defs>
              {/* Animated flow markers */}
              <marker id="arrowhead" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
                <polygon points="0 0, 8 3, 0 6" fill="hsl(var(--muted-foreground))" opacity="0.5" />
              </marker>
            </defs>

            {/* Edges */}
            {EDGES.map((edge, i) => {
              const from = NODES.find(n => n.id === edge.from)!;
              const to = NODES.find(n => n.id === edge.to)!;
              const x1 = from.x + NODE_W / 2;
              const y1 = from.y + NODE_H;
              const x2 = to.x + NODE_W / 2;
              const y2 = to.y;
              const midY = (y1 + y2) / 2;

              return (
                <g key={i}>
                  <path
                    d={`M ${x1} ${y1} C ${x1} ${midY}, ${x2} ${midY}, ${x2} ${y2}`}
                    fill="none"
                    stroke="hsl(var(--border))"
                    strokeWidth="2"
                    strokeDasharray="6 4"
                    className="animate-flow-dash"
                    markerEnd="url(#arrowhead)"
                  />
                </g>
              );
            })}

            {/* Nodes */}
            {NODES.map(node => {
              const nm = getNodeMetrics(node.id, metrics);
              const isSelected = selected === node.id;
              return (
                <g
                  key={node.id}
                  data-node
                  className="cursor-pointer"
                  onClick={() => setSelected(isSelected ? null : node.id)}
                >
                  {/* Shadow/glow */}
                  <rect
                    x={node.x - 2}
                    y={node.y - 2}
                    width={NODE_W + 4}
                    height={NODE_H + 4}
                    rx={12}
                    fill={`hsl(${node.color} / ${isSelected ? 0.2 : 0.05})`}
                    className="transition-all duration-300"
                  />
                  {/* Card */}
                  <rect
                    x={node.x}
                    y={node.y}
                    width={NODE_W}
                    height={NODE_H}
                    rx={10}
                    fill="hsl(var(--card))"
                    stroke={`hsl(${node.color} / ${isSelected ? 0.8 : 0.3})`}
                    strokeWidth={isSelected ? 2 : 1}
                    className="transition-all duration-300"
                  />
                  {/* Status dot */}
                  <circle
                    cx={node.x + 14}
                    cy={node.y + 16}
                    r={4}
                    fill={nm.status === 'healthy' ? 'hsl(var(--ws-success))' : nm.status === 'degraded' ? 'hsl(var(--ws-warning))' : nm.status === 'down' ? 'hsl(var(--ws-error))' : 'hsl(var(--muted-foreground))'}
                  />
                  {/* Label */}
                  <text x={node.x + 24} y={node.y + 20} fill="hsl(var(--foreground))" fontSize="11" fontWeight="600" fontFamily="Inter, sans-serif">
                    {node.label}
                  </text>
                  {/* TPS */}
                  <text x={node.x + 14} y={node.y + 40} fill={`hsl(${node.color})`} fontSize="11" fontWeight="700" fontFamily="JetBrains Mono, monospace">
                    {formatTps(nm.tps)} /s
                  </text>
                  {/* Latency */}
                  {nm.latency != null && (
                    <text x={node.x + NODE_W - 10} y={node.y + 40} fill="hsl(var(--muted-foreground))" fontSize="9" fontFamily="JetBrains Mono, monospace" textAnchor="end">
                      {nm.latency.toFixed(1)}ms
                    </text>
                  )}
                </g>
              );
            })}
          </svg>
        </div>

        {/* Detail Panel */}
        {selected && selectedNode && selectedMetrics && (
          <div className="w-72 glass-card p-4 animate-slide-in-right overflow-auto">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <StatusDot status={selectedMetrics.status} size="md" />
                <span className="font-semibold text-foreground">{selectedNode.label}</span>
              </div>
              <button onClick={() => setSelected(null)} className="p-1 rounded hover:bg-secondary/50 text-muted-foreground"><X className="h-4 w-4" /></button>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between py-2 border-b border-border/50">
                <span className="text-xs text-muted-foreground">Status</span>
                <span className={cn('text-xs font-medium capitalize', selectedMetrics.status === 'healthy' ? 'text-ws-success' : selectedMetrics.status === 'degraded' ? 'text-ws-warning' : 'text-ws-error')}>
                  {selectedMetrics.status}
                </span>
              </div>
              <div className="flex justify-between py-2 border-b border-border/50">
                <span className="text-xs text-muted-foreground">Throughput</span>
                <span className="text-xs font-mono font-semibold text-foreground">{formatTps(selectedMetrics.tps)} /s</span>
              </div>
              {selectedMetrics.latency != null && (
                <div className="flex justify-between py-2 border-b border-border/50">
                  <span className="text-xs text-muted-foreground">Latency P99</span>
                  <span className="text-xs font-mono font-semibold text-foreground">{selectedMetrics.latency.toFixed(2)} ms</span>
                </div>
              )}
              <div className="flex justify-between py-2 border-b border-border/50">
                <span className="text-xs text-muted-foreground">Group</span>
                <span className="text-xs font-medium text-muted-foreground capitalize">{selectedNode.group}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

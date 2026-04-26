import { useState, useRef, useCallback } from 'react';
import { useMetrics } from '@/hooks/useMetrics';
import { StatusDot } from '@/components/shared/StatusDot';
import { ScrollReveal } from '@/components/shared/ScrollReveal';
import { FloatingShape } from '@/components/shared/FloatingShape';
import { X, ZoomIn, ZoomOut, Maximize2, Layers, Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ComponentStatus } from '@/mocks/mockData';

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
  { id: 'http', label: 'HTTP API', x: 80, y: 60, color: 'var(--ws-source)', group: 'source' },
  { id: 'kafka_in', label: 'Kafka', x: 230, y: 60, color: 'var(--ws-source)', group: 'source' },
  { id: 'mysql_cdc', label: 'MySQL CDC', x: 380, y: 60, color: 'var(--ws-source)', group: 'source' },
  { id: 'pg_cdc', label: 'PG CDC', x: 530, y: 60, color: 'var(--ws-source)', group: 'source' },
  { id: 'sequencer', label: 'Sequencer', x: 305, y: 180, color: 'var(--ws-hotpath)', group: 'hotpath' },
  { id: 'wal', label: 'WAL', x: 305, y: 280, color: 'var(--ws-wal)', group: 'wal' },
  { id: 'shard1', label: 'Shard 1', x: 105, y: 380, color: 'var(--ws-shard)', group: 'shard' },
  { id: 'shard2', label: 'Shard 2', x: 305, y: 380, color: 'var(--ws-shard)', group: 'shard' },
  { id: 'shard3', label: 'Shard 3', x: 505, y: 380, color: 'var(--ws-shard)', group: 'shard' },
  { id: 'pg_sink', label: 'PostgreSQL', x: 40, y: 500, color: 'var(--ws-sink)', group: 'sink' },
  { id: 'mysql_sink', label: 'MySQL', x: 190, y: 500, color: 'var(--ws-sink)', group: 'sink' },
  { id: 'ch_sink', label: 'ClickHouse', x: 340, y: 500, color: 'var(--ws-sink)', group: 'sink' },
  { id: 'kafka_out', label: 'Kafka Out', x: 490, y: 500, color: 'var(--ws-sink)', group: 'sink' },
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
const NODE_H = 56;

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

// Group labels
const GROUP_LABELS = [
  { label: 'SOURCES', y: 40, color: 'var(--ws-source)' },
  { label: 'HOT PATH', y: 165, color: 'var(--ws-hotpath)' },
  { label: 'WAL', y: 265, color: 'var(--ws-wal)' },
  { label: 'SHARDS', y: 365, color: 'var(--ws-shard)' },
  { label: 'SINKS', y: 485, color: 'var(--ws-sink)' },
];

export default function PipelinePage() {
  const { metrics } = useMetrics(1500);
  const [selected, setSelected] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const dragging = useRef(false);
  const lastMouse = useRef({ x: 0, y: 0 });
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);

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
    <div className="h-full flex flex-col gap-5 relative">
      {/* Floating decorative elements */}
      <FloatingShape variant="gradient-orb" size={160} className="-top-10 -right-16 opacity-40" delay={0} />
      <FloatingShape variant="ring" size={60} className="top-20 -left-8 opacity-30" delay={800} />

      <ScrollReveal>
        <div className="flex items-end justify-between">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <Layers className="h-3.5 w-3.5 text-primary" />
              <span className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground font-semibold">Data Flow Theatre</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-foreground tracking-tight font-display">
              Pipeline <span className="text-gradient">Topology</span>
            </h1>
            <p className="text-sm text-muted-foreground mt-2 font-light">Real-time data flow visualization across all components</p>
          </div>
          <div className="hidden md:flex items-center gap-2">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-border/40 text-[11px] text-muted-foreground bg-card/40">
              <Calendar className="h-3 w-3" />
              <span>Last 24h</span>
            </div>
            <div className="flex items-center gap-1 glass-card p-1.5 rounded-xl">
              <button onClick={() => setZoom(z => Math.min(2, z + 0.2))} className="p-2 rounded-lg hover:bg-secondary/60 text-muted-foreground hover:text-foreground transition-all duration-200 btn-magnetic"><ZoomIn className="h-4 w-4" /></button>
              <button onClick={() => setZoom(z => Math.max(0.4, z - 0.2))} className="p-2 rounded-lg hover:bg-secondary/60 text-muted-foreground hover:text-foreground transition-all duration-200 btn-magnetic"><ZoomOut className="h-4 w-4" /></button>
              <div className="w-px h-5 bg-border/40" />
              <button onClick={resetView} className="p-2 rounded-lg hover:bg-secondary/60 text-muted-foreground hover:text-foreground transition-all duration-200 btn-magnetic"><Maximize2 className="h-4 w-4" /></button>
              <div className="px-2 text-[10px] font-mono text-muted-foreground">{Math.round(zoom * 100)}%</div>
            </div>
          </div>
        </div>
      </ScrollReveal>

      <div className="flex-1 flex gap-5 min-h-0">
        {/* DAG Canvas */}
        <div
          className="flex-1 rounded-2xl border border-border/40 overflow-hidden cursor-grab active:cursor-grabbing relative"
          style={{ background: 'linear-gradient(165deg, hsl(var(--surface-elevated)) 0%, hsl(var(--surface-2)) 100%)' }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onWheel={handleWheel}
        >
          {/* Cinematic corner halos */}
          <div className="pointer-events-none absolute -top-20 -right-20 h-60 w-60 rounded-full opacity-25 blur-3xl"
            style={{ background: 'hsl(var(--ws-warning) / 0.5)' }} />
          <div className="pointer-events-none absolute -bottom-24 -left-24 h-72 w-72 rounded-full opacity-20 blur-3xl"
            style={{ background: 'hsl(var(--ws-wal) / 0.5)' }} />

          {/* Canvas dot pattern */}
          <div className="absolute inset-0 opacity-20" style={{
            backgroundImage: 'radial-gradient(circle, hsl(var(--canvas-dot)) 1px, transparent 1px)',
            backgroundSize: '24px 24px',
          }} />

          {/* Subtle gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.02] via-transparent to-ws-wal/[0.02] pointer-events-none" />

          <svg
            width="100%"
            height="100%"
            viewBox="0 0 780 580"
            style={{ transform: `scale(${zoom}) translate(${pan.x / zoom}px, ${pan.y / zoom}px)` }}
            className="transition-transform duration-100 relative z-10"
          >
            <defs>
              <marker id="arrowhead" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
                <polygon points="0 0, 8 3, 0 6" fill="hsl(var(--muted-foreground))" opacity="0.3" />
              </marker>
              <filter id="node-shadow" x="-20%" y="-20%" width="140%" height="140%">
                <feDropShadow dx="0" dy="3" stdDeviation="8" floodOpacity="0.06" floodColor="hsl(var(--foreground))" />
              </filter>
              <filter id="node-glow" x="-30%" y="-30%" width="160%" height="160%">
                <feDropShadow dx="0" dy="0" stdDeviation="12" floodOpacity="0.15" />
              </filter>
              {/* Animated gradient for edges */}
              <linearGradient id="edge-gradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.3" />
                <stop offset="100%" stopColor="hsl(var(--muted-foreground))" stopOpacity="0.15" />
              </linearGradient>
            </defs>

            {/* Group zone labels */}
            {GROUP_LABELS.map(g => (
              <text key={g.label} x={12} y={g.y} fill={`hsl(${g.color})`} opacity="0.25" fontSize="9" fontWeight="700" fontFamily="Outfit, sans-serif" letterSpacing="0.15em">
                {g.label}
              </text>
            ))}

            {/* Edges */}
            {EDGES.map((edge, i) => {
              const from = NODES.find(n => n.id === edge.from)!;
              const to = NODES.find(n => n.id === edge.to)!;
              const x1 = from.x + NODE_W / 2;
              const y1 = from.y + NODE_H;
              const x2 = to.x + NODE_W / 2;
              const y2 = to.y;
              const midY = (y1 + y2) / 2;
              const isHighlighted = hoveredNode === edge.from || hoveredNode === edge.to || selected === edge.from || selected === edge.to;

              return (
                <path
                  key={i}
                  d={`M ${x1} ${y1} C ${x1} ${midY}, ${x2} ${midY}, ${x2} ${y2}`}
                  fill="none"
                  stroke={isHighlighted ? 'hsl(var(--primary))' : 'hsl(var(--border))'}
                  strokeWidth={isHighlighted ? 2 : 1.5}
                  strokeDasharray="6 4"
                  className="animate-flow-dash transition-all duration-300"
                  markerEnd="url(#arrowhead)"
                  opacity={isHighlighted ? 0.8 : 0.5}
                />
              );
            })}

            {/* Nodes */}
            {NODES.map(node => {
              const nm = getNodeMetrics(node.id, metrics);
              const isSelected = selected === node.id;
              const isHovered = hoveredNode === node.id;
              return (
                <g
                  key={node.id}
                  data-node
                  className="cursor-pointer"
                  onClick={() => setSelected(isSelected ? null : node.id)}
                  onMouseEnter={() => setHoveredNode(node.id)}
                  onMouseLeave={() => setHoveredNode(null)}
                  filter={isHovered || isSelected ? 'url(#node-glow)' : 'url(#node-shadow)'}
                  style={{ transition: 'filter 0.3s ease' }}
                >
                  {/* Glow ring */}
                  {isSelected && (
                    <rect
                      x={node.x - 4}
                      y={node.y - 4}
                      width={NODE_W + 8}
                      height={NODE_H + 8}
                      rx={18}
                      fill="none"
                      stroke={`hsl(${node.color} / 0.25)`}
                      strokeWidth="2"
                      className="animate-pulse-glow"
                    />
                  )}
                  {/* Card body */}
                  <rect
                    x={node.x}
                    y={node.y}
                    width={NODE_W}
                    height={NODE_H}
                    rx={14}
                    fill="hsl(var(--card))"
                    stroke={`hsl(${node.color} / ${isSelected ? 0.5 : isHovered ? 0.3 : 0.12})`}
                    strokeWidth={isSelected ? 1.5 : 1}
                    className="transition-all duration-300"
                  />
                  {/* Top accent line */}
                  <rect
                    x={node.x + 16}
                    y={node.y}
                    width={NODE_W - 32}
                    height={1.5}
                    rx={1}
                    fill={`hsl(${node.color} / ${isSelected || isHovered ? 0.5 : 0.15})`}
                    className="transition-all duration-300"
                  />
                  {/* Status */}
                  <circle
                    cx={node.x + 14}
                    cy={node.y + 18}
                    r={3.5}
                    fill={nm.status === 'healthy' ? 'hsl(var(--ws-success))' : nm.status === 'degraded' ? 'hsl(var(--ws-warning))' : nm.status === 'down' ? 'hsl(var(--ws-error))' : 'hsl(var(--muted-foreground))'}
                  />
                  {nm.status === 'healthy' && (
                    <circle
                      cx={node.x + 14}
                      cy={node.y + 18}
                      r={3.5}
                      fill="none"
                      stroke="hsl(var(--ws-success))"
                      strokeWidth="1"
                      opacity="0.4"
                      className="animate-ping"
                      style={{ transformOrigin: `${node.x + 14}px ${node.y + 18}px`, animationDuration: '2s' }}
                    />
                  )}
                  {/* Label */}
                  <text x={node.x + 24} y={node.y + 22} fill="hsl(var(--foreground))" fontSize="11" fontWeight="600" fontFamily="Outfit, Inter, sans-serif">
                    {node.label}
                  </text>
                  {/* TPS */}
                  <text x={node.x + 14} y={node.y + 44} fill={`hsl(${node.color})`} fontSize="11" fontWeight="700" fontFamily="JetBrains Mono, monospace">
                    {formatTps(nm.tps)} /s
                  </text>
                  {nm.latency != null && (
                    <text x={node.x + NODE_W - 10} y={node.y + 44} fill="hsl(var(--muted-foreground))" fontSize="9" fontFamily="JetBrains Mono, monospace" textAnchor="end">
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
          <div className="w-72 rounded-2xl border border-border/30 p-5 animate-slide-in-right overflow-auto relative"
            style={{ background: 'hsl(var(--surface-elevated))' }}>
            {/* Top gradient accent */}
            <div className="absolute top-0 left-0 right-0 h-1 rounded-t-2xl" style={{ background: `linear-gradient(90deg, hsl(${selectedNode.color}), hsl(${selectedNode.color} / 0.3))` }} />

            <div className="flex items-center justify-between mb-5 mt-1">
              <div className="flex items-center gap-2.5">
                <StatusDot status={selectedMetrics.status} size="md" />
                <span className="font-semibold text-foreground font-display">{selectedNode.label}</span>
              </div>
              <button onClick={() => setSelected(null)} className="p-1.5 rounded-lg hover:bg-secondary/60 text-muted-foreground transition-colors btn-magnetic"><X className="h-4 w-4" /></button>
            </div>
            <div className="space-y-1">
              {[
                { label: 'Status', value: selectedMetrics.status, color: selectedMetrics.status === 'healthy' ? 'text-ws-success' : selectedMetrics.status === 'degraded' ? 'text-ws-warning' : 'text-ws-error' },
                { label: 'Throughput', value: `${formatTps(selectedMetrics.tps)} /s` },
                ...(selectedMetrics.latency != null ? [{ label: 'Latency P99', value: `${selectedMetrics.latency.toFixed(2)} ms` }] : []),
                { label: 'Group', value: selectedNode.group },
              ].map(row => (
                <div key={row.label} className="flex justify-between items-center py-3 border-b border-border/20 last:border-0">
                  <span className="text-xs text-muted-foreground">{row.label}</span>
                  <span className={cn('text-xs font-mono font-semibold capitalize', (row as any).color || 'text-foreground')}>
                    {row.value}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

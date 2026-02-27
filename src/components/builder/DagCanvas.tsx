import { useRef, useCallback, useState } from 'react';
import { cn } from '@/lib/utils';
import type { PipelineNode, PipelineEdge, ConnectorTemplate } from '@/lib/pipelineTypes';
import { ZoomIn, ZoomOut, Maximize2, Link2, Unlink } from 'lucide-react';

const NODE_W = 140;
const NODE_H = 48;

const colorMap: Record<string, string> = {
  source: 'var(--ws-source)',
  sink: 'var(--ws-sink)',
  sequencer: 'var(--ws-hotpath)',
  wal: 'var(--ws-wal)',
  shard: 'var(--ws-shard)',
  reactive: 'var(--ws-reactive)',
  cdc: 'var(--ws-source)',
  query: 'var(--ws-info)',
};

interface DagCanvasProps {
  nodes: PipelineNode[];
  edges: PipelineEdge[];
  selectedNodeId: string | null;
  connectingFrom: string | null;
  onSelectNode: (id: string | null) => void;
  onMoveNode: (id: string, x: number, y: number) => void;
  onDrop: (template: ConnectorTemplate, x: number, y: number) => void;
  onStartConnect: (nodeId: string) => void;
  onEndConnect: (nodeId: string) => void;
  onCancelConnect: () => void;
}

export function DagCanvas({
  nodes, edges, selectedNodeId, connectingFrom,
  onSelectNode, onMoveNode, onDrop,
  onStartConnect, onEndConnect, onCancelConnect,
}: DagCanvasProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const dragging = useRef<{ id: string; offsetX: number; offsetY: number } | null>(null);
  const panning = useRef(false);
  const lastMouse = useRef({ x: 0, y: 0 });

  const svgPoint = useCallback((clientX: number, clientY: number) => {
    if (!containerRef.current) return { x: 0, y: 0 };
    const rect = containerRef.current.getBoundingClientRect();
    return {
      x: (clientX - rect.left - pan.x) / zoom,
      y: (clientY - rect.top - pan.y) / zoom,
    };
  }, [zoom, pan]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('[data-node]')) return;
    panning.current = true;
    lastMouse.current = { x: e.clientX, y: e.clientY };
    if (connectingFrom) onCancelConnect();
    else onSelectNode(null);
  }, [connectingFrom, onCancelConnect, onSelectNode]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (dragging.current) {
      const pt = svgPoint(e.clientX, e.clientY);
      onMoveNode(dragging.current.id, pt.x - dragging.current.offsetX, pt.y - dragging.current.offsetY);
    } else if (panning.current) {
      const dx = e.clientX - lastMouse.current.x;
      const dy = e.clientY - lastMouse.current.y;
      lastMouse.current = { x: e.clientX, y: e.clientY };
      setPan(p => ({ x: p.x + dx, y: p.y + dy }));
    }
  }, [svgPoint, onMoveNode]);

  const handleMouseUp = useCallback(() => {
    dragging.current = null;
    panning.current = false;
  }, []);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    setZoom(z => Math.max(0.3, Math.min(2.5, z - e.deltaY * 0.001)));
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const data = e.dataTransfer.getData('application/connector');
    if (!data) return;
    const template = JSON.parse(data) as ConnectorTemplate;
    const pt = svgPoint(e.clientX, e.clientY);
    onDrop(template, pt.x - NODE_W / 2, pt.y - NODE_H / 2);
  }, [svgPoint, onDrop]);

  const resetView = useCallback(() => { setZoom(1); setPan({ x: 0, y: 0 }); }, []);

  return (
    <div className="flex-1 flex flex-col min-h-0">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-3 py-1.5 border-b border-border/30">
        <div className="flex items-center gap-1">
          <button onClick={() => setZoom(z => Math.min(2.5, z + 0.2))} className="p-1.5 rounded hover:bg-secondary/50 text-muted-foreground hover:text-foreground transition-colors">
            <ZoomIn className="h-3.5 w-3.5" />
          </button>
          <button onClick={() => setZoom(z => Math.max(0.3, z - 0.2))} className="p-1.5 rounded hover:bg-secondary/50 text-muted-foreground hover:text-foreground transition-colors">
            <ZoomOut className="h-3.5 w-3.5" />
          </button>
          <button onClick={resetView} className="p-1.5 rounded hover:bg-secondary/50 text-muted-foreground hover:text-foreground transition-colors">
            <Maximize2 className="h-3.5 w-3.5" />
          </button>
          <span className="text-[10px] text-muted-foreground ml-2 font-mono">{Math.round(zoom * 100)}%</span>
        </div>
        {connectingFrom && (
          <span className="text-[10px] text-ws-warning animate-pulse">Click a target node to connect, or click canvas to cancel</span>
        )}
      </div>

      {/* Canvas */}
      <div
        ref={containerRef}
        className="flex-1 overflow-hidden cursor-grab active:cursor-grabbing relative bg-[hsl(var(--background))]"
        style={{ backgroundImage: 'radial-gradient(circle, hsl(var(--border) / 0.3) 1px, transparent 1px)', backgroundSize: `${20 * zoom}px ${20 * zoom}px`, backgroundPosition: `${pan.x}px ${pan.y}px` }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
      >
        <svg
          ref={svgRef}
          width="100%"
          height="100%"
          style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`, transformOrigin: '0 0' }}
        >
          <defs>
            <marker id="builder-arrow" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
              <polygon points="0 0, 8 3, 0 6" fill="hsl(var(--muted-foreground))" opacity="0.5" />
            </marker>
          </defs>

          {/* Edges */}
          {edges.map(edge => {
            const from = nodes.find(n => n.id === edge.from);
            const to = nodes.find(n => n.id === edge.to);
            if (!from || !to) return null;
            const x1 = from.x + NODE_W / 2;
            const y1 = from.y + NODE_H;
            const x2 = to.x + NODE_W / 2;
            const y2 = to.y;
            const midY = (y1 + y2) / 2;
            return (
              <path
                key={edge.id}
                d={`M ${x1} ${y1} C ${x1} ${midY}, ${x2} ${midY}, ${x2} ${y2}`}
                fill="none"
                stroke="hsl(var(--border))"
                strokeWidth="1.5"
                strokeDasharray="6 4"
                className="animate-flow-dash"
                markerEnd="url(#builder-arrow)"
              />
            );
          })}

          {/* Nodes */}
          {nodes.map(node => {
            const isSelected = selectedNodeId === node.id;
            const isConnecting = connectingFrom === node.id;
            const color = colorMap[node.type] || 'var(--ws-source)';
            return (
              <g
                key={node.id}
                data-node
                className="cursor-pointer"
                onMouseDown={(e) => {
                  e.stopPropagation();
                  if (connectingFrom && connectingFrom !== node.id) {
                    onEndConnect(node.id);
                    return;
                  }
                  const pt = svgPoint(e.clientX, e.clientY);
                  dragging.current = { id: node.id, offsetX: pt.x - node.x, offsetY: pt.y - node.y };
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  if (!connectingFrom) onSelectNode(node.id);
                }}
              >
                {/* Glow */}
                <rect x={node.x - 2} y={node.y - 2} width={NODE_W + 4} height={NODE_H + 4} rx={10}
                  fill={`hsl(${color} / ${isSelected ? 0.15 : 0.04})`}
                  className="transition-all duration-200"
                />
                {/* Card */}
                <rect x={node.x} y={node.y} width={NODE_W} height={NODE_H} rx={8}
                  fill="hsl(var(--card))"
                  stroke={`hsl(${color} / ${isSelected ? 0.8 : isConnecting ? 0.6 : 0.25})`}
                  strokeWidth={isSelected ? 2 : 1}
                  opacity={node.enabled ? 1 : 0.4}
                  className="transition-all duration-200"
                />
                {/* Status */}
                <circle cx={node.x + 12} cy={node.y + NODE_H / 2} r={3}
                  fill={node.enabled ? 'hsl(var(--ws-success))' : 'hsl(var(--muted-foreground))'}
                />
                {/* Label */}
                <text x={node.x + 22} y={node.y + NODE_H / 2 + 1} fill="hsl(var(--foreground))" fontSize="10" fontWeight="600" fontFamily="Inter, sans-serif" dominantBaseline="middle">
                  {node.label.length > 14 ? node.label.slice(0, 13) + '…' : node.label}
                </text>
                {/* Type badge */}
                <text x={node.x + NODE_W - 8} y={node.y + NODE_H / 2 + 1} fill={`hsl(${color})`} fontSize="8" fontFamily="JetBrains Mono, monospace" textAnchor="end" dominantBaseline="middle" opacity="0.7">
                  {node.sourceType || node.sinkType || node.type}
                </text>
                {/* Connect handle */}
                <circle cx={node.x + NODE_W / 2} cy={node.y + NODE_H + 6} r={4}
                  fill="hsl(var(--card))" stroke={`hsl(${color} / 0.5)`} strokeWidth="1"
                  className="cursor-crosshair opacity-0 hover:opacity-100 transition-opacity"
                  onMouseDown={(e) => { e.stopPropagation(); onStartConnect(node.id); }}
                />
                {/* Input handle */}
                <circle cx={node.x + NODE_W / 2} cy={node.y - 6} r={4}
                  fill="hsl(var(--card))" stroke={`hsl(${color} / 0.5)`} strokeWidth="1"
                  className={cn('transition-opacity', connectingFrom ? 'opacity-100' : 'opacity-0 hover:opacity-100')}
                />
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}

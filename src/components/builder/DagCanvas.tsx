import { useRef, useCallback, useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import type { PipelineNode, PipelineEdge, ConnectorTemplate } from '@/lib/pipelineTypes';
import { ZoomIn, ZoomOut, Maximize2, Lock, Unlock, Trash2, MousePointer } from 'lucide-react';

const NODE_W = 160;
const NODE_H = 56;
const HANDLE_R = 6;
const SNAP = 20;

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

const iconPaths: Record<string, string> = {
  source: 'M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5',
  sink: 'M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z M4 22v-7',
  sequencer: 'M13 2L3 14h9l-1 8 10-12h-9l1-8z',
  wal: 'M22 12H2 M5 12V7a5 5 0 0110 0v5 M19 12v5a5 5 0 01-10 0v-5',
  shard: 'M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5',
  reactive: 'M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z M12 9a3 3 0 100 6 3 3 0 000-6z',
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
  onDeleteEdge?: (edgeId: string) => void;
}

export function DagCanvas({
  nodes, edges, selectedNodeId, connectingFrom,
  onSelectNode, onMoveNode, onDrop,
  onStartConnect, onEndConnect, onCancelConnect,
  onDeleteEdge,
}: DagCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [hoveredEdge, setHoveredEdge] = useState<string | null>(null);
  const [snapEnabled, setSnapEnabled] = useState(true);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const dragging = useRef<{ id: string; offsetX: number; offsetY: number } | null>(null);
  const panning = useRef(false);
  const lastMouse = useRef({ x: 0, y: 0 });
  const [dropPreview, setDropPreview] = useState<{ x: number; y: number } | null>(null);

  const svgPoint = useCallback((clientX: number, clientY: number) => {
    if (!containerRef.current) return { x: 0, y: 0 };
    const rect = containerRef.current.getBoundingClientRect();
    return {
      x: (clientX - rect.left - pan.x) / zoom,
      y: (clientY - rect.top - pan.y) / zoom,
    };
  }, [zoom, pan]);

  const snapTo = useCallback((val: number) => snapEnabled ? Math.round(val / SNAP) * SNAP : val, [snapEnabled]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('[data-node]')) return;
    panning.current = true;
    lastMouse.current = { x: e.clientX, y: e.clientY };
    if (connectingFrom) onCancelConnect();
    else onSelectNode(null);
  }, [connectingFrom, onCancelConnect, onSelectNode]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    const pt = svgPoint(e.clientX, e.clientY);
    setMousePos(pt);
    if (dragging.current) {
      onMoveNode(dragging.current.id, snapTo(pt.x - dragging.current.offsetX), snapTo(pt.y - dragging.current.offsetY));
    } else if (panning.current) {
      const dx = e.clientX - lastMouse.current.x;
      const dy = e.clientY - lastMouse.current.y;
      lastMouse.current = { x: e.clientX, y: e.clientY };
      setPan(p => ({ x: p.x + dx, y: p.y + dy }));
    }
  }, [svgPoint, onMoveNode, snapTo]);

  const handleMouseUp = useCallback(() => {
    dragging.current = null;
    panning.current = false;
  }, []);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const pt = svgPoint(e.clientX, e.clientY);
    const oldZoom = zoom;
    const newZoom = Math.max(0.2, Math.min(3, oldZoom - e.deltaY * 0.001));
    const ratio = newZoom / oldZoom;
    setPan(p => ({
      x: e.clientX - (e.clientX - p.x) * ratio,
      y: e.clientY - (e.clientY - p.y) * ratio,
    }));
    setZoom(newZoom);
  }, [zoom, svgPoint]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDropPreview(null);
    const data = e.dataTransfer.getData('application/connector');
    if (!data) return;
    const template = JSON.parse(data) as ConnectorTemplate;
    const pt = svgPoint(e.clientX, e.clientY);
    onDrop(template, snapTo(pt.x - NODE_W / 2), snapTo(pt.y - NODE_H / 2));
  }, [svgPoint, onDrop, snapTo]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
    const pt = svgPoint(e.clientX, e.clientY);
    setDropPreview({ x: snapTo(pt.x - NODE_W / 2), y: snapTo(pt.y - NODE_H / 2) });
  }, [svgPoint, snapTo]);

  const handleDragLeave = useCallback(() => setDropPreview(null), []);

  const resetView = useCallback(() => { setZoom(1); setPan({ x: 0, y: 0 }); }, []);
  const fitView = useCallback(() => {
    if (!containerRef.current || nodes.length === 0) return;
    const rect = containerRef.current.getBoundingClientRect();
    const minX = Math.min(...nodes.map(n => n.x));
    const minY = Math.min(...nodes.map(n => n.y));
    const maxX = Math.max(...nodes.map(n => n.x + NODE_W));
    const maxY = Math.max(...nodes.map(n => n.y + NODE_H));
    const contentW = maxX - minX + 80;
    const contentH = maxY - minY + 80;
    const z = Math.min(rect.width / contentW, rect.height / contentH, 1.5);
    setZoom(z);
    setPan({
      x: (rect.width - contentW * z) / 2 - minX * z + 40 * z,
      y: (rect.height - contentH * z) / 2 - minY * z + 40 * z,
    });
  }, [nodes]);

  // Keyboard
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (hoveredEdge && onDeleteEdge) onDeleteEdge(hoveredEdge);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [hoveredEdge, onDeleteEdge]);

  const edgePath = (from: PipelineNode, to: PipelineNode) => {
    const x1 = from.x + NODE_W / 2;
    const y1 = from.y + NODE_H;
    const x2 = to.x + NODE_W / 2;
    const y2 = to.y;
    const dy = Math.abs(y2 - y1);
    const cpOffset = Math.max(40, dy * 0.5);
    return `M ${x1} ${y1} C ${x1} ${y1 + cpOffset}, ${x2} ${y2 - cpOffset}, ${x2} ${y2}`;
  };

  return (
    <div className="flex-1 flex flex-col min-h-0">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-3 py-1.5 border-b border-border/30 bg-card/20">
        <div className="flex items-center gap-0.5">
          <button onClick={() => setZoom(z => Math.min(3, z + 0.2))} className="p-1.5 rounded hover:bg-secondary/50 text-muted-foreground hover:text-foreground transition-colors" title="Zoom in">
            <ZoomIn className="h-3.5 w-3.5" />
          </button>
          <button onClick={() => setZoom(z => Math.max(0.2, z - 0.2))} className="p-1.5 rounded hover:bg-secondary/50 text-muted-foreground hover:text-foreground transition-colors" title="Zoom out">
            <ZoomOut className="h-3.5 w-3.5" />
          </button>
          <button onClick={fitView} className="p-1.5 rounded hover:bg-secondary/50 text-muted-foreground hover:text-foreground transition-colors" title="Fit view">
            <Maximize2 className="h-3.5 w-3.5" />
          </button>
          <button onClick={() => setSnapEnabled(s => !s)} className={cn('p-1.5 rounded transition-colors', snapEnabled ? 'text-primary bg-primary/10' : 'text-muted-foreground hover:text-foreground hover:bg-secondary/50')} title="Snap to grid">
            {snapEnabled ? <Lock className="h-3.5 w-3.5" /> : <Unlock className="h-3.5 w-3.5" />}
          </button>
          <div className="w-px h-4 bg-border/50 mx-1" />
          <span className="text-[10px] text-muted-foreground font-mono">{Math.round(zoom * 100)}%</span>
        </div>
        <div className="flex items-center gap-2">
          {connectingFrom && (
            <span className="text-[10px] text-ws-warning animate-pulse flex items-center gap-1">
              <MousePointer className="h-3 w-3" /> Click target node or press Esc
            </span>
          )}
          <span className="text-[10px] text-muted-foreground">{nodes.length} nodes · {edges.length} edges</span>
        </div>
      </div>

      {/* Canvas */}
      <div
        ref={containerRef}
        className="flex-1 overflow-hidden cursor-grab active:cursor-grabbing relative"
        style={{
          background: `hsl(var(--canvas-bg))`,
          backgroundImage: `radial-gradient(circle, hsl(var(--canvas-dot)) 1px, transparent 1px)`,
          backgroundSize: `${SNAP * zoom}px ${SNAP * zoom}px`,
          backgroundPosition: `${pan.x}px ${pan.y}px`,
        }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onDragLeave={handleDragLeave}
      >
        <svg width="100%" height="100%" style={{ overflow: 'visible' }}>
          <defs>
            <marker id="builder-arrow" markerWidth="10" markerHeight="7" refX="10" refY="3.5" orient="auto">
              <polygon points="0 0, 10 3.5, 0 7" fill="hsl(var(--primary))" opacity="0.6" />
            </marker>
            <filter id="node-shadow">
              <feDropShadow dx="0" dy="2" stdDeviation="4" floodColor="hsl(var(--node-shadow))" />
            </filter>
            <filter id="node-glow">
              <feGaussianBlur stdDeviation="8" result="blur" />
              <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
            </filter>
          </defs>
          <g transform={`translate(${pan.x} ${pan.y}) scale(${zoom})`}>

          {/* Snap grid lines (subtle) */}
          {snapEnabled && zoom >= 0.6 && (
            <g opacity="0.04">
              {Array.from({ length: 60 }, (_, i) => (
                <line key={`gv${i}`} x1={i * SNAP * 5} y1={-2000} x2={i * SNAP * 5} y2={4000} stroke="hsl(var(--foreground))" strokeWidth="0.5" />
              ))}
              {Array.from({ length: 60 }, (_, i) => (
                <line key={`gh${i}`} x1={-2000} y1={i * SNAP * 5} x2={4000} y2={i * SNAP * 5} stroke="hsl(var(--foreground))" strokeWidth="0.5" />
              ))}
            </g>
          )}

          {/* Drop preview */}
          {dropPreview && (
            <rect x={dropPreview.x} y={dropPreview.y} width={NODE_W} height={NODE_H} rx={12}
              fill="hsl(var(--primary) / 0.08)" stroke="hsl(var(--primary) / 0.4)" strokeWidth="2" strokeDasharray="6 4"
            />
          )}

          {/* Connecting line preview */}
          {connectingFrom && (() => {
            const fromNode = nodes.find(n => n.id === connectingFrom);
            if (!fromNode) return null;
            return (
              <line
                x1={fromNode.x + NODE_W / 2} y1={fromNode.y + NODE_H}
                x2={mousePos.x} y2={mousePos.y}
                stroke="hsl(var(--primary))" strokeWidth="2" strokeDasharray="6 4" opacity="0.6"
              />
            );
          })()}

          {/* Edges */}
          {edges.map(edge => {
            const from = nodes.find(n => n.id === edge.from);
            const to = nodes.find(n => n.id === edge.to);
            if (!from || !to) return null;
            const d = edgePath(from, to);
            const isHovered = hoveredEdge === edge.id;
            return (
              <g key={edge.id}
                onMouseEnter={() => setHoveredEdge(edge.id)}
                onMouseLeave={() => setHoveredEdge(null)}
              >
                {/* Fat invisible hit area */}
                <path d={d} fill="none" stroke="transparent" strokeWidth="12" className="cursor-pointer" />
                {/* Visible edge */}
                <path d={d} fill="none"
                  stroke={isHovered ? 'hsl(var(--destructive) / 0.8)' : 'hsl(var(--primary) / 0.3)'}
                  strokeWidth={isHovered ? 2.5 : 1.5}
                  strokeDasharray={isHovered ? 'none' : '6 4'}
                  className={cn(!isHovered && 'animate-flow-dash')}
                  markerEnd="url(#builder-arrow)"
                />
                {isHovered && onDeleteEdge && (
                  <g onClick={(e) => { e.stopPropagation(); onDeleteEdge(edge.id); }} className="cursor-pointer">
                    <circle cx={(from.x + to.x + NODE_W) / 2} cy={(from.y + NODE_H + to.y) / 2}
                      r={10} fill="hsl(var(--destructive))" opacity="0.9" />
                    <text x={(from.x + to.x + NODE_W) / 2} y={(from.y + NODE_H + to.y) / 2 + 1}
                      textAnchor="middle" dominantBaseline="middle" fill="hsl(var(--destructive-foreground))" fontSize="10" fontWeight="bold">×</text>
                  </g>
                )}
              </g>
            );
          })}

          {/* Nodes */}
          {nodes.map(node => {
            const isSelected = selectedNodeId === node.id;
            const isHovered = hoveredNode === node.id;
            const isConnecting = connectingFrom === node.id;
            const isTarget = connectingFrom && connectingFrom !== node.id;
            const color = colorMap[node.type] || 'var(--ws-source)';
            return (
              <g
                key={node.id}
                data-node
                className={cn('transition-transform', isTarget ? 'cursor-crosshair' : 'cursor-pointer')}
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
                onMouseEnter={() => setHoveredNode(node.id)}
                onMouseLeave={() => setHoveredNode(null)}
              >
                {/* Selection glow */}
                {(isSelected || isHovered) && (
                  <rect x={node.x - 4} y={node.y - 4} width={NODE_W + 8} height={NODE_H + 8} rx={14}
                    fill="none" stroke={`hsl(${color} / ${isSelected ? 0.4 : 0.2})`} strokeWidth="2"
                  />
                )}
                {/* Card shadow */}
                <rect x={node.x} y={node.y} width={NODE_W} height={NODE_H} rx={12}
                  fill="hsl(var(--node-bg))" filter="url(#node-shadow)"
                  stroke={`hsl(${color} / ${isSelected ? 0.8 : isConnecting ? 0.6 : 0.2})`}
                  strokeWidth={isSelected ? 2 : 1}
                  opacity={node.enabled ? 1 : 0.4}
                />
                {/* Color accent bar */}
                <rect x={node.x} y={node.y} width={4} height={NODE_H} rx={2}
                  fill={`hsl(${color})`} opacity={node.enabled ? 0.8 : 0.3}
                />
                {/* Status dot */}
                <circle cx={node.x + 16} cy={node.y + 16} r={3.5}
                  fill={node.enabled ? 'hsl(var(--ws-success))' : 'hsl(var(--muted-foreground))'}
                />
                {/* Label */}
                <text x={node.x + 28} y={node.y + 18} fill="hsl(var(--foreground))" fontSize="11" fontWeight="600" fontFamily="Inter, sans-serif" dominantBaseline="middle">
                  {node.label.length > 16 ? node.label.slice(0, 15) + '…' : node.label}
                </text>
                {/* Type badge */}
                <text x={node.x + 28} y={node.y + NODE_H - 14} fill={`hsl(${color} / 0.7)`} fontSize="9" fontFamily="JetBrains Mono, monospace" dominantBaseline="middle">
                  {node.sourceType || node.sinkType || node.type}
                </text>
                {/* Mini metrics on hover */}
                {isHovered && (
                  <text x={node.x + NODE_W - 8} y={node.y + NODE_H / 2} fill="hsl(var(--muted-foreground))" fontSize="8" fontFamily="JetBrains Mono, monospace" textAnchor="end" dominantBaseline="middle" opacity="0.6">
                    cfg ›
                  </text>
                )}
                {/* Output handle (bottom) */}
                <circle cx={node.x + NODE_W / 2} cy={node.y + NODE_H + HANDLE_R} r={HANDLE_R}
                  fill={isConnecting ? `hsl(${color})` : 'hsl(var(--node-bg))'}
                  stroke={`hsl(${color} / ${isHovered || isConnecting ? 0.8 : 0.3})`} strokeWidth="2"
                  className={cn('cursor-crosshair transition-all', isHovered || isConnecting ? 'opacity-100' : 'opacity-0')}
                  onMouseDown={(e) => { e.stopPropagation(); onStartConnect(node.id); }}
                />
                {/* Input handle (top) */}
                <circle cx={node.x + NODE_W / 2} cy={node.y - HANDLE_R} r={HANDLE_R}
                  fill={isTarget ? `hsl(${color} / 0.3)` : 'hsl(var(--node-bg))'}
                  stroke={`hsl(${color} / ${isTarget || isHovered ? 0.8 : 0.3})`} strokeWidth="2"
                  className={cn('transition-all', isTarget || isHovered ? 'opacity-100' : 'opacity-0')}
                />
              </g>
            );
          })}
          </g>
        </svg>
      </div>
    </div>
  );
}

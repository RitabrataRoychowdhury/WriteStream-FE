import { useId } from 'react';
import {
  Globe, Database, GitBranch, Layers, HardDrive, Cpu, Radio, Zap,
} from 'lucide-react';

/**
 * Custom SVG architecture diagram for the WriteStream landing page.
 * - Glowing rounded-rect nodes grouped into Sources / Core / Sinks / Reactive
 * - Animated dashed connectors (flow-dash) plus traveling packet dots
 * - Pure SVG/CSS — no third-party visualization libraries
 * - Brand red kept as the dominant accent; status colors used for variety
 */

type NodeDef = {
  id: string;
  label: string;
  sub?: string;
  x: number;
  y: number;
  w?: number;
  group: 'source' | 'core' | 'sink' | 'reactive';
  icon: React.ComponentType<{ className?: string }>;
};

const NODE_W = 168;
const NODE_H = 60;

// Layout grid (viewBox is 1100 x 620)
const NODES: NodeDef[] = [
  // SOURCES (left column)
  { id: 'http',  label: 'HTTP Ingress', sub: ':8080', x: 40,  y: 70,  group: 'source', icon: Globe },
  { id: 'kafka', label: 'Kafka',        sub: 'consumer', x: 40,  y: 165, group: 'source', icon: Radio },
  { id: 'cdc',   label: 'CDC',          sub: 'PG · MySQL · Mongo', x: 40,  y: 260, group: 'source', icon: Database },

  // CORE (center column)
  { id: 'seq',   label: 'Sequencer',    sub: 'LMAX · per-core', x: 320, y: 100, group: 'core', icon: GitBranch },
  { id: 'wal',   label: 'WAL',          sub: 'fsync · durable', x: 320, y: 215, group: 'core', icon: HardDrive },
  { id: 'shard', label: 'Shard Workers', sub: 'jump-hash · N cores', x: 320, y: 330, group: 'core', icon: Cpu },

  // SINKS (right column)
  { id: 'pg',    label: 'PostgreSQL',  sub: 'OLTP',     x: 640, y: 60,  group: 'sink', icon: Database },
  { id: 'mysql', label: 'MySQL',       sub: 'legacy',   x: 640, y: 145, group: 'sink', icon: Database },
  { id: 'ch',   label: 'ClickHouse',  sub: 'OLAP',     x: 640, y: 230, group: 'sink', icon: Layers },
  { id: 'kout', label: 'Kafka Out',   sub: 'downstream', x: 640, y: 315, group: 'sink', icon: Radio },

  // REACTIVE (bottom-right)
  { id: 'react', label: 'Reactive Views', sub: 'WebSocket · live', x: 640, y: 440, group: 'reactive', icon: Zap },
];

type EdgeDef = { from: string; to: string; kind?: 'hot' | 'cold' };

const EDGES: EdgeDef[] = [
  // sources → sequencer
  { from: 'http',  to: 'seq', kind: 'hot' },
  { from: 'kafka', to: 'seq', kind: 'hot' },
  { from: 'cdc',   to: 'seq', kind: 'hot' },
  // core hot path
  { from: 'seq',   to: 'wal', kind: 'hot' },
  { from: 'wal',   to: 'shard', kind: 'hot' },
  // shard → sinks (cold path)
  { from: 'shard', to: 'pg', kind: 'cold' },
  { from: 'shard', to: 'mysql', kind: 'cold' },
  { from: 'shard', to: 'ch', kind: 'cold' },
  { from: 'shard', to: 'kout', kind: 'cold' },
  // shard → reactive
  { from: 'shard', to: 'react', kind: 'cold' },
];

function groupColor(g: NodeDef['group']) {
  switch (g) {
    case 'source':  return 'hsl(14 90% 60%)';   // brand red/orange
    case 'core':    return 'hsl(14 90% 55%)';   // brand red (deeper)
    case 'sink':    return 'hsl(158 65% 60%)';  // emerald (success)
    case 'reactive':return 'hsl(196 90% 60%)';  // info blue
  }
}

function edgeColor(kind: EdgeDef['kind']) {
  return kind === 'cold' ? 'hsl(158 65% 60%)' : 'hsl(14 90% 60%)';
}

/** Curved cubic path between right-edge of `from` and left-edge of `to`. */
function cubicPath(a: NodeDef, b: NodeDef): string {
  const x1 = a.x + (a.w ?? NODE_W);
  const y1 = a.y + NODE_H / 2;
  const x2 = b.x;
  const y2 = b.y + NODE_H / 2;
  const dx = Math.max(60, (x2 - x1) * 0.55);
  return `M ${x1} ${y1} C ${x1 + dx} ${y1}, ${x2 - dx} ${y2}, ${x2} ${y2}`;
}

export function ArchitectureDiagram() {
  const uid = useId().replace(/:/g, '');

  return (
    <div className="relative w-full">
      {/* Ambient halos behind the diagram */}
      <div className="pointer-events-none absolute -top-24 left-1/2 -translate-x-1/2 w-[720px] h-[720px] rounded-full blur-3xl"
        style={{ background: 'radial-gradient(circle, hsl(14 90% 55% / 0.18), transparent 60%)' }}
      />
      <div className="pointer-events-none absolute -bottom-32 right-0 w-[520px] h-[520px] rounded-full blur-3xl"
        style={{ background: 'radial-gradient(circle, hsl(158 65% 50% / 0.10), transparent 60%)' }}
      />

      <svg
        viewBox="0 0 1100 620"
        className="relative w-full h-auto"
        style={{ maxHeight: 720 }}
        role="img"
        aria-label="WriteStream architecture diagram"
      >
        <defs>
          {/* Glow filter for nodes */}
          <filter id={`glow-${uid}`} x="-40%" y="-40%" width="180%" height="180%">
            <feGaussianBlur stdDeviation="6" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          {/* Edge gradient (hot) */}
          <linearGradient id={`edge-hot-${uid}`} x1="0" x2="1" y1="0" y2="0">
            <stop offset="0%"   stopColor="hsl(14 90% 60%)" stopOpacity="0.15" />
            <stop offset="50%"  stopColor="hsl(14 90% 60%)" stopOpacity="0.85" />
            <stop offset="100%" stopColor="hsl(14 90% 60%)" stopOpacity="0.15" />
          </linearGradient>
          {/* Edge gradient (cold) */}
          <linearGradient id={`edge-cold-${uid}`} x1="0" x2="1" y1="0" y2="0">
            <stop offset="0%"   stopColor="hsl(158 65% 55%)" stopOpacity="0.12" />
            <stop offset="50%"  stopColor="hsl(158 65% 55%)" stopOpacity="0.7" />
            <stop offset="100%" stopColor="hsl(158 65% 55%)" stopOpacity="0.12" />
          </linearGradient>

          {/* Group label backdrops */}
          <linearGradient id={`label-bg-${uid}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="hsl(0 0% 100%)" stopOpacity="0.04" />
            <stop offset="100%" stopColor="hsl(0 0% 100%)" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Group lane backdrops */}
        <rect x="20"  y="40"  width={NODE_W + 40}  height="305" rx="20"
          fill={`url(#label-bg-${uid})`} stroke="hsl(0 0% 100% / 0.05)" />
        <rect x="300" y="80"  width={NODE_W + 40}  height="335" rx="20"
          fill={`url(#label-bg-${uid})`} stroke="hsl(0 0% 100% / 0.05)" />
        <rect x="620" y="40"  width={NODE_W + 40}  height="370" rx="20"
          fill={`url(#label-bg-${uid})`} stroke="hsl(0 0% 100% / 0.05)" />
        <rect x="620" y="425" width={NODE_W + 40}  height="100" rx="20"
          fill={`url(#label-bg-${uid})`} stroke="hsl(0 0% 100% / 0.05)" />

        {/* Group lane labels */}
        <text x={20 + (NODE_W + 40) / 2} y="32" textAnchor="middle" fill="hsl(0 0% 100% / 0.45)"
          fontSize="10" fontWeight="700" letterSpacing="3">SOURCES</text>
        <text x={300 + (NODE_W + 40) / 2} y="72" textAnchor="middle" fill="hsl(0 0% 100% / 0.45)"
          fontSize="10" fontWeight="700" letterSpacing="3">WRITESTREAM CORE</text>
        <text x={620 + (NODE_W + 40) / 2} y="32" textAnchor="middle" fill="hsl(0 0% 100% / 0.45)"
          fontSize="10" fontWeight="700" letterSpacing="3">SINKS</text>
        <text x={620 + (NODE_W + 40) / 2} y="417" textAnchor="middle" fill="hsl(0 0% 100% / 0.45)"
          fontSize="10" fontWeight="700" letterSpacing="3">REACTIVE</text>

        {/* Edges (under nodes) */}
        {EDGES.map((e, i) => {
          const a = NODES.find(n => n.id === e.from)!;
          const b = NODES.find(n => n.id === e.to)!;
          const d = cubicPath(a, b);
          const grad = e.kind === 'cold' ? `url(#edge-cold-${uid})` : `url(#edge-hot-${uid})`;
          const col = edgeColor(e.kind);
          const dur = e.kind === 'cold' ? 5.2 : 3.4;
          return (
            <g key={i}>
              {/* Glow stroke */}
              <path d={d} fill="none" stroke={col} strokeOpacity="0.12" strokeWidth="6" strokeLinecap="round" />
              {/* Main stroke */}
              <path d={d} fill="none" stroke={grad} strokeWidth="1.4" strokeLinecap="round" />
              {/* Animated dash overlay */}
              <path d={d} fill="none" stroke={col} strokeOpacity="0.6" strokeWidth="1"
                strokeDasharray="3 8" className="animate-flow-dash" />
              {/* Traveling packet */}
              <circle r="2.4" fill={col}>
                <animateMotion dur={`${dur}s`} repeatCount="indefinite" rotate="auto" path={d} />
                <animate attributeName="opacity" values="0;1;1;0" keyTimes="0;0.1;0.9;1" dur={`${dur}s`} repeatCount="indefinite" />
              </circle>
              <circle r="4" fill={col} fillOpacity="0.25">
                <animateMotion dur={`${dur}s`} repeatCount="indefinite" path={d} />
                <animate attributeName="opacity" values="0;0.7;0.7;0" keyTimes="0;0.1;0.9;1" dur={`${dur}s`} repeatCount="indefinite" />
              </circle>
            </g>
          );
        })}

        {/* Nodes */}
        {NODES.map(n => {
          const Icon = n.icon;
          const col = groupColor(n.group);
          return (
            <g key={n.id}>
              {/* Outer glow ring */}
              <rect
                x={n.x - 1} y={n.y - 1}
                width={(n.w ?? NODE_W) + 2} height={NODE_H + 2}
                rx="14"
                fill="none"
                stroke={col}
                strokeOpacity="0.18"
                strokeWidth="1"
                filter={`url(#glow-${uid})`}
              />
              {/* Card body */}
              <rect
                x={n.x} y={n.y}
                width={n.w ?? NODE_W} height={NODE_H}
                rx="13"
                fill="hsl(220 40% 8%)"
                stroke={col}
                strokeOpacity="0.35"
                strokeWidth="1"
              />
              {/* Top accent bar */}
              <rect x={n.x + 14} y={n.y} width={(n.w ?? NODE_W) - 28} height="1.4" rx="0.7"
                fill={col} fillOpacity="0.6" />
              {/* Icon plate */}
              <rect x={n.x + 10} y={n.y + 14} width="32" height="32" rx="8"
                fill={col} fillOpacity="0.10" stroke={col} strokeOpacity="0.25" />
              {/* Icon (rendered via foreignObject for crispness) */}
              <foreignObject x={n.x + 18} y={n.y + 22} width="16" height="16">
                <Icon className="h-4 w-4" />
              </foreignObject>
              {/* Label */}
              <text x={n.x + 52} y={n.y + 26}
                fill="hsl(0 0% 100%)" fontSize="13" fontWeight="600"
                fontFamily="Inter, system-ui, sans-serif">
                {n.label}
              </text>
              {n.sub && (
                <text x={n.x + 52} y={n.y + 42}
                  fill="hsl(0 0% 100% / 0.45)" fontSize="10" fontWeight="500"
                  fontFamily="JetBrains Mono, monospace">
                  {n.sub}
                </text>
              )}
              {/* Live dot */}
              <circle cx={(n.x + (n.w ?? NODE_W)) - 12} cy={n.y + 14} r="2.5" fill={col}>
                <animate attributeName="opacity" values="0.3;1;0.3" dur="2.2s" repeatCount="indefinite" />
              </circle>
            </g>
          );
        })}

        {/* Caption strip */}
        <g>
          <text x="550" y="588" textAnchor="middle"
            fill="hsl(0 0% 100% / 0.5)" fontSize="11" letterSpacing="2"
            fontFamily="JetBrains Mono, monospace">
            INGEST → SEQUENCE → DURABLE WAL → SHARD → FAN OUT
          </text>
        </g>
      </svg>

      {/* Legend */}
      <div className="mt-2 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-[10px] uppercase tracking-[0.18em] text-white/45 font-mono">
        <span className="flex items-center gap-2">
          <span className="h-1.5 w-6 rounded-full" style={{ background: 'hsl(14 90% 60%)' }} />
          Hot path
        </span>
        <span className="flex items-center gap-2">
          <span className="h-1.5 w-6 rounded-full" style={{ background: 'hsl(158 65% 55%)' }} />
          Cold path · sinks
        </span>
        <span className="flex items-center gap-2">
          <span className="h-1.5 w-6 rounded-full" style={{ background: 'hsl(196 90% 60%)' }} />
          Reactive · WebSocket
        </span>
      </div>
    </div>
  );
}
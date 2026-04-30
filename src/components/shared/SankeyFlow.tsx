import { useId } from 'react';
import { cn } from '@/lib/utils';

export interface SankeyTarget {
  id: string;
  label: string;
  value: number;
  /** HSL color token name (e.g. 'ws-source') — without 'hsl(var(--))' wrapper */
  colorVar: string;
  /** Optional secondary line under value */
  sublabel?: string;
}

interface SankeyFlowProps {
  sourceLabel: string;
  sourceValue: string;
  sourceSublabel?: string;
  targets: SankeyTarget[];
  className?: string;
  height?: number;
}

/**
 * Cinematic curved-ribbon flow chart (inspired by Sankey diagrams).
 * One source on the left fans out to N targets on the right with
 * smooth bezier ribbons, each tinted with a unique HSL color token.
 */
export function SankeyFlow({
  sourceLabel,
  sourceValue,
  sourceSublabel,
  targets,
  className,
  height = 380,
}: SankeyFlowProps) {
  const uid = useId().replace(/:/g, '');
  const safeTargets = (Array.isArray(targets) ? targets : [])
    .filter((t) => t && typeof t.id === 'string')
    .map((t) => ({
      ...t,
      value: Number.isFinite(t.value) ? Math.max(0, t.value) : 0,
      label: t.label ?? '',
      colorVar: t.colorVar || 'primary',
    }));
  const total =
    safeTargets.reduce((s, t) => s + t.value, 0) || 1;

  const VB_W = 800;
  const VB_H = height;
  const SRC_X = 60;
  const SRC_Y = VB_H / 2;
  const SRC_H = Math.min(VB_H * 0.7, 280);
  const SRC_W = 28;
  const TGT_X = 520;
  const PADDING = 18;

  // Compute ribbon widths proportionally on source side
  const totalSrcAvailable = SRC_H - PADDING * Math.max(0, safeTargets.length - 1);
  let srcCursor = SRC_Y - SRC_H / 2;
  const ribbons = safeTargets.map((t) => {
    const w = Math.max(8, (Math.max(0, t.value) / total) * totalSrcAvailable);
    const srcTop = srcCursor;
    const srcBottom = srcCursor + w;
    srcCursor = srcBottom + PADDING;
    return { target: t, srcTop, srcBottom, w };
  });

  // Target Y centers spaced evenly
  const tgtSpacing = (VB_H - 60) / Math.max(1, safeTargets.length);
  const targetsLayout = ribbons.map((r, i) => {
    const cy = 30 + tgtSpacing * (i + 0.5);
    return { ...r, tgtCy: cy };
  });

  return (
    <div className={cn('relative w-full', className)}>
      <svg viewBox={`0 0 ${VB_W} ${VB_H}`} className="w-full h-auto" preserveAspectRatio="xMidYMid meet">
        <defs>
          {targetsLayout.map((r) => (
            <linearGradient
              key={`grad-${uid}-${r.target.id}`}
              id={`grad-${uid}-${r.target.id}`}
              x1="0" y1="0" x2="1" y2="0"
            >
              <stop offset="0%" stopColor={`hsl(var(--${r.target.colorVar}))`} stopOpacity="0.65" />
              <stop offset="100%" stopColor={`hsl(var(--${r.target.colorVar}))`} stopOpacity="0.18" />
            </linearGradient>
          ))}
          <linearGradient id={`src-${uid}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="hsl(var(--ws-warning))" stopOpacity="0.95" />
            <stop offset="100%" stopColor="hsl(var(--ws-hotpath))" stopOpacity="0.85" />
          </linearGradient>
          <filter id={`soft-${uid}`} x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="0.6" />
          </filter>
        </defs>

        {/* Ribbons (rendered first so they sit behind the source bar) */}
        {targetsLayout.map((r) => {
          const x1 = SRC_X + SRC_W;
          const x2 = TGT_X;
          const cx1 = x1 + (x2 - x1) * 0.55;
          const cx2 = x1 + (x2 - x1) * 0.45;
          const tgtH = Math.max(6, r.w * 0.55);
          const tgtTop = r.tgtCy - tgtH / 2;
          const tgtBot = r.tgtCy + tgtH / 2;

          // Closed path: top edge bezier, vertical right, bottom edge bezier back, vertical left.
          const d = [
            `M ${x1} ${r.srcTop}`,
            `C ${cx1} ${r.srcTop}, ${cx2} ${tgtTop}, ${x2} ${tgtTop}`,
            `L ${x2} ${tgtBot}`,
            `C ${cx2} ${tgtBot}, ${cx1} ${r.srcBottom}, ${x1} ${r.srcBottom}`,
            'Z',
          ].join(' ');

          return (
            <path
              key={r.target.id}
              d={d}
              fill={`url(#grad-${uid}-${r.target.id})`}
              filter={`url(#soft-${uid})`}
              className="transition-opacity duration-500 hover:opacity-100"
              style={{ opacity: 0.85 }}
            >
              <title>{`${r.target.label}: ${r.target.value.toLocaleString()}`}</title>
            </path>
          );
        })}

        {/* Source bar */}
        <rect
          x={SRC_X}
          y={SRC_Y - SRC_H / 2}
          width={SRC_W}
          height={SRC_H}
          rx={4}
          fill={`url(#src-${uid})`}
        />
        {/* Source label */}
        <text
          x={SRC_X - 12}
          y={SRC_Y - 8}
          fill="hsl(var(--foreground))"
          fontSize="22"
          fontWeight="700"
          fontFamily="Outfit, sans-serif"
          textAnchor="end"
        >
          {sourceValue}
        </text>
        <text
          x={SRC_X - 12}
          y={SRC_Y + 14}
          fill="hsl(var(--muted-foreground))"
          fontSize="11"
          fontFamily="Inter, sans-serif"
          textAnchor="end"
        >
          {sourceLabel}
        </text>
        {sourceSublabel && (
          <text
            x={SRC_X - 12}
            y={SRC_Y + 30}
            fill="hsl(var(--muted-foreground))"
            fontSize="9"
            fontFamily="JetBrains Mono, monospace"
            textAnchor="end"
            opacity="0.6"
          >
            {sourceSublabel}
          </text>
        )}

        {/* Target labels */}
        {targetsLayout.map((r) => {
          const pct = ((Math.max(0, r.target.value) / total) * 100).toFixed(0);
          return (
            <g key={`lbl-${r.target.id}`}>
              <circle
                cx={TGT_X + 14}
                cy={r.tgtCy}
                r={4}
                fill={`hsl(var(--${r.target.colorVar}))`}
              />
              <text
                x={TGT_X + 26}
                y={r.tgtCy - 4}
                fill="hsl(var(--muted-foreground))"
                fontSize="11"
                fontFamily="Inter, sans-serif"
                fontWeight="500"
              >
                {r.target.label}
              </text>
              <text
                x={TGT_X + 26}
                y={r.tgtCy + 14}
                fill="hsl(var(--foreground))"
                fontSize="13"
                fontWeight="700"
                fontFamily="Outfit, sans-serif"
              >
                {r.target.value.toLocaleString()}
                <tspan
                  fill="hsl(var(--muted-foreground))"
                  fontSize="10"
                  fontWeight="500"
                  dx="6"
                >
                  ({pct}%)
                </tspan>
              </text>
              {r.target.sublabel && (
                <text
                  x={TGT_X + 26}
                  y={r.tgtCy + 28}
                  fill="hsl(var(--muted-foreground))"
                  fontSize="9"
                  fontFamily="JetBrains Mono, monospace"
                  opacity="0.6"
                >
                  {r.target.sublabel}
                </text>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}
import { ReactNode } from 'react';
import { ArrowUpRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface KpiSparkProps {
  title: string;
  value: string;
  subtitle?: string;
  delta?: { value: string; positive?: boolean };
  icon: ReactNode;
  /** colorVar (e.g. 'ws-source', 'ws-hotpath') drives accent halo + sparkline gradient */
  colorVar: string;
  /** Numeric series for sparkline (length 8-40 ideal) */
  series?: number[];
  className?: string;
  onOpen?: () => void;
}

/**
 * Premium dark KPI tile: titled icon, large value, delta pill,
 * cinematic curved sparkline with gradient fill. Inspired by the
 * reference design's hospital-performance cards.
 */
export function KpiSpark({
  title,
  value,
  subtitle,
  delta,
  icon,
  colorVar,
  series = [],
  className,
  onOpen,
}: KpiSparkProps) {
  // Build sparkline path — defensively normalise the series to avoid
  // any "Cannot read properties of undefined" crashes on empty input.
  const W = 280;
  const H = 64;
  const PAD = 4;
  const safeSeries: number[] =
    Array.isArray(series) && series.length > 1
      ? series.filter((n) => Number.isFinite(n))
      : [0, 0];
  const points = safeSeries.length > 1 ? safeSeries : [0, 0];
  const min = Math.min(...points, 0);
  const max = Math.max(...points, 1);
  const range = max - min || 1;
  const stepX = (W - PAD * 2) / Math.max(1, points.length - 1);

  // Smooth Catmull-Rom-ish curve via cubic bezier between points
  const coords = points.map((v, i) => ({
    x: PAD + i * stepX,
    y: PAD + (1 - (v - min) / range) * (H - PAD * 2),
  }));

  const first = coords[0] ?? { x: PAD, y: H / 2 };
  const last = coords[coords.length - 1] ?? first;

  let path = `M ${first.x} ${first.y}`;
  for (let i = 0; i < coords.length - 1; i++) {
    const p0 = coords[i];
    const p1 = coords[i + 1];
    const cx = (p0.x + p1.x) / 2;
    path += ` C ${cx} ${p0.y}, ${cx} ${p1.y}, ${p1.x} ${p1.y}`;
  }

  const fillPath = `${path} L ${last.x} ${H} L ${first.x} ${H} Z`;

  // Find peak for marker (safe even when coords has a single point)
  const peakIdx = coords.length
    ? coords.reduce((acc, p, i) => (p.y < coords[acc].y ? i : acc), 0)
    : 0;
  const peak = coords[peakIdx] ?? first;

  const gradId = `spark-grad-${colorVar}-${title.replace(/\s+/g, '')}`;

  return (
    <div
      className={cn(
        'group relative overflow-hidden rounded-2xl border border-border/40 p-5 transition-all duration-500',
        'hover:border-border/70 hover:-translate-y-0.5',
        className,
      )}
      style={{
        background:
          'linear-gradient(155deg, hsl(var(--surface-elevated)) 0%, hsl(var(--surface-2)) 100%)',
      }}
    >
      {/* Corner halo */}
      <div
        className="pointer-events-none absolute -top-16 -right-16 h-40 w-40 rounded-full opacity-30 blur-3xl transition-opacity duration-500 group-hover:opacity-50"
        style={{ background: `hsl(var(--${colorVar}) / 0.4)` }}
      />

      {/* Header row */}
      <div className="relative flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div
            className="flex h-8 w-8 items-center justify-center rounded-xl"
            style={{
              background: `hsl(var(--${colorVar}) / 0.12)`,
              color: `hsl(var(--${colorVar}))`,
              boxShadow: `inset 0 0 0 1px hsl(var(--${colorVar}) / 0.18)`,
            }}
          >
            {icon}
          </div>
          <span className="text-[12px] font-semibold tracking-tight text-foreground">{title}</span>
        </div>
        {onOpen && (
          <button
            onClick={onOpen}
            aria-label={`Open ${title}`}
            className="flex h-7 w-7 items-center justify-center rounded-lg border border-border/40 text-muted-foreground transition-all duration-200 hover:border-border hover:text-foreground hover:bg-secondary/40"
          >
            <ArrowUpRight className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {/* Subtitle */}
      {subtitle && (
        <div className="relative mt-3 text-[10px] uppercase tracking-[0.14em] text-muted-foreground/80">
          {subtitle}
        </div>
      )}

      {/* Value + delta */}
      <div className="relative mt-1 flex items-baseline gap-3">
        <div className="font-display text-3xl font-bold tracking-tight text-foreground tabular-nums">
          {value}
        </div>
        {delta && (
          <span
            className={cn(
              'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold',
              delta.positive
                ? 'bg-ws-success/12 text-ws-success'
                : 'bg-ws-error/12 text-ws-error',
            )}
            style={{
              boxShadow: `inset 0 0 0 1px hsl(var(--${delta.positive ? 'ws-success' : 'ws-error'}) / 0.2)`,
            }}
          >
            <span
              className="inline-block h-1.5 w-1.5 rounded-full"
              style={{
                background: `hsl(var(--${delta.positive ? 'ws-success' : 'ws-error'}))`,
              }}
            />
            {delta.value}
          </span>
        )}
      </div>

      {/* Sparkline */}
      {Array.isArray(series) && series.length > 1 && (
        <div className="relative mt-4 -mx-1">
          <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="h-16 w-full">
            <defs>
              <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={`hsl(var(--${colorVar}))`} stopOpacity="0.35" />
                <stop offset="100%" stopColor={`hsl(var(--${colorVar}))`} stopOpacity="0" />
              </linearGradient>
            </defs>
            <path d={fillPath} fill={`url(#${gradId})`} />
            <path
              d={path}
              fill="none"
              stroke={`hsl(var(--${colorVar}))`}
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {/* Peak marker pill */}
            <g>
              <circle
                cx={peak.x}
                cy={peak.y}
                r="3"
                fill={`hsl(var(--${colorVar}))`}
              />
              <circle
                cx={peak.x}
                cy={peak.y}
                r="6"
                fill="none"
                stroke={`hsl(var(--${colorVar}))`}
                strokeOpacity="0.4"
                strokeWidth="1"
              />
            </g>
          </svg>
        </div>
      )}
    </div>
  );
}
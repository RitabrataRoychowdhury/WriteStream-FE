interface PyramidRow {
  bucket: string;
  left: number;
  right: number;
}

interface PyramidBarsProps {
  rows: PyramidRow[];
  leftLabel: string;
  rightLabel: string;
  leftColorVar: string;
  rightColorVar: string;
  height?: number;
}

/**
 * Mirrored horizontal bars (population-pyramid style) — used for
 * "throughput by sink type" or similar A/B distribution views.
 */
export function PyramidBars({
  rows,
  leftLabel,
  rightLabel,
  leftColorVar,
  rightColorVar,
  height = 280,
}: PyramidBarsProps) {
  const safeRows = (Array.isArray(rows) ? rows : [])
    .filter((r) => r && typeof r.bucket === 'string')
    .map((r) => ({
      bucket: r.bucket,
      left: Number.isFinite(r.left) ? Math.max(0, r.left) : 0,
      right: Number.isFinite(r.right) ? Math.max(0, r.right) : 0,
    }));
  const VB_W = 600;
  const VB_H = height;
  const CENTER_X = VB_W / 2;
  const HALF_W = VB_W / 2 - 60;
  const maxCandidate = Math.max(
    ...safeRows.flatMap((r) => [r.left, r.right]),
    1,
  );
  const max = Number.isFinite(maxCandidate) && maxCandidate > 0 ? maxCandidate : 1;
  const rowH = (VB_H - 70) / Math.max(1, safeRows.length);
  const barH = Math.min(rowH * 0.62, 22);

  return (
    <svg viewBox={`0 0 ${VB_W} ${VB_H}`} className="w-full h-auto" preserveAspectRatio="xMidYMid meet">
      {/* Top legend */}
      <g transform="translate(0, 18)">
        <circle cx={CENTER_X - 60} cy={0} r="4" fill={`hsl(var(--${leftColorVar}))`} />
        <text x={CENTER_X - 50} y={4} fill="hsl(var(--muted-foreground))" fontSize="10" fontFamily="Inter, sans-serif">
          {leftLabel}
        </text>
        <circle cx={CENTER_X + 18} cy={0} r="4" fill={`hsl(var(--${rightColorVar}))`} />
        <text x={CENTER_X + 28} y={4} fill="hsl(var(--muted-foreground))" fontSize="10" fontFamily="Inter, sans-serif">
          {rightLabel}
        </text>
      </g>

      {safeRows.map((r, i) => {
        const cy = 50 + i * rowH + rowH / 2;
        const lW = (r.left / max) * HALF_W;
        const rW = (r.right / max) * HALF_W;
        return (
          <g key={r.bucket}>
            {/* Bucket label center */}
            <text
              x={CENTER_X}
              y={cy + 3}
              fill="hsl(var(--muted-foreground))"
              fontSize="9"
              fontFamily="JetBrains Mono, monospace"
              textAnchor="middle"
            >
              {r.bucket}
            </text>
            {/* Left bar */}
            <rect
              x={CENTER_X - 30 - lW}
              y={cy - barH / 2}
              width={lW}
              height={barH}
              rx={4}
              fill={`hsl(var(--${leftColorVar}) / 0.85)`}
            />
            {/* Right bar */}
            <rect
              x={CENTER_X + 30}
              y={cy - barH / 2}
              width={rW}
              height={barH}
              rx={4}
              fill={`hsl(var(--${rightColorVar}) / 0.85)`}
            />
          </g>
        );
      })}

      {/* Axis ticks */}
      <g transform={`translate(0, ${VB_H - 14})`} fontFamily="JetBrains Mono, monospace" fontSize="9" fill="hsl(var(--muted-foreground))">
        <text x={CENTER_X - 30 - HALF_W} textAnchor="start" opacity="0.6">{max.toLocaleString()}</text>
        <text x={CENTER_X - 30} textAnchor="end" opacity="0.6">0</text>
        <text x={CENTER_X + 30} textAnchor="start" opacity="0.6">0</text>
        <text x={CENTER_X + 30 + HALF_W} textAnchor="end" opacity="0.6">{max.toLocaleString()}</text>
      </g>
    </svg>
  );
}
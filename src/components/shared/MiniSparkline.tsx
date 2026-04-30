interface MiniSparklineProps {
  data: number[];
  color?: string;
  height?: number;
  width?: number;
}

export function MiniSparkline({ data, color = 'hsl(var(--primary))', height = 32, width = 120 }: MiniSparklineProps) {
  const safe = Array.isArray(data) ? data.filter((n) => Number.isFinite(n)) : [];
  if (safe.length < 2) return null;

  const min = Math.min(...safe);
  const max = Math.max(...safe);
  const range = max - min || 1;

  const points = safe
    .map((v, i) => {
      const x = (i / (safe.length - 1)) * width;
      const y = height - ((v - min) / range) * (height - 4) - 2;
      return `${Number.isFinite(x) ? x : 0},${Number.isFinite(y) ? y : height / 2}`;
    })
    .join(' ');

  const areaPoints = `0,${height} ${points} ${width},${height}`;
  const gradId = `spark-${Math.abs(
    color.split('').reduce((a, c) => a + c.charCodeAt(0), 0),
  )}`;

  return (
    <svg width={width} height={height} className="mt-2">
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={areaPoints} fill={`url(#${gradId})`} />
      <polyline points={points} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

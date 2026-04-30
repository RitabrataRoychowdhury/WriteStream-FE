interface GaugeChartProps {
  value: number;
  max: number;
  label?: string;
  color?: string;
  size?: number;
}

export function GaugeChart({ value, max, label, color = 'hsl(var(--primary))', size = 80 }: GaugeChartProps) {
  const safeValue = Number.isFinite(value) ? Math.max(0, value) : 0;
  const safeMax = Number.isFinite(max) && max > 0 ? max : 1;
  const pct = Math.max(0, Math.min(safeValue / safeMax, 1));
  const r = (size - 8) / 2;
  const cx = size / 2;
  const cy = size / 2;
  const circumference = Math.PI * r; // half circle
  const offset = circumference * (1 - pct);

  return (
    <div className="flex flex-col items-center">
      <svg width={size} height={size / 2 + 8} viewBox={`0 0 ${size} ${size / 2 + 8}`}>
        {/* Background arc */}
        <path
          d={`M 4 ${cy} A ${r} ${r} 0 0 1 ${size - 4} ${cy}`}
          fill="none"
          stroke="hsl(var(--border))"
          strokeWidth="6"
          strokeLinecap="round"
        />
        {/* Value arc */}
        <path
          d={`M 4 ${cy} A ${r} ${r} 0 0 1 ${size - 4} ${cy}`}
          fill="none"
          stroke={color}
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-all duration-700 ease-out"
        />
      </svg>
      {label && <span className="text-[10px] text-muted-foreground mt-1">{label}</span>}
    </div>
  );
}

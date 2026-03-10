import { useMouseGlow } from '@/hooks/useMouseGlow';
import { cn } from '@/lib/utils';

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: React.ReactNode;
  trend?: 'up' | 'down' | 'flat';
  color?: string;
  glowColor?: string;
  children?: React.ReactNode;
  className?: string;
}

export function MetricCard({ title, value, subtitle, icon, color, glowColor, children, className }: MetricCardProps) {
  const { ref, handleMouseMove, handleMouseLeave } = useMouseGlow(0.6);

  return (
    <div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={cn(
        'relative overflow-hidden rounded-2xl border border-border/40 p-5 md:p-6 group',
        'transition-all duration-300 ease-out',
        'hover:border-primary/20 hover:shadow-elevated',
        className
      )}
      style={{
        background: 'hsl(var(--surface-elevated))',
        transform: 'rotateX(var(--tilt-x, 0deg)) rotateY(var(--tilt-y, 0deg))',
        transformStyle: 'preserve-3d',
      }}
    >
      {/* Mouse-following radial glow */}
      <div
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
        style={{
          background: `radial-gradient(350px circle at var(--mouse-x, 50%) var(--mouse-y, 50%), ${glowColor || 'hsl(var(--primary) / 0.06)'}, transparent 50%)`,
        }}
      />

      {/* Top accent line */}
      <div className="absolute top-0 left-6 right-6 h-px bg-gradient-to-r from-transparent via-primary/15 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

      <div className="flex items-start justify-between mb-4 relative z-10">
        <span className="section-label">{title}</span>
        {icon && (
          <div className={cn(
            'flex items-center justify-center h-9 w-9 rounded-xl bg-secondary/60 transition-all duration-300 group-hover:bg-secondary group-hover:scale-110 group-hover:rotate-3',
            color
          )}>
            {icon}
          </div>
        )}
      </div>
      <div className="flex items-baseline gap-2.5 relative z-10">
        <span className={cn('text-3xl md:text-4xl font-bold font-mono tracking-tight leading-none', color || 'text-foreground')}>
          {typeof value === 'number' ? value.toLocaleString() : value}
        </span>
        {subtitle && <span className="text-xs text-muted-foreground font-medium">{subtitle}</span>}
      </div>
      {children && <div className="relative z-10 mt-1">{children}</div>}
    </div>
  );
}

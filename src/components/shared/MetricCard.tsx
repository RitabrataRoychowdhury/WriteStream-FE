import { cn } from '@/lib/utils';

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: React.ReactNode;
  trend?: 'up' | 'down' | 'flat';
  color?: string;
  children?: React.ReactNode;
  className?: string;
}

export function MetricCard({ title, value, subtitle, icon, color, children, className }: MetricCardProps) {
  return (
    <div className={cn(
      'glass-card p-4 md:p-5 animate-fade-in group relative overflow-hidden',
      className
    )}>
      {/* Subtle background glow */}
      <div className="absolute -top-12 -right-12 h-24 w-24 rounded-full opacity-[0.07] blur-2xl transition-opacity duration-500 group-hover:opacity-[0.12]"
        style={{ background: color ? undefined : 'hsl(var(--primary))' }}
        {...(color && { className: `absolute -top-12 -right-12 h-24 w-24 rounded-full opacity-[0.07] blur-2xl transition-opacity duration-500 group-hover:opacity-[0.12] bg-current ${color}` })}
      />

      <div className="flex items-start justify-between mb-3 relative">
        <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">{title}</span>
        {icon && (
          <div className={cn(
            'flex items-center justify-center h-8 w-8 rounded-lg bg-secondary/50 transition-colors group-hover:bg-secondary',
            color
          )}>
            {icon}
          </div>
        )}
      </div>
      <div className="flex items-baseline gap-2 relative">
        <span className={cn('text-2xl md:text-3xl font-bold font-mono tracking-tight', color || 'text-foreground')}>
          {typeof value === 'number' ? value.toLocaleString() : value}
        </span>
        {subtitle && <span className="text-xs text-muted-foreground font-medium">{subtitle}</span>}
      </div>
      {children && <div className="relative">{children}</div>}
    </div>
  );
}

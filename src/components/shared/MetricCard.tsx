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
    <div className={cn('glass-card p-4 md:p-5 animate-fade-in', className)}>
      <div className="flex items-start justify-between mb-3">
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{title}</span>
        {icon && <div className={cn('text-muted-foreground', color)}>{icon}</div>}
      </div>
      <div className="flex items-baseline gap-2">
        <span className={cn('text-2xl md:text-3xl font-bold font-mono tracking-tight', color || 'text-foreground')}>
          {typeof value === 'number' ? value.toLocaleString() : value}
        </span>
        {subtitle && <span className="text-xs text-muted-foreground">{subtitle}</span>}
      </div>
      {children}
    </div>
  );
}

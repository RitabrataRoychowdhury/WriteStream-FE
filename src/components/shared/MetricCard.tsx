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
      'card-3d p-5 md:p-6 group relative overflow-hidden perspective-container',
      className
    )}>
      {/* Ambient glow */}
      <div
        className={cn(
          'absolute -top-16 -right-16 h-32 w-32 rounded-full opacity-[0.04] blur-2xl transition-opacity duration-500 group-hover:opacity-[0.08]',
          color || 'bg-primary'
        )}
      />

      <div className="flex items-start justify-between mb-4 relative z-10">
        <span className="section-label">{title}</span>
        {icon && (
          <div className={cn(
            'flex items-center justify-center h-9 w-9 rounded-xl bg-secondary/60 transition-all duration-200 group-hover:bg-secondary group-hover:scale-105',
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

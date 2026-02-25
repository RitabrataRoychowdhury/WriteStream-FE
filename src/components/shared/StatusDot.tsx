import { cn } from '@/lib/utils';
import type { ComponentStatus } from '@/mocks/mockData';

const statusColors: Record<ComponentStatus, string> = {
  healthy: 'bg-ws-success',
  degraded: 'bg-ws-warning',
  down: 'bg-ws-error',
  disabled: 'bg-muted-foreground/40',
};

export function StatusDot({ status, size = 'sm' }: { status: ComponentStatus; size?: 'sm' | 'md' }) {
  return (
    <span className="relative flex items-center justify-center">
      <span className={cn(
        'rounded-full',
        statusColors[status],
        size === 'sm' ? 'h-2 w-2' : 'h-3 w-3',
        status === 'healthy' && 'animate-pulse-glow'
      )} />
    </span>
  );
}

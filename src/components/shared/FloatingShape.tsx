import { cn } from '@/lib/utils';

interface FloatingShapeProps {
  className?: string;
  variant?: 'circle' | 'ring' | 'dot-grid' | 'gradient-orb';
  size?: number;
  color?: string;
  delay?: number;
}

export function FloatingShape({ className, variant = 'circle', size = 120, color, delay = 0 }: FloatingShapeProps) {
  const shapeStyles: Record<string, React.CSSProperties> = {
    circle: {
      width: size,
      height: size,
      borderRadius: '50%',
      background: `radial-gradient(circle, ${color || 'hsl(var(--primary) / 0.08)'}, transparent 70%)`,
    },
    ring: {
      width: size,
      height: size,
      borderRadius: '50%',
      border: `1.5px solid ${color || 'hsl(var(--primary) / 0.1)'}`,
      background: 'transparent',
    },
    'dot-grid': {
      width: size,
      height: size,
      backgroundImage: `radial-gradient(circle, ${color || 'hsl(var(--primary) / 0.15)'} 1px, transparent 1px)`,
      backgroundSize: '12px 12px',
    },
    'gradient-orb': {
      width: size,
      height: size,
      borderRadius: '50%',
      background: `radial-gradient(circle at 30% 30%, ${color || 'hsl(var(--primary) / 0.12)'}, hsl(var(--ws-wal) / 0.06), transparent 70%)`,
      filter: 'blur(8px)',
    },
  };

  return (
    <div
      className={cn(
        'absolute pointer-events-none animate-float',
        className
      )}
      style={{
        ...shapeStyles[variant],
        animationDelay: `${delay}ms`,
        animationDuration: `${4 + Math.random() * 3}s`,
      }}
    />
  );
}

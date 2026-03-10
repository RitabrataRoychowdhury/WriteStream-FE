import { useMouseGlow } from '@/hooks/useMouseGlow';
import { cn } from '@/lib/utils';

interface TiltCardProps {
  children: React.ReactNode;
  className?: string;
  glowColor?: string;
  intensity?: number;
}

export function TiltCard({ children, className, glowColor, intensity = 1 }: TiltCardProps) {
  const { ref, handleMouseMove, handleMouseLeave } = useMouseGlow(intensity);

  return (
    <div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={cn(
        'relative overflow-hidden rounded-2xl border border-border/40 transition-all duration-300 ease-out',
        'hover:border-primary/20 hover:shadow-elevated',
        'perspective-container group',
        className
      )}
      style={{
        background: 'hsl(var(--surface-elevated))',
        transform: 'rotateX(var(--tilt-x, 0deg)) rotateY(var(--tilt-y, 0deg))',
        transformStyle: 'preserve-3d',
      }}
    >
      {/* Mouse-following glow */}
      <div
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none z-0"
        style={{
          background: `radial-gradient(400px circle at var(--mouse-x, 50%) var(--mouse-y, 50%), ${glowColor || 'hsl(var(--primary) / 0.06)'}, transparent 50%)`,
        }}
      />
      <div className="relative z-10">{children}</div>
    </div>
  );
}

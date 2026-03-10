import { useCallback, useRef } from 'react';

/**
 * Tracks mouse position within an element and sets CSS custom properties
 * --mouse-x and --mouse-y for radial glow effects.
 * Also supports 3D tilt via --tilt-x and --tilt-y.
 */
export function useMouseGlow(intensity: number = 1) {
  const ref = useRef<HTMLDivElement>(null);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    el.style.setProperty('--mouse-x', `${x}%`);
    el.style.setProperty('--mouse-y', `${y}%`);

    // 3D tilt: ±5deg max
    const tiltX = ((y - 50) / 50) * -4 * intensity;
    const tiltY = ((x - 50) / 50) * 4 * intensity;
    el.style.setProperty('--tilt-x', `${tiltX}deg`);
    el.style.setProperty('--tilt-y', `${tiltY}deg`);
  }, [intensity]);

  const handleMouseLeave = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    el.style.setProperty('--tilt-x', '0deg');
    el.style.setProperty('--tilt-y', '0deg');
  }, []);

  return { ref, handleMouseMove, handleMouseLeave };
}

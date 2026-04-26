import { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Cinematic route transition overlay.
 * When the user navigates to one of the configured "showcase" routes,
 * the hero background video plays full-screen for ~1.4s before fading out.
 * The component itself renders nothing while idle.
 */
const SHOWCASE_ROUTES = new Set<string>(['/pipeline', '/dashboard', '/builder']);
const DURATION_MS = 1400;

export function HeroTransition() {
  const location = useLocation();
  const prevPath = useRef<string>(location.pathname);
  const [active, setActive] = useState(false);
  const [phase, setPhase] = useState<'in' | 'out'>('in');
  const timerIn = useRef<number | null>(null);
  const timerOut = useRef<number | null>(null);

  useEffect(() => {
    const next = location.pathname;
    const prev = prevPath.current;
    prevPath.current = next;

    // Trigger only when arriving at a showcase route from a different route
    if (SHOWCASE_ROUTES.has(next) && next !== prev) {
      if (timerIn.current) window.clearTimeout(timerIn.current);
      if (timerOut.current) window.clearTimeout(timerOut.current);
      setPhase('in');
      setActive(true);
      // Start fade-out shortly before unmount for a smooth exit
      timerOut.current = window.setTimeout(() => setPhase('out'), DURATION_MS - 400);
      timerIn.current = window.setTimeout(() => setActive(false), DURATION_MS);
    }
    return () => {
      // cleanup handled by the next effect run
    };
  }, [location.pathname]);

  useEffect(() => {
    return () => {
      if (timerIn.current) window.clearTimeout(timerIn.current);
      if (timerOut.current) window.clearTimeout(timerOut.current);
    };
  }, []);

  if (!active) return null;

  return (
    <div
      aria-hidden
      className="fixed inset-0 z-[100] pointer-events-none overflow-hidden"
      style={{
        opacity: phase === 'out' ? 0 : 1,
        transition: 'opacity 380ms cubic-bezier(0.4, 0, 0.2, 1)',
      }}
    >
      <video
        autoPlay
        loop
        muted
        playsInline
        className="absolute inset-0 w-full h-full object-cover"
      >
        <source
          src="https://res.cloudinary.com/dfonotyfb/video/upload/v1775585556/dds3_1_rqhg7x.mp4"
          type="video/mp4"
        />
      </video>
      {/* Cinematic darkening overlays — same language as the landing page */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,hsl(220_40%_3%/0.55)_55%,hsl(220_40%_3%/0.92)_100%)]" />
      <div className="absolute inset-0 bg-gradient-to-b from-[hsl(220_40%_3%/0.55)] via-transparent to-[hsl(220_40%_3%/0.95)]" />
      <div className="absolute -bottom-40 left-1/2 -translate-x-1/2 w-[1100px] h-[1100px] rounded-full bg-[radial-gradient(circle,hsl(14_90%_55%/0.18),transparent_60%)] blur-3xl" />
      {/* Subtle grain */}
      <div
        className="absolute inset-0 opacity-[0.05] mix-blend-overlay"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.6'/%3E%3C/svg%3E\")",
        }}
      />
    </div>
  );
}
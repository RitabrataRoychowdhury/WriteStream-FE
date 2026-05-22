import { Link } from 'react-router-dom';
import { useEffect, useRef, useState } from 'react';
import { ArrowRight, Activity, Github, ChevronDown } from 'lucide-react';
import wsMark from '@/assets/writestream-mark.png';
import heroStage1 from '@/assets/hero-stage-1.png';
import { LandingSections } from '@/components/landing/LandingSections';

const INTRO_KEY = 'ws_intro_played_v3';

export default function LandingPage() {
  // Show intro once per session. Skip on reduced-motion.
  const [introDone, setIntroDone] = useState(() => {
    if (typeof window === 'undefined') return true;
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return true;
    return sessionStorage.getItem(INTRO_KEY) === '1';
  });
  const [fadeOut, setFadeOut] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (introDone) return;
    // Force play (some browsers need an explicit call even with autoplay)
    const v = videoRef.current;
    if (v) {
      v.muted = true;
      const p = v.play();
      if (p && typeof p.catch === 'function') {
        p.catch(() => finishIntro());
      }
    }
    // Safety fallback in case video fails to fire onEnded
    const t = setTimeout(() => finishIntro(), 12000);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [introDone]);

  const finishIntro = () => {
    if (fadeOut) return;
    setFadeOut(true);
    sessionStorage.setItem(INTRO_KEY, '1');
    setTimeout(() => setIntroDone(true), 700);
  };

  return (
    <div className="relative w-full overflow-x-hidden bg-[hsl(220_30%_4%)] text-white">
      {/* ───────── Intro overlay ───────── */}
      {!introDone && (
        <div
          className={`fixed inset-0 z-[100] bg-black flex items-center justify-center transition-opacity duration-700 ${
            fadeOut ? 'opacity-0 pointer-events-none' : 'opacity-100'
          }`}
        >
          <video
            ref={videoRef}
            autoPlay
            muted
            playsInline
            preload="auto"
            onEnded={finishIntro}
            onError={finishIntro}
            className="w-full h-full object-cover"
          >
            <source src="/intro/system-transformation.mp4" type="video/mp4" />
          </video>
          <button
            onClick={finishIntro}
            className="absolute bottom-8 right-8 text-[10px] uppercase tracking-[0.3em] font-mono text-white/50 hover:text-white/90 transition-colors border border-white/15 rounded-full px-4 py-2 backdrop-blur-sm bg-white/[0.03]"
            aria-label="Skip intro"
          >
            Skip
          </button>
        </div>
      )}

      {/* ───────── HERO — simple, fast, single static stage ───────── */}
      <div className="relative w-full h-screen overflow-hidden">
        <img
          src={heroStage1}
          alt=""
          loading="eager"
          decoding="async"
          fetchPriority="high"
          draggable={false}
          className="absolute inset-0 z-0 h-full w-full object-cover"
        />

          {/* Cinematic overlays */}
          <div className="absolute inset-0 z-10 bg-[radial-gradient(ellipse_at_center,transparent_0%,hsl(220_40%_3%/0.45)_60%,hsl(220_40%_3%/0.9)_100%)] pointer-events-none" />
          <div className="absolute inset-0 z-10 bg-gradient-to-b from-[hsl(220_40%_3%/0.5)] via-transparent to-[hsl(220_40%_3%/0.95)] pointer-events-none" />
          <div
            className="absolute inset-0 z-10 opacity-[0.05] mix-blend-overlay pointer-events-none"
            style={{
              backgroundImage:
                "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.6'/%3E%3C/svg%3E\")",
            }}
          />
          <div className="absolute -bottom-40 left-1/2 -translate-x-1/2 w-[1100px] h-[1100px] rounded-full bg-[radial-gradient(circle,hsl(14_90%_55%/0.18),transparent_60%)] blur-3xl z-10 pointer-events-none" />

          {/* HUD overlay */}
          <div className="absolute inset-0 z-20">
            {/* Top nav (always visible) */}
            <header className="relative flex items-center justify-between px-6 md:px-12 h-20 pointer-events-auto">
              <div className="flex items-center gap-3">
                <div className="relative h-9 w-9">
                  <div className="absolute inset-0 rounded-xl bg-[radial-gradient(circle_at_center,hsl(14_90%_55%/0.45),transparent_70%)] blur-md" />
                  <img src={wsMark} alt="WriteStream" className="relative h-9 w-9 object-contain" />
                </div>
                <div className="flex flex-col leading-none">
                  <span className="font-display text-base font-bold tracking-tight">WriteStream</span>
                  <span className="text-[9px] font-medium tracking-[0.2em] text-white/40 uppercase mt-1">Engine</span>
                </div>
              </div>
              <nav className="hidden md:flex items-center gap-7 text-sm text-white/60">
                <a href="#architecture" className="hover:text-white transition-colors">Architecture</a>
                <a href="#features" className="hover:text-white transition-colors">Features</a>
                <Link to="/dashboard" className="hover:text-white transition-colors">Dashboard</Link>
                <Link to="/builder" className="hover:text-white transition-colors">Builder</Link>
              </nav>
              <a
                href="https://github.com"
                target="_blank"
                rel="noreferrer"
                className="hidden md:inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 backdrop-blur px-4 py-2 text-xs text-white/80 hover:bg-white/10 transition-colors"
              >
                <Github className="h-3.5 w-3.5" />
                Source
              </a>
            </header>

            {/* Hero copy */}
            <main className="relative flex flex-col items-center justify-center text-center px-6 min-h-[calc(100vh-5rem)] pb-24 pointer-events-auto">
              <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.06] backdrop-blur-xl px-4 py-1.5 text-[11px] tracking-[0.18em] uppercase text-white/80 shadow-[inset_0_1px_0_hsl(0_0%_100%/0.15),0_8px_32px_-8px_hsl(14_90%_55%/0.25)]">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[hsl(140_70%_55%)] opacity-75" />
                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-[hsl(140_70%_55%)]" />
                </span>
                Live · v0.1 Engine Online
              </div>

              <div className="relative inline-block">
                <div
                  aria-hidden
                  className="absolute -inset-x-10 -inset-y-6 rounded-[2rem] bg-white/[0.03] backdrop-blur-2xl border border-white/10 shadow-[inset_0_1px_0_hsl(0_0%_100%/0.12),0_30px_80px_-30px_hsl(14_90%_55%/0.35)] overflow-hidden"
                >
                  <div
                    className="absolute inset-0 opacity-60"
                    style={{
                      background:
                        'conic-gradient(from 0deg, hsl(14 90% 55% / 0.18), transparent 30%, hsl(220 30% 80% / 0.1) 55%, transparent 80%, hsl(14 90% 55% / 0.18))',
                      animation: 'liquid-sweep 14s ease-in-out infinite',
                      filter: 'blur(28px)',
                    }}
                  />
                  <div className="absolute inset-x-6 top-1 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent" />
                </div>
                <h1 className="relative font-display text-[clamp(2.75rem,8vw,6.5rem)] font-semibold leading-[0.95] tracking-[-0.04em] max-w-5xl px-6">
                  <span className="block bg-gradient-to-b from-white via-white to-white/40 bg-clip-text text-transparent drop-shadow-[0_2px_24px_hsl(0_0%_100%/0.18)]">
                    Streaming,
                  </span>
                  <span className="block italic font-light bg-gradient-to-r from-[hsl(14_90%_65%)] via-[hsl(28_95%_60%)] to-[hsl(14_90%_55%)] bg-clip-text text-transparent drop-shadow-[0_2px_28px_hsl(14_90%_55%/0.5)]">
                    sequenced.
                  </span>
                </h1>
              </div>

              <p className="mt-7 max-w-xl text-base md:text-lg text-white/70 leading-relaxed backdrop-blur-sm">
                A deterministic streaming engine with a write-ahead log, sharded execution,
                and reactive views — built for operators who need to see every event.
              </p>

              <div className="mt-10 flex flex-col sm:flex-row items-center gap-3">
                <Link
                  to="/dashboard"
                  className="group inline-flex items-center gap-2 rounded-full bg-white text-[hsl(220_40%_6%)] px-6 py-3 text-sm font-medium hover:bg-white/90 transition-all shadow-[0_10px_40px_-10px_hsl(14_90%_55%/0.5)]"
                >
                  <Activity className="h-4 w-4" />
                  View Dashboard
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </Link>
                <a
                  href="#architecture"
                  className="group inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.06] backdrop-blur-xl px-6 py-3 text-sm font-medium text-white/90 hover:bg-white/10 transition-colors shadow-[inset_0_1px_0_hsl(0_0%_100%/0.12)]"
                >
                  See architecture
                  <ChevronDown className="h-4 w-4 transition-transform group-hover:translate-y-0.5" />
                </a>
              </div>
            </main>

            {/* Footer meta */}
            <div className="absolute bottom-8 left-0 right-0 flex items-center justify-between px-8 md:px-14 text-[10px] tracking-[0.25em] uppercase text-white/35 font-mono pointer-events-auto">
              <span>WAL · Sharded · Reactive</span>
              <span className="hidden md:inline">N 40.7128° · W 74.0060°</span>
              <span>2026 / Edition 01</span>
            </div>

            {/* Scroll cue */}
            <a
              href="#architecture"
              className="absolute bottom-24 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-white/40 hover:text-white/80 transition-colors animate-float pointer-events-auto"
              aria-label="Scroll down"
            >
              <span className="text-[10px] uppercase tracking-[0.3em] font-mono">Scroll</span>
              <ChevronDown className="h-4 w-4" />
            </a>
          </div>
      </div>


      {/* ───────── Marketing sections ───────── */}
      <LandingSections />
    </div>
  );
}
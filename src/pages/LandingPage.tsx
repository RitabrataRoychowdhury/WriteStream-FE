import { Link } from 'react-router-dom';
import { ArrowRight, Activity, Github, ChevronDown } from 'lucide-react';
import wsMark from '@/assets/writestream-mark.png';
import { LandingSections } from '@/components/landing/LandingSections';

export default function LandingPage() {
  return (
    <div className="relative w-full overflow-x-hidden bg-[hsl(220_30%_4%)] text-white">
      {/* ───────── HERO (full viewport, video background) ───────── */}
      <section className="relative min-h-screen w-full overflow-hidden">
        {/* Background video */}
        <video
          autoPlay
          loop
          muted
          playsInline
          className="absolute inset-0 w-full h-full object-cover z-0"
        >
          <source
            src="https://res.cloudinary.com/dfonotyfb/video/upload/v1775585556/dds3_1_rqhg7x.mp4"
            type="video/mp4"
          />
        </video>

        {/* Cinematic overlays */}
        <div className="absolute inset-0 z-10 bg-[radial-gradient(ellipse_at_center,transparent_0%,hsl(220_40%_3%/0.55)_55%,hsl(220_40%_3%/0.92)_100%)]" />
        <div className="absolute inset-0 z-10 bg-gradient-to-b from-[hsl(220_40%_3%/0.55)] via-transparent to-[hsl(220_40%_3%/0.95)]" />
        {/* Subtle scanline / grain */}
        <div
          className="absolute inset-0 z-10 opacity-[0.05] mix-blend-overlay pointer-events-none"
          style={{
            backgroundImage:
              "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.6'/%3E%3C/svg%3E\")",
          }}
        />
        {/* Vignette ring accent */}
        <div className="absolute -bottom-40 left-1/2 -translate-x-1/2 w-[1100px] h-[1100px] rounded-full bg-[radial-gradient(circle,hsl(14_90%_55%/0.18),transparent_60%)] blur-3xl z-10 pointer-events-none" />

        {/* Top nav */}
        <header className="relative z-20 flex items-center justify-between px-6 md:px-12 h-20">
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

        {/* Hero content */}
        <main className="relative z-20 flex flex-col items-center justify-center text-center px-6 min-h-[calc(100vh-5rem)] pb-24">
        {/* Status pill */}
        <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] backdrop-blur-md px-4 py-1.5 text-[11px] tracking-[0.18em] uppercase text-white/70">
          <span className="relative flex h-1.5 w-1.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[hsl(140_70%_55%)] opacity-75" />
            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-[hsl(140_70%_55%)]" />
          </span>
          Live · v0.1 Engine Online
        </div>

        <h1 className="font-display text-[clamp(2.75rem,8vw,6.5rem)] font-semibold leading-[0.95] tracking-[-0.04em] max-w-5xl">
          <span className="block bg-gradient-to-b from-white via-white to-white/40 bg-clip-text text-transparent">
            Streaming,
          </span>
          <span className="block italic font-light bg-gradient-to-r from-[hsl(14_90%_65%)] via-[hsl(28_95%_60%)] to-[hsl(14_90%_55%)] bg-clip-text text-transparent">
            sequenced.
          </span>
        </h1>

        <p className="mt-7 max-w-xl text-base md:text-lg text-white/60 leading-relaxed">
          A deterministic streaming engine with a write-ahead log, sharded execution,
          and reactive views — built for operators who need to see every event.
        </p>

        {/* CTAs */}
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
            className="group inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.03] backdrop-blur-md px-6 py-3 text-sm font-medium text-white/90 hover:bg-white/10 transition-colors"
          >
            See architecture
            <ChevronDown className="h-4 w-4 transition-transform group-hover:translate-y-0.5" />
          </a>
        </div>

        {/* Foot meta strip */}
        <div className="absolute bottom-8 left-0 right-0 flex items-center justify-between px-8 md:px-14 text-[10px] tracking-[0.25em] uppercase text-white/35 font-mono">
          <span>WAL · Sharded · Reactive</span>
          <span className="hidden md:inline">N 40.7128° · W 74.0060°</span>
          <span>2026 / Edition 01</span>
        </div>
        </main>

        {/* Scroll cue */}
        <a
          href="#problem"
          className="absolute bottom-24 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-2 text-white/40 hover:text-white/80 transition-colors animate-float"
          aria-label="Scroll down"
        >
          <span className="text-[10px] uppercase tracking-[0.3em] font-mono">Scroll</span>
          <ChevronDown className="h-4 w-4" />
        </a>
      </section>

      {/* ───────── Marketing sections ───────── */}
      <LandingSections />
    </div>
  );
}
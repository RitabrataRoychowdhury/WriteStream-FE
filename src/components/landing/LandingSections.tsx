import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight, GitMerge, Split, Shield, FileCode, Rss, Layers, ShieldCheck,
  Activity, Database, Github, Mail, Copy, Check,
} from 'lucide-react';
import { ArchitectureDiagram } from './ArchitectureDiagram';
import { CountUp } from './CountUp';
import architectureSystem from '@/assets/architecture-system.png';

/* ────────────────────────────────────────────────────────────────
   Reusable scroll-reveal wrapper (no Framer Motion)
   ──────────────────────────────────────────────────────────────── */
function Reveal({ children, delay = 0, className = '' }: { children: React.ReactNode; delay?: number; className?: string }) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [shown, setShown] = useState(false);
  useEffect(() => {
    if (!ref.current) return;
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) {
        setShown(true);
        io.disconnect();
      }
    }, { threshold: 0.15 });
    io.observe(ref.current);
    return () => io.disconnect();
  }, []);
  return (
    <div
      ref={ref}
      style={{
        opacity: shown ? 1 : 0,
        transform: shown ? 'translateY(0)' : 'translateY(24px)',
        transition: `opacity 0.8s ease ${delay}ms, transform 0.8s cubic-bezier(0.16, 1, 0.3, 1) ${delay}ms`,
      }}
      className={className}
    >
      {children}
    </div>
  );
}

function SectionEyebrow({ children }: { children: React.ReactNode }) {
  return (
    <div className="inline-flex items-center gap-2 mb-5">
      <span className="h-px w-8 bg-gradient-to-r from-transparent to-[hsl(14_90%_60%)]" />
      <span className="text-[10px] font-mono tracking-[0.32em] uppercase text-[hsl(14_90%_65%)]">{children}</span>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────
   Section 2 — Problem statement (3 cards)
   ──────────────────────────────────────────────────────────────── */
const PROBLEM_CARDS = [
  {
    icon: GitMerge,
    title: 'Events from everywhere',
    body: 'HTTP APIs, Kafka topics, and CDC streams from PostgreSQL, MySQL, MongoDB — all hitting the same pipeline simultaneously, all expecting durability.',
  },
  {
    icon: Split,
    title: 'Landing in many systems',
    body: 'PostgreSQL for OLTP, ClickHouse for analytics, Kafka for downstream, MySQL for legacy — same events, different speeds, no head-of-line blocking.',
  },
  {
    icon: Shield,
    title: 'Without losing a single write',
    body: 'Crash recovery, circuit breakers, dead-letter queues, four-signal backpressure — not bolted on, built into the kernel.',
  },
];

function ProblemSection() {
  return (
    <section id="problem" className="relative py-28 md:py-36 px-6 md:px-12 overflow-hidden">
      {/* Ambient halo */}
      <div className="pointer-events-none absolute -top-20 left-1/2 -translate-x-1/2 w-[800px] h-[400px] rounded-full blur-3xl"
        style={{ background: 'radial-gradient(ellipse, hsl(14 90% 55% / 0.08), transparent 70%)' }} />

      <div className="relative max-w-7xl mx-auto">
        <Reveal>
          <div className="text-center max-w-3xl mx-auto mb-16">
            <SectionEyebrow>The problem</SectionEyebrow>
            <h2 className="font-display text-4xl md:text-5xl font-semibold tracking-tight text-white">
              Writing data is the
              <span className="block italic font-light bg-gradient-to-r from-[hsl(14_90%_65%)] to-[hsl(28_95%_60%)] bg-clip-text text-transparent">
                hardest part of a pipeline.
              </span>
            </h2>
            <p className="mt-5 text-base text-white/55 leading-relaxed">
              Reads scale horizontally with caches and replicas. Writes don't. They have to be ordered,
              durable, and routed — under load, across heterogeneous sinks, without dropping a packet.
            </p>
          </div>
        </Reveal>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {PROBLEM_CARDS.map((c, i) => {
            const Icon = c.icon;
            return (
              <Reveal key={c.title} delay={i * 120}>
                <div className="group relative h-full rounded-2xl p-7 border border-white/[0.08] bg-white/[0.02] backdrop-blur-sm hover:border-[hsl(14_90%_60%/0.3)] transition-all duration-500 overflow-hidden">
                  {/* Hover glow */}
                  <div className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                    style={{ background: 'radial-gradient(circle at 50% 0%, hsl(14 90% 55% / 0.10), transparent 60%)' }} />
                  <div className="relative">
                    <div className="inline-flex items-center justify-center h-11 w-11 rounded-xl mb-5 border border-[hsl(14_90%_60%/0.25)]"
                      style={{ background: 'hsl(14 90% 55% / 0.08)' }}>
                      <Icon className="h-5 w-5" style={{ color: 'hsl(14 90% 65%)' }} />
                    </div>
                    <h3 className="font-display text-xl font-semibold text-white mb-3 tracking-tight">{c.title}</h3>
                    <p className="text-sm text-white/55 leading-relaxed">{c.body}</p>
                  </div>
                  {/* Bottom accent */}
                  <div className="absolute bottom-0 left-7 right-7 h-px opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                    style={{ background: 'linear-gradient(90deg, transparent, hsl(14 90% 60% / 0.5), transparent)' }} />
                </div>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ────────────────────────────────────────────────────────────────
   Section 3 — Architecture
   ──────────────────────────────────────────────────────────────── */
function ArchitectureSection() {
  return (
    <section id="architecture" className="relative py-28 md:py-36 px-6 md:px-12 overflow-hidden">
      {/* Top → bottom subtle band */}
      <div className="pointer-events-none absolute inset-0"
        style={{ background: 'linear-gradient(180deg, transparent, hsl(220 40% 4% / 0.6) 50%, transparent)' }} />

      <div className="relative max-w-7xl mx-auto">
        <Reveal>
          <div className="text-center max-w-3xl mx-auto mb-14">
            <SectionEyebrow>Architecture</SectionEyebrow>
            <h2 className="font-display text-4xl md:text-5xl font-semibold tracking-tight text-white">
              One write side.
              <span className="block italic font-light bg-gradient-to-r from-[hsl(14_90%_65%)] to-[hsl(28_95%_60%)] bg-clip-text text-transparent">
                Every destination.
              </span>
            </h2>
            <p className="mt-5 text-base text-white/55 leading-relaxed">
              A deterministic, sharded execution model with a write-ahead log at its core.
              Hot path is single-pass and lock-free. Cold path fans out without head-of-line blocking.
            </p>
          </div>
        </Reveal>

        <Reveal delay={200}>
          <div className="relative rounded-3xl border border-white/[0.08] bg-gradient-to-b from-white/[0.02] to-transparent p-3 md:p-6 backdrop-blur-sm overflow-hidden group">
            {/* Ambient red glow behind the image */}
            <div className="pointer-events-none absolute inset-0 opacity-70"
              style={{ background: 'radial-gradient(ellipse at 50% 50%, hsl(14 90% 55% / 0.18), transparent 65%)' }} />

            <div className="relative rounded-2xl overflow-hidden">
              <img
                src={architectureSystem}
                alt="WriteStream system architecture — sources, sequencer ring, sharded core, and sinks"
                className="relative z-0 w-full h-auto select-none"
                draggable={false}
              />

              {/* Aggressive flowing red light rays overlay */}
              <svg
                className="pointer-events-none absolute inset-0 w-full h-full z-10 mix-blend-screen"
                viewBox="0 0 100 60"
                preserveAspectRatio="none"
                aria-hidden="true"
              >
                <defs>
                  <linearGradient id="ray-h" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%"  stopColor="hsl(14 100% 65%)" stopOpacity="0" />
                    <stop offset="45%" stopColor="hsl(14 100% 65%)" stopOpacity="0.95" />
                    <stop offset="55%" stopColor="hsl(14 100% 70%)" stopOpacity="1" />
                    <stop offset="100%" stopColor="hsl(14 100% 65%)" stopOpacity="0" />
                  </linearGradient>
                  <linearGradient id="ray-v" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%"  stopColor="hsl(14 100% 65%)" stopOpacity="0" />
                    <stop offset="50%" stopColor="hsl(14 100% 70%)" stopOpacity="1" />
                    <stop offset="100%" stopColor="hsl(14 100% 65%)" stopOpacity="0" />
                  </linearGradient>
                  <filter id="ray-blur"><feGaussianBlur stdDeviation="0.25" /></filter>
                </defs>

                {/* Horizontal sweeping rays at varied y positions / speeds */}
                {[
                  { y: 12, h: 0.5, dur: 4.2, delay: 0 },
                  { y: 22, h: 0.35, dur: 3.4, delay: 0.6 },
                  { y: 31, h: 0.6, dur: 5.1, delay: 1.2 },
                  { y: 40, h: 0.4, dur: 3.8, delay: 0.3 },
                  { y: 49, h: 0.5, dur: 4.6, delay: 1.8 },
                ].map((r, i) => (
                  <g key={`h-${i}`} filter="url(#ray-blur)">
                    <rect x="-30" y={r.y} width="30" height={r.h} fill="url(#ray-h)">
                      <animate
                        attributeName="x"
                        from="-30" to="130"
                        dur={`${r.dur}s`}
                        begin={`${r.delay}s`}
                        repeatCount="indefinite"
                      />
                    </rect>
                  </g>
                ))}

                {/* Vertical pulses through the central spine */}
                {[
                  { x: 28, w: 0.35, dur: 3.2, delay: 0.4 },
                  { x: 50, w: 0.5, dur: 2.6, delay: 0 },
                  { x: 72, w: 0.35, dur: 3.6, delay: 1.0 },
                ].map((r, i) => (
                  <g key={`v-${i}`} filter="url(#ray-blur)">
                    <rect x={r.x} y="-20" width={r.w} height="20" fill="url(#ray-v)">
                      <animate
                        attributeName="y"
                        from="-20" to="80"
                        dur={`${r.dur}s`}
                        begin={`${r.delay}s`}
                        repeatCount="indefinite"
                      />
                    </rect>
                  </g>
                ))}
              </svg>

              {/* Pulse vignette to make the rays pop */}
              <div className="pointer-events-none absolute inset-0 z-20"
                style={{ background: 'radial-gradient(ellipse at center, transparent 55%, hsl(220 40% 3% / 0.55) 100%)' }} />
            </div>

            {/* Caption strip */}
            <div className="relative mt-4 flex items-center justify-between px-2 text-[10px] uppercase tracking-[0.25em] font-mono text-white/40">
              <span>Sources → Sequencer → WAL → Shards → Sinks</span>
              <span className="hidden md:inline text-[hsl(14_90%_65%)]/70">Live energy · 1M+ events/s</span>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* ────────────────────────────────────────────────────────────────
   Section 4 — Metrics counters
   ──────────────────────────────────────────────────────────────── */
const METRICS = [
  { label: 'events / second', to: 1_000_000, suffix: '+', format: (n: number) => Math.round(n).toLocaleString() },
  { label: 'p99 write latency', to: 1, suffix: 'ms', format: (n: number) => `<${n.toFixed(0)}` },
  { label: 'reactive updates / sec', to: 5_000_000, suffix: '+', format: (n: number) => Math.round(n).toLocaleString() },
  { label: 'events lost · ever', to: 0, suffix: '', format: () => '0' },
] as const;

function MetricsSection() {
  return (
    <section id="metrics" className="relative py-28 md:py-32 px-6 md:px-12 overflow-hidden">
      <div className="relative max-w-7xl mx-auto">
        <Reveal>
          <div className="text-center mb-16">
            <SectionEyebrow>By the numbers</SectionEyebrow>
            <h2 className="font-display text-3xl md:text-4xl font-semibold tracking-tight text-white">
              Built for the write-side workload.
            </h2>
          </div>
        </Reveal>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-px rounded-2xl overflow-hidden border border-white/[0.06]"
          style={{ background: 'hsl(0 0% 100% / 0.04)' }}>
          {METRICS.map((m, i) => (
            <Reveal key={m.label} delay={i * 100} className="bg-[hsl(220_40%_5%)]">
              <div className="px-6 py-10 md:px-8 md:py-14 text-center">
                <div className="font-display font-semibold text-4xl md:text-5xl tabular-nums tracking-tight">
                  <CountUp
                    to={m.to}
                    suffix={m.suffix}
                    format={m.format as (n: number) => string}
                    className="bg-gradient-to-b from-white to-white/60 bg-clip-text text-transparent"
                  />
                </div>
                <div className="mt-3 text-[11px] uppercase tracking-[0.2em] text-white/45 font-mono">
                  {m.label}
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ────────────────────────────────────────────────────────────────
   Section 5 — Features grid (2 x 3)
   ──────────────────────────────────────────────────────────────── */
const FEATURES = [
  { icon: FileCode,    title: 'Declarative YAML mappings', body: 'Field extraction, type conversion, conditional logic, computed fields. Define transformations in YAML — no code.' },
  { icon: Rss,         title: 'Real-time reactive views',  body: 'Any database becomes reactive. Define aggregations in YAML, get live updates pushed over WebSocket.' },
  { icon: Layers,      title: 'Multi-sink replication',    body: 'Fan out to PostgreSQL, MySQL, ClickHouse, and Kafka simultaneously. No head-of-line blocking.' },
  { icon: ShieldCheck, title: 'Crash recovery',            body: 'WAL with fsync guarantees. Watermark-based recovery. Zero data loss on crash, by construction.' },
  { icon: Activity,    title: 'Unified backpressure',      body: 'Four-signal pressure system: shard fill, disk usage, sink lag, memory. Hysteresis prevents oscillation.' },
  { icon: Database,    title: 'CDC integration',           body: 'PostgreSQL logical replication, MySQL binlog, MongoDB change streams. Schema introspection. Checkpoints.' },
];

function FeaturesSection() {
  return (
    <section id="features" className="relative py-28 md:py-36 px-6 md:px-12 overflow-hidden">
      <div className="pointer-events-none absolute top-1/3 right-0 w-[500px] h-[500px] rounded-full blur-3xl"
        style={{ background: 'radial-gradient(circle, hsl(14 90% 55% / 0.08), transparent 70%)' }} />

      <div className="relative max-w-7xl mx-auto">
        <Reveal>
          <div className="max-w-2xl mb-16">
            <SectionEyebrow>Capabilities</SectionEyebrow>
            <h2 className="font-display text-4xl md:text-5xl font-semibold tracking-tight text-white">
              Everything the write side needs.
              <span className="block italic font-light text-white/50 mt-1">Nothing it doesn't.</span>
            </h2>
          </div>
        </Reveal>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-px rounded-2xl overflow-hidden border border-white/[0.06]"
          style={{ background: 'hsl(0 0% 100% / 0.04)' }}>
          {FEATURES.map((f, i) => {
            const Icon = f.icon;
            return (
              <Reveal key={f.title} delay={(i % 3) * 100} className="bg-[hsl(220_40%_5%)]">
                <div className="group relative h-full p-7 md:p-8 transition-colors duration-500 hover:bg-[hsl(220_40%_6%)]">
                  <div className="inline-flex items-center justify-center h-10 w-10 rounded-lg mb-5 border border-white/10"
                    style={{ background: 'hsl(14 90% 55% / 0.06)' }}>
                    <Icon className="h-4 w-4" style={{ color: 'hsl(14 90% 65%)' }} />
                  </div>
                  <h3 className="font-display text-base font-semibold text-white mb-2 tracking-tight">{f.title}</h3>
                  <p className="text-[13px] text-white/50 leading-relaxed">{f.body}</p>
                </div>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ────────────────────────────────────────────────────────────────
   Section 6 — Code example (split: YAML + live metrics)
   ──────────────────────────────────────────────────────────────── */
const YAML_SAMPLE = `name: user_events
target_table: user_activity
fields:
  - from: "payload.user_id"
    to: "user_id"
    type: "bigint"
  - from: "payload.action"
    to: "action"
    transform: ["lowercase", "trim"]
  - from: "payload.amount"
    to: "amount"
    type: "decimal"`;

function highlightYaml(line: string): React.ReactNode {
  // very small custom highlighter — keys/strings/comments
  if (line.trim().startsWith('#')) {
    return <span className="text-white/35">{line}</span>;
  }
  const keyMatch = line.match(/^(\s*-?\s*)([\w_]+)(:)/);
  if (keyMatch) {
    const rest = line.slice(keyMatch[0].length);
    const restEl = rest.match(/"([^"]*)"/g) ? (
      rest.split(/("[^"]*")/g).map((p, i) =>
        p.startsWith('"') && p.endsWith('"') ? (
          <span key={i} style={{ color: 'hsl(158 65% 65%)' }}>{p}</span>
        ) : <span key={i} className="text-white/70">{p}</span>
      )
    ) : <span className="text-white/70">{rest}</span>;
    return (
      <>
        <span className="text-white/60">{keyMatch[1]}</span>
        <span style={{ color: 'hsl(14 90% 70%)' }}>{keyMatch[2]}</span>
        <span className="text-white/60">{keyMatch[3]}</span>
        {restEl}
      </>
    );
  }
  return <span className="text-white/70">{line}</span>;
}

function CodeSection() {
  const [copied, setCopied] = useState(false);
  const [tps, setTps] = useState(984_321);
  const [latency, setLatency] = useState(0.74);
  const [ring, setRing] = useState(38);

  // Tiny live wiggle
  useEffect(() => {
    const id = window.setInterval(() => {
      setTps(v => Math.max(900_000, Math.min(1_050_000, v + Math.round((Math.random() - 0.5) * 18000))));
      setLatency(v => Math.max(0.4, Math.min(1.2, v + (Math.random() - 0.5) * 0.08)));
      setRing(v => Math.max(20, Math.min(72, v + (Math.random() - 0.5) * 4)));
    }, 1500);
    return () => window.clearInterval(id);
  }, []);

  const onCopy = () => {
    navigator.clipboard.writeText(YAML_SAMPLE).then(() => {
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    });
  };

  return (
    <section id="code" className="relative py-28 md:py-36 px-6 md:px-12 overflow-hidden">
      <div className="relative max-w-7xl mx-auto">
        <Reveal>
          <div className="text-center max-w-3xl mx-auto mb-14">
            <SectionEyebrow>Configure, don't code</SectionEyebrow>
            <h2 className="font-display text-4xl md:text-5xl font-semibold tracking-tight text-white">
              YAML in.
              <span className="bg-gradient-to-r from-[hsl(14_90%_65%)] to-[hsl(28_95%_60%)] bg-clip-text text-transparent italic font-light"> Live metrics </span>
              out.
            </h2>
          </div>
        </Reveal>

        <Reveal delay={150}>
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
            {/* YAML editor mockup */}
            <div className="lg:col-span-3 rounded-2xl overflow-hidden border border-white/[0.08] bg-[hsl(220_40%_4%)]">
              <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/[0.06] bg-white/[0.02]">
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ background: 'hsl(0 70% 60%)' }} />
                  <span className="h-2.5 w-2.5 rounded-full" style={{ background: 'hsl(36 95% 60%)' }} />
                  <span className="h-2.5 w-2.5 rounded-full" style={{ background: 'hsl(158 65% 55%)' }} />
                  <span className="ml-3 text-[11px] font-mono text-white/45">user_events.yaml</span>
                </div>
                <button onClick={onCopy}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] text-white/60 hover:text-white hover:bg-white/[0.06] transition-colors">
                  {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                  {copied ? 'Copied' : 'Copy'}
                </button>
              </div>
              <pre className="p-5 font-mono text-[12.5px] leading-[1.7] overflow-x-auto">
                <code>
                  {YAML_SAMPLE.split('\n').map((line, i) => (
                    <div key={i} className="flex">
                      <span className="select-none text-white/20 pr-4 w-8 text-right">{i + 1}</span>
                      <span>{highlightYaml(line)}</span>
                    </div>
                  ))}
                </code>
              </pre>
            </div>

            {/* Live metrics panel */}
            <div className="lg:col-span-2 rounded-2xl border border-white/[0.08] bg-[hsl(220_40%_4%)] p-6 flex flex-col gap-5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] uppercase tracking-[0.2em] text-white/45 font-mono">Live metrics</span>
                <span className="flex items-center gap-1.5 text-[10px] font-mono text-[hsl(158_65%_60%)]">
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[hsl(158_65%_60%)] opacity-60" />
                    <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-[hsl(158_65%_60%)]" />
                  </span>
                  STREAMING
                </span>
              </div>

              <div>
                <div className="text-[11px] text-white/45 mb-1">Events / sec</div>
                <div className="font-display text-3xl font-semibold tabular-nums text-white">{tps.toLocaleString()}</div>
              </div>

              <div>
                <div className="text-[11px] text-white/45 mb-1">Sink write latency · p99</div>
                <div className="font-display text-3xl font-semibold tabular-nums text-white">
                  {latency.toFixed(2)}<span className="text-white/40 text-xl ml-1">ms</span>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between text-[11px] mb-2">
                  <span className="text-white/45">Ring buffer utilization</span>
                  <span className="font-mono text-white/70">{ring.toFixed(0)}%</span>
                </div>
                <div className="h-2 rounded-full overflow-hidden bg-white/[0.06]">
                  <div className="h-full transition-all duration-700"
                    style={{
                      width: `${ring}%`,
                      background: ring > 70
                        ? 'linear-gradient(90deg, hsl(36 95% 60%), hsl(0 78% 64%))'
                        : 'linear-gradient(90deg, hsl(14 90% 60%), hsl(28 95% 60%))',
                    }} />
                </div>
              </div>

              <div className="mt-auto pt-4 border-t border-white/[0.06] text-[10px] uppercase tracking-[0.2em] text-white/35 font-mono">
                writestream_metrics · 5s scrape
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* ────────────────────────────────────────────────────────────────
   Section 7 — CTA / Footer
   ──────────────────────────────────────────────────────────────── */
function CtaSection() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  return (
    <section id="cta" className="relative py-28 md:py-36 px-6 md:px-12 overflow-hidden">
      <div className="pointer-events-none absolute -bottom-40 left-1/2 -translate-x-1/2 w-[1100px] h-[600px] rounded-full blur-3xl"
        style={{ background: 'radial-gradient(ellipse, hsl(14 90% 55% / 0.18), transparent 70%)' }} />

      <div className="relative max-w-4xl mx-auto text-center">
        <Reveal>
          <SectionEyebrow>Coming soon</SectionEyebrow>
          <h2 className="font-display text-4xl md:text-6xl font-semibold tracking-tight text-white">
            Open source.
            <span className="block italic font-light bg-gradient-to-r from-[hsl(14_90%_65%)] to-[hsl(28_95%_60%)] bg-clip-text text-transparent">
              Operator-grade.
            </span>
          </h2>
          <p className="mt-6 text-base md:text-lg text-white/55 max-w-2xl mx-auto leading-relaxed">
            Built in Rust by people who've debugged distributed systems at 3 a.m. Get notified when the
            engine ships and the dashboard becomes self-serve.
          </p>
        </Reveal>

        <Reveal delay={150}>
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-3">
            <a href="https://github.com" target="_blank" rel="noreferrer"
              className="group inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.04] backdrop-blur-md px-5 py-3 text-sm font-medium text-white/90 hover:bg-white/10 transition-colors">
              <Github className="h-4 w-4" />
              Star on GitHub
              <span className="ml-1 text-[10px] font-mono text-white/45 px-1.5 py-0.5 rounded border border-white/10">soon</span>
            </a>
            <Link to="/dashboard"
              className="group inline-flex items-center gap-2 rounded-full bg-white text-[hsl(220_40%_6%)] px-5 py-3 text-sm font-medium hover:bg-white/90 transition-all shadow-[0_10px_40px_-10px_hsl(14_90%_55%/0.5)]">
              Open the dashboard
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>
        </Reveal>

        <Reveal delay={250}>
          <form
            onSubmit={(e) => { e.preventDefault(); if (email) setSubmitted(true); }}
            className="mt-12 max-w-md mx-auto flex items-stretch gap-2 p-1.5 rounded-full border border-white/10 bg-white/[0.03] backdrop-blur-md"
          >
            <Mail className="h-4 w-4 text-white/40 ml-3 self-center shrink-0" />
            <input
              type="email"
              required
              placeholder={submitted ? "You're on the list ✓" : 'you@team.io'}
              value={submitted ? '' : email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={submitted}
              className="flex-1 bg-transparent text-sm text-white placeholder:text-white/40 focus:outline-none px-2"
            />
            <button type="submit"
              className="rounded-full px-5 py-2 text-sm font-medium bg-[hsl(14_90%_55%)] hover:bg-[hsl(14_90%_60%)] text-white transition-colors shrink-0">
              {submitted ? 'Subscribed' : 'Notify me'}
            </button>
          </form>
        </Reveal>

        <div className="mt-24 pt-8 border-t border-white/[0.06] flex flex-col md:flex-row items-center justify-between gap-4 text-[11px] text-white/35 font-mono uppercase tracking-[0.18em]">
          <span>WriteStream · 2026</span>
          <span className="flex items-center gap-5">
            <Link to="/pipeline" className="hover:text-white/70 transition-colors">Pipeline</Link>
            <Link to="/dashboard" className="hover:text-white/70 transition-colors">Dashboard</Link>
            <Link to="/builder" className="hover:text-white/70 transition-colors">Builder</Link>
            <Link to="/grafana" className="hover:text-white/70 transition-colors">Grafana</Link>
          </span>
          <span>Built in Rust</span>
        </div>
      </div>
    </section>
  );
}

/* ────────────────────────────────────────────────────────────────
   Public composite — render order
   ──────────────────────────────────────────────────────────────── */
export function LandingSections() {
  return (
    <>
      <ProblemSection />
      <ArchitectureSection />
      <MetricsSection />
      <FeaturesSection />
      <CodeSection />
      <CtaSection />
    </>
  );
}
import {
  GitBranch, LayoutDashboard, Radio, Database, Eye, ScrollText, Settings, Gauge,
  ChevronLeft, Zap, Workflow, Search
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';

interface NavItem {
  label: string;
  path: string;
  icon: React.ElementType;
  color?: string;
}

const navItems: NavItem[] = [
  { label: 'Pipeline', path: '/', icon: GitBranch, color: 'text-ws-source' },
  { label: 'Builder', path: '/builder', icon: Workflow, color: 'text-ws-wal' },
  { label: 'Query', path: '/query', icon: Search, color: 'text-ws-info' },
  { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard, color: 'text-ws-hotpath' },
  { label: 'Sources', path: '/sources', icon: Radio, color: 'text-ws-source' },
  { label: 'Sinks', path: '/sinks', icon: Database, color: 'text-ws-sink' },
  { label: 'Views', path: '/views', icon: Eye, color: 'text-ws-reactive' },
  { label: 'Logs', path: '/logs', icon: ScrollText },
  { label: 'Operations', path: '/operations', icon: Settings },
  { label: 'Benchmarks', path: '/benchmarks', icon: Gauge, color: 'text-ws-shard' },
];

interface AppSidebarProps {
  open: boolean;
  onToggle: () => void;
  currentPath: string;
}

export function AppSidebar({ open, onToggle, currentPath }: AppSidebarProps) {
  return (
    <aside
      className={cn(
        'flex flex-col h-full bg-sidebar border-r border-sidebar-border transition-all duration-300 ease-out shrink-0 relative overflow-hidden',
        open ? 'w-[220px]' : 'w-[60px]'
      )}
    >
      {/* Layered ambient glows */}
      <div className="absolute -top-20 -left-20 w-40 h-40 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 -right-10 w-32 h-32 bg-ws-wal/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 -left-8 w-24 h-24 bg-ws-sink/3 rounded-full blur-2xl pointer-events-none" />

      {/* Logo */}
      <div className="flex items-center gap-3 px-4 h-16 shrink-0">
        <div className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-ws-wal shadow-lg shadow-primary/25 shrink-0 group/logo">
          <Zap className="h-4 w-4 text-primary-foreground transition-transform duration-300 group-hover/logo:scale-110 group-hover/logo:rotate-12" />
          {/* Animated ring */}
          <div className="absolute inset-0 rounded-xl border border-primary/20 animate-breathe" />
        </div>
        {open && (
          <div className="flex flex-col min-w-0">
            <span className="text-sm font-bold text-sidebar-accent-foreground tracking-tight whitespace-nowrap font-display">
              WriteStream
            </span>
            <span className="text-[9px] text-sidebar-foreground/50 font-medium tracking-[0.15em] uppercase">Engine</span>
          </div>
        )}
      </div>

      {/* Separator */}
      <div className="mx-3 h-px bg-gradient-to-r from-transparent via-sidebar-border to-transparent" />

      {/* Nav */}
      <nav className="flex-1 py-4 px-2.5 space-y-0.5 overflow-y-auto">
        {navItems.map(item => {
          const active = currentPath === item.path || (item.path !== '/' && currentPath.startsWith(item.path));
          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                'group flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] transition-all duration-200 relative',
                active
                  ? 'bg-sidebar-accent text-sidebar-accent-foreground font-semibold'
                  : 'text-sidebar-foreground hover:text-sidebar-accent-foreground hover:bg-sidebar-accent/40'
              )}
            >
              {active && (
                <>
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full bg-gradient-to-b from-primary to-ws-wal" />
                  {/* Active glow */}
                  <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-primary/5 to-transparent pointer-events-none" />
                </>
              )}
              <item.icon className={cn(
                'h-[18px] w-[18px] shrink-0 transition-all duration-300',
                active ? (item.color || 'text-primary') : 'text-sidebar-foreground group-hover:text-sidebar-accent-foreground',
                !active && 'group-hover:scale-110 group-hover:translate-x-0.5'
              )} />
              {open && <span className="whitespace-nowrap transition-all duration-200">{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="shrink-0">
        <div className="mx-3 h-px bg-gradient-to-r from-transparent via-sidebar-border to-transparent" />
        {open && (
          <div className="px-3 py-3">
            <div className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-sidebar-accent/30 border border-sidebar-border/50">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-ws-success opacity-60" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-ws-success" />
              </span>
              <span className="text-[10px] text-sidebar-foreground font-mono tracking-wide">v0.4.2-beta</span>
            </div>
          </div>
        )}
        <button
          onClick={onToggle}
          className="flex items-center justify-center w-full h-11 text-sidebar-foreground hover:text-sidebar-accent-foreground transition-all duration-200 hover:bg-sidebar-accent/30 btn-magnetic"
        >
          <ChevronLeft className={cn('h-4 w-4 transition-transform duration-300', !open && 'rotate-180')} />
        </button>
      </div>
    </aside>
  );
}

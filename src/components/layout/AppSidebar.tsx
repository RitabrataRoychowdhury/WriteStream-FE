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
        'flex flex-col h-full bg-sidebar border-r border-sidebar-border transition-all duration-300 shrink-0 relative',
        open ? 'w-56' : 'w-16'
      )}
    >
      {/* Subtle gradient accent on left edge */}
      <div className="absolute inset-y-0 left-0 w-[2px] bg-gradient-to-b from-primary via-ws-wal to-ws-sink opacity-60" />

      {/* Logo */}
      <div className="flex items-center gap-3 px-4 h-14 border-b border-sidebar-border">
        <div className="relative flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-ws-wal shadow-lg shadow-primary/20">
          <Zap className="h-4 w-4 text-primary-foreground" />
        </div>
        {open && (
          <div className="flex flex-col">
            <span className="text-sm font-bold text-sidebar-accent-foreground tracking-tight whitespace-nowrap">
              WriteStream
            </span>
            <span className="text-[9px] text-sidebar-foreground/60 font-medium tracking-widest uppercase">Engine</span>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 py-3 px-2 space-y-0.5 overflow-y-auto">
        {navItems.map(item => {
          const active = currentPath === item.path || (item.path !== '/' && currentPath.startsWith(item.path));
          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                'group flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all duration-200 relative',
                active
                  ? 'bg-sidebar-accent text-sidebar-accent-foreground font-medium shadow-sm'
                  : 'text-sidebar-foreground hover:text-sidebar-accent-foreground hover:bg-sidebar-accent/50'
              )}
            >
              {active && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full bg-primary" />
              )}
              <item.icon className={cn(
                'h-4 w-4 shrink-0 transition-colors',
                active ? (item.color || 'text-primary') : 'text-sidebar-foreground group-hover:text-sidebar-accent-foreground'
              )} />
              {open && <span className="whitespace-nowrap">{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Version / Collapse */}
      <div className="border-t border-sidebar-border">
        {open && (
          <div className="px-4 py-2">
            <div className="flex items-center gap-2 px-2 py-1.5 rounded-md bg-sidebar-accent/30">
              <div className="h-1.5 w-1.5 rounded-full bg-ws-success animate-pulse-glow" />
              <span className="text-[10px] text-sidebar-foreground font-mono">v0.4.2-beta</span>
            </div>
          </div>
        )}
        <button
          onClick={onToggle}
          className="flex items-center justify-center w-full h-10 text-sidebar-foreground hover:text-sidebar-accent-foreground transition-colors"
        >
          <ChevronLeft className={cn('h-4 w-4 transition-transform duration-300', !open && 'rotate-180')} />
        </button>
      </div>
    </aside>
  );
}

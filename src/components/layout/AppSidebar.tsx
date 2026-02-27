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
}

const navItems: NavItem[] = [
  { label: 'Pipeline', path: '/', icon: GitBranch },
  { label: 'Builder', path: '/builder', icon: Workflow },
  { label: 'Query', path: '/query', icon: Search },
  { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
  { label: 'Sources', path: '/sources', icon: Radio },
  { label: 'Sinks', path: '/sinks', icon: Database },
  { label: 'Views', path: '/views', icon: Eye },
  { label: 'Logs', path: '/logs', icon: ScrollText },
  { label: 'Operations', path: '/operations', icon: Settings },
  { label: 'Benchmarks', path: '/benchmarks', icon: Gauge },
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
        'flex flex-col h-full border-r border-border/50 bg-card/50 backdrop-blur-sm transition-all duration-300 shrink-0',
        open ? 'w-56' : 'w-16'
      )}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 h-14 border-b border-border/50">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
          <Zap className="h-4 w-4 text-primary" />
        </div>
        {open && (
          <span className="text-sm font-semibold text-foreground tracking-tight whitespace-nowrap">
            WriteStream
          </span>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 py-3 px-2 space-y-1">
        {navItems.map(item => {
          const active = currentPath === item.path || (item.path !== '/' && currentPath.startsWith(item.path));
          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-200',
                active
                  ? 'bg-primary/10 text-primary font-medium'
                  : 'text-muted-foreground hover:text-foreground hover:bg-secondary/50'
              )}
            >
              <item.icon className="h-4 w-4 shrink-0" />
              {open && <span className="whitespace-nowrap">{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Collapse */}
      <button
        onClick={onToggle}
        className="flex items-center justify-center h-10 border-t border-border/50 text-muted-foreground hover:text-foreground transition-colors"
      >
        <ChevronLeft className={cn('h-4 w-4 transition-transform duration-300', !open && 'rotate-180')} />
      </button>
    </aside>
  );
}

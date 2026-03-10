import { Menu, Sun, Moon, Bell, Command } from 'lucide-react';
import { useLocation } from 'react-router-dom';

const routeNames: Record<string, string> = {
  '/': 'Pipeline',
  '/builder': 'Builder',
  '/query': 'Query',
  '/dashboard': 'Dashboard',
  '/sources': 'Sources',
  '/sinks': 'Sinks',
  '/views': 'Reactive Views',
  '/logs': 'Logs',
  '/operations': 'Operations',
  '/benchmarks': 'Benchmarks',
};

interface TopBarProps {
  onToggleSidebar: () => void;
  sidebarOpen: boolean;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
}

export function TopBar({ onToggleSidebar, theme, onToggleTheme }: TopBarProps) {
  const location = useLocation();
  const routeName = routeNames[location.pathname] || 'WriteStream';

  return (
    <header className="flex items-center justify-between h-14 px-5 md:px-6 border-b border-border/30 shrink-0 relative z-10"
      style={{ background: 'hsl(var(--background) / 0.7)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)' }}>
      {/* Bottom highlight */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/8 to-transparent" />

      <div className="flex items-center gap-4">
        <button
          onClick={onToggleSidebar}
          className="md:hidden p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-secondary/60 transition-all duration-200 btn-magnetic"
        >
          <Menu className="h-4 w-4" />
        </button>
        <div className="flex items-center gap-2.5">
          <span className="text-muted-foreground/50 text-sm font-medium">WriteStream</span>
          <span className="text-border text-sm">/</span>
          <span className="text-foreground font-semibold text-sm">{routeName}</span>
        </div>
      </div>

      <div className="flex items-center gap-1.5">
        {/* Command palette hint */}
        <div className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border/30 text-[11px] text-muted-foreground mr-2 hover:border-border/60 transition-colors cursor-pointer">
          <Command className="h-3 w-3" />
          <span>K</span>
        </div>

        <button
          className="relative p-2.5 rounded-xl text-muted-foreground hover:text-foreground hover:bg-secondary/60 transition-all duration-200 btn-magnetic"
          title="Notifications"
        >
          <Bell className="h-4 w-4" />
          <span className="absolute top-2 right-2 h-1.5 w-1.5 rounded-full bg-ws-error ring-2 ring-background" />
        </button>
        <button
          onClick={onToggleTheme}
          className="p-2.5 rounded-xl text-muted-foreground hover:text-foreground hover:bg-secondary/60 transition-all duration-200 btn-magnetic"
          title={theme === 'dark' ? 'Light mode' : 'Dark mode'}
        >
          {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </button>
        <div className="h-6 w-px bg-border/30 mx-1" />
        <div className="flex items-center gap-2 px-3.5 py-2 rounded-full border border-ws-success/15" style={{ background: 'hsl(var(--ws-success) / 0.06)' }}>
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-ws-success opacity-60" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-ws-success" />
          </span>
          <span className="text-[10px] font-semibold text-ws-success tracking-widest uppercase">Live</span>
        </div>
      </div>
    </header>
  );
}

import { Menu, Activity, Sun, Moon, Bell } from 'lucide-react';
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
    <header className="flex items-center justify-between h-12 px-4 md:px-6 border-b border-border/50 bg-card/60 backdrop-blur-xl shrink-0">
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="md:hidden p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors"
        >
          <Menu className="h-4 w-4" />
        </button>
        <div className="flex items-center gap-2 text-xs">
          <span className="text-muted-foreground/70 font-medium">WriteStream</span>
          <span className="text-border">/</span>
          <span className="text-foreground font-semibold">{routeName}</span>
        </div>
      </div>

      <div className="flex items-center gap-1.5">
        <button
          className="relative p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors"
          title="Notifications"
        >
          <Bell className="h-4 w-4" />
          <span className="absolute top-1.5 right-1.5 h-1.5 w-1.5 rounded-full bg-ws-error" />
        </button>
        <button
          onClick={onToggleTheme}
          className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors"
          title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </button>
        <div className="h-5 w-px bg-border/50 mx-1" />
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-ws-success/10 border border-ws-success/20">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-ws-success opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-ws-success" />
          </span>
          <span className="text-[10px] font-semibold text-ws-success tracking-wide uppercase">Live</span>
        </div>
      </div>
    </header>
  );
}

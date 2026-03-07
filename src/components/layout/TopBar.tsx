import { Menu, Sun, Moon, Bell, Sparkles } from 'lucide-react';
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
    <header className="flex items-center justify-between h-14 px-5 md:px-6 border-b border-border/40 bg-background/80 backdrop-blur-xl shrink-0 relative z-10">
      {/* Subtle bottom highlight */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/10 to-transparent" />

      <div className="flex items-center gap-4">
        <button
          onClick={onToggleSidebar}
          className="md:hidden p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-secondary/60 transition-all duration-200"
        >
          <Menu className="h-4 w-4" />
        </button>
        <div className="flex items-center gap-2.5">
          <span className="text-muted-foreground/60 text-sm font-medium">WriteStream</span>
          <span className="text-border/60 text-sm">/</span>
          <span className="text-foreground font-semibold text-sm">{routeName}</span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          className="relative p-2.5 rounded-xl text-muted-foreground hover:text-foreground hover:bg-secondary/60 transition-all duration-200"
          title="Notifications"
        >
          <Bell className="h-4 w-4" />
          <span className="absolute top-2 right-2 h-1.5 w-1.5 rounded-full bg-ws-error ring-2 ring-background" />
        </button>
        <button
          onClick={onToggleTheme}
          className="p-2.5 rounded-xl text-muted-foreground hover:text-foreground hover:bg-secondary/60 transition-all duration-200"
          title={theme === 'dark' ? 'Light mode' : 'Dark mode'}
        >
          {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </button>
        <div className="h-6 w-px bg-border/40 mx-1" />
        <div className="flex items-center gap-2 px-3.5 py-2 rounded-full bg-ws-success/8 border border-ws-success/15">
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

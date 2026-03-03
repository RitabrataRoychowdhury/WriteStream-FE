import { Menu, Activity, Sun, Moon } from 'lucide-react';
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
    <header className="flex items-center justify-between h-12 px-4 md:px-6 border-b border-border/50 bg-card/30 backdrop-blur-sm shrink-0">
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="md:hidden p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors"
        >
          <Menu className="h-4 w-4" />
        </button>
        <div className="flex items-center gap-2 text-xs">
          <span className="text-muted-foreground">WriteStream</span>
          <span className="text-muted-foreground/50">/</span>
          <span className="text-foreground font-medium">{routeName}</span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={onToggleTheme}
          className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors"
          title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </button>
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-ws-success/10 border border-ws-success/20">
          <Activity className="h-3 w-3 text-ws-success" />
          <span className="text-[10px] font-medium text-ws-success">Healthy</span>
        </div>
      </div>
    </header>
  );
}

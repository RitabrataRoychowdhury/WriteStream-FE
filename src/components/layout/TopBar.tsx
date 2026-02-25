import { Menu, Activity } from 'lucide-react';
import { useLocation } from 'react-router-dom';

const routeNames: Record<string, string> = {
  '/': 'Pipeline',
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
}

export function TopBar({ onToggleSidebar }: TopBarProps) {
  const location = useLocation();
  const routeName = routeNames[location.pathname] || 'WriteStream';

  return (
    <header className="flex items-center justify-between h-14 px-4 md:px-6 border-b border-border/50 bg-card/30 backdrop-blur-sm shrink-0">
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="md:hidden p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors"
        >
          <Menu className="h-5 w-5" />
        </button>
        <div className="flex items-center gap-2 text-sm">
          <span className="text-muted-foreground">WriteStream</span>
          <span className="text-muted-foreground/50">/</span>
          <span className="text-foreground font-medium">{routeName}</span>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* System Health Indicator */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-ws-success/10 border border-ws-success/20">
          <Activity className="h-3.5 w-3.5 text-ws-success" />
          <span className="text-xs font-medium text-ws-success">Healthy</span>
        </div>
      </div>
    </header>
  );
}

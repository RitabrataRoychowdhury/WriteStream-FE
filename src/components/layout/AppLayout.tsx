import { useEffect, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { AppSidebar } from './AppSidebar';
import { TopBar } from './TopBar';
import { CommandPalette } from '@/components/shared/CommandPalette';
import { useTheme } from '@/hooks/useTheme';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';

export function AppLayout() {
  const isMobile = useIsMobile();
  // On mobile we want the sidebar closed by default; on desktop, open.
  const [sidebarOpen, setSidebarOpen] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth >= 768 : true
  );
  const location = useLocation();
  const { theme, toggleTheme } = useTheme();

  // Auto-close the drawer after navigation on mobile so it never eats the viewport
  useEffect(() => {
    if (isMobile) setSidebarOpen(false);
  }, [location.pathname, isMobile]);

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background">
      {/* Sidebar:
          - desktop (md+): inline, takes width in flex layout
          - mobile: fixed slide-over drawer with backdrop, never steals layout width */}
      <div
        className={cn(
          'h-full z-40',
          // Desktop: take part of the row
          'md:relative md:translate-x-0',
          // Mobile: fixed overlay
          'fixed inset-y-0 left-0 transition-transform duration-300 ease-out',
          isMobile && !sidebarOpen ? '-translate-x-full' : 'translate-x-0'
        )}
      >
        <AppSidebar
          open={sidebarOpen}
          onToggle={() => setSidebarOpen(o => !o)}
          currentPath={location.pathname}
        />
      </div>

      {/* Backdrop — only on mobile when drawer is open */}
      {isMobile && sidebarOpen && (
        <button
          aria-label="Close menu"
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 z-30 bg-background/70 backdrop-blur-sm md:hidden animate-fade-in"
        />
      )}

      <div className="flex flex-1 flex-col min-w-0 relative">
        {/* Layered ambient background */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-primary/[0.015] rounded-full blur-[100px]" />
          <div className="absolute bottom-0 left-1/4 w-[500px] h-[500px] bg-ws-wal/[0.015] rounded-full blur-[100px]" />
          <div className="absolute top-1/2 right-1/3 w-[300px] h-[300px] bg-ws-sink/[0.01] rounded-full blur-[80px]" />
          {/* Noise texture via CSS */}
          <div className="absolute inset-0 opacity-[0.015]" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.5'/%3E%3C/svg%3E")`,
          }} />
        </div>

        <TopBar
          onToggleSidebar={() => setSidebarOpen(o => !o)}
          sidebarOpen={sidebarOpen}
          theme={theme}
          onToggleTheme={toggleTheme}
        />
        <main className="flex-1 overflow-auto p-3 md:p-8 relative z-0">
          <Outlet />
        </main>
        <CommandPalette theme={theme} onToggleTheme={toggleTheme} />
      </div>
    </div>
  );
}

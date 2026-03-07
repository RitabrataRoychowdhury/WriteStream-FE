import { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { AppSidebar } from './AppSidebar';
import { TopBar } from './TopBar';
import { useTheme } from '@/hooks/useTheme';

export function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const location = useLocation();
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background">
      <AppSidebar open={sidebarOpen} onToggle={() => setSidebarOpen(o => !o)} currentPath={location.pathname} />
      <div className="flex flex-1 flex-col min-w-0 relative">
        {/* Ambient background gradients */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/[0.02] rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 w-[400px] h-[400px] bg-ws-wal/[0.02] rounded-full blur-3xl pointer-events-none" />

        <TopBar
          onToggleSidebar={() => setSidebarOpen(o => !o)}
          sidebarOpen={sidebarOpen}
          theme={theme}
          onToggleTheme={toggleTheme}
        />
        <main className="flex-1 overflow-auto p-5 md:p-8 relative z-0">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

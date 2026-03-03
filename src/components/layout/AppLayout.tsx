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
      <div className="flex flex-1 flex-col min-w-0">
        <TopBar
          onToggleSidebar={() => setSidebarOpen(o => !o)}
          sidebarOpen={sidebarOpen}
          theme={theme}
          onToggleTheme={toggleTheme}
        />
        <main className="flex-1 overflow-auto p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

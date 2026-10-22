import { AppSidebar } from '@/components/app-sidebar';
import { SiteHeader } from '@/components/site-header';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { useIsFetching } from '@tanstack/react-query';
import { type CSSProperties, Suspense, useEffect, useState } from 'react';
import { Outlet } from 'react-router-dom';

function ProgressBar() {
  return (
    <div className="fixed top-0 left-0 right-0 z-50 h-0.5 bg-white/5">
      <div className="h-full bg-white/30 animate-[navprogress_1.2s_ease-in-out_infinite]" />
    </div>
  );
}

/**
 * Thin top bar while data is loading. Routes have no loaders, so
 * `useNavigation()` is never "loading"; track in-flight queries instead, with
 * a short delay so quick refetches do not flash the bar.
 */
function NavProgress() {
  const fetching = useIsFetching() > 0;
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!fetching) return;
    const timer = setTimeout(() => setVisible(true), 250);
    return () => {
      clearTimeout(timer);
      setVisible(false);
    };
  }, [fetching]);

  return visible ? <ProgressBar /> : null;
}

export function DashboardLayout() {
  return (
    <SidebarProvider
      className="h-svh"
      style={
        {
          '--sidebar-width': '18rem',
          '--header-height': '3rem',
        } as CSSProperties
      }
    >
      <NavProgress />
      <AppSidebar variant="inset" />
      <SidebarInset className="overflow-hidden bg-background">
        <SiteHeader />
        <div className="flex flex-1 flex-col overflow-y-auto">
          <Suspense fallback={<ProgressBar />}>
            <Outlet />
          </Suspense>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}

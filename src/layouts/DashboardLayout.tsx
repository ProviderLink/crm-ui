import { AppSidebar } from '@/components/app-sidebar'
import { SiteHeader } from '@/components/site-header'
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'
import { type CSSProperties, Suspense } from 'react'
import { Outlet, useNavigation } from 'react-router-dom'

function NavProgress() {
  const { state } = useNavigation()
  if (state === 'idle') return null
  return (
    <div className="fixed top-0 left-0 right-0 z-50 h-0.5 bg-primary/20">
      <div className="h-full bg-primary animate-[navprogress_1.2s_ease-in-out_infinite]" />
    </div>
  )
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
          <Suspense fallback={null}>
            <Outlet />
          </Suspense>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}

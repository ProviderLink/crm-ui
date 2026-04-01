import { AppSidebar } from '@/components/app-sidebar'
import { SiteHeader } from '@/components/site-header'
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'
import { type CSSProperties, Suspense } from 'react'
import { Outlet } from 'react-router-dom'

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

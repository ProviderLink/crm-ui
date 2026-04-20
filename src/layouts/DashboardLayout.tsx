import { AppSidebar } from '@/components/app-sidebar'
import { SiteHeader } from '@/components/site-header'
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'
import { Skeleton } from '@/components/ui/skeleton'
import { type CSSProperties, Suspense } from 'react'
import { Outlet } from 'react-router-dom'

function ContentLoader() {
  return (
    <div className="flex flex-1 flex-col gap-4 p-6">
      <Skeleton className="h-8 w-48 rounded-xl" />
      <Skeleton className="h-40 w-full rounded-2xl" />
      <Skeleton className="h-40 w-full rounded-2xl" />
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
      <AppSidebar variant="inset" />
      <SidebarInset className="overflow-hidden bg-background">
        <SiteHeader />
        <div className="flex flex-1 flex-col overflow-y-auto">
          <Suspense fallback={<ContentLoader />}>
            <Outlet />
          </Suspense>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}

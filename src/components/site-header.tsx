import { Separator } from '@/components/ui/separator'
import { SidebarTrigger } from '@/components/ui/sidebar'

export function SiteHeader() {
  const dateStr = new Date().toLocaleDateString('en-US', {
    weekday: 'short', month: 'short', day: 'numeric', year: 'numeric',
  })

  return (
    <header className="flex h-12 shrink-0 items-center gap-2 border-b border-white dark:border-slate-700/50 bg-[#F5F7FB] dark:bg-slate-900 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
      <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
        <SidebarTrigger className="-ml-1" />
        <Separator
          orientation="vertical"
          className="mx-2 data-[orientation=vertical]:h-4 bg-white dark:bg-slate-700"
        />
        <div className="flex-1" />
        <span className="text-xs text-[#94A3B8]">{dateStr}</span>
      </div>
    </header>
  )
}

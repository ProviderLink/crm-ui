import * as React from "react"
import {
  BookOpenIcon,
  BotIcon,
  ChartBarIcon,
  CommandIcon,
  FrameIcon,
  HelpCircleIcon,
  SearchIcon,
  SettingsIcon,
  SquareTerminalIcon,
} from "lucide-react"

import { NavDocuments } from "@/components/nav-documents"
import { NavMain } from "@/components/nav-main"
import { NavSecondary } from "@/components/nav-secondary"
import { NavUser } from "@/components/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

const data = {
  user: {
    name: "shadcn",
    email: "m@example.com",
    avatar: "/avatars/shadcn.jpg",
  },
  navMain: [
    { title: "Dashboard",  url: "#", icon: SquareTerminalIcon },
    { title: "Analytics",  url: "#", icon: ChartBarIcon },
    { title: "Projects",   url: "#", icon: FrameIcon },
    { title: "Team",       url: "#", icon: BotIcon },
  ],
  navSecondary: [
    { title: "Settings",  url: "#", icon: SettingsIcon },
    { title: "Get Help",  url: "#", icon: HelpCircleIcon },
    { title: "Search",    url: "#", icon: SearchIcon },
  ],
  documents: [
    { name: "Data Library",    url: "#", icon: BookOpenIcon },
    { name: "Report Summary",  url: "#", icon: ChartBarIcon },
    { name: "Developer Guide", url: "#", icon: SquareTerminalIcon },
  ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:!p-1.5"
            >
              <a href="#">
                <CommandIcon className="!size-5" />
                <span className="text-base font-semibold">Arista CRM</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <NavMain items={data.navMain} />
        <NavDocuments items={data.documents} />
        <NavSecondary items={data.navSecondary} className="mt-auto" />
      </SidebarContent>

      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>
    </Sidebar>
  )
}

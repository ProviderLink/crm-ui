import { LogOutIcon, MoreVerticalIcon } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar'
import { useAppDispatch } from '@/hooks/store'
import { logout } from '@/services/auth.service'
import { clearAuth } from '@/store/slices/authSlice'
import type { UserRole } from '@/types/auth'

const roleConfig: Record<UserRole, { label: string; className: string }> = {
  admin: {
    label: 'Admin',
    className:
      'bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary',
  },
  account_manager: {
    label: 'Account Manager',
    className: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
  },
  va: {
    label: 'Virtual Assistant',
    className: 'bg-purple-500/10 text-purple-600 dark:text-purple-400',
  },
  client: {
    label: 'Client',
    className: 'bg-green-500/10 text-green-600 dark:text-green-400',
  },
}

export function NavUser({
  user,
}: {
  user: {
    name: string
    email: string
    avatar: string
    role: UserRole
  }
}) {
  const { isMobile } = useSidebar()
  const dispatch = useAppDispatch()
  const navigate = useNavigate()

  const initials = user.name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  const role = roleConfig[user.role]

  async function handleLogout() {
    await logout()
    dispatch(clearAuth())
    navigate('/login')
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <Avatar className="h-8 w-8 rounded-lg grayscale">
                <AvatarImage src={user.avatar} alt={user.name} />
                <AvatarFallback className="rounded-lg">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">{user.name}</span>
                <span className="truncate text-xs text-muted-foreground">
                  {user.email}
                </span>
              </div>
              <MoreVerticalIcon className="ml-auto size-4" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-[var(--radix-dropdown-menu-trigger-width)] min-w-56 rounded-lg"
            side={isMobile ? 'bottom' : 'right'}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                <Avatar className="h-8 w-8 rounded-lg">
                  <AvatarImage src={user.avatar} alt={user.name} />
                  <AvatarFallback className="rounded-lg bg-primary/10 text-primary font-semibold">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">{user.name}</span>
                  <span className="truncate text-xs text-muted-foreground">
                    {user.email}
                  </span>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-border" />
            <div className="px-3 py-2.5 flex items-center justify-between">
              <span className="text-xs text-muted-foreground font-medium">
                Role
              </span>
              <span
                className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold tracking-wide ${role.className}`}
              >
                {role.label}
              </span>
            </div>
            <DropdownMenuSeparator className="bg-border" />
            <DropdownMenuItem
              onClick={handleLogout}
              className="text-destructive focus:text-destructive"
            >
              <LogOutIcon />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}

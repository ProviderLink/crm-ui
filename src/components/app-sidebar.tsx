import {
  BarChart3Icon,
  BellIcon,
  ClipboardListIcon,
  ClockIcon,
  FileTextIcon,
  HistoryIcon,
  LayoutDashboardIcon,
  LinkIcon,
  ListChecksIcon,
  UserCogIcon,
  UsersIcon,
  type LucideIcon,
} from 'lucide-react';
import * as React from 'react';

import { AppLogo } from '@/components/app-logo';
import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
} from '@/components/ui/sidebar';
import { useAppSelector } from '@/hooks/store';
import type { UserRole } from '@/types/auth';

type NavItem = {
  title: string;
  url: string;
  icon?: LucideIcon;
};

type QuickAction = {
  label: string;
  icon?: LucideIcon;
  to: string;
};

type RoleConfig = {
  navMain: NavItem[];
  quickAction?: QuickAction;
};

const roleConfigs: Record<UserRole, RoleConfig> = {
  va: {
    quickAction: { label: 'Log Work', icon: ClockIcon, to: '/va/work/new' },
    navMain: [
      { title: 'Dashboard', url: '/va/dashboard', icon: LayoutDashboardIcon },
      { title: 'Log Work', url: '/va/work/new', icon: ClockIcon },
      { title: 'Work History', url: '/va/work/history', icon: HistoryIcon },
      { title: 'Submit EOD', url: '/va/eod/new', icon: ClipboardListIcon },
      { title: 'EOD History', url: '/va/eod/history', icon: HistoryIcon },
    ],
  },
  admin: {
    navMain: [
      {
        title: 'Dashboard',
        url: '/admin/dashboard',
        icon: LayoutDashboardIcon,
      },
      { title: 'Assignments', url: '/admin/assignments', icon: LinkIcon },
      {
        title: 'Work Entries',
        url: '/admin/work-entries',
        icon: ListChecksIcon,
      },
      { title: 'EOD Reports', url: '/admin/eod-reports', icon: FileTextIcon },
      { title: 'Accounts', url: '/admin/accounts', icon: UsersIcon },
      {
        title: 'Account Managers',
        url: '/admin/account-managers',
        icon: UserCogIcon,
      },
      { title: 'Reminders', url: '/admin/reminders', icon: BellIcon },
      { title: 'Scorecards', url: '/admin/scorecards', icon: BarChart3Icon },
    ],
  },
  account_manager: {
    navMain: [
      {
        title: 'Dashboard',
        url: '/am/dashboard',
        icon: LayoutDashboardIcon,
      },
      { title: 'Assignments', url: '/am/assignments', icon: LinkIcon },
      {
        title: 'Work Entries',
        url: '/am/work-entries',
        icon: ListChecksIcon,
      },
      { title: 'EOD Reports', url: '/am/eod-reports', icon: FileTextIcon },
      { title: 'Accounts', url: '/am/accounts', icon: UsersIcon },
      { title: 'Reminders', url: '/am/reminders', icon: BellIcon },
      { title: 'Scorecards', url: '/am/scorecards', icon: BarChart3Icon },
    ],
  },
  client: {
    navMain: [
      {
        title: 'Dashboard',
        url: '/client/dashboard',
        icon: LayoutDashboardIcon,
      },
      { title: 'Work Activity', url: '/client/work', icon: ClipboardListIcon },
    ],
  },
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const user = useAppSelector(s => s.auth.user);
  const role: UserRole = user?.role ?? 'va';
  const config = user ? roleConfigs[role] : { navMain: [] };

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader className="px-4 pt-5 pb-4">
        {/* Expanded state */}
        <div className="group-data-[collapsible=icon]:hidden">
          <AppLogo size="md" />
        </div>

        {/* Collapsed icon-only state */}
        <div className="hidden group-data-[collapsible=icon]:flex justify-center py-1">
          <AppLogo size="sm" iconOnly />
        </div>
      </SidebarHeader>

      <SidebarContent>
        <NavMain items={config.navMain} quickAction={config.quickAction} />
      </SidebarContent>

      <SidebarFooter className="mx-2 mb-2 rounded-xl bg-sidebar-accent/40 px-3 py-2 group-data-[collapsible=icon]:mx-1 group-data-[collapsible=icon]:px-0 group-data-[collapsible=icon]:py-1 group-data-[collapsible=icon]:[&_ul]:items-center">
        <NavUser
          user={{
            name: user?.name ?? '—',
            email: user?.email ?? '',
            avatar: '',
            role: role,
          }}
        />
      </SidebarFooter>
    </Sidebar>
  );
}

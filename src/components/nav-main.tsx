'use client';

import { PlusCircleIcon, type LucideIcon } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar';
import { cn } from '@/lib/utils';

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

export function NavMain({
  items,
  quickAction,
}: {
  items: NavItem[];
  quickAction?: QuickAction;
}) {
  const { pathname } = useLocation();

  return (
    <SidebarGroup className="px-3 py-2">
      {quickAction && (
        <SidebarMenu className="mb-3">
          <SidebarMenuItem>
            <SidebarMenuButton
              tooltip={quickAction.label}
              className="min-w-8 bg-primary text-text-inverse duration-150 ease-out hover:bg-white hover:text-text-inverse active:bg-white active:text-text-inverse"
              asChild
            >
              <Link to={quickAction.to}>
                {quickAction.icon ? <quickAction.icon /> : <PlusCircleIcon />}
                <span>{quickAction.label}</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      )}

      <SidebarGroupLabel className="mb-1 px-1 text-[10px] font-semibold uppercase tracking-widest text-sidebar-foreground/40 group-data-[collapsible=icon]:hidden">
        Menu
      </SidebarGroupLabel>

      <SidebarGroupContent>
        <SidebarMenu className="gap-0.5">
          {items.map(item => {
            const isActive =
              pathname === item.url || pathname.startsWith(item.url + '/');
            return (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton
                  tooltip={item.title}
                  isActive={isActive}
                  asChild
                  className={cn(
                    'rounded-md',
                    isActive
                      ? 'text-sidebar-foreground'
                      : 'text-sidebar-foreground/60'
                  )}
                >
                  <Link to={item.url}>
                    {item.icon && <item.icon className="shrink-0" />}
                    <span
                      className={cn(isActive ? 'font-medium' : 'font-normal')}
                    >
                      {item.title}
                    </span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}

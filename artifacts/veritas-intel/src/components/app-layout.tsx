'use client';

import { Link, useLocation } from 'wouter';
import {
  Users, LayoutDashboard, ShieldCheck, Terminal,
  Zap, Settings, X, Map, Bell, Building2, Eye
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';


import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarInset,
  SidebarFooter,
  SidebarTrigger,
  SidebarGroup,
  SidebarGroupLabel,
} from '@/components/ui/sidebar';
import { Badge } from '@/components/ui/badge';

function UnreadBadge() {
  const { data } = useQuery<{ count: number }>({
    queryKey: ['watchlist-unread'],
    queryFn: () => fetch(`/api/watchlist/unread-count`).then(r => r.json()),
    refetchInterval: 15000,
  });
  if (!data?.count) return null;
  return (
    <Badge className="ml-auto h-4 min-w-4 rounded-none text-[9px] px-1 bg-red-500 text-white">
      {data.count > 9 ? '9+' : data.count}
    </Badge>
  );
}

export function AppLayout({ children }: { children: React.ReactNode }) {
  const [pathname] = useLocation();

  const navMain = [
    { href: '/', label: 'Command Center', icon: LayoutDashboard },
    { href: '/subjects', label: 'Registry', icon: Users },
    { href: '/research', label: 'Global Research', icon: Zap },
  ];

  const navIntel = [
    { href: '/map', label: 'Intel Map', icon: Map },
    { href: '/osint', label: 'OSINT Terminal', icon: Eye },
    { href: '/company', label: 'Company Lookup', icon: Building2 },
    { href: '/watchlist', label: 'Watchlist', icon: Bell, badge: <UnreadBadge /> },
    { href: '/integrations', label: 'Gateways', icon: ShieldCheck },
  ];

  const btnClass = 'h-12 rounded-none uppercase text-[10px] font-black tracking-widest hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black transition-none';

  return (
    <SidebarProvider>
      <Sidebar collapsible="offcanvas" className="border-r-2 border-primary">
        <SidebarHeader>
          <div className="flex items-center justify-between px-3 py-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-black text-white dark:bg-white dark:text-black">
                <Terminal className="size-6 shrink-0" />
              </div>
              <span className="font-black text-xl tracking-tighter truncate group-data-[collapsible=icon]:hidden uppercase">Veritas Intel</span>
            </div>
            <SidebarTrigger
              className="h-8 w-8 rounded-none border-2 border-primary bg-background text-foreground hover:bg-primary hover:text-primary-foreground transition-none flex items-center justify-center shrink-0 ml-2"
              aria-label="Close sidebar"
            >
              <X className="size-4" />
            </SidebarTrigger>
          </div>
        </SidebarHeader>

        <SidebarContent className="px-2">
          <SidebarGroup>
            <SidebarGroupLabel className="text-[9px] uppercase tracking-widest text-muted-foreground font-black px-2 py-1">Operations</SidebarGroupLabel>
            <SidebarMenu>
              {navMain.map(({ href, label, icon: Icon }) => (
                <SidebarMenuItem key={href}>
                  <SidebarMenuButton asChild tooltip={label} isActive={pathname === href || (href !== '/' && pathname.startsWith(href))} className={btnClass}>
                    <Link href={href}>
                      <Icon className="size-5" />
                      <span>{label}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroup>

          <SidebarGroup className="mt-2">
            <SidebarGroupLabel className="text-[9px] uppercase tracking-widest text-muted-foreground font-black px-2 py-1">Intelligence</SidebarGroupLabel>
            <SidebarMenu>
              {navIntel.map(({ href, label, icon: Icon, badge }) => (
                <SidebarMenuItem key={href}>
                  <SidebarMenuButton asChild tooltip={label} isActive={pathname === href} className={btnClass}>
                    <Link href={href}>
                      <Icon className="size-5" />
                      <span>{label}</span>
                      {badge}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroup>
        </SidebarContent>

        <SidebarFooter className="p-2 border-t-2 border-primary">
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton asChild tooltip="Settings" isActive={pathname === '/settings'} className={btnClass}>
                <Link href="/settings">
                  <Settings className="size-5" />
                  <span>Terminal Settings</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset className="flex flex-col bg-background">{children}</SidebarInset>
    </SidebarProvider>
  );
}

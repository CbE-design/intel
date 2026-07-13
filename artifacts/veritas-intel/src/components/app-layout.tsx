'use client';

import { Link, useLocation } from 'wouter';
import { Users, LayoutDashboard, ShieldCheck, Terminal, Zap, Settings, X } from 'lucide-react';

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
} from '@/components/ui/sidebar';

export function AppLayout({ children }: { children: React.ReactNode }) {
  const [pathname] = useLocation();

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
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton asChild tooltip="Dashboard" isActive={pathname === '/'} className="h-12 rounded-none uppercase text-[10px] font-black tracking-widest hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black transition-none">
                <Link href="/">
                  <LayoutDashboard className="size-5" />
                  <span>Command Center</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild tooltip="Subjects" isActive={pathname.startsWith('/subjects')} className="h-12 rounded-none uppercase text-[10px] font-black tracking-widest hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black transition-none">
                <Link href="/subjects">
                  <Users className="size-5" />
                  <span>Registry</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild tooltip="Global Research Terminal" isActive={pathname === '/research'} className="h-12 rounded-none uppercase text-[10px] font-black tracking-widest hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black transition-none">
                <Link href="/research">
                  <Zap className="size-5" />
                  <span>Global Research</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild tooltip="Integrations" isActive={pathname === '/integrations'} className="h-12 rounded-none uppercase text-[10px] font-black tracking-widest hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black transition-none">
                <Link href="/integrations">
                  <ShieldCheck className="size-5" />
                  <span>Gateways</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarContent>
        <SidebarFooter className="p-2 border-t-2 border-primary">
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton asChild tooltip="Settings" isActive={pathname === '/settings'} className="h-12 rounded-none uppercase text-[10px] font-black tracking-widest hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black transition-none">
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

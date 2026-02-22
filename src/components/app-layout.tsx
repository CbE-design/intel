'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Users, LayoutDashboard, Settings, ShieldCheck, Terminal, Globe } from 'lucide-react';

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
} from '@/components/ui/sidebar';

export function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <SidebarProvider>
      <Sidebar collapsible="icon" className="border-r-2 border-primary">
        <SidebarHeader>
          <div className="flex items-center gap-3 px-3 py-6">
            <div className="p-2 bg-black text-white dark:bg-white dark:text-black">
              <Terminal className="size-6 shrink-0" />
            </div>
            <span className="font-black text-xl tracking-tighter truncate group-data-[collapsible=icon]:hidden uppercase">Veritas Intel</span>
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
              <SidebarMenuButton asChild tooltip="Research Terminal" isActive={pathname === '/research'} className="h-12 rounded-none uppercase text-[10px] font-black tracking-widest hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black transition-none">
                <Link href="/research">
                  <Globe className="size-5" />
                  <span>Research Hub</span>
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

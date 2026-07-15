'use client';

import { useState, useRef, useEffect } from 'react';
import { Link, useLocation } from 'wouter';
import {
  Users, LayoutDashboard, ShieldCheck,
  Zap, Settings, Map, Bell, Building2, Eye, Bot,
  Shield, X, Menu
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';

function UnreadBadge({ count }: { count?: number }) {
  if (!count) return null;
  return (
    <span className="absolute right-2 top-1/2 -translate-y-1/2 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-bold text-white">
      {count > 9 ? '9+' : count}
    </span>
  );
}

const NAV_SECTIONS = [
  {
    label: 'Operations',
    items: [
      { href: '/', label: 'Command Center', icon: LayoutDashboard },
      { href: '/subjects', label: 'Registry', icon: Users },
      { href: '/research', label: 'Global Research', icon: Zap },
    ],
  },
  {
    label: 'Intelligence',
    items: [
      { href: '/analyst', label: 'VERIBOT AI', icon: Bot },
      { href: '/map', label: 'Intel Map', icon: Map },
      { href: '/osint', label: 'OSINT Terminal', icon: Eye },
      { href: '/company', label: 'Company Lookup', icon: Building2 },
      { href: '/watchlist', label: 'Watchlist', icon: Bell, badge: true },
      { href: '/integrations', label: 'Gateways', icon: ShieldCheck },
    ],
  },
];

interface NavItemProps {
  href: string;
  label: string;
  icon: React.ElementType;
  isActive: boolean;
  expanded: boolean;
  badgeCount?: number;
}

function NavItem({ href, label, icon: Icon, isActive, expanded, badgeCount }: NavItemProps) {
  return (
    <Link href={href}>
      <span
        className={`
          group relative flex items-center gap-3 rounded-lg px-2.5 py-2.5 transition-all duration-150 cursor-pointer select-none
          ${isActive
            ? 'bg-indigo-600/20 text-indigo-400'
            : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'
          }
        `}
      >
        {isActive && (
          <span className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-0.5 rounded-r bg-indigo-500" />
        )}
        <Icon
          className={`shrink-0 transition-colors duration-150 ${isActive ? 'text-indigo-400' : 'text-slate-500 group-hover:text-slate-300'}`}
          size={18}
        />
        <span
          className={`text-sm font-medium whitespace-nowrap transition-all duration-200 ${
            expanded ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-2 pointer-events-none absolute'
          }`}
        >
          {label}
        </span>
        {badgeCount ? (
          <span
            className={`ml-auto flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-bold text-white transition-opacity duration-200 ${expanded ? 'opacity-100' : 'opacity-0'}`}
          >
            {badgeCount > 9 ? '9+' : badgeCount}
          </span>
        ) : null}
        {!expanded && (
          <span className="pointer-events-none absolute left-full ml-3 z-50 whitespace-nowrap rounded-md bg-slate-800 px-2.5 py-1.5 text-xs font-medium text-slate-100 opacity-0 shadow-xl transition-opacity duration-150 group-hover:opacity-100 border border-white/10">
            {label}
            {badgeCount ? <span className="ml-1.5 rounded-full bg-red-500 px-1.5 py-0.5 text-[9px]">{badgeCount}</span> : null}
          </span>
        )}
      </span>
    </Link>
  );
}

export function AppLayout({ children }: { children: React.ReactNode }) {
  const [pathname] = useLocation();
  const [expanded, setExpanded] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const hoverTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { data: unreadData } = useQuery<{ count: number }>({
    queryKey: ['watchlist-unread'],
    queryFn: () => fetch('/api/watchlist/unread-count').then(r => r.json()),
    refetchInterval: 15000,
  });
  const unreadCount = unreadData?.count ?? 0;

  const handleMouseEnter = () => {
    if (hoverTimeout.current) clearTimeout(hoverTimeout.current);
    setExpanded(true);
  };
  const handleMouseLeave = () => {
    hoverTimeout.current = setTimeout(() => setExpanded(false), 120);
  };

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  const isActive = (href: string) =>
    href === '/' ? pathname === '/' : pathname === href || pathname.startsWith(href + '/');

  const SidebarContent = ({ mobile = false }: { mobile?: boolean }) => (
    <div className={`flex h-full flex-col ${mobile ? 'w-64' : ''}`}>
      {/* Logo */}
      <div className={`flex items-center gap-3 px-3 py-5 ${mobile ? 'border-b border-white/8' : ''}`}>
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-indigo-600 shadow-lg shadow-indigo-900/40">
          <Shield size={18} className="text-white" />
        </div>
        <div className={`overflow-hidden transition-all duration-200 ${mobile || expanded ? 'w-auto opacity-100' : 'w-0 opacity-0'}`}>
          <p className="whitespace-nowrap text-sm font-bold text-white tracking-wide">Veritas Intel</p>
          <p className="whitespace-nowrap text-[10px] text-indigo-400 font-medium tracking-widest uppercase">OSINT Platform</p>
        </div>
        {mobile && (
          <button
            onClick={() => setMobileOpen(false)}
            className="ml-auto rounded-md p-1.5 text-slate-400 hover:bg-white/8 hover:text-white transition-colors"
          >
            <X size={16} />
          </button>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-2 py-2 space-y-5">
        {NAV_SECTIONS.map((section) => (
          <div key={section.label}>
            <p className={`mb-1.5 px-3 text-[10px] font-semibold uppercase tracking-widest text-slate-600 transition-all duration-200 ${mobile || expanded ? 'opacity-100' : 'opacity-0 h-0 mb-0 overflow-hidden'}`}>
              {section.label}
            </p>
            <div className="space-y-0.5">
              {section.items.map((item) => (
                <NavItem
                  key={item.href}
                  href={item.href}
                  label={item.label}
                  icon={item.icon}
                  isActive={isActive(item.href)}
                  expanded={mobile || expanded}
                  badgeCount={item.badge ? unreadCount : 0}
                />
              ))}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="border-t border-white/5 px-2 py-3">
        <NavItem
          href="/settings"
          label="Settings"
          icon={Settings}
          isActive={isActive('/settings')}
          expanded={mobile || expanded}
        />
        <div className={`mt-3 px-3 overflow-hidden transition-all duration-200 ${mobile || expanded ? 'max-h-20 opacity-100' : 'max-h-0 opacity-0'}`}>
          <div className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[10px] text-slate-500 font-medium">Systems Operational</span>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Desktop sidebar — icon rail, expands on hover */}
      <aside
        className={`hidden md:flex flex-col fixed left-0 top-0 bottom-0 z-40 border-r border-white/5 bg-[hsl(237,28%,6%)] transition-all duration-300 ease-in-out overflow-hidden ${
          expanded ? 'w-60 shadow-2xl shadow-black/60' : 'w-16'
        }`}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <SidebarContent />
      </aside>

      {/* Mobile overlay sidebar */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="relative flex flex-col w-64 h-full border-r border-white/8 bg-[hsl(237,28%,6%)] shadow-2xl">
            <SidebarContent mobile />
          </aside>
        </div>
      )}

      {/* Main content — always offset by collapsed sidebar width (64px) */}
      <div className="flex flex-col flex-1 min-w-0 md:ml-16 overflow-hidden">
        {/* Mobile header bar with hamburger */}
        <div className="flex md:hidden items-center gap-3 border-b border-white/8 bg-[hsl(237,28%,6%)] px-4 py-3">
          <button
            onClick={() => setMobileOpen(true)}
            className="rounded-lg p-2 text-slate-400 hover:bg-white/8 hover:text-white transition-colors"
          >
            <Menu size={20} />
          </button>
          <div className="flex items-center gap-2">
            <Shield size={16} className="text-indigo-400" />
            <span className="text-sm font-bold text-white tracking-wide">Veritas Intel</span>
          </div>
        </div>
        {children}
      </div>
    </div>
  );
}

import type { ReactNode } from "react";
import { SidebarTrigger, useSidebar } from "@/components/ui/sidebar";

type PageHeaderProps = {
  title: string;
  children?: ReactNode;
};

function HamburgerIcon({ open }: { open: boolean }) {
  return (
    <span className="flex flex-col justify-center items-center gap-[5px] w-5 h-5" aria-hidden>
      <span
        className="block h-[2px] bg-current origin-center transition-all duration-200"
        style={{
          width: open ? '20px' : '20px',
          transform: open ? 'translateY(7px) rotate(45deg)' : 'none',
        }}
      />
      <span
        className="block h-[2px] bg-current transition-all duration-200"
        style={{
          width: open ? '0px' : '14px',
          opacity: open ? 0 : 1,
        }}
      />
      <span
        className="block h-[2px] bg-current origin-center transition-all duration-200"
        style={{
          width: open ? '20px' : '20px',
          transform: open ? 'translateY(-7px) rotate(-45deg)' : 'none',
        }}
      />
    </span>
  );
}

function SidebarToggleButton() {
  const { open } = useSidebar();
  return (
    <SidebarTrigger
      className="h-10 w-10 rounded-none border-2 border-primary bg-background text-foreground hover:bg-primary hover:text-primary-foreground transition-colors duration-150 flex items-center justify-center shrink-0"
      aria-label={open ? "Hide sidebar" : "Show sidebar"}
    >
      <HamburgerIcon open={open} />
    </SidebarTrigger>
  );
}

export function PageHeader({ title, children }: PageHeaderProps) {
  return (
    <header className="flex min-h-[70px] items-center gap-4 border-b-2 border-primary bg-background px-4 md:px-6">
      <SidebarToggleButton />
      <h1 className="flex-1 text-lg font-black uppercase tracking-tighter md:text-2xl truncate">
        {title}
      </h1>
      <div className="flex items-center gap-2 md:gap-4">
        {children}
      </div>
    </header>
  );
}

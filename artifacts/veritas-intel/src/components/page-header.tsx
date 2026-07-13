import type { ReactNode } from "react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { PanelLeftOpen, PanelLeftClose } from "lucide-react";
import { useSidebar } from "@/components/ui/sidebar";

type PageHeaderProps = {
  title: string;
  children?: ReactNode;
};

function SidebarToggleButton() {
  const { open } = useSidebar();
  return (
    <SidebarTrigger
      className="h-9 w-9 rounded-none border-2 border-primary bg-background text-foreground hover:bg-primary hover:text-primary-foreground transition-none flex items-center justify-center shrink-0"
      aria-label={open ? "Hide sidebar" : "Show sidebar"}
    >
      {open ? (
        <PanelLeftClose className="size-4" />
      ) : (
        <PanelLeftOpen className="size-4" />
      )}
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

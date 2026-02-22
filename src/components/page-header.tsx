import type { ReactNode } from "react";
import { SidebarTrigger } from "@/components/ui/sidebar";

type PageHeaderProps = {
  title: string;
  children?: ReactNode;
};

export function PageHeader({ title, children }: PageHeaderProps) {
  return (
    <header className="flex min-h-[70px] items-center gap-4 border-b bg-background px-4 md:px-8">
      <div className="flex items-center gap-2 md:hidden">
        <SidebarTrigger />
      </div>
      <h1 className="flex-1 text-lg font-black uppercase tracking-tighter md:text-2xl truncate">
        {title}
      </h1>
      <div className="flex items-center gap-2 md:gap-4">
        {children}
      </div>
    </header>
  );
}

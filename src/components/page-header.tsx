import type { ReactNode } from "react";

type PageHeaderProps = {
  title: string;
  children?: ReactNode;
};

export function PageHeader({ title, children }: PageHeaderProps) {
  return (
    <header className="flex min-h-[70px] items-center gap-6 border-b bg-background px-6 md:px-8">
      <h1 className="flex-1 text-xl font-black uppercase tracking-tighter md:text-2xl">{title}</h1>
      <div className="flex items-center gap-4">
        {children}
      </div>
    </header>
  );
}

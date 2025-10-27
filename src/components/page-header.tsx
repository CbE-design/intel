import type { ReactNode } from "react";

type PageHeaderProps = {
  title: string;
  children?: ReactNode;
};

export function PageHeader({ title, children }: PageHeaderProps) {
  return (
    <header className="flex min-h-14 items-center gap-4 border-b bg-card/40 px-4 md:px-6">
      <h1 className="flex-1 text-lg font-semibold md:text-2xl">{title}</h1>
      {children}
    </header>
  );
}

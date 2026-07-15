import type { ReactNode } from "react";

type PageHeaderProps = {
  title: string;
  subtitle?: string;
  children?: ReactNode;
};

export function PageHeader({ title, subtitle, children }: PageHeaderProps) {
  return (
    <header className="flex min-h-[64px] shrink-0 items-center gap-4 border-b border-white/6 bg-[hsl(237,25%,6%)] px-5 md:px-6">
      <div className="flex-1 min-w-0">
        <h1 className="text-base font-semibold text-white tracking-tight truncate md:text-lg">
          {title}
        </h1>
        {subtitle && (
          <p className="text-xs text-slate-500 font-medium mt-0.5">{subtitle}</p>
        )}
      </div>
      {children && (
        <div className="flex items-center gap-2 shrink-0">
          {children}
        </div>
      )}
    </header>
  );
}

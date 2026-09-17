import type { ReactNode } from "react";

type AppHeaderProps = {
  title: ReactNode;
  leading?: ReactNode;
  actions?: ReactNode;
};

export function AppHeader({ title, leading, actions }: AppHeaderProps) {
  return (
    <header className="relative z-10 flex min-h-[calc(var(--appbar-h)+var(--safe-top))] flex-none items-center gap-app-3 border-b-[var(--rule)] border-app-divider bg-[color-mix(in_srgb,var(--color-bg)_94%,transparent)] px-[calc(var(--space-4)+var(--safe-right))] pb-app-3 pl-[calc(var(--space-4)+var(--safe-left))] pt-[calc(var(--space-3)+var(--safe-top))] backdrop-blur-[10px] [@media(prefers-reduced-transparency:reduce)]:bg-app-bg [@media(prefers-reduced-transparency:reduce)]:backdrop-blur-none">
      {leading ? (
        <div className="flex flex-none items-center gap-app-2">{leading}</div>
      ) : null}
      <h1 className="m-0 min-w-0 flex-1 truncate text-left font-app-heading text-[20px] font-black leading-[1.2] text-app-text">
        {title}
      </h1>
      {actions ? (
        <div className="flex flex-none items-center justify-end gap-app-2">
          {actions}
        </div>
      ) : null}
    </header>
  );
}

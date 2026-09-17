import type { ReactNode } from "react";

type PagePlaceholderProps = {
  screenId: string;
  title: string;
  description: string;
  showTitle?: boolean;
  children?: ReactNode;
};

export function PagePlaceholder({
  screenId,
  title,
  description,
  showTitle = true,
  children,
}: PagePlaceholderProps) {
  return (
    <main className="flex min-h-0 min-w-0 flex-1 overflow-y-auto pb-[calc(var(--space-6)+var(--safe-bottom))] [-webkit-overflow-scrolling:touch]">
      <section className="border-b-[var(--rule)] border-app-divider p-app-4">
        <p className="text-[11px] uppercase tracking-[0.1em] text-app-accent">
          {screenId}
        </p>
        {showTitle ? <h2 className="mb-app-3 text-app-text">{title}</h2> : null}
        <p>{description}</p>
        <p className="text-[11.5px] text-app-neutral-600">FSD v1 scaffold</p>
        {children}
      </section>
    </main>
  );
}

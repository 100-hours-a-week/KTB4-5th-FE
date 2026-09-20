import type { ReactNode } from "react";

type PageActionLayoutProps = {
  children: ReactNode;
  action: ReactNode;
  tone?: "canvas" | "ink";
  pageClassName?: string;
  footerClassName?: string;
};

const toneClasses = {
  canvas: { page: "text-app-ink", footer: "" },
  ink: { page: "bg-app-ink text-app-canvas", footer: "bg-app-ink" },
} satisfies Record<
  NonNullable<PageActionLayoutProps["tone"]>,
  { page: string; footer: string }
>;

export function PageActionLayout({
  children,
  action,
  tone = "canvas",
  pageClassName = "",
  footerClassName = "",
}: PageActionLayoutProps) {
  return (
    <main
      className={`flex h-dvh max-h-full min-h-0 w-full flex-col overflow-hidden ${toneClasses[tone].page} ${pageClassName}`}
    >
      <div className="min-h-0 flex-1 overflow-y-auto">{children}</div>
      <footer
        data-page-action-footer
        className={`flex-none px-5 pt-3 pb-[calc(20px+var(--safe-bottom))] ${toneClasses[tone].footer} ${footerClassName}`}
      >
        {action}
      </footer>
    </main>
  );
}

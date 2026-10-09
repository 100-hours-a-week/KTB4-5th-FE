import type { ReactNode } from "react";

export function ShareStateLayout({ children }: { children: ReactNode }) {
  return (
    <main className="flex min-h-0 w-full flex-1 flex-col overflow-y-auto">
      {children}
    </main>
  );
}

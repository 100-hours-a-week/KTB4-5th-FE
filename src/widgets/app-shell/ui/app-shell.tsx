import type { ReactNode } from "react";

type AppShellProps = {
  header?: ReactNode;
  children: ReactNode;
  navigation?: ReactNode;
  navigationVisible?: boolean;
};

export function AppShell({
  header,
  children,
  navigation,
  navigationVisible = true,
}: AppShellProps) {
  return (
    <div className="flex h-[100dvh] min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
      {header}
      <div className="flex min-h-0 min-w-0 flex-1 overflow-hidden [&>*]:min-w-0">
        {children}
      </div>
      {navigationVisible ? navigation : null}
    </div>
  );
}

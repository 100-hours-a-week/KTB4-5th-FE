import type { ReactNode } from "react";

import styles from "./app-shell.module.css";

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
    <div className={styles.root}>
      {header}
      <div className={styles.content}>{children}</div>
      {navigationVisible ? navigation : null}
    </div>
  );
}

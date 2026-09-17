import type { ReactNode } from "react";

import styles from "./app-header.module.css";

type AppHeaderProps = {
  title: ReactNode;
  leading?: ReactNode;
  actions?: ReactNode;
};

export function AppHeader({ title, leading, actions }: AppHeaderProps) {
  return (
    <header className={styles.root}>
      {leading ? <div className={styles.leading}>{leading}</div> : null}
      <h1 className={styles.title}>{title}</h1>
      {actions ? <div className={styles.actions}>{actions}</div> : null}
    </header>
  );
}

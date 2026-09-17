import type { ReactNode } from "react";

import styles from "./page-placeholder.module.css";

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
    <main className={styles.root}>
      <section className="section">
        <p className="kicker">{screenId}</p>
        {showTitle ? <h2 className={styles.title}>{title}</h2> : null}
        <p>{description}</p>
        <p className="meta">FSD v1 scaffold</p>
        {children}
      </section>
    </main>
  );
}

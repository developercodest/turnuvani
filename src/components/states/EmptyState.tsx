import type { ReactNode } from "react";
import styles from "./states.module.css";

type EmptyStateProps = {
  title: string;
  description: string;
  action?: ReactNode;
  className?: string;
};

export function EmptyState({ title, description, action, className = "" }: EmptyStateProps) {
  return (
    <section className={`${styles.state} ${styles.centered} ${className}`} aria-labelledby="empty-state-title">
      <span className={styles.icon} aria-hidden="true">⌁</span>
      <div>
        <h2 id="empty-state-title" className={styles.title}>{title}</h2>
        <p className={styles.description}>{description}</p>
      </div>
      {action ? <div className={styles.action}>{action}</div> : null}
    </section>
  );
}

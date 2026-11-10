import type { ReactNode } from "react";
import styles from "./states.module.css";

type ContentErrorStateProps = {
  title?: string;
  description?: string;
  action?: ReactNode;
  className?: string;
};

export function ContentErrorState({
  title = "İçerik yüklenemedi",
  description = "Lütfen tekrar deneyin. Sorun devam ederse daha sonra yeniden kontrol edin.",
  action,
  className = "",
}: ContentErrorStateProps) {
  return (
    <section
      className={`${styles.state} ${styles.errorState} ${className}`}
      role="alert"
      aria-labelledby="content-error-title"
    >
      <span className={styles.errorIcon} aria-hidden="true">!</span>
      <div>
        <h2 id="content-error-title" className={styles.title}>{title}</h2>
        <p className={styles.description}>{description}</p>
      </div>
      {action ? <div className={styles.action}>{action}</div> : null}
    </section>
  );
}

import styles from "./states.module.css";

type LoadingStateProps = {
  label?: string;
  description?: string;
  className?: string;
};

export function LoadingState({
  label = "Yükleniyor",
  description = "İçerik hazırlanıyor. Lütfen bekleyin.",
  className = "",
}: LoadingStateProps) {
  return (
    <section className={`${styles.state} ${className}`} aria-busy="true" aria-live="polite">
      <span className={styles.spinner} aria-hidden="true" />
      <div>
        <h2 className={styles.title}>{label}</h2>
        <p className={styles.description}>{description}</p>
      </div>
    </section>
  );
}

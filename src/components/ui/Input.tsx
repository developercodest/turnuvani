import type { InputHTMLAttributes } from "react";
import styles from "./ui.module.css";

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  error?: string;
};

export function Input({ label, error, id, className = "", ...props }: InputProps) {
  const inputId = id ?? props.name;
  const errorId = error && inputId ? `${inputId}-error` : undefined;
  const describedBy = [props["aria-describedby"], errorId].filter(Boolean).join(" ") || undefined;
  return (
    <label className={styles.field} htmlFor={inputId}>
      {label ? <span className={styles.label}>{label}</span> : null}
      <input id={inputId} className={`${styles.input} ${error ? styles.inputError : ""} ${className}`} {...props} aria-describedby={describedBy} aria-invalid={error ? true : props["aria-invalid"]} />
      {error ? <span id={errorId} className={styles.error}>{error}</span> : null}
    </label>
  );
}

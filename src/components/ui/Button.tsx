import type { ButtonHTMLAttributes } from "react";
import styles from "./ui.module.css";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
};

export function Button({ variant = "primary", className = "", ...props }: ButtonProps) {
  return <button className={`${styles.button} ${styles[variant]} ${className}`} {...props} />;
}

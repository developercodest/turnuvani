"use client";

import { useEffect, type ReactNode } from "react";
import styles from "./ui.module.css";

type ModalProps = {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
};

export function Modal({ open, title, onClose, children }: ModalProps) {
  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (event: KeyboardEvent) => event.key === "Escape" && onClose();
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className={styles.modalBackdrop} role="presentation" onMouseDown={onClose}>
      <section className={styles.modal} role="dialog" aria-modal="true" aria-labelledby="modal-title" onMouseDown={(event) => event.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h2 id="modal-title">{title}</h2>
          <button className={styles.closeButton} type="button" aria-label="Kapat" onClick={onClose}>×</button>
        </div>
        {children}
      </section>
    </div>
  );
}

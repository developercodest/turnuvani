import type { ReactNode } from "react";
import { AuthHeader } from "@/components/brand/AuthHeader";
import styles from "./legal.module.css";

export default function LegalLayout({ children }: { children: ReactNode }) {
  return (
    <main className={styles.page}>
      <AuthHeader />
      {children}
    </main>
  );
}

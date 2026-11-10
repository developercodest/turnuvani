"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { TurnuvaniMark } from "./TurnuvaniMark";
import styles from "@/app/(auth)/auth.module.css";

export function AuthHeader() {
  const pathname = usePathname();
  return <header className={styles.header}>
    <Link href="/" className={styles.brand}><TurnuvaniMark /> Turnuvani</Link>
    <nav className={styles.nav} aria-label="Ana navigasyon">
      <Link href="/nasil-calisir">Nasıl Çalışır?</Link>
      <Link href="/turnuva-formatlari">Turnuva Formatları</Link>
    </nav>
    <div className={styles.headerActions}>
      {pathname === "/register" ? <Link href="/login" className={styles.registerLink}>Giriş Yap</Link> : pathname === "/login" ? <Link href="/register" className={styles.registerLink}>Kayıt Ol</Link> : <><Link href="/login">Giriş Yap</Link><Link href="/register" className={styles.registerLink}>Kayıt Ol</Link></>}
    </div>
  </header>;
}

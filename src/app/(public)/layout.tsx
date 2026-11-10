import Link from "next/link";
import type { ReactNode } from "react";
import { TurnuvaniMark } from "@/components/brand/TurnuvaniMark";

export default function PublicLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <header style={{ borderBottom: "1px solid #e2e8f0", background: "#fff" }}>
        <nav style={{ display: "flex", justifyContent: "space-between", alignItems: "center", maxWidth: 1120, margin: "0 auto", padding: "18px 20px" }}>
          <Link href="/" style={{ display: "inline-flex", alignItems: "center", gap: 8, fontWeight: 800, color: "#1e1b4b" }}><TurnuvaniMark width={30} height={30} /> Turnuvani</Link>
          <div style={{ display: "flex", gap: 16 }}>
            <Link href="/login">Giriş yap</Link>
            <Link href="/register">Kayıt ol</Link>
          </div>
        </nav>
      </header>
      {children}
    </>
  );
}

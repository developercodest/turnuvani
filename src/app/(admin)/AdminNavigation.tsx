"use client";

import { LayoutDashboard, Trophy } from "lucide-react";
import { usePathname } from "next/navigation";
import { GuardedLink } from "@/features/tournament-wizard/GuardedLink";
import styles from "./admin-layout.module.css";

const items = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, match: (pathname: string) => pathname === "/dashboard" },
  { href: "/dashboard/tournaments", label: "Turnuvalarım", icon: Trophy, match: (pathname: string) => pathname.startsWith("/dashboard/tournaments") },
] as const;

export function AdminNavigation() {
  const pathname = usePathname();

  return (
    <nav className={styles.navigation} aria-label="Ana navigasyon">
      {items.map(({ href, label, icon: Icon, match }) => (
        <GuardedLink key={href} href={href} data-active={match(pathname)}>
          <Icon aria-hidden="true" />
          <span>{label}</span>
        </GuardedLink>
      ))}
    </nav>
  );
}

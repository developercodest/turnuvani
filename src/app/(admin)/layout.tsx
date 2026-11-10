import type { ReactNode } from "react";
import { UserRound } from "lucide-react";
import { TurnuvaniMark } from "@/components/brand/TurnuvaniMark";
import { SignOutButton } from "@/features/auth/SignOutButton";
import { GuardedLink } from "@/features/tournament-wizard/GuardedLink";
import { WizardLeaveGuardProvider } from "@/features/tournament-wizard/WizardLeaveGuard";
import { AdminNavigation } from "./AdminNavigation";
import styles from "./admin-layout.module.css";

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <WizardLeaveGuardProvider>
      <div className={styles.shell}>
        <header className={styles.topbar}>
          <GuardedLink href="/dashboard" className={styles.brand}>
            <TurnuvaniMark />
            <span><strong>Turnuvani</strong><small>Turnuvalarını yönet</small></span>
          </GuardedLink>

          <AdminNavigation />

          <div className={styles.accountArea}>
            <GuardedLink href="/dashboard/profile" className={styles.accountIdentity} aria-label="Profil ayarları">
              <span className={styles.avatar} aria-hidden="true"><UserRound /></span>
              <span><strong>Hesabım</strong><small>Profil ayarları</small></span>
            </GuardedLink>
            <SignOutButton />
          </div>
        </header>

        <main className={styles.content}>{children}</main>
      </div>
    </WizardLeaveGuardProvider>
  );
}

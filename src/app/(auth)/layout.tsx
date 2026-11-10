import type { ReactNode } from "react";
import { AuthHeader } from "@/components/brand/AuthHeader";
import { FeatureIcon } from "@/components/ui/FeatureIcon";
import styles from "./auth.module.css";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <main className={styles.authPage}>
      <AuthHeader />
      <div className={styles.authBody}>
        <section className={styles.hero}>
          <div className={styles.heroContent}>
            <p className={styles.eyebrow}>TURNUVALARINI YÖNET</p>
            <h1>Turnuvalarını kolayca <span>oluştur, yönet</span> ve paylaş.</h1>
            <p className={styles.heroText}>Lig ve eleme usulü turnuvalar oluştur, katılımcıları ekle, maçları yönet ve herkese açık link ile paylaş.</p>
            <div className={styles.benefits}>
              <div><span><FeatureIcon name="participants" /></span><p><b>Kolay<br />turnuva oluşturma</b></p></div>
              <div><span><FeatureIcon name="calendar" /></span><p><b>Fikstür ve maç<br />yönetimi</b></p></div>
              <div><span><FeatureIcon name="share" /></span><p><b>Herkese açık<br />paylaşım linki</b></p></div>
            </div>
          </div>
          <div className={styles.fieldArt}><span>⚽</span></div>
        </section>
        <section className={styles.formArea}>{children}</section>
      </div>
    </main>
  );
}

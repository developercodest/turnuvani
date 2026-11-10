import Link from "next/link";
import { TurnuvaniMark } from "@/components/brand/TurnuvaniMark";
import styles from "./verified.module.css";

export default function VerificationSuccessPage() {
  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <Link href="/" className={styles.brand}><TurnuvaniMark /> Turnuvani</Link>
        <nav className={styles.nav} aria-label="Ana menü">
          <Link href="/">Özellikler</Link>
          <Link href="/">Nasıl Çalışır?</Link>
          <Link href="/">Örnek Turnuvalar</Link>
        </nav>
        <div className={styles.actions}>
          <Link href="/login">Giriş Yap</Link>
          <Link href="/register">Kayıt Ol</Link>
        </div>
      </header>

      <section className={styles.content}>
        <article className={styles.card}>
          <div className={styles.successIcon} aria-hidden="true">✉<span>✓</span></div>
          <h1>E-posta doğrulama başarılı!</h1>
          <p className={styles.intro}>Hesabınız başarıyla doğrulandı.<br />Artık turnuvalar oluşturabilir, yönetebilir ve hemen başlayabilirsiniz.</p>
          <Link href="/dashboard" className={styles.primaryAction}>Turnuvalarımı Görüntüle</Link>
          <Link href="/login" className={styles.secondaryAction}>← Giriş yap sayfasına dön</Link>
          <div className={styles.readyNote}>
            <span aria-hidden="true">🎉</span>
            <p><b>Hazırsınız!</b><br />Şimdi kendi turnuvanızı oluşturabilir, katılımcıları ekleyebilir ve herkese açık bağlantı ile paylaşabilirsiniz.</p>
          </div>
        </article>
      </section>

      <footer className={styles.footer}>
        <span>© 2026 Turnuvani. Tüm hakları saklıdır.</span>
        <div><Link href="/">Gizlilik Politikası</Link><Link href="/">Kullanım Şartları</Link><Link href="/">İletişim</Link></div>
      </footer>
    </main>
  );
}

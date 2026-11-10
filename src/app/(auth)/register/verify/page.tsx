import Link from "next/link";
import { VerificationResendForm } from "./VerificationResendForm";
import styles from "../../auth.module.css";

type RegisterVerificationPageProps = {
  searchParams: Promise<{ email?: string | string[] }>;
};

export default async function RegisterVerificationPage({ searchParams }: RegisterVerificationPageProps) {
  const { email } = await searchParams;
  const initialEmail = typeof email === "string" ? email : "";

  return (
    <section className={styles.formCard}>
      <div className={styles.verificationIcon} aria-hidden="true">✉</div>
      <h1>E-postanı kontrol et</h1>
      <p className={styles.formIntro}>
        Hesabını etkinleştirmek için e-posta adresine gönderdiğimiz doğrulama bağlantısını aç.
      </p>
      <p className={styles.verificationHint}>
        Mesaj birkaç dakika içinde görünmezse spam klasörünü de kontrol et.
      </p>
      <VerificationResendForm initialEmail={initialEmail} />
      <Link href="/login" className={styles.registerLink}>Giriş ekranına dön</Link>
    </section>
  );
}

"use client";

import Link from "next/link";
import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import styles from "../auth.module.css";

type ResetErrors = { password?: string; confirmation?: string };

export default function ResetPasswordPage() {
  const router = useRouter();
  const [isCheckingSession, setIsCheckingSession] = useState(true);
  const [hasRecoverySession, setHasRecoverySession] = useState(false);
  const [errors, setErrors] = useState<ResetErrors>({});
  const [formError, setFormError] = useState<string>();
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    let active = true;
    void createSupabaseBrowserClient().auth.getSession().then(({ data }) => {
      if (!active) return;
      setHasRecoverySession(Boolean(data.session));
      setIsCheckingSession(false);
    });
    return () => { active = false; };
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const password = String(formData.get("password") ?? "");
    const confirmation = String(formData.get("confirmation") ?? "");
    const nextErrors: ResetErrors = {};
    if (password.length < 8) nextErrors.password = "Şifreniz en az 8 karakter olmalı.";
    if (password !== confirmation) nextErrors.confirmation = "Şifreler birbiriyle eşleşmiyor.";
    setErrors(nextErrors);
    setFormError(undefined);
    if (Object.keys(nextErrors).length > 0) return;

    setIsSubmitting(true);
    try {
      const supabase = createSupabaseBrowserClient();
      const { error } = await supabase.auth.updateUser({ password });
      if (error) {
        setFormError("Şifre güncellenemedi. Bağlantının süresi dolmuş olabilir.");
        return;
      }
      await supabase.auth.signOut();
      router.replace("/login?password-reset=success");
    } catch {
      setFormError("Bağlantı kurulamadı. Lütfen daha sonra tekrar deneyin.");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isCheckingSession) {
    return <section className={styles.formCard}><p className={styles.formIntro}>Bağlantı doğrulanıyor…</p></section>;
  }

  if (!hasRecoverySession) {
    return (
      <section className={styles.formCard}>
        <h1>Bağlantı geçersiz</h1>
        <p className={styles.formIntro}>Bu şifre yenileme bağlantısının süresi dolmuş veya daha önce kullanılmış olabilir.</p>
        <Link href="/forgot-password" className={styles.registerLink}>Yeni bağlantı iste</Link>
      </section>
    );
  }

  return (
    <section className={styles.formCard}>
      <h1>Yeni şifre belirle</h1>
      <p className={styles.formIntro}>Hesabın için en az 8 karakterden oluşan yeni bir şifre belirle.</p>
      <form className={styles.form} noValidate onSubmit={handleSubmit}>
        <Input label="Yeni şifre" name="password" type="password" autoComplete="new-password" error={errors.password} required />
        <Input label="Yeni şifre (Tekrar)" name="confirmation" type="password" autoComplete="new-password" error={errors.confirmation} required />
        {formError ? <p className={styles.formError} role="alert">{formError}</p> : null}
        <Button type="submit" disabled={isSubmitting}>{isSubmitting ? "Güncelleniyor…" : "Şifreyi güncelle"}</Button>
      </form>
    </section>
  );
}

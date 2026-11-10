"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { hasUnsupportedUnicodeLocalPart, normalizeEmail } from "@/lib/email";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import styles from "../auth.module.css";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState<string>();
  const [formError, setFormError] = useState<string>();
  const [successMessage, setSuccessMessage] = useState<string>();
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const normalizedEmail = normalizeEmail(email);
    setEmailError(undefined);
    setFormError(undefined);
    setSuccessMessage(undefined);

    if (!normalizedEmail) {
      setEmailError("Geçerli bir e-posta adresi girin.");
      return;
    }
    if (hasUnsupportedUnicodeLocalPart(normalizedEmail)) {
      setEmailError("E-posta adresinizin @ öncesindeki bölümünde Türkçe karakter kullanmayın.");
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await createSupabaseBrowserClient().auth.resetPasswordForEmail(normalizedEmail, {
        redirectTo: `${window.location.origin}/auth/callback?next=/reset-password`,
      });
      if (error) {
        setFormError("İstek şu anda tamamlanamadı. Birkaç dakika sonra tekrar deneyin.");
        return;
      }
      setSuccessMessage("Eğer bu adresle bir hesabınız varsa şifre yenileme bağlantısı gönderildi.");
    } catch {
      setFormError("Bağlantı kurulamadı. Lütfen daha sonra tekrar deneyin.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className={styles.formCard}>
      <h1>Şifreni yenile</h1>
      <p className={styles.formIntro}>E-posta adresini gir, şifreni yenilemen için bağlantı gönderelim.</p>
      <form className={styles.form} noValidate onSubmit={handleSubmit}>
        <Input label="E-posta" name="email" type="text" inputMode="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} error={emailError} required />
        {formError ? <p className={styles.formError} role="alert">{formError}</p> : null}
        {successMessage ? <p className={styles.formSuccess} role="status">{successMessage}</p> : null}
        <Button type="submit" disabled={isSubmitting}>{isSubmitting ? "Gönderiliyor…" : "Yenileme bağlantısı gönder"}</Button>
      </form>
      <p className={styles.switchText}><Link href="/login">Giriş ekranına dön</Link></p>
    </section>
  );
}

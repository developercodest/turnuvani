"use client";

import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { hasUnsupportedUnicodeLocalPart, normalizeEmail } from "@/lib/email";
import styles from "../../auth.module.css";

type VerificationResendFormProps = {
  initialEmail: string;
};

export function VerificationResendForm({ initialEmail }: VerificationResendFormProps) {
  const [email, setEmail] = useState(initialEmail);
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
      const { error } = await createSupabaseBrowserClient().auth.resend({
        type: "signup",
        email: normalizedEmail,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) {
        setFormError(
          "Doğrulama e-postası şu anda gönderilemedi. Birkaç dakika bekleyip tekrar deneyin.",
        );
        return;
      }

      setSuccessMessage("Yeni doğrulama bağlantısı e-posta adresine gönderildi.");
    } catch {
      setFormError("Bağlantı kurulamadı. Lütfen daha sonra tekrar deneyin.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form className={styles.resendForm} noValidate onSubmit={handleSubmit}>
      <Input
        label="E-posta"
        name="email"
        type="text"
        inputMode="email"
        autoComplete="email"
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        required
        error={emailError}
      />
      {formError ? <p className={styles.formError} role="alert">{formError}</p> : null}
      {successMessage ? <p className={styles.formSuccess} role="status">{successMessage}</p> : null}
      <Button type="submit" variant="secondary" disabled={isSubmitting}>
        {isSubmitting ? "Gönderiliyor…" : "Doğrulama e-postasını yeniden gönder"}
      </Button>
    </form>
  );
}

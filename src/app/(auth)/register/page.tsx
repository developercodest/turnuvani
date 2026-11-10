"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { hasUnsupportedUnicodeLocalPart, normalizeEmail } from "@/lib/email";
import { Button } from "@/components/ui/Button";
import { GoogleButton } from "@/components/ui/GoogleButton";
import { Input } from "@/components/ui/Input";
import styles from "../auth.module.css";

type RegisterErrors = {
  fullName?: string;
  email?: string;
  password?: string;
  passwordConfirmation?: string;
  terms?: string;
};

export default function RegisterPage() {
  const router = useRouter();
  const [errors, setErrors] = useState<RegisterErrors>({});
  const [formError, setFormError] = useState<string>();
  const [successMessage, setSuccessMessage] = useState<string>();
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const form = event.currentTarget;
    const formData = new FormData(form);
    const fullName = String(formData.get("full-name") ?? "").trim();
    const email = normalizeEmail(String(formData.get("email") ?? ""));
    const password = String(formData.get("password") ?? "");
    const passwordConfirmation = String(formData.get("password-confirmation") ?? "");
    const nextErrors: RegisterErrors = {};

    if (!fullName) nextErrors.fullName = "Ad soyad alanını doldurun.";
    if (!email) nextErrors.email = "Geçerli bir e-posta adresi girin.";
    else if (hasUnsupportedUnicodeLocalPart(email)) nextErrors.email = "E-posta adresinizin @ öncesindeki bölümünde Türkçe karakter kullanmayın.";
    if (password.length < 8) nextErrors.password = "Şifreniz en az 8 karakter olmalı.";
    if (password !== passwordConfirmation) nextErrors.passwordConfirmation = "Şifreler birbiriyle eşleşmiyor.";
    if (formData.get("terms") !== "on") nextErrors.terms = "Devam etmek için kullanım koşullarını kabul edin.";

    setErrors(nextErrors);
    setFormError(undefined);
    setSuccessMessage(undefined);

    if (Object.keys(nextErrors).length > 0) {
      setFormError("Lütfen işaretlenen alanları düzeltin.");
      return;
    }

    if (!email) return;

    setIsSubmitting(true);

    try {
      const supabase = createSupabaseBrowserClient();
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            terms_accepted_at: new Date().toISOString(),
            terms_version: "2026-11-02",
            privacy_notice_viewed_at: new Date().toISOString(),
            privacy_notice_version: "2026-11-02",
          },
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) {
        setFormError("Kayıt oluşturulamadı. Bilgilerinizi kontrol edip tekrar deneyin.");
        return;
      }

      form.reset();

      if (data.session) {
        setSuccessMessage("Hesabınız oluşturuldu. Giriş yapabilirsiniz.");
        return;
      }

      router.push(`/register/verify?email=${encodeURIComponent(email)}`);
    } catch {
      setFormError("Bağlantı kurulamadı. Lütfen daha sonra tekrar deneyin.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className={`${styles.formCard} ${styles.registerCard}`}>
      <h1>Hesap Oluştur</h1>
      <p className={styles.formIntro}>Turnuvalarını oluşturmak ve yönetmek için hesabını oluştur.</p>
      <form className={styles.form} noValidate onSubmit={handleSubmit}>
        <Input label="Ad soyad" name="full-name" autoComplete="name" required error={errors.fullName} />
        <Input label="E-posta" name="email" type="text" inputMode="email" autoComplete="email" required error={errors.email} />
        <Input label="Şifre" name="password" type="password" autoComplete="new-password" minLength={8} required error={errors.password} />
        <Input label="Şifre (Tekrar)" name="password-confirmation" type="password" autoComplete="new-password" required error={errors.passwordConfirmation} />
        <div>
          <label className={styles.terms}>
            <input type="checkbox" name="terms" required aria-describedby={errors.terms ? "terms-error" : undefined} aria-invalid={Boolean(errors.terms)} />
            <span><Link href="/kullanim-kosullari">Kullanım koşullarını</Link> okudum ve kabul ediyorum.</span>
          </label>
          <p className={styles.termsHint}><Link href="/gizlilik-politikasi">Gizlilik Politikası ve KVKK Aydınlatma Metni</Link>, kişisel verilerinizin nasıl işlendiğini açıklar.</p>
          {errors.terms ? <p id="terms-error" className={styles.termsError}>{errors.terms}</p> : null}
        </div>
        {formError ? <p className={styles.formError} role="alert">{formError}</p> : null}
        {successMessage ? <p className={styles.formSuccess} role="status">{successMessage}</p> : null}
        <Button type="submit" disabled={isSubmitting}>{isSubmitting ? "Kayıt oluşturuluyor…" : "Kayıt ol"}</Button>
      </form>
      <div className={styles.divider}><span>veya</span></div>
      <GoogleButton />
      <p className={styles.switchText}>Zaten hesabın var mı? <Link href="/login">Giriş Yap</Link></p>
    </section>
  );
}

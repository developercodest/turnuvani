"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { hasUnsupportedUnicodeLocalPart, normalizeEmail } from "@/lib/email";
import { Button } from "@/components/ui/Button";
import { GoogleButton } from "@/components/ui/GoogleButton";
import { Input } from "@/components/ui/Input";
import styles from "../auth.module.css";

type LoginErrors = { email?: string; password?: string };
export default function LoginPage() {
  const router = useRouter();
  const [errors, setErrors] = useState<LoginErrors>({});
  const [formError, setFormError] = useState<string>();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [passwordResetSuccess, setPasswordResetSuccess] = useState(false);

  function nextPath() {
    if (typeof window === "undefined") return "/dashboard";
    const value = new URLSearchParams(window.location.search).get("next");
    return value?.startsWith("/dashboard/") ? value : "/dashboard";
  }

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const params = new URLSearchParams(window.location.search);
      setPasswordResetSuccess(params.get("password-reset") === "success");
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    let active = true;
    void createSupabaseBrowserClient().auth.getClaims().then(({ data }) => {
      if (active && data?.claims?.sub) router.replace(nextPath());
    });
    return () => { active = false; };
  }, [router]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const email = normalizeEmail(String(formData.get("email") ?? ""));
    const password = String(formData.get("password") ?? "");
    const nextErrors: LoginErrors = {};

    if (!email) nextErrors.email = "Geçerli bir e-posta adresi girin.";
    else if (hasUnsupportedUnicodeLocalPart(email)) nextErrors.email = "E-posta adresinizin @ öncesindeki bölümünde Türkçe karakter kullanmayın.";
    if (!password) nextErrors.password = "Şifrenizi girin.";

    setErrors(nextErrors);
    setFormError(undefined);
    if (Object.keys(nextErrors).length > 0) return;
    if (!email) return;

    setIsSubmitting(true);
    try {
      const { error } = await createSupabaseBrowserClient().auth.signInWithPassword({ email, password });
      if (error) {
        if (error.code === "email_not_confirmed") {
          router.replace(`/register/verify?email=${encodeURIComponent(email)}`);
          return;
        }

        setFormError("E-posta adresi veya şifre hatalı.");
        return;
      }
      router.replace(nextPath());
    } catch {
      setFormError("Giriş yapılamadı. Lütfen daha sonra tekrar deneyin.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className={styles.formCard}>
      <h1>Giriş Yap</h1>
      <p className={styles.formIntro}>Turnuvalarını yönetmek için hesabına giriş yap.</p>
      <form className={styles.form} noValidate onSubmit={handleSubmit}>
        <Input label="E-posta" name="email" type="text" inputMode="email" autoComplete="email" error={errors.email} />
        <Input label="Şifre" name="password" type="password" autoComplete="current-password" error={errors.password} />
        <div className={styles.formOptions}><label><input type="checkbox" /> Beni hatırla</label><Link href="/forgot-password">Şifremi unuttum?</Link></div>
        {passwordResetSuccess ? <p className={styles.formSuccess} role="status">Şifreniz güncellendi. Yeni şifrenizle giriş yapabilirsiniz.</p> : null}
        {formError ? <p className={styles.formError} role="alert">{formError}</p> : null}
        <Button type="submit" disabled={isSubmitting}>{isSubmitting ? "Giriş yapılıyor…" : "Giriş Yap"}</Button>
      </form>
      <div className={styles.divider}><span>veya</span></div>
      <GoogleButton />
      <p className={styles.switchText}>Hesabın yok mu? <a href={`/register?next=${encodeURIComponent(nextPath())}`}>Kayıt Ol</a></p>
    </section>
  );
}

"use client";

import { AlertTriangle, KeyRound, Mail, ShieldCheck, UserRound } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition, type FormEvent } from "react";
import { Button } from "@/components/ui/Button";
import { useAuthSession } from "@/features/auth/AuthSessionProvider";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import styles from "./profile.module.css";

export default function ProfilePage() {
  const router = useRouter();
  const { user, isLoading } = useAuthSession();
  const [fullName, setFullName] = useState("");
  const [profileLoading, setProfileLoading] = useState(false);
  const [message, setMessage] = useState<string>();
  const [error, setError] = useState<string>();
  const [pending, startTransition] = useTransition();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState("");
  const [deletionPending, setDeletionPending] = useState(false);
  const [passwordError, setPasswordError] = useState<string>();
  const [passwordMessage, setPasswordMessage] = useState<string>();
  const [passwordPending, setPasswordPending] = useState(false);

  useEffect(() => {
    if (isLoading) return;
    if (!user) return;

    let active = true;
    const loadProfile = async () => {
      setProfileLoading(true);
      setError(undefined);
      const { data, error: profileError } = await createSupabaseBrowserClient()
        .from("profiles")
        .select("full_name")
        .eq("id", user.id)
        .maybeSingle();

      if (!active) return;
      if (profileError || !data) {
        setError("Profil bilgileri yüklenemedi. Lütfen sayfayı yenileyin.");
      } else {
        setFullName(data.full_name);
      }
      setProfileLoading(false);
    };

    void loadProfile();
    return () => { active = false; };
  }, [isLoading, user]);

  async function deleteAccount() {
    if (!user || deletionPending || deleteConfirmation !== "SİL") return;
    setDeletionPending(true);
    setError(undefined);
    setMessage(undefined);

    const supabase = createSupabaseBrowserClient();
    const { error: deletionError } = await supabase.rpc("delete_current_account");

    if (deletionError) {
      setError("Hesap silinemedi. Lütfen tekrar deneyin.");
      setDeletionPending(false);
      return;
    }

    await supabase.auth.signOut();
    router.replace("/");
  }

  async function changePassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!user?.email || passwordPending) return;

    const form = event.currentTarget;
    const formData = new FormData(form);
    const currentPassword = String(formData.get("current-password") ?? "");
    const password = String(formData.get("password") ?? "");
    const passwordConfirmation = String(formData.get("password-confirmation") ?? "");

    setPasswordError(undefined);
    setPasswordMessage(undefined);
    if (!currentPassword) { setPasswordError("Mevcut şifrenizi girin."); return; }
    if (password.length < 8) { setPasswordError("Yeni şifre en az 8 karakter olmalı."); return; }
    if (password !== passwordConfirmation) { setPasswordError("Yeni şifreler birbiriyle eşleşmiyor."); return; }
    if (password === currentPassword) { setPasswordError("Yeni şifreniz mevcut şifrenizden farklı olmalı."); return; }

    setPasswordPending(true);
    const supabase = createSupabaseBrowserClient();
    const { error: credentialsError } = await supabase.auth.signInWithPassword({ email: user.email, password: currentPassword });
    if (credentialsError) {
      setPasswordError("Mevcut şifre hatalı veya bu hesap için henüz şifre oluşturulmamış.");
      setPasswordPending(false);
      return;
    }

    const { error: updatePasswordError } = await supabase.auth.updateUser({ password, current_password: currentPassword });
    if (updatePasswordError) setPasswordError("Şifre güncellenemedi. Lütfen tekrar deneyin.");
    else {
      form.reset();
      setPasswordMessage("Şifreniz güncellendi.");
    }
    setPasswordPending(false);
  }

  if (isLoading || (user && profileLoading)) return <section className={styles.page}><p>Profil hazırlanıyor…</p></section>;

  return <section className={styles.page}>
    <header><p>HESAP</p><h1>Profil ayarları</h1><span>Hesapta görünen adınızı buradan güncelleyebilirsiniz.</span></header>
    <div className={styles.settingsGrid}>
      <form className={styles.form} action={(formData) => {
        setError(undefined); setMessage(undefined);
        const fullName = String(formData.get("fullName") ?? "").trim();
        if (!fullName) { setError("Görünen ad zorunludur."); return; }
        if (fullName.length > 80) { setError("Ad en fazla 80 karakter olabilir."); return; }
        startTransition(async () => {
          if (!user) { setError("Oturum bulunamadı. Lütfen tekrar giriş yapın."); return; }
          const { error: updateError } = await createSupabaseBrowserClient().from("profiles").update({ full_name: fullName }).eq("id", user.id);
          if (updateError) setError("Profil güncellenemedi. Lütfen tekrar deneyin.");
          else { setFullName(fullName); setMessage("Profil bilgileriniz kaydedildi."); }
        });
      }}>
        <label><span><UserRound /> Görünen ad</span><input name="fullName" value={fullName} onChange={(event) => setFullName(event.target.value)} maxLength={80} placeholder="Adınız" required /></label>
        <label><span><Mail /> E-posta</span><input value={user?.email ?? ""} readOnly aria-label="E-posta" /><small>E-posta değişikliği şu anda desteklenmiyor.</small></label>
        <div className={styles.security}><ShieldCheck /><div><strong>Hesap güvenliği</strong><p>Profil bilgileri yalnızca hesabınıza aittir; yetkilendirme kararlarında kullanılmaz.</p></div></div>
        <footer><span role="status" data-error={Boolean(error)}>{error ?? message}</span><Button disabled={pending}>{pending ? "Kaydediliyor…" : "Profili Kaydet"}</Button></footer>
      </form>
      <section className={styles.passwordSection}>
        <div className={styles.sectionHeading}><KeyRound /><div><strong>Şifre değiştir</strong><p>Güvenliğiniz için mevcut şifrenizi doğrulayarak yeni şifrenizi belirleyin.</p></div></div>
        <form className={styles.passwordForm} onSubmit={changePassword}>
          <label><span>Mevcut şifre</span><input name="current-password" type="password" autoComplete="current-password" required /></label>
          <label><span>Yeni şifre</span><input name="password" type="password" autoComplete="new-password" minLength={8} required /></label>
          <label><span>Yeni şifre (tekrar)</span><input name="password-confirmation" type="password" autoComplete="new-password" required /></label>
          <p className={styles.passwordHint}>Google ile giriş yaptıysanız ve şifreniz yoksa <a href="/forgot-password">şifre yenileme bağlantısı</a> ile bir şifre oluşturabilirsiniz.</p>
          <footer><span role="status" data-error={Boolean(passwordError)}>{passwordError ?? passwordMessage}</span><Button type="submit" disabled={passwordPending}>{passwordPending ? "Şifre güncelleniyor…" : "Şifreyi güncelle"}</Button></footer>
        </form>
      </section>
    </div>
    <section className={styles.dangerZone}>
      <div><AlertTriangle /><div><strong>Hesabı kalıcı olarak sil</strong><p>Hesabınız, oluşturduğunuz turnuvalar ve bunlara bağlı katılımcı, takım ve maç kayıtları geri alınamaz biçimde silinir.</p></div></div>
      <Button type="button" variant="secondary" onClick={() => { setDeleteConfirmation(""); setDeleteDialogOpen(true); }}>Hesabımı sil</Button>
    </section>
    {deleteDialogOpen && <div className={styles.dialogBackdrop} role="presentation">
      <section className={styles.deleteDialog} role="dialog" aria-modal="true" aria-labelledby="delete-account-title">
        <AlertTriangle aria-hidden="true" />
        <h2 id="delete-account-title">Hesabınızı kalıcı olarak silmek istiyor musunuz?</h2>
        <p>Bu işlem geri alınamaz. Oluşturduğunuz tüm turnuvalar ile bunlara bağlı katılımcı, takım ve maç kayıtları da silinir.</p>
        <label htmlFor="delete-confirmation">Onaylamak için <strong>SİL</strong> yazın<input id="delete-confirmation" value={deleteConfirmation} onChange={(event) => setDeleteConfirmation(event.target.value.toLocaleUpperCase("tr-TR"))} autoComplete="off" /></label>
        <div className={styles.dialogActions}>
          <Button type="button" variant="secondary" disabled={deletionPending} onClick={() => setDeleteDialogOpen(false)}>Vazgeç</Button>
          <Button type="button" disabled={deleteConfirmation !== "SİL" || deletionPending} onClick={deleteAccount}>{deletionPending ? "Hesap siliniyor…" : "Kalıcı olarak sil"}</Button>
        </div>
      </section>
    </div>}
  </section>;
}

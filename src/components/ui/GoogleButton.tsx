"use client";

import { useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { GoogleMark } from "@/components/ui/GoogleMark";
import styles from "./ui.module.css";

export function GoogleButton() {
  const [error, setError] = useState<string>();
  const [isRedirecting, setIsRedirecting] = useState(false);

  async function continueWithGoogle() {
    setError(undefined);
    setIsRedirecting(true);

    try {
      const redirectTo = `${window.location.origin}/auth/callback?next=/dashboard`;
      const { error: oauthError } = await createSupabaseBrowserClient().auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo },
      });

      if (oauthError) {
        setError("Google ile giriş başlatılamadı. Lütfen tekrar deneyin.");
        setIsRedirecting(false);
      }
    } catch {
      setError("Bağlantı kurulamadı. Lütfen daha sonra tekrar deneyin.");
      setIsRedirecting(false);
    }
  }

  return (
    <div>
      <Button type="button" variant="secondary" className={styles.googleButton} onClick={continueWithGoogle} disabled={isRedirecting}>
        <GoogleMark />
        <span>{isRedirecting ? "Google'a yönlendiriliyor…" : "Google ile devam et"}</span>
      </Button>
      {error ? <p className={styles.googleError} role="alert">{error}</p> : null}
    </div>
  );
}

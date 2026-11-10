"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { useWizardLeaveGuard } from "@/features/tournament-wizard/WizardLeaveGuard";

export function SignOutButton() {
  const router = useRouter();
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [error, setError] = useState<string>();
  const { requestLeave } = useWizardLeaveGuard();

  async function performSignOut() {
    setError(undefined);
    setIsSigningOut(true);

    try {
      const { error: signOutError } = await createSupabaseBrowserClient().auth.signOut();

      if (signOutError) {
        setError("Çıkış yapılamadı. Lütfen tekrar deneyin.");
        return;
      }

      router.replace("/login");
      router.refresh();
    } catch {
      setError("Bağlantı kurulamadı. Lütfen tekrar deneyin.");
    } finally {
      setIsSigningOut(false);
    }
  }

  function handleSignOut() {
    requestLeave(() => { void performSignOut(); });
  }

  return (
    <div>
      <button type="button" onClick={handleSignOut} disabled={isSigningOut}>
        {isSigningOut ? "Çıkış yapılıyor…" : "Çıkış"}
      </button>
      {error ? <p role="alert">{error}</p> : null}
    </div>
  );
}

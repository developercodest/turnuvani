"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import styles from "@/components/ui/ui.module.css";
import { completeLeagueTournament } from "./actions";

export function CompleteLeagueTournamentButton({ canComplete, tournamentId }: { canComplete: boolean; tournamentId: string }) {
  const [pending, transition] = useTransition();
  const [error, setError] = useState<string>();
  const [confirmOpen, setConfirmOpen] = useState(false);

  const complete = () => {
    setError(undefined);
    transition(async () => {
      const result = await completeLeagueTournament(tournamentId);
      if (result.error) {
        setError(result.error);
        return;
      }
      setConfirmOpen(false);
    });
  };

  return <div>
    <Button disabled={pending || !canComplete} onClick={() => setConfirmOpen(true)}>
      {pending ? "Tamamlanıyor…" : "Turnuvayı Tamamla"}
    </Button>
    {error ? <p role="alert">{error}</p> : null}
    <Modal open={confirmOpen} title="Turnuvayı tamamla" onClose={() => !pending && setConfirmOpen(false)}>
      <div className={styles.confirmationContent}>
        <p>Tüm maçlar tamamlandı. Turnuva tamamlandığında sonuç ve fikstür salt okunur kalır.</p>
        {error ? <p role="alert">{error}</p> : null}
        <footer>
          <Button type="button" variant="secondary" onClick={() => setConfirmOpen(false)} disabled={pending}>Vazgeç</Button>
          <Button type="button" onClick={complete} disabled={pending}>{pending ? "Tamamlanıyor…" : "Turnuvayı Tamamla"}</Button>
        </footer>
      </div>
    </Modal>
  </div>;
}

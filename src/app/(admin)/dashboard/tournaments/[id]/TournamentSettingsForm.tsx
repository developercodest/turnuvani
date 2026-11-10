"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { TOURNAMENT_DESCRIPTION_MAX_LENGTH, TOURNAMENT_NAME_MAX_LENGTH } from "@/lib/tournament-text-limits";
import { cancelTournament, reactivateTournament, updateTournamentDetails } from "./actions";
import styles from "./tournament-page.module.css";

type TournamentSettingsFormProps = {
  tournamentId: string;
  name: string;
  description: string | null;
  category: string | null;
  startDate: string;
  endDate: string;
  format: string;
  status: string;
};

const categories = ["Futbol", "Basketbol", "Voleybol", "Diğer"];

export function TournamentSettingsForm({ tournamentId, name, description, category, startDate, endDate, format, status }: TournamentSettingsFormProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string>();
  const [error, setError] = useState<string>();
  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelError, setCancelError] = useState<string>();
  const [reactivateOpen, setReactivateOpen] = useState(false);
  const immutable = status === "COMPLETED";

  return (
    <section className={styles.tabPanel}>
      <header>
        <h2>Turnuva Ayarları</h2>
        <p>Turnuvanın görünen bilgilerini güncelleyin. Format ve fikstür kuralları başladıktan sonra korunur.</p>
      </header>

      <form className={styles.settingsForm} action={(formData) => {
        setError(undefined);
        setMessage(undefined);
        startTransition(async () => {
          const result = await updateTournamentDetails(tournamentId, {
            name: String(formData.get("name") ?? ""),
            description: String(formData.get("description") ?? ""),
            category: String(formData.get("category") ?? ""),
            startDate: String(formData.get("startDate") ?? ""),
            endDate: String(formData.get("endDate") ?? ""),
          });
          if (result.error) setError(result.error);
          else {
            setMessage("Turnuva bilgileri kaydedildi.");
            router.refresh();
          }
        });
      }}>
        <label>Turnuva adı<input name="name" defaultValue={name} maxLength={TOURNAMENT_NAME_MAX_LENGTH} required disabled={immutable} /></label>
        <label>Spor dalı
          <select name="category" defaultValue={category ?? ""} disabled={immutable}>
            <option value="">Kategori seçin</option>
            {categories.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
        </label>
        <label className={styles.fullSettingField}>Açıklama<textarea name="description" defaultValue={description ?? ""} maxLength={TOURNAMENT_DESCRIPTION_MAX_LENGTH} rows={4} placeholder="Turnuvayla ilgili kısa bir açıklama" disabled={immutable} /></label>
        <label>Başlangıç tarihi<input name="startDate" type="date" defaultValue={startDate} required disabled={immutable} /></label>
        <label>Bitiş tarihi<input name="endDate" type="date" defaultValue={endDate} required disabled={immutable} /></label>
        <div className={`${styles.settingRow} ${styles.fullSettingField}`}><span>Turnuva formatı</span><span>{format === "MULTI_TEAM" ? "Çok Takımlı Lig" : format === "LEAGUE" ? "Lig" : "Eleme"}</span></div>
        <div className={`${styles.settingRow} ${styles.fullSettingField}`}><span>Durum</span><span>{status === "ACTIVE" ? "Devam ediyor" : status === "CANCELLED" ? "İptal edildi" : "Tamamlandı"}</span></div>
        <div className={`${styles.settingRow} ${styles.fullSettingField}`}><span>Katılımcı ve fikstür</span><span>Turnuva başladıktan sonra kilitli</span></div>
        <footer className={styles.settingsFooter}>
          <span aria-live="polite" data-error={Boolean(error)}>{error ?? message}</span>
          <div>
            {status === "ACTIVE" ? <Button type="button" variant="danger" onClick={() => { setCancelError(undefined); setCancelOpen(true); }} disabled={pending}>İptal Et</Button> : null}
            {status === "CANCELLED" ? <Button type="button" variant="secondary" onClick={() => setReactivateOpen(true)} disabled={pending}>Turnuvayı Yeniden Etkinleştir</Button> : null}
            <Button disabled={pending || immutable}>{immutable ? "Turnuva tamamlandı" : pending ? "Kaydediliyor…" : "Kaydet"}</Button>
          </div>
        </footer>
      </form>

      <Modal open={cancelOpen} title="Turnuvayı iptal et" onClose={() => !pending && setCancelOpen(false)}>
        <form className={styles.cancelForm} action={(formData) => {
          setCancelError(undefined);
          startTransition(async () => {
            const result = await cancelTournament(tournamentId, String(formData.get("reason") ?? ""));
            if (result.error) setCancelError(result.error);
            else {
              setCancelOpen(false);
              setMessage("Turnuva iptal edildi.");
              router.refresh();
            }
          });
        }}>
          <p>Fikstür ve sonuçlar kayıtlı kalır; turnuva iptal edildiği sürece yeni sonuç girişi yapılamaz. Gerekirse daha sonra aynı fikstürle yeniden etkinleştirebilirsiniz.</p>
          <label>İptal açıklaması <small>(zorunlu)</small><textarea name="reason" maxLength={500} rows={4} required placeholder="Katılımcılara gösterilecek kısa açıklama" /></label>
          {cancelError ? <p className={styles.cancelError} role="alert">{cancelError}</p> : null}
          <footer><Button type="button" variant="secondary" onClick={() => setCancelOpen(false)} disabled={pending}>Vazgeç</Button><Button variant="danger" disabled={pending}>{pending ? "İptal ediliyor…" : "Turnuvayı İptal Et"}</Button></footer>
        </form>
      </Modal>
      <Modal open={reactivateOpen} title="Turnuvayı yeniden etkinleştir" onClose={() => !pending && setReactivateOpen(false)}>
        <div className={styles.cancelForm}><p>Mevcut fikstür, bracket ve sonuçlar aynen korunur. Yalnızca turnuvanın durumu tekrar aktif olur.</p><footer><Button type="button" variant="secondary" onClick={() => setReactivateOpen(false)}>Vazgeç</Button><Button disabled={pending} onClick={() => startTransition(async () => { const result = await reactivateTournament(tournamentId); if (result.error) setCancelError(result.error); else { setReactivateOpen(false); router.refresh(); } })}>{pending ? "Etkinleştiriliyor…" : "Yeniden Etkinleştir"}</Button></footer>{cancelError ? <p className={styles.cancelError} role="alert">{cancelError}</p> : null}</div>
      </Modal>
    </section>
  );
}

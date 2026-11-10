"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { recordKnockoutResult, updateMatchSchedule } from "./actions";
import styles from "./tournament-detail.module.css";

export type KnockoutViewMatch = {
  id: string;
  round: number;
  stage: string;
  nameA: string;
  nameB: string;
  participantAId: string | null;
  participantBId: string | null;
  scoreA: number | null;
  scoreB: number | null;
  winnerId?: string | null;
  resultNote?: string | null;
  status: string;
  isBye: boolean;
  nextMatchId: string | null;
  scheduledAt: string | null;
  location?: string | null;
};

const stageLabel = (stage: string) => ({
  FINAL: "Final",
  SEMI_FINAL: "Yarı Final",
  QUARTER_FINAL: "Çeyrek Final",
}[stage] ?? stage.replaceAll("_", " "));

function asDateTimeLocal(value: string | null) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Date(date.getTime() - date.getTimezoneOffset() * 60_000).toISOString().slice(0, 16);
}

export function KnockoutTournamentView({ tournamentId, matches, status }: {
  tournamentId: string;
  matches: KnockoutViewMatch[];
  status: string;
}) {
  const [selected, setSelected] = useState<KnockoutViewMatch | null>(null);
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [scheduleMatchId, setScheduleMatchId] = useState("");
  const [scheduledAt, setScheduledAt] = useState("");
  const [location, setLocation] = useState("");
  const [scoreA, setScoreA] = useState("");
  const [scoreB, setScoreB] = useState("");
  const [pending, startTransition] = useTransition();

  const groups = matches.reduce<Record<number, KnockoutViewMatch[]>>((result, match) => {
    result[match.round] ??= [];
    result[match.round].push(match);
    return result;
  }, {});
  const tied = Boolean(selected && scoreA !== "" && scoreA === scoreB);

  function closeResult() {
    setSelected(null);
    setScoreA("");
    setScoreB("");
  }

  function openSchedule(match: KnockoutViewMatch) {
    setScheduleMatchId(match.id);
    setScheduledAt(asDateTimeLocal(match.scheduledAt));
    setLocation(match.location ?? "");
    setScheduleOpen(true);
  }

  return (
    <main className={styles.layout}>
      <header className={styles.header}>
        <div>
          <h2>Maçlar</h2>
          <p>Sonuçları girin; kazananlar otomatik olarak bir sonraki eşleşmeye yerleşir.</p>
        </div>
      </header>

      <div className={styles.rounds}>
        {Object.entries(groups).map(([round, roundMatches]) => (
          <details key={round} className={styles.round} open>
            <summary><strong>{stageLabel(roundMatches[0].stage)}</strong><span>{roundMatches.length} eşleşme</span></summary>
            <div className={styles.matchColumns} aria-hidden="true"><span>#</span><span>Maç</span><span>Skor / Durum</span><span>Tarih ve Saat</span><span>Konum</span><span>İşlemler</span></div>
            {roundMatches.map((match, index) => (
              <div className={styles.match} key={match.id}>
                <span>{index + 1}</span>
                <strong>{match.nameA} <b>{match.status === "COMPLETED" && match.isBye ? "BYE" : "vs"}</b> {match.nameB}</strong>
                <span>
                  {match.status === "COMPLETED"
                    ? (match.isBye ? "Tur atladı" : `${match.scoreA} - ${match.scoreB}`)
                    : match.status === "READY" ? "Sonuç bekliyor" : "Rakip bekliyor"}
                  <em data-done={match.status === "COMPLETED"}>{match.status === "COMPLETED" ? "Tamamlandı" : match.status === "READY" ? "Hazır" : "Bekliyor"}</em>
                </span>
                <span className={styles.matchDate}>{match.scheduledAt ? <time dateTime={match.scheduledAt}>{new Intl.DateTimeFormat("tr-TR", { dateStyle: "short", timeStyle: "short", timeZone: "Europe/Istanbul" }).format(new Date(match.scheduledAt))}</time> : "Tarih belirlenmedi"}</span>
                <span className={styles.matchLocation}>{match.location || "Konum belirtilmedi"}</span>
                <div className={styles.matchActions}>
                  {status === "ACTIVE" && match.status !== "COMPLETED" ? <Button type="button" variant="secondary" className={styles.resultButton} onClick={() => openSchedule(match)}>Düzenle</Button> : null}
                  {status === "ACTIVE" && match.status === "READY" ? <Button type="button" className={styles.resultButton} onClick={() => { setSelected(match); setScoreA(""); setScoreB(""); }}>Sonuç Gir</Button> : null}
                </div>
              </div>
            ))}
          </details>
        ))}
      </div>

      <Modal open={Boolean(selected)} title="Eleme Maçı Sonucu" onClose={closeResult}>
        {selected ? (
          <form className={styles.form} action={(data) => startTransition(async () => {
            const winnerId = String(data.get("winner") ?? "");
            const response = await recordKnockoutResult(tournamentId, selected.id, Number(scoreA), Number(scoreB), winnerId || null, String(data.get("note") ?? ""));
            if (!response.error) closeResult();
          })}>
            <div className={styles.modalMatchup}><strong>{selected.nameA}</strong><span>VS</span><strong>{selected.nameB}</strong></div>
            <p className={styles.formHint}>Karşılaşmanın skorunu her takım için ayrı ayrı girin.</p>
            <div className={styles.scoreFields}>
              <label><span>{selected.nameA}</span><input autoFocus name="a" value={scoreA} onChange={(event) => setScoreA(event.target.value)} type="number" min="0" placeholder="0" required /></label>
              <b>:</b>
              <label><span>{selected.nameB}</span><input name="b" value={scoreB} onChange={(event) => setScoreB(event.target.value)} type="number" min="0" placeholder="0" required /></label>
            </div>
            {tied ? (
              <fieldset>
                <legend>Skor berabere. Hangi takım tur atladı?</legend>
                <label><input name="winner" type="radio" value={selected.participantAId ?? ""} required /> {selected.nameA}</label>
                <label><input name="winner" type="radio" value={selected.participantBId ?? ""} /> {selected.nameB}</label>
              </fieldset>
            ) : null}
            <label className={styles.formField}>Maç notu <small>{tied ? "Zorunlu" : "İsteğe bağlı"}</small><textarea name="note" required={tied} placeholder={tied ? "Yönetici kararı açıklamasını girin" : "Maç hakkında bir not ekleyin"} /></label>
            <footer>
              <Button type="button" variant="secondary" onClick={closeResult}>İptal</Button>
              <Button disabled={pending}>Kaydet</Button>
            </footer>
          </form>
        ) : null}
      </Modal>

      <Modal open={scheduleOpen} title="Maç planını düzenle" onClose={() => setScheduleOpen(false)}>
        <form className={styles.form} action={() => startTransition(async () => {
          if (!scheduleMatchId) return;
          const response = await updateMatchSchedule(tournamentId, scheduleMatchId, scheduledAt ? new Date(scheduledAt).toISOString() : "", location);
          if (!response.error) setScheduleOpen(false);
        })}>
          {matches.find((match) => match.id === scheduleMatchId) ? <div className={styles.modalMatchup}><strong>{matches.find((match) => match.id === scheduleMatchId)?.nameA}</strong><span>VS</span><strong>{matches.find((match) => match.id === scheduleMatchId)?.nameB}</strong></div> : null}
          <p className={styles.formHint}>Maçın ne zaman ve nerede oynanacağını belirleyin.</p>
          <label className={styles.formField}>Tarih ve saat
            <input value={scheduledAt} onChange={(event) => setScheduledAt(event.target.value)} type="datetime-local" />
          </label>
          <label className={styles.formField}>Konum <small>İsteğe bağlı</small><input value={location} onChange={(event) => setLocation(event.target.value)} maxLength={120} placeholder="Örn. Belediye Spor Salonu" /></label>
          <p className={styles.formNote}>Boş bırakılan tarih veya konum kaldırılır.</p>
          <footer>
            <Button type="button" variant="secondary" onClick={() => setScheduleOpen(false)}>İptal</Button>
            <Button disabled={pending || !scheduleMatchId}>Planı Kaydet</Button>
          </footer>
        </form>
      </Modal>
    </main>
  );
}

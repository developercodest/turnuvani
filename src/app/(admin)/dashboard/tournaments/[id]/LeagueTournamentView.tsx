"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import type { LeagueFixture, LeagueStanding } from "@/lib/league";
import { completeLeagueTournament, recordLeagueResult, updateMatchSchedule } from "./actions";
import styles from "./tournament-detail.module.css";

type ViewMatch = LeagueFixture & {
  scoreA: number | null;
  scoreB: number | null;
  status: string;
  nameA: string;
  nameB: string;
  scheduledAt: string | null;
  location: string | null;
};

type Filter = "ALL" | "READY" | "COMPLETED";

export function LeagueTournamentView({
  tournamentId,
  matches,
  table,
  status,
  multiTeam = false,
}: {
  tournamentId: string;
  matches: ViewMatch[];
  table: LeagueStanding[];
  status: string;
  multiTeam?: boolean;
}) {
  const [filter, setFilter] = useState<Filter>("ALL");
  const [selected, setSelected] = useState<ViewMatch | null>(null);
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [scheduleMatchId, setScheduleMatchId] = useState("");
  const [scheduledAt, setScheduledAt] = useState("");
  const [location, setLocation] = useState("");
  const [pending, transition] = useTransition();
  const completed = matches.filter((match) => match.status === "COMPLETED").length;
  function selectScheduleMatch(id: string) {
    const match = matches.find((item) => item.id === id);
    setScheduleMatchId(id);
    const date = match?.scheduledAt ? new Date(match.scheduledAt) : null;
    setScheduledAt(date && !Number.isNaN(date.getTime()) ? new Date(date.getTime() - date.getTimezoneOffset() * 60_000).toISOString().slice(0, 16) : "");
    setLocation(match?.location ?? "");
  }
  const groups = matches
    .filter((match) => filter === "ALL" || match.status === filter)
    .reduce<Record<number, ViewMatch[]>>((accumulator, match) => {
      const group = multiTeam ? 0 : match.round;
      accumulator[group] = [...(accumulator[group] ?? []), match];
      return accumulator;
    }, {});

  return (
    <div className={styles.layout}>
      <main>
        <header className={styles.header}>
          <div>
            <h2>Maçlar</h2>
            <p>Fikstürü takip edin ve sonuçları girin.</p>
          </div>
        </header>

        <div className={styles.filters}>
          {([
            ["ALL", "Tüm Maçlar"],
            ["READY", "Sonuç Bekleyenler"],
            ["COMPLETED", "Tamamlananlar"],
          ] as const).map(([value, label]) => (
            <button key={value} data-active={filter === value} onClick={() => setFilter(value)}>
              {label}
            </button>
          ))}
        </div>

        <div className={styles.rounds}>
          {Object.entries(groups).map(([round, roundMatches]) => (
            <details className={styles.round} key={round} open>
              <summary>
                <strong>{multiTeam ? "Maç Sırası" : `${round}. Hafta`}</strong>
                <span>{roundMatches.length} maç</span>
              </summary>
              <div className={styles.matchColumns} aria-hidden="true"><span>#</span><span>Maç</span><span>Skor / Durum</span><span>Tarih ve Saat</span><span>Konum</span><span>İşlemler</span></div>
              {roundMatches.map((match, index) => (
                <div className={styles.match} key={match.id}>
                  <span>{index + 1}</span>
                  <strong>{match.nameA} <b>vs</b> {match.nameB}</strong>
                  <span>
                    {match.status === "COMPLETED" ? `${match.scoreA} - ${match.scoreB}` : "—"}
                    <em data-done={match.status === "COMPLETED"}>
                      {match.status === "COMPLETED" ? "Tamamlandı" : "Sonuç Bekliyor"}
                    </em>
                  </span>
                  <span className={styles.matchDate}>{match.scheduledAt ? <time dateTime={match.scheduledAt}>{new Intl.DateTimeFormat("tr-TR", { dateStyle: "short", timeStyle: "short", timeZone: "Europe/Istanbul" }).format(new Date(match.scheduledAt))}</time> : "Tarih belirlenmedi"}</span>
                  <span className={styles.matchLocation}>{match.location || "Konum belirtilmedi"}</span>
                  <div className={styles.matchActions}>
                  {status === "ACTIVE" && match.status !== "COMPLETED" ? <Button type="button" variant="secondary" className={styles.resultButton} onClick={() => { selectScheduleMatch(match.id); setScheduleOpen(true); }}>Düzenle</Button> : null}
                  {match.status !== "COMPLETED" && status === "ACTIVE" ? (
                    <Button className={styles.resultButton} onClick={() => setSelected(match)}>Sonuç Gir</Button>
                  ) : null}
                  </div>
                </div>
              ))}
            </details>
          ))}
        </div>
        {status === "ACTIVE" && completed === matches.length ? (
          <div className={styles.completionAction}>
            <Button disabled={pending || table[0]?.isTieUnresolved} onClick={() => transition(() => void completeLeagueTournament(tournamentId))}>
              Turnuvayı Tamamla
            </Button>
          </div>
        ) : null}
      </main>

      <Modal open={!!selected} title="Maç Sonucunu Gir" onClose={() => !pending && setSelected(null)}>
        {selected && (
          <form className={styles.form} action={(data) => transition(async () => {
            const result = await recordLeagueResult(tournamentId, selected.id, Number(data.get("a")), Number(data.get("b")), String(data.get("note") ?? ""), multiTeam);
            if (!result.error) setSelected(null);
          })}>
            <div className={styles.modalMatchup}><strong>{selected.nameA}</strong><span>VS</span><strong>{selected.nameB}</strong></div>
            <p className={styles.formHint}>Karşılaşmanın skorunu her takım için ayrı ayrı girin.</p>
            <div className={styles.scoreFields}><label><span>{selected.nameA}</span><input autoFocus name="a" type="number" min="0" placeholder="0" required /></label><b>:</b><label><span>{selected.nameB}</span><input name="b" type="number" min="0" placeholder="0" required /></label></div>
            <label className={styles.formField}>Maç notu <small>İsteğe bağlı</small><textarea name="note" placeholder="Maç hakkında bir not ekleyin" /></label>
            <footer><Button type="button" variant="secondary" onClick={() => setSelected(null)}>İptal</Button><Button disabled={pending}>Kaydet</Button></footer>
          </form>
        )}
      </Modal>
      <Modal open={scheduleOpen} title="Maç planını düzenle" onClose={() => !pending && setScheduleOpen(false)}>
        <form className={styles.form} action={() => transition(async () => {
          const result = await updateMatchSchedule(tournamentId, scheduleMatchId, scheduledAt ? new Date(scheduledAt).toISOString() : "", location);
          if (!result.error) setScheduleOpen(false);
        })}>
          {matches.find((match) => match.id === scheduleMatchId) ? <div className={styles.modalMatchup}><strong>{matches.find((match) => match.id === scheduleMatchId)?.nameA}</strong><span>VS</span><strong>{matches.find((match) => match.id === scheduleMatchId)?.nameB}</strong></div> : null}
          <p className={styles.formHint}>Maçın ne zaman ve nerede oynanacağını belirleyin.</p>
          <label className={styles.formField}>Tarih ve saat<input value={scheduledAt} onChange={(event) => setScheduledAt(event.target.value)} type="datetime-local" /></label>
          <label className={styles.formField}>Konum <small>İsteğe bağlı</small><input value={location} onChange={(event) => setLocation(event.target.value)} maxLength={120} placeholder="Örn. Belediye Spor Salonu" /></label>
          <p className={styles.formNote}>Boş bırakılan tarih veya konum kaldırılır.</p>
          <footer><Button type="button" variant="secondary" onClick={() => setScheduleOpen(false)}>İptal</Button><Button disabled={pending}>Planı Kaydet</Button></footer>
        </form>
      </Modal>
    </div>
  );
}

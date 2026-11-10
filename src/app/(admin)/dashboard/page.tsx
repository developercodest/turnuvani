import Link from "next/link";
import type { ReactNode } from "react";
import { Activity, ArrowRight, CalendarDays, CheckCircle2, Plus, Trophy, Users } from "lucide-react";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Match, Participant, Tournament } from "@/types";
import styles from "./dashboard.module.css";

export default async function DashboardPage() {
  const supabase = await createSupabaseServerClient();
  const [{ data: tournaments }, { data: matches }, { data: participants }] = await Promise.all([
    supabase.from("tournaments").select("id,name,format,status,updated_at").order("updated_at", { ascending: false }),
    supabase.from("matches").select("id,tournament_id,participant_a_id,participant_b_id,status,round,updated_at").order("updated_at", { ascending: false }),
    supabase.from("participants").select("id,name"),
  ]);

  const tournamentRows = (tournaments ?? []) as (Pick<Tournament, "id" | "name" | "status" | "updated_at"> & { format: Tournament["format"] | "MULTI_TEAM" })[];
  const matchRows = (matches ?? []) as Pick<Match, "id" | "tournament_id" | "participant_a_id" | "participant_b_id" | "status" | "round" | "updated_at">[];
  const participantRows = (participants ?? []) as Pick<Participant, "id" | "name">[];
  const activeTournaments = tournamentRows.filter((tournament) => tournament.status === "ACTIVE");
  const completedMatches = matchRows.filter((match) => match.status === "COMPLETED");
  const readyMatches = matchRows.filter((match) => match.status === "READY");
  const participantNames = new Map(participantRows.map((participant) => [participant.id, participant.name]));
  const tournamentNames = new Map(tournamentRows.map((tournament) => [tournament.id, tournament.name]));
  const multiTeamIds = new Set(tournamentRows.filter((tournament) => tournament.format === "MULTI_TEAM").map((tournament) => tournament.id));

  return <section className={styles.page}>
    <header className={styles.header}>
      <div><p className={styles.eyebrow}>YÖNETİM PANELİ</p><h1>Merhaba! <span aria-hidden="true">👋</span></h1><p>Turnuvalarında neler olduğunu buradan hızlıca takip edebilirsin.</p></div>
      <Link href="/dashboard/tournaments/new" className={styles.createLink}><Plus /> Yeni Turnuva Oluştur</Link>
    </header>

    <section className={styles.metrics} aria-label="Turnuva istatistikleri">
      <Metric icon={<CalendarDays />} label="Sonuç Bekleyen Maç" value={readyMatches.length} detail="Skor girişi bekliyor" tone="orange" />
      <Metric icon={<Trophy />} label="Aktif Turnuva" value={activeTournaments.length} detail="Devam eden" tone="purple" />
      <Metric icon={<CheckCircle2 />} label="Tamamlanan Maç" value={completedMatches.length} detail="Toplam sonuçlanan" tone="green" />
      <Metric icon={<Users />} label="Katılımcı" value={participantRows.length} detail="Tüm turnuvalarda" tone="blue" />
    </section>

    <div className={styles.grid}>
      <section className={styles.matchesPanel}>
        <PanelHeading title="Sonuç Bekleyen Maçlar" href="/dashboard/tournaments" />
        {readyMatches.length ? <div className={styles.matchList}>{readyMatches.slice(0, 5).map((match) => <article key={match.id} className={styles.matchRow}>
          <span className={styles.round}>#{match.round}</span><div><strong>{participantNames.get(match.participant_a_id ?? "") ?? "Katılımcı"} <small>vs</small> {participantNames.get(match.participant_b_id ?? "") ?? "Katılımcı"}</strong><p>{tournamentNames.get(match.tournament_id) ?? "Turnuva"}</p></div><Link href={`/dashboard/tournaments/${match.tournament_id}?tab=matches`}>Sonuç Gir</Link>
        </article>)}</div> : <EmptyMessage icon={<CheckCircle2 />} text="Skor girişi bekleyen maç bulunmuyor." />}
      </section>

      <section className={styles.progressPanel}>
        <PanelHeading title="Turnuva İlerlemesi" href="/dashboard/tournaments" />
        {activeTournaments.length ? <div className={styles.progressList}>{activeTournaments.slice(0, 4).map((tournament) => {
          const tournamentMatches = matchRows.filter((match) => match.tournament_id === tournament.id);
          const tournamentCompleted = tournamentMatches.filter((match) => match.status === "COMPLETED").length;
          const progress = tournamentMatches.length ? Math.round((tournamentCompleted / tournamentMatches.length) * 100) : 0;
          const awaitingApproval = progress === 100 && tournament.status === "ACTIVE";
          return <Link key={tournament.id} href={`/dashboard/tournaments/${tournament.id}`} className={styles.progressRow}><div><strong>{tournament.name}</strong><small data-review={awaitingApproval}>{awaitingApproval ? "Tüm maçlar tamamlandı · Yönetici onayı bekliyor" : tournament.format === "MULTI_TEAM" ? "Çok Takımlı Lig" : tournament.format === "LEAGUE" ? "Lig formatı" : "Eleme formatı"}</small></div><span>{progress}%</span><i><b style={{ width: `${progress}%` }} /></i></Link>;
        })}</div> : <EmptyMessage icon={<Trophy />} text="Henüz aktif turnuva yok." />}
      </section>

      <section className={styles.activityPanel}>
        <PanelHeading title="Son Tamamlanan Maçlar" />
        {completedMatches.length ? <div className={styles.activityList}>{completedMatches.slice(0, 5).map((match) => <article key={match.id}><span data-completed><CheckCircle2 /></span><p><strong>{tournamentNames.get(match.tournament_id) ?? "Turnuva"}</strong> · {multiTeamIds.has(match.tournament_id) ? "Maç tamamlandı." : `${match.round}. hafta maçı tamamlandı.`}</p></article>)}</div> : <EmptyMessage icon={<Activity />} text="Henüz tamamlanan maç bulunmuyor." />}
      </section>
    </div>
  </section>;
}

function Metric({ icon, label, value, detail, tone }: { icon: ReactNode; label: string; value: number; detail: string; tone: string }) {
  return <article className={styles.metric} data-tone={tone}><span>{icon}</span><div><small>{label}</small><strong>{value}</strong><p>{detail}</p></div></article>;
}

function PanelHeading({ title, href }: { title: string; href?: string }) {
  return <header className={styles.panelHeading}><h2>{title}</h2>{href ? <Link href={href}>Tümünü Gör <ArrowRight /></Link> : null}</header>;
}

function EmptyMessage({ icon, text }: { icon: ReactNode; text: string }) {
  return <div className={styles.empty}><span>{icon}</span><p>{text}</p></div>;
}

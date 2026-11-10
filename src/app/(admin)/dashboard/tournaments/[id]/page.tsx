import type { CSSProperties, ReactNode } from "react";
import { CheckCircle2, Clock3, Trophy, Users } from "lucide-react";
import { notFound } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { calculateStandings } from "@/lib/league";
import { presentFriendsLeague } from "@/lib/friends-league/presentation";
import type { LeagueRules, Match, Participant } from "@/types";
import { LeagueTournamentView } from "./LeagueTournamentView";
import { KnockoutTournamentView } from "./KnockoutTournamentView";
import { KnockoutBracket } from "./KnockoutBracket";
import { CompleteLeagueTournamentButton } from "./CompleteLeagueTournamentButton";
import { ParticipantTab } from "./ParticipantTab";
import { TournamentHeader } from "./TournamentHeader";
import { TournamentSettingsForm } from "./TournamentSettingsForm";
import styles from "./tournament-page.module.css";
import celebration from "./overview-celebration.module.css";
import { EmptyState } from "@/components/states";

export default async function TournamentPage({ params, searchParams }: PageProps<"/dashboard/tournaments/[id]">) {
  const { id } = await params;
  const supabase = await createSupabaseServerClient();
  const requestedTab = (await searchParams).tab;
  const tab = Array.isArray(requestedTab) ? requestedTab[0] : requestedTab;
  const activeTab = ["overview", "participants", "matches", "standings", "settings"].includes(tab ?? "") ? tab! : "overview";
  const [{ data: tournament }, { data: participants }, { data: matches }] = await Promise.all([
    supabase.from("tournaments").select("id,public_id,name,description,category,format,status,rules,start_date,end_date,champion_id").eq("id", id).single(),
    supabase.from("participants").select("*").eq("tournament_id", id),
    supabase.from("matches").select("*").eq("tournament_id", id).order("scheduled_at", { ascending: true }).order("round"),
  ]);

  if (!tournament || !participants || !matches || !["LEAGUE", "KNOCKOUT", "MULTI_TEAM"].includes(tournament.format)) notFound();

  const isMultiTeam = tournament.format === "MULTI_TEAM";
  const { data: roster } = isMultiTeam ? await supabase.from("multi_team_roster").select("id,player_id,name").eq("tournament_id", id) : { data: [] };
  if (isMultiTeam && !roster) notFound();

  const participantMap = new Map((participants as Participant[]).map((participant) => [participant.id, participant.name]));
  const rows = matches as Match[];
  const completedMatches = rows.filter((match) => match.status === "COMPLETED").length;
  const pendingMatches = rows.length - completedMatches;
  const completion = rows.length ? Math.round((completedMatches / rows.length) * 100) : 0;
  const multiView = isMultiTeam && isLeagueRules(tournament.rules) ? presentFriendsLeague(participants, roster ?? [], rows, tournament.rules) : null;
  const table = multiView?.standings ?? (tournament.format === "LEAGUE" && isLeagueRules(tournament.rules) ? calculateStandings(
    participants as Participant[],
    rows.filter((match) => match.status === "COMPLETED").map((match) => ({
      id: match.id,
      round: match.round,
      participantAId: match.participant_a_id!,
      participantBId: match.participant_b_id!,
      scoreA: match.score_a!,
      scoreB: match.score_b!,
    })),
    tournament.rules,
  ) : []);
  const leaderName = participantMap.get(tournament.champion_id ?? table[0]?.participantId ?? "");
  const date = (value: string) => new Intl.DateTimeFormat("tr-TR", { day: "numeric", month: "short", year: "numeric" }).format(new Date(`${value}T00:00:00`));
  const knockoutMatches = rows.map((match) => ({ id: match.id, round: match.round, stage: match.stage, participantAId: match.participant_a_id, participantBId: match.participant_b_id, scoreA: match.score_a, scoreB: match.score_b, winnerId: match.winner_id, resultNote: match.result_note, scheduledAt: match.scheduled_at, location: match.location, status: match.status, isBye: match.is_bye, nextMatchId: match.next_match_id, nameA: participantMap.get(match.participant_a_id ?? "") ?? "TBD", nameB: participantMap.get(match.participant_b_id ?? "") ?? "TBD" }));
  const view = tournament.format !== "KNOCKOUT" ? <LeagueTournamentView tournamentId={id} status={tournament.status} multiTeam={isMultiTeam} table={table} matches={rows.map((match) => ({
    id: match.id,
    round: match.round,
    participantAId: match.participant_a_id!,
    participantBId: match.participant_b_id!,
    scoreA: match.score_a,
    scoreB: match.score_b,
    scheduledAt: match.scheduled_at,
    location: match.location,
    status: match.status,
    nameA: multiView ? multiView.teamLabel(match.team_a_id) : participantMap.get(match.participant_a_id!) ?? "—",
    nameB: multiView ? multiView.teamLabel(match.team_b_id) : participantMap.get(match.participant_b_id!) ?? "—",
  }))} /> : <KnockoutTournamentView tournamentId={id} status={tournament.status} matches={knockoutMatches} />;

  const content = activeTab === "matches" ? view
    : activeTab === "overview" ? <Overview canComplete={!table[0]?.isTieUnresolved} completedMatches={completedMatches} completion={completion} leaderName={leaderName} participantCount={participants.length} pendingMatches={pendingMatches} status={tournament.status} totalMatches={rows.length} tournamentId={id} />
      : activeTab === "participants" ? <ParticipantTab tournamentId={id} status={tournament.status} participants={(participants as Participant[]).map(({ id: participantId, name }) => ({ id: participantId, name }))} />
    : activeTab === "standings" ? tournament.format !== "KNOCKOUT" ? <Standings table={table} participantMap={participantMap} isMultiTeam={tournament.format === "MULTI_TEAM"} /> : <KnockoutBracket matches={knockoutMatches} championName={leaderName} />
          : <TournamentSettingsForm tournamentId={id} name={tournament.name} description={tournament.description} category={tournament.category} startDate={tournament.start_date} endDate={tournament.end_date} format={tournament.format} status={tournament.status} />;

  return <section className={styles.page}><TournamentHeader name={tournament.name} publicId={tournament.public_id} format={tournament.format} status={tournament.status} participantCount={participants.length} startDate={date(tournament.start_date)} endDate={date(tournament.end_date)} activeTab={activeTab} />{content}</section>;
}


function Overview({ canComplete, completedMatches, completion, leaderName, participantCount, pendingMatches, status, totalMatches, tournamentId }: { canComplete: boolean; completedMatches: number; completion: number; leaderName: string | undefined; participantCount: number; pendingMatches: number; status: string; totalMatches: number; tournamentId: string }) {
  return <section className={styles.overview}>
    <header><h2>Genel Bakış</h2><p>Turnuvanın güncel istatistiklerini buradan takip edin.</p></header>
    <div className={styles.statCards}>
      <StatCard icon={<Trophy />} label="Toplam Maç" value={totalMatches} />
      <StatCard icon={<Clock3 />} label="Sonuç Bekleyen" value={pendingMatches} />
      <StatCard icon={<CheckCircle2 />} label="Tamamlanan Maç" value={completedMatches} />
      <StatCard icon={<Users />} label="Katılımcı" value={participantCount} />
    </div>
    {leaderName && status === "COMPLETED" ? <section className={styles.leaderCard}>
      <div className={`${styles.confetti} ${celebration.confetti}`} aria-hidden="true">{Array.from({ length: 12 }, (_, index) => <i key={index} />)}</div>
      <span><Trophy /></span><div><small>TURNUVA ŞAMPİYONU</small><h3>{leaderName}</h3><p>Turnuvayı zirvede tamamladı.</p></div>
    </section> : null}
    <section className={styles.progressCard}>
      <div className={styles.overviewCircle} style={{ "--progress": `${completion}%` } as CSSProperties}><b>%{completion}</b><small>Tamamlandı</small></div>
      <div><h3>Turnuva İlerlemesi</h3><p><strong>{completedMatches} / {totalMatches} maç</strong> tamamlandı</p><p>{pendingMatches} maç kaldı</p><div className={styles.progressBar}><span style={{ width: `${completion}%` }} /></div>{status === "ACTIVE" && completion === 100 ? <div className={styles.overviewCompletion}><p>{canComplete ? "Tüm maçlar tamamlandı. Turnuvayı yönetici onayıyla kapatabilirsiniz." : "Liderlik eşitliği çözülmeden turnuva tamamlanamaz."}</p><CompleteLeagueTournamentButton tournamentId={tournamentId} canComplete={canComplete} /></div> : null}</div>
    </section>
  </section>;
}

function StatCard({ icon, label, value }: { icon: ReactNode; label: string; value: number }) {
  return <article><span>{icon}</span><small>{label}</small><strong>{value}</strong></article>;
}

function Standings({ table, participantMap, isMultiTeam }: { table: ReturnType<typeof calculateStandings>; participantMap: Map<string, string>; isMultiTeam: boolean }) {
  if (!table.length) return <EmptyState title="Puan durumu henüz oluşmadı" description="Katılımcılar veya maç sonuçları yüklendiğinde sıralama burada gösterilir." />;
  return <section className={styles.standingsView}><header><div><h2>Puan Durumu</h2><p>Ligdeki güncel sıralama, tamamlanan maçlar sonrasında otomatik hesaplanır.</p></div><span>{isMultiTeam ? "Çok Takımlı Lig" : "Lig Formatı"}</span></header><div className={styles.fullStandings}><table><thead><tr><th>#</th><th>{isMultiTeam ? "Oyuncu" : "Takım"}</th><th>O</th><th>G</th><th>B</th><th>M</th><th>A</th><th>Y</th><th>AV</th><th>P</th></tr></thead><tbody>{table.map((row) => <tr key={row.participantId}><td><b data-rank={row.rank}>{row.rank}</b></td><td><strong>{participantMap.get(row.participantId)}</strong>{row.isTieUnresolved ? <small>Eşitlik sürüyor</small> : null}</td><td>{row.played}</td><td>{row.won}</td><td>{row.drawn}</td><td>{row.lost}</td><td>{row.scoreFor}</td><td>{row.scoreAgainst}</td><td>{row.scoreDifference > 0 ? "+" : ""}{row.scoreDifference}</td><td><strong>{row.points}</strong></td></tr>)}</tbody></table></div><footer><span>O: Oynanan · G: Galibiyet · B: Beraberlik · M: Mağlubiyet · A/Y: Atılan/Yenilen · AV: Averaj · P: Puan</span></footer></section>;
}

function isLeagueRules(value: unknown): value is LeagueRules {
  return Boolean(value && typeof value === "object" && "drawAllowed" in value);
}

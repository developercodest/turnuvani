import Link from "next/link";
import type { ReactNode } from "react";
import { CalendarDays, CheckCircle2, CircleDot, Clock3, MapPin, Trophy, Users } from "lucide-react";
import { notFound } from "next/navigation";
import { TurnuvaniMark } from "@/components/brand/TurnuvaniMark";
import { calculateStandings } from "@/lib/league";
import { presentFriendsLeague } from "@/lib/friends-league/presentation";
import { createPublicSupabaseClient } from "@/lib/supabase/public";
import type { LeagueRules, Match, Participant } from "@/types";
import { KnockoutBracket } from "@/app/(admin)/dashboard/tournaments/[id]/KnockoutBracket";
import { PublicTournamentTabs } from "./PublicTournamentTabs";
import styles from "./public-tournament.module.css";

const date = (value: string) => new Intl.DateTimeFormat("tr-TR", { day: "numeric", month: "long", year: "numeric" }).format(new Date(`${value}T00:00:00`));

export default async function PublicTournamentPage({ params }: PageProps<"/t/[publicId]">) {
  const { publicId } = await params;
  const supabase = createPublicSupabaseClient();
  const { data: tournament } = await supabase
    .from("tournaments")
    .select("id,public_id,name,description,category,format,status,start_date,end_date,champion_id,rules,cancellation_reason")
    .eq("public_id", publicId)
    .single();
  if (!tournament || !["LEAGUE", "KNOCKOUT", "MULTI_TEAM"].includes(tournament.format)) notFound();
  const isMultiTeam = tournament.format === "MULTI_TEAM";

  const [{ data: participants }, { data: matches }] = await Promise.all([
    supabase.from("participants").select("id,tournament_id,name").eq("tournament_id", tournament.id),
    isMultiTeam
      ? supabase.from("matches").select("id,tournament_id,participant_a_id,participant_b_id,team_a_id,team_b_id,score_a,score_b,winner_id,status,is_bye,round,stage,next_match_id,next_match_slot,scheduled_at,location,result_note").eq("tournament_id", tournament.id).order("scheduled_at", { ascending: true }).order("round")
      : supabase.from("matches").select("id,tournament_id,participant_a_id,participant_b_id,score_a,score_b,winner_id,status,is_bye,round,stage,next_match_id,next_match_slot,scheduled_at,location,result_note").eq("tournament_id", tournament.id).order("scheduled_at", { ascending: true }).order("round"),
  ]);
  if (!participants || !matches) notFound();

  const participantMap = new Map((participants as Pick<Participant, "id" | "name">[]).map((participant) => [participant.id, participant.name]));
  const rows = matches as Pick<Match, "id" | "participant_a_id" | "participant_b_id" | "team_a_id" | "team_b_id" | "score_a" | "score_b" | "winner_id" | "status" | "is_bye" | "round" | "stage" | "next_match_id" | "scheduled_at" | "location" | "result_note">[];
  const { data: roster } = isMultiTeam ? await supabase.from("multi_team_roster").select("id,player_id,name").eq("tournament_id", tournament.id) : { data: [] };
  if (isMultiTeam && (!roster || !isLeagueRules(tournament.rules))) notFound();
  const multi = isMultiTeam && isLeagueRules(tournament.rules) ? presentFriendsLeague(participants, roster ?? [], rows, tournament.rules) : null;
  const fixtureNames = multi ? new Map((roster ?? []).map((team) => [team.id, multi.teamLabel(team.id)])) : participantMap;
  const fixtureRows = multi ? rows.map((match) => ({ ...match, participant_a_id: match.team_a_id, participant_b_id: match.team_b_id })) : rows;
  const publicFormat = tournament.format === "KNOCKOUT" ? "KNOCKOUT" : "LEAGUE";
  const completed = rows.filter((match) => match.status === "COMPLETED").length;
  const championName = participantMap.get(tournament.champion_id ?? "");
  const knockoutMatches = rows.map((match) => ({ id: match.id, round: match.round, stage: match.stage, participantAId: match.participant_a_id, participantBId: match.participant_b_id, scoreA: match.score_a, scoreB: match.score_b, winnerId: match.winner_id, resultNote: match.result_note, scheduledAt: match.scheduled_at, status: match.status, isBye: match.is_bye, nextMatchId: match.next_match_id, nameA: participantMap.get(match.participant_a_id ?? "") ?? "TBD", nameB: participantMap.get(match.participant_b_id ?? "") ?? "TBD" }));

  return <main className={styles.page}>
    <header className={styles.topbar}><Link href="/" className={styles.brand}><TurnuvaniMark /> <strong>Turnuvani</strong></Link><Link href="/login?next=/dashboard/tournaments/new" className={styles.createLink}>Kendi turnuvanı oluştur</Link></header>
    <section className={styles.hero}>
      <span data-completed={tournament.status === "COMPLETED"} data-cancelled={tournament.status === "CANCELLED"}>{tournament.status === "COMPLETED" ? "Tamamlandı" : tournament.status === "CANCELLED" ? "İptal edildi" : "Devam ediyor"}</span>
      <h1>{tournament.name}</h1>
      {tournament.description ? <p>{tournament.description}</p> : null}
      <div className={styles.metadata}><span><CircleDot />{tournament.category ?? "Turnuva"}</span><span><Users />{participants.length} katılımcı</span><span><Trophy />{isMultiTeam ? "Çok Takımlı Lig" : publicFormat === "LEAGUE" ? "Lig" : "Eleme"}</span><span><CalendarDays />{date(tournament.start_date)} – {date(tournament.end_date)}</span></div>
    </section>
    {tournament.status === "CANCELLED" ? <section className={styles.cancelledNotice}><strong>Bu turnuva iptal edildi.</strong><p>{tournament.cancellation_reason ?? "Turnuva yöneticisi tarafından iptal edildi."}</p></section> : null}
    <section className={styles.content}>
      <PublicTournamentTabs
        overview={<PublicOverview description={tournament.description} category={tournament.category} format={publicFormat} isMultiTeam={isMultiTeam} startDate={tournament.start_date} endDate={tournament.end_date} participants={participants as Pick<Participant, "id" | "name">[]} completedMatches={completed} totalMatches={rows.length} status={tournament.status} championName={championName} />}
        view={<><header className={styles.sectionHeader}><div><p>CANLI TURNUVA GÖRÜNÜMÜ</p><h2>{publicFormat === "KNOCKOUT" ? "Eleme Ağacı" : "Puan Durumu"}</h2></div><span>{completed} / {rows.length} maç tamamlandı</span></header>{publicFormat === "KNOCKOUT" ? <KnockoutBracket matches={knockoutMatches} championName={championName} showHeader={false} animateCelebration={false} publicView /> : <PublicLeagueView participants={participants as Pick<Participant, "id" | "name">[]} matches={rows} rules={tournament.rules} standings={multi?.standings} />}</>}
        fixtures={<PublicFixtures matches={fixtureRows} participants={fixtureNames} format={publicFormat} isMultiTeam={isMultiTeam} />}
      />
    </section>
    <footer className={styles.footer}><TurnuvaniMark /><span>Turnuvani ile oluşturuldu</span></footer>
  </main>;
}

function PublicOverview({ description, category, format, isMultiTeam, startDate, endDate, participants, completedMatches, totalMatches, status, championName }: { description: string | null; category: string | null; format: "LEAGUE" | "KNOCKOUT"; isMultiTeam: boolean; startDate: string; endDate: string; participants: Pick<Participant, "id" | "name">[]; completedMatches: number; totalMatches: number; status: string; championName?: string }) {
  const progress = totalMatches ? Math.round((completedMatches / totalMatches) * 100) : 0;
  return <div className={styles.overview}>
    <article className={styles.aboutCard}>
      <p>TURNOVA HAKKINDA</p>
      <h2>Turnuva detayları</h2>
      <p className={styles.aboutDescription}>{description || "Bu turnuva için henüz bir açıklama paylaşılmadı."}</p>
      <dl className={styles.detailsGrid}>
        <div><dt>Spor dalı</dt><dd>{category ?? "Belirtilmedi"}</dd></div>
        <div><dt>Format</dt><dd>{isMultiTeam ? "Çok Takımlı Lig" : format === "LEAGUE" ? "Lig usulü" : "Eleme usulü"}</dd></div>
        <div><dt>Katılımcı</dt><dd>{participants.length} {isMultiTeam ? "oyuncu" : "takım"}</dd></div>
        <div><dt>Tarih</dt><dd>{date(startDate)} – {date(endDate)}</dd></div>
      </dl><section className={styles.participantSection}><h3>Katılımcılar</h3><ol>{participants.map((participant, index) => <li key={participant.id}><b>{index + 1}</b><PublicAvatar name={participant.name} /><span>{participant.name}</span></li>)}</ol></section>
    </article>
    <aside className={styles.summaryCard}>
      <p>TURNUVA DURUMU</p>
      <h2>{status === "COMPLETED" ? "Turnuva tamamlandı" : "Turnuva devam ediyor"}</h2>
      <div className={styles.progressTrack}><span style={{ width: `${progress}%` }} /></div>
      <strong>%{progress} <small>{completedMatches} / {totalMatches} maç tamamlandı</small></strong>
      {championName ? <div className={styles.championSummary}><Trophy /> <span>Şampiyon<strong>{championName}</strong></span></div> : null}
    </aside>
  </div>;
}

function PublicLeagueView({ participants, matches, rules, standings }: { participants: Pick<Participant, "id" | "name">[]; matches: Pick<Match, "id" | "participant_a_id" | "participant_b_id" | "score_a" | "score_b" | "status" | "round">[]; rules: unknown; standings?: ReturnType<typeof calculateStandings> }) {
  if (!isLeagueRules(rules)) return null;
  const table = standings ?? calculateStandings(participants as Participant[], matches.filter((match) => match.status === "COMPLETED" && match.participant_a_id && match.participant_b_id && match.score_a !== null && match.score_b !== null).map((match) => ({ id: match.id, round: match.round, participantAId: match.participant_a_id!, participantBId: match.participant_b_id!, scoreA: match.score_a!, scoreB: match.score_b! })), rules);
  return <div className={styles.standings}><table><thead><tr><th>#</th><th>{standings ? "Oyuncu" : "Takım"}</th><th>O</th><th>G</th><th>B</th><th>M</th><th>AV</th><th>P</th></tr></thead><tbody>{table.map((row) => { const name = participants.find((participant) => participant.id === row.participantId)?.name ?? "?"; return <tr key={row.participantId}><td>{row.rank}</td><td><span className={styles.teamName}><PublicAvatar name={name} />{name}</span></td><td>{row.played}</td><td>{row.won}</td><td>{row.drawn}</td><td>{row.lost}</td><td>{row.scoreDifference}</td><td><strong>{row.points}</strong></td></tr>; })}</tbody></table></div>;
}

function isLeagueRules(value: unknown): value is LeagueRules { return Boolean(value && typeof value === "object" && "drawAllowed" in value); }

function PublicFixtures({ matches, participants, format, isMultiTeam }: { matches: Pick<Match, "id" | "participant_a_id" | "participant_b_id" | "score_a" | "score_b" | "status" | "is_bye" | "round" | "stage" | "scheduled_at" | "location" | "result_note">[]; participants: Map<string, string>; format: "LEAGUE" | "KNOCKOUT"; isMultiTeam: boolean }) {
  const bySchedule = (a: typeof matches[number], b: typeof matches[number]) => (a.scheduled_at ?? "9999-12-31").localeCompare(b.scheduled_at ?? "9999-12-31") || a.round - b.round;
  const finished = matches.filter((match) => match.status === "COMPLETED").sort(bySchedule);
  const upcoming = matches.filter((match) => match.status !== "COMPLETED").sort(bySchedule);

  return <section className={styles.fixtureSection} aria-label="Fikstür ve sonuçlar">
    <header className={styles.fixtureHeader}><div><p>MAÇ TAKVİMİ</p><h2>Fikstür ve Sonuçlar</h2><span>Oynanan maçların skorlarını, sıradaki eşleşmeleri takip edin.</span></div><div className={styles.fixtureSummary}><span>{finished.length} sonuçlandı</span><span>{upcoming.length} sırada</span></div></header>
    <div className={styles.fixtureGrid}>
      <FixtureColumn title="Sonuçlanan Maçlar" icon={<CheckCircle2 />} emptyText="Henüz sonuçlanan maç bulunmuyor." matches={finished} participants={participants} format={format} isMultiTeam={isMultiTeam} completed />
      <FixtureColumn title="Sıradaki Maçlar" icon={<Clock3 />} emptyText="Bekleyen maç bulunmuyor." matches={upcoming} participants={participants} format={format} isMultiTeam={isMultiTeam} />
    </div>
  </section>;
}

function FixtureColumn({ title, icon, emptyText, matches, participants, format, isMultiTeam, completed = false }: { title: string; icon: ReactNode; emptyText: string; matches: Pick<Match, "id" | "participant_a_id" | "participant_b_id" | "score_a" | "score_b" | "status" | "is_bye" | "round" | "stage" | "scheduled_at" | "location" | "result_note">[]; participants: Map<string, string>; format: "LEAGUE" | "KNOCKOUT"; isMultiTeam: boolean; completed?: boolean }) {
  return <article className={styles.fixtureCard}>
    <header><h3>{icon}{title}</h3><span>{matches.length}</span></header>
    {matches.length ? <div className={styles.fixtureList}>{matches.map((match) => <FixtureRow key={match.id} match={match} participants={participants} format={format} isMultiTeam={isMultiTeam} completed={completed} />)}</div> : <p className={styles.fixtureEmpty}>{emptyText}</p>}
  </article>;
}

function FixtureRow({ match, participants, format, isMultiTeam, completed }: { match: Pick<Match, "id" | "participant_a_id" | "participant_b_id" | "score_a" | "score_b" | "status" | "is_bye" | "round" | "stage" | "scheduled_at" | "location" | "result_note">; participants: Map<string, string>; format: "LEAGUE" | "KNOCKOUT"; isMultiTeam: boolean; completed: boolean }) {
  const nameA = participants.get(match.participant_a_id ?? "") ?? (match.is_bye ? "BYE" : "Belirlenecek");
  const nameB = participants.get(match.participant_b_id ?? "") ?? "Belirlenecek";
  const scoreAvailable = match.score_a !== null && match.score_b !== null;

  return <div className={styles.fixtureRow}>
    <div className={styles.fixtureRowMeta}><span>{isMultiTeam ? "Maç" : matchLabel(match.stage, match.round, format)}</span>{match.scheduled_at ? <time dateTime={match.scheduled_at}>{fixtureDate(match.scheduled_at)}</time> : <span>Tarih belirlenmedi</span>}</div>
    <div className={styles.fixtureMatch}>
      <strong><span className={styles.fixtureTeam}><PublicAvatar name={nameA} />{nameA}</span></strong>
      {scoreAvailable ? <b>{match.score_a} <i>–</i> {match.score_b}</b> : <em>VS</em>}
      <strong><span className={styles.fixtureTeam}><PublicAvatar name={nameB} />{nameB}</span></strong>
    </div>
    {match.location ? <p className={styles.fixtureLocation}><MapPin aria-hidden="true" /> <span>{match.location}</span></p> : null}
    <div className={styles.fixtureState} data-completed={completed}>{completed ? "Tamamlandı" : match.is_bye ? "Otomatik tur" : "Yaklaşan maç"}</div>
    {completed && match.result_note ? <p className={styles.fixtureNote}>{match.result_note}</p> : null}
  </div>;
}

function PublicAvatar({ name }: { name: string }) {
  const colors = ["#2563eb", "#db6b40", "#138a72", "#60a5fa", "#2879bd", "#b57a12"];
  const index = [...name].reduce((total, character) => total + character.charCodeAt(0), 0) % colors.length;
  return <span className={styles.avatar} style={{ backgroundColor: colors[index] }}>{name.trim().charAt(0).toLocaleUpperCase("tr-TR") || "?"}</span>;
}

function matchLabel(stage: string, round: number, format: "LEAGUE" | "KNOCKOUT") {
  if (format === "LEAGUE") return `${round}. hafta`;
  if (stage === "FINAL") return "Final";
  if (stage === "SEMI_FINAL") return "Yarı final";
  if (stage === "QUARTER_FINAL") return "Çeyrek final";
  if (stage.startsWith("ROUND_OF_")) return `Son ${stage.slice("ROUND_OF_".length)}`;
  return stage.replaceAll("_", " ");
}

function fixtureDate(value: string) {
  return new Intl.DateTimeFormat("tr-TR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }).format(new Date(value));
}

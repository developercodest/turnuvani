import Link from "next/link";
import { EmptyState } from "@/components/states/EmptyState";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { TournamentCatalog, type TournamentCatalogItem } from "./TournamentCatalog";
import styles from "./tournaments.module.css";

export default async function TournamentsPage() {
  const supabase = await createSupabaseServerClient();
  const [{ data: tournaments }, { data: matches }, { data: participants }] = await Promise.all([
    supabase.from("tournaments").select("id,name,description,category,format,status,start_date,end_date,created_at").order("created_at", { ascending: false }),
    supabase.from("matches").select("tournament_id,status"),
    supabase.from("participants").select("tournament_id"),
  ]);

  if (!tournaments?.length) {
    return <section className={styles.page}><EmptyState
      title="Henüz turnuvan yok"
      description="İlk turnuvanı oluşturarak katılımcılarını ekleyebilir, maçlarını takip edebilir ve sonuçları paylaşabilirsin."
      action={<Link href="/dashboard/tournaments/new" className={styles.emptyAction}>İlk turnuvamı oluştur →</Link>}
      className={styles.emptyState}
    /></section>;
  }

  const matchStats = new Map<string, { total: number; completed: number }>();
  for (const match of matches ?? []) {
    const current = matchStats.get(match.tournament_id) ?? { total: 0, completed: 0 };
    current.total += 1;
    if (match.status === "COMPLETED") current.completed += 1;
    matchStats.set(match.tournament_id, current);
  }
  const participantCounts = new Map<string, number>();
  for (const participant of participants ?? []) participantCounts.set(participant.tournament_id, (participantCounts.get(participant.tournament_id) ?? 0) + 1);

  const items: TournamentCatalogItem[] = tournaments.map((tournament) => {
    const stats = matchStats.get(tournament.id) ?? { total: 0, completed: 0 };
    return {
      id: tournament.id,
      name: tournament.name,
      description: tournament.description,
      category: tournament.category,
      format: tournament.format,
      status: tournament.status,
      startDate: tournament.start_date,
      endDate: tournament.end_date,
      createdAt: tournament.created_at,
      participantCount: participantCounts.get(tournament.id) ?? 0,
      completedMatches: stats.completed,
      totalMatches: stats.total,
    };
  });

  return <TournamentCatalog tournaments={items} />;
}

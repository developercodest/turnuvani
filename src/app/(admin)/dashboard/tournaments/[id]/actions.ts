"use server";
import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { calculateStandings } from "@/lib/league";
import { TOURNAMENT_DESCRIPTION_MAX_LENGTH, TOURNAMENT_NAME_MAX_LENGTH } from "@/lib/tournament-text-limits";
import type { LeagueRules, Match, Participant } from "@/types";

type TournamentDetails = {
  name: string;
  description: string;
  category: string;
  startDate: string;
  endDate: string;
};

const tournamentCategories = new Set(["Futbol", "Basketbol", "Voleybol", "Diğer"]);

export async function updateTournamentDetails(tournamentId: string, details: TournamentDetails) {
  const name = details.name.trim();
  const description = details.description.trim();
  const category = details.category.trim();
  if (!name || details.name.length > TOURNAMENT_NAME_MAX_LENGTH) return { error: `Turnuva adı 1–${TOURNAMENT_NAME_MAX_LENGTH} karakter olmalıdır.` };
  if (details.description.length > TOURNAMENT_DESCRIPTION_MAX_LENGTH) return { error: `Açıklama en fazla ${TOURNAMENT_DESCRIPTION_MAX_LENGTH} karakter olabilir.` };
  if (category && !tournamentCategories.has(category)) return { error: "Geçerli bir spor dalı seçin." };
  if (!details.startDate || !details.endDate || details.endDate < details.startDate) return { error: "Bitiş tarihi başlangıç tarihinden önce olamaz." };

  const supabase = await createSupabaseServerClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const ownerId = claimsData?.claims?.sub;
  if (!ownerId) return { error: "Bu değişiklik için oturum açmalısınız." };

  const { data: tournament, error: tournamentError } = await supabase
    .from("tournaments")
    .select("owner_id,status")
    .eq("id", tournamentId)
    .single();
  if (tournamentError || !tournament || tournament.owner_id !== ownerId) return { error: "Bu turnuvayı güncelleme yetkiniz yok." };
  if (tournament.status === "COMPLETED") return { error: "Tamamlanan turnuvalar değiştirilemez." };

  const { error } = await supabase
    .from("tournaments")
    .update({
      name,
      description: description || null,
      category: category || null,
      start_date: details.startDate,
      end_date: details.endDate,
      updated_at: new Date().toISOString(),
    })
    .eq("id", tournamentId)
    .eq("owner_id", ownerId);
  if (error) return { error: "Turnuva bilgileri kaydedilemedi. Lütfen tekrar deneyin." };

  revalidatePath(`/dashboard/tournaments/${tournamentId}`);
  revalidatePath("/dashboard/tournaments");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function cancelTournament(tournamentId: string, reason: string) {
  const normalizedReason = reason.trim();
  if (!normalizedReason) return { error: "İptal açıklaması zorunludur." };
  if (normalizedReason.length > 500) return { error: "İptal açıklaması en fazla 500 karakter olabilir." };

  const supabase = await createSupabaseServerClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const ownerId = claimsData?.claims?.sub;
  if (!ownerId) return { error: "Bu işlem için oturum açmalısınız." };

  const { error } = await supabase.rpc("set_tournament_cancelled", { p_tournament_id: tournamentId, p_cancelled: true, p_reason: normalizedReason });
  if (error) return { error: "Turnuva iptal edilemedi. Turnuva durumu değişmiş olabilir." };

  revalidatePath(`/dashboard/tournaments/${tournamentId}`);
  revalidatePath("/dashboard/tournaments");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function reactivateTournament(tournamentId: string) {
  const supabase = await createSupabaseServerClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const ownerId = claimsData?.claims?.sub;
  if (!ownerId) return { error: "Bu işlem için oturum açmalısınız." };
  const { error } = await supabase.rpc("set_tournament_cancelled", { p_tournament_id: tournamentId, p_cancelled: false, p_reason: null });
  if (error) return { error: "Yalnızca iptal edilmiş turnuvalar yeniden etkinleştirilebilir." };
  revalidatePath(`/dashboard/tournaments/${tournamentId}`);
  revalidatePath("/dashboard/tournaments");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function renameActiveParticipant(tournamentId: string, participantId: string, name: string) {
  const normalizedName = name.trim();
  if (!normalizedName || normalizedName.length > 50) return { error: "Katılımcı adı 1–50 karakter olmalıdır." };
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.rpc("rename_active_tournament_participant", { p_participant_id: participantId, p_name: normalizedName });
  if (error) return { error: "İsim güncellenemedi. Aynı isimde başka bir katılımcı olabilir." };
  revalidatePath(`/dashboard/tournaments/${tournamentId}`);
  return {};
}

export async function recordLeagueResult(tournamentId: string, matchId: string, scoreA: number, scoreB: number, note: string, multiTeam = false) {
  if (!Number.isInteger(scoreA) || !Number.isInteger(scoreB) || scoreA < 0 || scoreB < 0) return { error: "Skorlar sıfır veya daha büyük tam sayı olmalıdır." };
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.rpc(multiTeam ? "record_multi_team_result" : "record_league_result", { p_match_id: matchId, p_score_a: scoreA, p_score_b: scoreB, p_note: note.trim() || null });
  if (error) return { error: "Sonuç kaydedilemedi. Maç daha önce sonuçlanmış olabilir." };
  revalidatePath(`/dashboard/tournaments/${tournamentId}`);
  return {};
}

export async function updateMatchSchedule(tournamentId: string, matchId: string, scheduledAt: string, location: string) {
  const trimmedLocation = location.trim();
  if (trimmedLocation.length > 120) return { error: "Konum en fazla 120 karakter olabilir." };
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.rpc("update_match_schedule", { p_match_id: matchId, p_scheduled_at: scheduledAt || null, p_location: trimmedLocation || null });
  if (error) return { error: "Maç planı kaydedilemedi." };
  revalidatePath(`/dashboard/tournaments/${tournamentId}`);
  revalidatePath("/t/[publicId]", "page");
  return {};
}

export async function recordKnockoutResult(tournamentId: string, matchId: string, scoreA: number, scoreB: number, winnerId: string | null, note: string) {
  if (!Number.isInteger(scoreA) || !Number.isInteger(scoreB) || scoreA < 0 || scoreB < 0) return { error: "Skorlar sıfır veya daha büyük tam sayı olmalıdır." };
  if (scoreA === scoreB && !winnerId) return { error: "Beraberlikte tur atlayan takımı seçin." };
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.rpc("record_knockout_result", { p_match_id: matchId, p_score_a: scoreA, p_score_b: scoreB, p_winner_id: winnerId, p_note: note.trim() || null });
  if (error) return { error: "Sonuç kaydedilemedi. Beraberlikte geçecek takımı seçtiğinizden emin olun." };
  revalidatePath(`/dashboard/tournaments/${tournamentId}`); revalidatePath("/dashboard/tournaments"); return {};
}

export async function completeLeagueTournament(tournamentId: string) {
  const supabase = await createSupabaseServerClient();
  const [{ data: tournament }, { data: participants }, { data: matches }] = await Promise.all([
    supabase.from("tournaments").select("rules,format").eq("id", tournamentId).single(),
    supabase.from("participants").select("*").eq("tournament_id", tournamentId),
    supabase.from("matches").select("*").eq("tournament_id", tournamentId),
  ]);
  if (!tournament || !participants || !matches || !isLeagueRules(tournament.rules) || matches.some((match) => match.status !== "COMPLETED")) return { error: "Turnuvayı tamamlamak için tüm maçların sonucu girilmelidir." };
  if (tournament.format === "MULTI_TEAM") {
    const { error } = await supabase.rpc("complete_multi_team_tournament", { p_tournament_id: tournamentId });
    if (error) return { error: "Turnuva tamamlanamadı; tüm maçları ve liderlik eşitliğini kontrol edin." };
    revalidatePath(`/dashboard/tournaments/${tournamentId}`);
    revalidatePath("/dashboard/tournaments");
    revalidatePath("/t/[publicId]", "page");
    return {};
  }
  const table = calculateStandings(participants as Participant[], (matches as Match[]).map((match) => ({ id: match.id, round: match.round, participantAId: match.participant_a_id!, participantBId: match.participant_b_id!, scoreA: match.score_a!, scoreB: match.score_b! })), tournament.rules);
  if (!table[0] || table[0].isTieUnresolved) return { error: "Liderlik eşitliği çözülemediği için şampiyon atanamaz." };
  const { error } = await supabase.rpc("complete_league_tournament", { p_tournament_id: tournamentId, p_champion_id: table[0].participantId });
  if (error) return { error: "Turnuva tamamlanamadı. Lütfen verileri yenileyip tekrar deneyin." };
  revalidatePath(`/dashboard/tournaments/${tournamentId}`);
  revalidatePath("/dashboard/tournaments");
  return {};
}
function isLeagueRules(value: unknown): value is LeagueRules { return Boolean(value && typeof value === "object" && "drawAllowed" in value); }

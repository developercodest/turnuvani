"use server";

import { revalidatePath } from "next/cache";
import { generateLeagueFixtures } from "@/lib/league";
import { generateKnockoutBracket } from "@/lib/knockout";
import { prepareFriendsLeague } from "@/lib/friends-league/prepare";
import { distributeMatchDates } from "@/lib/match-schedule";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { KnockoutRules, LeagueRules } from "@/types";
import type { TournamentWizardDraft } from "@/features/tournament-wizard/useTournamentWizardState";
import { TOURNAMENT_DESCRIPTION_MAX_LENGTH, TOURNAMENT_NAME_MAX_LENGTH } from "@/lib/tournament-text-limits";

type StartResult = { error?: string; tournamentId?: string };

export async function startMultiTeamTournament(draft: TournamentWizardDraft): Promise<StartResult> {
  if (draft.format !== "MULTI_TEAM" || !isLeagueRules(draft.rules)) return { error: "Turnuva formatı veya puanlama kuralları geçerli değil." };
  const name = draft.basicInfo.name.trim();
  if (!name || draft.basicInfo.name.length > TOURNAMENT_NAME_MAX_LENGTH || draft.basicInfo.description.length > TOURNAMENT_DESCRIPTION_MAX_LENGTH) return { error: "Turnuva adı veya açıklaması geçerli değil." };
  const supabase = await createSupabaseServerClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  if (!claimsData?.claims?.sub) return { error: "Turnuvayı başlatmak için oturum açmalısınız." };
  let payload;
  try {
    payload = prepareFriendsLeague({ players: draft.players, rules: draft.rules, startDate: draft.basicInfo.startDate, endDate: draft.basicInfo.endDate || draft.basicInfo.startDate });
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Oyuncu ve takım bilgileri geçerli değil." };
  }
  const { data, error } = await supabase.rpc("start_multi_team_tournament", {
    p_name: name, p_description: draft.basicInfo.description.trim() || null,
    p_category: draft.basicInfo.category.trim() || null, p_start_date: draft.basicInfo.startDate,
    p_end_date: draft.basicInfo.endDate || draft.basicInfo.startDate,
    p_rules: payload.rules, p_players: payload.players, p_fixtures: payload.fixtures,
  });
  if (error || !data) return { error: "Turnuva başlatılamadı. Lütfen tekrar deneyin." };
  revalidatePath("/dashboard/tournaments");
  return { tournamentId: data };
}

function isLeagueRules(value: unknown): value is LeagueRules {
  if (!value || typeof value !== "object" || !("drawAllowed" in value)) return false;
  const rules = value as LeagueRules;
  return typeof rules.drawAllowed === "boolean" && typeof rules.homeAway === "boolean"
    && [rules.winPoints, rules.drawPoints, rules.lossPoints].every((point) => Number.isInteger(point) && point >= 0);
}

function validateDraft(draft: TournamentWizardDraft): string | undefined {
  if (!draft.basicInfo.name.trim() || !draft.basicInfo.startDate) return "Turnuva adı ve başlangıç tarihi zorunludur.";
  if (draft.basicInfo.name.length > TOURNAMENT_NAME_MAX_LENGTH || draft.basicInfo.description.length > TOURNAMENT_DESCRIPTION_MAX_LENGTH) return "Turnuva adı veya açıklaması geçerli değil.";
  if (draft.basicInfo.endDate && draft.basicInfo.endDate < draft.basicInfo.startDate) return "Bitiş tarihi başlangıç tarihinden önce olamaz.";
  if (draft.participants.length < 2) return "Turnuva için en az iki katılımcı gerekir.";
  if (draft.format === "LEAGUE" && !isLeagueRules(draft.rules)) return "Lig puanlama kuralları geçerli değil.";
  if (draft.format === "KNOCKOUT" && !isKnockoutRules(draft.rules)) return "Eleme kuralları geçerli değil.";
}
function isKnockoutRules(value: unknown): value is KnockoutRules { return Boolean(value && typeof value === "object" && "bracketType" in value && "tieBreaker" in value); }

export async function startLeagueTournament(draft: TournamentWizardDraft): Promise<StartResult> {
  if (draft.format !== "LEAGUE") return { error: "Geçersiz turnuva formatı." };
  const validationError = validateDraft(draft);
  if (validationError) return { error: validationError };
  // Kept adjacent to use so TypeScript and the runtime both retain the narrowing.
  if (!isLeagueRules(draft.rules)) return { error: "Lig puanlama kuralları geçerli değil." };
  const rules = draft.rules;
  const supabase = await createSupabaseServerClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  if (!claimsData?.claims?.sub) return { error: "Turnuvayı başlatmak için oturum açmalısınız." };

  const ids = new Set<string>();
  const participants = draft.participants.map((participant) => ({ id: crypto.randomUUID(), name: participant.name.trim() }));
  for (const participant of participants) {
    const normalized = participant.name.replace(/\s+/g, " ").toLocaleLowerCase("tr-TR");
    if (!participant.name || ids.has(normalized)) return { error: "Katılımcı isimleri boş veya yinelenen olamaz." };
    ids.add(normalized);
  }
  const fixtures = distributeMatchDates(generateLeagueFixtures(participants, { homeAway: rules.homeAway }), draft.basicInfo.startDate, draft.basicInfo.endDate || draft.basicInfo.startDate);
  const { data, error } = await supabase.rpc("start_league_tournament", {
    p_name: draft.basicInfo.name.trim(), p_description: draft.basicInfo.description.trim() || null,
    p_category: draft.basicInfo.category.trim() || null, p_start_date: draft.basicInfo.startDate,
    p_end_date: draft.basicInfo.endDate || draft.basicInfo.startDate, p_rules: rules,
    p_participants: participants, p_fixtures: fixtures,
  });
  if (error || !data) return { error: "Turnuva başlatılamadı. Lütfen tekrar deneyin." };
  revalidatePath("/dashboard/tournaments");
  return { tournamentId: data };
}

export async function startKnockoutTournament(draft: TournamentWizardDraft): Promise<StartResult> {
  const validationError = validateDraft(draft);
  if (validationError || draft.format !== "KNOCKOUT" || !isKnockoutRules(draft.rules)) return { error: validationError ?? "Eleme kuralları geçerli değil." };
  if (!draft.rules.singleMatch) return { error: "Çift ayaklı eleme serileri henüz desteklenmiyor; tek maçlı eleme seçin." };
  const participants = draft.participants.map((participant) => ({ id: crypto.randomUUID(), name: participant.name.trim() }));
  if (new Set(participants.map((item) => item.name.toLocaleLowerCase("tr-TR"))).size !== participants.length || participants.some((item) => !item.name)) return { error: "Katılımcı isimleri boş veya yinelenen olamaz." };
  let bracket;
  try { bracket = distributeMatchDates(generateKnockoutBracket(participants), draft.basicInfo.startDate, draft.basicInfo.endDate || draft.basicInfo.startDate); } catch { return { error: "Eleme ağacı oluşturulamadı." }; }
  const bracketType = (participants.length & (participants.length - 1)) === 0 ? "STANDARD" : "BYE";
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.rpc("start_knockout_tournament", { p_name: draft.basicInfo.name.trim(), p_description: draft.basicInfo.description.trim() || null, p_category: draft.basicInfo.category.trim() || null, p_start_date: draft.basicInfo.startDate, p_end_date: draft.basicInfo.endDate || draft.basicInfo.startDate, p_rules: { ...draft.rules, bracketType }, p_participants: participants, p_bracket: bracket });
  if (error || !data) return { error: "Eleme turnuvası başlatılamadı. Lütfen tekrar deneyin." };
  revalidatePath("/dashboard/tournaments");
  return { tournamentId: data };
}

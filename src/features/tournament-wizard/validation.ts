import type { KnockoutRules, LeagueRules } from "@/types";
import type { TournamentWizardDraft } from "./useTournamentWizardState";
import { TOURNAMENT_DESCRIPTION_MAX_LENGTH, TOURNAMENT_NAME_MAX_LENGTH } from "@/lib/tournament-text-limits";

export type BasicInfoErrors = Partial<Record<keyof TournamentWizardDraft["basicInfo"], string>>;

export function normalizeParticipantName(name: string) {
  return name.trim().replace(/\s+/g, " ").toLocaleLowerCase("tr-TR");
}

export function validateBasicInfo(basicInfo: TournamentWizardDraft["basicInfo"]): BasicInfoErrors {
  const errors: BasicInfoErrors = {};

  if (!basicInfo.name.trim()) errors.name = "Turnuva adı zorunludur.";
  else if (basicInfo.name.length > TOURNAMENT_NAME_MAX_LENGTH) errors.name = `Turnuva adı en fazla ${TOURNAMENT_NAME_MAX_LENGTH} karakter olabilir.`;
  if (basicInfo.description.length > TOURNAMENT_DESCRIPTION_MAX_LENGTH) errors.description = `Açıklama en fazla ${TOURNAMENT_DESCRIPTION_MAX_LENGTH} karakter olabilir.`;
  if (!basicInfo.startDate) errors.startDate = "Başlangıç tarihi zorunludur.";
  if (basicInfo.startDate && basicInfo.endDate && basicInfo.endDate < basicInfo.startDate) {
    errors.endDate = "Bitiş tarihi başlangıç tarihinden önce olamaz.";
  }

  return errors;
}

export function hasValidLeagueRules(rules: LeagueRules) {
  const points = [rules.winPoints, rules.lossPoints, ...(rules.drawAllowed ? [rules.drawPoints] : [])];
  return points.every((point) => Number.isInteger(point) && point >= 0);
}

export function hasValidPlayers(players: TournamentWizardDraft["players"]) {
  return players.length >= 2 && players[0].teams.length > 0 && players.every((player) => player.name.trim() && player.teams.length === players[0].teams.length && player.teams.every((team) => team.name.trim())) && new Set(players.map((player) => normalizeParticipantName(player.name))).size === players.length;
}
export function hasValidPlayerNames(players: TournamentWizardDraft["players"]) {
  return players.length >= 2 && players.every((player) => player.name.trim()) && new Set(players.map((player) => normalizeParticipantName(player.name))).size === players.length;
}

export function hasValidKnockoutRules(rules: KnockoutRules) {
  return (rules.bracketType === "STANDARD" || rules.bracketType === "BYE")
    && (rules.tieBreaker === "EXTRA_TIME" || rules.tieBreaker === "PENALTIES" || rules.tieBreaker === "ORGANIZER");
}

import { calculateFriendsStandings, type FriendsPlayer } from "./engine";
import type { LeagueRules } from "@/types";

export type RosterRow = { id: string; player_id: string; name: string };
export type FriendsMatchRow = { id: string; round: number; team_a_id: string | null; team_b_id: string | null; score_a: number | null; score_b: number | null; status: string };

/** Shared by the admin and public tournament views. */
export function presentFriendsLeague(players: { id: string; name: string }[], roster: RosterRow[], matches: FriendsMatchRow[], rules: LeagueRules) {
  const teams = new Map(roster.map((team) => [team.id, team]));
  const owners = new Map(players.map((player) => [player.id, player.name]));
  const grouped: FriendsPlayer[] = players.map((player) => ({ ...player, teams: roster.filter((team) => team.player_id === player.id).map(({ id, name }) => ({ id, name })) }));
  const results = matches.filter((match) => match.status === "COMPLETED").map((match) => {
    if (!match.team_a_id || !match.team_b_id || match.score_a === null || match.score_b === null) throw new Error("Tamamlanan maçın takım veya skor bilgisi eksik.");
    return { id: match.id, round: match.round, participantAId: match.team_a_id, participantBId: match.team_b_id, scoreA: match.score_a, scoreB: match.score_b };
  });
  const teamLabel = (id: string | null) => {
    const team = id ? teams.get(id) : undefined;
    if (!team || !owners.has(team.player_id)) return "Belirlenemedi";
    return `${team.name} (${owners.get(team.player_id)})`;
  };
  return { standings: calculateFriendsStandings(grouped, results, rules), teamLabel };
}

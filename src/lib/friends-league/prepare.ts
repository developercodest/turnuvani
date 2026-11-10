import { generateFriendsFixtures, type FriendsPlayer } from "./engine";
import { distributeMatchDates } from "@/lib/match-schedule";
import type { LeagueRules } from "@/types";

type Input = { players: FriendsPlayer[]; rules: LeagueRules; startDate: string; endDate: string };

/** Build a self-contained, validated payload for the eventual atomic database operation. */
export function prepareFriendsLeague(input: Input, options: { idFactory?: () => string; random?: () => number } = {}) {
  const idFactory = options.idFactory ?? (() => crypto.randomUUID());
  const normalize = (name: string) => name.trim().replace(/\s+/g, " ").toLocaleLowerCase("tr-TR");
  const validDate = (date: string) => /^\d{4}-\d{2}-\d{2}$/.test(date) && !Number.isNaN(Date.parse(`${date}T00:00:00Z`)) && new Date(`${date}T00:00:00Z`).toISOString().slice(0, 10) === date;
  if (!validDate(input.startDate) || !validDate(input.endDate) || input.endDate < input.startDate) throw new Error("Turnuva tarihleri geçerli değil.");
  if (input.rules.drawAllowed !== true || input.rules.homeAway !== false || ![input.rules.winPoints, input.rules.drawPoints, input.rules.lossPoints].every((point) => Number.isSafeInteger(point) && point >= 0)) throw new Error("Puanlama kuralları geçerli değil.");
  const names = input.players.map((player) => normalize(player.name));
  if (names.some((name) => !name) || new Set(names).size !== names.length) throw new Error("Oyuncu isimleri boş veya yinelenen olamaz.");
  const players = input.players.map((player) => {
    const teamNames = player.teams.map((team) => normalize(team.name));
    if (teamNames.some((name) => !name) || new Set(teamNames).size !== teamNames.length) throw new Error("Bir oyuncunun takım isimleri boş veya yinelenen olamaz.");
    return { id: idFactory(), name: player.name.trim().replace(/\s+/g, " "), teams: player.teams.map((team) => ({ id: idFactory(), name: team.name.trim().replace(/\s+/g, " ") })) };
  });
  // All games start in one session; the stored sequence still breaks date ties.
  const fixtures = distributeMatchDates(generateFriendsFixtures(players, { idFactory, random: options.random }), input.startDate, input.startDate);
  return { players, fixtures, rules: { ...input.rules } };
}

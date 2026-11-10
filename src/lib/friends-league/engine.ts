import { calculateStandings, type LeagueFixture, type LeagueResult, type LeagueStanding } from "@/lib/league";
import type { LeagueRules } from "@/types";

export type FriendsPlayer = { id: string; name: string; teams: { id: string; name: string }[] };

function validate(players: FriendsPlayer[]) {
  if (players.length < 2 || players[0].teams.length < 1 || players.some((player) => player.teams.length !== players[0].teams.length)) throw new Error("En az iki oyuncu ve her oyuncu için eşit sayıda takım gerekir.");
  if (players.some((player) => !player.id || !player.name.trim() || player.teams.some((team) => !team.id || !team.name.trim()))) throw new Error("Oyuncu ve takım bilgileri boş olamaz.");
  if (new Set(players.map((player) => player.id)).size !== players.length || new Set(players.flatMap((player) => player.teams.map((team) => team.id))).size !== players.reduce((sum, player) => sum + player.teams.length, 0)) throw new Error("Oyuncu ve takım kimlikleri benzersiz olmalıdır.");
}

export function generateFriendsFixtures(players: FriendsPlayer[], options: { random?: () => number; idFactory?: () => string } = {}): LeagueFixture[] {
  validate(players);
  const random = options.random ?? Math.random;
  const idFactory = options.idFactory ?? (() => crypto.randomUUID());
  const result: LeagueFixture[] = [];
  for (let i = 0; i < players.length; i++) for (let j = i + 1; j < players.length; j++) {
    const teams = [...players[j].teams];
    for (let k = teams.length - 1; k > 0; k--) {
      const target = Math.floor(random() * (k + 1));
      [teams[k], teams[target]] = [teams[target], teams[k]];
    }
    players[i].teams.forEach((team, index) => result.push({ id: idFactory(), round: 1, participantAId: team.id, participantBId: teams[index].id }));
  }
  for (let i = result.length - 1; i > 0; i--) {
    const target = Math.floor(random() * (i + 1));
    [result[i], result[target]] = [result[target], result[i]];
  }
  return result.map((match, index) => ({ ...match, round: index + 1 }));
}

export function calculateFriendsStandings(players: FriendsPlayer[], results: LeagueResult[], rules: LeagueRules): LeagueStanding[] {
  validate(players);
  const owners = new Map(players.flatMap((player) => player.teams.map((team) => [team.id, player.id] as const)));
  const resultIds = new Set<string>();
  const playerResults = results.map((result) => {
    const ownerA = owners.get(result.participantAId);
    const ownerB = owners.get(result.participantBId);
    if (!result.id || resultIds.has(result.id) || !ownerA || !ownerB || ownerA === ownerB ||
        !Number.isInteger(result.scoreA) || result.scoreA < 0 || !Number.isInteger(result.scoreB) || result.scoreB < 0) {
      throw new Error("Maç sonuçları benzersiz, geçerli ve farklı oyunculara ait olmalıdır.");
    }
    resultIds.add(result.id);
    return { ...result, participantAId: ownerA, participantBId: ownerB };
  });
  return calculateStandings(players.map(({ id, name }) => ({ id, name })), playerResults, rules);
}

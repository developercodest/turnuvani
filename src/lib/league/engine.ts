import type { LeagueRules } from "@/types";

export type LeagueParticipantInput = { id: string; name: string };

export type LeagueFixture = {
  id: string;
  round: number;
  participantAId: string;
  participantBId: string;
};

export type LeagueResult = LeagueFixture & {
  scoreA: number;
  scoreB: number;
};

export type LeagueStanding = {
  participantId: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  points: number;
  scoreFor: number;
  scoreAgainst: number;
  scoreDifference: number;
  rank: number;
  /** True where every specified tie-breaker still leaves teams equal. */
  isTieUnresolved: boolean;
};

export type FixtureOptions = {
  /** A supplied randomizer makes start-time shuffling testable. */
  random?: () => number;
  homeAway?: boolean;
  idFactory?: () => string;
};

function assertParticipants(participants: LeagueParticipantInput[]) {
  if (participants.length < 2) throw new Error("Lig fikstürü için en az iki katılımcı gerekir.");
  const ids = new Set(participants.map((participant) => participant.id));
  if (ids.size !== participants.length || participants.some((participant) => !participant.id || !participant.name.trim())) {
    throw new Error("Katılımcı kimlikleri ve isimleri benzersiz ve dolu olmalıdır.");
  }
}

function shuffle<T>(items: T[], random: () => number) {
  const result = [...items];
  for (let index = result.length - 1; index > 0; index -= 1) {
    const target = Math.floor(random() * (index + 1));
    [result[index], result[target]] = [result[target], result[index]];
  }
  return result;
}

/** Circle-method round robin. A synthetic BYE is never returned as a match. */
export function generateLeagueFixtures(participants: LeagueParticipantInput[], options: FixtureOptions = {}): LeagueFixture[] {
  assertParticipants(participants);
  const random = options.random ?? Math.random;
  const idFactory = options.idFactory ?? (() => crypto.randomUUID());
  const BYE = "__BYE__";
  const seeded = shuffle(participants.map((participant) => participant.id), random);
  const slots = seeded.length % 2 === 0 ? seeded : [...seeded, BYE];
  const rounds = slots.length - 1;
  const matches: LeagueFixture[] = [];
  let rotation = [...slots];

  for (let round = 1; round <= rounds; round += 1) {
    for (let pair = 0; pair < slots.length / 2; pair += 1) {
      const left = rotation[pair];
      const right = rotation[rotation.length - 1 - pair];
      if (left !== BYE && right !== BYE) {
        const swapHome = pair === 0 ? round % 2 === 0 : round % 2 === 1;
        matches.push({
          id: idFactory(), round,
          participantAId: swapHome ? right : left,
          participantBId: swapHome ? left : right,
        });
      }
    }
    rotation = [rotation[0], rotation[rotation.length - 1], ...rotation.slice(1, -1)];
  }

  if (!options.homeAway) return matches;
  return [...matches, ...matches.map((match) => ({
    ...match, id: idFactory(), round: match.round + rounds,
    participantAId: match.participantBId, participantBId: match.participantAId,
  }))];
}

function statsFor(participants: LeagueParticipantInput[], results: LeagueResult[], rules: LeagueRules) {
  const stats = new Map(participants.map((participant) => [participant.id, {
    participantId: participant.id, played: 0, won: 0, drawn: 0, lost: 0, points: 0, scoreFor: 0, scoreAgainst: 0,
  }]));
  for (const result of results) {
    const a = stats.get(result.participantAId);
    const b = stats.get(result.participantBId);
    if (!a || !b || result.participantAId === result.participantBId || result.scoreA < 0 || result.scoreB < 0 || !Number.isInteger(result.scoreA) || !Number.isInteger(result.scoreB)) continue;
    a.played += 1; b.played += 1; a.scoreFor += result.scoreA; a.scoreAgainst += result.scoreB; b.scoreFor += result.scoreB; b.scoreAgainst += result.scoreA;
    if (result.scoreA > result.scoreB) { a.won += 1; b.lost += 1; a.points += rules.winPoints; b.points += rules.lossPoints; }
    else if (result.scoreB > result.scoreA) { b.won += 1; a.lost += 1; b.points += rules.winPoints; a.points += rules.lossPoints; }
    else if (rules.drawAllowed) { a.drawn += 1; b.drawn += 1; a.points += rules.drawPoints; b.points += rules.drawPoints; }
  }
  return stats;
}

function compareNumber(left: number, right: number) { return right - left; }

/** Points, H2H mini-table, score difference, score for, then score against. */
export function calculateStandings(participants: LeagueParticipantInput[], results: LeagueResult[], rules: LeagueRules): LeagueStanding[] {
  assertParticipants(participants);
  const overall = statsFor(participants, results, rules);
  const groups = new Map<number, LeagueParticipantInput[]>();
  for (const participant of participants) groups.set(overall.get(participant.id)!.points, [...(groups.get(overall.get(participant.id)!.points) ?? []), participant]);
  const ordered: Array<LeagueStanding & { h2hPoints: number; h2hDifference: number; h2hFor: number }> = [];
  for (const [, group] of [...groups.entries()].sort(([a], [b]) => b - a)) {
    const memberIds = new Set(group.map((participant) => participant.id));
    const mini = statsFor(group, results.filter((result) => memberIds.has(result.participantAId) && memberIds.has(result.participantBId)), rules);
    const groupRows = group.map((participant) => {
      const row = overall.get(participant.id)!; const h2h = mini.get(participant.id)!;
      return { ...row, scoreDifference: row.scoreFor - row.scoreAgainst, h2hPoints: h2h.points, h2hDifference: h2h.scoreFor - h2h.scoreAgainst, h2hFor: h2h.scoreFor, rank: 0, isTieUnresolved: false };
    }).sort((a, b) => compareNumber(a.h2hPoints, b.h2hPoints) || compareNumber(a.h2hDifference, b.h2hDifference) || compareNumber(a.h2hFor, b.h2hFor) || compareNumber(a.scoreDifference, b.scoreDifference) || compareNumber(a.scoreFor, b.scoreFor) || a.scoreAgainst - b.scoreAgainst);
    ordered.push(...groupRows);
  }
  let currentRank = 0;
  return ordered.map((row, index, rows) => {
    const prior = rows[index - 1];
    const next = rows[index + 1];
    const equals = (other: typeof row | undefined) => Boolean(other && row.points === other.points && row.h2hPoints === other.h2hPoints && row.h2hDifference === other.h2hDifference && row.h2hFor === other.h2hFor && row.scoreDifference === other.scoreDifference && row.scoreFor === other.scoreFor && row.scoreAgainst === other.scoreAgainst);
    const sameAsPrior = equals(prior);
    const unresolved = sameAsPrior || equals(next);
    if (!sameAsPrior) currentRank = index + 1;
    return { participantId: row.participantId, played: row.played, won: row.won, drawn: row.drawn, lost: row.lost, points: row.points, scoreFor: row.scoreFor, scoreAgainst: row.scoreAgainst, scoreDifference: row.scoreDifference, rank: currentRank, isTieUnresolved: unresolved };
  });
}

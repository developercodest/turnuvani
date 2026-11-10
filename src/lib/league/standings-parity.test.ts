import { readFileSync } from "node:fs";
import { test } from "node:test";
import { strict as assert } from "node:assert";
import { calculateStandings } from "./engine";
import { calculateFriendsStandings } from "../friends-league/engine";
import type { LeagueRules } from "@/types";

type Case = { name: string; rules: LeagueRules; scores: [number, number, number, number][]; winner: number | null };
const cases = JSON.parse(readFileSync(new URL("./standings-parity-cases.json", import.meta.url), "utf8")) as Case[];
const participants = [0, 1, 2].map((id) => ({ id: String(id), name: `Player ${id}` }));
for (const scenario of cases) test(`shared standings scenario: ${scenario.name}`, () => {
  const results = scenario.scores.map(([a, b, scoreA, scoreB], index) => ({ id: String(index), round: 1, participantAId: String(a), participantBId: String(b), scoreA, scoreB }));
  const first = calculateStandings(participants, results, scenario.rules)[0];
  assert.equal(first.isTieUnresolved ? null : Number(first.participantId), scenario.winner);
});

for (const scenario of cases.filter((item) => item.rules.drawAllowed)) test(`shared multi-team standings scenario: ${scenario.name}`, () => {
  const players = participants.map((participant) => ({ ...participant, teams: [{ id: `team-${participant.id}`, name: `Team ${participant.id}` }] }));
  const results = scenario.scores.map(([a, b, scoreA, scoreB], index) => ({ id: String(index), round: 1, participantAId: `team-${a}`, participantBId: `team-${b}`, scoreA, scoreB }));
  const first = calculateFriendsStandings(players, results, scenario.rules)[0];
  assert.equal(first.isTieUnresolved ? null : Number(first.participantId), scenario.winner);
});

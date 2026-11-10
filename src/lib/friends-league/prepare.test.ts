import { test } from "node:test";
import { strict as assert } from "node:assert";
import { prepareFriendsLeague } from "./prepare";

const input = {
  players: ["A", "B", "C"].map((name) => ({ id: name, name, teams: ["Bir", "İki"].map((team) => ({ id: name + team, name: team })) })),
  rules: { drawAllowed: true, homeAway: false, winPoints: 3, drawPoints: 1, lossPoints: 0 },
  startDate: "2026-10-20", endDate: "2026-10-22",
};

test("preparation assigns fresh ids and schedules every match in one session", () => {
  let id = 0;
  const result = prepareFriendsLeague(input, { idFactory: () => `new-${id++}`, random: () => 0 });
  assert.equal(result.fixtures.length, 6);
  const teamIds = new Set(result.players.flatMap((player) => player.teams.map((team) => team.id)));
  assert.ok(result.fixtures.every((match) => teamIds.has(match.participantAId) && teamIds.has(match.participantBId)));
  assert.equal(result.fixtures[0].scheduledAt, "2026-10-20T12:00:00.000Z");
  assert.ok(result.fixtures.every((match) => match.scheduledAt === "2026-10-20T12:00:00.000Z"));
});

test("preparation rejects invalid dates, rules, and duplicate names", () => {
  assert.throws(() => prepareFriendsLeague({ ...input, endDate: "2026-02-30" }));
  assert.throws(() => prepareFriendsLeague({ ...input, rules: { ...input.rules, homeAway: true } }));
  assert.throws(() => prepareFriendsLeague({ ...input, players: [input.players[0], { ...input.players[1], name: " a " }] }));
  assert.throws(() => prepareFriendsLeague({ ...input, players: [{ ...input.players[0], teams: [{ id: "1", name: "Takım" }, { id: "2", name: " takım " }] }, input.players[1]] }));
});

import { test } from "node:test";
import { strict as assert } from "node:assert";
import { calculateFriendsStandings, generateFriendsFixtures, type FriendsPlayer } from "./engine";

const players: FriendsPlayer[] = ["a", "b", "c"].map((id) => ({ id, name: id, teams: Array.from({ length: 5 }, (_, i) => ({ id: `${id}${i}`, name: `${id}${i}` })) }));
const rules = { drawAllowed: true, winPoints: 3, drawPoints: 1, lossPoints: 0, homeAway: false };

test("three players with five teams produce five matches per player pair", () => {
  let id = 0;
  const matches = generateFriendsFixtures(players, { random: () => 0.5, idFactory: () => `${id++}` });
  assert.equal(matches.length, 15);
  for (const [a, b] of [["a", "b"], ["a", "c"], ["b", "c"]]) {
    const pairMatches = matches.filter((match) => match.participantAId[0] === a && match.participantBId[0] === b);
    assert.equal(pairMatches.length, 5);
    assert.equal(new Set(pairMatches.map((match) => match.participantAId)).size, 5);
    assert.equal(new Set(pairMatches.map((match) => match.participantBId)).size, 5);
  }
  assert.deepEqual(matches.map((match) => match.round), Array.from({ length: 15 }, (_, i) => i + 1));
  assert.ok(matches.slice(0, 5).some((match) => match.participantAId[0] !== "a" || match.participantBId[0] !== "b"));
});

test("points are credited to team owners", () => {
  const standings = calculateFriendsStandings(players, [{ id: "1", round: 1, participantAId: "a0", participantBId: "b0", scoreA: 2, scoreB: 1 }], rules);
  assert.equal(standings.find((row) => row.participantId === "a")?.points, 3);
  assert.equal(standings.find((row) => row.participantId === "b")?.points, 0);
});

test("players must select the same number of teams", () => {
  assert.throws(() => generateFriendsFixtures([players[0], { ...players[1], teams: players[1].teams.slice(0, 4) }]));
});

test("draws and configurable points are credited to owners", () => {
  const standings = calculateFriendsStandings(players, [
    { id: "1", round: 1, participantAId: "a0", participantBId: "b0", scoreA: 2, scoreB: 2 },
    { id: "2", round: 2, participantAId: "c0", participantBId: "a1", scoreA: 0, scoreB: 1 },
  ], { ...rules, winPoints: 5, drawPoints: 2, lossPoints: 1 });
  assert.equal(standings.find((row) => row.participantId === "a")?.points, 7);
  assert.equal(standings.find((row) => row.participantId === "b")?.points, 2);
  assert.equal(standings.find((row) => row.participantId === "c")?.points, 1);
});

test("invalid or repeated results are rejected instead of silently omitted", () => {
  const match = { id: "1", round: 1, participantAId: "a0", participantBId: "b0", scoreA: 1, scoreB: 0 };
  assert.throws(() => calculateFriendsStandings(players, [match, match], rules));
  assert.throws(() => calculateFriendsStandings(players, [{ ...match, participantBId: "missing" }], rules));
  assert.throws(() => calculateFriendsStandings(players, [{ ...match, participantBId: "a1" }], rules));
  assert.throws(() => calculateFriendsStandings(players, [{ ...match, scoreA: -1 }], rules));
});

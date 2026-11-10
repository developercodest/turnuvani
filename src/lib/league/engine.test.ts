import assert from "node:assert/strict";
import test from "node:test";
import { calculateStandings, generateLeagueFixtures } from "./engine";

const teams = ["A", "B", "C", "D"].map((id) => ({ id, name: id }));
const rules = { winPoints: 3, drawPoints: 1, lossPoints: 0, drawAllowed: true, homeAway: false };
const ids = (count: number) => Array.from({ length: count }, (_, index) => ({ id: String.fromCharCode(65 + index), name: String.fromCharCode(65 + index) }));

test("single round robin produces N*(N-1)/2 unique matches", () => {
  const fixtures = generateLeagueFixtures(teams, { random: () => 0, idFactory: (() => { let i = 0; return () => `m-${++i}`; })() });
  assert.equal(fixtures.length, 6);
  assert.equal(new Set(fixtures.map((match) => [match.participantAId, match.participantBId].sort().join("/"))).size, 6);
});
test("odd leagues omit BYE matches", () => assert.equal(generateLeagueFixtures(teams.slice(0, 3), { random: () => 0 }).length, 3));
test("two participants generate one fixture", () => {
  const fixtures = generateLeagueFixtures(ids(2), { random: () => 0 });
  assert.equal(fixtures.length, 1);
  assert.deepEqual(new Set(fixtures[0] ? [fixtures[0].participantAId, fixtures[0].participantBId] : []), new Set(["A", "B"]));
});
test("three participants each play twice without a BYE fixture", () => {
  const fixtures = generateLeagueFixtures(ids(3), { random: () => 0 });
  assert.equal(fixtures.length, 3);
  for (const participant of ids(3)) assert.equal(fixtures.filter((fixture) => fixture.participantAId === participant.id || fixture.participantBId === participant.id).length, 2);
});
test("five participant single round robin has N*(N-1)/2 fixtures", () => assert.equal(generateLeagueFixtures(ids(5), { random: () => 0 }).length, 10));
test("double round robin schedules the reverse fixture in the second half", () => {
  const fixtures = generateLeagueFixtures(teams, { homeAway: true, random: () => 0, idFactory: (() => { let i = 0; return () => `m-${++i}`; })() });
  assert.equal(fixtures.length, 12);
  for (const fixture of fixtures.slice(0, 6)) {
    assert.ok(fixtures.slice(6).some((returnFixture) => returnFixture.participantAId === fixture.participantBId && returnFixture.participantBId === fixture.participantAId && returnFixture.round === fixture.round + 3));
  }
});
test("circular head-to-head equality falls back to score difference", () => {
  const table = calculateStandings(teams.slice(0, 3), [
    { id: "1", round: 1, participantAId: "A", participantBId: "B", scoreA: 1, scoreB: 0 },
    { id: "2", round: 1, participantAId: "B", participantBId: "C", scoreA: 2, scoreB: 0 },
    { id: "3", round: 1, participantAId: "C", participantBId: "A", scoreA: 2, scoreB: 0 },
  ], rules);
  assert.deepEqual(table.map(({ participantId, rank }) => [participantId, rank]), [["B", 1], ["C", 2], ["A", 3]]);
});
test("a draw grants each participant the configured draw points", () => {
  const table = calculateStandings(ids(2), [{ id: "1", round: 1, participantAId: "A", participantBId: "B", scoreA: 2, scoreB: 2 }], rules);
  assert.deepEqual(table.map(({ participantId, points, drawn }) => [participantId, points, drawn]), [["A", 1, 1], ["B", 1, 1]]);
});
test("score difference resolves a tied mini-table when head-to-head is level", () => {
  const table = calculateStandings(ids(3), [
    { id: "1", round: 1, participantAId: "A", participantBId: "B", scoreA: 2, scoreB: 1 },
    { id: "2", round: 1, participantAId: "B", participantBId: "C", scoreA: 3, scoreB: 0 },
    { id: "3", round: 1, participantAId: "C", participantBId: "A", scoreA: 1, scoreB: 0 },
  ], rules);
  assert.deepEqual(table.map(({ participantId, rank }) => [participantId, rank]), [["B", 1], ["A", 2], ["C", 3]]);
});
test("a complete multi-way tie shares rank and remains unresolved", () => {
  const table = calculateStandings(ids(3), [
    { id: "1", round: 1, participantAId: "A", participantBId: "B", scoreA: 1, scoreB: 0 },
    { id: "2", round: 1, participantAId: "B", participantBId: "C", scoreA: 1, scoreB: 0 },
    { id: "3", round: 1, participantAId: "C", participantBId: "A", scoreA: 1, scoreB: 0 },
  ], rules);
  assert.ok(table.every((row) => row.rank === 1 && row.isTieUnresolved));
});
test("correcting a result recalculates standings from the corrected score", () => {
  const initial = calculateStandings(ids(2), [{ id: "1", round: 1, participantAId: "A", participantBId: "B", scoreA: 1, scoreB: 0 }], rules);
  const corrected = calculateStandings(ids(2), [{ id: "1", round: 1, participantAId: "A", participantBId: "B", scoreA: 0, scoreB: 2 }], rules);
  assert.equal(initial[0]?.participantId, "A");
  assert.equal(corrected[0]?.participantId, "B");
});

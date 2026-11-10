import { test } from "node:test";
import { strict as assert } from "node:assert";
import { presentFriendsLeague } from "./presentation";

test("match labels identify team owners while standings rank players", () => {
  const players = [{ id: "a", name: "Ada" }, { id: "b", name: "Bora" }];
  const teams = [{ id: "1", player_id: "a", name: "Mavi" }, { id: "2", player_id: "b", name: "Kırmızı" }];
  const matches = [{ id: "m", round: 1, team_a_id: "1", team_b_id: "2", score_a: 2, score_b: 1, status: "COMPLETED" }];
  const result = presentFriendsLeague(players, teams, matches, { drawAllowed: true, homeAway: false, winPoints: 3, drawPoints: 1, lossPoints: 0 });
  assert.equal(result.teamLabel("1"), "Mavi (Ada)");
  assert.equal(result.standings[0].participantId, "a");
  assert.equal(result.standings[0].points, 3);
});

test("incomplete finished results are not silently included", () => {
  assert.throws(() => presentFriendsLeague([{ id: "a", name: "A" }, { id: "b", name: "B" }], [{ id: "1", player_id: "a", name: "A" }, { id: "2", player_id: "b", name: "B" }], [{ id: "m", round: 1, team_a_id: "1", team_b_id: "2", score_a: null, score_b: 1, status: "COMPLETED" }], { drawAllowed: true, homeAway: false, winPoints: 3, drawPoints: 1, lossPoints: 0 }));
});

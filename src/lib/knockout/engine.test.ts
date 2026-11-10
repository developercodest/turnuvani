import assert from "node:assert/strict";
import test from "node:test";
import { generateKnockoutBracket, nextPowerOfTwo, requiredByeCount } from "./engine";

test("nextPowerOfTwo rounds up and preserves exact powers", () => {
  assert.equal(nextPowerOfTwo(3), 4);
  assert.equal(nextPowerOfTwo(5), 8);
  assert.equal(nextPowerOfTwo(6), 8);
  assert.equal(nextPowerOfTwo(7), 8);
  assert.equal(nextPowerOfTwo(8), 8);
  assert.equal(nextPowerOfTwo(10), 16);
  assert.equal(nextPowerOfTwo(20), 32);
});

test("requiredByeCount fills the next bracket size", () => {
  assert.equal(requiredByeCount(5), 3);
  assert.equal(requiredByeCount(8), 0);
});

test("a non-power-of-two bracket is complete and every BYE advances a participant", () => {
  const bracket = generateKnockoutBracket(["A", "B", "C", "D", "E"].map((name) => ({ id: name, name })));
  assert.equal(bracket.length, 7);
  assert.equal(bracket.filter((match) => match.round === 1).length, 4);
  assert.equal(bracket.filter((match) => match.isBye).length, 3);
  assert.ok(bracket.filter((match) => match.isBye).every((match) => Boolean(match.participantAId || match.participantBId)));
});

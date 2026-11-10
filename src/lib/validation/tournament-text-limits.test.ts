import assert from "node:assert/strict";
import test from "node:test";
import { validateBasicInfo } from "../../features/tournament-wizard/validation";
import { TOURNAMENT_DESCRIPTION_MAX_LENGTH, TOURNAMENT_NAME_MAX_LENGTH } from "../tournament-text-limits";

test("tournament text accepts its limits and rejects longer restored drafts", () => {
  const info = { name: "a".repeat(TOURNAMENT_NAME_MAX_LENGTH), description: "b".repeat(TOURNAMENT_DESCRIPTION_MAX_LENGTH), category: "", startDate: "2026-11-20", endDate: "" };
  assert.deepEqual(validateBasicInfo(info), {});
  const errors = validateBasicInfo({ ...info, name: `${info.name}a`, description: `${info.description}b` });
  assert.match(errors.name ?? "", /100/);
  assert.match(errors.description ?? "", /500/);
});

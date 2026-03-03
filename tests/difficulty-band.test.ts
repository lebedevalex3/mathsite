import test from "node:test";
import assert from "node:assert/strict";

import { normalizeDifficultyBand } from "@/lib/tasks/difficulty-band";

test("normalizeDifficultyBand prioritizes difficulty_band over legacy difficulty", () => {
  assert.equal(normalizeDifficultyBand({ difficulty_band: "C", difficulty: 1 }), "C");
});

test("normalizeDifficultyBand maps legacy difficulty 1..5 to A/B/C", () => {
  assert.equal(normalizeDifficultyBand({ difficulty: 1 }), "A");
  assert.equal(normalizeDifficultyBand({ difficulty: 2 }), "A");
  assert.equal(normalizeDifficultyBand({ difficulty: 3 }), "B");
  assert.equal(normalizeDifficultyBand({ difficulty: 4 }), "C");
  assert.equal(normalizeDifficultyBand({ difficulty: 5 }), "C");
});

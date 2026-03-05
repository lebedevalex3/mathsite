import assert from "node:assert/strict";
import test from "node:test";

import {
  buildSkillReadyCoverage,
  checkSkillReadyGateFromCoverage,
  SKILL_READY_MIN_TASKS,
} from "@/src/lib/admin/quality-gates";
import type { Task } from "@/lib/tasks/schema";

test("buildSkillReadyCoverage counts only ready tasks for target skill", () => {
  const tasks = [
    {
      id: "math.proportion.find_unknown_term.000001",
      topic_id: "math.proportion",
      skill_id: "math.proportion.find_unknown_term",
      difficulty: 1,
      difficulty_band: "A",
      status: "ready",
      statement_md: "A",
      answer: { type: "number", value: 1 },
    },
    {
      id: "math.proportion.find_unknown_term.000002",
      topic_id: "math.proportion",
      skill_id: "math.proportion.find_unknown_term",
      difficulty: 2,
      difficulty_band: "B",
      status: "review",
      statement_md: "B",
      answer: { type: "number", value: 2 },
    },
    {
      id: "math.proportion.find_unknown_term.000003",
      topic_id: "math.proportion",
      skill_id: "math.proportion.find_unknown_term",
      difficulty: 3,
      difficulty_band: "C",
      statement_md: "C",
      answer: { type: "number", value: 3 },
    },
    {
      id: "math.proportion.transform_ratio.000001",
      topic_id: "math.proportion",
      skill_id: "math.proportion.transform_ratio",
      difficulty: 1,
      difficulty_band: "A",
      status: "ready",
      statement_md: "D",
      answer: { type: "number", value: 4 },
    },
  ] as Task[];

  const coverage = buildSkillReadyCoverage(tasks, "math.proportion.find_unknown_term");
  assert.equal(coverage.readyTotal, 2);
  assert.deepEqual(coverage.readyByBand, { A: 1, B: 0, C: 1 });
});

test("checkSkillReadyGateFromCoverage fails with helpful reasons on deficits", () => {
  const result = checkSkillReadyGateFromCoverage({
    readyTotal: 2,
    readyByBand: { A: 1, B: 0, C: 1 },
  });

  assert.equal(result.ok, false);
  assert.ok(result.reasons.some((item) => item.includes(`need_at_least_${SKILL_READY_MIN_TASKS}`)));
  assert.ok(result.reasons.some((item) => item.includes("band_B")));
});

test("checkSkillReadyGateFromCoverage passes when thresholds are met", () => {
  const result = checkSkillReadyGateFromCoverage({
    readyTotal: 6,
    readyByBand: { A: 2, B: 2, C: 2 },
  });

  assert.equal(result.ok, true);
  assert.deepEqual(result.reasons, []);
});

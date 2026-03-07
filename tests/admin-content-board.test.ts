import assert from "node:assert/strict";
import test from "node:test";

import { buildAdminContentBoard } from "@/src/components/ui/admin-content-board.utils";

test("buildAdminContentBoard prioritizes actionable skills and groups by branch", () => {
  const board = buildAdminContentBoard({
    locale: "ru",
    topics: [
      {
        topicId: "math.proportion",
        title: { ru: "Пропорции", en: "Proportion", de: "Proportionen" },
        domain: "arithmetic",
        status: "ready",
        skillsTotal: 2,
        skillsWithTasks: 1,
        tasksTotal: 6,
        routesTotal: 1,
        prereqEdgesTotal: 1,
        warnings: [],
        skills: [
          {
            id: "math.proportion.s1",
            title: "Навык 1",
            branchId: "direct",
            availableCount: 6,
            status: "ready",
            kind: "compute",
          },
          {
            id: "math.proportion.s2",
            title: "Навык 2",
            branchId: "rule",
            availableCount: 0,
            status: "ready",
            kind: "word_problem",
          },
        ],
      },
    ],
    skills: [
      {
        topicId: "math.proportion",
        skillId: "math.proportion.s1",
        title: "Навык 1",
        summary: "Краткое описание",
        status: "ready",
        kind: "compute",
        branchId: "direct",
        trainerHref: "/ru/train/s1",
        tasksTotal: 6,
      },
      {
        topicId: "math.proportion",
        skillId: "math.proportion.s2",
        title: "Навык 2",
        summary: null,
        status: "ready",
        kind: "word_problem",
        branchId: "rule",
        trainerHref: null,
        tasksTotal: 0,
      },
    ],
    deficits: [
      {
        topicId: "math.proportion",
        skillId: "math.proportion.s2",
        title: "Навык 2",
        status: "ready",
        coverage: {
          readyTotal: 0,
          readyByBand: { A: 0, B: 0, C: 0 },
        },
        reasons: ["need_at_least_6_ready_tasks(found_0)"],
      },
    ],
  });

  assert.equal(board.summary.topicsTotal, 1);
  assert.equal(board.summary.skillsTotal, 2);
  assert.equal(board.summary.skillsWithoutTasks, 1);
  assert.equal(board.summary.deficitSkills, 1);
  assert.equal(board.summary.missingSummary, 1);
  assert.equal(board.summary.missingTrainer, 1);

  assert.equal(board.actions[0]?.skillId, "math.proportion.s2");
  assert.deepEqual(board.actions[0]?.actionReasons, [
    "no_tasks",
    "deficit",
    "missing_summary",
    "missing_trainer",
  ]);

  assert.equal(board.topics[0]?.branches.length, 2);
  assert.equal(board.topics[0]?.branches[0]?.label, "rule");
  assert.equal(board.topics[0]?.branches[0]?.actionableSkills, 1);
  assert.equal(board.topics[0]?.branches[0]?.topActions[0]?.skillId, "math.proportion.s2");
});

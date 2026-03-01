import assert from "node:assert/strict";
import test from "node:test";

import type { Task } from "@/lib/tasks/schema";
import { buildVariantPlan, InsufficientTasksError } from "@/src/lib/variants/plan";

import { createTaskBankFixture, createTemplateFixture } from "./fixtures/variant-generator.fixtures";

function taskIds(plan: ReturnType<typeof buildVariantPlan>) {
  return plan.map((item) => item.task.id);
}

test("variant generator is deterministic for the same seed", () => {
  const tasks = createTaskBankFixture();
  const template = createTemplateFixture();

  const a = buildVariantPlan({ tasks, template, seed: "seed-123" });
  const b = buildVariantPlan({ tasks, template, seed: "seed-123" });

  assert.deepEqual(taskIds(a), taskIds(b));
  assert.deepEqual(
    a.map((item) => ({ sectionLabel: item.sectionLabel, orderIndex: item.orderIndex })),
    b.map((item) => ({ sectionLabel: item.sectionLabel, orderIndex: item.orderIndex })),
  );
});

test("variant generator usually produces different results for different seeds", () => {
  const tasks = createTaskBankFixture();
  const template = createTemplateFixture();

  const a = buildVariantPlan({ tasks, template, seed: "seed-aaa" });
  const b = buildVariantPlan({ tasks, template, seed: "seed-bbb" });

  assert.notDeepEqual(taskIds(a), taskIds(b));
});

test("variant generator selects unique tasks and respects template quotas/constraints", () => {
  const tasks = createTaskBankFixture();
  const template = createTemplateFixture();

  const plan = buildVariantPlan({ tasks, template, seed: "quota-seed" });

  assert.equal(plan.length, 10);

  const uniqueIds = new Set(plan.map((item) => item.task.id));
  assert.equal(uniqueIds.size, plan.length);

  const sections = new Map<string, typeof plan>();
  for (const item of plan) {
    const arr = sections.get(item.sectionLabel) ?? [];
    arr.push(item);
    sections.set(item.sectionLabel, arr);
  }

  for (const section of template.sections) {
    const picked = sections.get(section.label) ?? [];
    assert.equal(picked.length, section.count, `quota mismatch for section ${section.label}`);

    const [minDifficulty, maxDifficulty] = section.difficulty;
    for (const item of picked) {
      assert.ok(section.skillIds.includes(item.task.skill_id), `skill mismatch for ${item.task.id}`);
      assert.ok(
        item.task.difficulty >= minDifficulty && item.task.difficulty <= maxDifficulty,
        `difficulty mismatch for ${item.task.id}`,
      );
    }
  }

  assert.deepEqual(
    plan.map((item) => item.orderIndex),
    [...Array(plan.length).keys()],
  );
});

test("variant generator throws InsufficientTasksError when template cannot be satisfied", () => {
  const tasks = createTaskBankFixture().filter(
    (task) =>
      task.skill_id === "math.proportion.solve_hidden_linear_fraction" &&
      task.difficulty === 3,
  );

  const template = {
    ...createTemplateFixture(),
    sections: [
      {
        label: "Невыполнимая секция",
        skillIds: ["math.proportion.solve_hidden_linear_fraction"],
        count: 10,
        difficulty: [3, 3] as [number, number],
      },
    ],
  };

  assert.throws(
    () => buildVariantPlan({ tasks, template, seed: "fail-seed" }),
    (error: unknown) => {
      assert.ok(error instanceof InsufficientTasksError);
      assert.equal(error.code, "INSUFFICIENT_TASKS");
      assert.equal(error.details.sectionLabel, "Невыполнимая секция");
      assert.equal(error.details.requiredCount, 10);
      assert.ok(error.details.availableCount < 10);
      return true;
    },
  );
});

test("variant generator backtracks on overlapping sections instead of false INSUFFICIENT_TASKS", () => {
  const tasks: Task[] = [
    {
      id: "math.proportion.skill_a.000001",
      topic_id: "math.proportion",
      skill_id: "math.proportion.skill_a",
      difficulty: 1,
      statement_md: "A1",
      answer: { type: "number", value: 1 },
    },
    {
      id: "math.proportion.skill_a.000002",
      topic_id: "math.proportion",
      skill_id: "math.proportion.skill_a",
      difficulty: 2,
      statement_md: "A2",
      answer: { type: "number", value: 2 },
    },
    {
      id: "math.proportion.skill_b.000001",
      topic_id: "math.proportion",
      skill_id: "math.proportion.skill_b",
      difficulty: 2,
      statement_md: "B1",
      answer: { type: "number", value: 3 },
    },
  ];

  const template = {
    id: "math.proportion.overlap.v1",
    title: "Overlap",
    topicId: "math.proportion",
    header: {
      gradeLabel: "5 класс",
      topicLabel: "Пропорции",
    },
    sections: [
      {
        label: "Широкая секция",
        skillIds: ["math.proportion.skill_a", "math.proportion.skill_b"],
        count: 2,
        difficulty: [1, 2] as [number, number],
      },
      {
        label: "Узкая секция",
        skillIds: ["math.proportion.skill_b"],
        count: 1,
        difficulty: [2, 2] as [number, number],
      },
    ],
  };

  const plan = buildVariantPlan({ tasks, template, seed: "s0" });

  assert.equal(plan.length, 3);
  assert.equal(new Set(plan.map((item) => item.task.id)).size, 3);
  assert.equal(plan[2]?.sectionLabel, "Узкая секция");
  assert.equal(plan[2]?.task.id, "math.proportion.skill_b.000001");
});

test("variant generator returns INSUFFICIENT_TASKS for global overlap conflict with useful details", () => {
  const tasks: Task[] = [
    {
      id: "math.proportion.skill_a.000001",
      topic_id: "math.proportion",
      skill_id: "math.proportion.skill_a",
      difficulty: 2,
      statement_md: "A",
      answer: { type: "number", value: 1 },
    },
    {
      id: "math.proportion.skill_b.000001",
      topic_id: "math.proportion",
      skill_id: "math.proportion.skill_b",
      difficulty: 2,
      statement_md: "B",
      answer: { type: "number", value: 2 },
    },
  ];

  const template = {
    id: "math.proportion.overlap-impossible.v1",
    title: "Overlap impossible",
    topicId: "math.proportion",
    header: {
      gradeLabel: "5 класс",
      topicLabel: "Пропорции",
    },
    sections: [
      {
        label: "Широкая секция",
        skillIds: ["math.proportion.skill_a", "math.proportion.skill_b"],
        count: 1,
        difficulty: [2, 2] as [number, number],
      },
      {
        label: "Узкая секция 1",
        skillIds: ["math.proportion.skill_a"],
        count: 1,
        difficulty: [2, 2] as [number, number],
      },
      {
        label: "Узкая секция 2",
        skillIds: ["math.proportion.skill_a"],
        count: 1,
        difficulty: [2, 2] as [number, number],
      },
    ],
  };

  assert.throws(
    () => buildVariantPlan({ tasks, template, seed: "conflict-seed" }),
    (error: unknown) => {
      assert.ok(error instanceof InsufficientTasksError);
      assert.equal(error.code, "INSUFFICIENT_TASKS");
      assert.ok(
        ["Узкая секция 1", "Узкая секция 2"].includes(error.details.sectionLabel),
        `unexpected section ${error.details.sectionLabel}`,
      );
      assert.equal(error.details.requiredCount, 1);
      assert.ok(error.details.availableCount <= 1);
      assert.deepEqual(error.details.skillIds, ["math.proportion.skill_a"]);
      assert.deepEqual(error.details.difficulty, [2, 2]);
      return true;
    },
  );
});

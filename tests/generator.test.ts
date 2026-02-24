import assert from "node:assert/strict";
import test from "node:test";

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
      task.skill_id === "g5.proporcii.reshit_zadachu_na_masshtab" && task.difficulty === 4,
  );

  const template = {
    ...createTemplateFixture(),
    sections: [
      {
        label: "Невыполнимая секция",
        skillIds: ["g5.proporcii.reshit_zadachu_na_masshtab"],
        count: 10,
        difficulty: [4, 4] as [number, number],
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

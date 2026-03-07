import assert from "node:assert/strict";
import test from "node:test";

import {
  InvalidSkillIdError,
  buildNextTaskId,
  createTaskInTopic,
  filterTasksForAdmin,
  isRegisteredSkillForTopic,
} from "@/src/lib/admin/task-bank-admin";
import type { Task } from "@/lib/tasks/schema";

test("buildNextTaskId increments six-digit suffix per skill prefix", () => {
  const next = buildNextTaskId("math.proportion.find_unknown_term", [
    "math.proportion.find_unknown_term.000001",
    "math.proportion.find_unknown_term.000009",
    "math.proportion.transform_ratio.000015",
  ]);
  assert.equal(next, "math.proportion.find_unknown_term.000010");
});

test("filterTasksForAdmin filters by skill and query text", () => {
  const tasks = [
    {
      id: "math.proportion.find_unknown_term.000001",
      topic_id: "math.proportion",
      skill_id: "math.proportion.find_unknown_term",
      difficulty: 2,
      difficulty_band: "B",
      statement_md: "Найди неизвестный член пропорции",
      answer: { type: "number", value: 5 },
    },
    {
      id: "math.proportion.transform_ratio.000001",
      topic_id: "math.proportion",
      skill_id: "math.proportion.transform_ratio",
      difficulty: 1,
      difficulty_band: "A",
      statement_md: "Преобразуй отношение",
      answer: { type: "ratio", left: 2, right: 3 },
    },
  ] as Task[];

  const filtered = filterTasksForAdmin(tasks, {
    skillId: "math.proportion.find_unknown_term",
    q: "неизвестный",
  });

  assert.equal(filtered.length, 1);
  assert.equal(filtered[0]?.id, "math.proportion.find_unknown_term.000001");
});

test("isRegisteredSkillForTopic validates topic-skill relation", () => {
  assert.equal(
    isRegisteredSkillForTopic("math.proportion", "math.proportion.find_unknown_term"),
    true,
  );
  assert.equal(
    isRegisteredSkillForTopic("math.proportion", "math.equations.check_root"),
    false,
  );
});

test("createTaskInTopic throws INVALID_SKILL_ID for unrelated skill", async () => {
  await assert.rejects(
    () =>
      createTaskInTopic({
        topicId: "math.proportion",
        skillId: "math.equations.check_root",
        statementMd: "test",
        answer: { type: "number", value: 1 },
      }),
    (error) => error instanceof InvalidSkillIdError,
  );
});

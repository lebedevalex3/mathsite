import assert from "node:assert/strict";
import test from "node:test";

import { buildTaskUpdateAuditDiff, normalizeTaskAuditPayload } from "@/src/lib/admin/task-audit";
import type { Task } from "@/lib/tasks/schema";

test("buildTaskUpdateAuditDiff returns before/after snapshots and changed fields", () => {
  const before = {
    id: "math.proportion.find_unknown_term.000001",
    topic_id: "math.proportion",
    skill_id: "math.proportion.find_unknown_term",
    difficulty: 1,
    difficulty_band: "A",
    status: "draft",
    statement_md: "old statement",
    answer: { type: "number", value: 4 },
  } as Task;

  const after = {
    ...before,
    difficulty: 2,
    difficulty_band: "B",
    status: "review",
    statement_md: "new statement",
    answer: { type: "number", value: 5 },
  } as Task;

  const diff = buildTaskUpdateAuditDiff({ before, after });

  assert.deepEqual(diff.before, {
    statement_md: "old statement",
    difficulty: 1,
    difficulty_band: "A",
    status: "draft",
    answer: { type: "number", value: 4 },
  });
  assert.deepEqual(diff.after, {
    statement_md: "new statement",
    difficulty: 2,
    difficulty_band: "B",
    status: "review",
    answer: { type: "number", value: 5 },
  });
  assert.deepEqual(diff.changedFields.sort(), [
    "answer",
    "difficulty",
    "difficulty_band",
    "statement_md",
    "status",
  ]);
});

test("normalizeTaskAuditPayload keeps only supported fields", () => {
  const normalized = normalizeTaskAuditPayload({
    topicId: "math.proportion",
    skillId: "math.proportion.find_unknown_term",
    changedFields: ["status", "answer", "unexpected"],
    before: {
      statement_md: "before",
      answer: { type: "number", value: 4 },
      difficulty: 1,
      difficulty_band: "A",
      status: "draft",
    },
    after: {
      statement_md: "after",
      answer: { type: "number", value: 5 },
      difficulty: 2,
      difficulty_band: "B",
      status: "review",
    },
  });

  assert.equal(normalized.topicId, "math.proportion");
  assert.equal(normalized.skillId, "math.proportion.find_unknown_term");
  assert.deepEqual(normalized.changedFields, ["status", "answer"]);
  assert.equal(normalized.before?.status, "draft");
  assert.equal(normalized.after?.status, "review");
});

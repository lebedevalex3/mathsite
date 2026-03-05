import assert from "node:assert/strict";
import test from "node:test";

import {
  applySkillOverrideToSnapshot,
  filterAdminSkillRegistry,
  normalizeSkillKind,
  normalizeSkillStatus,
} from "@/src/lib/admin/skills-registry";

test("applySkillOverrideToSnapshot merges override fields safely", () => {
  const merged = applySkillOverrideToSnapshot(
    {
      id: "math.proportion.find_unknown_term",
      title: "Base title",
      summary: "Base summary",
      status: "ready",
      kind: "compute",
      branchId: "b1",
      trainerHref: "/topics/proportion/train?skill=math.proportion.find_unknown_term",
    },
    {
      title: "Override title",
      summary: null,
      status: "soon",
      kind: "word",
    },
  );

  assert.equal(merged.title, "Override title");
  assert.equal(merged.summary, "Base summary");
  assert.equal(merged.status, "soon");
  assert.equal(merged.kind, "word");
});

test("filterAdminSkillRegistry supports topic/status/without tasks and text query", () => {
  const filtered = filterAdminSkillRegistry(
    [
      {
        topicId: "math.proportion",
        topicTitle: { ru: "Пропорции", en: "Proportions", de: "Proportionen" },
        topicDomain: "arithmetic",
        topicStatus: "ready",
        skillId: "math.proportion.find_unknown_term",
        title: "Find unknown term",
        summary: "Solve proportion with unknown",
        status: "ready",
        kind: "equation",
        branchId: null,
        trainerHref: "/topics/proportion/train?skill=math.proportion.find_unknown_term",
        tasksTotal: 12,
        hasOverride: false,
        updatedAt: null,
      },
      {
        topicId: "math.equations",
        topicTitle: { ru: "Уравнения", en: "Equations", de: "Gleichungen" },
        topicDomain: "algebra",
        topicStatus: "ready",
        skillId: "math.equations.solve_basic_word_equations",
        title: "Word equations",
        summary: "Solve word problems by equation",
        status: "soon",
        kind: "word",
        branchId: null,
        trainerHref: null,
        tasksTotal: 0,
        hasOverride: true,
        updatedAt: "2026-03-05T00:00:00.000Z",
      },
    ],
    {
      q: "word",
      topicId: "math.equations",
      status: "soon",
      withoutTasksOnly: true,
    },
  );

  assert.equal(filtered.length, 1);
  assert.equal(filtered[0]?.skillId, "math.equations.solve_basic_word_equations");
});

test("normalize helpers keep safe defaults", () => {
  assert.equal(normalizeSkillStatus("ready", "soon"), "ready");
  assert.equal(normalizeSkillStatus("bad", "soon"), "soon");
  assert.equal(normalizeSkillKind("word", "compute"), "word");
  assert.equal(normalizeSkillKind("bad", "compute"), "compute");
});
